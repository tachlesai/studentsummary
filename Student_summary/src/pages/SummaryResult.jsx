import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Card, CardContent } from '../components/ui/card';
import Navbar from '../components/Navbar';
import API_BASE_URL from '../config';
import { PDFDocument, rgb } from 'pdf-lib';
import fontkit from '@pdf-lib/fontkit';

const SummaryResult = () => {
  const location = useLocation();
  const navigate = useNavigate();
  
  const [summaryData, setSummaryData] = useState(location.state || {});
  const [isDownloading, setIsDownloading] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);

  useEffect(() => {
    // If no state is provided, try to get data from localStorage
    if (!location.state) {
      const savedSummary = localStorage.getItem('lastProcessedSummary');
      if (savedSummary) {
        try {
          const parsedData = JSON.parse(savedSummary);
          setSummaryData(parsedData);
        } catch (error) {
          console.error('Error parsing saved summary:', error);
          navigate('/dashboard');
        }
      } else {
        // If no data is available, redirect to dashboard
        navigate('/dashboard');
      }
    }
  }, [location, navigate]);
  
  const { summary, pdfPath, title, created_at } = summaryData;
  
  const handleBack = () => {
    navigate('/dashboard');
  };

  const handleCopyToClipboard = () => {
    navigator.clipboard.writeText(summary || '')
      .then(() => {
        setCopySuccess(true);
        setTimeout(() => setCopySuccess(false), 2000);
      })
      .catch(err => {
        console.error('Failed to copy text: ', err);
        alert('שגיאה בהעתקת הטקסט');
      });
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('he-IL', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="mb-6 flex justify-between items-center">
          <button
            onClick={handleBack}
            className="flex items-center gap-2 text-blue-600 hover:text-blue-800 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            חזרה ללוח הבקרה
          </button>
        </div>
        
        <Card className="shadow-lg border border-gray-200 overflow-hidden">
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-6 text-white">
            <h1 className="text-2xl font-bold mb-2">{title || 'סיכום'}</h1>
            <div className="flex items-center text-blue-100 text-sm">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span>{formatDate(created_at)}</span>
            </div>
          </div>
          
          <CardContent className="p-0">
            <div className="flex border-b border-gray-200">
              <button
                onClick={handleCopyToClipboard}
                className="flex-1 py-4 text-center font-medium bg-white text-blue-600 hover:bg-blue-50 transition-colors border-r border-gray-200"
              >
                {copySuccess ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-500" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    הועתק!
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                    העתק לקליפבורד
                  </span>
                )}
              </button>
            </div>
            
            <div className="p-6 bg-white rounded-b-lg">
              <div className="border border-gray-100 bg-gray-50 p-6 rounded-lg shadow-inner">
                {summary ? (
                  <p className="whitespace-pre-wrap text-gray-700 leading-relaxed">{summary}</p>
                ) : (
                  <div className="text-center py-10">
                    <div className="animate-pulse flex flex-col items-center justify-center">
                      <div className="rounded-full bg-gray-200 h-12 w-12 mb-4"></div>
                      <div className="h-4 bg-gray-200 rounded w-1/2 mb-2.5"></div>
                      <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
        
      </div>
    </div>
  );
};

export default SummaryResult; 