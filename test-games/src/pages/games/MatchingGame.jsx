import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Check, Clock, Puzzle, RefreshCw } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useFlashcards } from '@/hooks/useFlashcards';
import { useToast } from '@/components/ui/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { getRandomItems, shuffleArray } from '@/lib/utils';
import MatchingGameSetup from '@/components/games/MatchingGameSetup';
import MemoryCardItem from '@/components/games/MemoryCardItem';

const MatchingGame = () => {
  const { flashcardSets } = useFlashcards();
  const { toast } = useToast();
  const [selectedSetId, setSelectedSetId] = useState(null);
  const [gameStarted, setGameStarted] = useState(false);
  const [cards, setCards] = useState([]);
  const [flippedIndices, setFlippedIndices] = useState([]);
  const [matchedPairIds, setMatchedPairIds] = useState([]);
  const [moves, setMoves] = useState(0);
  const [gameCompleted, setGameCompleted] = useState(false);
  const [timer, setTimer] = useState(0);
  const [timerInterval, setTimerInterval] = useState(null);

  useEffect(() => {
    return () => {
      if (timerInterval) {
        clearInterval(timerInterval);
      }
    };
  }, [timerInterval]);

  useEffect(() => {
    if (gameStarted && cards.length > 0 && matchedPairIds.length === cards.length / 2) {
      setGameCompleted(true);
      if (timerInterval) {
        clearInterval(timerInterval);
      }
      toast({
        title: "Congratulations!",
        description: `You completed the game in ${moves} moves and ${formatTime(timer)}!`,
      });
    }
  }, [matchedPairIds, cards.length, moves, timer, timerInterval, toast, gameStarted]);

  const startGame = useCallback((setId) => {
    const selectedSet = flashcardSets.find(set => set.id === setId);
    if (!selectedSet || selectedSet.cards.length < 2) { // Ensure at least 2 cards for 1 pair
      toast({
        title: "Not Enough Cards",
        description: "You need at least 2 cards (1 pair) in a set to play the matching game.",
        variant: "destructive",
      });
      return;
    }

    // Ensure we take an even number of cards for pairs, max 12 cards (6 pairs)
    const numPairsToTake = Math.min(Math.floor(selectedSet.cards.length), 6);
    if (numPairsToTake < 1) {
       toast({
        title: "Not Enough Cards",
        description: "You need at least 1 pair of cards to play.",
        variant: "destructive",
      });
      return;
    }
    const selectedRawCards = getRandomItems(selectedSet.cards, numPairsToTake);
    
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
    setFlippedIndices([]);
    setMatchedPairIds([]);
    setMoves(0);
    setTimer(0);
    setGameStarted(true);
    setGameCompleted(false);
    
    const interval = setInterval(() => {
      setTimer(prev => prev + 1);
    }, 1000);
    setTimerInterval(interval);
  }, [flashcardSets, toast]);

  const handleCardClick = useCallback((index) => {
    if (cards.length === 0 || !cards[index]) return;

    const currentCard = cards[index];
    if (
      flippedIndices.length === 2 ||
      flippedIndices.includes(index) ||
      matchedPairIds.includes(currentCard.pairId)
    ) {
      return;
    }

    const newFlippedIndices = [...flippedIndices, index];
    setFlippedIndices(newFlippedIndices);

    if (newFlippedIndices.length === 2) {
      setMoves(prevMoves => prevMoves + 1);
      const firstFlippedCard = cards[newFlippedIndices[0]];
      const secondFlippedCard = cards[newFlippedIndices[1]];

      if (firstFlippedCard.pairId === secondFlippedCard.pairId) {
        setMatchedPairIds(prevMatched => [...prevMatched, firstFlippedCard.pairId]);
        setFlippedIndices([]);
      } else {
        setTimeout(() => {
          setFlippedIndices([]);
        }, 1000);
      }
    }
  }, [flippedIndices, matchedPairIds, cards]);

  const resetGame = useCallback(() => {
    if (timerInterval) {
      clearInterval(timerInterval);
    }
    setSelectedSetId(null);
    setGameStarted(false);
    setCards([]);
    setFlippedIndices([]);
    setMatchedPairIds([]);
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
      <MatchingGameSetup 
        flashcardSets={flashcardSets}
        selectedSetId={selectedSetId}
        setSelectedSetId={setSelectedSetId}
        startGame={startGame}
      />
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <div className="flex items-center mb-4 md:mb-0">
          <Button variant="ghost" onClick={resetGame} className="mr-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Exit Game
          </Button>
          <h1 className="text-2xl font-bold">Matching Game</h1>
        </div>
        <div className="flex items-center space-x-4">
          <div className="flex items-center">
            <Clock className="h-4 w-4 mr-1 text-gray-500" />
            <span className="text-gray-700">{formatTime(timer)}</span>
          </div>
          <div className="flex items-center">
            <Puzzle className="h-4 w-4 mr-1 text-gray-500" />
            <span className="text-gray-700">{moves} Moves</span>
          </div>
          <Button variant="outline" size="sm" onClick={resetGame}>
            <RefreshCw className="h-4 w-4 mr-1" />
            Reset
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 mb-8">
        {cards.map((card, index) => (
          <MemoryCardItem
            key={card.id}
            card={card}
            isFlipped={flippedIndices.includes(index)}
            isMatched={matchedPairIds.includes(card.pairId)}
            onClick={() => handleCardClick(index)}
          />
        ))}
      </div>

      <Dialog open={gameCompleted} onOpenChange={(isOpen) => { if(!isOpen) resetGame(); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Congratulations!</DialogTitle>
          </DialogHeader>
          <div className="py-4 text-center">
            <div className="mb-4 flex justify-center">
              <div className="h-16 w-16 rounded-full bg-green-100 flex items-center justify-center">
                <Check className="h-8 w-8 text-green-500" />
              </div>
            </div>
            <p className="text-lg mb-2">You completed the matching game!</p>
            <div className="flex justify-center space-x-8 mb-4">
              <div className="text-center">
                <p className="text-gray-500 text-sm">Time</p>
                <p className="text-xl font-bold">{formatTime(timer)}</p>
              </div>
              <div className="text-center">
                <p className="text-gray-500 text-sm">Moves</p>
                <p className="text-xl font-bold">{moves}</p>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={resetGame}>
              Play Again
            </Button>
            <Link to="/games">
              <Button onClick={() => {setGameCompleted(false); resetGame();}}>Back to Games</Button>
            </Link>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MatchingGame;