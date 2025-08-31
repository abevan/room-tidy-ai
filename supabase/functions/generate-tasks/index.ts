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

ULTRA-INTELLIGENT TASK GENERATION WITH ENHANCED TIMING & BREAKDOWN:

TASK COMPLEXITY CLASSIFICATION WITH MICRO-TASKS:
🔵 MICRO TASKS (30 seconds - 2 minutes, individual actions):
- Put away single item, hang one towel, close drawer, turn off light, put book back

🟢 SIMPLE TASKS (2-4 minutes, straightforward actions):
- Make bed, tidy small surface, put away 2-3 items, quick bathroom wipe

🟡 MEDIUM TASKS (4-8 minutes, multi-step but contained):
- Organize desk completely, tidy bathroom counter, sort mail pile

🔴 COMPLEX TASKS (8+ minutes, MANDATORY subtask breakdown):
- Any laundry operation, kitchen cleaning, room organization, multiple similar items

CONTEXT-AWARE INTELLIGENCE SYSTEM:

VOLUME DETECTION TRIGGERS:
- 3+ similar items detected = COMPLEX breakdown required
- High confidence (>0.8) = likely multiple items = detailed subtasks
- Low confidence (<0.5) = single item = micro/simple task

LAUNDRY BASKET INTELLIGENCE:
- Laundry basket/hamper detected → COMPLEX: "Complete laundry process" with subtasks:
  * Gather and sort dirty clothes by color (3 min)
  * Load washer with detergent (2 min)
  * Transfer wet clothes to dryer (1 min)
  * Remove dry clothes and fold systematically (7 min)
  * Put away folded clothes in proper locations (4 min)

DISH PILE INTELLIGENCE:
- Multiple dishes/glasses → COMPLEX: "Clean kitchen dishes thoroughly" with subtasks:
  * Scrape and rinse all dishes (3 min)
  * Fill sink or load dishwasher (2 min)
  * Wash dishes or run dishwasher cycle (5 min)
  * Dry and put away clean dishes (3 min)

CLOTHING PILE INTELLIGENCE:
- Clothes scattered + high confidence → COMPLEX: "Organize clothing systematically" with subtasks:
  * Sort clothes by type and destination (4 min)
  * Hang items that wrinkle easily (3 min)
  * Fold and put away remaining clothes (6 min)

BATHROOM ORGANIZATION:
- Multiple bathroom items → COMPLEX: "Organize bathroom completely" with subtasks:
  * Clear and organize counter surfaces (4 min)
  * Put toiletries in proper places (3 min)
  * Wipe surfaces clean (2 min)
  * Replace towels and organize linens (3 min)

ENHANCED TIME ACCURACY SYSTEM:
🔵 Micro: 30s-2min (single actions, no walking between rooms)
🟢 Simple: 2-4min (contained actions, minimal prep)
🟡 Medium: 4-8min (multi-step, some supplies needed)
🔴 Complex: Split into 2-8min subtasks (include transition time)

TRANSITION TIME INTELLIGENCE:
- Add 30-60 seconds for tasks requiring supplies
- Add 1-2 minutes for tasks spanning multiple rooms
- Group related tasks by location for efficiency

CONTEXT-AWARE TASK DESCRIPTIONS:
- Reference specific detected items and locations
- Include efficiency tips and supply needs
- Make descriptions actionable and motivating

MANDATORY BREAKDOWN RULES FOR COMPLEX TASKS:
- NEVER allow single tasks >10 minutes
- Break laundry baskets into 4-5 logical steps
- Break dish piles into preparation→cleaning→finishing
- Include supply gathering as separate subtask when needed
- Sequence tasks logically (clear before clean, sort before store)

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