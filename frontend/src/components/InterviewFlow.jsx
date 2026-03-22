import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import api from '../utils/api';
import { motion } from 'framer-motion';
import './InterviewFlow.css';

export default function InterviewFlow() {
    const { sessionId } = useParams();
    const navigate = useNavigate();
    const { user } = useSelector(state => state.auth);

    const [session, setSession] = useState(null);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [loading, setLoading] = useState(true);
    const [evaluating, setEvaluating] = useState(false);
    const [answer, setAnswer] = useState('');
    const [code, setCode] = useState('');
    const [recording, setRecording] = useState(false);
    const [recordedAnswer, setRecordedAnswer] = useState('');
    const [timeLeft, setTimeLeft] = useState(180); // 3 minutes per question
    const mediaRecorderRef = useRef(null);
    const audioChunksRef = useRef([]);

    // Load session on mount
    useEffect(() => {
        const loadSession = async () => {
            try {
                const response = await api.get(`/api/interview/${sessionId}`);
                setSession(response.data);
                setLoading(false);
            } catch (error) {
                console.error('Error loading session:', error);
                setLoading(false);
            }
        };

        loadSession();
    }, [sessionId]);

    // Timer countdown
    useEffect(() => {
        if (timeLeft <= 0) return;
        
        const timer = setInterval(() => {
            setTimeLeft(t => t - 1);
        }, 1000);

        return () => clearInterval(timer);
    }, [timeLeft]);

    // Start recording
    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const mediaRecorder = new MediaRecorder(stream);
            mediaRecorderRef.current = mediaRecorder;
            audioChunksRef.current = [];

            mediaRecorder.ondataavailable = (event) => {
                audioChunksRef.current.push(event.data);
            };

            mediaRecorder.onstop = () => {
                const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
                const reader = new FileReader();
                reader.onloadend = () => {
                    setRecordedAnswer(reader.result);
                };
                reader.readAsDataURL(audioBlob);
            };

            mediaRecorder.start();
            setRecording(true);
        } catch (error) {
            console.error('Error starting recording:', error);
            alert('Could not access microphone');
        }
    };

    // Stop recording
    const stopRecording = () => {
        if (mediaRecorderRef.current) {
            mediaRecorderRef.current.stop();
            mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
            setRecording(false);
        }
    };

    // Submit answer
    const submitAnswer = async () => {
        try {
            setEvaluating(true);

            // Submit answer to backend
            await api.post('/api/interview/submit-answer', {
                sessionId,
                questionIndex: currentQuestionIndex,
                answerText: answer,
                code: code,
                audioPath: recordedAnswer
            });

            // Evaluate answer
            const evaluationResponse = await api.post('/api/interview/evaluate-answer', {
                sessionId,
                questionIndex: currentQuestionIndex
            });

            // Move to next question or complete
            if (currentQuestionIndex < session.questions.length - 1) {
                setCurrentQuestionIndex(currentQuestionIndex + 1);
                setAnswer('');
                setCode('');
                setRecordedAnswer('');
                setTimeLeft(180);
            } else {
                // All questions answered
                const completeResponse = await api.post('/api/interview/complete', {
                    sessionId
                });
                navigate(`/feedback/${completeResponse.data.feedbackId}`);
            }

            setEvaluating(false);
        } catch (error) {
            console.error('Error submitting answer:', error);
            alert('Failed to submit answer');
            setEvaluating(false);
        }
    };

    if (loading) {
        return (
            <div className="interview-loading">
                <div className="spinner"></div>
                <p>Loading interview...</p>
            </div>
        );
    }

    if (!session) {
        return <div className="interview-error">Failed to load interview session</div>;
    }

    const currentQuestion = session.questions[currentQuestionIndex];
    const progressPercent = ((currentQuestionIndex + 1) / session.questions.length) * 100;
    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;

    return (
        <div className="interview-container">
            {/* Header */}
            <div className="interview-header">
                <div className="interview-info">
                    <h1>Interview: {session.role} - {session.level}</h1>
                    <div className="interview-progress">
                        <div className="progress-bar">
                            <div 
                                className="progress-fill" 
                                style={{ width: `${progressPercent}%` }}
                            ></div>
                        </div>
                        <p>Question {currentQuestionIndex + 1} of {session.questions.length}</p>
                    </div>
                </div>
                <div className="interview-timer">
                    <div className={`timer ${timeLeft < 60 ? 'warning' : ''}`}>
                        {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <motion.div 
                className="interview-content"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
            >
                {/* Question Display */}
                <div className="question-section">
                    <h2 className="question-text">{currentQuestion.questionText}</h2>
                    <p className="question-type">
                        Type: {currentQuestion.questionType === 'coding' ? '💻 Coding' : '🎤 Oral'}
                    </p>
                </div>

                {/* Answer Input */}
                <div className="answer-section">
                    {currentQuestion.questionType === 'coding' ? (
                        <>
                            <textarea
                                value={code}
                                onChange={(e) => setCode(e.target.value)}
                                placeholder="Write your code here..."
                                className="code-editor"
                            />
                            <div className="editor-info">
                                <p>💡 Tip: Write clean, well-documented code</p>
                            </div>
                        </>
                    ) : (
                        <>
                            <div className="voice-section">
                                <textarea
                                    value={answer}
                                    onChange={(e) => setAnswer(e.target.value)}
                                    placeholder="Type or record your answer here..."
                                    className="answer-textarea"
                                />
                                
                                <div className="recording-controls">
                                    {!recording ? (
                                        <button 
                                            onClick={startRecording}
                                            className="btn btn-record"
                                            disabled={evaluating}
                                        >
                                            🎤 Start Recording
                                        </button>
                                    ) : (
                                        <button 
                                            onClick={stopRecording}
                                            className="btn btn-stop"
                                        >
                                            ⏹️ Stop Recording
                                        </button>
                                    )}
                                    {recordedAnswer && (
                                        <p className="recording-status">✓ Answer recorded</p>
                                    )}
                                </div>
                            </div>
                        </>
                    )}
                </div>

                {/* Action Buttons */}
                <div className="action-buttons">
                    <button 
                        onClick={() => setCurrentQuestionIndex(Math.max(0, currentQuestionIndex - 1))}
                        className="btn btn-secondary"
                        disabled={currentQuestionIndex === 0 || evaluating}
                    >
                        ← Previous
                    </button>

                    <button 
                        onClick={submitAnswer}
                        className="btn btn-primary"
                        disabled={evaluating || (!answer && !code && !recordedAnswer)}
                    >
                        {evaluating ? '⏳ Evaluating...' : (
                            currentQuestionIndex === session.questions.length - 1 
                                ? 'Finish & Get Feedback' 
                                : 'Next Question →'
                        )}
                    </button>
                </div>
            </motion.div>
        </div>
    );
}
