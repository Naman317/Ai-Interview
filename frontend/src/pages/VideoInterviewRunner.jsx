import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../utils/api';
import WebRTCVideoRecorder from '../components/WebRTCVideoRecorder';
import InterviewReport from '../components/InterviewReport';
import { speakQuestion, stopSpeaking } from '../utils/tts';
import { motion, AnimatePresence } from 'framer-motion';

const DEFAULT_QUESTIONS = [
  "Tell me about your professional background and experience.",
  "Why are you interested in this role?",
  "Describe a challenging project you worked on and how you solved it.",
  "What are your strengths and weaknesses?",
];

export default function VideoInterviewRunner() {
  const { sessionId } = useParams();
  const navigate = useNavigate();

  const [session, setSession] = useState(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [completedQuestions, setCompletedQuestions] = useState(new Set());
  const [showReport, setShowReport] = useState(false);
  const [loading, setLoading] = useState(true);
  const [aiVoiceEnabled, setAiVoiceEnabled] = useState(true);

  useEffect(() => {
    if (sessionId) {
      fetchSession();
    } else {
      console.error('No sessionId found in params');
      navigate('/dashboard');
    }
  }, [sessionId]);

  useEffect(() => {
    if (aiVoiceEnabled && session && !showReport) {
      const questions = session.questions || DEFAULT_QUESTIONS;
      const questionText = typeof questions[currentQuestionIndex] === 'string'
        ? questions[currentQuestionIndex]
        : questions[currentQuestionIndex]?.questionText;

      if (questionText) {
        speakQuestion(questionText);
      }
    }
    return () => stopSpeaking();
  }, [currentQuestionIndex, aiVoiceEnabled, session, showReport]);

  const fetchSession = async () => {
    if (!sessionId || sessionId === 'undefined') {
      console.warn('Session ID is invalid');
      navigate('/dashboard');
      return;
    }
    try {
      const response = await api.get(`/api/sessions/${sessionId}`);
      setSession(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching session:', error);
      navigate('/dashboard');
    }
  };

  const questions = session?.questions || DEFAULT_QUESTIONS;
  const currentQuestionObj = questions[currentQuestionIndex];
  const currentQuestionText = typeof currentQuestionObj === 'string'
    ? currentQuestionObj
    : currentQuestionObj?.questionText;
  const progress = questions.length > 0 ? ((completedQuestions.size) / questions.length) * 100 : 0;

  const handleVideoSubmit = async (data) => {
    const newCompleted = new Set(completedQuestions);
    newCompleted.add(currentQuestionIndex);
    setCompletedQuestions(newCompleted);

    if (currentQuestionIndex < questions.length - 1) {
      setTimeout(() => setCurrentQuestionIndex(prev => prev + 1), 1000);
    } else {
      handleFinishInterview();
    }
  };

  const handleSkipQuestion = () => {
    stopSpeaking();
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    }
  };

  const handleFinishInterview = async () => {
    stopSpeaking();
    try {
      await api.post(`/api/sessions/${sessionId}/end`);
      setShowReport(true);
    } catch (error) {
      setShowReport(true);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[80vh] bg-surface">
        <div className="w-12 h-12 border-4 border-gray-200 border-t-accent rounded-full animate-spin mb-4 shadow-sm"></div>
        <p className="text-gray-500 font-medium">Preparing recording environment...</p>
      </div>
    );
  }

  if (showReport) {
    return (
      <div className="p-8 overflow-auto bg-surface min-h-[80vh] flex flex-col items-center">
        <div className="max-w-4xl w-full">
            <InterviewReport
              sessionId={sessionId}
              onClose={() => navigate('/dashboard')}
            />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-8 font-sans space-y-8">
        {/* Header */}
        <header className="bg-white border border-gray-200 p-8 rounded-3xl shadow-card relative overflow-hidden">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative z-10">
                <div className="space-y-4 flex-1 w-full">
                    <div className="flex items-center gap-2">
                        <span className="text-accent font-semibold text-xs uppercase tracking-widest">Live Video Session</span>
                        <span className="text-gray-300">•</span>
                        <span className="text-gray-500 text-xs font-medium uppercase tracking-widest">{session.level} Level</span>
                    </div>
                    <h1 className="text-3xl font-bold text-primary">{session.role} Interview</h1>
                    
                    <div className="space-y-2">
                        <div className="flex justify-between text-[10px] font-black text-gray-400 uppercase tracking-widest">
                            <span>Question {currentQuestionIndex + 1} of {questions.length}</span>
                            <span>{Math.round(progress)}% Complete</span>
                        </div>
                        <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
                            <motion.div
                                animate={{ width: `${progress}%` }}
                                className="bg-accent h-full shadow-[0_0_10px_rgba(37,99,235,0.3)]"
                            />
                        </div>
                    </div>
                </div>

                <div className="flex gap-3">
                    <button
                        onClick={() => setAiVoiceEnabled(!aiVoiceEnabled)}
                        className={`px-6 py-4 rounded-xl font-black text-[10px] uppercase tracking-widest border transition-all ${
                            aiVoiceEnabled 
                            ? 'bg-accent border-accent text-white shadow-lg' 
                            : 'bg-white border-gray-200 text-gray-500 hover:text-accent'
                        }`}
                    >
                        {aiVoiceEnabled ? 'AI Voice Active' : 'AI Voice Muted'}
                    </button>
                    <button
                        onClick={handleFinishInterview}
                        className="px-6 py-4 rounded-xl bg-red-50 text-red-600 border border-red-100 font-black text-[10px] uppercase tracking-widest hover:bg-red-600 hover:text-white transition-all shadow-sm"
                    >
                        Finish Early
                    </button>
                </div>
            </div>
        </header>

        {/* Content Area */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
          <div className="space-y-6">
            {/* Question Card */}
            <motion.div
              key={currentQuestionIndex}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white border border-gray-100 p-10 rounded-[2.5rem] shadow-card relative overflow-hidden group min-h-[250px] flex flex-col justify-center"
            >
              <div className="absolute top-0 right-0 p-8 opacity-[0.03] select-none pointer-events-none group-hover:opacity-[0.05] transition-opacity">
                <span className="text-9xl font-black text-gray-900 leading-none">{currentQuestionIndex + 1}</span>
              </div>
              <div className="relative z-10">
                <span className="text-accent font-black text-[10px] uppercase tracking-[0.2em] mb-4 block">Question Context</span>
                <h2 className="text-2xl font-bold text-primary leading-relaxed">{currentQuestionText}</h2>
              </div>
            </motion.div>

            {/* Navigation / Actions */}
            <div className="flex gap-4 p-2">
              <button
                onClick={handleSkipQuestion}
                disabled={currentQuestionIndex >= questions.length - 1}
                className="flex-1 py-5 bg-white border border-gray-200 text-gray-400 hover:text-gray-900 hover:border-gray-300 font-black text-[10px] uppercase tracking-widest rounded-2xl transition-all disabled:opacity-30 shadow-sm"
              >
                Skip Question
              </button>
              <div className="flex-[2] flex items-center justify-center p-4 bg-blue-50/50 border border-blue-100 rounded-2xl">
                 <p className="text-[10px] font-black text-accent uppercase tracking-[0.2em] leading-relaxed text-center">
                    Record your video response. 🎙️
                 </p>
              </div>
            </div>
          </div>

          <div className="bg-white border border-gray-100 rounded-[2.5rem] p-8 shadow-card flex flex-col min-h-[500px] relative">
            <div className="absolute top-6 left-6 flex items-center gap-2 z-10">
                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.5)]"></div>
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Live Studio</span>
            </div>
            
            <div className="flex-1 rounded-2xl overflow-hidden bg-gray-50 border border-gray-200 shadow-inner">
                <WebRTCVideoRecorder
                  question={currentQuestionText}
                  sessionId={sessionId}
                  onSubmit={handleVideoSubmit}
                  maxDuration={180}
                />
            </div>
          </div>
        </div>
    </div>
  );
}

