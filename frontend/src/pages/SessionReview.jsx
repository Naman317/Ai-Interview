import { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useParams, Link } from 'react-router-dom';
import { getSessionById } from '../features/sessions/sessionSlice';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Tooltip, Legend } from 'chart.js';
import { Bar } from 'react-chartjs-2';
import Sidebar from '../components/Sidebar';
import { motion } from 'framer-motion';

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

const formatDuration = (start, end) => {
    if (!start || !end) return 'N/A';
    const diff = new Date(end) - new Date(start);
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    return `${minutes}m ${seconds % 60}s`;
};

const sanitizeQuestionText = (text) => {
    return text.replace(/^\d+[\s\.\)]+/, '').trim();
};

const formatIdealAnswer = (text) => {
    try {
        if (!text) return "Pending evaluation.";
        let cleanText = text.trim();
        if (cleanText.startsWith('```')) {
            cleanText = cleanText.replace(/^```(json)?/, '').replace(/```$/, '').trim();
        }
        if (cleanText.startsWith('{') && cleanText.endsWith('}')) {
            const parsed = JSON.parse(cleanText);
            if (parsed.verbalAnswer || parsed.idealAnswer || parsed.idealanswer) {
                return parsed.verbalAnswer || parsed.idealAnswer || parsed.idealanswer;
            }
            const explanation = parsed.explanation || parsed.understanding || "";
            const code = parsed.code || parsed.codeExample || parsed.example || "";
            if (explanation || code) {
                return `${explanation}\n\n${code}`.trim();
            }
        }
        return text;
    } catch (e) {
        return text;
    }
};

