import React, { useState } from 'react';
import { CorrespondenceItem, CalendarEvent } from '../types';
import { downloadIcsFile, formatDateTime } from '../utils/calendar';
import { X, Calendar as CalendarIcon, ExternalLink, Download, Clock, MapPin, CheckCircle2, AlertCircle } from 'lucide-react';

interface CalendarViewModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: CorrespondenceItem[];
  onToggleSchedule: (id: string, isScheduled: boolean) => void;
  onSelectItem: (item: CorrespondenceItem) => void;
}

export const CalendarViewModal: React.FC<CalendarViewModalProps> = ({
  isOpen,
  onClose,
  items,
  onToggleSchedule,
  onSelectItem,
}) => {
  const [filterType, setFilterType] = useState<'all' | 'summons' | 'deadlines'>('all');

  if (!isOpen) return null;

  // Filter items that have calendarEvent
  const events = items
    .filter(i => Boolean(i.calendarEvent))
    .filter(i => {
      if (filterType === 'summons') return !i.calendarEvent?.isDeadline;
      if (filterType === 'deadlines') return i.calendarEvent?.isDeadline;
      return true;
    })
    .sort((a, b) => {
      const timeA = new Date(a.calendarEvent!.startDateTime).getTime();
      const timeB = new Date(b.calendarEvent!.startDateTime).getTime();
      return timeA - timeB;
    });

  const handleDownloadAllIcs = () => {
    events.forEach(item => {
      if (item.calendarEvent) {
        downloadIcsFile(
          item.calendarEvent.title,
          item.calendarEvent.description,
          item.calendarEvent.locationOrLink,
          item.calendarEvent.startDateTime,
          item.calendarEvent.endDateTime
        );
      }
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full border border-slate-200 overflow-hidden my-6 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/20 border border-blue-400/30 flex items-center justify-center text-blue-300">
              <CalendarIcon className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-lg leading-tight flex items-center gap-2">
                Agenda Personal &amp; Plazos Fatales
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-200 border border-blue-500/30">
                  {events.length} Eventos Detectados
                </span>
              </h3>
              <p className="text-xs text-blue-200 mt-0.5">
                Citaciones judiciales, asambleas y vencimientos detectados automáticamente por IA
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Toolbar */}
        <div className="px-6 py-3 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setFilterType('all')}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                filterType === 'all'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
              }`}
            >
              Todos ({items.filter(i => i.calendarEvent).length})
            </button>
            <button
              onClick={() => setFilterType('summons')}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                filterType === 'summons'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
              }`}
            >
              🤝 Citaciones y Reuniones
            </button>
            <button
              onClick={() => setFilterType('deadlines')}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                filterType === 'deadlines'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
              }`}
            >
              ⏳ Vencimientos y Plazos Fatales
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadAllIcs}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-xs font-medium text-slate-700 transition-colors"
            >
              <Download className="w-3.5 h-3.5 text-slate-500" />
              Descargar Archivos .ICS
            </button>
          </div>
        </div>

        {/* List of Events */}
        <div className="p-6 max-h-[70vh] overflow-y-auto space-y-3.5">
          {events.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              <CalendarIcon className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-sm font-medium text-slate-700">No hay eventos con el filtro seleccionado</p>
              <p className="text-xs text-slate-400 mt-1">Los plazos y convocatorias analizadas aparecerán aquí.</p>
            </div>
          ) : (
            events.map(item => {
              const cal = item.calendarEvent!;
              const eventDate = new Date(cal.startDateTime);
              const isPast = eventDate.getTime() < Date.now();

              return (
                <div
                  key={item.id}
                  className={`border rounded-xl p-4 transition-all ${
                    cal.isDeadline
                      ? 'border-amber-200/80 bg-amber-50/20 hover:border-amber-300'
                      : 'border-blue-200/80 bg-blue-50/20 hover:border-blue-300'
                  }`}
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                    <div className="space-y-1.5 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span
                          className={`text-[11px] font-semibold px-2 py-0.5 rounded-md ${
                            cal.isDeadline
                              ? 'bg-amber-100 text-amber-800 border border-amber-200'
                              : 'bg-blue-100 text-blue-800 border border-blue-200'
                          }`}
                        >
                          {cal.isDeadline ? 'Plazo Perentorio' : 'Citación / Audiencia'}
                        </span>
                        <span className="text-[11px] text-slate-500 font-mono">
                          {item.trackingNumber}
                        </span>
                        <span className="text-[11px] text-slate-600">
                          De: <strong>{item.sender}</strong>
                        </span>
                      </div>

                      <h4 className="font-semibold text-slate-900 text-base leading-snug">
                        {cal.title}
                      </h4>

                      <p className="text-xs text-slate-600 line-clamp-2">
                        {cal.description}
                      </p>

                      <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 pt-1">
                        <span className="flex items-center gap-1 font-medium text-slate-700">
                          <Clock className="w-3.5 h-3.5 text-blue-600" />
                          {formatDateTime(cal.startDateTime)}
                        </span>
                        {cal.locationOrLink && (
                          <span className="flex items-center gap-1 text-slate-600 truncate max-w-xs">
                            <MapPin className="w-3.5 h-3.5 text-slate-400" />
                            {cal.locationOrLink}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Actions on this event */}
                    <div className="flex md:flex-col items-center md:items-end justify-between md:justify-center gap-2 pt-2 md:pt-0 border-t md:border-t-0 border-slate-200/60">
                      <div className="flex items-center gap-2">
                        {cal.isScheduled ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            Agendado
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md">
                            Pendiente
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5">
                        {cal.googleCalendarUrl && (
                          <a
                            href={cal.googleCalendarUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium shadow-xs transition-colors"
                          >
                            <ExternalLink className="w-3 h-3" />
                            Google Calendar
                          </a>
                        )}

                        <button
                          type="button"
                          onClick={() => {
                            downloadIcsFile(
                              cal.title,
                              cal.description,
                              cal.locationOrLink,
                              cal.startDateTime,
                              cal.endDateTime
                            );
                          }}
                          className="p-1.5 rounded-lg border border-slate-300 hover:bg-slate-100 text-slate-600 transition-colors"
                          title="Descargar archivo iCal (.ics)"
                        >
                          <Download className="w-3.5 h-3.5" />
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            onClose();
                            onSelectItem(item);
                          }}
                          className="text-xs text-indigo-600 hover:text-indigo-800 font-medium px-2 py-1"
                        >
                          Ver Detalle
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="bg-slate-50 px-6 py-3.5 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <span>Los eventos se sincronizan con recordatorio automático de 2 horas previas por correo o WhatsApp.</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 font-medium rounded-lg transition-colors"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
