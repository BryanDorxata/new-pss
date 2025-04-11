import { NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export async function POST(req) { //  Remove 'req'
  try {
    // 1. Create the Stripe Connect Account
    const account = await stripe.accounts.create({
      type: 'express', // Or 'standard' or 'custom' as needed
      email: 'user@example.com', // Replace with the user's email (or get it from the request)
      country: 'US',       // Required for Express and Custom accounts
      capabilities: {
        card_payments: { requested: true },
        transfers: { requested: true },
      },
      // Add other account parameters as necessary
    });

    // 2. Create the Account Link for Onboarding
    const accountLink = await stripe.accountLinks.create({
      account: account.id,
      refresh_url: 'https://your-platform.com/reauth', // Replace with your actual URL
      return_url: 'https://your-platform.com/onboarding/return', // Replace with your actual URL
      type: 'account_onboarding',
    });

    // 3. Return the Account Link URL
    return NextResponse.json({ url: accountLink.url }, {
      headers: {
        'Access-Control-Allow-Origin': '*', // Or restrict to your domain: 'https://your-platform.com'
        'Access-Control-Allow-Methods': 'POST',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });
  } catch (error) {
    console.error('Error creating Stripe Connect account or link:', error);
    return NextResponse.json({ error: error.message || 'Failed to create Stripe Connect account' }, {
      status: 500,
      headers: {
        'Access-Control-Allow-Origin': '*', // Or restrict to your domain
        'Access-Control-Allow-Methods': 'POST',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });
  }
}

export const OPTIONS = async (req) => { // Remove 'req'
  return NextResponse.json(
    {},
    {
      status: 200,
      headers: {
        "Allow": "POST, OPTIONS",
        "Access-Control-Allow-Origin": "*", // Or restrict to your domain
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
      },
    }
  );
};
