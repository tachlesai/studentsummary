import React, { useState, useEffect } from 'react';
import { setUser, setToken } from '../utils/auth';

function DevUserSwitcher() {
  const [isVisible, setIsVisible] = useState(false);
  
  const loginAsTestUser = () => {
    // Create a test user with the email matching the database entries
    const testUser = {
      id: 1,
      email: 'test1@gmail.com',
      first_name: 'Test',
      last_name: 'User'
    };
    
    // Create a simple token (in real app this would be a JWT)
    const testToken = btoa(JSON.stringify({
      user: testUser,
      exp: Math.floor(Date.now() / 1000) + 86400 // 24 hours from now
    }));
    
    // Set the user and token in localStorage
    setUser(testUser);
    setToken(testToken);
    
    // Reload the page to apply changes
    window.location.reload();
  };
  
  return (
    <div className="fixed bottom-4 right-4 z-50">
      <button 
        onClick={() => setIsVisible(!isVisible)}
        className="bg-gray-800 text-white p-3 rounded-full shadow-lg"
      >
        <span className="text-sm">DEV</span>
      </button>
      
      {isVisible && (
        <div className="absolute bottom-14 right-0 bg-white p-4 rounded-lg shadow-xl border w-64">
          <h3 className="text-lg font-bold mb-3">Developer Tools</h3>
          <button
            onClick={loginAsTestUser}
            className="w-full bg-blue-600 text-white px-4 py-2 rounded mb-2"
          >
            Login as test1@gmail.com
          </button>
          <button
            onClick={() => {
              localStorage.clear();
              window.location.reload();
            }}
            className="w-full bg-red-600 text-white px-4 py-2 rounded"
          >
            Clear Auth & Reload
          </button>
          <div className="mt-3 text-xs text-gray-500">
            Current user: {localStorage.getItem('token') ? JSON.parse(localStorage.getItem('user'))?.email || 'Unknown' : 'Not logged in'}
          </div>
        </div>
      )}
    </div>
  );
}

export default DevUserSwitcher; 