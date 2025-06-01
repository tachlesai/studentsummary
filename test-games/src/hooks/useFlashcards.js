
import { useState, useEffect } from 'react';
import { getFromLocalStorage, saveToLocalStorage } from '@/lib/utils';

const STORAGE_KEY = 'flashcard-sets';

export function useFlashcards() {
  const [flashcardSets, setFlashcardSets] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Load flashcard sets from localStorage
    const storedSets = getFromLocalStorage(STORAGE_KEY, []);
    setFlashcardSets(storedSets);
    setLoading(false);
  }, []);

  const saveFlashcardSet = (flashcardSet) => {
    const updatedSets = [flashcardSet, ...flashcardSets];
    setFlashcardSets(updatedSets);
    saveToLocalStorage(STORAGE_KEY, updatedSets);
    return flashcardSet;
  };

  const deleteFlashcardSet = (id) => {
    const updatedSets = flashcardSets.filter(set => set.id !== id);
    setFlashcardSets(updatedSets);
    saveToLocalStorage(STORAGE_KEY, updatedSets);
  };

  const getFlashcardSet = (id) => {
    return flashcardSets.find(set => set.id === id) || null;
  };

  return {
    flashcardSets,
    loading,
    saveFlashcardSet,
    deleteFlashcardSet,
    getFlashcardSet
  };
}
