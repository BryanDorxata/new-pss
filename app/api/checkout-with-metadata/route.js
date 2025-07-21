import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: corsHeaders });
}

export async function POST(req) {
  try {
    const body = await req.json();
    console.log("🔍 Received body for simple checkout:", JSON.stringify(body, null, 2));

    if (!body.products || !Array.isArray(body.products) || body.products.length === 0) {
      throw new Error("Invalid request: 'products' must be a non-empty array.");
    }

    body.products.forEach((product, index) => {
      if (typeof product.productName !== 'string' || product.productName.trim() === '') {
        throw new Error(`Product at index ${index} has an invalid or missing 'productName'.`);
      }
      if (typeof product.unitAmount !== 'number' || product.unitAmount <= 0 || !Number.isInteger(product.unitAmount)) {
        throw new Error(`Product at index ${index} has an invalid 'unitAmount'. It must be a positive integer (in cents).`);
      }
      if (typeof product.quantity !== 'number' || product.quantity <= 0 || !Number.isInteger(product.quantity)) {
        throw new Error(`Product at index ${index} has an invalid 'quantity'. It must be a positive integer.`);
      }
    });

    // Extract metadata from the request body if present
    // Stripe's metadata object accepts key-value pairs where both keys and values are strings.
    // If you pass non-string values, Stripe will automatically convert them to strings.
    const metadata = body.metadata || {};

    const line_items = body.products.map(product => ({
      price_data: {
        currency: 'usd',
        product_data: {
          name: product.productName,
        },
        unit_amount: product.unitAmount,
      },
      quantity: product.quantity,
    }));

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items,
      mode: 'payment',
      success_url: `${req.headers.get('Origin')}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.headers.get('Origin')}/cancel`,
      // Add the metadata here
      metadata: metadata,
    });

    console.log("✅ Created simple Stripe session:", session.url);

    return new Response(JSON.stringify({ url: session.url }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error("❌ Error processing simple checkout request:", error.message);

    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
}
