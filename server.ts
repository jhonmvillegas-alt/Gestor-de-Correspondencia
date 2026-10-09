import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, Type } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ extended: true, limit: '25mb' }));

// Server-side Gemini initialization
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Endpoint: Analyze Correspondence (Email / WhatsApp + Attachments)
app.post('/api/correspondence/analyze', async (req, res) => {
  try {
    const {
      channel = 'email',
      sender = 'Desconocido',
      senderContact = '',
      subject = '',
      content = '',
      attachments = [],
      receivedAt = new Date().toISOString(),
    } = req.body;

    if (!content && attachments.length === 0) {
      return res.status(400).json({ error: 'Se requiere contenido de texto o archivos adjuntos para analizar.' });
    }

    const currentDateContext = 'Fecha y hora actual del sistema: ' + new Date().toISOString();

    const systemPrompt = `Eres un asistente ejecutivo y perito legal de IA especializado en correspondencia empresarial, judicial y operativa (Email y WhatsApp en español).
Tu tarea es analizar meticulosamente el mensaje o correspondencia y sus documentos adjuntos.
Debes:
1. Clasificar con precisión la categoría (e.g. "Legal / Citación Judicial", "Contratos y Convenios", "Convocatoria a Reunión", "Financiero y Facturación", "Recursos Humanos", "Requerimiento Administrativo").
2. Determinar la urgencia ("crítica", "alta", "media", "baja") evaluando plazos perentorios o consecuencias.
3. Sintetizar un resumen ejecutivo claro (2 a 4 oraciones) que capture la esencia y obligación principal.
4. Identificar puntos clave de interés y una lista estructurada de acciones pendientes (Action Items).
5. Detectar si contiene citaciones a reuniones, audiencias, asambleas o fechas límite/plazos fatales ("hasSummonsOrDeadlines": true/false).
   Si existe, extrae o calcula la fecha/hora exacta en formato ISO 8601 (toma como referencia que hoy es ${currentDateContext}), título para la agenda, descripción, lugar/enlace virtual, si es plazo fatal o reunión, y minutos recomendados de recordatorio previo (ej: 1440 para 24h).
6. Detectar si requiere firma electrónica o visto bueno ("requiresSignature": true/false), rol del firmante, fecha límite para firmar y cláusulas o estipulaciones clave a aceptar.
7. Redactar una propuesta de respuesta automática profesional adaptada al canal (${channel === 'whatsapp' ? 'concisa y formal/cordial para WhatsApp' : 'formal y estructurada para correo electrónico'}).
8. Extraer entidades destacadas (personas, empresas/instituciones, montos dinerarios, números de expediente o factura).
9. Asignar etiquetas clave (tags).

Responde exclusivamente con el JSON estructurado solicitado.`;

    const userPrompt = `Canal: ${channel}
Remitente: ${sender} (${senderContact})
Asunto: ${subject || 'Sin asunto'}
Fecha de recepción: ${receivedAt}
Contenido del mensaje:
"""
${content}
"""

Documentos/Adjuntos acompañados (${attachments.length}):
${attachments.map((att: any, idx: number) => `[Adjunto ${idx + 1}: ${att.name} (${att.type || 'archivo'}, ${att.size || 'N/A'})]
Extracto o texto del documento:
${att.textContent || att.previewText || 'Documento adjunto en formato binario'}`).join('\n\n')}
`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: userPrompt,
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            category: { type: Type.STRING, description: 'Categoría oficial de la correspondencia' },
            urgency: { type: Type.STRING, description: 'crítica, alta, media o baja' },
            summary: { type: Type.STRING, description: 'Resumen ejecutivo claro' },
            keyPoints: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: 'Puntos clave detectados',
            },
            actionItems: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: 'Acciones pendientes requeridas del usuario',
            },
            hasSummonsOrDeadlines: { type: Type.BOOLEAN, description: 'Indica si hay reunión, citación o fecha límite' },
            calendarEvent: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING, description: 'Título para el evento en calendario' },
                description: { type: Type.STRING, description: 'Detalle o temario del evento' },
                startDateTime: { type: Type.STRING, description: 'Fecha y hora de inicio en formato ISO 8601' },
                endDateTime: { type: Type.STRING, description: 'Fecha y hora de fin en formato ISO 8601' },
                locationOrLink: { type: Type.STRING, description: 'Ubicación física o enlace Zoom/Meet/Teams' },
                isDeadline: { type: Type.BOOLEAN, description: 'true si es vencimiento fatal de plazo, false si es reunión' },
                reminderMinutesBefore: { type: Type.INTEGER, description: 'Minutos previos para la notificación' },
              },
            },
            requiresSignature: { type: Type.BOOLEAN, description: 'Indica si requiere firma electrónica o aprobación' },
            signatureDetails: {
              type: Type.OBJECT,
              properties: {
                documentTitle: { type: Type.STRING, description: 'Nombre del documento a firmar' },
                signerRole: { type: Type.STRING, description: 'Cargo o calidad jurídica requerida para la firma' },
                expirationDate: { type: Type.STRING, description: 'Fecha máxima para firmar' },
                clausesToAccept: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                  description: 'Condiciones o cláusulas clave',
                },
              },
            },
            suggestedReply: { type: Type.STRING, description: 'Borrador de respuesta automática redactado' },
            entities: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING },
                  type: { type: Type.STRING, description: 'person, company, money, case_number, date' },
                },
                required: ['name', 'type'],
              },
            },
            tags: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
          },
          required: ['category', 'urgency', 'summary', 'keyPoints', 'actionItems', 'hasSummonsOrDeadlines', 'requiresSignature', 'suggestedReply', 'tags'],
        },
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    return res.json({ success: true, analysis: parsed });
  } catch (error: any) {
    console.error('Error analyzing correspondence:', error);
    return res.status(500).json({
      error: 'Error al analizar la correspondencia con IA',
      message: error?.message || String(error),
    });
  }
});

