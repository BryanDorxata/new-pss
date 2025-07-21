import Stripe from 'stripe';

// Initialize Stripe with your secret key from environment variables.
// This key should NEVER be exposed on the client-side.
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// Define CORS headers for your API endpoint.
// In a production environment, consider restricting 'Access-Control-Allow-Origin'
// to only your frontend domain(s) for enhanced security.
const headers = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*', // Allow requests from any origin (for development)
  'Access-Control-Allow-Methods': 'POST, OPTIONS', // Allow POST and OPTIONS methods
  'Access-Control-Allow-Headers': 'Content-Type, Authorization', // Allow specified headers
};

/**
 * Handles preflight OPTIONS requests for CORS.
 * Vercel's Edge Runtime automatically routes OPTIONS requests to this function.
 * @returns {Response} A 204 No Content response with CORS headers.
 */
export async function OPTIONS() {
  return new Response(null, { status: 204, headers });
}

/**
 * Handles POST requests to create a Stripe Connect onboarding account link.
 * This function will:
 * 1. Parse the request body to get necessary information (e.g., account ID, return/refresh URLs).
 * 2. Validate the input.
 * 3. Create a Stripe Connect account link using the Stripe API.
 * 4. Return the generated URL to the client.
 * @param {Request} req The incoming request object.
 * @returns {Response} A JSON response containing the onboarding URL or an error message.
 */
export async function POST(req) {
  try {
    // Parse the request body to extract necessary data.
    // The client should send `account_id`, `return_url`, and `refresh_url`.
    const body = await req.json();
    const { account_id, return_url, refresh_url } = body;

    // --- Input Validation ---
    // Ensure all required parameters are provided.
    if (!account_id) {
      return new Response(
        JSON.stringify({ error: 'Stripe Connect account ID is required.' }),
        { status: 400, headers }
      );
    }
    if (!return_url) {
      return new Response(
        JSON.stringify({ error: 'Return URL is required.' }),
        { status: 400, headers }
      );
    }
    if (!refresh_url) {
      return new Response(
        JSON.stringify({ error: 'Refresh URL is required.' }),
        { status: 400, headers }
      );
    }

    // --- IMPORTANT: Implement Authentication/Authorization here! ---
    // Before creating an account link, you should verify that the request
    // is authorized. For example, check if the user making this request
    // is an admin, or if they are the owner of the `account_id` being linked.
    // Example pseudo-code:
    // const authToken = req.headers.get('authorization');
    // if (!authToken || !isValidInternalAuthToken(authToken)) {
    //   return new Response(
    //     JSON.stringify({ error: 'Unauthorized: Invalid or missing authentication token.' }),
    //     { status: 401, headers }
    //   );
    // }
    // --- End Authentication/Authorization ---

    // Create the Stripe Account Link.
    // The `type: 'account_onboarding'` specifies that this link is for
    // completing the onboarding process.
    const accountLink = await stripe.accountLinks.create({
      account: account_id, // The ID of the Stripe Connect account
      refresh_url: refresh_url, // URL Stripe redirects to if the link expires or is invalid
      return_url: return_url, // URL Stripe redirects to after onboarding is complete
      type: 'account_onboarding', // Type of link for onboarding
    });

    // Return the generated URL to the client.
    return new Response(
      JSON.stringify({ url: accountLink.url }),
      { status: 200, headers }
    );
  } catch (error) {
    // Log the full error details for server-side debugging.
    console.error('Error creating Stripe Connect account link:', error);

    // Return an error response to the client.
    // In production, consider providing more generic error messages to clients
    // to avoid exposing sensitive internal details.
    return new Response(
      JSON.stringify({
        error: 'Failed to create Stripe Connect account link.',
        details: error.message, // Include error message for debugging
      }),
      { status: 500, headers }
    );
  }
}
