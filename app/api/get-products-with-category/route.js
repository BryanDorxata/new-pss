import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY // Use service role key for fetching products
);

// Handle CORS preflight request
export async function OPTIONS() {
  const headers = {
    'Access-Control-Allow-Origin': '*', // Change this to your Webflow URL for production
    'Access-Control-Allow-Methods': 'GET, OPTIONS', // Allow OPTIONS and GET methods
    'Access-Control-Allow-Headers': 'Content-Type', // Allow the Content-Type header
  };

  return new Response(null, { status: 204, headers });
}

export async function GET() {
  try {
    const headers = {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*', // Adjust for production
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
    };

    // Fetch products with category details
    const { data, error } = await supabase
      .from('products')
      .select(`
        id,
        created_at,
        name,
        category:category (
          id,
          name
        ),
        size,
        color,
        base_price,
        stock,
        description,
        main_image,
        product_image,
        updated_at,
        stripe_product_id,
        default_price,
        stripe_price_id,
        test
      `);

    if (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers,
      });
    }

    return new Response(JSON.stringify(data), {
      status: 200,
      headers,
    });
  } catch (err) {
    console.error('Error fetching products with category:', err);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers,
    });
  }
}
