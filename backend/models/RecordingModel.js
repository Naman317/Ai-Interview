import mongoose from "mongoose";

const recordingSchema = new mongoose.Schema({
    session: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Session",
        required: true
    },
    questionIndex: {
        type: Number,
        required: true
    },
    videoUrl: String,
    audioUrl: String,
    transcript: String,
    duration: Number, // in seconds
    uploadedAt: {
        type: Date,
        default: Date.now
    }
});

const Recording = mongoose.model("Recording", recordingSchema);
export default Recording;
