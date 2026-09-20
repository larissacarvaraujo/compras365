import React, { useState, useMemo } from 'react';
import { PurchaseOrder } from '../../types';
import {
  generateOrderEmailPayload,
  generateOrderEmailHtml,
  generateOrderEmailPlainText,
  generateMailtoUrl,
  copyEmailHtmlToClipboard,
  copyEmailTextToClipboard,
} from '../../utils/orderEmailGenerator';
import {
  X,
  Mail,
  Copy,
  Check,
  ExternalLink,
  Code,
  Eye,
  FileText,
  Send,
  Building,
  Calendar,
  DollarSign,
} from 'lucide-react';

interface OrderEmailModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: PurchaseOrder;
}

export const OrderEmailModal: React.FC<OrderEmailModalProps> = (props) => {
  if (!props.isOpen) return null;
  return <OrderEmailModalContent {...props} />;
};

const OrderEmailModalContent: React.FC<OrderEmailModalProps> = ({
  isOpen,
  onClose,
  order,
}) => {

  const [activeTab, setActiveTab] = useState<'preview' | 'html' | 'text'>('preview');
  const [recipientEmail, setRecipientEmail] = useState(order.supplierEmail || '');
  const [copiedType, setCopiedType] = useState<'html' | 'text' | null>(null);

  const emailPayload = useMemo(() => {
    return generateOrderEmailPayload(order);
  }, [order]);

  const htmlContent = useMemo(() => {
    return generateOrderEmailHtml(order);
  }, [order]);

  const plainTextContent = useMemo(() => {
    return generateOrderEmailPlainText(order);
  }, [order]);

  const handleCopyHtml = async () => {
    const ok = await copyEmailHtmlToClipboard(htmlContent);
    if (ok) {
      setCopiedType('html');
      setTimeout(() => setCopiedType(null), 3000);
    }
  };

  const handleCopyText = async () => {
    const ok = await copyEmailTextToClipboard(plainTextContent);
    if (ok) {
      setCopiedType('text');
      setTimeout(() => setCopiedType(null), 3000);
    }
  };

  const handleOpenMailto = () => {
    const url = generateMailtoUrl(order, recipientEmail);
    window.location.href = url;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/65 backdrop-blur-xs overflow-y-auto">
      <div className="w-full max-w-4xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col my-auto max-h-[92vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-900 text-white">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-500/20 text-emerald-400 rounded-xl border border-emerald-500/30">
              <Mail className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm text-white">E-mail Formatado do Pedido de Compra</h3>
                <span className="font-mono text-xs px-2 py-0.5 rounded bg-slate-800 text-emerald-400 border border-slate-700">
                  {order.code}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Template HTML corporativo pronto para envio ao fornecedor via mailto ou APIs de e-mail
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Recipient & Quick Action Bar */}
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          <div className="flex-1 flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-600 whitespace-nowrap">Destinatário:</span>
            <input
              type="email"
              value={recipientEmail}
              onChange={(e) => setRecipientEmail(e.target.value)}
              placeholder="fornecedor@empresa.com.br"
              className="w-full text-xs font-medium px-3 py-1.5 rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 bg-white"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              id="btn-mailto-dispatch"
              onClick={handleOpenMailto}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-xs font-bold rounded-xl shadow-xs transition"
              title="Abrir no aplicativo de e-mail padrão do sistema"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Abrir no E-mail (mailto)</span>
            </button>

            <button
              id="btn-copy-html-email"
              onClick={handleCopyHtml}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 text-xs font-semibold rounded-xl border border-slate-200 shadow-2xs transition"
              title="Copiar código HTML para colar no seu provedor de e-mail ou Gmail/Outlook"
            >
              {copiedType === 'html' ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="text-emerald-700 font-bold">HTML Copiado!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-slate-500" />
                  <span>Copiar HTML</span>
                </>
              )}
            </button>

            <button
              id="btn-copy-text-email"
              onClick={handleCopyText}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 text-xs font-semibold rounded-xl border border-slate-200 shadow-2xs transition"
              title="Copiar versão em texto simples"
            >
              {copiedType === 'text' ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="text-emerald-700 font-bold">Texto Copiado!</span>
                </>
              ) : (
                <>
                  <FileText className="w-3.5 h-3.5 text-slate-500" />
                  <span>Copiar Texto</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="px-6 pt-3 bg-white border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('preview')}
              className={`inline-flex items-center gap-1.5 pb-2.5 px-3 text-xs font-bold border-b-2 transition ${
                activeTab === 'preview'
                  ? 'border-emerald-600 text-emerald-700'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Pré-visualização do E-mail</span>
            </button>

            <button
              onClick={() => setActiveTab('html')}
              className={`inline-flex items-center gap-1.5 pb-2.5 px-3 text-xs font-bold border-b-2 transition ${
                activeTab === 'html'
                  ? 'border-emerald-600 text-emerald-700'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              <Code className="w-3.5 h-3.5" />
              <span>Código HTML (Provedores de E-mail)</span>
            </button>

            <button
              onClick={() => setActiveTab('text')}
              className={`inline-flex items-center gap-1.5 pb-2.5 px-3 text-xs font-bold border-b-2 transition ${
                activeTab === 'text'
                  ? 'border-emerald-600 text-emerald-700'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Texto Simples</span>
            </button>
          </div>

          <div className="hidden sm:flex items-center gap-3 text-xs text-slate-500 pb-2.5">
            <span className="font-semibold text-slate-700">{order.supplierName}</span>
            <span>•</span>
            <span className="font-bold text-emerald-700">
              R$ {order.totalAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </span>
          </div>
        </div>

        {/* Tab Contents */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-100">
          {activeTab === 'preview' && (
            <div className="max-w-3xl mx-auto bg-white rounded-xl shadow-xs border border-slate-200 overflow-hidden">
              <div className="p-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between text-xs text-slate-600">
                <div>
                  <span className="text-slate-400">Assunto: </span>
                  <span className="font-bold text-slate-800">{emailPayload.subject}</span>
                </div>
                <div className="text-[11px] text-slate-400">
                  Renderização Exata para Clientes de E-mail
                </div>
              </div>
              <div className="p-2">
                <iframe
                  title="Email Preview"
                  srcDoc={htmlContent}
                  className="w-full min-h-[520px] border-0 rounded"
                />
              </div>
            </div>
          )}

          {activeTab === 'html' && (
            <div className="max-w-3xl mx-auto space-y-3">
              <div className="bg-amber-50 border border-amber-200 text-amber-800 text-xs p-3.5 rounded-xl">
                <strong>💡 Integração com Provedores de E-mail:</strong> O HTML abaixo contém CSS inline, tabelas semânticas e marcação universal compatível com serviços como <em>Resend</em>, <em>SendGrid</em>, <em>Amazon SES</em>, <em>Nodemailer</em> e <em>Mailgun</em>.
              </div>
              <div className="relative">
                <textarea
                  readOnly
                  value={htmlContent}
                  className="w-full h-[460px] p-4 font-mono text-xs bg-slate-900 text-emerald-300 rounded-xl border border-slate-800 resize-none focus:outline-hidden"
                />
                <button
                  onClick={handleCopyHtml}
                  className="absolute top-3 right-3 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition border border-slate-700"
                >
                  {copiedType === 'html' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedType === 'html' ? 'Copiado!' : 'Copiar HTML'}</span>
                </button>
              </div>
            </div>
          )}

          {activeTab === 'text' && (
            <div className="max-w-3xl mx-auto space-y-3">
              <div className="bg-blue-50 border border-blue-200 text-blue-800 text-xs p-3.5 rounded-xl">
                <strong>📝 Versão em Texto Puro:</strong> Utilizada como fallback obrigatório no envio via protocolo SMTP/MIME e pré-carregada automaticamente no link <code>mailto:</code>.
              </div>
              <div className="relative">
                <textarea
                  readOnly
                  value={plainTextContent}
                  className="w-full h-[460px] p-4 font-mono text-xs bg-white text-slate-800 rounded-xl border border-slate-300 resize-none focus:outline-hidden"
                />
                <button
                  onClick={handleCopyText}
                  className="absolute top-3 right-3 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition border border-slate-300"
                >
                  {copiedType === 'text' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedType === 'text' ? 'Copiado!' : 'Copiar Texto'}</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer info */}
        <div className="px-6 py-3 bg-white border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-2">
          <div>
            Pedido <span className="font-bold text-slate-700">{order.code}</span> • Fornecedor: <span className="font-semibold text-slate-700">{order.supplierName}</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl transition"
          >
            Fechar Janela
          </button>
        </div>
      </div>
    </div>
  );
};
