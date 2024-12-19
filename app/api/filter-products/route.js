import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY // Use the service role key
);

// Handle preflight (OPTIONS) requests
export async function OPTIONS() {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*', // Allow all origins for now
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };

  return new Response(null, {
    status: 204,
    headers: corsHeaders,
  });
}

// Handle POST requests
export async function POST(req) {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*', // Allow all origins for now
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };

  try {
    // Parse the request body
    const body = await req.json();
    const { color, category, size, priceMin, priceMax } = body;

    // Initialize query
    let query = supabase.from('products').select('*');

    // Filter by category
    if (category && Array.isArray(category) && category.length > 0) {
      query = query.in('category', category);
    }

    // Filter by color
    if (color && Array.isArray(color) && color.length > 0) {
      query = query.in('color', color);
    }

    // Filter by size
    if (size && Array.isArray(size) && size.length > 0) {
      query = query.in('size', size);
    }

    // Filter by price range
    if (priceMin !== undefined && priceMax !== undefined) {
      query = query.gte('price', priceMin).lte('price', priceMax);
    } else if (priceMin !== undefined) {
      query = query.gte('price', priceMin);
    } else if (priceMax !== undefined) {
      query = query.lte('price', priceMax);
    }

    // Execute query
    const { data, error } = await query;

    if (error) {
      console.error('Error fetching products:', error);
      return new Response(
        JSON.stringify({ error: error.message }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Return filtered products
    return new Response(
      JSON.stringify(data),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (err) {
    console.error('Error handling request:', err);
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: err.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
}
