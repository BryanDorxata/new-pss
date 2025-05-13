export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: corsHeaders,
  });
}

export async function GET() {
  const apiKey = process.env.OCTOGEN_API_KEY;

  if (!apiKey) {
    return new Response(JSON.stringify({ error: "API key not found." }), {
      status: 500,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
      },
    });
  }

  return new Response(JSON.stringify({ apiKey }), {
    status: 200,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json",
    },
  });
}

//  Restrict to your Webflow domain
const corsHeaders = {
  "Access-Control-Allow-Origin": "https://octogen-c90396.webflow.io",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};
