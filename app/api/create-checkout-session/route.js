import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

// Handle preflight (OPTIONS) requests
export async function OPTIONS() {
  return new Response(null, { status: 204, headers: corsHeaders });
}

// Handle POST requests
export async function POST(req) {
  try {
    const body = await req.json();
    console.log("🔍 Received body:", JSON.stringify(body, null, 2));

    // Validate the request
    if (!body.products || !Array.isArray(body.products) || body.products.length === 0) {
      throw new Error("Invalid request: 'products' must be a non-empty array.");
    }

    // Validate each product
    body.products.forEach((product, index) => {
      if (!product.productName || !product.unitAmount || !product.quantity) {
        throw new Error(`Product at index ${index} is missing required fields.`);
      }
    });

    // Build line items for Stripe Checkout
    const line_items = body.products.map(product => ({
      price_data: {
        currency: 'usd',
        product_data: { name: product.productName },
        unit_amount: product.unitAmount,
      },
      quantity: product.quantity,
    }));

    // Stripe session data
    const sessionData = {
      payment_method_types: ['card'],
      line_items,
      mode: 'payment',
      success_url: `${req.headers.get('Origin')}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.headers.get('Origin')}/cancel`,
      metadata: {
        storeId: body.storeId || 'unknown',
        orderId: body.orderId || 'unknown',
      },
      // Add payment_intent_data to specify the application fee
      payment_intent_data: {
        application_fee_amount: calculateApplicationFee(body.products), // Function to calculate your fee
        transfer_data: {
          destination: body.connectedAccountId, // The ID of the connected account
        },
      },
      on_behalf_of: body.connectedAccountId, // Specify the connected account
    };

    // Create Stripe Checkout session
    const session = await stripe.checkout.sessions.create(sessionData);
    console.log("✅ Created Stripe session:", session.url);

    return new Response(JSON.stringify({ url: session.url }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error("❌ Error processing request:", error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
}


function calculateApplicationFee(products) {
  let totalAmount = 0;
  products.forEach(product => {
    totalAmount += product.unitAmount * product.quantity;
  });  
  return Math.round(totalAmount * 0.10);
}
