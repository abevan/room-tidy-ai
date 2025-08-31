import React, { useState } from 'react';
import { HeroSection } from '@/components/HeroSection';
import { ApiKeySetup } from '@/components/ApiKeySetup';
import { VideoUpload } from '@/components/VideoUpload';
import { ProcessingState } from '@/components/ProcessingState';
import { DetectionReview } from '@/components/DetectionReview';
import { TodoList } from '@/components/TodoList';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { analyzeVideoWithVision } from '@/services/googleVision';
import { generateTodoList, breakdownTask } from '@/services/geminiApi';
import { useToast } from '@/hooks/use-toast';

// Mock data for demonstration - Updated to match API types
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

interface DetectedItem {
  id: string;
  name: string;
  confidence: number;
  location?: string;
}

interface Task {
  id: string;
  description: string;
  timeEstimate: number;
  completed: boolean;
  category: string;
  subtasks?: Subtask[];
}

interface Subtask {
  id: string;
  description: string;
  timeEstimate: number;
  completed: boolean;
}

type AppState = 'hero' | 'apikey' | 'upload' | 'processing' | 'detection' | 'generating' | 'results';

const Index = () => {
  const [appState, setAppState] = useState<AppState>('hero');
  const [apiKey, setApiKey] = useState<string>('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [videoPreview, setVideoPreview] = useState<string | null>(null);
  const [processingStep, setProcessingStep] = useState(1);
  const [processingProgress, setProcessingProgress] = useState(0);
  const [detectedItems, setDetectedItems] = useState<DetectedItem[]>([]);
  const [tasks, setTasks] = useState<Task[]>(mockTasks);
  const { toast } = useToast();

  // Set the provided API key on app load
  React.useEffect(() => {
    const providedKey = 'AIzaSyDLk4UzQTCaiD_b4cFQt-dQWCzeAb1dUhY';
    localStorage.setItem('google_api_key', providedKey);
    setApiKey(providedKey);
  }, []);
  
  const totalTime = tasks.reduce((sum, task) => sum + task.timeEstimate, 0);

  const handleGetStarted = () => {
    const storedKey = localStorage.getItem('google_api_key');
    if (storedKey) {
      setApiKey(storedKey);
      setAppState('upload');
    } else {
      setAppState('apikey');
    }
  };

  const handleApiKeySet = (key: string) => {
    setApiKey(key);
    setAppState('upload');
  };

  const handleVideoSelect = (file: File) => {
    setSelectedFile(file);
    const url = URL.createObjectURL(file);
    setVideoPreview(url);
  };

  const handleProcessStart = async () => {
    if (!selectedFile || !apiKey) return;

    setAppState('processing');
    setProcessingStep(1);
    setProcessingProgress(25);

    try {
      // Step 1: Extract frames and analyze
      setProcessingStep(2);
      setProcessingProgress(50);
      
      const detected = await analyzeVideoWithVision(selectedFile, apiKey);
      setDetectedItems(detected);
      
      setProcessingStep(3);
      setProcessingProgress(75);
      
      // Step 2: Complete processing
      setProcessingStep(4);
      setProcessingProgress(100);
      
      setTimeout(() => {
        setAppState('detection');
      }, 1000);
      
    } catch (error) {
      console.error('Processing error:', error);
      toast({
        title: "Processing Error",
        description: "Failed to analyze video. Please check your API key and try again.",
        variant: "destructive",
      });
      setAppState('upload');
    }
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

  const handleItemsConfirmed = async (items: DetectedItem[]) => {
    setAppState('generating');
    setProcessingStep(1);
    setProcessingProgress(0);

    try {
      setProcessingProgress(50);
      const generatedTasks = await generateTodoList(items, apiKey);
      setTasks(generatedTasks);
      setProcessingProgress(100);
      
      setTimeout(() => {
        setAppState('results');
      }, 1000);
      
    } catch (error) {
      console.error('Task generation error:', error);
      toast({
        title: "Generation Error",
        description: "Failed to generate to-do list. Please try again.",
        variant: "destructive",
      });
      setAppState('detection');
    }
  };

  const handleTaskBreakdown = async (taskId: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task || task.subtasks) return;

    try {
      const subtasks = await breakdownTask(task.description, apiKey);
      setTasks(prev => prev.map(t => 
        t.id === taskId 
          ? { ...t, subtasks }
          : t
      ));
      
      toast({
        title: "Task Breakdown Complete",
        description: `Created ${subtasks.length} subtasks for "${task.description}"`,
      });
    } catch (error) {
      console.error('Task breakdown error:', error);
      toast({
        title: "Breakdown Error",
        description: "Failed to break down task. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleBackToUpload = () => {
    setAppState('upload');
    setProcessingStep(1);
    setProcessingProgress(0);
  };

  const handleStartOver = () => {
    setAppState('hero');
    setSelectedFile(null);
    if (videoPreview) {
      URL.revokeObjectURL(videoPreview);
      setVideoPreview(null);
    }
    setProcessingStep(1);
    setProcessingProgress(0);
    setDetectedItems([]);
    setTasks([]);
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

        {appState === 'apikey' && (
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
              <h1 className="text-3xl font-bold mb-4">Setup Google APIs</h1>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                To use AI-powered room analysis, you need a Google Cloud Console API key with 
                Cloud Vision API and Gemini API enabled.
              </p>
            </div>
            <ApiKeySetup onApiKeySet={handleApiKeySet} />
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

        {(appState === 'processing' || appState === 'generating') && (
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
              isGenerating={appState === 'generating'}
            />
          </div>
        )}

        {appState === 'detection' && (
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
            <DetectionReview
              detectedItems={detectedItems}
              onItemsConfirmed={handleItemsConfirmed}
              videoPreview={videoPreview}
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
