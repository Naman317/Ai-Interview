// backend/controllers/sheetController.js
import asyncHandler from 'express-async-handler';
import Sheet from '../models/SheetModel.js';
import fetch from 'node-fetch';

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000';

// @desc    Get all sheets for a user
// @route   GET /api/sheets
// @access  Private
const getSheets = asyncHandler(async (req, res) => {
    const { category, difficulty, search } = req.query;

    const query = { user: req.user._id };

    if (category && category !== 'all') {
        query.category = category;
    }

    if (difficulty && difficulty !== 'all') {
        query.difficulty = difficulty;
    }

    if (search) {
        query.$or = [
            { title: { $regex: search, $options: 'i' } },
            { description: { $regex: search, $options: 'i' } }
        ];
    }

    const sheets = await Sheet.find(query).sort({ createdAt: -1 });

    res.json(sheets);
});

// @desc    Get single sheet by ID
// @route   GET /api/sheets/:id
// @access  Private
const getSheetById = asyncHandler(async (req, res) => {
    const sheet = await Sheet.findById(req.params.id);

    if (!sheet) {
        res.status(404);
        throw new Error('Sheet not found');
    }

    // Check ownership
    if (sheet.user.toString() !== req.user._id.toString()) {
        res.status(403);
        throw new Error('Not authorized to access this sheet');
    }

    res.json(sheet);
});

// @desc    Create new sheet
// @route   POST /api/sheets
// @access  Private
const createSheet = asyncHandler(async (req, res) => {
    const { title, description, category, difficulty, problems } = req.body;

    if (!title) {
        res.status(400);
        throw new Error('Sheet title is required');
    }

    const sheet = await Sheet.create({
        user: req.user._id,
        title,
        description: description || '',
        category: category || 'Mixed',
        difficulty: difficulty || 'Mixed',
        problems: problems || []
    });

    res.status(201).json(sheet);
});

// @desc    Update sheet
// @route   PUT /api/sheets/:id
// @access  Private
const updateSheet = asyncHandler(async (req, res) => {
    const sheet = await Sheet.findById(req.params.id);

    if (!sheet) {
        res.status(404);
        throw new Error('Sheet not found');
    }

    // Check ownership
    if (sheet.user.toString() !== req.user._id.toString()) {
        res.status(403);
        throw new Error('Not authorized to update this sheet');
    }

    const { title, description, category, difficulty } = req.body;

    if (title) sheet.title = title;
    if (description !== undefined) sheet.description = description;
    if (category) sheet.category = category;
    if (difficulty) sheet.difficulty = difficulty;

    await sheet.save();

    res.json(sheet);
});

// @desc    Delete sheet
// @route   DELETE /api/sheets/:id
// @access  Private
const deleteSheet = asyncHandler(async (req, res) => {
    const sheet = await Sheet.findById(req.params.id);

    if (!sheet) {
        res.status(404);
        throw new Error('Sheet not found');
    }

    // Check ownership
    if (sheet.user.toString() !== req.user._id.toString()) {
        res.status(403);
        throw new Error('Not authorized to delete this sheet');
    }

    await sheet.deleteOne();

    res.json({ message: 'Sheet deleted successfully' });
});

// @desc    Add problem to sheet
// @route   POST /api/sheets/:id/problems
// @access  Private
const addProblem = asyncHandler(async (req, res) => {
    const sheet = await Sheet.findById(req.params.id);

    if (!sheet) {
        res.status(404);
        throw new Error('Sheet not found');
    }

    // Check ownership
    if (sheet.user.toString() !== req.user._id.toString()) {
        res.status(403);
        throw new Error('Not authorized to modify this sheet');
    }

    const { title, description, difficulty, tags, testCases, hints, constraints, examples } = req.body;

    if (!title || !description) {
        res.status(400);
        throw new Error('Problem title and description are required');
    }

    const problem = {
        problemId: `prob_${Date.now()}`,
        title,
        description,
        difficulty: difficulty || 'Medium',
        tags: tags || [],
        testCases: testCases || [],
        hints: hints || [],
        constraints: constraints || [],
        examples: examples || [],
        status: 'not-started'
    };

    sheet.problems.push(problem);
    await sheet.save();

    res.status(201).json(sheet);
});

// @desc    Update problem in sheet
// @route   PUT /api/sheets/:sheetId/problems/:problemId
// @access  Private
const updateProblem = asyncHandler(async (req, res) => {
    const sheet = await Sheet.findById(req.params.sheetId);

    if (!sheet) {
        res.status(404);
        throw new Error('Sheet not found');
    }

    // Check ownership
    if (sheet.user.toString() !== req.user._id.toString()) {
        res.status(403);
        throw new Error('Not authorized to modify this sheet');
    }

    const problem = sheet.problems.id(req.params.problemId);

    if (!problem) {
        res.status(404);
        throw new Error('Problem not found');
    }

    const { title, description, difficulty, tags, testCases, hints, constraints, examples } = req.body;

    if (title) problem.title = title;
    if (description) problem.description = description;
    if (difficulty) problem.difficulty = difficulty;
    if (tags) problem.tags = tags;
    if (testCases) problem.testCases = testCases;
    if (hints) problem.hints = hints;
    if (constraints) problem.constraints = constraints;
    if (examples) problem.examples = examples;

    await sheet.save();

    res.json(sheet);
});

