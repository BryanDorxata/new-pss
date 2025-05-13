// File: app/api/octogen-proxy/route.js
// This creates a proxy endpoint that forwards requests to Octogen's API

export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: corsHeaders,
  });
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const text = searchParams.get('text') || '';
    const limit = searchParams.get('limit') || '8';
    
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
    
    const response = await fetch(
      `https://api.octogen.ai/catalog/agent_search?text=${encodeURIComponent(text)}&limit=${limit}`,
      {
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
      }
    );
    
    const data = await response.json();
    
    return new Response(JSON.stringify(data), {
      status: response.status,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
      },
    });
  }
}

// You can restrict this to your Webflow domain
const corsHeaders = {
  "Access-Control-Allow-Origin": "https://octogen-c90396.webflow.io", // Your specific Webflow domain
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};