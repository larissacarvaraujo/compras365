import React, { useState } from 'react';
import { StockItem, User } from '../../types';
import { dbService } from '../../services/dataService';
import { X, ArrowDownRight, ArrowUpRight, CheckCircle2, AlertCircle } from 'lucide-react';

interface StockMovementModalProps {
  item: StockItem | null;
  isOpen: boolean;
  onClose: () => void;
  currentUser: User;
  onSuccess: () => void;
}

export const StockMovementModal: React.FC<StockMovementModalProps> = (props) => {
  if (!props.isOpen || !props.item) return null;
  return <StockMovementModalContent {...props} item={props.item} />;
};

interface StockMovementModalContentProps extends Omit<StockMovementModalProps, 'item'> {
  item: StockItem;
}

const StockMovementModalContent: React.FC<StockMovementModalContentProps> = ({
  item,
  isOpen,
  onClose,
  currentUser,
  onSuccess,
}) => {

  const [type, setType] = useState<'exit' | 'entry' | 'adjustment'>('exit');
  const [quantity, setQuantity] = useState<number>(1);
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (quantity <= 0) {
      setError('A quantidade deve ser maior que zero.');
      return;
    }

    if (type === 'exit' && quantity > item.currentStock) {
      setError(`Saldo insuficiente! Saldo atual é de ${item.currentStock} ${item.unit}.`);
      return;
    }

    if (!reason.trim()) {
      setError('Informe a justificativa ou ordem de serviço para a movimentação.');
      return;
    }

    try {
      dbService.createStockMovement({
        stockItemId: item.id,
        itemCode: item.code || item.sku || '',
        description: item.description || item.name || '',
        type,
        quantity,
        reason,
      });

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Erro ao movimentar estoque.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div>
            <h2 className="text-base font-bold text-slate-900">Movimentação de Almoxarifado</h2>
            <span className="font-mono text-xs text-indigo-700">{item.code} - {item.description}</span>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs font-semibold">
              {error}
            </div>
          )}

          {/* Current Stock Balance info */}
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between text-xs">
            <span className="text-slate-500 font-medium">Saldo Atual em Prateleira:</span>
            <span className="text-base font-black text-slate-900">
              {item.currentStock} {item.unit}
            </span>
          </div>

          {/* Movement Type */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Tipo de Operação
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setType('exit')}
                className={`py-2 px-1 text-xs font-bold rounded-xl border flex flex-col items-center gap-1 transition ${
                  type === 'exit'
                    ? 'bg-rose-50 border-rose-500 text-rose-700'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <ArrowDownRight className="w-4 h-4" />
                <span>Saída / Baixa</span>
              </button>

              <button
                type="button"
                onClick={() => setType('entry')}
                className={`py-2 px-1 text-xs font-bold rounded-xl border flex flex-col items-center gap-1 transition ${
                  type === 'entry'
                    ? 'bg-emerald-50 border-emerald-500 text-emerald-700'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <ArrowUpRight className="w-4 h-4" />
                <span>Entrada Avulsa</span>
              </button>

              <button
                type="button"
                onClick={() => setType('adjustment')}
                className={`py-2 px-1 text-xs font-bold rounded-xl border flex flex-col items-center gap-1 transition ${
                  type === 'adjustment'
                    ? 'bg-blue-50 border-blue-500 text-blue-700'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <span>Ajuste Inventário</span>
              </button>
            </div>
          </div>

          {/* Quantity */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Quantidade ({item.unit})
            </label>
            <input
              type="number"
              min="1"
              required
              value={quantity}
              onChange={(e) => setQuantity(Number(e.target.value))}
              className="w-full px-3 py-2 text-xs bg-white text-slate-800 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 font-bold"
            />
          </div>

          {/* Reason */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Motivo / Destino / Ordem de Serviço
            </label>
            <input
              type="text"
              required
              placeholder="Ex: OS #492 - Manutenção preventiva ar condicionado..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-white text-slate-800 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Actions */}
          <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs transition active:scale-95"
            >
              Registrar Movimentação
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
