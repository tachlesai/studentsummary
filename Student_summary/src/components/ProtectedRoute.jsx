import React, { useState, useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { isUserLoggedIn } from '../utils/auth';

/**
 * A wrapper component that protects routes from unauthenticated access
 * Redirects to login page if user is not authenticated
 */
const ProtectedRoute = ({ children }) => {
  const location = useLocation();
  const [isAuthenticated, setIsAuthenticated] = useState(null); // null = loading
  
  useEffect(() => {
    // Check authentication
    const authStatus = isUserLoggedIn();
    setIsAuthenticated(authStatus);
  }, []);
  
  // Show nothing while checking authentication to avoid flickering
  if (isAuthenticated === null) {
    return <div className="flex justify-center items-center h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
    </div>;
  }
  
  if (!isAuthenticated) {
    // Redirect to login page if not authenticated
    // Pass the current location so we can show a message on the login page
    return <Navigate 
      to="/login" 
      state={{ from: location.pathname }}
      replace 
    />;
  }
  
  // If authenticated, render the children (the protected route component)
  return children;
};

export default ProtectedRoute; 