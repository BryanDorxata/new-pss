import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.PUBLIC_SUPABASE_ANON_KEY;

// Initialize Supabase client
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export async function GET() {
  try {
    const { data, error } = await supabase.rpc('count_orders_by_month');

    if (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Correctly format results into { "mm-yyyy": count } format
    const formattedData = data.reduce((acc, item) => {
      const year = item.month.substring(0, 4); // Extract year (first 4 characters)
      const month = item.month.substring(4); // Extract month (last 2 characters)
      const formattedMonth = `${month}-${year}`; // Combine into mm-yyyy
      acc[formattedMonth] = item.count;
      return acc;
    }, {});

    return new Response(JSON.stringify(formattedData), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
