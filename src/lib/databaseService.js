import { supabase, isSupabaseConfigured } from './supabase';
import { BASE_DEFAULT_TEMPLATES } from '../utils/shiftTemplateHelpers';

// Date demonstrative inițiale
const INITIAL_DEMO_EMPLOYEES = [
  {
    id: 'emp-1',
    user_id: 'demo-user-id',
    first_name: 'Andrei',
    last_name: 'Popescu',
    role: 'Dezvoltator Software',
    email: 'andrei.popescu@exemplu.ro',
    phone: '0721 234 567',
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7).toISOString(),
  },
  {
    id: 'emp-2',
    user_id: 'demo-user-id',
    first_name: 'Elena',
    last_name: 'Ionescu',
    role: 'Specialist Vânzări',
    email: 'elena.ionescu@exemplu.ro',
    phone: '0733 456 789',
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5).toISOString(),
  },
  {
    id: 'emp-3',
    user_id: 'demo-user-id',
    first_name: 'Mihai',
    last_name: 'Radu',
    role: 'Inginer Suport IT',
    email: 'mihai.radu@exemplu.ro',
    phone: '0744 567 890',
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString(),
  },
  {
    id: 'emp-4',
    user_id: 'demo-user-id',
    first_name: 'Maria',
    last_name: 'Dumitru',
    role: 'Manager Operațiuni',
    email: 'maria.dumitru@exemplu.ro',
    phone: '0755 678 901',
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(),
  },
];

const INITIAL_DEMO_SHIFTS = [
  // Andrei Popescu: Ture de dimineață în Septembrie 2026
  { id: 'shift-1', user_id: 'demo-user-id', employee_id: 'emp-1', shift_date: '2026-09-07', day_of_week: 0, start_time: '08:00:00', end_time: '16:00:00', shift_type: 'morning' },
  { id: 'shift-2', user_id: 'demo-user-id', employee_id: 'emp-1', shift_date: '2026-09-08', day_of_week: 1, start_time: '08:00:00', end_time: '16:00:00', shift_type: 'morning' },
  { id: 'shift-3', user_id: 'demo-user-id', employee_id: 'emp-1', shift_date: '2026-09-09', day_of_week: 2, start_time: '08:00:00', end_time: '16:00:00', shift_type: 'morning' },
  { id: 'shift-4', user_id: 'demo-user-id', employee_id: 'emp-1', shift_date: '2026-09-10', day_of_week: 3, start_time: '08:00:00', end_time: '16:00:00', shift_type: 'morning' },
  { id: 'shift-5', user_id: 'demo-user-id', employee_id: 'emp-1', shift_date: '2026-09-11', day_of_week: 4, start_time: '08:00:00', end_time: '16:00:00', shift_type: 'morning' },

  // Elena Ionescu: Ture de după-amiază în Septembrie 2026
  { id: 'shift-6', user_id: 'demo-user-id', employee_id: 'emp-2', shift_date: '2026-09-07', day_of_week: 0, start_time: '14:00:00', end_time: '22:00:00', shift_type: 'afternoon' },
  { id: 'shift-7', user_id: 'demo-user-id', employee_id: 'emp-2', shift_date: '2026-09-08', day_of_week: 1, start_time: '14:00:00', end_time: '22:00:00', shift_type: 'afternoon' },
  { id: 'shift-8', user_id: 'demo-user-id', employee_id: 'emp-2', shift_date: '2026-09-09', day_of_week: 2, start_time: '14:00:00', end_time: '22:00:00', shift_type: 'afternoon' },
  { id: 'shift-9', user_id: 'demo-user-id', employee_id: 'emp-2', shift_date: '2026-09-10', day_of_week: 3, start_time: '14:00:00', end_time: '22:00:00', shift_type: 'afternoon' },
  { id: 'shift-10', user_id: 'demo-user-id', employee_id: 'emp-2', shift_date: '2026-09-11', day_of_week: 4, start_time: '14:00:00', end_time: '22:00:00', shift_type: 'afternoon' },
  { id: 'shift-11', user_id: 'demo-user-id', employee_id: 'emp-2', shift_date: '2026-09-12', day_of_week: 5, start_time: '10:00:00', end_time: '18:00:00', shift_type: 'custom' },

  // Mihai Radu: Ture de noapte în Septembrie 2026 (22:00 -> 06:00)
  { id: 'shift-12', user_id: 'demo-user-id', employee_id: 'emp-3', shift_date: '2026-09-01', day_of_week: 1, start_time: '22:00:00', end_time: '06:00:00', shift_type: 'night' },
  { id: 'shift-13', user_id: 'demo-user-id', employee_id: 'emp-3', shift_date: '2026-09-02', day_of_week: 2, start_time: '22:00:00', end_time: '06:00:00', shift_type: 'night' },
  { id: 'shift-14', user_id: 'demo-user-id', employee_id: 'emp-3', shift_date: '2026-09-03', day_of_week: 3, start_time: '22:00:00', end_time: '06:00:00', shift_type: 'night' },
  { id: 'shift-15', user_id: 'demo-user-id', employee_id: 'emp-3', shift_date: '2026-09-04', day_of_week: 4, start_time: '22:00:00', end_time: '06:00:00', shift_type: 'night' },

  // Maria Dumitru: Ture de zi în Septembrie 2026
  { id: 'shift-16', user_id: 'demo-user-id', employee_id: 'emp-4', shift_date: '2026-09-07', day_of_week: 0, start_time: '09:00:00', end_time: '17:00:00', shift_type: 'custom' },
  { id: 'shift-17', user_id: 'demo-user-id', employee_id: 'emp-4', shift_date: '2026-09-09', day_of_week: 2, start_time: '09:00:00', end_time: '17:00:00', shift_type: 'custom' },
  { id: 'shift-18', user_id: 'demo-user-id', employee_id: 'emp-4', shift_date: '2026-09-11', day_of_week: 4, start_time: '09:00:00', end_time: '17:00:00', shift_type: 'custom' },
];

