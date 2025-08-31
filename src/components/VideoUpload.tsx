import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Upload, Video, X, Camera, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { useIsMobile } from '@/hooks/use-mobile';

interface VideoUploadProps {
  onVideoSelect: (file: File) => void;
  onProcessStart: () => void;
}

const MAX_DURATION = 60; // 1 minute in seconds

// Detect iOS devices
const isIOSDevice = () => {
  return /iPad|iPhone|iPod/.test(navigator.userAgent) || 
         (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
};

// Get supported MIME types for recording
const getSupportedMimeType = () => {
  const types = [
    'video/mp4; codecs="avc1.42E01E, mp4a.40.2"', // H.264 + AAC for iOS
    'video/webm; codecs="vp9, opus"',              // VP9 for modern browsers
    'video/webm; codecs="vp8, vorbis"',            // VP8 fallback
    'video/webm',                                   // Basic WebM
    'video/mp4'                                     // Basic MP4
  ];
  
  for (const type of types) {
    if (MediaRecorder.isTypeSupported(type)) {
      console.log('Using supported MIME type:', type);
      return type;
    }
  }
  console.log('No preferred MIME type supported, using default');
  return undefined;
};

export const VideoUpload: React.FC<VideoUploadProps> = ({ onVideoSelect, onProcessStart }) => {
  const isMobile = useIsMobile();
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
      // Skip validation for recorded videos from camera (both WebM and MP4)
      if (file.name.includes('room-video-') && (file.type.includes('webm') || file.type.includes('mp4'))) {
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
      
      // Enhanced constraints for mobile devices
      const constraints = {
        video: {
          facingMode: isMobile ? 'environment' : 'user',
          width: { ideal: isMobile ? 720 : 1280 },
          height: { ideal: isMobile ? 1280 : 720 },
          frameRate: { ideal: 30, max: 30 }
        },
        audio: true
      };
      
      const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
      
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
    
    // Get appropriate MIME type and create recorder
    const mimeType = getSupportedMimeType();
    const isIOS = isIOSDevice();
    
    try {
      const recorder = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream);
      const chunks: Blob[] = [];
      
      // Configure recording options for better iOS compatibility
      if (isIOS) {
        recorder.start(1000); // Capture data every second for iOS
      } else {
        recorder.start();
      }
      
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunks.push(event.data);
        }
      };
      
      recorder.onstop = () => {
        const effectiveMimeType = mimeType || (isIOS ? 'video/mp4' : 'video/webm');
        const extension = isIOS ? 'mp4' : 'webm';
        
        const blob = new Blob(chunks, { type: effectiveMimeType });
        const file = new File([blob], `room-video-${Date.now()}.${extension}`, { type: effectiveMimeType });
        
        console.log('Recording completed:', file.name, file.size, file.type);
        setRecordedVideo(file);
        setIsRecording(false);
        
        // Clear timer
        if (recordingIntervalRef.current) {
          clearInterval(recordingIntervalRef.current);
          recordingIntervalRef.current = null;
        }
      };
      
      recorder.onerror = (event) => {
        console.error('Recording error:', event);
        toast({
          title: "Recording Error",
          description: "Failed to record video. Please try again.",
          variant: "destructive",
        });
        setIsRecording(false);
      };
      
      mediaRecorderRef.current = recorder;
      
      // Auto-stop after max duration
      setTimeout(() => {
        if (recorder.state === 'recording') {
          recorder.stop();
        }
      }, MAX_DURATION * 1000);
      
    } catch (error) {
      console.error('MediaRecorder creation failed:', error);
      toast({
        title: "Recording Not Supported",
        description: "Video recording is not supported on this device.",
        variant: "destructive",
      });
      setIsRecording(false);
    }
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
                className={cn(
                  "w-full object-cover rounded-lg",
                  isMobile ? "h-48 sm:h-64" : "h-64"
                )}
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
            <div className="flex justify-center gap-3 flex-wrap">
              {!isRecording && !recordedVideo && (
                <>
                  <Button 
                    variant="outline" 
                    onClick={cancelCamera}
                    className={cn(
                      "min-h-[44px] px-6",
                      isMobile && "min-w-[120px]"
                    )}
                  >
                    Cancel
                  </Button>
                  <Button 
                    onClick={startRecording} 
                    className={cn(
                      "bg-destructive hover:bg-destructive/90 min-h-[44px] px-6",
                      isMobile && "min-w-[140px]"
                    )}
                  >
                    <Camera className="w-4 h-4 mr-2" />
                    Start Recording
                  </Button>
                </>
              )}
              
              {isRecording && (
                <Button 
                  variant="outline" 
                  onClick={stopRecording}
                  className={cn(
                    "min-h-[44px] px-6",
                    isMobile && "min-w-[140px]"
                  )}
                >
                  Stop Recording
                </Button>
              )}
              
              {recordedVideo && !isRecording && (
                <>
                  <Button 
                    variant="outline" 
                    onClick={retakeVideo}
                    className={cn(
                      "min-h-[44px] px-6",
                      isMobile && "min-w-[100px]"
                    )}
                  >
                    Retake
                  </Button>
                  <Button 
                    onClick={confirmRecordedVideo} 
                    className={cn(
                      "bg-success hover:bg-success/90 min-h-[44px] px-6",
                      isMobile && "min-w-[140px]"
                    )}
                  >
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
          <Card className="p-8 text-center border-2 border-dashed border-primary/30 bg-white/90 backdrop-blur-sm hover:shadow-lg transition-all">
            <Camera className="w-16 h-16 mx-auto mb-4 text-primary" />
            <h3 className="text-xl font-semibold mb-2">Record with Camera</h3>
            <p className="text-muted-foreground mb-6">
              Record a quick video of your room (up to 1 minute)
            </p>
            <Button 
              onClick={startCamera}
              size="lg"
              className="bg-gradient-to-r from-primary to-blue-500 hover:from-primary/90 hover:to-blue-500/90 text-white px-8 py-3 rounded-2xl"
            >
              Start Recording
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
              "relative border-2 border-dashed transition-all duration-300 cursor-pointer bg-white/90 backdrop-blur-sm hover:shadow-lg",
              dragOver
                ? "border-primary bg-primary/5 scale-105"
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
              <Upload className="w-12 h-12 mx-auto mb-4 text-primary" />
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