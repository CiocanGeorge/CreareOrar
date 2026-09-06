import React, { useState } from 'react';
import Modal from './Modal';
import { isSupabaseConfigured, supabaseUrl, supabaseAnonKey, saveSupabaseConfig, resetSupabaseConfig } from '../../lib/supabase';
import { Database, CheckCircle2, Copy, Check, ExternalLink, Key, ShieldCheck } from 'lucide-react';

const SQL_SCHEMA = `-- 1. Creare tabel angajați
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

-- 2. Creare tabel ture / orar
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

-- Dacă tabelul shifts a fost creat anterior, adaugă coloana shift_date:
alter table shifts add column if not exists shift_date date default current_date;
create index if not exists idx_shifts_shift_date on shifts(shift_date);

-- 3. Creare tabel ore lipsă și recuperări
create table if not exists missing_hours (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  employee_id uuid references employees(id) on delete cascade not null,
  date date not null default current_date,
  hours_missed numeric(5,2) not null check (hours_missed > 0),
  hours_recovered numeric(5,2) default 0 check (hours_recovered >= 0),
  reason text,
  status text default 'pending' check (status in ('pending', 'partial', 'recovered')),
  notes text,
  created_at timestamp with time zone default now()
);

-- 4. Activare Row Level Security (RLS)
alter table employees enable row level security;
alter table shifts enable row level security;
alter table missing_hours enable row level security;

-- 5. Politici RLS: Fiecare utilizator are acces doar la propriile date
create policy "Utilizatorii pot vizualiza proprii angajați" on employees for select using (auth.uid() = user_id);
create policy "Utilizatorii pot adăuga proprii angajați" on employees for insert with check (auth.uid() = user_id);
create policy "Utilizatorii pot actualiza proprii angajați" on employees for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Utilizatorii pot șterge proprii angajați" on employees for delete using (auth.uid() = user_id);

create policy "Utilizatorii pot vizualiza propriile ture" on shifts for select using (auth.uid() = user_id);
create policy "Utilizatorii pot adăuga ture pentru proprii angajați" on shifts for insert with check (auth.uid() = user_id);
create policy "Utilizatorii pot actualiza propriile ture" on shifts for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Utilizatorii pot șterge propriile ture" on shifts for delete using (auth.uid() = user_id);

create policy "Utilizatorii pot vizualiza propriile ore lipsă" on missing_hours for select using (auth.uid() = user_id);
create policy "Utilizatorii pot adăuga ore lipsă" on missing_hours for insert with check (auth.uid() = user_id);
create policy "Utilizatorii pot actualiza ore lipsă" on missing_hours for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Utilizatorii pot șterge ore lipsă" on missing_hours for delete using (auth.uid() = user_id);

-- 6. Tabel șabloane de ture personalizate (opțional)
create table if not exists shift_templates (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  start_time time not null,
  end_time time not null,
  color text default 'purple',
  created_at timestamp with time zone default now()
);
alter table shift_templates enable row level security;
create policy "Utilizatorii pot gestiona propriile șabloane" on shift_templates for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
alter table shifts drop constraint if exists shifts_shift_type_check;`;

export default function SetupGuideModal({ isOpen, onClose }) {
  const [copied, setCopied] = useState(false);
  const [urlInput, setUrlInput] = useState(supabaseUrl || '');
  const [keyInput, setKeyInput] = useState(supabaseAnonKey || '');
  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleCopySql = () => {
    navigator.clipboard.writeText(SQL_SCHEMA);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleSaveConfig = (e) => {
    e.preventDefault();
    if (!urlInput.trim() || !keyInput.trim()) return;
    saveSupabaseConfig(urlInput.trim(), keyInput.trim());
    setSaveSuccess(true);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Configurare Supabase & Bază de Date" maxWidth="max-w-2xl">
      <div className="space-y-6">
        {/* Status box */}
        <div className={`p-4 rounded-xl border flex items-start gap-3 ${
          isSupabaseConfigured 
            ? 'bg-emerald-50/80 border-emerald-200 text-emerald-900'
            : 'bg-amber-50/80 border-amber-200 text-amber-900'
        }`}>
          {isSupabaseConfigured ? (
            <>
              <CheckCircle2 className="w-5 h-5 text-emerald-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-semibold">Supabase este conectat activ!</p>
                <p className="text-xs text-emerald-700 mt-0.5">Datele tale se sincronizează în mod securizat direct cu PostgreSQL și Supabase Auth.</p>
              </div>
            </>
          ) : (
            <>
              <Database className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-semibold">Aplicația rulează în Mod Local Demonstrativ</p>
                <p className="text-xs text-amber-700 mt-0.5">
                  Poți testa liber toate funcționalitățile! Pentru a persista datele în cloud, conectează-ți propriul proiect Supabase mai jos.
                </p>
              </div>
            </>
          )}
        </div>

        {/* Pasul 1: SQL Schema */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Pasul 1: Rulează Scriptul SQL în Supabase</span>
            <button
              type="button"
              onClick={handleCopySql}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white transition-colors"
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? 'Copiat în Clipboard!' : 'Copiază Scriptul SQL'}
            </button>
          </div>
          <p className="text-xs text-slate-600">
            În panoul Supabase, deschide <b>SQL Editor</b>, lipește scriptul de mai jos și apasă <b>Run</b>. Acesta creează tabelele <code className="bg-slate-100 px-1 py-0.5 rounded text-slate-700">employees</code> și <code className="bg-slate-100 px-1 py-0.5 rounded text-slate-700">shifts</code> cu politicile Row Level Security (RLS) aferente:
          </p>
          <div className="relative">
            <pre className="p-3 bg-slate-900 text-slate-200 text-xs rounded-xl overflow-x-auto max-h-44 font-mono">
              {SQL_SCHEMA}
            </pre>
          </div>
        </div>

        {/* Pasul 2: Conexiune Chei */}
        <form onSubmit={handleSaveConfig} className="space-y-4 pt-2 border-t border-slate-100">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block">Pasul 2: Introdu Datele Proiectului</span>
          
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Project URL
            </label>
            <input
              type="url"
              placeholder="https://xyzcompany.supabase.co"
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Anon Public API Key
            </label>
            <input
              type="text"
              placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
              value={keyInput}
              onChange={(e) => setKeyInput(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
            />
          </div>

          <div className="flex items-center justify-between pt-2">
            {isSupabaseConfigured && (
              <button
                type="button"
                onClick={resetSupabaseConfig}
                className="text-xs text-rose-600 hover:text-rose-700 underline"
              >
                Resetează la Mod Demonstrativ
              </button>
            )}
            <div className="flex gap-2 ml-auto">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              >
                Închide
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors shadow-sm"
              >
                Salvează & Conectează
              </button>
            </div>
          </div>
        </form>
      </div>
    </Modal>
  );
}
