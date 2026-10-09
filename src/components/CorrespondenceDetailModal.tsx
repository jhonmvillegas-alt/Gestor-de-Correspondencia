import React, { useState } from 'react';
import { CorrespondenceItem, NotificationLog } from '../types';
import { formatDateTime } from '../utils/calendar';
import { generateCustomReply } from '../services/correspondenceStore';
import {
  X,
  Mail,
  MessageSquare,
  Sparkles,
  Calendar,
  FileSignature,
  FileText,
  Clock,
  ShieldCheck,
  Send,
  ExternalLink,
  Download,
  CheckCircle2,
  AlertTriangle,
  Copy,
  Check,
  RefreshCw,
  User,
  Building,
  DollarSign,
  Tag,
  ListTodo,
} from 'lucide-react';

interface CorrespondenceDetailModalProps {
  item: CorrespondenceItem;
  isOpen: boolean;
  onClose: () => void;
  onOpenSignature: (item: CorrespondenceItem) => void;
  onToggleSchedule: (id: string, isScheduled: boolean) => void;
  onSendNotification: (itemId: string, notif: NotificationLog) => void;
  onUpdateItem: (id: string, updates: Partial<CorrespondenceItem>) => void;
}

export const CorrespondenceDetailModal: React.FC<CorrespondenceDetailModalProps> = ({
  item,
  isOpen,
  onClose,
  onOpenSignature,
  onToggleSchedule,
  onSendNotification,
  onUpdateItem,
}) => {
  const [activeTab, setActiveTab] = useState<'summary' | 'attachments' | 'calendar' | 'signature' | 'reply' | 'audit'>('summary');
  const [completedActions, setCompletedActions] = useState<Record<string, boolean>>({});
  const [replyTone, setReplyTone] = useState<'formal' | 'cordial' | 'acceptance' | 'extension'>('formal');
  const [userInstructions, setUserInstructions] = useState('');
  const [generatedReply, setGeneratedReply] = useState(item.suggestedReply || '');
  const [isGeneratingReply, setIsGeneratingReply] = useState(false);
  const [copied, setCopied] = useState(false);
  const [quickNotifSuccess, setQuickNotifSuccess] = useState(false);

  if (!isOpen) return null;

  const toggleAction = (idx: number) => {
    setCompletedActions(prev => ({
      ...prev,
      [idx]: !prev[idx],
    }));
  };

  const handleCopyReply = () => {
    navigator.clipboard.writeText(generatedReply);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleGenerateCustomReply = async () => {
    setIsGeneratingReply(true);
    try {
      const reply = await generateCustomReply({
        correspondenceContext: `${item.subject}\n\n${item.content}\n\nResumen: ${item.summary}`,
        sender: item.sender,
        channel: item.channel,
        tone: replyTone,
        userInstructions: userInstructions.trim(),
      });
      setGeneratedReply(reply);
    } catch (err) {
      console.error(err);
    } finally {
      setIsGeneratingReply(false);
    }
  };

  const handleQuickDispatchReply = () => {
    const newNotif: NotificationLog = {
      id: `notif-${Date.now()}`,
      channel: item.channel,
      recipient: item.senderContact || item.sender,
      title: `Respuesta a ${item.subject}`,
      message: generatedReply,
      sentAt: new Date().toISOString(),
      status: 'enviado',
      triggerType: 'manual_dispatch',
    };

    onSendNotification(item.id, newNotif);
    setQuickNotifSuccess(true);
    setTimeout(() => setQuickNotifSuccess(false), 3000);
  };

  const getUrgencyBadge = (urgency: string) => {
    switch (urgency) {
      case 'crítica':
        return 'bg-rose-100 text-rose-800 border-rose-300';
      case 'alta':
        return 'bg-amber-100 text-amber-800 border-amber-300';
      case 'media':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      default:
        return 'bg-slate-100 text-slate-800 border-slate-300';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full border border-slate-200 overflow-hidden my-6 animate-in fade-in zoom-in-95 duration-150">
        {/* Top Header Bar */}
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center border ${
                item.channel === 'whatsapp'
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-400/30'
                  : 'bg-indigo-500/20 text-indigo-300 border-indigo-400/30'
              }`}
            >
              {item.channel === 'whatsapp' ? (
                <MessageSquare className="w-5 h-5" />
              ) : (
                <Mail className="w-5 h-5" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs px-2 py-0.5 rounded-md bg-white/10 text-slate-300">
                  {item.trackingNumber}
                </span>
                <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-md border ${getUrgencyBadge(item.urgency)}`}>
                  Urgencia {item.urgency}
                </span>
                <span className="text-xs text-indigo-200 font-medium">
                  {item.category}
                </span>
              </div>
              <h3 className="font-bold text-base md:text-lg leading-tight line-clamp-1 mt-0.5 text-white">
                {item.subject}
              </h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Sender and Reception Metadata Bar */}
        <div className="bg-slate-50 border-b border-slate-200 px-6 py-2.5 flex flex-wrap items-center justify-between text-xs text-slate-600 gap-3">
          <div className="flex items-center gap-4 flex-wrap">
            <span>
              <strong>Remitente:</strong> {item.sender} ({item.senderContact})
            </span>
            <span>•</span>
            <span className="flex items-center gap-1 text-slate-500">
              <Clock className="w-3.5 h-3.5" />
              {formatDateTime(item.receivedAt)}
            </span>
            <span>•</span>
            <span className="capitalize font-semibold text-indigo-600">
              Canal: {item.channel.toUpperCase()}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {item.requiresSignature && (
              item.electronicSignature?.isSigned ? (
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded-full border border-emerald-300">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  Firmado ({item.electronicSignature.verificationCode})
                </span>
              ) : (
                <button
                  onClick={() => onOpenSignature(item)}
                  className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-900 bg-amber-200 hover:bg-amber-300 px-2.5 py-0.5 rounded-full border border-amber-300 transition-colors"
                >
                  <FileSignature className="w-3.5 h-3.5 text-amber-700" />
                  Firma Pendiente (Clic para Firmar)
                </button>
              )
            )}

            {item.calendarEvent && (
              <span className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full border ${
                item.calendarEvent.isScheduled
                  ? 'bg-blue-100 text-blue-800 border-blue-300'
                  : 'bg-slate-200 text-slate-700 border-slate-300'
              }`}>
                <Calendar className="w-3.5 h-3.5" />
                {item.calendarEvent.isScheduled ? 'Agendado en Calendario' : 'Sin Agendar'}
              </span>
            )}
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="px-6 border-b border-slate-200 bg-white flex items-center gap-2 overflow-x-auto">
          <button
            onClick={() => setActiveTab('summary')}
            className={`py-3 px-3 text-xs font-semibold border-b-2 transition-colors flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'summary'
                ? 'border-indigo-600 text-indigo-700'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            Resumen IA &amp; Tareas
          </button>

          <button
            onClick={() => setActiveTab('attachments')}
            className={`py-3 px-3 text-xs font-semibold border-b-2 transition-colors flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'attachments'
                ? 'border-indigo-600 text-indigo-700'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            Adjuntos ({item.attachments.length})
          </button>

          {item.calendarEvent && (
            <button
              onClick={() => setActiveTab('calendar')}
              className={`py-3 px-3 text-xs font-semibold border-b-2 transition-colors flex items-center gap-1.5 whitespace-nowrap ${
                activeTab === 'calendar'
                  ? 'border-indigo-600 text-indigo-700'
                  : 'border-transparent text-slate-600 hover:text-slate-900'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              Agenda &amp; Plazos
            </button>
          )}

          <button
            onClick={() => setActiveTab('signature')}
            className={`py-3 px-3 text-xs font-semibold border-b-2 transition-colors flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'signature'
                ? 'border-indigo-600 text-indigo-700'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <FileSignature className="w-3.5 h-3.5" />
            Firma Electrónica
            {item.requiresSignature && !item.electronicSignature?.isSigned && (
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
            )}
          </button>

          <button
            onClick={() => setActiveTab('reply')}
            className={`py-3 px-3 text-xs font-semibold border-b-2 transition-colors flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'reply'
                ? 'border-indigo-600 text-indigo-700'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Send className="w-3.5 h-3.5" />
            Respuestas &amp; Notificaciones
          </button>

          <button
            onClick={() => setActiveTab('audit')}
            className={`py-3 px-3 text-xs font-semibold border-b-2 transition-colors flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'audit'
                ? 'border-indigo-600 text-indigo-700'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            Cadena de Custodia
          </button>
        </div>

        {/* Tab Content Panes */}
        <div className="p-6 max-h-[65vh] overflow-y-auto space-y-5">
          {/* TAB 1: SUMMARY & ACTION ITEMS */}
          {activeTab === 'summary' && (
            <div className="space-y-5">
              {/* Executive Summary Card */}
              <div className="border border-indigo-100 bg-gradient-to-br from-indigo-50/50 to-white rounded-xl p-4.5 space-y-2">
                <div className="flex items-center gap-2 text-indigo-900 font-bold text-xs uppercase tracking-wider">
                  <Sparkles className="w-4 h-4 text-indigo-600" />
                  Resumen Ejecutivo Generado por IA
                </div>
                <p className="text-sm text-slate-700 leading-relaxed font-normal">
                  {item.summary}
                </p>
              </div>

              {/* Key Highlights */}
              <div className="border border-slate-200 rounded-xl p-4 bg-white space-y-2.5">
                <h4 className="font-semibold text-slate-800 text-xs uppercase tracking-wider flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-blue-500" />
                  Puntos Clave del Documento
                </h4>
                <ul className="space-y-1.5 text-xs text-slate-600 list-disc list-inside">
                  {item.keyPoints.map((point, idx) => (
                    <li key={idx} className="leading-normal">
                      {point}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Action Items Checklist */}
              <div className="border border-slate-200 rounded-xl p-4 bg-white space-y-2.5">
                <h4 className="font-semibold text-slate-800 text-xs uppercase tracking-wider flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <ListTodo className="w-4 h-4 text-emerald-600" />
                    Lista de Acciones Pendientes
                  </span>
                  <span className="text-[11px] font-normal text-slate-500">
                    Haga clic para tachar tareas completadas
                  </span>
                </h4>
                <div className="space-y-2">
                  {item.actionItems.map((action, idx) => {
                    const isChecked = Boolean(completedActions[idx]);
                    return (
                      <label
                        key={idx}
                        className={`flex items-start gap-2.5 p-2 rounded-lg cursor-pointer transition-colors border ${
                          isChecked
                            ? 'bg-emerald-50/60 border-emerald-200 text-emerald-900 line-through'
                            : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleAction(idx)}
                          className="mt-0.5 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300"
                        />
                        <span className="text-xs leading-normal">{action}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Original Content Snippet */}
              <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/50 space-y-1.5">
                <h4 className="font-semibold text-slate-700 text-xs uppercase tracking-wider">
                  Texto Original de la Correspondencia
                </h4>
                <pre className="text-xs text-slate-600 whitespace-pre-wrap font-sans bg-white p-3 rounded-lg border border-slate-200 max-h-48 overflow-y-auto leading-relaxed">
                  {item.content}
                </pre>
              </div>

              {/* Entities and Tags */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="border border-slate-200 rounded-xl p-3.5 bg-white space-y-2">
                  <span className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                    <Building className="w-3.5 h-3.5 text-slate-400" />
                    Entidades Detectadas
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {item.entities.map((ent, idx) => (
                      <span
                        key={idx}
                        className="text-[11px] font-medium px-2 py-0.5 bg-slate-100 text-slate-700 rounded-md border border-slate-200"
                      >
                        {ent.name}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="border border-slate-200 rounded-xl p-3.5 bg-white space-y-2">
                  <span className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                    <Tag className="w-3.5 h-3.5 text-slate-400" />
                    Etiquetas Clave
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {item.tags.map((tag, idx) => (
                      <span
                        key={idx}
                        className="text-[11px] font-medium px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded-md border border-indigo-200"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: ATTACHMENTS */}
          {activeTab === 'attachments' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-semibold text-slate-800 text-sm">
                  Documentos y Anexos Procesados ({item.attachments.length})
                </h4>
              </div>

              {item.attachments.length === 0 ? (
                <div className="text-center py-10 text-slate-400 text-xs">
                  Esta correspondencia no contiene archivos adjuntos.
                </div>
              ) : (
                item.attachments.map((att, idx) => (
                  <div
                    key={att.id || idx}
                    className="border border-slate-200 rounded-xl p-4 bg-white space-y-3 hover:border-slate-300 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-xs uppercase">
                          {att.type.substring(0, 3)}
                        </div>
                        <div>
                          <h5 className="font-semibold text-slate-800 text-sm">
                            {att.name}
                          </h5>
                          <span className="text-xs text-slate-400">
                            Tamaño: {att.size}
                          </span>
                        </div>
                      </div>

                      {att.isSigned && (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                          Firmado Digitalmente ({att.signatureStamp})
                        </span>
                      )}
                    </div>

                    {att.textContent && (
                      <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-xs text-slate-700 font-mono whitespace-pre-wrap max-h-36 overflow-y-auto">
                        {att.textContent}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          )}

          {/* TAB 3: CALENDAR & DEADLINES */}
          {activeTab === 'calendar' && item.calendarEvent && (
            <div className="space-y-4">
              <div className={`border rounded-xl p-4.5 space-y-3 ${
                item.calendarEvent.isDeadline
                  ? 'border-amber-200 bg-amber-50/20'
                  : 'border-blue-200 bg-blue-50/20'
              }`}>
                <div className="flex items-center justify-between">
                  <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${
                    item.calendarEvent.isDeadline
                      ? 'bg-amber-100 text-amber-800 border border-amber-200'
                      : 'bg-blue-100 text-blue-800 border border-blue-200'
                  }`}>
                    {item.calendarEvent.isDeadline ? 'Plazo Perentorio Fatal' : 'Citación / Audiencia / Reunión'}
                  </span>
                  <div className="flex items-center gap-2">
                    <label className="text-xs font-semibold text-slate-700 flex items-center gap-2 cursor-pointer">
                      <span>Agendado en mi calendario:</span>
                      <input
                        type="checkbox"
                        checked={item.calendarEvent.isScheduled}
                        onChange={e => onToggleSchedule(item.id, e.target.checked)}
                        className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer"
                      />
                    </label>
                  </div>
                </div>

                <h4 className="font-bold text-slate-900 text-base">
                  {item.calendarEvent.title}
                </h4>

                <p className="text-xs text-slate-700">
                  {item.calendarEvent.description}
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs text-slate-600 pt-2 border-t border-slate-200/80">
                  <div>
                    <strong>Fecha y Hora de Inicio:</strong>{' '}
                    {formatDateTime(item.calendarEvent.startDateTime)}
                  </div>
                  <div>
                    <strong>Lugar / Conferencia:</strong>{' '}
                    {item.calendarEvent.locationOrLink}
                  </div>
                </div>

                {/* External Actions */}
                <div className="flex flex-wrap items-center gap-2 pt-2">
                  {item.calendarEvent.googleCalendarUrl && (
                    <a
                      href={item.calendarEvent.googleCalendarUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium transition-colors"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      Sincronizar en Google Calendar
                    </a>
                  )}

                  <button
                    type="button"
                    onClick={() => {
                      if (item.calendarEvent) {
                        import('../utils/calendar').then(({ downloadIcsFile }) => {
                          downloadIcsFile(
                            item.calendarEvent!.title,
                            item.calendarEvent!.description,
                            item.calendarEvent!.locationOrLink,
                            item.calendarEvent!.startDateTime,
                            item.calendarEvent!.endDateTime
                          );
                        });
                      }
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-medium transition-colors"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Descargar Archivo iCal (.ics)
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: ELECTRONIC SIGNATURE */}
          {activeTab === 'signature' && (
            <div className="space-y-4">
              {item.electronicSignature?.isSigned ? (
                /* Document is signed */
                <div className="border border-emerald-200 bg-emerald-50/20 rounded-xl p-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-emerald-800 font-bold text-sm">
                      <ShieldCheck className="w-5 h-5 text-emerald-600" />
                      Documento Firmado Electrónicamente con Validez Plena
                    </div>
                    <span className="font-mono text-xs font-bold text-emerald-700 bg-emerald-100 px-2.5 py-1 rounded-md border border-emerald-300">
                      {item.electronicSignature.verificationCode}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-slate-700">
                    <div>
                      <strong>Firmante:</strong> {item.electronicSignature.signerName}
                    </div>
                    <div>
                      <strong>Identificación / C.C.:</strong> {item.electronicSignature.signerIdNumber || 'N/A'}
                    </div>
                    <div>
                      <strong>Rol / Cargo:</strong> {item.electronicSignature.signerRole}
                    </div>
                    <div>
                      <strong>Fecha de Firma:</strong> {formatDateTime(item.electronicSignature.signedAt)}
                    </div>
                  </div>

                  {/* Signature visual rendering */}
                  <div className="border border-slate-200 bg-white rounded-lg p-3 text-center space-y-1">
                    <span className="text-[10px] text-slate-400 uppercase tracking-wider block">
                      Trazo de Firma Digitalizado
                    </span>
                    <img
                      src={item.electronicSignature.signatureDataUrl}
                      alt="Firma Electrónica"
                      className="h-20 mx-auto object-contain"
                    />
                    <div className="text-[10px] text-slate-400 font-mono">
                      Huella Criptográfica SHA-256: {item.electronicSignature.digitalHashSha256}
                    </div>
                  </div>

                  <div className="text-[11px] text-slate-500 bg-white p-3 rounded-lg border border-slate-200">
                    Certificación de auditoría generada conforme a la normativa de firma electrónica avanzada. El documento se encuentra sellado contra modificaciones y cuenta con estampa de tiempo verificable.
                  </div>
                </div>
              ) : item.requiresSignature ? (
                /* Document requires signature and is pending */
                <div className="border border-amber-200 bg-amber-50/40 rounded-xl p-5 space-y-3.5 text-center">
                  <FileSignature className="w-10 h-10 text-amber-600 mx-auto" />
                  <div>
                    <h4 className="font-bold text-slate-900 text-base">
                      Firma Electrónica Pendiente de Aprobación
                    </h4>
                    <p className="text-xs text-slate-600 max-w-lg mx-auto mt-1">
                      Este documento requiere la suscripción formal por parte de{' '}
                      <strong>{item.signatureDetails?.signerRole || 'Representante Autorizado'}</strong>{' '}
                      antes del vencimiento.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => onOpenSignature(item)}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs shadow-sm transition-all hover:shadow"
                  >
                    <FileSignature className="w-4 h-4" />
                    Abrir Módulo de Firma Electrónica
                  </button>
                </div>
              ) : (
                <div className="text-center py-10 text-slate-400 text-xs">
                  Este trámite no requiere firma electrónica obligatoria.
                </div>
              )}
            </div>
          )}

          {/* TAB 5: REPLY GENERATOR & NOTIFICATION DISPATCH */}
          {activeTab === 'reply' && (
            <div className="space-y-4">
              <div className="border border-slate-200 rounded-xl p-4 bg-white space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold text-slate-800 text-sm flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-indigo-600" />
                    Generador de Respuestas Inteligentes por IA
                  </h4>
                  <div className="flex items-center gap-1.5">
                    <select
                      value={replyTone}
                      onChange={e => setReplyTone(e.target.value as any)}
                      className="text-xs px-2.5 py-1 bg-slate-50 border border-slate-300 rounded-lg focus:outline-none"
                    >
                      <option value="formal">Tono Formal Institucional</option>
                      <option value="cordial">Tono Cordial / WhatsApp</option>
                      <option value="acceptance">Confirmación y Aceptación</option>
                      <option value="extension">Solicitud de Prórroga</option>
                    </select>

                    <button
                      type="button"
                      disabled={isGeneratingReply}
                      onClick={handleGenerateCustomReply}
                      className="flex items-center gap-1 px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-medium rounded-lg transition-colors disabled:opacity-50"
                    >
                      <RefreshCw className={`w-3 h-3 ${isGeneratingReply ? 'animate-spin' : ''}`} />
                      {isGeneratingReply ? 'Generando...' : 'Regenerar'}
                    </button>
                  </div>
                </div>

                <textarea
                  rows={6}
                  value={generatedReply}
                  onChange={e => setGeneratedReply(e.target.value)}
                  className="w-full text-xs p-3 rounded-lg border border-slate-300 font-sans focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />

                <div className="flex items-center justify-between">
                  <button
                    type="button"
                    onClick={handleCopyReply}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    {copied ? 'Copiado' : 'Copiar Texto'}
                  </button>

                  <div className="flex items-center gap-2">
                    {item.channel === 'whatsapp' && (
                      <a
                        href={`https://wa.me/${item.senderContact.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(generatedReply)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium transition-colors"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                        Enviar por WhatsApp Web
                      </a>
                    )}
                    {item.channel === 'email' && (
                      <a
                        href={`mailto:${item.senderContact}?subject=${encodeURIComponent(`Re: ${item.subject}`)}&body=${encodeURIComponent(generatedReply)}`}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-medium transition-colors"
                      >
                        <Mail className="w-3.5 h-3.5" />
                        Abrir Cliente de Correo
                      </a>
                    )}
                    <button
                      type="button"
                      onClick={handleQuickDispatchReply}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-medium transition-colors"
                    >
                      <Send className="w-3.5 h-3.5" />
                      Registrar Envío en Historial
                    </button>
                  </div>
                </div>

                {quickNotifSuccess && (
                  <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs p-2 rounded-lg flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Respuesta despachada y anexada a la bitácora de la correspondencia.</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 6: AUDIT TRAIL */}
          {activeTab === 'audit' && (
            <div className="space-y-3">
              <h4 className="font-semibold text-slate-800 text-xs uppercase tracking-wider">
                Bitácora Cronológica &amp; Cadena de Custodia Inalterable
              </h4>
              <div className="space-y-2 border-l-2 border-slate-200 ml-2 pl-4">
                {item.auditTrail.map((record, idx) => (
                  <div key={record.id || idx} className="relative pb-3 text-xs">
                    <div className="w-2.5 h-2.5 rounded-full bg-indigo-600 absolute -left-[21px] top-1" />
                    <div className="flex items-center justify-between text-slate-400 text-[10px]">
                      <span>{formatDateTime(record.timestamp)}</span>
                      <span className="font-medium text-slate-600">{record.actor}</span>
                    </div>
                    <div className="font-semibold text-slate-800 mt-0.5">
                      {record.action}
                    </div>
                    <div className="text-slate-600 text-[11px] mt-0.5">
                      {record.details}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-slate-50 px-6 py-3 border-t border-slate-200 flex items-center justify-between text-xs">
          <span className="text-slate-500">
            Radicado Oficial: <strong>{item.trackingNumber}</strong>
          </span>
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
