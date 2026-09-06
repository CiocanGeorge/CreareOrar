import React from 'react';
import { SHIFT_TYPES } from '../../utils/dateConstants';
import { AlertTriangle, Clock } from 'lucide-react';

export function ShiftBadge({ shiftType }) {
  const typeConfig = SHIFT_TYPES[shiftType] || SHIFT_TYPES.custom;

  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium border ${typeConfig.badgeClass}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${typeConfig.indicatorDot}`} />
      {typeConfig.label}
    </span>
  );
}

export function HoursBadge({ hours, showWarning = true }) {
  const isOver = hours > 40;

  if (isOver && showWarning) {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-100 text-rose-800 border border-rose-200 animate-pulse">
        <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
        {hours}h (Depășire normă!)
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200">
      <Clock className="w-3 h-3 text-slate-500" />
      {hours}h
    </span>
  );
}
