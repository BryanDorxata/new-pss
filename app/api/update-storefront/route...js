import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function PATCH(req) {
  try {
    // Ensure CORS headers are always included
    const headers = {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PATCH, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    };

    // Parse request body
    const { storefront_id, ...updatedFields } = await req.json();

    if (!storefront_id) {
      return new Response(JSON.stringify({ error: 'storefront_id is required' }), {
        status: 400,
        headers,
      });
    }

    console.log('Updating storefront:', { storefront_id, ...updatedFields });

    // Update storefront in the database
    const { error: updateError } = await supabase
      .from('storefront')
      .update(updatedFields)
      .eq('id', storefront_id);

    if (updateError) {
      console.error('Update error:', updateError.message);
      return new Response(JSON.stringify({ error: updateError.message }), {
        status: 500,
        headers,
      });
    }

    // Fetch updated row
    const { data, error: fetchError } = await supabase
      .from('storefront')
      .select('*')
      .eq('id', storefront_id)
      .single();

    if (fetchError) {
      console.error('Fetch error:', fetchError.message);
      return new Response(JSON.stringify({ error: fetchError.message }), {
        status: 500,
        headers,
      });
    }

    return new Response(JSON.stringify({ success: true, data }), {
      status: 200,
      headers,
    });
  } catch (err) {
    console.error('Internal server error:', err);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
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