// Helper local storage pentru demo
function getLocalData(key, defaultVal) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : defaultVal;
  } catch (e) {
    return defaultVal;
  }
}

function setLocalData(key, val) {
  try {
    localStorage.setItem(key, JSON.stringify(val));
  } catch (e) {
    console.error(e);
  }
}

export function isUsingDemo(userId) {
  if (userId && typeof userId === 'string' && (userId.startsWith('demo-') || userId === 'demo-user-id')) {
    return true;
  }
  if (typeof window !== 'undefined' && localStorage.getItem('CREARE_ORAR_DEMO_MODE') === 'true') {
    return true;
  }
  return !isSupabaseConfigured || !supabase;
}

/* ==========================================================================
   SERVICII ANGAJAȚI (EMPLOYEES)
   ========================================================================== */

export async function fetchEmployees(userId) {
  if (!isUsingDemo(userId) && isSupabaseConfigured && supabase) {
    const { data, error } = await supabase
      .from('employees')
      .select('*')
      .order('first_name', { ascending: true });

    if (error) throw error;
    return data || [];
  } else {
    // Demo mode
    const employees = getLocalData('DEMO_EMPLOYEES', INITIAL_DEMO_EMPLOYEES);
    return employees;
  }
}

export async function createEmployee(employeeData) {
  if (!isUsingDemo(employeeData?.user_id) && isSupabaseConfigured && supabase) {
    const { data, error } = await supabase
      .from('employees')
      .insert([employeeData])
      .select()
      .single();

    if (error) throw error;
    return data;
  } else {
    // Demo mode
    const employees = getLocalData('DEMO_EMPLOYEES', INITIAL_DEMO_EMPLOYEES);
    const newEmp = {
      ...employeeData,
      id: 'emp-' + Math.random().toString(36).substring(2, 9),
      created_at: new Date().toISOString(),
    };
    const updated = [newEmp, ...employees];
    setLocalData('DEMO_EMPLOYEES', updated);
    return newEmp;
  }
}

