import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabase = createClient(
    process.env.PUBLIC_SUPABASE_URL, 
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
    // Enable CORS for Webflow
    res.setHeader('Access-Control-Allow-Origin', 'https://pss-5215cc.webflow.io'); // Replace '*' with your Webflow URL
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    // Handle preflight OPTIONS request
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    // Only allow POST requests
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    try {
        const { storefront_id, updates } = req.body;

        // Validate request body
        if (!storefront_id || !updates) {
            return res.status(400).json({ error: 'storefront_id and updates are required' });
        }

        // Update the storefront in Supabase
        const { data, error } = await supabase
            .from('storefront')
            .update(updates)
            .eq('id', storefront_id)
            .select()
            .single();

        if (error) {
            console.error('Error updating storefront:', error);
            return res.status(500).json({ error: error.message });
        }

        // Return success response with CORS headers
        res.setHeader('Access-Control-Allow-Origin', 'https://pss-5215cc.webflow.io'); // Ensure this is present in the response
        return res.status(200).json({
            message: 'Storefront updated successfully',
            storefront: data
        });

    } catch (error) {
        console.error('Unexpected error:', error);
        res.setHeader('Access-Control-Allow-Origin', 'https://pss-5215cc.webflow.io'); // Ensure CORS is included in error responses
        return res.status(500).json({ error: 'Internal Server Error' });
    }
}
