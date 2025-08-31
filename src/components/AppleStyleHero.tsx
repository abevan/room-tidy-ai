import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { AIMascot } from '@/components/AIMascot';
import { Sparkles, Zap, Brain, Eye, ChevronDown } from 'lucide-react';

interface AppleStyleHeroProps {
  onGetStarted: () => void;
}

export const AppleStyleHero: React.FC<AppleStyleHeroProps> = ({ onGetStarted }) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden">
      {/* Hero Content */}
      <div className="relative z-20 container mx-auto px-4 text-center max-w-6xl">
        
        {/* Main Title Section */}
        <div 
          className={`space-y-8 transition-all duration-1000 delay-300 ${
            isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`}
        >
          {/* AI Mascot */}
          <div className="flex justify-center mb-8">
            <div className="relative transform hover:scale-105 transition-transform duration-300">
              <AIMascot 
                onClick={onGetStarted}
                showPlayButton={true}
              />
              
              {/* Floating Elements */}
              <div className="absolute -top-4 -left-4 animate-float">
                <div className="w-3 h-3 bg-gradient-primary rounded-full shadow-glow animate-pulse-glow" 
                     style={{ animationDelay: '0s' }} />
              </div>
              <div className="absolute -bottom-2 -right-6 animate-float">
                <div className="w-2 h-2 bg-secondary rounded-full shadow-glow animate-pulse-glow" 
                     style={{ animationDelay: '1s' }} />
              </div>
              <div className="absolute top-1/2 -left-8 animate-drift">
                <Sparkles className="w-4 h-4 text-accent animate-pulse-glow" 
                         style={{ animationDelay: '2s' }} />
              </div>
            </div>
          </div>

          {/* Title */}
          <div className="space-y-4">
            <h1 className="text-7xl md:text-8xl lg:text-9xl font-bold tracking-tight">
              <span className="block bg-gradient-primary bg-clip-text text-transparent leading-none">
                Room Tidy
              </span>
              <span className="block text-foreground/90 leading-none">
                AI
              </span>
            </h1>
            
            {/* Subtitle */}
            <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto leading-relaxed font-medium">
              Transform any space with AI-powered vision. Upload a video, get a 
              <span className="text-primary"> personalized cleanup plan</span> in seconds.
            </p>
          </div>

          {/* Feature Highlights */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-16 max-w-4xl mx-auto">
            <div 
              className={`group transition-all duration-700 delay-500 ${
                isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
              }`}
            >
              <div className="relative p-6 rounded-2xl bg-gradient-card border border-border/50 shadow-medium hover:shadow-glow transition-all duration-300 group-hover:scale-105">
                <div className="absolute inset-0 bg-gradient-mesh rounded-2xl opacity-30" />
                <div className="relative z-10 text-center space-y-3">
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-primary shadow-inner">
                    <Eye className="w-6 h-6 text-primary-foreground" />
                  </div>
                  <h3 className="text-lg font-semibold">AI Vision</h3>
                  <p className="text-sm text-muted-foreground">
                    Advanced computer vision analyzes every detail
                  </p>
                </div>
              </div>
            </div>

            <div 
              className={`group transition-all duration-700 delay-700 ${
                isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
              }`}
            >
              <div className="relative p-6 rounded-2xl bg-gradient-card border border-border/50 shadow-medium hover:shadow-glow transition-all duration-300 group-hover:scale-105">
                <div className="absolute inset-0 bg-gradient-mesh rounded-2xl opacity-30" />
                <div className="relative z-10 text-center space-y-3">
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-primary shadow-inner">
                    <Brain className="w-6 h-6 text-primary-foreground" />
                  </div>
                  <h3 className="text-lg font-semibold">Smart Planning</h3>
                  <p className="text-sm text-muted-foreground">
                    Optimized sequences with accurate time estimates
                  </p>
                </div>
              </div>
            </div>

            <div 
              className={`group transition-all duration-700 delay-900 ${
                isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
              }`}
            >
              <div className="relative p-6 rounded-2xl bg-gradient-card border border-border/50 shadow-medium hover:shadow-glow transition-all duration-300 group-hover:scale-105">
                <div className="absolute inset-0 bg-gradient-mesh rounded-2xl opacity-30" />
                <div className="relative z-10 text-center space-y-3">
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-primary shadow-inner">
                    <Zap className="w-6 h-6 text-primary-foreground" />
                  </div>
                  <h3 className="text-lg font-semibold">Instant Results</h3>
                  <p className="text-sm text-muted-foreground">
                    Get actionable tasks breakdown in seconds
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* CTA Button */}
          <div 
            className={`mt-16 transition-all duration-700 delay-1100 ${
              isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
            }`}
          >
            <Button
              onClick={onGetStarted}
              size="lg"
              className="relative px-12 py-4 text-lg font-semibold bg-gradient-primary hover:shadow-glow transition-all duration-300 hover:scale-105 group"
            >
              <span className="relative z-10 flex items-center gap-2">
                Get Started
                <Sparkles className="w-5 h-5 group-hover:rotate-12 transition-transform duration-300" />
              </span>
              <div className="absolute inset-0 bg-gradient-glow rounded-lg opacity-0 group-hover:opacity-50 transition-opacity duration-300" />
            </Button>
          </div>

          {/* Scroll indicator */}
          <div 
            className={`absolute bottom-8 left-1/2 -translate-x-1/2 transition-all duration-700 delay-1300 ${
              isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
            }`}
          >
            <div className="animate-bounce">
              <ChevronDown className="w-6 h-6 text-muted-foreground" />
            </div>
          </div>
        </div>
      </div>

      {/* Geometric Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 border border-primary/10 rounded-full animate-drift opacity-30" />
        <div className="absolute bottom-1/3 right-1/4 w-48 h-48 border border-accent/10 rounded-lg rotate-45 animate-float opacity-20" />
        <div className="absolute top-2/3 left-1/6 w-32 h-32 bg-gradient-primary rounded-full animate-pulse-glow opacity-10" />
        <div className="absolute top-1/6 right-1/3 w-24 h-24 border border-secondary/10 rounded-full animate-drift opacity-25" />
      </div>
    </div>
  );
};