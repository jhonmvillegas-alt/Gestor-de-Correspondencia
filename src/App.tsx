import React, { useState, useEffect, useMemo } from 'react';
import { CorrespondenceItem, FilterOptions, ElectronicSignature, NotificationLog } from './types';
import { correspondenceStore, analyzeCorrespondenceWithGemini } from './services/correspondenceStore';
import { generateGoogleCalendarUrl } from './utils/calendar';
import { Navbar } from './components/Navbar';
import { DashboardMetrics } from './components/DashboardMetrics';
import { AdvancedFilters } from './components/AdvancedFilters';
import { CorrespondenceCard } from './components/CorrespondenceCard';
import { CorrespondenceDetailModal } from './components/CorrespondenceDetailModal';
import { SignatureModal } from './components/SignatureModal';
import { CalendarViewModal } from './components/CalendarViewModal';
import { NotificationCenterModal } from './components/NotificationCenterModal';
import { NewCorrespondenceModal } from './components/NewCorrespondenceModal';
import {
  Inbox,
  Sparkles,
  Zap,
  CheckCircle2,
  FileSignature,
  Calendar,
  AlertCircle,
  Plus,
} from 'lucide-react';

export default function App() {
  const [items, setItems] = useState<CorrespondenceItem[]>([]);
  const [filters, setFilters] = useState<FilterOptions>({
    searchQuery: '',
    channel: 'all',
    category: 'all',
    urgency: 'all',
    status: 'all',
    onlyWithDeadlines: false,
    onlyRequiresSignature: false,
    sortBy: 'date-desc',
  });

  // Modal states
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [isCalendarModalOpen, setIsCalendarModalOpen] = useState(false);
  const [isNotificationsModalOpen, setIsNotificationsModalOpen] = useState(false);
  const [selectedItemForDetail, setSelectedItemForDetail] = useState<CorrespondenceItem | null>(null);
  const [selectedItemForSignature, setSelectedItemForSignature] = useState<CorrespondenceItem | null>(null);

  // Toast notification
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  // Subscribe to store updates
  useEffect(() => {
    const unsubscribe = correspondenceStore.subscribe(updatedItems => {
      setItems(updatedItems);
      // Keep open modal in sync with any item changes
      if (selectedItemForDetail) {
        const found = updatedItems.find(i => i.id === selectedItemForDetail.id);
        if (found) setSelectedItemForDetail(found);
      }
    });
    return unsubscribe;
  }, [selectedItemForDetail]);

  // Derived unique categories
  const categories = useMemo(() => {
    const set = new Set<string>();
    items.forEach(i => {
      if (i.category) set.add(i.category);
    });
    return Array.from(set).sort();
  }, [items]);

  // Filtered and sorted items
  const filteredItems = useMemo(() => {
    return items.filter(item => {
      // Channel filter
      if (filters.channel !== 'all' && item.channel !== filters.channel) return false;

      // Category filter
      if (filters.category !== 'all' && item.category !== filters.category) return false;

      // Urgency filter
      if (filters.urgency !== 'all' && item.urgency !== filters.urgency) return false;

      // Status filter
      if (filters.status !== 'all' && item.status !== filters.status) return false;

      // Deadlines filter
      if (filters.onlyWithDeadlines && !item.hasSummonsOrDeadlines) return false;

      // Requires signature filter
      if (filters.onlyRequiresSignature && (!item.requiresSignature || item.electronicSignature?.isSigned)) {
        return false;
      }

      // Search Query
      if (filters.searchQuery.trim()) {
        const q = filters.searchQuery.toLowerCase();
        const matchesSubject = item.subject.toLowerCase().includes(q);
        const matchesSender = item.sender.toLowerCase().includes(q);
        const matchesContact = item.senderContact.toLowerCase().includes(q);
        const matchesSummary = item.summary.toLowerCase().includes(q);
        const matchesTracking = item.trackingNumber.toLowerCase().includes(q);
        const matchesTags = item.tags.some(t => t.toLowerCase().includes(q));

        if (!matchesSubject && !matchesSender && !matchesContact && !matchesSummary && !matchesTracking && !matchesTags) {
          return false;
        }
      }

      return true;
    });
  }, [items, filters]);

  // Fast demo simulation: ingest an urgent WhatsApp or email correspondence
  const handleSimulateIncoming = async () => {
    showToast('Simulando llegada de correspondencia en tiempo real vía WhatsApp...');
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 3);
    futureDate.setHours(14, 0, 0, 0);

    const newItem: CorrespondenceItem = {
      id: `cor-${Date.now()}`,
      trackingNumber: `COR-2026-${Math.floor(2000 + Math.random() * 8000)}`,
      channel: 'whatsapp',
      sender: 'Superintendencia de Sociedades',
      senderContact: '+57 300 849 5511',
      recipient: 'gerencia@tuempresa.com',
      subject: 'CITACIÓN URGENTE: Audiencia de Descargos Rad. 2026-SUPERSOC-992',
      content: `La Delegatura de Procedimientos Mercantiles notifica auto de citación a Audiencia de Descargos para el día ${futureDate.toLocaleDateString()} a las 14:00 horas por presunta omisión en el registro de estados financieros. Enlace Teams: https://teams.microsoft.com/supersoc-rad992. Término de 3 días para aportar memorial.`,
      receivedAt: new Date().toISOString(),
      status: 'agendado',
      category: 'Legal / Notificación Judicial',
      urgency: 'crítica',
      summary: `La Superintendencia de Sociedades convoca de manera urgente a Audiencia de Descargos para el ${futureDate.toLocaleDateString()} a las 2:00 PM por investigación en la Delegatura Mercantil. Otorga plazo para radicar pruebas de descargo.`,
      keyPoints: [
        `Audiencia programada para el ${futureDate.toLocaleDateString()} a las 14:00 horas.`,
        'Asistencia obligatoria de Representante Legal con apoderado.',
        'Radicación de memorial probatorio con plazo fatal de 3 días.',
      ],
      actionItems: [
        'Agendar y preparar comparecencia con el abogado corporativo.',
        'Recopilar los certificados de cámara de comercio y estados financieros.',
      ],
      attachments: [
        {
          id: `att-sim-${Date.now()}`,
          name: 'Auto_Citacion_Supersociedades_992.pdf',
          type: 'pdf',
          size: '1.2 MB',
          textContent: 'SUPERINTENDENCIA DE SOCIEDADES. Auto que fija audiencia de descargos mercantil.',
        },
      ],
      hasSummonsOrDeadlines: true,
      calendarEvent: {
        id: `cal-sim-${Date.now()}`,
        title: '🏛️ Audiencia de Descargos Supersociedades (Rad. 992)',
        description: 'Audiencia de descargos ante la Superintendencia de Sociedades. Presencia obligatoria.',
        startDateTime: futureDate.toISOString(),
        endDateTime: new Date(futureDate.getTime() + 7200000).toISOString(),
        locationOrLink: 'https://teams.microsoft.com/supersoc-rad992',
        isDeadline: false,
        isScheduled: true,
        scheduledAt: new Date().toISOString(),
        googleCalendarUrl: generateGoogleCalendarUrl(
          '🏛️ Audiencia de Descargos Supersociedades',
          'Audiencia de descargos mercantil.',
          'https://teams.microsoft.com/supersoc-rad992',
          futureDate.toISOString(),
          new Date(futureDate.getTime() + 7200000).toISOString()
        ),
        reminderMinutesBefore: 120,
      },
      requiresSignature: false,
      suggestedReply: 'Confirmamos recibo de la notificación de la Delegatura. Nuestro apoderado se presentará en la fecha fijada.',
      entities: [
        { name: 'Superintendencia de Sociedades', type: 'company' },
        { name: 'Rad. 2026-SUPERSOC-992', type: 'case_number' },
      ],
      tags: ['WhatsApp', 'Supersociedades', 'Audiencia', 'Crítica'],
      notificationHistory: [
        {
          id: `notif-sim-${Date.now()}`,
          channel: 'whatsapp',
          recipient: '+57 300 849 5511',
          title: 'Confirmación Automática de Recepción',
          message: 'Se confirmó recepción de la citación judicial vía WhatsApp.',
          sentAt: new Date().toISOString(),
          status: 'leído',
          triggerType: 'auto_ingestion',
        },
      ],
      auditTrail: [
        {
          id: `aud-sim-${Date.now()}`,
          timestamp: new Date().toISOString(),
          action: 'Ingesta Simulada WhatsApp Webhook',
          actor: 'Inbound Webhook Bot',
          details: 'Correspondencia recibida y analizada exitosamente por Gemini 3.8 Flash.',
        },
      ],
    };

    correspondenceStore.addCorrespondence(newItem);
    showToast(`✅ ¡Nueva citación de la Superintendencia agendada automáticamente en su calendario!`);
  };

  // Export to CSV
  const handleExportCsv = () => {
    const headers = [
      'Radicado',
      'Canal',
      'Remitente',
      'Contacto',
      'Fecha Recepción',
      'Categoría',
      'Urgencia',
      'Estado',
      'Requiere Firma',
      'Firmado',
      'Tiene Citación/Plazo',
      'Fecha Calendario',
      'Resumen Ejecutivo',
    ];

    const rows = filteredItems.map(item => [
      item.trackingNumber,
      item.channel,
      `"${item.sender.replace(/"/g, '""')}"`,
      `"${item.senderContact.replace(/"/g, '""')}"`,
      item.receivedAt,
      `"${item.category.replace(/"/g, '""')}"`,
      item.urgency,
      item.status,
      item.requiresSignature ? 'SI' : 'NO',
      item.electronicSignature?.isSigned ? 'SI' : 'NO',
      item.hasSummonsOrDeadlines ? 'SI' : 'NO',
      item.calendarEvent ? item.calendarEvent.startDateTime : 'N/A',
      `"${item.summary.replace(/"/g, '""')}"`,
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `CorrespondenciaAI_Reporte_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showToast('Base de datos exportada exitosamente a archivo CSV.');
  };

  const scheduledEventsCount = items.filter(i => i.calendarEvent?.isScheduled).length;
  const unreadNotificationsCount = items.reduce((acc, curr) => acc + curr.notificationHistory.length, 0);

  return (
    <div className="min-h-screen bg-slate-50/60 text-slate-900 flex flex-col font-sans">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-xl border border-slate-700 text-xs flex items-center gap-2.5 animate-in fade-in slide-in-from-top-4 duration-200">
          <Sparkles className="w-4 h-4 text-indigo-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Main Navbar */}
      <Navbar
        onOpenNew={() => setIsNewModalOpen(true)}
        onOpenCalendar={() => setIsCalendarModalOpen(true)}
        onOpenNotifications={() => setIsNotificationsModalOpen(true)}
        onResetData={() => {
          correspondenceStore.resetData();
          showToast('Datos de correspondencia restablecidos a los valores predeterminados.');
        }}
        onSimulateIncoming={handleSimulateIncoming}
        scheduledEventsCount={scheduledEventsCount}
        unreadNotificationsCount={unreadNotificationsCount}
      />

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 w-full">
        {/* Welcome and Hero Header */}
        <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-slate-900">
              Panel de Control de Correspondencia
            </h1>
            <p className="text-xs md:text-sm text-slate-500 mt-1">
              Procesamiento inteligente de mensajes y adjuntos por Email y WhatsApp con auto-agenda de plazos y firma electrónica.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsNewModalOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs shadow-xs transition-all hover:shadow"
            >
              <Plus className="w-4 h-4" />
              <span>Procesar Nueva Correspondencia</span>
            </button>
          </div>
        </div>

        {/* Dashboard Metrics Cards */}
        <DashboardMetrics
          items={items}
          onFilterChange={type => {
            if (type === 'all') setFilters(prev => ({ ...prev, channel: 'all', urgency: 'all', onlyRequiresSignature: false, onlyWithDeadlines: false }));
            if (type === 'whatsapp') setFilters(prev => ({ ...prev, channel: 'whatsapp' }));
            if (type === 'email') setFilters(prev => ({ ...prev, channel: 'email' }));
            if (type === 'pending_signature') setFilters(prev => ({ ...prev, onlyRequiresSignature: true }));
            if (type === 'scheduled') setIsCalendarModalOpen(true);
            if (type === 'critical') setFilters(prev => ({ ...prev, urgency: 'crítica' }));
          }}
        />

        {/* Advanced Filters */}
        <AdvancedFilters
          filters={filters}
          categories={categories}
          onChange={setFilters}
          onExportCsv={handleExportCsv}
        />

        {/* Results Counter & Fast Sort */}
        <div className="flex items-center justify-between mb-4 text-xs text-slate-500 px-1">
          <span>
            Mostrando <strong>{filteredItems.length}</strong> de {items.length} radicados registrados
          </span>
          <div className="flex items-center gap-2">
            <span>Ordenar por:</span>
            <select
              value={filters.sortBy}
              onChange={e => setFilters({ ...filters, sortBy: e.target.value as any })}
              className="bg-transparent border-0 font-semibold text-slate-800 focus:outline-none cursor-pointer"
            >
              <option value="date-desc">Más recientes primero</option>
              <option value="date-asc">Más antiguos primero</option>
              <option value="urgency-desc">Mayor urgencia primero</option>
            </select>
          </div>
        </div>

        {/* Correspondence Grid / List */}
        {filteredItems.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-3">
            <Inbox className="w-12 h-12 text-slate-300 mx-auto" />
            <h3 className="font-bold text-slate-800 text-base">
              No se encontraron documentos con los filtros seleccionados
            </h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Intente ajustar los términos de búsqueda o limpie los filtros para ver la correspondencia general.
            </p>
            <button
              onClick={() =>
                setFilters({
                  searchQuery: '',
                  channel: 'all',
                  category: 'all',
                  urgency: 'all',
                  status: 'all',
                  onlyWithDeadlines: false,
                  onlyRequiresSignature: false,
                  sortBy: 'date-desc',
                })
              }
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors"
            >
              Restablecer Filtros
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredItems.map(item => (
              <CorrespondenceCard
                key={item.id}
                item={item}
                onOpenDetail={i => setSelectedItemForDetail(i)}
                onOpenSignature={i => setSelectedItemForSignature(i)}
                onToggleSchedule={(id, scheduled) => {
                  correspondenceStore.scheduleEvent(id, scheduled);
                  showToast(scheduled ? 'Evento sincronizado con el calendario.' : 'Evento retirado de la agenda activa.');
                }}
              />
            ))}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-6 mt-12 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-800">CorrespondenciaAI</span>
            <span>•</span>
            <span>Plataforma de Inteligencia Documental, Agenda y Firma Digital</span>
          </div>
          <div>
            <span>Conectado a Google Gemini 3.8 Flash Engine • Encriptación SHA-256</span>
          </div>
        </div>
      </footer>

      {/* MODAL 1: Ingest New Correspondence */}
      <NewCorrespondenceModal
        isOpen={isNewModalOpen}
        onClose={() => setIsNewModalOpen(false)}
        onCreated={item => {
          correspondenceStore.addCorrespondence(item);
          showToast(`✅ Radicado ${item.trackingNumber} procesado exitosamente por IA.`);
          setSelectedItemForDetail(item);
        }}
      />

      {/* MODAL 2: Correspondence Detail Drawer */}
      {selectedItemForDetail && (
        <CorrespondenceDetailModal
          item={selectedItemForDetail}
          isOpen={Boolean(selectedItemForDetail)}
          onClose={() => setSelectedItemForDetail(null)}
          onOpenSignature={item => {
            setSelectedItemForSignature(item);
          }}
          onToggleSchedule={(id, scheduled) => {
            correspondenceStore.scheduleEvent(id, scheduled);
            showToast(scheduled ? 'Evento agendado en su calendario personal.' : 'Evento desagendado.');
          }}
          onSendNotification={(id, notif) => {
            correspondenceStore.addNotificationLog(id, notif);
            showToast('Notificación enviada exitosamente.');
          }}
          onUpdateItem={(id, updates) => {
            correspondenceStore.updateCorrespondence(id, updates);
          }}
        />
      )}

      {/* MODAL 3: Electronic Signature Studio */}
      {selectedItemForSignature && (
        <SignatureModal
          item={selectedItemForSignature}
          isOpen={Boolean(selectedItemForSignature)}
          onClose={() => setSelectedItemForSignature(null)}
          onSignComplete={sig => {
            correspondenceStore.applySignature(selectedItemForSignature.id, sig);
            showToast(`✍️ ¡Documento firmado exitosamente! Código: ${sig.verificationCode}`);
          }}
        />
      )}

      {/* MODAL 4: Calendar & Summons View */}
      <CalendarViewModal
        isOpen={isCalendarModalOpen}
        onClose={() => setIsCalendarModalOpen(false)}
        items={items}
        onToggleSchedule={(id, scheduled) => {
          correspondenceStore.scheduleEvent(id, scheduled);
          showToast(scheduled ? 'Evento agendado.' : 'Evento desagendado.');
        }}
        onSelectItem={item => setSelectedItemForDetail(item)}
      />

      {/* MODAL 5: Notification Center */}
      <NotificationCenterModal
        isOpen={isNotificationsModalOpen}
        onClose={() => setIsNotificationsModalOpen(false)}
        items={items}
        onSendNotification={(id, notif) => {
          correspondenceStore.addNotificationLog(id, notif);
          showToast('Notificación despachada con éxito.');
        }}
      />
    </div>
  );
}
