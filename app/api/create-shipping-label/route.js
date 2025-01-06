const express = require('express');
const shipstation = require('shipstation-api'); // Assuming you've installed the library

const app = express();
const port = process.env.PORT || 3000; // Use a port from Vercel's environment

const shipstationApiKey = process.env.SHIPSTATION_API_KEY;
const shipstationApiSecret = process.env.SHIPSTATION_API_SECRET;

const shipstationClient = new shipstation.Client(shipstationApiKey, shipstationApiSecret);

// Basic authentication example (replace with your chosen method)
app.use((req, res, next) => {
  if (req.headers.authorization !== 'your_secret_token') {
    return res.status(401).send('Unauthorized');
  }
  next();
});

app.post('/create-label', async (req, res) => {
  try {
    const {
      carrierCode,
      serviceCode,
      packageCode,
      confirmation,
      shipDate,
      weight,
      dimensions,
      shipFrom,
      shipTo,
      insuranceOptions,
      internationalOptions,
      advancedOptions,
      testLabel,
    } = req.body;

    const createLabelRequest = {
      carrierCode,
      serviceCode,
      packageCode,
      confirmation,
      shipDate,
      weight: {
        value: weight.value,
        units: weight.units,
      },
      dimensions: {
        units: dimensions.units,
        length: dimensions.length,
        width: dimensions.width,
        height: dimensions.height,
      },
      shipFrom,
      shipTo,
      insuranceOptions,
      internationalOptions,
      advancedOptions,
      testLabel,
    };

    const createLabelResponse = await shipstationClient.createShipment(createLabelRequest);

    res.json({
      success: true,
      trackingNumber: createLabelResponse.trackingNumber,
      labelUrl: createLabelResponse.labelUrl, // Or other relevant label information
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Error creating label' });
  }
});

app.listen(port, () => console.log(`Server listening on port ${port}`));