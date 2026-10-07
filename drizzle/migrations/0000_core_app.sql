create type public.app_role as enum ('admin','user');
create table public.user_roles (id uuid primary key default gen_random_uuid(), user_id uuid references auth.users(id) on delete cascade not null, role app_role not null, unique(user_id, role));
grant select on public.user_roles to authenticated;
grant all on public.user_roles to service_role;
alter table public.user_roles enable row level security;
create or replace function public.has_role(_user_id uuid, _role app_role) returns boolean language sql stable security definer set search_path = public as $$ select exists (select 1 from public.user_roles where user_id=_user_id and role=_role) $$;
create policy "own roles" on public.user_roles for select to authenticated using (user_id = auth.uid() or public.has_role(auth.uid(),'admin'));

create or replace function public.assign_admin_role() returns trigger language plpgsql security definer set search_path = public as $$
begin
  if lower(new.email) = 'mateus.orezende@gmail.com' then
    insert into public.user_roles(user_id, role) values (new.id, 'admin') on conflict do nothing;
  end if;
  return new;
end $$;
create trigger on_auth_user_admin after insert on auth.users for each row execute function public.assign_admin_role();
insert into public.user_roles(user_id, role) select id, 'admin' from auth.users where lower(email)='mateus.orezende@gmail.com' on conflict do nothing;

alter table public.profiles add column if not exists email text;
create policy "Admins view all profiles" on public.profiles for select to authenticated using (public.has_role(auth.uid(),'admin'));

create table public.patients (
  id uuid primary key default gen_random_uuid(), user_id uuid not null default auth.uid(),
  name text not null, email text, phone text, cpf text, birth_date date, approach text,
  status text not null default 'Ativo', session_price numeric(10,2) not null default 0, notes text,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now());
create table public.patient_records (
  id uuid primary key default gen_random_uuid(), user_id uuid not null default auth.uid(),
  patient_id uuid not null references public.patients(id) on delete cascade,
  content text not null, created_at timestamptz not null default now());
create table public.sessions (
  id uuid primary key default gen_random_uuid(), user_id uuid not null default auth.uid(),
  patient_id uuid not null references public.patients(id) on delete cascade,
  starts_at timestamptz not null, duration_min int not null default 50,
  modality text not null default 'online', status text not null default 'Agendada',
  price numeric(10,2) not null default 0, room_code text not null default replace(gen_random_uuid()::text,'-',''),
  created_at timestamptz not null default now());
create table public.transactions (
  id uuid primary key default gen_random_uuid(), user_id uuid not null default auth.uid(),
  type text not null default 'receita', description text not null, amount numeric(10,2) not null,
  due_date date not null default current_date, status text not null default 'Pendente',
  category text, patient_id uuid references public.patients(id) on delete set null,
  session_id uuid references public.sessions(id) on delete set null,
  created_at timestamptz not null default now());
create table public.subscriptions (
  id uuid primary key default gen_random_uuid(), user_id uuid not null default auth.uid(),
  plan text not null, billing_cycle text not null default 'mensal', price numeric(10,2) not null default 0,
  status text not null default 'trial', started_at timestamptz not null default now(),
  trial_ends_at timestamptz default (now() + interval '15 days'), created_at timestamptz not null default now());

grant select, insert, update, delete on public.patients, public.patient_records, public.sessions, public.transactions, public.subscriptions to authenticated;
grant all on public.patients, public.patient_records, public.sessions, public.transactions, public.subscriptions to service_role;
alter table public.patients enable row level security;
alter table public.patient_records enable row level security;
alter table public.sessions enable row level security;
alter table public.transactions enable row level security;
alter table public.subscriptions enable row level security;

create policy "own patients" on public.patients for all to authenticated using (user_id=auth.uid()) with check (user_id=auth.uid());
create policy "own records" on public.patient_records for all to authenticated using (user_id=auth.uid()) with check (user_id=auth.uid());
create policy "own sessions" on public.sessions for all to authenticated using (user_id=auth.uid()) with check (user_id=auth.uid());
create policy "own transactions" on public.transactions for all to authenticated using (user_id=auth.uid()) with check (user_id=auth.uid());
create policy "own subs select" on public.subscriptions for select to authenticated using (user_id=auth.uid() or public.has_role(auth.uid(),'admin'));
create policy "own subs insert" on public.subscriptions for insert to authenticated with check (user_id=auth.uid());
create policy "own subs update" on public.subscriptions for update to authenticated using (user_id=auth.uid() or public.has_role(auth.uid(),'admin'));
create policy "admin subs delete" on public.subscriptions for delete to authenticated using (public.has_role(auth.uid(),'admin'));

create trigger patients_updated_at before update on public.patients for each row execute function public.touch_updated_at();

create or replace function public.handle_new_user() returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name, crp, specialty, phone, email)
  values (new.id, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'crp', new.raw_user_meta_data->>'specialty', new.raw_user_meta_data->>'phone', new.email);
  return new;
end $$;
update public.profiles p set email = u.email from auth.users u where u.id = p.id and p.email is null;