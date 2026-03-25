create table if not exists public.packages (
  id uuid not null default gen_random_uuid (),
  gym_id uuid not null references public.gyms (id) on delete cascade,
  name text not null,
  description text null,
  price_per_day numeric null,
  price_per_week numeric null,
  price_per_month numeric null,
  includes_accommodation boolean default false,
  accommodation_name text null,
  includes_meals boolean default false,
  sport text default 'Muay Thai',
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  constraint packages_pkey primary key (id)
);

-- Add package_id to bookings
alter table public.bookings 
add column package_id uuid references public.packages (id);

-- Enable RLS on packages
alter table public.packages enable row level security;

-- Policies for packages
create policy "Packages are viewable by everyone" 
on public.packages for select 
using ( true );

create policy "Users can manage packages for their own gyms" 
on public.packages for all 
using ( 
  auth.uid() in (
    select owner_id from public.gyms where id = packages.gym_id
  )
);
