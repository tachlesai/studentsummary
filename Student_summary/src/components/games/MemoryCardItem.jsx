import React from 'react';
import { motion } from 'framer-motion';
import { Brain, HelpCircle } from 'lucide-react';

const MemoryCardItem = ({ card, isFlipped, isMatched, onClick }) => {
  return (
    <motion.div
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className="relative aspect-square h-full w-full cursor-pointer"
    >
      <motion.div
        initial={false}
        animate={{
          rotateY: isFlipped ? 180 : 0,
          scale: isMatched ? 0.95 : 1,
        }}
        transition={{ duration: 0.3 }}
        className="w-full h-full"
        style={{ transformStyle: 'preserve-3d' }}
      >
        {/* Front of card */}
        <motion.div
          className={`absolute w-full h-full backface-hidden ${
            isFlipped ? 'opacity-0' : 'opacity-100'
          }`}
          style={{ backfaceVisibility: 'hidden' }}
        >
          <div className="w-full h-full bg-gradient-to-br from-indigo-500 to-indigo-600 text-white rounded-xl flex items-center justify-center p-4 shadow-lg transition-shadow">
            <div className="text-center">
              <div className="mb-4">
                {card.type === 'question' ? (
                  <HelpCircle className="h-12 w-12 mx-auto" />
                ) : (
                  <Brain className="h-12 w-12 mx-auto" />
                )}
              </div>
              <div className="text-lg font-medium" dir="rtl">
                {card.type === 'question' ? 'שאלה' : 'תשובה'}
              </div>
            </div>
          </div>
        </motion.div>

        {/* Back of card */}
        <motion.div
          className={`absolute w-full h-full backface-hidden ${
            isFlipped ? 'opacity-100' : 'opacity-0'
          }`}
          style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
        >
          <div className={`w-full h-full overflow-auto rounded-xl flex items-center justify-center p-0 shadow-lg ${
            isMatched 
              ? 'bg-gradient-to-br from-green-500 to-green-600 text-white' 
              : 'bg-white text-gray-800 border'
          }`}>
            <div className="w-full h-full p-5 flex items-center justify-center">
              <div className="text-md font-medium text-right overflow-y-auto max-h-[100%] w-full" dir="rtl">
                {card.content}
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </motion.div>
  );
};

export default MemoryCardItem;