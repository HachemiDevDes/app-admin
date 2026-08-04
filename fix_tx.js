const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function fixTransactions() {
  const { data: subscriptions } = await supabase.from('subscriptions').select('*');
  
  if (!subscriptions) return;
  
  for (const sub of subscriptions) {
    // check if tx exists
    const { data: existing } = await supabase.from('subscription_transactions').select('*').eq('subscription_id', sub.id);
    
    if (!existing || existing.length === 0) {
      let amount = 1500;
      if (sub.tier === 'Pro') amount = 1500;
      if (sub.tier === 'Premium') amount = 7000;
      if (sub.tier === 'Business') amount = 12000;
      
      const { error } = await supabase.from('subscription_transactions').insert({
        subscription_id: sub.id,
        user_id: sub.user_id,
        amount_dzd: amount,
        transaction_date: sub.created_at,
        payment_method: 'Chargily',
        status: 'Success'
      });
      console.log('Inserted tx for sub:', sub.id, error || 'Success');
    }
  }
}

fixTransactions();
