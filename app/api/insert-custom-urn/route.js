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

    console.log('Incoming request body:', {
      color,
      urn_size,
      price,
      urn_text,
      store_reference,
    });

    if (!price || !store_reference || !order_reference) {
      return new Response(
        JSON.stringify({
          error: 'Price, store_reference, and order_reference are required.',
        }),
        {
          status: 400,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*', // Allow all origins
          },
        }
      );
    }

    // Create a product in Stripe
    let stripeProductId, stripePriceId;
    try {
      const stripeProduct = await stripe.products.create({
        name: urn_text || 'Custom Urn',
        description: 'Custom-designed urn',
        metadata: {
          color: color || 'N/A',
          urn_size: urn_size || 'N/A',
        },
      });

      const stripePrice = await stripe.prices.create({
        unit_amount: price,
        currency: 'usd',
        product: stripeProduct.id,
      });

      console.log('Stripe product and price created:', stripeProduct, stripePrice);

      stripeProductId = stripeProduct.id;
      stripePriceId = stripePrice.id;
    } catch (err) {
      console.error('Stripe error:', err.message);
      return new Response(
        JSON.stringify({ error: `Failed to create product: ${err.message}` }),
        {
          status: 500,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*', // Allow all origins
          },
        }
      );
    }

    // Insert the custom urn into Supabase
    try {
      const { data, error } = await supabase.from('custom_design').insert([
        {
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
          stripe_product_id: stripeProductId,
          stripe_price_id: stripePriceId,
        },
      ]);
      console.log('Supabase response:', { data, error });

      if (error) {
        console.error('Supabase error:', error.message);
        return new Response(
          JSON.stringify({ error: `Failed to save custom urn: ${error.message}` }),
          {
            status: 500,
            headers: {
              'Content-Type': 'application/json',
              'Access-Control-Allow-Origin': '*', // Allow all origins
            },
          }
        );
      }

      return new Response(
        JSON.stringify({
          message: 'Custom urn created successfully',
          data,
        }),
        {
          status: 201,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*', // Allow all origins
          },
        }
      );
    } catch (err) {
      console.error('Supabase error:', err.message);
      return new Response(
        JSON.stringify({ error: 'Failed to save custom urn: ' + err.message }),
        {
          status: 500,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*', // Allow all origins
          },
        }
      );
    }
  } catch (err) {
    console.error('Unexpected error:', err.message);
    return new Response(
      JSON.stringify({ error: 'Internal server error: ' + err.message }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*', // Allow all origins
        },
      }
    );
  }
}
