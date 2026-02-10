
import { createClient } from '@supabase/supabase-js';

// As chaves virão do arquivo .env (que criaremos depois)
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Se as chaves existirem, cria o cliente real. Senão, retorna um objeto vazio para evitar quebra.
const supabaseInstance = supabaseUrl && supabaseKey
    ? createClient(supabaseUrl, supabaseKey)
    : null;

// Exportamos uma versão segura que não quebra se for null
export const supabase = supabaseInstance || {
    from: () => ({
        select: () => ({ order: () => Promise.resolve({ data: [], error: null }), eq: () => Promise.resolve({ data: [], error: null }) }),
        insert: () => Promise.resolve({ data: [], error: null }),
        update: () => ({ eq: () => Promise.resolve({ data: [], error: null }) }),
        delete: () => ({ eq: () => Promise.resolve({ data: [], error: null }) })
    })
};
