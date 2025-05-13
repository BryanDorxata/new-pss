// File: app/api/octogen-proxy/route.js
// Updated proxy endpoint with better error handling

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
    
    // Log the request parameters for debugging
    console.log(`Proxy request: text=${text}, limit=${limit}`);
    
    const apiKey = process.env.OCTOGEN_API_KEY;
    if (!apiKey) {
      console.error("API key not found in environment variables");
      return new Response(JSON.stringify({ error: "API key not found in server configuration." }), {
        status: 500,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      });
    }
    
    // Verify which header to use for the API key (X-API-Key or Authorization)
    // Based on your original code, it seems X-API-Key is the correct header
    const targetUrl = `https://api.octogen.ai/catalog/agent_search?text=${encodeURIComponent(text)}&limit=${limit}`;
    console.log(`Fetching from Octogen API: ${targetUrl}`);

    const response = await fetch(targetUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'X-API-Key': apiKey,
        // You might also try this format if the above doesn't work:
        // 'Authorization': `Bearer ${apiKey}`,
      },
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Octogen API error: ${response.status} - ${errorText}`);
      return new Response(JSON.stringify({ 
        error: "Error from Octogen API", 
        status: response.status,
        details: errorText
      }), {
        status: response.status,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      });
    }
    
    const data = await response.json();
    
    return new Response(JSON.stringify(data), {
      status: 200,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    console.error("Proxy endpoint error:", error);
    return new Response(JSON.stringify({ 
      error: "Internal server error", 
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    }), {
      status: 500,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
      },
    });
  }
}

// Define CORS headers - make sure origin matches your Webflow site
const corsHeaders = {
  "Access-Control-Allow-Origin": "*", // You can restrict this to "https://octogen-c90396.webflow.io"
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-API-Key",
};
