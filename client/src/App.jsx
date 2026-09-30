import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import Login from './pages/Login';
import Organization from './pages/Organization';
import Emissions from './pages/Emissions';
import Projects from './pages/Projects';
import KPIs from './pages/KPIs';
import ActionPlans from './pages/ActionPlans';
import Reports from './pages/Reports';
import Dashboard from './pages/Dashboard';
import NotFound from './pages/NotFound';
import ProtectedRoute from './components/ProtectedRoute';
import { useAuth } from './context/AuthContext';

function App() {
  const { user } = useAuth();

  return (
    <div className={`app-container ${user ? 'has-sidebar' : 'has-navbar'}`}>
      <Navbar />
      <div className="content-wrapper">
        <main className="main-content">
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<Navigate to={user ? '/dashboard' : '/login'} replace />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Navigate to="/login" replace />} />

            {/* Protected Routes (Logged in Users) */}
            <Route 
              path="/organization" 
              element={
                <ProtectedRoute>
                  <Organization />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/emissions" 
              element={
                <ProtectedRoute>
                  <Emissions />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/projects" 
              element={
                <ProtectedRoute>
                  <Projects />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/kpis" 
              element={
                <ProtectedRoute>
                  <KPIs />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/action-plans" 
              element={
                <ProtectedRoute>
                  <ActionPlans />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/reports" 
              element={
                <ProtectedRoute>
                  <Reports />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/dashboard" 
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              } 
            />

            {/* 404 Route */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </main>
        <footer className="footer no-print">
          <p>EcoTrack &copy; {new Date().getFullYear()} — Greenhouse Gas & Sustainability Accounting System</p>
        </footer>
      </div>
    </div>
  );
}

export default App;
