import { MAX_STANDARD_WEEKLY_HOURS } from './dateConstants';

/**
 * Convertește "HH:MM" sau "HH:MM:SS" în minute de la începutul zilei
 */
export function timeToMinutes(timeStr) {
  if (!timeStr) return 0;
  const parts = timeStr.split(':');
  const hours = parseInt(parts[0], 10) || 0;
  const minutes = parseInt(parts[1], 10) || 0;
  return hours * 60 + minutes;
}

/**
 * Calculează durata în ore a unei ture.
 * Gestionează corect turele de noapte care trec de miezul nopții (ex. 22:00 -> 06:00 = 8h).
 */
export function calculateShiftHours(startTime, endTime) {
  if (!startTime || !endTime) return 0;

  const startMin = timeToMinutes(startTime);
  const endMin = timeToMinutes(endTime);

  let diffMin = endMin - startMin;
  if (diffMin <= 0) {
    // A trecut de miezul nopții (ex: 22:00 -> 06:00 = 1440 - 1320 + 360 = 480 min = 8h)
    diffMin += 24 * 60;
  }

  const hours = diffMin / 60;
  return Math.round(hours * 100) / 100;
}

/**
 * Formatează numărul de ore pentru afișare (ex: 8h, 7.5h)
 */
export function formatHours(hours) {
  if (hours === undefined || hours === null || isNaN(hours)) return '0h';
  return Number.isInteger(hours) ? `${hours}h` : `${hours.toFixed(1)}h`;
}

/**
 * Elimină secundele din string-ul time din postgres (ex: "08:00:00" -> "08:00")
 */
export function formatTimeShort(timeStr) {
  if (!timeStr) return '';
  const parts = timeStr.split(':');
  if (parts.length >= 2) {
    return `${parts[0].padStart(2, '0')}:${parts[1].padStart(2, '0')}`;
  }
  return timeStr;
}

/**
 * Calculează totalul orelor săptămânale pentru un angajat dat dintr-o listă de ture
 */
export function calculateEmployeeWeeklyHours(employeeId, shifts = []) {
  if (!shifts || !employeeId) return 0;
  const empShifts = shifts.filter((s) => s.employee_id === employeeId);
  const total = empShifts.reduce((acc, shift) => {
    return acc + calculateShiftHours(shift.start_time, shift.end_time);
  }, 0);
  return Math.round(total * 100) / 100;
}

/**
 * Verifică dacă un angajat depășește norma standard de 40h/săptămână
 */
export function isOvertime(hours) {
  return hours > MAX_STANDARD_WEEKLY_HOURS;
}

/**
 * Returnează ziua curentă a săptămânii conform formatului aplicației (0=Luni ... 6=Duminică)
 */
export function getTodayDayOfWeek() {
  const jsDay = new Date().getDay(); // 0 este Duminică, 1 este Luni...
  return (jsDay + 6) % 7; // Convertim: 0->6 (Dum), 1->0 (Lun), 2->1 (Mar), etc.
}

/**
 * Calculează statusul orelor săptămânale și depășirea normei de 40h excluzând orele de recuperat.
 * Dacă un angajat a lucrat peste 40h, dar orele suplimentare au fost destinate recuperării orelor lipsă,
 * acestea se deduc, iar alerta de depășire 40h se afișează doar dacă depășește 40h chiar și FĂRĂ orele de recuperat.
 * 
 * @param {string} employeeId - ID-ul angajatului
 * @param {Array} shifts - Turele relevante pentru săptămână
 * @param {Array} missingHours - Înregistrările de ore lipsă din sistem
 * @returns {Object} Detalii calcul normă și depășire
 */
export function getEmployeeOvertimeStatus(employeeId, shifts = [], missingHours = []) {
  if (!employeeId) {
    return {
      totalHours: 0,
      effectiveHours: 0,
      recoveryDeducted: 0,
      extraHours: 0,
      isOvertime: false,
      hasRecoveryHours: false,
      hoursRecovered: 0,
      hoursPendingToRecover: 0,
    };
  }

  const empShifts = (shifts || []).filter((s) => s.employee_id === employeeId);
  const totalHours = Math.round(
    empShifts.reduce((acc, s) => acc + calculateShiftHours(s.start_time, s.end_time), 0) * 100
  ) / 100;

  // Ore lipsă restante încă de recuperat pentru acest angajat
  const empMissing = (missingHours || []).filter((m) => m.employee_id === employeeId);
  const hoursPendingToRecover = empMissing
    .filter((m) => m.status !== 'recovered')
    .reduce((acc, m) => {
      const diff = (parseFloat(m.hours_missed) || 0) - (parseFloat(m.hours_recovered) || 0);
      return acc + Math.max(0, diff);
    }, 0);

  // Câte ore brute peste limita de 40h are programat în această săptămână
  const rawExcess = Math.max(0, totalHours - MAX_STANDARD_WEEKLY_HOURS);

  // Deducem DOAR orele de recuperat active (ore lipsă care trebuie recuperate)
  // Dacă angajatul nu are ore de recuperat (hoursPendingToRecover === 0), atunci este fără ore de recuperat:
  // orice oră peste 40 este depășire directă (overtime)!
  let recoveryDeducted = 0;
  if (rawExcess > 0 && hoursPendingToRecover > 0) {
    recoveryDeducted = Math.min(rawExcess, hoursPendingToRecover);
  }

  // Orele efective calculate fără orele de recuperat
  const effectiveHours = Math.round(Math.max(0, totalHours - recoveryDeducted) * 10) / 10;
  const isOvertime = effectiveHours > MAX_STANDARD_WEEKLY_HOURS;
  const extraHours = isOvertime
    ? Math.round((effectiveHours - MAX_STANDARD_WEEKLY_HOURS) * 10) / 10
    : 0;

  return {
    totalHours,
    effectiveHours,
    recoveryDeducted: Math.round(recoveryDeducted * 10) / 10,
    extraHours,
    isOvertime,
    hasRecoveryHours: hoursPendingToRecover > 0,
    hoursPendingToRecover: Math.round(hoursPendingToRecover * 10) / 10,
  };
}
