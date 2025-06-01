import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Check, Clock, Puzzle, RefreshCw } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '../../components/ui/button';
import { useToast } from '../../components/ui/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../../components/ui/dialog';
import { getRandomItems, shuffleArray } from '../../lib/utils';
import MatchingGameSetup from '../../components/games/MatchingGameSetup';
import MemoryCardItem from '../../components/games/MemoryCardItem';

const MatchingGame = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [flashcardSets, setFlashcardSets] = useState([]);
  const [selectedSetId, setSelectedSetId] = useState(null);
  const [gameStarted, setGameStarted] = useState(false);
  const [cards, setCards] = useState([]);
  const [flippedCards, setFlippedCards] = useState([]);
  const [matchedPairs, setMatchedPairs] = useState([]);
  const [moves, setMoves] = useState(0);
  const [gameCompleted, setGameCompleted] = useState(false);
  const [timer, setTimer] = useState(0);
  const [timerInterval, setTimerInterval] = useState(null);
  const [loading, setLoading] = useState(false);
  const debugMode = true;

  // Directly fetch flashcards when component mounts
  useEffect(() => {
    const fetchAllFlashcards = async () => {
      try {
        setLoading(true);
        console.log("MATCHING GAME - Directly fetching all flashcards");
        
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
    if (gameStarted && cards.length > 0 && matchedPairs.length === cards.length / 2) {
      setGameCompleted(true);
      if (timerInterval) {
        clearInterval(timerInterval);
      }
      toast({
        title: "כל הכבוד!",
        description: `השלמת את המשחק ב-${moves} מהלכים ובזמן של ${formatTime(timer)}!`,
      });
    }
  }, [matchedPairs, cards.length, moves, timer, timerInterval, toast, gameStarted]);

  const startGame = useCallback((setId) => {
    const selectedSet = flashcardSets.find(set => set.id === setId);
    if (debugMode && (!selectedSet || selectedSet.flashcards.length < 4)) {
      const debugCards = [
        { id: 'd1', question: "שאלת דוגמה 1", answer: "תשובה לדוגמה 1" },
        { id: 'd2', question: "שאלת דוגמה 2", answer: "תשובה לדוגמה 2" },
        { id: 'd3', question: "שאלת דוגמה 3", answer: "תשובה לדוגמה 3" },
        { id: 'd4', question: "שאלת דוגמה 4", answer: "תשובה לדוגמה 4" },
        { id: 'd5', question: "שאלת דוגמה 5", answer: "תשובה לדוגמה 5" }
      ];
      
      toast({
        title: "מצב דיבאג",
        description: "אין מספיק כרטיסים אמיתיים, משתמש בנתוני דיבאג.",
        variant: "warning",
      });
      
      selectedSet = {
        id: 'debug-set',
        title: 'Debug Matching Set',
        flashcards: debugCards
      };
    }

    if (!selectedSet || selectedSet.flashcards.length < 2) { // Ensure at least 2 cards for 1 pair
      toast({
        title: "אין מספיק כרטיסים",
        description: "צריך לפחות 2 כרטיסים (זוג אחד) בסט כדי לשחק במשחק ההתאמה.",
        variant: "destructive",
      });
      return;
    }

    // Ensure we take an even number of cards for pairs, max 12 cards (6 pairs)
    const numPairsToTake = Math.min(Math.floor(selectedSet.flashcards.length), 6);
    if (numPairsToTake < 1) {
       toast({
        title: "אין מספיק כרטיסים",
        description: "צריך לפחות זוג אחד של כרטיסים כדי לשחק.",
        variant: "destructive",
      });
      return;
    }
    const selectedRawCards = getRandomItems(selectedSet.flashcards, numPairsToTake);
    
    const gamePairs = [];
    selectedRawCards.forEach((card, index) => {
      gamePairs.push({
        id: `q-${card.id || index}`,
        content: card.question,
        pairId: card.id || index,
        type: 'question'
      });
      gamePairs.push({
        id: `a-${card.id || index}`,
        content: card.answer,
        pairId: card.id || index,
        type: 'answer'
      });
    });

    setCards(shuffleArray(gamePairs));
    setFlippedCards([]);
    setMatchedPairs([]);
    setMoves(0);
    setTimer(0);
    setGameStarted(true);
    setGameCompleted(false);
    
    const interval = setInterval(() => {
      setTimer(prev => prev + 1);
    }, 1000);
    setTimerInterval(interval);
  }, [flashcardSets, toast, debugMode]);

  const handleCardClick = useCallback((index) => {
    if (cards.length === 0 || !cards[index]) return;

    const currentCard = cards[index];
    if (
      flippedCards.length === 2 ||
      flippedCards.includes(index) ||
      matchedPairs.includes(currentCard.pairId)
    ) {
      return;
    }

    const newFlippedCards = [...flippedCards, index];
    setFlippedCards(newFlippedCards);

    if (newFlippedCards.length === 2) {
      setMoves(prevMoves => prevMoves + 1);
      const firstFlippedCard = cards[newFlippedCards[0]];
      const secondFlippedCard = cards[newFlippedCards[1]];

      if (firstFlippedCard.pairId === secondFlippedCard.pairId) {
        setMatchedPairs(prevMatched => [...prevMatched, firstFlippedCard.pairId]);
        setFlippedCards([]);
      } else {
        setTimeout(() => {
          setFlippedCards([]);
        }, 1000);
      }
    }
  }, [flippedCards, matchedPairs, cards]);

  const resetGame = useCallback(() => {
    if (timerInterval) {
      clearInterval(timerInterval);
    }
    setSelectedSetId(null);
    setGameStarted(false);
    setCards([]);
    setFlippedCards([]);
    setMatchedPairs([]);
    setMoves(0);
    setTimer(0);
    setGameCompleted(false);
  }, [timerInterval]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  if (!gameStarted) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
        <div className="container mx-auto px-4 py-8 flex flex-col min-h-[85vh]">
          <div dir="rtl" className="flex items-center justify-between mb-6">
            <h1 className="text-3xl font-bold">משחק התאמה</h1>
            <Link to="/games">
              <Button variant="ghost" size="sm" className="flex items-center">
                <ArrowLeft className="h-4 w-4 ml-2" />
                חזרה למשחקים
              </Button>
            </Link>
          </div>

          <div className="bg-white rounded-lg border p-6 mb-8">
            <div className="flex items-center mb-4">
              <Puzzle className="h-6 w-6 text-indigo-500 ml-2" />
              <h2 className="text-xl font-semibold">איך משחקים</h2>
            </div>
            <p className="text-gray-600 mb-4" dir="rtl">
              בחנו את הזיכרון שלכם על ידי התאמת שאלות לתשובות המתאימות. הפכו כרטיסים כדי לחשוף את תוכנם ומצאו את כל הזוגות המתאימים.
            </p>
            <ul className="list-disc list-inside text-gray-600 mb-6 pr-4 rtl:pl-0" dir="rtl">
              <li>לחצו על כרטיסים כדי להפוך אותם</li>
              <li>מצאו זוגות מתאימים של שאלה-תשובה</li>
              <li>השלימו את המשחק במספר המהלכים הנמוך ביותר</li>
            </ul>
          </div>

          <h2 className="text-xl font-semibold mb-4 text-right" dir="rtl">בחרו סיכום</h2>
          
          {flashcardSets.length === 0 ? (
            <div className="text-center py-8 bg-white rounded-lg border">
              <p className="text-gray-600 mb-4" dir="rtl">
                עליכם ליצור סיכום לפני שתוכלו לשחק במשחק ההתאמה.
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
                  whileTap={{ scale: 0.98 }}
                  className={`bg-white rounded-lg border p-4 cursor-pointer hover:shadow-md transition-all ${selectedSetId === set.id ? "ring-2 ring-indigo-500 shadow-md" : ""}`}
                  onClick={() => setSelectedSetId(set.id)}
                >
                  <h3 className="font-semibold mb-2 text-right" dir="rtl">{set.title}</h3>
                  <p className="text-sm text-gray-500 text-right" dir="rtl">{set.flashcards?.length || 0} כרטיסים</p>
                </motion.div>
              ))}
            </div>
          )}

          {selectedSetId && (
            <div className="mt-8 flex justify-center">
              <Button 
                onClick={() => startGame(selectedSetId)}
                className="bg-indigo-600 hover:bg-indigo-700 text-white"
                size="lg"
              >
                התחל משחק
              </Button>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <div className="container mx-auto px-4 py-8 flex flex-col min-h-[85vh]">
        <div dir="rtl" className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">משחק התאמה</h1>
          <Button variant="ghost" onClick={resetGame} size="sm" className="flex items-center">
            <ArrowLeft className="h-4 w-4 ml-2" />
            יציאה מהמשחק
          </Button>
        </div>
        
        <div className="flex justify-start mb-4">
          <div className="flex items-center space-x-4 rtl:space-x-reverse">
            <Button variant="outline" size="sm" onClick={resetGame} className="mx-1">
              <RefreshCw className="h-4 w-4 ml-1" />
              איפוס
            </Button>
            <div className="flex items-center bg-indigo-50 text-indigo-700 px-3 py-1 rounded-full mx-1">
              <Puzzle className="h-4 w-4 ml-1" />
              <span>{moves} מהלכים</span>
            </div>
            <div className="flex items-center bg-indigo-50 text-indigo-700 px-3 py-1 rounded-full mx-1">
              <Clock className="h-4 w-4 ml-1" />
              <span>{formatTime(timer)}</span>
            </div>
          </div>
        </div>

        <div className="flex-grow w-full flex items-center justify-center py-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 w-full max-w-6xl h-full">
            {cards.map((card, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ 
                  opacity: 1, 
                  scale: 1, 
                  transition: { delay: index * 0.05 } 
                }}
                className="w-full aspect-square min-h-[150px] h-full"
              >
                <MemoryCardItem
                  card={card}
                  isFlipped={flippedCards.includes(index) || matchedPairs.includes(card.pairId)}
                  isMatched={matchedPairs.includes(card.pairId)}
                  onClick={() => handleCardClick(index)}
                />
              </motion.div>
            ))}
          </div>
        </div>

        <Dialog open={gameCompleted} onOpenChange={(isOpen) => { if(!isOpen) resetGame(); }}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="text-center">כל הכבוד!</DialogTitle>
            </DialogHeader>
            <div className="py-4 text-center">
              <div className="mb-4 flex justify-center">
                <div className="h-16 w-16 rounded-full bg-indigo-100 flex items-center justify-center">
                  <Puzzle className="h-8 w-8 text-indigo-500" />
                </div>
              </div>
              <p className="text-lg mb-2" dir="rtl">השלמת את משחק ההתאמה!</p>
              <div className="flex flex-row-reverse justify-center mb-4 gap-8">
                <div className="text-center">
                  <p className="text-gray-500 text-sm">זמן</p>
                  <p className="text-xl font-bold">{formatTime(timer)}</p>
                </div>
                <div className="text-center">
                  <p className="text-gray-500 text-sm">מהלכים</p>
                  <p className="text-xl font-bold">{moves}</p>
                </div>
              </div>
              <p className="text-gray-600" dir="rtl">
                {moves <= cards.length / 2 + 3
                  ? "מעולה! זיכרון מצוין!"
                  : moves <= cards.length
                    ? "כל הכבוד! תוצאה טובה!"
                    : "המשך לתרגל כדי לשפר עוד!"
                }
              </p>
            </div>
            <DialogFooter className="flex flex-row-reverse">
              <Button onClick={resetGame}>שחק שוב</Button>
              <Button variant="outline" onClick={() => {
                resetGame();
                navigate('/games');
              }}>
                חזרה למשחקים
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default MatchingGame;