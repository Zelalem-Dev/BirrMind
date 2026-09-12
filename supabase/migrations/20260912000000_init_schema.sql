-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- USERS
create table public.users (
  id uuid references auth.users not null primary key,
  email text unique not null,
  full_name text not null,
  avatar_url text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);
alter table public.users enable row level security;
create policy "Users can view own profile" on public.users for select using (auth.uid() = id);
create policy "Users can update own profile" on public.users for update using (auth.uid() = id);

-- BUSINESSES
create table public.businesses (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  slug text unique not null,
  type text not null,
  currency text not null default 'USD',
  currency_symbol text not null default '$',
  target_daily_revenue numeric not null default 0,
  operating_hours text not null default '09:00-17:00',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);
alter table public.businesses enable row level security;
create policy "Users can view accessible businesses" on public.businesses for select using (
  exists (
    select 1 from public.business_memberships bm
    where bm.business_id = id and bm.user_id = auth.uid()
  )
);
create policy "Owners can update business" on public.businesses for update using (
  exists (
    select 1 from public.business_memberships bm
    where bm.business_id = id and bm.user_id = auth.uid() and bm.role = 'owner'
  )
);

-- MEMBERSHIPS
create table public.business_memberships (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.users(id) not null,
  business_id uuid references public.businesses(id) not null,
  role text not null check (role in ('owner', 'manager', 'staff')),
  joined_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(user_id, business_id)
);
alter table public.business_memberships enable row level security;
create policy "Users can view memberships of their businesses" on public.business_memberships for select using (
  exists (
    select 1 from public.business_memberships my_bm
    where my_bm.business_id = business_id and my_bm.user_id = auth.uid()
  )
);

-- PRODUCTS
create table public.products (
  id uuid default uuid_generate_v4() primary key,
  business_id uuid references public.businesses(id) not null,
  name text not null,
  sku text,
  category text not null,
  cost_price numeric not null default 0,
  selling_price numeric not null default 0,
  current_stock numeric not null default 0,
  reorder_point numeric not null default 0,
  reorder_quantity numeric not null default 0,
  unit text not null default 'item',
  supplier text,
  is_active boolean not null default true,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);
alter table public.products enable row level security;
create policy "Tenant isolation for products" on public.products for all using (
  exists (select 1 from public.business_memberships bm where bm.business_id = products.business_id and bm.user_id = auth.uid())
);

-- TRANSACTIONS
create table public.transactions (
  id uuid default uuid_generate_v4() primary key,
  business_id uuid references public.businesses(id) not null,
  actor_user_id uuid references public.users(id),
  actor_name text,
  type text not null check (type in ('sale', 'refund')),
  items jsonb not null default '[]'::jsonb,
  subtotal numeric not null default 0,
  tax numeric not null default 0,
  total_amount numeric not null default 0,
  payment_method text not null,
  status text not null,
  notes text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);
alter table public.transactions enable row level security;
create policy "Tenant isolation for transactions" on public.transactions for all using (
  exists (select 1 from public.business_memberships bm where bm.business_id = transactions.business_id and bm.user_id = auth.uid())
);

-- INVENTORY MOVEMENTS
create table public.inventory_movements (
  id uuid default uuid_generate_v4() primary key,
  business_id uuid references public.businesses(id) not null,
  product_id uuid references public.products(id) not null,
  product_name text,
  type text not null,
  quantity_delta numeric not null,
  resulting_stock numeric not null,
  reference_type text not null,
  reference_id uuid,
  reason text,
  actor_user_id uuid references public.users(id),
  actor_name text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);
alter table public.inventory_movements enable row level security;
create policy "Tenant isolation for movements" on public.inventory_movements for all using (
  exists (select 1 from public.business_memberships bm where bm.business_id = inventory_movements.business_id and bm.user_id = auth.uid())
);

-- EXPENSES
create table public.expenses (
  id uuid default uuid_generate_v4() primary key,
  business_id uuid references public.businesses(id) not null,
  actor_user_id uuid references public.users(id),
  actor_name text,
  category text not null,
  amount numeric not null,
  vendor text not null,
  description text not null,
  receipt_url text,
  payment_method text not null,
  status text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);
alter table public.expenses enable row level security;
create policy "Tenant isolation for expenses" on public.expenses for all using (
  exists (select 1 from public.business_memberships bm where bm.business_id = expenses.business_id and bm.user_id = auth.uid())
);

-- BUSINESS EVENTS
create table public.business_events (
  id uuid default uuid_generate_v4() primary key,
  business_id uuid references public.businesses(id) not null,
  actor_user_id uuid references public.users(id),
  actor_name text,
  type text not null,
  title text not null,
  detail text not null,
  metadata jsonb,
  severity text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);
alter table public.business_events enable row level security;
create policy "Tenant isolation for events" on public.business_events for all using (
  exists (select 1 from public.business_memberships bm where bm.business_id = business_events.business_id and bm.user_id = auth.uid())
);

-- BUSINESS MEMORIES
create table public.business_memories (
  id uuid default uuid_generate_v4() primary key,
  business_id uuid references public.businesses(id) not null,
  fact text not null,
  type text not null,
  confidence numeric not null,
  source text not null,
  status text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  last_referenced_at timestamp with time zone default timezone('utc'::text, now()) not null
);
alter table public.business_memories enable row level security;
create policy "Tenant isolation for memories" on public.business_memories for all using (
  exists (select 1 from public.business_memberships bm where bm.business_id = business_memories.business_id and bm.user_id = auth.uid())
);

-- AI RECOMMENDATIONS
create table public.ai_recommendations (
  id uuid default uuid_generate_v4() primary key,
  business_id uuid references public.businesses(id) not null,
  type text not null,
  title text not null,
  explanation text not null,
  confidence numeric,
  priority text not null,
  recommended_action text not null,
  action_type text not null,
  action_payload jsonb,
  evidence jsonb not null default '[]'::jsonb,
  requires_confirmation boolean default true,
  status text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  confirmed_by_user_id uuid references public.users(id),
  confirmed_at timestamp with time zone
);
alter table public.ai_recommendations enable row level security;
create policy "Tenant isolation for recommendations" on public.ai_recommendations for all using (
  exists (select 1 from public.business_memberships bm where bm.business_id = ai_recommendations.business_id and bm.user_id = auth.uid())
);

-- Function to handle user registration trigger
create or replace function public.handle_new_user() 
returns trigger as $$
begin
  insert into public.users (id, email, full_name, avatar_url)
  values (new.id, new.email, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'avatar_url');
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
