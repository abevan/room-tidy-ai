interface Task {
  id: string;
  description: string;
  timeEstimate: number;
  completed: boolean;
  category: string;
}

export const generateCleaningMotivation = (tasks: Task[], totalTime: number): string => {
  if (tasks.length === 0) return "Great! Your space looks pretty clean already!";

  const categories = [...new Set(tasks.map(task => task.category))];
  const itemCount = tasks.length;
  
  let categoryText = "";
  if (categories.length === 1) {
    categoryText = `some ${categories[0].toLowerCase()} items`;
  } else if (categories.length === 2) {
    categoryText = `some ${categories[0].toLowerCase()} and ${categories[1].toLowerCase()} items`;
  } else {
    categoryText = `items in ${categories.length} different categories`;
  }

  const timeText = totalTime < 60 
    ? `about ${totalTime} minutes`
    : `around ${Math.round(totalTime / 60)} hour${Math.round(totalTime / 60) > 1 ? 's' : ''}`;

  return `Hey there! I've analyzed your space and found ${categoryText} that could use some attention. If we tackle these ${itemCount} tasks together, it should take ${timeText}. The great news is that we can make a huge visual impact pretty quickly! Ready to transform your space? Let's start with the most impactful tasks first!`;
};

export const generateStepByStepGuidance = (tasks: Task[]): string[] => {
  const guidance: string[] = [];
  
  // Initial motivation
  const totalTime = tasks.reduce((sum, task) => sum + task.timeEstimate, 0);
  guidance.push(generateCleaningMotivation(tasks, totalTime));
  
  // Step-by-step guidance for each task
  tasks.forEach((task, index) => {
    const stepNumber = index + 1;
    const isLast = index === tasks.length - 1;
    
    let message = `Step ${stepNumber}: Let's ${task.description.toLowerCase()}. `;
    
    if (task.timeEstimate <= 5) {
      message += "This should be quick - just a few minutes! ";
    } else if (task.timeEstimate <= 10) {
      message += "This will take about 10 minutes, but you've got this! ";
    } else {
      message += `This might take around ${task.timeEstimate} minutes, but take your time. `;
    }
    
    message += "Focus on one area at a time, and remember - progress over perfection!";
    
    if (isLast) {
      message += " You're almost done - this is the final step!";
    }
    
    guidance.push(message);
  });
  
  // Completion message
  guidance.push("Congratulations! You've completed your cleaning plan. Your space looks amazing and you should feel proud of what you've accomplished!");
  
  return guidance;
};

let currentAudio: HTMLAudioElement | null = null;

export const speakText = async (text: string, voiceId: string = '9BWtsMINqrJLrRacOk9x'): Promise<void> => {
  return new Promise(async (resolve, reject) => {
    try {
      // Stop any currently playing audio
      if (currentAudio) {
        currentAudio.pause();
        currentAudio = null;
      }

      console.log('🎵 Starting TTS request for text:', text.substring(0, 50) + '...');
      
      const response = await fetch('https://fjnylpbqothaykvdqcsr.supabase.co/functions/v1/text-to-speech', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZqbnlscGJxb3RoYXlrdmRxY3NyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY2NTg2MDMsImV4cCI6MjA3MjIzNDYwM30.VSEEsQxgzsHDl51nEGdTNePA8mq2A8mwtCZbNaWhABM`
        },
        body: JSON.stringify({
          text: text.substring(0, 500), // Limit text length
          voice_id: voiceId,
          model_id: 'eleven_multilingual_v2'
        }),
      });

      console.log('🎵 TTS response status:', response.status);
      console.log('🎵 Response headers:', Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        const errorText = await response.text();
        console.error('🎵 TTS API Error:', response.status, errorText);
        throw new Error(`TTS failed: ${response.status} - ${errorText}`);
      }

      // The response should be audio/mpeg directly
      const contentType = response.headers.get('content-type');
      console.log('🎵 Content type:', contentType);
      
      if (contentType?.includes('application/json')) {
        const errorData = await response.json();
        console.error('🎵 TTS returned JSON error:', errorData);
        throw new Error('TTS service returned error: ' + JSON.stringify(errorData));
      }

      if (!contentType?.includes('audio')) {
        throw new Error('Invalid response type: expected audio, got ' + contentType);
      }

      const audioBlob = await response.blob();
      console.log('🎵 Audio blob size:', audioBlob.size, 'type:', audioBlob.type);
      
      if (audioBlob.size === 0) {
        throw new Error('Received empty audio response');
      }
      
      const audioUrl = URL.createObjectURL(audioBlob);
      
      console.log('🎵 Creating audio element and playing...');
      currentAudio = new Audio(audioUrl);
      
      currentAudio.onloadstart = () => console.log('🎵 Audio loading started');
      currentAudio.oncanplay = () => console.log('🎵 Audio can play');
      currentAudio.onplay = () => console.log('🎵 Audio playback started');
      
      currentAudio.onended = () => {
        console.log('🎵 Audio playback ended');
        URL.revokeObjectURL(audioUrl);
        currentAudio = null;
        resolve();
      };
      
      currentAudio.onerror = (error) => {
        console.error('🎵 Audio playback error:', error);
        URL.revokeObjectURL(audioUrl);
        currentAudio = null;
        reject(new Error('Audio playback failed'));
      };
      
      await currentAudio.play();
      console.log('🎵 Audio play() called successfully');
    } catch (error) {
      console.error('🎵 TTS Error:', error);
      reject(error);
    }
  });
};

export const stopSpeaking = () => {
  if (currentAudio) {
    currentAudio.pause();
    currentAudio.currentTime = 0;
    currentAudio = null;
  }
};

export const pauseSpeaking = () => {
  if (currentAudio && !currentAudio.paused) {
    currentAudio.pause();
  }
};

export const resumeSpeaking = () => {
  if (currentAudio && currentAudio.paused) {
    currentAudio.play();
  }
};