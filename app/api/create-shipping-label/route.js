const axios = require('axios');

exports.handler = async (event, context) => {
  try {
    const { carrierCode, serviceCode, ...otherData } = JSON.parse(event.body);

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
      return {
        statusCode: 200,
        body: JSON.stringify({ success: true, message: 'Shipping label created successfully!', data: response.data }),
      };
    } else {
      return {
        statusCode: response.status,
        body: JSON.stringify({ success: false, message: 'Error creating label', error: response.data }),
      };
    }

  } catch (error) {
    console.error('Error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ success: false, message: 'An error occurred', error: error.message }),
    };
  }
};
