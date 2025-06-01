
import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

const GameCard = ({ title, description, icon, path, color }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      whileHover={{ y: -5 }}
      className="h-full"
    >
      <Card className="game-card h-full flex flex-col border-2 hover:border-indigo-300 transition-colors overflow-hidden">
        <div className={`h-2 w-full ${color}`}></div>
        <CardHeader className="pb-2">
          <div className="flex items-center">
            <div className={`p-2 rounded-lg ${color} bg-opacity-10 mr-3`}>
              {icon}
            </div>
            <CardTitle className="text-xl">{title}</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="flex-1">
          <p className="text-sm text-muted-foreground">
            {description}
          </p>
        </CardContent>
        <CardFooter className="pt-2 border-t">
          <Link to={path} className="w-full">
            <Button className={`w-full ${color}`}>
              Play Now
            </Button>
          </Link>
        </CardFooter>
      </Card>
    </motion.div>
  );
};

export default GameCard;
