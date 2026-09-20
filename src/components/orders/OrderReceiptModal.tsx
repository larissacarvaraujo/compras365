import React, { useState } from 'react';
import { PurchaseOrder, User } from '../../types';
import { dbService } from '../../services/dataService';
import { X, Boxes, CheckCircle2, FileCheck, AlertCircle } from 'lucide-react';

interface OrderReceiptModalProps {
  order: PurchaseOrder | null;
  isOpen: boolean;
  onClose: () => void;
  currentUser: User;
  onSuccess: () => void;
}

export const OrderReceiptModal: React.FC<OrderReceiptModalProps> = (props) => {
  if (!props.isOpen || !props.order) return null;
  return <OrderReceiptModalContent {...props} order={props.order} />;
};

interface OrderReceiptModalContentProps extends Omit<OrderReceiptModalProps, 'order'> {
  order: PurchaseOrder;
}

const OrderReceiptModalContent: React.FC<OrderReceiptModalContentProps> = ({
  order,
  isOpen,
  onClose,
  currentUser,
  onSuccess,
}) => {

  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [invoiceKey, setInvoiceKey] = useState('');
  const [receivedQtys, setReceivedQtys] = useState<Record<string, number>>(() => {
    const init: Record<string, number> = {};
    order.items.forEach((item) => {
      const remaining = item.quantity - (item.receivedQuantity || 0);
      init[item.id] = remaining > 0 ? remaining : 0;
    });
    return init;
  });
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');

  const handleQtyChange = (itemId: string, val: number, maxQty: number) => {
    setReceivedQtys((prev) => ({
      ...prev,
      [itemId]: Math.max(0, Math.min(val, maxQty)),
    }));
  };

  const handleConfirmReceipt = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!invoiceNumber.trim()) {
      setError('Informe o número da Nota Fiscal de Entrada.');
      return;
    }

    const itemsToReceive = order.items.map((it) => ({
      itemId: it.id,
      quantityReceived: Number(receivedQtys[it.id]) || 0,
    }));

    const hasAnyQty = itemsToReceive.some((it) => it.quantityReceived > 0);
    if (!hasAnyQty) {
      setError('Informe ao menos uma quantidade recebida para os itens.');
      return;
    }

    try {
      dbService.receiveOrder(order.id, {
        invoiceNumber,
        invoiceKey,
        itemsReceived: itemsToReceive,
        notes,
      });

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Erro ao registrar entrada de mercadoria.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
      <div className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-6">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-emerald-100 text-emerald-700 rounded-xl">
              <Boxes className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Entrada de Mercadoria / Almoxarifado
              </h2>
              <p className="text-xs text-slate-500">
                Recebimento físico de materiais com base no Pedido <strong>{order.code}</strong>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200/50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleConfirmReceipt} className="p-5 space-y-4 max-h-[80vh] overflow-y-auto">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs font-medium">
              {error}
            </div>
          )}

          {/* Supplier and Order Context */}
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs grid grid-cols-2 gap-2">
            <div>
              <span className="text-slate-400 block font-medium">Fornecedor:</span>
              <strong className="text-slate-800">{order.supplierName}</strong>
            </div>
            <div>
              <span className="text-slate-400 block font-medium">Responsável Recebimento:</span>
              <strong className="text-slate-800">{currentUser.displayName} ({currentUser.role})</strong>
            </div>
          </div>

          {/* Invoice Info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Número da Nota Fiscal (NF-e) *
              </label>
              <input
                type="text"
                required
                placeholder="Ex: 000.124.552 - Série 1"
                value={invoiceNumber}
                onChange={(e) => setInvoiceNumber(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-white text-slate-800 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Chave de Acesso NF-e (Opcional)
              </label>
              <input
                type="text"
                placeholder="44 dígitos da NF-e"
                value={invoiceKey}
                onChange={(e) => setInvoiceKey(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-white text-slate-800 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-hidden font-mono"
              />
            </div>
          </div>

          {/* Items Receipt Table */}
          <div>
            <label className="block text-xs font-bold text-slate-900 uppercase tracking-wider mb-2">
              Conferência Física de Itens:
            </label>
            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
                  <tr>
                    <th className="p-2.5">Descrição</th>
                    <th className="p-2.5 text-center">Pedido</th>
                    <th className="p-2.5 text-center">Já Entregue</th>
                    <th className="p-2.5 text-right w-28">Qtd Recebida Agora</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {order.items.map((it) => {
                    const alreadyReceived = it.receivedQuantity || 0;
                    const remaining = Math.max(0, it.quantity - alreadyReceived);

                    return (
                      <tr key={it.id} className="hover:bg-slate-50/60">
                        <td className="p-2.5 font-medium text-slate-800">
                          {it.description}
                          <span className="block text-[10px] text-slate-400">Unidade: {it.unit}</span>
                        </td>
                        <td className="p-2.5 text-center font-bold text-slate-700">
                          {it.quantity}
                        </td>
                        <td className="p-2.5 text-center text-slate-500">
                          {alreadyReceived}
                        </td>
                        <td className="p-2.5 text-right">
                          <input
                            type="number"
                            min="0"
                            max={remaining}
                            value={receivedQtys[it.id] ?? remaining}
                            onChange={(e) => handleQtyChange(it.id, Number(e.target.value), remaining)}
                            className="w-20 px-2 py-1 text-xs text-right font-bold border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <p className="text-[11px] text-slate-400 mt-1.5">
              * Ao confirmar, o saldo do almoxarifado será acrescido imediatamente e o log de auditoria será gerado.
            </p>
          </div>

          {/* Observations */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Observações do Recebimento (Lacre, avarias, etc.)
            </label>
            <input
              type="text"
              placeholder="Ex: Embalagens íntegras, material conferido sem avarias aparentes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-white text-slate-800 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
            />
          </div>

          {/* Footer Actions */}
          <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs transition active:scale-95 flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Confirmar Entrada no Estoque</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
