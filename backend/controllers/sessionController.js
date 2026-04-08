import asyncHandler from 'express-async-handler';
import Session from '../models/SessionModel.js';
import path from 'path';
import fs from 'fs';
import mongoose from 'mongoose';
import sessionService from '../services/sessionService.js';
import { parseResume, generateResumeSummary } from '../services/resumeParser.js';

// URL for the Python AI Microservice (Must match Step 6 setup)
const AI_SERVICE_URL = 'http://localhost:8000';

// @desc    Create a new interview session and start AI question generation
// @route   POST /api/sessions/
// @access  Private
const createSession = asyncHandler(async (req, res) => {
    const { role, level, interviewType, count: bodyCount, useProfileResume } = req.body;
    const count = parseInt(bodyCount) || 5;
    const userId = req.user._id;

    console.log('--- Session Creation Request ---');
    console.log('User:', userId);
    console.log('Role:', role);
    console.log('Level:', level);
    console.log('Type:', interviewType);
    console.log('UseProfileResume:', useProfileResume);

    if (!role || !level || !interviewType) {
        res.status(400);
        throw new Error('Please specify role, level, and interview type.');
    }

    // Parse resume if provided
    let resumeData = null;
    let resumeSummary = null;

    // A. Check for uploaded file
    let filePathToParse = null;
    let fileExt = null;

    if (req.file) {
        console.log('New resume file uploaded:', req.file.path);
        filePathToParse = path.join(process.cwd(), req.file.path);
        fileExt = path.extname(req.file.originalname).toLowerCase().substring(1);
    }
    // B. Check if user wants to use their profile resume
    else if (useProfileResume === 'true' && req.user.cvUrl) {
        console.log('Attempting to use profile resume:', req.user.cvUrl);
        // Assuming cvUrl is the relative path from process.cwd() or absolute path
        // Based on uploadMiddleware, it's stored in "uploads/"
        filePathToParse = path.join(process.cwd(), req.user.cvUrl);
        fileExt = path.extname(req.user.cvFileName || 'resume.pdf').toLowerCase().substring(1);

        if (!fs.existsSync(filePathToParse)) {
            console.warn('Profile resume file not found at:', filePathToParse);
            filePathToParse = null;
        }
    }

    if (filePathToParse) {
        try {
            const keepFile = !req.file; // Keep it if it's NOT a temporary upload (i.e., it's a profile CV)
            resumeData = await parseResume(filePathToParse, fileExt, keepFile);
            resumeSummary = generateResumeSummary(resumeData);
            console.log('Resume parsed successfully. Summary length:', resumeSummary?.length || 0);
        } catch (error) {
            console.error('Resume parsing error:', error);
            // Continue without resume data if parsing fails
        }
    }

    console.log('Creating session entry in DB...');
    // 1. Create the session placeholder in MongoDB
    let session = await Session.create({
        user: userId,
        role,
        level,
        interviewType,
        status: 'pending',
        resumeSummary: resumeSummary,
    });

    const io = req.app.get('io');
    console.log('Session created with ID:', session._id);

    // 2. Immediately respond to the client
    res.status(202).json({
        message: 'Session created. Preparing your questions...',
        sessionId: session._id,
        status: 'processing',
    });

    // 3. Delegation to SessionService (SDE 2 Pattern)
    sessionService.generateQuestionsInBackground(io, userId, session, count, resumeSummary, resumeData);
});

// @desc    Get all interview sessions for the current user
// @route   GET /api/sessions/
// @access  Private
// @desc    Get all interview sessions for the current user
// @route   GET /api/sessions/
// @access  Private
const getSessions = asyncHandler(async (req, res) => {
    // Find all sessions for the logged-in user, sorted by newest first
    const sessions = await Session.find({ user: req.user._id })
        .sort({ createdAt: -1 })
        .select('-questions.userAnswerText -questions.userSubmittedCode'); // Exclude heavy data for list view
    res.json(sessions);
});

// @desc    Get a specific session detail
// @route   GET /api/sessions/:id
// @access  Private
const getSessionById = asyncHandler(async (req, res) => {
    // Validate ID first to avoid 500 errors on invalid IDs (like "new")
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
        res.status(404);
        throw new Error('Invalid Session ID');
    }

    // Find session by ID and ensure it belongs to the logged-in user
    const session = await Session.findOne({ _id: req.params.id, user: req.user._id });

    if (session) {
        res.json(session);
    } else {
        res.status(404);
        throw new Error('Session not found or user unauthorized.');
    }
});

