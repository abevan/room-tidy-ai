import React from 'react';
import { Sparkles } from 'lucide-react';
import mascotImage from '@/assets/ai-mascot.png';

export const AIMascot: React.FC = () => {
  return (
    <div className="relative inline-block animate-float">
      {/* Glowing background effect */}
      <div className="absolute inset-0 rounded-full bg-gradient-primary blur-xl opacity-50 scale-110" />
      
      {/* Main mascot container */}
      <div className="relative w-20 h-20 bg-gradient-card rounded-full border border-primary/30 shadow-glow flex items-center justify-center overflow-hidden">
        {/* Mascot image */}
        <img 
          src={mascotImage} 
          alt="Room Tidy AI Mascot" 
          className="w-16 h-16 object-contain animate-pulse-glow"
        />
        
        {/* Floating sparkles */}
        <Sparkles 
          className="absolute -top-2 -right-2 w-4 h-4 text-accent animate-pulse" 
          style={{ animationDelay: '0.5s' }}
        />
        <Sparkles 
          className="absolute -bottom-1 -left-2 w-3 h-3 text-primary-glow animate-pulse" 
          style={{ animationDelay: '1.5s' }}
        />
        <Sparkles 
          className="absolute top-1 right-6 w-2 h-2 text-accent animate-pulse" 
          style={{ animationDelay: '2s' }}
        />
      </div>
      
      {/* Pulsing rings */}
      <div className="absolute inset-0 rounded-full border-2 border-primary/20 animate-ping" 
           style={{ animationDuration: '3s' }} />
      <div className="absolute inset-0 rounded-full border border-accent/30 animate-ping" 
           style={{ animationDuration: '4s', animationDelay: '1s' }} />
    </div>
  );
};