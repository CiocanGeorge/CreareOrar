import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  fetchEmployees, 
  fetchShifts, 
  fetchMissingHours,
  createEmployee, 
  createShift, 
  createShiftsBulk,
  updateShift, 
  deleteShift,
  compensateMissingHoursFromShift,
  fetchShiftTemplates
} from '../lib/databaseService';
import { DAYS_OF_WEEK, SHIFT_TYPES } from '../utils/dateConstants';
import { 
  calculateShiftHours, 
  calculateEmployeeWeeklyHours, 
  formatTimeShort, 
  isOvertime, 
  getTodayDayOfWeek 
} from '../utils/timeCalculations';
import { 
  Users, 
  CalendarDays, 
  Clock, 
  AlertTriangle, 
  Plus, 
  ArrowUpRight, 
  Sparkles, 
  Sun, 
  Moon, 
  CheckCircle2,
  CalendarCheck,
  RotateCcw,
  UserX
} from 'lucide-react';
import EmployeeForm from '../components/employees/EmployeeForm';
import ShiftForm from '../components/schedule/ShiftForm';

export default function DashboardPage() {
  const { user } = useAuth();
  const [employees, setEmployees] = useState([]);
  const [shifts, setShifts] = useState([]);
  const [missingHours, setMissingHours] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modale rapide
  const [isEmployeeModalOpen, setIsEmployeeModalOpen] = useState(false);
  const [isShiftModalOpen, setIsShiftModalOpen] = useState(false);
  const [selectedShiftToEdit, setSelectedShiftToEdit] = useState(null);
  const [templates, setTemplates] = useState([]);

  const todayDayIndex = getTodayDayOfWeek();
  const todayDayName = DAYS_OF_WEEK.find((d) => d.id === todayDayIndex)?.name || 'Astăzi';

  const loadData = async () => {
    setLoading(true);
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
    } catch (err) {
      console.error('Eroare la încărcarea datelor pe dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user]);

  // Calcule statistici
  const totalEmployees = employees.length;
  const totalShifts = shifts.length;
  const totalHours = shifts.reduce((acc, s) => acc + calculateShiftHours(s.start_time, s.end_time), 0);

  // Turele de astăzi
  const todayStr = new Date().toISOString().split('T')[0];
  const todayShifts = shifts.filter((s) => s.shift_date ? s.shift_date === todayStr : s.day_of_week === todayDayIndex);

  // Angajați cu peste 40 de ore
  const overtimeEmployees = employees
    .map((emp) => {
      const hours = calculateEmployeeWeeklyHours(emp.id, shifts);
      return { ...emp, hours, extraHours: Math.round((hours - 40) * 10) / 10 };
    })
    .filter((emp) => emp.hours > 40);

  // Ore de recuperat
  const pendingMissingRecords = missingHours.filter((m) => m.status !== 'recovered');
  const totalPendingHours = Math.round(
    pendingMissingRecords.reduce((acc, m) => {
      const diff = (parseFloat(m.hours_missed) || 0) - (parseFloat(m.hours_recovered) || 0);
      return acc + Math.max(0, diff);
    }, 0) * 10
  ) / 10;

  const handleSaveEmployee = async (employeeData) => {
    await createEmployee({ ...employeeData, user_id: user?.id });
    loadData();
  };

  const handleSaveShift = async (shiftData) => {
    const { applyWholeWeek, selectedDaysList, autoCompensate, surplusHours, total_hours, day_name, ...basePayload } = shiftData;

    if (applyWholeWeek && selectedDaysList && selectedDaysList.length > 0) {
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
      if (autoCompensate && surplusHours > 0) {
        await compensateMissingHoursFromShift(
          user?.id,
          basePayload.employee_id,
          surplusHours,
          shiftData
        );
      }

      if (selectedShiftToEdit) {
        await updateShift(selectedShiftToEdit.id, basePayload);
      } else {
        await createShift({ ...basePayload, user_id: user?.id });
      }
    }
    loadData();
  };

  const handleDeleteShift = async (shiftId) => {
    await deleteShift(shiftId);
    loadData();
  };

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-emerald-800 via-emerald-700 to-teal-800 text-white p-6 sm:p-8 shadow-xl">
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-emerald-200 text-xs font-medium mb-3 backdrop-blur-md">
            <Sparkles className="w-3.5 h-3.5 text-emerald-300" />
            <span>Panou de Administrare Program & Ture</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Bună, {user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Manager'}! 👋
          </h1>
          <p className="mt-2 text-sm text-emerald-100/90 leading-relaxed">
            Astăzi este <b className="text-white">{todayDayName}</b>. Ai{' '}
            <b className="text-white">{todayShifts.length} {todayShifts.length === 1 ? 'tură planificată' : 'ture planificate'}</b> astăzi
            și un total de <b className="text-white">{Math.round(totalHours)} ore</b> programate pentru întreaga echipă în această săptămână.
          </p>

          <div className="flex flex-wrap items-center gap-3 mt-5">
            <button
              type="button"
              onClick={() => setIsShiftModalOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white text-emerald-900 font-semibold text-xs shadow-md hover:bg-emerald-50 transition-all hover:scale-105"
            >
              <Plus className="w-4 h-4 text-emerald-600" />
              Adaugă Tură Nouă
            </button>
            <button
              type="button"
              onClick={() => setIsEmployeeModalOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/15 hover:bg-white/25 text-white font-medium text-xs transition-all border border-white/20"
            >
              <Users className="w-4 h-4 text-white" />
              Adaugă Angajat
            </button>
            <Link
              to="/orar"
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs text-emerald-100 hover:text-white underline font-medium ml-auto"
            >
              <span>Deschide Calendarul Săptămânal</span>
              <ArrowUpRight className="w-4 h-4" />
            </Link>
          </div>
        </div>

        {/* Decorative backdrop rings */}
        <div className="absolute -right-12 -bottom-12 w-64 h-64 bg-white/5 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute right-32 -top-12 w-48 h-48 bg-teal-400/10 rounded-full blur-xl pointer-events-none" />
      </div>

      {/* 5 Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Total Angajați */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Membri Echipă</span>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-slate-800">{totalEmployees}</div>
            <Link to="/angajati" className="text-xs text-emerald-600 hover:underline font-medium inline-flex items-center gap-1 mt-1">
              Angajați &rarr;
            </Link>
          </div>
        </div>

        {/* Total Ture */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Ture Săptămână</span>
            <div className="w-10 h-10 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center">
              <CalendarDays className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-slate-800">{totalShifts}</div>
            <Link to="/orar" className="text-xs text-sky-600 hover:underline font-medium inline-flex items-center gap-1 mt-1">
              Calendar &rarr;
            </Link>
          </div>
        </div>

        {/* Total Ore Lucrate */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Ore Programate</span>
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-slate-800">{Math.round(totalHours * 10) / 10}h</div>
            <p className="text-xs text-slate-500 mt-1">
              Medie: {totalEmployees > 0 ? (totalHours / totalEmployees).toFixed(1) : 0}h
            </p>
          </div>
        </div>

        {/* Ore de Recuperat */}
        <div className={`p-5 rounded-2xl border transition-all ${
          totalPendingHours > 0
            ? 'bg-amber-50/70 border-amber-200 text-amber-900 shadow-xs'
            : 'bg-white border-slate-200/80 text-slate-800 shadow-xs'
        }`}>
          <div className="flex items-center justify-between">
            <span className={`text-xs font-bold uppercase tracking-wider ${
              totalPendingHours > 0 ? 'text-amber-700' : 'text-slate-400'
            }`}>
              Ore de Recuperat
            </span>
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
              totalPendingHours > 0 ? 'bg-amber-100 text-amber-700' : 'bg-slate-50 text-slate-400'
            }`}>
              <RotateCcw className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className={`text-2xl font-black ${totalPendingHours > 0 ? 'text-amber-800' : 'text-slate-800'}`}>
              {totalPendingHours}h
            </div>
            <Link to="/ore-lipsa" className="text-xs text-amber-700 hover:underline font-medium inline-flex items-center gap-1 mt-1">
              Vezi detalii &rarr;
            </Link>
          </div>
        </div>

        {/* Alerte >40 Ore */}
        <div className={`p-5 rounded-2xl border transition-all ${
          overtimeEmployees.length > 0
            ? 'bg-rose-50/70 border-rose-200 text-rose-900 shadow-xs'
            : 'bg-white border-slate-200/80 text-slate-800 shadow-xs'
        }`}>
          <div className="flex items-center justify-between">
            <span className={`text-xs font-bold uppercase tracking-wider ${
              overtimeEmployees.length > 0 ? 'text-rose-600' : 'text-slate-400'
            }`}>
              Alerte Depășire 40h
            </span>
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
              overtimeEmployees.length > 0 ? 'bg-rose-100 text-rose-600' : 'bg-slate-50 text-slate-400'
            }`}>
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className={`text-2xl font-black ${overtimeEmployees.length > 0 ? 'text-rose-700' : 'text-slate-800'}`}>
              {overtimeEmployees.length}
            </div>
            <p className={`text-xs mt-1 ${overtimeEmployees.length > 0 ? 'text-rose-600 font-semibold' : 'text-slate-500'}`}>
              {overtimeEmployees.length > 0 ? 'Peste normă!' : 'Norme respectate'}
            </p>
          </div>
        </div>
      </div>

      {/* Main Content: Turele de azi + Alerte 40h */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Turele de Azi (2 cols) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CalendarCheck className="w-5 h-5 text-emerald-600" />
              <h2 className="text-base font-bold text-slate-800">
                Turele de Azi ({todayDayName})
              </h2>
            </div>
            <span className="text-xs text-slate-600 bg-white px-3 py-1 rounded-full border border-slate-200">
              {todayShifts.length} {todayShifts.length === 1 ? 'angajat programat' : 'angajați programați'}
            </span>
          </div>

          {todayShifts.length === 0 ? (
            <div className="p-8 text-center bg-white rounded-2xl border border-slate-200/80">
              <Sun className="w-10 h-10 text-amber-400 mx-auto mb-2" />
              <p className="text-sm font-semibold text-slate-700">Nu sunt ture programate pentru astăzi</p>
              <p className="text-xs text-slate-600 mt-1 max-w-sm mx-auto">
                Echipa este liberă astăzi sau nu au fost încă adăugate schimburile pentru ziua de {todayDayName}.
              </p>
              <button
                type="button"
                onClick={() => setIsShiftModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 mt-4 bg-emerald-600 text-white text-xs font-medium rounded-xl hover:bg-emerald-700 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                Planifică o tură acum
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {todayShifts.map((shift) => {
                const emp = employees.find((e) => e.id === shift.employee_id);
                const typeCfg = SHIFT_TYPES[shift.shift_type] || SHIFT_TYPES.custom;
                const hours = calculateShiftHours(shift.start_time, shift.end_time);

                return (
                  <div
                    key={shift.id}
                    onClick={() => {
                      setSelectedShiftToEdit(shift);
                      setIsShiftModalOpen(true);
                    }}
                    className={`p-4 rounded-2xl border cursor-pointer hover:shadow-md transition-all ${typeCfg.colorBg} ${typeCfg.colorBorder}`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-xl bg-white shadow-xs flex items-center justify-center font-bold text-xs uppercase text-slate-700 border border-slate-200/60">
                          {emp ? `${emp.first_name[0]}${emp.last_name[0]}` : 'AN'}
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-slate-900">
                            {emp ? `${emp.first_name} ${emp.last_name}` : 'Angajat necunoscut'}
                          </h4>
                          <p className="text-xs text-slate-500">{emp?.role || 'Personal'}</p>
                        </div>
                      </div>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border ${typeCfg.badgeClass}`}>
                        {typeCfg.label}
                      </span>
                    </div>

                    <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-200/50 text-xs">
                      <div className="flex items-center gap-1.5 font-semibold text-slate-800">
                        <Clock className="w-3.5 h-3.5 text-slate-500" />
                        <span>{formatTimeShort(shift.start_time)} - {formatTimeShort(shift.end_time)}</span>
                      </div>
                      <span className="font-bold text-slate-700">{hours} ore</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Alerte de Ore (>40h) & Scurtături (1 col) */}
        <div className="space-y-6">
          {/* Overtime Alert Box */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
            <div className="flex items-center gap-2 text-slate-800">
              <AlertTriangle className={`w-5 h-5 ${overtimeEmployees.length > 0 ? 'text-rose-500' : 'text-emerald-500'}`} />
              <h3 className="text-sm font-bold">Monitorizare Normă Săptămânală</h3>
            </div>

            {overtimeEmployees.length === 0 ? (
              <div className="p-4 rounded-xl bg-emerald-50/70 border border-emerald-200 text-xs text-emerald-800 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <span>Excelent! Niciun angajat nu depășește limita standard de 40 de ore pe săptămână.</span>
              </div>
            ) : (
              <div className="space-y-2.5">
                <p className="text-xs text-slate-500">
                  Următorii angajați au fost programați peste norma legală de 40 de ore:
                </p>
                {overtimeEmployees.map((emp) => (
                  <div key={emp.id} className="p-3 rounded-xl bg-rose-50 border border-rose-200 flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold text-rose-900 block">
                        {emp.first_name} {emp.last_name}
                      </span>
                      <span className="text-[11px] text-rose-700 font-medium">
                        +{emp.extraHours}h suplimentare
                      </span>
                    </div>
                    <span className="px-2.5 py-1 rounded-full text-xs font-black bg-rose-600 text-white shadow-xs">
                      {emp.hours}h
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Pending Recoveries Box */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-slate-800">
                <RotateCcw className="w-4 h-4 text-amber-600" />
                <h3 className="text-sm font-bold">Ore de Recuperat Active</h3>
              </div>
              <Link to="/ore-lipsa" className="text-xs text-amber-700 hover:underline font-semibold">
                Gestionează &rarr;
              </Link>
            </div>

            {pendingMissingRecords.length === 0 ? (
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <span>Niciun angajat nu are ore lipsă de recuperat în acest moment.</span>
              </div>
            ) : (
              <div className="space-y-2">
                {pendingMissingRecords.slice(0, 3).map((item) => {
                  const emp = employees.find((e) => e.id === item.employee_id);
                  const rem = Math.max(0, (parseFloat(item.hours_missed) || 0) - (parseFloat(item.hours_recovered) || 0));
                  return (
                    <div key={item.id} className="p-2.5 rounded-xl bg-amber-50/70 border border-amber-200/80 flex items-center justify-between text-xs">
                      <div>
                        <span className="font-bold text-amber-900 block">
                          {emp ? `${emp.first_name} ${emp.last_name}` : 'Angajat'}
                        </span>
                        <span className="text-[11px] text-amber-700">
                          {item.reason} ({item.date})
                        </span>
                      </div>
                      <span className="px-2 py-0.5 rounded-md font-bold bg-amber-200 text-amber-900 text-xs">
                        {rem}h rămase
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Preset Tipuri de Tură Card */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Ghid Schimburi de Lucru</h3>
            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between p-2 rounded-lg bg-amber-50 border border-amber-200/60">
                <span className="font-semibold text-amber-900">Dimineață:</span>
                <span className="text-amber-800 font-mono">08:00 - 16:00 (8h)</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg bg-sky-50 border border-sky-200/60">
                <span className="font-semibold text-sky-900">După-amiază:</span>
                <span className="text-sky-800 font-mono">14:00 - 22:00 (8h)</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg bg-indigo-50 border border-indigo-200/60">
                <span className="font-semibold text-indigo-900">Noapte:</span>
                <span className="text-indigo-800 font-mono">22:00 - 06:00 (8h)</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      <EmployeeForm
        isOpen={isEmployeeModalOpen}
        onClose={() => setIsEmployeeModalOpen(false)}
        onSave={handleSaveEmployee}
      />

      <ShiftForm
        isOpen={isShiftModalOpen}
        onClose={() => {
          setIsShiftModalOpen(false);
          setSelectedShiftToEdit(null);
        }}
        onSave={handleSaveShift}
        onDelete={handleDeleteShift}
        shiftToEdit={selectedShiftToEdit}
        employees={employees}
        shifts={shifts}
        missingHours={missingHours}
        templates={templates}
      />
    </div>
  );
}
