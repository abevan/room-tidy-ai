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

export const generateStepByStepGuidance = async (taskDescription: string, subtasks?: any[]): Promise<string[]> => {
  if (subtasks && subtasks.length > 0) {
    // Use existing subtasks and enhance them with coaching language
    return subtasks.map((subtask, index) => {
      const stepNumber = index + 1;
      const isFirst = index === 0;
      const isLast = index === subtasks.length - 1;
      
      let coaching = "";
      if (isFirst) {
        coaching = `Alright my friend, let's tackle this together! We're going to ${taskDescription.toLowerCase()}, and I know you've got this. `;
      } else if (isLast) {
        coaching = `This is it - the home stretch! You're absolutely crushing this. `;
      } else {
        coaching = `You're doing fantastic! Keep that momentum going. `;
      }
      
      const encouragement = [
        "I believe in you completely!",
        "You're stronger than you think!",
        "Every small step is progress!",
        "Look at you being productive!",
        "You're building amazing habits!",
        "I'm so proud of your effort!"
      ];
      
      const randomEncouragement = encouragement[Math.floor(Math.random() * encouragement.length)];
      
      return `${coaching}Step ${stepNumber}: ${subtask.description}. Take your time with this - there's no rush. Remember, ${randomEncouragement} When you're ready to move on, just hit the next button and we'll tackle the next part together.`;
    });
  }
  
  // Fallback for tasks without subtasks
  const steps = [
    `Hey there, my motivated friend! Let's get this done together. We're going to ${taskDescription.toLowerCase()}, and I know it might feel overwhelming, but we'll break it down into bite-sized pieces. I'm here to cheer you on every step of the way! First, let's gather everything we need and take a deep breath. You've got this, and I've got your back!`,
    `Look at you go! You're already making progress. Now let's tackle the main part of this task. Don't worry about being perfect - we're going for progress, not perfection. Take your time, be kind to yourself, and remember that every small action is building toward your goal. I believe in you completely!`,
    `You are absolutely crushing this! I can feel your momentum building. Now we're going to add those finishing touches that make all the difference. This is where the magic happens - you're transforming your space and proving to yourself just how capable you are. Keep going, you beautiful, productive human!`,
    `WOW! Look what you've accomplished! Take a moment to really appreciate what you've done here. You didn't just complete a task - you showed up for yourself, you pushed through any resistance, and you made your space better. That's the kind of person you are, and I'm genuinely proud of you. Give yourself a pat on the back - you've earned it!`
  ];
  
  return steps;
};

export const speakText = async (text: string, volume: number = 0.8): Promise<void> => {
  try {
    console.log('🎵 TTS: Starting speech generation with ElevenLabs API');
    console.log('🎵 TTS: Text length:', text.length, 'characters');
    
    // Use premium ElevenLabs API for high-quality voice
    const response = await fetch('https://fjnylpbqothaykvdqcsr.supabase.co/functions/v1/text-to-speech', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ text }),
    });

    console.log('🎵 TTS: ElevenLabs API response status:', response.status);

    if (response.ok) {
      const audioData = await response.arrayBuffer();
      console.log('🎵 TTS: Received audio data, size:', audioData.byteLength, 'bytes');
      
      const audioBlob = new Blob([audioData], { type: 'audio/mpeg' });
      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);
      audio.volume = volume;
      
      console.log('🎵 TTS: Starting audio playback with ElevenLabs voice');
      
      return new Promise((resolve, reject) => {
        audio.onended = () => {
          console.log('🎵 TTS: Audio playback completed successfully');
          URL.revokeObjectURL(audioUrl);
          resolve();
        };
        audio.onerror = (error) => {
          console.error('🎵 TTS: Audio playback error:', error);
          URL.revokeObjectURL(audioUrl);
          reject(new Error('Audio playback failed'));
        };
        audio.play().catch(error => {
          console.error('🎵 TTS: Audio play() failed:', error);
          reject(error);
        });
      });
    } else {
      const errorText = await response.text();
      console.error('🎵 TTS: ElevenLabs API failed:', response.status, errorText);
      throw new Error(`ElevenLabs API failed: ${response.status} ${errorText}`);
    }
  } catch (error) {
    console.warn('🎵 TTS: ElevenLabs failed, falling back to browser speech:', error);
    
    // Fallback to browser speech synthesis with better voice selection
    return new Promise((resolve, reject) => {
      if (!('speechSynthesis' in window)) {
        reject(new Error('Speech synthesis not supported'));
        return;
      }

      // Cancel any ongoing speech
      speechSynthesis.cancel();
      
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.95;
      utterance.pitch = 1.0;
      utterance.volume = volume;
      
      // Select the best available voice
      const selectBestVoice = () => {
        const voices = speechSynthesis.getVoices();
        console.log('🎵 TTS: Available voices:', voices.map(v => v.name));
        
        // Look for premium voices in order of preference
        const premiumVoices = [
          'Microsoft Aria Online (Natural) - English (United States)',
          'Microsoft Jenny Online (Natural) - English (United States)', 
          'Microsoft Emma Online (Natural) - English (United States)',
          'Google US English',
          'Samantha',
          'Alex',
          'Karen',
          'Moira',
          'Tessa'
        ];
        
        for (const voiceName of premiumVoices) {
          const voice = voices.find(v => 
            v.name.includes(voiceName) || 
            v.name === voiceName ||
            v.name.toLowerCase().includes(voiceName.toLowerCase())
          );
          if (voice) {
            console.log('🎵 TTS: Selected voice:', voice.name);
            utterance.voice = voice;
            break;
          }
        }
        
        // If no premium voice found, use the best English voice available
        if (!utterance.voice) {
          const englishVoices = voices.filter(v => v.lang.startsWith('en-'));
          if (englishVoices.length > 0) {
            utterance.voice = englishVoices[0];
            console.log('🎵 TTS: Fallback to English voice:', utterance.voice.name);
          }
        }
      };

      // Try to select voice immediately
      selectBestVoice();
      
      // If no voices available, wait for them to load
      if (speechSynthesis.getVoices().length === 0) {
        console.log('🎵 TTS: Waiting for voices to load...');
        speechSynthesis.addEventListener('voiceschanged', selectBestVoice, { once: true });
      }

      utterance.onstart = () => {
        console.log('🎵 TTS: Browser speech started with voice:', utterance.voice?.name || 'default');
      };
      
      utterance.onend = () => {
        console.log('🎵 TTS: Browser speech completed');
        resolve();
      };
      
      utterance.onerror = (event) => {
        console.error('🎵 TTS: Browser speech error:', event.error);
        reject(new Error(`Browser speech error: ${event.error}`));
      };

      console.log('🎵 TTS: Starting browser speech synthesis');
      speechSynthesis.speak(utterance);
    });
  }
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