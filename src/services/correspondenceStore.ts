import { CorrespondenceItem, ElectronicSignature, NotificationLog, AuditRecord, CalendarEvent } from '../types';
import { initialCorrespondenceData } from '../mockData';
import { generateGoogleCalendarUrl } from '../utils/calendar';

const STORAGE_KEY = 'correspondencia_ai_items_v1';

class CorrespondenceStore {
  private items: CorrespondenceItem[] = [];
  private listeners: Array<(items: CorrespondenceItem[]) => void> = [];

  constructor() {
    this.loadFromStorage();
  }

  private loadFromStorage() {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (data) {
        this.items = JSON.parse(data);
      } else {
        this.items = [...initialCorrespondenceData];
        this.saveToStorage();
      }
    } catch (err) {
      console.warn('Failed to read from localStorage:', err);
      this.items = [...initialCorrespondenceData];
    }
  }

  private saveToStorage() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.items));
    } catch (err) {
      console.warn('Failed to save to localStorage:', err);
    }
    this.notify();
  }

  private notify() {
    for (const listener of this.listeners) {
      listener(this.getItems());
    }
  }

  public subscribe(listener: (items: CorrespondenceItem[]) => void): () => void {
    this.listeners.push(listener);
    listener(this.getItems());
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  public getItems(): CorrespondenceItem[] {
    return [...this.items];
  }

  public getItemById(id: string): CorrespondenceItem | undefined {
    return this.items.find(i => i.id === id);
  }

  public addCorrespondence(item: CorrespondenceItem): void {
    this.items = [item, ...this.items];
    this.saveToStorage();
  }

  public updateCorrespondence(id: string, updates: Partial<CorrespondenceItem>): void {
    this.items = this.items.map(item => {
      if (item.id === id) {
        return { ...item, ...updates };
      }
      return item;
    });
    this.saveToStorage();
  }

  public deleteCorrespondence(id: string): void {
    this.items = this.items.filter(item => item.id !== id);
    this.saveToStorage();
  }

  public resetData(): void {
    this.items = [...initialCorrespondenceData];
    this.saveToStorage();
  }

  public scheduleEvent(id: string, isScheduled: boolean): void {
    const item = this.getItemById(id);
    if (!item || !item.calendarEvent) return;

    const gcalUrl = generateGoogleCalendarUrl(
      item.calendarEvent.title,
      item.calendarEvent.description,
      item.calendarEvent.locationOrLink,
      item.calendarEvent.startDateTime,
      item.calendarEvent.endDateTime
    );

    const updatedCalendarEvent: CalendarEvent = {
      ...item.calendarEvent,
      isScheduled: isScheduled,
      scheduledAt: isScheduled ? new Date().toISOString() : undefined,
      googleCalendarUrl: gcalUrl,
    };

    const newAudit: AuditRecord = {
      id: `aud-${Date.now()}`,
      timestamp: new Date().toISOString(),
      action: isScheduled ? 'Agendado en Calendario Personal' : 'Desagendado de Calendario',
      actor: 'Usuario',
      details: isScheduled
        ? `Evento "${updatedCalendarEvent.title}" programado para ${new Date(updatedCalendarEvent.startDateTime).toLocaleString()}.`
        : 'Evento retirado de la agenda activa.',
    };

    const newNotification: NotificationLog | null = isScheduled
      ? {
          id: `notif-${Date.now()}`,
          channel: item.channel,
          recipient: item.senderContact || item.sender,
          title: 'Notificación de Agendamiento',
          message: `Evento programado exitosamente para: ${updatedCalendarEvent.title}`,
          sentAt: new Date().toISOString(),
          status: 'entregado',
          triggerType: 'meeting_reminder',
        }
      : null;

    const updatedItem: CorrespondenceItem = {
      ...item,
      calendarEvent: updatedCalendarEvent,
      status: isScheduled ? 'agendado' : (item.electronicSignature?.isSigned ? 'firmado' : 'procesado'),
      auditTrail: [newAudit, ...item.auditTrail],
      notificationHistory: newNotification ? [newNotification, ...item.notificationHistory] : item.notificationHistory,
    };

    this.updateCorrespondence(id, updatedItem);
  }

  public applySignature(id: string, signature: ElectronicSignature): void {
    const item = this.getItemById(id);
    if (!item) return;

    const newAudit: AuditRecord = {
      id: `aud-${Date.now()}`,
      timestamp: new Date().toISOString(),
      action: 'Firma Electrónica Estampada',
      actor: `${signature.signerName} (${signature.signerRole})`,
      details: `Firma digital válida con token SHA-256: ${signature.digitalHashSha256.substring(0, 16)}... Código de verificación: ${signature.verificationCode}`,
    };

    const newNotification: NotificationLog = {
      id: `notif-${Date.now()}`,
      channel: item.channel,
      recipient: item.senderContact || item.sender,
      title: 'Comprobante de Firma Electrónica Emitido',
      message: `El documento "${item.signatureDetails?.documentTitle || item.subject}" ha sido firmado digitalmente por ${signature.signerName}. Código: ${signature.verificationCode}`,
      sentAt: new Date().toISOString(),
      status: 'entregado',
      triggerType: 'signature_request',
    };

    // Also mark any attachment as signed
    const updatedAttachments = item.attachments.map(att => ({
      ...att,
      isSigned: true,
      signatureStamp: signature.verificationCode,
    }));

    const updatedItem: CorrespondenceItem = {
      ...item,
      status: 'firmado',
      attachments: updatedAttachments,
      electronicSignature: signature,
      auditTrail: [newAudit, ...item.auditTrail],
      notificationHistory: [newNotification, ...item.notificationHistory],
    };

    this.updateCorrespondence(id, updatedItem);
  }

  public addNotificationLog(id: string, notif: NotificationLog): void {
    const item = this.getItemById(id);
    if (!item) return;

    const newAudit: AuditRecord = {
      id: `aud-${Date.now()}`,
      timestamp: new Date().toISOString(),
      action: `Notificación enviada por ${notif.channel.toUpperCase()}`,
      actor: 'Sistema de Notificaciones',
      details: `Destinatario: ${notif.recipient}. Asunto: "${notif.title}".`,
    };

    const updatedItem: CorrespondenceItem = {
      ...item,
      notificationHistory: [notif, ...item.notificationHistory],
      auditTrail: [newAudit, ...item.auditTrail],
    };

    this.updateCorrespondence(id, updatedItem);
  }
}

