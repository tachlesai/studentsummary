import { useState, useEffect } from 'react';
import API_BASE_URL from '../config';

export const useFlashcards = () => {
  const [flashcardSets, setFlashcardSets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Fetch all flashcard sets for the user
  const fetchFlashcardSets = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setLoading(false);
        return;
      }
      
      // Simple approach - use the EXACT same pattern as the working summaries endpoint
      const response = await fetch(`${API_BASE_URL}/flashcard-sets`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      const data = await response.json();
      
      if (!data.success) {
        throw new Error('Failed to fetch flashcard sets');
      }
      
      console.log('Raw flashcard sets data:', data.flashcardSets);
      
      // Format exactly like summaries approach
      const formattedSets = data.flashcardSets.map(set => ({
        id: String(set.id), 
        title: set.title || 'Unnamed Set',
        createdAt: set.created_at,
        summaryId: String(set.summary_id),
        flashcards: []
      }));
      
      setFlashcardSets(formattedSets);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching flashcard sets:', err);
      setError('Failed to fetch flashcard sets');
      setLoading(false);
      
      // USE HARD-CODED TEST SET FOR DEBUGGING
      const testSets = [
        {
          id: '1',
          title: 'Debug Test Set 1',
          createdAt: new Date().toISOString(),
          summaryId: '109',
          flashcards: []
        },
        {
          id: '2',
          title: 'Debug Test Set 2',
          createdAt: new Date().toISOString(), 
          summaryId: '110',
          flashcards: []
        }
      ];
      
      setFlashcardSets(testSets);
    }
  };
  
  // Fetch flashcards for a specific summary
  const fetchFlashcardsForSummary = async (summaryId) => {
    setLoading(true);
    setError(null);
    
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setLoading(false);
        return null;
      }
      
      console.log(`Fetching flashcards for summary ${summaryId}`);
      
      // Use the EXACT same pattern as summaries endpoint
      const response = await fetch(`${API_BASE_URL}/flashcards/by-summary/${summaryId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      const data = await response.json();
      console.log('Flashcards API response:', data);
      
      if (!data.success || !data.flashcardSet) {
        throw new Error('No flashcard data found');
      }
      
      // Simple direct conversion, no fancy mapping
      const formattedSet = {
        id: String(data.flashcardSet.id),
        title: data.flashcardSet.title || 'Unnamed Set',
        createdAt: data.flashcardSet.created_at,
        summaryId: String(summaryId),
        flashcards: data.flashcardSet.flashcards.map(card => ({
          id: String(card.id),
          question: card.question,
          answer: card.answer,
          incorrectAnswers: card.incorrectAnswers 
        }))
      };
      
      // Update our state in a simple way
      setFlashcardSets(prev => {
        const existing = prev.find(set => set.id === formattedSet.id);
        if (existing) {
          return prev.map(set => set.id === formattedSet.id ? formattedSet : set);
        } else {
          return [...prev, formattedSet];
        }
      });
      
      setLoading(false);
      return formattedSet;
    } catch (err) {
      console.error('Error fetching flashcards for summary:', err);
      setError('Failed to fetch flashcards');
      setLoading(false);
      
      // FOR DEBUGGING - Return hardcoded debug cards
      const debugSet = {
        id: `debug-${Date.now()}`,
        title: 'Debug Flashcard Set',
        createdAt: new Date().toISOString(),
        summaryId: summaryId,
        flashcards: [
          { id: 'd1', question: 'שאלת דוגמה 1', answer: 'תשובה לדוגמה 1', incorrectAnswers: ['שגוי 1', 'שגוי 2', 'שגוי 3'] },
          { id: 'd2', question: 'שאלת דוגמה 2', answer: 'תשובה לדוגמה 2', incorrectAnswers: ['שגוי 1', 'שגוי 2', 'שגוי 3'] },
          { id: 'd3', question: 'שאלת דוגמה 3', answer: 'תשובה לדוגמה 3', incorrectAnswers: ['שגוי 1', 'שגוי 2', 'שגוי 3'] },
          { id: 'd4', question: 'שאלת דוגמה 4', answer: 'תשובה לדוגמה 4', incorrectAnswers: ['שגוי 1', 'שגוי 2', 'שגוי 3'] }
        ]
      };
      
      return debugSet;
    }
  };
  
  // Generate flashcards from summary content (now just checks if exists and fetches)
  const generateFlashcardsFromSummary = async (summaryContent, title) => {
    setLoading(true);
    setError(null);
    
    try {
      // Check if there's a summary ID in localStorage
      const gameSourceSummary = localStorage.getItem('gameSourceSummary');
      if (gameSourceSummary) {
        try {
          const { summaryId } = JSON.parse(gameSourceSummary);
          if (summaryId) {
            // If we have a summary ID, fetch flashcards for it
            const set = await fetchFlashcardsForSummary(summaryId);
            if (set) {
              setLoading(false);
              // Remove the source info
              localStorage.removeItem('gameSourceSummary');
              return set;
            }
          }
        } catch (err) {
          console.error('Error parsing game source summary:', err);
        }
      }
      
      // If we don't have a summary ID, fall back to generating new flashcards
      // This shouldn't happen, but as a fallback use the old API endpoint
      setLoading(true);
      
      const response = await fetch(`${API_BASE_URL}/generate-flashcards`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: summaryContent,
          title: title
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to generate flashcards');
      }
      
      const data = await response.json();
      
      if (!data.success || !data.flashcards || !Array.isArray(data.flashcards)) {
        throw new Error('Invalid flashcard data received');
      }
      
      // Create a new flashcard set with the generated cards
      const newSet = {
        id: `local-${Date.now()}`,
        title: title || 'Flashcards from Summary',
        createdAt: new Date().toISOString(),
        flashcards: data.flashcards.map((card, index) => ({
          id: `gemini-${index + 1}`,
          question: card.question,
          answer: card.answer
        }))
      };
      
      // Add to existing sets
      setFlashcardSets(prev => [...prev, newSet]);
      setLoading(false);
      
      return newSet;
    } catch (err) {
      console.error('Error generating flashcards:', err);
      
      // Fallback to basic algorithm if API fails
      console.log('Falling back to basic algorithm for flashcard generation');
      return generateBasicFlashcards(summaryContent, title);
    }
  };
  
  // Basic algorithm as fallback
  const generateBasicFlashcards = (summaryContent, title) => {
    try {
      // Basic algorithm to generate Q&A pairs from paragraphs
      const paragraphs = summaryContent.split('\n\n').filter(p => p.trim().length > 10);
      
      // Generate a simple set of flashcards
      const generatedFlashcards = paragraphs.map((paragraph, index) => {
        // Extract a question from the paragraph
        const sentenceEndChars = ['.', '?', '!'];
        let firstSentence = '';
        
        // Find the first sentence
        for (let i = 0; i < paragraph.length; i++) {
          firstSentence += paragraph[i];
          if (sentenceEndChars.includes(paragraph[i]) && i < paragraph.length - 2) {
            break;
          }
        }
        
        // Create a question from the first sentence
        let question = '';
        if (firstSentence.includes('?')) {
          // If it's already a question, use it directly
          question = firstSentence.trim();
        } else {
          // Get the main subject from the sentence
          const words = firstSentence.split(' ');
          if (words.length > 3) {
            // Replace a key word with blank or create a "what is" question
            const keyWordIndex = Math.floor(words.length / 2);
            const keyWord = words[keyWordIndex];
            words[keyWordIndex] = '___';
            question = words.join(' ');
          } else {
            question = `מה הקשר בין ${words.join(' ו')}?`;
          }
        }
        
        return {
          id: `auto-${index + 1}`,
          question: question,
          answer: paragraph
        };
      });
      
      // Create a new flashcard set
      const newSet = {
        id: `local-${Date.now()}`,
        title: title || 'Flashcards from Summary',
        createdAt: new Date().toISOString(),
        flashcards: generatedFlashcards
      };
      
      // Add to existing sets
      setFlashcardSets(prev => [...prev, newSet]);
      setLoading(false);
      
      return newSet;
    } catch (err) {
      console.error('Error generating basic flashcards:', err);
      setError('Failed to generate flashcards from summary');
      setLoading(false);
      return null;
    }
  };
  
  // Load flashcard sets on mount
  useEffect(() => {
    const loadFlashcards = async () => {
      // Check if there's a summary ID to get flashcards for
      const gameSourceSummary = localStorage.getItem('gameSourceSummary');
      if (gameSourceSummary) {
        try {
          setLoading(true);
          const { summaryId } = JSON.parse(gameSourceSummary);
          
          if (summaryId) {
            console.log('Fetching flashcards for summary ID:', summaryId);
            
            // Check if we already have this set in state
            const existingSet = flashcardSets.find(set => set.summaryId === summaryId && set.flashcards.length > 0);
            if (existingSet) {
              console.log('Using cached flashcards for summary ID:', summaryId);
              setLoading(false);
              return;
            }
            
            // If not, fetch from server
            await fetchFlashcardsForSummary(summaryId);
            
            // Clear localStorage to prevent refetching
            localStorage.removeItem('gameSourceSummary');
          }
        } catch (err) {
          console.error('Error loading flashcards:', err);
        } finally {
          setLoading(false);
        }
      } else {
        // If no specific summary, just fetch all sets
        fetchFlashcardSets();
      }
    };
    
    loadFlashcards();
  }, []);
  
  // Save flashcards when they change
  useEffect(() => {
    if (flashcardSets.length > 0) {
      localStorage.setItem('savedFlashcardSets', JSON.stringify(flashcardSets));
    }
  }, [flashcardSets]);
  
  // Add a new flashcard set
  const addFlashcardSet = (newSet) => {
    setFlashcardSets(prev => [...prev, {
      ...newSet,
      id: `set-${Date.now()}`,
      createdAt: new Date().toISOString()
    }]);
  };
  
  // Edit an existing flashcard set
  const editFlashcardSet = (id, updatedSet) => {
    setFlashcardSets(prev => 
      prev.map(set => set.id === id ? { ...set, ...updatedSet } : set)
    );
  };
  
  // Delete a flashcard set
  const deleteFlashcardSet = (id) => {
    setFlashcardSets(prev => prev.filter(set => set.id !== id));
  };
  
  // Direct loader for a specific game
  const loadFlashcardsForGame = async (summaryId) => {
    console.log('Direct loader for game - Loading flashcards for summary:', summaryId);
    
    if (!summaryId) {
      console.error('No summary ID provided for direct loading');
      return null;
    }
    
    // Try to fetch directly from the server
    try {
      setLoading(true);
      const set = await fetchFlashcardsForSummary(summaryId);
      setLoading(false);
      return set;
    } catch (err) {
      console.error('Error in direct loader:', err);
      setLoading(false);
      
      // Create a debug set as fallback
      return {
        id: `debug-${Date.now()}`,
        title: 'Debug Flashcard Set',
        createdAt: new Date().toISOString(),
        summaryId: summaryId,
        flashcards: [
          { id: 'd1', question: 'שאלת דוגמה 1', answer: 'תשובה לדוגמה 1', incorrectAnswers: ['שגוי 1', 'שגוי 2', 'שגוי 3'] },
          { id: 'd2', question: 'שאלת דוגמה 2', answer: 'תשובה לדוגמה 2', incorrectAnswers: ['שגוי 1', 'שגוי 2', 'שגוי 3'] },
          { id: 'd3', question: 'שאלת דוגמה 3', answer: 'תשובה לדוגמה 3', incorrectAnswers: ['שגוי 1', 'שגוי 2', 'שגוי 3'] },
          { id: 'd4', question: 'שאלת דוגמה 4', answer: 'תשובה לדוגמה 4', incorrectAnswers: ['שגוי 1', 'שגוי 2', 'שגוי 3'] },
          { id: 'd5', question: 'שאלת דוגמה 5', answer: 'תשובה לדוגמה 5', incorrectAnswers: ['שגוי 1', 'שגוי 2', 'שגוי 3'] }
        ]
      };
    }
  };
  
  return {
    flashcardSets,
    loading,
    error,
    addFlashcardSet,
    editFlashcardSet,
    deleteFlashcardSet,
    generateFlashcardsFromSummary,
    fetchFlashcardsForSummary,
    loadFlashcardsForGame
  };
}; 