import asyncHandler from 'express-async-handler';
import Question from '../models/QuestionModel.js';
import Sheet from '../models/SheetModel.js';
import fetch from 'node-fetch';

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000';

// @desc    Get all global coding questions
// @route   GET /api/questions
// @access  Private
const getQuestions = asyncHandler(async (req, res) => {
    const { company, difficulty, topic, search, page = 1, limit = 50 } = req.query;

    const query = {};

    if (company && company !== 'all') {
        query.companies = { $in: [new RegExp(company, 'i')] };
    }

    if (difficulty && difficulty !== 'all') {
        query.difficulty = difficulty.charAt(0).toUpperCase() + difficulty.slice(1).toLowerCase();
    }

    if (topic && topic !== 'all') {
        query.topics = { $in: [new RegExp(topic, 'i')] };
    }

    if (search) {
        query.$or = [
            { title: { $regex: search, $options: 'i' } },
            { topics: { $in: [new RegExp(search, 'i')] } },
            { companies: { $in: [new RegExp(search, 'i')] } }
        ];
    }

    const count = await Question.countDocuments(query);
    const questions = await Question.find(query)
        .sort({ frequency: -1 })
        .limit(limit)
        .skip(limit * (page - 1));

    res.json({
        questions,
        page: Number(page),
        pages: Math.ceil(count / limit),
        total: count
    });
});

// @desc    Get question stats (total, easy, medium, hard)
// @route   GET /api/questions/stats
// @access  Private
const getQuestionStats = asyncHandler(async (req, res) => {
    const totalCount = await Question.countDocuments();
    const easyCount = await Question.countDocuments({ difficulty: 'Easy' });
    const mediumCount = await Question.countDocuments({ difficulty: 'Medium' });
    const hardCount = await Question.countDocuments({ difficulty: 'Hard' });

    // Calculate user progress
    const userSheets = await Sheet.find({ user: req.user._id });
    let solvedTotal = 0;
    let solvedEasy = 0;
    let solvedMedium = 0;
    let solvedHard = 0;

    userSheets.forEach(sheet => {
        sheet.problems.forEach(problem => {
            if (problem.status === 'completed') {
                solvedTotal++;
                if (problem.difficulty === 'Easy') solvedEasy++;
                else if (problem.difficulty === 'Medium') solvedMedium++;
                else if (problem.difficulty === 'Hard') solvedHard++;
            }
        });
    });

    res.json({
        total: totalCount,
        easy: easyCount,
        medium: mediumCount,
        hard: hardCount,
        userProgress: {
            total: solvedTotal,
            easy: solvedEasy,
            medium: solvedMedium,
            hard: solvedHard
        }
    });
});

// @desc    Get list of all companies
// @route   GET /api/questions/companies
// @access  Private
const getCompanies = asyncHandler(async (req, res) => {
    const companies = await Question.distinct('companies');
    res.json(companies.sort());
});

// @desc    Get list of all topics
// @route   GET /api/questions/topics
// @access  Private
const getTopics = asyncHandler(async (req, res) => {
    const topics = await Question.distinct('topics');
    res.json(topics.sort());
});

// @desc    Start practicing a global question (creates a personal sheet)
// @route   POST /api/questions/:id/practice
// @access  Private
const practiceGlobalQuestion = asyncHandler(async (req, res) => {
    const question = await Question.findById(req.params.id);
    if (!question) {
        res.status(404);
        throw new Error('Question not found');
    }

    // Check if details exist, if not generate them
    if (!question.description || !question.testCases || question.testCases.length === 0) {
        try {
            const aiResponse = await fetch(`${AI_SERVICE_URL}/generate-problem`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title: question.title,
                    company: question.companies[0] || 'Top Tech Company'
                })
            });

            if (aiResponse.ok) {
                const data = await aiResponse.json();
                question.description = data.description;
                question.examples = data.examples;
                question.testCases = data.testCases;
                question.constraints = data.constraints;
                await question.save();
            }
        } catch (error) {
            console.error('AI Detail generation skipped/failed:', error.message);
        }
    }

    // Create a new sheet for this question
    const sheet = await Sheet.create({
        user: req.user._id,
        title: question.title,
        category: 'Mixed',
        difficulty: question.difficulty,
        problems: [{
            problemId: question.id.toString(),
            title: question.title,
            description: question.description || `Practice ${question.title}. No detailed description available.`,
            difficulty: question.difficulty,
            tags: question.topics,
            testCases: question.testCases && question.testCases.length > 0 ? question.testCases : [{ input: '1', expectedOutput: '1' }],
            examples: question.examples || [],
            constraints: question.constraints || [],
            status: 'in-progress'
        }]
    });

    res.status(201).json(sheet);
});

export {
    getQuestions,
    getQuestionStats,
    getCompanies,
    getTopics,
    practiceGlobalQuestion
};
