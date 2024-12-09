import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export async function POST(req) {
  try {
    const { name, description, images, default_price } = await req.json();

    // Validate required fields
    if (!name || !default_price) {
      return new Response(
        JSON.stringify({ error: "Name and default price are required" }),
        {
          status: 400,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
    }

    // Create Stripe product
    const product = await stripe.products.create({
      name,
      description,
      images, // This should be an array of image URLs
      default_price_data: {
        unit_amount: Math.round(default_price * 100), // Amount in cents
        currency: "usd", // Replace with your desired currency
      },
    });

    return new Response(
      JSON.stringify({ success: true, product }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    console.error("Error creating product in Stripe:", error);
    return new Response(
      JSON.stringify({ error: "Failed to create product" }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
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
