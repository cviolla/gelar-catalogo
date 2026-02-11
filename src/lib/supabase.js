
import { createClient } from '@supabase/supabase-js';

// As chaves virão do arquivo .env (que criaremos depois)
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Se as chaves existirem, cria o cliente real. Senão, retorna null.
export const supabase = supabaseUrl && supabaseKey
    ? createClient(supabaseUrl, supabaseKey)
    : null;
