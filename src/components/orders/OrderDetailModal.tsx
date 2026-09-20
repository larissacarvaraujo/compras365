import React, { useState } from 'react';
import { PurchaseOrder, User } from '../../types';
import { dbService } from '../../services/dataService';
import { OrderReceiptModal } from './OrderReceiptModal';
import { generatePurchaseOrderPdf } from '../../utils/orderPdfGenerator';
import { OrderEmailModal } from './OrderEmailModal';
import {
  generateOrderEmailPayload,
  generateMailtoUrl,
} from '../../utils/orderEmailGenerator';
import {
  X,
  Printer,
  Share2,
  Boxes,
  CheckCircle2,
  Clock,
  Building,
  CreditCard,
  Truck,
  Phone,
  Mail,
  Send,
  FileDown,
  ExternalLink,
  Check,
} from 'lucide-react';

interface OrderDetailModalProps {
  order: PurchaseOrder | null;
  isOpen: boolean;
  onClose: () => void;
  currentUser: User;
  onRefresh: () => void;
}

export const OrderDetailModal: React.FC<OrderDetailModalProps> = (props) => {
  if (!props.isOpen || !props.order) return null;
  return <OrderDetailModalContent {...props} order={props.order} />;
};

interface OrderDetailModalContentProps extends Omit<OrderDetailModalProps, 'order'> {
  order: PurchaseOrder;
}

