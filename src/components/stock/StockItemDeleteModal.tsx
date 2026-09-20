import React, { useState } from 'react';
import { dbService } from '../../services/dataService';
import { StockItem, User } from '../../types';
import { AlertTriangle, Trash2, X, AlertCircle } from 'lucide-react';

interface StockItemDeleteModalProps {
  isOpen: boolean;
  item: StockItem | null;
  onClose: () => void;
  onSuccess: () => void;
  currentUser: User;
}

export const StockItemDeleteModal: React.FC<StockItemDeleteModalProps> = (props) => {
  if (!props.isOpen || !props.item) return null;
  return <StockItemDeleteModalContent {...props} item={props.item} />;
};

interface StockItemDeleteModalContentProps extends Omit<StockItemDeleteModalProps, 'item'> {
  item: StockItem;
}

const StockItemDeleteModalContent: React.FC<StockItemDeleteModalContentProps> = ({
  item,
  onClose,
  onSuccess,
}) => {
  const [error, setError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = () => {
    setIsDeleting(true);
    setError(null);
    try {
      dbService.deleteStockItem(item.id);
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Erro ao excluir item de estoque.');
      setIsDeleting(false);
    }
  };

  const hasStock = item.currentStock > 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="px-5 py-4 bg-red-600 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-white/20 rounded-xl">
              <Trash2 className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-base font-bold">Excluir Material do Estoque</h2>
              <p className="text-xs text-red-100">Confirmação de exclusão física e contábil</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-white/80 hover:text-white rounded-lg transition hover:bg-white/10"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4">
          {error && (
            <div className="p-3.5 bg-red-50 border border-red-200 text-red-800 rounded-xl text-xs font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
              <span>{error}</span>
            </div>
          )}

          <p className="text-xs text-slate-600 leading-relaxed">
            Você tem certeza de que deseja remover permanentemente este item do almoxarifado?
          </p>

          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs font-bold text-slate-800 bg-white px-2 py-0.5 rounded border border-slate-200">
                {item.code || item.sku}
              </span>
              <span className="text-xs text-slate-500 font-medium">{item.category}</span>
            </div>
            <h3 className="text-sm font-bold text-slate-900">{item.description || item.name}</h3>
            <div className="text-xs text-slate-500 flex items-center justify-between pt-1 border-t border-slate-200/60">
              <span>Localização: {item.location}</span>
              <span className="font-bold text-slate-800">
                Saldo atual: {item.currentStock} {item.unit}
              </span>
            </div>
          </div>

          {hasStock && (
            <div className="p-3 bg-amber-50 border border-amber-300 rounded-xl text-amber-900 text-xs flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <strong className="block font-bold">Aviso de Saldo Existente!</strong>
                Este item ainda possui <strong>{item.currentStock} {item.unit}</strong> registradas em estoque. A exclusão removerá o registro e baixará todo o saldo do inventário ativo.
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={isDeleting}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition"
            >
              Cancelar
            </button>

            <button
              type="button"
              onClick={handleDelete}
              disabled={isDeleting}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-red-600 hover:bg-red-700 active:scale-95 text-white text-xs font-bold rounded-xl shadow-xs transition disabled:opacity-50"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>{isDeleting ? 'Excluindo...' : 'Confirmar e Excluir'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
