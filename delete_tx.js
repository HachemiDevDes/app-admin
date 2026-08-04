const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function del() {
  const { data, error } = await supabase.from('subscription_transactions').delete().in('amount_dzd', [1500, 7000]);
  console.log('Deleted fake txs', data, error);
}

del();
