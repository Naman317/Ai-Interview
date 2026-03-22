import cv2
import mediapipe as mp
import numpy as np
import os
import json

class VisualAnalyzer:
    def __init__(self):
        # Initialize MediaPipe
        self.mp_face_mesh = mp.solutions.face_mesh
        self.face_mesh = self.mp_face_mesh.FaceMesh(
            static_image_mode=False,
            max_num_faces=1,
            refine_landmarks=True,
            min_detection_confidence=0.5,
            min_tracking_confidence=0.5
        )
        
        # Initialize FER lazily to save memory
        self._emotion_detector = None

    @property
    def emotion_detector(self):
        if self._emotion_detector is None:
            try:
                from fer import FER
                self._emotion_detector = FER(mtcnn=False) # mtcnn is slower, False is faster for video
            except ImportError:
                print("FER not found, emotion detection disabled")
                self._emotion_detector = False
        return self._emotion_detector

    def analyze_video(self, video_path, sample_rate=1, max_frames=20):
        """
        Processes the video and returns visual metrics.
        sample_rate: Process X frames per second.
        max_frames: Maximum number of frames to process total (to prevent long processing times).
        """
        cap = cv2.VideoCapture(video_path)
        if not cap.isOpened():
            print(f"Error: Could not open video {video_path}")
            return None

        fps = cap.get(cv2.CAP_PROP_FPS)
        if fps <= 0: fps = 30
        frame_interval = int(fps / sample_rate) if fps > sample_rate else 1
        
        metrics = {
            "eye_contact_scores": [],
            "emotions": [],
            "head_pose_scores": []
        }

        frame_count = 0
        processed_count = 0

        while cap.isOpened() and processed_count < max_frames:
            ret, frame = cap.read()
            if not ret:
                break

            if frame_count % frame_interval == 0:
                # 1. Emotion Detection (FER)
                if self.emotion_detector:
                    em_results = self.emotion_detector.detect_emotions(frame)
                    if em_results:
                        metrics["emotions"].append(em_results[0]["emotions"])

                # 2. Face Landmarks (MediaPipe)
                rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
                results = self.face_mesh.process(rgb_frame)

                if results.multi_face_landmarks:
                    face_landmarks = results.multi_face_landmarks[0].landmark
                    
                    # Eye Contact Heuristic (Iris Center vs eye socket center)
                    # Landmarks: 468 (L Iris), 473 (R Iris), 33/133 (L eye corners), 362/263 (R eye corners)
                    l_eye_center_x = (face_landmarks[33].x + face_landmarks[133].x) / 2
                    r_eye_center_x = (face_landmarks[362].x + face_landmarks[263].x) / 2
                    
                    l_iris_x = face_landmarks[468].x
                    r_iris_x = face_landmarks[473].x
                    
                    l_dist = abs(l_iris_x - l_eye_center_x)
                    r_dist = abs(r_iris_x - r_eye_center_x)
                    
                    l_width = abs(face_landmarks[33].x - face_landmarks[133].x)
                    r_width = abs(face_landmarks[362].x - face_landmarks[263].x)
                    
                    # Score drops as iris moves away from center. 0.1 normalized is decent limit.
                    gaze_score = 1.0 - (min(l_dist/l_width, r_dist/r_width) * 6.0)
                    metrics["eye_contact_scores"].append(max(0.1, min(1.0, gaze_score)))

                    # Head Pose Heuristic (Nose vs Face edges)
                    nose_tip_x = face_landmarks[1].x
                    left_edge_x = face_landmarks[234].x
                    right_edge_x = face_landmarks[454].x
                    
                    total_width = abs(right_edge_x - left_edge_x)
                    if total_width > 0:
                        center_ratio = (nose_tip_x - left_edge_x) / total_width
                        pose_score = 1.0 - abs(center_ratio - 0.5) * 2.0
                        metrics["head_pose_scores"].append(max(0.1, min(1.0, pose_score)))

                processed_count += 1

            frame_count += 1

        cap.release()

        # Compile final scores
        final_scores = {
            "eyeContact": int(np.mean(metrics["eye_contact_scores"]) * 40 + 60) if metrics["eye_contact_scores"] else 75,
            "headPose": int(np.mean(metrics["head_pose_scores"]) * 40 + 60) if metrics["head_pose_scores"] else 80,
            "confidence_boost": 0,
            "visual_feedback": ""
        }

        if metrics["emotions"]:
            # Aggregate emotions
            avg_emotions = {k: np.mean([e[k] for e in metrics["emotions"]]) for k in metrics["emotions"][0].keys()}
            
            # Use top emotion for feedback
            top_em = max(avg_emotions, key=avg_emotions.get)
            
            if top_em == "happy":
                final_scores["visual_feedback"] = "Great job! You look pleasant and engaged. Your smile conveys confidence."
                final_scores["confidence_boost"] = 10
            elif top_em == "neutral":
                final_scores["visual_feedback"] = "You maintained a calm and professional demeanor."
                final_scores["confidence_boost"] = 5
            elif top_em in ["fear", "angry", "sad"]:
                final_scores["visual_feedback"] = "You appeared slightly tensed or anxious. Remember to breathe and smile more to project confidence."
                final_scores["confidence_boost"] = -5
            else:
                final_scores["visual_feedback"] = "Your expressions were varied. Maintain more consistent positivity."

        # Clamp eye contact if head pose is bad
        if final_scores["headPose"] < 70:
            final_scores["eyeContact"] = min(final_scores["eyeContact"], final_scores["headPose"])
            final_scores["visual_feedback"] += " Also, try to keep your head more centered and look directly at the camera."

        return final_scores

if __name__ == "__main__":
    # Test (internal only)
    analyzer = VisualAnalyzer()
    print("Analyzer ready")
