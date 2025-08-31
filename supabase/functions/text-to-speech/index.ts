import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { corsHeaders } from "../_shared/cors.ts"

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { text, voice_name = 'en-US-Neural2-A', language_code = 'en-US' } = await req.json()

    if (!text) {
      return new Response(
        JSON.stringify({ error: 'Text is required' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    const googleApiKey = Deno.env.get('GOOGLE_API_KEY')
    if (!googleApiKey) {
      return new Response(
        JSON.stringify({ error: 'Google API key not configured' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      )
    }

    // Call Google Cloud Text-to-Speech API
    const response = await fetch(`https://texttospeech.googleapis.com/v1/text:synthesize?key=${googleApiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        input: { text },
        voice: {
          languageCode: language_code,
          name: voice_name,
          ssmlGender: 'FEMALE'
        },
        audioConfig: {
          audioEncoding: 'MP3',
          speakingRate: 1.0,
          pitch: 0.0,
          volumeGainDb: 0.0
        }
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Google Text-to-Speech API error:', response.status, errorText)
      return new Response(
        JSON.stringify({ error: 'Failed to generate speech' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: response.status }
      )
    }

    const data = await response.json()
    
    if (!data.audioContent) {
      return new Response(
        JSON.stringify({ error: 'No audio content received' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      )
    }

    // Convert base64 to binary
    const audioData = Uint8Array.from(atob(data.audioContent), c => c.charCodeAt(0))

    return new Response(audioData, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'audio/mpeg',
        'Content-Length': audioData.byteLength.toString(),
      },
    })

  } catch (error) {
    console.error('Error in text-to-speech function:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})