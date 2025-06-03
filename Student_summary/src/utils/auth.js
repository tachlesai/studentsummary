export const isUserLoggedIn = () => {
  const token = localStorage.getItem('token');
  const user = localStorage.getItem('user');
  return !!(token && user);
};

export const getUser = () => {
  const user = localStorage.getItem('user');
  return user ? JSON.parse(user) : null;
};

export const getUserEmail = () => {
  const user = getUser();
  return user ? user.email : null;
};

export const setUser = (userData) => {
  localStorage.setItem('user', JSON.stringify(userData));
};

export const setToken = (token) => {
  // If token is already in JWT format, store as is
  if (typeof token === 'string' && (token.split('.').length === 3 || token.includes('@'))) {
    localStorage.setItem('token', token);
    return;
  }

  // If we have a user object, create a simple token with the email
  const user = getUser();
  if (user && user.email) {
    // Use the email as a simple token (will be handled by our auth middleware)
    localStorage.setItem('token', user.email);
    return;
  }

  // Otherwise, store the token as is
  localStorage.setItem('token', token);
};

// Generate a reliable token based on user data
export const generateReliableToken = () => {
  const user = getUser();
  if (user && user.email) {
    return user.email;
  }
  return localStorage.getItem('token');
};

// Get token for API requests
export const getAuthToken = () => {
  const token = localStorage.getItem('token');
  if (!token) {
    // Try to regenerate a token based on user data
    const email = getUserEmail();
    if (email) {
      return email;
    }
  }
  return token;
};

export const clearAuth = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
}; 