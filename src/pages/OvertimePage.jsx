import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  fetchEmployees, 
  fetchOvertimeRecords, 
  fetchShifts,
  fetchMissingHours,
  createOvertimeRecord, 
  updateOvertimeRecord, 
  deleteOvertimeRecord,
  syncWeeklyOvertimeRecords
} from '../lib/databaseService';
import OvertimeModal from '../components/overtime/OvertimeModal';
import { downloadFile } from '../utils/exportHelpers';
import { MONTH_NAMES_RO, DAYS_NAMES_RO } from '../utils/monthCalculations';
import { 
  Clock, 
  Plus, 
  Filter, 
  Search, 
  Download, 
  Edit3, 
  Trash2, 
  CheckCircle2, 
  Coffee, 
  DollarSign, 
  User, 
  Calendar, 
  Sparkles, 
  Timer,
  AlertCircle,
  FileText,
  TrendingUp,
  Briefcase,
  RotateCcw
} from 'lucide-react';

export default function OvertimePage() {
  const { user } = useAuth();
  const [employees, setEmployees] = useState([]);
  const [overtimeRecords, setOvertimeRecords] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filtre
  const [selectedEmployeeFilter, setSelectedEmployeeFilter] = useState('all');
  const [selectedMonthFilter, setSelectedMonthFilter] = useState('all'); // 'all' sau 'YYYY-MM'
  const [selectedStatusFilter, setSelectedStatusFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Modale
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [recordToEdit, setRecordToEdit] = useState(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);

  // Stare feedback sincronizare
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncFeedback, setSyncFeedback] = useState(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [emps, records, allShifts, allMissing] = await Promise.all([
        fetchEmployees(user?.id),
        fetchOvertimeRecords(user?.id),
        fetchShifts(user?.id),
        fetchMissingHours(user?.id),
      ]);
      setEmployees(emps || []);

      let finalRecords = records || [];
      if (allShifts && allShifts.length > 0) {
        finalRecords = await syncWeeklyOvertimeRecords(user?.id, allShifts, allMissing || [], emps || []);
      }
      setOvertimeRecords(finalRecords);
    } catch (err) {
      console.error('Eroare la încărcarea orelor suplimentare:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSyncFromSchedule = async () => {
    setIsSyncing(true);
    try {
      const [emps, allShifts, allMissing] = await Promise.all([
        fetchEmployees(user?.id),
        fetchShifts(user?.id),
        fetchMissingHours(user?.id),
      ]);
      const synced = await syncWeeklyOvertimeRecords(user?.id, allShifts || [], allMissing || [], emps || []);
      setOvertimeRecords(synced || []);
      setSyncFeedback('Sincronizare completă! Orele ce depășesc 40h/săptămână (fără recuperare) au fost actualizate din orar.');
      setTimeout(() => setSyncFeedback(null), 4000);
    } catch (err) {
      console.error('Eroare la sincronizarea orelor suplimentare:', err);
      setSyncFeedback('Eroare la sincronizarea din orar.');
      setTimeout(() => setSyncFeedback(null), 4000);
    } finally {
      setIsSyncing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user]);

  // Salvare (creare / editare)
  const handleSaveOvertime = async (recordData) => {
    if (recordToEdit) {
      await updateOvertimeRecord(recordToEdit.id, recordData);
    } else {
      await createOvertimeRecord({ ...recordData, user_id: user?.id });
    }
    loadData();
  };

  // Ștergere
  const handleDelete = async (id) => {
    await deleteOvertimeRecord(id);
    setDeleteConfirmId(null);
    loadData();
  };

  // Schimbare rapidă status
  const handleQuickStatusChange = async (record, newStatus) => {
    await updateOvertimeRecord(record.id, { status: newStatus });
    loadData();
  };

  // Calcule statistice
  const totalOvertimeHours = useMemo(() => {
    const sum = overtimeRecords.reduce((acc, r) => acc + (parseFloat(r.hours_count) || 0), 0);
    return Math.round(sum * 10) / 10;
  }, [overtimeRecords]);

  const currentMonthPrefix = useMemo(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  }, []);

  const thisMonthHours = useMemo(() => {
    const sum = overtimeRecords
      .filter((r) => r.date && r.date.startsWith(currentMonthPrefix))
      .reduce((acc, r) => acc + (parseFloat(r.hours_count) || 0), 0);
    return Math.round(sum * 10) / 10;
  }, [overtimeRecords, currentMonthPrefix]);

  const pendingHours = useMemo(() => {
    const sum = overtimeRecords
      .filter((r) => r.status === 'inregistrat')
      .reduce((acc, r) => acc + (parseFloat(r.hours_count) || 0), 0);
    return Math.round(sum * 10) / 10;
  }, [overtimeRecords]);

  const settledHours = useMemo(() => {
    const sum = overtimeRecords
      .filter((r) => r.status === 'platit' || r.status === 'compensat')
      .reduce((acc, r) => acc + (parseFloat(r.hours_count) || 0), 0);
    return Math.round(sum * 10) / 10;
  }, [overtimeRecords]);

  // Agregare ore pe angajat
  const hoursPerEmployee = useMemo(() => {
    const map = {};
    employees.forEach((emp) => {
      map[emp.id] = {
        employee: emp,
        total: 0,
        pending: 0,
        paid: 0,
        compensated: 0,
      };
    });

    overtimeRecords.forEach((r) => {
      if (!map[r.employee_id]) {
        map[r.employee_id] = {
          employee: { id: r.employee_id, first_name: 'Angajat', last_name: 'Șters', role: '-' },
          total: 0,
          pending: 0,
          paid: 0,
          compensated: 0,
        };
      }
      const h = parseFloat(r.hours_count) || 0;
      map[r.employee_id].total += h;
      if (r.status === 'inregistrat') map[r.employee_id].pending += h;
      if (r.status === 'platit') map[r.employee_id].paid += h;
      if (r.status === 'compensat') map[r.employee_id].compensated += h;
    });

    return Object.values(map)
      .map((item) => ({
        ...item,
        total: Math.round(item.total * 10) / 10,
        pending: Math.round(item.pending * 10) / 10,
        paid: Math.round(item.paid * 10) / 10,
        compensated: Math.round(item.compensated * 10) / 10,
      }))
      .sort((a, b) => b.total - a.total);
  }, [employees, overtimeRecords]);

  // Lista de luni distincte pentru filtru
  const availableMonths = useMemo(() => {
    const monthsSet = new Set();
    overtimeRecords.forEach((r) => {
      if (r.date && r.date.length >= 7) {
        monthsSet.add(r.date.substring(0, 7));
      }
    });
    monthsSet.add(currentMonthPrefix);
    return Array.from(monthsSet).sort().reverse();
  }, [overtimeRecords, currentMonthPrefix]);

  // Filtrare înregistrări
  const filteredRecords = useMemo(() => {
    return overtimeRecords.filter((r) => {
      if (selectedEmployeeFilter !== 'all' && r.employee_id !== selectedEmployeeFilter) {
        return false;
      }
      if (selectedMonthFilter !== 'all' && (!r.date || !r.date.startsWith(selectedMonthFilter))) {
        return false;
      }
      if (selectedStatusFilter !== 'all' && r.status !== selectedStatusFilter) {
        return false;
      }
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        const emp = employees.find((e) => e.id === r.employee_id);
        const empName = emp ? `${emp.first_name} ${emp.last_name}`.toLowerCase() : '';
        const reason = (r.reason || '').toLowerCase();
        const notes = (r.notes || '').toLowerCase();
        if (!empName.includes(term) && !reason.includes(term) && !notes.includes(term)) {
          return false;
        }
      }
      return true;
    });
  }, [overtimeRecords, selectedEmployeeFilter, selectedMonthFilter, selectedStatusFilter, searchTerm, employees]);

  // Export CSV
  const handleExportCsv = () => {
    const rows = [];
    rows.push(['EVIDENȚĂ ORE SUPLIMENTARE', `Generat la: ${new Date().toLocaleDateString('ro-RO')}`]);
    rows.push([]);
    rows.push([
      'Data',
      'Ziua',
      'Nume Angajat',
      'Rol / Funcție',
      'Ore Suplimentare',
      'Interval Orar',
      'Motiv / Justificare',
      'Status Compensare',
      'Observații'
    ]);

    filteredRecords.forEach((r) => {
      const emp = employees.find((e) => e.id === r.employee_id);
      const dObj = r.date ? new Date(r.date + 'T00:00:00') : null;
      const dayName = dObj ? DAYS_NAMES_RO[(dObj.getDay() + 6) % 7] : '-';
      const timeInterval = r.start_time && r.end_time
        ? `${r.start_time.substring(0, 5)} - ${r.end_time.substring(0, 5)}`
        : '-';

      let statusLabel = 'Înregistrat';
      if (r.status === 'platit') statusLabel = 'Plătit';
      if (r.status === 'compensat') statusLabel = 'Compensat cu timp liber';

      rows.push([
        `"${r.date || '-'}"`,
        `"${dayName}"`,
        `"${emp ? `${emp.first_name} ${emp.last_name}` : 'Angajat necunoscut'}"`,
        `"${emp?.role || '-'}"`,
        `"${r.hours_count}h"`,
        `"${timeInterval}"`,
        `"${(r.reason || '').replace(/"/g, '""')}"`,
        `"${statusLabel}"`,
        `"${(r.notes || '').replace(/"/g, '""')}"`
      ]);
    });

    const csvContent = '\uFEFF' + rows.map((r) => r.join(';')).join('\r\n');
    downloadFile(`ore_suplimentare_${new Date().toISOString().split('T')[0]}.csv`, csvContent);
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Header pagină */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-600 mb-1">
            <Timer className="w-4 h-4" />
            <span>Evidență & Pontaj Suplimentar</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Ore Suplimentare
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Înregistrează, monitorizează și compensează orele lucrate peste norma standard.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={handleSyncFromSchedule}
            disabled={isSyncing}
            className="px-3.5 py-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold border border-emerald-200 rounded-xl shadow-xs transition-colors flex items-center gap-2"
            title="Verifică automat turele din orar și înregistrează tot ce depășește 40h/săptămână (fără ore de recuperat)"
          >
            <RotateCcw className={`w-4 h-4 text-emerald-700 ${isSyncing ? 'animate-spin' : ''}`} />
            <span>{isSyncing ? 'Se sincronizează...' : 'Sincronizează din Orar'}</span>
          </button>

          <button
            type="button"
            onClick={handleExportCsv}
            className="px-3.5 py-2.5 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold border border-slate-200 rounded-xl shadow-xs transition-colors flex items-center gap-2"
          >
            <Download className="w-4 h-4 text-slate-500" />
            <span>Export CSV</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setRecordToEdit(null);
              setIsModalOpen(true);
            }}
            className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white text-xs font-bold rounded-xl shadow-md shadow-emerald-600/20 hover:shadow-lg transition-all flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>Adaugă Ore Suplimentare</span>
          </button>
        </div>
      </div>

      {/* Mesaj de confirmare sincronizare */}
      {syncFeedback && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-300 text-emerald-950 rounded-2xl text-xs font-bold flex items-center gap-2.5 shadow-xs animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          <span>{syncFeedback}</span>
        </div>
      )}

      {/* 1. Metric Cards Top */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Ore Suplimentare */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Istoric</span>
            <div className="text-2xl font-black text-slate-900 mt-1">
              +{totalOvertimeHours}h
            </div>
            <span className="text-[11px] text-slate-400 font-medium">
              {overtimeRecords.length} {overtimeRecords.length === 1 ? 'înregistrare' : 'înregistrări'}
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <Timer className="w-6 h-6" />
          </div>
        </div>

        {/* Luna Curentă */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Luna Aceasta</span>
            <div className="text-2xl font-black text-emerald-700 mt-1">
              +{thisMonthHours}h
            </div>
            <span className="text-[11px] text-slate-400 font-medium">
              Efectuate în luna curentă
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center">
            <Calendar className="w-6 h-6" />
          </div>
        </div>

        {/* Înregistrate / De Compensat */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-amber-700 uppercase tracking-wider">De Compensat</span>
            <div className="text-2xl font-black text-amber-900 mt-1">
              {pendingHours}h
            </div>
            <span className="text-[11px] text-slate-400 font-medium">
              Așteaptă plată sau zi liberă
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <Clock className="w-6 h-6" />
          </div>
        </div>

        {/* Plătite / Compensate */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-blue-700 uppercase tracking-wider">Finalizate</span>
            <div className="text-2xl font-black text-blue-900 mt-1">
              {settledHours}h
            </div>
            <span className="text-[11px] text-slate-400 font-medium">
              Plătite sau recuperate
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* 2. Situație Centralizată pe Angajat */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Briefcase className="w-4 h-4 text-emerald-600" />
            <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Total Ore Suplimentare per Angajat
            </h2>
          </div>
          {selectedEmployeeFilter !== 'all' && (
            <button
              type="button"
              onClick={() => setSelectedEmployeeFilter('all')}
              className="text-xs font-semibold text-emerald-600 hover:text-emerald-800"
            >
              Resetează filtru angajat
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
          {hoursPerEmployee.map((item) => {
            const isSelected = selectedEmployeeFilter === item.employee.id;
            return (
              <div
                key={item.employee.id}
                onClick={() => setSelectedEmployeeFilter(isSelected ? 'all' : item.employee.id)}
                className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                  isSelected
                    ? 'border-emerald-500 bg-emerald-50/60 ring-2 ring-emerald-500/20'
                    : 'border-slate-200 hover:border-slate-300 bg-slate-50/40 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800 truncate">
                    {item.employee.first_name} {item.employee.last_name}
                  </span>
                  <span className="text-xs font-black text-emerald-700 bg-emerald-100/70 px-2 py-0.5 rounded-md">
                    +{item.total}h
                  </span>
                </div>
                <div className="text-[11px] text-slate-500 truncate mt-0.5">
                  {item.employee.role || 'Angajat'}
                </div>
                <div className="flex items-center gap-2 text-[10px] text-slate-500 mt-2 pt-2 border-t border-slate-200/60">
                  <span>De comp: <b>{item.pending}h</b></span>
                  <span>•</span>
                  <span>Plătit: <b>{item.paid}h</b></span>
                  <span>•</span>
                  <span>Recup: <b>{item.compensated}h</b></span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. Filtre & Căutare */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          {/* Căutare */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Caută motiv, notă, angajat..."
              className="w-full pl-9 pr-3 py-2 bg-slate-50 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-800"
            />
          </div>

          {/* Filtru Angajat */}
          <div>
            <select
              value={selectedEmployeeFilter}
              onChange={(e) => setSelectedEmployeeFilter(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 text-xs font-semibold border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-800"
            >
              <option value="all">Toți Angajații ({employees.length})</option>
              {employees.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.first_name} {e.last_name}
                </option>
              ))}
            </select>
          </div>

          {/* Filtru Lună */}
          <div>
            <select
              value={selectedMonthFilter}
              onChange={(e) => setSelectedMonthFilter(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 text-xs font-semibold border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-800"
            >
              <option value="all">Toate Lunile</option>
              {availableMonths.map((mStr) => {
                const parts = mStr.split('-');
                const mIdx = parseInt(parts[1], 10) - 1;
                const label = `${MONTH_NAMES_RO[mIdx]} ${parts[0]}`;
                return (
                  <option key={mStr} value={mStr}>
                    {label} {mStr === currentMonthPrefix ? '(Luna curentă)' : ''}
                  </option>
                );
              })}
            </select>
          </div>

          {/* Filtru Status */}
          <div>
            <select
              value={selectedStatusFilter}
              onChange={(e) => setSelectedStatusFilter(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 text-xs font-semibold border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-800"
            >
              <option value="all">Toate Statusurile</option>
              <option value="inregistrat">Înregistrat / De compensat</option>
              <option value="platit">Plătit</option>
              <option value="compensat">Compensat cu timp liber</option>
            </select>
          </div>
        </div>

        {/* Rezumat rezultate filtrate */}
        <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
          <span>
            Afișare <b>{filteredRecords.length}</b> din <b>{overtimeRecords.length}</b> înregistrări
          </span>
          {(selectedEmployeeFilter !== 'all' || selectedMonthFilter !== 'all' || selectedStatusFilter !== 'all' || searchTerm) && (
            <button
              type="button"
              onClick={() => {
                setSelectedEmployeeFilter('all');
                setSelectedMonthFilter('all');
                setSelectedStatusFilter('all');
                setSearchTerm('');
              }}
              className="text-emerald-600 font-bold hover:underline"
            >
              Șterge toate filtrele
            </button>
          )}
        </div>
      </div>

      {/* 4. Tabel / Listă Înregistrări */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-xs text-slate-500 font-semibold">
            Se încarcă datele...
          </div>
        ) : filteredRecords.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
              <Clock className="w-6 h-6" />
            </div>
            <div className="text-sm font-bold text-slate-700">Nu a fost găsită nicio înregistrare</div>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Nu există ore suplimentare conform filtrelor alese. Poți adăuga una nouă folosind butonul de mai jos.
            </p>
            <button
              type="button"
              onClick={() => {
                setRecordToEdit(null);
                setIsModalOpen(true);
              }}
              className="px-4 py-2 bg-emerald-600 text-white text-xs font-bold rounded-xl shadow-xs hover:bg-emerald-700 transition-colors inline-flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Adaugă Ore Suplimentare</span>
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                  <th className="py-3 px-4">Data & Ziua</th>
                  <th className="py-3 px-4">Angajat</th>
                  <th className="py-3 px-4 text-center">Ore Suplimentare</th>
                  <th className="py-3 px-4">Motiv & Justificare</th>
                  <th className="py-3 px-4 text-center">Status Compensare</th>
                  <th className="py-3 px-4">Observații</th>
                  <th className="py-3 px-4 text-right">Acțiuni</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                {filteredRecords.map((record) => {
                  const emp = employees.find((e) => e.id === record.employee_id);
                  const dObj = record.date ? new Date(record.date + 'T00:00:00') : null;
                  const dayName = dObj ? DAYS_NAMES_RO[(dObj.getDay() + 6) % 7] : '-';
                  const isConfirmingDelete = deleteConfirmId === record.id;

                  return (
                    <tr key={record.id} className="hover:bg-slate-50/60 transition-colors">
                      {/* Data & Ziua */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="font-bold text-slate-900">{record.date}</div>
                        <div className="text-[10px] text-slate-500">{dayName}</div>
                      </td>

                      {/* Angajat */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="font-bold text-slate-900">
                          {emp ? `${emp.first_name} ${emp.last_name}` : 'Angajat necunoscut'}
                        </div>
                        <div className="text-[10px] text-slate-500">{emp?.role || '-'}</div>
                      </td>

                      {/* Ore Suplimentare */}
                      <td className="py-3 px-4 text-center whitespace-nowrap">
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-100/70 text-emerald-800 font-extrabold text-xs">
                          <Plus className="w-3 h-3" />
                          {record.hours_count}h
                        </span>
                        {record.start_time && record.end_time && (
                          <div className="text-[10px] text-slate-400 mt-0.5">
                            {record.start_time.substring(0, 5)} - {record.end_time.substring(0, 5)}
                          </div>
                        )}
                      </td>

                      {/* Motiv */}
                      <td className="py-3 px-4 max-w-xs">
                        <div className="flex items-center gap-1.5 font-semibold text-slate-800">
                          {record.notes && record.notes.includes('[AUTO_WEEK_EXCESS') && (
                            <span 
                              className="px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px] font-bold border border-emerald-300 flex-shrink-0"
                              title="Generat automat din orar: ore ce depășesc norma de 40h/săptămână fără ore de recuperat"
                            >
                              ⚡ Din Orar
                            </span>
                          )}
                          <span className="truncate">{record.reason || 'Ore suplimentare'}</span>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-3 px-4 text-center whitespace-nowrap">
                        {record.status === 'inregistrat' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                            <Clock className="w-3 h-3 text-amber-600" />
                            Înregistrat
                          </span>
                        )}
                        {record.status === 'platit' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                            <DollarSign className="w-3 h-3 text-emerald-600" />
                            Plătit
                          </span>
                        )}
                        {record.status === 'compensat' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-sky-50 text-sky-800 border border-sky-200">
                            <Coffee className="w-3 h-3 text-sky-600" />
                            Compensat
                          </span>
                        )}
                      </td>

                      {/* Observații */}
                      <td className="py-3 px-4 max-w-xs text-slate-500 text-[11px]" title={record.notes}>
                        <div className="truncate">
                          {record.notes ? record.notes.replace(/\[AUTO_WEEK_EXCESS:[^\]]+\]/, '').trim() : '-'}
                        </div>
                      </td>

                      {/* Acțiuni */}
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        {isConfirmingDelete ? (
                          <div className="inline-flex items-center gap-1.5">
                            <span className="text-[11px] font-bold text-rose-600">Sigur?</span>
                            <button
                              type="button"
                              onClick={() => handleDelete(record.id)}
                              className="px-2 py-1 bg-rose-600 text-white text-[10px] font-bold rounded-md hover:bg-rose-700"
                            >
                              Da
                            </button>
                            <button
                              type="button"
                              onClick={() => setDeleteConfirmId(null)}
                              className="px-2 py-1 bg-slate-200 text-slate-700 text-[10px] font-bold rounded-md hover:bg-slate-300"
                            >
                              Nu
                            </button>
                          </div>
                        ) : (
                          <div className="inline-flex items-center gap-1">
                            {/* Buton rapid schimbare status */}
                            {record.status === 'inregistrat' ? (
                              <button
                                type="button"
                                title="Marchează ca Plătit"
                                onClick={() => handleQuickStatusChange(record, 'platit')}
                                className="p-1.5 text-slate-400 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors"
                              >
                                <DollarSign className="w-3.5 h-3.5" />
                              </button>
                            ) : (
                              <button
                                type="button"
                                title="Revert la Înregistrat"
                                onClick={() => handleQuickStatusChange(record, 'inregistrat')}
                                className="p-1.5 text-slate-400 hover:text-amber-700 hover:bg-amber-50 rounded-lg transition-colors"
                              >
                                <Clock className="w-3.5 h-3.5" />
                              </button>
                            )}

                            {/* Edit */}
                            <button
                              type="button"
                              title="Editează"
                              onClick={() => {
                                setRecordToEdit(record);
                                setIsModalOpen(true);
                              }}
                              className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>

                            {/* Delete */}
                            <button
                              type="button"
                              title="Șterge"
                              onClick={() => setDeleteConfirmId(record.id)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Adăugare / Editare */}
      <OvertimeModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setRecordToEdit(null);
        }}
        onSave={handleSaveOvertime}
        employees={employees}
        initialData={recordToEdit}
      />
    </div>
  );
}
