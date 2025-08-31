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

      const response = await fetch('/api/text-to-speech', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text,
          voice_id: voiceId,
          model_id: 'eleven_multilingual_v2'
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);
      
      currentAudio = new Audio(audioUrl);
      
      currentAudio.onended = () => {
        URL.revokeObjectURL(audioUrl);
        currentAudio = null;
        resolve();
      };
      
      currentAudio.onerror = (error) => {
        URL.revokeObjectURL(audioUrl);
        currentAudio = null;
        reject(error);
      };
      
      await currentAudio.play();
    } catch (error) {
      console.error('ElevenLabs TTS error:', error);
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