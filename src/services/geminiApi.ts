import { supabase } from '@/integrations/supabase/client';

interface DetectedItem {
  id: string;
  name: string;
  confidence: number;
  location?: string;
}

interface Task {
  id: string;
  description: string;
  timeEstimate: number;
  completed: boolean;
  category: string;
  subtasks?: Subtask[];
}

interface Subtask {
  id: string;
  description: string;
  timeEstimate: number;
  completed: boolean;
}

export const generateTodoList = async (items: DetectedItem[]): Promise<Task[]> => {
  try {
    // Input validation
    if (!Array.isArray(items) || items.length === 0) {
      throw new Error('Invalid items data');
    }

    // Call secure Edge Function using the Supabase client
    const { data, error } = await supabase.functions.invoke('generate-tasks', {
      body: {
        action: 'generateTasks',
        items: items
      }
    });

    if (error) {
      throw new Error(`Task generation failed: ${error.message}`);
    }

    const { tasks } = data;

    // Validate and format tasks (preserve subtasks from edge function)
    return tasks.map((task: any, index: number) => ({
      id: task.id || `task_${index}`,
      description: task.description || 'Unknown task',
      timeEstimate: Math.max(task.timeEstimate || task.estimatedTime || 5, 1),
      completed: false,
      category: task.category || 'General',
      subtasks: task.subtasks ? task.subtasks.map((subtask: any, subIndex: number) => ({
        id: subtask.id || `subtask_${index}_${subIndex}`,
        description: subtask.description || 'Unknown subtask',
        timeEstimate: Math.max(subtask.timeEstimate || subtask.estimatedTime || 2, 1),
        completed: false
      })) : []
    }));

  } catch (error) {
    console.error('Error generating todo list:', error);
    throw new Error('Failed to generate todo list');
  }
};

export const breakdownTask = async (taskDescription: string): Promise<Subtask[]> => {
  try {
    // Input validation
    if (!taskDescription || typeof taskDescription !== 'string' || taskDescription.trim().length === 0) {
      throw new Error('Invalid task description');
    }

    // Sanitize input
    const sanitizedDescription = taskDescription.trim().slice(0, 500);

    // Call secure Edge Function using the Supabase client
    const { data, error } = await supabase.functions.invoke('generate-tasks', {
      body: {
        action: 'breakdownTask',
        taskDescription: sanitizedDescription
      }
    });

    if (error) {
      throw new Error(`Task breakdown failed: ${error.message}`);
    }

    const { subtasks } = data;

    // Validate and format subtasks
    return subtasks.map((subtask: any, index: number) => ({
      id: subtask.id || `subtask_${index}`,
      description: subtask.description || 'Unknown subtask',
      timeEstimate: Math.max(subtask.timeEstimate || subtask.estimatedTime || 2, 1),
      completed: false
    }));

  } catch (error) {
    console.error('Error breaking down task:', error);
    throw new Error('Failed to breakdown task');
  }
};