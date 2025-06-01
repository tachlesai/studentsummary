import React from 'react';
import { motion } from 'framer-motion';
import { Puzzle } from 'lucide-react';

const MemoryCardItem = ({ card, isFlipped, isMatched, onClick }) => {
  const cardVariants = {
    flipped: { rotateY: 180 },
    unflipped: { rotateY: 0 }
  };

  return (
    <div 
      className="aspect-[3/2] cursor-pointer memory-card" 
      onClick={onClick}
      style={{ perspective: "1000px" }}
    >
      <motion.div
        className="relative w-full h-full"
        style={{ transformStyle: "preserve-3d" }}
        variants={cardVariants}
        animate={isFlipped || isMatched ? "flipped" : "unflipped"}
        transition={{ duration: 0.6 }}
      >
        <div 
          className="absolute w-full h-full rounded-lg bg-indigo-500 flex items-center justify-center p-4 text-white font-medium"
          style={{ backfaceVisibility: "hidden", WebkitBackfaceVisibility: "hidden" }}
        >
          <Puzzle className="h-8 w-8" />
        </div>
        <div 
          className={`absolute w-full h-full rounded-lg border p-4 flex items-center justify-center text-center ${
            card.type === 'question' ? 'bg-blue-50' : 'bg-purple-50'
          }`}
          style={{ backfaceVisibility: "hidden", WebkitBackfaceVisibility: "hidden", transform: "rotateY(180deg)" }}
        >
          <p className="text-sm">{card.content}</p>
        </div>
      </motion.div>
    </div>
  );
};

export default MemoryCardItem;