// @desc    Delete a session
// @route   DELETE /api/sessions/:id
// @access  Private
const deleteSession = asyncHandler(async (req, res) => {
    const session = await Session.findById(req.params.id);

    if (!session) {
        res.status(404);
        throw new Error('Session not found');
    }

    // Check if the user owns this session
    if (session.user.toString() !== req.user.id) {
        res.status(401);
        throw new Error('Not authorized');
    }

    await session.deleteOne();

    res.status(200).json({ id: req.params.id });
});

// Note: evaluateAnswerAsync logic moved to backend/services/sessionService.js

// @desc    Submit an answer (Audio or Code)
// @route   POST /api/sessions/:id/submit-answer
// @access  Private
const submitAnswer = asyncHandler(async (req, res) => {
    try {
        const sessionId = req.params.id;
        const { questionIndex, code, transcript } = req.body;
        const userId = req.user._id;

        const session = await Session.findById(sessionId);

        if (!session || session.user.toString() !== userId.toString()) {
            res.status(404);
            throw new Error('Session not found or user unauthorized.');
        }

        const questionIdx = parseInt(questionIndex, 10);
        const question = session.questions[questionIdx];

        if (!question) {
            res.status(400);
            throw new Error(`Question at index ${questionIdx} not found.`);
        }

        // --- UNIFIED LOGIC FOR AUDIO, TEXT, OR CODE ---
        let audioFilePath = null;
        if (req.file) {
            audioFilePath = path.join(process.cwd(), req.file.path);
        }

        const codeSubmission = code || null;
        const transcriptSubmission = transcript || null;

        if (!audioFilePath && !codeSubmission && !transcriptSubmission) {
            res.status(400);
            throw new Error('Please provide an audio recording, transcript, or code submission.');
        }

        // 1. Update status in DB
        question.isSubmitted = true;
        await session.save();

        // 2. Respond immediately
        res.status(202).json({
            message: 'Answer received. Processing asynchronously...',
            status: 'received',
        });

        const io = req.app.get('io');

        // 3. Delegation to SessionService
        sessionService.evaluateAnswerInBackground(io, userId, session, questionIdx, audioFilePath, codeSubmission, transcriptSubmission);
    } catch (error) {
        console.error('Submit Answer Error:', error);
        throw error;
    }
});


