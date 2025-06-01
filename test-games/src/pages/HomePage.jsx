
import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { BookOpen, Brain, Lightbulb, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

const HomePage = () => {
  const features = [
    {
      icon: <BookOpen className="h-6 w-6 text-indigo-500" />,
      title: 'Create Flashcards',
      description: 'Create custom flashcards from your lecture summaries to help you study effectively.'
    },
    {
      icon: <Brain className="h-6 w-6 text-purple-500" />,
      title: 'Interactive Games',
      description: 'Engage with your study material through fun and interactive games designed to boost retention.'
    },
    {
      icon: <Lightbulb className="h-6 w-6 text-amber-500" />,
      title: 'Smart Generation',
      description: 'Our system helps extract key concepts from your lecture summaries to create effective study materials.'
    },
    {
      icon: <Zap className="h-6 w-6 text-blue-500" />,
      title: 'Quick Study Sessions',
      description: 'Fit studying into your busy schedule with quick, focused study sessions that maximize learning.'
    }
  ];

  return (
    <div className="container mx-auto px-4 py-12">
      <section className="mb-20">
        <div className="flex flex-col lg:flex-row items-center gap-12">
          <motion.div 
            className="flex-1"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h1 className="text-4xl md:text-5xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 to-purple-600">
              Transform Your Study Experience
            </h1>
            <p className="text-xl text-gray-600 mb-8">
              Create flashcards and play interactive games to make studying more effective and enjoyable. Upload your lecture summaries and let us help you master the material.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link to="/flashcards">
                <Button className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-lg py-6 px-8">
                  Create Flashcards
                </Button>
              </Link>
              <Link to="/games">
                <Button variant="outline" className="text-lg py-6 px-8 border-2">
                  Explore Study Games
                </Button>
              </Link>
            </div>
          </motion.div>
          
          <motion.div 
            className="flex-1"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <div className="relative">
              <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-lg blur-lg opacity-75"></div>
              <div className="relative bg-white rounded-lg overflow-hidden border shadow-xl">
                <img  alt="Student studying with flashcards on a digital device" className="w-full h-auto rounded-t-lg" src="https://images.unsplash.com/photo-1589380905297-abf6a0a8e450" />
                <div className="p-6">
                  <h3 className="text-lg font-semibold mb-2">Interactive Learning</h3>
                  <p className="text-gray-600">Engage with your study material in new and effective ways.</p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      <section className="mb-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl font-bold mb-4">How It Works</h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Our platform makes it easy to create effective study materials from your lecture notes.
          </p>
        </motion.div>
        
        <div className="grid md:grid-cols-3 gap-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="bg-white rounded-lg p-6 border shadow-sm"
          >
            <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center mb-4">
              <span className="text-xl font-bold text-indigo-600">1</span>
            </div>
            <h3 className="text-xl font-semibold mb-2">Upload Summary</h3>
            <p className="text-gray-600">
              Paste your lecture summary into our system to get started.
            </p>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="bg-white rounded-lg p-6 border shadow-sm"
          >
            <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mb-4">
              <span className="text-xl font-bold text-purple-600">2</span>
            </div>
            <h3 className="text-xl font-semibold mb-2">Create Flashcards</h3>
            <p className="text-gray-600">
              Our system helps you create effective flashcards from your summary or create your own.
            </p>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="bg-white rounded-lg p-6 border shadow-sm"
          >
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4">
              <span className="text-xl font-bold text-blue-600">3</span>
            </div>
            <h3 className="text-xl font-semibold mb-2">Study & Play</h3>
            <p className="text-gray-600">
              Review your flashcards and play interactive games to reinforce your learning.
            </p>
          </motion.div>
        </div>
      </section>

      <section>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl font-bold mb-4">Features</h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Discover the tools that will transform your study experience.
          </p>
        </motion.div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <Card className="h-full">
                <CardContent className="pt-6">
                  <div className="mb-4">{feature.icon}</div>
                  <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                  <p className="text-gray-600">{feature.description}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default HomePage;
