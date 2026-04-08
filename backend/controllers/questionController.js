import asyncHandler from 'express-async-handler';
import mongoose from 'mongoose';
import Question from '../models/QuestionModel.js';
import Sheet from '../models/SheetModel.js';
import User from '../models/User.js';
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

    const user = await User.findById(req.user._id).select('completedQuestions');
    const completedSet = new Set(user?.completedQuestions.map(id => id.toString()));

    const count = await Question.countDocuments(query);
    const questions = await Question.find(query)
        .sort({ frequency: -1 })
        .limit(limit)
        .skip(limit * (page - 1));

    const questionsWithStatus = questions.map(q => ({
        ...q._doc,
        isCompleted: completedSet.has(q._id.toString())
    }));

    res.json({
        questions: questionsWithStatus,
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

    // Calculate user progress from both personal sheets AND global question marking
    const user = await User.findById(req.user._id).select('completedQuestions');
    const userSheets = await Sheet.find({ user: req.user._id });
    
    // Use a Set for unique completed IDs
    const completedIds = new Set(user?.completedQuestions.map(id => id.toString()));
    
    userSheets.forEach(sheet => {
        sheet.problems.forEach(problem => {
            if (problem.status === 'completed' && problem.problemId) {
                completedIds.add(problem.problemId.toString());
            }
        });
    });

    // Fetch all unique completed questions to check their difficulty (for accurate stats)
    const completedQuestions = await Question.find({ _id: { $in: Array.from(completedIds) } });
    
    const solvedTotal = completedIds.size;
    const solvedEasy = completedQuestions.filter(q => q.difficulty === 'Easy').length;
    const solvedMedium = completedQuestions.filter(q => q.difficulty === 'Medium').length;
    const solvedHard = completedQuestions.filter(q => q.difficulty === 'Hard').length;

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
            console.log(`Starting AI generation for: ${question.title}...`);
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 100000); // 100-second timeout for LLM

            const aiResponse = await fetch(`${AI_SERVICE_URL}/generate-problem`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title: question.title,
                    company: question.companies[0] || 'Top Tech Company'
                }),
                signal: controller.signal
            });

            clearTimeout(timeoutId);

            if (aiResponse.ok) {
                const data = await aiResponse.json();
                
                // Helper to safely stringify values for MongoDB String fields
                const safeString = (val) => {
                    if (val === null || val === undefined) return '';
                    if (typeof val === 'string') return val;
                    return JSON.stringify(val);
                };

                question.description = data.description || question.description;
                
                // Safe mapping for examples
                question.examples = (data.examples || []).map(ex => ({
                    input: safeString(ex.input),
                    output: safeString(ex.output),
                    explanation: ex.explanation || ''
                }));

                // Safe mapping for test cases
                question.testCases = (data.testCases || []).map(tc => ({
                    input: safeString(tc.input),
                    expectedOutput: safeString(tc.expectedOutput || tc.output),
                    isHidden: tc.isHidden || false
                }));

                question.constraints = data.constraints || question.constraints;
                await question.save();
                console.log(`✓ AI generation successful for: ${question.title}`);
            } else {
                console.warn(`! AI generation returned status: ${aiResponse.status}`);
            }
        } catch (error) {
            if (error.name === 'AbortError') {
                console.error('! AI generation timed out after 100s');
            } else {
                console.error('! AI Detail generation failed:', error.message);
            }
        }
    }

    // Create a new sheet for this question
    const sheet = await Sheet.create({
        user: req.user._id,
        title: question.title || 'Untitled',
        category: 'Mixed',
        difficulty: question.difficulty || 'Medium',
        problems: [{
            problemId: (question.id || question._id).toString(),
            title: question.title || 'Untitled',
            description: question.description || `Practice this question. No detailed description available.`,
            difficulty: question.difficulty || 'Medium',
            tags: question.topics || [],
            testCases: question.testCases && question.testCases.length > 0 
                ? question.testCases.map(tc => ({
                    input: tc.input || '1',
                    expectedOutput: tc.expectedOutput || tc.output || '1',
                    isHidden: tc.isHidden || false
                })) 
                : [{ input: '1', expectedOutput: '1' }],
            examples: question.examples || [],
            constraints: question.constraints || [],
            status: 'in-progress'
        }]
    });

    res.status(201).json(sheet);
});

