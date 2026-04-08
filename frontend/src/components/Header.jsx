import { useState } from "react"
import { Link, useNavigate, useLocation } from "react-router-dom"
import { useSelector, useDispatch } from "react-redux"
import { logout, reset } from "../features/auth/authSlice"

const Header = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const location = useLocation();

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { user } = useSelector((state) => state.auth);

  const onLogout = () => {
    dispatch(logout());
    dispatch(reset());
    navigate("/login");
  }

  const isActive = (path) => location.pathname === path;

  return (
    <header className="bg-white/95 backdrop-blur-sm text-gray-900 shadow-nav sticky top-0 z-50 border-b border-gray-200 py-1">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center">
        <Link to="/" className="flex items-center space-x-2 group shrink-0">
          <div className="bg-accent p-1.5 rounded-lg group-hover:scale-105 transition-transform duration-300 shadow-sm">
            <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
            </svg>
          </div>
          <span className="text-lg sm:text-xl font-bold tracking-tight text-primary">
            Interview<span className="text-accent">AI</span>
          </span>
        </Link>

        <nav className="hidden md:flex items-center space-x-6">
          {user ? (<>
            <Link to="/" className={`text-sm font-medium transition-all py-2 ${isActive('/') ? 'text-accent border-b-2 border-accent' : 'text-gray-500 hover:text-gray-900 border-b-2 border-transparent'}`}>Dashboard</Link>
            <Link to="/profile" className={`text-sm font-medium transition-all py-2 ${isActive('/profile') ? 'text-accent border-b-2 border-accent' : 'text-gray-500 hover:text-gray-900 border-b-2 border-transparent'}`}>Profile</Link>
            <div className="flex items-center space-x-2 bg-gray-50 px-4 py-1.5 rounded-full border border-gray-200">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-xs font-medium text-gray-600">{user?.name?.split(' ')[0] || 'User'}</span>
            </div>
            <button onClick={onLogout} className="bg-gray-900 hover:bg-gray-800 text-white text-xs font-semibold py-2.5 px-5 rounded-lg transition duration-300 shadow-sm">Logout</button>
          </>) : (<div className="flex space-x-4">
            <Link to="/login" className={`text-sm font-medium transition-all py-2 ${isActive('/login') ? 'text-accent border-b-2 border-accent' : 'text-gray-500 hover:text-gray-900 border-b-2 border-transparent'}`}>Login</Link>
            <Link to="/register" className={`text-sm font-medium transition-all py-2 ${isActive('/register') ? 'text-accent border-b-2 border-accent' : 'text-gray-500 hover:text-gray-900 border-b-2 border-transparent'}`}>Register</Link>
          </div>)}
        </nav>

        <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="md:hidden p-2 rounded-lg bg-gray-50 border border-gray-200 text-gray-500 hover:text-gray-700 transition-colors">
           <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {isMenuOpen ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>
      </div>
      
       {isMenuOpen && (
        <div className="md:hidden bg-white border-t border-gray-100 animate-in slide-in-from-top-2 duration-300">
          <div className="px-6 py-6 space-y-3">
            {user ? (
              <>
                <div className="flex items-center space-x-3 mb-4 p-4 bg-gray-50 rounded-xl border border-gray-100">
                   <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                   <span className="text-base font-semibold text-gray-900">{user?.name || 'User'}</span>
                </div>
                <Link to="/" onClick={() => setIsMenuOpen(false)} className={`block py-3 text-base font-medium border-b border-gray-100 ${isActive('/') ? 'text-accent' : 'text-gray-600'}`}>Dashboard</Link>
                <Link to="/profile" onClick={() => setIsMenuOpen(false)} className={`block py-3 text-base font-medium border-b border-gray-100 ${isActive('/profile') ? 'text-accent' : 'text-gray-600'}`}>Profile</Link>
                <button onClick={onLogout} className="w-full mt-4 bg-gray-900 hover:bg-gray-800 text-white py-3 rounded-xl font-semibold shadow-sm transition-all">Logout</button>
              </>
            ) : (
              <>
                <Link to="/login" onClick={() => setIsMenuOpen(false)} className={`block py-3 text-base font-medium border-b border-gray-100 ${isActive('/login') ? 'text-accent' : 'text-gray-600'}`}>Login</Link>
                <Link to="/register" onClick={() => setIsMenuOpen(false)} className={`block py-3 text-base font-medium ${isActive('/register') ? 'text-accent' : 'text-gray-600'}`}>Register</Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  )
}

export default Header