export const correspondenceStore = new CorrespondenceStore();

// API Helper functions
export async function analyzeCorrespondenceWithGemini(payload: {
  channel: 'email' | 'whatsapp';
  sender: string;
  senderContact: string;
  subject?: string;
  content: string;
  attachments?: Array<{ name: string; type: string; size: string; textContent?: string; previewText?: string }>;
}) {
  try {
    const res = await fetch('/api/correspondence/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.message || 'Error al conectar con el servidor de análisis');
    }

    const data = await res.json();
    return data.analysis;
  } catch (error) {
    console.warn('API call to Gemini backend failed, using smart fallback analyzer:', error);
    // Intelligent local fallback if network or key issue
    return generateLocalAnalysisFallback(payload);
  }
}

export async function generateCustomReply(payload: {
  correspondenceContext: string;
  sender: string;
  channel: 'email' | 'whatsapp';
  tone: string;
  userInstructions?: string;
}) {
  try {
    const res = await fetch('/api/correspondence/generate-reply', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      throw new Error('Error al generar respuesta');
    }

    const data = await res.json();
    return data.replyText;
  } catch (error) {
    // Graceful fallback response
    if (payload.channel === 'whatsapp') {
      return `¡Hola ${payload.sender}! He recibido tu mensaje y adjuntos. Ya los revisé y estamos gestionando lo requerido con el equipo. Te confirmo avances en breve. Saludos cordiales.`;
    }
    return `Estimado(a) ${payload.sender},\n\nAcusamos formal recibo de su comunicación y documentos adjuntos. Hemos procedido con su revisión y clasificación en nuestro sistema para adelantar las gestiones pertinentes.\n\nQuedamos a su entera disposición ante cualquier inquietud.\n\nCordialmente,\nEquipo de Gestión Documental`;
  }
}