export async function updateEmployee(id, employeeData) {
  if (!isUsingDemo(employeeData?.user_id) && isSupabaseConfigured && supabase) {
    const { data, error } = await supabase
      .from('employees')
      .update(employeeData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  } else {
    // Demo mode
    const employees = getLocalData('DEMO_EMPLOYEES', INITIAL_DEMO_EMPLOYEES);
    const updated = employees.map((e) => (e.id === id ? { ...e, ...employeeData } : e));
    setLocalData('DEMO_EMPLOYEES', updated);
    return updated.find((e) => e.id === id);
  }
}

export async function deleteEmployee(id) {
  if (isSupabaseConfigured && supabase && !isUsingDemo()) {
    const { error } = await supabase
      .from('employees')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return true;
  } else {
    // Demo mode
    const employees = getLocalData('DEMO_EMPLOYEES', INITIAL_DEMO_EMPLOYEES);
    const updated = employees.filter((e) => e.id !== id);
    setLocalData('DEMO_EMPLOYEES', updated);

    // Șterge și turele asociate
    const shifts = getLocalData('DEMO_SHIFTS', INITIAL_DEMO_SHIFTS);
    const updatedShifts = shifts.filter((s) => s.employee_id !== id);
    setLocalData('DEMO_SHIFTS', updatedShifts);
    return true;
  }
}

/* ==========================================================================
   SERVICII TURE / ORAR (SHIFTS)
   ========================================================================== */

export async function fetchShifts(userId) {
  if (!isUsingDemo(userId) && isSupabaseConfigured && supabase) {
    const { data, error } = await supabase
      .from('shifts')
      .select('*')
      .order('day_of_week', { ascending: true })
      .order('start_time', { ascending: true });

    if (error) throw error;
    return data || [];
  } else {
    // Demo mode
    const shifts = getLocalData('DEMO_SHIFTS', INITIAL_DEMO_SHIFTS);
    return shifts;
  }
}

export async function createShift(shiftData) {
  if (!isUsingDemo(shiftData?.user_id) && isSupabaseConfigured && supabase) {
    let { data, error } = await supabase
      .from('shifts')
      .insert([shiftData])
      .select()
      .single();

    // Dacă Supabase returnează 400 (PGRST204) pentru că coloana shift_date nu a fost încă creată în Postgres
    if (error && (error.code === 'PGRST204' || error.message?.includes('shift_date') || error.code === '42703')) {
      console.warn('Coloana shift_date lipsește din tabelul shifts în Supabase. Se încearcă salvarea fără shift_date:', error.message);
      const { shift_date, ...fallbackData } = shiftData;
      const fallbackRes = await supabase
        .from('shifts')
        .insert([fallbackData])
        .select()
        .single();

      if (fallbackRes.error) {
        // Verificare dacă e problemă și cu tipul de tură custom
        if (fallbackRes.error.code === '23514' || fallbackRes.error.message?.includes('shifts_shift_type_check')) {
          const safeData = { ...fallbackData, shift_type: 'custom' };
          const safeRes = await supabase.from('shifts').insert([safeData]).select().single();
          if (safeRes.error) throw safeRes.error;
          return { ...safeRes.data, shift_date };
        }
        throw fallbackRes.error;
      }
      return { ...fallbackRes.data, shift_date };
    }

    // Dacă Supabase returnează eroare de check constraint pe shift_type
    if (error && (error.code === '23514' || error.message?.includes('shifts_shift_type_check'))) {
      console.warn('Constrângerea shifts_shift_type_check este activă în Supabase. Se salvează cu shift_type: "custom"');
      const safeData = { ...shiftData, shift_type: 'custom' };
      const safeRes = await supabase.from('shifts').insert([safeData]).select().single();
      if (safeRes.error) throw safeRes.error;
      return safeRes.data;
    }

    if (error) throw error;
    return data;
  } else {
    // Demo mode
    const shifts = getLocalData('DEMO_SHIFTS', INITIAL_DEMO_SHIFTS);
    const newShift = {
      ...shiftData,
      id: 'shift-' + Math.random().toString(36).substring(2, 9),
      created_at: new Date().toISOString(),
    };
    const updated = [...shifts, newShift];
    setLocalData('DEMO_SHIFTS', updated);
    return newShift;
  }
}

export async function createShiftsBulk(shiftsArray) {
  if (!shiftsArray || shiftsArray.length === 0) return [];
  const firstUserId = shiftsArray[0]?.user_id;
  if (!isUsingDemo(firstUserId) && isSupabaseConfigured && supabase) {
    let { data, error } = await supabase
      .from('shifts')
      .insert(shiftsArray)
      .select();

    // Dacă Supabase returnează 400 (PGRST204) pentru că coloana shift_date nu a fost încă adăugată în Postgres
    if (error && (error.code === 'PGRST204' || error.message?.includes('shift_date') || error.code === '42703')) {
      console.warn('Coloana shift_date lipsește din tabelul shifts în Supabase. Se încearcă salvarea bulk fără shift_date:', error.message);
      const fallbackArray = shiftsArray.map(({ shift_date, ...rest }) => rest);
      const fallbackRes = await supabase
        .from('shifts')
        .insert(fallbackArray)
        .select();

      if (fallbackRes.error) throw fallbackRes.error;
      return fallbackRes.data || [];
    }

    if (error) throw error;
    return data || [];
  } else {
    // Demo mode
    const shifts = getLocalData('DEMO_SHIFTS', INITIAL_DEMO_SHIFTS);
    const newShifts = shiftsArray.map((s) => ({
      ...s,
      id: 'shift-' + Math.random().toString(36).substring(2, 9),
      created_at: new Date().toISOString(),
    }));
    const updated = [...shifts, ...newShifts];
    setLocalData('DEMO_SHIFTS', updated);
    return newShifts;
  }
}

export async function updateShift(id, shiftData) {
  if (isSupabaseConfigured && supabase) {
    let { data, error } = await supabase
      .from('shifts')
      .update(shiftData)
      .eq('id', id)
      .select()
      .single();

    if (error && (error.code === 'PGRST204' || error.message?.includes('shift_date') || error.code === '42703')) {
      console.warn('Coloana shift_date lipsește din tabelul shifts în Supabase la update. Se încearcă actualizarea fără shift_date:', error.message);
      const { shift_date, ...fallbackData } = shiftData;
      const fallbackRes = await supabase
        .from('shifts')
        .update(fallbackData)
        .eq('id', id)
        .select()
        .single();

      if (fallbackRes.error) throw fallbackRes.error;
      return { ...fallbackRes.data, shift_date };
    }

    if (error) throw error;
    return data;
  } else {
    // Demo mode
    const shifts = getLocalData('DEMO_SHIFTS', INITIAL_DEMO_SHIFTS);
    const updated = shifts.map((s) => (s.id === id ? { ...s, ...shiftData } : s));
    setLocalData('DEMO_SHIFTS', updated);
    return updated.find((s) => s.id === id);
  }
}

export async function deleteShift(id) {
  if (isSupabaseConfigured && supabase) {
    const { error } = await supabase
      .from('shifts')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return true;
  } else {
    // Demo mode
    const shifts = getLocalData('DEMO_SHIFTS', INITIAL_DEMO_SHIFTS);
    const updated = shifts.filter((s) => s.id !== id);
    setLocalData('DEMO_SHIFTS', updated);
    return true;
  }
}

/* ==========================================================================
   SERVICII ORE LIPSĂ & RECUPERĂRI (MISSING_HOURS)
   ========================================================================== */

const INITIAL_DEMO_MISSING_HOURS = [
  {
    id: 'mh-1',
    user_id: 'demo-user-id',
    employee_id: 'emp-1', // Andrei Popescu
    date: '2026-09-02',
    hours_missed: 4,
    hours_recovered: 2,
    reason: 'Învoire personală',
    status: 'partial',
    notes: 'A plecat mai devreme pentru urgență familie; a recuperat 2h joi.',
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 4).toISOString(),
  },
  {
    id: 'mh-2',
    user_id: 'demo-user-id',
    employee_id: 'emp-3', // Mihai Radu
    date: '2026-09-04',
    hours_missed: 3,
    hours_recovered: 0,
    reason: 'Control medical',
    status: 'pending',
    notes: 'Programare stomatologică; urmează să recupereze sâmbătă.',
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(),
  },
];

