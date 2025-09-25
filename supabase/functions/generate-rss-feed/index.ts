import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

const escapeXml = (unsafe: string): string => {
  return unsafe.replace(/[<>&'"]/g, (c) => {
    switch (c) {
      case '<': return '&lt;';
      case '>': return '&gt;';
      case '&': return '&amp;';
      case '\'': return '&apos;';
      case '"': return '&quot;';
      default: return c;
    }
  });
};

serve(async (_req) => {
  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    );

    const SITE_URL = Deno.env.get('VITE_SITE_URL') ?? '';

    const [therapistsRes, placesRes] = await Promise.all([
      supabase.from('therapists').select('login_code, name, bio, created_at').eq('status', 'active').order('created_at', { ascending: false }).limit(15),
      supabase.from('places').select('login_code, name, address, city, created_at').eq('status', 'active').order('created_at', { ascending: false }).limit(15)
    ]);

    if (therapistsRes.error) throw therapistsRes.error;
    if (placesRes.error) throw placesRes.error;

    const items = [
      ...(therapistsRes.data || []).map(t => ({
        title: `${t.name} - Therapist`,
        link: `${SITE_URL}/therapist-profiles/${t.login_code}`,
        description: t.bio || 'Professional massage therapist.',
        pubDate: new Date(t.created_at).toUTCString(),
      })),
      ...(placesRes.data || []).map(p => ({
        title: `${p.name} - Massage Place`,
        link: `${SITE_URL}/place-profiles/${p.login_code}`,
        description: p.address ? `${p.address}, ${p.city}` : 'Premium massage and spa location.',
        pubDate: new Date(p.created_at).toUTCString(),
      }))
    ].sort((a, b) => new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime()).slice(0, 20);

    const rssItems = items.map(item => `
      <item>
        <title>${escapeXml(item.title)}</title>
        <link>${item.link}</link>
        <description>${escapeXml(item.description)}</description>
        <pubDate>${item.pubDate}</pubDate>
        <guid>${item.link}</guid>
      </item>
    `).join('');

    const rssFeed = `<?xml version="1.0" encoding="UTF-8" ?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
<channel>
  <title>2Go Massage - Latest Profiles</title>
  <link>${SITE_URL}</link>
  <description>The latest massage therapists and places on 2Go Massage.</description>
  <language>en-us</language>
  <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
  <atom:link href="${SITE_URL}/rss.xml" rel="self" type="application/rss+xml" />
  ${rssItems}
</channel>
</rss>`;

    return new Response(rssFeed, {
      headers: { ...corsHeaders, 'Content-Type': 'application/xml' },
      status: 200,
    });

  } catch (error) {
    console.error('Error generating RSS feed:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});
