import React, { useState } from 'react';
import { CorrespondenceItem, Channel, Attachment } from '../types';
import { analyzeCorrespondenceWithGemini } from '../services/correspondenceStore';
import { generateGoogleCalendarUrl } from '../utils/calendar';
import {
  X,
  Mail,
  MessageSquare,
  Sparkles,
  Paperclip,
  Upload,
  FileText,
  Clock,
  CheckCircle2,
  AlertTriangle,
  FileSignature,
} from 'lucide-react';

interface NewCorrespondenceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: (item: CorrespondenceItem) => void;
}

export const NewCorrespondenceModal: React.FC<NewCorrespondenceModalProps> = ({
  isOpen,
  onClose,
  onCreated,
}) => {
  const [channel, setChannel] = useState<Channel>('email');
  const [sender, setSender] = useState('');
  const [senderContact, setSenderContact] = useState('');
  const [subject, setSubject] = useState('');
  const [content, setContent] = useState('');
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStep, setProcessingStep] = useState('');

  if (!isOpen) return null;

  // Preset realistic scenarios for quick 1-click test
  const loadScenario = (type: 'court' | 'contract' | 'whatsapp_meeting' | 'tax') => {
    if (type === 'court') {
      setChannel('email');
      setSender('Tribunal Administrativo de Cundinamarca - Sección Tercera');
      setSenderContact('notificacionesjudiciales@tribunaladm.gov.co');
      setSubject('NOTIFICACIÓN DE AUTO: Citación a Audiencia de Pruebas y Alegatos - Exp. 2026-0814');
      setContent(`Por medio del presente se notifica a las partes el Auto de fecha 09 de octubre de 2026 proferido dentro del medio de control de Reparación Directa radicado bajo el expediente N° 2026-0814.\n\nSe convoca a las partes a la Audiencia de Pruebas y Alegatos de Conclusión que tendrá lugar el próximo miércoles 21 de octubre de 2026 a las 10:00 AM a través del enlace de Microsoft Teams institucional: https://teams.microsoft.com/l/meetup-join/tribunal-exp814.\n\nAsimismo, se concede un término perentorio e improrrogable de cinco (5) días hábiles contados a partir del recibo de esta comunicación para presentar objeciones al dictamen pericial contable.`);
      setAttachments([
        {
          id: `att-${Date.now()}-1`,
          name: 'Auto_Citacion_Audiencia_Exp_2026_0814.pdf',
          type: 'pdf',
          size: '1.4 MB',
          textContent: 'TRIBUNAL ADMINISTRATIVO. Auto fijando fecha de audiencia para el 21 de octubre de 2026 a las 10:00 AM. Plazo perentorio de objeciones: 5 días.',
        },
      ]);
    } else if (type === 'contract') {
      setChannel('email');
      setSender('Consultoría & Auditoría Estratégica S.A.S.');
      setSenderContact('legal@consultoriaestrategica.com');
      setSubject('REMISIÓN PARA FIRMA: Contrato de Auditoría Externa y Acuerdo de Confidencialidad 2026');
      setContent(`Estimada Gerencia:\n\nAdjuntamos la minuta definitiva del Contrato de Prestación de Servicios de Auditoría Integral y Revisoría Fiscal para la vigencia 2026-2027. Solicitamos amablemente la firma electrónica del Representante Legal a más tardar el viernes 16 de octubre de 2026 antes de las 17:00 horas, con el fin de protocolizar el inicio de actividades el primer día hábil de noviembre.\n\nEl documento contiene las cláusulas de responsabilidad profesional, pólizas de cumplimiento requeridas y estipulación de honorarios por $32.000.000 COP pagaderos en cuatro cuotas.`);
      setAttachments([
        {
          id: `att-${Date.now()}-2`,
          name: 'Contrato_Auditoria_Integral_2026_Final.pdf',
          type: 'pdf',
          size: '2.1 MB',
          textContent: 'CONTRATO DE AUDITORÍA Y REVISORÍA FISCAL. Partes contratantes: Consultoría Estratégica SAS y Tu Empresa. Honorarios: $32.000.000 COP. Requiere firma electrónica antes del 16 de octubre de 2026.',
        },
      ]);
    } else if (type === 'whatsapp_meeting') {
      setChannel('whatsapp');
      setSender('Ing. Felipe Morales (Comité de Innovación)');
      setSenderContact('+57 315 789 1234');
      setSubject('Convocatoria WhatsApp: Sesión Extraordinaria de Lanzamiento Nuevo Producto');
      setContent(`¡Hola equipo! 🚀 Les comparto que acabamos de cerrar las pruebas de integración. Convocamos a sesión urgente del Comité de Producto y Operaciones para el próximo martes 13 de octubre de 2026 a las 08:30 AM (hora Colombia). Enlace Meet: https://meet.google.com/inn-prod-2026. Por favor confirmar asistencia antes de mañana a mediodía para ajustar el orden del día. Adjunto el roadmap técnico.`);
      setAttachments([
        {
          id: `att-${Date.now()}-3`,
          name: 'Roadmap_Lanzamiento_Q4_2026.pdf',
          type: 'pdf',
          size: '850 KB',
          textContent: 'Roadmap y cronograma de despliegue en producción para la nueva versión de la plataforma web y móvil.',
        },
      ]);
    } else if (type === 'tax') {
      setChannel('email');
      setSender('Secretaría de Hacienda Distrital');
      setSenderContact('rentas@haciendabogota.gov.co');
      setSubject('EMPLAZAMIENTO PARA DECLARAR: Impuesto de Industria y Comercio ICA Periodo 3');
      setContent(`La Dirección Distrital de Impuestos notifica formalmente Emplazamiento para Declarar ICA N° EMP-2026-4412. Se otorga un plazo perentorio legal de un (1) mes contado a partir de la notificación (fecha límite 09 de noviembre de 2026) para presentar la declaración correspondiente o justificar los motivos de no obligatoriedad, so pena de aplicar la sanción por extemporaneidad o aforo correspondiente.`);
      setAttachments([
        {
          id: `att-${Date.now()}-4`,
          name: 'Emplazamiento_ICA_EMP_2026_4412.pdf',
          type: 'pdf',
          size: '1.1 MB',
          textContent: 'SECRETARÍA DE HACIENDA. Emplazamiento para declarar ICA periodo 3. Plazo fatal para responder: 9 de noviembre de 2026.',
        },
      ]);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const newAtts: Attachment[] = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      newAtts.push({
        id: `att-up-${Date.now()}-${i}`,
        name: file.name,
        type: file.type || 'document',
        size: `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
        textContent: `Documento cargado por el usuario: ${file.name} (${file.type || 'archivo'}).`,
      });
    }

    setAttachments([...attachments, ...newAtts]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() && attachments.length === 0) {
      alert('Por favor ingrese el contenido del mensaje o adjunte un archivo para analizar.');
      return;
    }

    setIsProcessing(true);
    setProcessingStep('1/4 Conectando con Gemini 3.8 Flash Engine...');

    try {
      setTimeout(() => {
        setProcessingStep('2/4 Analizando adjuntos, clasificación semántica y entidades...');
      }, 700);

      setTimeout(() => {
        setProcessingStep('3/4 Detectando citaciones, plazos de calendario y firma electrónica...');
      }, 1400);

      const analysis = await analyzeCorrespondenceWithGemini({
        channel,
        sender: sender.trim() || (channel === 'whatsapp' ? 'Contacto WhatsApp' : 'Remitente Correo'),
        senderContact: senderContact.trim() || (channel === 'whatsapp' ? '+57 300 000 0000' : 'contacto@empresa.com'),
        subject: subject.trim() || 'Correspondencia sin Asunto',
        content: content.trim(),
        attachments,
      });

      setProcessingStep('4/4 Guardando en base de datos organizada y sincronizando agenda...');

      const trackingNumber = `COR-2026-${Math.floor(1000 + Math.random() * 9000)}`;

      // Create calendar event if analysis detected summons or deadlines
      let calEvent = undefined;
      if (analysis.hasSummonsOrDeadlines && analysis.calendarEvent) {
        calEvent = {
          id: `cal-${Date.now()}`,
          title: analysis.calendarEvent.title,
          description: analysis.calendarEvent.description,
          startDateTime: analysis.calendarEvent.startDateTime,
          endDateTime: analysis.calendarEvent.endDateTime,
          locationOrLink: analysis.calendarEvent.locationOrLink || 'Remoto / Conferencia',
          isDeadline: Boolean(analysis.calendarEvent.isDeadline),
          isScheduled: true, // Auto-schedule
          scheduledAt: new Date().toISOString(),
          googleCalendarUrl: generateGoogleCalendarUrl(
            analysis.calendarEvent.title,
            analysis.calendarEvent.description,
            analysis.calendarEvent.locationOrLink,
            analysis.calendarEvent.startDateTime,
            analysis.calendarEvent.endDateTime
          ),
          reminderMinutesBefore: analysis.calendarEvent.reminderMinutesBefore || 120,
        };
      }

      const newItem: CorrespondenceItem = {
        id: `cor-${Date.now()}`,
        trackingNumber,
        channel,
        sender: sender.trim() || (channel === 'whatsapp' ? 'Contacto WhatsApp' : 'Remitente Correo'),
        senderContact: senderContact.trim() || (channel === 'whatsapp' ? '+57 300 000 0000' : 'contacto@empresa.com'),
        recipient: 'gerencia@tuempresa.com',
        subject: subject.trim() || (channel === 'whatsapp' ? 'Mensaje entrante de WhatsApp' : 'Correo electrónico entrante'),
        content: content.trim(),
        receivedAt: new Date().toISOString(),
        status: calEvent ? 'agendado' : 'procesado',
        category: analysis.category || 'Administrativo',
        urgency: analysis.urgency || 'media',
        summary: analysis.summary || 'Procesado exitosamente por IA.',
        keyPoints: analysis.keyPoints || [],
        actionItems: analysis.actionItems || [],
        attachments,
        hasSummonsOrDeadlines: Boolean(analysis.hasSummonsOrDeadlines),
        calendarEvent: calEvent,
        requiresSignature: Boolean(analysis.requiresSignature),
        signatureDetails: analysis.signatureDetails,
        suggestedReply: analysis.suggestedReply,
        entities: analysis.entities || [],
        tags: analysis.tags || [channel === 'whatsapp' ? 'WhatsApp' : 'Email'],
        notificationHistory: [
          {
            id: `notif-${Date.now()}`,
            channel,
            recipient: senderContact.trim() || sender.trim(),
            title: `Confirmación de Recepción Automática - ${trackingNumber}`,
            message: `Correspondencia recibida y procesada con éxito bajo radicado ${trackingNumber}.`,
            sentAt: new Date().toISOString(),
            status: 'entregado',
            triggerType: 'auto_ingestion',
          },
        ],
        auditTrail: [
          {
            id: `aud-${Date.now()}-1`,
            timestamp: new Date().toISOString(),
            action: `Ingesta de Correspondencia (${channel.toUpperCase()})`,
            actor: 'Inbound Webhook / Usuario',
            details: `Registrado radicado ${trackingNumber} con ${attachments.length} adjuntos.`,
          },
          {
            id: `aud-${Date.now()}-2`,
            timestamp: new Date().toISOString(),
            action: 'Clasificación & Análisis IA',
            actor: 'Gemini 3.8 Flash Engine',
            details: `Clasificado: ${analysis.category} | Urgencia: ${analysis.urgency}. ${analysis.hasSummonsOrDeadlines ? 'Evento detectado y agendado.' : ''} ${analysis.requiresSignature ? 'Firma requerida.' : ''}`,
          },
        ],
      };

      setTimeout(() => {
        setIsProcessing(false);
        onCreated(newItem);
        onClose();
      }, 500);
    } catch (err: any) {
      console.error(err);
      setIsProcessing(false);
      alert('Ocurrió un error al procesar con IA: ' + (err.message || String(err)));
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full border border-slate-200 overflow-hidden my-6 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-300">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-lg leading-tight flex items-center gap-2">
                Ingesta &amp; Procesamiento IA de Correspondencia
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  Gemini 3.8 Flash
                </span>
              </h3>
              <p className="text-xs text-slate-300 mt-0.5">
                Revisa el mensaje, descarga adjuntos, clasifica, detecta citaciones y agenda automáticamente
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isProcessing}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Demo Scenarios Bar */}
        <div className="px-6 py-2.5 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold text-slate-600">Simulaciones Rápidas:</span>
          <button
            type="button"
            onClick={() => loadScenario('court')}
            className="px-2.5 py-1 text-xs font-medium rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 hover:border-slate-300 transition-colors"
          >
            ⚖️ Citación Judicial Audiencia
          </button>
          <button
            type="button"
            onClick={() => loadScenario('contract')}
            className="px-2.5 py-1 text-xs font-medium rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 hover:border-slate-300 transition-colors"
          >
            ✍️ Contrato para Firma Digital
          </button>
          <button
            type="button"
            onClick={() => loadScenario('whatsapp_meeting')}
            className="px-2.5 py-1 text-xs font-medium rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 hover:border-slate-300 transition-colors"
          >
            💬 Convocatoria WhatsApp
          </button>
          <button
            type="button"
            onClick={() => loadScenario('tax')}
            className="px-2.5 py-1 text-xs font-medium rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 hover:border-slate-300 transition-colors"
          >
            🏛️ Requerimiento Tributario
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          {/* Channel selector */}
          <div className="flex items-center gap-3">
            <label className="text-xs font-semibold text-slate-700">Canal de Entrada:</label>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setChannel('email')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                  channel === 'email'
                    ? 'bg-indigo-50 border-indigo-600 text-indigo-700 shadow-xs'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <Mail className="w-3.5 h-3.5" />
                Correo Electrónico (Mail)
              </button>
              <button
                type="button"
                onClick={() => setChannel('whatsapp')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                  channel === 'whatsapp'
                    ? 'bg-emerald-50 border-emerald-600 text-emerald-800 shadow-xs'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <MessageSquare className="w-3.5 h-3.5" />
                WhatsApp (Chat / Business)
              </button>
            </div>
          </div>

          {/* Senders grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Remitente (Nombre o Entidad) *
              </label>
              <input
                type="text"
                required
                value={sender}
                onChange={e => setSender(e.target.value)}
                placeholder={channel === 'whatsapp' ? 'Ej. Ing. Carlos Pérez' : 'Ej. Juzgado 4 Civil del Circuito'}
                className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {channel === 'whatsapp' ? 'Número Telefónico WhatsApp' : 'Correo Electrónico Remitente'} *
              </label>
              <input
                type="text"
                required
                value={senderContact}
                onChange={e => setSenderContact(e.target.value)}
                placeholder={channel === 'whatsapp' ? '+57 310 987 6543' : 'notificaciones@entidad.gov.co'}
                className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Subject */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Asunto / Título de la Correspondencia
            </label>
            <input
              type="text"
              value={subject}
              onChange={e => setSubject(e.target.value)}
              placeholder="Ej. Citación a Audiencia de Conciliación / Remisión de Contrato para Firma"
              className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
          </div>

          {/* Content / Body */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Cuerpo del Mensaje o Texto Transcrito *
            </label>
            <textarea
              required
              rows={5}
              value={content}
              onChange={e => setContent(e.target.value)}
              placeholder="Pegue aquí el texto del correo, mensaje de WhatsApp, transcripción de audio o detalles de la notificación..."
              className="w-full text-xs p-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:outline-none font-mono text-slate-800 leading-relaxed"
            />
          </div>

          {/* Attachments Section */}
          <div className="border border-slate-200 rounded-xl p-3.5 bg-slate-50 space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                <Paperclip className="w-4 h-4 text-slate-500" />
                Archivos Adjuntos ({attachments.length})
              </label>
              <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1 bg-white border border-slate-300 hover:bg-slate-100 rounded-lg text-xs font-medium text-slate-700 transition-colors">
                <Upload className="w-3.5 h-3.5" />
                Cargar Archivo Local
                <input
                  type="file"
                  multiple
                  onChange={handleFileUpload}
                  className="hidden"
                  accept=".pdf,.doc,.docx,.txt,.png,.jpg,.jpeg,.xlsx"
                />
              </label>
            </div>

            {attachments.length > 0 ? (
              <div className="space-y-1.5 max-h-32 overflow-y-auto">
                {attachments.map((att, idx) => (
                  <div
                    key={att.id || idx}
                    className="flex items-center justify-between bg-white px-3 py-1.5 rounded-lg border border-slate-200 text-xs"
                  >
                    <div className="flex items-center gap-2 truncate">
                      <FileText className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                      <span className="font-medium text-slate-700 truncate">{att.name}</span>
                      <span className="text-[10px] text-slate-400">({att.size})</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setAttachments(attachments.filter((_, i) => i !== idx))}
                      className="text-slate-400 hover:text-rose-600 p-0.5"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-[11px] text-slate-400 text-center py-2">
                Sin archivos adjuntos. Puede subir PDFs, resoluciones o contratos escaneados.
              </p>
            )}
          </div>

          {/* Processing progress screen overlay */}
          {isProcessing && (
            <div className="bg-indigo-50/90 border border-indigo-200 rounded-xl p-4 text-center space-y-2 animate-pulse">
              <div className="flex items-center justify-center gap-2 text-indigo-900 font-semibold text-sm">
                <Sparkles className="w-5 h-5 text-indigo-600 animate-spin" />
                Procesando con Inteligencia Artificial Gemini
              </div>
              <p className="text-xs text-indigo-700 font-mono">
                {processingStep}
              </p>
            </div>
          )}

          {/* Submit footer */}
          <div className="pt-2 flex items-center justify-between">
            <button
              type="button"
              disabled={isProcessing}
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isProcessing}
              className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-xs transition-all hover:shadow disabled:opacity-50"
            >
              <Sparkles className="w-4 h-4" />
              {isProcessing ? 'Analizando...' : 'Analizar, Clasificar y Guardar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
