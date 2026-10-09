import React from 'react';
import {
  Sparkles,
  Plus,
  Calendar,
  Bell,
  RefreshCw,
  Zap,
  Mail,
  ShieldCheck,
} from 'lucide-react';

interface NavbarProps {
  onOpenNew: () => void;
  onOpenCalendar: () => void;
  onOpenNotifications: () => void;
  onResetData: () => void;
  onSimulateIncoming: () => void;
  scheduledEventsCount: number;
  unreadNotificationsCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  onOpenNew,
  onOpenCalendar,
  onOpenNotifications,
  onResetData,
  onSimulateIncoming,
  scheduledEventsCount,
  unreadNotificationsCount,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-blue-600 to-teal-500 flex items-center justify-center text-white shadow-xs">
            <Mail className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-base md:text-lg text-slate-900 tracking-tight">
                Correspondencia<span className="text-indigo-600">AI</span>
              </span>
              <span className="hidden sm:inline-flex items-center gap-1 text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Gemini 3.8 Flash
              </span>
            </div>
            <p className="text-[11px] text-slate-500 hidden md:block">
              Gestor de Mail &amp; WhatsApp • Auto-Agenda • Notificaciones • Firma Digital
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          {/* Simulate incoming burst */}
          <button
            onClick={onSimulateIncoming}
            className="hidden lg:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-indigo-200 bg-indigo-50/50 hover:bg-indigo-100/60 text-indigo-700 text-xs font-semibold transition-colors"
            title="Simular nueva correspondencia entrante de WhatsApp/Email"
          >
            <Zap className="w-3.5 h-3.5 text-indigo-600" />
            <span>Simular Ingesta</span>
          </button>

          {/* Calendar Button */}
          <button
            onClick={onOpenCalendar}
            className="relative inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-colors shadow-2xs"
          >
            <Calendar className="w-4 h-4 text-blue-600" />
            <span className="hidden sm:inline">Agenda</span>
            {scheduledEventsCount > 0 && (
              <span className="w-4 h-4 rounded-full bg-blue-600 text-white text-[10px] font-bold flex items-center justify-center">
                {scheduledEventsCount}
              </span>
            )}
          </button>

          {/* Notifications Button */}
          <button
            onClick={onOpenNotifications}
            className="relative inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-colors shadow-2xs"
          >
            <Bell className="w-4 h-4 text-emerald-600" />
            <span className="hidden sm:inline">Notificaciones</span>
            {unreadNotificationsCount > 0 && (
              <span className="w-4 h-4 rounded-full bg-emerald-600 text-white text-[10px] font-bold flex items-center justify-center">
                {unreadNotificationsCount}
              </span>
            )}
          </button>

          {/* Reset button */}
          <button
            onClick={onResetData}
            className="p-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-500 hover:text-slate-800 transition-colors shadow-2xs"
            title="Restablecer datos de demostración"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          {/* New Correspondence Button */}
          <button
            onClick={onOpenNew}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs hover:shadow transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Nueva Ingesta</span>
          </button>
        </div>
      </div>
    </header>
  );
};
