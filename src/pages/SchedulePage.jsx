import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  fetchEmployees, 
  fetchShifts, 
  fetchMissingHours,
  createShift, 
  createShiftsBulk,
  updateShift, 
  deleteShift,
  compensateMissingHoursFromShift,
  fetchShiftTemplates,
  createShiftTemplate,
  deleteShiftTemplate,
  syncWeeklyOvertimeRecords
} from '../lib/databaseService';
import ScheduleCalendar from '../components/schedule/ScheduleCalendar';
import MonthlyScheduleGrid from '../components/schedule/MonthlyScheduleGrid';
import MonthlyCalendarView from '../components/schedule/MonthlyCalendarView';
import ShiftForm from '../components/schedule/ShiftForm';
import ShiftTemplatesModal from '../components/schedule/ShiftTemplatesModal';
import ExportScheduleModal from '../components/schedule/ExportScheduleModal';
import { MONTH_NAMES_RO, getWeekDaysForDate } from '../utils/monthCalculations';
import { calculateShiftHours } from '../utils/timeCalculations';
import { 
  CalendarDays, 
  ChevronLeft, 
  ChevronRight, 
  RotateCcw, 
  Loader2, 
  Grid3X3, 
  Calendar as CalendarIcon, 
  Table, 
  Filter,
  Plus,
  Clock,
  Sparkles,
  Download
} from 'lucide-react';

