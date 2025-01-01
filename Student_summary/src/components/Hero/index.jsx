import React from 'react';
import HeroText from './HeroText';
import HeroImage from './HeroImage';
import './Hero.css';

const Hero = () => {
  return (
    <div className="hero-container">
      <div className="hero-content">
        <HeroImage />
        <HeroText />
      </div>
    </div>
  );
};

export default Hero;
