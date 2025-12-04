import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Load env vars manually
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.join(__dirname, '../.env.local');

let supabaseUrl, supabaseKey;

try {
    const envContent = fs.readFileSync(envPath, 'utf8');
    envContent.split('\n').forEach(line => {
        const [key, value] = line.split('=');
        if (key && value) {
            if (key.trim() === 'VITE_SUPABASE_URL') supabaseUrl = value.trim();
            if (key.trim() === 'VITE_SUPABASE_ANON_KEY') supabaseKey = value.trim();
        }
    });
} catch (e) {
    console.error('Error reading .env.local:', e.message);
}

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing environment variables in .env.local!');
    process.exit(1);
}

console.log(`Checking Supabase at: ${supabaseUrl}`);

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkTables() {
    const tables = ['algorithms', 'folders', 'user_progress', 'app_settings'];

    for (const table of tables) {
        const { data, error } = await supabase.from(table).select('count', { count: 'exact', head: true });

        if (error) {
            console.error(`❌ Table '${table}': ERROR - ${error.message} (${error.code})`);
        } else {
            console.log(`✅ Table '${table}': EXISTS (Count: ${data?.length ?? 'N/A'})`); // head:true returns null data usually, but no error means table exists
        }
    }
}

checkTables();
