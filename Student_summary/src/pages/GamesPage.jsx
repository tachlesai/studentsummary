import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Brain, Puzzle, Timer, Zap } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { useFlashcards } from '../hooks/useFlashcards';

const GameCard = ({ title, description, icon, path, color }) => {
  const navigate = useNavigate();
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      whileHover={{ y: -5 }}
      className="h-full"
    >
      <div className="h-full bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden hover:border-indigo-300 transition-all flex flex-col">
        <div className={`h-2 w-full ${color}`}></div>
        <div className="p-6 flex-1">
          <div className="flex items-center mb-4">
            <div className={`p-2 rounded-lg ${color.replace('bg-', 'bg-')}bg-opacity-20 mr-3`}>
              {icon}
            </div>
            <h3 className="text-xl font-semibold">{title}</h3>
          </div>
          <p className="text-gray-600 mb-4">{description}</p>
        </div>
        <div className="p-6 pt-0 mt-auto">
          <button
            onClick={() => navigate(path)}
            className={`w-full py-2 ${color} text-white rounded-md hover:${color.replace('bg-', 'bg-')}600 transition-colors`}
          >
            שחק עכשיו
          </button>
        </div>
      </div>
    </motion.div>
  );
};

const GamesPage = () => {
  // Force always showing games
  const [showGames] = useState(true);
  const { flashcardSets, loading, error } = useFlashcards();
  const navigate = useNavigate();
  
  // Debug: Basic token check only
  useEffect(() => {
    if (!localStorage.getItem('token')) {
      console.log('No token in localStorage');
    }
  }, []);

  const games = [
    {
      title: 'משחק התאמה',
      description: 'התאם שאלות עם התשובות הנכונות כדי לבדוק את הידע שלך.',
      icon: <Puzzle className="h-5 w-5 text-indigo-600" />,
      path: '/games/matching',
      color: 'bg-indigo-500'
    },
    {
      title: 'אתגר חידון',
      description: 'בדוק את הידע שלך עם שאלות רב-ברירה המבוססות על הסיכומים שלך.',
      icon: <Brain className="h-5 w-5 text-purple-600" />,
      path: '/games/quiz',
      color: 'bg-purple-500'
    },
    {
      title: 'אתגר מהירות',
      description: 'התחרה נגד השעון וענה על כמה שיותר שאלות בזמן מוגבל.',
      icon: <Timer className="h-5 w-5 text-blue-600" />,
      path: '/games/speed-challenge',
      color: 'bg-blue-500'
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-3xl font-bold">משחקי למידה</h1>
            <button
              onClick={() => navigate('/dashboard')}
              className="flex items-center gap-2 text-blue-600 hover:text-blue-800 transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              חזרה ללוח הבקרה
            </button>
          </div>
          <p className="text-gray-600">
            הפוך את הלמידה לכיפית עם משחקים אינטראקטיביים המבוססים על הסיכומים שלך.
          </p>
        </motion.div>

        {/* Always show games */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {games.map((game, index) => (
            <GameCard
              key={index}
              title={game.title}
              description={game.description}
              icon={game.icon}
              path={game.path}
              color={game.color}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default GamesPage;
