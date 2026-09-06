-- ==============================================================================
-- Schema Supabase: Gestiune Program de Lucru (creareOrar)
-- ==============================================================================

-- 1. Tabel angajați
create table if not exists employees (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  first_name text not null,
  last_name text not null,
  role text,
  email text,
  phone text,
  created_at timestamp with time zone default now()
);

-- 2. Tabel ture / orar
create table if not exists shifts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  employee_id uuid references employees(id) on delete cascade not null,
  day_of_week int not null check (day_of_week between 0 and 6), -- 0=Luni ... 6=Duminică
  shift_date date default current_date,
  start_time time not null,
  end_time time not null,
  shift_type text default 'custom' check (shift_type in ('morning', 'afternoon', 'night', 'custom')),
  created_at timestamp with time zone default now()
);

-- 3. Tabel ore lipsă și recuperări
create table if not exists missing_hours (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  employee_id uuid references employees(id) on delete cascade not null,
  date date not null default current_date,
  hours_missed numeric(5,2) not null check (hours_missed > 0),
  hours_recovered numeric(5,2) default 0 check (hours_recovered >= 0),
  reason text, -- ex: 'Învoire personală', 'Control medical', 'Întârziere', 'Urgență familie'
  status text default 'pending' check (status in ('pending', 'partial', 'recovered')),
  notes text,
  created_at timestamp with time zone default now()
);

-- 4. Creare indexuri pentru performanță
create index if not exists idx_employees_user_id on employees(user_id);
create index if not exists idx_shifts_user_id on shifts(user_id);
create index if not exists idx_shifts_employee_id on shifts(employee_id);
create index if not exists idx_shifts_day_of_week on shifts(day_of_week);
create index if not exists idx_missing_hours_user_id on missing_hours(user_id);
create index if not exists idx_missing_hours_employee_id on missing_hours(employee_id);
create index if not exists idx_missing_hours_status on missing_hours(status);

-- 5. Activare Row Level Security (RLS)
alter table employees enable row level security;
alter table shifts enable row level security;
alter table missing_hours enable row level security;

-- 6. Politici RLS pentru employees (user_id = auth.uid())
drop policy if exists "Utilizatorii pot vizualiza proprii angajați" on employees;
create policy "Utilizatorii pot vizualiza proprii angajați"
  on employees for select using (auth.uid() = user_id);

drop policy if exists "Utilizatorii pot adăuga proprii angajați" on employees;
create policy "Utilizatorii pot adăuga proprii angajați"
  on employees for insert with check (auth.uid() = user_id);

drop policy if exists "Utilizatorii pot actualiza proprii angajați" on employees;
create policy "Utilizatorii pot actualiza proprii angajați"
  on employees for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "Utilizatorii pot șterge proprii angajați" on employees;
create policy "Utilizatorii pot șterge proprii angajați"
  on employees for delete using (auth.uid() = user_id);

-- 7. Politici RLS pentru shifts (user_id = auth.uid())
drop policy if exists "Utilizatorii pot vizualiza propriile ture" on shifts;
create policy "Utilizatorii pot vizualiza propriile ture"
  on shifts for select using (auth.uid() = user_id);

drop policy if exists "Utilizatorii pot adăuga ture pentru proprii angajați" on shifts;
create policy "Utilizatorii pot adăuga ture pentru proprii angajați"
  on shifts for insert with check (auth.uid() = user_id);

drop policy if exists "Utilizatorii pot actualiza propriile ture" on shifts;
create policy "Utilizatorii pot actualiza propriile ture"
  on shifts for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "Utilizatorii pot șterge propriile ture" on shifts;
create policy "Utilizatorii pot șterge propriile ture"
  on shifts for delete using (auth.uid() = user_id);

-- 8. Politici RLS pentru missing_hours (user_id = auth.uid())
drop policy if exists "Utilizatorii pot vizualiza propriile ore lipsă" on missing_hours;
create policy "Utilizatorii pot vizualiza propriile ore lipsă"
  on missing_hours for select using (auth.uid() = user_id);

drop policy if exists "Utilizatorii pot adăuga ore lipsă" on missing_hours;
create policy "Utilizatorii pot adăuga ore lipsă"
  on missing_hours for insert with check (auth.uid() = user_id);

drop policy if exists "Utilizatorii pot actualiza ore lipsă" on missing_hours;
create policy "Utilizatorii pot actualiza ore lipsă"
  on missing_hours for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "Utilizatorii pot șterge ore lipsă" on missing_hours;
create policy "Utilizatorii pot șterge ore lipsă"
  on missing_hours for delete using (auth.uid() = user_id);

-- 9. Tabel șabloane de ture personalizate (shift_templates)
create table if not exists shift_templates (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  start_time time not null,
  end_time time not null,
  color text default 'purple',
  created_at timestamp with time zone default now()
);

create index if not exists idx_shift_templates_user_id on shift_templates(user_id);
alter table shift_templates enable row level security;

drop policy if exists "Utilizatorii pot gestiona propriile șabloane" on shift_templates;
create policy "Utilizatorii pot gestiona propriile șabloane"
  on shift_templates for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- 10. Actualizări de migrare pentru baze de date existente:
-- Adăugare coloană shift_date dacă lipsește:
alter table shifts add column if not exists shift_date date default current_date;
create index if not exists idx_shifts_shift_date on shifts(shift_date);

-- Eliminare restricție fixă pe tipul de tură pentru a permite orice denumire de tură personalizată:
alter table shifts drop constraint if exists shifts_shift_type_check;

-- 11. Tabel evidență ore suplimentare (overtime_records)
create table if not exists overtime_records (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  employee_id uuid references employees(id) on delete cascade not null,
  date date not null default current_date,
  hours_count numeric(5,2) not null check (hours_count > 0),
  start_time time,
  end_time time,
  reason text,
  status text default 'inregistrat', -- 'inregistrat', 'platit', 'compensat'
  notes text,
  created_at timestamp with time zone default now()
);

create index if not exists idx_overtime_records_user_id on overtime_records(user_id);
create index if not exists idx_overtime_records_emp_id on overtime_records(employee_id);
create index if not exists idx_overtime_records_date on overtime_records(date);
alter table overtime_records enable row level security;

drop policy if exists "Utilizatorii pot gestiona propriile ore suplimentare" on overtime_records;
create policy "Utilizatorii pot gestiona propriile ore suplimentare"
  on overtime_records for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

