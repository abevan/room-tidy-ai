import React, { useState } from 'react';
import { HeroSection } from '@/components/HeroSection';
import { VideoUpload } from '@/components/VideoUpload';
import { ProcessingState } from '@/components/ProcessingState';
import { TodoList } from '@/components/TodoList';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

// Mock data for demonstration
const mockTasks = [
  {
    id: '1',
    description: 'Make the bed and arrange pillows',
    timeEstimate: 5,
    completed: false,
    category: 'General',
  },
  {
    id: '2', 
    description: 'Put away clothes scattered on chair',
    timeEstimate: 8,
    completed: false,
    category: 'Clothing',
    subtasks: [
      {
        id: '2a',
        description: 'Separate clean from dirty clothes',
        timeEstimate: 2,
        completed: false,
      },
      {
        id: '2b',
        description: 'Fold clean clothes',
        timeEstimate: 4,
        completed: false,
      },
      {
        id: '2c',
        description: 'Put folded clothes in closet',
        timeEstimate: 2,
        completed: false,
      }
    ]
  },
  {
    id: '3',
    description: 'Clear and wipe down desk surface',
    timeEstimate: 10,
    completed: false,
    category: 'Surface',
  },
  {
    id: '4',
    description: 'Organize books and put them on shelf',
    timeEstimate: 12,
    completed: false,
    category: 'Items',
  },
  {
    id: '5',
    description: 'Vacuum floor and remove clutter',
    timeEstimate: 15,
    completed: false,
    category: 'General',
  },
];

type AppState = 'hero' | 'upload' | 'processing' | 'results';

const Index = () => {
  const [appState, setAppState] = useState<AppState>('hero');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [processingStep, setProcessingStep] = useState(1);
  const [processingProgress, setProcessingProgress] = useState(0);
  const [tasks, setTasks] = useState(mockTasks);
  
  const totalTime = tasks.reduce((sum, task) => sum + task.timeEstimate, 0);

  const handleGetStarted = () => {
    setAppState('upload');
  };

  const handleVideoSelect = (file: File) => {
    setSelectedFile(file);
  };

  const handleProcessStart = () => {
    setAppState('processing');
    
    // Simulate processing steps
    const steps = [1, 2, 3, 4];
    let currentStepIndex = 0;
    
    const processNextStep = () => {
      if (currentStepIndex < steps.length) {
        setProcessingStep(steps[currentStepIndex]);
        setProcessingProgress((currentStepIndex + 1) * 25);
        currentStepIndex++;
        
        const delay = currentStepIndex === 1 ? 2000 : 1500; // First step takes longer
        setTimeout(processNextStep, delay);
      } else {
        // Processing complete
        setTimeout(() => {
          setAppState('results');
        }, 1000);
      }
    };
    
    processNextStep();
  };

  const handleTaskToggle = (taskId: string) => {
    setTasks(prev => prev.map(task => 
      task.id === taskId 
        ? { ...task, completed: !task.completed }
        : task
    ));
  };

  const handleSubtaskToggle = (taskId: string, subtaskId: string) => {
    setTasks(prev => prev.map(task => 
      task.id === taskId && task.subtasks
        ? {
            ...task,
            subtasks: task.subtasks.map(subtask =>
              subtask.id === subtaskId
                ? { ...subtask, completed: !subtask.completed }
                : subtask
            )
          }
        : task
    ));
  };

  const handleTaskBreakdown = (taskId: string) => {
    // Mock breakdown - in real app this would call Gemini API
    const mockSubtasks = [
      {
        id: `${taskId}a`,
        description: 'Gather all items from the area',
        timeEstimate: 2,
        completed: false,
      },
      {
        id: `${taskId}b`, 
        description: 'Sort items by category',
        timeEstimate: 3,
        completed: false,
      },
      {
        id: `${taskId}c`,
        description: 'Clean the surface thoroughly',
        timeEstimate: 2,
        completed: false,
      },
    ];

    setTasks(prev => prev.map(task => 
      task.id === taskId && !task.subtasks
        ? { ...task, subtasks: mockSubtasks }
        : task
    ));
  };

  const handleBackToUpload = () => {
    setAppState('upload');
    setProcessingStep(1);
    setProcessingProgress(0);
  };

  const handleStartOver = () => {
    setAppState('hero');
    setSelectedFile(null);
    setProcessingStep(1);
    setProcessingProgress(0);
    setTasks(mockTasks.map(task => ({ ...task, completed: false, subtasks: task.subtasks?.map(st => ({ ...st, completed: false })) })));
  };

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <div className="container mx-auto px-4 py-8">
        {appState === 'hero' && (
          <div>
            <HeroSection />
            <div className="text-center mt-8">
              <Button 
                variant="hero" 
                size="lg" 
                onClick={handleGetStarted}
                className="text-lg px-12 py-6"
              >
                Get Started - Upload Your Room Video
              </Button>
            </div>
          </div>
        )}

        {appState === 'upload' && (
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-8">
              <Button 
                variant="ghost" 
                onClick={handleStartOver}
                className="mb-4"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Home
              </Button>
              <h1 className="text-3xl font-bold mb-4">Upload Your Room Video</h1>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Record a short video of your room (30-60 seconds) showing the areas that need cleaning. 
                Our AI will analyze it and create a personalized cleanup plan.
              </p>
            </div>
            <VideoUpload 
              onVideoSelect={handleVideoSelect}
              onProcessStart={handleProcessStart}
            />
          </div>
        )}

        {appState === 'processing' && (
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-8">
              <Button 
                variant="ghost" 
                onClick={handleBackToUpload}
                className="mb-4"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Upload
              </Button>
            </div>
            <ProcessingState 
              currentStep={processingStep}
              progress={processingProgress}
            />
          </div>
        )}

        {appState === 'results' && (
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-8">
              <Button 
                variant="ghost" 
                onClick={handleStartOver}
                className="mb-4"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Start Over
              </Button>
            </div>
            <TodoList
              tasks={tasks}
              totalTime={totalTime}
              onTaskToggle={handleTaskToggle}
              onSubtaskToggle={handleSubtaskToggle}
              onTaskBreakdown={handleTaskBreakdown}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default Index;
