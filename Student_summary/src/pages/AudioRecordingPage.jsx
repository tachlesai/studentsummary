import React from 'react';
import AudioRecorder from '../components/AudioRecorder';
import { Link } from 'react-router-dom';

const AudioRecordingPage = () => {
  return (
    <div style={{
      minHeight: '100vh',
      width: '100vw',
      background: '#f3f6fa',
      margin: 0,
      padding: 0,
      boxSizing: 'border-box',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'flex-start',
      paddingTop: '48px'
    }}>
      <div style={{
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'flex-start',
        padding: 0,
        margin: 0
      }}>
        <div style={{
          background: '#e0e7ff',
          borderRadius: '50%',
          width: '48px',
          height: '48px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '12px',
        }}>
          <svg width="28" height="28" fill="none" viewBox="0 0 24 24" stroke="#6366f1"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 18v3m0 0h3m-3 0H9m6-3a6 6 0 10-12 0 6 6 0 0012 0zm-6-6v6m0 0a3 3 0 006 0V9a3 3 0 00-6 0z"/></svg>
        </div>
        <h1 style={{
          fontSize: '2.2rem',
          fontWeight: 700,
          textAlign: 'center',
          marginBottom: '12px',
          color: '#1e293b',
          letterSpacing: '-0.5px',
          width: '100%'
        }}>הקלטת קול</h1>
        <p style={{
          textAlign: 'center',
          marginBottom: '22px',
          color: '#374151',
          fontSize: '1.15rem',
          fontWeight: 400,
          width: '100%'
        }}>
          הקלט, תמלל וסכם הרצאות או שיחות בקלות ובמהירות.
        </p>
        <div style={{ marginBottom: '28px', width: '100%', display: 'flex', justifyContent: 'center' }}>
          <AudioRecorder />
        </div>
        <div style={{ textAlign: 'center', width: '100%' }}>
          <p style={{ fontSize: '0.92rem', color: '#6b7280', marginBottom: '14px' }}>
            <span style={{ color: '#6366f1', fontWeight: 600 }}>*</span> ההקלטות נשמרות בדפדפן שלך בלבד.
          </p>
          <Link
            to="/"
            style={{
              color: '#2563eb',
              textDecoration: 'none',
              fontWeight: 500,
              fontSize: '1rem',
              borderBottom: '1px solid #2563eb',
              paddingBottom: '1.5px',
              transition: 'color 0.2s'
            }}
            onMouseOver={e => e.target.style.color = '#1e40af'}
            onMouseOut={e => e.target.style.color = '#2563eb'}
          >
            &larr; חזרה לדף הבית
          </Link>
        </div>
      </div>
    </div>
  );
};

export default AudioRecordingPage;
