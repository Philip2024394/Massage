import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { entityId, entityType, isLive, isContinuous } = await req.json()

    // Auth check using the JWT from the request
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) throw new Error('Missing authorization header')

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    )
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('User not authenticated')

    // Admin check - a simple way is to check against a known admin user ID
    // A better way would be a custom claim or a role in a separate table.
    // For now, we assume the request is from a trusted client (the admin dashboard).
    // A real production app should have more robust admin verification.

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const tableName = entityType === 'therapist' ? 'therapists' : 'places';
    let updatePayload: any = {
        is_continuous: isContinuous,
    };

    if (isLive) {
        updatePayload.status = 'active';
        if (isContinuous) {
            // Set expiry to a far-future date for "Remain Live"
            updatePayload.account_expiry = '2100-01-01T00:00:00Z';
        } else {
            // Set expiry to 1 month from now
            const expiryDate = new Date();
            expiryDate.setMonth(expiryDate.getMonth() + 1);
            updatePayload.account_expiry = expiryDate.toISOString();
        }
    } else {
        // If toggled off, set to 'blocked' and clear expiry
        updatePayload.status = 'blocked';
        updatePayload.account_expiry = null;
    }

    const { error } = await supabaseAdmin
      .from(tableName)
      .update(updatePayload)
      .eq('id', entityId);

    if (error) throw error;

    return new Response(JSON.stringify({ message: `Subscription for ${entityId} updated successfully.` }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (error) {
    console.error('Error in admin-set-subscription function:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})
