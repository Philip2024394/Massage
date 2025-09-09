import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'

// Helper function to send emails via the Resend API
async function sendEmail(payload: object) {
  const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')
  if (!RESEND_API_KEY) {
    console.error('Resend API key is not set in environment variables.')
    throw new Error('Server configuration error: Missing email service API key.')
  }

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${RESEND_API_KEY}`,
    },
    body: JSON.stringify(payload),
  })

  if (!res.ok) {
    const errorBody = await res.json()
    console.error('Failed to send email:', errorBody)
    throw new Error(`Resend API error: ${errorBody.message}`)
  }

  return res.json()
}

// Main server logic to handle incoming webhooks
serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405 })
  }

  try {
    const { record: newTherapist } = await req.json()
    const { name, email } = newTherapist

    if (!name || !email) {
      return new Response('Missing name or email in webhook payload', { status: 400 })
    }

    const ADMIN_EMAIL = 'phillipofarrell@gmail.com'
    // IMPORTANT: You must verify this domain in your Resend account.
    const FROM_EMAIL = 'notifications@2gomassagehub.app'

    // --- Email to Admin ---
    const adminEmailPayload = {
      from: `2Go Massage Hub System <${FROM_EMAIL}>`,
      to: [ADMIN_EMAIL],
      subject: `New Therapist Registration: ${name}`,
      html: `
        <div style="font-family: sans-serif; font-size: 16px; line-height: 1.6;">
          <h2>New Registration Alert</h2>
          <p>A new therapist has registered on 2Go Massage Hub and is awaiting your approval.</p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
          <p><strong>Name:</strong> ${name}</p>
          <p><strong>Email:</strong> ${email}</p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
          <p>Please log in to the admin dashboard to review and approve their profile.</p>
          <p>Thank you,<br/>The 2Go Massage Hub System</p>
        </div>
      `,
    }
    await sendEmail(adminEmailPayload)

    // --- Email to New Therapist ---
    const therapistEmailPayload = {
      from: `The 2Go Team <${FROM_EMAIL}>`,
      to: [email],
      subject: `Welcome to 2Go Massage Hub! Your Account is Pending Approval`,
      html: `
        <div style="font-family: sans-serif; font-size: 16px; line-height: 1.6;">
          <h2>Welcome, ${name}!</h2>
          <p>Thank you for registering with 2Go Massage Hub. We're excited to have you join our community of professional therapists.</p>
          <p>Your account is currently being reviewed by our team to ensure the quality and safety of our platform. This process is usually completed within 24-48 hours.</p>
          <p><strong>Please be patient while this process is being carried out.</strong> We will notify you via email as soon as your account has been activated.</p>
          <p>Thank you for your understanding.</p>
          <br/>
          <p>Sincerely,<br/><strong>The 2Go Team</strong></p>
        </div>
      `,
    }
    await sendEmail(therapistEmailPayload)

    return new Response(JSON.stringify({ message: 'Notifications sent successfully' }), {
      headers: { 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (error) {
    console.error('Error processing webhook:', error.message)
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})
