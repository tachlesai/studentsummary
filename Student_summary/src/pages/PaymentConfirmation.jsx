import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';

const PaymentConfirmation = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [status, setStatus] = useState('success');

  useEffect(() => {
    // Get status from query parameters
    const params = new URLSearchParams(location.search);
    const queryStatus = params.get('status');
    if (queryStatus) {
      setStatus(queryStatus);
    }
    
    // Redirect to dashboard after 5 seconds
    const timer = setTimeout(() => {
      navigate('/dashboard');
    }, 5000);
    
    return () => clearTimeout(timer);
  }, [location, navigate]);

  return (
    <div className="min-h-screen bg-blue-50 py-16">
      <motion.div 
        className="max-w-2xl mx-auto bg-white p-8 rounded-xl shadow-lg"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {status === 'success' ? (
          <>
            <div className="flex justify-center mb-6">
              <div className="bg-green-100 p-3 rounded-full">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            </div>
            
            <h1 className="text-3xl font-bold text-center text-gray-800 mb-4">תשלום התקבל בהצלחה!</h1>
            
            <div className="text-center text-gray-600 mb-8">
              <p className="mb-2">החשבון שלך שודרג בהצלחה לחשבון פרימיום.</p>
              <p>תועבר לדף הבית באופן אוטומטי תוך מספר שניות.</p>
            </div>
            
            <div className="flex justify-center">
              <button
                onClick={() => navigate('/dashboard')}
                className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                חזרה לדף הבית
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="flex justify-center mb-6">
              <div className="bg-yellow-100 p-3 rounded-full">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
            </div>
            
            <h1 className="text-3xl font-bold text-center text-gray-800 mb-4">התשלום בתהליך</h1>
            
            <div className="text-center text-gray-600 mb-8">
              <p className="mb-2">התשלום שלך נקלט ונמצא בתהליך אימות.</p>
              <p>אם לא תראה עדכון בחשבון תוך מספר דקות, אנא צור קשר עם התמיכה.</p>
            </div>
            
            <div className="flex justify-center">
              <button
                onClick={() => navigate('/dashboard')}
                className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                חזרה לדף הבית
              </button>
            </div>
          </>
        )}
      </motion.div>
    </div>
  );
};

export default PaymentConfirmation; 