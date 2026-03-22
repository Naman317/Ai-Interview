import { useNavigate } from 'react-router-dom';

const SessionCard = ({ session, onClick }) => {
  const navigate = useNavigate();

  const getStatusColor = () => {
    switch (session.status) {
      case 'completed':
        return 'bg-green-500/10 text-green-400 border-green-500/30';
      case 'in-progress':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/30';
      default:
        return 'bg-blue-500/10 text-blue-400 border-blue-500/30';
    }
  };

  const getRoleIcon = (role) => {
    if (role.includes('Frontend')) return '⚛';
    if (role.includes('Backend')) return '◈';
    if (role.includes('DevOps')) return '☁';
    if (role.includes('Data')) return '▲';
    if (role.includes('Python')) return '🐍';
    return '◉';
  };

  const handleContinue = (e) => {
    e.stopPropagation();
    if (session.interviewType === 'video') {
      navigate(`/video-interview/${session._id}`);
    } else {
      navigate(`/interview/${session._id}`);
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  return (
    <div className="bg-slate-800/30 border border-slate-700 rounded-lg p-5 hover:border-blue-600/50 transition-all">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4 flex-1">
          <div className="w-12 h-12 bg-blue-600/20 rounded-lg flex items-center justify-center text-2xl flex-shrink-0">
            {getRoleIcon(session.role)}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-white font-bold truncate">{session.role}</h3>
            <p className="text-slate-400 text-sm">{formatDate(session.createdAt)}</p>
          </div>
        </div>

        <div className="flex items-center gap-4 flex-shrink-0">
          <div className={`px-3 py-1 rounded-lg border text-xs font-medium ${getStatusColor()}`}>
            {session.status.charAt(0).toUpperCase() + session.status.slice(1)}
          </div>
          
          {session.overallScore && (
            <div className="text-right">
              <p className="text-2xl font-bold text-white">{Math.round(session.overallScore)}%</p>
              <p className="text-xs text-slate-400">Score</p>
            </div>
          )}

          {session.status === 'in-progress' && (
            <button
              onClick={handleContinue}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              Continue
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default SessionCard;
