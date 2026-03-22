import { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { logout } from '../features/auth/authSlice';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';

const Settings = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector(state => state.auth);
  const [activeTab, setActiveTab] = useState('account');

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  return (
    <div className="flex h-screen bg-slate-900">
      <Sidebar />

      <main className="flex-1 ml-64 overflow-auto">
        {/* Header */}
        <div className="bg-slate-900 border-b border-slate-800 sticky top-0 z-40 p-6">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2">Settings</h1>
            <p className="text-slate-400">Manage your account and preferences</p>
          </div>
        </div>

        <div className="p-6 max-w-4xl">
          {/* Tabs */}
          <div className="flex gap-4 mb-6 border-b border-slate-800">
            {['account', 'preferences', 'security'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-6 py-3 font-medium border-b-2 transition-colors ${
                  activeTab === tab
                    ? 'text-blue-400 border-blue-600'
                    : 'text-slate-400 border-transparent hover:text-white'
                }`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>

          {/* Account Settings */}
          {activeTab === 'account' && (
            <div className="space-y-6">
              <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 border border-blue-600/20 rounded-xl p-6">
                <h2 className="text-xl font-bold text-white mb-4">Account Information</h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-slate-300 font-medium mb-2">Username</label>
                    <input
                      type="text"
                      value={user?.username || ''}
                      disabled
                      className="w-full bg-slate-700/30 border border-slate-600/30 text-slate-300 rounded-lg px-4 py-2.5 cursor-not-allowed"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-300 font-medium mb-2">Email</label>
                    <input
                      type="email"
                      value={user?.email || ''}
                      disabled
                      className="w-full bg-slate-700/30 border border-slate-600/30 text-slate-300 rounded-lg px-4 py-2.5 cursor-not-allowed"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Preferences */}
          {activeTab === 'preferences' && (
            <div className="space-y-6">
              <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 border border-blue-600/20 rounded-xl p-6">
                <h2 className="text-xl font-bold text-white mb-4">Preferences</h2>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <label className="text-slate-300 font-medium">Email Notifications</label>
                    <input type="checkbox" defaultChecked className="w-4 h-4 cursor-pointer" />
                  </div>
                  <div className="flex items-center justify-between">
                    <label className="text-slate-300 font-medium">Daily Reminders</label>
                    <input type="checkbox" defaultChecked className="w-4 h-4 cursor-pointer" />
                  </div>
                  <div className="flex items-center justify-between">
                    <label className="text-slate-300 font-medium">Analytics Sharing</label>
                    <input type="checkbox" className="w-4 h-4 cursor-pointer" />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Security */}
          {activeTab === 'security' && (
            <div className="space-y-6">
              <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 border border-blue-600/20 rounded-xl p-6">
                <h2 className="text-xl font-bold text-white mb-4">Security</h2>
                <div className="space-y-4">
                  <button className="w-full bg-slate-700/50 hover:bg-slate-700 text-white px-4 py-2.5 rounded-lg font-medium transition-colors text-left">
                    Change Password
                  </button>
                  <button className="w-full bg-slate-700/50 hover:bg-slate-700 text-white px-4 py-2.5 rounded-lg font-medium transition-colors text-left">
                    Two-Factor Authentication
                  </button>
                </div>
              </div>

              <div className="bg-red-600/10 border border-red-600/30 rounded-xl p-6">
                <h2 className="text-xl font-bold text-red-400 mb-4">Danger Zone</h2>
                <button
                  onClick={handleLogout}
                  className="w-full bg-gradient-to-r from-red-600 to-red-500 hover:from-red-700 hover:to-red-600 text-white px-4 py-2.5 rounded-lg font-medium transition-all shadow-lg shadow-red-600/30"
                >
                  Log Out
                </button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Settings;
