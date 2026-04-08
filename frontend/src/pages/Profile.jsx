import { useState, useEffect } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'
import { updateProfile, reset, logout } from '../features/auth/authSlice'
import { getUserStats } from '../features/analytics/analyticsSlice'
import Sidebar from '../components/Sidebar'
import RoleIcon from '../components/RoleIcon'

import { ROLES } from '../constants/interview';

export default function Profile() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user, isSuccess, isError, message, isProfileLoading } = useSelector((state) => state.auth);
  const { stats } = useSelector((state) => state.analytics);

  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    username: user?.username || '',
    preferredRole: user?.preferredRole || 'mern',
  });

  useEffect(() => {
    if (!user) {
      navigate('/login');
    } else {
      dispatch(getUserStats());
    }
  }, [user, navigate, dispatch]);

  useEffect(() => {
    if (!isError && !isSuccess) return;
    if (isError) toast.error(message);
    if (isSuccess) toast.success('Profile updated successfully!');
    dispatch(reset());
  }, [isError, isSuccess, message, dispatch]);

  useEffect(() => {
    if (user) {
      setFormData({
        name: user?.name || '',
        email: user?.email || '',
        username: user?.username || '',
        preferredRole: user?.preferredRole || 'mern',
      });
    }
  }, [user]);

  const onChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  }

  const onSubmit = (e) => {
    e.preventDefault();
    dispatch(updateProfile(formData));
  }

  return (
    <div className="flex bg-surface min-h-screen text-gray-900">
      <Sidebar />
      <main className="flex-1 ml-64 p-8">
        <header className="mb-10">
          <h1 className="text-3xl font-bold text-primary mb-1">Profile Settings</h1>
          <p className="text-gray-500 text-sm">Manage your personal information and preferences</p>
        </header>

        <div className="max-w-4xl grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* User Info Card */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white border border-gray-200 p-8 rounded-2xl text-center shadow-card">
              <div className="w-20 h-20 bg-accent rounded-full flex items-center justify-center text-3xl font-bold text-white mx-auto mb-6 shadow-md">
                {user?.name?.charAt(0)?.toUpperCase() || 'U'}
              </div>
              <h2 className="text-xl font-bold text-gray-900 truncate">{user?.name}</h2>
              <p className="text-gray-400 text-sm mb-6">@{user?.username}</p>

              <div className="grid grid-cols-2 gap-3 text-left">
                <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                  <p className="text-xs font-medium text-gray-400 uppercase mb-1">Interviews</p>
                  <p className="text-xl font-bold text-gray-900">{stats?.summary?.totalInterviews || 0}</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                  <p className="text-xs font-medium text-gray-400 uppercase mb-1">Avg Score</p>
                  <p className="text-xl font-bold text-gray-900">{Math.round(stats?.summary?.avgOverallScore || 0)}%</p>
                </div>
              </div>
            </div>

            <div className="bg-white border border-gray-200 p-6 rounded-2xl shadow-card">
              <h3 className="font-semibold text-xs text-gray-400 uppercase tracking-wider mb-4">Active Resume</h3>
              {user?.cvFileName ? (
                <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl border border-gray-100">
                  <div className="w-10 h-10 bg-accent/10 rounded-xl flex items-center justify-center">
                    <svg className="w-5 h-5 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">{user.cvFileName}</p>
                    <p className="text-xs text-green-600 font-medium">Active</p>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-gray-400 italic">No resume uploaded yet.</p>
              )}
            </div>
          </div>

          {/* Edit Form */}
          <div className="lg:col-span-2 bg-white border border-gray-200 p-8 rounded-2xl shadow-card">
            <form onSubmit={onSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-2">
                  <label className="text-xs font-medium text-gray-400 uppercase tracking-wider">Full Name</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={onChange}
                    className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-gray-900 focus:border-accent focus:ring-2 focus:ring-accent/20 focus:outline-none transition-all text-sm"
                    placeholder="Your full name"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-medium text-gray-400 uppercase tracking-wider">Email Address</label>
                  <input
                    type="email"
                    value={formData.email}
                    disabled
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-400 cursor-not-allowed text-sm"
                  />
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-xs font-medium text-gray-400 uppercase tracking-wider">Preferred Career Path</label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {ROLES.map(role => (
                    <button
                      key={role.id}
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, preferredRole: role.id }))}
                      className={`p-3 rounded-xl border transition-all flex items-center gap-2 text-sm font-medium ${formData.preferredRole === role.id
                        ? 'bg-accent text-white border-accent shadow-sm'
                        : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'
                        }`}
                    >
                      <RoleIcon icon={role.icon} className={`w-4 h-4 ${formData.preferredRole === role.id ? 'text-white' : 'text-accent'}`} />
                      <span>{role.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-6 border-t border-gray-100">
                <button
                  type="submit"
                  disabled={isProfileLoading}
                  className="w-full py-3 bg-accent hover:bg-blue-700 text-white font-semibold rounded-xl transition-all shadow-sm disabled:opacity-50 text-sm"
                >
                  {isProfileLoading ? 'Saving Changes...' : 'Save Profile Settings'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}
