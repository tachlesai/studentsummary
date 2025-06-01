
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { BookOpen, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useFlashcards } from '@/hooks/useFlashcards';
import FlashcardCreator from '@/components/FlashcardCreator';
import FlashcardSetCard from '@/components/FlashcardSetCard';
import Flashcard from '@/components/Flashcard';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/components/ui/use-toast';

const FlashcardsPage = () => {
  const { flashcardSets, saveFlashcardSet, deleteFlashcardSet } = useFlashcards();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSet, setSelectedSet] = useState(null);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [studyDialogOpen, setStudyDialogOpen] = useState(false);
  const { toast } = useToast();

  const filteredSets = flashcardSets.filter(set => 
    set.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    set.summary?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSaveFlashcards = (flashcardSet) => {
    saveFlashcardSet(flashcardSet);
  };

  const handleDeleteSet = (id) => {
    deleteFlashcardSet(id);
    toast({
      title: "Deleted",
      description: "Flashcard set has been deleted.",
    });
  };

  const handleViewSet = (set) => {
    setSelectedSet(set);
    setCurrentCardIndex(0);
    setStudyDialogOpen(true);
  };

  const handleNextCard = () => {
    if (currentCardIndex < selectedSet.cards.length - 1) {
      setCurrentCardIndex(currentCardIndex + 1);
    }
  };

  const handlePrevCard = () => {
    if (currentCardIndex > 0) {
      setCurrentCardIndex(currentCardIndex - 1);
    }
  };

  return (
    <div className="container mx-auto px-4">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-8"
      >
        <h1 className="text-3xl font-bold mb-2">Flashcards</h1>
        <p className="text-gray-600">
          Create and study flashcards to help you memorize important concepts.
        </p>
      </motion.div>

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search flashcard sets..."
            className="pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <FlashcardCreator onSaveFlashcards={handleSaveFlashcards} />
      </div>

      {flashcardSets.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="text-center py-16"
        >
          <div className="mb-4 flex justify-center">
            <div className="h-16 w-16 rounded-full bg-indigo-100 flex items-center justify-center">
              <BookOpen className="h-8 w-8 text-indigo-500" />
            </div>
          </div>
          <h2 className="text-xl font-semibold mb-2">No Flashcard Sets Yet</h2>
          <p className="text-gray-600 mb-6 max-w-md mx-auto">
            Create your first flashcard set to start studying. You can generate flashcards from your lecture summaries.
          </p>
          <FlashcardCreator onSaveFlashcards={handleSaveFlashcards} />
        </motion.div>
      ) : filteredSets.length === 0 ? (
        <div className="text-center py-16">
          <h2 className="text-xl font-semibold mb-2">No Results Found</h2>
          <p className="text-gray-600">
            No flashcard sets match your search. Try a different search term.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredSets.map((set) => (
            <FlashcardSetCard
              key={set.id}
              flashcardSet={set}
              onView={handleViewSet}
              onDelete={handleDeleteSet}
            />
          ))}
        </div>
      )}

      <Dialog open={studyDialogOpen} onOpenChange={setStudyDialogOpen}>
        <DialogContent className="sm:max-w-4xl">
          <DialogHeader>
            <DialogTitle>{selectedSet?.title}</DialogTitle>
          </DialogHeader>
          {selectedSet && (
            <Flashcard
              card={selectedSet.cards[currentCardIndex]}
              onNext={handleNextCard}
              onPrev={handlePrevCard}
              currentIndex={currentCardIndex}
              totalCards={selectedSet.cards.length}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default FlashcardsPage;
