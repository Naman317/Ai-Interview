import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';

export default function NotFoundV2() {
  const navigate = useNavigate();
  const { user } = useSelector(state => state.auth);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center px-4">
      <div className="text-center space-y-8">
        <div className="space-y-4">
          <div className="text-9xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400">
            404
          </div>
          <h1 className="text-5xl font-black text-white">Page Not Found</h1>
          <p className="text-xl text-slate-400 max-w-md mx-auto">
            Oops! It looks like you've ventured into uncharted territory. The page you're looking for doesn't exist.
          </p>
        </div>

        <div className="flex gap-4 justify-center">
          <button
            onClick={() => navigate(user ? '/dashboard' : '/landing')}
            className="px-8 py-4 bg-gradient-to-r from-blue-600 to-cyan-600 text-white font-bold text-lg rounded-xl hover:from-blue-700 hover:to-cyan-700 transition shadow-lg"
          >
            {user ? '🏠 Go to Dashboard' : '🏠 Go Home'}
          </button>
          {user && (
            <button
              onClick={() => navigate('/login')}
              className="px-8 py-4 bg-slate-800 text-white font-bold text-lg rounded-xl hover:bg-slate-700 transition border border-slate-700"
            >
              🔓 Sign In
            </button>
          )}
        </div>

        <div className="text-6xl">🧭</div>
      </div>
    </div>
  );
}
