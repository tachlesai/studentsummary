
import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Check, Clock, RefreshCw, Timer, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { useFlashcards } from '@/hooks/useFlashcards';
import { useToast } from '@/components/ui/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { getRandomItems, shuffleArray } from '@/lib/utils';

const SpeedChallengeGame = () => {
  const { flashcardSets } = useFlashcards();
  const { toast } = useToast();
  const [selectedSetId, setSelectedSetId] = useState(null);
  const [gameStarted, setGameStarted] = useState(false);
  const [cards, setCards] = useState([]);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [timeLimit, setTimeLimit] = useState(60); // in seconds
  const [timeRemaining, setTimeRemaining] = useState(60);
  const [score, setScore] = useState(0);
  const [gameCompleted, setGameCompleted] = useState(false);
  const [timerInterval, setTimerInterval] = useState(null);
  const [hardMode, setHardMode] = useState(false);
  
  const confettiRef = useRef(null);

  useEffect(() => {
    return () => {
      if (timerInterval) {
        clearInterval(timerInterval);
      }
    };
  }, [timerInterval]);

  useEffect(() => {
    if (timeRemaining <= 0) {
      endGame();
    }
  }, [timeRemaining]);

  const startGame = (setId) => {
    const selectedSet = flashcardSets.find(set => set.id === setId);
    if (!selectedSet || selectedSet.cards.length < 5) {
      toast({
        title: "Not Enough Cards",
        description: "You need at least 5 cards in a set to play the speed challenge.",
        variant: "destructive",
      });
      return;
    }

    // Get all cards and shuffle them
    const gameCards = shuffleArray([...selectedSet.cards]);
    
    setCards(gameCards);
    setCurrentCardIndex(0);
    setShowAnswer(false);
    setScore(0);
    setTimeRemaining(timeLimit);
    setGameStarted(true);
    setGameCompleted(false);
    
    const interval = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    setTimerInterval(interval);
  };

  const handleShowAnswer = () => {
    setShowAnswer(true);
  };

  const handleCorrect = () => {
    setScore(score + 1);
    nextCard();
  };

  const handleIncorrect = () => {
    if (hardMode) {
      setScore(Math.max(0, score - 1)); // Deduct a point in hard mode
    }
    nextCard();
  };

  const nextCard = () => {
    if (currentCardIndex < cards.length - 1) {
      setCurrentCardIndex(currentCardIndex + 1);
      setShowAnswer(false);
    } else {
      // Cycle back to the beginning if we've gone through all cards
      setCurrentCardIndex(0);
      setShowAnswer(false);
      // Reshuffle the cards
      setCards(shuffleArray([...cards]));
    }
  };

  const endGame = () => {
    if (timerInterval) {
      clearInterval(timerInterval);
    }
    setGameCompleted(true);
  };

  const resetGame = () => {
    if (timerInterval) {
      clearInterval(timerInterval);
    }
    setSelectedSetId(null);
    setGameStarted(false);
    setCards([]);
    setCurrentCardIndex(0);
    setShowAnswer(false);
    setScore(0);
    setTimeRemaining(timeLimit);
    setGameCompleted(false);
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const getProgressColor = () => {
    const percentage = (timeRemaining / timeLimit) * 100;
    if (percentage > 60) return 'bg-green-500';
    if (percentage > 30) return 'bg-yellow-500';
    return 'bg-red-500';
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
          <h1 className="text-3xl font-bold">Speed Challenge</h1>
        </div>

        <div className="bg-white rounded-lg border p-6 mb-8">
          <div className="flex items-center mb-4">
            <Timer className="h-6 w-6 text-blue-500 mr-2" />
            <h2 className="text-xl font-semibold">How to Play</h2>
          </div>
          <p className="text-gray-600 mb-4">
            Race against the clock to answer as many flashcards as possible. Test your knowledge under time pressure!
          </p>
          <ul className="list-disc list-inside text-gray-600 mb-6">
            <li>Answer as many cards as you can before time runs out</li>
            <li>Click "Show Answer" to reveal the answer</li>
            <li>Mark yourself correct or incorrect honestly</li>
            <li>Try to beat your high score!</li>
          </ul>
          
          <div className="mt-6 space-y-6">
            <div className="space-y-2">
              <h3 className="text-lg font-medium">Time Limit</h3>
              <div className="flex items-center space-x-4">
                <Slider
                  value={[timeLimit]}
                  min={30}
                  max={180}
                  step={30}
                  onValueChange={(value) => setTimeLimit(value[0])}
                  className="w-full max-w-xs"
                />
                <span className="font-medium">{formatTime(timeLimit)}</span>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <Switch
                id="hard-mode"
                checked={hardMode}
                onCheckedChange={setHardMode}
              />
              <Label htmlFor="hard-mode">Hard Mode (lose points for incorrect answers)</Label>
            </div>
          </div>
        </div>

        <h2 className="text-xl font-semibold mb-4">Select a Flashcard Set</h2>
        
        {flashcardSets.length === 0 ? (
          <div className="text-center py-8 bg-white rounded-lg border">
            <p className="text-gray-600 mb-4">
              You need to create flashcard sets before you can play the speed challenge.
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
              className="bg-blue-500 hover:bg-blue-600"
              size="lg"
            >
              Start Challenge
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
            Exit Challenge
          </Button>
          <h1 className="text-2xl font-bold">Speed Challenge</h1>
        </div>
        <div className="flex items-center space-x-4">
          <div className="flex items-center">
            <Clock className="h-4 w-4 mr-1 text-gray-500" />
            <span className="text-gray-700">{formatTime(timeRemaining)}</span>
          </div>
          <div className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
            Score: {score}
          </div>
          <Button variant="outline" size="sm" onClick={endGame}>
            End Game
          </Button>
        </div>
      </div>

      <div className="w-full h-2 bg-gray-200 rounded-full mb-6">
        <div 
          className={`h-2 rounded-full transition-all duration-1000 ${getProgressColor()}`}
          style={{ width: `${(timeRemaining / timeLimit) * 100}%` }}
        ></div>
      </div>

      {cards.length > 0 && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-xl text-center">
              {cards[currentCardIndex].question}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {showAnswer ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="mb-6"
              >
                <div className="p-4 bg-blue-50 rounded-lg border border-blue-100 text-center">
                  <h3 className="text-lg font-medium mb-2">Answer:</h3>
                  <p>{cards[currentCardIndex].answer}</p>
                </div>
              </motion.div>
            ) : (
              <div className="flex justify-center mb-6">
                <Button onClick={handleShowAnswer}>
                  Show Answer
                </Button>
              </div>
            )}

            {showAnswer && (
              <div className="flex justify-center space-x-4">
                <Button 
                  onClick={handleCorrect}
                  className="bg-green-500 hover:bg-green-600"
                >
                  <Check className="h-5 w-5 mr-1" />
                  Correct
                </Button>
                <Button 
                  onClick={handleIncorrect}
                  className="bg-red-500 hover:bg-red-600"
                >
                  <X className="h-5 w-5 mr-1" />
                  Incorrect
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <Dialog open={gameCompleted} onOpenChange={setGameCompleted}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Time's Up!</DialogTitle>
          </DialogHeader>
          <div className="py-4 text-center">
            <div className="mb-4 flex justify-center">
              <div className="h-16 w-16 rounded-full bg-blue-100 flex items-center justify-center">
                <Timer className="h-8 w-8 text-blue-500" />
              </div>
            </div>
            <p className="text-lg mb-4">Your final score:</p>
            <div className="text-center mb-4">
              <p className="text-3xl font-bold">{score}</p>
              <p className="text-gray-500">
                {score >= 15 
                  ? "Amazing speed! You're a master!" 
                  : score >= 10 
                    ? "Great job! Your recall is impressive!" 
                    : score >= 5
                      ? "Good effort! Keep practicing to improve your speed."
                      : "Practice makes perfect! Keep studying to improve your recall."}
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
      
      <div ref={confettiRef} className="confetti-container"></div>
    </div>
  );
};

export default SpeedChallengeGame;
