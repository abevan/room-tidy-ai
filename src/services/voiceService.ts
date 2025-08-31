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
  // Generate personalized, humorous, long-form guidance for each task
  const taskGuidance = `Alright my friend, let's tackle "${taskDescription}" together! I'm here to make this as fun and easy as possible. Think of me as your personal cleaning coach who's genuinely excited to see you succeed. 

First, let's set the mood - put on some energizing music if you haven't already! Studies show that upbeat music can make cleaning 40% more enjoyable, and trust me, we want all the help we can get. Now, take a deep breath and remember: we're not just cleaning, we're creating a space that reflects the amazing, organized person you are inside.

Here's the thing about ${taskDescription.toLowerCase()} - it might seem overwhelming at first, but we're going to break this down into bite-sized, totally manageable pieces. I believe in you completely, and by the time we're done, you're going to feel like a productivity superhero! Ready? Let's make some magic happen!`;

  if (subtasks && subtasks.length > 0) {
    // Enhanced subtask guidance with humor and personality
    return subtasks.map((subtask, index) => {
      const stepNumber = index + 1;
      const isFirst = index === 0;
      const isLast = index === subtasks.length - 1;
      
      let personalizedGuidance = "";
      
      if (isFirst) {
        personalizedGuidance = `Hey there, my motivated friend! ${taskGuidance} Step ${stepNumber}: ${subtask.description}. 

I know this might feel like a big task, but remember - every journey begins with a single step, and you're already showing up! That takes courage. Take your time with this part, there's absolutely no rush. Put on your favorite playlist, maybe grab a refreshing drink, and let's make this enjoyable. 

Fun fact: Did you know that completing small tasks releases dopamine in your brain? That's right - you're literally going to feel good about this! So let's start with this step and build that momentum. You've got this, and I'm cheering you on every step of the way!`;
      } else if (isLast) {
        personalizedGuidance = `WOW! Look at you go! You're on the final stretch now - Step ${stepNumber}: ${subtask.description}. 

I am genuinely so proud of how far you've come! You've powered through every previous step like the absolute champion you are. This last step is where all your hard work comes together into something beautiful. Take a moment to appreciate your dedication and persistence.

You know what's amazing? You didn't just clean something - you showed up for yourself, you pushed through any resistance, and you're creating positive change in your environment. That ripples out into every area of your life. Finish strong, my friend - you're almost there, and the satisfaction you're about to feel is going to be incredible!`;
      } else {
        const encouragements = [
          "You're absolutely crushing this!",
          "Look at that momentum building!",
          "I'm genuinely impressed with your progress!",
          "You're making this look easy!",
          "Your future self is going to thank you so much!",
          "This is exactly what success looks like!"
        ];
        
        const tips = [
          "Pro tip: If you're feeling tired, take a 30-second dance break - it works wonders!",
          "Remember: progress over perfection, always!",
          "Fun fact: You're building habits that successful people have mastered!",
          "Quick reminder: Every item you organize makes the next one easier!",
          "Here's a secret: The hardest part is behind you now!"
        ];
        
        const randomEncouragement = encouragements[Math.floor(Math.random() * encouragements.length)];
        const randomTip = tips[Math.floor(Math.random() * tips.length)];
        
        personalizedGuidance = `${randomEncouragement} You're making incredible progress! Step ${stepNumber}: ${subtask.description}.

${randomTip} I can practically feel your confidence growing with each completed step. This is what I love to see - someone who doesn't just dream about change, but actually takes action to make it happen.

You're in the flow now, and that's a beautiful thing. Keep that energy going, stay present with what you're doing, and remember that each small action is building toward something bigger. You're not just organizing space - you're organizing your life, and that's powerful stuff!`;
      }
      
      return personalizedGuidance;
    });
  }
  
  // Fallback for tasks without subtasks - longer, more personalized version
  return [taskGuidance];
};

// Enhanced audio source detection and control
let currentAudio: HTMLAudioElement | null = null;
let currentUtterance: SpeechSynthesisUtterance | null = null;
let lastAudioSource: 'elevenlabs' | 'browser' | 'unknown' = 'unknown';
let isAudioPaused = false;

export const getLastAudioSource = () => lastAudioSource;

