import { useState, useRef, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { createSession } from '../features/sessions/sessionSlice';
import { toast } from 'react-toastify';
import RoleIcon from '../components/RoleIcon';
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
    const [currentStep, setCurrentStep] = useState(1);
    const [formData, setFormData] = useState({
        role: 'mern',
        level: 'medium',
        interviewType: 'voice',
        count: 5,
        useProfileResume: false,
    });
    const [selectedFile, setSelectedFile] = useState(null);
    const [prepStatus, setPrepStatus] = useState(null);

    const nextStep = () => setCurrentStep(prev => Math.min(prev + 1, 3));
    const prevStep = () => setCurrentStep(prev => Math.max(prev - 1, 1));

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
            <div className="flex bg-surface min-h-screen text-gray-900 items-center justify-center p-8 font-sans">
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-white rounded-2xl border border-gray-200 shadow-elevated max-w-md w-full text-center space-y-8 p-12"
                >
                    <div className="relative w-28 h-28 mx-auto">
                        <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                            className="absolute inset-0 border-t-4 border-accent rounded-full"
                        />
                        <div className="absolute inset-0 border-4 border-gray-100 rounded-full" />
                        <div className="absolute inset-0 flex items-center justify-center">
                            <svg className="w-10 h-10 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                {prepStatus.status === 'AI_TRANSCRIBING' ? (
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                                ) : prepStatus.status === 'AI_GENERATING_QUESTIONS' ? (
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                                ) : (
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                )}
                            </svg>
                        </div>
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-primary mb-2">Preparing Session</h2>
                        <p className="text-gray-400 text-sm animate-pulse">
                            {prepStatus.message}
                        </p>
                    </div>
                    <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <motion.div
                            initial={{ width: "0%" }}
                            animate={{ width: "100%" }}
                            transition={{ duration: 15 }}
                            className="h-full bg-accent rounded-full"
                        />
                    </div>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="p-8">
            <div className="max-w-4xl mx-auto pt-10">
                    {/* Progress Header */}
                    <header className="mb-12">
                        <div className="flex items-center justify-between mb-8 max-w-2xl mx-auto">
                            {[1, 2, 3].map((s) => (
                                <div key={s} className="flex flex-col items-center relative z-10">
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-500 font-bold text-sm ${currentStep >= s ? 'bg-accent text-white shadow-xl scale-110' : 'bg-gray-100 text-gray-400'}`}>
                                        {s}
                                    </div>
                                    <span className={`text-[10px] uppercase tracking-widest font-black mt-2 transition-colors ${currentStep >= s ? 'text-accent' : 'text-gray-300'}`}>
                                        {s === 1 ? 'Path' : s === 2 ? 'Context' : 'Launch'}
                                    </span>
                                </div>
                            ))}
                            {/* Connector Line */}
                            <div className="absolute left-0 right-0 top-5 h-0.5 bg-gray-100 -z-1" style={{ width: '400px', left: '50%', transform: 'translateX(-50%)' }}>
                                <motion.div 
                                    className="h-full bg-accent"
                                    initial={{ width: "0%" }}
                                    animate={{ width: `${(currentStep - 1) * 50}%` }}
                                    transition={{ duration: 0.5 }}
                                />
                            </div>
                        </div>
                        <div className="text-center">
                            <h1 className="text-4xl font-extrabold text-primary mb-2 tracking-tight">
                                {currentStep === 1 ? 'Choose Your Journey' : currentStep === 2 ? 'Set the Context' : 'Final Adjustments'}
                            </h1>
                            <p className="text-gray-400 text-base font-medium">
                                {currentStep === 1 ? 'Select a predefined track or use your own resume' : currentStep === 2 ? 'Provide the details our AI needs to tailor your session' : 'Almost there! Fine-tune the difficulty and mode'}
                            </p>
                        </div>
                    </header>

                    <form onSubmit={handleStartInterview} className="relative">
                        <AnimatePresence mode="wait">
                            {currentStep === 1 && (
                                <motion.div
                                    key="step1"
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    className="grid grid-cols-1 md:grid-cols-2 gap-6"
                                >
                                    <button
                                        type="button"
                                        onClick={() => { setMode('track'); nextStep(); }}
                                        className="group p-8 bg-white border border-gray-200 rounded-3xl hover:border-accent hover:shadow-2xl transition-all text-left relative overflow-hidden"
                                    >
                                        <div className="w-14 h-14 bg-accent/10 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                                            <svg className="w-8 h-8 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                        </div>
                                        <h3 className="text-xl font-bold text-gray-900 mb-2">Standard Track</h3>
                                        <p className="text-sm text-gray-400 font-medium leading-relaxed">
                                            Master industry-standard technical paths designed by experts.
                                        </p>
                                        <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-accent/5 rounded-full group-hover:scale-125 transition-transform"></div>
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => { setMode('resume'); nextStep(); }}
                                        className="group p-8 bg-white border border-gray-200 rounded-3xl hover:border-accent hover:shadow-2xl transition-all text-left relative overflow-hidden"
                                    >
                                        <div className="w-14 h-14 bg-indigo-50 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                                            <svg className="w-8 h-8 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                            </svg>
                                        </div>
                                        <h3 className="text-xl font-bold text-gray-900 mb-2">Resume Mode</h3>
                                        <p className="text-sm text-gray-400 font-medium leading-relaxed">
                                            A personalized experience generated entirely from your unique background.
                                        </p>
                                        <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-indigo-50/50 rounded-full group-hover:scale-125 transition-transform"></div>
                                    </button>
                                </motion.div>
                            )}

                            {currentStep === 2 && (
                                <motion.div
                                    key="step2"
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    className="space-y-6"
                                >
                                    {mode === 'track' ? (
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                            {ROLES.map((role) => (
                                                <button
                                                    key={role.id}
                                                    type="button"
                                                    onClick={() => setFormData({ ...formData, role: role.id })}
                                                    className={`p-6 rounded-3xl border transition-all text-left group relative ${formData.role === role.id ? 'bg-accent/5 border-accent shadow-lg' : 'bg-white border-gray-100 hover:border-accent/40'}`}
                                                >
                                                    <div className="mb-4 text-accent group-hover:scale-110 transition-transform">
                                                        <RoleIcon icon={role.icon} className="w-8 h-8" />
                                                    </div>
                                                    <p className="font-bold text-gray-900 text-sm mb-1">{role.label}</p>
                                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">{role.tech}</p>
                                                    {formData.role === role.id && (
                                                        <div className="absolute top-4 right-4 w-6 h-6 bg-accent rounded-full flex items-center justify-center shadow-lg">
                                                            <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                                            </svg>
                                                        </div>
                                                    )}
                                                </button>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <button
                                                type="button"
                                                disabled={!user?.cvFileName}
                                                onClick={() => {
                                                    setFormData(prev => ({ ...prev, useProfileResume: !prev.useProfileResume }));
                                                    setSelectedFile(null);
                                                }}
                                                className={`p-8 rounded-3xl border text-left transition-all group ${formData.useProfileResume ? 'bg-accent/5 border-accent shadow-lg' : 'bg-white border-gray-100 hover:border-gray-200 disabled:opacity-40'}`}
                                            >
                                                <div className="w-12 h-12 bg-accent/10 rounded-2xl flex items-center justify-center mb-6">
                                                    <svg className="w-6 h-6 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                                    </svg>
                                                </div>
                                                <p className="font-bold text-gray-900 mb-1">Use Active Profile CV</p>
                                                <p className="text-xs text-gray-400 font-medium">
                                                    {user?.cvFileName ? user.cvFileName : 'No CV in profile'}
                                                </p>
                                            </button>

                                            <div
                                                onClick={() => fileInputRef.current?.click()}
                                                className={`p-8 rounded-3xl border text-left transition-all cursor-pointer group ${selectedFile ? 'bg-indigo-50 border-indigo-400 shadow-lg' : 'bg-white border-gray-100 hover:border-gray-200'}`}
                                            >
                                                <input type="file" ref={fileInputRef} className="hidden" accept=".pdf,.docx" onChange={handleFileChange} />
                                                <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center mb-6">
                                                    <svg className="w-6 h-6 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                                                    </svg>
                                                </div>
                                                <p className="font-bold text-gray-900 mb-1">Upload One-time CV</p>
                                                <p className="text-xs text-gray-400 font-medium truncate">
                                                    {selectedFile ? selectedFile.name : 'PDF or DOCX (Max 5MB)'}
                                                </p>
                                            </div>
                                        </div>
                                    )}
                                    <div className="flex gap-4 pt-10">
                                        <button type="button" onClick={prevStep} className="px-8 py-3 bg-gray-50 text-gray-400 font-bold rounded-xl hover:bg-gray-100 transition-all">Back</button>
                                        <button type="button" onClick={nextStep} className="flex-1 py-3 bg-accent text-white font-bold rounded-xl hover:bg-blue-700 shadow-lg transition-all">Continue to Tuning</button>
                                    </div>
                                </motion.div>
                            )}

                            {currentStep === 3 && (
                                <motion.div
                                    key="step3"
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    className="space-y-10"
                                >
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                                        <section>
                                            <h2 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-6">Intensity Level</h2>
                                            <div className="space-y-3">
                                                {DIFFICULTIES.map((diff) => (
                                                    <button
                                                        key={diff.id}
                                                        type="button"
                                                        onClick={() => setFormData({ ...formData, level: diff.id })}
                                                        className={`w-full p-5 rounded-2xl border text-left transition-all flex items-center justify-between group ${formData.level === diff.id ? 'bg-accent/5 border-accent shadow-md' : 'bg-white border-gray-100 hover:border-gray-200'}`}
                                                    >
                                                        <div className="flex items-center gap-4">
                                                            <div className={`w-3 h-3 rounded-full ${formData.level === diff.id ? 'bg-accent scale-125' : 'bg-gray-100'}`}></div>
                                                            <div>
                                                                <span className="text-sm font-bold text-gray-900 block">{diff.label}</span>
                                                                <span className="text-[10px] font-bold text-gray-400 tracking-tight">{diff.desc}</span>
                                                            </div>
                                                        </div>
                                                        {formData.level === diff.id && <svg className="w-4 h-4 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                                                    </button>
                                                ))}
                                            </div>
                                        </section>

                                        <section>
                                            <h2 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-6">Execution Mode</h2>
                                            <div className="space-y-3">
                                                {INTERVIEW_TYPES.map((type) => (
                                                    <button
                                                        key={type.id}
                                                        type="button"
                                                        onClick={() => setFormData({ ...formData, interviewType: type.id })}
                                                        className={`w-full p-5 rounded-2xl border text-left transition-all flex items-center justify-between group ${formData.interviewType === type.id ? 'bg-accent/5 border-accent shadow-md' : 'bg-white border-gray-100 hover:border-gray-200'}`}
                                                    >
                                                        <div className="flex items-center gap-4">
                                                            <div className="text-accent group-hover:scale-110 transition-transform">
                                                                <RoleIcon icon={type.icon} className="w-6 h-6" />
                                                            </div>
                                                            <div>
                                                                <span className="text-sm font-bold text-gray-900 block">{type.label}</span>
                                                                <span className="text-[10px] font-bold text-gray-400 tracking-tight">{type.desc}</span>
                                                            </div>
                                                        </div>
                                                        {formData.interviewType === type.id && <svg className="w-4 h-4 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                                                    </button>
                                                ))}
                                            </div>
                                        </section>
                                    </div>

                                    <div className="flex gap-4 pt-10 border-t border-gray-100">
                                        <button type="button" onClick={prevStep} className="px-8 py-4 bg-gray-50 text-gray-400 font-bold rounded-2xl hover:bg-gray-100 transition-all">Back</button>
                                        <button
                                            type="submit"
                                            disabled={isLoading}
                                            className="flex-1 bg-accent hover:bg-blue-700 text-white font-black py-4 rounded-2xl transition-all shadow-2xl disabled:opacity-50 tracking-widest uppercase text-xs"
                                        >
                                            {isLoading ? 'Igniting Engine...' : 'Launch Session'}
                                        </button>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </form>
            </div>
        </div>
    );
}
