import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Handle CORS preflight request
export async function OPTIONS() {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };

  return new Response(null, { status: 204, headers });
}

export async function POST(req) {
  try {
    const headers = {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    };

    // Parse the request body
    const { storefront_id } = await req.json();

    if (!storefront_id) {
      return new Response(
        JSON.stringify({ error: 'Storefront ID is required' }),
        { status: 400, headers }
      );
    }

    // Fetch the storefront to get the featured categories
    const { data: storefront, error: storefrontError } = await supabase
      .from('storefront')
      .select('featured_categories')
      .eq('id', storefront_id)
      .single();

    if (storefrontError) {
      return new Response(
        JSON.stringify({ error: storefrontError.message }),
        { status: 500, headers }
      );
    }

    if (!storefront || !storefront.featured_categories || storefront.featured_categories.length === 0) {
      return new Response(
        JSON.stringify({ error: 'No featured categories found for the given storefront' }),
        { status: 404, headers }
      );
    }

    // Fetch products based on the featured categories
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('*')
      .in('category', storefront.featured_categories);

    if (productsError) {
      return new Response(
        JSON.stringify({ error: productsError.message }),
        { status: 500, headers }
      );
    }

    // Return the products
    return new Response(JSON.stringify(products), { status: 200, headers });
  } catch (err) {
    console.error('Error fetching products by categories:', err);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
    );
  }
}
