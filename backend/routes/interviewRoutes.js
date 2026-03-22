import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import {
    startInterview,
    submitAnswer,
    evaluateAnswer,
    completeInterview,
    getSession,
    getUserSessions,
    getFeedback
} from '../controllers/interviewController.js';

const router = express.Router();

// Public routes (none for now)

// Protected routes
router.post('/start', protect, startInterview);
router.post('/submit-answer', protect, submitAnswer);
router.post('/evaluate-answer', protect, evaluateAnswer);
router.post('/complete', protect, completeInterview);
router.get('/:sessionId', protect, getSession);
router.get('/sessions/list', protect, getUserSessions);
router.get('/feedback/:sessionId', protect, getFeedback);

export default router;
