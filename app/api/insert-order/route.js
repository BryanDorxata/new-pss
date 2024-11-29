import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

export async function GET() {
  try {
    const { data, error } = await supabase.rpc('count_orders_by_month');

    if (error) {
      console.error('Error fetching data from Supabase RPC:', error);
      return new Response(JSON.stringify({ error: 'Failed to fetch data.' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Format the response
    const formattedData = {};
    data.forEach((row) => {
      const monthYear = `${row.month}-${row.year}`;
      formattedData[monthYear] = row.count;
    });

    return new Response(JSON.stringify(formattedData), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('Unexpected error:', err);
    return new Response(JSON.stringify({ error: 'Unexpected error occurred.' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
