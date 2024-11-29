import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function GET() {
  try {
    // Fetch all orders from the "orders" table
    const { data: orders, error } = await supabase
      .from('orders')
      .select('products_ordered');

    if (error) throw new Error(error.message);

    // Initialize a dictionary to count product quantities
    const productCounts = {};

    orders.forEach(order => {
      // Ensure products_ordered.items is an array
      const items = Array.isArray(order.products_ordered?.items)
        ? order.products_ordered.items
        : [];

      // Loop through each item in the order
      items.forEach(item => {
        const productId = item.id;
        const quantity = parseInt(item.quantity, 10) || 0;

        if (!productCounts[productId]) {
          productCounts[productId] = 0;
        }
        productCounts[productId] += quantity; // Accumulate quantity
      });
    });

    // Sort products by total quantity (descending) and take the top 6
    const topProducts = Object.entries(productCounts)
      .sort(([, qtyA], [, qtyB]) => qtyB - qtyA) // Sort by quantity
      .slice(0, 6); // Take the top 6

    // Format the response to include both product ID and total quantity
    const response = {};
    topProducts.forEach(([id, total], index) => {
      response[`top${index + 1}`] = { id, total };
    });

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
  }
}
