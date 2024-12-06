import { createClient } from '@supabase/supabase-js';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const supabase = createClient(
  process.env.PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function POST(req) {
  try {
    const productData = await req.json();

    if (!productData.name || !productData.base_price) {
      return new Response(
        JSON.stringify({ error: "Name and base_price are required" }),
        {
          status: 400,
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*"
          }
        }
      );
    }

    // Step 1: Create product in Stripe
    const stripeProduct = await stripe.products.create({
      name: productData.name,
      description: productData.description,
      images: [productData.main_image, ...(productData.product_image || [])],
      metadata: {
        category: productData.category || "Uncategorized",
        stock: productData.stock?.toString() || "N/A"
      }
    });

    // Step 2: Create a price in Stripe for the product
    const stripePrice = await stripe.prices.create({
      product: stripeProduct.id,
      unit_amount: Math.round(productData.base_price * 100), // Stripe uses cents
      currency: 'usd',
      metadata: {
        default_price: productData.default_price?.toString() || "0"
      }
    });

    // Step 3: Insert product into Supabase
    const { data, error } = await supabase
      .from('products')
      .insert([
        {
          name: productData.name,
          category: productData.category || null,
          size: productData.size || [],
          color: productData.color || [],
          base_price: productData.base_price,
          stock: productData.stock || null,
          description: productData.description || null,
          main_image: productData.main_image || null,
          product_image: productData.product_image || [],
          stripe_product_id: stripeProduct.id,
          default_price: productData.default_price || null,
          created_at: new Date(),
          updated_at: new Date()
        }
      ])
      .select('*')
      .single();

    if (error) {
      // Rollback: Delete Stripe product if Supabase insert fails
      await stripe.products.del(stripeProduct.id);
      return new Response(
        JSON.stringify({ error: error.message }),
        {
          status: 500,
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*"
          }
        }
      );
    }

    return new Response(
      JSON.stringify({ success: true, product: data, stripeProduct, stripePrice }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*"
        }
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
          "Access-Control-Allow-Origin": "*"
        }
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
      "Access-Control-Allow-Headers": "Content-Type"
    }
  });
}
