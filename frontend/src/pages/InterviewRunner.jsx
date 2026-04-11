import React, { useEffect, useState, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useParams, useNavigate } from 'react-router-dom';
import { getSessionById, submitAnswer, endSession } from '../features/sessions/sessionSlice';
import CodingSheet from '../components/CodingSheet';
import { toast } from 'react-toastify';
import { motion, AnimatePresence } from 'framer-motion';

function InterviewRunner() {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const { activeSession, isLoading } = useSelector(state => state.sessions);

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [showCodingSheet, setShowCodingSheet] = useState(false);
  const [submittedLocal, setSubmittedLocal] = useState({});
  const [transcript, setTranscript] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [evaluationResults, setEvaluationResults] = useState({});
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [pollingInterval, setPollingInterval] = useState(null);

  const recognitionRef = useRef(null);
  const transcriptRef = useRef('');
  const timerIntervalRef = useRef(null);
  const pollCountRef = useRef(0);

  // Initialize Web Speech API
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        setIsListening(true);
        transcriptRef.current = '';
        setTranscript('');
      };

      recognition.onresult = (event) => {
        let interimTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            transcriptRef.current += transcript + ' ';
          } else {
            interimTranscript += transcript;
          }
        }
        setTranscript(transcriptRef.current + interimTranscript);
      };

      recognition.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        toast.error(`Microphone error: ${event.error}`);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    } else {
      toast.error('Web Speech API not supported in this browser');
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
    };
  }, []);

  useEffect(() => {
    dispatch(getSessionById(sessionId));
  }, [dispatch, sessionId]);

  // Handle real-time updates for question generation
  useEffect(() => {
    if (activeSession?.status === 'pending') {
      const interval = setInterval(() => {
        dispatch(getSessionById(sessionId));
      }, 3000);
      return () => clearInterval(interval);
    }
  }, [activeSession?.status, dispatch, sessionId]);

  // Poll for evaluation results
  useEffect(() => {
    let pollTimer;
    if (isEvaluating && sessionId) {
      pollCountRef.current = 0;
      pollTimer = setInterval(() => {
        pollCountRef.current += 1;
        // Refresh session to get latest evaluation
        dispatch(getSessionById(sessionId));
      }, 1000);
    }
    return () => {
      if (pollTimer) clearInterval(pollTimer);
    };
  }, [isEvaluating, sessionId, dispatch]);

  // Check if evaluation is complete
  useEffect(() => {
    if (isEvaluating && activeSession?.questions?.[currentQuestionIndex]) {
      const currentQuestion = activeSession.questions[currentQuestionIndex];

      if (currentQuestion?.isEvaluated && !evaluationResults[currentQuestionIndex]) {
        setEvaluationResults(prev => ({
          ...prev,
          [currentQuestionIndex]: {
            technicalScore: currentQuestion.technicalScore || 0,
            confidenceScore: currentQuestion.confidenceScore || 0,
            aiFeedback: currentQuestion.aiFeedback || 'Pending evaluation...',
            idealAnswer: currentQuestion.idealAnswer || 'Pending...',
            userAnswerText: currentQuestion.userAnswerText || ''
          }
        }));
        setIsEvaluating(false);
      }
    }
  }, [activeSession, currentQuestionIndex, isEvaluating, evaluationResults]);

  useEffect(() => {
    if (isRecording) {
      timerIntervalRef.current = setInterval(() => {
        setRecordingTime(t => t + 1);
      }, 1000);
    } else {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    }
    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, [isRecording]);

  const questions = activeSession?.questions || [];
  const currentQuestionObj = questions[currentQuestionIndex];
  const currentQuestionText = typeof currentQuestionObj === 'string'
    ? currentQuestionObj
    : currentQuestionObj?.questionText;

  const totalQuestions = questions.length || 0;
  const progress = totalQuestions > 0 ? ((currentQuestionIndex + 1) / totalQuestions) * 100 : 0;

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const startRecording = async () => {
    if (!recognitionRef.current) {
      toast.error('Web Speech API not available in your browser.');
      return;
    }

    // Explicitly request microphone permission to ensure the browser doesn't silent-block Web Speech API
    try {
      await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch (err) {
      toast.error('Microphone permission denied. Please allow microphone access in your browser settings to continue.');
      return;
    }

    transcriptRef.current = '';
    setTranscript('');
    try {
      recognitionRef.current.start();
      setIsRecording(true);
      setRecordingTime(0);
    } catch (err) {
      console.error('Recognition start error:', err);
      // If it's already started, this catches it
    }
  };

  const stopRecording = async () => {
    if (!recognitionRef.current) return;

    recognitionRef.current.stop();
    setIsRecording(false);

    // Wait a moment for final results
    setTimeout(async () => {
      const finalTranscript = transcriptRef.current.trim();

      if (!finalTranscript) {
        toast.error('No speech detected. Please try again.');
        return;
      }

      try {
        setIsEvaluating(true);
        pollCountRef.current = 0;

        // Send transcript (not audio) to backend
        await dispatch(submitAnswer({
          sessionId,
          formData: {
            transcript: finalTranscript,
            questionIndex: currentQuestionIndex
          }
        })).unwrap();

        setSubmittedLocal(prev => ({ ...prev, [currentQuestionIndex]: true }));
        toast.success('Answer submitted! AI is analyzing...');

        // Immediately start polling for results
        dispatch(getSessionById(sessionId));

      } catch (err) {
        console.error('Submit error:', err);
        setIsEvaluating(false);
        toast.error('Failed to submit answer');
      }
    }, 500);
  };

  if (activeSession?.status === 'pending' || isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[80vh] bg-surface">
        <div className="bg-white shadow-card border border-gray-100 rounded-3xl max-w-md w-full text-center space-y-6 p-12">
          <div className="relative w-24 h-24 mx-auto">
            <div className="absolute inset-0 border-4 border-blue-50 rounded-full" />
            <div className="absolute inset-0 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-black text-gray-900">Generating Interview</h2>
            <p className="text-gray-500 font-medium text-sm">AI is crafting personalized questions for you based on the selected role and difficulty...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!activeSession) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-surface text-gray-900 font-sans">
        <p className="text-gray-500 font-bold uppercase tracking-widest bg-gray-100 px-6 py-3 rounded-full">Session not found</p>
      </div>
    );
  }

  const isAnswered = submittedLocal[currentQuestionIndex];

  return (
    <div className="max-w-5xl mx-auto p-8 font-sans">
      {/* Header */}
      <header className="bg-white border border-gray-200 p-8 rounded-2xl mb-8 shadow-card overflow-hidden relative">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative z-10">
          <div className="space-y-4 flex-1 w-full">
            <div className="flex items-center gap-2">
              <span className="text-accent font-semibold text-xs uppercase tracking-widest">{activeSession.interviewType} Session</span>
              <span className="text-gray-300">•</span>
              <span className="text-gray-500 text-xs font-medium uppercase tracking-widest">{activeSession.level} Level</span>
            </div>
            <h1 className="text-3xl font-bold text-primary">{activeSession.role}</h1>

            <div className="space-y-2">
              <div className="flex justify-between text-[10px] font-black text-gray-400 uppercase tracking-widest">
                <span>Progress: {Math.round(progress)}%</span>
                <span>Question {currentQuestionIndex + 1} of {totalQuestions}</span>
              </div>
              <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  className="bg-accent h-full shadow-[0_0_10px_rgba(37,99,235,0.3)]"
                />
              </div>
            </div>
          </div>

          <div className="flex gap-4 items-center">
            <div className="flex flex-col items-center bg-gray-50 border border-gray-100 p-4 rounded-xl min-w-[100px]">
              <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Status</span>
              <span className="text-xs font-bold text-emerald-600 uppercase">Live</span>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setShowCodingSheet(!showCodingSheet)}
                className={`p-4 rounded-xl border transition-all ${showCodingSheet ? 'bg-accent border-accent text-white shadow-lg' : 'bg-white border-gray-200 text-gray-600 hover:text-accent hover:border-accent/20'}`}
                title="Open Notes/Coding Area"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </button>
              <button
                onClick={async () => {
                  if (window.confirm('Are you sure you want to exit? Your progress will be saved.')) {
                    try {
                      const result = await dispatch(endSession(sessionId)).unwrap();
                      if (result.success !== false) {
                        toast.success('Interview saved successfully!');
                        setTimeout(() => {
                          navigate('/dashboard');
                        }, 1000);
                      }
                    } catch (error) {
                      toast.error('Failed to end interview: ' + (error || 'Unknown error'));
                    }
                  }
                }}
                className="px-6 py-4 rounded-xl bg-red-50 text-red-600 border border-red-100 font-black text-xs uppercase tracking-widest hover:bg-red-600 hover:text-white transition-all shadow-sm"
              >
                Exit
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Content Area */}
      <div className="space-y-8 mt-8">
        {/* Question Section */}
        <motion.div
          key={currentQuestionIndex}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white shadow-card border border-gray-100 rounded-3xl p-10 relative overflow-hidden group"
        >
          <div className="absolute top-0 right-0 p-8 opacity-[0.03] select-none pointer-events-none group-hover:opacity-[0.05] transition-opacity">
            <span className="text-9xl font-black text-gray-900 leading-none">{currentQuestionIndex + 1}</span>
          </div>

          <div className="relative z-10 space-y-4">
            <span className="text-accent font-black text-[10px] uppercase tracking-[0.2em]">Interviewer asks:</span>
            <h2 className="text-3xl font-bold leading-tight text-primary group-hover:text-accent transition-colors duration-300">
              {currentQuestionText}
            </h2>
          </div>
        </motion.div>

        {/* Interaction Section */}
        <div className="bg-white p-10 rounded-3xl shadow-card border border-gray-100 space-y-8">
          {isRecording && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center justify-center gap-6 py-10 bg-red-50/50 border-2 border-dashed border-red-200 rounded-3xl shadow-inner"
            >
              <div className="flex items-center gap-4">
                <span className="w-4 h-4 bg-red-600 rounded-full animate-pulse shadow-[0_0_15px_rgba(220,38,38,0.5)]" />
                <span className="text-5xl font-black font-mono tracking-tighter text-red-600">{formatTime(recordingTime)}</span>
              </div>
              <p className="text-red-500 font-black text-xs uppercase tracking-[0.2em]">Live Recording</p>
            </motion.div>
          )}

          {transcript && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-8 bg-blue-50/50 border border-blue-100 rounded-2xl shadow-sm"
            >
              <p className="text-[10px] font-black text-accent uppercase tracking-widest mb-4 flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-accent rounded-full animate-pulse"></div>
                Real-time Transcript
              </p>
              <p className="text-gray-800 leading-relaxed text-lg font-medium italic">"{transcript}{isListening && <span className="animate-pulse">▌</span>}"</p>
            </motion.div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {!isRecording ? (
              <>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={startRecording}
                  disabled={isAnswered}
                  className={`flex items-center justify-center gap-3 py-6 rounded-2xl font-black uppercase tracking-[0.2em] text-xs transition-all shadow-xl ${isAnswered
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200'
                    : 'bg-red-500 hover:bg-red-600 text-white shadow-red-500/20'
                    }`}
                >
                  <svg className="w-5 h-5 font-bold" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z" />
                    <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z" />
                  </svg>
                  Start Recording
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    if (currentQuestionIndex < totalQuestions - 1) {
                      setCurrentQuestionIndex(prev => prev + 1);
                    } else {
                      dispatch(endSession(sessionId));
                      navigate(`/review/${sessionId}`);
                    }
                  }}
                  className="flex items-center justify-center gap-3 py-6 rounded-2xl font-black uppercase tracking-[0.2em] text-xs bg-gray-50 border border-gray-100 text-gray-400 hover:text-gray-900 hover:border-gray-300 transition-all shadow-sm"
                >
                  {currentQuestionIndex < totalQuestions - 1 ? 'Skip Question' : 'Finish Interview'}
                  <span>→</span>
                </motion.button>
              </>
            ) : (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={stopRecording}
                className="col-span-1 md:col-span-2 flex items-center justify-center gap-3 py-6 rounded-2xl font-black uppercase tracking-[0.2em] text-xs bg-emerald-600 hover:bg-emerald-700 text-white shadow-xl shadow-emerald-600/20 transition-all"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M6 6h12v12H6z" />
                </svg>
                Stop & Submit Answer
              </motion.button>
            )}
          </div>

          <div className="flex items-center gap-3 p-5 bg-blue-50 border border-blue-100 rounded-xl">
            <span className="text-lg">💡</span>
            <p className="text-[10px] font-black text-accent uppercase tracking-widest leading-relaxed">
              Tip: Take a deep breath and explain your thought process clearly to the interviewer.
            </p>
          </div>

          {/* Evaluation Results Section */}
          {isEvaluating && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-10 bg-accent shadow-xl shadow-accent/20 rounded-3xl text-center space-y-6"
            >
              <div className="flex justify-center">
                <div className="w-10 h-10 border-4 border-white/20 border-t-white rounded-full animate-spin" />
              </div>
              <div className="space-y-2">
                <p className="text-xl font-black text-white uppercase tracking-widest">Analyzing Your Answer</p>
                <p className="text-xs text-white/70 font-medium uppercase tracking-[0.2em]">Our AI is evaluating your technical depth and confidence...</p>
              </div>
            </motion.div>
          )}

          {evaluationResults[currentQuestionIndex] && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              {/* Scores Grid */}
              <div className="grid grid-cols-2 gap-6">
                <div className="p-8 bg-gray-50 border border-gray-100 shadow-sm rounded-2xl text-center flex flex-col items-center justify-center">
                  <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Technical Score</span>
                  <p className="text-5xl font-black text-accent">{evaluationResults[currentQuestionIndex].technicalScore}%</p>
                </div>
                <div className="p-8 bg-gray-50 border border-gray-100 shadow-sm rounded-2xl text-center flex flex-col items-center justify-center">
                  <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Confidence Score</span>
                  <p className="text-5xl font-black text-purple-600">{evaluationResults[currentQuestionIndex].confidenceScore}%</p>
                </div>
              </div>

              {/* Feedback */}
              <div className="p-8 bg-gray-50 border border-gray-100 rounded-2xl space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-accent/10 rounded-lg flex items-center justify-center">
                    <div className="w-1.5 h-1.5 bg-accent rounded-full"></div>
                  </div>
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">AI Feedback</p>
                </div>
                <p className="text-gray-900 leading-relaxed text-sm font-medium">{evaluationResults[currentQuestionIndex].aiFeedback}</p>
              </div>

              {/* Ideal Answer */}
              <div className="p-8 bg-emerald-50/50 border border-emerald-100 rounded-2xl space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center">
                    <span className="text-emerald-600 text-xs">✓</span>
                  </div>
                  <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Ideal Answer</p>
                </div>
                <p className="text-gray-800 leading-relaxed text-sm italic">{evaluationResults[currentQuestionIndex].idealAnswer}</p>
              </div>

              {/* Your Submission */}
              <div className="p-8 bg-white border border-gray-100 rounded-2xl space-y-4 shadow-inner">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Your Answer</p>
                <p className="text-gray-700 leading-relaxed text-sm text-center italic">"{evaluationResults[currentQuestionIndex].userAnswerText}"</p>
              </div>

              {/* Continue Button */}
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  if (currentQuestionIndex < totalQuestions - 1) {
                    setCurrentQuestionIndex(prev => prev + 1);
                  } else {
                    dispatch(endSession(sessionId));
                    navigate(`/review/${sessionId}`);
                  }
                }}
                className="w-full py-6 bg-accent hover:bg-blue-700 text-white font-black rounded-2xl uppercase tracking-[0.2em] text-xs transition-all shadow-xl shadow-accent/20"
              >
                {currentQuestionIndex < totalQuestions - 1 ? '→ Next Question' : '✓ Finish Interview'}
              </motion.button>
            </motion.div>
          )}
        </div>
      </div>

      {/* Notes/Coding Sheet Overlay */}
      <AnimatePresence>
        {showCodingSheet && (
          <div className="absolute top-0 right-0 w-full h-full pointer-events-none overflow-hidden z-20">
            <CodingSheet isOpen={showCodingSheet} onClose={() => setShowCodingSheet(false)} />
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default InterviewRunner;
