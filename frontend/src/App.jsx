import React, { Suspense, useState, useEffect, lazy } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import useSocket from './hooks/useSocket';
import { ToastContainer } from 'react-toastify';
import ErrorBoundary from './components/ErrorBoundary';
import DashboardLayout from './components/DashboardLayout';
import { PageSkeleton } from './components/SkeletonLoader';

// Eagerly loaded (critical path)
import Login from './pages/Login';
import Register from './pages/Register';
import PrivateRoute from './components/PrivateRoute';
import LandingPage from './pages/LandingPage';
import NotFound from './pages/NotFound';

// Lazy loaded pages (code-split for smaller initial bundle)
const Dashboard = lazy(() => import('./pages/Dashboard'));
const NewInterview = lazy(() => import('./pages/NewInterview'));
const Profile = lazy(() => import('./pages/Profile'));
const InterviewRunner = lazy(() => import('./pages/InterviewRunner'));
const VideoInterviewRunner = lazy(() => import('./pages/VideoInterviewRunner'));
const SessionReview = lazy(() => import('./pages/SessionReview'));
const CodingPractice = lazy(() => import('./pages/CodingPractice'));
const SheetDetails = lazy(() => import('./pages/SheetDetails'));
const Analytics = lazy(() => import('./pages/Analytics'));
const Settings = lazy(() => import('./pages/Settings'));
const History = lazy(() => import('./pages/History'));

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
    <ErrorBoundary>
      <div className='min-h-screen bg-white'>
        <Suspense fallback={<PageSkeleton />}>
          <Routes>
            <Route path='/landing' element={<LandingPage />} />
            <Route path='/login' element={<Login />} />
            <Route path='/register' element={<Register />} />

            {/* All authenticated routes use DashboardLayout (persistent Sidebar) */}
            <Route path='/' element={<PrivateRoute />}>
              <Route element={<DashboardLayout />}>
                <Route index element={<Navigate to="/dashboard" replace />} />
                <Route path='dashboard' element={<Dashboard />} />
                <Route path='new-interview' element={<NewInterview />} />
                <Route path='profile' element={<Profile />} />
                <Route path='coding' element={<CodingPractice />} />
                <Route path='sheets/:id' element={<SheetDetails />} />
                <Route path='analytics' element={<Analytics />} />
                <Route path='settings' element={<Settings />} />
                <Route path='history' element={<History />} />
                <Route path='interview/:sessionId' element={<InterviewRunner />} />
                <Route path='video-interview/:sessionId' element={<VideoInterviewRunner />} />
                <Route path='review/:sessionId' element={<SessionReview />} />
              </Route>
            </Route>

            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>

        <ToastContainer theme="light" position='top-right' autoClose={3000} />
      </div>
    </ErrorBoundary>
  );
}

export default App
