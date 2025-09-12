import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// CORS headers configuration
const CORS_HEADERS = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Requested-With",
  "Access-Control-Allow-Credentials": "true",
};

// Helper function to create JSON responses with CORS
function createResponse(data, status = 200, additionalHeaders = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...CORS_HEADERS, ...additionalHeaders },
  });
}

export async function POST(req) {
  try {
    const { name } = await req.json();
    
    if (!name || name.trim() === "") {
      return createResponse(
        { error: "Product name is required" }, 
        400
      );
    }

    const { data, error } = await supabase
      .from("products_v2")
      .select("*")
      .eq("name", name.trim()); // Trim whitespace for better matching

    if (error) {
      console.error("Supabase error:", error);
      return createResponse(
        { error: "Database query failed", details: error.message }, 
        500
      );
    }

    if (!data || data.length === 0) {
      return createResponse(
        { 
          error: "No products found", 
          message: `No products found with name: "${name}" for storefront: "${storefrontId}"` 
        }, 
        404
      );
    }

    // Return the products with additional metadata
    return createResponse({
      success: true,
      count: data.length,
      products: data
    });

  } catch (err) {
    console.error("Unexpected server error:", err);
    
    // Handle JSON parsing errors specifically
    if (err instanceof SyntaxError) {
      return createResponse(
        { error: "Invalid JSON in request body" }, 
        400
      );
    }

    return createResponse(
      { error: "Internal server error" }, 
      500
    );
  }
}

export function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Requested-With",
      "Access-Control-Allow-Credentials": "true",
      "Access-Control-Max-Age": "86400", // Cache preflight for 24 hours
    },
  });
}
