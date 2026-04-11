import React from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './context/ProtectedRoute';
import { AdminRoute } from './context/AdminRoute';
import HelpGuide from './components/HelpGuide';

// Pages
import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import ReportForm from './pages/ReportForm';
import ReportDetail from './pages/ReportDetail';
import Profile from './pages/Profile';
import AdminDashboard from './pages/AdminDashboard'; // Re-enabled

const AnimatedRoutes = () => {
  const location = useLocation();
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const pageVariants = prefersReduced ? {} : {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 }
  };
  const pageTransition = { duration: 0.3 };

  const withPageTrans = (Component) => (
    <motion.div
      initial="initial"
      animate="animate"
      exit="exit"
      variants={pageVariants}
      transition={pageTransition}
    >
      {Component}
    </motion.div>
  );

  // Hide HelpGuide on public/auth pages
  const hideHelpPaths = ['/', '/login', '/register'];
  const showHelp = !hideHelpPaths.includes(location.pathname);

  return (
    <>
      <AnimatePresence mode="wait">
        <Routes location={location} key={location.pathname}>
          {/* Public Routes */}
          <Route path="/" element={withPageTrans(<Landing />)} />
          <Route path="/login" element={withPageTrans(<Login />)} />
          <Route path="/register" element={withPageTrans(<Register />)} />

          {/* Protected Routes (any authenticated user) */}
          <Route
            path="/dashboard"
            element={withPageTrans(
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            )}
          />
          <Route
            path="/report"
            element={withPageTrans(
              <ProtectedRoute>
                <ReportForm />
              </ProtectedRoute>
            )}
          />
          <Route
            path="/profile"
            element={withPageTrans(
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            )}
          />
          <Route
            path="/reports/:id"
            element={withPageTrans(
              <ProtectedRoute>
                <ReportDetail />
              </ProtectedRoute>
            )}
          />

          {/* Admin Routes (admin role only) */}
          <Route
            path="/admin"
            element={withPageTrans(
              <AdminRoute>
                <AdminDashboard />
              </AdminRoute>
            )}
          />
        </Routes>
      </AnimatePresence>

      {/* Global Help Guide — hidden on Landing/Login/Register */}
      {showHelp && <HelpGuide />}
    </>
  );
};

function App() {
  console.log('App.jsx: App component rendering...');
  
  return (
    <Router>
      <AuthProvider>
        <div className="app-container relative min-h-screen font-sans">
          <AnimatedRoutes />
        </div>
      </AuthProvider>
    </Router>
  );
}

export default App;
