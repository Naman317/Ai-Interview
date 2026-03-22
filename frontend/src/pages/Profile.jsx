import { useState, useEffect } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'
import { updateProfile, reset, logout } from '../features/auth/authSlice'
import Sidebar from '../components/Sidebar'

import { ROLES } from '../constants/interview';

export default function Profile() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user, isSuccess, isError, message, isProfileLoading } = useSelector((state) => state.auth);

  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    username: user?.username || '',
    preferredRole: user?.preferredRole || 'mern',
  });

  useEffect(() => {
    if (!user) navigate('/login');
  }, [user, navigate]);

  useEffect(() => {
    if (!isError && !isSuccess) return;
    if (isError) toast.error(message);
    if (isSuccess) toast.success('Profile updated successfully! ✅');
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
    <div className="flex bg-black min-h-screen text-white">
      <Sidebar />
      <main className="flex-1 ml-64 p-8">
        <header className="mb-10">
          <h1 className="text-4xl font-extrabold mb-2">Profile Settings</h1>
          <p className="text-slate-500 font-medium">Manage your personal information and preferences</p>
        </header>

        <div className="max-w-4xl grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* User Info Card */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-slate-900/50 border border-slate-800 p-8 rounded-[2.5rem] text-center">
              <div className="w-24 h-24 bg-blue-600 rounded-full flex items-center justify-center text-4xl font-black mx-auto mb-6 shadow-xl shadow-blue-600/20">
                {user?.name?.charAt(0) || 'U'}
              </div>
              <h2 className="text-2xl font-black truncate">{user?.name}</h2>
              <p className="text-slate-500 font-bold text-sm mb-6">@{user?.username}</p>

              <div className="grid grid-cols-2 gap-2 text-left">
                <div className="bg-slate-950 p-4 rounded-2xl border border-slate-900">
                  <p className="text-[10px] font-black text-slate-600 uppercase mb-1">Interviews</p>
                  <p className="text-xl font-black">24</p>
                </div>
                <div className="bg-slate-950 p-4 rounded-2xl border border-slate-900">
                  <p className="text-[10px] font-black text-slate-600 uppercase mb-1">Avg Score</p>
                  <p className="text-xl font-black">82%</p>
                </div>
              </div>
            </div>

            <div className="bg-slate-900/50 border border-slate-800 p-8 rounded-[2.5rem]">
              <h3 className="font-black uppercase tracking-widest text-xs text-slate-500 mb-6 px-1">Active Resume</h3>
              {user?.cvFileName ? (
                <div className="flex items-center gap-4 p-4 bg-slate-950 rounded-2xl border border-slate-800">
                  <span className="text-2xl">📄</span>
                  <div className="min-w-0">
                    <p className="text-sm font-bold truncate">{user.cvFileName}</p>
                    <p className="text-[10px] text-green-500 font-black uppercase tracking-widest">Active</p>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-slate-600 italic px-1">No resume uploaded yet.</p>
              )}
            </div>
          </div>

          {/* Edit Form */}
          <div className="lg:col-span-2 bg-slate-900/50 border border-slate-800 p-8 rounded-[2.5rem]">
            <form onSubmit={onSubmit} className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Full Name</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={onChange}
                    className="w-full px-6 py-4 bg-slate-950 border border-slate-800 rounded-2xl text-white focus:border-blue-600 focus:outline-none transition-all"
                    placeholder="Your full name"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Email Address</label>
                  <input
                    type="email"
                    value={formData.email}
                    disabled
                    className="w-full px-6 py-4 bg-slate-950/50 border border-slate-900 rounded-2xl text-slate-600 cursor-not-allowed"
                  />
                </div>
              </div>

              <div className="space-y-4">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Preferred Career Path</label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {ROLES.map(role => (
                    <button
                      key={role.id}
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, preferredRole: role.id }))}
                      className={`p-4 rounded-2xl border transition-all flex items-center gap-3 text-sm font-bold ${formData.preferredRole === role.id
                        ? 'bg-blue-600 border-blue-600 shadow-lg shadow-blue-600/20 text-white'
                        : 'bg-slate-950 border-slate-800 text-slate-500 hover:border-slate-700'
                        }`}
                    >
                      <span>{role.icon}</span>
                      <span>{role.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-6 border-t border-slate-800/50">
                <button
                  type="submit"
                  disabled={isProfileLoading}
                  className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white font-black uppercase tracking-widest text-sm rounded-2xl transition-all shadow-xl shadow-blue-600/20 disabled:opacity-50"
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
