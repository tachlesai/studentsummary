import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowLeft, Puzzle } from 'lucide-react';
import { Button } from '../ui/button';
import { Label } from '../ui/label';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '../ui/select';

const MatchingGameSetup = ({ flashcardSets = [], onStartGame }) => {
  const [selectedSetId, setSelectedSetId] = useState("");
  const [difficultyLevel, setDifficultyLevel] = useState("medium");

  const handleSubmit = (e) => {
    e.preventDefault();
    onStartGame(selectedSetId, difficultyLevel);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center mb-6">
        <Link to="/games">
          <Button variant="ghost" className="ml-4">
            <ArrowLeft className="h-4 w-4 ml-2" />
            חזרה למשחקים
          </Button>
        </Link>
        <h1 className="text-3xl font-bold">משחק התאמה</h1>
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

      <h2 className="text-xl font-semibold mb-4">בחרו סט כרטיסיות</h2>
      
      {flashcardSets.length === 0 ? (
        <div className="text-center py-8 bg-white rounded-lg border">
          <p className="text-gray-600 mb-4" dir="rtl">
            לא נמצאו סטים של כרטיסיות. אנא ודאו שיש לכם נתונים זמינים.
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
              whileTap={{ scale: 0.98 }}
              className={`bg-white rounded-lg border p-4 cursor-pointer hover:shadow-md transition-all ${selectedSetId === set.id ? "ring-2 ring-indigo-500 shadow-md" : ""}`}
              onClick={() => setSelectedSetId(set.id)}
            >
              <h3 className="font-semibold mb-2" dir="rtl">{set.title}</h3>
              <p className="text-sm text-gray-500" dir="rtl">{set.flashcards?.length || 0} כרטיסים</p>
            </motion.div>
          ))}
        </div>
      )}

      <div dir="rtl" className="space-y-4">
        <div>
          <Label htmlFor="difficulty">רמת קושי</Label>
          <Select
            value={difficultyLevel}
            onValueChange={setDifficultyLevel}
          >
            <SelectTrigger id="difficulty" className="w-full">
              <SelectValue placeholder="בחר רמת קושי" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="easy">קל (8 כרטיסים)</SelectItem>
              <SelectItem value="medium">בינוני (12 כרטיסים)</SelectItem>
              <SelectItem value="hard">קשה (16 כרטיסים)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {selectedSetId && (
        <div className="mt-8 flex justify-center">
          <Button 
            onClick={() => onStartGame(selectedSetId, difficultyLevel)}
            className="bg-indigo-600 hover:bg-indigo-700 text-white"
            size="lg"
          >
            התחל משחק
          </Button>
        </div>
      )}
    </div>
  );
};

export default MatchingGameSetup;