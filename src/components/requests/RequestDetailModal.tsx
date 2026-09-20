import React from 'react';
import { PurchaseRequest, User } from '../../types';
import { dbService } from '../../services/dataService';
import { X, Clock, CheckCircle, Scale, ShoppingBag, ArrowRight } from 'lucide-react';

interface RequestDetailModalProps {
  request: PurchaseRequest | null;
  isOpen: boolean;
  onClose: () => void;
  currentUser: User;
  onStartQuote: (requestId: string) => void;
  onViewQuote: (quoteId: string) => void;
  onViewOrder: (orderId: string) => void;
}

export const RequestDetailModal: React.FC<RequestDetailModalProps> = ({
  request,
  isOpen,
  onClose,
  currentUser,
  onStartQuote,
  onViewQuote,
  onViewOrder,
}) => {
  if (!isOpen || !request) return null;

  const canStartQuote =
    (currentUser.role === 'buyer' || currentUser.role === 'admin') &&
    (request.status === 'pending_quote' || request.status === 'draft');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
      <div className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-6">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-3">
            <span className="font-mono text-sm font-black text-indigo-700 bg-indigo-50 border border-indigo-200 px-2.5 py-1 rounded-lg">
              {request.code}
            </span>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-slate-900">
                Solicitação de Compra
              </h2>
              <span className="text-xs text-slate-500">
                Criada em {new Date(request.createdAt).toLocaleDateString('pt-BR')} por {request.requesterName}
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200/50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-5 max-h-[75vh] overflow-y-auto">
          {/* Metadata Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-xs">
            <div>
              <span className="text-slate-400 block font-medium">Departamento</span>
              <span className="font-semibold text-slate-800">{request.department}</span>
            </div>
            <div>
              <span className="text-slate-400 block font-medium">Urgência</span>
              <span
                className={`font-bold uppercase ${
                  request.urgency === 'urgent'
                    ? 'text-red-600'
                    : request.urgency === 'high'
                    ? 'text-amber-600'
                    : 'text-slate-700'
                }`}
              >
                {request.urgency}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block font-medium">Status Atual</span>
              <span className="font-bold text-indigo-700">{request.status}</span>
            </div>
            <div>
              <span className="text-slate-400 block font-medium">Total Estimado</span>
              <span className="font-black text-slate-900">
                R$ {request.estimatedTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>

          {/* Justification */}
          <div>
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Justificativa
            </h4>
            <p className="text-xs sm:text-sm text-slate-700 bg-slate-50 p-3 rounded-xl border border-slate-200 leading-relaxed">
              {request.justification}
            </p>
          </div>

          {/* Items */}
          <div>
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Itens Solicitados ({request.items.length})
            </h4>
            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
                  <tr>
                    <th className="p-2.5">Descrição</th>
                    <th className="p-2.5 text-center">Qtd</th>
                    <th className="p-2.5 text-center">Un</th>
                    <th className="p-2.5 text-right">Valor Est. Unit.</th>
                    <th className="p-2.5 text-right">Subtotal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {request.items.map((item, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/50">
                      <td className="p-2.5 font-medium text-slate-800">{item.description}</td>
                      <td className="p-2.5 text-center">{item.quantity}</td>
                      <td className="p-2.5 text-center">{item.unit}</td>
                      <td className="p-2.5 text-right text-slate-600">
                        R$ {item.estimatedUnitPrice.toFixed(2)}
                      </td>
                      <td className="p-2.5 text-right font-bold text-slate-900">
                        R$ {(item.quantity * item.estimatedUnitPrice).toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Approval Feedback if any */}
          {request.approvalComment && (
            <div className="p-3.5 bg-indigo-50 border border-indigo-200 rounded-xl text-xs space-y-1">
              <span className="font-bold text-indigo-900 block">
                Parecer de Alçada / Aprovador ({request.approvedByName || 'Diretoria'}):
              </span>
              <p className="text-indigo-800">{request.approvalComment}</p>
            </div>
          )}

          {/* Linked Workflow Steps (Quote / Order) */}
          <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-100">
            {request.quoteId && (
              <button
                onClick={() => {
                  onClose();
                  onViewQuote(request.quoteId!);
                }}
                className="inline-flex items-center gap-1.5 px-3 py-2 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-xl text-xs font-semibold transition"
              >
                <Scale className="w-3.5 h-3.5" />
                <span>Ver Cotação Comparativa</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            )}

            {request.orderId && (
              <button
                onClick={() => {
                  onClose();
                  onViewOrder(request.orderId!);
                }}
                className="inline-flex items-center gap-1.5 px-3 py-2 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-xl text-xs font-semibold transition"
              >
                <ShoppingBag className="w-3.5 h-3.5" />
                <span>Ver Pedido de Compra (PO)</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-5 py-3 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200 rounded-xl transition"
          >
            Fechar
          </button>

          {canStartQuote && (
            <button
              onClick={() => {
                onClose();
                onStartQuote(request.id);
              }}
              className="px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs transition flex items-center gap-1.5 active:scale-95"
            >
              <Scale className="w-4 h-4" />
              <span>Abrir Cotação com Fornecedores</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
