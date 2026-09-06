import React, { useState, useEffect } from 'react';
import Modal from '../common/Modal';
import { User, Mail, Phone, Briefcase, AlertCircle, Loader2 } from 'lucide-react';

export default function EmployeeForm({ isOpen, onClose, onSave, employeeToEdit }) {
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    role: '',
    email: '',
    phone: '',
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (employeeToEdit) {
      setFormData({
        first_name: employeeToEdit.first_name || '',
        last_name: employeeToEdit.last_name || '',
        role: employeeToEdit.role || '',
        email: employeeToEdit.email || '',
        phone: employeeToEdit.phone || '',
      });
    } else {
      setFormData({
        first_name: '',
        last_name: '',
        role: '',
        email: '',
        phone: '',
      });
    }
    setErrors({});
  }, [employeeToEdit, isOpen]);

  const validate = () => {
    const errs = {};
    if (!formData.first_name.trim()) errs.first_name = 'Prenumele este obligatoriu.';
    if (!formData.last_name.trim()) errs.last_name = 'Numele de familie este obligatoriu.';
    if (formData.email && !/\S+@\S+\.\S+/.test(formData.email)) {
      errs.email = 'Formatul adresei de email este invalid.';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      await onSave({
        ...formData,
        first_name: formData.first_name.trim(),
        last_name: formData.last_name.trim(),
        role: formData.role.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim(),
      });
      onClose();
    } catch (err) {
      console.error(err);
      setErrors({ form: err.message || 'A apărut o eroare la salvarea angajatului.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={employeeToEdit ? 'Editare Angajat' : 'Adăugare Angajat Nou'}
      maxWidth="max-w-lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {errors.form && (
          <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-sm flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{errors.form}</span>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Prenume <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={formData.first_name}
                onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                placeholder="ex. Andrei"
                className={`w-full pl-9 pr-3 py-2 text-sm border rounded-xl focus:outline-none focus:ring-2 transition-all ${
                  errors.first_name
                    ? 'border-rose-300 focus:ring-rose-500'
                    : 'border-slate-200 focus:ring-emerald-500'
                }`}
              />
            </div>
            {errors.first_name && <p className="text-xs text-rose-500 mt-1">{errors.first_name}</p>}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Nume <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={formData.last_name}
                onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                placeholder="ex. Popescu"
                className={`w-full pl-9 pr-3 py-2 text-sm border rounded-xl focus:outline-none focus:ring-2 transition-all ${
                  errors.last_name
                    ? 'border-rose-300 focus:ring-rose-500'
                    : 'border-slate-200 focus:ring-emerald-500'
                }`}
              />
            </div>
            {errors.last_name && <p className="text-xs text-rose-500 mt-1">{errors.last_name}</p>}
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Rol / Funcție
          </label>
          <div className="relative">
            <Briefcase className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              placeholder="ex. Bucătar Șef, Dezvoltator, Casier"
              className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Adresă Email
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="angajat@companie.ro"
                className={`w-full pl-9 pr-3 py-2 text-sm border rounded-xl focus:outline-none focus:ring-2 transition-all ${
                  errors.email
                    ? 'border-rose-300 focus:ring-rose-500'
                    : 'border-slate-200 focus:ring-emerald-500'
                }`}
              />
            </div>
            {errors.email && <p className="text-xs text-rose-500 mt-1">{errors.email}</p>}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Număr Telefon
            </label>
            <div className="relative">
              <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="0722 123 456"
                className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
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
            className="inline-flex items-center gap-2 px-5 py-2 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition-all shadow-md shadow-emerald-600/20 disabled:opacity-70"
          >
            {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
            {employeeToEdit ? 'Salvează Modificările' : 'Adaugă Angajat'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
