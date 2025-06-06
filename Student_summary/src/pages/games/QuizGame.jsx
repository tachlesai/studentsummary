import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Check, HelpCircle, RefreshCw, X } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '../../components/ui/card';
import { useFlashcards } from '../../hooks/useFlashcards';
import { useToast } from '../../components/ui/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../../components/ui/dialog';
import { getRandomItems, shuffleArray } from '../../lib/utils';
import API_BASE_URL from '../../config';
import { getAuthToken } from '../../utils/auth';

const QuizGame = () => {
  const [questions, setQuestions] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [score, setScore] = useState(0);
  const [feedback, setFeedback] = useState(null);
  const [isGameOver, setIsGameOver] = useState(false);
  const [timeLeft, setTimeLeft] = useState(30);
  const [isTimerRunning, setIsTimerRunning] = useState(true);
  const [selectedSetId, setSelectedSetId] = useState(null);
  const [gameStarted, setGameStarted] = useState(false);
  const [flashcardSets, setFlashcardSets] = useState([]);
  const [selectedSet, setSelectedSet] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Get hook with all needed functions
  const { toast } = useToast();
  const navigate = useNavigate();

  // Process the fetched flashcards into a format suitable for the game
  const processFlashcards = (rawFlashcards) => {
    console.log('Processing raw flashcards:', rawFlashcards);
    
    if (!rawFlashcards || rawFlashcards.length === 0) {
      console.log('No flashcards available');
      return [];
    }
    
    // Group flashcards by set_id
    const groupedBySet = rawFlashcards.reduce((sets, card) => {
      const setId = card.set_id;
      if (!sets[setId]) {
        sets[setId] = {
          id: setId,
          title: card.set_title || 'Unnamed Set',
          flashcards: []
        };
      }
      
      // Process the card
      const processedCard = {
        id: card.id,
        question: card.question,
        answer: card.answer,
        incorrectAnswers: Array.isArray(card.wrong_answers) ? card.wrong_answers : []
      };
      
      // Handle JSONB wrong_answers field
      if (card.wrong_answers && typeof card.wrong_answers === 'object' && !Array.isArray(card.wrong_answers)) {
        // If it's a JSONB object, convert to array
        processedCard.incorrectAnswers = Object.values(card.wrong_answers);
      }
      
      sets[setId].flashcards.push(processedCard);
      return sets;
    }, {});
    
    // Convert to array
    const flashcardSets = Object.values(groupedBySet);
    console.log('Processed flashcard sets:', flashcardSets);
    
    return flashcardSets;
  };

  useEffect(() => {
    console.log('QUIZ GAME - COMPONENT MOUNTED');
    
    const loadFlashcards = async () => {
      try {
        const rawFlashcards = await fetchFlashcards();
        const flashcardSets = processFlashcards(rawFlashcards);
        
        console.log('Available flashcard sets:', flashcardSets);
        console.log('Are sets available?', flashcardSets.length > 0);
        
        // Check token
        const token = localStorage.getItem('token');
        console.log('Token exists:', token ? `${token.substring(0, 15)}...` : 'none');
        
        // Try to decode token
        if (token) {
          try {
            let tokenContents = null;
            
            if (token.startsWith('mock.')) {
              // Handle mock token format
              const base64Part = token.substring(5).split('.')[0];
              const decoded = atob(base64Part);
              tokenContents = JSON.parse(decoded);
            } else if (token.split('.').length === 3) {
              // Handle JWT format
              const base64Url = token.split('.')[1];
              const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
              const decoded = atob(base64);
              tokenContents = JSON.parse(decoded);
            }
            
            console.log('Token contents:', tokenContents);
          } catch (e) {
            console.error('Error decoding token:', e);
          }
        }
        
        if (flashcardSets.length > 0) {
          setFlashcardSets(flashcardSets);
          setSelectedSet(flashcardSets[0]);
        } else {
          setFlashcardSets([]);
          setSelectedSet(null);
        }
      } catch (error) {
        console.error('Error loading flashcards:', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadFlashcards();
  }, []);

  // Format time
  const formatTime = (ms) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  // Direct load function
  const directLoadAndStartGame = async (setId) => {
    console.log(`QUIZ GAME - Direct loading cards for set: ${setId}`);
    
    // Find the set in our current sets
    const selectedSet = flashcardSets.find(set => set.id === setId);
    
    if (!selectedSet) {
      console.error(`Set with ID ${setId} not found`);
      toast({
        title: "שגיאה בטעינת המשחק",
        description: "לא ניתן למצוא את הסט המבוקש.",
        variant: "destructive",
      });
      return;
    }
    
    console.log("Selected set for direct loading:", selectedSet);
    
    try {
      // Instead of loading from API again, we already have the cards
      if (selectedSet.flashcards && selectedSet.flashcards.length > 0) {
        console.log(`QUIZ GAME - Using ${selectedSet.flashcards.length} flashcards from selected set`);
        // Start game with the cards we already have
        startGameWithCards(selectedSet.flashcards);
      } else {
        console.error("No flashcards in selected set");
        toast({
          title: "שגיאה בטעינת הקלפים",
          description: "מפעיל מצב דיבאג לפתרון זמני",
          variant: "warning",
        });
        
        // Use debug mode
        useDebugCards();
      }
    } catch (err) {
      console.error("Error direct loading cards:", err);
      toast({
        title: "שגיאה בטעינת הקלפים",
        description: "מפעיל מצב דיבאג לפתרון זמני",
        variant: "warning",
      });
      
      // Use debug mode
      useDebugCards();
    }
  };
  
  // Function to use debug cards
  const useDebugCards = () => {
    console.log("QUIZ GAME - Using debug cards");
    const debugCards = [
      { id: 'd1', question: "שאלת דוגמה 1", answer: "תשובה לדוגמה 1", incorrectAnswers: ["שגוי 1", "שגוי 2", "שגוי 3"] },
      { id: 'd2', question: "שאלת דוגמה 2", answer: "תשובה לדוגמה 2", incorrectAnswers: ["שגוי 1", "שגוי 2", "שגוי 3"] },
      { id: 'd3', question: "שאלת דוגמה 3", answer: "תשובה לדוגמה 3", incorrectAnswers: ["שגוי 1", "שגוי 2", "שגוי 3"] },
      { id: 'd4', question: "שאלת דוגמה 4", answer: "תשובה לדוגמה 4", incorrectAnswers: ["שגוי 1", "שגוי 2", "שגוי 3"] }
    ];
    
    startGameWithCards(debugCards);
  };
  
  // Function to create quiz questions from cards
  const startGameWithCards = (cards) => {
    console.log("QUIZ GAME - Starting game with cards:", cards);
    
    // Get up to 10 random cards
    const selectedCards = getRandomItems(cards, Math.min(cards.length, 10));
    
    // Create quiz questions
    const quizQuestions = selectedCards.map((card, index) => {
      let options = [];
      let incorrectAnswers = [];
      
      // Parse incorrect answers from the card
      if (card.wrongAnswers) {
        try {
          // Check if it's already an array
          if (Array.isArray(card.wrongAnswers)) {
            incorrectAnswers = card.wrongAnswers;
          }
          // If it's a string (JSON), parse it
          else if (typeof card.wrongAnswers === 'string') {
            incorrectAnswers = JSON.parse(card.wrongAnswers);
          }
        } catch (err) {
          console.error("Error parsing incorrect answers:", err);
        }
      }
      
      console.log(`Card ${index} - Incorrect answers:`, incorrectAnswers);
      
      // If the card has predefined incorrect answers, use those
      if (incorrectAnswers && Array.isArray(incorrectAnswers) && incorrectAnswers.length >= 3) {
        // Use the predefined incorrect answers
        options = shuffleArray([card.answer, ...incorrectAnswers.slice(0, 3)]);
        console.log(`Using predefined incorrect answers for card ${index}`);
      } else {
        // Fallback to getting random incorrect answers from other cards
        console.log(`Generating random incorrect answers for card ${index}`);
        const otherCards = selectedCards.filter((_, i) => i !== index);
        const randomIncorrectAnswers = getRandomItems(otherCards, 3).map(c => c.answer);
        options = shuffleArray([card.answer, ...randomIncorrectAnswers]);
      }
      
      return {
        id: index,
        question: card.question,
        options,
        correctAnswer: card.answer
      };
    });
    
    console.log("Created quiz questions:", quizQuestions);
    
    // Start the game
    setQuestions(quizQuestions);
    setCurrentQuestionIndex(0);
    setSelectedAnswer(null);
    setScore(0);
    setIsGameOver(false);
    setGameStarted(true);
  };

  // Replace current startGame function
  const startGame = (setId) => {
    console.log("QUIZ GAME - Starting game with set ID:", setId);
    // Use the direct loading approach
    directLoadAndStartGame(setId);
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
    setFeedback(isCorrect ? "נכון!" : "לא נכון");
    setTimeout(() => {
      if (currentQuestionIndex < questions.length - 1) {
        setCurrentQuestionIndex(currentQuestionIndex + 1);
        setSelectedAnswer(null);
        setFeedback(null);
      } else {
        // Game completed
        setIsGameOver(true);
        toast({
          title: "המשחק הסתיים!",
          description: `צברת ${score + (isCorrect ? 1 : 0)} נקודות מתוך ${questions.length}`,
        });
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
    setIsGameOver(false);
    setTimeLeft(30);
    setIsTimerRunning(true);
  };

  const getAnswerButtonClass = (answer) => {
    if (!feedback) {
      return selectedAnswer === answer 
        ? "bg-indigo-100 border-indigo-300" 
        : selectedAnswer === null ? "" : "";
    }
    
    const isCorrect = answer === questions[currentQuestionIndex].correctAnswer;
    if (selectedAnswer === answer) {
      return isCorrect ? "bg-green-100 border-green-300" : "bg-red-100 border-red-300";
    }
    
    return isCorrect ? "bg-green-50 border-green-200" : "";
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <div className="container mx-auto px-4 py-8">
        {!gameStarted ? (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div dir="rtl" className="flex items-center justify-between mb-6">
              <h1 className="text-3xl font-bold">אתגר החידון</h1>
              <Button variant="ghost" onClick={() => navigate('/games')} size="sm" className="flex items-center">
                <ArrowLeft className="h-4 w-4 ml-2" />
                חזרה למשחקים
              </Button>
            </div>

            <Card className="mb-8">
              <CardHeader className="flex flex-row items-center gap-2">
                <HelpCircle className="h-6 w-6 text-purple-500 ml-2" />
                <CardTitle>איך משחקים</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 mb-4" dir="rtl">
                  בחנו את הידע שלכם עם שאלות רב-ברירה המבוססות על הכרטיסיות שלכם. בחרו את התשובה הנכונה מבין האפשרויות.
                </p>
                <ul className="list-disc list-inside text-gray-600 space-y-1 pr-4 rtl:pl-0" dir="rtl">
                  <li>קראו את השאלה בעיון</li>
                  <li>בחרו את התשובה הנכונה מבין האפשרויות</li>
                  <li>נסו לענות על כמה שיותר תשובות נכונות</li>
                </ul>
              </CardContent>
            </Card>

            <h2 className="text-xl font-semibold mb-4 text-right" dir="rtl">בחרו סיכום</h2>
            
            {flashcardSets.length === 0 ? (
              <Card className="text-center py-8">
                <CardContent className="pt-6">
                  <p className="text-gray-600 mb-4" dir="rtl">
                    עליכם ליצור סיכום לפני שתוכלו לשחק במשחק החידון.
                  </p>
                  <Button onClick={() => navigate('/games')}>
                    חזרה למשחקים
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {flashcardSets.map((set) => (
                  <motion.div
                    key={set.id}
                    whileTap={{ scale: 0.98 }}
                    className={`bg-white rounded-lg border p-4 cursor-pointer hover:shadow-md transition-all ${
                      selectedSetId === set.id ? "ring-2 ring-purple-500 shadow-md" : ""
                    }`}
                    onClick={() => setSelectedSetId(set.id)}
                  >
                    <h3 className="font-semibold mb-2" dir="rtl">{set.title}</h3>
                    <p className="text-sm text-gray-500" dir="rtl">{set.flashcards?.length || 0} כרטיסים</p>
                  </motion.div>
                ))}
              </div>
            )}

            {selectedSetId && (
              <div className="mt-8 flex justify-center">
                <Button 
                  onClick={() => startGame(selectedSetId)}
                  className="bg-purple-600 hover:bg-purple-700 text-white"
                  size="lg"
                >
                  התחל משחק
                </Button>
              </div>
            )}
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="max-w-3xl mx-auto"
          >
            <div dir="rtl" className="flex items-center justify-between mb-6">
              <h1 className="text-2xl font-bold">אתגר החידון</h1>
              <Button variant="ghost" onClick={resetGame} size="sm" className="flex items-center">
                <ArrowLeft className="h-4 w-4 ml-2" />
                צא מהחידון
              </Button>
            </div>
            
            <div className="flex justify-start mb-4">
              <div className="flex items-center space-x-4 rtl:space-x-reverse">
                <Button variant="outline" size="sm" onClick={resetGame} className="mx-1">
                  <RefreshCw className="h-4 w-4 ml-1 rtl:mr-1 rtl:ml-0" />
                  איפוס
                </Button>
                <div className="bg-indigo-100 text-indigo-800 px-3 py-1 rounded-full text-sm font-medium mx-1">
                  ניקוד: {score}
                </div>
                <div className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm font-medium mx-1">
                  שאלה {currentQuestionIndex + 1} מתוך {questions.length}
                </div>
              </div>
            </div>

            <div className="flex flex-col items-center justify-center w-full">
              {questions.length > 0 && (
                <Card className="mb-6 shadow-md w-full max-w-4xl mx-auto">
                  <CardHeader className="pb-2">
                    <CardTitle dir="rtl" className="text-xl text-right">
                      שאלה
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="min-h-[100px] py-4">
                    <p dir="rtl" className="text-right text-gray-700 text-lg">
                      {questions[currentQuestionIndex].question}
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>

            <div className="space-y-3 w-full">
              {questions[currentQuestionIndex].options.map((option, index) => (
                <motion.button
                  key={index}
                  className={`w-full p-4 rounded-lg border transition-colors ${getAnswerButtonClass(option)}`}
                  dir="rtl"
                  onClick={() => handleAnswerSelect(option)}
                  disabled={selectedAnswer !== null}
                  whileTap={selectedAnswer === null ? { scale: 0.99 } : {}}
                >
                  <div className="flex flex-row-reverse justify-between items-center w-full">
                    <span className="text-right w-full">{option}</span>
                    {feedback && option === questions[currentQuestionIndex].correctAnswer && (
                      <Check className="h-5 w-5 text-green-500 ml-2 shrink-0" />
                    )}
                    {feedback && option !== questions[currentQuestionIndex].correctAnswer && selectedAnswer === option && (
                      <X className="h-5 w-5 text-red-500 ml-2 shrink-0" />
                    )}
                  </div>
                </motion.button>
              ))}
            </div>

            <Dialog open={isGameOver} onOpenChange={setIsGameOver}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>החידון הושלם!</DialogTitle>
                </DialogHeader>
                <div className="py-4 text-center">
                  <div className="mb-4 flex justify-center">
                    <div className="h-16 w-16 rounded-full bg-purple-100 flex items-center justify-center">
                      <Check className="h-8 w-8 text-purple-500" />
                    </div>
                  </div>
                  <p className="text-lg mb-2" dir="rtl">תוצאה סופית</p>
                  <div className="flex flex-row-reverse justify-center space-x-8 space-x-reverse mb-4">
                    <div className="text-center ml-8">
                      <p className="text-gray-500 text-sm">ניקוד</p>
                      <p className="text-xl font-bold">{score}/{questions.length}</p>
                    </div>
                  </div>
                  <p className="text-gray-600" dir="rtl">
                    {score === questions.length 
                      ? "מושלם! ענית נכון על כל השאלות!"
                      : score > questions.length / 2 
                        ? "עבודה טובה! המשך/י לתרגל כדי להשתפר."
                        : "המשך/י לתרגל כדי לשפר את התוצאות שלך."
                    }
                  </p>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={resetGame}>
                    שחק שוב
                  </Button>
                  <Button onClick={() => {
                    setIsGameOver(false);
                    navigate('/games');
                  }}>
                    חזרה למשחקים
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default QuizGame;
