import { createClient } from '@supabase/supabase-js';

// Verifică variabilele din .env sau din localStorage (pentru configurare ușoară din UI)
const envUrl = import.meta.env.VITE_SUPABASE_URL;
const envKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

const savedUrl = typeof window !== 'undefined' ? localStorage.getItem('CREARE_ORAR_SUPABASE_URL') : null;
const savedKey = typeof window !== 'undefined' ? localStorage.getItem('CREARE_ORAR_SUPABASE_KEY') : null;

export const supabaseUrl = (savedUrl || envUrl || '').trim();
export const supabaseAnonKey = (savedKey || envKey || '').trim();

export const isSupabaseConfigured = Boolean(
  supabaseUrl && 
  supabaseAnonKey && 
  supabaseUrl !== 'https://your-project-id.supabase.co' &&
  supabaseAnonKey !== 'your-anon-key-here'
);

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    })
  : null;

// Funcție pentru salvare chei direct din setările aplicației
export function saveSupabaseConfig(url, key) {
  if (url && key) {
    localStorage.setItem('CREARE_ORAR_SUPABASE_URL', url.trim());
    localStorage.setItem('CREARE_ORAR_SUPABASE_KEY', key.trim());
    window.location.reload();
  }
}

// Funcție pentru resetare configurare
export function resetSupabaseConfig() {
  localStorage.removeItem('CREARE_ORAR_SUPABASE_URL');
  localStorage.removeItem('CREARE_ORAR_SUPABASE_KEY');
  window.location.reload();
}
