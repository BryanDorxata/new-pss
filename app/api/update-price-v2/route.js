import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY // Use service role key for updates
);

export async function POST(req) {
  try {
    // Parse the request body
    const { storefrontId, sku, defaultPrice } = await req.json();

    // Validate required fields
    if (!storefrontId || !sku || defaultPrice === undefined) {
      return new Response(
        JSON.stringify({
          error: 'Missing required fields: storefrontId, sku, and defaultPrice are required',
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

    // Validate defaultPrice is a positive number
    if (typeof defaultPrice !== 'number' || defaultPrice < 0) {
      return new Response(
        JSON.stringify({
          error: 'defaultPrice must be a positive number',
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

    // Update the product where store_reference matches storefrontId and sku matches
    const { data, error } = await supabase
      .from('products_v2')
      .update({ 
        default_price: defaultPrice,
        updated_at: new Date().toISOString()
      })
      .eq('store_reference', storefrontId)
      .eq('sku', sku)
      .select();

    if (error) {
      throw new Error(`Error updating product price: ${error.message}`);
    }

    // Check if any rows were updated
    if (!data || data.length === 0) {
      return new Response(
        JSON.stringify({
          error: 'Product not found with the specified storefrontId and SKU',
        }),
        {
          status: 404,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
        }
      );
    }

    // Return success response
    return new Response(
      JSON.stringify({
        success: true,
        message: 'Product price updated successfully',
        updatedProduct: data[0]
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
    console.error('Error updating product price:', err);
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

// Example usage with fetch:
/*
fetch('/api/products/update-price', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    storefrontId: 'ccb2e12a-e358-4ad5-a940-3b94e31262a9',
    sku: '3LIFE4-ROOT-BLK-BIG-YES-O.1',
    defaultPrice: 99.99
  })
})
.then(response => response.json())
.then(data => console.log(data));
*/