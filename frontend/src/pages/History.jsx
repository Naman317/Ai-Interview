import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { motion } from 'framer-motion';
import Sidebar from '../components/Sidebar';
import SessionHistory from '../components/SessionHistory';
import { getSessions } from '../features/sessions/sessionSlice';

const History = () => {
    const dispatch = useDispatch();
    const { sessions, isLoading } = useSelector((state) => state.sessions);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');

    useEffect(() => {
        dispatch(getSessions());
    }, [dispatch]);

    const filteredSessions = sessions.filter(session => {
        const matchesSearch = session.role.toLowerCase().includes(searchTerm.toLowerCase()) || 
                             session.level.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = filterStatus === 'all' || session.status === filterStatus;
        return matchesSearch && matchesStatus;
    });

    return (
        <div className="flex min-h-screen bg-surface">
            <Sidebar />

            <main className="flex-1 ml-64 p-8">
                <header className="mb-10">
                    <h1 className="text-3xl font-bold text-primary mb-1">Interview History</h1>
                    <p className="text-gray-500 text-sm">Review and manage all your past interview sessions</p>
                </header>

                <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-8 shadow-card flex flex-col md:flex-row gap-4 items-center justify-between">
                    <div className="relative w-full md:w-96">
                        <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                        <input
                            type="text"
                            placeholder="Search by role or level..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all text-sm"
                        />
                    </div>

                    <div className="flex gap-2">
                        {['all', 'completed', 'in-progress', 'failed'].map((status) => (
                            <button
                                key={status}
                                onClick={() => setFilterStatus(status)}
                                className={`px-4 py-2 rounded-xl text-xs font-bold capitalize transition-all ${
                                    filterStatus === status
                                        ? 'bg-accent text-white shadow-sm'
                                        : 'bg-white text-gray-500 border border-gray-200 hover:border-gray-300'
                                }`}
                            >
                                {status}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="bg-white rounded-3xl border border-gray-200 p-8 shadow-card min-h-[500px]">
                    {isLoading ? (
                        <div className="flex justify-center items-center h-64">
                            <div className="w-10 h-10 border-4 border-gray-200 border-t-accent rounded-full animate-spin" />
                        </div>
                    ) : (
                        <div className="overflow-y-visible"> {/* Allow expanded cards to show overflow */}
                             <SessionHistory sessions={filteredSessions} />
                             {filteredSessions.length === 0 && (
                                <div className="text-center py-20">
                                    <p className="text-gray-400">No sessions found matching your criteria.</p>
                                </div>
                             )}
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
};

export default History;
