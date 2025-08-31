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
    const response = await fetch(`https://fjnylpbqothaykvdqcsr.supabase.co/functions/v1/generate-tasks`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZqbnlscGJxb3RoYXlrdmRxY3NyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY2NTg2MDMsImV4cCI6MjA3MjIzNDYwM30.VSEEsQxgzsHDl51nEGdTNePA8mq2A8mwtCZbNaWhABM`
      },
      body: JSON.stringify({
        action: 'generateTasks',
        items: items
      })
    });

    if (!response.ok) {
      throw new Error(`Task generation failed: ${response.status}`);
    }

    const { tasks } = await response.json();

    // Validate and format tasks
    return tasks.map((task: any, index: number) => ({
      id: task.id || `task_${index}`,
      description: task.description || 'Unknown task',
      timeEstimate: Math.max(task.estimatedTime || task.timeEstimate || 5, 1),
      completed: false,
      category: task.category || 'General',
      subtasks: []
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
    const response = await fetch(`https://fjnylpbqothaykvdqcsr.supabase.co/functions/v1/generate-tasks`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZqbnlscGJxb3RoYXlrdmRxY3NyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY2NTg2MDMsImV4cCI6MjA3MjIzNDYwM30.VSEEsQxgzsHDl51nEGdTNePA8mq2A8mwtCZbNaWhABM`
      },
      body: JSON.stringify({
        action: 'breakdownTask',
        taskDescription: sanitizedDescription
      })
    });

    if (!response.ok) {
      throw new Error(`Task breakdown failed: ${response.status}`);
    }

    const { subtasks } = await response.json();

    // Validate and format subtasks
    return subtasks.map((subtask: any, index: number) => ({
      id: subtask.id || `subtask_${index}`,
      description: subtask.description || 'Unknown subtask',
      timeEstimate: Math.max(subtask.estimatedTime || subtask.timeEstimate || 2, 1),
      completed: false
    }));

  } catch (error) {
    console.error('Error breaking down task:', error);
    throw new Error('Failed to breakdown task');
  }
};