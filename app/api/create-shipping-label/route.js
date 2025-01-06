import axios from 'axios'; 

export const config = {
  runtime: "nodejs18.x", 
};

export default async function handler(req, res) {
  try {
    const { carrierCode, serviceCode, ...otherData } = req.body; 

    const apiKey = process.env.SHIPSTATION_API_KEY;
    const apiSecret = process.env.SHIPSTATION_API_SECRET;

    const authorization = `Basic ${Buffer.from(`${apiKey}:${apiSecret}`).toString('base64')}`;

    const headers = {
      'Authorization': authorization,
      'Content-Type': 'application/json',
    };

    const body = JSON.stringify({
      carrierCode,
      serviceCode,
      ...otherData,
    });

    const response = await axios.post(
      'https://ssapi.shipstation.com/shipments/createlabel',
      body,
      { headers }
    );

    if (response.status === 200) {
      return res.status(200).json({ success: true, message: 'Shipping label created successfully!', data: response.data });
    } else {
      return res.status(response.status).json({ success: false, message: 'Error creating label', error: response.data });
    }

  } catch (error) {
    console.error('Error:', error);
    return res.status(500).json({ success: false, message: 'An error occurred', error: error.message });
  }
}