// @desc    Get interview guide for a global question (generates if not exists)
// @route   GET /api/questions/:id/guide
// @access  Private
const getQuestionGuide = asyncHandler(async (req, res) => {
    const question = await Question.findById(req.params.id);
    if (!question) {
        res.status(404);
        throw new Error('Question not found');
    }

    const { refresh } = req.query;
    const isForced = refresh === 'true';

    // 1. Check if guide is stale or missing
    const complexity = question.interviewGuide?.complexityAnalysis || {};
    const timeComp = (complexity.time || '').trim().toUpperCase();
    const spaceComp = (complexity.space || '').trim().toUpperCase();
    
    const isGeneric = (timeComp === 'O(N)' && spaceComp === 'O(1)') || (timeComp === 'O(1)' && spaceComp === 'O(1)');
    const isPending = timeComp.includes('PENDING') || timeComp.includes('CHECK');
    const isEmpty = !question.interviewGuide?.approach?.length || !question.interviewGuide?.verbalization;
    
    const shouldRefresh = isForced || isGeneric || isPending || isEmpty;

    if (!shouldRefresh && question.interviewGuide && question.interviewGuide.approach) {
        return res.json(question.interviewGuide);
    }

    // 2. Generate/Refresh Guide
    try {
        console.log(`[AI-BACKEND] FORCING REFRESH for: ${question.title}`);
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 120 * 1000); // 2 minute timeout

        const aiResponse = await fetch(`${AI_SERVICE_URL}/generate-guide`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                title: question.title,
                description: question.description || `Solve ${question.title}`,
                difficulty: question.difficulty,
                tags: question.topics
            }),
            signal: controller.signal
        });
        clearTimeout(timeoutId);

        if (aiResponse.ok) {
            const data = await aiResponse.json();
            
            // Only save if we actually got a real guide with content
            if (data.approach && data.approach.length > 0 && data.verbalization) {
                console.log(`[AI-BACKEND] SUCCESS: Received guide for ${question.title}`);
                question.interviewGuide = {
                    approach: data.approach,
                    verbalization: data.verbalization,
                    complexityAnalysis: data.complexityAnalysis
                };
                await question.save();
            } else {
                console.warn(`[AI-BACKEND] AI service returned incomplete guide for ${question.title}`);
            }
        } else {
            const errorText = await aiResponse.text();
            console.error(`[AI-BACKEND] AI SERVICE ERROR: ${aiResponse.status} - ${errorText}`);
            if (isForced) {
                res.status(500);
                throw new Error(`AI Service returned error: ${aiResponse.status}`);
            }
        }
    } catch (error) {
        console.error('[AI-BACKEND] EXCEPTION during guide generation:', error.message);
        if (isForced) {
            res.status(500);
            throw new Error(`Failed to contact AI service: ${error.message}`);
        }
    }

    // 3. Return updated guide or pending state
    if (question.interviewGuide && question.interviewGuide.approach) {
        return res.json(question.interviewGuide);
    }

    res.json({
        approach: ["Strategic analysis in progress.", "The AI service is currently analyzing this problem's pattern. Please refresh in 30 seconds."],
        verbalization: "I will explain the optimal strategy once the technical engine finishes its scan.",
        complexityAnalysis: { time: "O(Analysis Pending)", space: "O(Analysis Pending)" }
    });
});

// @desc    Toggle global question completion status
// @route   POST /api/questions/:id/toggle-complete
// @access  Private
const toggleQuestionComplete = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user._id);
    const questionId = req.params.id;

    if (!user) {
        res.status(404);
        throw new Error('User not found');
    }

    if (!mongoose.Types.ObjectId.isValid(questionId)) {
        res.status(400);
        throw new Error('Invalid Question ID format');
    }

    // Use .toString() for comparisons in arrays
    const isCompleted = user.completedQuestions.some(id => id.toString() === questionId);
    
    if (isCompleted) {
        user.completedQuestions = user.completedQuestions.filter(id => id.toString() !== questionId);
    } else {
        user.completedQuestions.push(questionId);
    }

    await user.save();

    res.json({ success: true, isCompleted: !isCompleted });
});

export {
    getQuestions,
    getQuestionStats,
    getCompanies,
    getTopics,
    practiceGlobalQuestion,
    getQuestionGuide,
    toggleQuestionComplete
};
