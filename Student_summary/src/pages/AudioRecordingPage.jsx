import React from 'react';
import AudioRecorder from '../components/AudioRecorder';
import { Link } from 'react-router-dom';

const AudioRecordingPage = () => {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto bg-white p-8 rounded-lg shadow-md">
          <h1 className="text-3xl font-bold text-right mb-6">הקלטת קול</h1>
          
          <p className="text-right mb-6 text-gray-700">
            באמצעות הקלטת קול, תוכל לתמלל ולסכם את ההרצאות שלך בקלות.
            לחץ על הכפתור למטה כדי להתחיל להקליט את הקול שלך.
          </p>
          
          <div className="mb-8">
            <AudioRecorder />
          </div>
          
          <div className="text-right">
            <p className="text-sm text-gray-600 mb-4">
              * ההקלטות נשמרות באופן מקומי בדפדפן שלך ולא נשלחות לשרת ללא אישורך.
            </p>
            
            <Link 
              to="/" 
              className="inline-block text-blue-600 hover:text-blue-800 transition-colors"
            >
              &larr; חזרה לדף הבית
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AudioRecordingPage;