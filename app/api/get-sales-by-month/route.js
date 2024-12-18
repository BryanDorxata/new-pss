import Stripe from 'stripe';

// Initialize the Stripe client
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// Handle POST requests
export async function POST() { // Removed `req` since it's not used
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };

  try {
    // Fetch all charges
    const fetchAllCharges = async () => {
      let charges = [];
      let hasMore = true;
      let lastChargeId = null;

      try {
        while (hasMore) {
          const params = { limit: 100 };
          if (lastChargeId) {
            params.starting_after = lastChargeId; // Include `starting_after` only if we have a value
          }

          const { data, has_more } = await stripe.charges.list(params);

          charges = charges.concat(data); // Append new charges to the list
          hasMore = has_more; // Stripe indicates if there are more pages
          if (hasMore) lastChargeId = data[data.length - 1].id; // Update the last charge ID
        }

        return charges;
      } catch (err) {
        console.error('Error fetching charges from Stripe:', err.message);
        throw err;
      }
    };

    const charges = await fetchAllCharges();

    // Group charges by month and calculate total sales
    const salesByMonth = charges.reduce((acc, charge) => {
      if (charge.status === 'succeeded') {
        const date = new Date(charge.created * 1000); // Convert Unix timestamp to Date
        const monthYear = `${date.getMonth() + 1}-${date.getFullYear()}`; // Format as MM-YYYY

        if (!acc[monthYear]) {
          acc[monthYear] = 0;
        }

        acc[monthYear] += charge.amount / 100; // Convert cents to dollars
      }
      return acc;
    }, {});

    return new Response(
      JSON.stringify(salesByMonth),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (err) {
    console.error('Error:', err.message);
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: err.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
}

// Handle preflight (OPTIONS) requests
export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
