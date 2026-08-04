-- 1. Create subscriptions table
CREATE TABLE IF NOT EXISTS public.subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    tier TEXT NOT NULL CHECK (tier IN ('Free', 'Pro', 'Business')),
    status TEXT NOT NULL CHECK (status IN ('Active', 'Expired', 'Cancelled')),
    start_date TIMESTAMPTZ NOT NULL DEFAULT now(),
    end_date TIMESTAMPTZ,
    interval TEXT NOT NULL CHECK (interval IN ('Monthly', 'Yearly', 'Lifetime')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Create subscription_transactions table
CREATE TABLE IF NOT EXISTS public.subscription_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    subscription_id UUID NOT NULL REFERENCES public.subscriptions(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    amount_dzd NUMERIC NOT NULL,
    transaction_date TIMESTAMPTZ NOT NULL DEFAULT now(),
    payment_method TEXT,
    status TEXT NOT NULL CHECK (status IN ('Success', 'Failed', 'Pending', 'Refunded'))
);

-- 3. Create app_config table
CREATE TABLE IF NOT EXISTS public.app_config (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Insert default app config values
INSERT INTO public.app_config (key, value) VALUES 
('maintenance_mode', 'false'),
('free_tier_limit', '15'),
('admin_emails', '[]')
ON CONFLICT (key) DO NOTHING;

-- 4. Create support_messages table (if not exists)
CREATE TABLE IF NOT EXISTS public.support_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    subject TEXT NOT NULL,
    message TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'Open' CHECK (status IN ('Open', 'Resolved')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 5. Create notification_history table
CREATE TABLE IF NOT EXISTS public.notification_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    target TEXT NOT NULL CHECK (target IN ('All Users', 'Free Users', 'Paid Users', 'Specific User')),
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    sent_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    sent_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Optional: Add RLS Policies to allow admin access
-- We assume Admin access will be handled via server-side service role or specific RLS policies.
-- For now, we enable RLS and add a blanket policy for testing if needed, or leave RLS disabled.
-- To keep it simple and ensure the dashboard works, we will let you manage RLS in Supabase UI.
