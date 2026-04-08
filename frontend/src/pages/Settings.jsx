import { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { logout, updateProfile } from '../features/auth/authSlice';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import api from '../utils/api';
import Sidebar from '../components/Sidebar';

const Settings = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user, isProfileLoading } = useSelector(state => state.auth);
  const [activeTab, setActiveTab] = useState('account');
  
  // Security States
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [passwordData, setPasswordData] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      return toast.error('Passwords do not match');
    }
    
    try {
      // We use exactly the same updateProfile action, but passing the password
      await dispatch(updateProfile({ password: passwordData.newPassword })).unwrap();
      toast.success('Password updated successfully');
      setShowPasswordForm(false);
      setPasswordData({ oldPassword: '', newPassword: '', confirmPassword: '' });
    } catch (error) {
      toast.error(error || 'Failed to update password');
    }
  };

  const handleDeleteAccount = async () => {
    const confirm = window.confirm('WARNING: This will permanently delete your account and all interview history. This action cannot be undone. Proceed?');
    if (!confirm) return;

    try {
      await api.delete('/api/users/profile');
      toast.success('Account deleted successfully');
      handleLogout();
    } catch (error) {
      toast.error('Failed to delete account');
    }
  };

  return (
    <div className="flex h-screen bg-surface">
      <Sidebar />

      <main className="flex-1 ml-64 overflow-auto">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 sticky top-0 z-40 p-6">
          <div>
            <h1 className="text-3xl font-bold text-primary mb-1">Settings</h1>
            <p className="text-gray-500 text-sm">Manage your account, security, and preferences</p>
          </div>
        </div>

        <div className="p-6 max-w-4xl">
          {/* Tabs */}
          <div className="flex gap-4 mb-6 border-b border-gray-200">
            {['account', 'preferences', 'security'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-5 py-3 font-medium text-sm border-b-2 transition-colors ${
                  activeTab === tab
                    ? 'text-accent border-accent'
                    : 'text-gray-400 border-transparent hover:text-gray-700'
                }`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>

          {/* Account Settings */}
          {activeTab === 'account' && (
            <div className="space-y-6">
              <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-card">
                <h2 className="text-base font-bold text-gray-900 mb-4">Account Information</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-gray-400 font-medium mb-2 text-xs uppercase tracking-wider">Full Name</label>
                    <div className="px-4 py-3 bg-gray-50 border border-gray-200 text-gray-700 rounded-xl font-medium">
                      {user?.name}
                    </div>
                  </div>
                  <div>
                    <label className="block text-gray-400 font-medium mb-2 text-xs uppercase tracking-wider">Email Address</label>
                    <div className="px-4 py-3 bg-gray-50 border border-gray-200 text-gray-700 rounded-xl font-medium">
                      {user?.email}
                    </div>
                  </div>
                </div>
                <button 
                  onClick={() => navigate('/profile')}
                  className="mt-6 text-accent hover:text-blue-700 text-sm font-bold flex items-center gap-1"
                >
                  Edit Profile Details →
                </button>
              </div>
            </div>
          )}

          {/* Preferences */}
          {activeTab === 'preferences' && (
            <div className="space-y-6">
              <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-card">
                <h2 className="text-base font-bold text-gray-900 mb-4">Notification Preferences</h2>
                <div className="space-y-4">
                  {['Email Notifications', 'Daily Reminders', 'Analytics Sharing', 'Marketing Emails'].map((pref, i) => (
                    <div key={i} className="flex items-center justify-between py-3 border-b border-gray-50 last:border-0">
                      <label className="text-gray-700 font-medium text-sm">{pref}</label>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" defaultChecked={i < 2} className="sr-only peer" />
                        <div className="w-10 h-5 bg-gray-200 peer-focus:ring-2 peer-focus:ring-accent/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:bg-accent after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all"></div>
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Security */}
          {activeTab === 'security' && (
            <div className="space-y-6">
              <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-card">
                <h2 className="text-base font-bold text-gray-900 mb-6">Security Settings</h2>
                
                {/* Password Change Section */}
                <div className="mb-8">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-sm font-bold text-gray-900">Password</h3>
                      <p className="text-xs text-gray-500">Update your account password</p>
                    </div>
                    <button 
                      onClick={() => setShowPasswordForm(!showPasswordForm)}
                      className="px-4 py-2 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-lg text-xs font-bold text-gray-700 transition-all"
                    >
                      {showPasswordForm ? 'Cancel' : 'Change Password'}
                    </button>
                  </div>

                  {showPasswordForm && (
                    <motion.form 
                      initial={{ opacity: 0, height: 0 }} 
                      animate={{ opacity: 1, height: 'auto' }}
                      onSubmit={handlePasswordChange} 
                      className="space-y-4 bg-gray-50 p-6 rounded-2xl border border-gray-100"
                    >
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase text-gray-400">New Password</label>
                          <input
                            type="password"
                            required
                            className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-accent/20 focus:border-accent outline-none text-sm"
                            value={passwordData.newPassword}
                            onChange={(e) => setPasswordData({...passwordData, newPassword: e.target.value})}
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase text-gray-400">Confirm New Password</label>
                          <input
                            type="password"
                            required
                            className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-accent/20 focus:border-accent outline-none text-sm"
                            value={passwordData.confirmPassword}
                            onChange={(e) => setPasswordData({...passwordData, confirmPassword: e.target.value})}
                          />
                        </div>
                      </div>
                      <button 
                        type="submit" 
                        disabled={isProfileLoading}
                        className="px-6 py-2 bg-accent text-white rounded-lg text-xs font-bold shadow-sm hover:bg-blue-700 transition-all disabled:opacity-50"
                      >
                        {isProfileLoading ? 'Updating...' : 'Update Password'}
                      </button>
                    </motion.form>
                  )}
                </div>

                <hr className="border-gray-100 mb-8" />

                {/* 2FA Section */}
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-gray-900">Two-Factor Authentication</h3>
                    <p className="text-xs text-gray-500">Add an extra layer of security to your account</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      className="sr-only peer" 
                      checked={twoFactorEnabled}
                      onChange={() => {
                        setTwoFactorEnabled(!twoFactorEnabled);
                        if(!twoFactorEnabled) toast.info('2FA implementation coming soon!');
                      }}
                    />
                    <div className="w-10 h-5 bg-gray-200 peer-focus:ring-2 peer-focus:ring-accent/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:bg-accent after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all"></div>
                  </label>
                </div>
              </div>

              {/* Danger Zone */}
              <div className="bg-red-50 border border-red-100 rounded-3xl p-8">
                <h2 className="text-lg font-bold text-red-600 mb-2">Danger Zone</h2>
                <p className="text-sm text-red-700/60 mb-8 font-medium">Actions here are permanent and cannot be undone.</p>
                
                <div className="flex flex-col md:flex-row gap-4">
                  <button
                    onClick={handleLogout}
                    className="flex-1 bg-white hover:bg-gray-50 text-gray-700 border border-red-200 px-6 py-4 rounded-2xl font-bold transition-all shadow-sm text-sm"
                  >
                    Log Out of Session
                  </button>
                  <button
                    onClick={handleDeleteAccount}
                    className="flex-1 bg-red-600 hover:bg-red-700 text-white px-6 py-4 rounded-2xl font-bold transition-all shadow-md text-sm"
                  >
                    Delete Account Permanently
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Settings;

