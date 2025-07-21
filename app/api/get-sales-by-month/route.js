import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY); // Replace with your actual Stripe secret key

// Handle preflight (OPTIONS) requests
export async function OPTIONS() {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };

  return new Response(null, {
    status: 204,
    headers: corsHeaders,
  });
}

// Handle POST requests
export async function POST() {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };

  try {
    let hasMore = true;
    let startingAfter = null;
    const salesByMonth = {};

    while (hasMore) {
      const params = {
        limit: 100,
        ...(startingAfter && { starting_after: startingAfter }),
      };

      const charges = await stripe.charges.list(params);

      charges.data.forEach((charge) => {
        if (charge.paid && charge.status === 'succeeded') {
          const date = new Date(charge.created * 1000); // Convert Unix timestamp to JavaScript Date
          const month = `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}`;

          if (!salesByMonth[month]) {
            salesByMonth[month] = {
              totalSales: 0,
              count: 0,
            };
          }

          salesByMonth[month].totalSales += charge.amount;
          salesByMonth[month].count += 1;
        }
      });

      hasMore = charges.has_more;
      if (hasMore) {
        startingAfter = charges.data[charges.data.length - 1].id;
      }
    }

    return new Response(
      JSON.stringify(salesByMonth),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (err) {
    console.error('Error fetching sales by month:', err);
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: err.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
}
