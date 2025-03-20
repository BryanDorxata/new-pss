import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabase = createClient(
  process.env.PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Function to handle CORS headers
function corsHeaders(response) {
  response.headers.set('Access-Control-Allow-Origin', '*');
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  return response;
}

// Handle PATCH request (update storefront)
export async function PATCH(req) {
  try {
    const { storefront_id, ...updatedFields } = await req.json();

    if (!storefront_id) {
      return corsHeaders(new Response(JSON.stringify({ error: 'storefront_id is required' }), { 
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      }));
    }

    console.log('Updating storefront:', { storefront_id, ...updatedFields });

    // Update storefront in Supabase
    const { error: updateError } = await supabase
      .from('storefront')
      .update(updatedFields)
      .eq('id', storefront_id);

    if (updateError) {
      console.error('Update error:', updateError.message);
      return corsHeaders(new Response(JSON.stringify({ error: updateError.message }), { 
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }));
    }

    // Fetch updated row
    const { data, error: fetchError } = await supabase
      .from('storefront')
      .select('*')
      .eq('id', storefront_id)
      .single();

    if (fetchError) {
      console.error('Fetch error:', fetchError.message);
      return corsHeaders(new Response(JSON.stringify({ error: fetchError.message }), { 
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }));
    }

    return corsHeaders(new Response(JSON.stringify({ success: true, data }), { 
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    }));
  } catch (err) {
    console.error('Internal server error:', err);
    return corsHeaders(new Response(JSON.stringify({ error: 'Internal server error' }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    }));
  }
}

// Handle CORS preflight requests
export function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PATCH, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}
