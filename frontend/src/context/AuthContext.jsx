import React, { createContext, useState, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext();

const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const validateToken = async () => {
      const token = localStorage.getItem('accessToken');
      if (token) {
        try {
          const { data } = await axios.get('/api/auth/me', {
            headers: { Authorization: `Bearer ${token}` },
          });
          setUser(data.user);
        } catch (error) {
          localStorage.removeItem('accessToken');
        }
      }
      setLoading(false);
    };
    validateToken();
  }, []);

  const login = async (email, password) => {
    const { data: csrfData } = await axios.get('/api/auth/csrf');
    const { data } = await axios.post('/api/auth/login', { email, password }, {
      headers: { 'csrf-token': csrfData.csrfToken },
    });
    localStorage.setItem('accessToken', data.accessToken);
    setUser(data.user);
    if (window.DD_RUM) {
      window.DD_RUM.setUser({
        id: data.user.id,
        email: data.user.email,
        name: data.user.email,
        role: data.user.role,
      });
      window.DD_RUM.addAction('user_login', {
        email: data.user.email,
        role: data.user.role,
      });
    }
  };

  const logout = async () => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      try {
        const { data: csrfData } = await axios.get('/api/auth/csrf');
        await axios.post('/api/auth/logout', {}, {
          headers: {
            Authorization: `Bearer ${token}`,
            'csrf-token': csrfData.csrfToken,
          },
        });
      } catch (error) {
        // Ignore errors, just log out locally
      }
    }
    localStorage.removeItem('accessToken');
    setUser(null);
    if (window.DD_RUM) {
      window.DD_RUM.clearUser();
      window.DD_RUM.addAction('user_logout');
    }
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export { AuthContext, AuthProvider };
