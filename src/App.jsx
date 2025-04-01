import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { GoogleOAuthProvider } from '@react-oauth/google';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Login from './pages/Login';
import SignUp from './pages/SignUp';
import SignupSuccess from './pages/SignupSuccess';
import StudentDashboard from './pages/StudentDashboard';
import SummaryResult from './pages/SummaryResult';
import AudioRecorder from './components/AudioRecorder';

function App() {
  return (
    <GoogleOAuthProvider clientId="223517881477-ncfrafhp355dj8c3rc99a124jrgnf4f1.apps.googleusercontent.com">
      <BrowserRouter>
        <div className="min-h-screen bg-white">
          <Navbar />
          
          {/* Audio Recorder Component - Made more prominent */}
          <div style={{
            maxWidth: '800px',
            margin: '80px auto 20px',
            padding: '20px',
            backgroundColor: '#f0f4f8',
            borderRadius: '10px',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
            border: '1px solid #e2e8f0'
          }}>
            <h2 style={{ fontSize: '24px', fontWeight: 'bold', textAlign: 'right', marginBottom: '15px' }}>
              הקלטת קול
            </h2>
            <p style={{ textAlign: 'right', marginBottom: '20px' }}>
              לחץ על הכפתור למטה כדי להתחיל להקליט את הקול שלך
            </p>
            <AudioRecorder />
          </div>
          
          <div className="pt-4">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<SignUp />} />
              <Route path="/signup-success" element={<SignupSuccess />} />
              <Route path="/dashboard" element={<StudentDashboard />} />
              <Route path="/summary-result" element={<SummaryResult />} />
            </Routes>
          </div>
        </div>
      </BrowserRouter>
    </GoogleOAuthProvider>
  );
}

export default App;