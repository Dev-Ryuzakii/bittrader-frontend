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
  const token = getAuthToken();
  if (!token) return false;
  
  try {
    // Basic check for token format
    if (!token.startsWith('Bearer ')) return false;
    
    // Extract the actual token part
    const actualToken = token.split(' ')[1];
    if (!actualToken) return false;
    
    // For JWT tokens, check if it's expired (basic validation)
    try {
      const payload = JSON.parse(atob(actualToken.split('.')[1]));
      if (payload.exp && payload.exp * 1000 < Date.now()) {
        // Token is expired, clear it
        clearAuth();
        return false;
      }
    } catch (e) {
      // Not a JWT or couldn't parse, but token exists so assume it's valid
      // The server will validate it properly
    }
    
    return true;
  } catch (error) {
    console.error('Token validation error:', error);
    clearAuth();
    return false;
  }
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
