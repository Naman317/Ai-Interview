import asyncHandler from 'express-async-handler';
import Session from '../models/SessionModel.js';
import Recording from '../models/RecordingModel.js';
import Feedback from '../models/FeedbackModel.js';
import User from '../models/User.js';
import axios from 'axios';
import fs from 'fs';

// AI Service URL
const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000';

/**
 * @desc    Start interview session with auto-generated questions
 * @route   POST /api/interview/start
 * @access  Private
 */
export const startInterview = asyncHandler(async (req, res) => {
    const { role, level, interviewType, count = 5 } = req.body;
    const userId = req.user._id;

    if (!role || !level || !interviewType) {
        res.status(400);
        throw new Error('Role, level, and interview type are required');
    }

    try {
        // Get user's CV data for personalization
        const user = await User.findById(userId);
        
        let resumeContext = null;
        let resumeSkills = null;
        let resumeExperience = null;

        if (user.cvParsed) {
            resumeContext = user.cvParsed.summary;
            resumeSkills = user.cvParsed.skills;
            resumeExperience = user.cvParsed.yearsOfExperience;
        }

        // Call AI service to generate questions
        const aiResponse = await axios.post(`${AI_SERVICE_URL}/generate-questions`, {
            role,
            level,
            count: parseInt(count),
            interview_type: interviewType,
            resume_context: resumeContext,
            resume_skills: resumeSkills,
            resume_experience_years: resumeExperience
        });

        const questions = aiResponse.data.questions || [];

        // Create session document
        const session = new Session({
            user: userId,
            role,
            level,
            interviewType,
            status: 'in-progress',
            questions: questions.map(q => ({
                questionText: q,
                questionType: interviewType === 'coding-mix' ? 'coding' : 'oral',
                isSubmitted: false,
                isEvaluated: false
            })),
            resumeSummary: resumeContext
        });

        await session.save();

        // Update user's interview count
        await User.findByIdAndUpdate(userId, {
            $inc: { totalInterviews: 1 },
            $push: { interviewSessions: session._id }
        });

        res.status(201).json({
            sessionId: session._id,
            questions: questions,
            totalQuestions: questions.length,
            interviewType,
            role,
            level
        });
    } catch (error) {
        console.error('Interview start error:', error.message);
        res.status(500);
        throw new Error(`Failed to start interview: ${error.message}`);
    }
});

/**
 * @desc    Submit answer to a question
 * @route   POST /api/interview/submit-answer
 * @access  Private
 */
export const submitAnswer = asyncHandler(async (req, res) => {
    const { sessionId, questionIndex, answerText, code, audioPath } = req.body;
    const userId = req.user._id;

    if (!sessionId || questionIndex === undefined) {
        res.status(400);
        throw new Error('Session ID and question index are required');
    }

    try {
        const session = await Session.findById(sessionId);

        if (!session || session.user.toString() !== userId.toString()) {
            res.status(403);
            throw new Error('Unauthorized access to this session');
        }

        if (questionIndex >= session.questions.length) {
            res.status(400);
            throw new Error('Invalid question index');
        }

        let transcription = answerText;

        // If audio was provided, transcribe it
        if (audioPath) {
            try {
                const formData = new FormData();
                const audioFile = fs.createReadStream(audioPath);
                formData.append('audioFile', audioFile);

                const transcribeResponse = await axios.post(
                    `${AI_SERVICE_URL}/transcribe`,
                    formData,
                    {
                        headers: formData.getHeaders()
                    }
                );

                transcription = transcribeResponse.data.transcription;
            } catch (transcribeError) {
                console.error('Transcription error:', transcribeError.message);
                // Continue with empty transcription
            }
        }

        // Update session with answer
        session.questions[questionIndex].userAnswerText = transcription || '';
        session.questions[questionIndex].userSubmittedCode = code || '';
        session.questions[questionIndex].isSubmitted = true;

        await session.save();

        res.json({
            message: 'Answer submitted successfully',
            transcription: transcription || answerText,
            questionIndex
        });
    } catch (error) {
        console.error('Submit answer error:', error.message);
        res.status(500);
        throw new Error(`Failed to submit answer: ${error.message}`);
    }
});

/**
 * @desc    Evaluate a submitted answer
 * @route   POST /api/interview/evaluate-answer
 * @access  Private
 */
