import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import api from '../utils/api';
import { motion } from 'framer-motion';
import './FeedbackDashboard.css';

export default function FeedbackDashboard() {
    const { feedbackId } = useParams();
    const navigate = useNavigate();
    const [feedback, setFeedback] = useState(null);
    const [loading, setLoading] = useState(true);
    const [selectedQuestion, setSelectedQuestion] = useState(0);
    const [downloadLoading, setDownloadLoading] = useState(false);

    useEffect(() => {
        const loadFeedback = async () => {
            try {
                // For now, using sessionId approach - we can refactor based on your actual API
                const sessionId = feedbackId;
                const response = await api.get(`/api/interview/feedback/${sessionId}`);
                setFeedback(response.data);
                setLoading(false);
            } catch (error) {
                console.error('Error loading feedback:', error);
                setLoading(false);
            }
        };

        loadFeedback();
    }, [feedbackId]);

    const downloadReport = async () => {
        try {
            setDownloadLoading(true);
            // Generate PDF report (would need backend implementation)
            const report = generateTextReport();
            const element = document.createElement('a');
            element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(report));
            element.setAttribute('download', `interview_feedback_${new Date().getTime()}.txt`);
            element.style.display = 'none';
            document.body.appendChild(element);
            element.click();
            document.body.removeChild(element);
        } finally {
            setDownloadLoading(false);
        }
    };

    const generateTextReport = () => {
        if (!feedback) return '';
        
        let report = `INTERVIEW FEEDBACK REPORT\n`;
        report += `Generated: ${new Date().toLocaleString()}\n\n`;
        report += `═══════════════════════════════════════════\n`;
        report += `OVERALL SCORE: ${feedback.overallScore}/100\n`;
        report += `═══════════════════════════════════════════\n\n`;
        
        report += `METRICS:\n`;
        report += `├─ Communication Score: ${feedback.communicationScore}/100\n`;
        report += `├─ Technical Score: ${feedback.technicalScore}/100\n`;
        report += `└─ Confidence Level: ${feedback.confidenceLevel}\n\n`;
        
        report += `STRENGTHS:\n`;
        feedback.strengths.forEach(s => { report += `✓ ${s}\n`; });
        
        report += `\nIMPROVEMENTS:\n`;
        feedback.improvements.forEach(i => { report += `• ${i}\n`; });
        
        report += `\nRECOMMENDATIONS:\n`;
        feedback.recommendations.forEach(r => { report += `→ ${r}\n`; });
        
        report += `\n\nQUESTION BREAKDOWN:\n`;
        report += `═══════════════════════════════════════════\n`;
        feedback.questionBreakdown.forEach((q, index) => {
            report += `\nQ${index + 1}: ${q.questionText}\n`;
            report += `Type: ${q.questionType}\n`;
            report += `Technical Score: ${q.technicalScore}/100\n`;
            report += `Confidence Score: ${q.confidenceScore}/100\n`;
            report += `Feedback: ${q.feedback}\n`;
            report += `─────────────────────────────────────────\n`;
        });
        
        return report;
    };

    if (loading) {
        return (
            <div className="feedback-loading">
                <div className="spinner"></div>
                <p>Loading your feedback...</p>
            </div>
        );
    }

    if (!feedback) {
        return (
            <div className="feedback-error">
                <h2>Unable to load feedback</h2>
                <button onClick={() => navigate('/dashboard')} className="btn btn-primary">
                    Back to Dashboard
                </button>
            </div>
        );
    }

    const currentQuestion = feedback.questionBreakdown[selectedQuestion];

    return (
        <div className="feedback-container">
            {/* Header */}
            <motion.div 
                className="feedback-header"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
            >
                <h1>Interview Feedback & Results</h1>
                <button 
                    onClick={downloadReport}
                    className="btn btn-secondary"
                    disabled={downloadLoading}
                >
                    {downloadLoading ? '⏳ Generating...' : '📥 Download Report'}
                </button>
            </motion.div>

            <div className="feedback-content">
                {/* Overall Score Card */}
                <motion.div 
                    className="score-card"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.1 }}
                >
                    <div className="score-display">
                        <div className="score-circle">
                            <span className="score-value">{feedback.overallScore}</span>
                            <span className="score-max">/100</span>
                        </div>
                        <div className="score-info">
                            <h2>Overall Performance</h2>
                            <p className={`confidence-level ${feedback.confidenceLevel}`}>
                                {feedback.confidenceLevel.toUpperCase()} CONFIDENCE
                            </p>
                        </div>
                    </div>

                    <div className="metrics-grid">
                        <div className="metric">
                            <div className="metric-value">{feedback.communicationScore}</div>
                            <div className="metric-label">Communication</div>
                            <div className="metric-bar">
                                <div 
                                    className="metric-fill" 
                                    style={{ width: `${feedback.communicationScore}%` }}
                                ></div>
                            </div>
                        </div>
                        <div className="metric">
                            <div className="metric-value">{feedback.technicalScore}</div>
                            <div className="metric-label">Technical</div>
                            <div className="metric-bar">
                                <div 
                                    className="metric-fill" 
                                    style={{ width: `${feedback.technicalScore}%` }}
                                ></div>
                            </div>
                        </div>
                    </div>
                </motion.div>

                <div className="feedback-grid">
                    {/* Left Column - Strengths & Improvements */}
                    <motion.div 
                        className="feedback-section strengths-section"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.2 }}
                    >
                        <h3>🌟 Your Strengths</h3>
                        <ul className="achievements-list">
                            {feedback.strengths.map((strength, index) => (
                                <li key={index} className="achievement-item">
                                    <span className="checkmark">✓</span> {strength}
                                </li>
                            ))}
                        </ul>

                        <h3 style={{ marginTop: '2rem' }}>🎯 Areas to Improve</h3>
                        <ul className="improvements-list">
                            {feedback.improvements.map((improvement, index) => (
                                <li key={index} className="improvement-item">
                                    <span className="indicator">•</span> {improvement}
                                </li>
                            ))}
                        </ul>
                    </motion.div>

                    {/* Right Column - Recommendations */}
                    <motion.div 
                        className="feedback-section recommendations-section"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.3 }}
                    >
                        <h3>💡 Recommendations</h3>
                        <ul className="recommendations-list">
                            {feedback.recommendations.map((rec, index) => (
                                <li key={index} className="recommendation-item">
                                    <span className="icon">→</span>
                                    <span className="text">{rec}</span>
                                </li>
                            ))}
                        </ul>
                    </motion.div>
                </div>

                {/* Question Breakdown */}
                <motion.div 
                    className="questions-breakdown"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                >
                    <h3>Question-by-Question Analysis</h3>
                    
                    <div className="questions-tabs">
                        {feedback.questionBreakdown.map((q, index) => (
                            <button
                                key={index}
                                onClick={() => setSelectedQuestion(index)}
                                className={`tab ${selectedQuestion === index ? 'active' : ''}`}
                            >
                                Q{index + 1}
                                <span className="score-badge">{q.technicalScore}</span>
                            </button>
                        ))}
                    </div>

                    <div className="question-detail">
                        <h4>{currentQuestion.questionText}</h4>
                        
                        <div className="detail-grid">
                            <div className="detail-item">
                                <label>Question Type:</label>
                                <span className="detail-value">{currentQuestion.questionType}</span>
                            </div>
                            <div className="detail-item">
                                <label>Technical Score:</label>
                                <span className="detail-value">{currentQuestion.technicalScore}/100</span>
                            </div>
                            <div className="detail-item">
                                <label>Confidence Score:</label>
                                <span className="detail-value">{currentQuestion.confidenceScore}/100</span>
                            </div>
                        </div>

                        <div className="feedback-text">
                            <label>AI Feedback:</label>
                            <p>{currentQuestion.feedback}</p>
                        </div>

                        {currentQuestion.transcript && (
                            <div className="feedback-text">
                                <label>Your Transcript:</label>
                                <p className="transcript">{currentQuestion.transcript}</p>
                            </div>
                        )}

                        <div className="feedback-text">
                            <label>Ideal Answer:</label>
                            <p className="ideal-answer">{currentQuestion.idealAnswer}</p>
                        </div>
                    </div>
                </motion.div>

                {/* Action Buttons */}
                <div className="action-buttons">
                    <button 
                        onClick={() => navigate('/dashboard')} 
                        className="btn btn-secondary"
                    >
                        ← Back to Dashboard
                    </button>
                    <button 
                        onClick={() => navigate('/new-interview')} 
                        className="btn btn-primary"
                    >
                        🚀 Take Another Interview
                    </button>
                </div>
            </div>
        </div>
    );
}
