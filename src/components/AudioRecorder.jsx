import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import API_BASE_URL from '../config';

const AudioRecorder = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [audioURL, setAudioURL] = useState('');
  const [audioBlob, setAudioBlob] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');
  const [recordingMode, setRecordingMode] = useState('mic'); // 'mic' or 'system'
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const audioContextRef = useRef(null);
  const audioDestinationRef = useRef(null);
  const audioSourceRef = useRef(null);
  const navigate = useNavigate();

  // Clean up audio context on unmount
  useEffect(() => {
    return () => {
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  const startRecording = async () => {
    try {
      setIsRecording(true);
      setError(null);
      
      // Create audio context
      audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
      audioDestinationRef.current = audioContextRef.current.createMediaStreamDestination();
      
      if (recordingMode === 'mic') {
        // Get microphone stream
        const micStream = await navigator.mediaDevices.getUserMedia({ 
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            sampleRate: 44100
          }
        });
        
        // Connect microphone to destination
        audioSourceRef.current = audioContextRef.current.createMediaStreamSource(micStream);
        audioSourceRef.current.connect(audioDestinationRef.current);
        
        // Create MediaRecorder with the destination stream
        const mediaRecorder = new MediaRecorder(audioDestinationRef.current.stream, {
          mimeType: 'audio/webm;codecs=opus'
        });
        
        // Store the mediaRecorder in the ref
        mediaRecorderRef.current = mediaRecorder;
        audioChunksRef.current = [];
        
        mediaRecorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            audioChunksRef.current.push(event.data);
          }
        };
        
        mediaRecorder.onstop = () => {
          const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
          setAudioBlob(audioBlob);
          const url = URL.createObjectURL(audioBlob);
          setAudioURL(url);
          
          // Stop all tracks in the stream
          micStream.getTracks().forEach(track => track.stop());
        };
        
        // Start recording with 1-second intervals
        mediaRecorder.start(1000);
        
      } else {
        // For system audio, we'll use a different approach
        // This is a placeholder - in a real implementation, you would need to use
        // a browser extension or a different approach to capture system audio
        setError('System audio capture is not supported in this browser. Please use the microphone mode.');
        setIsRecording(false);
      }
      
    } catch (err) {
      console.error('Error starting recording:', err);
      setError('Failed to start recording. Please make sure to allow audio capture when prompted.');
      setIsRecording(false);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const processRecording = async () => {
    if (!audioBlob) {
      setError('No recording available. Please record audio first.');
      return;
    }

    setIsProcessing(true);
    setError('');

    // Simple approach to convert blob to base64
    const reader = new FileReader();
    reader.readAsDataURL(audioBlob);
    
    reader.onload = async () => {
      try {
        // Get token
        const token = localStorage.getItem('token');
        
        // Default style for summary
        const style = 'detailed';
        
        // Make a simple POST request with the audio data
        const response = await axios.post(
          `${API_BASE_URL}/api/process-recording`, 
          { 
            audioData: reader.result,
            options: JSON.stringify({
              style: style,
              language: 'he',
              outputType: 'summary'
            })
          },
          { 
            headers: { 
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            } 
          }
        );
        
        console.log('Server response:', response.data);
        console.log(`Summary style used: ${style}`);
        
        if (response.data.success) {
          // Save to localStorage for backup
          localStorage.setItem(
            'lastProcessedSummary', 
            JSON.stringify({
              summary: response.data.summary.content,
              title: response.data.summary.title || 'Audio Summary',
              created_at: response.data.summary.created_at,
              pdfPath: response.data.summary.pdf_path,
              style: style
            })
          );
          
          // Navigate to results page
          navigate('/summary-result', {
            state: {
              summary: response.data.summary.content,
              title: response.data.summary.title || 'Audio Summary',
              created_at: response.data.summary.created_at,
              pdfPath: response.data.summary.pdf_path,
              style: style
            }
          });
        } else {
          setError(response.data.error || 'Error processing audio');
        }
      } catch (error) {
        console.error('Error sending recording to server:', error);
        setError('שגיאה בשליחת ההקלטה. נסה שוב מאוחר יותר.');
      } finally {
        setIsProcessing(false);
      }
    };
    
    reader.onerror = () => {
      console.error('Error reading audio file');
      setError('שגיאה בהכנת ההקלטה');
      setIsProcessing(false);
    };
  };

  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{ marginBottom: '20px' }}>
        <div style={{ marginBottom: '15px' }}>
          <label style={{ marginRight: '10px' }}>
            <input 
              type="radio" 
              name="recordingMode" 
              value="mic" 
              checked={recordingMode === 'mic'} 
              onChange={() => setRecordingMode('mic')}
              style={{ marginLeft: '5px' }}
            />
            הקלטה מהמיקרופון
          </label>
          <label>
            <input 
              type="radio" 
              name="recordingMode" 
              value="system" 
              checked={recordingMode === 'system'} 
              onChange={() => setRecordingMode('system')}
              style={{ marginLeft: '5px' }}
            />
            הקלטה מהמערכת (לא נתמך בדפדפן זה)
          </label>
        </div>
        
        {!isRecording ? (
          <button 
            onClick={startRecording}
            style={{
              backgroundColor: '#dc2626',
              color: 'white',
              padding: '12px 24px',
              borderRadius: '50px',
              border: 'none',
              fontSize: '16px',
              fontWeight: 'bold',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <span style={{ 
              display: 'inline-block', 
              width: '12px', 
              height: '12px', 
              backgroundColor: 'white', 
              borderRadius: '50%' 
            }}></span>
            התחל הקלטה
          </button>
        ) : (
          <button 
            onClick={stopRecording}
            style={{
              backgroundColor: '#4b5563',
              color: 'white',
              padding: '12px 24px',
              borderRadius: '50px',
              border: 'none',
              fontSize: '16px',
              fontWeight: 'bold',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <span style={{ 
              display: 'inline-block', 
              width: '12px', 
              height: '12px', 
              backgroundColor: 'white',
              borderRadius: '0'
            }}></span>
            הפסק הקלטה
          </button>
        )}
      </div>
      
      {error && (
        <p style={{ color: 'red', marginTop: '10px', textAlign: 'right' }}>
          {error}
        </p>
      )}
      
      {audioURL && (
        <div style={{ marginTop: '20px' }}>
          <p style={{ marginBottom: '10px', textAlign: 'right' }}>ההקלטה שלך:</p>
          <audio src={audioURL} controls style={{ width: '100%' }}></audio>
          
          <button
            onClick={processRecording}
            disabled={isProcessing}
            style={{
              backgroundColor: '#2563eb',
              color: 'white',
              padding: '12px 24px',
              borderRadius: '50px',
              border: 'none',
              fontSize: '16px',
              fontWeight: 'bold',
              cursor: isProcessing ? 'not-allowed' : 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              marginTop: '20px',
              opacity: isProcessing ? 0.7 : 1
            }}
          >
            {isProcessing ? 'מעבד...' : 'תמלל והכן סיכום'}
          </button>
        </div>
      )}
    </div>
  );
};

export default AudioRecorder;