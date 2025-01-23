import React from 'react';
import { Link } from 'react-router-dom';
import Features from './Features';
import ComparisonTable from './ComparisonTable';

const Navbar = () => {
  return (
    <nav className="bg-white shadow-sm fixed w-full top-0 z-50">
      <div className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Logo & Brand */}
          <div className="flex items-center space-x-4 space-x-reverse">
            <div className="w-10 h-10 bg-gradient-to-br from-indigo-600 to-blue-500 rounded-xl flex items-center justify-center shadow-lg">
              <span className="text-white font-bold text-xl">T</span>
            </div>
            <span className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-blue-600 bg-clip-text text-transparent">
              TachlesAI
            </span>
          </div>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center space-x-8 space-x-reverse mr-8">
            <Link to="/" className="text-gray-600 hover:text-indigo-600 transition-colors">
              דף הבית
            </Link>
            <Link to="#Features" className="text-gray-600 hover:text-indigo-600 transition-colors">
              יכולות
            </Link>
            <Link to="/pricing" className="text-gray-600 hover:text-indigo-600 transition-colors">
              תמחור
            </Link>
            <Link to="/about" className="text-gray-600 hover:text-indigo-600 transition-colors">
              אודות
            </Link>
          </div>

          {/* Auth Buttons */}
          <div className="flex items-center space-x-4 space-x-reverse">
            <Link 
              to="/login" 
              className="text-gray-600 hover:text-indigo-600 transition-colors px-4 py-2"
            >
              התחברות
            </Link>
            <Link 
              to="/signup" 
              className="bg-indigo-600 text-white px-6 py-2 rounded-xl hover:bg-indigo-700 transition-all transform hover:scale-105 shadow-md hover:shadow-lg font-medium"
            >
              הרשמה
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;