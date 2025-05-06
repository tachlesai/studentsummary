import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

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
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const timerRef = useRef(null);
  const analyserRef = useRef(null);
  const dataArrayRef = useRef(null);
  const animationFrameRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    return () => {
      clearInterval(timerRef.current);
      cancelAnimationFrame(animationFrameRef.current);
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
        mediaRecorderRef.current.stop();
      }
    };
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
      console.log('Original audio size:', Math.round(audioBlob.size / 1024 / 1024), 'MB');
      
      // Process audio without size restrictions
      const reader = new FileReader();
      reader.readAsDataURL(audioBlob);
      
      reader.onloadend = async () => {
        try {
          setError('');
          // Get token if available
          const token = localStorage.getItem('token');

          // Show processing message for large files
          if (audioBlob.size > 1024 * 1024 * 10) { // If larger than 10MB
            setError('הקלטה גדולה, העיבוד עשוי להימשך זמן רב... אנא המתן');
          }
          
          // Use the direct endpoint with base64 data
          const response = await axios.post('/api/process-recording', 
            { audioData: reader.result },
            {
              headers: {
                'Content-Type': 'application/json',
                'Authorization': token ? `Bearer ${token}` : undefined
              },
              // Set a longer timeout for large files (5 minutes)
              timeout: 300000
            }
          );
          
          if (response.data.success) {
            setTranscription(response.data.transcription);
            setSummary(response.data.summary);
            setError(''); // Clear any processing messages
            
            // Format summary data to match file upload format
            const summaryData = {
              summary: typeof response.data.summary === 'object' 
                ? response.data.summary.content 
                : response.data.summary,
              pdfPath: response.data.summary.pdf_path,
              title: response.data.summary.title || 'Audio Recording',
              created_at: response.data.summary.created_at || new Date().toISOString(),
              file_name: response.data.summary.file_name || `recording_${Date.now()}.webm`
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

  return (
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
          
          <div className="mt-6 flex justify-center">
            <motion.button
              onClick={transcribeAudio}
              disabled={isTranscribing}
              className={`
                px-6 py-3 rounded-full font-bold text-white shadow-md
                flex items-center space-x-2 rtl:space-x-reverse
                ${isTranscribing ? 'bg-indigo-400' : 'bg-indigo-600 hover:bg-indigo-700'}
                transition-colors duration-300
              `}
              whileHover={!isTranscribing ? { scale: 1.03 } : {}}
              whileTap={!isTranscribing ? { scale: 0.97 } : {}}
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
                  <span>תמלל והכן סיכום</span>
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
    </div>
  );
};

export default AudioRecorder;