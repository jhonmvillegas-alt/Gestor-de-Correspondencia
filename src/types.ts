export type Channel = 'email' | 'whatsapp';
export type Urgency = 'crítica' | 'alta' | 'media' | 'baja';
export type CorrespondenceStatus = 'nuevo' | 'procesado' | 'agendado' | 'firmado' | 'archivado';

export interface Attachment {
  id: string;
  name: string;
  type: string;
  size: string;
  textContent?: string;
  previewUrl?: string;
  isSigned?: boolean;
  signatureStamp?: string;
}

export interface CalendarEvent {
  id: string;
  title: string;
  description: string;
  startDateTime: string; // ISO 8601
  endDateTime: string;   // ISO 8601
  locationOrLink: string;
  isDeadline: boolean;   // true if deadline, false if meeting/summons
  isScheduled: boolean;
  scheduledAt?: string;
  googleCalendarUrl?: string;
  reminderMinutesBefore?: number;
}

export interface ElectronicSignature {
  isSigned: boolean;
  signerName: string;
  signerEmail: string;
  signerRole: string;
  signerIdNumber?: string;
  signedAt: string;
  signatureDataUrl: string; // Drawn canvas or styled signature
  digitalHashSha256: string;
  verificationCode: string;
  auditIp: string;
  deviceInfo: string;
  status: 'pendiente' | 'firmado' | 'rechazado';
}

export interface NotificationLog {
  id: string;
  channel: 'email' | 'whatsapp';
  recipient: string;
  title: string;
  message: string;
  sentAt: string;
  status: 'enviado' | 'entregado' | 'leído';
  triggerType: 'auto_ingestion' | 'meeting_reminder' | 'signature_request' | 'manual_dispatch';
}

export interface EntityItem {
  name: string;
  type: 'person' | 'company' | 'money' | 'case_number' | 'date';
}

export interface AuditRecord {
  id: string;
  timestamp: string;
  action: string;
  actor: string;
  details: string;
}

export interface CorrespondenceItem {
  id: string;
  trackingNumber: string;
  channel: Channel;
  sender: string;
  senderContact: string;
  recipient: string;
  subject: string;
  content: string;
  receivedAt: string;
  status: CorrespondenceStatus;
  category: string;
  urgency: Urgency;
  summary: string;
  keyPoints: string[];
  actionItems: string[];
  attachments: Attachment[];
  hasSummonsOrDeadlines: boolean;
  calendarEvent?: CalendarEvent;
  requiresSignature: boolean;
  signatureDetails?: {
    documentTitle: string;
    signerRole: string;
    expirationDate: string;
    clausesToAccept: string[];
  };
  electronicSignature?: ElectronicSignature;
  suggestedReply?: string;
  entities: EntityItem[];
  tags: string[];
  notificationHistory: NotificationLog[];
  auditTrail: AuditRecord[];
}

export interface FilterOptions {
  searchQuery: string;
  channel: 'all' | 'email' | 'whatsapp';
  category: string;
  urgency: 'all' | Urgency;
  status: 'all' | CorrespondenceStatus;
  onlyWithDeadlines: boolean;
  onlyRequiresSignature: boolean;
  sortBy: 'date-desc' | 'date-asc' | 'urgency-desc';
}
