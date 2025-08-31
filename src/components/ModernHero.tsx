import React from 'react';
import { Button } from '@/components/ui/button';
import { AIMascot } from './AIMascot';
import { Upload, Zap } from 'lucide-react';

interface ModernHeroProps {
  onGetStarted: () => void;
}

export const ModernHero: React.FC<ModernHeroProps> = ({ onGetStarted }) => {
  return (
    <div className="min-h-[85vh] md:min-h-[calc(100vh-120px)] flex flex-col items-center justify-center relative overflow-hidden px-4 md:px-6 py-4 md:py-8">
      <div className="relative z-10 text-center max-w-lg mx-auto">
        <div className="space-y-3 md:space-y-6">
          {/* AI Mascot */}
          <div className="flex justify-center mb-3 md:mb-4">
            <div className="w-20 md:w-24 h-20 md:h-24 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 backdrop-blur-sm border border-primary/20 flex items-center justify-center transform hover:scale-105 transition-transform duration-300">
              <AIMascot />
            </div>
          </div>
          
          {/* Title & Tagline */}
          <div className="space-y-4 md:space-y-6">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-black bg-gradient-to-r from-primary via-blue-500 to-primary bg-clip-text text-transparent leading-tight tracking-tight">
              Room Tidy AI
            </h1>
            <p className="text-lg md:text-xl lg:text-2xl text-muted-foreground font-medium leading-relaxed max-w-2xl mx-auto">
              AI-powered cleaning assistant that guides you step-by-step
            </p>
          </div>

          {/* CTA Button */}
          <div className="pt-4 md:pt-6">
            <Button 
              onClick={onGetStarted}
              size="lg"
              className="bg-gradient-to-r from-primary to-blue-500 hover:from-primary/90 hover:to-blue-500/90 text-white font-semibold px-12 md:px-16 py-4 md:py-6 text-lg md:text-xl transition-all duration-300 rounded-2xl shadow-lg hover:shadow-xl border-0"
            >
              <Upload className="mr-3 md:mr-4 w-5 md:w-6 h-5 md:h-6" />
              Get Started
            </Button>
          </div>
        </div>
      </div>

      {/* Feature Points */}
      <div className="absolute bottom-6 md:bottom-8 left-1/2 transform -translate-x-1/2 space-y-4 md:space-y-6">
        <div className="flex flex-col items-center space-y-2">
          <div className="w-3 h-3 rounded-full bg-primary"></div>
          <p className="text-muted-foreground font-medium">AI Analysis</p>
        </div>
        <div className="flex flex-col items-center space-y-2">
          <div className="w-3 h-3 rounded-full bg-blue-500"></div>
          <p className="text-muted-foreground font-medium">Voice Guide</p>
        </div>
        <div className="flex flex-col items-center space-y-2">
          <div className="w-3 h-3 rounded-full bg-primary"></div>
          <p className="text-muted-foreground font-medium">Smart Planning</p>
        </div>
      </div>
    </div>
  );
};