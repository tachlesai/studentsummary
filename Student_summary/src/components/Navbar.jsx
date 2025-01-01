import React from 'react';

const Navbar = () => {
  return (
    <nav className="bg-white py-4 px-6 fixed w-full top-0 z-50">
      <div className="max-w-7xl mx-auto flex justify-between items-center">
        <div className="flex items-center gap-12">
          <a href="/" className="text-[22px] font-bold text-indigo-600">KalilAI</a>
          <div className="flex gap-8">
            <a href="#features" className="text-gray-600 hover:text-indigo-600">יכולות</a>
            <a href="#solutions" className="text-gray-600 hover:text-indigo-600">פתרונות</a>
            <a href="#pricing" className="text-gray-600 hover:text-indigo-600">תמחור</a>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <button className="text-indigo-600 hover:text-indigo-700 font-medium">התחברו</button>
          <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center">
            <span className="text-indigo-600 text-xl">⚡</span>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;