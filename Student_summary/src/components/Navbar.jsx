import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

const Navbar = () => {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      setUser(JSON.parse(userData));
    }

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
    <nav className="bg-white py-4 px-6 fixed w-full top-0 z-50 shadow-md">
      <div className="max-w-7xl mx-auto flex justify-between items-center">
        {/* Left Side */}
        <div className="flex items-center gap-8">
          <a href="/" className="text-[22px] font-bold text-indigo-600">TachelsAI</a>
          <div className="flex gap-6">
            <a href="#features" className="text-gray-600 hover:text-indigo-600">יכולות</a>
            <a href="#solutions" className="text-gray-600 hover:text-indigo-600">פתרונות</a>
            <a href="#pricing" className="text-gray-600 hover:text-indigo-600">תמחור</a>
          </div>
        </div>

        {/* Right Side */}
        <div className="flex items-center gap-6">
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
              <button className="text-indigo-600 hover:text-indigo-700 font-medium pl-12">
                הירשמו/התחברו
              </button>
            </Link>
          )}
          <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center pl 12">
            <span className="text-indigo-600 text-xl">⚡</span>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
