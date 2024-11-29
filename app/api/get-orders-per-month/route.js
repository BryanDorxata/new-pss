import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabase = createClient(
  process.env.PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function GET() {
  try {
    // Query to count orders grouped by month and year
    const { data, error } = await supabase.rpc('count_orders_by_month');

    if (error) {
      throw new Error(error.message);
    }

    // Transform the data into the desired format
    const formattedResponse = {};
    data.forEach((row) => {
      const monthYear = `${row.month}-${row.year}`;
      formattedResponse[monthYear] = row.count;
    });

    return new Response(JSON.stringify(formattedResponse), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }
}
