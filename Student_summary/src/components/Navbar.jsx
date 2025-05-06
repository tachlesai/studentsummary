import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import API_BASE_URL from '../config';

const Navbar = () => {
  const [user, setUser] = useState(null);
  const [userName, setUserName] = useState('');

  // Fetch first_name directly from server
  const fetchUserFirstName = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;
      
      const response = await fetch(`${API_BASE_URL}/user-first-name`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.first_name) {
          console.log('Got first_name from server:', data.first_name);
          setUserName(data.first_name);
          
          // Update localStorage with correct first_name
          const userData = localStorage.getItem('user');
          if (userData) {
            try {
              const parsedUser = JSON.parse(userData);
              parsedUser.first_name = data.first_name;
              localStorage.setItem('user', JSON.stringify(parsedUser));
            } catch (err) {
              console.error('Error updating user data:', err);
            }
          }
        }
      }
    } catch (error) {
      console.error('Error fetching first_name:', error);
    }
  };

  useEffect(() => {
    // Get user data from localStorage
    const userData = localStorage.getItem('user');
    if (userData) {
      try {
        const parsedUser = JSON.parse(userData);
        setUser(parsedUser);
        
        // Use first_name from localStorage first
        if (parsedUser.first_name) {
          setUserName(parsedUser.first_name);
        }
        
        // Then fetch from server to ensure it's up to date
        fetchUserFirstName();
      } catch (err) {
        console.error('Error parsing user data:', err);
      }
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    setUserName('');
  };

  return (
    // Changed from absolute to fixed positioning for sticky behavior
    <nav className="fixed top-0 left-0 right-0 bg-white shadow-md h-16 z-50" dir="rtl">
      <div className="h-full mx-auto px-8">
        <div className="flex justify-between items-center h-full">
          {/* Right Side (Logo and Links) */}
          <div className="flex items-center gap-8">
            <Link to="/" className="text-[22px] font-bold text-indigo-600">TachelsAI</Link>
            <div className="flex gap-6">
              <Link to="/dashboard" className="text-gray-600 hover:text-indigo-600">סיכום סרטונים</Link>
              <Link to="/record-audio" className="text-gray-600 hover:text-indigo-600">הקלטות</Link>
              <a href="/#capabilities" className="text-gray-600 hover:text-indigo-600">יכולות</a>
              <a href="/#solutions" className="text-gray-600 hover:text-indigo-600">פתרונות</a>
              <Link to="/membership-payment" className="text-gray-700 hover:text-blue-600">תמחור</Link>
              <Link to="/account-details" className="text-gray-700 hover:text-blue-600">אזור אישי</Link>
            </div>
          </div>

          {/* Left Side (User Actions) */}
          <div className="flex items-center gap-6">
            {user ? (
              <div className="flex items-center gap-4">
                <span className="text-gray-600">שלום, {userName || 'משתמש'}</span>
                <button 
                  onClick={handleLogout}
                  className="text-indigo-600 hover:text-indigo-700 font-medium"
                >
                  התנתק
                </button>
              </div>
            ) : (
              <Link to="/login">
                <button className="text-indigo-600 hover:text-indigo-700 font-medium">
                  הירשמו/התחברו
                </button>
              </Link>
            )}
            <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center">
              <span className="text-indigo-600 text-xl">⚡</span>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;