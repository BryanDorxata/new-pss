import { createClient } from '@supabase/supabase-js';
import Stripe from 'stripe';

const supabase = createClient(
  process.env.PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2024-08-16', // Use the latest version
});

export async function POST(req) {
  try {
    const {
      name,
      category,
      size,
      color,
      base_price,
      stock,
      description,
      main_image,
      product_image,
      default_price,
    } = await req.json();

    // Validation for required fields
    if (!name || !base_price) {
      return new Response(
        JSON.stringify({ error: 'Name and base_price are required.' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Step 1: Insert product into Supabase
    const { data: productData, error: supabaseError } = await supabase
      .from('products')
      .insert([
        {
          name,
          category,
          size,
          color,
          base_price,
          stock,
          description,
          main_image,
          product_image,
          default_price,
        },
      ])
      .select('*')
      .single();

    if (supabaseError) {
      throw new Error(`Supabase error: ${supabaseError.message}`);
    }

    const productId = productData.id;

    // Step 2: Create the product in Stripe
    const stripeProduct = await stripe.products.create({
      name,
      description,
      images: main_image ? [main_image] : [],
    });

    // Step 3: Update Stripe product ID in Supabase
    const { error: updateError } = await supabase
      .from('products')
      .update({ stripe_product_id: stripeProduct.id })
      .eq('id', productId);

    if (updateError) {
      throw new Error(`Failed to update product in Supabase: ${updateError.message}`);
    }

    return new Response(
      JSON.stringify({ success: true, product: productData, stripe: stripeProduct }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    console.error('Error creating product:', err);
    return new Response(
      JSON.stringify({ error: err.message || 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

export function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
