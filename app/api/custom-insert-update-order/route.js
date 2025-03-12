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

export async function OPTIONS() {
  return new Response(null, { status: 204, headers });
}

export async function POST(req) {
  try {
    const body = await req.json();

    // Check required fields
    if (!body.price || !body.store_reference || !body.customer_name || !body.customer_email) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), { status: 400, headers });
    }

    // Step 1: Create Stripe product for the custom urn
    let product = await stripe.products.create({
      name: body.urn_text?.top?.text || 'Custom Urn',
      description: 'Custom-designed urn',
      metadata: { color: body.color || 'N/A', urn_size: body.urn_size || 'N/A' },
    });

    let price = await stripe.prices.create({
      unit_amount: body.price,
      currency: 'usd',
      product: product.id,
    });

    // Step 2: Insert custom urn into `custom_design`
    const { data: urnData, error: urnError } = await supabase
      .from('custom_design')
      .insert([
        {
          color: body.color || null,
          urn_size: body.urn_size || null,
          design_size: body.design_size || null,
          design_blur: body.design_blur || null,
          urn_text: body.urn_text || null,
          price: body.price || null,
          store_reference: body.store_reference,
          stripe_product_id: product.id,
          stripe_price_id: price.id,
        },
      ])
      .select()
      .single();

    if (urnError) throw urnError;
    const customUrnId = urnData.id;

    // Step 3: Prepare `products_ordered`, adding the custom urn as a product
    let productsOrdered = {
      items: [
        {
          id: customUrnId, // Use the inserted urn's ID
          color: body.color,
          size: body.urn_size,
          quantity: 1,
          price: body.price,
          text_top: body.urn_text?.top?.text,
          text_middle: body.urn_text?.middle?.text,
          text_bottom: body.urn_text?.bottom?.text,
        },
        ...(body.products_ordered?.items || []) // Include other ordered products
      ]
    };

    // Step 4: Insert order into `orders`
    const { data: orderData, error: orderError } = await supabase
      .from('orders')
      .insert([
        {
          store_reference: body.store_reference,
          customer_name: body.customer_name,
          customer_email: body.customer_email,
          address: body.address,
          shipping_details: body.shipping_details,
          products_ordered: productsOrdered, // Now contains the custom urn
          confirmation: body.confirmation,
          phone_number: body.phone_number,
        },
      ])
      .select()
      .single();

    if (orderError) throw orderError;
    const orderReference = orderData.id;

    // Step 5: Update `custom_design` row with `order_reference`
    const { error: updateError } = await supabase
      .from('custom_design')
      .update({ order_reference: orderReference })
      .eq('id', customUrnId);

    if (updateError) throw updateError;

    return new Response(
      JSON.stringify({ message: 'Success', urnData, orderData }),
      { status: 201, headers }
    );
  } catch (err) {
    console.error('Error:', err);
    return new Response(
      JSON.stringify({ error: 'Unexpected server error.', details: err.message }),
      { status: 500, headers }
    );
  }
}