export function computeMissingHourStatus(hoursMissed, hoursRecovered) {
  const missed = parseFloat(hoursMissed) || 0;
  const recovered = parseFloat(hoursRecovered) || 0;
  if (recovered >= missed && missed > 0) return 'recovered';
  if (recovered > 0) return 'partial';
  return 'pending';
}

export async function fetchMissingHours(userId) {
  if (!isUsingDemo(userId) && isSupabaseConfigured && supabase) {
    const { data, error } = await supabase
      .from('missing_hours')
      .select('*')
      .order('date', { ascending: false });

    if (error) throw error;
    return data || [];
  } else {
    return getLocalData('DEMO_MISSING_HOURS', INITIAL_DEMO_MISSING_HOURS);
  }
}

export async function createMissingHour(recordData) {
  const hoursMissed = parseFloat(recordData.hours_missed) || 0;
  const hoursRecovered = parseFloat(recordData.hours_recovered) || 0;
  const status = computeMissingHourStatus(hoursMissed, hoursRecovered);

  const payload = {
    ...recordData,
    hours_missed: hoursMissed,
    hours_recovered: hoursRecovered,
    status,
  };

  if (!isUsingDemo(recordData?.user_id) && isSupabaseConfigured && supabase) {
    const { data, error } = await supabase
      .from('missing_hours')
      .insert([payload])
      .select()
      .single();

    if (error) throw error;
    return data;
  } else {
    const items = getLocalData('DEMO_MISSING_HOURS', INITIAL_DEMO_MISSING_HOURS);
    const newItem = {
      ...payload,
      id: 'mh-' + Math.random().toString(36).substring(2, 9),
      created_at: new Date().toISOString(),
    };
    const updated = [newItem, ...items];
    setLocalData('DEMO_MISSING_HOURS', updated);
    return newItem;
  }
}

