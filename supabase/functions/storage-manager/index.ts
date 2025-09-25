import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

// Helper to decode Base64
function base64ToBlob(base64: string, contentType: string): Blob {
  const byteCharacters = atob(base64.split(',')[1]);
  const byteNumbers = new Array(byteCharacters.length);
  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i);
  }
  const byteArray = new Uint8Array(byteNumbers);
  return new Blob([byteArray], { type: contentType });
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { action, fileUrl, fileContent, fileName, contentType, entityId, entityType } = await req.json()

    if (!action) throw new Error('Action is required.')

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    if (action === 'upload') {
      if (!fileContent || !fileName || !contentType || !entityId || !entityType) {
        throw new Error('Missing parameters for upload action.')
      }

      const blob = base64ToBlob(fileContent, contentType);
      const storagePath = `${entityType}/${entityId}/${Date.now()}-${fileName}`;

      const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
        .from('profile-images')
        .upload(storagePath, blob, {
          contentType,
          upsert: false,
        });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabaseAdmin.storage
        .from('profile-images')
        .getPublicUrl(uploadData.path);

      return new Response(JSON.stringify({ publicUrl: urlData.publicUrl }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      })
    }
    
    if (action === 'delete') {
      if (!fileUrl) throw new Error('fileUrl is required for delete action.');

      // Extract the path from the full URL
      const url = new URL(fileUrl);
      const path = url.pathname.split('/profile-images/')[1];
      if (!path) throw new Error('Invalid file URL provided.');

      const { error: deleteError } = await supabaseAdmin.storage
        .from('profile-images')
        .remove([path]);
      
      if (deleteError) throw deleteError;

      return new Response(JSON.stringify({ message: 'File deleted successfully.' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    }

    throw new Error('Invalid action specified.');

  } catch (error) {
    console.error('Error in storage-manager function:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})
