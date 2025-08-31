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

export const generateTodoList = async (items: DetectedItem[], apiKey: string): Promise<Task[]> => {
  try {
    const itemsDescription = items.map(item => {
      const location = item.location ? ` (${item.location})` : '';
      return `${item.name}${location}`;
    }).join(', ');

    const prompt = `You are an expert room organizer and cleaning assistant. Based on the following items detected in a room, create a comprehensive cleaning and organizing to-do list.

Items detected: ${itemsDescription}

Please create a realistic cleaning plan with the following requirements:
1. Group related tasks by category (Clothing, Surface, Items, General)
2. Provide realistic time estimates in minutes for each task
3. Focus on cleaning, organizing, and tidying actions
4. Be specific about what needs to be done
5. Prioritize tasks that make the biggest visual impact

Respond ONLY with a valid JSON array of tasks in this exact format:
[
  {
    "id": "1",
    "description": "Task description",
    "timeEstimate": 10,
    "completed": false,
    "category": "Category"
  }
]

Do not include any other text or explanations.`;

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: prompt
          }]
        }],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 1000,
        }
      })
    });

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    const content = data.candidates[0].content.parts[0].text;
    
    // Extract JSON from the response
    const jsonMatch = content.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      throw new Error('No valid JSON found in response');
    }

    const tasks = JSON.parse(jsonMatch[0]);
    return tasks;
  } catch (error) {
    console.error('Gemini API error:', error);
    throw error;
  }
};

export const breakdownTask = async (taskDescription: string, apiKey: string): Promise<Subtask[]> => {
  try {
    const prompt = `Break down the following cleaning/organizing task into smaller, actionable sub-tasks with realistic time estimates.

Task: "${taskDescription}"

Create 3-5 specific sub-tasks that are easy to follow and complete. Each sub-task should take between 1-5 minutes.

Respond ONLY with a valid JSON array in this exact format:
[
  {
    "id": "a",
    "description": "Subtask description",
    "timeEstimate": 3,
    "completed": false
  }
]

Do not include any other text or explanations.`;

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: prompt
          }]
        }],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 500,
        }
      })
    });

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    const content = data.candidates[0].content.parts[0].text;
    
    const jsonMatch = content.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      throw new Error('No valid JSON found in response');
    }

    const subtasks = JSON.parse(jsonMatch[0]);
    return subtasks;
  } catch (error) {
    console.error('Gemini breakdown error:', error);
    throw error;
  }
};