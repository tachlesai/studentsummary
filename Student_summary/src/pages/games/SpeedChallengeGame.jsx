import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Check, Clock, RefreshCw, Timer, X } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Switch } from '../../components/ui/switch';
import { Label } from '../../components/ui/label';
import { Slider } from '../../components/ui/slider';
import { useToast } from '../../components/ui/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../../components/ui/dialog';
import { getRandomItems, shuffleArray } from '../../lib/utils';

const SpeedChallengeGame = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [flashcardSets, setFlashcardSets] = useState([]);
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
  const [loading, setLoading] = useState(false);
  
  const confettiRef = useRef(null);

  const debugMode = true;

  // Directly fetch flashcards when component mounts
  useEffect(() => {
    const fetchAllFlashcards = async () => {
      try {
        setLoading(true);
        console.log("SPEED GAME - Directly fetching all flashcards");
        
        // Get token from localStorage
        const token = localStorage.getItem('token');
        
        // Simple fetch request to get all flashcards
        const response = await fetch('http://localhost:5001/api/all-flashcards', {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': token ? `Bearer ${token}` : ''
          }
        });
        
        if (!response.ok) {
          throw new Error('Failed to fetch flashcards');
        }
        
        const data = await response.json();
        console.log("Fetched flashcards:", data);
        
        // Group flashcards by set for selection
        const groupedBySet = {};
        
        data.forEach(card => {
          if (!groupedBySet[card.set_id]) {
            groupedBySet[card.set_id] = {
              id: card.set_id,
              title: card.set_title || `Flashcard Set ${card.set_id}`,
              flashcards: []
            };
          }
          
          groupedBySet[card.set_id].flashcards.push({
            id: card.id,
            question: card.question,
            answer: card.answer
          });
        });
        
        console.log("Grouped flashcards by set:", groupedBySet);
        
        // Update state with sets that have flashcards
        const setsArray = Object.values(groupedBySet).filter(set => set.flashcards.length > 0);
        if (setsArray.length > 0) {
          setFlashcardSets(setsArray);
        } else {
          console.log("No flashcard sets with cards found");
        }
      } catch (err) {
        console.error("Error fetching flashcards:", err);
        toast({
          title: "Error",
          description: "Failed to load flashcards",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };
    
    fetchAllFlashcards();
  }, [toast]);

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
    if (debugMode && (!selectedSet || selectedSet.flashcards.length < 5)) {
      // Create debug flashcards
      const debugCards = [
        { id: 'd1', question: "שאלת מהירות 1", answer: "תשובה מהירות 1" },
        { id: 'd2', question: "שאלת מהירות 2", answer: "תשובה מהירות 2" },
        { id: 'd3', question: "שאלת מהירות 3", answer: "תשובה מהירות 3" },
        { id: 'd4', question: "שאלת מהירות 4", answer: "תשובה מהירות 4" },
        { id: 'd5', question: "שאלת מהירות 5", answer: "תשובה מהירות 5" },
        { id: 'd6', question: "שאלת מהירות 6", answer: "תשובה מהירות 6" },
        { id: 'd7', question: "שאלת מהירות 7", answer: "תשובה מהירות 7" },
        { id: 'd8', question: "שאלת מהירות 8", answer: "תשובה מהירות 8" }
      ];
      
      toast({
        title: "מצב דיבאג",
        description: "אין מספיק כרטיסיות אמיתיות, משתמש בנתוני דיבאג.",
        duration: 3000,
      });
      
      // Override selected set with debug data
      selectedSet = {
        id: 'debug-speed',
        title: 'Debug Speed Set',
        flashcards: debugCards
      };
    }

    if (!selectedSet || !selectedSet.flashcards || selectedSet.flashcards.length < 5) {
      toast({
        title: "לא מספיק כרטיסיות",
        description: "אתה צריך לפחות 5 כרטיסיות בסט כדי לשחק במשחק המהירות.",
        variant: "destructive",
      });
      return;
    }

    // Get all cards and shuffle them
    const gameCards = shuffleArray([...selectedSet.flashcards]);
    
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
              חזרה למשחקים
            </Button>
          </Link>
          <h1 className="text-3xl font-bold">משחק מהירות</h1>
        </div>

        <div className="bg-white rounded-lg border p-6 mb-8">
          <div dir="rtl" className="text-right">
            <h2 className="text-xl font-bold mb-4">הוראות המשחק</h2>
            <p className="text-gray-700 mb-4">
              שחקו נגד השעון וענו על כמה שיותר כרטיסיות. בחנו את הידע שלכם תחת לחץ זמן!
            </p>
            
            <ul className="list-disc list-inside text-gray-700 space-y-2 mb-6 pr-4">
              <li>ענו על כמה שיותר כרטיסיות לפני שנגמר הזמן</li>
              <li>לחצו על "הראה תשובה" כדי לראות את התשובה</li>
              <li>סמנו את עצמכם כנכון או לא נכון בכנות</li>
              <li>נסו לשבור את השיא האישי שלכם!</li>
            </ul>

            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-medium mb-2">מגבלת זמן</h3>
                <div className="flex items-center">
                  <div className="w-full max-w-md">
                    <Slider
                      value={[timeLimit]}
                      min={30}
                      max={180}
                      step={30}
                      onValueChange={(value) => setTimeLimit(value[0])}
                    />
                  </div>
                  <span className="mr-4 font-medium text-gray-700">{formatTime(timeLimit)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <h2 className="text-xl font-semibold mb-4 text-right" dir="rtl">בחר סט כרטיסיות</h2>
        
        {flashcardSets.length === 0 ? (
          <div className="text-center py-8 bg-white rounded-lg border">
            <p className="text-gray-600 mb-4">
              עליך ליצור סט כרטיסיות לפני שתוכל לשחק במשחק המהירות.
            </p>
            <Link to="/games">
              <Button>חזרה למשחקים</Button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {flashcardSets.map((set) => (
              <motion.div
                key={set.id}
                whileHover={{ scale: 1.02 }}
                className={`bg-white rounded-lg border p-4 cursor-pointer ${selectedSetId === set.id ? 'border-blue-500 ring-2 ring-blue-200' : ''}`}
                onClick={() => setSelectedSetId(set.id)}
              >
                <h3 className="font-semibold mb-2 text-right" dir="rtl">{set.title}</h3>
                <p className="text-sm text-gray-500 text-right" dir="rtl">{set.flashcards.length} כרטיסיות</p>
              </motion.div>
            ))}
          </div>
        )}

        {selectedSetId && (
          <div className="mt-8 flex justify-center">
            <Button 
              onClick={() => startGame(selectedSetId)}
              className="bg-blue-500 hover:bg-blue-600 text-white w-full max-w-[350px] py-4 rounded-full"
              size="lg"
            >
              התחל משחק
            </Button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4" dir="rtl">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <div className="flex items-center mb-4 md:mb-0">
          <Button variant="ghost" onClick={resetGame} className="ml-4">
            <ArrowLeft className="h-4 w-4 ml-2" />
            צא מהמשחק
          </Button>
          <h1 className="text-2xl font-bold">משחק מהירות</h1>
        </div>
        <div className="flex items-center space-x-4 space-x-reverse">
          <div className="flex items-center">
            <Clock className="h-4 w-4 ml-1 text-gray-500" />
            <span className="text-gray-700">{formatTime(timeRemaining)}</span>
          </div>
          <div className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
            ניקוד: {score}
          </div>
          <Button variant="outline" size="sm" onClick={endGame}>
            סיים משחק
          </Button>
        </div>
      </div>

      <div className="w-full h-2 bg-gray-200 rounded-full mb-6">
        <div 
          className={`h-2 rounded-full transition-all duration-1000 ${getProgressColor()}`}
          style={{ width: `${(timeRemaining / timeLimit) * 100}%` }}
        ></div>
      </div>

      <div className="flex justify-center items-center min-h-[50vh]">
        {cards.length > 0 && (
          <div className="w-full max-w-[700px] bg-white rounded-lg shadow-sm p-0 border border-gray-200">
            <div className="p-6 min-h-[350px] flex flex-col">
              {!showAnswer ? (
                <>
                  <div className="flex-grow flex items-center justify-center h-[200px]">
                    <p className="text-xl max-w-[550px] text-center" dir="rtl">{cards[currentCardIndex].question}</p>
                  </div>
                  <div className="flex justify-center">
                    <Button 
                      onClick={handleShowAnswer}
                      className="bg-blue-500 hover:bg-blue-600 text-white w-full max-w-[350px] py-4 rounded-full"
                    >
                      הראה תשובה
                    </Button>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex-grow bg-blue-50 rounded-lg p-6 overflow-y-auto h-[200px]">
                    <h3 className="text-lg font-medium mb-2 text-right">תשובה:</h3>
                    <p className="text-right">{cards[currentCardIndex].answer}</p>
                  </div>
                  <div className="flex justify-center space-x-4 space-x-reverse mt-4">
                    <Button 
                      onClick={handleIncorrect}
                      className="bg-red-500 hover:bg-red-600 text-white px-8 py-2 rounded-full"
                    >
                      <X className="ml-2 h-5 w-5" />
                      לא נכון
                    </Button>
                    <Button 
                      onClick={handleCorrect}
                      className="bg-green-500 hover:bg-green-600 text-white px-8 py-2 rounded-full"
                    >
                      <Check className="ml-2 h-5 w-5" />
                      נכון
                    </Button>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>

      <Dialog open={gameCompleted} onOpenChange={setGameCompleted}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>נגמר הזמן!</DialogTitle>
          </DialogHeader>
          <div className="py-4 text-center">
            <div className="mb-4 flex justify-center">
              <div className="h-16 w-16 rounded-full bg-blue-100 flex items-center justify-center">
                <Timer className="h-8 w-8 text-blue-500" />
              </div>
            </div>
            <p className="text-lg mb-4">הניקוד הסופי שלך:</p>
            <div className="text-center mb-4">
              <p className="text-3xl font-bold">{score}</p>
              <p className="text-gray-500" dir="rtl">
                {score >= 15 
                  ? "מהירות מדהימה! אתה מומחה!" 
                  : score >= 10 
                    ? "עבודה טובה! היכולת שלך מרשימה!" 
                    : score >= 5
                      ? "מאמץ טוב! המשך להתאמן כדי לשפר את המהירות שלך."
                      : "אימון עושה מושלם! המשך ללמוד כדי לשפר את הזיכרון שלך."}
              </p>
            </div>
          </div>
          <DialogFooter className="flex justify-center">
            <Button variant="outline" onClick={resetGame}>
              שחק שוב
            </Button>
            <Link to="/games">
              <Button>חזרה למשחקים</Button>
            </Link>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      <div ref={confettiRef} className="confetti-container"></div>
    </div>
  );
};

export default SpeedChallengeGame;
