import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL, 
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {

    res.setHeader('Access-Control-Allow-Origin', "*");
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') {
        console.log('Handling CORS preflight');
        return res.status(204).end(); // Respond with no content
    }

    if (req.method !== 'POST') {
        console.log('Blocked request with method:', req.method);
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    try {
        const { storefront_id, updates } = req.body;

        if (!storefront_id || !updates) {
            console.log('Invalid request body:', req.body);
            return res.status(400).json({ error: 'storefront_id and updates are required' });
        }

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

        console.log('Storefront updated successfully:', data);

        res.setHeader('Access-Control-Allow-Origin', allowedOrigin);
        return res.status(200).json({
            message: 'Storefront updated successfully',
            storefront: data
        });

    } catch (error) {
        console.error('Unexpected error:', error);

        res.setHeader('Access-Control-Allow-Origin', allowedOrigin);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
}
