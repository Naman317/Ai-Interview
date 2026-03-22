// backend/routes/sheetRoutes.js
import express from 'express';
import {
    getSheets,
    getSheetById,
    createSheet,
    updateSheet,
    deleteSheet,
    addProblem,
    updateProblem,
    submitSolution,
    evaluateCode,
    generateGuide
} from '../controllers/sheetController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// Sheet routes
router.route('/')
    .get(protect, getSheets)
    .post(protect, createSheet);

router.route('/:id')
    .get(protect, getSheetById)
    .put(protect, updateSheet)
    .delete(protect, deleteSheet);

// Problem routes
router.route('/:id/problems')
    .post(protect, addProblem);

router.route('/:sheetId/problems/:problemId')
    .put(protect, updateProblem);

router.route('/:sheetId/problems/:problemId/submit')
    .post(protect, submitSolution);

router.route('/:sheetId/problems/:problemId/evaluate')
    .post(protect, evaluateCode);

router.route('/:sheetId/problems/:problemId/guide')
    .post(protect, generateGuide);

export default router;
