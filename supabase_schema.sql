-- Create profiles table (links to Supabase auth.users)
create table
  public.profiles (
    id uuid not null references auth.users on delete cascade,
    name text null,
    email text null,
    avatar_url text null,
    created_at timestamp with time zone not null default now(),
    constraint profiles_pkey primary key (id)
  );

-- Create groups table
create table
  public.groups (
    id uuid not null default gen_random_uuid (),
    name text not null,
    description text null,
    created_by uuid not null references public.profiles (id) on delete cascade,
    created_at timestamp with time zone not null default now(),
    constraint groups_pkey primary key (id)
  );

-- Create group_members table
create table
  public.group_members (
    group_id uuid not null references public.groups (id) on delete cascade,
    user_id uuid not null references public.profiles (id) on delete cascade,
    role text not null default 'member'::text,
    joined_at timestamp with time zone not null default now(),
    constraint group_members_pkey primary key (group_id, user_id)
  );

-- Create trips table
create table
  public.trips (
    id uuid not null default gen_random_uuid (),
    group_id uuid null references public.groups (id) on delete cascade, -- Optional, trips can be group-less initially
    title text not null,
    destination text null,
    start_date date null,
    end_date date null,
    created_by uuid not null references public.profiles (id) on delete cascade,
    created_at timestamp with time zone not null default now(),
    constraint trips_pkey primary key (id)
  );

-- Create trip_members table
create table
  public.trip_members (
    trip_id uuid not null references public.trips (id) on delete cascade,
    user_id uuid not null references public.profiles (id) on delete cascade,
    role text not null default 'traveler'::text,
    joined_at timestamp with time zone not null default now(),
    constraint trip_members_pkey primary key (trip_id, user_id)
  );

-- Create documents table
create table
  public.documents (
    id uuid not null default gen_random_uuid (),
    trip_id uuid not null references public.trips (id) on delete cascade,
    uploaded_by uuid not null references public.profiles (id) on delete cascade,
    name text not null,
    file_url text not null,
    file_type text not null, -- 'flight', 'hotel', 'other'
    created_at timestamp with time zone not null default now(),
    constraint documents_pkey primary key (id)
  );

-- Create itinerary_items table
create table
  public.itinerary_items (
    id uuid not null default gen_random_uuid (),
    trip_id uuid not null references public.trips (id) on delete cascade,
    day_date date not null,
    title text not null,
    description text null,
    start_time time without time zone null,
    location text null,
    created_by uuid not null references public.profiles (id) on delete cascade,
    created_at timestamp with time zone not null default now(),
    constraint itinerary_items_pkey primary key (id)
  );

-- Create expenses table
create table
  public.expenses (
    id uuid not null default gen_random_uuid (),
    trip_id uuid not null references public.trips (id) on delete cascade,
    paid_by uuid not null references public.profiles (id) on delete cascade,
    amount numeric(10, 2) not null,
    currency text not null default 'USD'::text,
    description text not null,
    category text null,
    expense_date date not null default current_date,
    created_at timestamp with time zone not null default now(),
    constraint expenses_pkey primary key (id)
  );

-- Create expense_splits table
create table
  public.expense_splits (
    id uuid not null default gen_random_uuid (),
    expense_id uuid not null references public.expenses (id) on delete cascade,
    user_id uuid not null references public.profiles (id) on delete cascade,
    amount_owed numeric(10, 2) not null,
    is_settled boolean not null default false,
    constraint expense_splits_pkey primary key (id)
  );

-- Create Storage Bucket for Documents
insert into storage.buckets (id, name, public) 
values ('trip_documents', 'trip_documents', true)
on conflict do nothing;

-------------------------------------------------------------------------------
-- Row Level Security (RLS) Policies
-------------------------------------------------------------------------------

-- Enable RLS on all tables
alter table public.profiles enable row level security;
alter table public.groups enable row level security;
alter table public.group_members enable row level security;
alter table public.trips enable row level security;
alter table public.trip_members enable row level security;
alter table public.documents enable row level security;
alter table public.itinerary_items enable row level security;
alter table public.expenses enable row level security;
alter table public.expense_splits enable row level security;

-- Profiles: Users can view all profiles, but only update their own
create policy "Profiles are viewable by everyone." on public.profiles for select using (true);
create policy "Users can insert their own profile." on public.profiles for insert with check (auth.uid() = id);
create policy "Users can update own profile." on public.profiles for update using (auth.uid() = id);

-- Trigger to automatically create a profile when a new user signs up
create function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, email, name, avatar_url)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'avatar_url'
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Groups & Members: Users can see groups they are members of
create policy "Users can view groups they belong to" on public.groups for select
using (exists (select 1 from public.group_members where group_members.group_id = groups.id and group_members.user_id = auth.uid()));

create policy "Users can insert groups" on public.groups for insert 
with check (auth.uid() = created_by);

-- Automatically add the creator to group_members when a group is created
create function public.handle_new_group()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.group_members (group_id, user_id, role)
  values (new.id, new.created_by, 'admin');
  return new;
end;
$$;

create trigger on_group_created
  after insert on public.groups
  for each row execute procedure public.handle_new_group();

create policy "Users can view group members for their groups" on public.group_members for select
using (exists (select 1 from public.group_members as gm where gm.group_id = group_members.group_id and gm.user_id = auth.uid()));

-- Trips & Members (Similar logic: see trips if you are a trip member)
create policy "Users can view trips they belong to" on public.trips for select
using (exists (select 1 from public.trip_members where trip_members.trip_id = trips.id and trip_members.user_id = auth.uid()));

create policy "Users can insert trips" on public.trips for insert 
with check (auth.uid() = created_by);

create function public.handle_new_trip()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.trip_members (trip_id, user_id, role)
  values (new.id, new.created_by, 'admin');
  return new;
end;
$$;

create trigger on_trip_created
  after insert on public.trips
  for each row execute procedure public.handle_new_trip();

create policy "Users can view trip members" on public.trip_members for select
using (exists (select 1 from public.trip_members as tm where tm.trip_id = trip_members.trip_id and tm.user_id = auth.uid()));

-- Itinerary, Documents, Expenses: View/edit if part of the trip
create policy "Trip members can view/edit itinerary" on public.itinerary_items for all
using (exists (select 1 from public.trip_members where trip_members.trip_id = itinerary_items.trip_id and trip_members.user_id = auth.uid()));

create policy "Trip members can view/edit documents" on public.documents for all
using (exists (select 1 from public.trip_members where trip_members.trip_id = documents.trip_id and trip_members.user_id = auth.uid()));

create policy "Trip members can view/edit expenses" on public.expenses for all
using (exists (select 1 from public.trip_members where trip_members.trip_id = expenses.trip_id and trip_members.user_id = auth.uid()));

create policy "Trip members can view/edit splits" on public.expense_splits for all
using (exists (
  select 1 from public.expenses e
  join public.trip_members tm on tm.trip_id = e.trip_id
  where e.id = expense_splits.expense_id and tm.user_id = auth.uid()
));

-- Storage Bucket Policies
create policy "Authenticated users can upload documents" on storage.objects for insert
with check (bucket_id = 'trip_documents' and auth.role() = 'authenticated');

create policy "Users can view any document" on storage.objects for select
using (bucket_id = 'trip_documents');
