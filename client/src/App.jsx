import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Organization from './pages/Organization';
import PlaceholderPage from './pages/PlaceholderPage';
import NotFound from './pages/NotFound';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  return (
    <div className="app-container">
      <Navbar />
      <main className="main-content">
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

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
            path="/dashboard" 
            element={
              <ProtectedRoute>
                <PlaceholderPage 
                  title="Analytics Dashboard" 
                  description="Real-time KPI metrics, Scope breakdowns, and emission trend charts will be available here." 
                />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/emissions" 
            element={
              <ProtectedRoute>
                <PlaceholderPage 
                  title="Emission Logs & Accounting" 
                  description="Form entries for Scope 1, 2, and 3 activity logs, auto CO2e calculations, and log tables." 
                />
              </ProtectedRoute>
            } 
          />

          {/* Role-Protected Route (Organization Admin Only) */}
          <Route 
            path="/projects" 
            element={
              <ProtectedRoute allowedRoles={['Organization Admin']}>
                <PlaceholderPage 
                  title="Carbon Reduction Projects (Admin Only)" 
                  description="Sustainability initiative cards, progress timelines, and budget management reserved for Organization Admins." 
                />
              </ProtectedRoute>
            } 
          />

          {/* 404 Route */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      <footer className="footer">
        <p>EcoTrack &copy; {new Date().getFullYear()} — Greenhouse Gas & Sustainability Tracking System</p>
      </footer>
    </div>
  );
}

export default App;