export const evaluateAnswer = asyncHandler(async (req, res) => {
    const { sessionId, questionIndex } = req.body;
    const userId = req.user._id;

    if (!sessionId || questionIndex === undefined) {
        res.status(400);
        throw new Error('Session ID and question index are required');
    }

    try {
        const session = await Session.findById(sessionId);

        if (!session || session.user.toString() !== userId.toString()) {
            res.status(403);
            throw new Error('Unauthorized access to this session');
        }

        if (questionIndex >= session.questions.length) {
            res.status(400);
            throw new Error('Invalid question index');
        }

        const question = session.questions[questionIndex];

        if (!question.isSubmitted) {
            res.status(400);
            throw new Error('Question not yet submitted');
        }

        // Call AI service for evaluation
        const evaluationResponse = await axios.post(
            `${AI_SERVICE_URL}/evaluate`,
            {
                question: question.questionText,
                question_type: question.questionType,
                role: session.role,
                level: session.level,
                user_answer: question.userAnswerText,
                user_code: question.userSubmittedCode
            }
        );

        const evaluation = evaluationResponse.data;

        // Update question with evaluation
        question.technicalScore = evaluation.technicalScore || 0;
        question.confidenceScore = evaluation.confidenceScore || 0;
        question.aiFeedback = evaluation.aiFeedback || '';
        question.idealAnswer = evaluation.idealAnswer || '';
        question.isEvaluated = true;

        // Calculate session metrics
        const evaluatedQuestions = session.questions.filter(q => q.isEvaluated);
        if (evaluatedQuestions.length > 0) {
            const avgTechnical = evaluatedQuestions.reduce((sum, q) => sum + q.technicalScore, 0) / evaluatedQuestions.length;
            const avgConfidence = evaluatedQuestions.reduce((sum, q) => sum + q.confidenceScore, 0) / evaluatedQuestions.length;
            
            session.metrics = {
                avgTechnical,
                avgConfidence
            };

            session.overallScore = Math.round((avgTechnical + avgConfidence) / 2);
        }

        await session.save();

        res.json({
            evaluation,
            sessionScore: session.overallScore
        });
    } catch (error) {
        console.error('Evaluation error:', error.message);
        res.status(500);
        throw new Error(`Failed to evaluate answer: ${error.message}`);
    }
});

/**
 * @desc    Complete interview and generate feedback
 * @route   POST /api/interview/complete
 * @access  Private
 */
export const completeInterview = asyncHandler(async (req, res) => {
    const { sessionId } = req.body;
    const userId = req.user._id;

    if (!sessionId) {
        res.status(400);
        throw new Error('Session ID is required');
    }

    try {
        const session = await Session.findById(sessionId);

        if (!session || session.user.toString() !== userId.toString()) {
            res.status(403);
            throw new Error('Unauthorized access to this session');
        }

        // Calculate overall metrics
        const evaluatedQuestions = session.questions.filter(q => q.isEvaluated);
        
        if (evaluatedQuestions.length === 0) {
            res.status(400);
            throw new Error('No questions have been evaluated yet');
        }

        const avgTechnical = evaluatedQuestions.reduce((sum, q) => sum + q.technicalScore, 0) / evaluatedQuestions.length;
        const avgConfidence = evaluatedQuestions.reduce((sum, q) => sum + q.confidenceScore, 0) / evaluatedQuestions.length;
        const overallScore = Math.round((avgTechnical + avgConfidence) / 2);

        // Update session
        session.status = 'completed';
        session.endTime = new Date();
        session.overallScore = overallScore;
        session.metrics = {
            avgTechnical,
            avgConfidence
        };

        await session.save();

        // Create feedback document
        const feedback = new Feedback({
            session: sessionId,
            user: userId,
            overallScore,
            questionBreakdown: evaluatedQuestions.map(q => ({
                questionText: q.questionText,
                questionType: q.questionType,
                technicalScore: q.technicalScore,
                confidenceScore: q.confidenceScore,
                feedback: q.aiFeedback,
                transcript: q.userAnswerText,
                submittedCode: q.userSubmittedCode,
                idealAnswer: q.idealAnswer
            })),
            strengths: generateStrengths(evaluatedQuestions),
            improvements: generateImprovements(evaluatedQuestions),
            recommendations: generateRecommendations(evaluatedQuestions, session),
            communicationScore: avgConfidence,
            technicalScore: avgTechnical,
            confidenceLevel: avgConfidence > 75 ? 'high' : avgConfidence > 50 ? 'medium' : 'low'
        });

        await feedback.save();

        // Update user average score
        const user = await User.findById(userId);
        const newAverage = ((user.averageScore || 0) * (user.totalInterviews - 1) + overallScore) / user.totalInterviews;
        await User.findByIdAndUpdate(userId, { averageScore: newAverage });

        res.json({
            message: 'Interview completed successfully',
            sessionId,
            overallScore,
            metrics: session.metrics,
            feedbackId: feedback._id
        });
    } catch (error) {
        console.error('Complete interview error:', error.message);
        res.status(500);
        throw new Error(`Failed to complete interview: ${error.message}`);
    }
});

