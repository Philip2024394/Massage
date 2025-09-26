import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2'

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
const SALES_WHATSAPP_NUMBER = Deno.env.get('SALES_WHATSAPP_NUMBER');
const FROM_EMAIL = 'notifications@2gomassage.app'; // Must be a verified domain in Resend

async function sendEmail(payload: object) {
  if (!RESEND_API_KEY) {
    console.error('Resend API key is not set.');
    return;
  }
  await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${RESEND_API_KEY}`,
    },
    body: JSON.stringify(payload),
  });
}

async function getExpiringAccounts(supabase: SupabaseClient, tableName: 'therapists' | 'places') {
  const sevenDaysFromNow = new Date();
  sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);
  const startDate = sevenDaysFromNow.toISOString().split('T')[0] + 'T00:00:00.000Z';
  const endDate = sevenDaysFromNow.toISOString().split('T')[0] + 'T23:59:59.999Z';

  const { data, error } = await supabase
    .from(tableName)
    .select('name, email, phone, login_code')
    .eq('status', 'active')
    .eq('is_continuous', false) // Only send reminders for non-continuous subscriptions
    .gte('account_expiry', startDate)
    .lte('account_expiry', endDate);
  
  if (error) {
    console.error(`Error fetching expiring ${tableName}:`, error);
    return [];
  }
  return data.map(item => ({...item, type: tableName.slice(0, -1)}));
}

serve(async () => {
  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const expiringTherapists = await getExpiringAccounts(supabaseAdmin, 'therapists');
    const expiringPlaces = await getExpiringAccounts(supabaseAdmin, 'places');
    const allExpiringAccounts = [...expiringTherapists, ...expiringPlaces];

    for (const account of allExpiringAccounts) {
      const { name, email, phone, login_code, type } = account;
      const dashboardUrl = `${Deno.env.get('VITE_SITE_URL')}/login`;
      const salesWhatsAppUrl = `https://wa.me/${SALES_WHATSAPP_NUMBER}?text=${encodeURIComponent(`Hi, I'd like to renew my subscription for ${name} (Code: ${login_code}).`)}`;

      // --- Email to User ---
      await sendEmail({
        from: `2Go Massage Renewals <${FROM_EMAIL}>`,
        to: [email],
        subject: `Your 2Go Massage Subscription is Expiring Soon!`,
        html: `
          <div style="font-family: sans-serif; font-size: 16px; line-height: 1.6;">
            <h2>Hi ${name},</h2>
            <p>Just a friendly reminder that your 2Go Massage subscription is set to expire in one week.</p>
            <p>To ensure uninterrupted service and continue connecting with clients, please renew your subscription by contacting our sales team.</p>
            <div style="margin: 30px 0; text-align: center;">
              <a href="${salesWhatsAppUrl}" style="background-color: #25D366; color: white; padding: 15px 25px; text-decoration: none; border-radius: 8px; font-weight: bold;">Renew via WhatsApp</a>
            </div>
            <p>You can check your account status by logging into your dashboard.</p>
            <p><a href="${dashboardUrl}">Go to Dashboard</a></p>
            <br/>
            <p>Sincerely,<br/><strong>The 2Go Team</strong></p>
          </div>
        `,
      });
    }

    return new Response(JSON.stringify({ message: `Processed ${allExpiringAccounts.length} renewal reminders.` }), {
      headers: { 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error('Error in renewal reminder function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});
