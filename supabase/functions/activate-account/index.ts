import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { entityId, entityType, activationCode } = await req.json()

    if (!entityId || !entityType) {
      throw new Error('Missing required parameters: entityId or entityType.')
    }
    if (entityType !== 'therapist' && entityType !== 'place') {
      throw new Error('Invalid entityType specified.')
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )
    
    let months = 0;

    // Logic for user-provided activation code
    if (activationCode) {
      const { data: codeData, error: codeError } = await supabaseAdmin
        .from('special_activation_codes')
        .select('last_used_at')
        .eq('code', activationCode.toUpperCase())
        .single();
      
      if (codeError || !codeData) {
        throw new Error('Invalid activation code.');
      }

      // Check for 3-day cooldown
      if (codeData.last_used_at) {
        const lastUsedDate = new Date(codeData.last_used_at);
        const threeDaysAgo = new Date();
        threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
        
        if (lastUsedDate > threeDaysAgo) {
          throw new Error('This code is on cooldown. Please try again later or use a different code.');
        }
      }

      months = 1; // All special codes are for 1 month

      // Update the last_used_at timestamp for the code
      const { error: updateCodeError } = await supabaseAdmin
        .from('special_activation_codes')
        .update({ last_used_at: new Date().toISOString() })
        .eq('code', activationCode.toUpperCase());

      if (updateCodeError) {
        console.error("Failed to update code's last_used_at timestamp:", updateCodeError);
        // We can choose to proceed anyway or throw an error. Let's proceed for better UX.
      }

    } else {
      // This path is for Stripe payment simulation (no code provided)
      months = 1;
    }

    if (months === 0) {
        throw new Error('Subscription duration could not be determined.');
    }

    const tableName = entityType === 'therapist' ? 'therapists' : 'places';
    
    const expiryDate = new Date();
    expiryDate.setMonth(expiryDate.getMonth() + months);

    const { error: activationError } = await supabaseAdmin
      .from(tableName)
      .update({ 
        status: 'active', 
        account_expiry: expiryDate.toISOString() 
      })
      .eq('id', entityId);

    if (activationError) throw activationError;

    return new Response(JSON.stringify({ message: `Account activated for ${months} month(s).` }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (error) {
    console.error('Error in activate-account function:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})
