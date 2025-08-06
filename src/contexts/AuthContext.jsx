import React, { createContext, useContext, useState, useEffect } from 'react';
import { auth } from '../utils/auth.js';
import { userAPI } from '../api/api.js';

const AuthContext = createContext({});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState(null);

  const fetchUserProfile = async () => {
    try {
      const profileData = await userAPI.getProfile();
      if (profileData) {
        // Merge with any existing user data
        const updatedUserData = { ...user, ...profileData };
        setUser(updatedUserData);
        // Update localStorage
        localStorage.setItem('user', JSON.stringify(updatedUserData));
      }
    } catch (error) {
      console.error('Failed to fetch user profile:', error);
      // If profile fetch fails, still use cached data if available
    }
  };

  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        const token = auth.getAuthToken();
        const authenticated = auth.isAuthenticated();
        
        setIsAuthenticated(authenticated);
        
        if (authenticated) {
          // Try to get user data from localStorage
          const userData = localStorage.getItem('user');
          if (userData) {
            setUser(JSON.parse(userData));
          }
          
          // Fetch the latest user data from API
          await fetchUserProfile();
        } else {
          setUser(null);
        }
      } catch (error) {
        console.error('Auth check error:', error);
        setIsAuthenticated(false);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuthStatus();

    // Listen for storage changes (e.g., logout in another tab)
    const handleStorageChange = (e) => {
      if (e.key === 'access_token') {
        checkAuthStatus();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const login = async (userData, token) => {
    try {
      auth.setAuthToken(token);
      localStorage.setItem('user', JSON.stringify(userData));
      setUser(userData);
      setIsAuthenticated(true);
      
      // Fetch complete profile after login
      await fetchUserProfile();
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await auth.logout();
      setUser(null);
      setIsAuthenticated(false);
    } catch (error) {
      console.error('Logout error:', error);
      // Still clear local state even if API call fails
      setUser(null);
      setIsAuthenticated(false);
    }
  };

  const value = {
    isAuthenticated,
    isLoading,
    user,
    login,
    logout,
    refreshUserProfile: fetchUserProfile
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
