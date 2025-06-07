import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { Toaster } from 'react-hot-toast';
import { Toaster as UIToaster } from './components/ui/toaster';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Login from './pages/Login';
import SignUp from './pages/SignUp';
import SignupSuccess from './pages/SignupSuccess';
import StudentDashboard from './pages/StudentDashboard';
import SummaryResult from './pages/SummaryResult';
import AudioRecordingPage from './pages/AudioRecordingPage';
import MembershipPayment from './pages/MembershipPayment';
import AccountDetails from './pages/AccountDetails';
import PaymentConfirmation from './pages/PaymentConfirmation';
// Import game components
import GamesPage from './pages/GamesPage';
import MatchingGame from './pages/games/MatchingGame';
import QuizGame from './pages/games/QuizGame';
import SpeedChallengeGame from './pages/games/SpeedChallengeGame';
import DevUserSwitcher from './components/DevUserSwitcher';
// Import ProtectedRoute component
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  return (
    <GoogleOAuthProvider clientId="223517881477-ncfrafhp355dj8c3rc99a124jrgnf4f1.apps.googleusercontent.com">
      <BrowserRouter>
        <div className="min-h-screen bg-white">
          <Toaster position="top-center" reverseOrder={false} />
          <UIToaster />
          <Navbar />
          <div className="pt-16">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<SignUp />} />
              <Route path="/signup-success" element={<SignupSuccess />} />
              
              {/* Protected Routes - Require Authentication */}
              <Route path="/dashboard" element={
                <ProtectedRoute>
                  <StudentDashboard />
                </ProtectedRoute>
              } />
              <Route path="/summary-result" element={
                <ProtectedRoute>
                  <SummaryResult />
                </ProtectedRoute>
              } />
              <Route path="/record-audio" element={
                <ProtectedRoute>
                  <AudioRecordingPage />
                </ProtectedRoute>
              } />
              <Route path="/membership-payment" element={
                <ProtectedRoute>
                  <MembershipPayment />
                </ProtectedRoute>
              } />
              <Route path="/account-details" element={
                <ProtectedRoute>
                  <AccountDetails />
                </ProtectedRoute>
              } />
              <Route path="/payment-confirmation" element={
                <ProtectedRoute>
                  <PaymentConfirmation />
                </ProtectedRoute>
              } />
              
              {/* Game Routes - Protected */}
              <Route path="/games" element={
                <ProtectedRoute>
                  <GamesPage />
                </ProtectedRoute>
              } />
              <Route path="/games/matching" element={
                <ProtectedRoute>
                  <MatchingGame />
                </ProtectedRoute>
              } />
              <Route path="/games/quiz" element={
                <ProtectedRoute>
                  <QuizGame />
                </ProtectedRoute>
              } />
              <Route path="/games/speed-challenge" element={
                <ProtectedRoute>
                  <SpeedChallengeGame />
                </ProtectedRoute>
              } />
            </Routes>
          </div>
          <DevUserSwitcher />
        </div>
      </BrowserRouter>
    </GoogleOAuthProvider>
  );
}

export default App;