// @desc    Submit solution for a problem
// @route   POST /api/sheets/:sheetId/problems/:problemId/submit
// @access  Private
const submitSolution = asyncHandler(async (req, res) => {
    const sheet = await Sheet.findById(req.params.sheetId);

    if (!sheet) {
        res.status(404);
        throw new Error('Sheet not found');
    }

    // Check ownership
    if (sheet.user.toString() !== req.user._id.toString()) {
        res.status(403);
        throw new Error('Not authorized to submit to this sheet');
    }

    const problem = sheet.problems.id(req.params.problemId);

    if (!problem) {
        res.status(404);
        throw new Error('Problem not found');
    }

    const { code, language } = req.body;

    if (!code) {
        res.status(400);
        throw new Error('Code is required');
    }

    // Save solution
    problem.userSolution = {
        code,
        language: language || 'javascript',
        submittedAt: new Date()
    };

    problem.status = 'in-progress';

    await sheet.save();

    res.json({ message: 'Solution saved successfully', sheet });
});

// @desc    Evaluate code with AI
// @route   POST /api/sheets/:sheetId/problems/:problemId/evaluate
// @access  Private
const evaluateCode = asyncHandler(async (req, res) => {
    const sheet = await Sheet.findById(req.params.sheetId);

    if (!sheet) {
        res.status(404);
        throw new Error('Sheet not found');
    }

    // Check ownership
    if (sheet.user.toString() !== req.user._id.toString()) {
        res.status(403);
        throw new Error('Not authorized');
    }

    const problem = sheet.problems.id(req.params.problemId);

    if (!problem) {
        res.status(404);
        throw new Error('Problem not found');
    }

    if (!problem.userSolution || !problem.userSolution.code) {
        res.status(400);
        throw new Error('No solution submitted yet');
    }

    try {
        // Call AI service for code evaluation
        const aiResponse = await fetch(`${AI_SERVICE_URL}/evaluate-code`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                code: problem.userSolution.code,
                language: problem.userSolution.language,
                problem_description: problem.description,
                test_cases: problem.testCases
            })
        });

        if (!aiResponse.ok) {
            throw new Error('AI evaluation failed');
        }

        const evaluation = await aiResponse.json();

        // Save evaluation
        problem.aiEvaluation = {
            correctness: evaluation.correctness,
            timeComplexity: evaluation.timeComplexity,
            spaceComplexity: evaluation.spaceComplexity,
            feedback: evaluation.feedback,
            suggestions: evaluation.suggestions,
            passedTests: evaluation.passedTests,
            totalTests: evaluation.totalTests,
            evaluatedAt: new Date()
        };

        // Update status
        if (evaluation.correctness >= 80) {
            problem.status = 'completed';
        } else {
            problem.status = 'in-progress';
        }

        await sheet.save();

        res.json({ evaluation: problem.aiEvaluation, sheet });

    } catch (error) {
        console.error('Code evaluation error:', error);
        res.status(500);
        throw new Error('Failed to evaluate code');
    }
});

// @desc    Generate interview guide for a problem
// @route   POST /api/sheets/:sheetId/problems/:problemId/guide
// @access  Private
const generateGuide = asyncHandler(async (req, res) => {
    const sheet = await Sheet.findById(req.params.sheetId);

    if (!sheet) {
        res.status(404);
        throw new Error('Sheet not found');
    }

    // Check ownership
    if (sheet.user.toString() !== req.user._id.toString()) {
        res.status(403);
        throw new Error('Not authorized');
    }

    const problem = sheet.problems.id(req.params.problemId);

    if (!problem) {
        res.status(404);
        throw new Error('Problem not found');
    }

    try {
        // If guide already exists, return it (caching)
        if (problem.interviewGuide && problem.interviewGuide.approach) {
            return res.json({ guide: problem.interviewGuide });
        }

        // Call AI service for guide generation
        const aiResponse = await fetch(`${AI_SERVICE_URL}/generate-guide`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                title: problem.title,
                description: problem.description,
                difficulty: problem.difficulty,
                tags: problem.tags
            })
        });

        if (!aiResponse.ok) {
            throw new Error('AI guide generation failed');
        }

        const guide = await aiResponse.json();

        // Save guide to problem
        problem.interviewGuide = {
            approach: guide.approach,
            verbalization: guide.verbalization,
            complexityAnalysis: {
                time: guide.complexityAnalysis?.time || 'O(N)',
                space: guide.complexityAnalysis?.space || 'O(1)'
            }
        };

        await sheet.save();

        res.json({ guide: problem.interviewGuide, sheet });

    } catch (error) {
        console.error('Guide generation error:', error);
        res.status(500);
        throw new Error('Failed to generate interview guide');
    }
});

export {
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
};