const calculateOverallScore = async (sessionId) => {
    const session = await Session.findById(sessionId);
    if (!session || !session.questions || session.questions.length === 0) {
        return { overallScore: 0, avgTechnical: 0, avgConfidence: 0 };
    }

    let totalTechnical = 0;
    let totalConfidence = 0;
    let evalCount = 0;

    session.questions.forEach(q => {
        if (q.isEvaluated) {
            totalTechnical += (q.technicalScore || 0);
            totalConfidence += (q.confidenceScore || 0);
            evalCount++;
        }
    });

    if (evalCount === 0) {
        return { overallScore: 0, avgTechnical: 0, avgConfidence: 0 };
    }

    const avgTech = totalTechnical / evalCount;
    const avgConf = totalConfidence / evalCount;
    const overall = (avgTech + avgConf) / 2;

    return {
        overallScore: Math.round(overall),
        avgTechnical: Math.round(avgTech),
        avgConfidence: Math.round(avgConf)
    };
};
// @desc    End the session early
// @route   POST /api/sessions/:id/end
// @access  Private
const endSession = asyncHandler(async (req, res) => {
    const sessionId = req.params.id;
    const userId = req.user._id;

    try {
        const session = await Session.findById(sessionId);

        if (!session || session.user.toString() !== userId.toString()) {
            res.status(404);
            throw new Error('Session not found or user unauthorized.');
        }
        const isProcessing = session.questions.some(q => q.isSubmitted && !q.isEvaluated);
        if (isProcessing) {
            // Wait a bit for processing to complete, then check again
            await new Promise(resolve => setTimeout(resolve, 2000));
            const updatedSession = await Session.findById(sessionId);
            const stillProcessing = updatedSession.questions.some(q => q.isSubmitted && !q.isEvaluated);
            if (stillProcessing) {
                res.status(400);
                throw new Error('Cannot end interview while AI is processing answers. Please wait a moment and try again.');
            }
        }
        if (session.status === 'completed') {
            res.status(400);
            throw new Error('Session is already completed.');
        }

        // Calculate scores for evaluated questions (with error handling)
        let scoreSummary = { overallScore: 0, avgTechnical: 0, avgConfidence: 0 };
        try {
            scoreSummary = await calculateOverallScore(sessionId);
        } catch (scoreError) {
            console.error('Score calculation error:', scoreError);
            // Continue with default scores if calculation fails
        }

        session.overallScore = scoreSummary.overallScore || 0;
        session.status = 'completed';
        session.endTime = new Date();
        session.metrics = {
            avgTechnical: scoreSummary.avgTechnical || 0,
            avgConfidence: scoreSummary.avgConfidence || 0,
        };

        await session.save();

        const io = req.app.get('io');
        sessionService.pushSocketUpdate(io, userId, sessionId, 'SESSION_COMPLETED', 'Interview session ended.', session);

        res.json({ message: 'Session ended successfully.', session, success: true });
    } catch (error) {
        console.error('End Session Error:', error);
        if (!res.headersSent) {
            res.status(500).json({ message: error.message || 'Failed to end session', success: false });
        }
    }
});
// @desc    Analyze video response and generate behavioral analysis
// @route   POST /api/sessions/analyze-video
// @access  Private
const analyzeVideo = asyncHandler(async (req, res) => {
    const { sessionId, question, duration } = req.body;
    const videoFile = req.file;

    if (!videoFile || !sessionId || !question) {
        res.status(400);
        throw new Error('Video file, sessionId, and question are required');
    }

    try {
        // Find the session to get role and level
        let session = await Session.findById(sessionId);
        if (!session) {
            res.status(404);
            throw new Error('Session not found');
        }

        // Call AI service for real video analysis
        const FormData = (await import('form-data')).default;
        const fs = (await import('fs')).default;

        const formData = new FormData();
        formData.append('video', fs.createReadStream(videoFile.path));
        formData.append('question', question);
        formData.append('role', session.role);
        formData.append('level', session.level);
        formData.append('duration', duration || 0);

        let behavioralAnalysis;

        try {
            const aiResponse = await fetch(`${AI_SERVICE_URL}/analyze-video`, {
                method: 'POST',
                body: formData,
                headers: formData.getHeaders()
            });

            if (!aiResponse.ok) {
                throw new Error(`AI Service error: ${aiResponse.status}`);
            }

            const aiData = await aiResponse.json();

            behavioralAnalysis = {
                transcript: aiData.transcript,
                eyeContact: aiData.eyeContact,
                confidence: aiData.confidence,
                fluency: aiData.fluency,
                clarity: aiData.clarity,
                technicalScore: aiData.technicalScore,
                feedback: aiData.feedback,
                duration: parseInt(duration) || 0
            };

        } catch (aiError) {
            console.error('AI service analysis failed, using fallback:', aiError.message);

            // Fallback to basic analysis if AI service fails
            behavioralAnalysis = {
                transcript: "Audio transcription unavailable",
                eyeContact: 75,
                confidence: 75,
                fluency: 75,
                clarity: 75,
                technicalScore: 70,
                feedback: "Video recorded successfully. AI analysis temporarily unavailable.",
                duration: parseInt(duration) || 0
            };
        }

        // Add the video response to answers
        if (!session.answers) {
            session.answers = [];
        }

        session.answers.push({
            question,
            answer: behavioralAnalysis.transcript,
            videoFile: videoFile.filename,
            technicalScore: behavioralAnalysis.technicalScore,
            confidenceScore: behavioralAnalysis.confidence,
            feedback: behavioralAnalysis.feedback
        });

        await session.save();

        res.status(200).json({
            success: true,
            analysis: behavioralAnalysis,
            sessionId: session._id
        });

    } catch (error) {
        console.error('Video analysis error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to analyze video',
            error: error.message
        });
    }
});

// @desc    Get comprehensive interview report
// @route   GET /api/sessions/:id/report
// @access  Private
const getInterviewReport = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const userId = req.user._id;

    const session = await Session.findById(id);
    if (!session) {
        res.status(404);
        throw new Error('Session not found');
    }

    // Verify ownership
    if (session.user.toString() !== userId.toString()) {
        res.status(403);
        throw new Error('Not authorized to view this session');
    }

    // Calculate scores
    const technicalScores = (session.answers || [])
        .map(a => a.technicalScore || 0)
        .filter(s => s > 0);

    const confidenceScores = (session.answers || [])
        .map(a => a.confidenceScore || 0)
        .filter(s => s > 0);

    const technicalScore = technicalScores.length > 0
        ? Math.round(technicalScores.reduce((a, b) => a + b, 0) / technicalScores.length)
        : 0;

    const behavioralScore = confidenceScores.length > 0
        ? Math.round(confidenceScores.reduce((a, b) => a + b, 0) / confidenceScores.length)
        : 0;

    // Extract behavioral metrics from last video answer
    const lastVideoAnswer = (session.answers || [])
        .reverse()
        .find(a => a.videoFile);

    const report = {
        sessionId: session._id,
        role: session.role,
        level: session.level,
        status: session.status,
        technicalScore,
        behavioralScore,
        eyeContact: lastVideoAnswer?.eyeContact || 75,
        confidence: behavioralScore,
        fluency: lastVideoAnswer?.fluency || 70,
        clarity: lastVideoAnswer?.clarity || 75,
        questions: (session.answers || []).map((answer, idx) => ({
            question: answer.question,
            answer: answer.answer,
            technicalScore: answer.technicalScore || 0,
            confidenceScore: answer.confidenceScore || 0,
            feedback: answer.feedback || 'No feedback available'
        })),
        overallFeedback: generateOverallFeedback(technicalScore, behavioralScore),
        recommendations: generateRecommendations(technicalScore, behavioralScore),
        createdAt: session.createdAt,
        completedAt: session.completedAt || new Date()
    };

    res.status(200).json(report);
});

