import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Origin', '*'); // Change '*' to your Webflow domain if needed
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    // Handle preflight OPTIONS request
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    try {
        const { storefront_id, updates } = req.body;

        if (!storefront_id || !updates) {
            return res.status(400).json({ error: 'storefront_id and updates are required' });
        }

        // Update the storefront row in Supabase
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

        return res.status(200).json({ message: 'Storefront updated successfully', storefront: data });
    } catch (error) {
        console.error('Unexpected error:', error);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
}
