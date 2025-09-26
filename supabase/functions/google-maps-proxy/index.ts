import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { corsHeaders } from '../_shared/cors.ts'

const GOOGLE_MAPS_API_KEY = Deno.env.get('GOOGLE_MAPS_API_KEY')

serve(async (req) => {
  // This is needed if you're planning to invoke your function from a browser.
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { input, placeId, lat, lng } = await req.json()

    if (!GOOGLE_MAPS_API_KEY) {
      throw new Error('Google Maps API key is not configured as a secret.')
    }

    let url = ''
    if (input) {
      // Autocomplete request
      url = `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(
        input
      )}&key=${GOOGLE_MAPS_API_KEY}&types=address&components=country:id`
    } else if (placeId) {
      // Place details request
      url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&key=${GOOGLE_MAPS_API_KEY}&fields=address_components,geometry,formatted_address`
    } else if (lat && lng) {
      // Reverse geocoding request
      url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${GOOGLE_MAPS_API_KEY}`
    } else {
      throw new Error('Either "input", "placeId", or "lat/lng" must be provided.')
    }

    const response = await fetch(url)
    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error_message || 'Failed to fetch from Google Maps API.')
    }
    const data = await response.json()

    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})
