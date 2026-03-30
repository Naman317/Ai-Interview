import { useState, useRef, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { createSession } from '../features/sessions/sessionSlice';
import { toast } from 'react-toastify';
import Sidebar from '../components/Sidebar';
import { motion, AnimatePresence } from 'framer-motion';
import useSocket from '../hooks/useSocket';

import { ROLES, DIFFICULTIES, INTERVIEW_TYPES } from '../constants/interview';

export default function NewInterview() {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const fileInputRef = useRef(null);
    const { isLoading } = useSelector(state => state.sessions);
    const { user } = useSelector(state => state.auth);
    const socket = useSocket();

    const [mode, setMode] = useState('track'); // 'track' or 'resume'
    const [formData, setFormData] = useState({
        role: 'mern',
        level: 'medium',
        interviewType: 'voice',
        count: 5,
        useProfileResume: false,
    });
    const [selectedFile, setSelectedFile] = useState(null);
    const [prepStatus, setPrepStatus] = useState(null); // { status, message }

    useEffect(() => {
        if (!socket) return;

        const handleSessionUpdate = (payload) => {
            console.log('Preparation Update:', payload.status);
            if (payload.status === 'QUESTIONS_READY') {
                setPrepStatus({ status: 'READY', message: 'Igniting engine...' });
                setTimeout(() => {
                    if (formData.interviewType === 'voice') {
                        navigate(`/interview/${payload.sessionId}`);
                    } else {
                        navigate(`/video-interview/${payload.sessionId}`);
                    }
                }, 800);
            } else if (payload.status.startsWith('AI_')) {
                setPrepStatus({ status: payload.status, message: payload.message });
            } else if (payload.status === 'GENERATION_FAILED') {
                setPrepStatus(null);
                toast.error(payload.message);
            }
        };

        socket.on('sessionUpdate', handleSessionUpdate);
        return () => socket.off('sessionUpdate', handleSessionUpdate);
    }, [socket, formData.interviewType, navigate]);

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            if (file.size > 5 * 1024 * 1024) {
                toast.error('File too large (max 5MB)');
                return;
            }
            setSelectedFile(file);
            setFormData(prev => ({ ...prev, useProfileResume: false }));
        }
    };

    const handleStartInterview = async (e) => {
        e.preventDefault();
        setPrepStatus({ status: 'INIT', message: 'Initializing secure session...' });
        try {
            const data = new FormData();
            const finalRole = mode === 'resume' ? (formData.role || 'Software Engineer (Resume-based)') : formData.role;

            data.append('role', finalRole);
            data.append('level', formData.level);
            data.append('interviewType', formData.interviewType);
            data.append('count', formData.count);
            data.append('useProfileResume', mode === 'resume' ? formData.useProfileResume : false);

            if (mode === 'resume' && selectedFile) {
                data.append('resume', selectedFile);
            }

            const result = await dispatch(createSession(data)).unwrap();
            setPrepStatus({ status: 'CREATED', message: 'Session created. Parsing context...' });
        } catch (err) {
            setPrepStatus(null);
        }
    };

    if (prepStatus) {
        return (
            <div className="flex bg-background min-h-screen text-white items-center justify-center p-8 relative overflow-hidden font-sans">
                {/* Dynamic Animated Background Elements */}
                <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-primary/20 blur-[120px] rounded-full mix-blend-screen animate-float pointer-events-none" />
                <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-secondary/20 blur-[120px] rounded-full mix-blend-screen animate-float pointer-events-none" style={{ animationDelay: '3s' }} />
                
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="glass-card max-w-md w-full text-center space-y-8 p-12 relative z-10"
                >
                    <div className="relative w-32 h-32 mx-auto">
                        <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                            className="absolute inset-0 border-t-4 border-blue-600 rounded-full"
                        />
                        <div className="absolute inset-0 flex items-center justify-center text-4xl">
                            {prepStatus.status === 'AI_TRANSCRIBING' ? '🎙️' :
                                prepStatus.status === 'AI_GENERATING_QUESTIONS' ? '🧠' : '⚡'}
                        </div>
                    </div>
                    <div>
                        <h2 className="text-2xl font-black uppercase tracking-widest mb-2">Preparing Session</h2>
                        <p className="text-slate-500 font-bold text-xs uppercase tracking-tight animate-pulse">
                            {prepStatus.message}
                        </p>
                    </div>
                    <div className="h-1 bg-slate-900 rounded-full overflow-hidden">
                        <motion.div
                            initial={{ width: "0%" }}
                            animate={{ width: "100%" }}
                            transition={{ duration: 15 }}
                            className="h-full bg-blue-600"
                        />
                    </div>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="flex min-h-screen bg-background text-white relative overflow-hidden font-sans">
            {/* Dynamic Animated Background Elements */}
            <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-primary/20 blur-[120px] rounded-full mix-blend-screen animate-float pointer-events-none" />
            <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-secondary/20 blur-[120px] rounded-full mix-blend-screen animate-float pointer-events-none" style={{ animationDelay: '3s' }} />

            <Sidebar />
            <main className="flex-1 ml-64 p-8 relative z-10">
                <div className="max-w-4xl mx-auto">
                    <header className="mb-10 text-center">
                        <h1 className="text-4xl font-black mb-2 uppercase tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-white/60">Setup Interview</h1>
                        <p className="text-accent font-bold uppercase tracking-widest text-[10px]">Choose your path and begin</p>
                    </header>

                    <div className="flex gap-4 mb-12">
                        <button
                            onClick={() => setMode('track')}
                            className={`flex-1 p-6 rounded-[2rem] border transition-all text-left group ${mode === 'track' ? 'glass border-primary' : 'glass-card border-white/5 hover:border-white/20'}`}
                        >
                            <span className="text-3xl mb-4 block group-hover:scale-110 transition-transform origin-left">🎯</span>
                            <h3 className="font-black uppercase tracking-tight text-lg text-white">Standard Track</h3>
                            <p className="text-xs text-white/50 font-bold">Industry standard paths</p>
                        </button>
                        <button
                            onClick={() => setMode('resume')}
                            className={`flex-1 p-6 rounded-[2rem] border transition-all text-left group ${mode === 'resume' ? 'glass border-primary' : 'glass-card border-white/5 hover:border-white/20'}`}
                        >
                            <span className="text-3xl mb-4 block group-hover:scale-110 transition-transform origin-left">📄</span>
                            <h3 className="font-black uppercase tracking-tight text-lg text-white">Resume Mode</h3>
                            <p className="text-xs text-white/50 font-bold">Personalized questions</p>
                        </button>
                    </div>

                    <form onSubmit={handleStartInterview} className="space-y-12">
                        <AnimatePresence mode="wait">
                            {mode === 'track' ? (
                                <motion.section
                                    key="track"
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                >
                                    <h2 className="text-xs font-black text-slate-500 uppercase tracking-[0.2em] mb-6 ml-2">Select Specialization</h2>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                        {ROLES.map((role) => (
                                            <button
                                                key={role.id}
                                                type="button"
                                                onClick={() => setFormData({ ...formData, role: role.id })}
                                                className={`p-6 rounded-2xl border text-left transition-all ${formData.role === role.id ? 'glass border-primary shadow-[0_0_30px_rgba(59,130,246,0.3)]' : 'glass-card border-white/5 hover:border-white/20'}`}
                                            >
                                                <div className="flex justify-between items-start mb-4">
                                                    <span className="text-3xl">{role.icon}</span>
                                                    {formData.role === role.id && (
                                                        <div className="w-5 h-5 bg-blue-600 rounded-full flex items-center justify-center">
                                                            <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                                            </svg>
                                                        </div>
                                                    )}
                                                </div>
                                                <p className="font-black text-sm uppercase tracking-tight mb-1">{role.label}</p>
                                                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">{role.tech}</p>
                                            </button>
                                        ))}
                                    </div>
                                </motion.section>
                            ) : (
                                <motion.section
                                    key="resume"
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    className="space-y-6"
                                >
                                    <h2 className="text-xs font-black text-slate-500 uppercase tracking-[0.2em] mb-6 ml-2">Personalization Context</h2>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <button
                                            type="button"
                                            disabled={!user?.cvFileName}
                                            onClick={() => {
                                                setFormData(prev => ({ ...prev, useProfileResume: !prev.useProfileResume }));
                                                setSelectedFile(null);
                                            }}
                                            className={`p-8 rounded-[2rem] border text-left transition-all ${formData.useProfileResume ? 'glass border-primary shadow-[0_0_30px_rgba(59,130,246,0.3)]' : 'glass-card border-white/5 hover:border-white/20 disabled:opacity-30'}`}
                                        >
                                            <span className="text-3xl mb-4 block">🤵</span>
                                            <p className="font-black uppercase tracking-tight">Active Profile CV</p>
                                            <p className="text-xs text-slate-500 font-bold mt-1">
                                                {user?.cvFileName ? user.cvFileName : 'No CV in profile'}
                                            </p>
                                        </button>

                                        <div
                                            onClick={() => fileInputRef.current?.click()}
                                            className={`p-8 rounded-[2rem] border text-left transition-all cursor-pointer ${selectedFile ? 'glass border-primary' : 'glass-card border-white/5 hover:border-white/20'}`}
                                        >
                                            <input type="file" ref={fileInputRef} className="hidden" accept=".pdf,.docx" onChange={handleFileChange} />
                                            <span className="text-3xl mb-4 block">☁️</span>
                                            <p className="font-black uppercase tracking-tight">Upload New</p>
                                            <p className="text-xs text-slate-500 font-bold mt-1">
                                                {selectedFile ? selectedFile.name : 'PDF or DOCX (Max 5MB)'}
                                            </p>
                                        </div>
                                    </div>
                                </motion.section>
                            )}
                        </AnimatePresence>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-8 border-t border-slate-900">
                            <section>
                                <h2 className="text-xs font-black text-slate-500 uppercase tracking-[0.2em] mb-6 ml-2">Difficulty</h2>
                                <div className="space-y-3">
                                    {DIFFICULTIES.map((diff) => (
                                        <button
                                            key={diff.id}
                                            type="button"
                                            onClick={() => setFormData({ ...formData, level: diff.id })}
                                            className={`w-full p-4 rounded-xl border text-left transition-all flex items-center justify-between ${formData.level === diff.id ? 'glass border-primary' : 'glass-card border-white/5 hover:border-white/20'}`}
                                        >
                                            <span className="text-xs font-black uppercase tracking-widest">{diff.label}</span>
                                            {formData.level === diff.id && <div className="w-2 h-2 bg-blue-600 rounded-full" />}
                                        </button>
                                    ))}
                                </div>
                            </section>

                            <section>
                                <h2 className="text-xs font-black text-slate-500 uppercase tracking-[0.2em] mb-6 ml-2">Execution Mode</h2>
                                <div className="space-y-3">
                                    {INTERVIEW_TYPES.map((type) => (
                                        <button
                                            key={type.id}
                                            type="button"
                                            onClick={() => setFormData({ ...formData, interviewType: type.id })}
                                            className={`w-full p-4 rounded-xl border text-left transition-all flex items-center justify-between ${formData.interviewType === type.id ? 'glass border-primary' : 'glass-card border-white/5 hover:border-white/20'}`}
                                        >
                                            <div className="flex items-center gap-3">
                                                <span>{type.icon}</span>
                                                <span className="text-xs font-black uppercase tracking-widest">{type.label}</span>
                                            </div>
                                            {formData.interviewType === type.id && <div className="w-2 h-2 bg-blue-600 rounded-full" />}
                                        </button>
                                    ))}
                                </div>
                            </section>
                        </div>

                        <motion.button
                            whileHover={{ scale: 1.01 }}
                            whileTap={{ scale: 0.99 }}
                            type="submit"
                            disabled={isLoading}
                            className="w-full bg-gradient-to-r from-primary to-accent hover:opacity-90 text-white font-black uppercase tracking-[0.2em] text-xs py-6 rounded-2xl transition-all shadow-[0_0_30px_rgba(59,130,246,0.3)] disabled:opacity-50"
                        >
                            {isLoading ? 'Engineering Session...' : 'Launch Interview'}
                        </motion.button>
                    </form>
                </div>
            </main>
        </div>
    );
}
