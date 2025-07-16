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
};

export const auth = {
  setAuthToken,
  getAuthToken,
  getRefreshToken,
  clearAuth,
  isAuthenticated,
  redirectToDashboard,
  redirectToLogin,
};
