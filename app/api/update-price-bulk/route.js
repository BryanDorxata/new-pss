import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY // Use service role key for updates
);

export async function PATCH(req) {
  try {
    // Parse the request body
    const { storefrontId, updates } = await req.json();

    // Validate required fields
    if (!storefrontId || !Array.isArray(updates)) {
      return new Response(
        JSON.stringify({
          error: 'Missing required fields: storefrontId, updates (array of product updates)',
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

    // Fetch the current product_prices column for the specified storefront
    const { data: storefrontData, error: fetchError } = await supabase
      .from('storefront')
      .select('product_prices')
      .eq('id', storefrontId)
      .single();

    if (fetchError) {
      throw new Error(`Error fetching storefront: ${fetchError.message}`);
    }

    const currentProductPrices = storefrontData?.product_prices || [];

    // Update or insert each product in the updates array
    const updatedProductPrices = [...currentProductPrices];

    updates.forEach(({ id, set_price }) => {
      if (!id || !set_price) {
        throw new Error('Each product update must include id and set_price.');
      }

      const existingIndex = updatedProductPrices.findIndex((product) => product.id === id);

      if (existingIndex > -1) {
        // Update existing product
        updatedProductPrices[existingIndex].set_price = set_price;
      } else {
        // Insert new product
        updatedProductPrices.push({ id, set_price });
      }
    });

    // Update the storefront table with the new product_prices value
    const { error: updateError } = await supabase
      .from('storefront')
      .update({ product_prices: updatedProductPrices })
      .eq('id', storefrontId);

    if (updateError) {
      throw new Error(`Error updating product prices: ${updateError.message}`);
    }

    return new Response(
      JSON.stringify({ success: true, product_prices: updatedProductPrices }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    );
  } catch (err) {
    console.error('Error updating product prices:', err);
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
