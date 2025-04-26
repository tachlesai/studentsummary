import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '../components/ui/card';
import { useNavigate } from 'react-router-dom';
import UsageStatus from '../components/UsageStatus';
import Navbar from '../components/Navbar';
import API_BASE_URL from '../config';

const StudentDashboard = () => {
  const navigate = useNavigate();
  const [dragActive, setDragActive] = useState(false);
  const [loading, setLoading] = useState(false);
  const [summaries, setSummaries] = useState([]);
  const [user, setUser] = useState(null);
  const [file, setFile] = useState(null);
  const [usageData, setUsageData] = useState(null);
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

    checkUsageLimit();
  }, [navigate]);

  const checkUsageLimit = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/usage-status`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data && data.usageData) {
        const { isLimitReached, currentMonthUsage, limit } = data.usageData;
        setIsUsageLimitReached(isLimitReached);
        
        // Update usage data for display
        setUsageData({
          current: currentMonthUsage,
          limit: limit,
          isLimitReached: isLimitReached
        });
      }
    } catch (error) {
      console.error('Error checking usage limit:', error);
    }
  };

  const fetchSummaries = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/summaries`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Check if data has the expected structure
      if (data && data.success && Array.isArray(data.summaries)) {
        setSummaries(data.summaries);
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
      
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data && data.usageData) {
        setUsageData(data.usageData);
      }
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
      processFile(droppedFile);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      processFile(selectedFile);
    }
  };

  // Centralized file processing function to reduce code duplication
  const processFile = (file) => {
    setFile(file);
    
    // Create form data with the file
    const formData = new FormData();
    formData.append('audioFile', file);
    
    // Add summary options to the form data
    formData.append('options', JSON.stringify(summaryOptions));
    formData.append('outputType', outputType);
    
    // Extract file name for display
    const fileName = file.name.replace(/\.[^/.]+$/, "") || 'Untitled Summary';
    console.log("Processing file with name:", fileName);
    
    setLoading(true);
    setProcessingComplete(false);
    
    const token = localStorage.getItem('token');
    console.log("Sending file to server with outputType:", outputType);
    
    // Process the file
    fetch(`${API_BASE_URL}/process-audio`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: formData
    })
    .then(response => {
      console.log("Received response status:", response.status);
      if (!response.ok) {
        throw new Error(`Server responded with status ${response.status}`);
      }
      return response.json();
    })
    .then(data => {
      console.log("Received response data:", data);
      setLoading(false);
      
      // Check if we have valid response data with title and content
      if (data && data.title !== undefined && (data.content !== undefined || data.transcription !== undefined)) {
        console.log("Success! Processing response data");
        
        // Create summary data from response based on outputType
        const summaryData = {
          summary: outputType === 'transcript' ? data.transcription : data.content,
          pdfPath: data.pdfPath || null,
          title: data.title,
          created_at: new Date().toISOString(),
          file_name: file.name
        };
        
        // Save to localStorage for persistence
        localStorage.setItem('lastProcessedSummary', JSON.stringify(summaryData));
        
        // Update usage count
        fetch(`${API_BASE_URL}/update-usage`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })
        .then(response => response.json())
        .then(usageData => {
          console.log("Usage updated:", usageData);
          // Refresh usage status
          fetchUsageStatus();
        })
        .catch(error => {
          console.error('Error updating usage:', error);
        });
        
        // Refresh summaries list to include the new summary
        fetchSummaries();
        
        // Set processing complete flag
        setProcessingComplete(true);
        
        // Navigate to summary result page
        console.log("Navigating to summary result with data:", summaryData);
        navigate('/summary-result', { 
          state: summaryData,
          replace: true // Use replace to prevent back navigation to processing state
        });
      } else if (data.error) {
        console.error("Server error:", data.error);
        setFile(null);
        alert('Server error: ' + data.error);
      } else {
        console.error("Invalid response format:", data);
        setFile(null);
        alert('Error: Server response missing required data');
      }
    })
    .catch(error => {
      console.error('Error processing file:', error);
      setLoading(false);
      setFile(null);
      alert('Error processing file: ' + error.message);
    });
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
        <h2 className="text-2xl font-bold mb-6 font-sans text-blue-700">לוח בקרה</h2>
        
        {/* Usage Status */}
        <UsageStatus />
        
        {/* Upload Card */}
        <Card className="mb-6 shadow-lg border border-gray-200">
          <CardContent className="p-8">
            <div className="space-y-6">
              <h3 className="text-xl font-bold font-sans text-gray-800 mb-4">צור סיכום חדש</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1 font-sans">סוג פלט</label>
                  <select
                    value={outputType}
                    onChange={handleOutputTypeChange}
                    className="w-full p-3 border border-gray-300 rounded-md font-sans shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    dir="rtl"
                  >
                    <option value="summary">סיכום</option>
                    <option value="transcript">תמלול בלבד</option>
                  </select>
                </div>
                
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1 font-sans">סגנון</label>
                  <select
                    name="style"
                    value={summaryOptions.style}
                    onChange={handleOptionChange}
                    className="w-full p-3 border border-gray-300 rounded-md font-sans shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    dir="rtl"
                  >
                    <option value="concise">תמציתי</option>
                    <option value="detailed">מפורט</option>
                    <option value="academic">אקדמי</option>
                  </select>
                </div>
                
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1 font-sans">פורמט</label>
                  <select
                    name="format"
                    value={summaryOptions.format}
                    onChange={handleOptionChange}
                    className="w-full p-3 border border-gray-300 rounded-md font-sans shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    dir="rtl"
                  >
                    <option value="bullets">נקודות</option>
                    <option value="paragraphs">פסקאות</option>
                  </select>
                </div>
                
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1 font-sans">שפה</label>
                  <select
                    name="language"
                    value={summaryOptions.language}
                    onChange={handleOptionChange}
                    className="w-full p-3 border border-gray-300 rounded-md font-sans shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    dir="rtl"
                  >
                    <option value="he">עברית</option>
                    <option value="en">אנגלית</option>
                  </select>
                </div>
              </div>
              
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-1 font-sans">העלה קובץ אודיו/וידאו</label>
                <div 
                  className={`border-2 border-dashed rounded-lg p-8 text-center transition-all duration-300 ${dragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-blue-400 hover:bg-gray-50'}`}
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
                    <svg className="w-16 h-16 text-blue-500 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path>
                    </svg>
                    <span className="text-gray-700 font-medium font-sans text-lg">גרור ושחרר קובץ כאן, או <span className="text-blue-600 underline">לחץ לבחירת קובץ</span></span>
                    <span className="text-sm text-gray-500 mt-2 font-sans">MP3, MP4, WAV, M4A (עד 500MB)</span>
                  </label>
                </div>
              </div>
              
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-1 font-sans">מספר נקודות מקסימלי</label>
                <input
                  type="number"
                  name="maxPoints"
                  value={summaryOptions.maxPoints}
                  onChange={handleOptionChange}
                  min="1"
                  max="20"
                  className="w-full p-3 border border-gray-300 rounded-md font-sans shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  dir="rtl"
                />
              </div>
              
              {loading ? (
                <div className="text-center p-4">
                  <div className="animate-spin inline-block w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mb-3"></div>
                  <p className="text-blue-600 font-medium">מעבד את הקובץ, אנא המתן...</p>
                </div>
              ) : (
                <div className="text-center">
                  <input
                    type="file"
                    id="file-upload"
                    className="hidden"
                    accept="audio/*,video/*"
                    onChange={handleFileChange}
                  />
                  <label 
                    htmlFor="file-upload"
                    className="inline-block px-6 py-4 bg-blue-100 text-blue-700 rounded-lg cursor-pointer font-medium hover:bg-blue-200 transition-colors"
                  >
                    בחר קובץ להעלאה
                  </label>
                </div>
              )}

              <div className="flex items-center justify-center space-x-4 space-x-reverse text-sm text-gray-500 font-sans">
                <div className="flex items-center space-x-1 space-x-reverse">
                  <span className="text-lg">📄</span>
                  <span>תוצאות ב-PDF</span>
                </div>
                <div className="flex items-center space-x-1 space-x-reverse">
                  <span className="text-lg">🔒</span>
                  <span>פרטיות מלאה</span>
                </div>
                <div className="flex items-center space-x-1 space-x-reverse">
                  <span className="text-lg">⚡</span>
                  <span>מהיר ומדויק</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Recent Files Section */}
        <div className="mt-10">
          <h3 className="text-xl font-bold mb-6 font-sans text-gray-800">הסיכומים האחרונים שלך</h3>
          {summaries.length === 0 ? (
            <Card className="p-8 text-center text-gray-500">
              <p>אין סיכומים אחרונים להצגה. העלה קובץ חדש כדי להתחיל.</p>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {summaries.map((summary) => (
                <Card 
                  key={summary.id || Date.now()}
                  className="overflow-hidden hover:shadow-xl transition-shadow border border-gray-200"
                >
                  <div className="bg-blue-50 p-4 border-b border-gray-200">
                    <div className="flex items-start space-x-2 space-x-reverse">
                      <div className="text-2xl mr-2">📄</div>
                      <div className="flex-1">
                        <h4 className="font-bold text-lg text-gray-800 truncate">
                          {summary.file_name || summary.title || 'ללא כותרת'}
                        </h4>
                        <p className="text-gray-500 text-sm mb-1">
                          {new Date(summary.created_at).toLocaleDateString('he-IL')}
                        </p>
                        {summary.file_name && summary.title && summary.file_name !== summary.title && (
                          <p className="text-xs text-gray-500 italic truncate">
                            <span className="font-medium">כותרת:</span> {summary.title}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                  <CardContent className="p-4">
                    <p className="text-gray-600 mb-4 line-clamp-3 h-18 overflow-hidden">
                      {summary.content || summary.summary || 'אין תוכן זמין'}
                    </p>
                    <button
                      onClick={() => {
                        console.log("Navigating to summary:", summary);
                        navigate('/summary-result', {
                          state: {
                            summary: summary.content || summary.summary,
                            pdfPath: summary.pdf_path,
                            title: summary.title || 'ללא כותרת',
                            created_at: summary.created_at,
                            file_name: summary.file_name
                          }
                        });
                      }}
                      className="w-full py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors text-center"
                    >
                      צפה בסיכום
                    </button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;