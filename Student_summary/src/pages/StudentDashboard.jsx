import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '../components/ui/card';
import { useNavigate } from 'react-router-dom';
import UsageStatus from '../components/UsageStatus';
import Navbar from '../components/Navbar';
import API_BASE_URL from '../config';

const StudentDashboard = () => {
  const navigate = useNavigate();
  const [dragActive, setDragActive] = useState(false);
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [summaries, setSummaries] = useState([]);
  const [user, setUser] = useState(null);
  const userPlan = "Pro";
  const [file, setFile] = useState(null);
  const [usageData, setUsageData] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [summaryOptions, setSummaryOptions] = useState({
    style: 'detailed',
    format: 'bullets',
    language: 'he',
    maxPoints: 10
  });
  const [outputType, setOutputType] = useState('summary');
  const [isUsageLimitReached, setIsUsageLimitReached] = useState(false);
  const [processedSummary, setProcessedSummary] = useState(null);
  const [processedPdfPath, setProcessedPdfPath] = useState(null);
  const [processingComplete, setProcessingComplete] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }
    fetchSummaries();
    fetchUsageStatus();
    // Get user data from localStorage
    const userData = localStorage.getItem('user');
    if (userData) {
      setUser(JSON.parse(userData));
    }

    const checkUsageLimit = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_BASE_URL}/usage-status`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        const data = await response.json();
        
        if (data.membershipType === 'free' && data.remainingUses <= 0) {
          setIsUsageLimitReached(true);
        }
      } catch (error) {
        console.error('Error checking usage limit:', error);
      }
    };

    checkUsageLimit();
  }, [navigate]);

  const fetchSummaries = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/summaries`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      
      // Check if data has the expected structure
      if (data && data.success && Array.isArray(data.summaries)) {
        setSummaries(data.summaries); // Use data.summaries instead of data
      } else {
        console.error('Unexpected API response format:', data);
        setSummaries([]); // Set to empty array as fallback
      }
    } catch (error) {
      console.error('Error fetching summaries:', error);
      setSummaries([]); // Set to empty array on error
    }
  };

  const fetchUsageStatus = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/usage-status`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      setUsageData(data);
    } catch (error) {
      console.error('Error fetching usage status:', error);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      setFile(droppedFile);
      
      // Automatically submit the form when a file is dropped
      const formData = new FormData();
      formData.append('audioFile', droppedFile);
      
      setLoading(true);
      setProcessingComplete(false);
      
      const token = localStorage.getItem('token');
      console.log("Sending file to server...");
      
      fetch(`${API_BASE_URL}/process-audio`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      })
      .then(response => {
        console.log("Received response status:", response.status);
        return response.json();
      })
      .then(data => {
        console.log("Received response data:", data);
        setLoading(false);
        
        if (data.success) {
          console.log("Success! Received data:", data);
          setProcessedSummary(data.summary.content);
          setProcessedPdfPath(data.summary.pdf_path);
          setProcessingComplete(true);
          
          // Save to localStorage for persistence
          localStorage.setItem('lastProcessedSummary', JSON.stringify({
            summary: data.summary.content,
            pdfPath: data.summary.pdf_path,
            title: data.summary.title || 'Untitled Summary',
            created_at: data.summary.created_at || new Date().toISOString()
          }));
          
          // Refresh summaries list
          fetchSummaries();
        } else {
          console.log("Error in response:", data.error);
          // Fallback - refresh summaries list
          fetchSummaries();
          setFile(null);
          alert(data.error || 'Error processing file');
        }
      })
      .catch(error => {
        console.error('Error processing file:', error);
        setLoading(false);
        alert('Error processing file: ' + error.message);
      });
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      
      // Automatically submit the form when a file is selected
      const formData = new FormData();
      formData.append('audioFile', selectedFile);
      
      setLoading(true);
      setProcessingComplete(false);
      
      const token = localStorage.getItem('token');
      console.log("Sending file to server...");
      
      fetch(`${API_BASE_URL}/process-audio`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      })
      .then(response => {
        console.log("Received response status:", response.status);
        return response.json();
      })
      .then(data => {
        console.log("Received response data:", data);
        setLoading(false);
        
        if (data.success) {
          console.log("Success! Received data:", data);
          setProcessedSummary(data.summary.content);
          setProcessedPdfPath(data.summary.pdf_path);
          setProcessingComplete(true);
          
          // Save to localStorage for persistence
          localStorage.setItem('lastProcessedSummary', JSON.stringify({
            summary: data.summary.content,
            pdfPath: data.summary.pdf_path,
            title: data.summary.title || 'Untitled Summary',
            created_at: data.summary.created_at || new Date().toISOString()
          }));
          
          // Refresh summaries list
          fetchSummaries();
        } else {
          console.log("Error in response:", data.error);
          // Fallback - refresh summaries list
          fetchSummaries();
          setFile(null);
          alert(data.error || 'Error processing file');
        }
      })
      .catch(error => {
        console.error('Error processing file:', error);
        setLoading(false);
        alert('Error processing file: ' + error.message);
      });
    }
  };

  const handleYoutubeSubmit = async (e) => {
    e.preventDefault();
    
    if (!youtubeUrl) {
      alert('Please enter a YouTube URL');
      return;
    }
    
    setLoading(true);
    setProcessingComplete(false);
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/process-youtube`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ 
          youtubeUrl,
          outputType,
          options: summaryOptions
        })
      });
      
      const data = await response.json();
      setLoading(false);
      
      if (data.success) {
        setProcessedSummary(data.summary.content);
        setProcessedPdfPath(data.summary.pdf_path);
        setProcessingComplete(true);
        
        // Save to localStorage for persistence
        localStorage.setItem('lastProcessedSummary', JSON.stringify({
          summary: data.summary.content,
          pdfPath: data.summary.pdf_path,
          title: data.summary.title || 'YouTube Summary',
          created_at: data.summary.created_at || new Date().toISOString()
        }));
        
        // Refresh summaries list
        fetchSummaries();
      } else {
        alert(data.error || 'Error processing YouTube video');
      }
    } catch (error) {
      console.error('Error:', error);
      setLoading(false);
      alert('Error processing YouTube video: ' + error.message);
    }
  };

  const handleOptionChange = (e) => {
    const { name, value } = e.target;
    setSummaryOptions(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleOutputTypeChange = (e) => {
    setOutputType(e.target.value);
  };

  const viewLatestSummary = () => {
    const savedSummary = localStorage.getItem('lastProcessedSummary');
    if (savedSummary) {
      try {
        const parsedData = JSON.parse(savedSummary);
        navigate('/summary-result', { 
          state: { 
            summary: parsedData.summary,
            pdfPath: parsedData.pdfPath,
            title: parsedData.title,
            created_at: parsedData.created_at
          }
        });
      } catch (error) {
        console.error('Error parsing saved summary:', error);
        alert('Error loading the latest summary');
      }
    } else {
      alert('No recent summary found');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="container mx-auto px-4 py-8">
        <h2 className="text-2xl font-bold mb-6 font-sans">לוח בקרה</h2>
        
        {/* Usage Status */}
        <UsageStatus />
        
        {/* Upload Card */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="space-y-6">
              <h3 className="text-lg font-medium font-sans">צור סיכום חדש</h3>
              
              <div className="flex flex-col md:flex-row gap-4 mb-4">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1 font-sans">סוג פלט</label>
                  <select
                    value={outputType}
                    onChange={handleOutputTypeChange}
                    className="w-full p-2 border border-gray-300 rounded-md font-sans"
                    dir="rtl"
                  >
                    <option value="summary">סיכום</option>
                    <option value="transcript">תמלול בלבד</option>
                  </select>
                </div>
                
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1 font-sans">סגנון</label>
                  <select
                    name="style"
                    value={summaryOptions.style}
                    onChange={handleOptionChange}
                    className="w-full p-2 border border-gray-300 rounded-md font-sans"
                    dir="rtl"
                  >
                    <option value="concise">תמציתי</option>
                    <option value="detailed">מפורט</option>
                    <option value="academic">אקדמי</option>
                  </select>
                </div>
                
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1 font-sans">פורמט</label>
                  <select
                    name="format"
                    value={summaryOptions.format}
                    onChange={handleOptionChange}
                    className="w-full p-2 border border-gray-300 rounded-md font-sans"
                    dir="rtl"
                  >
                    <option value="bullets">נקודות</option>
                    <option value="paragraphs">פסקאות</option>
                  </select>
                </div>
                
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1 font-sans">שפה</label>
                  <select
                    name="language"
                    value={summaryOptions.language}
                    onChange={handleOptionChange}
                    className="w-full p-2 border border-gray-300 rounded-md font-sans"
                    dir="rtl"
                  >
                    <option value="he">עברית</option>
                    <option value="en">אנגלית</option>
                  </select>
                </div>
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1 font-sans">קישור ליוטיוב</label>
                <form onSubmit={handleYoutubeSubmit} className="flex gap-2">
                  <input
                    type="text"
                    value={youtubeUrl}
                    onChange={(e) => setYoutubeUrl(e.target.value)}
                    placeholder="הכנס קישור ליוטיוב"
                    className="flex-1 p-2 border border-gray-300 rounded-md font-sans"
                    dir="rtl"
                  />
                  <button
                    type="submit"
                    disabled={loading || !youtubeUrl || isUsageLimitReached}
                    className={`px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors font-sans 
                      ${(loading || !youtubeUrl || isUsageLimitReached) ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    {loading ? 'מעבד...' : 'עבד'}
                  </button>
                </form>
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1 font-sans">העלה קובץ אודיו/וידאו</label>
                <div 
                  className={`border-2 border-dashed rounded-lg p-6 text-center ${dragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300'}`}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                >
                  <input
                    type="file"
                    id="file-upload"
                    className="hidden"
                    accept="audio/*,video/*"
                    onChange={handleFileChange}
                  />
                  <label 
                    htmlFor="file-upload" 
                    className="cursor-pointer flex flex-col items-center justify-center"
                  >
                    <svg className="w-12 h-12 text-gray-400 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path>
                    </svg>
                    <span className="text-gray-500 font-sans">גרור ושחרר קובץ כאן, או <span className="text-blue-500">לחץ לבחירת קובץ</span></span>
                    <span className="text-xs text-gray-400 mt-1 font-sans">MP3, MP4, WAV, M4A (עד 500MB)</span>
                  </label>
                </div>
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1 font-sans">מספר נקודות מקסימלי</label>
                <input
                  type="number"
                  name="maxPoints"
                  value={summaryOptions.maxPoints}
                  onChange={handleOptionChange}
                  min="1"
                  max="20"
                  className="w-full p-2 border border-gray-300 rounded-md font-sans"
                  dir="rtl"
                />
              </div>
              
              <form onSubmit={(e) => e.preventDefault()}>
                <button
                  type="submit"
                  disabled={loading || (!youtubeUrl && !file) || isUsageLimitReached}
                  className={`px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors w-full font-sans 
                    ${(loading || (!youtubeUrl && !file) || isUsageLimitReached) ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {loading ? 'מעבד...' : isUsageLimitReached ? 'שדרג לפרימיום' : 'עבד קובץ'}
                </button>
              </form>

              {loading && (
                <div className="text-blue-600">
                  מעבד את הסרטון, אנא המתן...
                </div>
              )}

              <div className="flex items-center justify-center space-x-4 space-x-reverse text-sm text-gray-500 font-sans">
                <div className="flex items-center space-x-1 space-x-reverse">
                  📄
                  <span>PDF</span>
                </div>
                <div className="flex items-center space-x-1 space-x-reverse">
                  🎥
                  <span>YouTube</span>
                </div>
              </div>

              {/* Add this after your form */}
              {processingComplete && (
                <div className="mt-4 text-center">
                  <div className="text-green-600 mb-2">הקובץ עובד בהצלחה!</div>
                  <a 
                    href="/summary-result" 
                    className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors inline-block w-full font-sans"
                    onClick={(e) => {
                      e.preventDefault();
                      // Store the data in sessionStorage for immediate access
                      sessionStorage.setItem('summaryData', JSON.stringify({
                        summary: processedSummary,
                        pdfPath: processedPdfPath
                      }));
                      window.location.href = '/summary-result';
                    }}
                  >
                    צפה בסיכום
                  </a>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Recent Files Section */}
        <div className="mt-8">
          <h3 className="text-lg font-medium mb-4 font-sans">קבצים אחרונים</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {summaries.map((summary) => (
              <Card 
                key={summary.id} 
                className="p-4 hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => {
                  console.log("Navigating to summary:", summary);
                  navigate('/summary-result', {
                    state: {
                      summary: summary.content || summary.summary,
                      pdfPath: summary.pdf_path,
                      title: summary.title || 'Untitled Summary',
                      created_at: summary.created_at
                    }
                  });
                }}
              >
                <div className="flex items-center space-x-3 space-x-reverse">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    📄
                  </div>
                  <div className="font-sans">
                    <h4 className="font-medium">{summary.title || 'סיכום סרטון'}</h4>
                    <p className="text-sm text-gray-500">
                      {new Date(summary.created_at).toLocaleDateString('he-IL')}
                    </p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>

        <button 
          onClick={viewLatestSummary}
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          View Latest Summary
        </button>
      </div>
    </div>
  );
};

export default StudentDashboard;