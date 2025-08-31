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

export const speakText = (text: string, volume: number = 0.8): Promise<void> => {
  return new Promise((resolve, reject) => {
    if (!('speechSynthesis' in window)) {
      reject(new Error('Speech synthesis not supported'));
      return;
    }

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.9;
    utterance.pitch = 1.1;
    utterance.volume = volume / 100;
    
    // Wait for voices to load, then select the best one
    const selectVoice = () => {
      const voices = speechSynthesis.getVoices();
      
      // Prefer high-quality voices in order of preference
      const preferredVoices = [
        // Google voices (highest quality)
        'Google US English',
        'Google UK English Female',
        'Google UK English Male',
        
        // System voices with "Natural" or "Enhanced"
        voices.find(voice => voice.name.includes('Natural')),
        voices.find(voice => voice.name.includes('Enhanced')),
        voices.find(voice => voice.name.includes('Premium')),
        
        // Microsoft voices
        voices.find(voice => voice.name.includes('Microsoft') && voice.name.includes('Aria')),
        voices.find(voice => voice.name.includes('Microsoft') && voice.name.includes('Jenny')),
        
        // Other good options
        voices.find(voice => voice.name.includes('Samantha')),
        voices.find(voice => voice.name.includes('Alex')),
        voices.find(voice => voice.name.includes('Victoria')),
      ].filter(Boolean);

      const selectedVoice = preferredVoices.find(voice => 
        typeof voice === 'string' ? 
          voices.find(v => v.name === voice) : 
          voice
      );

      if (selectedVoice) {
        utterance.voice = typeof selectedVoice === 'string' ? 
          voices.find(v => v.name === selectedVoice) || null :
          selectedVoice;
      }
    };

    // Try to select voice immediately
    selectVoice();
    
    // If no voices available, wait for them to load
    if (speechSynthesis.getVoices().length === 0) {
      speechSynthesis.addEventListener('voiceschanged', selectVoice, { once: true });
    }

    utterance.onend = () => resolve();
    utterance.onerror = (event) => reject(event.error);

    speechSynthesis.speak(utterance);
  });
};

export const stopSpeaking = () => {
  if ('speechSynthesis' in window) {
    speechSynthesis.cancel();
  }
};

export const pauseSpeaking = () => {
  if ('speechSynthesis' in window && speechSynthesis.speaking) {
    speechSynthesis.pause();
  }
};

export const resumeSpeaking = () => {
  if ('speechSynthesis' in window && speechSynthesis.paused) {
    speechSynthesis.resume();
  }
};