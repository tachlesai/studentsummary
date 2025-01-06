import React from 'react';
import Hero from '../components/Hero';
import Features from '../components/Features';
import HowItWorks from '../components/HowItWorks';
import ComparisonTable from '../components/ComparisonTable';
import StudentStories from '../components/StudentStories';
import Footer from '../components/Footer';

const Home = () => {
  return (
    <div>
      <Hero />
      <Features />
      <HowItWorks />
      <ComparisonTable />
      <StudentStories />
      <Footer />
    </div>
  );
};

export default Home; 