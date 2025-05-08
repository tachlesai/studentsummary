import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import API_BASE_URL from '../config';

const AudioRecorder = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [audioURL, setAudioURL] = useState('');
  const [audioBlob, setAudioBlob] = useState(null);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [transcription, setTranscription] = useState('');
  const [summary, setSummary] = useState('');
  const [error, setError] = useState('');
  const [recordingTime, setRecordingTime] = useState(0);
  const [recordingLevel, setRecordingLevel] = useState(0);
  const [summaryOptions, setSummaryOptions] = useState({
    style: 'detailed',
    language: 'he',
    outputType: 'summary'
  });
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const timerRef = useRef(null);
  const analyserRef = useRef(null);
  const dataArrayRef = useRef(null);
  const animationFrameRef = useRef(null);
  const navigate = useNavigate();
  const [usageData, setUsageData] = useState(null);
  const [isUsageLimitReached, setIsUsageLimitReached] = useState(false);

  const styleTooltips = {
    concise: {
      title: 'סיכום תמציתי (נקודות)',
      description: 'רשימת נקודות קצרות שמרכזת את הרעיונות המרכזיים בהרצאה. מתאים מאוד לחזרה מהירה.',
      example: '• לתכנן את השבוע מראש עוזר להתארגן.\n• לחלק משימות גדולות לחלקים קטנים.\n• הפסקות קצרות משפרות ריכוז.'
    },
    detailed: {
      title: 'סיכום מפורט מאוד',
      description: 'סיכום מקיף שמכיל את כל ההסברים, ההגדרות והדוגמאות המרכזיות בהרצאה. מצוין למי שלא היה בהרצאה או שרוצה ללמוד מהסיכום בלבד.',
      example: 'ההרצאה עסקה בטכניקות לניהול זמן לסטודנטים. המרצה הדגיש את החשיבות של תכנון שבועי מראש כדי להפחית לחץ ולשפר פרודוקטיביות. בנוסף הוסבר שכדאי לחלק משימות גדולות לחלקים קטנים וליישם שיטת פומודורו – 25 דקות ריכוז ו־5 דקות הפסקה. המרצה גם המליץ על שימוש באפליקציות כמו Google Calendar.'
    },
    narrative: {
      title: 'סיכום נרטיבי קצר',
      description: 'סיכום רציף בפסקה אחת או שתיים – מעביר את רוח ההרצאה בצורה קריאה וזורמת, בלי ירידה לפרטים קטנים.',
      example: 'בהרצאה הוצגו שיטות שונות לניהול זמן אפקטיבי בלימודים. דובר על חשיבות תכנון שבועי, פירוק משימות גדולות, ושילוב של הפסקות לשיפור הריכוז והיעילות.'
    },
    thematic: {
      title: 'סיכום לפי נושאים / כותרות',
      description: 'הסיכום מחולק לפי נושאים מרכזיים בהרצאה, עם כותרת לכל חלק. מתאים ללמידה ממוקדת לפי תחומים.',
      example: '1. תכנון שבועי\nתכנון מראש עוזר לנהל את הזמן ולהפחית לחץ.\n2. חלוקת משימות\nמשימות קטנות מקלות על התקדמות ומונעות דחיינות.\n3. כלים דיגיטליים\nהמרצה הציע להשתמש בכלים כמו Google Calendar כדי לייעל את העבודה.'
    },
    qa: {
      title: 'סיכום שאלות ותשובות (Q&A)',
      description: 'המרת תוכן ההרצאה לרשימת שאלות ותשובות. מצוין לתרגול עצמי ולשינון.',
      example: 'שאלה: למה חשוב לתכנן את השבוע מראש?\nתשובה: כדי לשפר סדר ויעילות ולמנוע לחץ לקראת סוף השבוע.\n\nשאלה: מהי שיטת פומודורו?\nתשובה: שיטת ניהול זמן של 25 דקות עבודה ו־5 דקות הפסקה.'
    },
    glossary: {
      title: 'סיכום מושגים והגדרות (Glossary)',
      description: 'רשימה של מונחים חשובים מתוך ההרצאה, עם הסבר קצר לכל מונח. מתאים מאוד למקצועות עיוניים.',
      example: 'פומודורו – טכניקה ללמידה ממוקדת שמחלקת את הזמן לבלוקים של 25 דקות עבודה ו־5 דקות מנוחה.\nחלוקת משימות – תהליך של פירוק מטלה גדולה לחלקים קטנים כדי להקל על הביצוע.'
    },
    steps: {
      title: 'סיכום לפי שלבים / תהליך',
      description: 'מציג תהליך שהוסבר בהרצאה בצורה של שלבים מסודרים. מתאים למבנה של "איך עושים משהו".',
      example: '• כתיבת רשימת משימות לכל השבוע.\n• חלוקת כל משימה לחלקים קטנים.\n• קביעת זמנים ביומן.\n• שימוש בהפסקות קבועות לשמירה על ריכוז.\n• בדיקה עצמית בסוף השבוע.'
    },
    tldr: {
      title: 'סיכום TL;DR (בקצרה מאוד)',
      description: 'משפט אחד קצר שמסכם את כל ההרצאה בתמצית. מעולה לרפרוף או לזיכרון מהיר.',
      example: 'ניהול זמן יעיל כולל תכנון שבועי, חלוקת משימות, והפסקות לשיפור ריכוז.'
    }
  };

  const handleOptionChange = (e) => {
    const { name, value } = e.target;
    setSummaryOptions(prev => ({ ...prev, [name]: value }));
  };

  useEffect(() => {
    return () => {
      clearInterval(timerRef.current);
      cancelAnimationFrame(animationFrameRef.current);
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
        mediaRecorderRef.current.stop();
      }
    };
  }, []);

  useEffect(() => {
    // Fetch usage status on mount
    const fetchUsageStatus = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_BASE_URL}/usage-status`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        if (!response.ok) throw new Error('Failed to fetch usage status');
        const data = await response.json();
        if (data && data.usageData) {
          setUsageData(data.usageData);
          setIsUsageLimitReached(data.usageData.isLimitReached);
        }
      } catch (err) {
        console.error('Error fetching usage status:', err);
      }
    };
    fetchUsageStatus();
  }, []);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60).toString().padStart(2, '0');
    const secs = (seconds % 60).toString().padStart(2, '0');
    return `${mins}:${secs}`;
  };

  const updateAudioLevel = () => {
    if (!analyserRef.current) return;
    
    analyserRef.current.getByteFrequencyData(dataArrayRef.current);
    const average = dataArrayRef.current.reduce((a, b) => a + b, 0) / dataArrayRef.current.length;
    setRecordingLevel(average / 255); // Normalize to 0-1
    
    animationFrameRef.current = requestAnimationFrame(updateAudioLevel);
  };

  const startRecording = async () => {
    try {
      // Reset states
      setTranscription('');
      setSummary('');
      setError('');
      setRecordingTime(0);
      
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // Set up audio analyzer for visualizing audio levels
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const analyser = audioContext.createAnalyser();
      const source = audioContext.createMediaStreamSource(stream);
      analyser.fftSize = 256;
      source.connect(analyser);
      
      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);
      
      analyserRef.current = analyser;
      dataArrayRef.current = dataArray;
      
      // Start audio level visualization
      updateAudioLevel();
      
      // Set up media recorder
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorderRef.current.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        const url = URL.createObjectURL(audioBlob);
        setAudioURL(url);
        setAudioBlob(audioBlob);
        
        // Clean up
        clearInterval(timerRef.current);
        cancelAnimationFrame(animationFrameRef.current);
      };

      // Start recording
      mediaRecorderRef.current.start();
      setIsRecording(true);
      
      // Start timer
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
      
    } catch (error) {
      console.error('Error accessing microphone:', error);
      setError('Error accessing microphone. Please make sure you have granted permission.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      
      // Stop all audio tracks
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
    }
  };

  const transcribeAudio = async () => {
    if (!audioBlob) {
      setError('No audio recording found. Please record audio first.');
      return;
    }

    try {
      setIsTranscribing(true);
      
      // Log file size for debugging
      console.log(`File size: ${audioBlob.size / 1024 / 1024} MB`);
      
      // Check file size
      if (audioBlob.size > 200 * 1024 * 1024) { // 200MB
        setIsTranscribing(false);
        setError('File size is too large. Please record a shorter audio.');
        return;
      }
      
      // Convert blob to base64
      const reader = new FileReader();
      reader.readAsDataURL(audioBlob);
      
      reader.onload = async () => {
        const base64Audio = reader.result;
        
        try {
          // Send to server for processing
          const token = localStorage.getItem('token');
          const response = await axios.post(`${API_BASE_URL}/api/process-recording`, {
            audioData: base64Audio,
            options: {
              style: summaryOptions.style,
              language: summaryOptions.language,
              outputType: summaryOptions.outputType
            }
          }, {
            headers: {
              'Content-Type': 'application/json',
              'Authorization': token ? `Bearer ${token}` : undefined
            },
            timeout: 300000 // 5-minute timeout
          });
          
          if (response.data && response.data.content) {
            // Handle successful response
            if (summaryOptions.outputType === 'transcript') {
              setTranscription(response.data.content);
              setSummary(''); // Clear summary if transcript was requested
            } else {
              setSummary(response.data.content);
              setTranscription(response.data.transcription || ''); // Set transcription if available
            }
            
            // Create a structure similar to the file upload response
            const summaryData = {
              summary: response.data.content,
              pdfPath: response.data.pdf_path,
              title: response.data.title || 'Audio Recording',
              created_at: response.data.created_at || new Date().toISOString(),
              file_name: response.data.file_name || `recording_${Date.now()}.webm`
            };
            
            // Save to localStorage for persistence, exactly like file upload
            localStorage.setItem('lastProcessedSummary', JSON.stringify(summaryData));
            
            // Navigate to summary result page with same state structure as file upload
            navigate('/summary-result', { state: summaryData });
          } else {
            setError(response.data.error || 'Failed to process audio');
          }
        } catch (error) {
          console.error('Error processing audio:', error);
          if (error.code === 'ECONNABORTED') {
            setError('Request timed out. The recording might be too long. Try a shorter section.');
          } else if (error.response && error.response.status === 413) {
            setError('The recording is too large. Please try a shorter recording.');
          } else {
            setError('Error processing audio. Please try again later.');
          }
        } finally {
          setIsTranscribing(false);
        }
      };
      
      reader.onerror = () => {
        console.error('Error reading audio file');
        setError('Error preparing audio for upload');
        setIsTranscribing(false);
      };
    } catch (error) {
      console.error('Error in transcription process:', error);
      setError('Error processing recording');
      setIsTranscribing(false);
    }
  };

  const handleProcessClick = () => {
    if (isUsageLimitReached) {
      navigate('/membership-payment');
      return;
    }
    transcribeAudio();
  };

  return (
    <div className="min-h-screen bg-blue-50 py-8">
      {/* Usage bar at the very top of the page */}
      <div className="flex justify-center w-full mb-8">
        {usageData && (
          <div className="w-full max-w-2xl">
            <div className="bg-white rounded-lg shadow-md border border-gray-100 p-5">
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-3">
                <div className="flex items-center mb-2 md:mb-0">
                  <span className={`inline-block w-3 h-3 rounded-full mr-2 ${usageData.limit ? (usageData.currentMonthUsage / usageData.limit > 0.9 ? 'bg-red-500' : usageData.currentMonthUsage / usageData.limit > 0.7 ? 'bg-yellow-500' : 'bg-green-500') : 'bg-green-500'}`}></span>
                  <span className="text-lg font-bold text-gray-800">
                    {usageData.subscriptionStatus === 'premium' || usageData.subscriptionStatus === 'pro' ? '🌟 חשבון פרימיום' : '⭐ חשבון רגיל'}
                  </span>
                </div>
                {!(usageData.subscriptionStatus === 'premium' || usageData.subscriptionStatus === 'pro') && (
                  <a
                    href="/membership-payment"
                    className="text-sm bg-blue-600 hover:bg-blue-700 text-white px-4 py-1.5 rounded-md transition-colors w-auto min-w-[120px] inline-block"
                    style={{ display: 'inline-block' }}
                  >
                    שדרג עכשיו
                  </a>
                )}
              </div>
              <div className="mb-2">
                <div className="flex justify-between text-sm mb-1">
                  <span className="font-medium text-gray-700">שימוש חודשי</span>
                  <span className="text-gray-600">{usageData.currentMonthUsage} / {usageData.limit || 'ללא הגבלה'}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
                  <div
                    className={`h-2.5 rounded-full ${usageData.limit ? (usageData.currentMonthUsage / usageData.limit > 0.9 ? 'bg-red-500' : usageData.currentMonthUsage / usageData.limit > 0.7 ? 'bg-yellow-500' : 'bg-green-500') : 'bg-green-500'}`}
                    style={{ width: usageData.limit ? `${Math.min(100, Math.round((usageData.currentMonthUsage / usageData.limit) * 100))}%` : '100%' }}
                  ></div>
                </div>
              </div>
              {usageData.nextResetDate && (
                <div className="text-xs text-gray-500 mt-2">
                  איפוס שימוש הבא: {new Date(usageData.nextResetDate).toLocaleDateString('he-IL')}
                </div>
              )}
              {usageData.isLimitReached && !(usageData.subscriptionStatus === 'premium' || usageData.subscriptionStatus === 'pro') && (
                <div className="mt-3 p-2 bg-red-50 border border-red-100 rounded text-sm text-red-700">
                  הגעת למגבלת השימוש החודשית. שדרג לפרימיום להסרת ההגבלה.
                </div>
              )}
            </div>
          </div>
        )}
      </div>
      {/* Main card below usage bar */}
      <div className="max-w-4xl mx-auto p-6 bg-white rounded-xl shadow-lg">
        <h2 className="text-2xl font-bold text-right mb-6 text-gray-800">הקלט את ההרצאה</h2>
        
        <div className="mb-8 bg-gray-50 p-6 rounded-lg">
          <div className="flex flex-col items-center">
            {/* Recording visualization */}
            <div className="w-full h-24 mb-6 bg-gray-100 rounded-lg overflow-hidden relative">
              {isRecording ? (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="flex space-x-1">
                    {[...Array(20)].map((_, i) => (
                      <motion.div
                        key={i}
                        className="w-1 bg-indigo-500"
                        animate={{
                          height: [
                            Math.random() * 20 + 5,
                            Math.random() * 40 + 20,
                            Math.random() * 20 + 5
                          ]
                        }}
                        transition={{
                          duration: 0.5,
                          repeat: Infinity,
                          repeatType: "reverse",
                          delay: i * 0.05
                        }}
                      />
                    ))}
                  </div>
                </div>
              ) : (
                <div className="absolute inset-0 flex items-center justify-center text-gray-400">
                  {audioURL ? "הקלטה הושלמה" : "לחץ על כפתור ההקלטה להתחלה"}
                </div>
              )}
            </div>
            
            {/* Timer */}
            {isRecording && (
              <div className="mb-4 text-xl font-mono">
                <span className="text-red-600">{formatTime(recordingTime)}</span>
              </div>
            )}
            
            {/* Record button */}
            <motion.button
              onClick={isRecording ? stopRecording : startRecording}
              className={`relative w-16 h-16 rounded-full flex items-center justify-center shadow-lg ${
                isRecording ? 'bg-gray-700' : 'bg-red-600 hover:bg-red-700'
              } transition-colors duration-300`}
              whileTap={{ scale: 0.95 }}
            >
              <motion.div
                className={`absolute inset-0 rounded-full ${isRecording ? 'bg-red-600' : 'bg-transparent'}`}
                animate={isRecording ? {
                  scale: [1, 1.2, 1],
                  opacity: [1, 0.7, 1]
                } : {}}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              />
              <div className={`${isRecording ? 'w-4 h-4 bg-white rounded-sm' : 'w-6 h-6 bg-white rounded-full'}`}></div>
            </motion.button>
            
            <p className="mt-3 text-gray-600 font-medium">
              {isRecording ? 'לחץ להפסקת ההקלטה' : 'לחץ להתחלת הקלטה'}
            </p>
          </div>
        </div>
        
        {/* Audio playback */}
        {audioURL && (
          <motion.div 
            className="mb-8 bg-gray-50 p-6 rounded-lg"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h3 className="text-xl font-semibold text-right mb-4 text-gray-700">ההקלטה שלך</h3>
            <audio 
              src={audioURL} 
              controls 
              className="w-full h-12 rounded-md"
            ></audio>
            
            <div className="mt-6 flex flex-col items-center">
              {isUsageLimitReached && (
                <div className="mb-4 text-red-600 font-bold text-center">
                  הגעת למכסת השימוש החודשית שלך.<br />
                  <button
                    onClick={() => navigate('/membership-payment')}
                    className="mt-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                  >
                    מעבר לעמוד תמחור
                  </button>
                </div>
              )}
              <motion.button
                onClick={handleProcessClick}
                disabled={isTranscribing || isUsageLimitReached}
                className={`
                  px-6 py-3 rounded-full font-bold text-white shadow-md
                  flex items-center space-x-2 rtl:space-x-reverse
                  ${isTranscribing || isUsageLimitReached ? 'bg-indigo-400' : 'bg-indigo-600 hover:bg-indigo-700'}
                  transition-colors duration-300
                `}
                whileHover={!isTranscribing && !isUsageLimitReached ? { scale: 1.03 } : {}}
                whileTap={!isTranscribing && !isUsageLimitReached ? { scale: 0.97 } : {}}
              >
                {isTranscribing ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>מתמלל...</span>
                  </>
                ) : (
                  <>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                    </svg>
                    <span>{summaryOptions.outputType === 'transcript' ? 'תמלל הקלטה' : 'תמלל והכן סיכום'}</span>
                  </>
                )}
              </motion.button>
            </div>
          </motion.div>
        )}
        
        {/* Error message */}
        {error && (
          <motion.div 
            className="mb-8 bg-red-50 p-4 rounded-lg border border-red-200"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="mr-3 text-right">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          </motion.div>
        )}
        
        {/* Transcription result */}
        {transcription && (
          <motion.div 
            className="mb-8 bg-gray-50 p-6 rounded-lg"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <h3 className="text-xl font-semibold text-right mb-4 text-gray-700">תמלול</h3>
            <div className="bg-white p-4 rounded-md shadow-sm border border-gray-200 max-h-60 overflow-y-auto">
              <p className="text-gray-700 text-right whitespace-pre-wrap">{transcription}</p>
            </div>
          </motion.div>
        )}
        
        {/* Summary result */}
        {summary && (
          <motion.div 
            className="mb-8 bg-blue-50 p-6 rounded-lg"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <h3 className="text-xl font-semibold text-right mb-4 text-blue-800">סיכום</h3>
            <div className="bg-white p-4 rounded-md shadow-sm border border-blue-200">
              <p className="text-gray-700 text-right whitespace-pre-wrap">{summary}</p>
            </div>
          </motion.div>
        )}
        
        {/* Summary options */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <label className="block text-sm font-medium text-gray-700 mb-1 font-sans">סוג פלט</label>
              <div className="group relative">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400 cursor-help" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-64 bg-white p-3 rounded-lg shadow-lg border border-gray-200 hidden group-hover:block z-50">
                  <p className="text-sm text-gray-600">בחר האם ברצונך לקבל סיכום מלא או רק תמלול של הקובץ ללא סיכום.</p>
                </div>
              </div>
            </div>
            <select
              name="outputType"
              value={summaryOptions.outputType}
              onChange={handleOptionChange}
              className="w-full p-3 border border-gray-300 rounded-md font-sans shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              dir="rtl"
            >
              <option value="summary">סיכום</option>
              <option value="transcript">תמלול בלבד</option>
            </select>
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <label className="block text-sm font-medium text-gray-700 mb-1 font-sans">סגנון</label>
              <div className="group relative">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400 cursor-help" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-96 bg-white p-4 rounded-lg shadow-lg border border-gray-200 hidden group-hover:block z-50">
                  <h3 className="font-bold mb-2">{styleTooltips[summaryOptions.style].title}</h3>
                  <p className="text-sm text-gray-600 mb-2">{styleTooltips[summaryOptions.style].description}</p>
                  <div className="bg-gray-50 p-2 rounded">
                    <p className="text-sm font-mono whitespace-pre-wrap">{styleTooltips[summaryOptions.style].example}</p>
                  </div>
                </div>
              </div>
            </div>
            <select
              name="style"
              value={summaryOptions.style}
              onChange={handleOptionChange}
              className="w-full p-3 border border-gray-300 rounded-md font-sans shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              dir="rtl"
              disabled={summaryOptions.outputType === 'transcript'}
            >
              <option value="concise">תמציתי (נקודות)</option>
              <option value="detailed">מפורט מאוד</option>
              <option value="narrative">נרטיבי קצר</option>
              <option value="thematic">לפי נושאים / כותרות</option>
              <option value="qa">שאלות ותשובות</option>
              <option value="glossary">מושגים והגדרות</option>
              <option value="steps">לפי שלבים / תהליך</option>
              <option value="tldr">TL;DR (בקצרה מאוד)</option>
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
              <option value="ar">ערבית</option>
              <option value="fr">צרפתית</option>
              <option value="ru">רוסית</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AudioRecorder;