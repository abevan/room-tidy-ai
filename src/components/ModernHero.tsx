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
          <h1 className="text-5xl sm:text-6xl font-black text-white leading-tight tracking-tight">
            Room Tidy AI
          </h1>
          <p className="text-xl sm:text-2xl text-white/80 font-medium leading-relaxed max-w-2xl mx-auto">
            AI-powered cleaning assistant that guides you step-by-step through smart organization
          </p>
          </div>

          {/* CTA Button */}
          <div className="pt-6">
            <Button 
              onClick={onGetStarted}
              size="lg"
              className="glass-morphism btn-haptic hover:shadow-glow text-white font-semibold px-16 py-6 text-xl transition-all duration-300 rounded-2xl border-white/20 hover:bg-gradient-primary"
            >
              <Upload className="mr-4 w-6 h-6" />
              Get Started
            </Button>
          </div>

          {/* Feature Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 pt-12">
            <div className="glass-morphism-light rounded-2xl p-6 text-center card-tilt animate-breathe">
              <div className="w-12 h-12 bg-gradient-primary rounded-2xl mx-auto mb-4 flex items-center justify-center shadow-glow">
                <Zap className="w-6 h-6 text-white" />
              </div>
              <p className="font-semibold text-white mb-2">AI Analysis</p>
              <p className="text-sm text-white/70">Smart room detection</p>
            </div>
            <div className="glass-morphism-light rounded-2xl p-6 text-center card-tilt animate-breathe" style={{ animationDelay: '1s' }}>
              <div className="w-12 h-12 bg-gradient-to-br from-success to-primary rounded-2xl mx-auto mb-4 flex items-center justify-center shadow-glow">
                <Upload className="w-6 h-6 text-white" />
              </div>
              <p className="font-semibold text-white mb-2">Voice Guide</p>
              <p className="text-sm text-white/70">Step-by-step coaching</p>
            </div>
            <div className="glass-morphism-light rounded-2xl p-6 text-center card-tilt animate-breathe" style={{ animationDelay: '2s' }}>
              <div className="w-12 h-12 bg-gradient-to-br from-primary to-success rounded-2xl mx-auto mb-4 flex items-center justify-center shadow-glow">
                <Zap className="w-6 h-6 text-white" />
              </div>
              <p className="font-semibold text-white mb-2">Smart Planning</p>
              <p className="text-sm text-white/70">Optimized workflows</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};