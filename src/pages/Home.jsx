import React from 'react';
import Hero from '../components/Hero';
import Features from '../components/Features';
import Capabilities from '../components/Capabilities';
import AudioRecorder from '../components/AudioRecorder';

function Home() {
  return (
    <div className="min-h-screen">
      <Hero />
      
      <div className="py-12 bg-gray-50">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-8 text-gray-800">למה לבחור בTachlesAI?</h2>
          
          {/* Audio Recorder Component */}
          <div className="max-w-3xl mx-auto mb-12 bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-xl font-semibold text-right mb-3">הקלטת קול</h3>
            <p className="text-right mb-4">לחץ על הכפתור למטה כדי להתחיל להקליט את הקול שלך</p>
            <AudioRecorder />
          </div>
          
          <Features />
        </div>
      </div>
      
      <Capabilities />
    </div>
  );
}

export default Home;