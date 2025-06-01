
import React from 'react';
import { motion } from 'framer-motion';
import { BookOpen, Clock, Trash2 } from 'lucide-react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { formatDate } from '@/lib/utils';

const FlashcardSetCard = ({ flashcardSet, onView, onDelete }) => {
  const { title, summary, cards, createdAt } = flashcardSet;
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      whileHover={{ y: -5 }}
      className="h-full"
    >
      <Card className="h-full flex flex-col border-2 hover:border-indigo-300 transition-colors">
        <CardHeader className="pb-2">
          <div className="flex justify-between items-start">
            <CardTitle className="text-xl">{title}</CardTitle>
            <div className="flex items-center text-sm text-muted-foreground">
              <Clock className="h-3 w-3 mr-1" />
              <span>{formatDate(createdAt)}</span>
            </div>
          </div>
        </CardHeader>
        <CardContent className="flex-1">
          <div className="flex items-center mb-2 text-indigo-600">
            <BookOpen className="h-4 w-4 mr-1" />
            <span className="text-sm font-medium">{cards.length} cards</span>
          </div>
          {summary && (
            <p className="text-sm text-muted-foreground line-clamp-3">
              {summary}
            </p>
          )}
        </CardContent>
        <CardFooter className="flex justify-between pt-2 border-t">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => onDelete(flashcardSet.id)}
            className="text-destructive hover:text-destructive hover:bg-destructive/10"
          >
            <Trash2 className="h-4 w-4 mr-1" />
            Delete
          </Button>
          <Button 
            onClick={() => onView(flashcardSet)}
            className="bg-indigo-500 hover:bg-indigo-600"
          >
            Study Now
          </Button>
        </CardFooter>
      </Card>
    </motion.div>
  );
};

export default FlashcardSetCard;
