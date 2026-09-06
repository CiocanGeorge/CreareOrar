import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { 
  CalendarDays, 
  LayoutDashboard, 
  Users, 
  LogOut, 
  Settings, 
  Database, 
  Menu, 
  X, 
  Clock,
  ShieldAlert,
  UserX
} from 'lucide-react';
import SetupGuideModal from '../common/SetupGuideModal';

export default function Navbar() {
  const { user, signOut, isSupabaseConfigured, isDemoMode } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [setupModalOpen, setSetupModalOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = async () => {
    await signOut();
    navigate('/login');
  };

  const navItems = [
    { to: '/', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/angajati', label: 'Angajați', icon: Users },
    { to: '/orar', label: 'Orar & Calendar', icon: CalendarDays },
    { to: '/ore-lipsa', label: 'Ore Lipsă & Recuperări', icon: UserX },
  ];

  return (
    <>
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo & Brand */}
            <div className="flex items-center gap-8">
              <NavLink to="/" className="flex items-center gap-2.5 group">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-md shadow-emerald-500/20 group-hover:scale-105 transition-transform">
                  <CalendarDays className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
                    Creare<span className="text-emerald-600">Orar</span>
                  </span>
                  <span className="hidden sm:block text-[10px] uppercase font-semibold tracking-wider text-slate-600 -mt-1">
                    Management Ture & Echipă
                  </span>
                </div>
              </NavLink>

              {/* Desktop Nav Links */}
              <nav className="hidden md:flex items-center gap-1.5">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      end={item.to === '/'}
                      className={({ isActive }) =>
                        `inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-medium transition-all ${
                          isActive
                            ? 'bg-emerald-50 text-emerald-700 font-semibold shadow-xs'
                            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
                        }`
                      }
                    >
                      <Icon className="w-4 h-4" />
                      {item.label}
                    </NavLink>
                  );
                })}
              </nav>
            </div>

            {/* Right side: Supabase status & User profile & Actions */}
            <div className="hidden md:flex items-center gap-3">
              {/* Supabase connection indicator button */}
              <button
                type="button"
                onClick={() => setSetupModalOpen(true)}
                title="Configurare conexiune Supabase"
                className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                  isSupabaseConfigured
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                    : 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100'
                }`}
              >
                <Database className="w-3.5 h-3.5" />
                <span>{isSupabaseConfigured ? 'Supabase Activ' : 'Mod Demo (Config)'}</span>
                <span className={`w-2 h-2 rounded-full ${isSupabaseConfigured ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
              </button>

              {/* User badge */}
              <div className="flex items-center gap-2.5 pl-2 border-l border-slate-200">
                <div className="w-8 h-8 rounded-full bg-slate-800 text-white flex items-center justify-center font-bold text-xs uppercase shadow-xs">
                  {user?.email ? user.email.substring(0, 2) : 'AN'}
                </div>
                <div className="hidden lg:block text-left text-xs">
                  <div className="font-semibold text-slate-800 truncate max-w-[140px]">
                    {user?.user_metadata?.full_name || 'Utilizator'}
                  </div>
                  <div className="text-slate-600 truncate max-w-[140px] text-[11px]">
                    {user?.email}
                  </div>
                </div>
              </div>

              {/* Sign out */}
              <button
                type="button"
                onClick={handleLogout}
                title="Deconectare"
                className="p-2 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors ml-1"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>

            {/* Mobile menu button */}
            <div className="flex items-center gap-2 md:hidden">
              <button
                type="button"
                onClick={() => setSetupModalOpen(true)}
                className="p-2 text-amber-700 bg-amber-50 rounded-lg text-xs"
              >
                <Database className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile menu dropdown */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-slate-200 bg-white px-4 pt-2 pb-4 space-y-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to === '/'}
                  onClick={() => setMobileMenuOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium ${
                      isActive
                        ? 'bg-emerald-50 text-emerald-700 font-semibold'
                        : 'text-slate-700 hover:bg-slate-50'
                    }`
                  }
                >
                  <Icon className="w-5 h-5" />
                  {item.label}
                </NavLink>
              );
            })}

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
              <div className="text-xs text-slate-600">
                Conectat ca: <span className="font-semibold text-slate-800">{user?.email}</span>
              </div>
              <button
                type="button"
                onClick={handleLogout}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs text-rose-600 font-medium bg-rose-50 rounded-lg"
              >
                <LogOut className="w-3.5 h-3.5" />
                Ieșire
              </button>
            </div>
          </div>
        )}
      </header>

      {/* Setup Guide Modal */}
      <SetupGuideModal isOpen={setupModalOpen} onClose={() => setSetupModalOpen(false)} />
    </>
  );
}
