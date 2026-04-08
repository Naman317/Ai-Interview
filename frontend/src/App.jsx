import React, { useState, useEffect } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import useSocket from './hooks/useSocket';
import { ToastContainer } from 'react-toastify';
import { useSelector } from 'react-redux';

// Import pages
import Login from './pages/Login';
import Register from './pages/Register';
import PrivateRoute from './components/PrivateRoute';
import Dashboard from './pages/Dashboard';
import Profile from './pages/Profile';
import NewInterview from './pages/NewInterview';
import InterviewRunner from './pages/InterviewRunner';
import VideoInterviewRunner from './pages/VideoInterviewRunner';
import SessionReview from './pages/SessionReview';
import NotFound from './pages/NotFound';
import LandingPage from './pages/LandingPage';
import CodingPractice from './pages/CodingPractice';
import SheetDetails from './pages/SheetDetails';
import Analytics from './pages/Analytics';
import Settings from './pages/Settings';
import History from './pages/History';

const App = () => {
  const [error, setError] = useState(null);

  useEffect(() => {
    console.log('App Component Loaded');
    const handleError = (event) => {
      console.error('App Error:', event);
      setError(event.message);
    };
    window.addEventListener('error', handleError);
    return () => window.removeEventListener('error', handleError);
  }, []);

  useSocket();

  if (error) {
    return (
      <div className='min-h-screen bg-red-50 flex items-center justify-center'>
        <div className='bg-white p-6 rounded-xl shadow-lg border border-red-100'>
          <h1 className='text-red-600 text-xl font-bold mb-2'>Error Loading App</h1>
          <p className='text-gray-700'>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className='min-h-screen bg-white'>
      <Routes>
        <Route path='/landing' element={<LandingPage />} />
        <Route path='/login' element={<Login />} />
        <Route path='/register' element={<Register />} />
        <Route path='/' element={<PrivateRoute />}>
          <Route path='/' element={<Navigate to="/dashboard" replace />} />
          <Route path='/dashboard' element={<Dashboard />} />
          <Route path='/new-interview' element={<NewInterview />} />
          <Route path='/profile' element={<Profile />} />
          <Route path='/coding' element={<CodingPractice />} />
          <Route path='/sheets/:id' element={<SheetDetails />} />
          <Route path='/analytics' element={<Analytics />} />
          <Route path='/settings' element={<Settings />} />
          <Route path='/history' element={<History />} />
          <Route path='/interview/:sessionId' element={<InterviewRunner />} />
          <Route path='/video-interview/:sessionId' element={<VideoInterviewRunner />} />
          <Route path="/review/:sessionId" element={<SessionReview />} />
        </Route>
        <Route path="*" element={<NotFound />} />
      </Routes>

      <ToastContainer theme="light" position='top-right' autoClose={3000} />
    </div>
  );
}

export default App
