import React from 'react';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import Features from './components/Features';
import HowItWorks from './components/HowItWorks';
import ComparisonTable from './components/ComparisonTable';
import StudentStories from './components/StudentStories';
import Footer from './components/Footer';

function App() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main>
        <Hero />
        <Features />
        <HowItWorks />
        <ComparisonTable />
        <StudentStories />
      </main>
      <Footer />
    </div>
    
  );
}

export default App;