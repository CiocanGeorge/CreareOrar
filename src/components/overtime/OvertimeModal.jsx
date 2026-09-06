import React, { useState, useEffect } from 'react';
import Modal from '../common/Modal';
import { calculateShiftHours, formatTimeShort } from '../../utils/timeCalculations';
import { 
  Clock, 
  User, 
  Calendar, 
  FileText, 
  CheckCircle2, 
  Sparkles, 
  Timer, 
  AlertCircle,
  DollarSign,
  Coffee
} from 'lucide-react';

const REASON_PRESETS = [
  'Prelungire tură',
  'Inventar stoc & depozit',
  'Înlocuire coleg indisponibil',
  'Urgență operațională',
  'Eveniment special / Proiect',
  'Mentenanță IT / Tehnică',
];

export default function OvertimeModal({
  isOpen,
  onClose,
  onSave,
  employees = [],
  initialData = null,
}) {
  const [employeeId, setEmployeeId] = useState('');
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [inputMode, setInputMode] = useState('direct'); // 'direct' sau 'interval'
  const [hoursCount, setHoursCount] = useState('2');
  const [startTime, setStartTime] = useState('16:00');
  const [endTime, setEndTime] = useState('18:00');
  const [reason, setReason] = useState('');
  const [status, setStatus] = useState('inregistrat'); // 'inregistrat', 'platit', 'compensat'
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (initialData) {
      setEmployeeId(initialData.employee_id || (employees[0]?.id || ''));
      setDate(initialData.date || new Date().toISOString().split('T')[0]);
      setHoursCount(String(initialData.hours_count || '2'));
      if (initialData.start_time && initialData.end_time) {
        setStartTime(initialData.start_time.substring(0, 5));
        setEndTime(initialData.end_time.substring(0, 5));
        setInputMode('interval');
      } else {
        setInputMode('direct');
      }
      setReason(initialData.reason || '');
      setStatus(initialData.status || 'inregistrat');
      setNotes(initialData.notes || '');
    } else {
      setEmployeeId(employees[0]?.id || '');
      setDate(new Date().toISOString().split('T')[0]);
      setHoursCount('2');
      setStartTime('16:00');
      setEndTime('18:00');
      setInputMode('direct');
      setReason('');
      setStatus('inregistrat');
      setNotes('');
    }
    setError('');
  }, [initialData, isOpen, employees]);

  // Calcul automat dacă e modul 'interval'
  useEffect(() => {
    if (inputMode === 'interval' && startTime && endTime) {
      const calculated = calculateShiftHours(startTime + ':00', endTime + ':00');
      if (calculated > 0) {
        setHoursCount(String(calculated));
      }
    }
  }, [inputMode, startTime, endTime]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!employeeId) {
      setError('Selectează un angajat din listă.');
      return;
    }

    const numericHours = parseFloat(hoursCount);
    if (isNaN(numericHours) || numericHours <= 0) {
      setError('Introdu un număr valid de ore suplimentare (mai mare ca 0).');
      return;
    }

    if (!date) {
      setError('Selectează data la care au fost efectuate orele suplimentare.');
      return;
    }

    setSubmitting(true);
    try {
      await onSave({
        employee_id: employeeId,
        date,
        hours_count: numericHours,
        start_time: inputMode === 'interval' && startTime ? startTime + ':00' : null,
        end_time: inputMode === 'interval' && endTime ? endTime + ':00' : null,
        reason: reason.trim() || 'Ore suplimentare',
        status,
        notes: notes.trim(),
      });
      onClose();
    } catch (err) {
      console.error(err);
      setError('A apărut o eroare la salvare. Încearcă din nou.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={initialData ? 'Editare Ore Suplimentare' : 'Adaugă Ore Suplimentare'}
      maxWidth="max-w-lg"
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {error && (
          <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-xs font-semibold text-rose-800 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* 1. Angajat */}
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
            <User className="w-3.5 h-3.5 text-slate-500" />
            Angajat
          </label>
          <select
            value={employeeId}
            onChange={(e) => setEmployeeId(e.target.value)}
            required
            className="w-full px-3.5 py-2.5 bg-slate-50 hover:bg-white focus:bg-white text-xs font-semibold border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-800 transition-colors"
          >
            <option value="" disabled>-- Alege angajatul --</option>
            {employees.map((emp) => (
              <option key={emp.id} value={emp.id}>
                {emp.first_name} {emp.last_name} ({emp.role || 'Angajat'})
              </option>
            ))}
          </select>
        </div>

        {/* 2. Dată efectuare */}
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-slate-500" />
            Data Efectuării Orelor
          </label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            required
            className="w-full px-3.5 py-2.5 bg-slate-50 hover:bg-white focus:bg-white text-xs font-semibold border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-800 transition-colors"
          />
        </div>

        {/* 3. Comutator Metodă Introducere Ore */}
        <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200/80 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <Timer className="w-3.5 h-3.5 text-emerald-600" />
              Calcul Ore Suplimentare
            </span>
            <div className="flex bg-slate-200/80 p-0.5 rounded-lg text-[11px] font-bold">
              <button
                type="button"
                onClick={() => setInputMode('direct')}
                className={`px-2.5 py-1 rounded-md transition-all ${
                  inputMode === 'direct'
                    ? 'bg-white text-emerald-800 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Număr Direct
              </button>
              <button
                type="button"
                onClick={() => setInputMode('interval')}
                className={`px-2.5 py-1 rounded-md transition-all ${
                  inputMode === 'interval'
                    ? 'bg-white text-emerald-800 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Interval Orar
              </button>
            </div>
          </div>

          {inputMode === 'direct' ? (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  step="0.5"
                  min="0.5"
                  max="24"
                  value={hoursCount}
                  onChange={(e) => setHoursCount(e.target.value)}
                  required
                  placeholder="Ex: 2.5"
                  className="w-32 px-3.5 py-2 text-sm font-bold bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-800 text-center"
                />
                <span className="text-xs font-bold text-slate-500">ore lucrate suplimentar</span>
              </div>
              {/* Preseturi rapide */}
              <div className="flex flex-wrap gap-1.5 pt-1">
                {['1', '1.5', '2', '3', '4', '6', '8'].map((val) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => setHoursCount(val)}
                    className={`px-2.5 py-1 text-[11px] font-bold rounded-lg border transition-colors ${
                      hoursCount === val
                        ? 'bg-emerald-600 text-white border-emerald-600'
                        : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    +{val}h
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <span className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Ora Început</span>
                  <input
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    required
                    className="w-full px-3 py-2 text-xs font-semibold bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-800"
                  />
                </div>
                <div>
                  <span className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Ora Sfârșit</span>
                  <input
                    type="time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    required
                    className="w-full px-3 py-2 text-xs font-semibold bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-800"
                  />
                </div>
              </div>
              <div className="flex items-center justify-between text-xs pt-1 text-slate-600">
                <span>Total calculat automat:</span>
                <span className="font-extrabold text-emerald-700 bg-emerald-100/60 px-2 py-0.5 rounded-md">
                  +{hoursCount} ore
                </span>
              </div>
            </div>
          )}
        </div>

        {/* 4. Motiv / Justificare */}
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
            <FileText className="w-3.5 h-3.5 text-slate-500" />
            Motiv / Justificare
          </label>
          <input
            type="text"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Ex: Inventar, Înlocuire coleg, Proiect urgent..."
            className="w-full px-3.5 py-2.5 bg-slate-50 hover:bg-white focus:bg-white text-xs font-medium border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-800 transition-colors"
          />
          {/* Preseturi sugestii motiv */}
          <div className="flex flex-wrap gap-1.5 mt-2">
            {REASON_PRESETS.map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setReason(p)}
                className={`text-[10px] font-medium px-2 py-0.5 rounded-md border transition-all ${
                  reason === p
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-300 font-semibold'
                    : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                }`}
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        {/* 5. Status / Modalitate de Compensare */}
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1.5">
            Status / Modalitate Compensare
          </label>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => setStatus('inregistrat')}
              className={`p-2.5 rounded-xl border text-left transition-all flex flex-col justify-between ${
                status === 'inregistrat'
                  ? 'border-amber-400 bg-amber-50/80 text-amber-950 ring-2 ring-amber-400/40'
                  : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center gap-1.5 mb-1">
                <Clock className="w-3.5 h-3.5 text-amber-600" />
                <span className="text-xs font-bold">Înregistrat</span>
              </div>
              <span className="text-[10px] text-slate-500 leading-tight">
                De compensat / În evidență
              </span>
            </button>

            <button
              type="button"
              onClick={() => setStatus('platit')}
              className={`p-2.5 rounded-xl border text-left transition-all flex flex-col justify-between ${
                status === 'platit'
                  ? 'border-emerald-400 bg-emerald-50/80 text-emerald-950 ring-2 ring-emerald-400/40'
                  : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center gap-1.5 mb-1">
                <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
                <span className="text-xs font-bold">Plătit</span>
              </div>
              <span className="text-[10px] text-slate-500 leading-tight">
                Achitat suplimentar
              </span>
            </button>

            <button
              type="button"
              onClick={() => setStatus('compensat')}
              className={`p-2.5 rounded-xl border text-left transition-all flex flex-col justify-between ${
                status === 'compensat'
                  ? 'border-sky-400 bg-sky-50/80 text-sky-950 ring-2 ring-sky-400/40'
                  : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center gap-1.5 mb-1">
                <Coffee className="w-3.5 h-3.5 text-sky-600" />
                <span className="text-xs font-bold">Compensat</span>
              </div>
              <span className="text-[10px] text-slate-500 leading-tight">
                Zi liberă acordată
              </span>
            </button>
          </div>
        </div>

        {/* 6. Observații */}
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1.5">
            Observații / Mențiuni (Opțional)
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            placeholder="Detalii adiționale despre activitatea desfășurată..."
            className="w-full px-3.5 py-2 bg-slate-50 hover:bg-white focus:bg-white text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-800 transition-colors"
          />
        </div>

        {/* Butoane acțiune */}
        <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="px-4 py-2.5 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors"
          >
            Anulează
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white text-xs font-bold rounded-xl shadow-md shadow-emerald-600/20 hover:shadow-lg transition-all flex items-center gap-1.5 disabled:opacity-50"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>{submitting ? 'Se salvează...' : initialData ? 'Salvează Modificările' : 'Salvează Orele Suplimentare'}</span>
          </button>
        </div>
      </form>
    </Modal>
  );
}
