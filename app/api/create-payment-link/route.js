// app/api/create-payment-link/route.js
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export async function POST(req) {
  const { priceId, quantity } = await req.json();

  try {
    const paymentLink = await stripe.paymentLinks.create({
      line_items: [
        {
          price: priceId, // Pre-configured Price ID from your Stripe Dashboard
          quantity: quantity || 1,
        },
      ],
      after_completion: {
        type: 'redirect',
        redirect: { url: 'https://your-redirect-url.com' }, // Change to your redirect URL
      },
    });

    return new Response(JSON.stringify({ url: paymentLink.url }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }
}