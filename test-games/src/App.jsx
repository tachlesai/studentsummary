import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from '@/components/ui/toaster';
import GamesPage from '@/pages/GamesPage';
import MatchingGame from '@/pages/games/MatchingGame';
import QuizGame from '@/pages/games/QuizGame';
import SpeedChallengeGame from '@/pages/games/SpeedChallengeGame';
import FlashcardsPage from '@/pages/FlashcardsPage';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-background text-foreground p-4">
        <Routes>
          <Route path="/" element={<Navigate to="/games" replace />} />
          <Route path="/games" element={<GamesPage />} />
          <Route path="/games/matching" element={<MatchingGame />} />
          <Route path="/games/quiz" element={<QuizGame />} />
          <Route path="/games/speed-challenge" element={<SpeedChallengeGame />} />
          <Route path="/flashcards" element={<FlashcardsPage />} />
        </Routes>
      </div>
      <Toaster />
    </Router>
  );
}

export default App;