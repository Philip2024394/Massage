import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
const FROM_EMAIL = 'support@2gomassage.app'; // Must be a verified domain in Resend

async function sendForgotCodeEmail(name: string, email: string, loginCode: string) {
  if (!RESEND_API_KEY) {
    console.error('Resend API key is not set.');
    return;
  }
  const payload = {
    from: `2Go Massage Support <${FROM_EMAIL}>`,
    to: [email],
    subject: 'Your 2Go Massage Login Code',
    html: `
      <div style="font-family: sans-serif; font-size: 16px; line-height: 1.6;">
        <h2>Hi ${name},</h2>
        <p>It looks like you had some trouble logging in. Here is your unique login code:</p>
        <div style="background-color: #f0fdf4; border: 2px dashed #22c55e; padding: 20px; margin: 20px 0; text-align: center;">
          <p style="font-size: 28px; font-weight: bold; letter-spacing: 4px; margin: 0;">${loginCode}</p>
        </div>
        <p>Please keep this code safe. You will need it to access your dashboard.</p>
        <br/>
        <p>Sincerely,<br/><strong>The 2Go Team</strong></p>
      </div>
    `,
  };
  await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${RESEND_API_KEY}` },
    body: JSON.stringify(payload),
  });
}

async function findUser(supabase: SupabaseClient, email: string) {
  const { data: therapist, error: therapistError } = await supabase
    .from('therapists')
    .select('id, name, login_code, failed_login_attempts')
    .eq('email', email)
    .single();
  
  if (therapist) return { ...therapist, type: 'therapist', tableName: 'therapists' };

  const { data: place, error: placeError } = await supabase
    .from('places')
    .select('id, name, login_code, failed_login_attempts')
    .eq('email', email)
    .single();

  if (place) return { ...place, type: 'place', tableName: 'places' };

  return null;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { email, code } = await req.json();

    if (!email || !code) {
      throw new Error('Email and code are required.');
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const user = await findUser(supabaseAdmin, email);

    if (!user) {
      throw new Error('No account found with that email address.');
    }

    if (user.login_code.toUpperCase() === code.toUpperCase()) {
      // Successful login
      if (user.failed_login_attempts > 0) {
        await supabaseAdmin.from(user.tableName).update({ failed_login_attempts: 0 }).eq('id', user.id);
      }
      return new Response(JSON.stringify({ type: user.type, login_code: user.login_code }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    } else {
      // Failed login
      const newAttemptCount = user.failed_login_attempts + 1;

      if (newAttemptCount >= 3) {
        // Send email and reset counter
        await sendForgotCodeEmail(user.name, email, user.login_code);
        await supabaseAdmin.from(user.tableName).update({ failed_login_attempts: 0 }).eq('id', user.id);
        throw new Error('Too many failed attempts. We have sent your correct login code to your email address.');
      } else {
        // Just increment counter
        await supabaseAdmin.from(user.tableName).update({ failed_login_attempts: newAttemptCount }).eq('id', user.id);
        throw new Error('Invalid code. Please try again.');
      }
    }

  } catch (error) {
    console.error('Error in secure-login function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    });
  }
});