function SessionReview() {
    const { sessionId } = useParams();
    const dispatch = useDispatch();
    const { activeSession, isLoading } = useSelector(state => state.sessions);

    useEffect(() => {
        dispatch(getSessionById(sessionId));
    }, [dispatch, sessionId]);

    if (isLoading) {
        return (
            <div className="flex bg-black min-h-screen text-white">
                <Sidebar />
                <main className="flex-1 ml-64 flex items-center justify-center p-8">
                    <div className="text-center space-y-4">
                        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-blue-600 border-white/10 mx-auto" />
                        <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">Generating your analysis...</p>
                    </div>
                </main>
            </div>
        );
    }

    if (!activeSession || activeSession.status !== 'completed') {
        return (
            <div className="flex bg-black min-h-screen text-white">
                <Sidebar />
                <main className="flex-1 ml-64 flex items-center justify-center p-8">
                    <div className="max-w-md w-full bg-slate-900 border border-slate-800 p-10 rounded-[2.5rem] text-center space-y-6">
                        <div className="text-5xl">⏳</div>
                        <h2 className="text-2xl font-black uppercase tracking-tight">Report Not Ready</h2>
                        <p className="text-slate-500 font-medium">This session is still being processed by our AI network. Please check back in a few moments.</p>
                        <Link to="/dashboard" className="inline-block w-full bg-blue-600 text-white py-4 rounded-2xl font-black uppercase tracking-widest shadow-xl transition hover:bg-blue-700 active:scale-95 text-xs">Return to Dashboard</Link>
                    </div>
                </main>
            </div>
        );
    }

    const { overallScore, metrics, role, level, questions, startTime, endTime } = activeSession;
    const finalMetrics = metrics || {};

    const barData = {
        labels: questions.map((_, i) => `Q${i + 1}`),
        datasets: [{
            label: 'Score',
            data: questions.map(q => q.technicalScore || 0),
            backgroundColor: questions.map(q => (q.technicalScore || 0) > 70 ? '#3b82f6' : '#f59e0b'),
            borderRadius: 6,
        }],
    };

    return (
        <div className="flex bg-black min-h-screen text-white">
            <Sidebar />
            <main className="flex-1 ml-64 p-8 overflow-auto">
                <div className="max-w-5xl mx-auto space-y-12">
                    {/* Header */}
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 border-b border-slate-900 pb-10">
                        <div>
                            <span className="text-blue-500 font-black uppercase tracking-[0.2em] text-[10px]">Assessment Analysis</span>
                            <h1 className="text-4xl sm:text-5xl font-black tracking-tight mt-2 uppercase">
                                {role} <span className="text-slate-600 font-medium lowercase">({level})</span>
                            </h1>
                        </div>
                    </div>

                    {/* Summary Stats */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                        {[
                            { label: 'Overall Result', value: `${overallScore}%`, color: 'blue' },
                            { label: 'Avg Technical', value: `${finalMetrics.avgTechnical || 0}%`, color: 'slate' },
                            { label: 'Avg Confidence', value: `${finalMetrics.avgConfidence || 0}%`, color: 'slate' },
                            { label: 'Session Time', value: formatDuration(startTime, endTime), color: 'slate' }
                        ].map((stat, i) => (
                            <div key={i} className={`bg-slate-900/50 p-8 rounded-[2rem] border border-slate-800/50 group hover:border-slate-700 transition-colors`}>
                                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">{stat.label}</p>
                                <p className={`text-3xl font-black leading-none ${stat.color === 'blue' ? 'text-blue-500' : 'text-white'}`}>{stat.value}</p>
                            </div>
                        ))}
                    </div>

                    {/* Performance Chart */}
                    <div className="bg-slate-900/30 p-8 rounded-[2.5rem] border border-slate-800/50">
                        <h3 className="text-[10px] font-black text-slate-500 mb-8 uppercase tracking-[0.2em]">Per-Question Performance</h3>
                        <div className="h-64 sm:h-80 relative">
                            <Bar
                                data={barData}
                                options={{
                                    maintainAspectRatio: false,
                                    plugins: {
                                        legend: { display: false },
                                        tooltip: {
                                            backgroundColor: '#0f172a',
                                            titleFont: { size: 14, weight: 'bold' },
                                            bodyFont: { size: 12 },
                                            padding: 12,
                                            borderRadius: 8,
                                            borderWidth: 1,
                                            borderColor: '#1e293b'
                                        }
                                    },
                                    scales: {
                                        y: {
                                            beginAtZero: true,
                                            max: 100,
                                            grid: { color: '#1e293b', drawBorder: false },
                                            ticks: { color: '#64748b', font: { weight: 'bold' } }
                                        },
                                        x: {
                                            grid: { display: false },
                                            ticks: { color: '#64748b', font: { weight: 'bold' } }
                                        }
                                    }
                                }}
                            />
                        </div>
                    </div>

                    {/* Detailed Review */}
                    <div className="space-y-8">
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-xl shadow-lg shadow-blue-600/20">✓</div>
                            <h3 className="text-2xl font-black uppercase tracking-tight">Answer Intelligence</h3>
                        </div>

                        <div className="space-y-6">
                            {questions.map((q, index) => (
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true }}
                                    key={index}
                                    className="bg-slate-900/30 rounded-[2.5rem] border border-slate-800/50 overflow-hidden group hover:border-slate-700 transition-all duration-500"
                                >
                                    <div className="p-8 sm:p-10 space-y-8">
                                        <div className="flex flex-col lg:flex-row justify-between items-start gap-6">
                                            <h4 className="text-xl sm:text-2xl font-bold flex-1 leading-tight group-hover:text-blue-400 transition-colors">
                                                <span className="text-blue-500 mr-2 font-black italic">Q{index + 1}.</span> {sanitizeQuestionText(q.questionText)}
                                            </h4>
                                            <div className="flex gap-2 shrink-0">
                                                <div className="px-4 py-2 rounded-xl bg-blue-600/5 border border-blue-600/20 flex flex-col items-center min-w-[70px]">
                                                    <span className="text-[8px] font-black uppercase text-slate-500 mb-1">Tech Score</span>
                                                    <span className="text-sm font-black text-blue-500">{q.technicalScore}%</span>
                                                </div>
                                                <div className="px-4 py-2 rounded-xl bg-slate-800/30 border border-slate-700/50 flex flex-col items-center min-w-[70px]">
                                                    <span className="text-[8px] font-black uppercase text-slate-500 mb-1">Confidence</span>
                                                    <span className="text-sm font-black text-slate-300">{q.confidenceScore}%</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div className="space-y-3">
                                                <label className="text-[9px] font-black text-slate-600 uppercase tracking-widest ml-1">Your Submission</label>
                                                <div className="bg-slate-950/50 rounded-2xl border border-slate-800/50 p-6 min-h-[120px]">
                                                    {q.userAnswerText ? (
                                                        <p className="text-sm text-slate-400 italic leading-relaxed">"{q.userAnswerText}"</p>
                                                    ) : (
                                                        <p className="text-sm text-slate-600 italic">No oral answer recorded.</p>
                                                    )}
                                                    {q.userSubmittedCode && q.userSubmittedCode !== "undefined" && (
                                                        <div className="mt-4 pt-4 border-t border-slate-800">
                                                            <span className="text-[9px] font-black text-slate-600 uppercase mb-2 block">Code</span>
                                                            <pre className="text-xs font-mono text-slate-500 whitespace-pre-wrap">{q.userSubmittedCode}</pre>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="space-y-3">
                                                <label className="text-[9px] font-black text-slate-600 uppercase tracking-widest ml-1">AI Feedback</label>
                                                <div className="bg-blue-600/5 border border-blue-600/10 p-6 rounded-2xl text-sm italic text-blue-400/80 leading-relaxed min-h-[120px]">
                                                    "{q.aiFeedback}"
                                                </div>
                                            </div>
                                        </div>

                                        <div className="pt-6 border-t border-slate-900/50">
                                            <label className="text-[9px] font-black text-slate-600 uppercase tracking-widest ml-1 mb-3 block">Ideal Solution</label>
                                            <pre className="bg-slate-950 p-8 rounded-2xl text-[12px] text-slate-500 font-mono whitespace-pre-wrap shadow-inner leading-relaxed overflow-x-auto">
                                                {formatIdealAnswer(q.idealAnswer)}
                                            </pre>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}

export default SessionReview;