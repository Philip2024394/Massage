import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

serve(async (_req) => {
  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    );

    const SITE_URL = Deno.env.get('VITE_SITE_URL') ?? '';

    const [therapistsRes, placesRes] = await Promise.all([
      supabase.from('therapists').select('login_code').eq('status', 'active'),
      supabase.from('places').select('login_code').eq('status', 'active')
    ]);

    if (therapistsRes.error) throw therapistsRes.error;
    if (placesRes.error) throw placesRes.error;

    const staticPages = ['', '/home', '/terms', '/package-details', '/agent-signup'];
    
    const urls = [
      ...staticPages.map(path => `<url><loc>${SITE_URL}${path}</loc></url>`),
      ...(therapistsRes.data || []).map(t => `<url><loc>${SITE_URL}/therapist-profiles/${t.login_code}</loc></url>`),
      ...(placesRes.data || []).map(p => `<url><loc>${SITE_URL}/place-profiles/${p.login_code}</loc></url>`)
    ].join('');

    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  ${urls}
</urlset>`;

    return new Response(sitemap, {
      headers: { ...corsHeaders, 'Content-Type': 'application/xml' },
      status: 200,
    });

  } catch (error) {
    console.error('Error generating sitemap:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});
