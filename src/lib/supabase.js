
import { createClient } from '@supabase/supabase-js';

// As chaves virão do arquivo .env
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Se as chaves existirem e parecerem válidas, cria o cliente real.
let client = null;

try {
    if (supabaseUrl && supabaseKey && supabaseKey.length > 20 && !supabaseKey.startsWith('sb_publishable')) {
        client = createClient(supabaseUrl, supabaseKey);
    } else {
        console.warn('Supabase keys missing or invalid. Key:', supabaseKey);
    }
} catch (error) {
    console.error('Failed to initialize Supabase client:', error);
    client = null;
}

export const supabase = client;
