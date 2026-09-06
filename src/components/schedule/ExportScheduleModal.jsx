import React, { useState, useMemo } from 'react';
import Modal from '../common/Modal';
import { 
  downloadFile, 
  buildWeeklyMatrixCsv, 
  buildMonthlyMatrixCsv, 
  buildDetailedShiftsCsv, 
  printScheduleReport,
  printMonthlyScheduleReport
} from '../../utils/exportHelpers';
import { 
  MONTH_NAMES_RO, 
  getDaysInMonth, 
  getWeekDaysForDate 
} from '../../utils/monthCalculations';
import { calculateShiftHours } from '../../utils/timeCalculations';
import { 
  Download, 
  FileSpreadsheet, 
  Printer, 
  Calendar, 
  CalendarDays, 
  Users, 
  Check, 
  FileText,
  Clock,
  Sparkles
} from 'lucide-react';

export default function ExportScheduleModal({
  isOpen,
  onClose,
  employees = [],
  shifts = [],
  templates = [],
  missingHours = [],
  initialWeekDate = new Date(),
  initialYear = new Date().getFullYear(),
  initialMonth = new Date().getMonth()
}) {
  // Tip export: 'week' sau 'month'
  const [exportType, setExportType] = useState('week');

  // Stare selecție săptămână
  const [selectedWeekMonday, setSelectedWeekMonday] = useState(() => {
    const wDays = getWeekDaysForDate(initialWeekDate || new Date());
    return wDays[0].dateString;
  });

  // Stare selecție lună
  const [selectedYear, setSelectedYear] = useState(initialYear);
  const [selectedMonth, setSelectedMonth] = useState(initialMonth);

  // Filtru angajat
  const [selectedEmployeeId, setSelectedEmployeeId] = useState('all');

  // Stare feedback descărcare
  const [downloadSuccess, setDownloadSuccess] = useState('');

  // Identificăm toate săptămânile distincte din orar + săptămâna curentă
  const availableWeeks = useMemo(() => {
    const weeksMap = new Map();
    const currentWeekDays = getWeekDaysForDate(new Date());
    const currentMonday = currentWeekDays[0].dateString;

    weeksMap.set(currentMonday, {
      mondayDate: currentMonday,
      label: `${currentWeekDays[0].formattedDate} - ${currentWeekDays[6].formattedDate}`,
      isCurrent: true,
      weekDays: currentWeekDays,
    });

    shifts.forEach((s) => {
      if (s.shift_date) {
        const wDays = getWeekDaysForDate(s.shift_date);
        const mDate = wDays[0].dateString;
        if (!weeksMap.has(mDate)) {
          weeksMap.set(mDate, {
            mondayDate: mDate,
            label: `${wDays[0].formattedDate} - ${wDays[6].formattedDate}`,
            isCurrent: mDate === currentMonday,
            weekDays: wDays,
          });
        }
      }
    });

    return Array.from(weeksMap.values()).sort((a, b) => b.mondayDate.localeCompare(a.mondayDate));
  }, [shifts]);

  // Zilele săptămânii selectate
  const activeWeekDays = useMemo(() => {
    const found = availableWeeks.find((w) => w.mondayDate === selectedWeekMonday);
    return found ? found.weekDays : getWeekDaysForDate(selectedWeekMonday);
  }, [availableWeeks, selectedWeekMonday]);

  // Zilele lunii selectate
  const activeMonthDays = useMemo(() => {
    return getDaysInMonth(selectedYear, selectedMonth);
  }, [selectedYear, selectedMonth]);

  // Ture relevante pentru selecția curentă
  const relevantShifts = useMemo(() => {
    if (exportType === 'week') {
      const datesSet = new Set(activeWeekDays.map((d) => d.dateString));
      return shifts.filter((s) => {
        if (selectedEmployeeId !== 'all' && s.employee_id !== selectedEmployeeId) return false;
        if (s.shift_date) return datesSet.has(s.shift_date);
        return false;
      });
    } else {
      const targetPrefix = `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}`;
      return shifts.filter((s) => {
        if (selectedEmployeeId !== 'all' && s.employee_id !== selectedEmployeeId) return false;
        if (s.shift_date) return s.shift_date.startsWith(targetPrefix);
        return false;
      });
    }
  }, [exportType, activeWeekDays, selectedYear, selectedMonth, shifts, selectedEmployeeId]);

  // Total ore din selecție
  const totalHoursInSelection = useMemo(() => {
    const sum = relevantShifts.reduce((acc, s) => acc + calculateShiftHours(s.start_time, s.end_time), 0);
    return Math.round(sum * 10) / 10;
  }, [relevantShifts]);

  const notifySuccess = (msg) => {
    setDownloadSuccess(msg);
    setTimeout(() => setDownloadSuccess(''), 3500);
  };

  // 1. Export Matrice CSV (Tablou Zile pe Coloane)
  const handleExportMatrixCsv = () => {
    if (exportType === 'week') {
      const csv = buildWeeklyMatrixCsv({
        weekDays: activeWeekDays,
        employees,
        shifts,
        templates,
        missingHours,
        filterEmployeeId: selectedEmployeeId,
      });
      const filename = `orar_saptamanal_${activeWeekDays[0].dateString}_${activeWeekDays[6].dateString}.csv`;
      downloadFile(filename, csv);
      notifySuccess(`Orarul săptămânal a fost descărcat (${filename})!`);
    } else {
      const csv = buildMonthlyMatrixCsv({
        year: selectedYear,
        month: selectedMonth,
        employees,
        shifts,
        templates,
        missingHours,
        filterEmployeeId: selectedEmployeeId,
      });
      const filename = `orar_lunar_${selectedYear}_${String(selectedMonth + 1).padStart(2, '0')}_pe_saptamani.csv`;
      downloadFile(filename, csv);
      notifySuccess(`Orarul lunar împărțit pe săptămâni a fost descărcat (${filename})!`);
    }
  };

  // 2. Export Detaliat CSV (Listă Ture)
  const handleExportDetailedCsv = () => {
    const title = exportType === 'week'
      ? `Raport Ture Săptămâna ${activeWeekDays[0].formattedDate} - ${activeWeekDays[6].formattedDate}`
      : `Raport Ture Luna ${MONTH_NAMES_RO[selectedMonth]} ${selectedYear}`;

    const csv = buildDetailedShiftsCsv({
      shifts: relevantShifts,
      employees,
      templates,
      title,
    });

    const filename = exportType === 'week'
      ? `ture_detaliate_saptamana_${activeWeekDays[0].dateString}.csv`
      : `ture_detaliate_luna_${selectedYear}_${String(selectedMonth + 1).padStart(2, '0')}.csv`;

    downloadFile(filename, csv);
    notifySuccess(`Lista detaliată a turelor a fost descărcată (${filename})!`);
  };

  // 3. Imprimare / Salvare PDF
  const handlePrintPdf = () => {
    if (exportType === 'week') {
      const selectedEmp = selectedEmployeeId !== 'all' ? employees.find((e) => e.id === selectedEmployeeId) : null;
      printScheduleReport({
        title: 'Program Săptămânal',
        subtitle: selectedEmp
          ? `Săptămâna ${activeWeekDays[0].formattedDate} - ${activeWeekDays[6].formattedDate} • ${selectedEmp.first_name} ${selectedEmp.last_name} (${selectedEmp.role || 'Angajat'})`
          : `Săptămâna ${activeWeekDays[0].formattedDate} - ${activeWeekDays[6].formattedDate}`,
        days: activeWeekDays,
        employees,
        shifts,
        templates,
        missingHours,
        filterEmployeeId: selectedEmployeeId,
      });
    } else {
      const selectedEmp = selectedEmployeeId !== 'all' ? employees.find((e) => e.id === selectedEmployeeId) : null;
      printMonthlyScheduleReport({
        title: `Luna ${MONTH_NAMES_RO[selectedMonth]} ${selectedYear}`,
        subtitle: selectedEmp
          ? `Angajat: ${selectedEmp.first_name} ${selectedEmp.last_name} (${selectedEmp.role || 'Angajat'})`
          : '',
        year: selectedYear,
        month: selectedMonth,
        employees,
        shifts,
        templates,
        missingHours,
        filterEmployeeId: selectedEmployeeId,
      });
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Export & Tipărire Program de Lucru"
      maxWidth="max-w-2xl"
    >
      <div className="space-y-6">
        {/* Banner confirmare succes */}
        {downloadSuccess && (
          <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-300 text-xs font-semibold text-emerald-900 flex items-center gap-2 animate-fadeIn">
            <Check className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <span>{downloadSuccess}</span>
          </div>
        )}

        {/* Tip Export: Săptămână vs Lună */}
        <div className="flex bg-slate-100 p-1 rounded-2xl border border-slate-200">
          <button
            type="button"
            onClick={() => setExportType('week')}
            className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
              exportType === 'week'
                ? 'bg-white text-emerald-800 shadow-sm ring-1 ring-slate-200/80'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Calendar className="w-4 h-4 text-emerald-600" />
            <span>Export pe Săptămână</span>
          </button>
          <button
            type="button"
            onClick={() => setExportType('month')}
            className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
              exportType === 'month'
                ? 'bg-white text-emerald-800 shadow-sm ring-1 ring-slate-200/80'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <CalendarDays className="w-4 h-4 text-emerald-600" />
            <span>Export pe Lună</span>
          </button>
        </div>

        {/* Parametri de Export */}
        <div className="space-y-3 bg-slate-50 p-4 rounded-2xl border border-slate-200/80">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Săptămână sau Lună selector */}
            {exportType === 'week' ? (
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-slate-500" />
                  Selectează Săptămâna
                </label>
                <select
                  value={selectedWeekMonday}
                  onChange={(e) => setSelectedWeekMonday(e.target.value)}
                  className="w-full px-3 py-2 bg-white text-xs font-semibold border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-800"
                >
                  {availableWeeks.map((w) => (
                    <option key={w.mondayDate} value={w.mondayDate}>
                      {w.label} {w.isCurrent ? '(Săptămâna curentă)' : ''}
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Luna</label>
                  <select
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(parseInt(e.target.value, 10))}
                    className="w-full px-3 py-2 bg-white text-xs font-semibold border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-800"
                  >
                    {MONTH_NAMES_RO.map((m, idx) => (
                      <option key={idx} value={idx}>
                        {m}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Anul</label>
                  <select
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(parseInt(e.target.value, 10))}
                    className="w-full px-3 py-2 bg-white text-xs font-semibold border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-800"
                  >
                    <option value={2025}>2025</option>
                    <option value={2026}>2026</option>
                    <option value={2027}>2027</option>
                  </select>
                </div>
              </div>
            )}

            {/* Filtru Angajat */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-slate-500" />
                Filtru Angajați
              </label>
              <select
                value={selectedEmployeeId}
                onChange={(e) => setSelectedEmployeeId(e.target.value)}
                className="w-full px-3 py-2 bg-white text-xs font-semibold border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-800"
              >
                <option value="all">Toți Angajații ({employees.length})</option>
                {employees.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.first_name} {emp.last_name} ({emp.role || 'Angajat'})
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Rezumat date ce urmează a fi exportate */}
        <div className="flex items-center justify-between p-3 bg-emerald-50/70 border border-emerald-200/80 rounded-xl text-xs text-emerald-950">
          <div className="flex items-center gap-2 font-medium">
            <Sparkles className="w-4 h-4 text-emerald-600" />
            <span>
              Perioadă:{' '}
              <b>
                {exportType === 'week'
                  ? `${activeWeekDays[0].formattedDate} - ${activeWeekDays[6].formattedDate}`
                  : `${MONTH_NAMES_RO[selectedMonth]} ${selectedYear} (Împărțit pe Săptămâni)`}
              </b>
            </span>
          </div>
          <div className="flex items-center gap-3">
            <span className="bg-white px-2 py-0.5 rounded-md font-bold text-emerald-800 border border-emerald-200">
              {relevantShifts.length} {relevantShifts.length === 1 ? 'tură' : 'ture'}
            </span>
            <span className="bg-white px-2 py-0.5 rounded-md font-bold text-emerald-800 border border-emerald-200">
              {totalHoursInSelection} ore
            </span>
          </div>
        </div>

        {/* Opțiuni Formate de Export */}
        <div className="space-y-3">
          <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider">
            Alege Formatul de Export:
          </label>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Opțiunea 1: Matrice Excel (CSV) */}
            <button
              type="button"
              onClick={handleExportMatrixCsv}
              className="p-4 rounded-2xl border border-emerald-200 bg-gradient-to-b from-white to-emerald-50/30 hover:to-emerald-100/60 hover:shadow-md hover:border-emerald-300 transition-all text-left group flex flex-col justify-between"
            >
              <div>
                <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                  <FileSpreadsheet className="w-5 h-5" />
                </div>
                <div className="text-xs font-bold text-slate-800 group-hover:text-emerald-900">
                  {exportType === 'week' ? 'Matrice Săptămânală (CSV)' : 'Matrice pe Săptămâni (CSV)'}
                </div>
                <p className="text-[11px] text-slate-500 mt-1 leading-snug">
                  {exportType === 'week'
                    ? 'Tabel cu zilele săptămânii pe coloane și total ore per angajat, optimizat pentru Excel.'
                    : 'Împarte luna pe săptămâni: o săptămână pe un rând nou (Luni - Duminică și total ore).'}
                </p>
              </div>
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 mt-3 pt-2 border-t border-emerald-100">
                <Download className="w-3.5 h-3.5" />
                Descarcă CSV
              </span>
            </button>

            {/* Opțiunea 2: Listă Detaliată (CSV) */}
            <button
              type="button"
              onClick={handleExportDetailedCsv}
              className="p-4 rounded-2xl border border-sky-200 bg-gradient-to-b from-white to-sky-50/30 hover:to-sky-100/60 hover:shadow-md hover:border-sky-300 transition-all text-left group flex flex-col justify-between"
            >
              <div>
                <div className="w-10 h-10 rounded-xl bg-sky-100 text-sky-700 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                  <FileText className="w-5 h-5" />
                </div>
                <div className="text-xs font-bold text-slate-800 group-hover:text-sky-900">
                  Listă Detaliată (CSV)
                </div>
                <p className="text-[11px] text-slate-500 mt-1 leading-snug">
                  Fiecare tură ca rând separat: dată, interval, ore, rol și tip tură.
                </p>
              </div>
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-sky-700 mt-3 pt-2 border-t border-sky-100">
                <Download className="w-3.5 h-3.5" />
                Descarcă CSV
              </span>
            </button>

            {/* Opțiunea 3: Imprimare / PDF */}
            <button
              type="button"
              onClick={handlePrintPdf}
              className="p-4 rounded-2xl border border-indigo-200 bg-gradient-to-b from-white to-indigo-50/30 hover:to-indigo-100/60 hover:shadow-md hover:border-indigo-300 transition-all text-left group flex flex-col justify-between"
            >
              <div>
                <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                  <Printer className="w-5 h-5" />
                </div>
                <div className="text-xs font-bold text-slate-800 group-hover:text-indigo-900">
                  Imprimă / Salvează PDF
                </div>
                <p className="text-[11px] text-slate-500 mt-1 leading-snug">
                  {exportType === 'week'
                    ? 'Raport landscape curat, format compact pentru imprimare sau PDF.'
                    : 'Raport pe săptămâni (o săptămână per rând), format compact pentru imprimare sau PDF.'}
                </p>
              </div>
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-indigo-700 mt-3 pt-2 border-t border-indigo-100">
                <Printer className="w-3.5 h-3.5" />
                Deschide Print / PDF
              </span>
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end pt-3 border-t border-slate-200">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors"
          >
            Închide
          </button>
        </div>
      </div>
    </Modal>
  );
}
