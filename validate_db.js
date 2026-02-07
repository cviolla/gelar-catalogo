import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env manually
const envPath = path.resolve(process.cwd(), '.env');
const envContent = fs.readFileSync(envPath, 'utf-8');
const envVars = envContent.split('\n').reduce((acc, line) => {
    const [key, value] = line.split('=');
    if (key && value) acc[key.trim()] = value.trim();
    return acc;
}, {});

const supabaseUrl = envVars.VITE_SUPABASE_URL;
const supabaseKey = envVars.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing Supabase credentials in .env');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function validateOrders() {
    console.log('\n🔍 Validating Orders Table...');

    // Check if table exists by selecting 1 row
    const { data, error } = await supabase.from('orders').select('*').limit(1);

    if (error) {
        if (error.code === '42P01') { // relation "public.orders" does not exist
            console.error('❌ Table "orders" DOES NOT exist.');
            console.log('   👉 ACTION REQUIRED: Run the SQL in "orders_schema.sql" in your Supabase Dashboard SQL Editor.');
        } else {
            console.error('❌ Error assessing "orders" table:', error.message);
        }
        return false;
    }

    console.log('✅ Table "orders" exists.');

    // Try to insert a dummy order
    const dummyOrder = {
        customer_name: 'Test Validation',
        customer_phone: '99999999999',
        customer_address: 'Rua Teste',
        customer_neighborhood: 'Bairro Teste',
        payment_method: 'Pix',
        items: [],
        total_value: 0
    };

    const { data: insertData, error: insertError } = await supabase
        .from('orders')
        .insert([dummyOrder])
        .select();

    if (insertError) {
        console.error('❌ Failed to insert test order:', insertError.message);
        console.log('   👉 ACTION REQUIRED: Check your RLS policies in "orders_schema.sql".');
        return false;
    }

    console.log('✅ Insert permission (RLS) works.');

    // Clean up test order
    if (insertData && insertData[0]) {
        const { error: deleteError } = await supabase
            .from('orders')
            .delete()
            .eq('id', insertData[0].id);

        if (deleteError) {
            console.warn('⚠️ Could not delete test order (Expected behavior: Public should not delete orders).');
            // This is actually good for production, but means we leave a test row. 
            // We can accept this or maybe the user should clear it manually.
        } else {
            console.log('✅ Delete permission works (Test order cleaned up).');
        }
    }

    return true;
}

async function validateCategories() {
    console.log('\n🔍 Validating Product Categories...');

    // Check for "Latão 473ml"
    const { count: lataoCount, error: lataoError } = await supabase
        .from('products')
        .select('*', { count: 'exact', head: true })
        .eq('category', 'Latão 473ml');

    if (lataoError) {
        console.error('❌ Error checking categories:', lataoError.message);
        return;
    }

    if (lataoCount > 0) {
        console.warn(`⚠️ Found ${lataoCount} products with category "Latão 473ml" that need migration.`);
        console.log('   👉 ACTION REQUIRED: Run the "Migrar Categorias" tool in the running App footer.');
    } else {
        console.log('✅ No "Latão 473ml" category found.');
    }

    // Check for "Long Neck / Latão"
    const { count: mixedCount, error: mixedError } = await supabase
        .from('products')
        .select('*', { count: 'exact', head: true })
        .eq('category', 'Long Neck / Latão');

    if (mixedError) {
        console.error('❌ Error checking mixed categories:', mixedError.message);
        return;
    }

    if (mixedCount > 0) {
        console.warn(`⚠️ Found ${mixedCount} products with category "Long Neck / Latão" that need migration.`);
        console.log('   👉 ACTION REQUIRED: Run the "Migrar Categorias" tool in the running App footer.');
    } else {
        console.log('✅ No "Long Neck / Latão" category found (Migration looks complete!).');
    }
}

async function run() {
    await validateOrders();
    await validateCategories();
}

run();