// Endpoint: Generate custom reply
app.post('/api/correspondence/generate-reply', async (req, res) => {
  try {
    const {
      correspondenceContext,
      sender,
      channel = 'email',
      tone = 'formal',
      userInstructions = '',
    } = req.body;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: `Contexto de la correspondencia recibida:
Remitente: ${sender}
Canal: ${channel}
Contenido previo:
"""
${correspondenceContext}
"""

Instrucciones específicas del usuario: "${userInstructions || 'Confirmar recepción y responder de acuerdo al tono solicitado'}"
Tono deseado: ${tone} (formal, cordial, confirmación de asistencia, solicitud de prórroga, etc.)

Genera un mensaje de respuesta listo para enviar por ${channel === 'whatsapp' ? 'WhatsApp (con emojis moderados y párrafos claros)' : 'Correo Electrónico (con saludo protocolar, cuerpo y despedida profesional)'}.`,
    });

    return res.json({ success: true, replyText: response.text });
  } catch (error: any) {
    console.error('Error generating reply:', error);
    return res.status(500).json({
      error: 'Error al generar borrador de respuesta',
      message: error?.message || String(error),
    });
  }
});

// Endpoint: OCR / Deep Document Inspector
app.post('/api/correspondence/analyze-document', async (req, res) => {
  try {
    const { documentName, textContent } = req.body;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: `Analiza el siguiente documento legal/comercial titulado "${documentName}":
"""
${textContent}
"""
Proporciona:
1. Tipo específico de documento.
2. Partes involucradas.
3. Cláusulas críticas o de riesgo.
4. Obligaciones financieras y fechas de vencimiento.
5. Recomendación de firma (Favorable, Observaciones previas, Requiere asesoría).`,
    });

    return res.json({ success: true, documentAnalysis: response.text });
  } catch (error: any) {
    console.error('Error analyzing document:', error);
    return res.status(500).json({ error: error?.message || String(error) });
  }
});

// Vite Middleware for development / Static files for production
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist/index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`CorrespondenciaAI server running on port ${PORT}`);
  });
}

startServer();
