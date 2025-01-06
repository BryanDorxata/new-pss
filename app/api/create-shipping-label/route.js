import { json, send } from 'route.js';
import fetch from 'node-fetch';

export async function options(req, res) {
  // For preflight requests, allow all origins
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.status(204).send(); // No content
}

export async function post(req, res) {
  try {
    // For actual requests, allow all origins
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

    // Make the request to ShipStation API
    const response = await fetch("https://ssapi.shipstation.com/shipments/createlabel", {
      method: 'POST',
      headers: headers,
      body: JSON.stringify(payload),
    });

    // Handle the response
    if (!response.ok) {
      const error = await response.text();
      return send(res, response.status, { error });
    }

    const result = await response.json();
    send(res, 200, result);

  } catch (error) {
    send(res, 500, { error: 'Error creating shipping label', details: error.message });
  }
}
