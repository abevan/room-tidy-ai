interface Task {
  id: string;
  description: string;
  timeEstimate: number;
  completed: boolean;
  category: string;
}

interface AudioSegment {
  id: string;
  text: string;
  type: 'intro' | 'step' | 'motivation' | 'completion';
  duration?: number;
}

// Generate multiple audio segments for task guidance
export const generateTaskSegments = (task: Task): AudioSegment[] => {
  const segments: AudioSegment[] = [];

  // 1. Welcome & Task Introduction (15-20 seconds)
  segments.push({
    id: `${task.id}_intro`,
    text: `Hey there, cleaning champion! Ready to tackle ${task.description}? This is going to be so satisfying - let's make it fun!`,
    type: 'intro'
  });

  // 2. Get Ready Step (10-15 seconds)
  segments.push({
    id: `${task.id}_prep`,
    text: `First, let's set ourselves up for success! Put on some energizing music, grab any supplies you might need, and take a deep breath. You've got this!`,
    type: 'step'
  });

  // 3. Main Action Step (20-25 seconds)
  segments.push({
    id: `${task.id}_action`,
    text: `Now for the main event! Focus on ${task.description.toLowerCase()} with confidence. Work at your own pace - there's no rush. Each item you organize is a small victory worth celebrating!`,
    type: 'step'
  });

  // 4. Mid-Task Motivation (15-20 seconds)
  segments.push({
    id: `${task.id}_motivation`,
    text: `You're doing amazing! I can already see how great this ${task.category.toLowerCase()} space is going to look. Your future self will thank you for this effort!`,
    type: 'motivation'
  });

  // 5. Final Push (15-20 seconds)
  segments.push({
    id: `${task.id}_finish`,
    text: `Almost there! Give it those final touches and step back to admire your work. You're transforming your space one task at a time!`,
    type: 'step'
  });

  // 6. Completion Celebration (10-15 seconds)
  segments.push({
    id: `${task.id}_complete`,
    text: `Fantastic work! ${task.description} is complete! Take a moment to appreciate what you've accomplished. You're absolutely crushing these goals!`,
    type: 'completion'
  });

  return segments;
};

// Generate overview motivation segments for all tasks
export const generateOverviewSegments = (tasks: Task[], totalTime: number): AudioSegment[] => {
  const segments: AudioSegment[] = [];
  const completedTasks = tasks.filter(t => t.completed).length;
  const remainingTasks = tasks.length - completedTasks;

  // 1. Welcome & Overview (20-25 seconds)
  segments.push({
    id: 'overview_welcome',
    text: `Hello there, amazing person! I'm your AI cleaning coach, and I'm absolutely thrilled to help you transform your space today! You've got ${tasks.length} tasks planned, and I know you're going to feel incredible when we're done.`,
    type: 'intro'
  });

  // 2. Motivation & Encouragement (25-30 seconds)
  segments.push({
    id: 'overview_motivation',
    text: `Here's what I love about you - you're not just thinking about organizing, you're actually taking action! That puts you in the top 10% of people who follow through on their goals. We've got about ${totalTime} minutes of work ahead, but I promise every minute will be worth it.`,
    type: 'motivation'
  });

  // 3. Strategy & Mindset (20-25 seconds)
  segments.push({
    id: 'overview_strategy',
    text: `Remember, this isn't about perfection - it's about progress. Each completed task is going to boost your mood and energy. Take breaks when you need them, celebrate small wins, and most importantly, enjoy the process!`,
    type: 'step'
  });

  // 4. Ready to Start (15-20 seconds)
  segments.push({
    id: 'overview_start',
    text: `Are you ready to create a space that makes you feel proud and peaceful? Let's do this together! I'll be here to cheer you on every step of the way. Let's get started!`,
    type: 'motivation'
  });

  return segments;
};

// Play multiple segments with natural pauses
export const playSegmentSequence = async (
  segments: AudioSegment[],
  onSegmentStart?: (segment: AudioSegment, index: number) => void,
  onSegmentComplete?: (segment: AudioSegment, index: number) => void,
  pauseBetweenSegments: number = 1500 // 1.5 seconds between segments
): Promise<void> => {
  for (let i = 0; i < segments.length; i++) {
    const segment = segments[i];
    
    try {
      onSegmentStart?.(segment, i);
      console.log(`🎵 Playing segment ${i + 1}/${segments.length}:`, segment.type, segment.text.substring(0, 50) + '...');
      
      // Import speakText dynamically to avoid circular dependency
      const { speakText } = await import('./voiceService');
      await speakText(segment.text);
      
      onSegmentComplete?.(segment, i);
      console.log(`🎵 Completed segment ${i + 1}/${segments.length}`);
      
      // Natural pause between segments (except after the last one)
      if (i < segments.length - 1) {
        await new Promise(resolve => setTimeout(resolve, pauseBetweenSegments));
      }
      
    } catch (error) {
      console.error(`Error playing segment ${i + 1}:`, error);
      break;
    }
  }
};