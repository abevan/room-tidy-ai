import React from 'react';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Brain, Eye, Sparkles, Video } from 'lucide-react';

interface ProcessingStateProps {
  currentStep: number;
  progress: number;
  isGenerating?: boolean;
}

export const ProcessingState: React.FC<ProcessingStateProps> = ({ 
  currentStep, 
  progress,
  isGenerating = false
}) => {
  const analysisSteps = [
    { id: 1, title: 'Uploading Video', description: 'Preparing your room video for analysis', icon: Video },
    { id: 2, title: 'Extracting Frames', description: 'Capturing key moments from your video', icon: Video },
    { id: 3, title: 'AI Vision Analysis', description: 'Identifying objects and areas in your room', icon: Eye },
    { id: 4, title: 'Processing Complete', description: 'Ready for review and editing', icon: Sparkles },
  ];

  const generationSteps = [
    { id: 1, title: 'Generating To-Do List', description: 'Creating personalized cleaning tasks based on detected items', icon: Brain },
  ];

  const steps = isGenerating ? generationSteps : analysisSteps;
  return (
    <div className="w-full max-w-2xl mx-auto">
      <Card className="p-8 glass-morphism border-white/20 shadow-strong">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold mb-4 text-white">
            {isGenerating ? 'Generating Your Tasks' : 'Analyzing Your Room'}
          </h2>
          <p className="text-lg text-white/80 font-medium">
            {isGenerating 
              ? 'Creating smart, contextual cleaning tasks based on what we found'
              : 'Our AI is identifying items and analyzing your space'
            }
          </p>
        </div>

        <div className="space-y-6">
          {steps.map((step) => {
            const isActive = step.id === currentStep;
            const isComplete = step.id < currentStep;
            const IconComponent = step.icon;

            return (
              <div key={step.id} className="flex items-center gap-4">
                <div className={`
                  flex items-center justify-center w-12 h-12 rounded-full transition-all duration-500
                  ${isComplete 
                    ? 'bg-success text-white shadow-glow' 
                    : isActive
                      ? 'bg-primary text-white shadow-glow animate-pulse'
                      : 'bg-white/20 text-white/60 backdrop-blur-sm'
                  }
                `}>
                  <IconComponent className="w-5 h-5" />
                </div>
                
                <div className="flex-1">
                  <h3 className={`font-semibold text-lg transition-colors duration-300 ${
                    isActive ? 'text-white' : isComplete ? 'text-success' : 'text-white/70'
                  }`}>
                    {step.title}
                  </h3>
                  <p className="text-white/60 font-medium">
                    {step.description}
                  </p>
                </div>

                {isActive && (
                  <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                )}
                {isComplete && (
                  <div className="w-6 h-6 bg-success rounded-full flex items-center justify-center shadow-glow">
                    <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="mt-8">
          <div className="flex justify-between text-lg font-medium text-white mb-3">
            <span>Overall Progress</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <Progress value={progress} className="h-4" />
        </div>
      </Card>
    </div>
  );
};