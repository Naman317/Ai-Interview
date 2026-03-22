import { useRef, useState, useEffect } from "react";
import api from "../utils/api";

export default function VideoInterview({ question, sessionId, onSubmit }) {
  const videoRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);

  const [recording, setRecording] = useState(false);
  const [loading, setLoading] = useState(false);
  const [timer, setTimer] = useState(0);
  const [analysis, setAnalysis] = useState(null);

  useEffect(() => {
    let interval;
    if (recording) {
      interval = setInterval(() => setTimer(t => t + 1), 1000);
    }
    return () => clearInterval(interval);
  }, [recording]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480 },
        audio: true
      });

      streamRef.current = stream;
      videoRef.current.srcObject = stream;

      mediaRecorderRef.current = new MediaRecorder(stream);
      mediaRecorderRef.current.ondataavailable = e =>
        chunksRef.current.push(e.data);

      mediaRecorderRef.current.start();
      setRecording(true);
      setTimer(0);
    } catch (err) {
      alert("Camera/Microphone access denied");
    }
  };

  const stopRecording = async () => {
    mediaRecorderRef.current.stop();
    streamRef.current.getTracks().forEach(t => t.stop());

    mediaRecorderRef.current.onstop = async () => {
      const blob = new Blob(chunksRef.current, { type: "video/webm" });
      chunksRef.current = [];

      const formData = new FormData();
      formData.append("video", blob);
      formData.append("question", question);
      formData.append("sessionId", sessionId);
      formData.append("duration", timer);

      setLoading(true);
      try {
        const response = await api.post(
          `/api/sessions/analyze-video`,
          formData,
          { headers: { "Content-Type": "multipart/form-data" } }
        );

        setAnalysis(response.data.analysis);
        if (onSubmit) {
          onSubmit(response.data);
        }
      } catch (error) {
        console.error("Error uploading video:", error);
        alert("Failed to analyze video. Please try again.");
      } finally {
        setLoading(false);
        setRecording(false);
      }
    };

    setRecording(false);
  };

  if (analysis) {
    return (
      <div className="bg-white rounded-lg p-6 space-y-4">
        <h3 className="text-xl font-bold">Behavioral Analysis</h3>

        <div className="grid grid-cols-2 gap-4">
          <div className="bg-blue-50 p-4 rounded">
            <p className="text-sm text-gray-600">Eye Contact</p>
            <p className="text-2xl font-bold text-blue-600">{analysis.eyeContact || 0}%</p>
          </div>
          <div className="bg-green-50 p-4 rounded">
            <p className="text-sm text-gray-600">Confidence</p>
            <p className="text-2xl font-bold text-green-600">{analysis.confidence || 0}%</p>
          </div>
          <div className="bg-purple-50 p-4 rounded">
            <p className="text-sm text-gray-600">Fluency</p>
            <p className="text-2xl font-bold text-purple-600">{analysis.fluency || 0}%</p>
          </div>
          <div className="bg-orange-50 p-4 rounded">
            <p className="text-sm text-gray-600">Clarity</p>
            <p className="text-2xl font-bold text-orange-600">{analysis.clarity || 0}%</p>
          </div>
        </div>

        <div className="bg-gray-50 p-4 rounded">
          <p className="font-semibold mb-2">Feedback:</p>
          <p className="text-gray-700">{analysis.feedback || "No feedback available"}</p>
        </div>

        <div className="text-sm text-gray-500">
          ✓ Video analyzed and submitted
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg p-6 space-y-4">
      <div className="relative bg-black rounded-lg overflow-hidden">
        <video
          ref={videoRef}
          autoPlay
          muted
          className="w-full aspect-video bg-black"
        />
        {recording && (
          <div className="absolute top-4 right-4 bg-red-500 text-white px-3 py-1 rounded-full text-sm font-bold flex items-center gap-2">
            <span className="w-2 h-2 bg-white rounded-full animate-pulse"></span>
            REC {formatTime(timer)}
          </div>
        )}
      </div>

      <div className="space-y-2">
        <p className="text-sm font-medium text-gray-700">Question:</p>
        <p className="text-gray-800 bg-gray-50 p-3 rounded">{question}</p>
      </div>

      <div className="flex gap-3">
        {!recording ? (
          <button
            onClick={startRecording}
            disabled={loading}
            className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50"
          >
            🎥 Start Recording
          </button>
        ) : (
          <button
            onClick={stopRecording}
            disabled={loading}
            className="flex-1 bg-red-600 text-white py-3 rounded-lg font-semibold hover:bg-red-700 disabled:opacity-50"
          >
            ⏹ Stop & Submit
          </button>
        )}
      </div>

      {loading && (
        <div className="text-center py-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
          <p className="text-gray-600">Analyzing video behavior...</p>
        </div>
      )}
    </div>
  );
}
