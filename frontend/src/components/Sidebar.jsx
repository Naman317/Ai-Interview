import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { logout, reset } from '../features/auth/authSlice';
import { motion, AnimatePresence } from 'framer-motion';

export default function Sidebar() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const location = useLocation();
  const { user } = useSelector(state => state.auth);
  const [isOpen, setIsOpen] = useState(true);

  const menuItems = [
    { label: 'Dashboard', icon: '🏠', path: '/dashboard' },
    { label: 'New Interview', icon: '▶️', path: '/new-interview' },
    { label: 'Coding Practice', icon: '💻', path: '/coding' },
    { label: 'Analytics', icon: '📊', path: '/analytics' },
    { label: 'Settings', icon: '⚙️', path: '/settings' },
  ];

  const onLogout = () => {
    dispatch(logout());
    dispatch(reset());
    navigate('/login');
  };

  const isActive = (path) => location.pathname === path;

  return (
    <div className={`fixed left-0 top-0 h-full bg-black border-r border-slate-800 transition-all duration-300 ${isOpen ? 'w-64' : 'w-20'} flex flex-col z-50`}>
      {/* Logo Area */}
      <div className="p-6 flex items-center gap-3" id="sidebar-logo">
        <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
          <span className="text-white font-bold text-lg">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
            </svg>
          </span>
        </div>
        {isOpen && <span className="text-white font-bold text-xl tracking-tight">InterviewAI</span>}
      </div>

      {/* Menu Items */}
      <nav className="flex-1 px-4 py-6 space-y-1">
        {menuItems.map((item, idx) => (
          <Link
            key={idx}
            to={item.path}
            id={`nav-${item.label.toLowerCase().replace(/\s+/g, '-')}`}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${isActive(item.path)
              ? 'bg-slate-800 text-white font-semibold'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
          >
            <span className={`text-xl flex-shrink-0 transition-transform duration-200 ${isActive(item.path) ? 'scale-110' : 'group-hover:scale-110'}`}>
              {item.icon}
            </span>
            {isOpen && <span className="text-sm">{item.label}</span>}
          </Link>
        ))}
      </nav>

      {/* User & Settings Section */}
      <div className="p-4 border-t border-slate-900 space-y-4">
        <div className={`flex items-center gap-3 p-3 rounded-xl bg-slate-900/50 hover:bg-slate-900 transition-colors cursor-pointer border border-transparent hover:border-slate-800 ${!isOpen && 'justify-center'}`}>
          <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-500 rounded-full flex items-center justify-center flex-shrink-0 text-white font-bold shadow-lg shadow-blue-500/10">
            {user?.name?.charAt(0) || 'J'}
          </div>
          {isOpen && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-white truncate">{user?.name || 'John Doe'}</p>
              <p className="text-xs text-slate-500 truncate">{user?.email || 'john@example.com'}</p>
            </div>
          )}
        </div>

        {/* Theme & Actions */}
        {isOpen && (
          <div className="flex items-center justify-between px-2">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Theme</span>
            <button className="p-2 rounded-lg bg-slate-900 text-slate-400 hover:text-white transition-colors">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m12.728 0l-.707-.707M6.343 6.343l-.707-.707M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </button>
          </div>
        )}

        <button
          onClick={onLogout}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-all font-semibold text-sm"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          {isOpen && <span>Sign Out</span>}
        </button>
      </div>
    </div>
  );
}