const OrderDetailModalContent: React.FC<OrderDetailModalContentProps> = ({
  order,
  isOpen,
  onClose,
  currentUser,
  onRefresh,
}) => {
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [pdfSuccessMessage, setPdfSuccessMessage] = useState<string | null>(null);

  const canReceive =
    (currentUser.role === 'stock_manager' ||
      currentUser.role === 'admin' ||
      currentUser.role === 'buyer') &&
    order.status !== 'received' &&
    order.status !== 'cancelled';

  const handleDownloadPdf = () => {
    try {
      setIsGeneratingPdf(true);
      const filename = generatePurchaseOrderPdf(order, 'download');
      setPdfSuccessMessage(`Arquivo ${filename} baixado com sucesso!`);
      setTimeout(() => setPdfSuccessMessage(null), 4500);
    } catch (err) {
      console.error('Falha ao gerar PDF:', err);
      alert('Erro ao gerar o arquivo PDF do pedido de compra.');
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const handlePreviewPdf = () => {
    try {
      generatePurchaseOrderPdf(order, 'preview');
    } catch (err) {
      console.error('Falha ao visualizar PDF:', err);
      alert('Erro ao abrir a pré-visualização do PDF.');
    }
  };

  const handleSendEmail = () => {
    setShowEmailModal(true);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleSendWhatsApp = () => {
    const phoneClean = (order.supplierPhone || '').replace(/\D/g, '');
    const itemsText = (order.items || [])
      .map((it) => `• ${it.quantity}x ${it.description} - R$ ${it.unitPrice.toFixed(2)} un`)
      .join('\n');

    const message = `*PEDIDO DE COMPRA - COMPRAS365*\n` +
      `Código: *${order.code}*\n` +
      `Fornecedor: *${order.supplierName}*\n` +
      `Prazo de Entrega: *${new Date(order.deliveryDeadline).toLocaleDateString('pt-BR')}*\n` +
      `Condição de Pagamento: *${order.paymentTerms}*\n\n` +
      `*ITENS DO PEDIDO:*\n${itemsText}\n\n` +
      `*VALOR TOTAL:* R$ ${order.totalAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}\n` +
      `Local de Entrega: Almoxarifado Central - Av. das Indústrias, 365\n\n` +
      `Por favor, confirmar o recebimento e o prazo deste pedido.`;

    const encoded = encodeURI(message);
    const whatsappUrl = `https://api.whatsapp.com/send?phone=${phoneClean.startsWith('55') ? phoneClean : '55' + phoneClean}&text=${encoded}`;
    window.open(whatsappUrl, '_blank');
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/65 backdrop-blur-xs overflow-y-auto print:p-0 print:bg-white">
        <div className="w-full max-w-4xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-4 print:shadow-none print:border-none print:my-0">
          {/* Action Bar (Hidden when printing) */}
          <div className="px-5 py-3.5 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2 bg-slate-50 print:hidden">
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
                {order.code}
              </span>
              <span className="text-xs text-slate-500 font-medium">Pedido Oficial de Fornecimento</span>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {/* Primary PDF Download Action */}
              <button
                id="btn-download-pdf-top"
                onClick={handleDownloadPdf}
                disabled={isGeneratingPdf}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white text-xs font-bold rounded-xl shadow-xs transition disabled:opacity-50"
                title="Gerar e baixar arquivo PDF oficial com itens e fornecedor"
              >
                <FileDown className="w-4 h-4" />
                <span>{isGeneratingPdf ? 'Gerando...' : 'Baixar PDF Oficial'}</span>
              </button>

              <button
                id="btn-preview-pdf"
                onClick={handlePreviewPdf}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 text-xs font-semibold rounded-xl border border-slate-200 transition"
                title="Abrir pré-visualização do PDF"
              >
                <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
                <span className="hidden sm:inline">Visualizar PDF</span>
              </button>

              <button
                id="btn-email-order"
                onClick={handleSendEmail}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 text-xs font-semibold rounded-xl border border-slate-200 transition"
                title="Enviar dados do pedido por E-mail ao fornecedor"
              >
                <Mail className="w-3.5 h-3.5 text-slate-400" />
                <span className="hidden sm:inline">E-mail</span>
              </button>

              <button
                id="btn-whatsapp-order"
                onClick={handleSendWhatsApp}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs transition"
                title="Enviar pedido formatado pelo WhatsApp"
              >
                <Send className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">WhatsApp</span>
              </button>

              <button
                onClick={handlePrint}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl border border-slate-200 transition"
                title="Imprimir pedido"
              >
                <Printer className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Imprimir</span>
              </button>

              <button
                onClick={onClose}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-200/50 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Success Banner when PDF downloaded */}
          {pdfSuccessMessage && (
            <div className="bg-emerald-600 text-white px-5 py-2.5 text-xs font-semibold flex items-center justify-between print:hidden">
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-200" />
                <span>{pdfSuccessMessage}</span>
              </div>
              <button onClick={() => setPdfSuccessMessage(null)} className="text-emerald-100 hover:underline">
                OK
              </button>
            </div>
          )}

          {/* Printable Formal Purchase Order Layout */}
          <div className="p-6 sm:p-8 space-y-6 max-h-[82vh] overflow-y-auto print:max-h-none print:p-0 print:space-y-4">
            {/* Vendor PDF Dispatch Highlight Banner */}
            <div className="bg-slate-900 text-white p-4 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 print:hidden shadow-xs border border-slate-800">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <FileDown className="w-4 h-4 text-emerald-400" />
                  <span className="font-bold text-sm text-white">Documento Formal para Envio ao Fornecedor</span>
                </div>
                <p className="text-xs text-slate-300">
                  Gere o arquivo PDF do pedido contendo os dados do fornecedor, itens, valores e instruções fiscais para envio formal a <strong>{order.supplierName}</strong>.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto shrink-0">
                <button
                  id="btn-open-email-modal-hero"
                  onClick={() => setShowEmailModal(true)}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-100 font-bold text-xs rounded-xl shadow-xs transition border border-slate-700"
                  title="Visualizar e enviar e-mail formatado em HTML com itens e dados do pedido"
                >
                  <Mail className="w-4 h-4 text-emerald-400" />
                  <span>E-mail Formatado (HTML)</span>
                </button>
                <button
                  id="btn-download-order-pdf-hero"
                  onClick={handleDownloadPdf}
                  disabled={isGeneratingPdf}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-xl shadow-xs transition"
                >
                  <FileDown className="w-4 h-4 text-slate-950" />
                  <span>{isGeneratingPdf ? 'Gerando PDF...' : 'Baixar Arquivo PDF'}</span>
                </button>
              </div>
            </div>

            {/* Header / Company Info */}
            <div className="flex justify-between items-start border-b-2 border-slate-900 pb-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-8 h-8 rounded-lg bg-slate-900 text-white flex items-center justify-center font-black text-sm">
                    C365
                  </div>
                  <span className="text-xl font-black text-slate-900 tracking-tight">COMPRAS365 S/A</span>
                </div>
                <p className="text-xs text-slate-600">CNPJ: 12.345.678/0001-90 • Inscrição Estadual: 112.233.445.556</p>
                <p className="text-xs text-slate-500">Av. das Nações Unidas, 14.401 - São Paulo/SP - CEP: 04794-000</p>
              </div>

              <div className="text-right">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                  Ordem de Compra
                </span>
                <span className="text-2xl font-black text-slate-900 font-mono block">
                  {order.code}
                </span>
                <span className="text-xs text-slate-500 block">
                  Emissão: {new Date(order.createdAt).toLocaleDateString('pt-BR')}
                </span>
              </div>
            </div>

            {/* Supplier & Delivery Context Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              {/* Supplier Info */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Dados do Fornecedor Contratado
                </span>
                <p className="text-sm font-bold text-slate-900">{order.supplierName}</p>
                <p className="text-slate-600">CNPJ: <strong>{order.supplierCnpj}</strong></p>
                <p className="text-slate-600">Contato: {order.supplierContact} • Tel: {order.supplierPhone}</p>
                <p className="text-slate-600">E-mail: {order.supplierEmail}</p>
              </div>

              {/* Delivery & Billing Info */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Condições de Entrega e Faturamento
                </span>
                <p className="text-slate-700">
                  Prazo Limite Entrega: <strong className="text-slate-900">{new Date(order.deliveryDeadline).toLocaleDateString('pt-BR')}</strong>
                </p>
                <p className="text-slate-700">
                  Condição Pagamento: <strong className="text-slate-900">{order.paymentTerms}</strong>
                </p>
                <p className="text-slate-700">
                  Local de Entrega: <strong className="text-slate-900">{order.deliveryAddress}</strong>
                </p>
                <p className="text-slate-700">
                  Aprovador Responsável: <strong>{order.approvedByName}</strong>
                </p>
              </div>
            </div>

            {/* Items Table */}
            <div>
              <span className="text-xs font-bold text-slate-900 uppercase tracking-wider block mb-2">
                Especificação de Materiais / Serviços
              </span>
              <div className="border border-slate-300 rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-300 uppercase text-[10px]">
                    <tr>
                      <th className="p-3">Item</th>
                      <th className="p-3">Descrição Técnica</th>
                      <th className="p-3 text-center">Qtd</th>
                      <th className="p-3 text-center">Un</th>
                      <th className="p-3 text-right">Preço Unit. (R$)</th>
                      <th className="p-3 text-right">Total Item (R$)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {order.items.map((it, idx) => (
                      <tr key={it.id}>
                        <td className="p-3 text-slate-500 font-mono">{idx + 1}</td>
                        <td className="p-3 font-semibold text-slate-900">{it.description}</td>
                        <td className="p-3 text-center font-bold text-slate-800">{it.quantity}</td>
                        <td className="p-3 text-center text-slate-600">{it.unit}</td>
                        <td className="p-3 text-right text-slate-700">
                          {it.unitPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="p-3 text-right font-bold text-slate-900">
                          {it.totalPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  {/* Totals */}
                  <tfoot className="bg-slate-50 border-t-2 border-slate-300">
                    {(order.freightAmount || order.freightCost || 0) > 0 && (
                      <tr>
                        <td colSpan={5} className="p-2.5 text-right text-slate-600 font-medium">
                          Frete / Seguro:
                        </td>
                        <td className="p-2.5 text-right font-semibold text-slate-800">
                          R$ {(order.freightAmount || order.freightCost || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </td>
                      </tr>
                    )}
                    <tr>
                      <td colSpan={5} className="p-3 text-right font-black text-slate-900 text-sm uppercase">
                        Valor Total do Pedido:
                      </td>
                      <td className="p-3 text-right font-black text-slate-900 text-base">
                        R$ {order.totalAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>

            {/* Invoices Attached / Receipt Info if received */}
            {order.invoices && order.invoices.length > 0 && (
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl space-y-2 text-xs">
                <span className="font-bold text-emerald-900 uppercase tracking-wider block">
                  Notas Fiscais de Entrada Registradas no Almoxarifado:
                </span>
                {order.invoices.map((inv, i) => (
                  <div key={i} className="flex justify-between items-center text-emerald-800">
                    <span>
                      NF-e: <strong>{inv.number}</strong> • Recebido em {new Date(inv.receivedAt).toLocaleDateString('pt-BR')} por {inv.receivedByName}
                    </span>
                    {inv.accessKey && <span className="font-mono text-[10px]">{inv.accessKey.slice(0, 20)}...</span>}
                  </div>
                ))}
              </div>
            )}

            {/* Signature & Authorization Section */}
            <div className="grid grid-cols-2 gap-8 pt-8 border-t border-slate-300 text-center text-xs text-slate-600">
              <div>
                <div className="border-b border-slate-400 pb-1 mb-1 font-semibold text-slate-800">
                  {order.approvedByName || 'Diretoria de Operações'}
                </div>
                <span>Autorização de Compra (Alçada Aprovada)</span>
              </div>
              <div>
                <div className="border-b border-slate-400 pb-1 mb-1 font-semibold text-slate-800">
                  {order.supplierName}
                </div>
                <span>Aceite do Fornecedor / Vendedor</span>
              </div>
            </div>
          </div>

          {/* Footer (Hidden when printing) */}
          <div className="px-5 py-3 border-t border-slate-200 bg-slate-50 flex items-center justify-between print:hidden">
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500">Status Atual:</span>
              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-slate-200 text-slate-800">
                {order.status}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200 rounded-xl transition"
              >
                Fechar
              </button>

              {canReceive && (
                <button
                  onClick={() => setShowReceiptModal(true)}
                  className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs transition flex items-center gap-1.5 active:scale-95"
                >
                  <Boxes className="w-4 h-4" />
                  <span>Registrar Entrada Almoxarifado (NF)</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Order Receipt Submodal */}
      <OrderReceiptModal
        order={order}
        isOpen={showReceiptModal}
        currentUser={currentUser}
        onClose={() => setShowReceiptModal(false)}
        onSuccess={() => {
          setShowReceiptModal(false);
          onRefresh();
          onClose();
        }}
      />

      {/* Order Email Submodal */}
      <OrderEmailModal
        order={order}
        isOpen={showEmailModal}
        onClose={() => setShowEmailModal(false)}
      />
    </>
  );
};
