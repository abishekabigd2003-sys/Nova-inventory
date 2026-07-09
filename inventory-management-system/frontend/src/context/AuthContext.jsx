import { createContext, useContext, useState, useEffect } from 'react';
import api from '../api/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      const stored = localStorage.getItem('ims_user');
      if (stored) {
        try {
          const userData = JSON.parse(stored);
          if (userData.token) {
            const { data } = await api.get('/api/auth/me');
            // Preserve token from storage
            data.token = userData.token;
            setUser(data);
            localStorage.setItem('ims_user', JSON.stringify(data));
          }
        } catch {
          localStorage.removeItem('ims_user');
          setUser(null);
        }
      }
      setLoading(false);
    };
    fetchUser();
  }, []);

  const login = async (email, password) => {
    try {
      const { data } = await api.post('/api/auth/login', { email, password });
      localStorage.setItem('ims_user', JSON.stringify(data));
      setUser(data);
      return { success: true, role: data.role };
    } catch (error) {
      let errorMessage = 'Invalid email or password.';
      if (!error.response) {
        errorMessage = 'Network Error: Cannot connect to server. Please ensure backend services are running.';
      } else if (error.response.status >= 500) {
        errorMessage = 'Server Error: The backend service is currently unavailable or misconfigured.';
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      }
      return {
        success: false,
        message: errorMessage,
      };
    }
  };

  const register = async (name, email, password) => {
    try {
      const { data } = await api.post('/api/auth/register', { name, email, password });
      localStorage.setItem('ims_user', JSON.stringify(data));
      setUser(data);
      return { success: true, role: data.role };
    } catch (error) {
      let errorMessage = 'Registration failed.';
      if (!error.response) {
        errorMessage = 'Network Error: Cannot connect to server. Please ensure backend services are running.';
      } else if (error.response.status >= 500) {
        errorMessage = 'Server Error: The backend service is currently unavailable or misconfigured.';
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      }
      return {
        success: false,
        message: errorMessage,
      };
    }
  };

  const logout = () => {
    localStorage.removeItem('ims_user');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
