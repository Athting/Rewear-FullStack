import React, { createContext, useState, useEffect } from 'react';
import api, { setGlobalAccessToken } from '../services/api.js';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const cached = localStorage.getItem('rewear_user');
      return cached ? JSON.parse(cached) : null;
    } catch {
      return null;
    }
  });
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return !!localStorage.getItem('rewear_user');
  });
  const [loading, setLoading] = useState(() => {
    try {
      return !localStorage.getItem('rewear_user');
    } catch {
      return true;
    }
  });

  const normalizeUser = (userData) => {
    if (!userData) return null;
    return {
      ...userData,
      id: userData.id || userData._id,
      _id: userData._id || userData.id
    };
  };

  const safeSetLocalStorage = (key, value) => {
    try {
      localStorage.setItem(key, value);
    } catch (e) {
      console.warn('LocalStorage writing is disabled or restricted:', e);
    }
  };

  const safeRemoveLocalStorage = (key) => {
    try {
      localStorage.removeItem(key);
    } catch (e) {
      console.warn('LocalStorage removing is restricted:', e);
    }
  };

  // Silent authorization check on page mount
  const checkAuthSession = async () => {
    try {
      const response = await api.post('/auth/refresh-token');
      const { accessToken } = response.data;
      setGlobalAccessToken(accessToken);

      const profileResponse = await api.get('/users/me');
      const normalized = normalizeUser(profileResponse.data.user);
      
      safeSetLocalStorage('rewear_user', JSON.stringify(normalized));
      setUser(normalized);
      setIsAuthenticated(true);
    } catch (error) {
      console.log('No active session found.');
      setGlobalAccessToken(null);
      safeRemoveLocalStorage('rewear_user');
      setUser(null);
      setIsAuthenticated(false);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkAuthSession();
  }, []);

  const loginUser = async (email, password) => {
    try {
      const response = await api.post('/auth/login', { email, password });
      const { accessToken, user: userData } = response.data;
      
      setGlobalAccessToken(accessToken);
      const normalized = normalizeUser(userData);
      safeSetLocalStorage('rewear_user', JSON.stringify(normalized));
      
      setUser(normalized);
      setIsAuthenticated(true);
      return { success: true };
    } catch (error) {
      console.error('Login error detail:', error);
      const msg = error.response?.data?.message;
      const valErrors = error.response?.data?.errors;
      let finalMsg = 'Login failed';
      if (valErrors && Array.isArray(valErrors)) {
        finalMsg = valErrors.map(e => `${e.field}: ${e.message}`).join(', ');
      } else if (msg) {
        finalMsg = msg;
      }
      return { success: false, error: finalMsg };
    }
  };

  const registerUser = async (formData) => {
    try {
      const response = await api.post('/auth/register', formData);
      const { accessToken, user: userData } = response.data;

      setGlobalAccessToken(accessToken);
      const normalized = normalizeUser(userData);
      safeSetLocalStorage('rewear_user', JSON.stringify(normalized));

      setUser(normalized);
      setIsAuthenticated(true);
      return { success: true };
    } catch (error) {
      console.error('Registration error detail:', error);
      const msg = error.response?.data?.message;
      const valErrors = error.response?.data?.errors;
      let finalMsg = 'Registration failed';
      if (valErrors && Array.isArray(valErrors)) {
        finalMsg = valErrors.map(e => `${e.field}: ${e.message}`).join(', ');
      } else if (msg) {
        finalMsg = msg;
      }
      return { success: false, error: finalMsg };
    }
  };

  const logoutUser = async () => {
    try {
      await api.post('/auth/logout');
    } catch (error) {
      console.error('Logout API failed:', error.message);
    } finally {
      setGlobalAccessToken(null);
      safeRemoveLocalStorage('rewear_user');
      setUser(null);
      setIsAuthenticated(false);
    }
  };

  const updateProfileDetails = async (profileData) => {
    try {
      const response = await api.put('/users/profile', profileData);
      const normalized = normalizeUser(response.data.user);
      safeSetLocalStorage('rewear_user', JSON.stringify(normalized));
      
      setUser(normalized);
      return { success: true };
    } catch (error) {
      const msg = error.response?.data?.message || 'Update failed';
      return { success: false, error: msg };
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      isAuthenticated,
      loading,
      login: loginUser,
      register: registerUser,
      logout: logoutUser,
      updateProfile: updateProfileDetails,
      checkSession: checkAuthSession
    }}>
      {children}
    </AuthContext.Provider>
  );
};
