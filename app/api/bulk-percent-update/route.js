import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY // Use service role key for updates
);

export async function POST(req) {
  try {
    // Parse the request body
    const { storefrontId, percent } = await req.json();

    // Validate required fields
    if (!storefrontId || percent === undefined || percent === null) {
      return new Response(
        JSON.stringify({
          error: 'Missing required fields: storefrontId and percent',
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

    // Validate percent is a number
    if (typeof percent !== 'number' || isNaN(percent)) {
      return new Response(
        JSON.stringify({
          error: 'Percent must be a valid number',
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

    // Fetch all products for the specified storefront
    const { data: products, error: fetchError } = await supabase
      .from('products_v2')
      .select('id, base_price')
      .eq('store_reference', storefrontId);

    if (fetchError) {
      throw new Error(`Error fetching products: ${fetchError.message}`);
    }

    if (!products || products.length === 0) {
      return new Response(
        JSON.stringify({
          message: 'No products found for the specified storefront',
          updatedCount: 0
        }),
        {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
        }
      );
    }

    // Calculate new default_price for each product and prepare updates
    const updates = products.map(product => {
      const newDefaultPrice = product.base_price * (1 + percent / 100);
      return {
        id: product.id,
        default_price: Math.round(newDefaultPrice * 100) / 100 // Round to 2 decimal places
      };
    });

    // Perform bulk update using upsert
    const { data: updatedProducts, error: updateError } = await supabase
      .from('products_v2')
      .upsert(
        updates.map(update => ({
          id: update.id,
          default_price: update.default_price,
          updated_at: new Date().toISOString()
        })),
        { onConflict: 'id' }
      )
      .select('id, base_price, default_price');

    if (updateError) {
      throw new Error(`Error updating product prices: ${updateError.message}`);
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `Successfully updated ${updates.length} products`,
        updatedCount: updates.length,
        percentApplied: percent,
        storefrontId: storefrontId,
        // Optional: return sample of updated products (first 5)
        sampleUpdates: updatedProducts?.slice(0, 5) || []
      }),
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