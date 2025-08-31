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

export const analyzeImageWithVision = async (imageBlob: Blob, apiKey: string): Promise<DetectedObject[]> => {
  try {
    // Convert blob to base64
    const base64 = await new Promise<string>((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        resolve(result.split(',')[1]); // Remove data:image/jpeg;base64, prefix
      };
      reader.readAsDataURL(imageBlob);
    });

    const response = await fetch(`https://vision.googleapis.com/v1/images:annotate?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        requests: [{
          image: {
            content: base64
          },
          features: [
            { type: 'OBJECT_LOCALIZATION', maxResults: 20 },
            { type: 'LABEL_DETECTION', maxResults: 20 }
          ]
        }]
      })
    });

    if (!response.ok) {
      throw new Error(`Vision API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    const annotations = data.responses[0];
    const detectedObjects: DetectedObject[] = [];

    // Process object localization results
    if (annotations.localizedObjectAnnotations) {
      annotations.localizedObjectAnnotations.forEach((obj: any, index: number) => {
        detectedObjects.push({
          id: `obj_${index}`,
          name: obj.name,
          confidence: obj.score,
          location: 'detected in room'
        });
      });
    }

    // Process label detection results (fallback for general items)
    if (annotations.labelAnnotations) {
      annotations.labelAnnotations.forEach((label: any, index: number) => {
        // Only add if not already detected as object and confidence is reasonable
        if (!detectedObjects.some(obj => obj.name.toLowerCase() === label.description.toLowerCase()) && label.score > 0.5) {
          detectedObjects.push({
            id: `label_${index}`,
            name: label.description,
            confidence: label.score
          });
        }
      });
    }

    return detectedObjects;
  } catch (error) {
    console.error('Vision API error:', error);
    throw error;
  }
};

export const analyzeVideoWithVision = async (videoFile: File, apiKey: string): Promise<DetectedObject[]> => {
  try {
    const frames = await extractFramesFromVideo(videoFile, 3);
    const allDetections: DetectedObject[] = [];
    
    // Analyze each frame
    for (let i = 0; i < frames.length; i++) {
      const frameDetections = await analyzeImageWithVision(frames[i], apiKey);
      allDetections.push(...frameDetections);
    }
    
    // Deduplicate and merge similar items
    const uniqueItems = new Map<string, DetectedObject>();
    
    allDetections.forEach(item => {
      const key = item.name.toLowerCase();
      if (!uniqueItems.has(key) || uniqueItems.get(key)!.confidence < item.confidence) {
        uniqueItems.set(key, {
          ...item,
          id: `merged_${key.replace(/\s+/g, '_')}`
        });
      }
    });
    
    return Array.from(uniqueItems.values())
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, 15); // Limit to top 15 most confident detections
  } catch (error) {
    console.error('Video analysis error:', error);
    throw error;
  }
};