import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';

export default function NotFoundV2() {
  const navigate = useNavigate();
  const { user } = useSelector(state => state.auth);

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center px-4">
      <div className="text-center space-y-8">
        <div className="space-y-4">
          <div className="text-9xl font-bold text-accent/20">
            404
          </div>
          <h1 className="text-4xl font-bold text-primary">Page Not Found</h1>
          <p className="text-lg text-gray-500 max-w-md mx-auto">
            Oops! It looks like you've ventured into uncharted territory. The page you're looking for doesn't exist.
          </p>
        </div>

        <div className="flex gap-3 justify-center">
          <button
            onClick={() => navigate(user ? '/dashboard' : '/landing')}
            className="px-6 py-3 bg-accent text-white font-semibold rounded-lg hover:bg-blue-700 transition shadow-sm text-sm"
          >
            {user ? 'Go to Dashboard' : 'Go Home'}
          </button>
          {!user && (
            <button
              onClick={() => navigate('/login')}
              className="px-6 py-3 bg-white text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition border border-gray-300 text-sm"
            >
              Sign In
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
