import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  CalendarDays, 
  Mail, 
  Lock, 
  ArrowRight, 
  AlertCircle, 
  Loader2, 
  Sparkles, 
  Database,
  Eye,
  EyeOff
} from 'lucide-react';
import SetupGuideModal from '../components/common/SetupGuideModal';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [setupModalOpen, setSetupModalOpen] = useState(false);

  const { signIn, startDemoMode, isSupabaseConfigured } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Te rugăm să completezi atât adresa de email cât și parola.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const { data, error: authError } = await signIn(email, password);
      if (authError) throw authError;
      navigate('/');
    } catch (err) {
      console.error(err);
      setError(
        err.message === 'Invalid login credentials'
          ? 'Date de autentificare incorecte. Verifică email-ul și parola.'
          : err.message || 'Eroare la autentificare.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDemo = () => {
    startDemoMode();
    navigate('/');
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-950 relative overflow-hidden">
      {/* Glow decorative shapes */}
      <div className="absolute top-1/4 -left-20 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md z-10">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 text-white shadow-xl shadow-emerald-500/20 mb-3">
            <CalendarDays className="w-7 h-7" />
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            Autentificare Creare<span className="text-emerald-400">Orar</span>
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Gestionează schimburile și orele de lucru ale echipei tale
          </p>
        </div>

        {/* Card */}
        <div className="bg-white/95 backdrop-blur-xl p-8 rounded-3xl shadow-2xl border border-white/20">
          {error && (
            <div className="mb-5 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2 animate-fadeIn">
              <AlertCircle className="w-4 h-4 text-rose-500 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Adresă de Email
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="manager@companie.ro"
                  required
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Parolă
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-sm rounded-xl shadow-lg shadow-emerald-600/25 transition-all flex items-center justify-center gap-2 group disabled:opacity-60"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <span>Intră în Cont</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Option */}
          <div className="mt-5 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={handleQuickDemo}
              className="w-full py-2 px-3 bg-slate-100 hover:bg-slate-200/80 text-slate-700 text-xs font-semibold rounded-xl transition-all flex items-center justify-center gap-2 border border-slate-200/60"
            >
              <Sparkles className="w-4 h-4 text-amber-500" />
              <span>Explorează Imediat în Mod Demonstrativ</span>
            </button>
          </div>

          {/* Register Link */}
          <div className="mt-5 text-center text-xs text-slate-500">
            Nu ai încă un cont?{' '}
            <Link to="/register" className="font-semibold text-emerald-600 hover:text-emerald-700 hover:underline">
              Creează cont nou
            </Link>
          </div>
        </div>

        {/* Supabase status & Setup link */}
        <div className="mt-6 text-center">
          <button
            type="button"
            onClick={() => setSetupModalOpen(true)}
            className="inline-flex items-center gap-2 text-xs text-slate-400 hover:text-white transition-colors bg-white/5 hover:bg-white/10 px-3.5 py-1.5 rounded-full border border-white/10"
          >
            <Database className="w-3.5 h-3.5 text-emerald-400" />
            <span>Configurare Supabase & Script SQL</span>
          </button>
        </div>
      </div>

      <SetupGuideModal isOpen={setupModalOpen} onClose={() => setSetupModalOpen(false)} />
    </div>
  );
}
