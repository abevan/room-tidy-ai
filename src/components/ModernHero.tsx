import React from 'react';
import { Button } from '@/components/ui/button';
import { AIMascot } from './AIMascot';
import { Upload, Zap } from 'lucide-react';

interface ModernHeroProps {
  onGetStarted: () => void;
}

export const ModernHero: React.FC<ModernHeroProps> = ({ onGetStarted }) => {
  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden px-6 py-12">
      <div className="relative z-10 text-center max-w-lg mx-auto">
        <div className="space-y-8">
          {/* AI Mascot */}
          <div className="flex justify-center mb-8">
            <div className="transform hover:scale-105 transition-transform duration-300">
              <AIMascot />
            </div>
          </div>
          
          {/* Title & Tagline */}
          <div className="space-y-6">
            <h1 className="text-4xl sm:text-5xl font-bold bg-gradient-primary bg-clip-text text-transparent leading-tight">
              Room Tidy AI
            </h1>
            <p className="text-lg text-muted-foreground leading-relaxed">
              AI-powered cleaning assistant that guides you step-by-step
            </p>
          </div>

          {/* CTA Button */}
          <div className="pt-4">
            <Button 
              onClick={onGetStarted}
              size="lg"
              className="w-full sm:w-auto bg-gradient-primary hover:shadow-glow text-white font-semibold px-12 py-4 text-lg shadow-medium hover:shadow-strong transition-all duration-300 transform hover:scale-105 rounded-xl"
            >
              <Upload className="mr-3 w-5 h-5" />
              Get Started
            </Button>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-8">
            <div className="text-center space-y-2">
              <div className="w-3 h-3 bg-primary rounded-full mx-auto animate-pulse" />
              <p className="text-sm font-medium text-muted-foreground">AI Analysis</p>
            </div>
            <div className="text-center space-y-2">
              <div className="w-3 h-3 bg-accent rounded-full mx-auto animate-pulse" style={{ animationDelay: '0.5s' }} />
              <p className="text-sm font-medium text-muted-foreground">Voice Guide</p>
            </div>
            <div className="text-center space-y-2">
              <div className="w-3 h-3 bg-primary-glow rounded-full mx-auto animate-pulse" style={{ animationDelay: '1s' }} />
              <p className="text-sm font-medium text-muted-foreground">Smart Planning</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};