export default function SchedulePage() {
  const { user } = useAuth();
  const [employees, setEmployees] = useState([]);
  const [shifts, setShifts] = useState([]);
  const [missingHours, setMissingHours] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);

  // Mod vizualizare: 'weekly', 'monthly-grid', 'monthly-calendar'
  const [viewMode, setViewMode] = useState('monthly-grid');

  // Stare an și lună curentă
  const now = new Date();
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth());
  const [selectedWeekDate, setSelectedWeekDate] = useState(() => new Date());

  // Filtru angajați comun
  const [selectedEmployeeFilter, setSelectedEmployeeFilter] = useState('all');

  // Formular modal
  const [isShiftModalOpen, setIsShiftModalOpen] = useState(false);
  const [isTemplatesModalOpen, setIsTemplatesModalOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [shiftToEdit, setShiftToEdit] = useState(null);
  const [cellPrefill, setCellPrefill] = useState({ employeeId: null, day: null, date: null });

  const loadData = async (isInitial = false) => {
    if (isInitial) {
      setLoading(true);
    }
    try {
      const [empsData, shiftsData, missingData, templatesData] = await Promise.all([
        fetchEmployees(user?.id),
        fetchShifts(user?.id),
        fetchMissingHours(user?.id),
        fetchShiftTemplates(user?.id),
      ]);
      setEmployees(empsData);
      setShifts(shiftsData);
      setMissingHours(missingData);
      setTemplates(templatesData || []);

      // Sincronizare automată ore suplimentare pentru depășirile de 40h/săpt. fără ore de recuperat
      if (shiftsData && shiftsData.length > 0) {
        syncWeeklyOvertimeRecords(user?.id, shiftsData, missingData, empsData).catch(console.warn);
      }
    } catch (err) {
      console.error('Eroare la încărcarea orarului:', err);
    } finally {
      if (isInitial) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    loadData(true);
  }, [user]);

  // Gestionare Șabloane de Ture
  const handleAddTemplate = async (newTplData) => {
    const created = await createShiftTemplate({ ...newTplData, user_id: user?.id });
    const updated = await fetchShiftTemplates(user?.id);
    setTemplates(updated);
    return created;
  };

  const handleDeleteTemplate = async (templateId) => {
    await deleteShiftTemplate(templateId);
    const updated = await fetchShiftTemplates(user?.id);
    setTemplates(updated);
  };

  // Sincronizare săptămână la navigare
  const handleWeekChange = (newDate) => {
    setSelectedWeekDate(newDate);
    if (newDate instanceof Date && !isNaN(newDate)) {
      setSelectedYear(newDate.getFullYear());
      setSelectedMonth(newDate.getMonth());
    }
  };

  // Navigare luni
  const handlePrevMonth = () => {
    let newYear = selectedYear;
    let newMonth = selectedMonth - 1;
    if (selectedMonth === 0) {
      newYear = selectedYear - 1;
      newMonth = 11;
    }
    setSelectedYear(newYear);
    setSelectedMonth(newMonth);
    setSelectedWeekDate(new Date(newYear, newMonth, 1));
  };

  const handleNextMonth = () => {
    let newYear = selectedYear;
    let newMonth = selectedMonth + 1;
    if (selectedMonth === 11) {
      newYear = selectedYear + 1;
      newMonth = 0;
    }
    setSelectedYear(newYear);
    setSelectedMonth(newMonth);
    setSelectedWeekDate(new Date(newYear, newMonth, 1));
  };

  const handleCurrentMonth = () => {
    const today = new Date();
    setSelectedYear(today.getFullYear());
    setSelectedMonth(today.getMonth());
    setSelectedWeekDate(today);
  };

  const handleSaveShift = async (shiftData) => {
    const { applyWholeWeek, selectedDaysList, autoCompensate, surplusHours, total_hours, day_name, ...basePayload } = shiftData;

    if (applyWholeWeek && selectedDaysList && selectedDaysList.length > 0) {
      // 1. Creare multiplă pentru zilele bifate din săptămână
      const newShiftsToCreate = [];
      for (const dayItem of selectedDaysList) {
        if (autoCompensate && surplusHours > 0) {
          await compensateMissingHoursFromShift(
            user?.id,
            basePayload.employee_id,
            surplusHours,
            { ...basePayload, day_name: dayItem.day_name, total_hours }
          );
        }
        newShiftsToCreate.push({
          ...basePayload,
          shift_date: dayItem.shift_date,
          day_of_week: dayItem.day_of_week,
          user_id: user?.id,
        });
      }
      await createShiftsBulk(newShiftsToCreate);
    } else {
      // 2. Salvare strict pe o singură zi
      if (autoCompensate && surplusHours > 0) {
        await compensateMissingHoursFromShift(
          user?.id,
          basePayload.employee_id,
          surplusHours,
          shiftData
        );
      }

      if (shiftToEdit) {
        await updateShift(shiftToEdit.id, basePayload);
      } else {
        await createShift({ ...basePayload, user_id: user?.id });
      }
    }
    // Reîncărcare silențioasă în fundal, fără a demonta calendarul sau a reseta săptămâna
    await loadData(false);
    // Sincronizare automată ore suplimentare (depășiri >40h fără recuperare)
    const freshShifts = await fetchShifts(user?.id);
    await syncWeeklyOvertimeRecords(user?.id, freshShifts, missingHours, employees);
  };

  const handleDeleteShift = async (shiftId) => {
    await deleteShift(shiftId);
    await loadData(false);
    const freshShifts = await fetchShifts(user?.id);
    await syncWeeklyOvertimeRecords(user?.id, freshShifts, missingHours, employees);
  };

  const handleOpenAddGeneral = () => {
    setShiftToEdit(null);
    let defaultDate = null;
    if (viewMode === 'weekly') {
      const weekDays = getWeekDaysForDate(selectedWeekDate);
      const todayStr = new Date().toISOString().split('T')[0];
      const hasToday = weekDays.some((d) => d.dateString === todayStr);
      defaultDate = hasToday ? todayStr : weekDays[0].dateString;
    } else {
      defaultDate = `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}-01`;
    }
    setCellPrefill({ employeeId: null, day: null, date: defaultDate });
    setIsShiftModalOpen(true);
  };

  const handleOpenEdit = (shift) => {
    setShiftToEdit(shift);
    setCellPrefill({ 
      employeeId: shift.employee_id, 
      day: shift.day_of_week, 
      date: shift.shift_date || null 
    });
    setIsShiftModalOpen(true);
  };

  const handleOpenAddForCell = (empId, dayId, dateString) => {
    let dateStr = dateString;
    if (!dateStr) {
      const weekDays = getWeekDaysForDate(selectedWeekDate);
      const matchedDay = weekDays.find((d) => d.dayOfWeek === dayId);
      dateStr = matchedDay ? matchedDay.dateString : new Date(selectedWeekDate).toISOString().split('T')[0];
    }

    setShiftToEdit(null);
    setCellPrefill({ employeeId: empId, day: dayId, date: dateStr });
    setIsShiftModalOpen(true);
  };

  const handleOpenAddForDate = (empId, dateString, dayOfWeek) => {
    setShiftToEdit(null);
    setCellPrefill({ employeeId: empId, day: dayOfWeek, date: dateString });
    setIsShiftModalOpen(true);
  };

  // Statistici lunare
  const targetPrefix = `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}`;
  const monthShifts = shifts.filter((s) => s.shift_date ? s.shift_date.startsWith(targetPrefix) : true);
  const totalMonthHours = Math.round(monthShifts.reduce((acc, s) => acc + calculateShiftHours(s.start_time, s.end_time), 0) * 10) / 10;

  return (
    <div className="space-y-6">
      {/* Top Header & Navigation */}
      <div className="flex flex-col lg:flex-row justify-between lg:items-center gap-4 bg-white p-4 rounded-3xl border border-slate-200/80 shadow-xs">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2.5">
            <CalendarDays className="w-6 h-6 text-emerald-600" />
            Planificator Orar & Calendar Ture
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Planifică orarul pe săptămână sau pe <b>toată luna</b> (1..31). Poți folosi sau crea <b>ture personalizate</b>!
          </p>
        </div>

        {/* Month Selector & View Mode Switcher */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Buton Export Orar (Săptămână / Lună) */}
          <button
            type="button"
            onClick={() => setIsExportModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 hover:text-emerald-900 rounded-2xl transition-all border border-emerald-200 shadow-2xs hover:scale-105"
            title="Exportă orarul pe săptămână sau pe lună în format Excel/CSV sau PDF"
          >
            <Download className="w-3.5 h-3.5 text-emerald-700" />
            <span>Exportă Orar</span>
          </button>

          {/* Buton Gestionare Ture Personalizate */}
          <button
            type="button"
            onClick={() => setIsTemplatesModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 hover:text-slate-900 rounded-2xl transition-all border border-slate-200 shadow-2xs"
            title="Configurează tipuri de ture personalizate"
          >
            <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
            <span>Ture Personalizate ({templates.length})</span>
          </button>

          {/* Month Navigator */}
          <div className="flex items-center gap-1 bg-slate-50 p-1 rounded-2xl border border-slate-200">
            <button
              type="button"
              onClick={handlePrevMonth}
              className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-white rounded-xl transition-colors"
              title="Luna precedentă"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-xs font-bold text-slate-800 px-2 min-w-[130px] text-center">
              {MONTH_NAMES_RO[selectedMonth]} {selectedYear}
            </span>
            <button
              type="button"
              onClick={handleNextMonth}
              className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-white rounded-xl transition-colors"
              title="Luna următoare"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={handleCurrentMonth}
              className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-1 rounded-xl border border-emerald-200 hover:bg-emerald-100 transition-colors ml-1"
            >
              Luna Curentă
            </button>
          </div>

          {/* View Mode Switcher */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-2xl border border-slate-200 text-xs">
            <button
              type="button"
              onClick={() => setViewMode('monthly-grid')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-medium transition-all ${
                viewMode === 'monthly-grid'
                  ? 'bg-white text-emerald-700 font-bold shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Table className="w-3.5 h-3.5" />
              <span>Matrice Lunară</span>
            </button>

            <button
              type="button"
              onClick={() => setViewMode('monthly-calendar')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-medium transition-all ${
                viewMode === 'monthly-calendar'
                  ? 'bg-white text-emerald-700 font-bold shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Grid3X3 className="w-3.5 h-3.5" />
              <span>Calendar Clasic</span>
            </button>

            <button
              type="button"
              onClick={() => setViewMode('weekly')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-medium transition-all ${
                viewMode === 'weekly'
                  ? 'bg-white text-emerald-700 font-bold shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <CalendarIcon className="w-3.5 h-3.5" />
              <span>Săptămânal</span>
            </button>
          </div>
        </div>
      </div>

      {/* Monthly Metrics Ribbon */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-2xs flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <Clock className="w-4 h-4" />
          </div>
          <div>
            <div className="text-xs text-slate-400 font-medium">Total Ore ({MONTH_NAMES_RO[selectedMonth]})</div>
            <div className="text-base font-black text-slate-800">{totalMonthHours}h</div>
          </div>
        </div>

        <div className="bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-2xs flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center">
            <CalendarDays className="w-4 h-4" />
          </div>
          <div>
            <div className="text-xs text-slate-400 font-medium">Ture Planificate</div>
            <div className="text-base font-black text-slate-800">{monthShifts.length}</div>
          </div>
        </div>

        <div className="bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-2xs flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <RotateCcw className="w-4 h-4" />
          </div>
          <div>
            <div className="text-xs text-slate-400 font-medium">Compensare Automată</div>
            <div className="text-xs font-bold text-emerald-700">Activă pe ture de 9h</div>
          </div>
        </div>

        <div className="bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-2xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={selectedEmployeeFilter}
              onChange={(e) => setSelectedEmployeeFilter(e.target.value)}
              className="text-xs font-semibold text-slate-800 bg-transparent focus:outline-none"
            >
              <option value="all">Toți Angajații ({employees.length})</option>
              {employees.map((emp) => (
                <option key={emp.id} value={emp.id}>
                  {emp.first_name} {emp.last_name}
                </option>
              ))}
            </select>
          </div>
          <button
            type="button"
            onClick={handleOpenAddGeneral}
            className="p-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-xs"
            title="Adaugă tură nouă"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Schedule Content depending on View Mode */}
      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center">
          <Loader2 className="w-8 h-8 text-emerald-600 animate-spin mb-2" />
          <p className="text-xs text-slate-500">Se încarcă orarul...</p>
        </div>
      ) : (
        <>
          {viewMode === 'monthly-grid' && (
            <MonthlyScheduleGrid
              year={selectedYear}
              month={selectedMonth}
              employees={employees}
              shifts={shifts}
              missingHours={missingHours}
              templates={templates}
              selectedEmployeeFilter={selectedEmployeeFilter}
              onEditShift={handleOpenEdit}
              onAddShiftForDate={handleOpenAddForDate}
            />
          )}

          {viewMode === 'monthly-calendar' && (
            <MonthlyCalendarView
              year={selectedYear}
              month={selectedMonth}
              employees={employees}
              shifts={shifts}
              templates={templates}
              selectedEmployeeFilter={selectedEmployeeFilter}
              onEditShift={handleOpenEdit}
              onAddShiftForDate={handleOpenAddForDate}
            />
          )}

          {viewMode === 'weekly' && (
            <ScheduleCalendar
              employees={employees}
              shifts={shifts}
              missingHours={missingHours}
              templates={templates}
              selectedWeekDate={selectedWeekDate}
              onWeekChange={handleWeekChange}
              onAddShift={handleOpenAddGeneral}
              onEditShift={handleOpenEdit}
              onAddShiftForCell={handleOpenAddForCell}
            />
          )}
        </>
      )}

      {/* Modal Tură */}
      <ShiftForm
        isOpen={isShiftModalOpen}
        onClose={() => {
          setIsShiftModalOpen(false);
          setShiftToEdit(null);
          setCellPrefill({ employeeId: null, day: null, date: null });
        }}
        onSave={handleSaveShift}
        onDelete={handleDeleteShift}
        shiftToEdit={shiftToEdit}
        employees={employees}
        shifts={shifts}
        missingHours={missingHours}
        templates={templates}
        onAddTemplate={handleAddTemplate}
        preselectedEmployeeId={cellPrefill.employeeId}
        preselectedDay={cellPrefill.day}
        preselectedDate={cellPrefill.date}
      />

      {/* Modal Configurare Ture Personalizate */}
      <ShiftTemplatesModal
        isOpen={isTemplatesModalOpen}
        onClose={() => setIsTemplatesModalOpen(false)}
        templates={templates}
        onAddTemplate={handleAddTemplate}
        onDeleteTemplate={handleDeleteTemplate}
      />

      {/* Modal Export Orar pe Săptămână sau Lună */}
      <ExportScheduleModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        employees={employees}
        shifts={shifts}
        templates={templates}
        missingHours={missingHours}
        initialYear={selectedYear}
        initialMonth={selectedMonth}
      />
    </div>
  );
}
