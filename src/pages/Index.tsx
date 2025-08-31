import React, { useState } from 'react';
import { ModernHero } from '@/components/ModernHero';
import { VideoUpload } from '@/components/VideoUpload';
import { ProcessingState } from '@/components/ProcessingState';
import { DetectionReview } from '@/components/DetectionReview';
import { TodoList } from '@/components/TodoList';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { analyzeVideoWithGemini } from '@/services/googleVision';
import { generateTodoList, breakdownTask } from '@/services/geminiApi';
import { FloatingBackground } from '@/components/FloatingBackground';
import { useToast } from '@/hooks/use-toast';


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

type AppState = 'hero' | 'upload' | 'processing' | 'detection' | 'generating' | 'results';

const Index = () => {
  const [appState, setAppState] = useState<AppState>('hero');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [videoPreview, setVideoPreview] = useState<string | null>(null);
  const [processingStep, setProcessingStep] = useState(1);
  const [processingProgress, setProcessingProgress] = useState(0);
  const [detectedItems, setDetectedItems] = useState<DetectedItem[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const { toast } = useToast();

  const totalTime = tasks.reduce((sum, task) => sum + task.timeEstimate, 0);

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
      setProcessingProgress(50);
      const generatedTasks = await generateTodoList(items);
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
      const subtasks = await breakdownTask(task.description);
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
    <div className="min-h-screen bg-gradient-hero relative overflow-hidden">
      <FloatingBackground />
      
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
                <h1 className="text-4xl font-bold mb-4 text-primary">📹 Upload Your Room Video</h1>
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

          {appState === 'detection' && (
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
              <DetectionReview
                detectedItems={detectedItems}
                onItemsConfirmed={handleItemsConfirmed}
                videoPreview={videoPreview}
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
                onTaskBreakdown={handleTaskBreakdown}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Index;
