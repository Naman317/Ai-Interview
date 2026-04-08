// frontend/src/pages/SheetDetails.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import Editor from '@monaco-editor/react';
import RoleIcon from '../components/RoleIcon';
import { toast } from 'react-toastify';

const SheetDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [sheet, setSheet] = useState(null);
    const [activeTab, setActiveTab] = useState('problems');
    const [selectedProblem, setSelectedProblem] = useState(null);
    const [code, setCode] = useState('');
    const [language, setLanguage] = useState('javascript');
    const [isEvaluating, setIsEvaluating] = useState(false);
    const [isGeneratingGuide, setIsGeneratingGuide] = useState(false);
    const [evaluation, setEvaluation] = useState(null);

    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

    useEffect(() => {
        fetchSheet();
    }, [id]);

    const fetchSheet = async () => {
        try {
            const { data } = await api.get(`/api/sheets/${id}`);
            setSheet(data);
            if (data.problems.length > 0) {
                selectProblem(data.problems[0]);
            }
        } catch (error) {
            toast.error('Failed to load sheet');
            console.error(error);
        }
    };

    const selectProblem = (problem) => {
        setSelectedProblem(problem);
        setCode(problem.userSolution?.code || getDefaultCode(language));
        setLanguage(problem.userSolution?.language || 'javascript');
        setEvaluation(problem.aiEvaluation || null);
    };

    const handleToggleComplete = async (e, problem) => {
        e.stopPropagation();
        const oldSheet = { ...sheet };
        const newStatus = problem.status === 'completed' ? 'not-started' : 'completed';
        
        // Optimistic Update
        const updatedProblems = sheet.problems.map(p => 
            p._id === problem._id ? { ...p, status: newStatus } : p
        );
        
        const completedCount = updatedProblems.filter(p => p.status === 'completed').length;
        const totalCount = updatedProblems.length;
        const newPercentage = Math.round((completedCount / totalCount) * 100);
        
        const updatedSheet = {
            ...sheet,
            problems: updatedProblems,
            progress: {
                ...sheet.progress,
                completed: completedCount,
                percentage: newPercentage
            }
        };

        setSheet(updatedSheet);
        if (selectedProblem?._id === problem._id) {
            setSelectedProblem({ ...selectedProblem, status: newStatus });
        }

        try {
            const { data } = await api.put(`/api/sheets/${id}/problems/${problem._id}`, {
                status: newStatus
            });
            // Final sync with server data
            setSheet(data);
            if (selectedProblem?._id === problem._id) {
                const syncProblem = data.problems.find(p => p._id === problem._id);
                if (syncProblem) setSelectedProblem(syncProblem);
            }
        } catch (error) {
            setSheet(oldSheet); // Rollback
            toast.error('Failed to sync with server');
        }
    };

    const getDefaultCode = (lang) => {
        const templates = {
            javascript: '// Write your solution here\nfunction solution() {\n    \n}',
            python: '# Write your solution here\ndef solution():\n    pass',
            java: 'public class Solution {\n    public void solution() {\n        \n    }\n}',
            cpp: '#include <iostream>\nusing namespace std;\n\nint main() {\n    // Write your solution here\n    return 0;\n}'
        };
        return templates[lang] || templates.javascript;
    };

    const handleSubmit = async () => {
        if (!code.trim()) {
            toast.error('Please write some code first');
            return;
        }

        try {
            await api.post(
                `/api/sheets/${id}/problems/${selectedProblem._id}/submit`,
                { code, language }
            );
            toast.success('Solution saved!');
            fetchSheet();
        } catch (error) {
            toast.error('Failed to save solution');
        }
    };

    const handleEvaluate = async () => {
        if (!code.trim()) {
            toast.error('Please write some code first');
            return;
        }

        setIsEvaluating(true);
        try {
            const { data } = await api.post(
                `/api/sheets/${id}/problems/${selectedProblem._id}/evaluate`,
                {}
            );
            setEvaluation(data.evaluation);
            toast.success('Code evaluated successfully!');
            fetchSheet();
        } catch (error) {
            toast.error('Failed to evaluate code');
        } finally {
            setIsEvaluating(false);
        }
    };

    const handleGenerateGuide = async () => {
        setIsGeneratingGuide(true);
        try {
            const { data } = await api.post(
                `/api/sheets/${id}/problems/${selectedProblem._id}/guide`,
                {}
            );
            // Update the selected problem in the local state with the new guide
            const updatedProblem = { ...selectedProblem, interviewGuide: data.guide };
            setSelectedProblem(updatedProblem);

            // Also update the sheet state to keep it in sync
            setSheet(prev => ({
                ...prev,
                problems: prev.problems.map(p => p._id === selectedProblem._id ? updatedProblem : p)
            }));

            toast.success('Interview guide generated!');
        } catch (error) {
            toast.error('Failed to generate guide');
        } finally {
            setIsGeneratingGuide(false);
        }
    };

    const handleLanguageChange = (newLang) => {
        setLanguage(newLang);
        if (!selectedProblem.userSolution?.code) {
            setCode(getDefaultCode(newLang));
        }
    };

    if (!sheet) {
        return (
            <div className="min-h-screen bg-slate-900 flex items-center justify-center">
                <div className="text-white text-xl">Loading...</div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-900 text-white p-6">
            {/* Header */}
            <div className="max-w-7xl mx-auto mb-6">
                <button
                    onClick={() => navigate('/coding-practice')}
                    className="text-blue-400 hover:text-blue-300 mb-4"
                >
                    ← Back to Sheets
                </button>
                <div className="flex justify-between items-start">
                    <div>
                        <h1 className="text-4xl font-black mb-2">{sheet.title}</h1>
                        <p className="text-slate-400">{sheet.description}</p>
                        <div className="flex gap-4 mt-4">
                            <span className="px-3 py-1 bg-blue-600 rounded-full text-sm">
                                {sheet.category}
                            </span>
                            <span className="px-3 py-1 bg-purple-600 rounded-full text-sm">
                                {sheet.difficulty}
                            </span>
                        </div>
                    </div>
                    <div className="text-right">
                        <div className="text-3xl font-bold text-green-400">
                            {sheet.progress.percentage}%
                        </div>
                        <div className="text-slate-400 text-sm">
                            {sheet.progress.completed} / {sheet.progress.total} completed
                        </div>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="max-w-7xl mx-auto mb-6">
                <div className="flex gap-4 border-b border-slate-700">
                    {['problems', 'coding', 'evaluation', 'guide'].map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`px-6 py-3 font-bold capitalize transition ${activeTab === tab
                                ? 'border-b-2 border-blue-500 text-blue-400'
                                : 'text-slate-400 hover:text-white'
                                }`}
                        >
                            {tab}
                        </button>
                    ))}
                </div>
            </div>

            {/* Content */}
            <div className="max-w-7xl mx-auto">
                {activeTab === 'problems' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {sheet.problems.map((problem, index) => (
                            <motion.div
                                key={problem._id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.1 }}
                                onClick={() => {
                                    selectProblem(problem);
                                    setActiveTab('coding');
                                }}
                                className="bg-slate-800 p-6 rounded-xl cursor-pointer hover:bg-slate-700 transition"
                            >
                                <div className="flex justify-between items-start mb-3">
                                    <div className="flex items-center gap-3">
                                        <button
                                            onClick={(e) => handleToggleComplete(e, problem)}
                                            className={`p-1.5 rounded-lg border-2 transition-all ${
                                                problem.status === 'completed' 
                                                ? 'bg-green-500/10 border-green-500 text-green-500' 
                                                : 'border-slate-600 text-slate-600 hover:border-slate-400'
                                            }`}
                                            title="Mark as completed"
                                        >
                                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                            </svg>
                                        </button>
                                        <h3 className="text-xl font-bold">{problem.title}</h3>
                                    </div>
                                    <span
                                        className={`px-2 py-1 rounded text-xs capitalize ${problem.status === 'completed'
                                            ? 'bg-green-600'
                                            : problem.status === 'in-progress'
                                                ? 'bg-yellow-600'
                                                : 'bg-slate-600'
                                            }`}
                                    >
                                        {problem.status === 'not-started' ? 'To Do' : problem.status}
                                    </span>
                                </div>
                                <p className="text-slate-400 text-sm mb-3 line-clamp-2">
                                    {problem.description}
                                </p>
                                <div className="flex gap-2">
                                    <span
                                        className={`px-2 py-1 rounded text-xs ${problem.difficulty === 'Easy'
                                            ? 'bg-green-600'
                                            : problem.difficulty === 'Medium'
                                                ? 'bg-yellow-600'
                                                : 'bg-red-600'
                                            }`}
                                    >
                                        {problem.difficulty}
                                    </span>
                                    {problem.tags.slice(0, 2).map((tag) => (
                                        <span key={tag} className="px-2 py-1 bg-slate-700 rounded text-xs">
                                            {tag}
                                        </span>
                                    ))}
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}

                {activeTab === 'coding' && selectedProblem && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Problem Description */}
                        <div className="bg-slate-800 p-6 rounded-xl h-fit">
                            <h2 className="text-2xl font-bold mb-4">{selectedProblem.title}</h2>
                            <p className="text-slate-300 mb-6 whitespace-pre-wrap">
                                {selectedProblem.description}
                            </p>

                            {selectedProblem.examples && selectedProblem.examples.length > 0 && (
                                <div className="mb-6">
                                    <h3 className="text-lg font-bold mb-3">Examples:</h3>
                                    {selectedProblem.examples.map((ex, i) => (
                                        <div key={i} className="bg-slate-900 p-4 rounded mb-3">
                                            <div className="mb-2">
                                                <span className="text-slate-400">Input:</span>
                                                <code className="ml-2 text-green-400">{ex.input}</code>
                                            </div>
                                            <div className="mb-2">
                                                <span className="text-slate-400">Output:</span>
                                                <code className="ml-2 text-blue-400">{ex.output}</code>
                                            </div>
                                            {ex.explanation && (
                                                <div className="text-slate-400 text-sm mt-2">
                                                    {ex.explanation}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}

                            {selectedProblem.constraints && selectedProblem.constraints.length > 0 && (
                                <div>
                                    <h3 className="text-lg font-bold mb-3">Constraints:</h3>
                                    <ul className="list-disc list-inside text-slate-400 space-y-1">
                                        {selectedProblem.constraints.map((c, i) => (
                                            <li key={i}>{c}</li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </div>

                        {/* Code Editor */}
                        <div className="bg-slate-800 p-6 rounded-xl">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-xl font-bold">Your Solution</h3>
                                <select
                                    value={language}
                                    onChange={(e) => handleLanguageChange(e.target.value)}
                                    className="bg-slate-700 px-4 py-2 rounded"
                                >
                                    <option value="javascript">JavaScript</option>
                                    <option value="python">Python</option>
                                    <option value="java">Java</option>
                                    <option value="cpp">C++</option>
                                </select>
                            </div>

                            <div className="mb-4 rounded-lg overflow-hidden">
                                <Editor
                                    height="400px"
                                    language={language}
                                    value={code}
                                    onChange={(value) => setCode(value || '')}
                                    theme="vs-dark"
                                    options={{
                                        minimap: { enabled: false },
                                        fontSize: 14,
                                        lineNumbers: 'on',
                                        scrollBeyondLastLine: false,
                                        automaticLayout: true
                                    }}
                                />
                            </div>

                            <div className="flex gap-4">
                                <button
                                    onClick={handleSubmit}
                                    className="flex-1 px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg font-bold transition"
                                >
                                    💾 Save Solution
                                </button>
                                <button
                                    onClick={handleEvaluate}
                                    disabled={isEvaluating}
                                    className="flex-1 px-6 py-3 bg-green-600 hover:bg-green-700 rounded-lg font-bold transition disabled:opacity-50"
                                >
                                    {isEvaluating ? '⏳ Evaluating...' : '🤖 AI Evaluate'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'evaluation' && selectedProblem && (
                    <div className="bg-slate-800 p-8 rounded-xl max-w-4xl mx-auto">
                        {evaluation ? (
                            <div className="space-y-6">
                                <h2 className="text-3xl font-black mb-6">AI Evaluation Results</h2>

                                {/* Score Cards */}
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div className="bg-slate-900 p-6 rounded-lg text-center">
                                        <div className="text-4xl font-black text-green-400 mb-2">
                                            {evaluation.correctness}%
                                        </div>
                                        <div className="text-slate-400">Correctness</div>
                                    </div>
                                    <div className="bg-slate-900 p-6 rounded-lg text-center">
                                        <div className="text-2xl font-bold text-blue-400 mb-2">
                                            {evaluation.timeComplexity}
                                        </div>
                                        <div className="text-slate-400">Time Complexity</div>
                                    </div>
                                    <div className="bg-slate-900 p-6 rounded-lg text-center">
                                        <div className="text-2xl font-bold text-purple-400 mb-2">
                                            {evaluation.spaceComplexity}
                                        </div>
                                        <div className="text-slate-400">Space Complexity</div>
                                    </div>
                                </div>

                                {/* Test Results */}
                                <div className="bg-slate-900 p-6 rounded-lg">
                                    <h3 className="text-xl font-bold mb-3">Test Cases</h3>
                                    <div className="text-lg">
                                        <span className="text-green-400 font-bold">
                                            {evaluation.passedTests}
                                        </span>
                                        <span className="text-slate-400"> / {evaluation.totalTests} passed</span>
                                    </div>
                                </div>

                                {/* Feedback */}
                                <div className="bg-slate-900 p-6 rounded-lg">
                                    <h3 className="text-xl font-bold mb-3">Feedback</h3>
                                    <p className="text-slate-300 whitespace-pre-wrap">{evaluation.feedback}</p>
                                </div>

                                {/* Suggestions */}
                                {evaluation.suggestions && evaluation.suggestions.length > 0 && (
                                    <div className="bg-slate-900 p-6 rounded-lg">
                                        <h3 className="text-xl font-bold mb-3">Suggestions for Improvement</h3>
                                        <ul className="space-y-2">
                                            {evaluation.suggestions.map((suggestion, i) => (
                                                <li key={i} className="flex items-start gap-3">
                                                    <span className="text-yellow-400 mt-1">💡</span>
                                                    <span className="text-slate-300">{suggestion}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="text-center py-12">
                                <div className="flex justify-center mb-4">
                                    <RoleIcon icon="robot" className="w-16 h-16 text-blue-500 opacity-50" />
                                </div>
                                <h3 className="text-2xl font-bold mb-2">No Evaluation Yet</h3>
                                <p className="text-slate-400 mb-6">
                                    Submit your solution and click "AI Evaluate" to get feedback
                                </p>
                                <button
                                    onClick={() => setActiveTab('coding')}
                                    className="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg font-bold"
                                >
                                    Go to Coding
                                </button>
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'guide' && selectedProblem && (
                    <div className="max-w-4xl mx-auto">
                        {selectedProblem.interviewGuide && selectedProblem.interviewGuide.approach ? (
                            <div className="space-y-8">
                                <div className="flex justify-between items-center mb-6">
                                    <h2 className="text-3xl font-black">Interview Strategy Guide</h2>
                                    <div className="flex gap-4">
                                        <div className="bg-slate-800 px-4 py-2 rounded-xl border border-slate-700">
                                            <span className="text-slate-500 text-[10px] font-black uppercase block">Time Complexity</span>
                                            <span className="text-blue-400 font-bold">{selectedProblem.interviewGuide.complexityAnalysis.time}</span>
                                        </div>
                                        <div className="bg-slate-800 px-4 py-2 rounded-xl border border-slate-700">
                                            <span className="text-slate-500 text-[10px] font-black uppercase block">Space Complexity</span>
                                            <span className="text-purple-400 font-bold">{selectedProblem.interviewGuide.complexityAnalysis.space}</span>
                                        </div>
                                        <button
                                            onClick={handleGenerateGuide}
                                            disabled={isGeneratingGuide}
                                            className="p-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl text-slate-400 hover:text-white transition-all disabled:opacity-50"
                                            title="Regenerate Strategy Guide"
                                        >
                                            <svg className={`w-5 h-5 ${isGeneratingGuide ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                            </svg>
                                        </button>
                                    </div>
                                </div>

                                <section className="bg-slate-800/50 border border-slate-700 p-8 rounded-3xl">
                                    <div className="flex items-center gap-3 mb-4 text-blue-400">
                                        <RoleIcon icon="brain" className="w-6 h-6" />
                                        <h3 className="text-xl font-bold text-white">Conceptual Approach</h3>
                                    </div>
                                    <div className="text-slate-300 leading-relaxed">
                                        {Array.isArray(selectedProblem.interviewGuide.approach) ? (
                                            <div className="space-y-4">
                                                {selectedProblem.interviewGuide.approach.map((step, idx) => (
                                                    <div key={idx} className="flex gap-4">
                                                        <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center text-[10px] font-bold">
                                                            {idx + 1}
                                                        </span>
                                                        <p className="flex-1 pt-0.5">{step}</p>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="whitespace-pre-wrap">{selectedProblem.interviewGuide.approach}</div>
                                        )}
                                    </div>
                                </section>

                                <section className="bg-blue-600/5 border border-blue-600/20 p-8 rounded-3xl relative overflow-hidden">
                                    <div className="absolute top-0 right-0 p-8 opacity-5">
                                        <span className="text-6xl text-blue-500 font-black">QUOTE</span>
                                    </div>
                                    <div className="flex items-center gap-3 mb-4 text-blue-400">
                                        <RoleIcon icon="speech" className="w-6 h-6" />
                                        <h3 className="text-xl font-bold text-blue-400">How to Explain (Talking Points)</h3>
                                    </div>
                                    <div className="bg-slate-900/50 p-6 rounded-2xl italic text-slate-300 border border-blue-500/10">
                                        "{selectedProblem.interviewGuide.verbalization}"
                                    </div>
                                    <p className="mt-4 text-xs text-slate-500 font-medium tracking-tight flex items-center gap-1.5">
                                        <RoleIcon icon="lightbulb" className="w-3 h-3 text-yellow-500" />
                                        Tip: Use these phrases to guide the interviewer through your thought process clearly.
                                    </p>
                                </section>
                            </div>
                        ) : (
                            <div className="text-center py-20 bg-slate-800/30 rounded-3xl border-2 border-dashed border-slate-700">
                                <div className="flex justify-center mb-6">
                                    <RoleIcon icon="mic" className="w-16 h-16 text-blue-500 opacity-50" />
                                </div>
                                <h3 className="text-2xl font-bold mb-3">No Interview Guide Available</h3>
                                <p className="text-slate-400 mb-8 max-w-md mx-auto">
                                    Let AI analyze this problem and generate a step-by-step approach and verbalization script for your interview.
                                </p>
                                <button
                                    onClick={handleGenerateGuide}
                                    disabled={isGeneratingGuide}
                                    className="px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white font-black rounded-2xl transition-all shadow-xl shadow-blue-600/20 disabled:opacity-50"
                                >
                                    {isGeneratingGuide ? '🤖 AI is analyzing problem...' : '✨ Generate Interview Guide'}
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default SheetDetails;
