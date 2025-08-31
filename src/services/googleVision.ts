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

export const analyzeImageWithGemini = async (imageBlob: Blob, apiKey: string): Promise<DetectedObject[]> => {
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

    const prompt = `Analyze this room image and identify items that need cleaning or organizing. Focus on:
- Clothes that are scattered, on chairs, or on floors
- Items out of place (books, papers, dishes, etc.)
- Surfaces that need cleaning (messy desks, unmade beds, etc.)
- Clutter or disorganized areas
- Personal items that should be put away

For each item you identify, specify its location in the room. Return ONLY a JSON array in this exact format:
[
  {
    "name": "clothes on chair",
    "confidence": 0.95,
    "location": "on dining chair"
  },
  {
    "name": "unmade bed",
    "confidence": 0.90,
    "location": "bedroom"
  }
]

Focus on actionable cleaning tasks, not just object identification. Be specific about what needs to be cleaned or organized.`;

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro-vision:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [
            {
              text: prompt
            },
            {
              inline_data: {
                mime_type: "image/jpeg",
                data: base64
              }
            }
          ]
        }],
        generationConfig: {
          temperature: 0.4,
          maxOutputTokens: 1000,
        }
      })
    });

    if (!response.ok) {
      throw new Error(`Gemini Vision API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    const content = data.candidates[0].content.parts[0].text;
    
    // Extract JSON from the response
    const jsonMatch = content.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      throw new Error('No valid JSON found in Gemini response');
    }

    const detectedItems = JSON.parse(jsonMatch[0]);
    
    // Convert to our format with IDs
    return detectedItems.map((item: any, index: number) => ({
      id: `gemini_${index}`,
      name: item.name,
      confidence: item.confidence || 0.8,
      location: item.location
    }));

  } catch (error) {
    console.error('Gemini Vision API error:', error);
    throw error;
  }
};

export const analyzeVideoWithGemini = async (videoFile: File, apiKey: string): Promise<DetectedObject[]> => {
  try {
    const frames = await extractFramesFromVideo(videoFile, 3);
    const allDetections: DetectedObject[] = [];
    
    // Analyze each frame with Gemini
    for (let i = 0; i < frames.length; i++) {
      const frameDetections = await analyzeImageWithGemini(frames[i], apiKey);
      allDetections.push(...frameDetections);
    }
    
    // Deduplicate and merge similar items
    const uniqueItems = new Map<string, DetectedObject>();
    
    allDetections.forEach(item => {
      const key = item.name.toLowerCase().replace(/[^a-z0-9\s]/g, '').trim();
      if (!uniqueItems.has(key) || uniqueItems.get(key)!.confidence < item.confidence) {
        uniqueItems.set(key, {
          ...item,
          id: `merged_${key.replace(/\s+/g, '_')}`
        });
      }
    });
    
    return Array.from(uniqueItems.values())
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, 12); // Limit to top 12 most confident cleaning tasks
  } catch (error) {
    console.error('Video analysis error:', error);
    throw error;
  }
};