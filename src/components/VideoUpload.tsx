import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Upload, Video, X, Camera, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

interface VideoUploadProps {
  onVideoSelect: (file: File) => void;
  onProcessStart: () => void;
}

const MAX_DURATION = 60; // 1 minute in seconds

export const VideoUpload: React.FC<VideoUploadProps> = ({ onVideoSelect, onProcessStart }) => {
  const [dragOver, setDragOver] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [videoPreview, setVideoPreview] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordedVideo, setRecordedVideo] = useState<File | null>(null);
  const [showCameraPreview, setShowCameraPreview] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [recordingTime, setRecordingTime] = useState(0);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const { toast } = useToast();

  // Clean up camera stream on unmount
  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
      }
    };
  }, [stream]);

  const validateVideoDuration = (file: File): Promise<boolean> => {
    return new Promise((resolve) => {
      // Skip validation for recorded videos from camera
      if (file.name.includes('room-video-') && file.type === 'video/webm') {
        console.log('Skipping duration validation for camera-recorded video');
        resolve(true);
        return;
      }
      
      const video = document.createElement('video');
      video.preload = 'metadata';
      
      video.onloadedmetadata = () => {
        window.URL.revokeObjectURL(video.src);
        const duration = video.duration;
        
        console.log('Video duration validation:', duration, 'seconds, max allowed:', MAX_DURATION);
        
        // Be more lenient with validation - allow up to 65 seconds
        if (duration > MAX_DURATION + 5) {
          toast({
            title: "Video Too Long",
            description: `Please select a video shorter than ${MAX_DURATION} seconds (1 minute). Current duration: ${Math.round(duration)} seconds.`,
            variant: "destructive",
          });
          resolve(false);
        } else {
          resolve(true);
        }
      };
      
      video.onerror = () => {
        console.error('Error loading video for duration check - allowing video');
        // If we can't check duration, allow the video
        resolve(true);
      };
      
      video.src = URL.createObjectURL(file);
    });
  };

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    const videoFile = files.find(file => file.type.startsWith('video/'));
    
    if (videoFile) {
      handleFileSelect(videoFile);
    }
  }, []);

  const handleFileSelect = async (file: File) => {
    if (file.type.startsWith('video/')) {
      const isValidDuration = await validateVideoDuration(file);
      if (isValidDuration) {
        setSelectedFile(file);
        const url = URL.createObjectURL(file);
        setVideoPreview(url);
        onVideoSelect(file);
      }
    }
  };

  const handleFileInput = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      await handleFileSelect(file);
    }
  };

  const startCamera = async () => {
    try {
      console.log('Requesting camera access...');
      const mediaStream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: 'environment',
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }, 
        audio: true 
      });
      
      console.log('Camera access granted, setting up stream...');
      setStream(mediaStream);
      setShowCameraPreview(true);
      
      // Set video source for preview after a short delay to ensure DOM is ready
      setTimeout(() => {
        if (videoRef.current && mediaStream) {
          console.log('Setting video source...');
          videoRef.current.srcObject = mediaStream;
          videoRef.current.play().catch(e => console.error('Video play error:', e));
        }
      }, 100);
      
    } catch (error) {
      console.error('Camera access error:', error);
      toast({
        title: "Camera Access Failed",
        description: "Please allow camera access and ensure your camera is not being used by another application.",
        variant: "destructive",
      });
    }
  };

  const startRecording = () => {
    if (!stream) return;
    
    setIsRecording(true);
    setRecordingTime(0);
    
    // Start recording timer
    recordingIntervalRef.current = setInterval(() => {
      setRecordingTime(prev => prev + 1);
    }, 1000);
    
    const recorder = new MediaRecorder(stream);
    const chunks: Blob[] = [];
    
    recorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        chunks.push(event.data);
      }
    };
    
    recorder.onstop = () => {
      const blob = new Blob(chunks, { type: 'video/webm' });
      const file = new File([blob], `room-video-${Date.now()}.webm`, { type: 'video/webm' });
      setRecordedVideo(file);
      setIsRecording(false);
      
      // Clear timer
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
        recordingIntervalRef.current = null;
      }
    };
    
    mediaRecorderRef.current = recorder;
    recorder.start();
    
    // Auto-stop after max duration
    setTimeout(() => {
      if (recorder.state === 'recording') {
        recorder.stop();
      }
    }, MAX_DURATION * 1000);
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
    if (recordingIntervalRef.current) {
      clearInterval(recordingIntervalRef.current);
      recordingIntervalRef.current = null;
    }
  };

  const confirmRecordedVideo = async () => {
    if (recordedVideo) {
      console.log('Confirming recorded video:', recordedVideo.name, recordedVideo.size, recordedVideo.type);
      
      setSelectedFile(recordedVideo);
      const url = URL.createObjectURL(recordedVideo);
      setVideoPreview(url);
      onVideoSelect(recordedVideo);
      
      // Clean up camera
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
        setStream(null);
      }
      setShowCameraPreview(false);
      setRecordedVideo(null);
    }
  };

  const retakeVideo = () => {
    setRecordedVideo(null);
    setIsRecording(false);
    // Keep camera stream active for retake
  };

  const cancelCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setShowCameraPreview(false);
    setRecordedVideo(null);
    setIsRecording(false);
  };

  const clearSelection = () => {
    setSelectedFile(null);
    if (videoPreview) {
      URL.revokeObjectURL(videoPreview);
      setVideoPreview(null);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto space-y-6">
      {showCameraPreview ? (
        <Card className="p-6 bg-gradient-card shadow-medium">
          <div className="space-y-4">
            <div className="text-center">
              <h3 className="text-xl font-semibold mb-2">📹 Camera Preview</h3>
              <p className="text-muted-foreground">
                Show your room clearly. Recording will be limited to 60 seconds.
              </p>
            </div>
            
            {/* Camera Preview */}
            <div className="relative bg-black rounded-lg overflow-hidden">
              <video
                ref={videoRef}
                autoPlay
                muted
                playsInline
                className="w-full h-64 object-cover"
                
              />
              {!stream && (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
                  <div className="text-white text-center">
                    <Camera className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p className="text-sm opacity-75">Starting camera...</p>
                  </div>
                </div>
              )}
              {isRecording && (
                <div className="absolute top-4 left-4 flex items-center gap-2 bg-destructive/90 text-white px-3 py-1 rounded-full">
                  <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                  <span className="text-sm font-medium">REC {recordingTime}s / 60s</span>
                </div>
              )}
            </div>

            {/* Camera Controls */}
            <div className="flex justify-center gap-3">
              {!isRecording && !recordedVideo && (
                <>
                  <Button variant="outline" onClick={cancelCamera}>
                    Cancel
                  </Button>
                  <Button onClick={startRecording} className="bg-destructive hover:bg-destructive/90">
                    <Camera className="w-4 h-4 mr-2" />
                    Start Recording
                  </Button>
                </>
              )}
              
              {isRecording && (
                <Button variant="outline" onClick={stopRecording}>
                  Stop Recording
                </Button>
              )}
              
              {recordedVideo && !isRecording && (
                <>
                  <Button variant="outline" onClick={retakeVideo}>
                    Retake
                  </Button>
                  <Button onClick={confirmRecordedVideo} className="bg-success hover:bg-success/90">
                    <Check className="w-4 h-4 mr-2" />
                    Use This Video
                  </Button>
                </>
              )}
            </div>
          </div>
        </Card>
      ) : !selectedFile ? (
        <div className="space-y-6">
          {/* Camera Option */}
          <Card className="p-8 text-center border-2 border-dashed border-primary/30 bg-gradient-card hover:shadow-medium transition-all">
            <Camera className="w-16 h-16 mx-auto mb-4 text-primary" />
            <h3 className="text-xl font-semibold mb-2">📹 Record with Camera</h3>
            <p className="text-muted-foreground mb-6">
              Record a quick video of your room (0-60 seconds)
            </p>
            <Button 
              onClick={startCamera}
              size="lg"
              className="shadow-medium hover:shadow-strong px-8 py-3"
            >
              Start Camera
            </Button>
          </Card>

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-4 text-muted-foreground font-medium">
                or upload file
              </span>
            </div>
          </div>

          {/* Upload Option */}
          <Card
            className={cn(
              "relative border-2 border-dashed transition-all duration-300 cursor-pointer hover:shadow-medium",
              dragOver
                ? "border-primary bg-gradient-hero scale-105"
                : "border-border hover:border-primary/50"
            )}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <label className="block p-8 text-center cursor-pointer">
              <input
                type="file"
                accept="video/*"
                onChange={handleFileInput}
                className="hidden"
              />
              <Upload className="w-12 h-12 mx-auto mb-4 text-primary opacity-80" />
              <h3 className="text-lg font-semibold mb-2">Upload Video File</h3>
              <p className="text-muted-foreground mb-4">
                Drag and drop your room video here, or click to browse
              </p>
              <p className="text-sm text-muted-foreground">
                Supports MP4, MOV, AVI files (0-60 seconds, up to 100MB)
              </p>
            </label>
          </Card>
        </div>
      ) : (
        <Card className="relative p-6 shadow-medium bg-gradient-card">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <Video className="w-5 h-5 text-primary" />
              <div>
                <h4 className="font-medium">{selectedFile.name}</h4>
                <p className="text-sm text-muted-foreground">
                  {(selectedFile.size / (1024 * 1024)).toFixed(1)} MB
                </p>
              </div>
            </div>
            <Button variant="ghost" size="icon" onClick={clearSelection}>
              <X className="w-4 h-4" />
            </Button>
          </div>
          
          {videoPreview && (
            <div className="mb-6">
              <video
                src={videoPreview}
                controls
                className="w-full max-h-64 rounded-lg object-cover shadow-soft"
              />
            </div>
          )}
          
          <Button 
            variant="default"
            size="lg" 
            onClick={onProcessStart}
            className="w-full shadow-medium hover:shadow-strong bg-gradient-primary"
          >
            Analyze Room & Generate To-Do List
          </Button>
        </Card>
      )}
    </div>
  );
};