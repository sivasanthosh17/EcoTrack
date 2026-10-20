import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

  useEffect(() => {
    // Load stored auth details on app initialization and verify them with the server
    const storedToken = localStorage.getItem('ecotrack_token');
    const storedUser = localStorage.getItem('ecotrack_user');

    const clearSession = () => {
      localStorage.removeItem('ecotrack_token');
      localStorage.removeItem('ecotrack_user');
    };

    const restoreSession = async () => {
      if (!storedToken || !storedUser) {
        setLoading(false);
        return;
      }

      try {
        const parsedUser = JSON.parse(storedUser);
        const response = await fetch(`${API_BASE_URL}/auth/me`, {
          headers: { Authorization: `Bearer ${storedToken}` }
        });

        if (response.status === 401) {
          // Token expired or invalid: drop the stale session
          clearSession();
        } else {
          const data = response.ok ? await response.json() : null;
          const freshUser = data?.user || parsedUser;
          setToken(storedToken);
          setUser(freshUser);
          localStorage.setItem('ecotrack_user', JSON.stringify(freshUser));
        }
      } catch (e) {
        if (e instanceof SyntaxError) {
          console.error('Failed to parse stored user session', e);
          clearSession();
        } else {
          // Server unreachable: keep the stored session so the user is not logged out offline
          setToken(storedToken);
          setUser(JSON.parse(storedUser));
        }
      } finally {
        setLoading(false);
      }
    };

    restoreSession();
  }, [API_BASE_URL]);

  // Login handler
  const login = async (email, password) => {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email, password })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Login failed');
    }

    setToken(data.token);
    setUser(data.user);
    localStorage.setItem('ecotrack_token', data.token);
    localStorage.setItem('ecotrack_user', JSON.stringify(data.user));

    return data;
  };

  // Register handler
  const register = async (userData) => {
    const response = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(userData)
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Registration failed');
    }

    setToken(data.token);
    setUser(data.user);
    localStorage.setItem('ecotrack_token', data.token);
    localStorage.setItem('ecotrack_user', JSON.stringify(data.user));

    return data;
  };

  // Logout handler
  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('ecotrack_token');
    localStorage.removeItem('ecotrack_user');
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
