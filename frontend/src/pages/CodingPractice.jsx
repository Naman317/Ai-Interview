import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../utils/api';
import Sidebar from '../components/Sidebar';
import { toast } from 'react-toastify';

export default function CodingPractice() {
  const navigate = useNavigate();
  const [questions, setQuestions] = useState([]);
  const [stats, setStats] = useState({ total: 0, easy: 0, medium: 0, hard: 0 });
  const [companies, setCompanies] = useState([]);
  const [topics, setTopics] = useState([]);

  // Filters
  const [selectedCompany, setSelectedCompany] = useState('all');
  const [selectedDifficulty, setSelectedDifficulty] = useState('all');
  const [selectedTopic, setSelectedTopic] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    fetchQuestions();
  }, [selectedCompany, selectedDifficulty, selectedTopic, searchTerm, page]);

  const fetchInitialData = async () => {
    try {
      const [statsRes, companiesRes, topicsRes] = await Promise.all([
        api.get('/api/questions/stats'),
        api.get('/api/questions/companies'),
        api.get('/api/questions/topics')
      ]);
      setStats(statsRes.data);
      setCompanies(companiesRes.data);
      setTopics(topicsRes.data);
    } catch (error) {
      console.error('Failed to fetch metadata:', error);
    }
  };

  const fetchQuestions = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        page,
        limit: 50,
        company: selectedCompany,
        difficulty: selectedDifficulty,
        topic: selectedTopic,
        search: searchTerm
      });
      const { data } = await api.get(`/api/questions?${params}`);
      setQuestions(data.questions);
      setTotalPages(data.pages);
    } catch (error) {
      console.error('Failed to fetch questions:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePractice = async (q) => {
    if (q.url) {
      window.open(q.url, '_blank');
      return;
    }

    try {
      const { data } = await api.post(`/api/questions/${q._id}/practice`);
      navigate(`/sheets/${data._id}`);
      toast.success('Practice session started!');
    } catch (error) {
      console.error('Failed to start practice:', error);
      toast.error('Failed to start practice session');
    }
  };

  const statCards = [
    {
      label: 'Total Solved',
      value: `${stats.userProgress?.total || 0} / ${stats.total}`,
      color: 'blue',
      progress: stats.total > 0 ? ((stats.userProgress?.total || 0) / stats.total) * 100 : 0
    },
    {
      label: 'Easy',
      value: `${stats.userProgress?.easy || 0} / ${stats.easy}`,
      color: 'emerald',
      progress: stats.easy > 0 ? ((stats.userProgress?.easy || 0) / stats.easy) * 100 : 0
    },
    {
      label: 'Medium',
      value: `${stats.userProgress?.medium || 0} / ${stats.medium}`,
      color: 'amber',
      progress: stats.medium > 0 ? ((stats.userProgress?.medium || 0) / stats.medium) * 100 : 0
    },
    {
      label: 'Hard',
      value: `${stats.userProgress?.hard || 0} / ${stats.hard}`,
      color: 'rose',
      progress: stats.hard > 0 ? ((stats.userProgress?.hard || 0) / stats.hard) * 100 : 0
    },
  ];

  return (
    <div className="flex bg-[#0a0a0c] min-h-screen text-slate-200">
      <Sidebar />
      <main className="flex-1 ml-64 p-8">
        <header className="mb-10">
          <h1 className="text-4xl font-black mb-2 tracking-tight">Practice Questions</h1>
          <p className="text-slate-500 font-medium tracking-tight">
            Browse through {stats.total.toLocaleString()} DSA questions asked in technical interviews
          </p>
        </header>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {statCards.map((stat, idx) => (
            <div key={idx} className="bg-slate-900/40 border border-slate-800/50 p-6 rounded-3xl group hover:border-slate-700 transition-all">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-1">{stat.label}</p>
                  <p className="text-2xl font-black">{stat.value.split(' / ')[0]} <span className="text-slate-600 font-medium text-sm">/ {stat.value.split(' / ')[1]}</span></p>
                </div>
                <div className={`w-2 h-2 rounded-full bg-${stat.color}-500 shadow-[0_0_10px_rgba(0,0,0,0.5)]`} />
              </div>
              <div className="w-full bg-slate-800/50 rounded-full h-1.5 overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${stat.progress}%` }}
                  className={`bg-${stat.color}-500 h-full rounded-full`}
                />
              </div>
            </div>
          ))}
        </div>

        {/* Filter Bar */}
        <div className="flex flex-wrap gap-4 mb-8 bg-slate-900/20 p-2 rounded-2xl border border-slate-800/40 sticky top-4 z-10 backdrop-blur-xl">
          <div className="flex-1 min-w-[250px] relative group">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-blue-500 transition-colors">🔍</span>
            <input
              type="text"
              placeholder="Search companies..."
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setPage(1); }}
              className="w-full pl-11 pr-4 py-3 bg-slate-900/50 text-slate-200 rounded-xl border border-slate-800/50 focus:border-blue-500/50 focus:ring-4 focus:ring-blue-500/5 outline-none transition-all placeholder:text-slate-600"
            />
          </div>

          <select
            value={selectedDifficulty}
            onChange={(e) => { setSelectedDifficulty(e.target.value); setPage(1); }}
            className="px-4 py-3 bg-slate-900/50 text-slate-300 rounded-xl border border-slate-800/50 focus:border-blue-500/50 outline-none cursor-pointer hover:bg-slate-800/50 transition-colors min-w-[140px]"
          >
            <option value="easy">Easy</option>
            <option value="medium">Medium</option>
            <option value="hard">Hard</option>
          </select>

          <select
            className="px-4 py-3 bg-slate-900/50 text-slate-300 rounded-xl border border-slate-800/50 focus:border-blue-500/50 outline-none cursor-pointer hover:bg-slate-800/50 transition-colors min-w-[160px]"
            defaultValue="all"
          >
            <option value="all">All Timeframes</option>
            <option value="this-week">This Week</option>
            <option value="this-month">This Month</option>
          </select>


          <select
            value={selectedTopic}
            onChange={(e) => { setSelectedTopic(e.target.value); setPage(1); }}
            className="px-4 py-3 bg-slate-900/50 text-slate-300 rounded-xl border border-slate-800/50 focus:border-blue-500/50 outline-none cursor-pointer hover:bg-slate-800/50 transition-colors min-w-[160px]"
          >
            <option value="all">Topics</option>
            {topics.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>

        {/* Table Container */}
        <div className="bg-slate-900/30 rounded-[2.5rem] border border-slate-800/50 overflow-hidden shadow-2xl">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800/50 bg-slate-900/20">
                <th className="px-8 py-5 text-slate-500 text-[10px] font-black uppercase tracking-widest w-12 text-center">
                  <div className="w-5 h-5 rounded-full border-2 border-slate-700 flex items-center justify-center"></div>
                </th>
                <th className="px-6 py-5 text-slate-500 text-[10px] font-black uppercase tracking-widest">Title</th>
                <th className="px-6 py-5 text-slate-500 text-[10px] font-black uppercase tracking-widest">Company</th>
                <th className="px-6 py-5 text-slate-500 text-[10px] font-black uppercase tracking-widest">Difficulty</th>
                <th className="px-6 py-5 text-slate-500 text-[10px] font-black uppercase tracking-widest">Topics</th>
                <th className="px-6 py-5 text-slate-500 text-[10px] font-black uppercase tracking-widest text-right">Acceptance</th>
                <th className="px-8 py-5 text-slate-500 text-[10px] font-black uppercase tracking-widest text-right">Frequency</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/30">
              {isLoading ? (
                Array(10).fill(0).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td colSpan="6" className="px-8 py-6"><div className="h-4 bg-slate-800/50 rounded-full w-full"></div></td>
                  </tr>
                ))
              ) : questions.length > 0 ? questions.map((q, idx) => (
                <tr
                  key={q.id}
                  onClick={() => handlePractice(q)}
                  className="group hover:bg-slate-800/30 transition-colors cursor-pointer border-b border-slate-800/20 last:border-0"
                >
                  <td className="px-8 py-5 text-center" onClick={(e) => e.stopPropagation()}>
                    <div className="w-5 h-5 rounded-full border-2 border-slate-700 group-hover:border-slate-500 transition-colors mx-auto cursor-pointer"></div>
                  </td>
                  <td className="px-6 py-5 font-bold text-slate-200 group-hover:text-blue-400 transition-colors">
                    {q.title}
                  </td>
                  <td className="px-6 py-5">
                    <span className="text-sm font-medium text-slate-400">{q.companies[0]}</span>
                    {q.companies.length > 1 && (
                      <span className="text-[10px] text-slate-600 font-bold ml-1.5 bg-slate-800 px-1.5 py-0.5 rounded-full">+{q.companies.length - 1}</span>
                    )}
                  </td>
                  <td className="px-6 py-5">
                    <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider ${q.difficulty === 'Easy' ? 'bg-emerald-500/10 text-emerald-500' :
                      q.difficulty === 'Medium' ? 'bg-amber-500/10 text-amber-500' :
                        'bg-rose-500/10 text-rose-500'
                      }`}>
                      {q.difficulty}
                    </span>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex flex-wrap gap-1.5">
                      {q.topics.slice(0, 3).map(topic => (
                        <span key={topic} className="px-2.5 py-1 rounded-full bg-slate-800 text-blue-400 text-[10px] font-bold border border-slate-700 group-hover:border-blue-500/30 transition-colors">
                          {topic}
                        </span>
                      ))}
                      {q.topics.length > 3 && (
                        <span className="text-slate-500 font-black text-[10px] mt-1 ml-1">
                          +{q.topics.length - 3}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-5 text-right font-mono text-sm text-slate-300 font-bold">
                    {q.acceptance.toFixed(1)}%
                  </td>
                  <td className="px-8 py-5 text-right font-mono text-sm text-slate-300 font-bold">
                    {q.frequency.toFixed(2)}%
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan="6" className="py-20 text-center">
                    <div className="text-4xl mb-4 opacity-20">📂</div>
                    <p className="text-slate-600 font-bold uppercase tracking-widest text-xs">No matching questions found</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-8 flex justify-center items-center gap-4">
            <button
              disabled={page === 1}
              onClick={() => setPage(p => p - 1)}
              className="p-3 bg-slate-900 border border-slate-800 rounded-xl disabled:opacity-30 hover:bg-slate-800 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <span className="text-sm font-black text-slate-500">
              Page <span className="text-slate-200">{page}</span> of {totalPages}
            </span>
            <button
              disabled={page === totalPages}
              onClick={() => setPage(p => p + 1)}
              className="p-3 bg-slate-900 border border-slate-800 rounded-xl disabled:opacity-30 hover:bg-slate-800 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
