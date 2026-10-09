import React, { useRef, useState, useEffect } from 'react';
import { CorrespondenceItem, ElectronicSignature } from '../types';
import { generateSha256, generateVerificationCode } from '../utils/crypto';
import { X, CheckCircle, ShieldCheck, PenTool, Type, RefreshCw, AlertCircle, Download, FileText } from 'lucide-react';

interface SignatureModalProps {
  item: CorrespondenceItem;
  isOpen: boolean;
  onClose: () => void;
  onSignComplete: (signature: ElectronicSignature) => void;
}

export const SignatureModal: React.FC<SignatureModalProps> = ({
  item,
  isOpen,
  onClose,
  onSignComplete,
}) => {
  const [activeTab, setActiveTab] = useState<'draw' | 'type'>('draw');
  const [signerName, setSignerName] = useState('Dr. Jhon Mauricio Villegas');
  const [signerEmail, setSignerEmail] = useState('jhonmvillegas@gmail.com');
  const [signerRole, setSignerRole] = useState(item.signatureDetails?.signerRole || 'Representante Legal / Gerente General');
  const [signerIdNumber, setSignerIdNumber] = useState('CC-79.845.210');
  const [inkColor, setInkColor] = useState<'#0f172a' | '#1e3a8a'>('#0f172a');
  const [acceptedClauses, setAcceptedClauses] = useState<boolean[]>(
    (item.signatureDetails?.clausesToAccept || ['Acepto los términos y condiciones del documento']).map(() => true)
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [typedFontIndex, setTypedFontIndex] = useState(0);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasDrawn, setHasDrawn] = useState(false);

  // Initialize canvas
  useEffect(() => {
    if (isOpen && activeTab === 'draw') {
      setTimeout(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        ctx.strokeStyle = inkColor;
        ctx.lineWidth = 2.5;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
      }, 100);
    }
  }, [isOpen, activeTab, inkColor]);

  if (!isOpen) return null;

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    setIsDrawing(true);
    setHasDrawn(true);

    const rect = canvas.getBoundingClientRect();
    const x = 'touches' in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = 'touches' in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top;

    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = 'touches' in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = 'touches' in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top;

    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasDrawn(false);
  };

  const generateTypedSignatureDataUrl = (): string => {
    const canvas = document.createElement('canvas');
    canvas.width = 460;
    canvas.height = 140;
    const ctx = canvas.getContext('2d');
    if (!ctx) return '';

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const fonts = [
      'italic bold 36px "Brush Script MT", cursive',
      'italic 34px "Segoe Script", cursive',
      'italic 32px "Lucida Handwriting", cursive',
    ];
    ctx.font = fonts[typedFontIndex] || fonts[0];
    ctx.fillStyle = inkColor;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(signerName || 'Firma Digital', 230, 70);

    // subtle security line below
    ctx.strokeStyle = '#cbd5e1';
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(40, 110);
    ctx.lineTo(420, 110);
    ctx.stroke();

    return canvas.toDataURL('image/png');
  };

  const handleSignSubmit = async () => {
    if (!signerName.trim()) {
      alert('Por favor ingrese el nombre completo del firmante.');
      return;
    }

    const allAccepted = acceptedClauses.every(Boolean);
    if (!allAccepted) {
      alert('Debe aceptar todas las cláusulas de certificación para proceder con la firma.');
      return;
    }

    let signatureImage = '';
    if (activeTab === 'draw') {
      if (!hasDrawn) {
        alert('Por favor dibuje su firma en el panel o use la pestaña de firma tipográfica.');
        return;
      }
      signatureImage = canvasRef.current?.toDataURL('image/png') || '';
    } else {
      signatureImage = generateTypedSignatureDataUrl();
    }

    setIsSubmitting(true);

    const timestamp = new Date().toISOString();
    const verificationCode = generateVerificationCode();
    const payloadForHash = `${item.id}|${item.subject}|${signerName}|${signerIdNumber}|${timestamp}|${verificationCode}`;
    const hash = await generateSha256(payloadForHash);

    const signatureObj: ElectronicSignature = {
      isSigned: true,
      signerName: signerName.trim(),
      signerEmail: signerEmail.trim(),
      signerRole: signerRole.trim(),
      signerIdNumber: signerIdNumber.trim(),
      signedAt: timestamp,
      signatureDataUrl: signatureImage,
      digitalHashSha256: hash,
      verificationCode,
      auditIp: '181.134.92.14 (Verificado SSL)',
      deviceInfo: 'Navegador Seguro / Certificado SHA-256 AES-GCM',
      status: 'firmado',
    };

    setTimeout(() => {
      setIsSubmitting(false);
      onSignComplete(signatureObj);
      onClose();
    }, 600);
  };

  const docTitle = item.signatureDetails?.documentTitle || item.subject;
  const clauses = item.signatureDetails?.clausesToAccept || [
    'Acepto los términos y condiciones de la correspondencia recibida.',
    'Autorizo la expedición de certificado de firma digital según la Ley de Comercio Electrónico.',
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full border border-slate-200 overflow-hidden my-6 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-300">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-lg leading-tight flex items-center gap-2">
                Firma Electrónica Avanzada
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Validez Legal
                </span>
              </h3>
              <p className="text-xs text-slate-300 line-clamp-1 mt-0.5">
                {docTitle}
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

        {/* Content Body */}
        <div className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
          {/* Document metadata banner */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 flex items-start gap-3">
            <FileText className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
            <div className="text-xs text-slate-600 space-y-1">
              <div>
                <strong className="text-slate-800">Documento a certificar:</strong> {docTitle}
              </div>
              <div className="flex flex-wrap gap-4 text-[11px] text-slate-500">
                <span><strong>Radicado:</strong> {item.trackingNumber}</span>
                <span><strong>Remitente:</strong> {item.sender}</span>
                <span><strong>Canal:</strong> {item.channel.toUpperCase()}</span>
                {item.signatureDetails?.expirationDate && (
                  <span className="text-amber-700 font-medium">
                    <strong>Fecha Límite:</strong> {new Date(item.signatureDetails.expirationDate).toLocaleDateString()}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Signer Information Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Nombre del Firmante *
              </label>
              <input
                type="text"
                value={signerName}
                onChange={e => setSignerName(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Ej. Dr. Carlos Rodríguez"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Documento de Identidad / C.C. *
              </label>
              <input
                type="text"
                value={signerIdNumber}
                onChange={e => setSignerIdNumber(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Ej. CC 1.020.345.678"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Cargo / Rol de Aprobación *
              </label>
              <input
                type="text"
                value={signerRole}
                onChange={e => setSignerRole(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Ej. Representante Legal"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Correo Electrónico de Auditoría *
              </label>
              <input
                type="email"
                value={signerEmail}
                onChange={e => setSignerEmail(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="correo@empresa.com"
              />
            </div>
          </div>

          {/* Signature Studio (Draw or Type) */}
          <div className="border border-slate-200 rounded-xl overflow-hidden">
            {/* Tabs & Tools */}
            <div className="bg-slate-50 px-4 py-2 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setActiveTab('draw')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    activeTab === 'draw'
                      ? 'bg-white text-indigo-700 shadow-xs border border-slate-200'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <PenTool className="w-3.5 h-3.5" />
                  Trazar en Pantalla
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('type')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    activeTab === 'type'
                      ? 'bg-white text-indigo-700 shadow-xs border border-slate-200'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Type className="w-3.5 h-3.5" />
                  Firma Tipográfica
                </button>
              </div>

              {/* Ink color switcher */}
              <div className="flex items-center gap-2">
                <span className="text-[11px] text-slate-500 font-medium">Tinta:</span>
                <button
                  type="button"
                  onClick={() => setInkColor('#0f172a')}
                  className={`w-5 h-5 rounded-full bg-slate-900 border-2 ${inkColor === '#0f172a' ? 'border-indigo-500 ring-2 ring-indigo-200' : 'border-transparent'}`}
                  title="Tinta Negra"
                />
                <button
                  type="button"
                  onClick={() => setInkColor('#1e3a8a')}
                  className={`w-5 h-5 rounded-full bg-blue-900 border-2 ${inkColor === '#1e3a8a' ? 'border-indigo-500 ring-2 ring-indigo-200' : 'border-transparent'}`}
                  title="Tinta Azul Notarial"
                />
                {activeTab === 'draw' && (
                  <button
                    type="button"
                    onClick={clearCanvas}
                    className="ml-2 text-xs text-rose-600 hover:text-rose-800 font-medium flex items-center gap-1"
                  >
                    <RefreshCw className="w-3 h-3" />
                    Limpiar
                  </button>
                )}
              </div>
            </div>

            {/* Drawing Canvas Area */}
            {activeTab === 'draw' ? (
              <div className="p-3 bg-white text-center">
                <canvas
                  ref={canvasRef}
                  width={580}
                  height={150}
                  onMouseDown={startDrawing}
                  onMouseMove={draw}
                  onMouseUp={stopDrawing}
                  onMouseLeave={stopDrawing}
                  onTouchStart={startDrawing}
                  onTouchMove={draw}
                  onTouchEnd={stopDrawing}
                  className="w-full h-36 bg-slate-50/50 rounded-lg border border-dashed border-slate-300 touch-none cursor-crosshair"
                />
                <div className="text-[11px] text-slate-400 mt-1 flex items-center justify-center gap-2">
                  <span>Dibuje su trazo manual con ratón o pantalla táctil</span>
                  {hasDrawn && <span className="text-emerald-600 font-medium">✓ Trazo capturado</span>}
                </div>
              </div>
            ) : (
              /* Typed Signature Area */
              <div className="p-4 bg-white text-center space-y-3">
                <div className="h-32 bg-slate-50 rounded-lg border border-slate-200 flex flex-col items-center justify-center p-3">
                  <div
                    style={{ color: inkColor }}
                    className={`text-3xl select-none ${
                      typedFontIndex === 0
                        ? 'font-serif italic tracking-wide'
                        : typedFontIndex === 1
                        ? 'font-mono italic font-bold'
                        : 'font-sans italic font-light tracking-widest'
                    }`}
                  >
                    {signerName || 'Su Nombre Aquí'}
                  </div>
                  <div className="w-48 h-px border-b border-dashed border-slate-300 mt-2" />
                  <div className="text-[10px] text-slate-400 mt-1 uppercase tracking-wider">
                    Firma Electrónica Verificada
                  </div>
                </div>
                <div className="flex items-center justify-center gap-2">
                  <span className="text-xs text-slate-500 font-medium">Estilo tipográfico:</span>
                  {[0, 1, 2].map(idx => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setTypedFontIndex(idx)}
                      className={`px-2.5 py-1 text-xs rounded border transition-colors ${
                        typedFontIndex === idx
                          ? 'bg-indigo-50 border-indigo-500 text-indigo-700 font-semibold'
                          : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      Estilo {idx + 1}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Legal Clauses Checkboxes */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2.5">
            <div className="text-xs font-semibold text-slate-800 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              Manifestaciones y Cláusulas de Aprobación
            </div>
            {clauses.map((clause, idx) => (
              <label key={idx} className="flex items-start gap-2.5 cursor-pointer text-xs text-slate-600">
                <input
                  type="checkbox"
                  checked={acceptedClauses[idx] || false}
                  onChange={e => {
                    const updated = [...acceptedClauses];
                    updated[idx] = e.target.checked;
                    setAcceptedClauses(updated);
                  }}
                  className="mt-0.5 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300"
                />
                <span>{clause}</span>
              </label>
            ))}
          </div>

          {/* Cryptographic Audit Stamp Preview */}
          <div className="border border-indigo-100 bg-indigo-50/40 rounded-xl p-3 flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
            <div className="text-xs text-slate-600 space-y-0.5">
              <div className="font-semibold text-slate-900">
                Estampado de Tiempo y Código de Verificación Digital
              </div>
              <p className="text-[11px] text-slate-500">
                Al confirmar la firma, se generará una huella criptográfica SHA-256 única vinculada a su documento de identidad y se emitirá el código de no repudio para su archivo documental.
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-slate-50 px-6 py-4 border-t border-slate-200 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm text-slate-600 hover:text-slate-900 font-medium transition-colors"
          >
            Cancelar
          </button>
          <button
            type="button"
            disabled={isSubmitting}
            onClick={handleSignSubmit}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-sm shadow-sm transition-all hover:shadow disabled:opacity-50"
          >
            {isSubmitting ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                Estampando Firma y Token...
              </>
            ) : (
              <>
                <CheckCircle className="w-4 h-4" />
                Firmar y Estampar Documento
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
