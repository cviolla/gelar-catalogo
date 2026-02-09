
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase keys in .env.local');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkDB() {
    const { data, count, error } = await supabase
        .from('products')
        .select('*', { count: 'exact' });

    if (error) {
        console.error('Error fetching products:', error);
    } else {
        console.log(`Found ${count} products in DB.`);
        if (data.length > 0) {
            console.log('Sample product:', data[0].name, data[0].prices);
        }
    }
}

checkDB();