/**
 * @desc    Get interview session details
 * @route   GET /api/interview/:sessionId
 * @access  Private
 */
export const getSession = asyncHandler(async (req, res) => {
    const { sessionId } = req.params;
    const userId = req.user._id;

    try {
        const session = await Session.findById(sessionId);

        if (!session || session.user.toString() !== userId.toString()) {
            res.status(403);
            throw new Error('Unauthorized access to this session');
        }

        res.json({
            sessionId: session._id,
            role: session.role,
            level: session.level,
            interviewType: session.interviewType,
            status: session.status,
            questions: session.questions,
            metrics: session.metrics,
            overallScore: session.overallScore,
            startTime: session.startTime,
            endTime: session.endTime
        });
    } catch (error) {
        console.error('Get session error:', error.message);
        res.status(500);
        throw new Error(`Failed to retrieve session: ${error.message}`);
    }
});

/**
 * @desc    Get all interview sessions for user
 * @route   GET /api/interview/sessions/list
 * @access  Private
 */
export const getUserSessions = asyncHandler(async (req, res) => {
    const userId = req.user._id;

    try {
        const sessions = await Session.find({ user: userId })
            .sort({ createdAt: -1 })
            .limit(50);

        res.json({
            sessions: sessions.map(s => ({
                sessionId: s._id,
                role: s.role,
                level: s.level,
                status: s.status,
                overallScore: s.overallScore,
                createdAt: s.createdAt,
                questionsCount: s.questions.length
            }))
        });
    } catch (error) {
        console.error('Get user sessions error:', error.message);
        res.status(500);
        throw new Error(`Failed to retrieve sessions: ${error.message}`);
    }
});

/**
 * @desc    Get feedback for a completed interview
 * @route   GET /api/interview/feedback/:sessionId
 * @access  Private
 */
export const getFeedback = asyncHandler(async (req, res) => {
    const { sessionId } = req.params;
    const userId = req.user._id;

    try {
        const feedback = await Feedback.findOne({ session: sessionId });

        if (!feedback || feedback.user.toString() !== userId.toString()) {
            res.status(403);
            throw new Error('Unauthorized access to this feedback');
        }

        res.json(feedback);
    } catch (error) {
        console.error('Get feedback error:', error.message);
        res.status(500);
        throw new Error(`Failed to retrieve feedback: ${error.message}`);
    }
});

/**
 * Helper function to generate strengths
 */
const generateStrengths = (questions) => {
    const strengths = [];
    
    const avgTechnical = questions.reduce((sum, q) => sum + q.technicalScore, 0) / questions.length;
    const avgConfidence = questions.reduce((sum, q) => sum + q.confidenceScore, 0) / questions.length;

    if (avgTechnical > 75) strengths.push('Strong technical knowledge');
    if (avgConfidence > 75) strengths.push('High confidence in answers');
    if (avgTechnical > 60) strengths.push('Good problem-solving approach');
    
    if (strengths.length === 0) {
        strengths.push('Room for improvement in all areas');
    }

    return strengths;
};

/**
 * Helper function to generate improvements
 */
const generateImprovements = (questions) => {
    const improvements = [];
    
    const avgTechnical = questions.reduce((sum, q) => sum + q.technicalScore, 0) / questions.length;
    const avgConfidence = questions.reduce((sum, q) => sum + q.confidenceScore, 0) / questions.length;

    if (avgTechnical < 60) improvements.push('Focus on strengthening technical fundamentals');
    if (avgConfidence < 70) improvements.push('Work on confident communication and clarity');
    if (avgTechnical < 75) improvements.push('Practice more coding problems');
    if (avgConfidence < 80) improvements.push('Practice explaining concepts clearly');

    return improvements.slice(0, 4);
};

/**
 * Helper function to generate recommendations
 */
const generateRecommendations = (questions, session) => {
    const recommendations = [];

    if (session.level === 'Junior') {
        recommendations.push('Start with fundamentals and data structures');
        recommendations.push('Practice LeetCode easy and medium problems');
    } else if (session.level === 'Mid-Level') {
        recommendations.push('Focus on system design and architecture patterns');
        recommendations.push('Practice more complex algorithms and optimization');
    } else {
        recommendations.push('Study advanced system design patterns');
        recommendations.push('Practice designing large-scale systems');
    }

    recommendations.push('Record yourself answering questions to improve delivery');
    
    return recommendations;
};

export default {
    startInterview,
    submitAnswer,
    evaluateAnswer,
    completeInterview,
    getSession,
    getUserSessions,
    getFeedback
};
