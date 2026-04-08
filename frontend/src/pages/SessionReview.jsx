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
            <div className="flex bg-surface min-h-screen text-gray-900">
                <Sidebar />
                <main className="flex-1 ml-64 flex items-center justify-center p-8">
                    <div className="text-center space-y-4">
                        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-accent border-gray-200 mx-auto" />
                        <p className="text-gray-400 text-sm font-medium">Generating your analysis...</p>
                    </div>
                </main>
            </div>
        );
    }

    if (!activeSession || activeSession.status !== 'completed') {
        return (
            <div className="flex bg-surface min-h-screen text-gray-900">
                <Sidebar />
                <main className="flex-1 ml-64 flex items-center justify-center p-8">
                    <div className="max-w-md w-full bg-white border border-gray-200 p-10 rounded-2xl text-center space-y-6 shadow-card">
                        <div className="w-16 h-16 bg-amber-50 rounded-2xl mx-auto flex items-center justify-center">
                            <svg className="w-8 h-8 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <h2 className="text-xl font-bold text-primary">Report Not Ready</h2>
                        <p className="text-gray-500 text-sm">This session is still being processed. Please check back in a few moments.</p>
                        <Link to="/dashboard" className="inline-block w-full bg-accent text-white py-3 rounded-xl font-semibold shadow-sm transition hover:bg-blue-700 text-sm">Return to Dashboard</Link>
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
            backgroundColor: questions.map(q => (q.technicalScore || 0) > 70 ? '#2563eb' : '#f59e0b'),
            borderRadius: 8,
        }],
    };

    return (
        <div className="flex bg-surface min-h-screen text-gray-900">
            <Sidebar />
            <main className="flex-1 ml-64 p-8 overflow-auto">
                <div className="max-w-5xl mx-auto space-y-10">
                    {/* Header */}
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 border-b border-gray-200 pb-8">
                        <div>
                            <span className="text-accent font-semibold text-xs uppercase tracking-wider">Assessment Analysis</span>
                            <h1 className="text-3xl sm:text-4xl font-bold text-primary mt-2">
                                {role} <span className="text-gray-400 font-normal text-lg">({level})</span>
                            </h1>
                        </div>
                    </div>

                    {/* Summary Stats */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                        {[
                            { label: 'Overall Result', value: `${overallScore}%`, highlight: true },
                            { label: 'Avg Technical', value: `${finalMetrics.avgTechnical || 0}%` },
                            { label: 'Avg Confidence', value: `${finalMetrics.avgConfidence || 0}%` },
                            { label: 'Session Time', value: formatDuration(startTime, endTime) }
                        ].map((stat, i) => (
                            <div key={i} className="bg-white p-6 rounded-2xl border border-gray-200 shadow-card hover:shadow-card-hover transition-all">
                                <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">{stat.label}</p>
                                <p className={`text-3xl font-bold ${stat.highlight ? 'text-accent' : 'text-gray-900'}`}>{stat.value}</p>
                            </div>
                        ))}
                    </div>

                    {/* Performance Chart */}
                    <div className="bg-white p-8 rounded-2xl border border-gray-200 shadow-card">
                        <h3 className="text-xs font-medium text-gray-400 mb-6 uppercase tracking-wider">Per-Question Performance</h3>
                        <div className="h-64 sm:h-80 relative">
                            <Bar
                                data={barData}
                                options={{
                                    maintainAspectRatio: false,
                                    plugins: {
                                        legend: { display: false },
                                        tooltip: {
                                            backgroundColor: '#ffffff',
                                            titleColor: '#1a1a5e',
                                            bodyColor: '#6b7280',
                                            titleFont: { size: 14, weight: 'bold' },
                                            bodyFont: { size: 12 },
                                            padding: 12,
                                            borderRadius: 12,
                                            borderWidth: 1,
                                            borderColor: '#e5e7eb'
                                        }
                                    },
                                    scales: {
                                        y: {
                                            beginAtZero: true,
                                            max: 100,
                                            grid: { color: '#f3f4f6', drawBorder: false },
                                            ticks: { color: '#9ca3af', font: { weight: '500' } }
                                        },
                                        x: {
                                            grid: { display: false },
                                            ticks: { color: '#9ca3af', font: { weight: '500' } }
                                        }
                                    }
                                }}
                            />
                        </div>
                    </div>

                    {/* Detailed Review */}
                    <div className="space-y-6">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-accent rounded-xl flex items-center justify-center shadow-sm">
                                <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                            <h3 className="text-xl font-bold text-primary">Answer Intelligence</h3>
                        </div>

                        <div className="space-y-6">
                            {questions.map((q, index) => (
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true }}
                                    key={index}
                                    className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-card hover:shadow-card-hover transition-all duration-300"
                                >
                                    <div className="p-8 space-y-6">
                                        <div className="flex flex-col lg:flex-row justify-between items-start gap-4">
                                            <h4 className="text-base sm:text-lg font-semibold flex-1 leading-relaxed text-gray-900">
                                                <span className="text-accent mr-2 font-bold">Q{index + 1}.</span> {sanitizeQuestionText(q.questionText)}
                                            </h4>
                                            <div className="flex gap-2 shrink-0">
                                                <div className="px-4 py-2 rounded-xl bg-accent/5 border border-accent/20 flex flex-col items-center min-w-[70px]">
                                                    <span className="text-[9px] font-medium uppercase text-gray-400 mb-1">Tech Score</span>
                                                    <span className="text-sm font-bold text-accent">{q.technicalScore}%</span>
                                                </div>
                                                <div className="px-4 py-2 rounded-xl bg-gray-50 border border-gray-200 flex flex-col items-center min-w-[70px]">
                                                    <span className="text-[9px] font-medium uppercase text-gray-400 mb-1">Confidence</span>
                                                    <span className="text-sm font-bold text-gray-700">{q.confidenceScore}%</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div className="space-y-2">
                                                <label className="text-xs font-medium text-gray-400 uppercase tracking-wider">Your Submission</label>
                                                <div className="bg-gray-50 rounded-xl border border-gray-100 p-5 min-h-[120px]">
                                                    {q.userAnswerText ? (
                                                        <p className="text-sm text-gray-600 italic leading-relaxed">"{q.userAnswerText}"</p>
                                                    ) : (
                                                        <p className="text-sm text-gray-400 italic">No oral answer recorded.</p>
                                                    )}
                                                    {q.userSubmittedCode && q.userSubmittedCode !== "undefined" && (
                                                        <div className="mt-4 pt-4 border-t border-gray-200">
                                                            <span className="text-xs font-medium text-gray-400 uppercase mb-2 block">Code</span>
                                                            <pre className="text-xs font-mono text-gray-600 whitespace-pre-wrap">{q.userSubmittedCode}</pre>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-xs font-medium text-gray-400 uppercase tracking-wider">AI Feedback</label>
                                                <div className="bg-accent/5 border border-accent/10 p-5 rounded-xl text-sm text-accent/80 leading-relaxed min-h-[120px]">
                                                    "{q.aiFeedback}"
                                                </div>
                                            </div>
                                        </div>

                                        <div className="pt-6 border-t border-gray-100">
                                            <label className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-3 block">Ideal Solution</label>
                                            <pre className="bg-gray-50 p-6 rounded-xl text-xs text-gray-600 font-mono whitespace-pre-wrap leading-relaxed overflow-x-auto border border-gray-100">
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