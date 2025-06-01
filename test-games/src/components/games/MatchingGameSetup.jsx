import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowLeft, Puzzle } from 'lucide-react';
import { Button } from '@/components/ui/button';

const MatchingGameSetup = ({ flashcardSets, selectedSetId, setSelectedSetId, startGame }) => {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center mb-6">
        <Link to="/games">
          <Button variant="ghost" className="mr-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Games
          </Button>
        </Link>
        <h1 className="text-3xl font-bold">Matching Game</h1>
      </div>

      <div className="bg-white rounded-lg border p-6 mb-8">
        <div className="flex items-center mb-4">
          <Puzzle className="h-6 w-6 text-indigo-500 mr-2" />
          <h2 className="text-xl font-semibold">How to Play</h2>
        </div>
        <p className="text-gray-600 mb-4">
          Test your memory by matching questions with their corresponding answers. Flip cards to reveal their content and find all matching pairs.
        </p>
        <ul className="list-disc list-inside text-gray-600 mb-6">
          <li>Click on cards to flip them</li>
          <li>Find matching question-answer pairs</li>
          <li>Complete the game with as few moves as possible</li>
        </ul>
      </div>

      <h2 className="text-xl font-semibold mb-4">Select a Flashcard Set</h2>
      
      {flashcardSets.length === 0 ? (
        <div className="text-center py-8 bg-white rounded-lg border">
          <p className="text-gray-600 mb-4">
            No flashcard sets found. Please ensure flashcard data is available.
          </p>
          <Link to="/flashcards">
             <Button>Manage Flashcards</Button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {flashcardSets.map((set) => (
            <motion.div
              key={set.id}
              whileHover={{ scale: 1.02 }}
              className={`bg-white rounded-lg border p-4 cursor-pointer ${selectedSetId === set.id ? "ring-2 ring-indigo-500" : ""}`}
              onClick={() => setSelectedSetId(set.id)}
            >
              <h3 className="font-semibold mb-2">{set.title}</h3>
              <p className="text-sm text-gray-500">{set.cards.length} cards</p>
            </motion.div>
          ))}
        </div>
      )}

      {selectedSetId && (
        <div className="mt-8 flex justify-center">
          <Button 
            onClick={() => startGame(selectedSetId)}
            className="bg-indigo-500 hover:bg-indigo-600"
            size="lg"
          >
            Start Game
          </Button>
        </div>
      )}
    </div>
  );
};

export default MatchingGameSetup;