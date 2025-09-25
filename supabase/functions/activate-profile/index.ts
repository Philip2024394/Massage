import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

const activationCodes: Record<string, number> = {
  'MASSAGE-3': 3,
  'MASSAGE-6': 6,
  'MASSAGE-9': 9,
  'MASSAGE-12': 12,
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { entityId, entityType, activationCode } = await req.json()

    if (!entityId || !entityType || !activationCode) {
      throw new Error('Missing required parameters: entityId, entityType, or activationCode.')
    }
    if (entityType !== 'therapist' && entityType !== 'place') {
      throw new Error('Invalid entityType specified.')
    }
    
    const upperCaseCode = activationCode.toUpperCase();
    const months = activationCodes[upperCaseCode];

    if (!months) {
      throw new Error('Invalid activation code.');
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const tableName = entityType === 'therapist' ? 'therapists' : 'places';
    
    const expiryDate = new Date();
    expiryDate.setMonth(expiryDate.getMonth() + months);

    const { error } = await supabaseAdmin
      .from(tableName)
      .update({ 
        status: 'active', 
        account_expiry: expiryDate.toISOString() 
      })
      .eq('id', entityId);

    if (error) throw error;

    return new Response(JSON.stringify({ message: `Account activated for ${months} months.` }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (error) {
    console.error('Error in activate-profile function:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})
