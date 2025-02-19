import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY // Use service role key for updates
);

export async function PATCH(req) {
  try {
    // Parse request body
    const { storefront_id, updates } = await req.json();

    // Validate request body
    if (!storefront_id || !updates) {
      return new Response(
        JSON.stringify({ error: 'storefront_id and updates are required' }),
        {
          status: 400,
          headers: getCorsHeaders(),
        }
      );
    }

    // Perform update in Supabase
    const { data, error } = await supabase
      .from('storefront')
      .update(updates)
      .eq('id', storefront_id)
      .select()
      .single();

    if (error) {
      throw new Error(`Error updating storefront: ${error.message}`);
    }

    return new Response(
      JSON.stringify({ success: true, storefront: data }),
      {
        status: 200,
        headers: getCorsHeaders(),
      }
    );
  } catch (err) {
    console.error('Error updating storefront:', err);
    return new Response(
      JSON.stringify({ error: err.message }),
      {
        status: 500,
        headers: getCorsHeaders(),
      }
    );
  }
}

// Handle preflight CORS requests
export function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: getCorsHeaders(),
  });
}

// Helper function to set CORS headers
function getCorsHeaders() {
  return {
    'Access-Control-Allow-Origin': 'https://pss-5215cc.webflow.io', // Your Webflow domain
    'Access-Control-Allow-Methods': 'GET, POST, PATCH, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Credentials': 'true',
  };
}
