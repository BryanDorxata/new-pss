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
        JSON.stringify({
          error: 'storefront_id and updates are required',
        }),
        {
          status: 400,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
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
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    );
  } catch (err) {
    console.error('Error updating storefront:', err);
    return new Response(
      JSON.stringify({ error: err.message }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    );
  }
}

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
