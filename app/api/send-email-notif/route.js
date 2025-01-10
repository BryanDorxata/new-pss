import sgMail from '@sendgrid/mail';

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const headers = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

// Handle preflight (OPTIONS) requests
export async function OPTIONS() {
  return new Response(null, { status: 204, headers });
}

// Handle POST request
export async function POST(req) {
  try {
    if (req.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers });
    }

    const body = await req.json();

    // Validate required fields
    if (!body.to || !body.templateId || !body.dynamicData) {
      return new Response(
        JSON.stringify({
          error: 'Validation error: "to", "templateId", and "dynamicData" are required.',
        }),
        { status: 400, headers }
      );
    }

    // Email data
    const emailData = {
      to: body.to, // Recipient's email
      from: process.env.SENDGRID_FROM_EMAIL, // Your verified sender email
      templateId: body.templateId, // SendGrid template ID
      dynamic_template_data: body.dynamicData, // Dynamic data for the template
    };

    // Send the email
    await sgMail.send(emailData);

    return new Response(
      JSON.stringify({ message: 'Email sent successfully using template' }),
      { status: 200, headers }
    );
  } catch (err) {
    console.error('SendGrid Error:', err);
    return new Response(
      JSON.stringify({
        error: 'Failed to send email',
        details: err.message,
      }),
      { status: 500, headers }
    );
  }
}