// Helper function to generate overall feedback
const generateOverallFeedback = (technical, behavioral) => {
    const avg = (technical + behavioral) / 2;

    if (avg >= 85) {
        return "Excellent performance! You demonstrated strong technical knowledge and excellent communication skills. You are well-prepared for this role.";
    } else if (avg >= 70) {
        return "Good performance with solid technical understanding. Focus on improving confidence and communication clarity to excel further.";
    } else if (avg >= 50) {
        return "You have basic understanding of the concepts. Consider deeper study and more practice in mock interviews to improve performance.";
    } else {
        return "This area needs significant improvement. Review the fundamentals and practice more interview scenarios before your next attempt.";
    }
};

// Helper function to generate recommendations
const generateRecommendations = (technical, behavioral) => {
    const recommendations = [];

    if (technical < 70) {
        recommendations.push("Study core concepts and data structures more thoroughly");
        recommendations.push("Practice more coding problems and algorithm design");
    }

    if (behavioral < 70) {
        recommendations.push("Work on communication and presentation skills");
        recommendations.push("Practice speaking clearly and maintaining eye contact");
        recommendations.push("Take deep breaths and manage nervousness before interviews");
    }

    if (technical < 60 || behavioral < 60) {
        recommendations.push("Consider getting a mentor for personalized guidance");
        recommendations.push("Participate in mock interview sessions regularly");
    }

    if (recommendations.length === 0) {
        recommendations.push("Continue maintaining your excellent performance level");
        recommendations.push("Help others in your community by sharing knowledge");
    }

    return recommendations;
};

// @desc    Get user interview statistics for analytics
// @route   GET /api/sessions/stats
// @access  Private
const getUserStats = asyncHandler(async (req, res) => {
    const userId = req.user._id;

    // 1. Basic Stats Aggregation
    const stats = await Session.aggregate([
        { $match: { user: new mongoose.Types.ObjectId(userId), status: 'completed' } },
        {
            $group: {
                _id: null,
                totalInterviews: { $sum: 1 },
                avgOverallScore: { $avg: '$overallScore' },
                avgTechnical: { $avg: '$metrics.avgTechnical' },
                avgConfidence: { $avg: '$metrics.avgConfidence' },
                totalDuration: { 
                    $sum: { 
                        $divide: [
                            { $subtract: ["$endTime", "$startTime"] }, 
                            3600000 // Convert ms to hours
                        ] 
                    } 
                }
            }
        }
    ]);

    // 2. Score History (Last 10 sessions)
    const history = await Session.find({ user: userId, status: 'completed' })
        .sort({ endTime: 1 })
        .limit(10)
        .select('endTime overallScore role');

    // 3. Category Breakdown (Performance by Role)
    const roleStats = await Session.aggregate([
        { $match: { user: new mongoose.Types.ObjectId(userId), status: 'completed' } },
        {
            $group: {
                _id: '$role',
                avgScore: { $avg: '$overallScore' },
                count: { $sum: 1 }
            }
        },
        { $sort: { avgScore: -1 } }
    ]);

    // 4. Activity Streak (Last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const activity = await Session.aggregate([
        { 
            $match: { 
                user: new mongoose.Types.ObjectId(userId), 
                createdAt: { $gte: sevenDaysAgo } 
            } 
        },
        {
            $group: {
                _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
                count: { $sum: 1 }
            }
        },
        { $sort: { _id: 1 } }
    ]);

    const result = {
        summary: stats[0] || {
            totalInterviews: 0,
            avgOverallScore: 0,
            avgTechnical: 0,
            avgConfidence: 0,
            totalDuration: 0
        },
        history: history.map(h => ({
            date: h.endTime,
            score: h.overallScore,
            role: h.role
        })),
        roleStats: roleStats.map(r => ({
            role: r._id,
            avgScore: Math.round(r.avgScore),
            count: r.count
        })),
        activity: activity.map(a => ({
            date: a._id,
            count: a.count
        }))
    };

    res.status(200).json(result);
});

export {
    createSession,
    getSessionById,
    getSessions,
    submitAnswer,
    endSession,
    calculateOverallScore,
    deleteSession,
    analyzeVideo,
    getInterviewReport,
    getUserStats
};



