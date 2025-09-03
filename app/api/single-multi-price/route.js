import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY // Use service role key for updates
);

export async function POST(req) {
  try {
    // Parse the request body
    const { storefrontId, updates } = await req.json();

    // Validate required fields
    if (!storefrontId || !updates || !Array.isArray(updates)) {
      return new Response(
        JSON.stringify({
          error: 'Missing required fields: storefrontId and updates array',
          example: {
            storefrontId: "your-storefront-id",
            updates: [
              { sku: "SKU-123", price: 29.99 },
              { sku: "SKU-456", price: 39.99 }
            ]
          }
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

    // Validate updates array is not empty
    if (updates.length === 0) {
      return new Response(
        JSON.stringify({
          error: 'Updates array cannot be empty'
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

    // Validate each update object
    const validationErrors = [];
    const validUpdates = [];

    updates.forEach((update, index) => {
      if (!update.sku || update.price === undefined || update.price === null) {
        validationErrors.push(`Update ${index + 1}: Missing sku or price`);
      } else if (typeof update.price !== 'number' || isNaN(update.price) || update.price < 0) {
        validationErrors.push(`Update ${index + 1}: Price must be a valid positive number`);
      } else {
        validUpdates.push({
          sku: update.sku.toString().trim(),
          price: Math.round(update.price * 100) / 100 // Round to 2 decimal places
        });
      }
    });

    if (validationErrors.length > 0) {
      return new Response(
        JSON.stringify({
          error: 'Validation errors found',
          details: validationErrors
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

    // Get all SKUs to check
    const skusToUpdate = validUpdates.map(update => update.sku);

    // Fetch products that match the SKUs and storefront
    const { data: existingProducts, error: fetchError } = await supabase
      .from('products_v2')
      .select('id, sku, name, default_price')
      .eq('store_reference', storefrontId)
      .in('sku', skusToUpdate);

    if (fetchError) {
      throw new Error(`Error fetching products: ${fetchError.message}`);
    }

    // Check which SKUs were found
    const foundSkus = existingProducts.map(product => product.sku);
    const notFoundSkus = skusToUpdate.filter(sku => !foundSkus.includes(sku));

    if (existingProducts.length === 0) {
      return new Response(
        JSON.stringify({
          error: 'No products found with the provided SKUs for this storefront',
          notFoundSkus: notFoundSkus,
          storefrontId: storefrontId
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

    // Prepare updates for Supabase
    const productsToUpdate = [];
    const updateResults = [];

    existingProducts.forEach(product => {
      const updateInfo = validUpdates.find(update => update.sku === product.sku);
      if (updateInfo) {
        productsToUpdate.push({
          id: product.id,
          default_price: updateInfo.price,
          updated_at: new Date().toISOString()
        });

        updateResults.push({
          sku: product.sku,
          name: product.name,
          oldPrice: product.default_price,
          newPrice: updateInfo.price
        });
      }
    });

    // Perform the bulk update
    const { data: updatedProducts, error: updateError } = await supabase
      .from('products_v2')
      .upsert(productsToUpdate, { onConflict: 'id' })
      .select('id, sku, name, default_price');

    if (updateError) {
      throw new Error(`Error updating product prices: ${updateError.message}`);
    }

    // Prepare response
    const response = {
      success: true,
      message: `Successfully updated ${productsToUpdate.length} product(s)`,
      storefrontId: storefrontId,
      updatedCount: productsToUpdate.length,
      updatedProducts: updateResults
    };

    // Add warnings about not found SKUs if any
    if (notFoundSkus.length > 0) {
      response.warnings = {
        message: `${notFoundSkus.length} SKU(s) not found for this storefront`,
        notFoundSkus: notFoundSkus
      };
    }

    return new Response(
      JSON.stringify(response),
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