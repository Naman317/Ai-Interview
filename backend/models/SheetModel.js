// backend/models/SheetModel.js
import mongoose from 'mongoose';

const testCaseSchema = new mongoose.Schema({
    input: {
        type: String,
        required: true
    },
    expectedOutput: {
        type: String,
        required: true
    },
    isHidden: {
        type: Boolean,
        default: false // Hidden test cases for validation
    }
});

const aiEvaluationSchema = new mongoose.Schema({
    correctness: {
        type: Number,
        min: 0,
        max: 100
    },
    timeComplexity: String,
    spaceComplexity: String,
    feedback: String,
    suggestions: [String],
    passedTests: Number,
    totalTests: Number,
    evaluatedAt: {
        type: Date,
        default: Date.now
    }
});

const userSolutionSchema = new mongoose.Schema({
    code: String,
    language: {
        type: String,
        enum: ['javascript', 'python', 'java', 'cpp', 'typescript'],
        default: 'javascript'
    },
    submittedAt: {
        type: Date,
        default: Date.now
    }
});

const problemSchema = new mongoose.Schema({
    problemId: {
        type: String,
        required: true
    },
    title: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    difficulty: {
        type: String,
        enum: ['Easy', 'Medium', 'Hard'],
        default: 'Medium'
    },
    tags: [String],
    testCases: [testCaseSchema],
    userSolution: userSolutionSchema,
    aiEvaluation: aiEvaluationSchema,
    status: {
        type: String,
        enum: ['not-started', 'in-progress', 'completed'],
        default: 'not-started'
    },
    hints: [String],
    constraints: [String],
    examples: [{
        input: String,
        output: String,
        explanation: String
    }],
    interviewGuide: {
        approach: [String],
        verbalization: String,
        complexityAnalysis: {
            time: String,
            space: String
        }
    }
});

const sheetSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    title: {
        type: String,
        required: true
    },
    description: {
        type: String,
        default: ''
    },
    category: {
        type: String,
        enum: ['Arrays', 'Strings', 'Linked Lists', 'Trees', 'Graphs', 'Dynamic Programming',
            'Recursion', 'Sorting', 'Searching', 'Hash Tables', 'Stacks', 'Queues',
            'Greedy', 'Backtracking', 'Bit Manipulation', 'Math', 'Mixed'],
        default: 'Mixed'
    },
    difficulty: {
        type: String,
        enum: ['Easy', 'Medium', 'Hard', 'Mixed'],
        default: 'Mixed'
    },
    problems: [problemSchema],
    progress: {
        total: {
            type: Number,
            default: 0
        },
        completed: {
            type: Number,
            default: 0
        },
        percentage: {
            type: Number,
            default: 0
        }
    },
    isPublic: {
        type: Boolean,
        default: false
    },
    tags: [String]
}, {
    timestamps: true
});

// Update progress before saving
sheetSchema.pre('save', async function () {
    if (this.problems && this.problems.length > 0) {
        this.progress.total = this.problems.length;
        this.progress.completed = this.problems.filter(p => p.status === 'completed').length;
        this.progress.percentage = Math.round((this.progress.completed / this.progress.total) * 100);
    }
});

// Index for faster queries
sheetSchema.index({ user: 1, createdAt: -1 });
sheetSchema.index({ category: 1 });
sheetSchema.index({ difficulty: 1 });

const Sheet = mongoose.model('Sheet', sheetSchema);

export default Sheet;
