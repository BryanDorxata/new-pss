import { createClient } from '@supabase/supabase-js';
import Stripe from 'stripe';

// Initialize Supabase client
const supabase = createClient(
  process.env.PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Initialize Stripe client
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const headers = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

// Handle preflight (OPTIONS) requests
export async function OPTIONS() {
  return new Response(null, { status: 204, headers });
}

// Handle POST request
export async function POST(req) {
  try {
    const body = await req.json();

    // Validate required fields
    if (!body.price || !body.store_reference || !body.order_reference) {
      return new Response(
        JSON.stringify({ error: 'Validation error: Price, store_reference, and order_reference are required.' }),
        { status: 400, headers }
      );
    }

    let product, price;

    // Create Stripe product
    try {
      product = await stripe.products.create({
        name: body.urn_text?.top?.text || 'Custom Urn',
        description: 'Custom-designed urn',
        metadata: {
          color: body.color || 'N/A',
          urn_size: body.urn_size || 'N/A',
        },
      });
    } catch (stripeError) {
      console.error('Stripe Product Error:', stripeError);
      return new Response(
        JSON.stringify({ error: 'Stripe product creation failed.', details: stripeError.message }),
        { status: 500, headers }
      );
    }

    // Create Stripe price
    try {
      price = await stripe.prices.create({
        unit_amount: body.price,
        currency: 'usd',
        product: product.id,
      });
    } catch (stripeError) {
      console.error('Stripe Price Error:', stripeError);
      return new Response(
        JSON.stringify({ error: 'Stripe price creation failed.', details: stripeError.message }),
        { status: 500, headers }
      );
    }

    // Ensure urn_text is stored as JSON
    const urnTextJson = body.urn_text ? JSON.stringify(body.urn_text) : null;

    // Insert data into Supabase
    let supabaseResponse;
    try {
      const { data, error } = await supabase
        .from('custom_design')
        .insert([
          {
            design_size: body.design_size || null,
            urn_text: urnTextJson, // Store as JSON
            urn_text_position: body.urn_text_position || null,
            price: body.price || null,
            store_reference: body.store_reference,
            order_reference: body.order_reference,
            design_blur: body.design_blur || null,
            urn_size: body.urn_size || null,
            stripe_price_id: price.id,
            color: body.color || null,
            preset_design: body.preset_design || null,
            upload_design: body.upload_design || null,
            preset_frame: body.preset_frame || null,
            upload_frame: body.upload_frame || null,
            upload_image: body.upload_image || null,
            product_snapshot: body.product_snapshot || null,
            stripe_product_id: product.id,
          },
        ])
        .select();

      if (error) {
        throw error;
      }
      supabaseResponse = data;
    } catch (supabaseError) {
      console.error('Supabase Insert Error:', supabaseError);
      return new Response(
        JSON.stringify({ error: 'Supabase insertion failed.', details: supabaseError.message }),
        { status: 500, headers }
      );
    }

    // Success response
    return new Response(
      JSON.stringify({
        message: 'Custom urn created successfully',
        data: supabaseResponse,
      }),
      { status: 201, headers }
    );
  } catch (err) {
    console.error('Unexpected Error:', err);
    return new Response(
      JSON.stringify({ error: 'Unexpected server error.', details: err.message }),
      { status: 500, headers }
    );
  }
}
