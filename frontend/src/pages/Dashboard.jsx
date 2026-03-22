import { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { getSessions } from '../features/sessions/sessionSlice';
import { motion } from 'framer-motion';
import Sidebar from '../components/Sidebar';
import SessionHistory from '../components/SessionHistory';
import { startOnboarding } from '../utils/OnboardingTour';

export default function Dashboard() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector(state => state.auth);
  const { sessions, isLoading } = useSelector(state => state.sessions);

  useEffect(() => {
    dispatch(getSessions());

    // Attempt to start the onboarding tour with a slight delay to ensure UI is ready
    const timer = setTimeout(() => {
      startOnboarding();
    }, 1500);

    return () => clearTimeout(timer);
  }, [dispatch]);

  const stats = [
    { label: 'Total Interviews', value: sessions?.length || 0, change: '+12% from last month', icon: '▶️', color: 'blue' },
    { label: 'Average Score', value: '82%', change: '+8% improvement', icon: '📈', color: 'green' },
    { label: 'Practice Time', value: '18.5h', change: 'This month', icon: '🕒', color: 'orange' },
    { label: 'Success Rate', value: '75%', change: '+5% this week', icon: '🎯', color: 'purple' },
  ];

  return (
    <div className="flex bg-black min-h-screen text-white">
      <Sidebar />

      <main className="flex-1 ml-64 p-8">
        {/* Header */}
        <header className="flex justify-between items-center mb-10">
          <div>
            <h1 className="text-4xl font-extrabold mb-2">Dashboard</h1>
            <p className="text-slate-500 font-medium">Welcome back! Here's your interview preparation overview.</p>
          </div>
          <button
            onClick={() => navigate('/new-interview')}
            className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-all shadow-lg shadow-blue-600/20"
          >
            <span>▶️</span> Start Interview
          </button>
        </header>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
          {stats.map((stat, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              className="bg-slate-900/50 border border-slate-800 p-6 rounded-2xl hover:border-slate-700 transition-colors group"
            >
              <div className="flex justify-between items-start mb-4">
                <div>
                  <p className="text-slate-500 text-sm font-bold mb-1">{stat.label}</p>
                  <p className="text-3xl font-black">{stat.value}</p>
                </div>
                <div className={`w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center text-xl group-hover:scale-110 transition-transform`}>
                  {stat.icon}
                </div>
              </div>
              <p className="text-xs font-bold text-slate-500">{stat.change}</p>
            </motion.div>
          ))}
        </div>

        {/* Analytics & Charts Placeholder */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-10">
          <div className="bg-slate-900/50 border border-slate-800 rounded-3xl p-8 min-h-[350px] relative overflow-hidden">
            <h3 className="text-xl font-extrabold mb-2">Performance Trend</h3>
            <p className="text-slate-500 text-sm mb-6 uppercase tracking-widest font-bold">Your interview scores over time</p>
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-20">
              {/* Just a decorative background for now */}
              <div className="w-full h-32 bg-gradient-to-t from-blue-600/20 to-transparent blur-3xl rounded-full" />
            </div>
            <div className="flex items-center justify-center h-48 border-2 border-dashed border-slate-800 rounded-2xl">
              <p className="text-slate-600 font-bold italic">Chart Data Loading...</p>
            </div>
          </div>

          <div className="bg-slate-900/50 border border-slate-800 rounded-3xl p-8 min-h-[350px]">
            <h3 className="text-xl font-extrabold mb-2">Skills Breakdown</h3>
            <p className="text-slate-500 text-sm mb-6 uppercase tracking-widest font-bold">Performance by category</p>
            <div className="flex items-center justify-center h-48 border-2 border-dashed border-slate-800 rounded-2xl">
              <p className="text-slate-600 font-bold italic">Category Analysis Loading...</p>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <section className="bg-slate-900/50 border border-slate-800 rounded-3xl p-8">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-2xl font-extrabold">Recent Sessions</h2>
            <button className="text-blue-500 hover:text-blue-400 font-bold text-sm">View All History →</button>
          </div>

          {isLoading ? (
            <div className="py-12 flex justify-center">
              <div className="w-8 h-8 border-4 border-blue-600/30 border-t-blue-600 rounded-full animate-spin" />
            </div>
          ) : (
            <SessionHistory sessions={sessions} />
          )}
        </section>
      </main>
    </div>
  );
}
