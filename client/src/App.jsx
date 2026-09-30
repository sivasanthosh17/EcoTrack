import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Organization from './pages/Organization';
import Emissions from './pages/Emissions';
import Projects from './pages/Projects';
import KPIs from './pages/KPIs';
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
