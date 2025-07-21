import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabase = createClient(
  process.env.PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Define allowed origin(s) from environment variables for production security
const ALLOWED_ORIGIN = process.env.WEBFLOW_ORIGIN || '*';

// Common headers for responses
const COMMON_HEADERS = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': ALLOWED_ORIGIN,
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

/**
 * Handles CORS preflight requests (OPTIONS method).
 */
export async function OPTIONS() {
  const optionsHeaders = {
    'Access-Control-Allow-Origin': ALLOWED_ORIGIN,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '86400',
  };
  return new Response(null, { status: 204, headers: optionsHeaders });
}

/**
 * Handles POST requests to fetch products based on a submitted catalog name.
 * Expects a JSON body with 'catalog_name'.
 */
export async function POST(req) {
  try {
    let catalog_name;

    // Parse request body safely
    try {
      const body = await req.json();
      catalog_name = body.catalog_name;
    } catch (jsonParseError) {
      console.error('Error parsing JSON body for get-products-by-catalog:', jsonParseError);
      return new Response(JSON.stringify({ error: 'Invalid JSON body format.' }), {
        status: 400,
        headers: COMMON_HEADERS,
      });
    }

    // Input validation: Check for presence and ensure it's a string
    if (!catalog_name || typeof catalog_name !== 'string' || catalog_name.trim() === '') {
      return new Response(JSON.stringify({ error: 'Missing or invalid "catalog_name" parameter. Must be a non-empty string.' }), {
        status: 400,
        headers: COMMON_HEADERS,
      });
    }

    // --- CRITICAL CHANGE HERE: Using RPC to call the PostgreSQL function ---
    // The rpc method expects the function name and then an object of arguments for the function.
    // The first argument to our function `jsonb_array_contains_text` is `jsonb_array` (which is our 'catalog' column).
    // The second argument is `search_text` (which is our catalog_name).
    // The RPC call will select all rows where our custom function returns TRUE.
    const { data, error } = await supabase
      .rpc('jsonb_array_contains_text', {
          jsonb_array: 'catalog',    // Name of your JSONB array column in the table
          search_text: catalog_name // The string value you are searching for
      })
      .select('*'); // Select all columns from the products_v2 table, filtered by the RPC result

    if (error) {
      console.error('Supabase query error for get-products-by-catalog (RPC):', error.message, 'Catalog Name:', catalog_name);
      return new Response(JSON.stringify({ error: 'Failed to retrieve products by catalog. Please try again later.' }), {
        status: 500,
        headers: COMMON_HEADERS,
      });
    }

    if (!data || data.length === 0) {
      console.log(`No products found for catalog: ${catalog_name}`);
      return new Response(JSON.stringify([]), {
        status: 200,
        headers: COMMON_HEADERS,
      });
    }

    console.log(`Successfully fetched ${data.length} products for catalog: ${catalog_name}`);
    return new Response(JSON.stringify(data), {
      status: 200,
      headers: COMMON_HEADERS,
    });

  } catch (err) {
    console.error('Unexpected error in get-products-by-catalog endpoint:', err);
    return new Response(JSON.stringify({ error: 'Internal server error.' }), {
      status: 500,
      headers: COMMON_HEADERS,
    });
  }
}
