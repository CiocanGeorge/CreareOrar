import React, { useState, useEffect } from 'react';
import Modal from '../common/Modal';
import { User, Calendar, Clock, FileText, AlertCircle, Loader2 } from 'lucide-react';

const REASON_PRESETS = [
  'Învoire personală',
  'Control medical / Analize',
  'Întârziere',
  'Urgență familială',
  'Eveniment administrativ',
  'Alt motiv',
];

export default function MissingHoursModal({ 
  isOpen, 
  onClose, 
  onSave, 
  itemToEdit = null, 
  employees = [],
  preselectedEmployeeId = null 
}) {
  const [employeeId, setEmployeeId] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [hoursMissed, setHoursMissed] = useState('4');
  const [reason, setReason] = useState(REASON_PRESETS[0]);
  const [customReason, setCustomReason] = useState('');
  const [notes, setNotes] = useState('');
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (itemToEdit) {
      setEmployeeId(itemToEdit.employee_id || '');
      setDate(itemToEdit.date || new Date().toISOString().split('T')[0]);
      setHoursMissed(String(itemToEdit.hours_missed || '4'));
      if (REASON_PRESETS.includes(itemToEdit.reason)) {
        setReason(itemToEdit.reason);
        setCustomReason('');
      } else {
        setReason('Alt motiv');
        setCustomReason(itemToEdit.reason || '');
      }
      setNotes(itemToEdit.notes || '');
    } else {
      setEmployeeId(preselectedEmployeeId || (employees[0]?.id || ''));
      setDate(new Date().toISOString().split('T')[0]);
      setHoursMissed('4');
      setReason(REASON_PRESETS[0]);
      setCustomReason('');
      setNotes('');
    }
    setErrors({});
  }, [itemToEdit, isOpen, preselectedEmployeeId, employees]);

  const validate = () => {
    const errs = {};
    if (!employeeId) errs.employeeId = 'Selectarea unui angajat este obligatorie.';
    const num = parseFloat(hoursMissed);
    if (isNaN(num) || num <= 0) errs.hoursMissed = 'Numărul de ore lipsă trebuie să fie mai mare ca 0.';
    if (reason === 'Alt motiv' && !customReason.trim()) {
      errs.reason = 'Te rugăm să specifici motivul absenței.';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      const finalReason = reason === 'Alt motiv' ? customReason.trim() : reason;
      await onSave({
        employee_id: employeeId,
        date,
        hours_missed: parseFloat(hoursMissed),
        reason: finalReason,
        notes: notes.trim(),
      });
      onClose();
    } catch (err) {
      console.error(err);
      setErrors({ form: err.message || 'A apărut o eroare la salvare.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={itemToEdit ? 'Editare Ore Lipsă' : 'Înregistrare Ore Lipsă'}
      maxWidth="max-w-md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {errors.form && (
          <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{errors.form}</span>
          </div>
        )}

        {/* Angajat */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Angajat <span className="text-rose-500">*</span>
          </label>
          <div className="relative">
            <User className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <select
              value={employeeId}
              onChange={(e) => setEmployeeId(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              {employees.map((emp) => (
                <option key={emp.id} value={emp.id}>
                  {emp.first_name} {emp.last_name} ({emp.role || 'Angajat'})
                </option>
              ))}
            </select>
          </div>
          {errors.employeeId && <p className="text-xs text-rose-500 mt-1">{errors.employeeId}</p>}
        </div>

        {/* Data & Număr ore */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Data Absenței <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Ore Lipsă <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <Clock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="number"
                step="0.5"
                min="0.5"
                max="24"
                value={hoursMissed}
                onChange={(e) => setHoursMissed(e.target.value)}
                placeholder="ex. 4"
                className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            {errors.hoursMissed && <p className="text-xs text-rose-500 mt-1">{errors.hoursMissed}</p>}
          </div>
        </div>

        {/* Motiv */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Motiv Absență <span className="text-rose-500">*</span>
          </label>
          <select
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 mb-2"
          >
            {REASON_PRESETS.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>

          {reason === 'Alt motiv' && (
            <input
              type="text"
              value={customReason}
              onChange={(e) => setCustomReason(e.target.value)}
              placeholder="Specifică motivul..."
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          )}
          {errors.reason && <p className="text-xs text-rose-500 mt-1">{errors.reason}</p>}
        </div>

        {/* Notițe */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Notițe / Detalii Recuperare
          </label>
          <div className="relative">
            <FileText className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <textarea
              rows="2"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="ex. Va recupera miercurea viitoare prin program prelungit cu 2 ore..."
              className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
        </div>

        {/* Butoane */}
        <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
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
            disabled={isSubmitting}
            className="inline-flex items-center gap-2 px-5 py-2 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition-all shadow-md shadow-emerald-600/20 disabled:opacity-60"
          >
            {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
            {itemToEdit ? 'Salvează Modificările' : 'Înregistrează Ore Lipsă'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
