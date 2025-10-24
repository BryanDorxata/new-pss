import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY // Use service role key for updates
);

export async function POST(req) {
  try {
    // Parse the request body
    const { orderId, confirmation, shipmentID, labelData, trackingNumber } = await req.json();

    // Validate required fields
    if (!orderId) {
      return new Response(
        JSON.stringify({
          error: 'Missing required field: orderId',
          example: {
            orderId: "05a83ba0-b15e-4959-b901-c26a66e4719b",
            confirmation: "confirmationFromStripe",
            shipmentID: "idFromShippingStation",
            labelData: "base64EncodedLabelData",
            trackingNumber: "1Z999AA10123456784"
          }
        }),
        {
          status: 400,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
        }
      );
    }

    // Validate that at least one field to update is provided
    if (confirmation === undefined && shipmentID === undefined && labelData === undefined && trackingNumber === undefined) {
      return new Response(
        JSON.stringify({
          error: 'At least one field must be provided: confirmation, shipmentID, labelData, or trackingNumber'
        }),
        {
          status: 400,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
        }
      );
    }

    // Check if order exists first
    const { data: existingOrder, error: fetchError } = await supabase
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .single();

    if (fetchError) {
      if (fetchError.code === 'PGRST116') {
        // No rows returned
        return new Response(
          JSON.stringify({
            error: 'Order not found',
            orderId: orderId
          }),
          {
            status: 404,
            headers: {
              'Content-Type': 'application/json',
              'Access-Control-Allow-Origin': '*',
            },
          }
        );
      }
      throw new Error(`Error fetching order: ${fetchError.message}`);
    }

    // Prepare update object - only include fields that are provided
    const updateData = {
      updated_at: new Date().toISOString()
    };

    if (confirmation !== undefined) {
      updateData.confirmation = confirmation;
    }

    if (shipmentID !== undefined) {
      updateData.shipmentID = shipmentID;
    }

    if (labelData !== undefined) {
      updateData.labelData = labelData;
    }

    if (trackingNumber !== undefined) {
      updateData.trackingNumber = trackingNumber;
    }

    // Perform the update
    const { data: updatedOrder, error: updateError } = await supabase
      .from('orders')
      .update(updateData)
      .eq('id', orderId)
      .select('*')
      .single();

    if (updateError) {
      throw new Error(`Error updating order: ${updateError.message}`);
    }

    // Prepare response with the complete updated order
    const response = {
      success: true,
      message: 'Order updated successfully',
      orderId: orderId,
      updatedFields: {},
      order: updatedOrder
    };

    // Show what was updated for reference
    if (confirmation !== undefined) {
      response.updatedFields.confirmation = {
        old: existingOrder.confirmation,
        new: updatedOrder.confirmation
      };
    }

    if (shipmentID !== undefined) {
      response.updatedFields.shipmentID = {
        old: existingOrder.shipmentID,
        new: updatedOrder.shipmentID
      };
    }

    if (labelData !== undefined) {
      response.updatedFields.labelData = {
        old: existingOrder.labelData,
        new: updatedOrder.labelData
      };
    }

    if (trackingNumber !== undefined) {
      response.updatedFields.trackingNumber = {
        old: existingOrder.trackingNumber,
        new: updatedOrder.trackingNumber
      };
    }

    return new Response(
      JSON.stringify(response),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    );

  } catch (err) {
    console.error('Error updating order:', err);
    return new Response(
      JSON.stringify({ 
        error: err.message,
        timestamp: new Date().toISOString()
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With, Accept, Origin',
        },
      }
    );
  }
}

export function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PATCH, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}
