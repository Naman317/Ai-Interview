import Sidebar from '../components/Sidebar';

const Analytics = () => {
  return (
    <div className="flex h-screen bg-slate-900">
      <Sidebar />

      <main className="flex-1 ml-64 overflow-auto">
        {/* Header */}
        <div className="bg-slate-900 border-b border-slate-800 sticky top-0 z-40 p-6">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2">Analytics</h1>
            <p className="text-slate-400">Track your interview preparation progress</p>
          </div>
        </div>

        <div className="p-6 space-y-8">
          {/* Coming Soon */}
          <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 border border-blue-600/20 rounded-xl p-12 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600/20 rounded-lg mb-4">
              <span className="text-3xl">▲</span>
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Advanced Analytics</h2>
            <p className="text-slate-400 mb-6 max-w-md mx-auto">
              Detailed performance metrics, progress tracking, and personalized recommendations coming soon.
            </p>
            <button className="bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white px-6 py-2.5 rounded-lg font-medium transition-all shadow-lg shadow-blue-600/30">
              Notify Me
            </button>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-3 gap-6">
            <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 border border-blue-600/20 hover:border-blue-600/50 rounded-xl p-6 transition-all hover:shadow-lg hover:shadow-blue-600/10">
              <p className="text-slate-400 text-sm mb-2">Current Streak</p>
              <p className="text-3xl font-bold text-blue-400">7 days</p>
            </div>
            <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 border border-blue-600/20 hover:border-blue-600/50 rounded-xl p-6 transition-all hover:shadow-lg hover:shadow-blue-600/10">
              <p className="text-slate-400 text-sm mb-2">Total Hours</p>
              <p className="text-3xl font-bold text-green-400">42.5h</p>
            </div>
            <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 border border-blue-600/20 hover:border-blue-600/50 rounded-xl p-6 transition-all hover:shadow-lg hover:shadow-blue-600/10">
              <p className="text-slate-400 text-sm mb-2">Avg Performance</p>
              <p className="text-3xl font-bold text-purple-400">82%</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Analytics;
