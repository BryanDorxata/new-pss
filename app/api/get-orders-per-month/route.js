import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabase = createClient(
  process.env.PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function GET() {
  try {
    // Query to count orders grouped by month and year
    const { data, error } = await supabase
      .rpc('count_orders_by_month'); // Assuming you have a Postgres function called 'count_orders_by_month'

    if (error) {
      throw new Error(error.message);
    }

    // Transform the data into the desired format
    const formattedResponse = data.reduce((acc, row) => {
      const monthYear = `${row.month}-${row.year}`;
      acc[monthYear] = row.count;
      return acc;
    }, {});

    return new Response(JSON.stringify(formattedResponse), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*', // CORS headers to allow cross-origin requests
      },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*', // CORS headers to allow cross-origin requests
      },
    });
  }
}

export function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*', // Allow all origins
      'Access-Control-Allow-Methods': 'GET, OPTIONS', // Allowed methods
      'Access-Control-Allow-Headers': 'Content-Type', // Allowed headers
    },
  });
}
