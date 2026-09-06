import React, { useState } from 'react';
import { 
  Search, 
  UserPlus, 
  Edit3, 
  Trash2, 
  Mail, 
  Phone, 
  Calendar, 
  Clock, 
  AlertTriangle,
  Users,
  RotateCcw,
  UserX
} from 'lucide-react';
import { calculateEmployeeWeeklyHours, isOvertime, getEmployeeOvertimeStatus } from '../../utils/timeCalculations';

export default function EmployeeList({ 
  employees = [], 
  shifts = [], 
  missingHours = [],
  onAddEmployee, 
  onEditEmployee, 
  onDeleteEmployee,
  onAddShiftForEmployee,
  onAddMissingForEmployee 
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);

  // Filtrare angajați
  const filteredEmployees = employees.filter((emp) => {
    const fullName = `${emp.first_name} ${emp.last_name}`.toLowerCase();
    const role = (emp.role || '').toLowerCase();
    const email = (emp.email || '').toLowerCase();
    const term = searchTerm.toLowerCase();
    return fullName.includes(term) || role.includes(term) || email.includes(term);
  });

  return (
    <div className="space-y-6">
      {/* Top action bar: Search & Add button */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-stretch sm:items-center">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Caută după nume, rol sau email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-xs"
          />
        </div>

        <button
          type="button"
          onClick={onAddEmployee}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-sm rounded-xl shadow-md shadow-emerald-600/20 hover:shadow-lg transition-all"
        >
          <UserPlus className="w-4 h-4" />
          <span>Adaugă Angajat Nou</span>
        </button>
      </div>

      {/* Table / List View */}
      {filteredEmployees.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-dashed border-slate-200">
          <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400 mb-3">
            <Users className="w-6 h-6" />
          </div>
          <h3 className="text-base font-semibold text-slate-800 mb-1">Nu au fost găsiți angajați</h3>
          <p className="text-sm text-slate-500 mb-4 max-w-sm mx-auto">
            {searchTerm
              ? 'Niciun angajat nu corespunde criteriilor de căutare introduse.'
              : 'Nu ai adăugat încă niciun angajat în echipă. Începe prin a adăuga primul membru!'}
          </p>
          {!searchTerm && (
            <button
              type="button"
              onClick={onAddEmployee}
              className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white text-sm font-medium rounded-xl hover:bg-emerald-700 transition-colors"
            >
              <UserPlus className="w-4 h-4" />
              Adaugă Primul Angajat
            </button>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 text-slate-500 text-xs uppercase tracking-wider font-semibold border-b border-slate-200">
                  <th className="py-3.5 px-6">Angajat</th>
                  <th className="py-3.5 px-4">Contact</th>
                  <th className="py-3.5 px-4 text-center">Ore Săptămână</th>
                  <th className="py-3.5 px-4 text-center">Ture Alocate</th>
                  <th className="py-3.5 px-6 text-right">Acțiuni</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {filteredEmployees.map((emp) => {
                  const empStatus = getEmployeeOvertimeStatus(emp.id, shifts, missingHours);
                  const weeklyHours = empStatus.totalHours;
                  const hasOvertime = empStatus.isOvertime;
                  const empShifts = shifts.filter((s) => s.employee_id === emp.id);

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

                  return (
                    <tr key={emp.id} className="hover:bg-slate-50/60 transition-colors">
                      {/* Name and Role */}
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white flex items-center justify-center font-bold text-sm shadow-xs uppercase">
                            {emp.first_name[0]}{emp.last_name[0]}
                          </div>
                          <div>
                            <div className="font-semibold text-slate-900">
                              {emp.first_name} {emp.last_name}
                            </div>
                            <div className="text-xs text-slate-500">
                              {emp.role || 'Fără rol specificat'}
                            </div>
                            {pendingRecoveryHours > 0 && (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200 mt-1">
                                <RotateCcw className="w-3 h-3 text-amber-600" />
                                {pendingRecoveryHours}h de recuperat
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Contact */}
                      <td className="py-4 px-4">
                        <div className="space-y-1 text-xs">
                          {emp.email ? (
                            <div className="flex items-center gap-1.5 text-slate-600">
                              <Mail className="w-3.5 h-3.5 text-slate-400" />
                              <span className="truncate max-w-[180px]">{emp.email}</span>
                            </div>
                          ) : null}
                          {emp.phone ? (
                            <div className="flex items-center gap-1.5 text-slate-600">
                              <Phone className="w-3.5 h-3.5 text-slate-400" />
                              <span>{emp.phone}</span>
                            </div>
                          ) : null}
                          {!emp.email && !emp.phone && (
                            <span className="text-slate-400 italic">Fără date contact</span>
                          )}
                        </div>
                      </td>

                      {/* Ore săptămână & Alertă */}
                      <td className="py-4 px-4 text-center">
                        <div className="inline-flex flex-col items-center">
                          <span
                            className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold ${
                              hasOvertime
                                ? 'bg-rose-100 text-rose-800 border border-rose-200'
                                : weeklyHours > 0
                                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                                : 'bg-slate-100 text-slate-600'
                            }`}
                          >
                            <Clock className="w-3.5 h-3.5" />
                            {weeklyHours}h / 40h
                          </span>
                          {hasOvertime && (
                            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-rose-600 mt-1">
                              <AlertTriangle className="w-3 h-3 text-rose-500" />
                              Depășește 40h (+{empStatus.extraHours}h)!
                            </span>
                          )}
                          {!hasOvertime && empStatus.recoveryDeducted > 0 && weeklyHours > 40 && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-amber-700 mt-1">
                              <RotateCcw className="w-3 h-3 text-amber-600" />
                              +{empStatus.recoveryDeducted}h de recuperat
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Ture Alocate */}
                      <td className="py-4 px-4 text-center">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-100 text-slate-700">
                          {empShifts.length} {empShifts.length === 1 ? 'tură' : 'ture'}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-6 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => onAddShiftForEmployee(emp)}
                            title="Adaugă tură pentru acest angajat"
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-colors border border-emerald-200"
                          >
                            <Calendar className="w-3.5 h-3.5" />
                            <span className="hidden lg:inline">+ Tură</span>
                          </button>

                          {onAddMissingForEmployee && (
                            <button
                              type="button"
                              onClick={() => onAddMissingForEmployee(emp)}
                              title="Înregistrează ore lipsă pentru acest angajat"
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-amber-700 bg-amber-50 hover:bg-amber-100 rounded-lg transition-colors border border-amber-200"
                            >
                              <UserX className="w-3.5 h-3.5" />
                              <span className="hidden xl:inline">+ Lipsă</span>
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => onEditEmployee(emp)}
                            title="Editează angajat"
                            className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>

                          {deleteConfirmId === emp.id ? (
                            <div className="inline-flex items-center gap-1 bg-rose-50 p-1 rounded-lg border border-rose-200">
                              <span className="text-[11px] text-rose-700 font-medium px-1">Sigur?</span>
                              <button
                                type="button"
                                onClick={() => {
                                  onDeleteEmployee(emp.id);
                                  setDeleteConfirmId(null);
                                }}
                                className="px-2 py-0.5 bg-rose-600 text-white rounded text-[11px] font-semibold hover:bg-rose-700"
                              >
                                Da
                              </button>
                              <button
                                type="button"
                                onClick={() => setDeleteConfirmId(null)}
                                className="px-2 py-0.5 bg-slate-200 text-slate-700 rounded text-[11px] hover:bg-slate-300"
                              >
                                Nu
                              </button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => setDeleteConfirmId(emp.id)}
                              title="Șterge angajat"
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
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
    </div>
  );
}
