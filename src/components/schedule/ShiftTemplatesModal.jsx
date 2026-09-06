import React, { useState } from 'react';
import Modal from '../common/Modal';
import { SHIFT_COLORS } from '../../utils/shiftTemplateHelpers';
import { calculateShiftHours } from '../../utils/timeCalculations';
import { Clock, Plus, Trash2, Sparkles, Check, AlertCircle } from 'lucide-react';

export default function ShiftTemplatesModal({ 
  isOpen, 
  onClose, 
  templates = [], 
  onAddTemplate, 
  onDeleteTemplate 
}) {
  const [name, setName] = useState('');
  const [startTime, setStartTime] = useState('08:00');
  const [endTime, setEndTime] = useState('20:00');
  const [color, setColor] = useState('purple');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const duration = calculateShiftHours(startTime, endTime);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Te rugăm să introduci o denumire pentru tură.');
      return;
    }
    if (!startTime || !endTime) {
      setError('Orele de început și sfârșit sunt obligatorii.');
      return;
    }

    setIsSubmitting(true);
    try {
      await onAddTemplate({
        name: name.trim(),
        start_time: startTime.length === 5 ? `${startTime}:00` : startTime,
        end_time: endTime.length === 5 ? `${endTime}:00` : endTime,
        color,
        isSystem: false,
      });
      setName('');
      setStartTime('08:00');
      setEndTime('16:00');
      setColor('purple');
      setError('');
    } catch (err) {
      setError(err.message || 'A apărut o eroare la salvarea șablonului.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Configurare Ture Personalizate"
      maxWidth="max-w-2xl"
    >
      <div className="space-y-6">
        {/* Formular Adăugare Tură Nouă */}
        <div className="p-4 rounded-2xl border border-emerald-200/90 bg-emerald-50/40 space-y-4">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-emerald-600" />
            <h3 className="text-sm font-bold text-slate-800">
              Creează un Tip Nou de Tură
            </h3>
          </div>

          {error && (
            <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Denumire Tură <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="ex: Tură 12h Zi, Deschidere, Part-Time"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                />
              </div>

              {/* Selector Culoare */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Culoare Reprezentativă
                </label>
                <div className="flex items-center gap-1.5 pt-1">
                  {Object.values(SHIFT_COLORS).map((c) => {
                    const isSelected = color === c.id;
                    return (
                      <button
                        type="button"
                        key={c.id}
                        onClick={() => setColor(c.id)}
                        title={c.label}
                        className={`w-7 h-7 rounded-lg transition-transform flex items-center justify-center ${
                          isSelected ? 'scale-110 ring-2 ring-emerald-600 shadow-xs' : 'hover:scale-105'
                        }`}
                        style={{ backgroundColor: c.hex }}
                      >
                        {isSelected && <Check className="w-4 h-4 text-white" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Ore start / end */}
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Ora Început
                </label>
                <div className="relative">
                  <Clock className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                  <input
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="w-full pl-8 pr-2 py-1.5 text-xs border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Ora Sfârșit
                </label>
                <div className="relative">
                  <Clock className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                  <input
                    type="time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="w-full pl-8 pr-2 py-1.5 text-xs border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="flex flex-col justify-end">
                <div className="text-xs bg-white px-3 py-2 rounded-xl border border-slate-200 flex items-center justify-between">
                  <span className="text-slate-500 text-[11px]">Durată:</span>
                  <span className="font-bold text-slate-800">{duration} ore</span>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-1">
              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm"
              >
                <Plus className="w-4 h-4" />
                <span>Salvează Tipul de Tură</span>
              </button>
            </div>
          </form>
        </div>

        {/* Lista Turelor Disponibile */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Ture Existente ({templates.length})
            </h4>
            <span className="text-[11px] text-slate-400">
              Apar automat ca butoane rapide în planificatorul de orar
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-64 overflow-y-auto pr-1">
            {templates.map((tpl) => {
              const colorCfg = SHIFT_COLORS[tpl.color] || SHIFT_COLORS.emerald;
              const h = calculateShiftHours(tpl.start_time, tpl.end_time);

              return (
                <div
                  key={tpl.id}
                  className={`p-3 rounded-xl border flex items-center justify-between ${colorCfg.colorBg} ${colorCfg.colorBorder} transition-all`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className={`w-3 h-3 rounded-full flex-shrink-0 ${colorCfg.indicatorDot}`} />
                    <div className="min-w-0">
                      <div className="font-bold text-xs text-slate-900 truncate">
                        {tpl.name}
                      </div>
                      <div className="text-[11px] text-slate-600">
                        {tpl.start_time.slice(0, 5)} - {tpl.end_time.slice(0, 5)} ({h}h)
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                    {tpl.isSystem ? (
                      <span className="text-[10px] font-semibold text-slate-500 bg-white/80 px-2 py-0.5 rounded-md border border-slate-200">
                        Standard
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => onDeleteTemplate(tpl.id)}
                        title="Șterge acest tip de tură"
                        className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end pt-3 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-xl transition-colors"
          >
            Închide
          </button>
        </div>
      </div>
    </Modal>
  );
}
