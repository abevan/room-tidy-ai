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

export const speakText = async (text: string, volume: number = 0.8): Promise<void> => {
  try {
    console.log('🎵 TTS: Starting speech generation with ElevenLabs API');
    console.log('🎵 TTS: Text preview:', text.substring(0, 100) + '...');
    console.log('🎵 TTS: Text length:', text.length, 'characters');
    
    // Force ElevenLabs API call with detailed logging
    const response = await fetch('https://fjnylpbqothaykvdqcsr.supabase.co/functions/v1/text-to-speech', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'audio/mpeg',
      },
      body: JSON.stringify({ text }),
    });

    console.log('🎵 TTS: ElevenLabs API response status:', response.status);
    console.log('🎵 TTS: Response headers:', Object.fromEntries(response.headers.entries()));

    if (response.ok) {
      const contentType = response.headers.get('content-type');
      console.log('🎵 TTS: Content type:', contentType);
      
      if (contentType?.includes('audio')) {
        const audioData = await response.arrayBuffer();
        console.log('🎵 TTS: Received audio data, size:', audioData.byteLength, 'bytes');
        
        const audioBlob = new Blob([audioData], { type: 'audio/mpeg' });
        const audioUrl = URL.createObjectURL(audioBlob);
        const audio = new Audio(audioUrl);
        audio.volume = volume;
        
        console.log('🎵 TTS: ✅ Playing ElevenLabs Aria voice');
        
        return new Promise((resolve, reject) => {
          audio.onended = () => {
            console.log('🎵 TTS: ✅ ElevenLabs audio playback completed successfully');
            URL.revokeObjectURL(audioUrl);
            resolve();
          };
          audio.onerror = (error) => {
            console.error('🎵 TTS: ❌ Audio playback error:', error);
            URL.revokeObjectURL(audioUrl);
            reject(new Error('Audio playback failed'));
          };
          audio.onloadstart = () => {
            console.log('🎵 TTS: Audio loading started...');
          };
          audio.oncanplay = () => {
            console.log('🎵 TTS: Audio can play - starting playback');
          };
          
          audio.play().catch(error => {
            console.error('🎵 TTS: ❌ Audio play() failed:', error);
            reject(error);
          });
        });
      } else {
        // Response is JSON (error)
        const errorData = await response.json();
        console.error('🎵 TTS: ❌ ElevenLabs API returned JSON error:', errorData);
        throw new Error(`ElevenLabs API error: ${JSON.stringify(errorData)}`);
      }
    } else {
      const errorText = await response.text();
      console.error('🎵 TTS: ❌ ElevenLabs API failed with status:', response.status, 'Error:', errorText);
      throw new Error(`ElevenLabs API failed: ${response.status} ${errorText}`);
    }
  } catch (error) {
    console.error('🎵 TTS: ❌ ElevenLabs completely failed, falling back to browser speech:', error);
    
    // Enhanced browser fallback with better quality
    return new Promise((resolve, reject) => {
      if (!('speechSynthesis' in window)) {
        reject(new Error('Speech synthesis not supported'));
        return;
      }

      // Cancel any ongoing speech
      speechSynthesis.cancel();
      
      // Wait a moment for cancel to complete
      setTimeout(() => {
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 0.9;
        utterance.pitch = 1.0;
        utterance.volume = volume;
        
        // Select the best available voice
        const selectBestVoice = () => {
          const voices = speechSynthesis.getVoices();
          console.log('🎵 TTS: Available browser voices:', voices.map(v => `${v.name} (${v.lang})`));
          
          // Look for premium voices in order of preference
          const premiumVoices = [
            'Microsoft Aria Online (Natural) - English (United States)',
            'Microsoft Jenny Online (Natural) - English (United States)', 
            'Microsoft Emma Online (Natural) - English (United States)',
            'Microsoft Guy Online (Natural) - English (United States)',
            'Google US English',
            'Google UK English Female',
            'Samantha',
            'Alex',
            'Karen',
            'Moira',
            'Tessa',
            'Fiona'
          ];
          
          for (const voiceName of premiumVoices) {
            const voice = voices.find(v => 
              v.name.includes(voiceName) || 
              v.name === voiceName ||
              v.name.toLowerCase().includes(voiceName.toLowerCase())
            );
            if (voice) {
              console.log('🎵 TTS: ✅ Selected premium browser voice:', voice.name);
              utterance.voice = voice;
              break;
            }
          }
          
          // If no premium voice found, use the best English voice available
          if (!utterance.voice) {
            const englishVoices = voices.filter(v => v.lang.startsWith('en-'));
            if (englishVoices.length > 0) {
              utterance.voice = englishVoices[0];
              console.log('🎵 TTS: ⚠️ Fallback to English voice:', utterance.voice.name);
            } else {
              console.log('🎵 TTS: ⚠️ Using default system voice');
            }
          }
        };

        // Try to select voice immediately
        selectBestVoice();
        
        // If no voices available, wait for them to load
        if (speechSynthesis.getVoices().length === 0) {
          console.log('🎵 TTS: Waiting for browser voices to load...');
          speechSynthesis.addEventListener('voiceschanged', selectBestVoice, { once: true });
        }

        utterance.onstart = () => {
          console.log('🎵 TTS: ✅ Browser speech started with voice:', utterance.voice?.name || 'default');
        };
        
        utterance.onend = () => {
          console.log('🎵 TTS: ✅ Browser speech completed');
          resolve();
        };
        
        utterance.onerror = (event) => {
          console.error('🎵 TTS: ❌ Browser speech error:', event.error);
          reject(new Error(`Browser speech error: ${event.error}`));
        };

        console.log('🎵 TTS: ⚠️ Starting browser speech synthesis as fallback');
        speechSynthesis.speak(utterance);
      }, 100);
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