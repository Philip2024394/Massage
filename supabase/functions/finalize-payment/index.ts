import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { entityId, entityType, planDuration } = await req.json()

    if (!entityId || !entityType || !planDuration) {
      throw new Error('Missing required parameters: entityId, entityType, or planDuration.')
    }
    if (entityType !== 'therapist' && entityType !== 'place') {
      throw new Error('Invalid entityType specified.')
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const tableName = entityType === 'therapist' ? 'therapists' : 'places';
    
    const expiryDate = new Date();
    expiryDate.setMonth(expiryDate.getMonth() + Number(planDuration));

    const { error } = await supabaseAdmin
      .from(tableName)
      .update({ 
        status: 'pending', 
        account_expiry: expiryDate.toISOString() 
      })
      .eq('id', entityId);

    if (error) throw error;

    return new Response(JSON.stringify({ message: 'Account payment finalized and is pending approval.' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (error) {
    console.error('Error in finalize-payment function:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})
