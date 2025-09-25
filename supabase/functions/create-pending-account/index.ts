import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

function generateCode(length: number) {
  const chars = 'ABCDEFGHIJKLMNPQRSTUVWXYZ123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { type, name, phone, city, service_areas } = await req.json()

    if (!type || !name || !phone || !city) {
      throw new Error('Missing required parameters: type, name, phone, or city.')
    }
    if (type !== 'therapist' && type !== 'place') {
      throw new Error('Invalid type specified.')
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const tableName = type === 'therapist' ? 'therapists' : 'places';
    const login_code = generateCode(6);
    const account_number = `${type.slice(0, 3).toUpperCase()}-${generateCode(7)}`;

    const { data, error } = await supabaseAdmin
      .from(tableName)
      .insert({
        login_code,
        account_number,
        name,
        phone,
        city,
        service_areas: service_areas || [],
        status: 'unpaid',
      })
      .select('id, login_code')
      .single();

    if (error) throw error;

    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (error) {
    console.error('Error in create-pending-account function:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})
