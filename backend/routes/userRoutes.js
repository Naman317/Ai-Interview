import express from "express";
import { registerUser, loginUser, googleLogin, getUserProfile, updateUserProfile, uploadCV, parseCV, deleteUser } from "../controllers/userController.js";
import { protect } from "../middleware/authMiddleware.js";
import { uploadSinglePDF } from "../middleware/uploadMiddleware.js";

const router = express.Router();

router.post("/register", registerUser);
router.post("/login", loginUser);
router.post("/google", googleLogin);
router.route("/profile").get(protect, getUserProfile).put(protect, updateUserProfile).delete(protect, deleteUser);
router.post("/upload-cv", protect, uploadSinglePDF, uploadCV);
router.post("/parse-cv", protect, parseCV);

export default router;