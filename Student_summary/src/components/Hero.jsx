import React from 'react';
import HeroText from './Hero/HeroText';

import HeroImage from './Hero/HeroImage';

const Hero = () => {
  return (
    <div className="bg-gradient-to-b from-white to-indigo-50 py-16">
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
          <div className="text-right order-2 md:order-1 pl-32 relative left-12">
            <HeroText />
          </div>
          <div className="order-1 md:order-2 -ml-24 transform-gpu pt-8 md:pt-16">
              <HeroImage />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Hero;