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

    console.log("Incoming request body:", {
      name,
      base_price,
      main_image,
      product_image,
    });

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

    // Create a product in Stripe
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
      console.log("Stripe product created:", stripeProduct);
      stripeProductId = stripeProduct.id;
    } catch (err) {
      console.error("Stripe error:", err.message);
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

    // Insert the product into Supabase
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
      console.log("Supabase response:", { data, error });

      if (error) {
        console.error("Supabase error:", error.message);
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

      return new Response(JSON.stringify(data), {
        status: 201,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*", // Allow all origins
        },
      });
    } catch (err) {
      console.error("Supabase error:", err.message);
      return new Response(
        JSON.stringify({ error: "Failed to save product: " + err.message }),
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
      JSON.stringify({ error: "Internal server error: " + err.message }),
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
