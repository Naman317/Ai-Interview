import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import api from '../utils/api';
import { motion } from 'framer-motion';

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
                const response = await api.get(`/api/sessions/${sessionId}`);
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
            await api.post('/api/sessions/submit-answer', {
                sessionId,
                questionIndex: currentQuestionIndex,
                answerText: answer,
                code: code,
                audioPath: recordedAnswer
            });

            // Evaluation is now handled by the backend during session processing
            
            // Move to next question or complete
            if (currentQuestionIndex < session.questions.length - 1) {
                setCurrentQuestionIndex(currentQuestionIndex + 1);
                setAnswer('');
                setCode('');
                setRecordedAnswer('');
                setTimeLeft(180);
            } else {
                // All questions answered
                await api.post(`/api/sessions/${sessionId}/end`);
                navigate(`/review/${sessionId}`);
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
            <div className="flex flex-col items-center justify-center min-h-[80vh] bg-surface">
                <div className="w-12 h-12 border-4 border-gray-200 border-t-accent rounded-full animate-spin mb-4 shadow-sm"></div>
                <p className="text-gray-500 font-medium animat-pulse">Initializing interview environment...</p>
            </div>
        );
    }

    if (!session) {
        return (
            <div className="flex bg-surface min-h-[80vh] items-center justify-center p-8">
                <div className="bg-white border border-red-100 p-8 rounded-2xl text-center shadow-card max-w-md">
                    <p className="text-red-600 font-bold text-lg mb-2">Error Occurred</p>
                    <p className="text-gray-500 text-sm">Failed to load interview session. Please return to the dashboard and try again.</p>
                </div>
            </div>
        );
    }

    const currentQuestion = session.questions[currentQuestionIndex];
    const progressPercent = ((currentQuestionIndex + 1) / session.questions.length) * 100;
    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;

    return (
        <div className="max-w-5xl mx-auto p-8 font-sans">
            {/* Header */}
            <header className="bg-white border border-gray-200 p-8 rounded-2xl mb-8 shadow-card overflow-hidden relative">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative z-10">
                    <div className="space-y-4 flex-1 w-full">
                        <div className="flex items-center gap-2">
                             <span className="text-accent font-semibold text-xs uppercase tracking-widest">Live Session</span>
                             <span className="text-gray-300">•</span>
                             <span className="text-gray-500 text-xs font-medium uppercase tracking-widest">{session.level} Level</span>
                        </div>
                        <h1 className="text-3xl font-bold text-primary">{session.role} Interview</h1>
                        
                        <div className="space-y-2">
                            <div className="flex justify-between text-[10px] font-black text-gray-400 uppercase tracking-widest">
                                <span>Progress: {Math.round(progressPercent)}%</span>
                                <span>Question {currentQuestionIndex + 1} of {session.questions.length}</span>
                            </div>
                            <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                <motion.div 
                                    className="h-full bg-accent shadow-[0_0_10px_rgba(37,99,235,0.3)]" 
                                    layoutId="progress-bar"
                                    initial={{ width: 0 }}
                                    animate={{ width: `${progressPercent}%` }}
                                    transition={{ duration: 0.5 }}
                                ></motion.div>
                            </div>
                        </div>
                    </div>
                    
                    <div className="flex flex-col items-center bg-gray-50 border border-gray-100 p-6 rounded-2xl min-w-[140px] shadow-sm">
                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Time Remaining</span>
                        <div className={`text-4xl font-mono font-bold tracking-tighter ${timeLeft < 60 ? 'text-red-500 animate-pulse' : 'text-accent'}`}>
                            {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <motion.div 
                className="space-y-8"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
            >
                {/* Question Display */}
                <div className="bg-white p-10 rounded-2xl shadow-card border border-gray-100 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-8 opacity-[0.03] select-none pointer-events-none group-hover:opacity-[0.05] transition-opacity">
                         <span className="text-9xl font-black text-gray-900 leading-none">{currentQuestionIndex + 1}</span>
                    </div>
                    <div className="relative z-10">
                        <span className="text-accent font-black text-[10px] uppercase tracking-[0.2em] block mb-4">Interviewer Asks:</span>
                        <h2 className="text-2xl sm:text-3xl font-bold text-primary leading-snug">
                            {typeof currentQuestion === 'string' ? currentQuestion : currentQuestion.questionText}
                        </h2>
                        <div className="mt-6 flex items-center gap-3">
                            <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border transition-colors ${
                                currentQuestion.questionType === 'coding' 
                                ? 'bg-indigo-50 text-indigo-600 border-indigo-100' 
                                : 'bg-emerald-50 text-emerald-600 border-emerald-100'
                            }`}>
                                {currentQuestion.questionType === 'coding' ? '💻 Coding Performance' : '🎤 Oral Discussion'}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Answer Input */}
                <div className="bg-white p-10 rounded-2xl shadow-card border border-gray-100">
                    {currentQuestion.questionType === 'coding' ? (
                        <div className="space-y-6">
                            <div className="relative">
                                <textarea
                                    value={code}
                                    onChange={(e) => setCode(e.target.value)}
                                    placeholder="Implement your solution here..."
                                    className="w-full min-h-[400px] p-8 bg-gray-900 text-gray-100 rounded-2xl font-mono text-sm leading-relaxed focus:ring-4 focus:ring-indigo-500/10 focus:outline-none border-b-8 border-indigo-900/50 shadow-inner"
                                />
                                <div className="absolute top-4 right-4 px-3 py-1 bg-white/10 backdrop-blur-md rounded text-white/40 text-[10px] font-mono tracking-widest border border-white/5 uppercase">
                                    Source
                                </div>
                            </div>
                            <div className="flex items-center gap-3 p-5 bg-indigo-50 border border-indigo-100 rounded-xl">
                                <span className="text-lg">💡</span>
                                <p className="text-indigo-600 font-medium text-xs leading-relaxed">
                                    Tip: Focus on time complexity and handle edge cases appropriately.
                                </p>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-8">
                            <div className="relative">
                                <textarea
                                    value={answer}
                                    onChange={(e) => setAnswer(e.target.value)}
                                    placeholder="Type your response here, or use the microphone to dictate..."
                                    className="w-full min-h-[250px] p-8 bg-gray-50 border border-gray-100 rounded-2xl focus:border-accent focus:ring-4 focus:ring-accent/5 focus:outline-none transition-all text-gray-700 leading-relaxed text-lg italic"
                                />
                            </div>
                            
                            <div className="flex flex-col sm:flex-row items-center gap-6 p-2">
                                {!recording ? (
                                    <button 
                                        onClick={startRecording}
                                        className="w-full sm:flex-1 py-4 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-xl text-xs uppercase tracking-[0.2em] transition-all shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-3 disabled:opacity-50"
                                        disabled={evaluating}
                                    >
                                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                                        </svg>
                                        Start Recording
                                    </button>
                                ) : (
                                    <button 
                                        onClick={stopRecording}
                                        className="w-full sm:flex-1 py-4 bg-red-500 hover:bg-red-600 text-white font-black rounded-xl text-xs uppercase tracking-[0.2em] transition-all shadow-lg shadow-red-500/20 flex items-center justify-center gap-3 animate-pulse"
                                    >
                                        <div className="w-3 h-3 bg-white rounded-full"></div>
                                        Stop Recording
                                    </button>
                                )}
                                
                                {recordedAnswer && (
                                    <div className="flex items-center gap-2 px-6 py-2 bg-emerald-50 border border-emerald-100 rounded-full">
                                        <div className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce"></div>
                                        <span className="text-emerald-600 font-bold text-xs uppercase tracking-widest">Captured</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-4 justify-between items-center pt-10">
                    <button 
                        onClick={() => setCurrentQuestionIndex(Math.max(0, currentQuestionIndex - 1))}
                        className="w-full sm:w-auto px-8 py-4 bg-white border border-gray-200 text-gray-500 hover:text-gray-900 hover:bg-gray-50 hover:border-gray-300 rounded-2xl font-bold transition-all disabled:opacity-30 disabled:cursor-not-allowed group flex items-center justify-center gap-2"
                        disabled={currentQuestionIndex === 0 || evaluating}
                    >
                        <span className="group-hover:-translate-x-1 transition-transform">←</span>
                        Previous
                    </button>

                    <button 
                        onClick={submitAnswer}
                        className="w-full sm:w-auto px-12 py-5 bg-accent hover:bg-blue-700 text-white font-black rounded-2xl uppercase tracking-[0.3em] text-xs transition-all shadow-2xl shadow-accent/20 disabled:opacity-50 flex items-center justify-center gap-3 group"
                        disabled={evaluating || (!answer && !code && !recordedAnswer)}
                    >
                        {evaluating ? (
                            <>
                                <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                                Processing...
                            </>
                        ) : (
                            <>
                                {currentQuestionIndex === session.questions.length - 1 
                                    ? 'Complete Session' 
                                    : 'Next Question'}
                                <span className="group-hover:translate-x-1 transition-transform">→</span>
                            </>
                        )}
                    </button>
                </div>
            </motion.div>
        </div>
    );
}

