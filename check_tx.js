const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const fs = require('fs');
let serviceRoleKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
try {
  const envFile = fs.readFileSync('D:\\Antigravity Projects\\Eventzone app\\supabase\\.env', 'utf8');
  const match = envFile.match(/SUPABASE_SERVICE_ROLE_KEY=(.*)/);
  if (match) serviceRoleKey = match[1].trim();
} catch (e) {}

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, serviceRoleKey);

async function check() {
  const { data: tables, error } = await supabase
    .from('information_schema.tables')
    .select('table_name')
    .eq('table_schema', 'public');
    
  console.log('Tables:', tables);

  const { data: tx, error: e2 } = await supabase.from('transactions').select('*');
  console.log('Transactions:', tx);
}
check();
