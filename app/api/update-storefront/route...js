import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY // Use service role key for updates
);

export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, PATCH, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    },
  });
}

export async function PATCH(req) {
  try {
    const { storefront_id, updates } = await req.json();

    if (!storefront_id || !updates) {
      return new Response(
        JSON.stringify({ error: "storefront_id and updates are required" }),
        {
          status: 400,
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
          },
        }
      );
    }

    // Update the storefront row in Supabase
    const { data, error: updateError } = await supabase
      .from("storefront")
      .update(updates)
      .eq("id", storefront_id)
      .select()
      .single();

    if (updateError) {
      console.error("Error updating storefront:", updateError); // ✅ Now using the error
      return new Response(
        JSON.stringify({ error: "Failed to update storefront" }),
        {
          status: 500,
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
          },
        }
      );
    }

    return new Response(
      JSON.stringify({ message: "Storefront updated successfully", storefront: data }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      }
    );
  } catch (err) { // ✅ Renamed to 'err' to avoid ESLint error
    console.error("Internal Server Error:", err); // ✅ Now using the error
    return new Response(
      JSON.stringify({ error: "Internal Server Error" }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      }
    );
  }
}
