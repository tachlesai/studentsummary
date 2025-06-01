
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, ArrowRight, RotateCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const Flashcard = ({ card, onNext, onPrev, currentIndex, totalCards }) => {
  const [isFlipped, setIsFlipped] = useState(false);

  const handleFlip = () => {
    setIsFlipped(!isFlipped);
  };

  const handleNext = () => {
    setIsFlipped(false);
    onNext();
  };

  const handlePrev = () => {
    setIsFlipped(false);
    onPrev();
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div 
        className={cn("flashcard w-full aspect-[3/2] cursor-pointer", 
          isFlipped ? "flipped" : ""
        )}
        onClick={handleFlip}
      >
        <div className="flashcard-inner w-full h-full">
          <motion.div 
            className="flashcard-front absolute w-full h-full rounded-xl bg-white shadow-lg border overflow-hidden flex flex-col"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            <div className="gradient-bg h-2 w-full"></div>
            <div className="flex-1 p-8 flex flex-col justify-center items-center card-pattern">
              <h3 className="text-2xl font-bold text-center mb-4">Question</h3>
              <p className="text-xl text-center">{card.question}</p>
            </div>
            <div className="p-4 bg-gray-50 border-t flex justify-center items-center">
              <Button 
                variant="ghost" 
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  handleFlip();
                }}
                className="text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50"
              >
                <RotateCw className="h-4 w-4 mr-2" />
                Flip to see answer
              </Button>
            </div>
          </motion.div>
          
          <motion.div 
            className="flashcard-back absolute w-full h-full rounded-xl bg-white shadow-lg border overflow-hidden flex flex-col"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            <div className="gradient-bg h-2 w-full"></div>
            <div className="flex-1 p-8 flex flex-col justify-center items-center card-pattern">
              <h3 className="text-2xl font-bold text-center mb-4">Answer</h3>
              <p className="text-xl text-center">{card.answer}</p>
            </div>
            <div className="p-4 bg-gray-50 border-t flex justify-center items-center">
              <Button 
                variant="ghost" 
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  handleFlip();
                }}
                className="text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50"
              >
                <RotateCw className="h-4 w-4 mr-2" />
                Flip to see question
              </Button>
            </div>
          </motion.div>
        </div>
      </div>
      
      <div className="mt-6 flex justify-between items-center">
        <Button 
          onClick={handlePrev} 
          disabled={currentIndex === 0}
          variant="outline"
          className="flex items-center"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Previous
        </Button>
        
        <span className="text-sm font-medium text-gray-500">
          {currentIndex + 1} of {totalCards}
        </span>
        
        <Button 
          onClick={handleNext} 
          disabled={currentIndex === totalCards - 1}
          className="bg-indigo-500 hover:bg-indigo-600 flex items-center"
        >
          Next
          <ArrowRight className="h-4 w-4 ml-2" />
        </Button>
      </div>
    </div>
  );
};

export default Flashcard;
