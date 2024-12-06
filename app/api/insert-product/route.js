import { createClient } from "@supabase/supabase-js";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY); // Make sure the key is set in your environment variables.

const supabase = createClient(
  process.env.PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function POST(req) {
  try {
    const {
      name,
      category,
      size,
      color,
      base_price,
      stock,
      description,
      main_image,
      product_image,
      default_price,
    } = await req.json();

    if (!name || !base_price) {
      return new Response(
        JSON.stringify({ error: "Name and base_price are required." }),
        {
          status: 400,
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*", // Allow all origins
          },
        }
      );
    }

    // Step 1: Create a product in Stripe
    let stripeProductId;
    try {
      const stripeProduct = await stripe.products.create({
        name,
        description,
        images: [main_image, ...(product_image || [])],
        default_price_data: {
          currency: "usd",
          unit_amount: Math.round(base_price * 100), // Stripe expects price in cents
        },
      });
      stripeProductId = stripeProduct.id;
    } catch (err) {
      console.error("Error creating product in Stripe:", err.message);
      return new Response(
        JSON.stringify({ error: `Failed to create product: ${err.message}` }),
        {
          status: 500,
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*", // Allow all origins
          },
        }
      );
    }

    // Step 2: Create the product in Supabase
    try {
      const { data, error } = await supabase.from("products").insert([
        {
          name,
          category,
          size,
          color,
          base_price,
          stock,
          description,
          main_image,
          product_image,
          stripe_product_id: stripeProductId,
          default_price,
        },
      ]);

      if (error) {
        console.error("Error saving product in Supabase:", error.message);
        return new Response(
          JSON.stringify({ error: `Failed to save product: ${error.message}` }),
          {
            status: 500,
            headers: {
              "Content-Type": "application/json",
              "Access-Control-Allow-Origin": "*", // Allow all origins
            },
          }
        );
      }

      // Respond with the newly created product
      return new Response(JSON.stringify(data), {
        status: 201,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*", // Allow all origins
        },
      });
    } catch (err) {
      console.error("Error inserting into Supabase:", err.message);
      return new Response(
        JSON.stringify({ error: `Failed to save product: ${err.message}` }),
        {
          status: 500,
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*", // Allow all origins
          },
        }
      );
    }
  } catch (err) {
    console.error("Unexpected error:", err.message);
    return new Response(
      JSON.stringify({ error: "Internal server error." }),
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
