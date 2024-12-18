import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// Common CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

// Handle preflight (OPTIONS) requests
export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: corsHeaders,
  });
}

// Fetch all charges with pagination
async function fetchAllCharges() {
  let charges = [];
  let hasMore = true;
  let lastChargeId = null;

  try {
    while (hasMore) {
      const { data, has_more } = await stripe.charges.list({
        limit: 100,
        starting_after: lastChargeId, // Use the last retrieved charge ID to fetch the next page
      });

      charges = charges.concat(data); // Append new charges to the list
      hasMore = has_more; // Stripe indicates if there are more pages
      if (hasMore) lastChargeId = data[data.length - 1].id; // Update the last charge ID
    }

    return charges;
  } catch (err) {
    console.error('Error fetching charges from Stripe:', err.message);
    throw err;
  }
}

// Handle GET requests
export async function GET() {
  try {
    // Set CORS headers
    const headers = {
      'Content-Type': 'application/json',
      ...corsHeaders,
    };

    // Retrieve all charges from Stripe
    console.log('Fetching all charges from Stripe...');
    const charges = await fetchAllCharges();
    console.log('Charges fetched successfully:', charges.length);

    // Filter successful charges and group by month
    const salesByMonth = charges
      .filter(charge => charge.status === 'succeeded') // Include only successful payments
      .reduce((acc, charge) => {
        const month = new Date(charge.created * 1000).toISOString().substring(0, 7); // YYYY-MM format
        acc[month] = (acc[month] || 0) + charge.amount / 100; // Sum amounts (Stripe amounts are in cents)
        return acc;
      }, {});

    console.log('Sales grouped by month:', salesByMonth);

    // Convert salesByMonth object to array
    const result = Object.entries(salesByMonth).map(([month, total_sales]) => ({
      month,
      total_sales,
    }));

    // Return the result
    return new Response(JSON.stringify(result), { status: 200, headers });
  } catch (err) {
    console.error('Error fetching sales data from Stripe:', err.message);
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: err.message }),
      { status: 500, headers: corsHeaders }
    );
  }
}
