import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabase = createClient(
  process.env.PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function POST(req) {
  try {
    const { store_reference } = await req.json();

    if (!store_reference) {
      return new Response(
        JSON.stringify({ error: "Store reference is required" }),
        {
          status: 400,
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*", // Allow all origins
          },
        }
      );
    }

    // Query to get orders based on the store reference
    const { data, error } = await supabase
      .from("orders")
      .select("*")
      .eq("store_reference", store_reference);

    if (error) {
      throw new Error(error.message);
    }

    return new Response(
      JSON.stringify(data),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*", // Allow all origins
        },
      }
    );
  } catch (err) {
    console.error("Error fetching orders by store:", err);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*", // Allow all origins
        },
      }
    );
  }
}

export function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*", // Allow all origins
      "Access-Control-Allow-Methods": "POST, OPTIONS", // Allowed methods
      "Access-Control-Allow-Headers": "Content-Type", // Allowed headers
    },
  });
}
