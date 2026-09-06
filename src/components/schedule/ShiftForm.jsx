import React, { useState, useEffect } from 'react';
import Modal from '../common/Modal';
import { DAYS_OF_WEEK } from '../../utils/dateConstants';
import { calculateShiftHours, formatTimeShort } from '../../utils/timeCalculations';
import { 
  Clock, 
  Calendar, 
  User, 
  AlertTriangle, 
  Trash2, 
  Loader2, 
  Sparkles, 
  CheckCircle2, 
  Plus, 
  Check, 
  X,
  Sliders
} from 'lucide-react';
import { getDayOfWeekFromDate, getWeekDaysForDate, DAYS_NAMES_RO } from '../../utils/monthCalculations';
import { SHIFT_COLORS, BASE_DEFAULT_TEMPLATES } from '../../utils/shiftTemplateHelpers';

export default function ShiftForm({ 
  isOpen, 
  onClose, 
  onSave, 
  onDelete, 
  shiftToEdit, 
  employees = [], 
  shifts = [],
  missingHours = [],
  templates = [],
  onAddTemplate = null,
  preselectedEmployeeId = null,
  preselectedDay = null,
  preselectedDate = null,
}) {
  const [employeeId, setEmployeeId] = useState('');
  const [shiftDate, setShiftDate] = useState(new Date().toISOString().split('T')[0]);
  const [dayOfWeek, setDayOfWeek] = useState(0);
  const [shiftType, setShiftType] = useState('morning');
  const [startTime, setStartTime] = useState('08:00');
  const [endTime, setEndTime] = useState('16:00');
  const [autoCompensate, setAutoCompensate] = useState(true);
  const [applyWholeWeek, setApplyWholeWeek] = useState(false);
  const [selectedWeekDays, setSelectedWeekDays] = useState([0, 1, 2, 3, 4]); // Luni - Vineri implicit
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Stare pentru creator rapid de tură personalizată
  const [isCreatingTemplate, setIsCreatingTemplate] = useState(false);
  const [newTplName, setNewTplName] = useState('');
  const [newTplStart, setNewTplStart] = useState('07:00');
  const [newTplEnd, setNewTplEnd] = useState('19:00');
  const [newTplColor, setNewTplColor] = useState('purple');
  const [tplError, setTplError] = useState('');

  const activeTemplates = templates.length > 0 ? templates : BASE_DEFAULT_TEMPLATES;

  useEffect(() => {
    if (shiftToEdit) {
      setEmployeeId(shiftToEdit.employee_id || '');
      const initialDate = shiftToEdit.shift_date || new Date().toISOString().split('T')[0];
      setShiftDate(initialDate);
      setDayOfWeek(shiftToEdit.day_of_week ?? getDayOfWeekFromDate(initialDate));
      setShiftType(shiftToEdit.shift_type || 'custom');
      setStartTime(formatTimeShort(shiftToEdit.start_time) || '08:00');
      setEndTime(formatTimeShort(shiftToEdit.end_time) || '16:00');
      setApplyWholeWeek(false);
    } else {
      setEmployeeId(preselectedEmployeeId || (employees[0]?.id || ''));
      const initialDate = preselectedDate || new Date().toISOString().split('T')[0];
      setShiftDate(initialDate);
      const computedDow = preselectedDay !== null && preselectedDay !== undefined 
        ? preselectedDay 
        : getDayOfWeekFromDate(initialDate);
      setDayOfWeek(computedDow);
      setShiftType('morning');
      setStartTime('08:00');
      setEndTime('16:00');
      setApplyWholeWeek(false);
      setSelectedWeekDays([0, 1, 2, 3, 4]);
    }
    setAutoCompensate(true);
    setError('');
    setIsCreatingTemplate(false);
    setTplError('');
  }, [shiftToEdit, isOpen, preselectedEmployeeId, preselectedDay, preselectedDate, employees]);

  // Zilele săptămânii calculate în jurul datei curente
  const weekDays = getWeekDaysForDate(shiftDate);

  const handleDateChange = (newDate) => {
    setShiftDate(newDate);
    if (newDate) {
      setDayOfWeek(getDayOfWeekFromDate(newDate));
    }
  };

  const handleSelectDayOfWeek = (targetDayId) => {
    const targetDay = weekDays.find((wd) => wd.dayOfWeek === targetDayId);
    if (targetDay) {
      setShiftDate(targetDay.dateString);
      setDayOfWeek(targetDay.dayOfWeek);
    } else {
      setDayOfWeek(targetDayId);
    }
  };

  // Schimbare tip tură presetată / șablon
  const handleSelectTemplate = (template) => {
    setShiftType(template.id);
    if (template.start_time && template.end_time) {
      setStartTime(template.start_time.slice(0, 5));
      setEndTime(template.end_time.slice(0, 5));
    }
  };

  // Salvare tură personalizată nouă pe loc
  const handleSaveQuickTemplate = async (e) => {
    e.preventDefault();
    if (!newTplName.trim()) {
      setTplError('Introdu o denumire pentru tura personalizată.');
      return;
    }
    if (!newTplStart || !newTplEnd) {
      setTplError('Orele de început și sfârșit sunt obligatorii.');
      return;
    }

    try {
      if (onAddTemplate) {
        const created = await onAddTemplate({
          name: newTplName.trim(),
          start_time: newTplStart.length === 5 ? `${newTplStart}:00` : newTplStart,
          end_time: newTplEnd.length === 5 ? `${newTplEnd}:00` : newTplEnd,
          color: newTplColor,
        });

        if (created) {
          setShiftType(created.id);
          setStartTime(newTplStart);
          setEndTime(newTplEnd);
        }
      }
      setIsCreatingTemplate(false);
      setNewTplName('');
      setTplError('');
    } catch (err) {
      setTplError(err.message || 'Eroare la crearea șablonului.');
    }
  };

  // Calcul ore tură curentă
  const shiftHours = calculateShiftHours(startTime, endTime);
  const surplusHours = Math.max(0, Math.round((shiftHours - 8) * 10) / 10);

  // Verificare ore lipsă restante pentru angajatul selectat
  const empPendingMissing = missingHours.filter(
    (m) => m.employee_id === employeeId && m.status !== 'recovered'
  );
  const totalMissingToRecover = Math.round(
    empPendingMissing.reduce((acc, m) => {
      const diff = (parseFloat(m.hours_missed) || 0) - (parseFloat(m.hours_recovered) || 0);
      return acc + Math.max(0, diff);
    }, 0) * 10
  ) / 10;
  const recoverableSurplus = Math.min(surplusHours, totalMissingToRecover);

  // Calcul proiecție ore săptămânale pentru angajat strict în săptămâna datei selectate
  const selectedEmployee = employees.find((e) => e.id === employeeId);
  const weekDatesSet = new Set(weekDays.map((d) => d.dateString));
  const existingShiftsInSelectedWeek = shifts.filter(
    (s) => s.employee_id === employeeId && 
           (!shiftToEdit || s.id !== shiftToEdit.id) &&
           (s.shift_date ? weekDatesSet.has(s.shift_date) : false)
  );
  const currentWeeklyHours = existingShiftsInSelectedWeek.reduce(
    (acc, s) => acc + calculateShiftHours(s.start_time, s.end_time),
    0
  );
  const additionalHours = applyWholeWeek ? (shiftHours * selectedWeekDays.length) : shiftHours;
  const projectedWeeklyHours = Math.round((currentWeeklyHours + additionalHours) * 100) / 100;
  const projectedExtra = Math.max(0, projectedWeeklyHours - 40);
  const projectedRecoveryDeducted = Math.min(projectedExtra, totalMissingToRecover);
  const projectedEffectiveHours = Math.round((projectedWeeklyHours - projectedRecoveryDeducted) * 10) / 10;
  const isOvertimeProjected = projectedEffectiveHours > 40;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!employeeId) {
      setError('Te rugăm să selectezi un angajat.');
      return;
    }
    if (!startTime || !endTime) {
      setError('Orele de început și sfârșit sunt obligatorii.');
      return;
    }
    if (applyWholeWeek && !shiftToEdit && selectedWeekDays.length === 0) {
      setError('Te rugăm să selectezi cel puțin o zi din săptămână.');
      return;
    }

    setIsSubmitting(true);
    try {
      if (applyWholeWeek && !shiftToEdit) {
        const selectedDaysList = weekDays
          .filter((wd) => selectedWeekDays.includes(wd.dayOfWeek))
          .map((wd) => ({
            shift_date: wd.dateString,
            day_of_week: wd.dayOfWeek,
            day_name: `${wd.dateString} (${wd.dayName})`,
          }));

        await onSave({
          applyWholeWeek: true,
          selectedDaysList,
          employee_id: employeeId,
          start_time: startTime.length === 5 ? `${startTime}:00` : startTime,
          end_time: endTime.length === 5 ? `${endTime}:00` : endTime,
          shift_type: shiftType,
          autoCompensate: autoCompensate && recoverableSurplus > 0,
          surplusHours: recoverableSurplus,
          total_hours: shiftHours,
        });
      } else {
        await onSave({
          applyWholeWeek: false,
          employee_id: employeeId,
          shift_date: shiftDate,
          day_of_week: parseInt(dayOfWeek, 10),
          start_time: startTime.length === 5 ? `${startTime}:00` : startTime,
          end_time: endTime.length === 5 ? `${endTime}:00` : endTime,
          shift_type: shiftType,
          autoCompensate: autoCompensate && recoverableSurplus > 0,
          surplusHours: recoverableSurplus,
          total_hours: shiftHours,
          day_name: `${shiftDate} (${DAYS_NAMES_RO[dayOfWeek] || 'Zi'})`,
        });
      }
      onClose();
    } catch (err) {
      console.error(err);
      setError(err.message || 'A apărut o eroare la salvarea turei.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={shiftToEdit ? 'Editare Tură de Lucru' : 'Planificare Tură Nouă'}
      maxWidth="max-w-xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-sm flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Angajat */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Angajat <span className="text-rose-500">*</span>
          </label>
          <div className="relative">
            <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <select
              value={employeeId}
              onChange={(e) => setEmployeeId(e.target.value)}
              disabled={employees.length === 0}
              className="w-full pl-9 pr-3 py-2 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
            >
              {employees.length === 0 ? (
                <option value="">Nu există angajați înregistrați</option>
              ) : (
                employees.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.first_name} {emp.last_name} ({emp.role || 'Fără rol'})
                  </option>
                ))
              )}
            </select>
          </div>
        </div>

        {/* Data calendaristică exactă */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Data Calendaristică <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="date"
                value={shiftDate}
                onChange={(e) => handleDateChange(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 font-semibold text-slate-800"
              />
            </div>
          </div>
          <div className="flex flex-col justify-end">
            <div className="text-xs text-slate-700 bg-slate-50 p-2 rounded-xl border border-slate-200 flex items-center justify-between">
              <span>Ziua săptămânii:</span>
              <b className="text-emerald-700 font-bold">{DAYS_NAMES_RO[dayOfWeek]}</b>
            </div>
          </div>
        </div>

        {/* Butoane interactive zile ale săptămânii (sincronizate direct cu data) */}
        {!applyWholeWeek && (
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-semibold text-slate-700">
                Alege ziua din săptămână:
              </label>
              <span className="text-[10px] text-slate-400">Click pentru a muta data</span>
            </div>
            <div className="grid grid-cols-7 gap-1">
              {weekDays.map((wd) => {
                const isSelected = wd.dateString === shiftDate;
                return (
                  <button
                    type="button"
                    key={wd.dayOfWeek}
                    onClick={() => handleSelectDayOfWeek(wd.dayOfWeek)}
                    className={`py-1.5 px-0.5 text-center rounded-xl border text-xs transition-all ${
                      isSelected
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs ring-2 ring-emerald-500/20 font-bold'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50 font-medium'
                    }`}
                  >
                    <div className="text-[11px] leading-tight">{wd.dayNameShort}</div>
                    <div className={`text-[9px] mt-0.5 ${isSelected ? 'text-emerald-100' : 'text-slate-400'}`}>
                      {wd.formattedDate}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Checkbox Opțional: Aplică pe toată săptămâna */}
        {!shiftToEdit && (
          <div className="p-3 rounded-2xl border border-slate-200 bg-slate-50/80 space-y-2.5">
            <label className="flex items-center justify-between cursor-pointer select-none">
              <div className="flex items-center gap-2.5">
                <input
                  type="checkbox"
                  checked={applyWholeWeek}
                  onChange={(e) => setApplyWholeWeek(e.target.checked)}
                  className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-slate-300"
                />
                <div>
                  <span className="text-xs font-bold text-slate-800">
                    Aplică pe toată săptămâna
                  </span>
                  <p className="text-[11px] text-slate-500">
                    {applyWholeWeek
                      ? `Generează ture pentru zilele selectate (${weekDays[0].formattedDate} - ${weekDays[6].formattedDate})`
                      : 'Bifează dacă dorești să programezi această tură pentru mai multe zile din săptămână'}
                  </p>
                </div>
              </div>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                applyWholeWeek 
                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' 
                  : 'bg-slate-200/60 text-slate-600'
              }`}>
                {applyWholeWeek ? `${selectedWeekDays.length} zile alese` : 'Doar o zi'}
              </span>
            </label>

            {applyWholeWeek ? (
              <div className="pt-2 border-t border-slate-200 space-y-2 animate-fadeIn">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-slate-600 font-medium">Zile incluse în săptămână:</span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setSelectedWeekDays([0, 1, 2, 3, 4])}
                      className="text-[10px] font-semibold text-emerald-700 hover:text-emerald-800 underline"
                    >
                      Luni - Vineri (5 zile)
                    </button>
                    <span className="text-slate-300">|</span>
                    <button
                      type="button"
                      onClick={() => setSelectedWeekDays([0, 1, 2, 3, 4, 5, 6])}
                      className="text-[10px] font-semibold text-emerald-700 hover:text-emerald-800 underline"
                    >
                      Toate 7 zilele
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-7 gap-1">
                  {weekDays.map((wd) => {
                    const isChecked = selectedWeekDays.includes(wd.dayOfWeek);
                    return (
                      <button
                        type="button"
                        key={wd.dayOfWeek}
                        onClick={() => {
                          if (isChecked) {
                            if (selectedWeekDays.length === 1) return;
                            setSelectedWeekDays(selectedWeekDays.filter((d) => d !== wd.dayOfWeek));
                          } else {
                            setSelectedWeekDays([...selectedWeekDays, wd.dayOfWeek].sort());
                          }
                        }}
                        className={`py-2 px-0.5 text-center rounded-xl border text-xs font-semibold transition-all ${
                          isChecked
                            ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs ring-2 ring-emerald-500/20'
                            : 'bg-white border-slate-200 text-slate-400 hover:bg-slate-100 hover:text-slate-700'
                        }`}
                      >
                        <div className="text-[11px] font-bold">{wd.dayNameShort}</div>
                        <div className={`text-[9px] mt-0.5 ${isChecked ? 'text-emerald-100' : 'text-slate-400'}`}>
                          {wd.formattedDate}
                        </div>
                      </button>
                    );
                  })}
                </div>

                <div className="text-[11px] text-slate-600 bg-white p-2 rounded-xl border border-slate-200 flex items-center justify-between">
                  <span>Ture create: <b className="text-slate-800">{selectedWeekDays.length} zile</b></span>
                  <span>Total ore adăugate: <b className="text-emerald-700">{selectedWeekDays.length * shiftHours} ore</b></span>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-xs text-emerald-900 bg-emerald-50/70 p-2 rounded-xl border border-emerald-200">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <span>
                  Tura se va programa <b>exclusiv pe ziua de {DAYS_NAMES_RO[dayOfWeek]}, {shiftDate.split('-').reverse().join('.')}</b>.
                </span>
              </div>
            )}
          </div>
        )}

        {/* Tipul de tură (Presets + Ture Personalizate) */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="block text-xs font-semibold text-slate-700">
              Tipul de Tură (Predefinite & Personalizate)
            </label>
            <button
              type="button"
              onClick={() => setIsCreatingTemplate(!isCreatingTemplate)}
              className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100 px-2 py-0.5 rounded-lg border border-emerald-200 transition-colors"
            >
              {isCreatingTemplate ? <X className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
              <span>{isCreatingTemplate ? 'Închide' : '+ Tură Personalizată'}</span>
            </button>
          </div>

          {/* Formular creator rapid de tură personalizată */}
          {isCreatingTemplate && (
            <div className="p-3 mb-2 rounded-2xl bg-emerald-50 border border-emerald-300 space-y-2.5 animate-fadeIn">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-900 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-emerald-600" />
                  Creează Tip Nou de Tură
                </span>
                <span className="text-[10px] text-emerald-700">Va fi salvat pentru refolosire</span>
              </div>

              {tplError && (
                <div className="p-1.5 text-xs text-rose-700 bg-rose-50 rounded-lg border border-rose-200">
                  {tplError}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">Denumire tură:</label>
                  <input
                    type="text"
                    placeholder="ex: Tură 12h, Deschidere"
                    value={newTplName}
                    onChange={(e) => setNewTplName(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-xl bg-white"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">Culoare:</label>
                  <div className="flex items-center gap-1 pt-0.5">
                    {Object.values(SHIFT_COLORS).map((c) => (
                      <button
                        type="button"
                        key={c.id}
                        onClick={() => setNewTplColor(c.id)}
                        className={`w-5 h-5 rounded-md transition-all ${
                          newTplColor === c.id ? 'ring-2 ring-emerald-700 scale-110' : 'opacity-70 hover:opacity-100'
                        }`}
                        style={{ backgroundColor: c.hex }}
                      />
                    ))}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">Start:</label>
                  <input
                    type="time"
                    value={newTplStart}
                    onChange={(e) => setNewTplStart(e.target.value)}
                    className="w-full px-2 py-1 text-xs border border-slate-200 rounded-xl bg-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">Sfârșit:</label>
                  <input
                    type="time"
                    value={newTplEnd}
                    onChange={(e) => setNewTplEnd(e.target.value)}
                    className="w-full px-2 py-1 text-xs border border-slate-200 rounded-xl bg-white"
                  />
                </div>
                <div className="flex items-end">
                  <button
                    type="button"
                    onClick={handleSaveQuickTemplate}
                    className="w-full py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs transition-colors shadow-xs"
                  >
                    Salvează Tipul
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Grid cu toate turele disponibile */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-48 overflow-y-auto pr-1">
            {activeTemplates.map((tpl) => {
              const colorCfg = SHIFT_COLORS[tpl.color] || SHIFT_COLORS.emerald;
              const isSelected = shiftType === tpl.id;
              const h = calculateShiftHours(tpl.start_time, tpl.end_time);

              return (
                <button
                  type="button"
                  key={tpl.id}
                  onClick={() => handleSelectTemplate(tpl)}
                  className={`p-2 rounded-xl border text-left text-xs transition-all ${
                    isSelected
                      ? `${colorCfg.colorBg} ${colorCfg.colorBorder} ring-2 ring-emerald-500 shadow-xs`
                      : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <span className={`w-2 h-2 rounded-full ${colorCfg.indicatorDot}`} />
                    <span className="font-semibold truncate">{tpl.name}</span>
                  </div>
                  <div className="text-[11px] text-slate-500">
                    {tpl.start_time.slice(0, 5)} - {tpl.end_time.slice(0, 5)} ({h}h)
                  </div>
                </button>
              );
            })}

            {/* Opțiune orar complet flexibil */}
            <button
              type="button"
              onClick={() => setShiftType('custom')}
              className={`p-2 rounded-xl border text-left text-xs transition-all ${
                shiftType === 'custom'
                  ? 'bg-emerald-50 border-emerald-300 ring-2 ring-emerald-500 shadow-xs'
                  : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-700'
              }`}
            >
              <div className="flex items-center gap-1.5 mb-0.5">
                <span className="w-2 h-2 rounded-full bg-slate-400" />
                <span className="font-semibold">Orar Flexibil</span>
              </div>
              <div className="text-[11px] text-slate-500">
                Personalizat liber
              </div>
            </button>
          </div>
        </div>

        {/* Ore start / end */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Ora Început <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <Clock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="time"
                value={startTime}
                onChange={(e) => {
                  setStartTime(e.target.value);
                }}
                className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Ora Sfârșit <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <Clock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="time"
                value={endTime}
                onChange={(e) => {
                  setEndTime(e.target.value);
                }}
                className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>
        </div>

        {/* Calcul ore & Avertisment 40h */}
        <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-600">Durată per tură:</span>
            <span className="font-bold text-slate-900 bg-white px-2 py-0.5 rounded border border-slate-200">
              {shiftHours} ore
            </span>
          </div>

          {selectedEmployee && (
            <div className="flex items-center justify-between text-xs pt-1.5 border-t border-slate-200">
              <span className="text-slate-600">
                Proiecție săptămâna {weekDays[0].formattedDate} - {weekDays[6].formattedDate} pentru {selectedEmployee.first_name}:
              </span>
              <span className={`font-bold ${isOvertimeProjected ? 'text-rose-600' : 'text-emerald-700'}`}>
                {projectedWeeklyHours}h programat {projectedRecoveryDeducted > 0 ? `(${projectedEffectiveHours}h efectiv)` : '/ 40h'}
              </span>
            </div>
          )}

          {isOvertimeProjected && (
            <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 flex items-start gap-2 text-xs text-rose-800 animate-fadeIn">
              <AlertTriangle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
              <div>
                <span className="font-bold">Avertisment Depășire Normă!</span>
                <p className="mt-0.5 text-rose-700">
                  Totalul în săptămâna <b>{weekDays[0].formattedDate} - {weekDays[6].formattedDate}</b> va ajunge la <b>{projectedWeeklyHours}h</b> (normă efectivă: <b>{projectedEffectiveHours}h</b>, depășind limita standard de 40 de ore).
                </p>
              </div>
            </div>
          )}

          {!isOvertimeProjected && projectedRecoveryDeducted > 0 && projectedWeeklyHours > 40 && (
            <div className="p-2.5 rounded-lg bg-amber-50 border border-amber-200 flex items-start gap-2 text-xs text-amber-900 animate-fadeIn">
              <RotateCcw className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <span className="font-bold">Ore pentru recuperare ore lipsă</span>
                <p className="mt-0.5 text-amber-800">
                  Totalul de <b>{projectedWeeklyHours}h</b> include <b>{projectedRecoveryDeducted}h</b> alocate recuperării orelor lipsă. Norma efectivă este de <b>{projectedEffectiveHours}h</b>, prin urmare nu se consideră depășire penalizatoare.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Compensare Automată Ore Lipsă dacă tura > 8 ore */}
        {surplusHours > 0 && totalMissingToRecover > 0 && (
          <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-300 space-y-2 text-xs text-emerald-950 animate-fadeIn">
            <div className="flex items-start gap-2">
              <Sparkles className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-emerald-900">Compensare Automată din Ore Lipsă</span>
                <p className="mt-0.5 text-emerald-800">
                  {applyWholeWeek ? (
                    <>Fiecare tură are <b>{shiftHours} ore</b> (+{surplusHours}h surplus). Cele <b>{selectedWeekDays.length} ture</b> vor stinge progresiv din cele {totalMissingToRecover}h restante ale angajatului.</>
                  ) : (
                    <>Această tură are <b>{shiftHours} ore</b> (+{surplusHours}h peste norma de 8h). 
                    <b> {recoverableSurplus} {recoverableSurplus === 1 ? 'oră va fi alocată' : 'ore vor fi alocate'}</b> automat pentru recuperarea orelor lipsă ale angajatului (are {totalMissingToRecover}h restante).</>
                  )}
                </p>
              </div>
            </div>
            <label className="flex items-center gap-2 pt-1.5 border-t border-emerald-200 cursor-pointer font-medium text-emerald-900">
              <input
                type="checkbox"
                checked={autoCompensate}
                onChange={(e) => setAutoCompensate(e.target.checked)}
                className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4"
              />
              <span>Stinge automat din orele lipsă cu surplusul realizat</span>
            </label>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-between pt-3 border-t border-slate-100">
          {shiftToEdit && onDelete ? (
            <button
              type="button"
              onClick={() => {
                onDelete(shiftToEdit.id);
                onClose();
              }}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              Șterge Tura
            </button>
          ) : <div />}

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 rounded-xl transition-colors"
            >
              Anulează
            </button>
            <button
              type="submit"
              disabled={isSubmitting || employees.length === 0}
              className="inline-flex items-center gap-2 px-5 py-2 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition-all shadow-md shadow-emerald-600/20 disabled:opacity-60 font-semibold"
            >
              {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
              {shiftToEdit ? 'Salvează Modificările' : (applyWholeWeek ? `Programează ${selectedWeekDays.length} Ture` : 'Adaugă Tura')}
            </button>
          </div>
        </div>
      </form>
    </Modal>
  );
}