export const speakText = async (text: string, volume: number = 0.8): Promise<void> => {
  if (!text?.trim()) {
    console.log('🎵 TTS: No text provided, skipping');
    return;
  }

  try {
    // Stop any existing speech
    stopSpeaking();

    console.log('🎵 TTS: Starting speech synthesis');
    console.log('🎵 TTS: Text preview:', text.substring(0, 100) + '...');
    console.log('🎵 TTS: Text length:', text.length, 'characters');
    
    // Limit text length for API
    const limitedText = text.substring(0, 1000); // Increased limit
    
    // Force ElevenLabs API call with detailed logging
    const response = await fetch('https://fjnylpbqothaykvdqcsr.supabase.co/functions/v1/text-to-speech', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'audio/mpeg',
        'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZqbnlscGJxb3RoYXlrdmRxY3NyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY2NTg2MDMsImV4cCI6MjA3MjIzNDYwM30.VSEEsQxgzsHDl51nEGdTNePA8mq2A8mwtCZbNaWhABM'
      },
      body: JSON.stringify({ 
        text: limitedText,
        voice_id: '9BWtsMINqrJLrRacOk9x', // Aria voice
        model_id: 'eleven_multilingual_v2'
      }),
    });

    console.log('🎵 TTS: ElevenLabs API response status:', response.status);
    console.log('🎵 TTS: Response headers:', Object.fromEntries(response.headers.entries()));

    if (!response.ok) {
      const errorText = await response.text();
      console.error('🎵 TTS: ElevenLabs API error:', response.status, errorText);
      
      // Don't fallback to browser TTS immediately - throw error to let caller handle
      throw new Error(`ElevenLabs API failed: ${response.status} - ${errorText}`);
    }

    // Check if we got audio content
    const contentType = response.headers.get('content-type');
    console.log('🎵 TTS: Response content-type:', contentType);

    if (!contentType?.includes('audio')) {
      const responseText = await response.text();
      console.error('🎵 TTS: Expected audio but got:', contentType, responseText);
      throw new Error('Invalid audio response from ElevenLabs API');
    }

    // Convert response to audio blob
    const audioBlob = await response.blob();
    console.log('🎵 TTS: Audio blob size:', audioBlob.size, 'bytes');

    if (audioBlob.size === 0) {
      throw new Error('Empty audio response from ElevenLabs API');
    }

    // Create audio URL and play
    const audioUrl = URL.createObjectURL(audioBlob);
    const audio = new Audio(audioUrl);
    
    // Store for pause/resume control
    currentAudio = audio;
    isAudioPaused = false;
    
    // Set volume
    audio.volume = Math.max(0, Math.min(1, volume));

    console.log('🎵 TTS: ✅ Playing ElevenLabs audio, size:', audioBlob.size, 'bytes');
    lastAudioSource = 'elevenlabs';

    // Return promise that resolves when audio finishes
    return new Promise((resolve, reject) => {
      audio.onended = () => {
        console.log('🎵 TTS: ✅ ElevenLabs audio playback completed');
        URL.revokeObjectURL(audioUrl);
        currentAudio = null;
        isAudioPaused = false;
        resolve();
      };

      audio.onerror = (error) => {
        console.error('🎵 TTS: ❌ Audio playback error:', error);
        URL.revokeObjectURL(audioUrl);
        currentAudio = null;
        isAudioPaused = false;
        lastAudioSource = 'unknown';
        reject(new Error('Audio playbook failed'));
      };

      audio.onloadeddata = () => {
        console.log('🎵 TTS: Audio loaded, duration:', audio.duration, 'seconds');
      };

      audio.play().catch(error => {
        console.error('🎵 TTS: Failed to play audio:', error);
        URL.revokeObjectURL(audioUrl);
        lastAudioSource = 'unknown';
        reject(error);
      });
    });

  } catch (error) {
    console.error('🎵 TTS: ❌ ElevenLabs error, falling back to browser TTS:', error);
    lastAudioSource = 'browser';
    
    // Fallback to browser TTS only after ElevenLabs fails
    return new Promise((resolve, reject) => {
      if ('speechSynthesis' in window) {
        console.log('🎵 TTS: 🔄 Using browser fallback');
        
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.volume = volume;
        utterance.rate = 0.9;
        utterance.pitch = 1.0;
        
        // Store for pause/resume control
        currentUtterance = utterance;

        // Try to select a high-quality voice
        const voices = speechSynthesis.getVoices();
        const preferredVoice = voices.find(voice => 
          voice.name.includes('Neural') || 
          voice.name.includes('Enhanced') ||
          voice.name.includes('Premium') ||
          (voice.lang.startsWith('en') && voice.localService === false)
        );
        
        if (preferredVoice) {
          utterance.voice = preferredVoice;
          console.log('🎵 TTS: Using browser voice:', preferredVoice.name);
        }

        utterance.onend = () => {
          console.log('🎵 TTS: 🔄 Browser TTS completed');
          currentUtterance = null;
          resolve();
        };

        utterance.onerror = (error) => {
          console.error('🎵 TTS: ❌ Browser TTS error:', error);
          lastAudioSource = 'unknown';
          reject(error);
        };

        speechSynthesis.speak(utterance);
      } else {
        lastAudioSource = 'unknown';
        reject(new Error('Speech synthesis not supported'));
      }
    });
  }
};

export const stopSpeaking = () => {
  // Stop ElevenLabs audio
  if (currentAudio) {
    currentAudio.pause();
    currentAudio.currentTime = 0;
    currentAudio = null;
  }
  
  // Stop browser TTS
  if ('speechSynthesis' in window) {
    speechSynthesis.cancel();
  }
  
  currentUtterance = null;
  isAudioPaused = false;
};

export const pauseSpeaking = () => {
  // Pause ElevenLabs audio
  if (currentAudio && !currentAudio.paused) {
    currentAudio.pause();
    isAudioPaused = true;
    console.log('🎵 TTS: ⏸️ Paused ElevenLabs audio');
    return;
  }
  
  // Pause browser TTS
  if ('speechSynthesis' in window && speechSynthesis.speaking) {
    speechSynthesis.pause();
    isAudioPaused = true;
    console.log('🎵 TTS: ⏸️ Paused browser TTS');
  }
};

export const resumeSpeaking = () => {
  // Resume ElevenLabs audio
  if (currentAudio && currentAudio.paused && isAudioPaused) {
    currentAudio.play();
    isAudioPaused = false;
    console.log('🎵 TTS: ▶️ Resumed ElevenLabs audio');
    return;
  }
  
  // Resume browser TTS
  if ('speechSynthesis' in window && speechSynthesis.paused) {
    speechSynthesis.resume();
    isAudioPaused = false;
    console.log('🎵 TTS: ▶️ Resumed browser TTS');
  }
};

export const isCurrentlyPaused = () => isAudioPaused;