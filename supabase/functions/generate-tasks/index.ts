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
  timeEstimate: number;
  priority: 'low' | 'medium' | 'high';
  completed: boolean;
  subtasks?: Array<{
    id: string;
    description: string;
    timeEstimate: number;
    completed: boolean;
  }>;
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Parse request body once and store it
    const requestBody = await req.json()
    const { action, items, taskDescription } = requestBody
    
    // Input validation
    if (!action || typeof action !== 'string') {
      return new Response(
        JSON.stringify({ error: 'Missing or invalid action parameter' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }
    
    if (action === 'generateTasks') {
      if (!items || !Array.isArray(items) || items.length === 0) {
        return new Response(
          JSON.stringify({ error: 'Missing or invalid items array' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
      return await generateTaskList(items)
    } else if (action === 'breakdownTask') {
      if (!taskDescription || typeof taskDescription !== 'string') {
        return new Response(
          JSON.stringify({ error: 'Missing or invalid taskDescription parameter' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
      return await breakdownTask(taskDescription)
    } else {
      return new Response(
        JSON.stringify({ error: `Invalid action: ${action}. Expected 'generateTasks' or 'breakdownTask'` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

  } catch (error) {
    console.error('Error processing request:', error)
    return new Response(
      JSON.stringify({ 
        error: 'Failed to process request',
        details: error instanceof Error ? error.message : 'Unknown error'
      }),
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

INTELLIGENT TASK GENERATION SYSTEM:

DETECTION ANALYSIS:
- High confidence (>0.8) = Clear, accurate detection
- Medium confidence (0.5-0.8) = Likely accurate detection  
- Low confidence (<0.5) = Uncertain detection, create general cleanup task

VOLUME DETECTION:
- Count similar item names (e.g., "clothes", "dish", "book") to determine quantity
- 3+ similar items = Create COMPLEX task with subtasks
- 1-2 items = Create SIMPLE task

TASK COMPLEXITY CLASSIFICATION:
🔵 SIMPLE TASKS (2-6 minutes):
- Put away 1-2 items, make bed, quick surface wipe, organize small area

🟡 MEDIUM TASKS (6-10 minutes):  
- Organize desk completely, tidy bathroom counter, sort papers, vacuum one room

🔴 COMPLEX TASKS (broken into 3-8 minute subtasks):
- Multiple items detected, laundry operations, deep cleaning, room organization

INTELLIGENT SCENARIO DETECTION:

LAUNDRY DETECTION ("clothes", "laundry", "hamper"):
→ COMPLEX: "Complete laundry cycle" (Total: 18 min)
Subtasks:
* Gather and sort clothes by color (4 min)
* Load washer with appropriate detergent (3 min)  
* Wait for wash cycle and transfer to dryer (2 min)
* Fold clean clothes systematically (5 min)
* Put away all folded items (4 min)

KITCHEN CLEANUP ("dishes", "plates", "glasses", "kitchen"):
→ COMPLEX: "Clean kitchen dishes" (Total: 15 min)
Subtasks:
* Clear and scrape all dishes (3 min)
* Load dishwasher or fill sink (2 min)
* Wash dishes thoroughly (6 min)
* Dry and put away clean dishes (4 min)

CLOTHING ORGANIZATION ("clothes" scattered):
→ COMPLEX: "Organize scattered clothing" (Total: 12 min)
Subtasks:
* Sort clothes by type and condition (3 min)
* Hang delicate or wrinkle-prone items (4 min)
* Fold and store remaining clothes (5 min)

CATEGORY ASSIGNMENT INTELLIGENCE:
- "dish", "plate", "cup", "kitchen" → Kitchen
- "towel", "toilet", "sink", "bathroom" → Bathroom  
- "bed", "pillow", "clothes", "dresser" → Bedroom
- "couch", "table", "living", "TV" → Living Room
- Everything else → General

REALISTIC TIME ESTIMATES:
- Include realistic human movement time
- Account for decision-making and setup
- Add buffer time for unexpected complications
- Never exceed 10 minutes for any single task or subtask

MATHEMATICAL ACCURACY:
- Complex task timeEstimate = sum of all subtask timeEstimates
- Validate that totals are mathematically correct
- Round to whole minutes only

Return JSON array:
{
  "id": "task_1",
  "category": "Kitchen/Bathroom/Bedroom/Living Room/General", 
  "description": "Action-oriented task description",
  "timeEstimate": total_minutes_number,
  "priority": "high/medium/low",
  "completed": false,
  "subtasks": [
    {
      "id": "subtask_1", 
      "description": "Specific actionable step",
      "timeEstimate": step_minutes_number,
      "completed": false
    }
  ]
}

For SIMPLE tasks, omit "subtasks" field entirely.
Only return valid JSON, no explanatory text.`

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
      const cleanedText = text.replace(/```json\n?|\n?```/g, '').trim()
      tasks = JSON.parse(cleanedText)
      
      // Validate task structure
      if (!Array.isArray(tasks)) {
        throw new Error('Response is not an array')
      }
      
      // Validate and fix each task
      tasks = tasks.map((task: any, index: number) => ({
        id: task.id || `task_${index + 1}`,
        category: task.category || 'General',
        description: task.description || 'Unknown task',
        timeEstimate: Math.max(Number(task.timeEstimate || task.estimatedTime || 5), 1),
        priority: ['low', 'medium', 'high'].includes(task.priority) ? task.priority : 'medium',
        completed: false,
        subtasks: task.subtasks ? task.subtasks.map((subtask: any, subIndex: number) => ({
          id: subtask.id || `subtask_${index}_${subIndex}`,
          description: subtask.description || 'Unknown subtask',
          timeEstimate: Math.max(Number(subtask.timeEstimate || subtask.estimatedTime || 2), 1),
          completed: false
        })) : undefined
      }))
      
    } catch (parseError) {
      console.error('Failed to parse AI response:', text)
      console.error('Parse error:', parseError)
      
      // Fallback: Create simple tasks from detected items
      tasks = items.slice(0, 5).map((item, index) => ({
        id: `fallback_task_${index}`,
        category: 'General',
        description: `Clean up ${item.name}${item.location ? ` in ${item.location}` : ''}`,
        timeEstimate: Math.min(Math.max(Math.round(10 - item.confidence * 5), 3), 8),
        priority: item.confidence > 0.7 ? 'high' : 'medium' as 'high' | 'medium',
        completed: false
      }))
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
      const cleanedText = text.replace(/```json\n?|\n?```/g, '').trim()
      subtasks = JSON.parse(cleanedText)
      
      // Validate and fix subtasks
      if (!Array.isArray(subtasks)) {
        throw new Error('Response is not an array')
      }
      
      subtasks = subtasks.map((subtask: any, index: number) => ({
        id: subtask.id || `breakdown_${index}`,
        description: subtask.description || 'Complete step',
        timeEstimate: Math.max(Number(subtask.timeEstimate || subtask.estimatedTime || 3), 1),
        completed: false
      }))
      
    } catch (parseError) {
      console.error('Failed to parse subtask response:', text)
      console.error('Parse error:', parseError)
      
      // Fallback: Create generic subtasks
      subtasks = [
        {
          id: 'fallback_1',
          description: `Start working on: ${taskDescription}`,
          timeEstimate: 5,
          completed: false
        },
        {
          id: 'fallback_2', 
          description: `Complete: ${taskDescription}`,
          timeEstimate: 5,
          completed: false
        }
      ]
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