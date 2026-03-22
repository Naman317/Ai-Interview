import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../utils/api';
import WebRTCVideoRecorder from '../components/WebRTCVideoRecorder';
import InterviewReport from '../components/InterviewReport';
import Sidebar from '../components/Sidebar';
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
      <div className="flex bg-black min-h-screen text-white">
        <Sidebar />
        <main className="flex-1 ml-64 flex items-center justify-center p-8">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-blue-600 border-white/10" />
        </main>
      </div>
    );
  }

  if (showReport) {
    return (
      <div className="flex bg-black min-h-screen text-white">
        <Sidebar />
        <main className="flex-1 ml-64 p-8 overflow-auto">
          <div className="max-w-4xl mx-auto">
            <InterviewReport
              sessionId={sessionId}
              onClose={() => navigate('/dashboard')}
            />
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex bg-black min-h-screen text-white">
      <Sidebar />

      <main className="flex-1 ml-64 p-8 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="mb-8 p-6 bg-slate-900/30 rounded-3xl border border-slate-800/50">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-3xl font-black mb-1">Video Interview</h1>
              <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px]">
                {session.role} • {session.level} Level
              </p>
            </div>
            <button
              onClick={() => setAiVoiceEnabled(!aiVoiceEnabled)}
              className={`px-4 py-2 rounded-xl font-black text-xs uppercase tracking-widest border transition-all ${aiVoiceEnabled ? 'bg-blue-600 border-blue-600 text-white' : 'bg-slate-900 border-slate-800 text-slate-500'
                }`}
            >
              {aiVoiceEnabled ? 'AI Voice ON' : 'AI Voice OFF'}
            </button>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-[10px] font-black text-slate-600 uppercase tracking-widest">
              <span>Question {currentQuestionIndex + 1} of {questions.length}</span>
              <span>{Math.round(progress)}% Complete</span>
            </div>
            <div className="w-full bg-slate-950 rounded-full h-1.5 overflow-hidden">
              <motion.div
                animate={{ width: `${progress}%` }}
                className="bg-blue-600 h-full shadow-[0_0_10px_rgba(37,99,235,0.5)]"
              />
            </div>
          </div>
        </header>

        {/* Content Area */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-8 overflow-hidden min-h-0">
          <div className="flex flex-col gap-6 overflow-auto pr-2">
            {/* Question Card */}
            <motion.div
              key={currentQuestionIndex}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-slate-900/50 border border-slate-800 p-10 rounded-[2.5rem] relative overflow-hidden"
            >
              <span className="text-blue-500 font-black text-xs uppercase tracking-[0.2em] mb-4 block">Question Context</span>
              <h2 className="text-2xl font-bold leading-relaxed">{currentQuestionText}</h2>
            </motion.div>

            {/* Navigation / Actions */}
            <div className="mt-auto flex gap-4">
              <button
                onClick={handleSkipQuestion}
                disabled={currentQuestionIndex >= questions.length - 1}
                className="flex-1 py-4 bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-white font-black text-xs uppercase tracking-widest rounded-2xl transition-all disabled:opacity-20"
              >
                Skip Question
              </button>
              <button
                onClick={handleFinishInterview}
                className="flex-1 py-4 bg-red-600/10 border border-red-600/20 text-red-500 hover:bg-red-600 hover:text-white font-black text-xs uppercase tracking-widest rounded-2xl transition-all shadow-xl shadow-red-600/5"
              >
                Finish Early
              </button>
            </div>
          </div>

          <div className="bg-slate-900/50 border border-slate-800 rounded-[2.5rem] p-6 flex flex-col min-h-[400px]">
            <WebRTCVideoRecorder
              question={currentQuestionText}
              sessionId={sessionId}
              onSubmit={handleVideoSubmit}
              maxDuration={180}
            />
          </div>
        </div>
      </main>
    </div>
  );
}
