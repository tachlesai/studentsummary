import React, { useEffect } from 'react';
import Hero from '../components/Hero';
import Features from '../components/Features';
import Capabilities from '../components/Capabilities'; 
import HowItWorks from '../components/HowItWorks';
import ComparisonTable from '../components/ComparisonTable';
import StudentStories from '../components/StudentStories';
import Footer from '../components/Footer';
import ThenVsToday from '../components/ThenVsToday';
import FAQ from '../components/FAQ';
import AudioRecorder from '../components/AudioRecorder';
import '../styles/style.css';

const Home = () => {
  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
        }
      });
    }, { threshold: 0.1 });

    document.querySelectorAll('.section').forEach((section) => {
      observer.observe(section);
    });
  }, []);

  return (
    <div>
      <div className="section">
        <Hero />
      </div>
      <div className="section">
        <Features />
      </div>
      
      {/* Audio Recorder Section */}
      <div className="section">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-3xl mx-auto bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-xl font-semibold text-right mb-3">הקלטת קול</h3>
            <p className="text-right mb-4">לחץ על הכפתור למטה כדי להתחיל להקליט את הקול שלך</p>
            <AudioRecorder />
          </div>
        </div>
      </div>
      
      <div className="section">
        <Capabilities />
      </div>
      <div className="section">
        <HowItWorks />
      </div>
      <div className="section">
        <ComparisonTable />
      </div>
      <div className="section">
        <ThenVsToday />
      </div>
      <div className="section">
        <StudentStories />
      </div>
      <div className="section">
        <FAQ />
      </div>
      <Footer />
    </div>
  );
};

export default Home;