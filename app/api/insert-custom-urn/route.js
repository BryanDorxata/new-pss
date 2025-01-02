import { createClient } from '@supabase/supabase-js';
import Stripe from 'stripe';

// Initialize Supabase client
const supabase = createClient(
  process.env.PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Initialize Stripe client
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export async function POST(req) {
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
  };

  try {
    // Parse request body
    const body = await req.json();

    // Create Stripe product
    const product = await stripe.products.create({
      name: body.urn_text || 'Custom Urn',
      description: 'Custom-designed urn',
      metadata: {
        color: body.color || 'N/A',
        urn_size: body.urn_size || 'N/A',
      },
    });

    // Create Stripe price
    const price = await stripe.prices.create({
      unit_amount: body.price,
      currency: 'usd',
      product: product.id,
    });

    // Insert data into Supabase
    const { data, error } = await supabase.from('custom_design').insert([
      {
        color: body.color || null,
        urn_size: body.urn_size || null,
        preset_design: body.preset_design || null,
        upload_design: body.upload_design || null,
        design_size: body.design_size || null,
        design_position: body.design_position || null,
        design_blur: body.design_blur || null,
        preset_frame: body.preset_frame || null,
        upload_frame: body.upload_frame || null,
        frame_position: body.frame_position || null,
        upload_image: body.upload_image || null,
        image_position: body.image_position || null,
        urn_text: body.urn_text || null,
        urn_text_position: body.urn_text_position || null,
        text_font: body.text_font || null,
        text_size: body.text_size || null,
        text_weight: body.text_weight || null,
        black_text: body.black_text || null,
        price: body.price || null,
        store_reference: body.store_reference || null,
        order_reference: body.order_reference || null,
        stripe_product_id: product.id,
        stripe_price_id: price.id,
      },
    ]);

    if (error) {
      console.error('Supabase Insert Error:', error);
      return new Response(
        JSON.stringify({
          error: 'Failed to insert custom urn into database',
          details: error.message || error,
        }),
        { status: 500, headers }
      );
    }

    // Return success response
    return new Response(
      JSON.stringify({ message: 'Custom urn created successfully', data }),
      { status: 200, headers }
    );
  } catch (err) {
    console.error('Error:', err);
    return new Response(
      JSON.stringify({
        error: 'Internal server error',
        details: err.message,
      }),
      { status: 500, headers }
    );
  }
}
