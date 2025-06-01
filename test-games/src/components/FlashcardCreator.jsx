
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { PlusCircle, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

const FlashcardCreator = ({ onSaveFlashcards }) => {
  const [flashcards, setFlashcards] = useState([{ question: '', answer: '' }]);
  const [title, setTitle] = useState('');
  const [summary, setSummary] = useState('');
  const { toast } = useToast();
  const [open, setOpen] = useState(false);

  const handleAddFlashcard = () => {
    setFlashcards([...flashcards, { question: '', answer: '' }]);
  };

  const handleRemoveFlashcard = (index) => {
    const newFlashcards = [...flashcards];
    newFlashcards.splice(index, 1);
    setFlashcards(newFlashcards);
  };

  const handleFlashcardChange = (index, field, value) => {
    const newFlashcards = [...flashcards];
    newFlashcards[index][field] = value;
    setFlashcards(newFlashcards);
  };

  const handleSave = () => {
    if (!title.trim()) {
      toast({
        title: "Title Required",
        description: "Please provide a title for your flashcard set.",
        variant: "destructive",
      });
      return;
    }

    if (flashcards.some(card => !card.question.trim() || !card.answer.trim())) {
      toast({
        title: "Incomplete Flashcards",
        description: "Please fill in both question and answer for all flashcards.",
        variant: "destructive",
      });
      return;
    }

    const flashcardSet = {
      id: Date.now().toString(),
      title,
      summary,
      cards: flashcards,
      createdAt: new Date().toISOString(),
    };

    onSaveFlashcards(flashcardSet);
    
    toast({
      title: "Success!",
      description: "Your flashcards have been saved.",
    });

    // Reset form
    setTitle('');
    setSummary('');
    setFlashcards([{ question: '', answer: '' }]);
    setOpen(false);
  };

  const handleGenerateFromSummary = () => {
    if (!summary.trim()) {
      toast({
        title: "Summary Required",
        description: "Please provide a lecture summary to generate flashcards.",
        variant: "destructive",
      });
      return;
    }

    // This is a simple simulation of generating flashcards from a summary
    // In a real application, this would use NLP or AI to extract key concepts
    const sentences = summary.split(/[.!?]+/).filter(s => s.trim().length > 10);
    const generatedCards = sentences.slice(0, 5).map(sentence => {
      const words = sentence.trim().split(' ');
      const halfLength = Math.floor(words.length / 2);
      
      const question = words.slice(0, halfLength).join(' ') + '...?';
      const answer = sentence.trim();
      
      return { question, answer };
    });

    if (generatedCards.length > 0) {
      setFlashcards(generatedCards);
      toast({
        title: "Flashcards Generated",
        description: `Created ${generatedCards.length} flashcards from your summary.`,
      });
    } else {
      toast({
        title: "Generation Failed",
        description: "Could not generate flashcards from the provided summary. Try adding more detailed content.",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700">
          <PlusCircle className="mr-2 h-4 w-4" />
          Create New Flashcards
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Flashcards</DialogTitle>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              placeholder="Enter a title for your flashcard set"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>
          
          <div className="grid gap-2">
            <Label htmlFor="summary">Lecture Summary</Label>
            <Textarea
              id="summary"
              placeholder="Paste your lecture summary here to generate flashcards"
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              className="min-h-[100px]"
            />
            <Button 
              variant="outline" 
              onClick={handleGenerateFromSummary}
              className="mt-2"
            >
              Generate Flashcards from Summary
            </Button>
          </div>
          
          <div className="mt-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium">Flashcards</h3>
              <Button 
                size="sm" 
                onClick={handleAddFlashcard}
                className="bg-indigo-500 hover:bg-indigo-600"
              >
                <PlusCircle className="mr-1 h-4 w-4" />
                Add Card
              </Button>
            </div>
            
            <div className="space-y-4">
              {flashcards.map((flashcard, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm flex justify-between items-center">
                        <span>Card {index + 1}</span>
                        {flashcards.length > 1 && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveFlashcard(index)}
                            className="h-8 w-8 p-0 text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid gap-3">
                        <div className="grid gap-1.5">
                          <Label htmlFor={`question-${index}`}>Question</Label>
                          <Input
                            id={`question-${index}`}
                            placeholder="Enter the question"
                            value={flashcard.question}
                            onChange={(e) => handleFlashcardChange(index, 'question', e.target.value)}
                          />
                        </div>
                        <div className="grid gap-1.5">
                          <Label htmlFor={`answer-${index}`}>Answer</Label>
                          <Textarea
                            id={`answer-${index}`}
                            placeholder="Enter the answer"
                            value={flashcard.answer}
                            onChange={(e) => handleFlashcardChange(index, 'answer', e.target.value)}
                            className="min-h-[80px]"
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
        
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700">
            Save Flashcards
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default FlashcardCreator;
