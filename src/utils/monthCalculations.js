import { calculateShiftHours } from './timeCalculations';

export const MONTH_NAMES_RO = [
  'Ianuarie', 'Februarie', 'Martie', 'Aprilie', 'Mai', 'Iunie',
  'Iulie', 'August', 'Septembrie', 'Octombrie', 'Noiembrie', 'Decembrie'
];

export const DAYS_SHORT_RO = ['Lun', 'Mar', 'Mie', 'Joi', 'Vin', 'Sâm', 'Dum'];

/**
 * Convertește un obiect Date sau an/lună/zi în string "YYYY-MM-DD"
 */
export function toDateString(year, month, day) {
  const m = String(month + 1).padStart(2, '0');
  const d = String(day).padStart(2, '0');
  return `${year}-${m}-${d}`;
}

/**
 * Returnează ziua săptămânii în formatul aplicației (0=Luni ... 6=Duminică)
 */
export function getDayOfWeekFromDate(dateObjOrString) {
  const date = typeof dateObjOrString === 'string' ? new Date(dateObjOrString + 'T00:00:00') : dateObjOrString;
  const jsDay = date.getDay(); // 0 este Dum, 1 este Lun...
  return (jsDay + 6) % 7; // 0=Lun, 6=Dum
}

/**
 * Generează un array cu toate zilele unei luni date (1..28/30/31)
 */
export function getDaysInMonth(year, month) {
  const numDays = new Date(year, month + 1, 0).getDate();
  const todayStr = new Date().toISOString().split('T')[0];

  const days = [];
  for (let d = 1; d <= numDays; d++) {
    const dateStr = toDateString(year, month, d);
    const dayOfWeek = getDayOfWeekFromDate(dateStr);
    const isWeekend = dayOfWeek === 5 || dayOfWeek === 6; // Sâmbătă sau Duminică
    const isToday = dateStr === todayStr;

    days.push({
      dayNumber: d,
      dateString: dateStr,
      dayOfWeek,
      dayNameShort: DAYS_SHORT_RO[dayOfWeek],
      isWeekend,
      isToday,
    });
  }

  return days;
}

/**
 * Generează săptămânile complete pentru vizualizarea clasică tip calendar (matrice 7 coloane)
 */
export function getCalendarMatrix(year, month) {
  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = daysInMonth[0];
  const lastDay = daysInMonth[daysInMonth.length - 1];

  const calendarDays = [];

  // Zile de padding la început (din luna precedentă)
  const padBeforeCount = firstDay.dayOfWeek; // Câte zile lipsesc până la Luni
  if (padBeforeCount > 0) {
    const prevMonthLastDate = new Date(year, month, 0).getDate();
    for (let i = padBeforeCount - 1; i >= 0; i--) {
      const d = prevMonthLastDate - i;
      const prevDate = new Date(year, month - 1, d);
      const prevDateStr = prevDate.toISOString().split('T')[0];
      const dow = getDayOfWeekFromDate(prevDateStr);
      calendarDays.push({
        dayNumber: d,
        dateString: prevDateStr,
        dayOfWeek: dow,
        dayNameShort: DAYS_SHORT_RO[dow],
        isWeekend: dow === 5 || dow === 6,
        isPadding: true,
      });
    }
  }

  // Zilele din luna curentă
  daysInMonth.forEach((d) => {
    calendarDays.push({ ...d, isPadding: false });
  });

  // Zile de padding la sfârșit (din luna următoare) pentru a completa ultima săptămână
  const padAfterCount = (7 - (calendarDays.length % 7)) % 7;
  for (let i = 1; i <= padAfterCount; i++) {
    const nextDate = new Date(year, month + 1, i);
    const nextDateStr = nextDate.toISOString().split('T')[0];
    const dow = getDayOfWeekFromDate(nextDateStr);
    calendarDays.push({
      dayNumber: i,
      dateString: nextDateStr,
      dayOfWeek: dow,
      dayNameShort: DAYS_SHORT_RO[dow],
      isWeekend: dow === 5 || dow === 6,
      isPadding: true,
    });
  }

  // Împărțim pe săptămâni de câte 7 zile
  const weeks = [];
  for (let i = 0; i < calendarDays.length; i += 7) {
    weeks.push(calendarDays.slice(i, i + 7));
  }

  return weeks;
}

export const DAYS_NAMES_RO = [
  'Luni', 'Marți', 'Miercuri', 'Joi', 'Vineri', 'Sâmbătă', 'Duminică'
];

/**
 * Returnează cele 7 zile ale săptămânii corespunzătoare oricărei date (Luni .. Duminică)
 */
export function getWeekDaysForDate(dateObjOrString) {
  const date = typeof dateObjOrString === 'string' ? new Date(dateObjOrString + 'T00:00:00') : new Date(dateObjOrString);
  const dow = getDayOfWeekFromDate(date); // 0=Luni ... 6=Duminică

  // Găsim Lunea acelei săptămâni
  const monday = new Date(date.getTime());
  monday.setDate(date.getDate() - dow);

  const weekDays = [];
  for (let i = 0; i < 7; i++) {
    const dayDate = new Date(monday.getTime());
    dayDate.setDate(monday.getDate() + i);

    const year = dayDate.getFullYear();
    const month = dayDate.getMonth();
    const day = dayDate.getDate();
    const dateString = toDateString(year, month, day);

    weekDays.push({
      dayOfWeek: i,
      dateString,
      dayNumber: day,
      monthNumber: month + 1,
      dayNameShort: DAYS_SHORT_RO[i],
      dayName: DAYS_NAMES_RO[i],
      formattedDate: `${String(day).padStart(2, '0')}.${String(month + 1).padStart(2, '0')}`,
      isWeekend: i === 5 || i === 6,
    });
  }

  return weekDays;
}

/**
 * Calculează totalul orelor lucrate de un angajat într-o anumită lună
 */
export function calculateEmployeeMonthlyHours(employeeId, shifts = [], year, month) {
  const targetPrefix = `${year}-${String(month + 1).padStart(2, '0')}`;
  
  const empShifts = shifts.filter((s) => {
    if (s.employee_id !== employeeId) return false;
    if (s.shift_date) {
      return s.shift_date.startsWith(targetPrefix);
    }
    return false;
  });

  const total = empShifts.reduce((acc, s) => acc + calculateShiftHours(s.start_time, s.end_time), 0);
  return Math.round(total * 10) / 10;
}
