import { createClient } from '@supabase/supabase-js';
import Stripe from 'stripe';

const supabase = createClient(
  process.env.PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// Common CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

// Handle CORS preflight request
export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: corsHeaders,
  });
}

// Handle POST requests
export async function POST(req) {
  try {
    const {
      color,
      urn_size,
      preset_design,
      upload_design,
      design_size,
      design_position,
      design_blur,
      preset_frame,
      upload_frame,
      frame_position,
      upload_image,
      image_position,
      urn_text,
      urn_text_position,
      text_font,
      text_size,
      text_weight,
      black_text,
      price,
      store_reference,
      order_reference,
    } = await req.json();

    if (!price || !store_reference) {
      return new Response(
        JSON.stringify({ error: 'Price and store_reference are required.' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Step 1: Create a Stripe Product
    const stripeProduct = await stripe.products.create({
      name: `Custom Urn - ${store_reference}`,
      metadata: {
        store_reference,
        order_reference,
      },
    });

    // Step 2: Create a Stripe Price
    const stripePrice = await stripe.prices.create({
      unit_amount: price,
      currency: 'usd',
      product: stripeProduct.id,
    });

    // Step 3: Insert into Supabase
    const { data, error } = await supabase
      .from('custom_design')
      .insert({
        color,
        urn_size,
        preset_design,
        upload_design,
        design_size,
        design_position,
        design_blur,
        preset_frame,
        upload_frame,
        frame_position,
        upload_image,
        image_position,
        urn_text,
        urn_text_position,
        text_font,
        text_size,
        text_weight,
        black_text,
        price,
        store_reference,
        order_reference,
        stripe_product_id: stripeProduct.id,
        stripe_price_id: stripePrice.id,
      })
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return new Response(
      JSON.stringify({ message: 'Custom urn created successfully', data }),
      {
        status: 201,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (err) {
    console.error('Error creating custom urn:', err);
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: err.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
}
