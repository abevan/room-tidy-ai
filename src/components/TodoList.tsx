import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, Clock, Sparkles, ChevronDown, ChevronRight, Play } from 'lucide-react';
import { cn } from '@/lib/utils';
import { AIMascot } from '@/components/AIMascot';
import { AudioControls } from '@/components/AudioControls';
import { generateStepByStepGuidance, speakText, stopSpeaking, pauseSpeaking, resumeSpeaking } from '@/services/elevenlabsVoiceService';
import { exportToCalendar } from '@/utils/calendarExport';
import { Download } from 'lucide-react';

interface SubTask {
  id: string;
  description: string;
  timeEstimate: number;
  completed: boolean;
}

interface Task {
  id: string;
  description: string;
  timeEstimate: number;
  completed: boolean;
  category: string;
  subtasks?: SubTask[];
  expanded?: boolean;
}

interface TodoListProps {
  tasks: Task[];
  totalTime: number;
  onTaskToggle: (taskId: string) => void;
  onSubtaskToggle: (taskId: string, subtaskId: string) => void;
  onTaskBreakdown: (taskId: string) => void;
}

export const TodoList: React.FC<TodoListProps> = ({
  tasks,
  totalTime,
  onTaskToggle,
  onSubtaskToggle,
  onTaskBreakdown,
}) => {
  const [expandedTasks, setExpandedTasks] = useState<Set<string>>(new Set());
  const [showAudioControls, setShowAudioControls] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [guidanceSteps, setGuidanceSteps] = useState<string[]>([]);
  
  const completedTasks = tasks.filter(task => task.completed).length;
  const progress = tasks.length > 0 ? (completedTasks / tasks.length) * 100 : 0;
  const completedTime = tasks
    .filter(task => task.completed)
    .reduce((sum, task) => sum + task.timeEstimate, 0);

  React.useEffect(() => {
    if (tasks.length > 0 && guidanceSteps.length === 0) {
      const steps = generateStepByStepGuidance(tasks);
      setGuidanceSteps(steps);
    }
  }, [tasks]);

  const handlePlayGuidance = async () => {
    if (!showAudioControls) {
      setShowAudioControls(true);
      setCurrentStep(0);
    }
    
    if (currentStep < guidanceSteps.length) {
      setIsPlaying(true);
      try {
        await speakText(guidanceSteps[currentStep]);
        setCurrentStep(prev => prev + 1);
        setIsPlaying(false);
      } catch (error) {
        console.error('Speech error:', error);
        setIsPlaying(false);
      }
    }
  };

  const handlePause = () => {
    pauseSpeaking();
    setIsPlaying(false);
  };

  const handleResume = () => {
    resumeSpeaking();
    setIsPlaying(true);
  };

  const handleStop = () => {
    stopSpeaking();
    setIsPlaying(false);
    setShowAudioControls(false);
    setCurrentStep(0);
  };

  const handleStepChange = async (step: number) => {
    stopSpeaking();
    setCurrentStep(step);
    setIsPlaying(true);
    
    try {
      await speakText(guidanceSteps[step]);
      setIsPlaying(false);
    } catch (error) {
      console.error('Speech error:', error);
      setIsPlaying(false);
    }
  };

  const toggleExpand = (taskId: string) => {
    const newExpanded = new Set(expandedTasks);
    if (newExpanded.has(taskId)) {
      newExpanded.delete(taskId);
    } else {
      newExpanded.add(taskId);
    }
    setExpandedTasks(newExpanded);
  };

  const getCategoryColor = (category: string) => {
    const colors = {
      'Clothing': 'bg-blue-100 text-blue-800',
      'Surface': 'bg-green-100 text-green-800',
      'Items': 'bg-purple-100 text-purple-800',
      'General': 'bg-gray-100 text-gray-800',
    };
    return colors[category as keyof typeof colors] || colors.General;
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      {/* Progress Header */}
      <Card className="p-6 bg-gradient-hero border-0 shadow-medium">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold mb-2">Room Cleanup Plan</h2>
          <p className="text-muted-foreground">
            AI-generated tasks to make your room spotless
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-primary">{completedTasks}</div>
            <div className="text-sm text-muted-foreground">Tasks Completed</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-primary">{tasks.length}</div>
            <div className="text-sm text-muted-foreground">Total Tasks</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-primary">{totalTime - completedTime}</div>
            <div className="text-sm text-muted-foreground">Minutes Remaining</div>
          </div>
        </div>
        
        <Progress value={progress} className="h-3" />
        <div className="text-center mt-2 text-sm text-muted-foreground">
          {Math.round(progress)}% Complete
        </div>
      </Card>

      {/* AI Mascot & Audio Controls */}
      <Card className="p-8 bg-gradient-card border-0 shadow-medium">
        <div className="flex flex-col items-center space-y-6">
          <AIMascot 
            onClick={handlePlayGuidance}
            showPlayButton={!showAudioControls}
            isPlaying={isPlaying}
          />
          
          <div className="text-center">
            <h3 className="text-xl font-bold mb-2">🎯 AI Cleaning Coach</h3>
            <p className="text-base text-muted-foreground">
              Click the mascot to get step-by-step guidance through your cleaning tasks!
            </p>
          </div>
          
          {/* Calendar Export Button */}
          <Button
            variant="outline"
            onClick={() => exportToCalendar(tasks)}
            className="flex items-center gap-2 text-base px-6 py-3"
          >
            <Download className="w-5 h-5" />
            Export to Calendar
          </Button>
          
          {showAudioControls && (
            <div className="w-full max-w-md">
              <AudioControls
                isPlaying={isPlaying}
                onPlay={handleResume}
                onPause={handlePause}
                onStop={handleStop}
                currentStep={currentStep}
                totalSteps={guidanceSteps.length}
                onStepChange={handleStepChange}
              />
            </div>
          )}
        </div>
      </Card>

      {/* Task List */}
      <div className="space-y-3">
        {tasks.map((task) => (
          <Card key={task.id} className="overflow-hidden shadow-soft hover:shadow-medium transition-all duration-200">
            <div className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-start gap-3 flex-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onTaskToggle(task.id)}
                    className={cn(
                      "mt-0.5 transition-all duration-200",
                      task.completed ? "text-success" : "text-muted-foreground hover:text-primary"
                    )}
                  >
                    <CheckCircle2 className={cn(
                      "w-5 h-5",
                      task.completed ? "fill-current" : ""
                    )} />
                  </Button>
                  
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <p className={cn(
                        "font-medium transition-all duration-200",
                        task.completed ? "line-through text-muted-foreground" : ""
                      )}>
                        {task.description}
                      </p>
                      <Badge variant="secondary" className={getCategoryColor(task.category)}>
                        {task.category}
                      </Badge>
                    </div>
                    
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        <span>{task.timeEstimate} min</span>
                      </div>
                      
                      {task.subtasks && (
                        <div className="flex items-center gap-1">
                          <span>{task.subtasks.filter(st => st.completed).length}/{task.subtasks.length} subtasks</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onTaskBreakdown(task.id)}
                    disabled={task.completed}
                    className="opacity-80 hover:opacity-100"
                  >
                    <Sparkles className="w-4 h-4 mr-1" />
                    Break Down
                  </Button>
                  
                  {task.subtasks && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => toggleExpand(task.id)}
                    >
                      {expandedTasks.has(task.id) ? (
                        <ChevronDown className="w-4 h-4" />
                      ) : (
                        <ChevronRight className="w-4 h-4" />
                      )}
                    </Button>
                  )}
                </div>
              </div>
              
              {/* Subtasks */}
              {task.subtasks && expandedTasks.has(task.id) && (
                <div className="mt-4 ml-8 space-y-2 border-l-2 border-border pl-4">
                  {task.subtasks.map((subtask) => (
                    <div key={subtask.id} className="flex items-center gap-3">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onSubtaskToggle(task.id, subtask.id)}
                        className={cn(
                          "h-6 w-6 transition-all duration-200",
                          subtask.completed ? "text-success" : "text-muted-foreground hover:text-primary"
                        )}
                      >
                        <CheckCircle2 className={cn(
                          "w-4 h-4",
                          subtask.completed ? "fill-current" : ""
                        )} />
                      </Button>
                      <p className={cn(
                        "text-sm flex-1",
                        subtask.completed ? "line-through text-muted-foreground" : ""
                      )}>
                        {subtask.description}
                      </p>
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {subtask.timeEstimate}m
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Card>
        ))}
      </div>
      
      {tasks.length > 0 && progress === 100 && (
        <Card className="p-6 text-center bg-gradient-primary border-0 shadow-strong">
          <CheckCircle2 className="w-16 h-16 mx-auto mb-4 text-primary-foreground" />
          <h3 className="text-xl font-bold text-primary-foreground mb-2">
            Congratulations! Room Complete! 🎉
          </h3>
          <p className="text-primary-foreground/80">
            Your room is now spotless and organized!
          </p>
        </Card>
      )}
    </div>
  );
};