function generateLocalAnalysisFallback(payload: {
  channel: 'email' | 'whatsapp';
  sender: string;
  subject?: string;
  content: string;
  attachments?: any[];
}) {
  const text = (payload.subject + ' ' + payload.content).toLowerCase();

  const isLegal = text.includes('juzgad') || text.includes('audienc') || text.includes('notific') || text.includes('radic') || text.includes('demanda');
  const isMeeting = text.includes('reunion') || text.includes('reunión') || text.includes('junta') || text.includes('sesion') || text.includes('convocat') || text.includes('meet') || text.includes('zoom');
  const isContract = text.includes('contrat') || text.includes('acuerd') || text.includes('firma') || text.includes('nda') || text.includes('convenio');
  const isInvoice = text.includes('factur') || text.includes('pago') || text.includes('cobro') || text.includes('banco') || text.includes('dian') || text.includes('tribut');

  let category = 'Administrativo y Correspondencia';
  if (isLegal) category = 'Legal / Notificación Judicial';
  else if (isMeeting) category = 'Convocatoria a Reunión';
  else if (isContract) category = 'Contratos y Convenios';
  else if (isInvoice) category = 'Financiero y Facturación';

  const urgency = isLegal || text.includes('urgente') || text.includes('perentorio') || text.includes('fatal') ? 'alta' : 'media';
  const requiresSignature = isContract || text.includes('firmar') || text.includes('firma');
  const hasSummonsOrDeadlines = isLegal || isMeeting || text.includes('plazo') || text.includes('fecha');

  // Next week date
  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + 4);
  futureDate.setHours(10, 0, 0, 0);

  const futureEndDate = new Date(futureDate);
  futureEndDate.setHours(11, 30, 0, 0);

  return {
    category,
    urgency,
    summary: `Se procesa correspondencia remitida por ${payload.sender}. Identifica temas relativos a ${category.toLowerCase()} con requerimientos operativos para seguimiento oportuno.`,
    keyPoints: [
      `Remitente: ${payload.sender}`,
      `Canal de ingreso: ${payload.channel.toUpperCase()}`,
      `Adjuntos detectados: ${payload.attachments?.length || 0} archivos`,
      `Requiere atención antes de los próximos 3 a 5 días hábiles.`,
    ],
    actionItems: [
      'Revisar el contenido completo y adjuntos anexos.',
      requiresSignature ? 'Estampar firma electrónica autorizada.' : 'Validar con el equipo responsable.',
      'Emitir confirmación de recepción al remitente.',
    ],
    hasSummonsOrDeadlines,
    calendarEvent: hasSummonsOrDeadlines ? {
      title: `${isMeeting ? '📅 Reunión' : '⏰ Plazo/Citación'}: ${payload.subject || payload.sender}`,
      description: `Evento generado automáticamente a partir de correspondencia recibida por ${payload.channel.toUpperCase()}.`,
      startDateTime: futureDate.toISOString(),
      endDateTime: futureEndDate.toISOString(),
      locationOrLink: 'Enlace Virtual / Conferencia',
      isDeadline: !isMeeting,
      reminderMinutesBefore: 120,
    } : undefined,
    requiresSignature,
    signatureDetails: requiresSignature ? {
      documentTitle: payload.subject || 'Documento Pendiente de Aprobación',
      signerRole: 'Representante Autorizado',
      expirationDate: futureDate.toISOString(),
      clausesToAccept: [
        'Acepto los términos contenidos en el documento.',
        'Autorizo la certificación de firma electrónica.',
      ],
    } : undefined,
    suggestedReply: payload.channel === 'whatsapp'
      ? `Hola ${payload.sender}, confirmo recibido de tu mensaje y documentos. Ya está registrado en nuestro panel y en proceso. ¡Muchas gracias!`
      : `Estimado(a) ${payload.sender},\n\nAcusamos recibo formal de su correspondencia. Le confirmamos que hemos iniciado el trámite respectivo en nuestra plataforma.\n\nAtentamente,\nGestión Documental`,
    entities: [
      { name: payload.sender, type: 'person' },
      { name: category, type: 'company' },
    ],
    tags: [payload.channel === 'whatsapp' ? 'WhatsApp' : 'Email', category.split('/')[0].trim(), 'IA Procesado'],
  };
}
