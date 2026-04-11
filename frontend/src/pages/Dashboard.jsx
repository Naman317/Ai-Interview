import { useState, useEffect, useMemo } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { getSessions } from '../features/sessions/sessionSlice';
import { motion } from 'framer-motion';
import SessionHistory from '../components/SessionHistory';
import { startOnboarding } from '../utils/OnboardingTour';

// Chart.js imports
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Line, Bar } from 'react-chartjs-2';

// Register Chart.js
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

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

  // --- Real Stats Calculation ---
  const calculatedStats = useMemo(() => {
    if (!sessions || sessions.length === 0) return { avgScore: 0, totalHours: 0, successRate: 0 };
    
    const completed = sessions.filter(s => s.status === 'completed');
    const totalScore = completed.reduce((acc, s) => acc + (s.overallScore || 0), 0);
    const avgScore = completed.length > 0 ? Math.round(totalScore / completed.length) : 0;
    
    // Mocking practice time based on session count for now, approx 0.5h per session
    const totalHours = (sessions.length * 0.5).toFixed(1);
    
    const highScores = completed.filter(s => (s.overallScore || 0) >= 70).length;
    const successRate = sessions.length > 0 ? Math.round((highScores / sessions.length) * 100) : 0;

    return { avgScore, totalHours, successRate };
  }, [sessions]);

  const stats = [
    {
      label: 'Total Interviews', value: sessions?.length || 0, change: '+12% from last month',
      icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>,
      color: 'blue'
    },
    {
      label: 'Average Score', value: `${calculatedStats.avgScore}%`, change: '+8% improvement',
      icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>,
      color: 'green'
    },
    {
      label: 'Practice Time', value: `${calculatedStats.totalHours}h`, change: 'Total cumulative',
      icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
      color: 'orange'
    },
    {
      label: 'Success Rate', value: `${calculatedStats.successRate}%`, change: 'Scores above 70%',
      icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
      color: 'purple'
    },
  ];

  const colorMap = {
    blue: { bg: 'bg-blue-50', text: 'text-accent', icon: 'text-accent' },
    green: { bg: 'bg-green-50', text: 'text-green-600', icon: 'text-green-600' },
    orange: { bg: 'bg-amber-50', text: 'text-amber-600', icon: 'text-amber-600' },
    purple: { bg: 'bg-purple-50', text: 'text-purple-600', icon: 'text-purple-600' },
  };

  // --- Chart Data Processing ---
  const trendData = useMemo(() => {
    const historical = [...(sessions || [])]
      .filter(s => s.status === 'completed')
      .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
      .slice(-10); // Last 10 sessions

    return {
      labels: historical.map(s => new Date(s.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })),
      datasets: [{
        label: 'Overall Score',
        data: historical.map(s => s.overallScore),
        borderColor: '#3b82f6',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        fill: true,
        tension: 0.4,
        pointRadius: 4,
        pointBackgroundColor: '#3b82f6',
      }]
    };
  }, [sessions]);

  const skillData = useMemo(() => {
    // Group by role and get avg technical score
    const roles = {};
    sessions.forEach(s => {
      if (s.status !== 'completed') return;
      if (!roles[s.role]) roles[s.role] = { sum: 0, count: 0 };
      roles[s.role].sum += (s.metrics?.avgTechnical || s.overallScore || 0);
      roles[s.role].count += 1;
    });

    const labels = Object.keys(roles);
    const data = labels.map(r => Math.round(roles[r].sum / roles[r].count));

    return {
      labels,
      datasets: [{
        label: 'Avg Technical Score',
        data,
        backgroundColor: '#a855f7',
        borderRadius: 8,
        barThickness: 20
      }]
    };
  }, [sessions]);

  const commonOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: '#1e293b',
        titleFont: { size: 12, family: 'Inter' },
        bodyFont: { size: 12, family: 'Inter' },
        padding: 12,
        cornerRadius: 8,
      }
    },
    scales: {
      y: { beginAtZero: true, max: 100, grid: { color: '#f1f5f9' }, ticks: { color: '#94a3b8', font: { size: 10 } } },
      x: { grid: { display: false }, ticks: { color: '#94a3b8', font: { size: 10 } } }
    }
  };

  return (
    <div className="p-8">
        <header className="flex justify-between items-center mb-10">
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
            <h1 className="text-3xl font-bold text-primary mb-1">Dashboard</h1>
            <p className="text-gray-500 text-sm">Welcome back, {user?.name || 'User'}! Here's your prep overview.</p>
          </motion.div>
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => navigate('/new-interview')}
            className="flex items-center gap-2 px-5 py-2.5 bg-accent hover:bg-blue-700 text-white font-semibold rounded-lg transition-all shadow-sm text-sm"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Start Interview
          </motion.button>
        </header>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-10">
          {stats.map((stat, idx) => {
            const colors = colorMap[stat.color];
            return (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                whileHover={{ y: -3 }}
                className="bg-white rounded-2xl border border-gray-200 p-6 shadow-card hover:shadow-card-hover transition-all duration-200 cursor-default"
              >
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <p className="text-gray-500 text-xs font-medium mb-1 uppercase tracking-wider">{stat.label}</p>
                    <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
                  </div>
                  <div className={`w-10 h-10 rounded-xl ${colors.bg} flex items-center justify-center ${colors.icon}`}>
                    {stat.icon}
                  </div>
                </div>
                <p className={`text-xs font-medium ${colors.text}`}>{stat.change}</p>
              </motion.div>
            );
          })}
        </div>

        {/* Analytics & Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-10">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-2xl border border-gray-200 p-8 shadow-card"
          >
            <h3 className="text-base font-bold text-gray-900 mb-1">Performance Trend</h3>
            <p className="text-gray-400 text-xs mb-6 uppercase tracking-wider font-medium">Your interview scores over time</p>
            <div className="h-64">
              {sessions?.length > 0 ? (
                <Line data={trendData} options={commonOptions} />
              ) : (
                <div className="flex items-center justify-center h-full border border-dashed border-gray-200 rounded-2xl bg-gray-50">
                  <p className="text-gray-400 text-sm font-medium">Complete interviews to see trends</p>
                </div>
              )}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-2xl border border-gray-200 p-8 shadow-card"
          >
            <h3 className="text-base font-bold text-gray-900 mb-1">Skills Breakdown</h3>
            <p className="text-gray-400 text-xs mb-6 uppercase tracking-wider font-medium">Performance by role</p>
            <div className="h-64">
               {Object.keys(skillData.labels).length > 0 ? (
                <Bar data={skillData} options={{...commonOptions, indexAxis: 'y'}} />
              ) : (
                <div className="flex items-center justify-center h-full border border-dashed border-gray-200 rounded-2xl bg-gray-50">
                  <p className="text-gray-400 text-sm font-medium">Practice multiple roles for analysis</p>
                </div>
              )}
            </div>
          </motion.div>
        </div>

        {/* Recent Activity */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white rounded-2xl border border-gray-200 p-8 shadow-card"
        >
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-lg font-bold text-gray-900">Recent Sessions</h2>
            <button 
              onClick={() => navigate('/history')}
              className="text-accent hover:text-blue-700 transition-colors font-medium text-sm flex items-center gap-1 group"
            >
              View All History <span className="group-hover:translate-x-1 transition-transform">→</span>
            </button>
          </div>

          {isLoading ? (
            <div className="py-12 flex justify-center">
              <div className="w-10 h-10 border-4 border-gray-200 border-t-accent rounded-full animate-spin" />
            </div>
          ) : (
            <SessionHistory sessions={sessions} />
          )}
        </motion.section>
    </div>
  );
}
