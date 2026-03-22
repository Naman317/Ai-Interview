import React, { useEffect, useState, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useParams, useNavigate } from 'react-router-dom';
import { getSessionById, submitAnswer, endSession } from '../features/sessions/sessionSlice';
import CodingSheet from '../components/CodingSheet';
import Sidebar from '../components/Sidebar';
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

  const recognitionRef = useRef(null);
  const transcriptRef = useRef('');
  const timerIntervalRef = useRef(null);

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

  const startRecording = () => {
    if (!recognitionRef.current) {
      toast.error('Web Speech API not available');
      return;
    }
    transcriptRef.current = '';
    setTranscript('');
    recognitionRef.current.start();
    setIsRecording(true);
    setRecordingTime(0);
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
        // Send transcript (not audio) to backend
        await dispatch(submitAnswer({
          sessionId,
          formData: {
            transcript: finalTranscript,
            questionIndex: currentQuestionIndex
          }
        })).unwrap();

        setSubmittedLocal(prev => ({ ...prev, [currentQuestionIndex]: true }));
        toast.success('Answer submitted! Analyzing...');

        const questions = activeSession?.questions || [];
        if (currentQuestionIndex < questions.length - 1) {
          setTimeout(() => {
            setCurrentQuestionIndex(prev => prev + 1);
          }, 1000);
        }
      } catch (err) {
        console.error('Submit error:', err);
        toast.error('Failed to submit answer');
      }
    }, 500);
  };

  if (activeSession?.status === 'pending' || isLoading) {
    return (
      <div className="flex bg-black min-h-screen text-white">
        <Sidebar />
        <main className="flex-1 ml-64 flex flex-col items-center justify-center p-8">
          <div className="max-w-md w-full text-center space-y-6">
            <div className="relative w-24 h-24 mx-auto">
              <div className="absolute inset-0 border-4 border-blue-600/20 rounded-full" />
              <div className="absolute inset-0 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-bold">Generating Interview</h2>
              <p className="text-slate-500 font-medium">AI is crafting personalized questions for you based on the selected role and difficulty...</p>
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (!activeSession) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-black text-white">
        <p className="text-slate-400 font-bold uppercase tracking-widest">Session not found</p>
      </div>
    );
  }

  const isAnswered = submittedLocal[currentQuestionIndex];

  return (
    <div className="flex bg-black min-h-screen text-white overflow-hidden">
      <Sidebar />

      <main className="flex-1 ml-64 flex flex-col">
        {/* Header */}
        <header className="p-8 border-b border-slate-900 bg-black/50 backdrop-blur-md sticky top-0 z-40">
          <div className="flex justify-between items-start mb-6">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <span className="px-3 py-1 bg-blue-600/10 text-blue-500 text-[10px] font-black uppercase tracking-widest rounded-lg border border-blue-500/20">
                  {activeSession.interviewType}
                </span>
                <span className="text-slate-500 text-xs font-bold uppercase tracking-widest">• {activeSession.level}</span>
              </div>
              <h1 className="text-3xl font-black">{activeSession.role}</h1>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowCodingSheet(!showCodingSheet)}
                className={`p-3 rounded-xl border transition-all ${showCodingSheet ? 'bg-blue-600 border-blue-600 text-white' : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'}`}
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
                        // Show success message
                        toast.success('Interview saved successfully!');
                        // Redirect to dashboard after short delay
                        setTimeout(() => {
                          navigate('/dashboard');
                        }, 1000);
                      }
                    } catch (error) {
                      toast.error('Failed to end interview: ' + (error || 'Unknown error'));
                    }
                  }
                }}
                className="p-3 rounded-xl bg-red-600/10 border border-red-600/20 text-red-500 hover:bg-red-600 hover:text-white transition-all font-bold text-xs uppercase tracking-widest"
              >
                Exit
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-[10px] font-black text-slate-500 uppercase tracking-widest">
              <span>Progress: {Math.round(progress)}%</span>
              <span>Question {currentQuestionIndex + 1} of {totalQuestions}</span>
            </div>
            <div className="w-full bg-slate-900 rounded-full h-1.5 overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                className="bg-blue-600 h-full"
              />
            </div>
          </div>
        </header>

        {/* Content Area */}
        <div className="flex-1 overflow-auto p-8 relative">
          <div className="max-w-3xl mx-auto space-y-10">
            {/* Question Section */}
            <motion.div
              key={currentQuestionIndex}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-slate-900/50 border border-slate-800 rounded-3xl p-10 shadow-2xl relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 p-6 opacity-5">
                <span className="text-8xl font-black">{currentQuestionIndex + 1}</span>
              </div>

              <div className="relative z-10 space-y-4">
                <span className="text-blue-500 font-black text-xs uppercase tracking-[0.2em]">Interviewer asks:</span>
                <h2 className="text-3xl font-bold leading-tight text-white group-hover:text-blue-400 transition-colors">
                  {currentQuestionText}
                </h2>
              </div>
            </motion.div>

            {/* Interaction Section */}
            <div className="space-y-6">
              {isRecording && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center justify-center gap-4 py-8 bg-red-600/5 border-2 border-dashed border-red-600/20 rounded-3xl"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-3 h-3 bg-red-600 rounded-full animate-pulse shadow-[0_0_15px_rgba(220,38,38,0.5)]" />
                    <span className="text-3xl font-black font-mono tracking-tighter text-red-500">{formatTime(recordingTime)}</span>
                  </div>
                  <p className="text-red-500/60 font-black text-xs uppercase tracking-widest">Recording in progress</p>
                </motion.div>
              )}

              {transcript && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-6 bg-blue-600/5 border border-blue-600/20 rounded-3xl"
                >
                  <p className="text-[10px] font-black text-blue-500 uppercase tracking-widest mb-3">Live Transcript</p>
                  <p className="text-white leading-relaxed text-lg font-medium">{transcript}{isListening && <span className="animate-pulse">▌</span>}</p>
                </motion.div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {!isRecording ? (
                  <>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={startRecording}
                      disabled={isAnswered}
                      className={`flex items-center justify-center gap-3 py-6 rounded-2xl font-black uppercase tracking-widest text-sm transition-all shadow-xl ${isAnswered
                          ? 'bg-slate-900 border border-slate-800 text-slate-700 cursor-not-allowed'
                          : 'bg-red-600 hover:bg-red-700 text-white shadow-red-600/20'
                        }`}
                    >
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
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
                      className="flex items-center justify-center gap-3 py-6 rounded-2xl font-black uppercase tracking-widest text-sm bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:border-slate-700 transition-all"
                    >
                      {currentQuestionIndex < totalQuestions - 1 ? 'Skip Question' : 'Finish Interview'}
                    </motion.button>
                  </>
                ) : (
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={stopRecording}
                    className="col-span-1 md:col-span-2 flex items-center justify-center gap-3 py-6 rounded-2xl font-black uppercase tracking-widest text-sm bg-green-600 hover:bg-green-700 text-white shadow-xl shadow-green-600/20 transition-all"
                  >
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M6 6h12v12H6z" />
                    </svg>
                    Stop & Submit Answer
                  </motion.button>
                )}
              </div>

              <div className="p-4 bg-blue-600/5 border border-blue-600/10 rounded-2xl text-center">
                <p className="text-[10px] font-black text-blue-500 uppercase tracking-widest">
                  Tip: Take a deep breath and explain your thought process clearly.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Notes/Coding Sheet Overlay */}
        <AnimatePresence>
          {showCodingSheet && (
            <div className="absolute top-0 right-0 w-full h-full pointer-events-none overflow-hidden z-50">
              <CodingSheet isOpen={showCodingSheet} onClose={() => setShowCodingSheet(false)} />
            </div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}

export default InterviewRunner;
