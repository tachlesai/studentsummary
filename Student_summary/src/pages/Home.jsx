import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import Hero from '../components/Hero';
import Features from '../components/Features';
import Capabilities from '../components/Capabilities'; 
import HowItWorks from '../components/HowItWorks';
import ComparisonTable from '../components/ComparisonTable';
import StudentStories from '../components/StudentStories';
import Footer from '../components/Footer';
import ThenVsToday from '../components/ThenVsToday';
import FAQ from '../components/FAQ';
import Pricing from '../components/Pricing';
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
      
      {/* Audio Recording Link Section */}
      <div className="section">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-3xl mx-auto bg-white p-6 rounded-lg shadow-md text-center">
            <h3 className="text-xl font-semibold text-right mb-3">רוצה לנסות את הקלטת הקול שלנו?</h3>
            <p className="text-right mb-4">עבור לדף ההקלטות כדי להתחיל להקליט ולקבל תמלול וסיכום</p>
            <Link 
              to="/record-audio" 
              className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-full transition-colors"
            >
              עבור לדף ההקלטות
            </Link>
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
        <Pricing />
      </div>
      <div className="section">
        <FAQ />
      </div>
      <Footer />
    </div>
  );
};

export default Home;