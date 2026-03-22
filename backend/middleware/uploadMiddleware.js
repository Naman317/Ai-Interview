import multer from "multer";
import path from "path";


import fs from "fs";

// Ensure upload directory exists
const uploadDir = "uploads/";
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir);
}

const storage = multer.diskStorage({
    destination(req, file, cb) {
        cb(null, uploadDir);
    },
    filename(req, file, cb) {
        const ext = path.extname(file.originalname);

        const sessionId = req.params.id || req.user?._id || 'unknown';
        cb(null, `${sessionId}-${Date.now()}${ext}`);
    },
});

const audioFileFilter = (req, file, cb) => {
    if (file.mimetype.startsWith("audio/") || file.mimetype === "application/octet-stream") {
        cb(null, true);
    } else {
        cb(new Error("Not an audio file"), false);
    }
};

const videoFileFilter = (req, file, cb) => {
    if (file.mimetype.startsWith("video/")) {
        cb(null, true);
    } else {
        cb(new Error("Not a video file"), false);
    }
};

const pdfFileFilter = (req, file, cb) => {
    if (file.mimetype === "application/pdf") {
        cb(null, true);
    } else {
        cb(new Error("Not a PDF file"), false);
    }
};

// Resume file filter (PDF and DOCX)
const resumeFileFilter = (req, file, cb) => {
    const allowedMimes = [
        "application/pdf",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    ];

    if (allowedMimes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error("Only PDF and DOCX files are allowed for resumes"), false);
    }
};

const uploadAudio = multer({
    storage: storage,
    fileFilter: audioFileFilter,
    limits: { fileSize: 1024 * 1024 * 10 },
});

const uploadVideo = multer({
    storage: storage,
    fileFilter: videoFileFilter,
    limits: { fileSize: 1024 * 1024 * 100 }, // 100MB for video
});

const uploadPDF = multer({
    storage: storage,
    fileFilter: pdfFileFilter,
    limits: { fileSize: 1024 * 1024 * 10 }, // 10MB for PDF
});

const uploadResume = multer({
    storage: storage,
    fileFilter: resumeFileFilter,
    limits: { fileSize: 1024 * 1024 * 5 }, // 5MB for resume
});

const uploadSingleAudio = uploadAudio.single("audioFile");
const uploadSingleVideo = uploadVideo.single("video");
const uploadSinglePDF = uploadPDF.single("cv");
const uploadSingleResume = uploadResume.single("resume");

export { uploadSingleAudio, uploadSingleVideo, uploadSinglePDF, uploadSingleResume };