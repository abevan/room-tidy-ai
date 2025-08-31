import React from 'react';
import { Sparkles } from 'lucide-react';
import mascotImage from '@/assets/ai-mascot.png';

interface AIMascotProps {
  onClick?: () => void;
  showPlayButton?: boolean;
  isPlaying?: boolean;
}

export const AIMascot: React.FC<AIMascotProps> = ({ 
  onClick, 
  showPlayButton = false, 
  isPlaying = false 
}) => {
  return (
    <div className="relative inline-block animate-float cursor-pointer" onClick={onClick}>
      {/* Glowing background effect */}
      <div className="absolute inset-0 rounded-full bg-gradient-primary blur-2xl opacity-40 scale-125" />
      
      {/* Main mascot container - bigger and more kid-friendly */}
      <div className="relative w-32 h-32 bg-gradient-card rounded-full border-2 border-primary/40 shadow-glow flex items-center justify-center overflow-hidden">
        {/* Mascot image */}
        <img 
          src={mascotImage} 
          alt="Room Tidy AI Mascot" 
          className="w-24 h-24 object-contain animate-pulse-glow"
        />
        
        {/* Play button overlay when needed */}
        {showPlayButton && (
          <div className="absolute inset-0 flex items-center justify-center bg-primary/20 rounded-full backdrop-blur-sm transition-all duration-300 hover:bg-primary/30">
            {isPlaying ? (
              <div className="w-6 h-6 border-2 border-white rounded-full animate-pulse" />
            ) : (
              <div className="w-0 h-0 border-l-[12px] border-l-white border-y-[8px] border-y-transparent ml-1" />
            )}
          </div>
        )}
        
        {/* Floating sparkles - bigger and more playful */}
        <Sparkles 
          className="absolute -top-3 -right-3 w-6 h-6 text-accent animate-pulse" 
          style={{ animationDelay: '0.5s' }}
        />
        <Sparkles 
          className="absolute -bottom-2 -left-3 w-5 h-5 text-primary-glow animate-pulse" 
          style={{ animationDelay: '1.5s' }}
        />
        <Sparkles 
          className="absolute top-2 right-8 w-4 h-4 text-accent animate-pulse" 
          style={{ animationDelay: '2s' }}
        />
      </div>
      
      {/* Pulsing rings - bigger and more visible */}
      <div className="absolute inset-0 rounded-full border-3 border-primary/30 animate-ping" 
           style={{ animationDuration: '3s' }} />
      <div className="absolute inset-0 rounded-full border-2 border-accent/40 animate-ping" 
           style={{ animationDuration: '4s', animationDelay: '1s' }} />
    </div>
  );
};