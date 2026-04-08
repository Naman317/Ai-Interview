import { useEffect, useState } from "react";
import api from "../utils/api";
import RoleIcon from "./RoleIcon";

export default function InterviewReport({ sessionId, onClose }) {
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (sessionId && sessionId !== 'undefined') {
      fetchReport();
    }
  }, [sessionId]);

  const fetchReport = async () => {
    try {
      const response = await api.get(
        `/api/sessions/${sessionId}/report`
      );
      setReport(response.data);
    } catch (error) {
      console.error("Error fetching report:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">Unable to load report</p>
      </div>
    );
  }

  const overallScore = Math.round(
    (report.technicalScore + report.behavioralScore) / 2
  );

  const getScoreBadge = (score) => {
    if (score >= 80) return "bg-green-100 text-green-800";
    if (score >= 60) return "bg-yellow-100 text-yellow-800";
    return "bg-red-100 text-red-800";
  };

  return (
    <div className="bg-white rounded-lg shadow-lg">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white p-6">
        <h1 className="text-3xl font-bold mb-2">Interview Report</h1>
        <p className="text-blue-100">Session ID: {sessionId}</p>
      </div>

      <div className="p-6 space-y-6">
        {/* Overall Score */}
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-6 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm mb-2">Overall Performance</p>
              <p className="text-4xl font-bold text-blue-600">{overallScore}%</p>
            </div>
            <div className={`w-20 h-20 flex items-center justify-center rounded-full p-4 ${getScoreBadge(overallScore)}`}>
              <RoleIcon 
                icon={overallScore >= 80 ? 'check' : overallScore >= 60 ? 'target' : 'cross'} 
                className="w-10 h-10" 
              />
            </div>
          </div>
        </div>

        {/* Score Breakdown */}
        <div className="grid grid-cols-2 gap-4">
          <div className={`p-4 rounded-lg ${getScoreBadge(report.technicalScore)}`}>
            <p className="text-sm font-medium mb-2">Technical Score</p>
            <p className="text-3xl font-bold">{report.technicalScore}%</p>
          </div>
          <div className={`p-4 rounded-lg ${getScoreBadge(report.behavioralScore)}`}>
            <p className="text-sm font-medium mb-2">Behavioral Score</p>
            <p className="text-3xl font-bold">{report.behavioralScore}%</p>
          </div>
        </div>

        {/* Behavioral Metrics */}
        <div className="bg-gray-50 p-6 rounded-lg">
          <h3 className="text-lg font-bold mb-4">Behavioral Analysis</h3>
          <div className="space-y-3">
            {[
              { label: "Eye Contact", value: report.eyeContact || 0, color: "bg-blue-500" },
              { label: "Confidence", value: report.confidence || 0, color: "bg-green-500" },
              { label: "Fluency", value: report.fluency || 0, color: "bg-purple-500" },
              { label: "Clarity", value: report.clarity || 0, color: "bg-orange-500" }
            ].map((metric) => (
              <div key={metric.label}>
                <div className="flex justify-between mb-2">
                  <span className="font-medium text-gray-700">{metric.label}</span>
                  <span className="font-bold text-gray-900">{metric.value}%</span>
                </div>
                <div className="w-full bg-gray-300 rounded-full h-2">
                  <div
                    className={`${metric.color} h-2 rounded-full`}
                    style={{ width: `${metric.value}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Questions and Answers */}
        <div className="space-y-4">
          <h3 className="text-lg font-bold">Questions & Answers</h3>
          {report.questions && report.questions.length > 0 ? (
            <div className="space-y-4">
              {report.questions.map((item, idx) => (
                <div key={idx} className="border-l-4 border-blue-500 pl-4 py-3 bg-gray-50 rounded">
                  <p className="font-semibold text-gray-900 mb-2">Q{idx + 1}: {item.question}</p>
                  <p className="text-sm text-gray-700 mb-2">
                    <strong>Your Answer:</strong> {item.answer || "No answer provided"}
                  </p>
                  <div className="flex gap-4 text-sm">
                    <span className={`${getScoreBadge(item.technicalScore)} px-3 py-1 rounded-full`}>
                      Technical: {item.technicalScore}%
                    </span>
                    <span className={`${getScoreBadge(item.confidenceScore)} px-3 py-1 rounded-full`}>
                      Confidence: {item.confidenceScore}%
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mt-2 italic">
                    <strong>Feedback:</strong> {item.feedback}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500">No questions answered yet</p>
          )}
        </div>

        {/* Overall Feedback */}
        {report.overallFeedback && (
          <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
            <h4 className="font-bold text-blue-900 mb-2">Overall Feedback</h4>
            <p className="text-blue-800">{report.overallFeedback}</p>
          </div>
        )}

        {/* Recommendations */}
        {report.recommendations && report.recommendations.length > 0 && (
          <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 rounded">
            <h4 className="font-bold text-yellow-900 mb-3">Recommendations</h4>
            <ul className="space-y-2">
              {report.recommendations.map((rec, idx) => (
                <li key={idx} className="flex gap-2 text-yellow-800">
                  <span className="font-bold">•</span>
                  <span>{rec}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3 pt-6 border-t">
          <button
            onClick={() => window.print()}
            className="flex-1 flex items-center justify-center gap-2 bg-gray-600 text-white py-2 rounded-lg font-semibold hover:bg-gray-700 transition"
          >
            <RoleIcon icon="print" className="w-4 h-4" />
            Print Report
          </button>
          <button
            onClick={onClose}
            className="flex-1 flex items-center justify-center gap-2 bg-blue-600 text-white py-2 rounded-lg font-semibold hover:bg-blue-700 transition"
          >
            <RoleIcon icon="check" className="w-4 h-4" />
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
