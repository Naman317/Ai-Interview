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
    <div className="flex min-h-screen bg-background text-white relative overflow-hidden font-sans">
      {/* Dynamic Animated Background Elements */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-primary/20 blur-[120px] rounded-full mix-blend-screen animate-float pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-secondary/20 blur-[120px] rounded-full mix-blend-screen animate-float pointer-events-none" style={{ animationDelay: '3s' }} />

      <Sidebar />

      <main className="flex-1 ml-64 p-8 relative z-10">
        <header className="flex justify-between items-center mb-10">
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
            <h1 className="text-4xl font-extrabold mb-2 bg-clip-text text-transparent bg-gradient-to-r from-white to-white/60">Dashboard</h1>
            <p className="text-white/50 font-medium">Welcome back, {user?.name || 'User'}! Here's your prep overview.</p>
          </motion.div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate('/new-interview')}
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-primary to-accent hover:opacity-90 text-white font-bold rounded-xl transition-all shadow-[0_0_20px_rgba(59,130,246,0.3)]"
          >
            <span className="text-xl leading-none shadow-sm">▶️</span> Start Interview
          </motion.button>
        </header>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
          {stats.map((stat, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              whileHover={{ y: -5 }}
              className="glass-card p-6 group cursor-default"
            >
              <div className="flex justify-between items-start mb-4">
                <div>
                  <p className="text-white/50 text-sm font-bold mb-1 tracking-wider uppercase">{stat.label}</p>
                  <p className="text-3xl font-black">{stat.value}</p>
                </div>
                <div className={`w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform group-hover:bg-white/10`}>
                  {stat.icon}
                </div>
              </div>
              <p className="text-xs font-bold text-accent/80">{stat.change}</p>
            </motion.div>
          ))}
        </div>

        {/* Analytics & Charts Placeholder */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-10">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="glass-card p-8 min-h-[350px] relative overflow-hidden"
          >
            <h3 className="text-xl font-extrabold mb-2">Performance Trend</h3>
            <p className="text-white/40 text-sm mb-6 uppercase tracking-widest font-bold">Your interview scores over time</p>
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-20">
              <div className="w-full h-48 bg-gradient-to-t from-primary/30 to-transparent blur-3xl rounded-full" />
            </div>
            <div className="flex items-center justify-center h-48 border border-dashed border-white/20 rounded-2xl bg-black/20">
              <p className="text-white/40 font-bold italic">Chart Data Loading...</p>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
            className="glass-card p-8 min-h-[350px]"
          >
            <h3 className="text-xl font-extrabold mb-2">Skills Breakdown</h3>
            <p className="text-white/40 text-sm mb-6 uppercase tracking-widest font-bold">Performance by category</p>
            <div className="flex items-center justify-center h-48 border border-dashed border-white/20 rounded-2xl bg-black/20">
              <p className="text-white/40 font-bold italic">Category Analysis Loading...</p>
            </div>
          </motion.div>
        </div>

        {/* Recent Activity */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="glass-card p-8"
        >
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-2xl font-extrabold">Recent Sessions</h2>
            <button className="text-accent hover:text-white transition-colors font-bold text-sm flex items-center gap-1 group">
              View All History <span className="group-hover:translate-x-1 transition-transform">→</span>
            </button>
          </div>

          {isLoading ? (
            <div className="py-12 flex justify-center">
              <div className="w-10 h-10 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
            </div>
          ) : (
            <SessionHistory sessions={sessions} />
          )}
        </motion.section>
      </main>
    </div>
  );
}
