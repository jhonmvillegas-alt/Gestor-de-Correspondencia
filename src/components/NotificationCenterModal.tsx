import React, { useState } from 'react';
import { CorrespondenceItem, NotificationLog } from '../types';
import { formatDateTime } from '../utils/calendar';
import { X, Bell, Mail, MessageSquare, Send, CheckCircle2, Clock, Smartphone, AlertTriangle } from 'lucide-react';

interface NotificationCenterModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: CorrespondenceItem[];
  onSendNotification: (itemId: string, notif: NotificationLog) => void;
}

export const NotificationCenterModal: React.FC<NotificationCenterModalProps> = ({
  isOpen,
  onClose,
  items,
  onSendNotification,
}) => {
  const [selectedItemId, setSelectedItemId] = useState<string>(items[0]?.id || '');
  const [dispatchChannel, setDispatchChannel] = useState<'whatsapp' | 'email'>('whatsapp');
  const [recipient, setRecipient] = useState('');
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [successToast, setSuccessToast] = useState(false);

  if (!isOpen) return null;

  // Flatten all notification logs across all items
  const allLogs: Array<{ itemTracking: string; sender: string; log: NotificationLog }> = [];
  items.forEach(item => {
    item.notificationHistory.forEach(log => {
      allLogs.push({
        itemTracking: item.trackingNumber,
        sender: item.sender,
        log,
      });
    });
  });

  allLogs.sort((a, b) => new Date(b.log.sentAt).getTime() - new Date(a.log.sentAt).getTime());

  const selectedItem = items.find(i => i.id === selectedItemId);

  const handleSelectCorrespondence = (id: string) => {
    setSelectedItemId(id);
    const item = items.find(i => i.id === id);
    if (!item) return;

    setDispatchChannel(item.channel);
    setRecipient(item.senderContact || (item.channel === 'whatsapp' ? '+57 300 000 0000' : 'destinatario@empresa.com'));
    
    if (item.requiresSignature && !item.electronicSignature?.isSigned) {
      setTitle(`Recordatorio Urgente: Firma Pendiente de ${item.signatureDetails?.documentTitle || item.subject}`);
      setMessage(`Estimado(a) ${item.sender}: Le recordamos que el documento "${item.signatureDetails?.documentTitle || item.subject}" se encuentra pendiente de firma electrónica en la plataforma. Agradecemos su gestión oportuna.`);
    } else if (item.calendarEvent) {
      setTitle(`Recordatorio de Reunión/Citación: ${item.calendarEvent.title}`);
      setMessage(`Apreciado(a) ${item.sender}: Recordatorio automático de la sesión programada para el ${new Date(item.calendarEvent.startDateTime).toLocaleDateString()} a las ${new Date(item.calendarEvent.startDateTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}.`);
    } else {
      setTitle(`Notificación de Seguimiento: ${item.subject}`);
      setMessage(item.suggestedReply || `Confirmamos el trámite de su solicitud radicada bajo el número ${item.trackingNumber}.`);
    }
  };

  const handleDispatch = () => {
    if (!selectedItemId || !recipient.trim() || !message.trim()) {
      alert('Por favor complete el destinatario y el mensaje.');
      return;
    }

    setIsSending(true);

    const newLog: NotificationLog = {
      id: `notif-${Date.now()}`,
      channel: dispatchChannel,
      recipient: recipient.trim(),
      title: title.trim() || 'Notificación de CorrespondenciaAI',
      message: message.trim(),
      sentAt: new Date().toISOString(),
      status: 'enviado',
      triggerType: 'manual_dispatch',
    };

    setTimeout(() => {
      onSendNotification(selectedItemId, newLog);
      setIsSending(false);
      setSuccessToast(true);
      setTimeout(() => setSuccessToast(false), 3000);
    }, 500);
  };

  const getWhatsAppWebUrl = () => {
    const cleanPhone = recipient.replace(/[^0-9]/g, '');
    return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full border border-slate-200 overflow-hidden my-6 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-900 text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-emerald-300">
              <Bell className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-lg leading-tight flex items-center gap-2">
                Centro de Notificaciones &amp; Recordatorios
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-200 border border-emerald-500/30">
                  WhatsApp &amp; Mail Dispatcher
                </span>
              </h3>
              <p className="text-xs text-emerald-200 mt-0.5">
                Envío automatizado y manual de alertas, recordatorios de citaciones y requerimientos de firma
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

        {/* Content Layout */}
        <div className="p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 max-h-[75vh] overflow-y-auto">
          {/* Dispatcher Composer (7 cols) */}
          <div className="lg:col-span-7 space-y-4">
            <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/50 space-y-3.5">
              <h4 className="font-semibold text-slate-800 text-sm flex items-center gap-2">
                <Send className="w-4 h-4 text-emerald-600" />
                Despachar Nueva Alerta o Recordatorio
              </h4>

              {/* Select Correspondence */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Vincular a Correspondencia Radicada:
                </label>
                <select
                  value={selectedItemId}
                  onChange={e => handleSelectCorrespondence(e.target.value)}
                  className="w-full text-xs px-3 py-2 bg-white rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                >
                  <option value="">-- Seleccionar Correspondencia --</option>
                  {items.map(item => (
                    <option key={item.id} value={item.id}>
                      [{item.trackingNumber}] {item.subject.substring(0, 50)}... ({item.sender})
                    </option>
                  ))}
                </select>
              </div>

              {/* Channel Selector */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setDispatchChannel('whatsapp')}
                  className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-semibold border transition-all ${
                    dispatchChannel === 'whatsapp'
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <MessageSquare className="w-4 h-4" />
                  Notificación WhatsApp
                </button>
                <button
                  type="button"
                  onClick={() => setDispatchChannel('email')}
                  className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-semibold border transition-all ${
                    dispatchChannel === 'email'
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <Mail className="w-4 h-4" />
                  Correo Electrónico
                </button>
              </div>

              {/* Recipient */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {dispatchChannel === 'whatsapp' ? 'Número de WhatsApp Destinatario' : 'Correo Electrónico Destino'} *
                </label>
                <input
                  type="text"
                  value={recipient}
                  onChange={e => setRecipient(e.target.value)}
                  placeholder={dispatchChannel === 'whatsapp' ? '+57 300 123 4567' : 'destinatario@correo.com'}
                  className="w-full text-xs px-3 py-2 bg-white rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              {/* Subject / Title */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Título / Asunto del Recordatorio
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="Ej. Recordatorio de citación judicial urgente"
                  className="w-full text-xs px-3 py-2 bg-white rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              {/* Message text */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Cuerpo del Mensaje *
                </label>
                <textarea
                  rows={4}
                  value={message}
                  onChange={e => setMessage(e.target.value)}
                  placeholder="Escriba el texto del mensaje..."
                  className="w-full text-xs p-3 bg-white rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              {/* Dispatch Action Buttons */}
              <div className="flex items-center justify-between gap-2 pt-2">
                {dispatchChannel === 'whatsapp' && recipient && (
                  <a
                    href={getWhatsAppWebUrl()}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs font-semibold hover:bg-emerald-100 transition-colors"
                  >
                    <Smartphone className="w-3.5 h-3.5" />
                    Abrir WhatsApp Web Directo
                  </a>
                )}
                {dispatchChannel === 'email' && recipient && (
                  <a
                    href={`mailto:${recipient}?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(message)}`}
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-indigo-50 border border-indigo-300 text-indigo-800 text-xs font-semibold hover:bg-indigo-100 transition-colors"
                  >
                    <Mail className="w-3.5 h-3.5" />
                    Abrir Cliente de Correo
                  </a>
                )}

                <button
                  type="button"
                  disabled={isSending}
                  onClick={handleDispatch}
                  className="ml-auto inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs transition-all disabled:opacity-50"
                >
                  <Send className="w-3.5 h-3.5" />
                  {isSending ? 'Enviando...' : 'Despachar Notificación'}
                </button>
              </div>

              {successToast && (
                <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs p-2.5 rounded-lg flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Notificación registrada y enviada exitosamente al historial.</span>
                </div>
              )}
            </div>
          </div>

          {/* Activity Feed Logs (5 cols) */}
          <div className="lg:col-span-5 space-y-3">
            <h4 className="font-semibold text-slate-800 text-sm flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-slate-500" />
                Historial de Alertas Despachadas
              </span>
              <span className="text-[11px] font-normal text-slate-500">
                {allLogs.length} envíos
              </span>
            </h4>

            <div className="space-y-2.5 overflow-y-auto max-h-[500px] pr-1">
              {allLogs.length === 0 ? (
                <div className="text-center py-8 text-slate-400 text-xs">
                  Aún no se registran notificaciones enviadas.
                </div>
              ) : (
                allLogs.map((itemLog, idx) => {
                  const log = itemLog.log;
                  return (
                    <div
                      key={log.id || idx}
                      className="border border-slate-200 bg-white rounded-xl p-3 text-xs space-y-1.5 shadow-2xs hover:border-slate-300 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md font-semibold text-[10px] uppercase ${
                            log.channel === 'whatsapp'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-indigo-100 text-indigo-800'
                          }`}
                        >
                          {log.channel === 'whatsapp' ? (
                            <MessageSquare className="w-3 h-3" />
                          ) : (
                            <Mail className="w-3 h-3" />
                          )}
                          {log.channel}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {formatDateTime(log.sentAt)}
                        </span>
                      </div>

                      <div className="font-semibold text-slate-800 line-clamp-1">
                        {log.title}
                      </div>

                      <div className="text-[11px] text-slate-500 flex items-center justify-between">
                        <span>Para: <strong>{log.recipient}</strong></span>
                        <span className="text-emerald-600 font-medium capitalize flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" />
                          {log.status}
                        </span>
                      </div>

                      <p className="text-[11px] text-slate-600 bg-slate-50 p-2 rounded border border-slate-100 line-clamp-2">
                        {log.message}
                      </p>

                      <div className="text-[10px] text-slate-400 pt-0.5">
                        Radicado: <span className="font-mono">{itemLog.itemTracking}</span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-slate-50 px-6 py-3 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <span>Los recordatorios automáticos se despachan con anticipación a la fecha del evento agendado.</span>
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
