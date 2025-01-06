import axios from 'axios';

export async function OPTIONS(req, res) {
  // Allow all origins for CORS (this is for the preflight request)
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.status(204).end(); // No content
}

export async function POST(req, res) {
  try {
    // CORS: Add headers for POST
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
    // Retrieve API credentials from Vercel environment variables
    const apiKey = process.env.SHIPSTATION_API_KEY;
    const apiSecret = process.env.SHIPSTATION_API_SECRET;
    
    // Construct the Basic Authorization header
    const auth = Buffer.from(`${apiKey}:${apiSecret}`).toString('base64');

    // Prepare the headers
    const headers = {
      "Host": "ssapi.shipstation.com",
      "Authorization": `Basic ${auth}`,
      "Content-Type": "application/json"
    };

    // Parse the request body for the shipping label details
    const payload = req.body;

    // Make the request to ShipStation API using axios
    const response = await axios.post("https://ssapi.shipstation.com/shipments/createlabel", payload, { headers });

    // Handle the response
    if (response.status !== 200) {
      return res.status(response.status).json({ error: response.data });
    }

    // Respond with the result of the ShipStation request
    res.status(200).json(response.data);

  } catch (error) {
    res.status(500).json({ error: 'Error creating shipping label', details: error.message });
  }
}
