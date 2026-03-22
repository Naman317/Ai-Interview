import Session from '../models/SessionModel.js';
import fetch from 'node-fetch';
import fs from 'fs';
import FormData from 'form-data';
import path from 'path';
import { parseResume, generateResumeSummary } from './resumeParser.js';

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000';

/**
 * Helper to push socket updates
 */
export const pushSocketUpdate = (io, userId, sessionId, status, message, session = null) => {
    if (!io) return;
    io.to(userId.toString()).emit('sessionUpdate', {
        sessionId,
        status,
        message,
        session,
    });
};

/**
 * Generate AI questions in background
 */
export const generateQuestionsInBackground = async (io, userId, session, count, resumeSummary, resumeData) => {
    try {
        console.log(`[SessionService] Starting generation for ${session._id}`);

        const requestBody = {
            role: session.role,
            topic: session.role,
            level: session.level,
            count: count,
            interview_type: session.interviewType,
            language: 'English'
        };

        if (resumeSummary && resumeData) {
            requestBody.resume_context = resumeSummary;
            requestBody.resume_skills = resumeData.skills || [];
            requestBody.resume_experience_years = resumeData.yearsOfExperience || 0;
        }

        const aiResponse = await fetch(`${AI_SERVICE_URL}/generate-questions`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(requestBody),
        });

        if (!aiResponse.ok) {
            throw new Error(`AI Service rejected request with status ${aiResponse.status}`);
        }

        const aiData = await aiResponse.json();
        const codingCount = session.interviewType === 'coding-mix' ? Math.floor(count * 0.2) : 0;

        const questionsArray = aiData.questions.map((qText, index) => ({
            questionText: qText,
            questionType: index < codingCount ? 'coding' : 'oral',
            isEvaluated: false,
            isSubmitted: false,
        }));

        session.questions = questionsArray;
        session.status = 'in-progress';
        await session.save();

        pushSocketUpdate(io, userId, session._id, 'QUESTIONS_READY', 'Interview is ready!', session);
    } catch (error) {
        console.error(`[SessionService] Generation failed:`, error);
        session.status = 'failed';
        await session.save();
        pushSocketUpdate(io, userId, session._id, 'GENERATION_FAILED', `Error: ${error.message}`);
    }
};

/**
 * Evaluate answer in background
 */
export const evaluateAnswerInBackground = async (io, userId, session, questionIdx, audioFilePath, code, transcript) => {
    let transcription = transcript || ""; // Use provided transcript if available
    const question = session.questions[questionIdx];
    try {
        // 1. Transcription (only if no transcript provided and audio exists)
        if (!transcription && audioFilePath) {
            pushSocketUpdate(io, userId, session._id, 'AI_TRANSCRIBING', `Transcribing...`);
            const formData = new FormData();
            formData.append('audioFile', fs.createReadStream(audioFilePath));

            const transResponse = await fetch(`${AI_SERVICE_URL}/transcribe`, {
                method: 'POST',
                body: formData,
                headers: formData.getHeaders(),
            });

            if (transResponse.ok) {
                const transData = await transResponse.json();
                transcription = transData.transcription || "";
            }
            if (fs.existsSync(audioFilePath)) fs.unlinkSync(audioFilePath);
        } else if (audioFilePath && fs.existsSync(audioFilePath)) {
            // Clean up audio file if not needed
            fs.unlinkSync(audioFilePath);
        }

        // 2. Evaluation
        pushSocketUpdate(io, userId, session._id, 'AI_EVALUATING', `AI analysis...`);
        const evalResponse = await fetch(`${AI_SERVICE_URL}/evaluate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                question: question.questionText,
                question_type: question.questionType,
                role: session.role,
                level: session.level,
                user_answer: transcription,
                user_code: code || "",
            }),
        });

        if (!evalResponse.ok) {
            const errorText = await evalResponse.text();
            console.error(`[SessionService] AI Service Error ${evalResponse.status}: ${errorText}`);
            throw new Error(`AI Evaluation failed with status ${evalResponse.status}`);
        }

        const evalData = await evalResponse.json();
        question.userAnswerText = transcription;
        question.userSubmittedCode = code || "";
        question.technicalScore = evalData.technicalScore;
        question.confidenceScore = evalData.confidenceScore;
        question.aiFeedback = evalData.aiFeedback;
        question.idealAnswer = evalData.idealAnswer;
        question.isEvaluated = true;

        const allDone = session.questions.every(q => q.isEvaluated);
        if (allDone || session.status === 'completed') {
            session.status = 'completed';
            session.endTime = session.endTime || new Date();
            // Note: Calculation logic would go here or in a separate session aggregator
            await session.save();
            pushSocketUpdate(io, userId, session._id, 'SESSION_COMPLETED', 'Session finalized!', session);
        } else {
            await session.save();
            pushSocketUpdate(io, userId, session._id, 'EVALUATION_COMPLETE', 'Feedback ready!', session);
        }
    } catch (error) {
        console.error(`[SessionService] Evaluation failed:`, error);
        pushSocketUpdate(io, userId, session._id, 'EVALUATION_FAILED', error.message, session);
    }
};

export default {
    pushSocketUpdate,
    generateQuestionsInBackground,
    evaluateAnswerInBackground
};
