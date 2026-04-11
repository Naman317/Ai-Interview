import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import { motion } from 'framer-motion';

/**
 * DashboardLayout - Centralized layout wrapper for all authenticated pages.
 * Renders the persistent Sidebar and an animated content area via <Outlet />.
 * This prevents the Sidebar from remounting on every route change.
 */
export default function DashboardLayout() {
  return (
    <div className="flex min-h-screen bg-surface text-gray-900 relative font-sans">
      <Sidebar />

      <motion.main
        className="flex-1 ml-64 transition-all duration-300"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.25 }}
      >
        <Outlet />
      </motion.main>
    </div>
  );
}
