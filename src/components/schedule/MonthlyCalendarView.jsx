import React from 'react';
import { DAYS_OF_WEEK } from '../../utils/dateConstants';
import { getCalendarMatrix } from '../../utils/monthCalculations';
import { calculateShiftHours, formatTimeShort } from '../../utils/timeCalculations';
import { resolveShiftStyleAndLabel } from '../../utils/shiftTemplateHelpers';
import { Plus } from 'lucide-react';

export default function MonthlyCalendarView({ 
  year, 
  month, 
  employees = [], 
  shifts = [], 
  templates = [],
  selectedEmployeeFilter = 'all',
  onEditShift, 
  onAddShiftForDate 
}) {
  const weeks = getCalendarMatrix(year, month);

  // Filtrare angajați
  const visibleEmployees = selectedEmployeeFilter === 'all'
    ? employees
    : employees.filter((e) => e.id === selectedEmployeeFilter);

  const visibleEmployeeIds = new Set(visibleEmployees.map((e) => e.id));

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden">
      {/* Weekday headers: Luni ... Duminică */}
      <div className="grid grid-cols-7 bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-600 text-center">
        {DAYS_OF_WEEK.map((d) => (
          <div key={d.id} className="py-2.5 border-r border-slate-200 last:border-r-0">
            <span>{d.name}</span>
          </div>
        ))}
      </div>

      {/* Calendar Days Matrix */}
      <div className="divide-y divide-slate-200">
        {weeks.map((week, wIdx) => (
          <div key={wIdx} className="grid grid-cols-7 divide-x divide-slate-200 min-h-[110px]">
            {week.map((day) => {
              // Găsim turele din această zi aparținând angajaților vizibili
              const dayShifts = shifts.filter((s) => {
                if (!visibleEmployeeIds.has(s.employee_id)) return false;
                if (s.shift_date) {
                  return s.shift_date === day.dateString;
                }
                return false;
              });

              return (
                <div
                  key={day.dateString}
                  className={`p-1.5 flex flex-col justify-between transition-colors relative group ${
                    day.isPadding 
                      ? 'bg-slate-50/50 opacity-40' 
                      : day.isToday 
                      ? 'bg-emerald-50/25' 
                      : day.isWeekend 
                      ? 'bg-slate-50/30' 
                      : 'bg-white'
                  }`}
                >
                  {/* Day header */}
                  <div className="flex items-center justify-between mb-1">
                    <span
                      className={`text-xs font-bold inline-flex items-center justify-center w-6 h-6 rounded-full ${
                        day.isToday
                          ? 'bg-emerald-600 text-white shadow-xs'
                          : 'text-slate-700'
                      }`}
                    >
                      {day.dayNumber}
                    </span>

                    {!day.isPadding && (
                      <button
                        type="button"
                        onClick={() => onAddShiftForDate(employees[0]?.id, day.dateString, day.dayOfWeek)}
                        title={`Adaugă tură pe ${day.dayNumber}`}
                        className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-emerald-700 hover:bg-emerald-50 rounded transition-all"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  {/* Shift pills */}
                  <div className="space-y-1 flex-1 overflow-y-auto max-h-24">
                    {dayShifts.map((shift) => {
                      const emp = employees.find((e) => e.id === shift.employee_id);
                      const typeCfg = resolveShiftStyleAndLabel(shift, templates);
                      const hours = calculateShiftHours(shift.start_time, shift.end_time);

                      return (
                        <div
                          key={shift.id}
                          onClick={() => onEditShift(shift)}
                          title={`${emp?.first_name || 'Angajat'}: ${formatTimeShort(shift.start_time)}-${formatTimeShort(shift.end_time)} (${hours}h)`}
                          className={`p-1 rounded text-[10px] font-semibold border cursor-pointer hover:shadow-2xs transition-all ${typeCfg.colorBg} ${typeCfg.colorBorder} ${typeCfg.colorText}`}
                        >
                          <div className="flex items-center justify-between truncate">
                            <span className="truncate">{emp ? `${emp.first_name} ${emp.last_name[0]}.` : 'Angajat'}</span>
                            <span className="font-bold ml-1">{hours}h</span>
                          </div>
                          {hours > 8 && (
                            <div className="text-[8px] font-black text-emerald-700 leading-none mt-0.5">
                              +{Math.round((hours - 8) * 10) / 10}h recuperat
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
