import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { ModernHero } from '@/components/ModernHero';
import { VideoUpload } from '@/components/VideoUpload';
import { ProcessingState } from '@/components/ProcessingState';

import { TodoList } from '@/components/TodoList';
import { PWAInstallPrompt } from '@/components/PWAInstallPrompt';
import { Button } from '@/components/ui/button';
import { ArrowLeft, LogOut, User } from 'lucide-react';
import { analyzeVideoWithGemini } from '@/services/googleVision';
import { generateTodoList, breakdownTask } from '@/services/geminiApi';
import { FloatingBackground } from '@/components/FloatingBackground';
import { useToast } from '@/hooks/use-toast';
import { usePWA } from '@/hooks/usePWA';

// Register service worker
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then((registration) => {
        console.log('SW registered: ', registration);
      })
      .catch((registrationError) => {
        console.log('SW registration failed: ', registrationError);
      });
  });
}


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

type AppState = 'hero' | 'upload' | 'processing' | 'generating' | 'results';

const Index = () => {
  const { user, loading, signOut } = useAuth();
  const { isInstallable } = usePWA();
  const navigate = useNavigate();
  
  const [isPWA, setIsPWA] = useState(false);
  const [appState, setAppState] = useState<AppState>('hero');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [videoPreview, setVideoPreview] = useState<string | null>(null);
  const [processingStep, setProcessingStep] = useState(1);
  const [processingProgress, setProcessingProgress] = useState(0);
  const [detectedItems, setDetectedItems] = useState<DetectedItem[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);
  const { toast } = useToast();

  // Detect PWA mode
  useEffect(() => {
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
    const isIOSStandalone = 'standalone' in window.navigator && (window.navigator as any).standalone;
    const isPWAMode = isStandalone || isIOSStandalone;
    
    console.log('🔧 Index: PWA mode detected:', isPWAMode);
    setIsPWA(isPWAMode);
  }, []);

  // Auth redirect effect with PWA-specific handling
  useEffect(() => {
    if (!loading && !user) {
      console.log('🔧 Index: Redirecting to auth, PWA mode:', isPWA);
      // For PWA mode, add a small delay to ensure proper navigation
      if (isPWA) {
        setTimeout(() => {
          navigate('/auth', { replace: true });
        }, 100);
      } else {
        navigate('/auth', { replace: true });
      }
    }
  }, [user, loading, navigate, isPWA]);

  // Show install prompt after 5 seconds if app is installable
  useEffect(() => {
    if (isInstallable && !showInstallPrompt) {
      console.log('🔧 PWA: App is installable, showing prompt in 5 seconds');
      const timer = setTimeout(() => {
        console.log('🔧 PWA: Showing install prompt now');
        setShowInstallPrompt(true);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [isInstallable, showInstallPrompt]);
  const totalTime = tasks.reduce((sum, task) => sum + task.timeEstimate, 0);
  
  // Show loading with PWA-specific styling
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-hero">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">
            {isPWA ? 'Initializing PWA...' : 'Loading...'}
          </p>
        </div>
      </div>
    );
  }
  
  // Don't render anything if user is not authenticated (will redirect)
  if (!user) {
    return null;
  }


  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };

  const handleGetStarted = () => {
    setAppState('upload');
  };

  const handleVideoSelect = (file: File) => {
    setSelectedFile(file);
    const url = URL.createObjectURL(file);
    setVideoPreview(url);
  };

  const handleProcessStart = async () => {
    if (!selectedFile) return;

    console.log('Starting analysis process...');
    setAppState('processing');
    setProcessingStep(1);
    setProcessingProgress(25);

    try {
      // Step 1: Extract frames and analyze
      console.log('Moving to step 2 - frame extraction');
      setProcessingStep(2);
      setProcessingProgress(50);
      
      console.log('Calling analyzeVideoWithGemini with file:', selectedFile.name, selectedFile.size, selectedFile.type);
      const detected = await analyzeVideoWithGemini(selectedFile);
      console.log('Analysis complete, detected items:', detected);
      setDetectedItems(detected);
      
      setProcessingStep(3);
      setProcessingProgress(75);
      
      // Step 2: Complete processing and go straight to generating
      setProcessingStep(4);
      setProcessingProgress(100);
      
      setTimeout(() => {
        handleItemsConfirmed(detected);
      }, 1000);
      
    } catch (error) {
      console.error('Processing error:', error);
      toast({
        title: "Processing Error",
        description: error instanceof Error ? error.message : "Failed to analyze video. Please try again.",
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
      setProcessingProgress(30);
      const generatedTasks = await generateTodoList(items);
      
      setProcessingProgress(80);
      
      // Edge function already generates sophisticated subtasks, so we use them directly
      console.log('Generated tasks with intelligent subtasks:', generatedTasks);
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
      setAppState('upload');
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

  const renderHeader = () => (
    <header className="relative z-20 bg-white/95 backdrop-blur-sm border-b border-gray-200 shadow-sm">
      <div className="container mx-auto px-4 py-4 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gradient-to-r from-primary to-blue-500 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">🏠</span>
          </div>
          <h1 className="text-xl font-bold text-gray-900">Room Tidy AI</h1>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-sm text-gray-700 bg-gray-100 rounded-full px-3 py-2">
            <User className="h-4 w-4" />
            <span className="hidden sm:inline">{user.email}</span>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleSignOut}
            className="bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-200 hover:text-gray-900"
          >
            <LogOut className="h-4 w-4 mr-2" />
            Sign out
          </Button>
        </div>
      </div>
    </header>
  );

  return (
    <div className="min-h-screen bg-gradient-hero relative overflow-hidden">
      <FloatingBackground />
      {renderHeader()}
      
      {appState === 'hero' && (
        <ModernHero onGetStarted={handleGetStarted} />
      )}

      {appState !== 'hero' && (
        <div className="relative z-10 container mx-auto px-4 py-4 max-w-5xl">
          {appState === 'upload' && (
            <div className="max-w-4xl mx-auto">
              <div className="text-center mb-6">
                <Button 
                  variant="ghost" 
                  onClick={handleStartOver}
                  className="mb-4 text-lg px-6 py-3"
                >
                  <ArrowLeft className="w-5 h-5 mr-2" />
                  Back to Home
                </Button>
                <h1 className="text-4xl font-bold mb-4 text-foreground">Upload Your Room Video</h1>
                <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
                  Record a short video of your room (0-60 seconds) showing the areas that need cleaning. 
                  Our AI will analyze it and create a personalized cleanup plan!
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
              <div className="text-center mb-6">
                <Button 
                  variant="ghost" 
                  onClick={handleBackToUpload}
                  className="mb-4 text-lg px-6 py-3"
                >
                  <ArrowLeft className="w-5 h-5 mr-2" />
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


          {appState === 'results' && (
            <div className="max-w-5xl mx-auto">
              <div className="text-center mb-6">
                <Button 
                  variant="ghost" 
                  onClick={handleStartOver}
                  className="mb-4 text-lg px-6 py-3"
                >
                  <ArrowLeft className="w-5 h-5 mr-2" />
                  Start Over
                </Button>
              </div>
              <TodoList
                tasks={tasks}
                totalTime={totalTime}
                onTaskToggle={handleTaskToggle}
                onSubtaskToggle={handleSubtaskToggle}
              />
            </div>
          )}
        </div>
      )}
      
      {/* PWA Install Prompt */}
      {showInstallPrompt && (
        <PWAInstallPrompt onClose={() => setShowInstallPrompt(false)} />
      )}
    </div>
  );
};

export default Index;
