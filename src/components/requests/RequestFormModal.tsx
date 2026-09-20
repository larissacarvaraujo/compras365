import React, { useState } from 'react';
import { dbService } from '../../services/dataService';
import { RequestItem, RequestUrgency, User } from '../../types';
import { X, Plus, Trash2, ShoppingBag } from 'lucide-react';

interface RequestFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User;
  onSuccess: (requestId: string) => void;
}

export const RequestFormModal: React.FC<RequestFormModalProps> = (props) => {
  if (!props.isOpen) return null;
  return <RequestFormModalContent {...props} />;
};

const RequestFormModalContent: React.FC<RequestFormModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onSuccess,
}) => {
  const [department, setDepartment] = useState(currentUser.department || 'TI & Infraestrutura');
  const [justification, setJustification] = useState('');
  const [urgency, setUrgency] = useState<RequestUrgency>('medium');
  const [items, setItems] = useState<Omit<RequestItem, 'id'>[]>([
    { description: '', quantity: 1, unit: 'UN', estimatedUnitPrice: 0 },
  ]);
  const [error, setError] = useState('');

  const handleAddItem = () => {
    setItems([...items, { description: '', quantity: 1, unit: 'UN', estimatedUnitPrice: 0 }]);
  };

  const handleRemoveItem = (index: number) => {
    if (items.length === 1) return;
    setItems(items.filter((_, i) => i !== index));
  };

  const handleItemChange = (index: number, field: keyof Omit<RequestItem, 'id'>, value: any) => {
    const updated = [...items];
    updated[index] = { ...updated[index], [field]: value };
    setItems(updated);
  };

  const calculatedTotal = items.reduce(
    (acc, it) => acc + (Number(it.quantity) || 0) * (Number(it.estimatedUnitPrice) || 0),
    0
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!justification.trim() || justification.length < 10) {
      setError('Por favor, informe uma justificativa detalhada (mínimo de 10 caracteres).');
      return;
    }

    const invalidItem = items.some((it) => !it.description.trim() || it.quantity <= 0);
    if (invalidItem) {
      setError('Preencha a descrição e quantidade válida de todos os itens.');
      return;
    }

    try {
      const newReq = dbService.createRequest({
        department,
        justification,
        urgency,
        status: 'pending_quote',
        estimatedTotal: calculatedTotal,
        items: items.map((it, idx) => ({
          ...it,
          id: 'item-' + Date.now() + '-' + idx,
        })),
      });

      onSuccess(newReq.id);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Erro ao criar solicitação.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
      <div className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-6">
        {/* Modal Header */}
        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-indigo-100 text-indigo-700 rounded-xl">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Nova Solicitação de Compra</h2>
              <p className="text-xs text-slate-500">Inicia o fluxo de cotação e aprovação corporativa</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200/50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 max-h-[80vh] overflow-y-auto">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs font-medium">
              {error}
            </div>
          )}

          {/* Requester & Department */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Solicitante
              </label>
              <input
                type="text"
                disabled
                value={`${currentUser.displayName} (${currentUser.role})`}
                className="w-full px-3 py-2 text-xs bg-slate-100 text-slate-600 border border-slate-200 rounded-xl"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Centro de Custo / Departamento
              </label>
              <input
                type="text"
                required
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                placeholder="Ex: TI & Infraestrutura"
                className="w-full px-3 py-2 text-xs bg-white text-slate-800 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
              />
            </div>
          </div>

          {/* Urgency */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Grau de Urgência
            </label>
            <div className="grid grid-cols-4 gap-2">
              {[
                { id: 'low', label: 'Baixa', color: 'peer-checked:bg-slate-700 peer-checked:text-white' },
                { id: 'medium', label: 'Média', color: 'peer-checked:bg-blue-600 peer-checked:text-white' },
                { id: 'high', label: 'Alta', color: 'peer-checked:bg-amber-600 peer-checked:text-white' },
                { id: 'urgent', label: 'Crítica / Urgente', color: 'peer-checked:bg-red-600 peer-checked:text-white' },
              ].map((urg) => (
                <label key={urg.id} className="cursor-pointer">
                  <input
                    type="radio"
                    name="urgency"
                    value={urg.id}
                    checked={urgency === urg.id}
                    onChange={() => setUrgency(urg.id as RequestUrgency)}
                    className="peer sr-only"
                  />
                  <div
                    className={`py-2 px-1 text-center text-xs font-semibold rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 transition ${urg.color}`}
                  >
                    {urg.label}
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Justification */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Justificativa da Compra (Finalidade e aplicação)
            </label>
            <textarea
              required
              rows={2}
              value={justification}
              onChange={(e) => setJustification(e.target.value)}
              placeholder="Ex: Aquisição necessária para substituição de equipamento com defeito no setor produtivo..."
              className="w-full px-3 py-2 text-xs bg-white text-slate-800 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
            />
          </div>

          {/* Items List */}
          <div className="pt-2">
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Itens Solicitados
              </label>
              <button
                type="button"
                onClick={handleAddItem}
                className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" /> Adicionar Item
              </button>
            </div>

            <div className="space-y-2">
              {items.map((item, idx) => (
                <div
                  key={idx}
                  className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-600">Item #{idx + 1}</span>
                    {items.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(idx)}
                        className="text-slate-400 hover:text-red-600 p-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
                    <div className="sm:col-span-6">
                      <input
                        type="text"
                        required
                        placeholder="Descrição do material ou serviço"
                        value={item.description}
                        onChange={(e) => handleItemChange(idx, 'description', e.target.value)}
                        className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <input
                        type="number"
                        min="1"
                        inputMode="numeric"
                        required
                        placeholder="Qtd"
                        value={item.quantity || ''}
                        onChange={(e) => handleItemChange(idx, 'quantity', Number(e.target.value))}
                        className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <select
                        value={item.unit}
                        onChange={(e) => handleItemChange(idx, 'unit', e.target.value)}
                        className="w-full px-2 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                      >
                        <option value="UN">UN</option>
                        <option value="CX">CX</option>
                        <option value="PCT">PCT</option>
                        <option value="KG">KG</option>
                        <option value="LT">LT</option>
                        <option value="KIT">KIT</option>
                        <option value="M">M</option>
                        <option value="HORAS">HORAS</option>
                      </select>
                    </div>
                    <div className="sm:col-span-2">
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        inputMode="decimal"
                        placeholder="Est. R$"
                        value={item.estimatedUnitPrice || ''}
                        onChange={(e) => handleItemChange(idx, 'estimatedUnitPrice', Number(e.target.value))}
                        className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Summary / Total */}
          <div className="p-3 bg-indigo-50 rounded-xl flex items-center justify-between">
            <span className="text-xs font-bold text-indigo-900">Total Estimado Inicial:</span>
            <span className="text-base font-black text-indigo-700">
              R$ {calculatedTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </span>
          </div>

          {/* Form Actions */}
          <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-xl transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs transition active:scale-95"
            >
              Emitir Solicitação
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
