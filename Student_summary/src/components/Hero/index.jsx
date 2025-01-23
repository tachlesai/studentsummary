import React from 'react';
import HeroText from './Hero/HeroText';
import HeroImage from './Hero/HeroImage';

const Hero = () => {
  return (
    <div className="bg-gradient-to-br from-indigo-900 to-blue-800 py-24 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute top-0 left-0 w-full h-full opacity-10">
        <div className="absolute top-20 -left-40 w-96 h-96 bg-indigo-500 rounded-full mix-blend-screen filter blur-3xl opacity-30 animate-float"></div>
        <div className="absolute bottom-0 -right-40 w-80 h-80 bg-blue-400 rounded-full mix-blend-screen filter blur-3xl opacity-30 animate-float-delayed"></div>
      </div>
      
      <div className="container mx-auto px-4 max-w-7xl relative">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Text Content */}
          <div className="text-right order-2 lg:order-1 space-y-8">
            <HeroText />
            <div className="flex gap-4 justify-end">
              <button className="hero-button bg-white/10 backdrop-blur-lg hover:bg-white/20 border border-white/20 px-8 py-4 rounded-xl text-lg font-semibold text-white transition-all duration-300 hover:shadow-2xl hover:scale-[1.02]">
                התחל עכשיו בחינם
              </button>
              <button className="hero-button bg-indigo-400/90 hover:bg-indigo-300 border border-indigo-300/30 px-8 py-4 rounded-xl text-lg font-semibold text-indigo-900 transition-all duration-300 hover:shadow-2xl hover:scale-[1.02]">
                צפה בדמו
              </button>
            </div>
          </div>
          
          {/* Image Section */}
          <div className="order-1 lg:order-2 relative">
            <div className="transform-gpu perspective-1000 hover:perspective-2000 transition-all duration-700">
              <div className="relative z-10 hover:rotate-x-[5deg] hover:rotate-y-[5deg] hover:translate-z-20 transition-transform duration-500">
                <HeroImage />
              </div>
              <div className="absolute inset-0 bg-gradient-to-t from-indigo-500/30 to-transparent rounded-3xl backdrop-blur-lg"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Hero;