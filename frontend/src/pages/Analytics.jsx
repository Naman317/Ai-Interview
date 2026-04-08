import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { getUserStats } from '../features/analytics/analyticsSlice';
import Sidebar from '../components/Sidebar';
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

const Analytics = () => {
  const dispatch = useDispatch();
  const { stats, isLoading } = useSelector((state) => state.analytics);

  useEffect(() => {
    dispatch(getUserStats());
  }, [dispatch]);

  const lineChartData = {
    labels: stats?.history?.map((h) => new Date(h.date).toLocaleDateString()) || [],
    datasets: [
      {
        label: 'Interview Score',
        data: stats?.history?.map((h) => h.score) || [],
        fill: true,
        backgroundColor: 'rgba(57, 73, 171, 0.1)',
        borderColor: '#3949ab',
        tension: 0.4,
      },
    ],
  };

  const barChartData = {
    labels: stats?.roleStats?.map((r) => r.role) || [],
    datasets: [
      {
        label: 'Avg Score by Role',
        data: stats?.roleStats?.map((r) => r.avgScore) || [],
        backgroundColor: '#3949ab',
        borderRadius: 8,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
    },
    scales: {
      y: { beginAtZero: true, max: 100 },
    },
  };

  if (isLoading && !stats) {
    return <div className="flex items-center justify-center h-screen">Loading Analytics...</div>;
  }

  const summary = stats?.summary || {};

  return (
    <div className="flex h-screen bg-surface">
      <Sidebar />

      <main className="flex-1 ml-64 overflow-auto">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 sticky top-0 z-40 p-6">
          <div>
            <h1 className="text-3xl font-bold text-primary mb-1">Analytics</h1>
            <p className="text-gray-500 text-sm">Track your interview preparation progress and performance trends</p>
          </div>
        </div>

        <div className="p-6 space-y-8">
          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[
              { label: 'Total Interviews', value: summary.totalInterviews || 0, color: 'text-blue-600' },
              { label: 'Avg Overall Score', value: `${Math.round(summary.avgOverallScore || 0)}%`, color: 'text-accent' },
              { label: 'Technical Accuracy', value: `${Math.round(summary.avgTechnical || 0)}%`, color: 'text-green-600' },
              { label: 'Confidence Score', value: `${Math.round(summary.avgConfidence || 0)}%`, color: 'text-purple-600' },
            ].map((stat, i) => (
              <div key={i} className="bg-white border border-gray-200 rounded-2xl p-6 shadow-card transition-all hover:border-accent/30">
                <p className="text-gray-500 text-xs font-semibold mb-2 uppercase tracking-wider">{stat.label}</p>
                <p className={`text-3xl font-bold ${stat.color}`}>{stat.value}</p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Score History */}
            <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-card">
              <h3 className="text-lg font-bold text-gray-900 mb-6 font-primary">Performance Trend</h3>
              <div className="h-64">
                <Line data={lineChartData} options={chartOptions} />
              </div>
            </div>

            {/* Role Breakdown */}
            <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-card">
              <h3 className="text-lg font-bold text-gray-900 mb-6 font-primary">Success by Role</h3>
              <div className="h-64">
                <Bar data={barChartData} options={chartOptions} />
              </div>
            </div>
          </div>

          {/* Activity Callout */}
          <div className="bg-primary text-white rounded-3xl p-10 flex items-center justify-between shadow-2xl relative overflow-hidden">
            <div className="relative z-10 max-w-lg">
              <h2 className="text-2xl font-bold mb-4">You've spent {Math.round(summary.totalDuration || 0)} hours practicing</h2>
              <p className="text-indigo-100 mb-6">
                Consistency is the key to mastering technical interviews. Keep up the momentum!
              </p>
              <button className="bg-accent hover:bg-blue-400 text-white px-8 py-3 rounded-xl font-bold transition-all shadow-lg transform hover:-translate-y-1">
                Start Next Interview
              </button>
            </div>
            <div className="hidden md:block absolute right-0 top-0 bottom-0 w-1/3 bg-white/5 skew-x-12 transform translate-x-1/2"></div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Analytics;
