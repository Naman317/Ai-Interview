import express from 'express';
import { getQuestions, getQuestionStats, getCompanies, getTopics, practiceGlobalQuestion } from '../controllers/questionController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/').get(protect, getQuestions);
router.route('/stats').get(protect, getQuestionStats);
router.route('/companies').get(protect, getCompanies);
router.route('/topics').get(protect, getTopics);
router.route('/:id/practice').post(protect, practiceGlobalQuestion);

export default router;
