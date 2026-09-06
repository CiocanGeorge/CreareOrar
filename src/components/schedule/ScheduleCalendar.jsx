import React, { useState } from 'react';
import { DAYS_OF_WEEK } from '../../utils/dateConstants';
import { 
  calculateShiftHours, 
  formatTimeShort, 
  isOvertime,
  getEmployeeOvertimeStatus,
  getTodayDayOfWeek
} from '../../utils/timeCalculations';
import { getWeekDaysForDate } from '../../utils/monthCalculations';
import { resolveShiftStyleAndLabel } from '../../utils/shiftTemplateHelpers';
import { 
  Plus, 
  Filter, 
  Calendar as CalendarIcon, 
  Clock, 
  AlertTriangle, 
  RotateCcw,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

export default function ScheduleCalendar({ 
  employees = [], 
  shifts = [], 
  missingHours = [],
  templates = [],
  onAddShift, 
  onEditShift, 
  onAddShiftForCell 
}) {
  const [selectedEmployeeFilter, setSelectedEmployeeFilter] = useState('all');
  const [selectedWeekDate, setSelectedWeekDate] = useState(new Date());

  const todayDay = getTodayDayOfWeek();
  const weekDays = getWeekDaysForDate(selectedWeekDate);
  const weekDatesList = weekDays.map((d) => d.dateString);

  // Filtrare angajați dacă este selectat unul specific
  const visibleEmployees = selectedEmployeeFilter === 'all'
    ? employees
    : employees.filter((e) => e.id === selectedEmployeeFilter);

  // Turele aparținând acestei săptămâni
  const weekShifts = shifts.filter((s) => s.shift_date && weekDatesList.includes(s.shift_date));

  // Calculează totalul general de ore programate pe echipă în această săptămână
  const totalTeamHours = weekShifts.reduce(
    (acc, s) => acc + calculateShiftHours(s.start_time, s.end_time),
    0
  );

  const calculateEmployeeHoursInThisWeek = (empId) => {
    const empWeekShifts = weekShifts.filter((s) => s.employee_id === empId);
    return Math.round(empWeekShifts.reduce((acc, s) => acc + calculateShiftHours(s.start_time, s.end_time), 0) * 10) / 10;
  };

  // Angajați cu avertisment depășire 40h în această săptămână (fără ore de recuperat)
  const overtimeCount = employees.filter((e) => {
    const status = getEmployeeOvertimeStatus(e.id, weekShifts, missingHours);
    return status.isOvertime;
  }).length;

  const handlePrevWeek = () => {
    const d = new Date(selectedWeekDate);
    d.setDate(d.getDate() - 7);
    setSelectedWeekDate(d);
  };

  const handleNextWeek = () => {
    const d = new Date(selectedWeekDate);
    d.setDate(d.getDate() + 7);
    setSelectedWeekDate(d);
  };

  const handleCurrentWeek = () => {
    setSelectedWeekDate(new Date());
  };

  return (
    <div className="space-y-6">
      {/* Control Bar: Filter by employee, Shift legends, Add shift button */}
      <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
        {/* Left: Filter & Stats */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-400" />
            <span className="text-xs font-semibold text-slate-700">Filtrează Angajat:</span>
          </div>
          <select
            value={selectedEmployeeFilter}
            onChange={(e) => setSelectedEmployeeFilter(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <option value="all">Toți Angajații ({employees.length})</option>
            {employees.map((emp) => {
              const h = calculateEmployeeHoursInThisWeek(emp.id);
              return (
                <option key={emp.id} value={emp.id}>
                  {emp.first_name} {emp.last_name} ({h}h)
                </option>
              );
            })}
          </select>

          {/* Quick chip status */}
          <div className="hidden sm:flex items-center gap-2 pl-2 border-l border-slate-200 text-xs">
            <span className="text-slate-500">Total săptămână:</span>
            <span className="font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded-md">
              {Math.round(totalTeamHours * 10) / 10}h
            </span>
            {overtimeCount > 0 && (
              <span className="inline-flex items-center gap-1 font-semibold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-200 animate-pulse">
                <AlertTriangle className="w-3.5 h-3.5 text-rose-500" />
                {overtimeCount} {overtimeCount === 1 ? 'angajat >40h' : 'angajați >40h'}
              </span>
            )}
          </div>
        </div>

        {/* Center: Week Navigator */}
        <div className="flex items-center gap-1 bg-slate-50 p-1 rounded-xl border border-slate-200">
          <button
            type="button"
            onClick={handlePrevWeek}
            className="p-1 text-slate-600 hover:text-slate-900 hover:bg-white rounded-lg transition-colors"
            title="Săptămâna precedentă"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-xs font-bold text-slate-800 px-2 min-w-[130px] text-center">
            {weekDays[0].formattedDate} - {weekDays[6].formattedDate}
          </span>
          <button
            type="button"
            onClick={handleNextWeek}
            className="p-1 text-slate-600 hover:text-slate-900 hover:bg-white rounded-lg transition-colors"
            title="Săptămâna următoare"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={handleCurrentWeek}
            className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-1 rounded-lg border border-emerald-200 hover:bg-emerald-100 transition-colors ml-1"
          >
            Săpt. Curentă
          </button>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <button
            type="button"
            onClick={onAddShift}
            className="ml-auto lg:ml-2 inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-xs rounded-xl shadow-md shadow-emerald-600/20 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Adaugă Tură</span>
          </button>
        </div>
      </div>

      {/* Grid Calendar Table */}
      {visibleEmployees.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-dashed border-slate-200">
          <CalendarIcon className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-slate-800 mb-1">Niciun angajat selectat</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Adaugă angajați în secțiunea „Angajați” pentru a începe planificarea programului de lucru.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse min-w-[920px]">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-xs text-slate-600 font-semibold">
                  <th className="py-3 px-4 text-left w-52 sticky left-0 bg-slate-50 z-10 border-r border-slate-200">
                    Membru Echipă
                  </th>
                  {weekDays.map((day) => {
                    const isToday = day.isToday;
                    return (
                      <th
                        key={day.dayOfWeek}
                        className={`py-3 px-2 text-center border-r border-slate-200 last:border-r-0 ${
                          isToday ? 'bg-emerald-50/80 text-emerald-900 font-bold' : ''
                        } ${day.isWeekend ? 'bg-slate-100/50' : ''}`}
                      >
                        <div className="flex items-center justify-center gap-1.5">
                          <span>{day.dayName}</span>
                          {isToday && (
                            <span className="px-1.5 py-0.2 bg-emerald-600 text-white text-[9px] font-bold rounded uppercase">
                              Azi
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] font-semibold text-slate-500 block mt-0.5">
                          {day.formattedDate}
                        </span>
                      </th>
                    );
                  })}
                  <th className="py-3 px-4 text-center w-36 bg-slate-50 font-bold border-l border-slate-200">
                    Ore / Săptămână
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-xs">
                {visibleEmployees.map((emp) => {
                  const empStatus = getEmployeeOvertimeStatus(emp.id, weekShifts, missingHours);
                  const weeklyHours = empStatus.totalHours;
                  const hasOvertime = empStatus.isOvertime;

                  // Ore de recuperat
                  const empMissing = missingHours.filter(
                    (m) => m.employee_id === emp.id && m.status !== 'recovered'
                  );
                  const pendingRecoveryHours = Math.round(
                    empMissing.reduce((acc, m) => {
                      const diff = (parseFloat(m.hours_missed) || 0) - (parseFloat(m.hours_recovered) || 0);
                      return acc + Math.max(0, diff);
                    }, 0) * 10
                  ) / 10;

                  return (
                    <tr key={emp.id} className="hover:bg-slate-50/40 transition-colors">
                      {/* Employee Column (sticky left) */}
                      <td className="py-3 px-4 sticky left-0 bg-white z-10 border-r border-slate-200 shadow-xs">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white font-bold flex items-center justify-center text-xs uppercase flex-shrink-0 shadow-xs">
                            {emp.first_name[0]}{emp.last_name[0]}
                          </div>
                          <div className="min-w-0">
                            <div className="font-semibold text-slate-800 truncate">
                              {emp.first_name} {emp.last_name}
                            </div>
                            <div className="text-[11px] text-slate-600 truncate">
                              {emp.role || 'Angajat'}
                            </div>
                            {pendingRecoveryHours > 0 && (
                              <span 
                                title="Acest angajat are ore lipsă ce trebuie recuperate"
                                className="inline-flex items-center gap-1 text-[9px] font-bold text-amber-800 bg-amber-100/80 px-1.5 py-0.5 rounded border border-amber-300 mt-0.5"
                              >
                                <RotateCcw className="w-2.5 h-2.5 text-amber-600" />
                                {pendingRecoveryHours}h recuperat
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Day Columns */}
                      {weekDays.map((day) => {
                        const dayShifts = shifts.filter((s) => {
                          if (s.employee_id !== emp.id) return false;
                          if (s.shift_date) {
                            return s.shift_date === day.dateString;
                          }
                          return false;
                        });
                        const isToday = day.isToday;

                        return (
                          <td
                            key={day.dayOfWeek}
                            className={`p-1.5 align-top border-r border-slate-200/80 last:border-r-0 min-w-[105px] h-24 transition-colors ${
                              isToday ? 'bg-emerald-50/20' : ''
                            } ${day.isWeekend ? 'bg-slate-50/30' : ''}`}
                          >
                            <div className="flex flex-col h-full justify-between gap-1 group">
                              {/* Shift Cards in this cell */}
                              <div className="space-y-1">
                                {dayShifts.map((shift) => {
                                  const typeCfg = resolveShiftStyleAndLabel(shift, templates);
                                  const hours = calculateShiftHours(shift.start_time, shift.end_time);

                                  return (
                                    <div
                                      key={shift.id}
                                      onClick={() => onEditShift(shift)}
                                      title="Click pentru detalii sau editare"
                                      className={`p-1.5 rounded-lg border cursor-pointer hover:scale-[1.02] hover:shadow-xs transition-all ${typeCfg.colorBg} ${typeCfg.colorBorder} ${typeCfg.colorText}`}
                                    >
                                      <div className="flex items-center justify-between gap-1 text-[10px] font-bold">
                                        <div className="flex items-center gap-1">
                                          <span className={`w-1.5 h-1.5 rounded-full ${typeCfg.indicatorDot}`} />
                                          <span className="truncate">{typeCfg.label}</span>
                                        </div>
                                        <span className="opacity-80">{hours}h</span>
                                      </div>
                                      <div className="text-[11px] font-medium tracking-tight mt-0.5 text-slate-700">
                                        {formatTimeShort(shift.start_time)} - {formatTimeShort(shift.end_time)}
                                      </div>
                                      {hours > 8 && (
                                        <div className="text-[9px] font-bold text-emerald-700 flex items-center gap-0.5 mt-0.5 bg-emerald-100/60 px-1 py-0.2 rounded w-fit">
                                          <span>+{Math.round((hours - 8) * 10) / 10}h recuperare</span>
                                        </div>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>

                              {/* Quick add shift button (+) on cell hover or empty */}
                              <button
                                type="button"
                                onClick={() => onAddShiftForCell(emp.id, day.dayOfWeek, day.dateString)}
                                title={`Adaugă tură pentru ${emp.first_name} în ziua de ${day.dayName} (${day.formattedDate})`}
                                className={`w-full py-1 rounded-md border border-dashed text-slate-600 hover:text-emerald-700 hover:border-emerald-300 hover:bg-emerald-50/60 flex items-center justify-center gap-1 text-[10px] font-medium transition-all ${
                                  dayShifts.length === 0
                                    ? 'opacity-30 group-hover:opacity-100 border-slate-300'
                                    : 'opacity-0 group-hover:opacity-100 border-emerald-200'
                                }`}
                              >
                                <Plus className="w-3 h-3" />
                                <span>Adaugă</span>
                              </button>
                            </div>
                          </td>
                        );
                      })}

                      {/* Total Weekly Hours Column */}
                      <td className="py-3 px-4 text-center align-middle border-l border-slate-200 bg-slate-50/40">
                        <div className="flex flex-col items-center justify-center gap-1">
                          <span
                            className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold ${
                              hasOvertime
                                ? 'bg-rose-100 text-rose-800 border border-rose-200 animate-pulse'
                                : weeklyHours > 0
                                ? 'bg-emerald-100/70 text-emerald-800 border border-emerald-200'
                                : 'bg-slate-100 text-slate-600'
                            }`}
                          >
                            <Clock className="w-3 h-3" />
                            {weeklyHours}h
                          </span>

                          {/* Progress bar up to 40h bazat pe orele efective */}
                          <div className="w-24 bg-slate-200 rounded-full h-1.5 overflow-hidden mt-1">
                            <div
                              className={`h-full rounded-full ${
                                hasOvertime ? 'bg-rose-500' : 'bg-emerald-500'
                              }`}
                              style={{ width: `${Math.min(100, (empStatus.effectiveHours / 40) * 100)}%` }}
                            />
                          </div>

                          {/* 40h warning tag doar dacă depășește FĂRĂ orele de recuperat */}
                          {hasOvertime && (
                            <span className="text-[10px] font-bold text-rose-600 flex items-center gap-0.5 mt-0.5">
                              <AlertTriangle className="w-3 h-3 text-rose-500" />
                              &gt;40h (+{empStatus.extraHours}h)
                            </span>
                          )}

                          {/* Tag recuperare dacă totalul brut >40h dar orele sunt de recuperat */}
                          {!hasOvertime && empStatus.recoveryDeducted > 0 && weeklyHours > 40 && (
                            <span className="text-[10px] font-semibold text-amber-700 flex items-center gap-0.5 mt-0.5" title="Orele peste 40 compensează ore lipsă de recuperat">
                              <RotateCcw className="w-3 h-3 text-amber-600" />
                              +{empStatus.recoveryDeducted}h recuperare
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
