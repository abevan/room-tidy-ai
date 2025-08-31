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

INTELLIGENT CONTEXTUAL TASK GENERATION:

VISUAL CONTEXT INTERPRETATION RULES:
- Clothes near laundry basket/hamper = "Do laundry" (wash, dry, fold)
- Clothes scattered on floor/bed/chair = "Organize clothing" (sort, put away properly)
- Dirty dishes in sink/counter = "Wash dishes and clean kitchen surfaces"
- Food items/groceries visible = "Put away groceries and organize pantry"
- Unmade bed = "Make bed and tidy bedroom"
- Towels on floor/scattered = "Hang towels properly and organize bathroom"
- Shoes scattered = "Organize shoes on rack or in closet"
- Books/papers messy = "Sort and organize reading materials"
- Electronics/cables tangled = "Organize electronics and manage cables"
- Trash/recyclables visible = "Empty trash and take out recycling"
- Multiple items same room = CREATE ONE COMPREHENSIVE ROOM-BASED TASK

LOCATION-BASED CONSOLIDATION:
- Kitchen items → "Clean and organize kitchen" (dishes, counters, appliances)
- Bathroom items → "Clean and organize bathroom" (towels, toiletries, surfaces)
- Bedroom items → "Tidy and organize bedroom" (bed, clothes, surfaces)
- Living room → "Clean and organize living space" (furniture, electronics, books)

SMART TASK PRIORITIES:
1. HIGH: Health/hygiene (dirty dishes, trash, bathroom cleaning)
2. MEDIUM: Organization (clothes, books, general tidying)
3. LOW: Aesthetic improvements (decorating, non-essential organizing)

TASK WORKFLOW LOGIC:
1. CLEAR first: Remove trash, return misplaced items
2. CLEAN next: Wash items that need water/supplies
3. ORGANIZE last: Put items in permanent homes

CONTEXTUAL INTELLIGENCE EXAMPLES:
- If laundry basket is visible with clothes → "Do laundry load (wash, dry, fold clothes from basket)"
- If kitchen sink has dishes → "Wash dishes and wipe down kitchen counters" 
- If bed is unmade → "Make bed and organize bedroom surfaces"
- If multiple bathroom items → "Clean bathroom and organize toiletries"

NEVER create generic tasks like "organize items" or "clean things". ALWAYS be specific about:
- What exactly needs to be done
- Where it needs to be done
- Why it makes sense (context from what was detected)

TIME ESTIMATES (be realistic):
- Simple tasks (make bed): 1-2 minutes
- Medium tasks (wash dishes): 3-5 minutes  
- Complex tasks (full room organization): 6-9 minutes

Return JSON array with this structure:
{
  "id": "unique_id",
  "category": "Kitchen/Bathroom/Bedroom/Living Room/General",
  "description": "Specific, contextual action based on visual detection",
  "estimatedTime": minutes_as_number,
  "priority": "high/medium/low",
  "completed": false
}

Be ruthlessly intelligent and contextual. Only return valid JSON, no other text.`

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