export async function updateMissingHour(id, recordData) {
  const hoursMissed = parseFloat(recordData.hours_missed) || 0;
  const hoursRecovered = parseFloat(recordData.hours_recovered) || 0;
  const status = computeMissingHourStatus(hoursMissed, hoursRecovered);

  const payload = {
    ...recordData,
    hours_missed: hoursMissed,
    hours_recovered: hoursRecovered,
    status,
  };

  if (isSupabaseConfigured && supabase) {
    const { data, error } = await supabase
      .from('missing_hours')
      .update(payload)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  } else {
    const items = getLocalData('DEMO_MISSING_HOURS', INITIAL_DEMO_MISSING_HOURS);
    const updated = items.map((i) => (i.id === id ? { ...i, ...payload } : i));
    setLocalData('DEMO_MISSING_HOURS', updated);
    return updated.find((i) => i.id === id);
  }
}

export async function deleteMissingHour(id) {
  if (isSupabaseConfigured && supabase) {
    const { error } = await supabase
      .from('missing_hours')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return true;
  } else {
    const items = getLocalData('DEMO_MISSING_HOURS', INITIAL_DEMO_MISSING_HOURS);
    const updated = items.filter((i) => i.id !== id);
    setLocalData('DEMO_MISSING_HOURS', updated);
    return true;
  }
}

