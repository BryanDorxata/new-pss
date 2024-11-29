import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function GET() {
  try {
    // Fetch all rows from the orders table
    const { data: orders, error } = await supabase
      .from('orders')
      .select('products_ordered');

    if (error) {
      throw new Error(`Supabase error: ${error.message}`);
    }

    // Aggregate quantities by product ID
    const productCounts = {};

    orders.forEach((order) => {
      const items = order.products_ordered.items;

      // Ensure `items` is always treated as an array
      const itemsArray = Array.isArray(items) ? items : [items];

      itemsArray.forEach((item) => {
        const productId = item.id;
        const quantity = parseInt(item.quantity, 10) || 0; // Safely parse quantity as an integer

        if (!productCounts[productId]) {
          productCounts[productId] = 0;
        }
        productCounts[productId] += quantity;
      });
    });

    // Sort products by total quantity (descending) and take the top 6
    const sortedProducts = Object.entries(productCounts)
      .sort(([, countA], [, countB]) => countB - countA)
      .slice(0, 6);

    // Format the response
    const response = {};
    sortedProducts.forEach(([id, total], index) => {
      response[`top${index + 1}`] = { id, total };
    });

    // Return the response
    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
