export const SHIFT_COLORS = {
  emerald: {
    id: 'emerald',
    label: 'Verde',
    colorBg: 'bg-emerald-50',
    colorBorder: 'border-emerald-300',
    colorText: 'text-emerald-800',
    indicatorDot: 'bg-emerald-500',
    hex: '#10b981',
  },
  sky: {
    id: 'sky',
    label: 'Albastru',
    colorBg: 'bg-sky-50',
    colorBorder: 'border-sky-300',
    colorText: 'text-sky-800',
    indicatorDot: 'bg-sky-500',
    hex: '#0284c7',
  },
  amber: {
    id: 'amber',
    label: 'Galben',
    colorBg: 'bg-amber-50',
    colorBorder: 'border-amber-300',
    colorText: 'text-amber-800',
    indicatorDot: 'bg-amber-500',
    hex: '#f59e0b',
  },
  indigo: {
    id: 'indigo',
    label: 'Indigo',
    colorBg: 'bg-indigo-50',
    colorBorder: 'border-indigo-300',
    colorText: 'text-indigo-800',
    indicatorDot: 'bg-indigo-500',
    hex: '#6366f1',
  },
  purple: {
    id: 'purple',
    label: 'Violet',
    colorBg: 'bg-purple-50',
    colorBorder: 'border-purple-300',
    colorText: 'text-purple-800',
    indicatorDot: 'bg-purple-500',
    hex: '#a855f7',
  },
  rose: {
    id: 'rose',
    label: 'Roșu',
    colorBg: 'bg-rose-50',
    colorBorder: 'border-rose-300',
    colorText: 'text-rose-800',
    indicatorDot: 'bg-rose-500',
    hex: '#f43f5e',
  },
  teal: {
    id: 'teal',
    label: 'Turcoaz',
    colorBg: 'bg-teal-50',
    colorBorder: 'border-teal-300',
    colorText: 'text-teal-800',
    indicatorDot: 'bg-teal-500',
    hex: '#14b8a6',
  },
  orange: {
    id: 'orange',
    label: 'Portocaliu',
    colorBg: 'bg-orange-50',
    colorBorder: 'border-orange-300',
    colorText: 'text-orange-800',
    indicatorDot: 'bg-orange-500',
    hex: '#f97316',
  },
};

// Șabloane de bază standard
export const BASE_DEFAULT_TEMPLATES = [
  {
    id: 'morning',
    name: 'Dimineață',
    start_time: '08:00',
    end_time: '16:00',
    color: 'amber',
    isSystem: true,
  },
  {
    id: 'afternoon',
    name: 'După-amiază',
    start_time: '14:00',
    end_time: '22:00',
    color: 'sky',
    isSystem: true,
  },
  {
    id: 'night',
    name: 'Noapte',
    start_time: '22:00',
    end_time: '06:00',
    color: 'indigo',
    isSystem: true,
  },
  {
    id: 'full_day_12h',
    name: 'Tură 12h Zi',
    start_time: '08:00',
    end_time: '20:00',
    color: 'purple',
    isSystem: false,
  },
  {
    id: 'short_4h',
    name: 'Part-Time 4h',
    start_time: '09:00',
    end_time: '13:00',
    color: 'teal',
    isSystem: false,
  },
];

/**
 * Returnează configurarea vizuală și eticheta pentru o tură
 */
export function resolveShiftStyleAndLabel(shift, allTemplates = []) {
  const typeId = shift?.shift_type;
  
  // 1. Căutare în șabloanele existente după ID
  const matchedById = allTemplates.find((t) => t.id === typeId);
  if (matchedById) {
    const colorCfg = SHIFT_COLORS[matchedById.color] || SHIFT_COLORS.emerald;
    return {
      label: matchedById.name,
      colorBg: colorCfg.colorBg,
      colorBorder: colorCfg.colorBorder,
      colorText: colorCfg.colorText,
      indicatorDot: colorCfg.indicatorDot,
      colorId: matchedById.color,
    };
  }

  // 2. Căutare după ore start/end dacă typeId este 'custom'
  const startTimeShort = (shift?.start_time || '').slice(0, 5);
  const endTimeShort = (shift?.end_time || '').slice(0, 5);
  const matchedByHours = allTemplates.find(
    (t) => t.start_time.slice(0, 5) === startTimeShort && t.end_time.slice(0, 5) === endTimeShort
  );
  if (matchedByHours) {
    const colorCfg = SHIFT_COLORS[matchedByHours.color] || SHIFT_COLORS.emerald;
    return {
      label: matchedByHours.name,
      colorBg: colorCfg.colorBg,
      colorBorder: colorCfg.colorBorder,
      colorText: colorCfg.colorText,
      indicatorDot: colorCfg.indicatorDot,
      colorId: matchedByHours.color,
    };
  }

  // 3. Tipuri de bază standard
  if (typeId === 'morning') {
    const c = SHIFT_COLORS.amber;
    return { label: 'Dimineață', colorBg: c.colorBg, colorBorder: c.colorBorder, colorText: c.colorText, indicatorDot: c.indicatorDot, colorId: 'amber' };
  }
  if (typeId === 'afternoon') {
    const c = SHIFT_COLORS.sky;
    return { label: 'După-amiază', colorBg: c.colorBg, colorBorder: c.colorBorder, colorText: c.colorText, indicatorDot: c.indicatorDot, colorId: 'sky' };
  }
  if (typeId === 'night') {
    const c = SHIFT_COLORS.indigo;
    return { label: 'Noapte', colorBg: c.colorBg, colorBorder: c.colorBorder, colorText: c.colorText, indicatorDot: c.indicatorDot, colorId: 'indigo' };
  }

  // Fallback: Personalizat
  const def = SHIFT_COLORS.emerald;
  return {
    label: shift?.label || 'Personalizat',
    colorBg: def.colorBg,
    colorBorder: def.colorBorder,
    colorText: def.colorText,
    indicatorDot: def.indicatorDot,
    colorId: 'emerald',
  };
}