export async function recordHourRecovery(id, additionalHours, note = '') {
  const additional = parseFloat(additionalHours) || 0;
  if (additional <= 0) return;

  if (isSupabaseConfigured && supabase) {
    // Luăm mai întâi înregistrarea curentă
    const { data: current, error: fetchErr } = await supabase
      .from('missing_hours')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchErr) throw fetchErr;

    const newRecovered = Math.min(
      parseFloat(current.hours_missed),
      parseFloat(current.hours_recovered || 0) + additional
    );
    const newStatus = computeMissingHourStatus(current.hours_missed, newRecovered);
    const newNotes = note
      ? (current.notes ? `${current.notes} | ${note}` : note)
      : current.notes;

    const { data, error } = await supabase
      .from('missing_hours')
      .update({
        hours_recovered: newRecovered,
        status: newStatus,
        notes: newNotes,
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  } else {
    const items = getLocalData('DEMO_MISSING_HOURS', INITIAL_DEMO_MISSING_HOURS);
    const current = items.find((i) => i.id === id);
    if (!current) return null;

    const newRecovered = Math.min(
      parseFloat(current.hours_missed),
      parseFloat(current.hours_recovered || 0) + additional
    );
    const newStatus = computeMissingHourStatus(current.hours_missed, newRecovered);
    const newNotes = note
      ? (current.notes ? `${current.notes} | ${note}` : note)
      : current.notes;

    const updatedItem = {
      ...current,
      hours_recovered: newRecovered,
      status: newStatus,
      notes: newNotes,
    };

    const updated = items.map((i) => (i.id === id ? updatedItem : i));
    setLocalData('DEMO_MISSING_HOURS', updated);
    return updatedItem;
  }
}

/**
 * Alocă automat surplusul de ore dintr-o tură (>8h, ex: 9h => surplus 1h)
 * pentru stingerea/recuperarea orelor lipsă ale respectivului angajat (FIFO).
 */
export async function compensateMissingHoursFromShift(userId, employeeId, surplusHours, shiftDetails = {}) {
  let remainingSurplus = parseFloat(surplusHours) || 0;
  if (remainingSurplus <= 0 || !employeeId) return 0;

  const shiftInfo = shiftDetails.day_name 
    ? `tura de ${shiftDetails.total_hours || (8 + remainingSurplus)}h din ziua de ${shiftDetails.day_name}` 
    : `tura de ${shiftDetails.total_hours || (8 + remainingSurplus)}h`;

  if (isSupabaseConfigured && supabase) {
    const { data: records, error } = await supabase
      .from('missing_hours')
      .select('*')
      .eq('employee_id', employeeId)
      .neq('status', 'recovered')
      .order('date', { ascending: true });

    if (error || !records || records.length === 0) return 0;

    let totalCompensated = 0;

    for (const record of records) {
      if (remainingSurplus <= 0) break;

      const missed = parseFloat(record.hours_missed) || 0;
      const alreadyRecovered = parseFloat(record.hours_recovered) || 0;
      const needed = Math.max(0, missed - alreadyRecovered);

      if (needed <= 0) continue;

      const toRecover = Math.min(needed, remainingSurplus);
      const newRecovered = Math.round((alreadyRecovered + toRecover) * 100) / 100;
      const newStatus = computeMissingHourStatus(missed, newRecovered);
      const auditNote = `Recuperat automat ${toRecover}h prin ${shiftInfo}`;
      const newNotes = record.notes ? `${record.notes} | ${auditNote}` : auditNote;

      await supabase
        .from('missing_hours')
        .update({
          hours_recovered: newRecovered,
          status: newStatus,
          notes: newNotes,
        })
        .eq('id', record.id);

      remainingSurplus -= toRecover;
      totalCompensated += toRecover;
    }

    return Math.round(totalCompensated * 100) / 100;
  } else {
    const items = getLocalData('DEMO_MISSING_HOURS', INITIAL_DEMO_MISSING_HOURS);
    let totalCompensated = 0;

    const updated = items.map((record) => {
      if (record.employee_id !== employeeId || record.status === 'recovered' || remainingSurplus <= 0) {
        return record;
      }

      const missed = parseFloat(record.hours_missed) || 0;
      const alreadyRecovered = parseFloat(record.hours_recovered) || 0;
      const needed = Math.max(0, missed - alreadyRecovered);

      if (needed <= 0) return record;

      const toRecover = Math.min(needed, remainingSurplus);
      const newRecovered = Math.round((alreadyRecovered + toRecover) * 100) / 100;
      const newStatus = computeMissingHourStatus(missed, newRecovered);
      const auditNote = `Recuperat automat ${toRecover}h prin ${shiftInfo}`;
      const newNotes = record.notes ? `${record.notes} | ${auditNote}` : auditNote;

      remainingSurplus -= toRecover;
      totalCompensated += toRecover;

      return {
        ...record,
        hours_recovered: newRecovered,
        status: newStatus,
        notes: newNotes,
      };
    });

    setLocalData('DEMO_MISSING_HOURS', updated);
    return Math.round(totalCompensated * 100) / 100;
  }
}

/* ==========================================================================
   SERVICII ȘABLOANE / TIPURI DE TURE PERSONALIZATE (SHIFT TEMPLATES)
   ========================================================================== */

export async function fetchShiftTemplates(userId) {
  if (!isUsingDemo(userId) && isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from('shift_templates')
        .select('*')
        .order('created_at', { ascending: true });

      if (error) {
        return getLocalData('DEMO_SHIFT_TEMPLATES', BASE_DEFAULT_TEMPLATES);
      }
      return data && data.length > 0 ? data : BASE_DEFAULT_TEMPLATES;
    } catch (err) {
      return getLocalData('DEMO_SHIFT_TEMPLATES', BASE_DEFAULT_TEMPLATES);
    }
  } else {
    // Demo mode
    return getLocalData('DEMO_SHIFT_TEMPLATES', BASE_DEFAULT_TEMPLATES);
  }
}

export async function createShiftTemplate(templateData) {
  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from('shift_templates')
        .insert([templateData])
        .select()
        .single();

      if (!error && data) {
        return data;
      }
    } catch (e) {
      console.warn('Fallback local pentru salvare șablon:', e);
    }
  }

  const current = getLocalData('DEMO_SHIFT_TEMPLATES', BASE_DEFAULT_TEMPLATES);
  const newTemplate = {
    ...templateData,
    id: 'tpl-' + Math.random().toString(36).substring(2, 9),
    created_at: new Date().toISOString(),
  };
  const updated = [...current, newTemplate];
  setLocalData('DEMO_SHIFT_TEMPLATES', updated);
  return newTemplate;
}

export async function deleteShiftTemplate(id) {
  if (isSupabaseConfigured && supabase) {
    try {
      await supabase
        .from('shift_templates')
        .delete()
        .eq('id', id);
    } catch (e) {
      console.warn(e);
    }
  }

  const current = getLocalData('DEMO_SHIFT_TEMPLATES', BASE_DEFAULT_TEMPLATES);
  const updated = current.filter((t) => t.id !== id);
  setLocalData('DEMO_SHIFT_TEMPLATES', updated);
  return true;
}
