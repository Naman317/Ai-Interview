import mongoose from 'mongoose';

const questionSchema = new mongoose.Schema({
    id: {
        type: Number,
        required: true
    },
    title: {
        type: String,
        required: true
    },
    url: String,
    isPremium: {
        type: Boolean,
        default: false
    },
    acceptance: {
        type: Number,
        default: 0
    },
    difficulty: {
        type: String,
        enum: ['Easy', 'Medium', 'Hard'],
        default: 'Medium'
    },
    frequency: {
        type: Number,
        default: 0
    },
    topics: [String],
    companies: [String], // Array of company names
    description: String,
    examples: [{
        input: String,
        output: String,
        explanation: String
    }],
    testCases: [{
        input: String,
        expectedOutput: String,
        isHidden: { type: Boolean, default: false }
    }],
    constraints: [String],
    interviewGuide: {
        approach: String,
        verbalization: String,
        complexityAnalysis: {
            time: String,
            space: String
        }
    }
}, {
    timestamps: true
});

// Indexes for faster filtering and search
questionSchema.index({ title: 'text', topics: 'text', companies: 'text' });
questionSchema.index({ difficulty: 1 });
questionSchema.index({ companies: 1 });

const Question = mongoose.model('Question', questionSchema);

export default Question;
