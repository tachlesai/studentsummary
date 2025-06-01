
import React from 'react';
import { motion } from 'framer-motion';
import { Brain, Puzzle, Timer, Zap } from 'lucide-react';
import GameCard from '@/components/GameCard';
import { useFlashcards } from '@/hooks/useFlashcards';

const GamesPage = () => {
  const { flashcardSets } = useFlashcards();
  
  const games = [
    {
      title: 'Matching Game',
      description: 'Match questions with their correct answers to test your knowledge.',
      icon: <Puzzle className="h-5 w-5 text-indigo-600" />,
      path: '/games/matching',
      color: 'bg-indigo-500'
    },
    {
      title: 'Quiz Challenge',
      description: 'Test your knowledge with multiple-choice questions based on your flashcards.',
      icon: <Brain className="h-5 w-5 text-purple-600" />,
      path: '/games/quiz',
      color: 'bg-purple-500'
    },
    {
      title: 'Speed Challenge',
      description: 'Race against the clock to answer as many flashcards as possible.',
      icon: <Timer className="h-5 w-5 text-blue-600" />,
      path: '/games/speed-challenge',
      color: 'bg-blue-500'
    }
  ];

  return (
    <div className="container mx-auto px-4">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-8"
      >
        <h1 className="text-3xl font-bold mb-2">Study Games</h1>
        <p className="text-gray-600">
          Make learning fun with interactive games based on your flashcards.
        </p>
      </motion.div>

      {flashcardSets.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="text-center py-16 bg-white rounded-lg border shadow-sm"
        >
          <div className="mb-4 flex justify-center">
            <div className="h-16 w-16 rounded-full bg-indigo-100 flex items-center justify-center">
              <Zap className="h-8 w-8 text-indigo-500" />
            </div>
          </div>
          <h2 className="text-xl font-semibold mb-2">No Flashcards Available</h2>
          <p className="text-gray-600 mb-6 max-w-md mx-auto">
            You need to create flashcard sets before you can play study games. Head over to the Flashcards page to create your first set.
          </p>
        </motion.div>
      ) : (
        <>
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

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-lg p-8 text-white"
          >
            <div className="flex flex-col md:flex-row items-center justify-between">
              <div className="mb-6 md:mb-0 md:mr-6">
                <h2 className="text-2xl font-bold mb-2">Why Games Help You Learn</h2>
                <p className="opacity-90 max-w-xl">
                  Playing games activates multiple areas of your brain, making learning more effective. 
                  Our study games are designed to reinforce your knowledge through active recall and spaced repetition.
                </p>
              </div>
              <img  alt="Brain with learning connections" className="w-full md:w-64 h-auto rounded-lg" src="https://images.unsplash.com/photo-1591102922649-71f14ff3461c" />
            </div>
          </motion.div>
        </>
      )}
    </div>
  );
};

export default GamesPage;
