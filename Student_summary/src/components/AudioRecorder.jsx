import React, { useState, useRef } from 'react';
import axios from 'axios';

const AudioRecorder = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [audioURL, setAudioURL] = useState('');
  const [audioBlob, setAudioBlob] = useState(null);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [transcription, setTranscription] = useState('');
  const [summary, setSummary] = useState('');
  const [error, setError] = useState('');
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  const startRecording = async () => {
    try {
      // Reset states
      setTranscription('');
      setSummary('');
      setError('');
      
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
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
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
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
      
      // Create a FormData object to send the audio file
      const formData = new FormData();
      formData.append('audio', audioBlob, 'recording.wav');
      
      // Send the audio file to the server for transcription
      const response = await axios.post('/api/transcribe', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      if (response.data.success) {
        setTranscription(response.data.transcription);
        setSummary(response.data.summary);
      } else {
        setError(response.data.error || 'Failed to transcribe audio');
      }
    } catch (error) {
      console.error('Error transcribing audio:', error);
      setError('Error transcribing audio. Please try again later.');
    } finally {
      setIsTranscribing(false);
    }
  };

  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{ marginBottom: '20px' }}>
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
      
      {audioURL && (
        <div style={{ marginTop: '20px' }}>
          <p style={{ marginBottom: '10px', textAlign: 'right' }}>ההקלטה שלך:</p>
          <audio src={audioURL} controls style={{ width: '100%' }}></audio>
          
          <button 
            onClick={transcribeAudio}
            disabled={isTranscribing}
            style={{
              backgroundColor: '#3b82f6',
              color: 'white',
              padding: '10px 20px',
              borderRadius: '50px',
              border: 'none',
              fontSize: '16px',
              fontWeight: 'bold',
              cursor: isTranscribing ? 'not-allowed' : 'pointer',
              marginTop: '15px',
              opacity: isTranscribing ? 0.7 : 1
            }}
          >
            {isTranscribing ? 'מתמלל...' : 'תמלל והכן סיכום'}
          </button>
        </div>
      )}
      
      {error && (
        <div style={{ 
          marginTop: '20px', 
          padding: '10px', 
          backgroundColor: '#fee2e2', 
          color: '#b91c1c',
          borderRadius: '5px',
          textAlign: 'right'
        }}>
          <p>{error}</p>
        </div>
      )}
      
      {transcription && (
        <div style={{ marginTop: '20px', textAlign: 'right' }}>
          <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '10px' }}>תמלול:</h3>
          <div style={{ 
            backgroundColor: '#f3f4f6', 
            padding: '15px', 
            borderRadius: '5px',
            maxHeight: '200px',
            overflowY: 'auto'
          }}>
            <p style={{ whiteSpace: 'pre-wrap' }}>{transcription}</p>
          </div>
        </div>
      )}
      
      {summary && (
        <div style={{ marginTop: '20px', textAlign: 'right' }}>
          <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '10px' }}>סיכום:</h3>
          <div style={{ 
            backgroundColor: '#f0f9ff', 
            padding: '15px', 
            borderRadius: '5px',
            border: '1px solid #bfdbfe'
          }}>
            <p style={{ whiteSpace: 'pre-wrap' }}>{summary}</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default AudioRecorder;