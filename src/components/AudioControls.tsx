import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Play, Pause, SkipBack, SkipForward, Volume2 } from 'lucide-react';

interface AudioControlsProps {
  isPlaying: boolean;
  onPlay: () => void;
  onPause: () => void;
  onStop: () => void;
  currentStep: number;
  totalSteps: number;
  onStepChange: (step: number) => void;
}

export const AudioControls: React.FC<AudioControlsProps> = ({
  isPlaying,
  onPlay,
  onPause,
  onStop,
  currentStep,
  totalSteps,
  onStepChange,
}) => {
  const [volume, setVolume] = useState([80]);

  const handleVolumeChange = (newVolume: number[]) => {
    setVolume(newVolume);
    // Apply volume if speech synthesis is available
    if ('speechSynthesis' in window && speechSynthesis.speaking) {
      // Volume can't be changed during speech, but we store it for next time
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      onStepChange(currentStep - 1);
    }
  };

  const handleNext = () => {
    if (currentStep < totalSteps) {
      onStepChange(currentStep + 1);
    }
  };

  return (
    <div className="bg-gradient-card border border-border rounded-lg p-4 space-y-4 shadow-soft">
      {/* Main Controls */}
      <div className="flex items-center justify-center gap-3">
        <Button
          variant="outline"
          size="icon"
          onClick={handlePrevious}
          disabled={currentStep <= 1}
          className="h-10 w-10"
        >
          <SkipBack className="w-4 h-4" />
        </Button>

        <Button
          variant={isPlaying ? "secondary" : "default"}
          size="icon"
          onClick={isPlaying ? onPause : onPlay}
          className="h-12 w-12 shadow-medium hover:shadow-strong transition-all"
        >
          {isPlaying ? (
            <Pause className="w-5 h-5" />
          ) : (
            <Play className="w-5 h-5 ml-0.5" />
          )}
        </Button>

        <Button
          variant="outline"
          size="icon"
          onClick={handleNext}
          disabled={currentStep >= totalSteps}
          className="h-10 w-10"
        >
          <SkipForward className="w-4 h-4" />
        </Button>
      </div>

      {/* Progress */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>Step {currentStep} of {totalSteps}</span>
          <span>{Math.round((currentStep / totalSteps) * 100)}%</span>
        </div>
        <div className="w-full bg-muted rounded-full h-2">
          <div
            className="bg-gradient-primary h-2 rounded-full transition-all duration-300"
            style={{ width: `${(currentStep / totalSteps) * 100}%` }}
          />
        </div>
      </div>

      {/* Volume Control */}
      <div className="flex items-center gap-3">
        <Volume2 className="w-4 h-4 text-muted-foreground" />
        <Slider
          value={volume}
          onValueChange={handleVolumeChange}
          max={100}
          step={1}
          className="flex-1"
        />
        <span className="text-sm text-muted-foreground min-w-[3rem]">
          {volume[0]}%
        </span>
      </div>

      <Button
        variant="ghost"
        onClick={onStop}
        className="w-full text-muted-foreground hover:text-foreground"
      >
        Stop & Close
      </Button>
    </div>
  );
};