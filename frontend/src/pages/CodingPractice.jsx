import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../utils/api';
import { toast } from 'react-toastify';
import RoleIcon from '../components/RoleIcon';

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
  const [loadingQuestionId, setLoadingQuestionId] = useState(null);
  const [selectedGuide, setSelectedGuide] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedQuestionTitle, setSelectedQuestionTitle] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedQuestion, setSelectedQuestion] = useState(null);

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
      const fullUrl = q.url.startsWith('/') ? `https://leetcode.com${q.url}` : q.url;
      window.open(fullUrl, '_blank');
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

  const handleToggleComplete = async (e, q) => {
    e.stopPropagation();
    const questionId = q._id;
    const oldQuestions = [...questions];
    const oldStats = { ...stats };
    
    const newIsCompleted = !q.isCompleted;

    // Optimistic Questions Update
    const updatedQuestions = questions.map(item => 
      (item.id === questionId || item._id === questionId) ? { ...item, isCompleted: newIsCompleted } : item
    );
    setQuestions(updatedQuestions);

    // Optimistic Stats Update
    const updatedUserProgress = { ...stats.userProgress };
    const diffMatch = q.difficulty.toLowerCase();
    const change = newIsCompleted ? 1 : -1;

    updatedUserProgress.total = (updatedUserProgress.total || 0) + change;
    if (diffMatch === 'easy') updatedUserProgress.easy = (updatedUserProgress.easy || 0) + change;
    else if (diffMatch === 'medium') updatedUserProgress.medium = (updatedUserProgress.medium || 0) + change;
    else if (diffMatch === 'hard') updatedUserProgress.hard = (updatedUserProgress.hard || 0) + change;

    setStats({ ...stats, userProgress: updatedUserProgress });

    try {
      await api.post(`/api/questions/${questionId}/toggle-complete`);
      // Refresh stats to ensure accuracy
      const { data } = await api.get('/api/questions/stats');
      setStats(data);
    } catch (error) {
      setQuestions(oldQuestions);
      setStats(oldStats);
      toast.error('Failed to update progress');
    }
  };

  const handleHelp = async (q, forceRefresh = false) => {
    if (forceRefresh) setIsRefreshing(true);
    else setLoadingQuestionId(q.id || q._id);
    
    setSelectedQuestion(q);
    setSelectedQuestionTitle(q.title);
    const toastId = forceRefresh ? null : toast.loading('Generating Interview Strategy Guide...');
    
    try {
      const { data } = await api.get(`/api/questions/${q._id || q.id}/guide${forceRefresh ? '?refresh=true' : ''}`);
      if (toastId) toast.dismiss(toastId);
      setSelectedGuide(data);
      setIsModalOpen(true);
      if (forceRefresh) toast.success('Guide refreshed with latest analysis!');
    } catch (error) {
      if (toastId) toast.dismiss(toastId);
      console.error('Failed to fetch guide:', error);
      toast.error('Failed to generate interview guide');
    } finally {
      setLoadingQuestionId(null);
      setIsRefreshing(false);
    }
  };

  const statCards = [
    {
      label: 'Total Solved',
      value: `${stats.userProgress?.total || 0} / ${stats.total}`,
      color: 'accent',
      bgColor: 'bg-blue-50',
      textColor: 'text-accent',
      progress: stats.total > 0 ? ((stats.userProgress?.total || 0) / stats.total) * 100 : 0
    },
    {
      label: 'Easy',
      value: `${stats.userProgress?.easy || 0} / ${stats.easy}`,
      color: 'green',
      bgColor: 'bg-green-50',
      textColor: 'text-green-600',
      progress: stats.easy > 0 ? ((stats.userProgress?.easy || 0) / stats.easy) * 100 : 0
    },
    {
      label: 'Medium',
      value: `${stats.userProgress?.medium || 0} / ${stats.medium}`,
      color: 'amber',
      bgColor: 'bg-amber-50',
      textColor: 'text-amber-600',
      progress: stats.medium > 0 ? ((stats.userProgress?.medium || 0) / stats.medium) * 100 : 0
    },
    {
      label: 'Hard',
      value: `${stats.userProgress?.hard || 0} / ${stats.hard}`,
      color: 'red',
      bgColor: 'bg-red-50',
      textColor: 'text-red-600',
      progress: stats.hard > 0 ? ((stats.userProgress?.hard || 0) / stats.hard) * 100 : 0
    },
  ];

  return (
    <div className="p-8">
        <header className="mb-10">
          <h1 className="text-3xl font-bold text-primary mb-1">Practice Questions</h1>
          <p className="text-gray-500 text-sm">
            Browse through {stats.total.toLocaleString()} DSA questions asked in technical interviews
          </p>
        </header>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-10">
          {statCards.map((stat, idx) => (
            <div key={idx} className="bg-white border border-gray-200 p-6 rounded-2xl shadow-card hover:shadow-card-hover transition-all">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <p className="text-gray-400 text-xs font-medium uppercase tracking-wider mb-1">{stat.label}</p>
                  <p className="text-2xl font-bold text-gray-900">{stat.value.split(' / ')[0]} <span className="text-gray-400 font-normal text-sm">/ {stat.value.split(' / ')[1]}</span></p>
                </div>
                <div className={`w-3 h-3 rounded-full ${stat.bgColor}`} />
              </div>
              <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${stat.progress}%` }}
                  className={`h-full rounded-full ${stat.textColor === 'text-accent' ? 'bg-accent' : stat.textColor === 'text-green-600' ? 'bg-green-500' : stat.textColor === 'text-amber-600' ? 'bg-amber-500' : 'bg-red-500'}`}
                />
              </div>
            </div>
          ))}
        </div>

        {/* Filter Bar */}
        <div className="flex flex-wrap gap-3 mb-8 bg-white p-3 rounded-2xl border border-gray-200 shadow-card sticky top-4 z-10">
          <div className="flex-1 min-w-[250px] relative group">
            <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-accent transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Search questions..."
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setPage(1); }}
              className="w-full pl-10 pr-4 py-2.5 bg-gray-50 text-gray-900 rounded-xl border border-gray-200 focus:border-accent focus:ring-2 focus:ring-accent/10 outline-none transition-all placeholder:text-gray-400 text-sm"
            />
          </div>

          <select
            value={selectedDifficulty}
            onChange={(e) => { setSelectedDifficulty(e.target.value); setPage(1); }}
            className="px-4 py-2.5 bg-gray-50 text-gray-700 rounded-xl border border-gray-200 focus:border-accent outline-none cursor-pointer hover:bg-gray-100 transition-colors min-w-[130px] text-sm"
          >
            <option value="easy">Easy</option>
            <option value="medium">Medium</option>
            <option value="hard">Hard</option>
          </select>

          <select
            className="px-4 py-2.5 bg-gray-50 text-gray-700 rounded-xl border border-gray-200 focus:border-accent outline-none cursor-pointer hover:bg-gray-100 transition-colors min-w-[150px] text-sm"
            defaultValue="all"
          >
            <option value="all">All Timeframes</option>
            <option value="this-week">This Week</option>
            <option value="this-month">This Month</option>
          </select>

          <select
            value={selectedTopic}
            onChange={(e) => { setSelectedTopic(e.target.value); setPage(1); }}
            className="px-4 py-2.5 bg-gray-50 text-gray-700 rounded-xl border border-gray-200 focus:border-accent outline-none cursor-pointer hover:bg-gray-100 transition-colors min-w-[150px] text-sm"
          >
            <option value="all">All Topics</option>
            {topics.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>

        {/* Table Container */}
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-card">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/50">
                <th className="px-6 py-4 text-gray-400 text-xs font-medium uppercase tracking-wider w-12 text-center">
                  <div className="w-4 h-4 rounded border-2 border-gray-300 mx-auto"></div>
                </th>
                <th className="px-5 py-4 text-gray-400 text-xs font-medium uppercase tracking-wider">Title</th>
                <th className="px-5 py-4 text-gray-400 text-xs font-medium uppercase tracking-wider">Company</th>
                <th className="px-5 py-4 text-gray-400 text-xs font-medium uppercase tracking-wider">Difficulty</th>
                <th className="px-5 py-4 text-gray-400 text-xs font-medium uppercase tracking-wider">Topics</th>
                <th className="px-5 py-4 text-gray-400 text-xs font-medium uppercase tracking-wider text-right">Acceptance</th>
                <th className="px-6 py-4 text-gray-400 text-xs font-medium uppercase tracking-wider text-right">Frequency</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isLoading ? (
                Array(10).fill(0).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td colSpan="7" className="px-6 py-5"><div className="h-4 bg-gray-100 rounded-full w-full"></div></td>
                  </tr>
                ))
              ) : questions.length > 0 ? questions.map((q, idx) => (
                <tr
                  key={q.id}
                  onClick={() => handlePractice(q)}
                  className="group hover:bg-gray-50 transition-colors cursor-pointer"
                >
                  <td className="px-6 py-4 text-center" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={(e) => handleToggleComplete(e, q)}
                      className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${
                        q.isCompleted 
                        ? 'bg-green-500 border-green-500 text-white' 
                        : 'border-gray-300 hover:border-accent'
                      }`}
                    >
                      {q.isCompleted && (
                        <svg className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      )}
                    </button>
                  </td>
                  <td className="px-5 py-4 font-semibold text-gray-900 group-hover:text-accent transition-colors text-sm">
                    {q.title}
                    <button
                      onClick={(e) => { e.stopPropagation(); handleHelp(q); }}
                      disabled={loadingQuestionId === (q.id || q._id)}
                      className="ml-3 px-2 py-1 text-xs font-semibold bg-accent/10 text-accent rounded-lg border border-accent/20 hover:bg-accent hover:text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {loadingQuestionId === (q.id || q._id) ? '⏳ Loading...' : 'AI Help'}
                    </button>
                  </td>
                  <td className="px-5 py-4">
                    <span className="text-sm text-gray-600">{q.companies[0]}</span>
                    {q.companies.length > 1 && (
                      <span className="text-xs text-gray-400 font-medium ml-1.5 bg-gray-100 px-1.5 py-0.5 rounded-full">+{q.companies.length - 1}</span>
                    )}
                  </td>
                  <td className="px-5 py-4">
                    <span className={`px-2.5 py-1 rounded-lg text-xs font-semibold ${q.difficulty === 'Easy' ? 'bg-green-50 text-green-600' :
                      q.difficulty === 'Medium' ? 'bg-amber-50 text-amber-600' :
                        'bg-red-50 text-red-600'
                      }`}>
                      {q.difficulty}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex flex-wrap gap-1.5">
                      {q.topics.slice(0, 3).map(topic => (
                        <span key={topic} className="px-2 py-0.5 rounded-full bg-accent/5 text-accent text-xs font-medium border border-accent/20">
                          {topic}
                        </span>
                      ))}
                      {q.topics.length > 3 && (
                        <span className="text-gray-400 text-xs font-medium mt-0.5 ml-1">
                          +{q.topics.length - 3}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-5 py-4 text-right font-mono text-sm text-gray-600">
                    {q.acceptance.toFixed(1)}%
                  </td>
                  <td className="px-6 py-4 text-right font-mono text-sm text-gray-600">
                    {q.frequency.toFixed(2)}%
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan="7" className="py-20 text-center">
                    <div className="w-16 h-16 bg-gray-50 rounded-2xl mx-auto flex items-center justify-center mb-4">
                      <svg className="w-8 h-8 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                      </svg>
                    </div>
                    <p className="text-gray-400 text-sm">No matching questions found</p>
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
              className="p-2.5 bg-white border border-gray-200 rounded-xl disabled:opacity-30 hover:bg-gray-50 transition-colors shadow-sm"
            >
              <svg className="w-4 h-4 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <span className="text-sm font-medium text-gray-500">
              Page <span className="text-gray-900 font-semibold">{page}</span> of {totalPages}
            </span>
            <button
              disabled={page === totalPages}
              onClick={() => setPage(p => p + 1)}
              className="p-2.5 bg-white border border-gray-200 rounded-xl disabled:opacity-30 hover:bg-gray-50 transition-colors shadow-sm"
            >
              <svg className="w-4 h-4 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        )}
        {/* Interview Guide Modal */}
        <AnimatePresence>
          {isModalOpen && selectedGuide && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsModalOpen(false)}
                className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm"
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="relative w-full max-w-4xl bg-white rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
              >
                <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">{selectedQuestionTitle}</h2>
                    <div className="flex items-center gap-2">
                       <p className="text-gray-500 text-sm font-medium uppercase tracking-wider">Interview Strategy Guide</p>
                       <button
                          onClick={() => handleHelp(selectedQuestion, true)}
                          disabled={isRefreshing}
                          className={`p-1.5 rounded-lg border border-gray-200 hover:bg-gray-100 transition-all ${isRefreshing ? 'animate-spin opacity-50' : ''}`}
                          title="Refresh Strategy"
                        >
                          <RoleIcon icon="refresh" className="w-3.5 h-3.5 text-gray-500" />
                        </button>
                    </div>
                  </div>
                  <button
                    onClick={() => setIsModalOpen(false)}
                    className="p-2 hover:bg-gray-200 rounded-full transition-colors text-gray-400 hover:text-gray-600"
                  >
                    <RoleIcon icon="cross" className="w-6 h-6" />
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto p-8 space-y-10 custom-scrollbar">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-blue-50/50 border border-blue-100 p-5 rounded-2xl flex items-center gap-4">
                      <div className="p-3 bg-blue-100 rounded-xl">
                        <RoleIcon icon="target" className="w-6 h-6 text-blue-600" />
                      </div>
                      <div>
                        <span className="text-blue-500 text-[10px] font-black uppercase block mb-0.5">Time Complexity</span>
                        <span className="text-blue-700 font-bold text-lg">{selectedGuide.complexityAnalysis?.time || 'O(Analysis Pending)'}</span>
                      </div>
                    </div>
                    <div className="bg-purple-50/50 border border-purple-100 p-5 rounded-2xl flex items-center gap-4">
                      <div className="p-3 bg-purple-100 rounded-xl">
                        <RoleIcon icon="chart" className="w-6 h-6 text-purple-600" />
                      </div>
                      <div>
                        <span className="text-purple-500 text-[10px] font-black uppercase block mb-0.5">Space Complexity</span>
                        <span className="text-purple-700 font-bold text-lg">{selectedGuide.complexityAnalysis?.space || 'O(Analysis Pending)'}</span>
                      </div>
                    </div>
                  </div>

                  <section>
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 bg-accent/10 rounded-xl flex items-center justify-center text-accent">
                        <RoleIcon icon="brain" className="w-5 h-5" />
                      </div>
                      <h3 className="text-xl font-bold text-gray-900">Conceptual Approach</h3>
                    </div>
                    <div className="bg-gray-50 border border-gray-100 p-6 rounded-2xl text-gray-700 leading-relaxed text-sm">
                      {Array.isArray(selectedGuide.approach) ? (
                        <div className="space-y-4">
                          {selectedGuide.approach.map((step, idx) => (
                            <div key={idx} className="flex gap-4">
                              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-accent/10 text-accent flex items-center justify-center text-[10px] font-bold">
                                {idx + 1}
                              </span>
                              <p className="flex-1 pt-0.5">{step}</p>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="whitespace-pre-wrap">{selectedGuide.approach}</div>
                      )}
                    </div>
                  </section>

                  <section className="bg-accent/5 border border-accent/10 p-8 rounded-3xl relative overflow-hidden">
                    <div className="absolute -top-4 -right-4 opacity-[0.03] transform rotate-12">
                      <svg className="w-40 h-40 text-accent" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M14.017 21L14.017 18C14.017 16.8954 14.9124 16 16.017 16H19.017C20.1216 16 21.017 16.8954 21.017 18V21M14.017 21H21.017M14.017 21C12.9124 21 12.017 20.1046 12.017 19V12C12.017 10.8954 12.9124 10 14.017 10H19.017C20.1216 10 21.017 10.8954 21.017 12V15C21.017 16.1046 20.1216 17 19.017 17H16.017C14.9124 17 14.017 16.1046 14.017 15" />
                      </svg>
                    </div>
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 bg-accent rounded-xl flex items-center justify-center text-white shadow-sm">
                        <RoleIcon icon="speech" className="w-5 h-5" />
                      </div>
                      <h3 className="text-xl font-bold text-gray-900">How to Verbalize</h3>
                    </div>
                    <div className="bg-white/80 p-6 rounded-2xl italic text-gray-700 border border-accent/10 shadow-sm text-sm">
                      "{selectedGuide.verbalization}"
                    </div>
                    <p className="mt-4 text-[10px] text-gray-400 font-bold uppercase tracking-widest flex items-center gap-1.5">
                      <RoleIcon icon="lightbulb" className="w-3 h-3 text-yellow-500" />
                      Tip: Use these specific phrases to explain your thought process clearly to the interviewer.
                    </p>
                  </section>
                </div>

                <div className="p-6 bg-gray-50 border-t border-gray-100 flex justify-end">
                  <button
                    onClick={() => setIsModalOpen(false)}
                    className="px-8 py-3 bg-accent text-white font-bold rounded-xl hover:bg-accent/90 transition-all shadow-lg shadow-accent/20"
                  >
                    Got it, thanks!
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
    </div>
  );
}
