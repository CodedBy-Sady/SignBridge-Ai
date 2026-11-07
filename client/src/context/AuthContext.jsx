import React, { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Restore authenticated session from localStorage on initial load
  useEffect(() => {
    const savedToken = localStorage.getItem('signbridge_token');
    const savedUser = localStorage.getItem('signbridge_user');

    if (savedToken && savedUser) {
      try {
        setToken(savedToken);
        setUser(JSON.parse(savedUser));
      } catch (e) {
        console.error('Failed to parse saved user:', e);
        localStorage.removeItem('signbridge_token');
        localStorage.removeItem('signbridge_user');
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (email, password) => {
    const res = await authAPI.login({ email, password });
    const { token: receivedToken, user: receivedUser } = res.data;
    setToken(receivedToken);
    setUser(receivedUser);
    localStorage.setItem('signbridge_token', receivedToken);
    localStorage.setItem('signbridge_user', JSON.stringify(receivedUser));
    return receivedUser;
  };

  const register = async ({ full_name, email, password, role = 'deaf_user' }) => {
    const res = await authAPI.register({ full_name, email, password, role });
    const { token: receivedToken, user: receivedUser } = res.data;
    setToken(receivedToken);
    setUser(receivedUser);
    localStorage.setItem('signbridge_token', receivedToken);
    localStorage.setItem('signbridge_user', JSON.stringify(receivedUser));
    return receivedUser;
  };

  const googleLogin = async (idToken, role = 'deaf_user', demoUser = null) => {
    const res = await authAPI.googleAuth({
      id_token: idToken,
      role,
      demo_user: demoUser
    });
    const { token: receivedToken, user: receivedUser } = res.data;
    setToken(receivedToken);
    setUser(receivedUser);
    localStorage.setItem('signbridge_token', receivedToken);
    localStorage.setItem('signbridge_user', JSON.stringify(receivedUser));
    return receivedUser;
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('signbridge_token');
    localStorage.removeItem('signbridge_user');
  };

  const updateUserRole = (newRole) => {
    if (!user) return;
    const updated = { ...user, role: newRole };
    setUser(updated);
    localStorage.setItem('signbridge_user', JSON.stringify(updated));
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!user,
        isLoading,
        login,
        register,
        googleLogin,
        logout,
        updateUserRole,
      }}
    >
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

export default AuthContext;
