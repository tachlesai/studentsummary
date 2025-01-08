import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

const Navbar = () => {
  const [user, setUser] = useState(null);

  useEffect(() => {
    // Check localStorage when component mounts
    const userData = localStorage.getItem('user');
    if (userData) {
      setUser(JSON.parse(userData));
    }

    // Listen for changes in localStorage
    const handleStorageChange = (e) => {
      if (e.key === 'user') {
        if (e.newValue) {
          setUser(JSON.parse(e.newValue));
        } else {
          setUser(null);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    
    // Also check for changes every second (as a backup)
    const interval = setInterval(() => {
      const currentUserData = localStorage.getItem('user');
      if (currentUserData) {
        const parsedUser = JSON.parse(currentUserData);
        if (JSON.stringify(parsedUser) !== JSON.stringify(user)) {
          setUser(parsedUser);
        }
      } else if (user) {
        setUser(null);
      }
    }, 1000);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(interval);
    };
  }, [user]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  return (
    <nav className="bg-white py-4 px-6 fixed w-full top-0 z-50">
      <div className="max-w-7xl mx-auto flex justify-between items-center">
        <div className="flex items-center gap-12">
          <a href="/" className="text-[22px] font-bold text-indigo-600">TachelsAI</a>
          <div className="flex gap-8">
            <a href="#features" className="text-gray-600 hover:text-indigo-600">יכולות</a>
            <a href="#solutions" className="text-gray-600 hover:text-indigo-600">פתרונות</a>
            <a href="#pricing" className="text-gray-600 hover:text-indigo-600">תמחור</a>
          </div>
        </div>
        <div className="flex items-center gap-4">
          {user ? (
            <div className="flex items-center gap-4">
              <span className="text-gray-600">שלום, {user.firstName}</span>
              <button 
                onClick={handleLogout}
                className="text-indigo-600 hover:text-indigo-700 font-medium"
              >
                התנתק
              </button>
            </div>
          ) : (
            <Link to="/login">
              <button className="text-indigo-600 hover:text-indigo-700 font-medium">התחברו</button>
            </Link>
          )}
          <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center">
            <span className="text-indigo-600 text-xl">⚡</span>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;