interface DetectedObject {
  id: string;
  name: string;
  confidence: number;
  location?: string;
}

export const extractFramesFromVideo = async (videoFile: File, maxFrames: number = 5): Promise<Blob[]> => {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const frames: Blob[] = [];
    
    if (!ctx) {
      reject(new Error('Could not get canvas context'));
      return;
    }

    video.onloadedmetadata = () => {
      const duration = video.duration;
      const interval = duration / maxFrames;
      let currentTime = 0;
      let frameCount = 0;

      const captureFrame = () => {
        video.currentTime = currentTime;
      };

      const onSeeked = () => {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        ctx.drawImage(video, 0, 0);
        
        canvas.toBlob((blob) => {
          if (blob) {
            frames.push(blob);
          }
          
          frameCount++;
          currentTime += interval;
          
          if (frameCount < maxFrames && currentTime < duration) {
            captureFrame();
          } else {
            resolve(frames);
          }
        }, 'image/jpeg', 0.8);
      };

      video.addEventListener('seeked', onSeeked);
      captureFrame();
    };

    video.onerror = () => reject(new Error('Error loading video'));
    video.src = URL.createObjectURL(videoFile);
  });
};

export const analyzeImageWithGemini = async (imageBlob: Blob): Promise<DetectedObject[]> => {
  try {
    console.log('=== Starting image analysis ===');
    
    // Input validation
    if (!imageBlob || imageBlob.size === 0) {
      throw new Error('Invalid image file');
    }

    console.log('Image details:', {
      size: imageBlob.size,
      type: imageBlob.type
    });

    // Validate file type
    if (!imageBlob.type.startsWith('image/')) {
      throw new Error('File must be an image');
    }

    // Validate file size (max 10MB)
    if (imageBlob.size > 10 * 1024 * 1024) {
      throw new Error('Image file too large (max 10MB)');
    }

    console.log('Converting to base64...');
    // Convert blob to base64
    const base64Data = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        // Remove the data URL prefix (e.g., "data:image/jpeg;base64,")
        const base64 = result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(imageBlob);
    });
    
    console.log('Base64 conversion complete, length:', base64Data.length);
    console.log('Calling Edge Function for image analysis...');
    
    // Call secure Edge Function
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
    
    console.log('Environment check:', {
      supabaseUrl: supabaseUrl ? 'Set' : 'Missing',
      supabaseKey: supabaseKey ? 'Set' : 'Missing'
    });
    
    
    const response = await fetch(`https://fjnylpbqothaykvdqcsr.supabase.co/functions/v1/analyze-image`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZqbnlscGJxb3RoYXlrdmRxY3NyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY2NTg2MDMsImV4cCI6MjA3MjIzNDYwM30.VSEEsQxgzsHDl51nEGdTNePA8mq2A8mwtCZbNaWhABM`
      },
      body: JSON.stringify({
        imageData: base64Data,
        mimeType: imageBlob.type
      })
    });

    console.log('Edge Function response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Edge Function error details:', {
        status: response.status,
        statusText: response.statusText,
        body: errorText
      });
      throw new Error(`Analysis failed: ${response.status} - ${errorText}`);
    }

    const responseData = await response.json();
    console.log('Edge Function response data:', responseData);
    
    const { detectedObjects } = responseData;

    if (!detectedObjects || !Array.isArray(detectedObjects)) {
      console.error('Invalid response format:', responseData);
      throw new Error('Invalid response format from analysis service');
    }

    // Validate and format the response
    const formattedObjects = detectedObjects.map((obj: any, index: number) => ({
      id: obj.id || `item_${index}`,
      name: obj.name || 'Unknown item',
      confidence: Math.min(Math.max(obj.confidence || 0.5, 0), 1),
      location: obj.location
    }));

    console.log('=== Image analysis complete ===', formattedObjects);
    return formattedObjects;

  } catch (error) {
    console.error('=== Image analysis error ===', error);
    throw error instanceof Error ? error : new Error('Failed to analyze image');
  }
};

export const analyzeVideoWithGemini = async (videoFile: File): Promise<DetectedObject[]> => {
  try {
    console.log('=== Starting video analysis ===');
    console.log('Video file details:', {
      name: videoFile.name,
      size: videoFile.size,
      type: videoFile.type,
      isCameraRecorded: videoFile.name.includes('room-video-')
    });
    
    // Input validation
    if (!videoFile || videoFile.size === 0) {
      throw new Error('Invalid video file');
    }

    // Validate file type
    if (!videoFile.type.startsWith('video/')) {
      throw new Error('File must be a video');
    }

    // More lenient file size validation for camera recordings
    const maxSize = videoFile.name.includes('room-video-') ? 100 * 1024 * 1024 : 50 * 1024 * 1024; // 100MB for camera, 50MB for uploads
    if (videoFile.size > maxSize) {
      throw new Error(`Video file too large (max ${maxSize / (1024 * 1024)}MB)`);
    }

    // Skip duration validation for camera-recorded videos
    if (!videoFile.name.includes('room-video-')) {
      console.log('Checking video duration...');
      const duration = await getVideoDuration(videoFile);
      console.log('Video duration:', duration, 'seconds');
      
      if (duration > 60) {
        throw new Error('Video must be 60 seconds or less');
      }
    } else {
      console.log('Skipping duration check for camera-recorded video');
    }

    console.log('Starting frame extraction...');
    
    // Extract frames from video
    const frames = await extractFramesFromVideo(videoFile, 3); // Reduce to 3 frames for better performance
    console.log(`Extracted ${frames.length} frames from video`);

    if (frames.length === 0) {
      throw new Error('Failed to extract frames from video');
    }

    // Analyze each frame
    const allDetections: DetectedObject[][] = [];
    for (let i = 0; i < frames.length; i++) {
      console.log(`Analyzing frame ${i + 1}/${frames.length}...`);
      try {
        const detections = await analyzeImageWithGemini(frames[i]);
        console.log(`Frame ${i + 1} analysis result:`, detections);
        allDetections.push(detections);
      } catch (frameError) {
        console.error(`Error analyzing frame ${i + 1}:`, frameError);
        // Continue with other frames
      }
    }

    if (allDetections.length === 0) {
      throw new Error('Failed to analyze any frames from the video');
    }

    // Merge and deduplicate detections
    const mergedDetections = new Map<string, DetectedObject>();
    
    allDetections.flat().forEach(detection => {
      const key = detection.name.toLowerCase().trim();
      const existing = mergedDetections.get(key);
      
      if (!existing || detection.confidence > existing.confidence) {
        mergedDetections.set(key, {
          ...detection,
          id: `item_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          confidence: Math.max(existing?.confidence || 0, detection.confidence)
        });
      }
    });

    // Sort by confidence and return top 10 items
    const sortedDetections = Array.from(mergedDetections.values())
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, 10);

    console.log(`=== Analysis complete: Found ${sortedDetections.length} unique cleaning tasks ===`);
    return sortedDetections;

  } catch (error) {
    console.error('=== Video analysis error ===', error);
    throw error instanceof Error ? error : new Error('Failed to analyze video');
  }
};

// Helper function to get video duration
function getVideoDuration(file: File): Promise<number> {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    video.preload = 'metadata';
    
    video.onloadedmetadata = () => {
      resolve(video.duration);
    };
    
    video.onerror = () => {
      reject(new Error('Failed to load video metadata'));
    };
    
    video.src = URL.createObjectURL(file);
  });
}