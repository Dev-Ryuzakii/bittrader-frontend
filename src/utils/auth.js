// Handle authentication state
const setAuthToken = (token, refreshToken = null) => {
  if (token) {
    // Ensure token has Bearer prefix for our backend
    const formattedToken = token.startsWith('Bearer ') ? token : `Bearer ${token}`;
    localStorage.setItem('access_token', formattedToken);
    if (refreshToken) {
      localStorage.setItem('refresh_token', refreshToken);
    }
  } else {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
  }
};

const getAuthToken = () => {
  return localStorage.getItem('access_token');
};

const isAuthenticated = () => {
  return !!getAuthToken();
};

// Handle redirects
const redirectToDashboard = () => {
  window.location.href = '/dashboard';
};

const redirectToLogin = () => {
  window.location.href = '/signin';
};

const getRefreshToken = () => {
  return localStorage.getItem('refresh_token');
};

const clearAuth = () => {
  localStorage.removeItem('access_token');
  localStorage.removeItem('refresh_token');
  localStorage.removeItem('user');
};

const logout = async () => {
  try {
    // Import authAPI dynamically to avoid circular imports
    const { authAPI } = await import('../api/api.js');
    await authAPI.logout();
  } catch (error) {
    console.error('API logout failed:', error);
    // Continue with local cleanup even if API fails
  } finally {
    clearAuth();
    // Force a page reload to ensure all state is cleared
    window.location.href = '/signin';
  }
};

export const auth = {
  setAuthToken,
  getAuthToken,
  getRefreshToken,
  clearAuth,
  logout,
  isAuthenticated,
  redirectToDashboard,
  redirectToLogin,
};
