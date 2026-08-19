import { createContext, useContext, useState, useEffect } from 'react';
import { loginUser, registerUser, getCurrentUser } from '../api/auth.api.js';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Initial authentication check on provider mount
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('token');

      if (!token) {
        setUser(null);
        setLoading(false);
        return;
      }

      try {
        const response = await getCurrentUser();
        if (response && response.success && response.data) {
          // Backend GET /auth/me returns user object (or nested in response.data.user)
          const userObj = response.data.user || response.data;
          setUser(userObj);
        } else {
          localStorage.removeItem('token');
          setUser(null);
        }
      } catch (error) {
        console.error('Initial authentication check failed:', error.message);
        localStorage.removeItem('token');
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  const login = async (email, password) => {
    const response = await loginUser({ email, password });

    if (response && response.success && response.data?.token) {
      const token = response.data.token;
      localStorage.setItem('token', token);

      const userProfileRes = await getCurrentUser();
      const userObj = userProfileRes.data?.user || userProfileRes.data || response.data.user;
      setUser(userObj);
    }

    return response;
  };

  const register = async (userData) => {
    const response = await registerUser(userData);

    if (response && response.success && response.data?.token) {
      const token = response.data.token;
      localStorage.setItem('token', token);

      const userProfileRes = await getCurrentUser();
      const userObj = userProfileRes.data?.user || userProfileRes.data || response.data.user;
      setUser(userObj);
    }

    return response;
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  const updateUser = (updatedUser) => {
    setUser(updatedUser);
  };

  const value = {
    user,
    loading,
    isAuthenticated: !!user,
    login,
    register,
    logout,
    updateUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
