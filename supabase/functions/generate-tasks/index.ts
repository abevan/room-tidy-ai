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

EXTRAPOLATE INTELLIGENTLY using VISUAL CONTEXT and REAL-WORLD LOGIC:

CONTEXTUAL INTERPRETATION EXAMPLES:
- Clothes in laundry basket/hamper = "Do laundry" (not "organize clothes")
- Dirty dishes by sink/counter = "Wash dishes and clean kitchen" (not "organize dishes")
- Books scattered on floor/desk = "Organize books on shelves" (not "arrange books")
- Empty bottles/cans = "Take out recycling" (not "organize containers")
- Unmade bed with pillows/sheets = "Make bed and organize bedroom" (not "fix bedding")
- Food containers/groceries = "Put away groceries and organize pantry" (not "organize food items")
- Towels on bathroom floor = "Hang towels and tidy bathroom" (not "organize towels")
- Clothes on chair/floor = "Put clothes in closet or hamper" (not "move clothes")
- Shoes scattered = "Organize shoes in closet/rack" (not "arrange footwear")
- Papers/documents messy = "Sort and file paperwork" (not "organize papers")
- Electronics/cables tangled = "Organize tech setup and manage cables" (not "arrange electronics")

ADVANCED CONTEXTUAL RULES:
- IF items are near sink/kitchen → cleaning/washing tasks
- IF items are on floor → put away/organize tasks  
- IF items are scattered → consolidation/organization tasks
- IF items look dirty/used → cleaning tasks first, then organizing
- IF storage containers visible → utilize them in task descriptions

CRITICAL CONSOLIDATION - NO DUPLICATES:
- Multiple dirty items in same area = ONE comprehensive cleaning task
- Multiple similar items = ONE organizing task covering all
- Never create separate tasks for items that can be handled together
- Merge bathroom items, kitchen items, bedroom items into area-based tasks

LOGICAL WORKFLOW SEQUENCE:
1. CLEARING PHASE: Remove trash, return misplaced items to proper rooms
2. CLEANING PHASE: Wash dishes, do laundry, clean surfaces (items that need water/supplies)  
3. ORGANIZING PHASE: Put items in permanent homes, arrange furniture
4. FINISHING PHASE: Make beds, final tidying touches

TASK NAMING MUST BE SPECIFIC AND ACTIONABLE:
✅ GOOD: "Do laundry and organize bedroom closet"
✅ GOOD: "Wash dishes and wipe down kitchen counters"  
✅ GOOD: "Sort mail and organize desk workspace"
❌ BAD: "Take care of clothes"
❌ BAD: "Clean kitchen items"
❌ BAD: "Organize miscellaneous items"

Return JSON array with this structure:
{
  "id": "unique_id",
  "category": "Kitchen/Bathroom/Living Room/Bedroom/General",
  "description": "Specific action that combines context + visual cues", 
  "estimatedTime": minutes_as_number,
  "priority": "high/medium/low",
  "completed": false
}

Be ruthlessly contextual and consolidate aggressively. Only return valid JSON, no other text.`

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