
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Check, HelpCircle, RefreshCw, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useFlashcards } from '@/hooks/useFlashcards';
import { useToast } from '@/components/ui/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { getRandomItems, shuffleArray } from '@/lib/utils';

const QuizGame = () => {
  const { flashcardSets } = useFlashcards();
  const { toast } = useToast();
  const [selectedSetId, setSelectedSetId] = useState(null);
  const [gameStarted, setGameStarted] = useState(false);
  const [questions, setQuestions] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [score, setScore] = useState(0);
  const [showResult, setShowResult] = useState(false);
  const [gameCompleted, setGameCompleted] = useState(false);

  const startGame = (setId) => {
    const selectedSet = flashcardSets.find(set => set.id === setId);
    if (!selectedSet || selectedSet.cards.length < 4) {
      toast({
        title: "Not Enough Cards",
        description: "You need at least 4 cards in a set to play the quiz game.",
        variant: "destructive",
      });
      return;
    }

    // Get up to 10 random cards from the set
    const selectedCards = getRandomItems(selectedSet.cards, 10);
    
    // Create quiz questions with multiple choice answers
    const quizQuestions = selectedCards.map((card, index) => {
      // Get 3 random incorrect answers from other cards
      const otherCards = selectedCards.filter((_, i) => i !== index);
      const incorrectAnswers = getRandomItems(otherCards, 3).map(c => c.answer);
      
      // Create all options (correct + incorrect) and shuffle them
      const options = shuffleArray([card.answer, ...incorrectAnswers]);
      
      return {
        id: index,
        question: card.question,
        options,
        correctAnswer: card.answer
      };
    });

    setQuestions(quizQuestions);
    setCurrentQuestionIndex(0);
    setSelectedAnswer(null);
    setScore(0);
    setShowResult(false);
    setGameStarted(true);
    setGameCompleted(false);
  };

  const handleAnswerSelect = (answer) => {
    if (selectedAnswer !== null) return; // Prevent changing answer after selection
    
    setSelectedAnswer(answer);
    
    // Check if answer is correct
    const isCorrect = answer === questions[currentQuestionIndex].correctAnswer;
    if (isCorrect) {
      setScore(score + 1);
    }
    
    // Show result for a moment before moving to next question
    setShowResult(true);
    setTimeout(() => {
      if (currentQuestionIndex < questions.length - 1) {
        setCurrentQuestionIndex(currentQuestionIndex + 1);
        setSelectedAnswer(null);
        setShowResult(false);
      } else {
        // Game completed
        setGameCompleted(true);
      }
    }, 1500);
  };

  const resetGame = () => {
    setSelectedSetId(null);
    setGameStarted(false);
    setQuestions([]);
    setCurrentQuestionIndex(0);
    setSelectedAnswer(null);
    setScore(0);
    setShowResult(false);
    setGameCompleted(false);
  };

  const getAnswerButtonClass = (answer) => {
    if (!showResult) {
      return selectedAnswer === answer ? "bg-indigo-100 border-indigo-300" : "";
    }
    
    const isCorrect = answer === questions[currentQuestionIndex].correctAnswer;
    if (selectedAnswer === answer) {
      return isCorrect ? "bg-green-100 border-green-300" : "bg-red-100 border-red-300";
    }
    
    return isCorrect ? "bg-green-50 border-green-200" : "";
  };

  if (!gameStarted) {
    return (
      <div className="container mx-auto px-4">
        <div className="flex items-center mb-6">
          <Link to="/games">
            <Button variant="ghost" className="mr-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Games
            </Button>
          </Link>
          <h1 className="text-3xl font-bold">Quiz Challenge</h1>
        </div>

        <div className="bg-white rounded-lg border p-6 mb-8">
          <div className="flex items-center mb-4">
            <HelpCircle className="h-6 w-6 text-purple-500 mr-2" />
            <h2 className="text-xl font-semibold">How to Play</h2>
          </div>
          <p className="text-gray-600 mb-4">
            Test your knowledge with multiple-choice questions based on your flashcards. Select the correct answer from the options provided.
          </p>
          <ul className="list-disc list-inside text-gray-600 mb-6">
            <li>Read the question carefully</li>
            <li>Choose the correct answer from the options</li>
            <li>Try to get as many correct answers as possible</li>
          </ul>
        </div>

        <h2 className="text-xl font-semibold mb-4">Select a Flashcard Set</h2>
        
        {flashcardSets.length === 0 ? (
          <div className="text-center py-8 bg-white rounded-lg border">
            <p className="text-gray-600 mb-4">
              You need to create flashcard sets before you can play the quiz game.
            </p>
            <Link to="/flashcards">
              <Button>Create Flashcards</Button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {flashcardSets.map((set) => (
              <motion.div
                key={set.id}
                whileHover={{ scale: 1.02 }}
                className="bg-white rounded-lg border p-4 cursor-pointer"
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
              className="bg-purple-500 hover:bg-purple-600"
              size="lg"
            >
              Start Quiz
            </Button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <div className="flex items-center mb-4 md:mb-0">
          <Button variant="ghost" onClick={resetGame} className="mr-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Exit Quiz
          </Button>
          <h1 className="text-2xl font-bold">Quiz Challenge</h1>
        </div>
        <div className="flex items-center space-x-4">
          <div className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm font-medium">
            Question {currentQuestionIndex + 1} of {questions.length}
          </div>
          <div className="bg-indigo-100 text-indigo-800 px-3 py-1 rounded-full text-sm font-medium">
            Score: {score}
          </div>
          <Button variant="outline" size="sm" onClick={resetGame}>
            <RefreshCw className="h-4 w-4 mr-1" />
            Reset
          </Button>
        </div>
      </div>

      {questions.length > 0 && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-xl">
              {questions[currentQuestionIndex].question}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {questions[currentQuestionIndex].options.map((option, index) => (
                <motion.button
                  key={index}
                  className={`w-full text-left p-4 rounded-lg border transition-colors ${getAnswerButtonClass(option)}`}
                  onClick={() => handleAnswerSelect(option)}
                  disabled={selectedAnswer !== null}
                  whileHover={selectedAnswer === null ? { scale: 1.01 } : {}}
                  whileTap={selectedAnswer === null ? { scale: 0.99 } : {}}
                >
                  <div className="flex items-center">
                    {showResult && option === questions[currentQuestionIndex].correctAnswer && (
                      <Check className="h-5 w-5 text-green-500 mr-2" />
                    )}
                    {showResult && option !== questions[currentQuestionIndex].correctAnswer && selectedAnswer === option && (
                      <X className="h-5 w-5 text-red-500 mr-2" />
                    )}
                    <span>{option}</span>
                  </div>
                </motion.button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Dialog open={gameCompleted} onOpenChange={setGameCompleted}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Quiz Completed!</DialogTitle>
          </DialogHeader>
          <div className="py-4 text-center">
            <div className="mb-4 flex justify-center">
              <div className="h-16 w-16 rounded-full bg-purple-100 flex items-center justify-center">
                <Check className="h-8 w-8 text-purple-500" />
              </div>
            </div>
            <p className="text-lg mb-4">Your final score:</p>
            <div className="text-center mb-4">
              <p className="text-3xl font-bold">{score} / {questions.length}</p>
              <p className="text-gray-500">
                {score === questions.length 
                  ? "Perfect score! Amazing job!" 
                  : score >= questions.length * 0.7 
                    ? "Great job! Keep it up!" 
                    : "Good effort! Try again to improve your score."}
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={resetGame}>
              Play Again
            </Button>
            <Link to="/games">
              <Button>Back to Games</Button>
            </Link>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default QuizGame;
