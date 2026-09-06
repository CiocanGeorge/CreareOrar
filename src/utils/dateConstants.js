// Zilele săptămânii: 0=Luni ... 6=Duminică
export const DAYS_OF_WEEK = [
  { id: 0, name: 'Luni', short: 'Lun', isWeekend: false },
  { id: 1, name: 'Marți', short: 'Mar', isWeekend: false },
  { id: 2, name: 'Miercuri', short: 'Mie', isWeekend: false },
  { id: 3, name: 'Joi', short: 'Joi', isWeekend: false },
  { id: 4, name: 'Vineri', short: 'Vin', isWeekend: false },
  { id: 5, name: 'Sâmbătă', short: 'Sâm', isWeekend: true },
  { id: 6, name: 'Duminică', short: 'Dum', isWeekend: true },
];

export const SHIFT_TYPES = {
  morning: {
    id: 'morning',
    label: 'Dimineață',
    defaultStart: '08:00',
    defaultEnd: '16:00',
    colorBg: 'bg-amber-50',
    colorBorder: 'border-amber-300',
    colorText: 'text-amber-800',
    badgeClass: 'bg-amber-100 text-amber-800 border-amber-200',
    indicatorDot: 'bg-amber-500',
    accentColor: '#f59e0b',
  },
  afternoon: {
    id: 'afternoon',
    label: 'După-amiază',
    defaultStart: '14:00',
    defaultEnd: '22:00',
    colorBg: 'bg-sky-50',
    colorBorder: 'border-sky-300',
    colorText: 'text-sky-800',
    badgeClass: 'bg-sky-100 text-sky-800 border-sky-200',
    indicatorDot: 'bg-sky-500',
    accentColor: '#0284c7',
  },
  night: {
    id: 'night',
    label: 'Noapte',
    defaultStart: '22:00',
    defaultEnd: '06:00',
    colorBg: 'bg-indigo-50',
    colorBorder: 'border-indigo-300',
    colorText: 'text-indigo-800',
    badgeClass: 'bg-indigo-100 text-indigo-800 border-indigo-200',
    indicatorDot: 'bg-indigo-500',
    accentColor: '#6366f1',
  },
  custom: {
    id: 'custom',
    label: 'Personalizat',
    defaultStart: '09:00',
    defaultEnd: '17:00',
    colorBg: 'bg-emerald-50',
    colorBorder: 'border-emerald-300',
    colorText: 'text-emerald-800',
    badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    indicatorDot: 'bg-emerald-500',
    accentColor: '#10b981',
  },
};

export const MAX_STANDARD_WEEKLY_HOURS = 40;
