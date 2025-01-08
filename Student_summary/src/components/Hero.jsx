import React from 'react';
import HeroImage from './Hero/HeroImage';

const Hero = () => {
  return (
    <div className="bg-gradient-to-b from-white to-indigo-50 py-16">
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
          <div className="text-right order-2 md:order-1 pl-32 relative left-12">
            <h1 className="text-4xl font-bold mb-6 text-indigo-600">
              תפסיק לבזבז שעות על למידה ותתחיל לחסוך זמן
            </h1>
            <p className="text-gray-600 mb-8">
              ב2025 כולם כבר משתמשים בבינה מלאכותית אבל 99% לא מנצלים את כל הפוטנציאל
            </p>
            <button className="bg-indigo-600 text-white px-8 py-3 rounded-lg hover:bg-indigo-700 transition">
              התחל ללמוד חכם יותר ←
            </button>
          </div>
          <div className="order-1 md:order-2 -ml-24 transform-gpu">
            <HeroImage />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Hero;