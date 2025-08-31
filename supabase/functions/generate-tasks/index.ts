import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { corsHeaders } from '../_shared/cors.ts'

interface DetectedItem {
  id: string;
  name: string;
  confidence: number;
  location?: string;
}

interface Task {
  id: string;
  category: string;
  description: string;
  estimatedTime: number;
  priority: 'low' | 'medium' | 'high';
  completed: boolean;
  subtasks?: Array<{
    id: string;
    description: string;
    estimatedTime: number;
    completed: boolean;
  }>;
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { items, action } = await req.json()
    
    if (action === 'generateTasks') {
      return await generateTaskList(items)
    } else if (action === 'breakdownTask') {
      const { taskDescription } = await req.json()
      return await breakdownTask(taskDescription)
    } else {
      return new Response(
        JSON.stringify({ error: 'Invalid action' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

  } catch (error) {
    console.error('Error processing request:', error)
    return new Response(
      JSON.stringify({ error: 'Failed to process request' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})

async function generateTaskList(items: DetectedItem[]) {
  const apiKey = Deno.env.get('GOOGLE_API_KEY')
  if (!apiKey) {
    return new Response(
      JSON.stringify({ error: 'API key not configured' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

const prompt = `Based on these detected items: ${JSON.stringify(items)}

INTELLIGENT TASK GENERATION WITH SMART COMPLEXITY RECOGNITION:

TASK COMPLEXITY CLASSIFICATION:
🟢 SIMPLE TASKS (1-3 minutes, no subtasks needed):
- Make bed, put away single items, quick tidying, hang towel, close drawers

🟡 MEDIUM TASKS (4-8 minutes, may need 2-3 substeps):
- Wash dishes, organize desk, put away groceries, tidy bathroom counter

🔴 COMPLEX TASKS (require detailed subtask breakdown):
- Do laundry, deep clean kitchen, organize entire room, meal prep

VISUAL CONTEXT → SMART TASK MAPPING:

LAUNDRY DETECTION:
- Clothes near hamper/basket → COMPLEX: "Complete laundry cycle" with subtasks:
  * Gather and sort clothes (3 min)
  * Load washer and start cycle (2 min)  
  * Transfer to dryer (2 min)
  * Remove and fold clean clothes (8 min)
- Few scattered clothes → SIMPLE: "Put away clothes" (2 min)

KITCHEN DETECTION:
- Multiple dirty dishes → COMPLEX: "Clean kitchen thoroughly" with subtasks:
  * Clear and rinse dishes (4 min)
  * Load dishwasher or hand wash (6 min)
  * Wipe counters and surfaces (3 min)
  * Put away clean items (2 min)
- Single plate/cup → SIMPLE: "Wash and put away dish" (2 min)

SHOE ORGANIZATION:
- Multiple shoes scattered → MEDIUM: "Organize footwear" (3 min)
- 1-2 pairs → SIMPLE: "Put away shoes" (1 min)

BEDROOM DETECTION:
- Unmade bed only → SIMPLE: "Make bed" (2 min)
- Clothes + unmade bed → COMPLEX: "Organize bedroom" with subtasks:
  * Make bed properly (2 min)
  * Sort and put away clothes (5 min)
  * Clear surfaces and organize (4 min)

REALISTIC TIME ESTIMATES BY COMPLEXITY:
🟢 Simple: 1-3 minutes (put away 2-3 items, make bed, quick wipe)
🟡 Medium: 4-8 minutes (organize desk, tidy bathroom, sort mail)  
🔴 Complex: Split into logical subtasks with realistic step times

SUBTASK GENERATION RULES FOR COMPLEX TASKS:
- Preparation steps (gather, sort, clear): 2-4 min
- Active work steps (wash, load, organize): 3-8 min
- Finishing steps (put away, wipe down): 2-5 min
- NEVER exceed 10 minutes for a single subtask

Return JSON array. For COMPLEX tasks, include "subtasks" array:
{
  "id": "unique_id",
  "category": "Kitchen/Bathroom/Bedroom/Living Room/General",
  "description": "Main task description",
  "estimatedTime": total_minutes_for_all_subtasks,
  "priority": "high/medium/low",
  "completed": false,
  "subtasks": [
    {
      "id": "subtask_id",
      "description": "Specific step description",
      "estimatedTime": step_minutes,
      "completed": false
    }
  ]
}

For SIMPLE/MEDIUM tasks, omit the "subtasks" field entirely.

BE RUTHLESSLY ACCURATE WITH TIME ESTIMATES. Think about actual human movement and task complexity.

Only return valid JSON, no other text.`

  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{ text: prompt }]
        }],
        generationConfig: {
          temperature: 0.3,
          topK: 32,
          topP: 1.0,
          maxOutputTokens: 2048,
        }
      })
    })

    if (!response.ok) {
      throw new Error(`Google API error: ${response.status}`)
    }

    const data = await response.json()
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text

    if (!text) {
      throw new Error('No response from Google API')
    }

    let tasks: Task[]
    try {
      tasks = JSON.parse(text.replace(/```json\n?|\n?```/g, '').trim())
    } catch (parseError) {
      console.error('Failed to parse response:', text)
      throw new Error('Invalid response format from AI')
    }

    return new Response(
      JSON.stringify({ tasks }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )

  } catch (error) {
    console.error('Error generating tasks:', error)
    return new Response(
      JSON.stringify({ error: 'Failed to generate tasks' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
}

async function breakdownTask(taskDescription: string) {
  const apiKey = Deno.env.get('GOOGLE_API_KEY')
  if (!apiKey) {
    return new Response(
      JSON.stringify({ error: 'API key not configured' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  const prompt = `Break down this cleaning task into smaller, actionable steps: "${taskDescription}"

Return a JSON array of subtasks with this structure:
{
  "id": "unique_id",
  "description": "Specific step description",
  "estimatedTime": minutes_as_number,
  "completed": false
}

Make steps clear, sequential, and include any supplies needed. Only return valid JSON, no other text.`

  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{ text: prompt }]
        }],
        generationConfig: {
          temperature: 0.3,
          topK: 32,
          topP: 1.0,
          maxOutputTokens: 1024,
        }
      })
    })

    if (!response.ok) {
      throw new Error(`Google API error: ${response.status}`)
    }

    const data = await response.json()
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text

    if (!text) {
      throw new Error('No response from Google API')
    }

    let subtasks
    try {
      subtasks = JSON.parse(text.replace(/```json\n?|\n?```/g, '').trim())
    } catch (parseError) {
      console.error('Failed to parse response:', text)
      throw new Error('Invalid response format from AI')
    }

    return new Response(
      JSON.stringify({ subtasks }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )

  } catch (error) {
    console.error('Error breaking down task:', error)
    return new Response(
      JSON.stringify({ error: 'Failed to breakdown task' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
}