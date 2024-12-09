import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export async function POST(req) {
  try {
    const { name, description, images, default_price } = await req.json();

    if (!name || !default_price) {
      return new Response(
        JSON.stringify({ error: "Name and default price are required" }),
        {
          status: 400,
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*", // Allow all origins
          },
        }
      );
    }

    // Create a product in Stripe
    const product = await stripe.products.create({
      name,
      description,
      images,
    });

    // Create a price for the product
    const price = await stripe.prices.create({
      unit_amount: Math.round(default_price * 100), // Convert to cents
      currency: 'usd',
      product: product.id,
    });

    return new Response(
      JSON.stringify({
        message: "Product created successfully",
        product,
        price,
      }),
      {
        status: 201,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*", // Allow all origins
        },
      }
    );
  } catch (error) {
    console.error("Error creating product:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error", details: error.message }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*", // Allow all origins
        },
      }
    );
  }
}

export function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*", // Allow all origins
      "Access-Control-Allow-Methods": "POST, OPTIONS", // Allowed methods
      "Access-Control-Allow-Headers": "Content-Type", // Allowed headers
    },
  });
}
