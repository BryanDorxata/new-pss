import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const supabase = createClient(
  process.env.PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function POST(req) {
  try {
    const { name, description, price, main_image } = await req.json();

    if (!name || !price) {
      return new Response(
        JSON.stringify({ error: "Name and price are required" }),
        {
          status: 400,
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
          },
        }
      );
    }

    // Step 1: Create the product in Stripe
    const stripeProduct = await stripe.products.create({
      name,
      description,
      images: [main_image],
    });

    // Step 2: Create the price object in Stripe
    const stripePrice = await stripe.prices.create({
      unit_amount: Math.round(price * 100), // Convert price to cents
      currency: "usd", // Adjust this to your desired currency
      product: stripeProduct.id,
    });

    // Step 3: Insert product details into Supabase
    const { data, error } = await supabase
      .from("products") // Adjust to match your Supabase table name
      .insert([
        {
          name,
          description,
          base_price: price,
          main_image,
          stripe_product_id: stripeProduct.id,
          stripe_price_id: stripePrice.id,
        },
      ])
      .select()
      .single();

    if (error) {
      console.error("Supabase error:", error);
      throw new Error("Failed to save product in Supabase");
    }

    // Step 4: Return success response with the created product and price details
    return new Response(
      JSON.stringify({
        message: "Product created successfully",
        product: data,
        stripe: { product: stripeProduct, price: stripePrice },
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      }
    );
  } catch (err) {
    console.error("Error creating product:", err);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      }
    );
  }
}

export function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}
