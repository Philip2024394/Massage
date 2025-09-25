import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

serve(async (req) => {
  // Handle CORS preflight request
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { type, code, payload } = await req.json()

    if (!type || !code || !payload) {
      throw new Error('Missing required parameters: type, code, or payload.')
    }
    if (type !== 'therapist' && type !== 'place') {
      throw new Error('Invalid type specified. Must be "therapist" or "place".')
    }

    // Create a Supabase client with the service role key to bypass RLS
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const tableName = type === 'therapist' ? 'therapists' : 'places';

    // First, find the record by its login_code to get the ID for the update
    const { data: record, error: findError } = await supabaseAdmin
      .from(tableName)
      .select('id')
      .eq('login_code', code)
      .single()

    if (findError || !record) {
      console.error(`Find error for ${type} with code ${code}:`, findError)
      return new Response(JSON.stringify({ error: `Profile with code ${code} not found.` }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 404,
      })
    }

    // Now, update the record using its ID
    const { error: updateError } = await supabaseAdmin
      .from(tableName)
      .update(payload)
      .eq('id', record.id)

    if (updateError) {
      console.error(`Update error for ${type} with id ${record.id}:`, updateError)
      throw new Error(`Failed to update profile: ${updateError.message}`)
    }

    return new Response(JSON.stringify({ message: 'Profile updated successfully' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (error) {
    console.error('Error in update-profile function:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})
