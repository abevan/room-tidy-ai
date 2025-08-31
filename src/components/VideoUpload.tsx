import React, { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Upload, Video, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface VideoUploadProps {
  onVideoSelect: (file: File) => void;
  onProcessStart: () => void;
}

export const VideoUpload: React.FC<VideoUploadProps> = ({ onVideoSelect, onProcessStart }) => {
  const [dragOver, setDragOver] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [videoPreview, setVideoPreview] = useState<string | null>(null);

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

  const handleFileSelect = (file: File) => {
    if (file.type.startsWith('video/')) {
      setSelectedFile(file);
      const url = URL.createObjectURL(file);
      setVideoPreview(url);
      onVideoSelect(file);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const clearSelection = () => {
    setSelectedFile(null);
    if (videoPreview) {
      URL.revokeObjectURL(videoPreview);
      setVideoPreview(null);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      {!selectedFile ? (
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
          <label className="block p-12 text-center cursor-pointer">
            <input
              type="file"
              accept="video/*"
              onChange={handleFileInput}
              className="hidden"
            />
            <Upload className="w-16 h-16 mx-auto mb-4 text-primary opacity-80" />
            <h3 className="text-xl font-semibold mb-2">Upload Room Video</h3>
            <p className="text-muted-foreground mb-4">
              Drag and drop your room video here, or click to browse
            </p>
            <p className="text-sm text-muted-foreground">
              Supports MP4, MOV, AVI files up to 100MB
            </p>
          </label>
        </Card>
      ) : (
        <Card className="relative p-6 shadow-medium">
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
                className="w-full max-h-64 rounded-lg object-cover"
              />
            </div>
          )}
          
          <Button 
            variant="hero" 
            size="lg" 
            onClick={onProcessStart}
            className="w-full"
          >
            Analyze Room & Generate To-Do List
          </Button>
        </Card>
      )}
    </div>
  );
};