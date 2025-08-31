import React from 'react';
import { Button } from '@/components/ui/button';
import { AIMascot } from './AIMascot';
import { Upload, Zap } from 'lucide-react';

interface ModernHeroProps {
  onGetStarted: () => void;
}

export const ModernHero: React.FC<ModernHeroProps> = ({ onGetStarted }) => {
  return (
    <div className="relative min-h-screen flex items-center justify-center bg-gradient-hero">
      {/* Hero content */}
      <div className="relative z-10 text-center px-4 max-w-4xl mx-auto">
        {/* Mascot */}
        <div className="mb-8 flex justify-center">
          <AIMascot />
        </div>

        {/* Main heading */}
        <h1 className="text-6xl md:text-7xl font-bold mb-6 bg-gradient-primary bg-clip-text text-transparent">
          Room Tidy AI
        </h1>

        {/* Tagline */}
        <p className="text-xl md:text-2xl text-muted-foreground mb-12 max-w-2xl mx-auto">
          Upload a room video, get an AI-powered cleanup plan instantly
        </p>

        {/* CTA Button */}
        <Button 
          onClick={onGetStarted}
          size="lg"
          className="bg-gradient-primary hover:shadow-glow transform hover:scale-105 transition-all duration-300 text-lg px-8 py-6 rounded-2xl group"
        >
          <Upload className="w-6 h-6 mr-3 group-hover:animate-bounce" />
          Start Cleaning with AI
          <Zap className="w-5 h-5 ml-3 group-hover:animate-pulse" />
        </Button>

        {/* Quick stats */}
        <div className="mt-16 flex justify-center items-center gap-8 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-accent animate-pulse" />
            <span>Instant AI Analysis</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-primary animate-pulse" style={{ animationDelay: '0.5s' }} />
            <span>Smart Task Planning</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-primary-glow animate-pulse" style={{ animationDelay: '1s' }} />
            <span>Time Estimates</span>
          </div>
        </div>
      </div>
    </div>
  );
};