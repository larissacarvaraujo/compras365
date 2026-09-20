import React, { useState, useEffect } from 'react';
import { dbService } from '../../services/dataService';
import { Quote, PurchaseRequest, User, PurchaseOrder } from '../../types';
import { generatePurchaseOrderPdf } from '../../utils/orderPdfGenerator';
import {
  CheckSquare,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Scale,
  ShieldCheck,
  TrendingDown,
  Building,
  DollarSign,
  ArrowRight,
  FileDown,
} from 'lucide-react';

interface ApprovalsViewProps {
  currentUser: User;
  onViewQuote: (quoteId: string) => void;
  onViewOrder: (orderId: string) => void;
}

export const ApprovalsView: React.FC<ApprovalsViewProps> = ({
  currentUser,
  onViewQuote,
  onViewOrder,
}) => {
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [requests, setRequests] = useState<PurchaseRequest[]>([]);
  const [rejectModalItem, setRejectModalItem] = useState<{ id: string; type: 'quote' | 'request' } | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [feedbackMessage, setFeedbackMessage] = useState<{
    text: string;
    type: 'success' | 'error';
    order?: PurchaseOrder;
  } | null>(null);

  useEffect(() => {
    const load = () => {
      setQuotes(dbService.getQuotes().filter((q) => q.status === 'pending_approval'));
      setRequests(dbService.getRequests().filter((r) => r.status === 'pending_approval'));
    };
    load();
    return dbService.subscribe(load);
  }, []);

  const handleApproveQuote = (quote: Quote) => {
    try {
      // Validate limit
      if (currentUser.role !== 'admin' && currentUser.approvalLimit < quote.totalAmount) {
        setFeedbackMessage({
          type: 'error',
          text: `Não autorizado: O valor (R$ ${quote.totalAmount.toLocaleString('pt-BR')}) excede sua alçada máxima (R$ ${currentUser.approvalLimit.toLocaleString('pt-BR')}).`,
        });
        return;
      }

      const order = dbService.approveQuote(quote.id, 'Aprovado conforme mapa comparativo de menor preço e economicidade.');
      setFeedbackMessage({
        type: 'success',
        text: `Cotação ${quote.code} aprovada com sucesso! Pedido de Compra ${order.code} gerado automaticamente.`,
        order,
      });
    } catch (err: any) {
      setFeedbackMessage({ type: 'error', text: err.message || 'Erro ao aprovar.' });
    }
  };

  const handleRejectConfirm = () => {
    if (!rejectModalItem || !rejectionReason.trim()) return;

    try {
      if (rejectModalItem.type === 'quote') {
        dbService.rejectQuote(rejectModalItem.id, rejectionReason);
      }
      setFeedbackMessage({
        type: 'success',
        text: 'Item reprovado com sucesso e justificativa auditada gravada.',
      });
      setRejectModalItem(null);
      setRejectionReason('');
    } catch (err: any) {
      setFeedbackMessage({ type: 'error', text: err.message || 'Erro ao reprovar.' });
    }
  };

  const totalPendingCount = quotes.length + requests.length;

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h1 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">
            Central de Alçadas & Aprovações
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Validação de conformidade financeira e alçadas de gastos antes da emissão do pedido
          </p>
        </div>

        {/* User Approval Limit Card */}
        <div className="bg-indigo-50 border border-indigo-200 p-3 rounded-xl flex items-center gap-3">
          <ShieldCheck className="w-5 h-5 text-indigo-700 shrink-0" />
          <div className="text-xs">
            <span className="text-indigo-900 font-bold block">Sua Alçada Autorizada:</span>
            <span className="font-extrabold text-indigo-700 text-sm">
              {currentUser.role === 'admin'
                ? 'Ilimitada (Administrador Geral)'
                : `Até R$ ${currentUser.approvalLimit.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
            </span>
          </div>
        </div>
      </div>

      {/* Feedback Alert */}
      {feedbackMessage && (
        <div
          className={`p-4 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs font-semibold ${
            feedbackMessage.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}
        >
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{feedbackMessage.text}</span>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {feedbackMessage.order && (
              <>
                <button
                  id="btn-download-approved-po-pdf"
                  onClick={() => generatePurchaseOrderPdf(feedbackMessage.order!, 'download')}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold shadow-xs transition"
                >
                  <FileDown className="w-3.5 h-3.5" />
                  <span>Baixar PDF do Pedido</span>
                </button>
                <button
                  onClick={() => onViewOrder(feedbackMessage.order!.id)}
                  className="inline-flex items-center gap-1 px-3 py-1.5 bg-white border border-emerald-300 text-emerald-800 hover:bg-emerald-100 rounded-xl font-semibold transition"
                >
                  <span>Ver Pedido</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </>
            )}
            <button
              onClick={() => setFeedbackMessage(null)}
              className="text-xs hover:underline text-slate-500 hover:text-slate-700 ml-1"
            >
              Fechar
            </button>
          </div>
        </div>
      )}

      {/* Pending Items List */}
      {totalPendingCount === 0 ? (
        <div className="bg-white p-12 text-center rounded-2xl border border-slate-200 space-y-3">
          <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-900">Tudo em Dia!</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Não há nenhuma cotação ou solicitação pendente de aprovação de alçada neste momento.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
            Cotações Aguardando Parecer ({quotes.length})
          </h2>

          <div className="grid grid-cols-1 gap-4">
            {quotes.map((quote) => {
              const hasLimit =
                currentUser.role === 'admin' || currentUser.approvalLimit >= quote.totalAmount;
              const isApproverOrAdmin =
                currentUser.role === 'approver' || currentUser.role === 'admin';

              return (
                <div
                  key={quote.id}
                  className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4"
                >
                  {/* Item Top Info */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded">
                        {quote.code}
                      </span>
                      <span className="text-xs text-slate-500 font-medium">
                        Solicitações: <strong>{(quote.requestCodes || [quote.requestCode || '']).join(', ')}</strong>
                      </span>
                    </div>

                    <div className="text-right">
                      <span className="text-xs text-slate-400 block font-semibold">Valor da Compra:</span>
                      <span className="text-xl font-black text-slate-900">
                        R$ {quote.totalAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  </div>

                  {/* Winner Supplier and Savings */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                    <div>
                      <span className="text-slate-400 block font-medium">Fornecedor Vencedor</span>
                      <span className="font-bold text-slate-800 block text-sm mt-0.5">
                        {quote.winnerSupplierName || 'Fornecedor Selecionado'}
                      </span>
                      <span className="text-[11px] text-slate-500">
                        {(quote.proposals || quote.bids || []).length} propostas confrontadas
                      </span>
                    </div>

                    <div>
                      <span className="text-slate-400 block font-medium">Economia / Saving</span>
                      <span className="font-bold text-emerald-700 block text-sm mt-0.5 flex items-center gap-1">
                        <TrendingDown className="w-4 h-4" />
                        R$ {quote.savingAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </span>
                      <span className="text-[11px] text-slate-500">Menor custo do mapa</span>
                    </div>

                    <div>
                      <span className="text-slate-400 block font-medium">Alçada Requerida</span>
                      <span
                        className={`font-bold block text-sm mt-0.5 ${
                          hasLimit ? 'text-emerald-700' : 'text-rose-700'
                        }`}
                      >
                        {quote.totalAmount <= 5000
                          ? 'Nível 1 (Até R$ 5.000)'
                          : quote.totalAmount <= 50000
                          ? 'Nível 2 (Até R$ 50.000)'
                          : 'Nível 3 / Diretoria (> R$ 50.000)'}
                      </span>
                      <span className="text-[11px] text-slate-500">
                        {hasLimit ? '✓ Você tem alçada para aprovar' : '✗ Alçada insuficiente'}
                      </span>
                    </div>
                  </div>

                  {/* Items List Snapshot */}
                  <div>
                    <span className="text-xs font-bold text-slate-700 block mb-1.5">
                      Itens Inclusos na Compra:
                    </span>
                    <div className="space-y-1">
                      {(quote.items || []).map((it) => (
                        <div
                          key={it.id}
                          className="flex items-center justify-between text-xs py-1 px-2.5 bg-slate-50 rounded-lg"
                        >
                          <span className="font-medium text-slate-800 truncate max-w-[300px]">
                            {it.description}
                          </span>
                          <span className="text-slate-600 font-semibold">
                            {it.quantity} {it.unit}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
                    <button
                      onClick={() => onViewQuote(quote.id)}
                      className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
                    >
                      <Scale className="w-3.5 h-3.5" />
                      <span>Examinar Mapa Comparativo Completo →</span>
                    </button>

                    <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                      <button
                        onClick={() => setRejectModalItem({ id: quote.id, type: 'quote' })}
                        className="px-4 py-2 text-xs font-semibold text-rose-700 hover:bg-rose-50 border border-rose-200 rounded-xl transition flex items-center gap-1.5"
                      >
                        <XCircle className="w-4 h-4" />
                        <span>Reprovar</span>
                      </button>

                      <button
                        id={`btn-approve-quote-${quote.id}`}
                        disabled={!hasLimit || !isApproverOrAdmin}
                        onClick={() => handleApproveQuote(quote)}
                        className={`px-5 py-2 text-xs font-bold rounded-xl shadow-xs transition flex items-center gap-1.5 active:scale-95 ${
                          hasLimit && isApproverOrAdmin
                            ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                            : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                        }`}
                        title={
                          !hasLimit
                            ? 'Alçada insuficiente para este montante'
                            : !isApproverOrAdmin
                            ? 'Apenas aprovadores ou administradores podem aprovar'
                            : 'Aprovar compra e emitir pedido'
                        }
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Aprovar Compra & Emitir Pedido</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Reject Reason Modal */}
      {rejectModalItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 p-5 space-y-4">
            <div className="flex items-center gap-2 text-rose-600">
              <AlertTriangle className="w-5 h-5" />
              <h3 className="font-bold text-slate-900 text-base">Justificativa de Reprovação</h3>
            </div>
            <p className="text-xs text-slate-600">
              Para auditoria e conformidade, é obrigatório registrar o motivo formal da reprovação desta compra.
            </p>
            <textarea
              required
              rows={3}
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="Ex: Preço acima do benchmark de mercado; solicitar nova rodada com outros fornecedores..."
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-rose-500 focus:outline-hidden"
            />
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => {
                  setRejectModalItem(null);
                  setRejectionReason('');
                }}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                Cancelar
              </button>
              <button
                disabled={!rejectionReason.trim()}
                onClick={handleRejectConfirm}
                className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl disabled:opacity-50"
              >
                Confirmar Reprovação
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
