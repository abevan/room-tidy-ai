import React from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Brain, Eye, Sparkles, Video, Clock, CheckCircle } from 'lucide-react';

export const HeroSection: React.FC = () => {
  return (
    <div className="relative overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-hero opacity-50" />
      
      {/* Content */}
      <div className="relative z-10 container mx-auto px-4 py-16 text-center">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-primary bg-clip-text text-transparent">
              Room Tidy AI
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Upload a video of your room and let AI create a personalized, 
              step-by-step cleanup plan with time estimates
            </p>
          </div>

          {/* Feature highlights */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            <Card className="p-6 bg-card border-0 shadow-soft hover:shadow-medium transition-all duration-300">
              <Eye className="w-12 h-12 text-primary mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">AI Vision</h3>
              <p className="text-muted-foreground text-sm">
                Advanced computer vision identifies every item in your space
              </p>
            </Card>
            
            <Card className="p-6 bg-card border-0 shadow-soft hover:shadow-medium transition-all duration-300">
              <Brain className="w-12 h-12 text-primary mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Smart Planning</h3>
              <p className="text-muted-foreground text-sm">
                Creates optimized cleanup sequences with accurate time estimates
              </p>
            </Card>
            
            <Card className="p-6 bg-card border-0 shadow-soft hover:shadow-medium transition-all duration-300">
              <Sparkles className="w-12 h-12 text-primary mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Task Breakdown</h3>
              <p className="text-muted-foreground text-sm">
                Break down complex tasks into manageable, actionable steps
              </p>
            </Card>
          </div>

          {/* Demo stats */}
          <div className="flex justify-center items-center gap-8 text-center mb-8">
            <div className="flex items-center gap-2">
              <Video className="w-5 h-5 text-primary" />
              <span className="text-sm text-muted-foreground">Video Analysis</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-primary" />
              <span className="text-sm text-muted-foreground">Time Estimation</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-primary" />
              <span className="text-sm text-muted-foreground">Progress Tracking</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};