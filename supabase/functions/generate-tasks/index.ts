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

Analyze the context and create specific, actionable cleaning tasks. Be contextual - if you see clothes in a laundry basket, suggest "Do dirty laundry" not just "organize clothes". If there are dishes by a sink, say "Wash dishes" not "clean kitchen items". 

CRITICAL: Avoid creating duplicate or similar tasks. If multiple items suggest the same action (e.g., multiple clothing items), create ONE comprehensive task rather than separate tasks. Group related items into single efficient tasks.

Create tasks in logical order for maximum efficiency - start with tasks that clear space, then deep cleaning, then organizing. Combine similar actions into single tasks when possible.

Each task should be broken down into 3-5 detailed substeps that are perfect for voice coaching guidance. The substeps should be specific enough that a personal cleaning coach could walk someone through each one with encouragement and tips.

Return a JSON array of tasks with this structure:
{
  "id": "unique_id",
  "category": "Kitchen/Bathroom/Living Room/Bedroom/General",
  "description": "Specific, contextual task description that combines related items when appropriate",
  "estimatedTime": minutes_as_number,
  "priority": "high/medium/low",
  "completed": false
}

Order tasks logically: decluttering first, then cleaning surfaces, then organizing. Be specific about actions based on the detected items. Consolidate similar tasks into comprehensive actions. Only return valid JSON, no other text.`

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