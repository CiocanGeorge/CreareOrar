import React, { useState, useEffect } from 'react';
import Modal from '../common/Modal';
import { Clock, CheckCircle2, AlertCircle, Loader2, Sparkles } from 'lucide-react';

export default function RecordRecoveryModal({ 
  isOpen, 
  onClose, 
  onConfirmRecovery, 
  item = null, 
  employee = null 
}) {
  const [hoursToAdd, setHoursToAdd] = useState('1');
  const [recoveryNote, setRecoveryNote] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const missed = parseFloat(item?.hours_missed) || 0;
  const alreadyRecovered = parseFloat(item?.hours_recovered) || 0;
  const remainingToRecover = Math.max(0, Math.round((missed - alreadyRecovered) * 100) / 100);

  useEffect(() => {
    if (item) {
      setHoursToAdd(String(Math.min(remainingToRecover, 2) || 1));
      setRecoveryNote('');
    }
    setError('');
  }, [item, isOpen, remainingToRecover]);

  const numToAdd = parseFloat(hoursToAdd) || 0;
  const projectedTotal = Math.min(missed, alreadyRecovered + numToAdd);
  const projectedRemaining = Math.max(0, Math.round((missed - projectedTotal) * 100) / 100);
  const willBeFullyRecovered = projectedRemaining === 0;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (numToAdd <= 0) {
      setError('Introdu un număr valid de ore recuperate.');
      return;
    }

    setIsSubmitting(true);
    try {
      await onConfirmRecovery(item.id, numToAdd, recoveryNote.trim());
      onClose();
    } catch (err) {
      console.error(err);
      setError(err.message || 'Eroare la salvarea recuperării.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!item) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Înregistrează Recuperare Ore"
      maxWidth="max-w-md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Info card despre absență */}
        <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2 text-xs">
          <div className="flex items-center justify-between">
            <span className="text-slate-500">Angajat:</span>
            <span className="font-bold text-slate-800">
              {employee ? `${employee.first_name} ${employee.last_name}` : 'Membru echipă'}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-500">Data absenței & Motiv:</span>
            <span className="font-medium text-slate-700">
              {item.date} &bull; {item.reason}
            </span>
          </div>
          <div className="flex items-center justify-between pt-1 border-t border-slate-200">
            <span className="text-slate-500">Ore lipsite inițial:</span>
            <span className="font-bold text-slate-800">{missed}h</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-500">Deja recuperate:</span>
            <span className="font-semibold text-emerald-700">{alreadyRecovered}h</span>
          </div>
          <div className="flex items-center justify-between pt-1 border-t border-slate-200">
            <span className="font-semibold text-rose-700">Rămase de recuperat:</span>
            <span className="font-black text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
              {remainingToRecover}h
            </span>
          </div>
        </div>

        {/* Input ore recuperate */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Câte ore au fost recuperate acum? <span className="text-rose-500">*</span>
          </label>
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Clock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="number"
                step="0.5"
                min="0.5"
                max={remainingToRecover}
                value={hoursToAdd}
                onChange={(e) => setHoursToAdd(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 font-bold text-slate-800"
              />
            </div>
            {/* Quick Fill: Recuperează tot */}
            <button
              type="button"
              onClick={() => setHoursToAdd(String(remainingToRecover))}
              className="px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-semibold text-xs rounded-xl border border-emerald-200 transition-colors whitespace-nowrap"
            >
              Recuperează tot ({remainingToRecover}h)
            </button>
          </div>
        </div>

        {/* Proiecție status */}
        <div className={`p-3 rounded-xl border text-xs flex items-center gap-2.5 ${
          willBeFullyRecovered 
            ? 'bg-emerald-50 border-emerald-200 text-emerald-900' 
            : 'bg-amber-50 border-amber-200 text-amber-900'
        }`}>
          {willBeFullyRecovered ? (
            <>
              <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <div>
                <span className="font-bold">Va fi recuperat complet! 🎉</span>
                <p className="text-[11px] text-emerald-700">Toate cele {missed} ore vor fi stinse cu succes.</p>
              </div>
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4 text-amber-600 flex-shrink-0" />
              <div>
                <span className="font-bold">Recuperare parțială</span>
                <p className="text-[11px] text-amber-700">Vor mai rămâne <b>{projectedRemaining}h</b> de recuperat.</p>
              </div>
            </>
          )}
        </div>

        {/* Notiță recuperare */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Notă despre recuperare (opțional)
          </label>
          <input
            type="text"
            value={recoveryNote}
            onChange={(e) => setRecoveryNote(e.target.value)}
            placeholder="ex. A lucrat 2h suplimentare joi după-amiază"
            className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
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
            disabled={isSubmitting || numToAdd <= 0}
            className="inline-flex items-center gap-2 px-5 py-2 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition-all shadow-md shadow-emerald-600/20 disabled:opacity-60"
          >
            {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
            Confirmă Recuperarea
          </button>
        </div>
      </form>
    </Modal>
  );
}
