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

// Generate task-specific audio segments for better coaching
export const generateTaskSegments = (task: Task): AudioSegment[] => {
  const segments: AudioSegment[] = [];
  const taskName = task.description.toLowerCase();
  const category = task.category.toLowerCase();

  // 1. Task Introduction (15-20 seconds) - Specific to the task
  segments.push({
    id: `${task.id}_intro`,
    text: `Let's tackle ${task.description}! This ${category} task will make a real difference in how your space looks and feels.`,
    type: 'intro'
  });

  // 2. Preparation Step (10-15 seconds) - Task-specific prep
  const prepText = getTaskSpecificPrep(task.description, category);
  segments.push({
    id: `${task.id}_prep`,
    text: prepText,
    type: 'step'
  });

  // 3. Main Action Step (20-25 seconds) - Detailed task instructions
  const actionText = getTaskSpecificAction(task.description, category);
  segments.push({
    id: `${task.id}_action`,
    text: actionText,
    type: 'step'
  });

  // 4. Completion (10-15 seconds) - Specific achievement
  segments.push({
    id: `${task.id}_complete`,
    text: `Great work! ${task.description} is complete. Notice how much cleaner and more organized this ${category} area looks now.`,
    type: 'completion'
  });

  return segments;
};

// Helper function for task-specific preparation instructions
const getTaskSpecificPrep = (description: string, category: string): string => {
  const lowerDesc = description.toLowerCase();
  
  if (lowerDesc.includes('clothes') || lowerDesc.includes('shirts') || lowerDesc.includes('pants')) {
    return "First, clear a flat surface like your bed or dresser. Grab any hangers you'll need and have a donation bag ready for items you no longer wear.";
  }
  
  if (lowerDesc.includes('dishes') || lowerDesc.includes('plates') || lowerDesc.includes('kitchen')) {
    return "Clear some counter space and have your dish soap and sponge ready. Fill the sink with warm soapy water if needed.";
  }
  
  if (lowerDesc.includes('books') || lowerDesc.includes('papers') || lowerDesc.includes('documents')) {
    return "Have a recycling bin nearby for papers you don't need. Keep any important documents separate to file properly.";
  }
  
  if (lowerDesc.includes('toys') || lowerDesc.includes('games')) {
    return "Check that all toy containers or boxes are accessible. Have a cloth ready to wipe down any dusty items.";
  }
  
  return `Prepare the area around ${description.toLowerCase()} by clearing a small workspace and having a cloth handy for cleaning.`;
};

// Helper function for task-specific action instructions  
const getTaskSpecificAction = (description: string, category: string): string => {
  const lowerDesc = description.toLowerCase();
  
  if (lowerDesc.includes('clothes') || lowerDesc.includes('shirts') || lowerDesc.includes('pants')) {
    return "Sort items by type - shirts together, pants together. Fold or hang each piece neatly. Put similar colors together and arrange by frequency of use.";
  }
  
  if (lowerDesc.includes('dishes') || lowerDesc.includes('plates') || lowerDesc.includes('kitchen')) {
    return "Wash items from least dirty to most dirty. Rinse each piece thoroughly and place in the drying rack. Wipe down the counter when finished.";
  }
  
  if (lowerDesc.includes('books') || lowerDesc.includes('papers') || lowerDesc.includes('documents')) {
    return "Group similar items together. Stack books by size with larger ones on bottom. File important papers in their proper places and recycle what you don't need.";
  }
  
  if (lowerDesc.includes('toys') || lowerDesc.includes('games')) {
    return "Group toys by type or size. Put complete sets together and check that game pieces are all present. Store frequently used items in easy-to-reach places.";
  }
  
  return `Organize ${description.toLowerCase()} by grouping similar items together and arranging them neatly in their designated space.`;
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

// Store audio objects for replay functionality
const audioCache = new Map<string, HTMLAudioElement>();

// Play multiple segments with natural pauses and audio storage
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

// Play a specific segment by index
export const playSpecificSegment = async (
  segments: AudioSegment[],
  segmentIndex: number
): Promise<void> => {
  if (segmentIndex < 0 || segmentIndex >= segments.length) {
    throw new Error('Invalid segment index');
  }
  
  const segment = segments[segmentIndex];
  console.log(`🎵 Playing specific segment ${segmentIndex + 1}:`, segment.text.substring(0, 50) + '...');
  
  const { speakText } = await import('./voiceService');
  await speakText(segment.text);
};