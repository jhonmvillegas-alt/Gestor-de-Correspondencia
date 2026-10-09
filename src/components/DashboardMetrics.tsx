import React from 'react';
import { CorrespondenceItem } from '../types';
import { Mail, MessageSquare, Calendar, FileSignature, AlertTriangle, CheckCircle2 } from 'lucide-react';

interface DashboardMetricsProps {
  items: CorrespondenceItem[];
  onFilterChange: (type: 'all' | 'email' | 'whatsapp' | 'pending_signature' | 'scheduled' | 'critical') => void;
}

export const DashboardMetrics: React.FC<DashboardMetricsProps> = ({ items, onFilterChange }) => {
  const total = items.length;
  const emails = items.filter(i => i.channel === 'email').length;
  const whatsapps = items.filter(i => i.channel === 'whatsapp').length;
  const pendingSignatures = items.filter(i => i.requiresSignature && !i.electronicSignature?.isSigned).length;
  const signed = items.filter(i => i.electronicSignature?.isSigned).length;
  const scheduledCount = items.filter(i => i.calendarEvent?.isScheduled).length;
  const totalDeadlines = items.filter(i => i.hasSummonsOrDeadlines).length;
  const criticalCount = items.filter(i => i.urgency === 'crítica' || i.urgency === 'alta').length;

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
      {/* Total Card */}
      <button
        onClick={() => onFilterChange('all')}
        className="text-left bg-white border border-slate-200/80 rounded-xl p-3.5 shadow-xs hover:border-slate-300 hover:shadow-sm transition-all group"
      >
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-medium text-slate-500">Correspondencia</span>
          <div className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center text-slate-700 group-hover:bg-slate-200 transition-colors">
            <Mail className="w-4 h-4" />
          </div>
        </div>
        <div className="text-2xl font-bold text-slate-900 tracking-tight">{total}</div>
        <div className="text-[11px] text-slate-500 mt-1 flex items-center gap-1.5">
          <span className="inline-flex items-center text-indigo-600 font-semibold">{emails} mail</span>
          <span>•</span>
          <span className="inline-flex items-center text-emerald-600 font-semibold">{whatsapps} wa</span>
        </div>
      </button>

      {/* WhatsApp Specific */}
      <button
        onClick={() => onFilterChange('whatsapp')}
        className="text-left bg-white border border-emerald-100 rounded-xl p-3.5 shadow-xs hover:border-emerald-300 hover:shadow-sm transition-all group"
      >
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-medium text-emerald-800">WhatsApp Ingest</span>
          <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:bg-emerald-100 transition-colors">
            <MessageSquare className="w-4 h-4" />
          </div>
        </div>
        <div className="text-2xl font-bold text-emerald-950 tracking-tight">{whatsapps}</div>
        <div className="text-[11px] text-emerald-700 mt-1">
          Mensajes y adjuntos
        </div>
      </button>

      {/* Electronic Signatures */}
      <button
        onClick={() => onFilterChange('pending_signature')}
        className={`text-left bg-white rounded-xl p-3.5 shadow-xs transition-all group border ${
          pendingSignatures > 0
            ? 'border-amber-200 bg-amber-50/20 hover:border-amber-300 hover:shadow-sm'
            : 'border-slate-200/80 hover:border-slate-300'
        }`}
      >
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-medium text-amber-800">Firmas Pendientes</span>
          <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center group-hover:bg-amber-100 transition-colors">
            <FileSignature className="w-4 h-4" />
          </div>
        </div>
        <div className="text-2xl font-bold text-amber-950 tracking-tight">{pendingSignatures}</div>
        <div className="text-[11px] text-amber-700 mt-1">
          {signed > 0 ? `${signed} firmados con éxito` : 'Requieren aprobación'}
        </div>
      </button>

      {/* Calendar Scheduled */}
      <button
        onClick={() => onFilterChange('scheduled')}
        className="text-left bg-white border border-blue-100 rounded-xl p-3.5 shadow-xs hover:border-blue-300 hover:shadow-sm transition-all group"
      >
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-medium text-blue-800">Agenda & Plazos</span>
          <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center group-hover:bg-blue-100 transition-colors">
            <Calendar className="w-4 h-4" />
          </div>
        </div>
        <div className="text-2xl font-bold text-blue-950 tracking-tight">{scheduledCount}</div>
        <div className="text-[11px] text-blue-700 mt-1">
          {totalDeadlines} plazos detectados
        </div>
      </button>

      {/* High Priority & Critical */}
      <button
        onClick={() => onFilterChange('critical')}
        className={`text-left bg-white rounded-xl p-3.5 shadow-xs transition-all group border ${
          criticalCount > 0
            ? 'border-rose-200 bg-rose-50/20 hover:border-rose-300 hover:shadow-sm'
            : 'border-slate-200/80 hover:border-slate-300'
        }`}
      >
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-medium text-rose-800">Alta Urgencia</span>
          <div className="w-7 h-7 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center group-hover:bg-rose-100 transition-colors">
            <AlertTriangle className="w-4 h-4" />
          </div>
        </div>
        <div className="text-2xl font-bold text-rose-950 tracking-tight">{criticalCount}</div>
        <div className="text-[11px] text-rose-700 mt-1">
          Citaciones y perentorios
        </div>
      </button>

      {/* Automation Efficiency */}
      <div className="text-left bg-white border border-slate-200/80 rounded-xl p-3.5 shadow-xs">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-medium text-slate-500">Precisión IA</span>
          <div className="w-7 h-7 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center">
            <CheckCircle2 className="w-4 h-4" />
          </div>
        </div>
        <div className="text-2xl font-bold text-teal-950 tracking-tight">100%</div>
        <div className="text-[11px] text-teal-700 mt-1">
          Gemini 3.8 Flash activo
        </div>
      </div>
    </div>
  );
};
