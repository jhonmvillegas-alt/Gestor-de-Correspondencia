import React from 'react';
import { CorrespondenceItem } from '../types';
import { formatDateTime } from '../utils/calendar';
import {
  Mail,
  MessageSquare,
  Calendar,
  FileSignature,
  FileText,
  Clock,
  ShieldCheck,
  CheckCircle2,
  ExternalLink,
  ChevronRight,
  AlertTriangle,
} from 'lucide-react';

interface CorrespondenceCardProps {
  item: CorrespondenceItem;
  onOpenDetail: (item: CorrespondenceItem) => void;
  onOpenSignature: (item: CorrespondenceItem) => void;
  onToggleSchedule: (id: string, isScheduled: boolean) => void;
}

export const CorrespondenceCard: React.FC<CorrespondenceCardProps> = ({
  item,
  onOpenDetail,
  onOpenSignature,
  onToggleSchedule,
}) => {
  const getUrgencyBadge = (urgency: string) => {
    switch (urgency) {
      case 'crítica':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      case 'alta':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'media':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      default:
        return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs hover:border-slate-300 hover:shadow-md transition-all group">
      {/* Card Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2 flex-wrap">
          {/* Channel Badge */}
          <span
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border ${
              item.channel === 'whatsapp'
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                : 'bg-indigo-50 text-indigo-700 border-indigo-200'
            }`}
          >
            {item.channel === 'whatsapp' ? (
              <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
            ) : (
              <Mail className="w-3.5 h-3.5 text-indigo-600" />
            )}
            {item.channel === 'whatsapp' ? 'WhatsApp' : 'Correo'}
          </span>

          {/* Tracking Number */}
          <span className="font-mono text-xs font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
            {item.trackingNumber}
          </span>

          {/* Urgency Badge */}
          <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-md border ${getUrgencyBadge(item.urgency)}`}>
            Urgencia {item.urgency}
          </span>

          {/* Category */}
          <span className="text-xs text-slate-600 font-medium bg-slate-50 px-2 py-0.5 rounded-md border border-slate-200">
            {item.category}
          </span>
        </div>

        {/* Date received */}
        <div className="flex items-center gap-1 text-[11px] text-slate-400">
          <Clock className="w-3 h-3" />
          <span>{formatDateTime(item.receivedAt)}</span>
        </div>
      </div>

      {/* Sender and Subject */}
      <div className="pt-3.5 space-y-1.5">
        <div className="text-xs text-slate-500 flex items-center gap-1.5">
          <span>De:</span>
          <strong className="text-slate-800">{item.sender}</strong>
          <span className="text-slate-400 font-mono text-[11px]">({item.senderContact})</span>
        </div>

        <h3
          onClick={() => onOpenDetail(item)}
          className="font-bold text-slate-900 text-base leading-snug hover:text-indigo-600 cursor-pointer transition-colors"
        >
          {item.subject}
        </h3>

        {/* Executive AI Summary */}
        <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed bg-slate-50/70 p-2.5 rounded-xl border border-slate-100">
          {item.summary}
        </p>
      </div>

      {/* Attachments preview row */}
      {item.attachments.length > 0 && (
        <div className="pt-3 flex items-center gap-2 flex-wrap">
          <span className="text-[11px] font-medium text-slate-400 flex items-center gap-1">
            <FileText className="w-3 h-3" />
            Adjuntos ({item.attachments.length}):
          </span>
          {item.attachments.map((att, idx) => (
            <span
              key={att.id || idx}
              className="text-[11px] text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md truncate max-w-[200px]"
              title={att.name}
            >
              {att.name}
            </span>
          ))}
        </div>
      )}

      {/* Special Highlights: Calendar Citations & Signature Status */}
      <div className="pt-3.5 flex flex-wrap items-center gap-2">
        {/* Calendar / Summons Banner */}
        {item.calendarEvent && (
          <div
            className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-lg border ${
              item.calendarEvent.isScheduled
                ? 'bg-blue-50 text-blue-800 border-blue-200'
                : 'bg-amber-50 text-amber-800 border-amber-200'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>
              {item.calendarEvent.isDeadline ? 'Vence:' : 'Citación:'}{' '}
              {new Date(item.calendarEvent.startDateTime).toLocaleDateString([], {
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </span>
            {item.calendarEvent.isScheduled ? (
              <span className="text-[10px] text-blue-600 bg-white/80 px-1 rounded ml-1 font-normal">
                ✓ Agendado
              </span>
            ) : (
              <button
                onClick={e => {
                  e.stopPropagation();
                  onToggleSchedule(item.id, true);
                }}
                className="text-[10px] bg-amber-600 hover:bg-amber-700 text-white px-1.5 py-0.5 rounded transition-colors ml-1"
              >
                Agendar
              </button>
            )}
          </div>
        )}

        {/* Signature Status Banner */}
        {item.requiresSignature && (
          item.electronicSignature?.isSigned ? (
            <div className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>Firmado Digitalmente ({item.electronicSignature.verificationCode})</span>
            </div>
          ) : (
            <button
              onClick={e => {
                e.stopPropagation();
                onOpenSignature(item);
              }}
              className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white shadow-2xs transition-colors"
            >
              <FileSignature className="w-3.5 h-3.5" />
              <span>Firmar Documento Ahora</span>
            </button>
          )
        )}
      </div>

      {/* Card Footer Actions */}
      <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {item.calendarEvent?.googleCalendarUrl && (
            <a
              href={item.calendarEvent.googleCalendarUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={e => e.stopPropagation()}
              className="text-xs text-blue-600 hover:text-blue-800 font-medium inline-flex items-center gap-1"
              title="Ver en Google Calendar"
            >
              <ExternalLink className="w-3 h-3" />
              Google Calendar
            </a>
          )}
        </div>

        <button
          onClick={() => onOpenDetail(item)}
          className="inline-flex items-center gap-1 text-xs font-bold text-slate-700 hover:text-indigo-600 transition-colors"
        >
          <span>Abrir &amp; Gestionar</span>
          <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
        </button>
      </div>
    </div>
  );
};
