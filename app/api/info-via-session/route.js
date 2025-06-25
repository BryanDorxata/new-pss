import Stripe from 'stripe';

// Initialize Stripe with your secret key from environment variables.
// Ensure process.env.STRIPE_SECRET_KEY is set in your Vercel project settings.
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// Define CORS headers to allow requests from any origin.
const corsHeaders = {
  'Access-Control-Allow-Origin': '*', // Allows requests from any domain
  'Access-Control-Allow-Methods': 'GET, OPTIONS', // Specifies allowed HTTP methods
  'Access-Control-Allow-Headers': 'Content-Type', // Specifies allowed request headers
};

/**
 * Handles HTTP OPTIONS requests (preflight requests for CORS).
 * Browsers send these before a GET request to check if the actual request is safe.
 * @returns {Response} A 204 No Content response with CORS headers.
 */
export async function OPTIONS() {
  return new Response(null, { status: 204, headers: corsHeaders });
}

/**
 * Handles HTTP GET requests to retrieve Stripe Checkout session details.
 * This endpoint expects a 'session_id' as a query parameter (e.g., /api/session-details?session_id=cs_...).
 * @param {Request} req The incoming request object.
 * @returns {Response} A JSON response containing the session details or an error message.
 */
export async function GET(req) {
  try {
    // Parse the URL to get query parameters
    const url = new URL(req.url);
    const sessionId = url.searchParams.get('session_id');

    console.log(`🔍 Received request for session ID: ${sessionId}`);

    // Validate the session_id
    if (!sessionId) {
      throw new Error("Missing 'session_id' query parameter.");
    }

    // Retrieve the Stripe Checkout Session
    // You might want to expand specific fields if needed, e.g., { expand: ['line_items'] }
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    // Basic check if session was found
    if (!session) {
      return new Response(JSON.stringify({ error: 'Stripe session not found.' }), {
        status: 404, // Not Found
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`✅ Successfully retrieved session: ${session.id}`);

    // Return the session details.
    // Be mindful of what data you expose to the client.
    // For sensitive applications, you might filter this down.
    return new Response(JSON.stringify(session), {
      status: 200, // OK
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error("❌ Error retrieving Stripe session:", error.message);

    // Return a 400 Bad Request status for client-side errors (e.g., missing ID)
    // or a 500 Internal Server Error for unexpected issues.
    const statusCode = error.message.includes('Missing') ? 400 : 500;
    return new Response(JSON.stringify({ error: error.message }), {
      status: statusCode,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
}
