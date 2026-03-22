import mongoose from "mongoose";

const feedbackSchema = new mongoose.Schema({
    session: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Session",
        required: true
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    overallScore: {
        type: Number,
        min: 0,
        max: 100,
        required: true
    },
    questionBreakdown: [
        {
            questionText: String,
            questionType: String,
            technicalScore: { type: Number, min: 0, max: 100 },
            confidenceScore: { type: Number, min: 0, max: 100 },
            feedback: String,
            transcript: String,
            submittedCode: String,
            idealAnswer: String
        }
    ],
    strengths: [String],
    improvements: [String],
    recommendations: [String],
    communicationScore: { type: Number, min: 0, max: 100 },
    technicalScore: { type: Number, min: 0, max: 100 },
    confidenceLevel: { type: String, enum: ["low", "medium", "high"] },
    generatedAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

const Feedback = mongoose.model("Feedback", feedbackSchema);
export default Feedback;
