import React, { useState } from 'react';
import { dbService } from '../../services/dataService';
import { StockItem, User } from '../../types';
import {
  X,
  PackagePlus,
  Edit3,
  MapPin,
  Tag,
  DollarSign,
  Layers,
  AlertCircle,
  Save,
  CheckCircle,
  Plus,
} from 'lucide-react';

interface StockItemFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  itemToEdit?: StockItem | null;
  currentUser: User;
}

export const StockItemFormModal: React.FC<StockItemFormModalProps> = (props) => {
  if (!props.isOpen) return null;
  return <StockItemFormModalContent {...props} />;
};

const COMMON_UNITS = ['UN', 'CX', 'KG', 'MT', 'LT', 'PAR', 'RL', 'PCT', 'FD', 'CJ', 'GL', 'M2'];

const StockItemFormModalContent: React.FC<StockItemFormModalProps> = ({
  onClose,
  onSuccess,
  itemToEdit,
}) => {
  const isEditing = !!itemToEdit;

  // Dynamic categories from database
  const [categoriesList, setCategoriesList] = useState<string[]>(() => {
    const list = dbService.getCategories();
    if (itemToEdit?.category && !list.includes(itemToEdit.category)) {
      return [...list, itemToEdit.category].sort((a, b) => a.localeCompare(b, 'pt-BR'));
    }
    return list;
  });

  const [isAddingNewCat, setIsAddingNewCat] = useState(false);
  const [newCatInput, setNewCatInput] = useState('');

  // Initialize form state
  const [code, setCode] = useState(itemToEdit?.code || itemToEdit?.sku || '');
  const [description, setDescription] = useState(itemToEdit?.description || itemToEdit?.name || '');
  const [category, setCategory] = useState(itemToEdit?.category || (categoriesList[0] || 'Geral'));
  const [customCategory, setCustomCategory] = useState('');
  const [unit, setUnit] = useState(itemToEdit?.unit || 'UN');
  const [location, setLocation] = useState(itemToEdit?.location || '');
  const [currentStock, setCurrentStock] = useState<number | string>(itemToEdit?.currentStock ?? 0);
  const [minStock, setMinStock] = useState<number | string>(itemToEdit?.minStock ?? 5);
  const [maxStock, setMaxStock] = useState<number | string>(itemToEdit?.maxStock ?? 20);
  const [averageCost, setAverageCost] = useState<number | string>(
    itemToEdit?.averageCost ?? itemToEdit?.avgCost ?? 0
  );

  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Quick category creation directly in modal
  const handleSaveNewCategory = () => {
    const trimmed = newCatInput.trim();
    if (!trimmed) return;
    try {
      dbService.addCategory(trimmed);
      const updated = dbService.getCategories();
      setCategoriesList(updated);
      setCategory(trimmed);
      setIsAddingNewCat(false);
      setNewCatInput('');
    } catch (err: any) {
      setError(err.message || 'Erro ao criar categoria.');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validations
    if (!description.trim()) {
      setError('Informe a descrição / nome do material.');
      return;
    }

    const finalCategory = category === 'Outra' ? customCategory.trim() : category.trim();
    if (!finalCategory) {
      setError('Selecione ou digite uma categoria válida.');
      return;
    }

    if (!unit.trim()) {
      setError('Informe a unidade de medida (ex: UN, CX, KG).');
      return;
    }

    if (!location.trim()) {
      setError('Informe a localização física no almoxarifado (ex: Corredor A - Prateleira 2).');
      return;
    }

    const numCurrentStock = Number(currentStock);
    const numMinStock = Number(minStock);
    const numMaxStock = Number(maxStock);
    const numAverageCost = Number(averageCost);

    if (isNaN(numCurrentStock) || numCurrentStock < 0) {
      setError('O saldo de estoque deve ser um número maior ou igual a zero.');
      return;
    }

    if (isNaN(numMinStock) || numMinStock < 0) {
      setError('O estoque mínimo deve ser um número maior ou igual a zero.');
      return;
    }

    if (isNaN(numMaxStock) || numMaxStock < numMinStock) {
      setError('O estoque máximo deve ser maior ou igual ao estoque mínimo.');
      return;
    }

    if (isNaN(numAverageCost) || numAverageCost < 0) {
      setError('O custo médio unitário deve ser um valor positivo ou zero.');
      return;
    }

    setIsSubmitting(true);
    try {
      if (isEditing && itemToEdit) {
        dbService.updateStockItem(itemToEdit.id, {
          code: code.trim() || undefined,
          description: description.trim(),
          category: finalCategory,
          unit: unit.trim().toUpperCase(),
          location: location.trim(),
          currentStock: numCurrentStock,
          minStock: numMinStock,
          maxStock: numMaxStock,
          averageCost: numAverageCost,
        });
        setSuccessMessage('Item de estoque e categoria atualizados com sucesso!');
      } else {
        dbService.addStockItem({
          code: code.trim() || undefined,
          description: description.trim(),
          category: finalCategory,
          unit: unit.trim().toUpperCase(),
          location: location.trim(),
          currentStock: numCurrentStock,
          minStock: numMinStock,
          maxStock: numMaxStock,
          averageCost: numAverageCost,
        });
        setSuccessMessage('Novo material cadastrado com sucesso no almoxarifado!');
      }

      setTimeout(() => {
        onSuccess();
        onClose();
      }, 700);
    } catch (err: any) {
      setError(err.message || 'Erro ao processar item de estoque.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150 overflow-y-auto">
      <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-6">
        {/* Header */}
        <div className="px-5 py-4 bg-gradient-to-r from-slate-900 to-slate-800 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-500/20 border border-indigo-400/30 rounded-xl text-indigo-400">
              {isEditing ? <Edit3 className="w-5 h-5" /> : <PackagePlus className="w-5 h-5" />}
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold">
                {isEditing ? 'Editar Material do Almoxarifado' : 'Cadastrar Novo Material'}
              </h2>
              <p className="text-xs text-slate-300">
                {isEditing
                  ? `Atualização cadastral do SKU: ${itemToEdit?.code || itemToEdit?.sku}`
                  : 'Adicione um novo produto ou material para controle de saldo e reposição'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg transition hover:bg-white/10"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Feedback Alerts */}
        {error && (
          <div className="mx-5 mt-4 p-3.5 bg-red-50 border border-red-200 text-red-800 rounded-xl text-xs font-semibold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
            <span>{error}</span>
          </div>
        )}

        {successMessage && (
          <div className="mx-5 mt-4 p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-bold flex items-center gap-2">
            <CheckCircle className="w-4 h-4 shrink-0 text-emerald-600" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Row 1: Code & Unit */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Código / SKU <span className="text-slate-400 font-normal">(Opcional)</span>
              </label>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="Ex: MAT-010"
                className="w-full px-3 py-2 text-xs font-mono bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Unidade de Medida <span className="text-red-500">*</span>
              </label>
              <div className="flex gap-2">
                <select
                  value={COMMON_UNITS.includes(unit) ? unit : 'OTHER'}
                  onChange={(e) => {
                    if (e.target.value !== 'OTHER') {
                      setUnit(e.target.value);
                    }
                  }}
                  className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                >
                  {COMMON_UNITS.map((u) => (
                    <option key={u} value={u}>
                      {u}
                    </option>
                  ))}
                  <option value="OTHER">Outra...</option>
                </select>

                <input
                  type="text"
                  value={unit}
                  onChange={(e) => setUnit(e.target.value.toUpperCase())}
                  placeholder="Sigla (ex: PCT, UN)"
                  maxLength={6}
                  className="flex-1 px-3 py-2 text-xs font-mono uppercase bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                  required
                />
              </div>
            </div>
          </div>

          {/* Row 2: Description */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Descrição Completa do Material / Produto <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Ex: Luva de Vaqueta Mista Tamanho G com Punho Reforçado"
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
              required
            />
          </div>

          {/* Row 3: Category & Location */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                  <Tag className="w-3.5 h-3.5 text-slate-400" />
                  <span>Categoria do Material</span> <span className="text-red-500">*</span>
                </label>
                {!isAddingNewCat && (
                  <button
                    type="button"
                    onClick={() => setIsAddingNewCat(true)}
                    className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-0.5 cursor-pointer"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Nova Categoria</span>
                  </button>
                )}
              </div>

              {isAddingNewCat ? (
                <div className="space-y-1.5">
                  <div className="flex gap-1.5">
                    <input
                      type="text"
                      value={newCatInput}
                      onChange={(e) => setNewCatInput(e.target.value)}
                      placeholder="Ex: Uniformes, Peças Hidráulicas..."
                      className="flex-1 px-3 py-2 text-xs bg-white border border-indigo-400 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleSaveNewCategory();
                        }
                      }}
                    />
                    <button
                      type="button"
                      onClick={handleSaveNewCategory}
                      className="px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl transition cursor-pointer"
                    >
                      Adicionar
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setIsAddingNewCat(false);
                        setNewCatInput('');
                      }}
                      className="px-2.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-semibold rounded-xl transition cursor-pointer"
                    >
                      ✕
                    </button>
                  </div>
                  <span className="text-[10px] text-slate-400 block">
                    Pressione Enter para salvar e vincular a este item
                  </span>
                </div>
              ) : (
                <>
                  <select
                    value={category}
                    onChange={(e) => {
                      if (e.target.value === 'OUTRA_NOVA') {
                        setIsAddingNewCat(true);
                      } else {
                        setCategory(e.target.value);
                      }
                    }}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-hidden font-medium text-slate-800"
                  >
                    {categoriesList.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                    <option value="OUTRA_NOVA">+ Digitar nova categoria...</option>
                  </select>
                  <span className="text-[10px] text-slate-400 block mt-1">
                    Selecione ou clique em "+ Nova Categoria" para cadastrar outra
                  </span>
                </>
              )}
            </div>

            <div>
              <div className="h-5 flex items-center mb-1">
                <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" />
                  <span>Localização Física / Endereçamento</span> <span className="text-red-500">*</span>
                </label>
              </div>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Ex: Corredor B - Prateleira 4 - Box 02"
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                required
              />
              <span className="text-[10px] text-slate-400 block mt-1">
                Prateleira, corredor, gaveta ou armário do estoque
              </span>
            </div>
          </div>

          {/* Row 4: Stocks & Average Cost */}
          <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-3">
            <div className="flex items-center gap-1.5 text-xs font-black text-slate-800 uppercase tracking-wider text-[11px]">
              <Layers className="w-3.5 h-3.5 text-indigo-600" />
              <span>Controle de Níveis e Custo</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 items-end">
              {/* Col 1: Saldo Atual / Inicial */}
              <div>
                <div className="min-h-[34px] flex flex-col justify-end mb-1">
                  <label className="text-[11px] font-bold text-slate-700 leading-tight">
                    {isEditing ? 'Saldo Atual' : 'Saldo Inicial'}
                  </label>
                  <span className="text-[10px] text-slate-400 font-medium leading-none mt-0.5">
                    {isEditing ? 'Em almoxarifado' : 'Contagem inicial'}
                  </span>
                </div>
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={currentStock}
                  onChange={(e) => setCurrentStock(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-bold bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                  required
                />
              </div>

              {/* Col 2: Estoque Mínimo / Ponto de Reposição */}
              <div>
                <div className="min-h-[34px] flex flex-col justify-end mb-1">
                  <label className="text-[11px] font-bold text-slate-700 leading-tight">
                    Estoque Mínimo
                  </label>
                  <span className="text-[10px] text-amber-700 font-bold leading-none mt-0.5">
                    Ponto de Reposição
                  </span>
                </div>
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={minStock}
                  onChange={(e) => setMinStock(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-bold bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                  required
                />
              </div>

              {/* Col 3: Estoque Máximo */}
              <div>
                <div className="min-h-[34px] flex flex-col justify-end mb-1">
                  <label className="text-[11px] font-bold text-slate-700 leading-tight">
                    Estoque Máximo
                  </label>
                  <span className="text-[10px] text-slate-400 font-medium leading-none mt-0.5">
                    Capacidade teto
                  </span>
                </div>
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={maxStock}
                  onChange={(e) => setMaxStock(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-bold bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                  required
                />
              </div>

              {/* Col 4: Custo Médio */}
              <div>
                <div className="min-h-[34px] flex flex-col justify-end mb-1">
                  <label className="text-[11px] font-bold text-slate-700 flex items-center gap-1 leading-tight">
                    <DollarSign className="w-3 h-3 text-emerald-600 shrink-0" />
                    <span>Custo Médio</span>
                  </label>
                  <span className="text-[10px] text-slate-400 font-medium leading-none mt-0.5">
                    Unitário (R$)
                  </span>
                </div>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={averageCost}
                  onChange={(e) => setAverageCost(e.target.value)}
                  placeholder="0,00"
                  className="w-full px-3 py-2 text-xs font-bold text-emerald-800 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                />
              </div>
            </div>

            {isEditing && (
              <div className="mt-2 text-[10px] text-slate-500 flex items-center gap-1.5 pt-1.5 border-t border-slate-200/60">
                <AlertCircle className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                <span>
                  Alterar o saldo atual registrará automaticamente um lançamento de <strong>Ajuste de Inventário</strong> com rastreabilidade.
                </span>
              </div>
            )}
          </div>

          {/* Modal Actions */}
          <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition"
            >
              Cancelar
            </button>

            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white text-xs font-bold rounded-xl shadow-xs transition disabled:opacity-50"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{isSubmitting ? 'Salvando...' : isEditing ? 'Salvar Alterações' : 'Cadastrar Material'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
