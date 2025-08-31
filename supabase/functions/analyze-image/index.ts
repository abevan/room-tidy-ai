import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { corsHeaders } from '../_shared/cors.ts'

interface DetectedObject {
  id: string;
  name: string;
  confidence: number;
  location?: string;
}

serve(async (req) => {
  console.log('=== Analyze Image Function Called ===')
  
  // Handle CORS
  if (req.method === 'OPTIONS') {
    console.log('CORS preflight request')
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log('Processing POST request...')
    const requestBody = await req.json()
    console.log('Request body keys:', Object.keys(requestBody))
    
    const { imageData, mimeType } = requestBody
    
    if (!imageData) {
      console.error('No image data provided')
      return new Response(
        JSON.stringify({ error: 'Image data is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('Image data length:', imageData.length)
    console.log('MIME type:', mimeType)

    const apiKey = Deno.env.get('GOOGLE_API_KEY')
    if (!apiKey) {
      console.error('Google API key not found in environment')
      return new Response(
        JSON.stringify({ error: 'API key not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }
    
    console.log('Google API key found, proceeding with analysis...')

    // Call Gemini Vision API
    const prompt = `Analyze this image and identify cleaning and organization tasks. Look for:
    - Dishes that need washing
    - Items that are out of place
    - Surfaces that need cleaning
    - Clutter that needs organizing
    - Trash that needs disposal
    - Laundry that needs attention
    - Areas that need tidying

    Return a JSON array of objects with this structure:
    {
      "id": "unique_id",
      "name": "Task description",
      "confidence": 0.8,
      "location": "where in the room"
    }

    Only return valid JSON, no other text.`

    console.log('Calling Google Gemini API...')
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [
            { text: prompt },
            {
              inline_data: {
                mime_type: mimeType,
                data: imageData
              }
            }
          ]
        }],
        generationConfig: {
          temperature: 0.1,
          topK: 32,
          topP: 1.0,
          maxOutputTokens: 2048,
        }
      })
    })
    
    console.log('Google API response status:', response.status)

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Google API error:', response.status, errorText)
      throw new Error(`Google API error: ${response.status} - ${errorText}`)
    }

    const data = await response.json()
    console.log('Google API response received')
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text

    if (!text) {
      console.error('No text in response:', JSON.stringify(data, null, 2))
      throw new Error('No response from Google API')
    }
    
    console.log('AI response text:', text.substring(0, 200) + '...')

    // Parse the JSON response
    let detectedObjects: DetectedObject[]
    try {
      const cleanedText = text.replace(/```json\n?|\n?```/g, '').trim()
      console.log('Parsing cleaned text:', cleanedText.substring(0, 100) + '...')
      detectedObjects = JSON.parse(cleanedText)
      console.log('Successfully parsed', detectedObjects.length, 'detected objects')
    } catch (parseError) {
      console.error('Failed to parse response:', text)
      console.error('Parse error:', parseError)
      throw new Error('Invalid response format from AI')
    }

    console.log('Returning successful response')
    return new Response(
      JSON.stringify({ detectedObjects }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )

  } catch (error) {
    console.error('=== Error analyzing image ===')
    console.error('Error type:', error.constructor.name)
    console.error('Error message:', error.message)
    console.error('Error stack:', error.stack)
    
    return new Response(
      JSON.stringify({ 
        error: 'Failed to analyze image',
        details: error.message 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})