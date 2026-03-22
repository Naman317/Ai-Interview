import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { createSession } from '../features/sessions/sessionSlice';

export default function SessionHistory({ sessions = [] }) {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [expandedId, setExpandedId] = useState(null);

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'text-green-400';
      case 'in-progress':
        return 'text-amber-400';
      case 'failed':
        return 'text-red-400';
      default:
        return 'text-slate-400';
    }
  };

  const getScoreColor = (score) => {
    if (score >= 80) return 'text-green-400';
    if (score >= 60) return 'text-amber-400';
    return 'text-red-400';
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
        <p className="text-slate-400">No interview sessions yet. Start your first interview!</p>
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
          className="group relative p-4 rounded-xl bg-gradient-to-br from-slate-800/50 to-slate-900/50 border border-blue-600/20 hover:border-blue-600/50 transition-all cursor-pointer"
          onClick={() => setExpandedId(expandedId === session._id ? null : session._id)}
        >
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h3 className="font-bold text-white">{session.role}</h3>
                <span className={`text-xs px-2 py-1 rounded-full bg-blue-600/20 border border-blue-600/30 ${getStatusColor(session.status)}`}>
                  {session.status}
                </span>
              </div>
              <p className="text-xs text-slate-400 mb-2">
                {formatDate(session.createdAt || new Date().toISOString())}
              </p>
              
              {expandedId === session._id && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-3 pt-3 border-t border-blue-600/20 space-y-2"
                >
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <p className="text-slate-500">Level</p>
                      <p className="text-white font-semibold">{session.level}</p>
                    </div>
                    <div>
                      <p className="text-slate-500">Type</p>
                      <p className="text-white font-semibold capitalize">{session.interviewType || 'oral'}</p>
                    </div>
                    {session.overallScore !== undefined && (
                      <div>
                        <p className="text-slate-500">Overall Score</p>
                        <p className={`font-bold ${getScoreColor(session.overallScore)}`}>
                          {session.overallScore}/100
                        </p>
                      </div>
                    )}
                    {session.metrics?.avgTechnical !== undefined && (
                      <div>
                        <p className="text-slate-500">Technical</p>
                        <p className="text-blue-400 font-semibold">{session.metrics.avgTechnical}/100</p>
                      </div>
                    )}
                  </div>
                  {session.questions && (
                    <div>
                      <p className="text-slate-500 text-xs">Questions Evaluated: {session.questions.filter(q => q.isEvaluated).length}/{session.questions.length}</p>
                    </div>
                  )}
                </motion.div>
              )}
            </div>

            <div className={`flex gap-2 ${expandedId === session._id ? 'flex-col' : 'flex-col sm:flex-row'}`}>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleReview(session._id);
                }}
                className="px-3 py-1.5 text-xs font-semibold bg-blue-600/20 border border-blue-600/50 text-blue-400 rounded-lg hover:bg-blue-600 hover:text-white transition-all"
              >
                Review
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleRestart(session);
                }}
                className="px-3 py-1.5 text-xs font-semibold bg-green-600/20 border border-green-600/50 text-green-400 rounded-lg hover:bg-green-600 hover:text-white transition-all"
              >
                Restart
              </button>
            </div>
          </div>

          {/* Score indicator bar */}
          {session.overallScore !== undefined && (
            <div className="mt-2 h-1 bg-slate-700 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${session.overallScore}%` }}
                transition={{ delay: 0.2, duration: 0.5 }}
                className={`h-full ${
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
