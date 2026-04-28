-- Digital Heroes Supabase Schema

-- Set up custom enum types
CREATE TYPE user_role AS ENUM ('user', 'admin');
CREATE TYPE subscription_status AS ENUM ('inactive', 'active', 'lapsed', 'cancelled');
CREATE TYPE match_type AS ENUM ('3-match', '4-match', '5-match');
CREATE TYPE payout_status AS ENUM ('pending', 'paid');
CREATE TYPE draw_status AS ENUM ('simulated', 'published');

-- 1. Charities Table
CREATE TABLE charities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    image_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- 2. Users Table (extends Supabase Auth)
CREATE TABLE users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    role user_role DEFAULT 'user',
    subscription_status subscription_status DEFAULT 'inactive',
    stripe_customer_id TEXT,
    charity_id UUID REFERENCES charities(id) ON DELETE SET NULL,
    charity_percentage NUMERIC DEFAULT 10 CHECK (charity_percentage >= 10 AND charity_percentage <= 100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- 3. Scores Table
-- Ensures only 5 scores per user are kept. This will be enforced via logic or a trigger.
CREATE TABLE scores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    score INTEGER NOT NULL CHECK (score >= 1 AND score <= 45),
    date DATE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    UNIQUE(user_id, date) -- Only one score entry permitted per date per user
);

-- 4. Draws Table
CREATE TABLE draws (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    month TEXT NOT NULL, -- e.g., '2026-04'
    winning_numbers INTEGER[] NOT NULL,
    status draw_status DEFAULT 'simulated',
    prize_pool NUMERIC DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    published_at TIMESTAMP WITH TIME ZONE,
    UNIQUE(month)
);

-- 5. Winnings Table
CREATE TABLE winnings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    draw_id UUID REFERENCES draws(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    match_type match_type NOT NULL,
    amount NUMERIC NOT NULL,
    status payout_status DEFAULT 'pending',
    proof_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- --- ROW LEVEL SECURITY (RLS) ---
ALTER TABLE charities ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE draws ENABLE ROW LEVEL SECURITY;
ALTER TABLE winnings ENABLE ROW LEVEL SECURITY;

-- Helper function to check admin role without triggering RLS recursion
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Charities Policies
CREATE POLICY "Charities are viewable by everyone." ON charities FOR SELECT USING (true);
CREATE POLICY "Charities are editable by admins." ON charities FOR ALL USING (public.is_admin());

-- Users Policies
CREATE POLICY "Users can view their own profile." ON users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update their own profile." ON users FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Admins can view and edit all users." ON users FOR ALL USING (public.is_admin());

-- Scores Policies
CREATE POLICY "Users can view and insert their own scores." ON scores FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own scores." ON scores FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own scores." ON scores FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own scores." ON scores FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "Admins can manage all scores." ON scores FOR ALL USING (public.is_admin());

-- Draws Policies
CREATE POLICY "Published draws are viewable by everyone." ON draws FOR SELECT USING (status = 'published');
CREATE POLICY "Admins can manage all draws." ON draws FOR ALL USING (public.is_admin());

-- Winnings Policies
CREATE POLICY "Users can view their own winnings." ON winnings FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update their proof." ON winnings FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Admins can manage all winnings." ON winnings FOR ALL USING (public.is_admin());

-- Trigger to create a user profile when they sign up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email)
  VALUES (new.id, new.email);
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- --- GRANT PERMISSIONS TO API ROLES ---
GRANT ALL ON TABLE public.users TO authenticated, anon;
GRANT ALL ON TABLE public.charities TO authenticated, anon;
GRANT ALL ON TABLE public.scores TO authenticated, anon;
GRANT ALL ON TABLE public.draws TO authenticated, anon;
GRANT ALL ON TABLE public.winnings TO authenticated, anon;
