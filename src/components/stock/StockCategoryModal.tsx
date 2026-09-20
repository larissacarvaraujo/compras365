import React, { useState, useEffect } from 'react';
import { dbService } from '../../services/dataService';
import { StockItem, User } from '../../types';
import {
  X,
  Tag,
  Plus,
  Edit2,
  Trash2,
  Check,
  FolderTree,
  AlertCircle,
  CheckCircle,
  Package,
} from 'lucide-react';

interface StockCategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  currentUser: User;
  itemToChangeCategory?: StockItem | null;
}

export const StockCategoryModal: React.FC<StockCategoryModalProps> = (props) => {
  if (!props.isOpen) return null;
  return <StockCategoryModalContent {...props} />;
};

const StockCategoryModalContent: React.FC<StockCategoryModalProps> = ({
  onClose,
  onSuccess,
  itemToChangeCategory,
}) => {
  const [categories, setCategories] = useState<string[]>(() => dbService.getCategories());
  const [stockItems, setStockItems] = useState<StockItem[]>(() => dbService.getStock());

  // Adding new category
  const [newCategoryName, setNewCategoryName] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  // Renaming state
  const [editingCategory, setEditingCategory] = useState<string | null>(null);
  const [editCategoryName, setEditCategoryName] = useState('');

  // Selected category for item assignment (when itemToChangeCategory is provided)
  const [selectedCategory, setSelectedCategory] = useState<string>(
    itemToChangeCategory?.category || categories[0] || 'Geral'
  );

  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(
    null
  );

  const refreshData = () => {
    setCategories(dbService.getCategories());
    setStockItems(dbService.getStock());
  };

  // Count items per category
  const getItemCount = (cat: string) => {
    return stockItems.filter(
      (item) => item.category?.toLowerCase() === cat.toLowerCase()
    ).length;
  };

  const handleCreateCategory = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newCategoryName.trim();
    if (!trimmed) return;

    try {
      dbService.addCategory(trimmed);
      refreshData();
      setNewCategoryName('');
      setIsAdding(false);
      setSelectedCategory(trimmed);
      setFeedback({ type: 'success', text: `Categoria "${trimmed}" criada com sucesso!` });
      setTimeout(() => setFeedback(null), 3000);
    } catch (err: any) {
      setFeedback({ type: 'error', text: err.message || 'Erro ao criar categoria.' });
    }
  };

  const handleStartRename = (cat: string) => {
    setEditingCategory(cat);
    setEditCategoryName(cat);
  };

  const handleSaveRename = (oldName: string) => {
    const trimmed = editCategoryName.trim();
    if (!trimmed) return;
    try {
      dbService.renameCategory(oldName, trimmed);
      refreshData();
      setEditingCategory(null);
      if (selectedCategory === oldName) setSelectedCategory(trimmed);
      setFeedback({
        type: 'success',
        text: `Categoria renomeada para "${trimmed}" e atualizada em todos os materiais!`,
      });
      setTimeout(() => setFeedback(null), 3000);
    } catch (err: any) {
      setFeedback({ type: 'error', text: err.message || 'Erro ao renomear categoria.' });
    }
  };

  const handleDeleteCategory = (cat: string) => {
    const count = getItemCount(cat);
    const msg =
      count > 0
        ? `Excluir "${cat}"? ${count} materiais serão reclassificados como "Geral".`
        : `Deseja realmente remover a categoria "${cat}"?`;

    if (!window.confirm(msg)) return;

    try {
      dbService.deleteCategory(cat);
      refreshData();
      setFeedback({
        type: 'success',
        text: `Categoria "${cat}" removida.`,
      });
      setTimeout(() => setFeedback(null), 3000);
    } catch (err: any) {
      setFeedback({ type: 'error', text: err.message || 'Erro ao excluir categoria.' });
    }
  };

  const handleApplyItemCategory = () => {
    if (!itemToChangeCategory) return;
    try {
      dbService.updateStockItemCategory(itemToChangeCategory.id, selectedCategory);
      setFeedback({
        type: 'success',
        text: `Categoria de "${itemToChangeCategory.description || itemToChangeCategory.name}" alterada para "${selectedCategory}"!`,
      });
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 700);
    } catch (err: any) {
      setFeedback({ type: 'error', text: err.message || 'Erro ao atualizar categoria do item.' });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150 overflow-y-auto">
      <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-6">
        {/* Header */}
        <div className="px-5 py-4 bg-gradient-to-r from-slate-900 to-indigo-950 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-500/20 border border-indigo-400/30 rounded-xl text-indigo-400">
              <FolderTree className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold">
                {itemToChangeCategory ? 'Alterar Categoria do Material' : 'Gerenciar Categorias de Materiais'}
              </h2>
              <p className="text-xs text-slate-300">
                {itemToChangeCategory
                  ? `Material: ${itemToChangeCategory.description || itemToChangeCategory.name}`
                  : 'Crie, renomeie e organize as categorias do Almoxarifado'}
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

        {/* Feedback Alert */}
        {feedback && (
          <div
            className={`mx-5 mt-4 p-3 rounded-xl text-xs font-semibold flex items-center gap-2 ${
              feedback.type === 'success'
                ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
                : 'bg-red-50 border border-red-200 text-red-800'
            }`}
          >
            {feedback.type === 'success' ? (
              <CheckCircle className="w-4 h-4 shrink-0 text-emerald-600" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
            )}
            <span>{feedback.text}</span>
          </div>
        )}

        <div className="p-5 space-y-4">
          {/* If changing specific item category */}
          {itemToChangeCategory && (
            <div className="p-3.5 bg-indigo-50/70 border border-indigo-200/80 rounded-xl">
              <span className="text-[11px] font-bold text-indigo-950 uppercase tracking-wider block mb-1">
                Material Selecionado:
              </span>
              <p className="text-xs font-black text-slate-900 leading-snug">
                {itemToChangeCategory.code || itemToChangeCategory.sku} -{' '}
                {itemToChangeCategory.description || itemToChangeCategory.name}
              </p>
              <div className="flex items-center gap-2 mt-2">
                <span className="text-xs text-slate-500 font-medium">Categoria atual:</span>
                <span className="px-2 py-0.5 bg-slate-200/80 text-slate-800 text-[11px] font-bold rounded-md">
                  {itemToChangeCategory.category}
                </span>
              </div>
            </div>
          )}

          {/* Quick Add Form */}
          <div className="border-b border-slate-200 pb-3.5">
            {!isAdding ? (
              <button
                type="button"
                onClick={() => setIsAdding(true)}
                className="w-full py-2.5 px-3 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 border border-dashed border-indigo-300"
              >
                <Plus className="w-4 h-4" />
                <span>+ Adicionar Nova Categoria</span>
              </button>
            ) : (
              <form onSubmit={handleCreateCategory} className="space-y-2">
                <label className="block text-xs font-bold text-slate-700">
                  Nome da Nova Categoria:
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    placeholder="Ex: Instrumentação, Peças Pneumáticas..."
                    className="flex-1 px-3 py-2 text-xs bg-slate-50 border border-indigo-400 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                    autoFocus
                  />
                  <button
                    type="submit"
                    className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl transition"
                  >
                    Salvar
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsAdding(false);
                      setNewCategoryName('');
                    }}
                    className="px-2.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 font-semibold text-xs rounded-xl"
                  >
                    Cancelar
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* Categories List */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider text-[11px]">
                Categorias Cadastradas ({categories.length})
              </span>
              {itemToChangeCategory && (
                <span className="text-[11px] text-indigo-600 font-semibold">
                  Clique na categoria desejada para selecionar
                </span>
              )}
            </div>

            <div className="max-h-64 overflow-y-auto divide-y divide-slate-100 border border-slate-200 rounded-xl">
              {categories.map((cat) => {
                const count = getItemCount(cat);
                const isSelected = itemToChangeCategory && selectedCategory === cat;
                const isRenaming = editingCategory === cat;

                return (
                  <div
                    key={cat}
                    className={`p-2.5 flex items-center justify-between transition ${
                      isSelected
                        ? 'bg-indigo-50 border-l-4 border-indigo-600'
                        : 'hover:bg-slate-50'
                    }`}
                  >
                    {isRenaming ? (
                      <div className="flex items-center gap-1.5 flex-1 pr-2">
                        <input
                          type="text"
                          value={editCategoryName}
                          onChange={(e) => setEditCategoryName(e.target.value)}
                          className="flex-1 px-2.5 py-1 text-xs bg-white border border-indigo-400 rounded-lg focus:outline-hidden"
                          autoFocus
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handleSaveRename(cat);
                            }
                          }}
                        />
                        <button
                          type="button"
                          onClick={() => handleSaveRename(cat)}
                          className="p-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md"
                          title="Salvar alteração"
                        >
                          <Check className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingCategory(null)}
                          className="p-1 bg-slate-200 hover:bg-slate-300 text-slate-600 rounded-md"
                          title="Cancelar"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <div
                        onClick={() => {
                          if (itemToChangeCategory) setSelectedCategory(cat);
                        }}
                        className={`flex items-center gap-2 flex-1 cursor-pointer ${
                          itemToChangeCategory ? 'select-none' : ''
                        }`}
                      >
                        <Tag
                          className={`w-3.5 h-3.5 ${
                            isSelected ? 'text-indigo-600' : 'text-slate-400'
                          }`}
                        />
                        <span
                          className={`text-xs font-semibold ${
                            isSelected ? 'text-indigo-900 font-bold' : 'text-slate-800'
                          }`}
                        >
                          {cat}
                        </span>
                        <span className="text-[10px] text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded-full font-mono">
                          {count} {count === 1 ? 'item' : 'itens'}
                        </span>
                      </div>
                    )}

                    {/* Actions (Rename / Delete) */}
                    {!isRenaming && (
                      <div className="flex items-center gap-1 shrink-0">
                        {itemToChangeCategory && (
                          <button
                            type="button"
                            onClick={() => setSelectedCategory(cat)}
                            className={`px-2 py-1 text-[10px] font-bold rounded-lg transition ${
                              isSelected
                                ? 'bg-indigo-600 text-white'
                                : 'bg-slate-100 hover:bg-indigo-50 text-slate-600 hover:text-indigo-600'
                            }`}
                          >
                            {isSelected ? 'Selecionada' : 'Escolher'}
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => handleStartRename(cat)}
                          className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition"
                          title="Renomear categoria"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteCategory(cat)}
                          className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                          title="Remover categoria"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-900 rounded-xl hover:bg-slate-200 transition"
          >
            Fechar
          </button>

          {itemToChangeCategory && (
            <button
              type="button"
              onClick={handleApplyItemCategory}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs transition flex items-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              <span>Salvar Categoria no Material</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
