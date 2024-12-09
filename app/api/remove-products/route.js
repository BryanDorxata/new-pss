import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function POST(req) {
  try {
    const { storefrontId, productIds } = await req.json();

    if (!storefrontId || !productIds || !Array.isArray(productIds)) {
      return new Response(
        JSON.stringify({ error: "Invalid request data. Provide 'storefrontId' and 'productIds' (array)." }),
        {
          status: 400,
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
          }
        }
      );
    }

    // Fetch existing removed_products
    const { data: currentData, error: fetchError } = await supabase
      .from("storefront")
      .select("removed_products")
      .eq("id", storefrontId)
      .single();

    if (fetchError) {
      return new Response(
        JSON.stringify({ error: "Failed to fetch current data: " + fetchError.message }),
        {
          status: 500,
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
          }
        }
      );
    }

    const currentRemovedProducts = currentData?.removed_products || [];
    const updatedRemovedProducts = [...new Set([...currentRemovedProducts, ...productIds])];

    // Update the column
    const { error: updateError } = await supabase
      .from("storefront")
      .update({ removed_products: updatedRemovedProducts })
      .eq("id", storefrontId);

    if (updateError) {
      return new Response(
        JSON.stringify({ error: "Failed to update removed products: " + updateError.message }),
        {
          status: 500,
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
          }
        }
      );
    }

    return new Response(
      JSON.stringify({ message: "Removed products updated successfully", updatedRemovedProducts }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        }
      }
    );
  } catch (err) {
    console.error("Error updating removed products:", err);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        }
      }
    );
  }
}

export function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    }
  });
}
