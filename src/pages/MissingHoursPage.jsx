import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  fetchEmployees, 
  fetchMissingHours, 
  createMissingHour, 
  updateMissingHour, 
  deleteMissingHour, 
  recordHourRecovery 
} from '../lib/databaseService';
import MissingHoursModal from '../components/missingHours/MissingHoursModal';
import RecordRecoveryModal from '../components/missingHours/RecordRecoveryModal';
import { 
  Clock, 
  UserX, 
  Plus, 
  CheckCircle2, 
  AlertCircle, 
  RotateCcw, 
  Edit3, 
  Trash2, 
  Filter, 
  Search, 
  Loader2,
  Calendar,
  Sparkles
} from 'lucide-react';

export default function MissingHoursPage() {
  const { user } = useAuth();
  const [employees, setEmployees] = useState([]);
  const [missingHours, setMissingHours] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filtre
  const [selectedEmployeeFilter, setSelectedEmployeeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Modale
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [itemToEdit, setItemToEdit] = useState(null);
  const [recoveryModalItem, setRecoveryModalItem] = useState(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [emps, records] = await Promise.all([
        fetchEmployees(user?.id),
        fetchMissingHours(user?.id),
      ]);
      setEmployees(emps);
      setMissingHours(records);
    } catch (err) {
      console.error('Eroare la încărcarea orelor lipsă:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user]);

  // Handlers
  const handleSaveMissingHour = async (recordData) => {
    if (itemToEdit) {
      await updateMissingHour(itemToEdit.id, recordData);
    } else {
      await createMissingHour({ ...recordData, user_id: user?.id });
    }
    loadData();
  };

  const handleDelete = async (id) => {
    await deleteMissingHour(id);
    loadData();
  };

  const handleConfirmRecovery = async (id, additionalHours, note) => {
    await recordHourRecovery(id, additionalHours, note);
    loadData();
  };

  // Calcule statistice
  const totalMissed = missingHours.reduce((acc, i) => acc + (parseFloat(i.hours_missed) || 0), 0);
  const totalRecovered = missingHours.reduce((acc, i) => acc + (parseFloat(i.hours_recovered) || 0), 0);
  const totalRemaining = Math.max(0, Math.round((totalMissed - totalRecovered) * 10) / 10);

  // Angajați unici cu ore rămase de recuperat
  const employeesWithRemaining = new Set(
    missingHours
      .filter((i) => i.status !== 'recovered')
      .map((i) => i.employee_id)
  ).size;

  // Filtrare înregistrări
  const filteredRecords = missingHours.filter((item) => {
    const emp = employees.find((e) => e.id === item.employee_id);
    const empName = emp ? `${emp.first_name} ${emp.last_name}`.toLowerCase() : '';
    const reason = (item.reason || '').toLowerCase();
    const notes = (item.notes || '').toLowerCase();
    const term = searchTerm.toLowerCase();

    const matchesSearch = empName.includes(term) || reason.includes(term) || notes.includes(term);
    const matchesEmp = selectedEmployeeFilter === 'all' || item.employee_id === selectedEmployeeFilter;
    const matchesStatus = statusFilter === 'all' || item.status === statusFilter;

    return matchesSearch && matchesEmp && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Page Title & Add Button */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2.5">
            <UserX className="w-6 h-6 text-rose-500" />
            Evidență Ore Lipsă & Recuperări
          </h1>
          <p className="text-sm text-slate-500">
            Înregistrează absențele sau învoirile angajaților și ține evidența orelor recuperate.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setItemToEdit(null);
            setIsAddModalOpen(true);
          }}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-sm rounded-xl shadow-md shadow-emerald-600/20 transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Înregistrează Ore Lipsă</span>
        </button>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Ore Lipsite */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Ore Lipsite Total</span>
            <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-slate-800">{totalMissed}h</div>
            <p className="text-xs text-slate-500 mt-1">Înregistrate în sistem</p>
          </div>
        </div>

        {/* Total Ore Recuperate */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Ore Recuperate</span>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-emerald-600">{totalRecovered}h</div>
            <p className="text-xs text-slate-500 mt-1">Ore lucrate în compensare</p>
          </div>
        </div>

        {/* Sold Restant de Recuperat */}
        <div className={`p-5 rounded-2xl border ${
          totalRemaining > 0
            ? 'bg-amber-50/80 border-amber-200 text-amber-900 shadow-xs'
            : 'bg-white border-slate-200/80 text-slate-800 shadow-xs'
        }`}>
          <div className="flex items-center justify-between">
            <span className={`text-xs font-bold uppercase tracking-wider ${
              totalRemaining > 0 ? 'text-amber-700' : 'text-slate-400'
            }`}>
              Sold Rămas de Recuperat
            </span>
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
              totalRemaining > 0 ? 'bg-amber-100 text-amber-700' : 'bg-slate-50 text-slate-400'
            }`}>
              <RotateCcw className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className={`text-2xl font-black ${totalRemaining > 0 ? 'text-amber-800' : 'text-slate-800'}`}>
              {totalRemaining}h
            </div>
            <p className={`text-xs mt-1 ${totalRemaining > 0 ? 'text-amber-700 font-medium' : 'text-slate-500'}`}>
              {totalRemaining > 0 ? 'Necesită ore de recuperare' : 'Totul la zi!'}
            </p>
          </div>
        </div>

        {/* Angajați cu restanțe */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Angajați cu Ore Restante</span>
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <UserX className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-slate-800">{employeesWithRemaining}</div>
            <p className="text-xs text-slate-500 mt-1">Membri de echipă vizați</p>
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        <div className="relative flex-1 max-w-sm">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Caută după angajat, motiv sau notițe..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Filter Employee */}
          <div className="flex items-center gap-1.5 text-xs text-slate-600">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={selectedEmployeeFilter}
              onChange={(e) => setSelectedEmployeeFilter(e.target.value)}
              className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 font-medium text-slate-700 focus:outline-none"
            >
              <option value="all">Toți Angajații ({employees.length})</option>
              {employees.map((emp) => (
                <option key={emp.id} value={emp.id}>
                  {emp.first_name} {emp.last_name}
                </option>
              ))}
            </select>
          </div>

          {/* Filter Status */}
          <div className="flex items-center gap-1.5 text-xs text-slate-600">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 font-medium text-slate-700 focus:outline-none"
            >
              <option value="all">Toate Statusurile</option>
              <option value="pending">În Așteptare (Nerecuperat)</option>
              <option value="partial">Recuperat Parțial</option>
              <option value="recovered">Recuperat Complet</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Table */}
      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center">
          <Loader2 className="w-8 h-8 text-emerald-600 animate-spin mb-2" />
          <p className="text-xs text-slate-500">Se încarcă evidența orelor lipsă...</p>
        </div>
      ) : filteredRecords.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-dashed border-slate-200">
          <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto mb-2" />
          <h3 className="text-base font-semibold text-slate-800 mb-1">Nicio înregistrare găsită</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mb-4">
            {searchTerm || selectedEmployeeFilter !== 'all' || statusFilter !== 'all'
              ? 'Nicio înregistrare nu corespunde filtrelor selectate.'
              : 'Nu există ore lipsă înregistrate. Toți angajații au programul complet!'}
          </p>
          <button
            type="button"
            onClick={() => {
              setItemToEdit(null);
              setIsAddModalOpen(true);
            }}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 text-white text-xs font-medium rounded-xl hover:bg-emerald-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Înregistrează Ore Lipsă
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-xs">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold">
                  <th className="py-3 px-4">Angajat</th>
                  <th className="py-3 px-4">Data & Motiv</th>
                  <th className="py-3 px-4 text-center">Lipsit vs. Recuperat</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4">Notițe</th>
                  <th className="py-3 px-4 text-right">Acțiuni</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredRecords.map((item) => {
                  const emp = employees.find((e) => e.id === item.employee_id);
                  const missed = parseFloat(item.hours_missed) || 0;
                  const recovered = parseFloat(item.hours_recovered) || 0;
                  const remaining = Math.max(0, Math.round((missed - recovered) * 10) / 10);
                  const percentRecovered = Math.min(100, Math.round((recovered / missed) * 100));

                  return (
                    <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                      {/* Angajat */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-lg bg-slate-800 text-white font-bold flex items-center justify-center text-xs uppercase flex-shrink-0">
                            {emp ? `${emp.first_name[0]}${emp.last_name[0]}` : 'AN'}
                          </div>
                          <div>
                            <div className="font-semibold text-slate-900">
                              {emp ? `${emp.first_name} ${emp.last_name}` : 'Angajat necunoscut'}
                            </div>
                            <div className="text-[11px] text-slate-500">{emp?.role || 'Personal'}</div>
                          </div>
                        </div>
                      </td>

                      {/* Data & Motiv */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5 font-medium text-slate-800">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          <span>{item.date}</span>
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5 font-medium">
                          {item.reason}
                        </div>
                      </td>

                      {/* Lipsit vs Recuperat & Progress */}
                      <td className="py-3.5 px-4 text-center">
                        <div className="inline-flex flex-col items-center">
                          <div className="text-xs font-bold text-slate-800">
                            <span className="text-emerald-700">{recovered}h</span> / {missed}h
                            {remaining > 0 && (
                              <span className="text-rose-600 font-medium ml-1">
                                (mai sunt {remaining}h)
                              </span>
                            )}
                          </div>
                          {/* Mini Progress Bar */}
                          <div className="w-24 bg-slate-200 rounded-full h-1.5 overflow-hidden mt-1.5">
                            <div
                              className={`h-full rounded-full ${
                                percentRecovered === 100 ? 'bg-emerald-500' : 'bg-amber-500'
                              }`}
                              style={{ width: `${percentRecovered}%` }}
                            />
                          </div>
                        </div>
                      </td>

                      {/* Status Badge */}
                      <td className="py-3.5 px-4 text-center">
                        {item.status === 'recovered' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            Recuperat Complet
                          </span>
                        ) : item.status === 'partial' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-sky-100 text-sky-800 border border-sky-200">
                            <RotateCcw className="w-3 h-3 text-sky-600" />
                            Recuperat Parțial
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-amber-100 text-amber-800 border border-amber-200">
                            <AlertCircle className="w-3 h-3 text-amber-600" />
                            În Așteptare
                          </span>
                        )}
                      </td>

                      {/* Notițe */}
                      <td className="py-3.5 px-4 max-w-xs">
                        <p className="text-[11px] text-slate-600 truncate">
                          {item.notes || <span className="text-slate-400 italic">Fără notițe</span>}
                        </p>
                      </td>

                      {/* Acțiuni */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {item.status !== 'recovered' && (
                            <button
                              type="button"
                              onClick={() => setRecoveryModalItem(item)}
                              className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg border border-emerald-200 transition-colors"
                            >
                              <RotateCcw className="w-3 h-3" />
                              <span>Recuperează</span>
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => {
                              setItemToEdit(item);
                              setIsAddModalOpen(true);
                            }}
                            title="Editează"
                            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>

                          {deleteConfirmId === item.id ? (
                            <div className="inline-flex items-center gap-1 bg-rose-50 p-1 rounded-lg border border-rose-200">
                              <span className="text-[10px] text-rose-700 font-medium">Sigur?</span>
                              <button
                                type="button"
                                onClick={() => {
                                  handleDelete(item.id);
                                  setDeleteConfirmId(null);
                                }}
                                className="px-1.5 py-0.5 bg-rose-600 text-white rounded text-[10px] font-semibold hover:bg-rose-700"
                              >
                                Da
                              </button>
                              <button
                                type="button"
                                onClick={() => setDeleteConfirmId(null)}
                                className="px-1.5 py-0.5 bg-slate-200 text-slate-700 rounded text-[10px] hover:bg-slate-300"
                              >
                                Nu
                              </button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => setDeleteConfirmId(item.id)}
                              title="Șterge"
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
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

      {/* Modale */}
      <MissingHoursModal
        isOpen={isAddModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
          setItemToEdit(null);
        }}
        onSave={handleSaveMissingHour}
        itemToEdit={itemToEdit}
        employees={employees}
      />

      <RecordRecoveryModal
        isOpen={Boolean(recoveryModalItem)}
        onClose={() => setRecoveryModalItem(null)}
        onConfirmRecovery={handleConfirmRecovery}
        item={recoveryModalItem}
        employee={employees.find((e) => e.id === recoveryModalItem?.employee_id)}
      />
    </div>
  );
}
