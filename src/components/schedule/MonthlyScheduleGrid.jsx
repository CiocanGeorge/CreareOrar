import { getDaysInMonth, calculateEmployeeMonthlyHours } from '../../utils/monthCalculations';
import { calculateShiftHours, formatTimeShort } from '../../utils/timeCalculations';
import { resolveShiftStyleAndLabel } from '../../utils/shiftTemplateHelpers';
import { Plus, RotateCcw, Clock, AlertTriangle } from 'lucide-react';

export default function MonthlyScheduleGrid({ 
  year, 
  month, 
  employees = [], 
  shifts = [], 
  missingHours = [],
  templates = [],
  selectedEmployeeFilter = 'all',
  onEditShift, 
  onAddShiftForDate 
}) {
  const days = getDaysInMonth(year, month);

  // Filtrare angajați dacă este selectat unul anume
  const visibleEmployees = selectedEmployeeFilter === 'all'
    ? employees
    : employees.filter((e) => e.id === selectedEmployeeFilter);

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden">
      <div className="overflow-x-auto max-h-[72vh] overflow-y-auto">
        <table className="w-full border-collapse text-xs select-none">
          {/* Table Header: Days of the Month (1..28/30/31) */}
          <thead className="sticky top-0 z-20 bg-slate-50 shadow-xs">
            <tr className="border-b border-slate-200 text-slate-600 font-semibold">
              <th className="py-3 px-4 text-left w-52 min-w-[200px] sticky left-0 z-30 bg-slate-50 border-r border-slate-200">
                Angajat
              </th>
              {days.map((day) => (
                <th
                  key={day.dateString}
                  className={`py-2 px-1 text-center min-w-[46px] border-r border-slate-200/80 last:border-r-0 ${
                    day.isToday 
                      ? 'bg-emerald-100/70 text-emerald-900 font-bold' 
                      : day.isWeekend 
                      ? 'bg-slate-100/60 text-slate-400' 
                      : 'text-slate-600'
                  }`}
                >
                  <div className="text-[10px] uppercase font-bold tracking-tight">{day.dayNameShort}</div>
                  <div className={`text-xs mt-0.5 inline-flex items-center justify-center w-5 h-5 rounded-full ${
                    day.isToday ? 'bg-emerald-600 text-white font-bold' : 'font-semibold text-slate-800'
                  }`}>
                    {day.dayNumber}
                  </div>
                </th>
              ))}
              <th className="py-3 px-3 text-center min-w-[100px] sticky right-0 z-30 bg-slate-50 border-l border-slate-200 font-bold">
                Total Lună
              </th>
            </tr>
          </thead>

          {/* Table Body: Employees Rows */}
          <tbody className="divide-y divide-slate-100">
            {visibleEmployees.map((emp) => {
              // Ore lipsă de recuperat pentru acest angajat
              const empMissing = missingHours.filter(
                (m) => m.employee_id === emp.id && m.status !== 'recovered'
              );
              const pendingRecoveryHours = Math.round(
                empMissing.reduce((acc, m) => {
                  const diff = (parseFloat(m.hours_missed) || 0) - (parseFloat(m.hours_recovered) || 0);
                  return acc + Math.max(0, diff);
                }, 0) * 10
              ) / 10;

              const monthlyHours = calculateEmployeeMonthlyHours(emp.id, shifts, year, month);

              return (
                <tr key={emp.id} className="hover:bg-slate-50/50 transition-colors group">
                  {/* Sticky Employee Column */}
                  <td className="py-2.5 px-3 sticky left-0 z-10 bg-white group-hover:bg-slate-50/90 border-r border-slate-200 shadow-xs">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-emerald-600 text-white font-bold flex items-center justify-center text-[11px] uppercase flex-shrink-0 shadow-xs">
                        {emp.first_name[0]}{emp.last_name[0]}
                      </div>
                      <div className="min-w-0">
                        <div className="font-semibold text-slate-900 truncate text-xs leading-tight">
                          {emp.first_name} {emp.last_name}
                        </div>
                        <div className="text-[10px] text-slate-400 truncate">
                          {emp.role || 'Angajat'}
                        </div>
                        {pendingRecoveryHours > 0 && (
                          <span 
                            title="Ore lipsă de recuperat"
                            className="inline-flex items-center gap-0.5 text-[9px] font-bold text-amber-800 bg-amber-50 px-1 py-0.2 rounded border border-amber-200 mt-0.5"
                          >
                            <RotateCcw className="w-2.5 h-2.5 text-amber-600" />
                            {pendingRecoveryHours}h rec
                          </span>
                        )}
                      </div>
                    </div>
                  </td>

                  {/* Day Cells (1..31) */}
                  {days.map((day) => {
                    // Căutăm turele atribuite strict pe această dată exactă
                    const dayShifts = shifts.filter((s) => {
                      if (s.employee_id !== emp.id) return false;
                      if (s.shift_date) {
                        return s.shift_date === day.dateString;
                      }
                      return false;
                    });

                    return (
                      <td
                        key={day.dateString}
                        className={`p-1 align-middle text-center border-r border-slate-200/60 last:border-r-0 h-14 relative ${
                          day.isToday 
                            ? 'bg-emerald-50/30' 
                            : day.isWeekend 
                            ? 'bg-slate-50/40' 
                            : ''
                        }`}
                      >
                        <div className="flex flex-col items-center justify-center gap-1 h-full relative group/cell">
                          {dayShifts.map((shift) => {
                            const typeCfg = resolveShiftStyleAndLabel(shift, templates);
                            const hours = calculateShiftHours(shift.start_time, shift.end_time);

                            return (
                              <div
                                key={shift.id}
                                onClick={() => onEditShift(shift)}
                                title={`${typeCfg.label}: ${formatTimeShort(shift.start_time)} - ${formatTimeShort(shift.end_time)} (${hours}h)`}
                                className={`w-full py-1 px-0.5 rounded-md text-[10px] font-bold cursor-pointer transition-transform hover:scale-105 shadow-2xs border ${typeCfg.colorBg} ${typeCfg.colorBorder} ${typeCfg.colorText}`}
                              >
                                <div>{hours}h</div>
                                {hours > 8 && (
                                  <div className="text-[8px] font-black text-emerald-700 leading-none">
                                    +{Math.round((hours - 8) * 10) / 10}h
                                  </div>
                                )}
                              </div>
                            );
                          })}

                          {/* Quick Add Button (+) on empty cell hover */}
                          {dayShifts.length === 0 && (
                            <button
                              type="button"
                              onClick={() => onAddShiftForDate(emp.id, day.dateString, day.dayOfWeek)}
                              title={`Adaugă tură pentru ${emp.first_name} pe ${day.dayNumber} ${day.dayNameShort}`}
                              className="w-full h-8 rounded border border-dashed border-slate-200 opacity-0 group-hover/cell:opacity-100 hover:border-emerald-400 hover:bg-emerald-50/70 text-slate-400 hover:text-emerald-700 flex items-center justify-center transition-all"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      </td>
                    );
                  })}

                  {/* Sticky Monthly Total Column */}
                  <td className="py-2 px-3 text-center align-middle sticky right-0 z-10 bg-slate-50 group-hover:bg-slate-100/80 border-l border-slate-200">
                    <div className="flex flex-col items-center justify-center">
                      <span className="font-black text-slate-800 text-xs px-2 py-0.5 rounded-md bg-white border border-slate-200 shadow-2xs">
                        {monthlyHours}h
                      </span>
                      <span className="text-[10px] text-slate-400 mt-0.5">
                        {Math.round((monthlyHours / 160) * 100)}% normă
                      </span>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
