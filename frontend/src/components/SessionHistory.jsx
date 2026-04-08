import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { createSession, deleteSession } from '../features/sessions/sessionSlice';

export default function SessionHistory({ sessions = [] }) {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [expandedId, setExpandedId] = useState(null);

  const getStatusStyle = (status) => {
    switch (status) {
      case 'completed':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'in-progress':
        return 'text-amber-600 bg-amber-50 border-amber-200';
      case 'failed':
        return 'text-red-600 bg-red-50 border-red-200';
      default:
        return 'text-gray-500 bg-gray-50 border-gray-200';
    }
  };

  const getScoreColor = (score) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-amber-600';
    return 'text-red-600';
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleRestart = async (session) => {
    try {
      const result = await dispatch(createSession({
        role: session.role,
        level: session.level,
        interviewType: session.interviewType || 'oral',
      })).unwrap();
      navigate(`/interview/${result._id}`);
    } catch (error) {
      console.error('Failed to restart interview:', error);
    }
  };

  const handleReview = (sessionId) => {
    navigate(`/review/${sessionId}`);
  };

  if (!sessions || sessions.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 bg-gray-50 rounded-2xl mx-auto flex items-center justify-center mb-4">
          <svg className="w-8 h-8 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
        </div>
        <p className="text-gray-400 text-sm">No interview sessions yet. Start your first interview!</p>
      </div>
    );
  }

  return (
    <div className="space-y-3 max-h-96 overflow-y-auto">
      {sessions.map((session, idx) => (
        <motion.div
          key={session._id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: idx * 0.05 }}
          className="group relative p-4 rounded-xl bg-white border border-gray-200 hover:border-gray-300 hover:shadow-sm transition-all cursor-pointer"
          onClick={() => setExpandedId(expandedId === session._id ? null : session._id)}
        >
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h3 className="font-semibold text-gray-900 text-sm">{session.role}</h3>
                <span className={`text-xs px-2.5 py-0.5 rounded-full border font-medium ${getStatusStyle(session.status)}`}>
                  {session.status}
                </span>
              </div>
              <p className="text-xs text-gray-400">
                {formatDate(session.createdAt || new Date().toISOString())}
              </p>
              
              {expandedId === session._id && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-3 pt-3 border-t border-gray-100 space-y-2"
                >
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <p className="text-gray-400">Level</p>
                      <p className="text-gray-900 font-medium">{session.level}</p>
                    </div>
                    <div>
                      <p className="text-gray-400">Type</p>
                      <p className="text-gray-900 font-medium capitalize">{session.interviewType || 'oral'}</p>
                    </div>
                    {session.overallScore !== undefined && (
                      <div>
                        <p className="text-gray-400">Overall Score</p>
                        <p className={`font-bold ${getScoreColor(session.overallScore)}`}>
                          {session.overallScore}/100
                        </p>
                      </div>
                    )}
                    {session.metrics?.avgTechnical !== undefined && (
                      <div>
                        <p className="text-gray-400">Technical</p>
                        <p className="text-accent font-medium">{session.metrics.avgTechnical}/100</p>
                      </div>
                    )}
                  </div>
                  {session.questions && (
                    <div>
                      <p className="text-gray-400 text-xs">Questions Evaluated: {session.questions.filter(q => q.isEvaluated).length}/{session.questions.length}</p>
                    </div>
                  )}
                </motion.div>
              )}
            </div>

            <div className={`flex gap-2 ${expandedId === session._id ? 'flex-col' : 'flex-col sm:flex-row'}`}>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (window.confirm('Are you sure you want to delete this session?')) {
                    dispatch(deleteSession(session._id));
                  }
                }}
                className="px-3 py-1.5 text-xs font-medium bg-red-50 border border-red-200 text-red-600 rounded-lg hover:bg-red-600 hover:text-white transition-all shadow-sm"
                title="Delete Session"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleReview(session._id);
                }}
                className="px-3 py-1.5 text-xs font-medium bg-accent/10 border border-accent/30 text-accent rounded-lg hover:bg-accent hover:text-white transition-all shadow-sm"
              >
                Review
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleRestart(session);
                }}
                className="px-3 py-1.5 text-xs font-medium bg-green-50 border border-green-200 text-green-600 rounded-lg hover:bg-green-600 hover:text-white transition-all shadow-sm"
              >
                Restart
              </button>
            </div>
          </div>

          {/* Score indicator bar */}
          {session.overallScore !== undefined && (
            <div className="mt-3 h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${session.overallScore}%` }}
                transition={{ delay: 0.2, duration: 0.5 }}
                className={`h-full rounded-full ${
                  session.overallScore >= 80
                    ? 'bg-green-500'
                    : session.overallScore >= 60
                    ? 'bg-amber-500'
                    : 'bg-red-500'
                }`}
              />
            </div>
          )}
        </motion.div>
      ))}
    </div>
  );
}
