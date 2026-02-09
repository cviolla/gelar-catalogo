
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = "https://pdxfwssrayevvhtfbgco.supabase.co";
const supabaseKey = "sb_publishable_V_A898Qo4GqrhTCsKCMRKg_gaGUf9eh";

const supabase = createClient(supabaseUrl, supabaseKey);

async function searchInDB() {
    const { data, error } = await supabase
        .from('products')
        .select('*');

    if (error) {
        console.error('Error:', error);
        return;
    }

    const matches = data.filter(p => JSON.stringify(p).includes('Clique'));
    if (matches.length > 0) {
        console.log('Found matches in DB:', matches.length);
        matches.forEach(m => console.log(m.name, m.id));
    } else {
        console.log('No matches in DB.');
    }
}

searchInDB();
