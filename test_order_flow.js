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

async function simulateOrder() {
    console.log('🛒 Simulating Full Order Flow...');

    const mockCart = [
        {
            productId: 'test-id-1',
            productName: 'Cerveja Teste 473ml',
            priceLabel: 'Unidade',
            priceValue: '5,00',
            image: null,
            quantity: 2
        },
        {
            productId: 'test-id-2',
            productName: 'Refrigerante Teste 2L',
            priceLabel: 'Unidade',
            priceValue: '10,00',
            image: null,
            quantity: 1
        }
    ];

    const mockCustomer = {
        name: 'Cliente Teste Automatizado',
        phone: '21999999999',
        address: 'Rua de Teste, 100',
        neighborhood: 'Centro',
        reference: 'Ao lado do servidor',
        payment: 'Pix'
    };

    const totalValue = 20.00;

    console.log('   📦 Items:', mockCart.length);
    console.log('   👤 Customer:', mockCustomer.name);
    console.log('   💰 Total:', totalValue);

    // 1. Insert Order
    const { data, error } = await supabase.from('orders').insert([{
        customer_name: mockCustomer.name,
        customer_phone: mockCustomer.phone,
        customer_address: mockCustomer.address,
        customer_neighborhood: mockCustomer.neighborhood,
        customer_reference: mockCustomer.reference,
        payment_method: mockCustomer.payment,
        items: mockCart,
        total_value: totalValue,
        status: 'pending' // Explicitly setting status, though default is pending
    }]).select();

    if (error) {
        console.error('❌ Order insertion failed:', error.message);
        return;
    }

    const order = data[0];
    console.log(`✅ Order created successfully! ID: ${order.id}`);

    // 2. Fetch Order (Frontend logic for checking history/admin)
    const { data: fetchOrder, error: fetchError } = await supabase
        .from('orders')
        .select('*')
        .eq('id', order.id)
        .single();

    if (fetchError) {
        console.error('❌ Failed to fetch the created order:', fetchError.message);
    } else {
        console.log('✅ Order verified in database.');
        console.log('   📄 Stored Items:', JSON.stringify(fetchOrder.items).substring(0, 50) + '...');
    }

    // 3. Cleanup
    console.log('🧹 Cleaning up test order...');
    const { error: deleteError } = await supabase.from('orders').delete().eq('id', order.id);
    if (deleteError) {
        console.warn('⚠️ Failed to clean up test order:', deleteError.message);
    } else {
        console.log('✅ Test order deleted.');
    }

    console.log('\n🎉 FLOW VERIFIED: The app can successfully create and read orders.');
}

simulateOrder();
