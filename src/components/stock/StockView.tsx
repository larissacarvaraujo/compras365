import React, { useState, useEffect, useMemo } from 'react';
import { dbService } from '../../services/dataService';
import { StockItem, StockMovement, User } from '../../types';
import { exportToExcel } from '../../utils/exportExcel';
import { StockMovementModal } from './StockMovementModal';
import { StockItemFormModal } from './StockItemFormModal';
import { StockItemDeleteModal } from './StockItemDeleteModal';
import { StockCategoryModal } from './StockCategoryModal';
import {
  Boxes,
  Search,
  Download,
  AlertTriangle,
  Zap,
  History,
  PackagePlus,
  Edit3,
  Trash2,
  ShoppingCart,
  MapPin,
  DollarSign,
  Layers,
  ArrowUpDown,
  Filter,
  PackageCheck,
  AlertCircle,
  TrendingDown,
  Tag,
  FolderTree,
} from 'lucide-react';

interface StockViewProps {
  currentUser: User;
  onNavigateToRequests: () => void;
}

export const StockView: React.FC<StockViewProps> = ({
  currentUser,
  onNavigateToRequests,
}) => {
  const [stock, setStock] = useState<StockItem[]>([]);
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [activeTab, setActiveTab] = useState<'inventory' | 'movements'>('inventory');
  
  // Filters
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [stockStatusFilter, setStockStatusFilter] = useState<'ALL' | 'CRITICAL' | 'EMPTY' | 'NORMAL'>('ALL');
  
  // Modals state
  const [selectedItemForMovement, setSelectedItemForMovement] = useState<StockItem | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [itemToEdit, setItemToEdit] = useState<StockItem | null>(null);
  const [itemToDelete, setItemToDelete] = useState<StockItem | null>(null);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [itemForCategoryChange, setItemForCategoryChange] = useState<StockItem | null>(null);

  const [bannerMessage, setBannerMessage] = useState<string | null>(null);

  const loadData = () => {
    setStock(dbService.getStock());
    setMovements(dbService.getStockMovements());
  };

  useEffect(() => {
    loadData();
    return dbService.subscribe(loadData);
  }, []);

  // Metrics
  const totalItemsCount = stock.length;
  const criticalItems = stock.filter((s) => s.currentStock <= s.minStock && s.currentStock > 0);
  const emptyItems = stock.filter((s) => s.currentStock === 0);
  const totalStockValue = stock.reduce(
    (acc, item) => acc + item.currentStock * (item.averageCost ?? item.avgCost ?? 0),
    0
  );

  // Distinct categories for filter (persisted in DB)
  const categories = useMemo(() => {
    return dbService.getCategories();
  }, [stock]);

  // Filtered Stock list
  const filteredStock = useMemo(() => {
    return stock.filter((item) => {
      const code = (item.code || item.sku || '').toLowerCase();
      const desc = (item.description || item.name || '').toLowerCase();
      const loc = (item.location || '').toLowerCase();
      const cat = (item.category || '').toLowerCase();
      const q = search.toLowerCase();

      const matchesSearch =
        !q || code.includes(q) || desc.includes(q) || loc.includes(q) || cat.includes(q);

      const matchesCategory = selectedCategory === 'ALL' || item.category === selectedCategory;

      let matchesStatus = true;
      if (stockStatusFilter === 'CRITICAL') {
        matchesStatus = item.currentStock <= item.minStock;
      } else if (stockStatusFilter === 'EMPTY') {
        matchesStatus = item.currentStock === 0;
      } else if (stockStatusFilter === 'NORMAL') {
        matchesStatus = item.currentStock > item.minStock;
      }

      return matchesSearch && matchesCategory && matchesStatus;
    });
  }, [stock, search, selectedCategory, stockStatusFilter]);

  const handleExportExcel = () => {
    if (activeTab === 'inventory') {
      const headers = [
        'Código/SKU',
        'Descrição do Material',
        'Categoria',
        'Localização no Almoxarifado',
        'Saldo Atual',
        'Unidade',
        'Estoque Mínimo',
        'Estoque Máximo',
        'Custo Médio Unitário (R$)',
        'Valor Total em Estoque (R$)',
        'Status do Saldo',
      ];
      const rows = filteredStock.map((s) => {
        const cost = s.averageCost ?? s.avgCost ?? 0;
        const total = s.currentStock * cost;
        const status =
          s.currentStock === 0
            ? 'RUPTURA / ZERADO'
            : s.currentStock <= s.minStock
            ? 'CRÍTICO'
            : 'NORMAL';

        return [
          s.code || s.sku || '',
          s.description || s.name || '',
          s.category,
          s.location,
          s.currentStock,
          s.unit,
          s.minStock,
          s.maxStock,
          cost.toFixed(2),
          total.toFixed(2),
          status,
        ];
      });
      exportToExcel('Almoxarifado_Estoque_Compras365', headers, rows);
    } else {
      const headers = ['Data/Hora', 'Código', 'Material', 'Tipo Operação', 'Quantidade', 'Operador', 'Departamento', 'Motivo/Observações'];
      const rows = movements.map((m) => [
        new Date(m.createdAt).toLocaleString('pt-BR'),
        m.itemCode || m.stockItemId || '',
        m.description || m.itemName || '',
        m.type === 'entry' ? 'Entrada' : m.type === 'exit' ? 'Saída' : 'Ajuste',
        m.quantity,
        m.userName || m.performedByName || '',
        m.department || 'Almoxarifado Central',
        m.reason || m.notes || '',
      ]);
      exportToExcel('Historico_Movimentacoes_Almoxarifado', headers, rows);
    }
  };

  const handleAutoReorder = () => {
    try {
      const newReq = dbService.autoReorderLowStock();
      if (newReq) {
        setBannerMessage(
          `⚡ Solicitação automática ${newReq.code} gerada com sucesso para ${newReq.items.length} itens no ponto de reposição!`
        );
      } else {
        setBannerMessage('Não há nenhum item abaixo do estoque mínimo precisando de reposição.');
      }
    } catch (err: any) {
      setBannerMessage('Erro ao gerar reposição automática: ' + err.message);
    }
  };

  const handleQuickRestockItem = (item: StockItem) => {
    try {
      const req = dbService.createStockRestockRequest(item.id);
      setBannerMessage(
        `🛒 Solicitação de Compra ${req.code} criada com sucesso para reposição de ${item.description || item.name}!`
      );
    } catch (err: any) {
      setBannerMessage('Erro ao solicitar reposição: ' + err.message);
    }
  };

  return (
    <div className="space-y-4 pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">
              Almoxarifado & Gestão de Estoque
            </h1>
            <span className="text-[11px] font-bold px-2 py-0.5 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-full">
              Sistema Completo
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Cadastro de materiais, controle de saldo físico, endereçamento de prateleiras e reposições
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Add Item Button */}
          <button
            id="btn-add-stock-item"
            onClick={() => setIsAddModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white text-xs font-bold rounded-xl shadow-xs transition"
          >
            <PackagePlus className="w-4 h-4" />
            <span>+ Novo Material</span>
          </button>

          {/* Auto Reorder */}
          <button
            id="btn-auto-reorder-stock"
            onClick={handleAutoReorder}
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 bg-amber-500 hover:bg-amber-600 active:scale-95 text-white text-xs font-bold rounded-xl shadow-xs transition"
            title="Gera solicitação de compra automática para itens em nível crítico"
          >
            <Zap className="w-3.5 h-3.5 fill-current" />
            <span>Reposição Automática</span>
          </button>

          {/* Export Excel */}
          <button
            onClick={handleExportExcel}
            className="inline-flex items-center gap-1.5 px-3 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl border border-slate-200 transition"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Excel</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Total Items */}
        <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Materiais Cadastrados</span>
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
              <Boxes className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-xl sm:text-2xl font-black text-slate-900">{totalItemsCount}</span>
            <span className="text-[11px] text-slate-400 font-medium">SKUs ativos</span>
          </div>
        </div>

        {/* Total Stock Value */}
        <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Valor Total Imobilizado</span>
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-xl sm:text-2xl font-black text-emerald-700">
              R$ {totalStockValue.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
        </div>

        {/* Critical Stock */}
        <div
          onClick={() => setStockStatusFilter(stockStatusFilter === 'CRITICAL' ? 'ALL' : 'CRITICAL')}
          className={`p-3.5 sm:p-4 rounded-2xl border shadow-2xs cursor-pointer transition ${
            stockStatusFilter === 'CRITICAL'
              ? 'bg-red-50 border-red-300 ring-2 ring-red-400'
              : 'bg-white border-slate-200 hover:border-red-200'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-red-700">Estoque Crítico / Mínimo</span>
            <div className="p-2 bg-red-100 text-red-600 rounded-xl">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-xl sm:text-2xl font-black text-red-600">{criticalItems.length}</span>
            <span className="text-[11px] text-red-500 font-medium">precisam de compra</span>
          </div>
        </div>

        {/* Empty / Out of Stock */}
        <div
          onClick={() => setStockStatusFilter(stockStatusFilter === 'EMPTY' ? 'ALL' : 'EMPTY')}
          className={`p-3.5 sm:p-4 rounded-2xl border shadow-2xs cursor-pointer transition ${
            stockStatusFilter === 'EMPTY'
              ? 'bg-amber-50 border-amber-300 ring-2 ring-amber-400'
              : 'bg-white border-slate-200 hover:border-amber-200'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Saldo Zerado (Ruptura)</span>
            <div className="p-2 bg-amber-50 text-amber-600 rounded-xl">
              <TrendingDown className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className={`text-xl sm:text-2xl font-black ${emptyItems.length > 0 ? 'text-amber-600' : 'text-slate-900'}`}>
              {emptyItems.length}
            </span>
            <span className="text-[11px] text-slate-400 font-medium">itens zerados</span>
          </div>
        </div>
      </div>

      {/* Banner message if action executed */}
      {bannerMessage && (
        <div className="p-4 bg-indigo-50 border border-indigo-200 text-indigo-900 rounded-2xl text-xs font-semibold flex items-center justify-between animate-in fade-in">
          <span>{bannerMessage}</span>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={onNavigateToRequests}
              className="text-xs font-bold text-indigo-700 underline hover:text-indigo-950"
            >
              Ver Solicitações →
            </button>
            <button
              onClick={() => setBannerMessage(null)}
              className="text-xs text-indigo-500 hover:text-indigo-900 ml-2"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Navigation tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab('inventory')}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition flex items-center gap-1.5 ${
            activeTab === 'inventory'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Boxes className="w-4 h-4" />
          <span>Inventário Ativo ({stock.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('movements')}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition flex items-center gap-1.5 ${
            activeTab === 'movements'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <History className="w-4 h-4" />
          <span>Movimentações & Auditoria ({movements.length})</span>
        </button>
      </div>

      {activeTab === 'inventory' ? (
        <>
          {/* Search & Advanced Filters */}
          <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-center gap-3">
            {/* Search Input */}
            <div className="relative flex-1 w-full">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar por código, descrição, categoria ou endereço físico (prateleira)..."
                className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
              />
            </div>

            {/* Category Dropdown & Manager */}
            <div className="w-full md:w-auto flex items-center gap-1.5">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full md:w-48 px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-hidden font-medium text-slate-700"
              >
                <option value="ALL">Todas Categorias ({categories.length})</option>
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>

              <button
                type="button"
                onClick={() => {
                  setItemForCategoryChange(null);
                  setIsCategoryModalOpen(true);
                }}
                className="px-2.5 py-2 bg-slate-100 hover:bg-indigo-50 text-slate-700 hover:text-indigo-700 border border-slate-200 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shrink-0 cursor-pointer"
                title="Cadastrar, editar ou renomear categorias"
              >
                <FolderTree className="w-3.5 h-3.5 text-indigo-600" />
                <span className="hidden sm:inline">Categorias</span>
              </button>
            </div>

            {/* Status Filter */}
            <div className="w-full md:w-44">
              <select
                value={stockStatusFilter}
                onChange={(e) => setStockStatusFilter(e.target.value as any)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-hidden font-bold text-slate-700"
              >
                <option value="ALL">Todos os Níveis</option>
                <option value="CRITICAL">Apenas Críticos</option>
                <option value="EMPTY">Apenas Zerados</option>
                <option value="NORMAL">Estoque Normal</option>
              </select>
            </div>

            {/* Clear Filters */}
            {(search || selectedCategory !== 'ALL' || stockStatusFilter !== 'ALL') && (
              <button
                onClick={() => {
                  setSearch('');
                  setSelectedCategory('ALL');
                  setStockStatusFilter('ALL');
                }}
                className="text-xs font-semibold text-slate-500 hover:text-slate-800 px-2 py-1"
              >
                Limpar
              </button>
            )}
          </div>

          {/* Desktop Inventory Table */}
          <div className="hidden lg:block bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 border-b border-slate-200 font-bold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="p-3.5">Código / Localização</th>
                  <th className="p-3.5">Descrição do Material</th>
                  <th className="p-3.5">Categoria</th>
                  <th className="p-3.5 text-center">Ponto de Reposição (Mín / Máx)</th>
                  <th className="p-3.5 text-right">Saldo Atual</th>
                  <th className="p-3.5 text-right">Custo / Valor Total</th>
                  <th className="p-3.5 text-center">Ações no Estoque</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredStock.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-slate-400">
                      Nenhum item encontrado com os filtros aplicados.
                    </td>
                  </tr>
                ) : (
                  filteredStock.map((item) => {
                    const isZero = item.currentStock === 0;
                    const isLow = item.currentStock <= item.minStock;
                    const cost = item.averageCost ?? item.avgCost ?? 0;
                    const totalVal = item.currentStock * cost;

                    // Progress bar calculation
                    const max = Math.max(item.maxStock, item.minStock * 2, 1);
                    const percent = Math.min(100, Math.round((item.currentStock / max) * 100));

                    return (
                      <tr key={item.id} className="hover:bg-slate-50/70 transition">
                        {/* Code & Location */}
                        <td className="p-3.5">
                          <span className="font-mono font-bold text-slate-900 block text-xs">
                            {item.code || item.sku}
                          </span>
                          <span className="inline-flex items-center gap-1 text-[11px] text-slate-500 font-medium mt-0.5">
                            <MapPin className="w-3 h-3 text-slate-400" />
                            {item.location}
                          </span>
                        </td>

                        {/* Description */}
                        <td className="p-3.5 max-w-xs">
                          <span className="font-bold text-slate-900 block leading-snug">
                            {item.description || item.name}
                          </span>
                          {isZero ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full mt-1">
                              <AlertCircle className="w-3 h-3" /> Saldo Zerado / Ruptura
                            </span>
                          ) : isLow ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-red-800 bg-red-100 px-2 py-0.5 rounded-full mt-1">
                              <AlertTriangle className="w-3 h-3" /> Estoque Crítico
                            </span>
                          ) : null}
                        </td>

                        {/* Category */}
                        <td className="p-3.5">
                          <button
                            type="button"
                            onClick={() => {
                              setItemForCategoryChange(item);
                              setIsCategoryModalOpen(true);
                            }}
                            className="group inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-100 hover:bg-indigo-50 text-slate-700 hover:text-indigo-700 text-[11px] font-semibold rounded-lg transition cursor-pointer text-left border border-slate-200/60 hover:border-indigo-200"
                            title="Clique para editar a categoria deste material"
                          >
                            <Tag className="w-3 h-3 text-slate-400 group-hover:text-indigo-600 shrink-0" />
                            <span>{item.category}</span>
                            <Edit3 className="w-2.5 h-2.5 opacity-0 group-hover:opacity-100 text-indigo-500 transition-opacity" />
                          </button>
                        </td>

                        {/* Min / Max & Progress (Ponto de Reposição) */}
                        <td className="p-3.5 text-center">
                          <div className="text-xs font-bold text-slate-700">
                            <span>Mín: {item.minStock}</span>
                            <span className="text-slate-400 mx-1">|</span>
                            <span>Máx: {item.maxStock}</span>
                            <span className="text-slate-500 font-normal ml-1">{item.unit}</span>
                          </div>
                          <div className="w-28 mx-auto bg-slate-200 h-1.5 rounded-full overflow-hidden mt-1.5">
                            <div
                              className={`h-full rounded-full transition-all ${
                                isZero ? 'bg-amber-500' : isLow ? 'bg-red-500' : 'bg-emerald-500'
                              }`}
                              style={{ width: `${percent}%` }}
                            />
                          </div>
                          <div className="text-[10px] text-slate-400 mt-0.5 font-medium">
                            Ponto de Reposição
                          </div>
                        </td>

                        {/* Current Stock */}
                        <td className="p-3.5 text-right">
                          <span
                            className={`text-base font-black ${
                              isZero ? 'text-amber-600' : isLow ? 'text-red-600' : 'text-slate-900'
                            }`}
                          >
                            {item.currentStock} {item.unit}
                          </span>
                        </td>

                        {/* Unit Cost & Total Value */}
                        <td className="p-3.5 text-right">
                          <div className="font-bold text-slate-900">
                            R$ {totalVal.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </div>
                          <div className="text-[10px] text-slate-400">
                            Unit: R$ {cost.toFixed(2)}
                          </div>
                        </td>

                        {/* Actions (Movimentar, Editar, Excluir, Pedir) */}
                        <td className="p-3.5">
                          <div className="flex items-center justify-center gap-1.5">
                            {/* Movement */}
                            <button
                              onClick={() => setSelectedItemForMovement(item)}
                              className="px-2.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold rounded-lg transition"
                              title="Registrar entrada, saída ou ajuste"
                            >
                              Movimentar
                            </button>

                            {/* Edit */}
                            <button
                              onClick={() => setItemToEdit(item)}
                              className="p-1.5 text-slate-600 hover:text-indigo-600 hover:bg-slate-100 rounded-lg transition"
                              title="Editar dados cadastrais deste material"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>

                            {/* Edit Category */}
                            <button
                              onClick={() => {
                                setItemForCategoryChange(item);
                                setIsCategoryModalOpen(true);
                              }}
                              className="p-1.5 text-slate-600 hover:text-indigo-600 hover:bg-slate-100 rounded-lg transition"
                              title="Alterar categoria deste item"
                            >
                              <Tag className="w-4 h-4" />
                            </button>

                            {/* Quick Restock */}
                            <button
                              onClick={() => handleQuickRestockItem(item)}
                              className="p-1.5 text-slate-600 hover:text-amber-600 hover:bg-slate-100 rounded-lg transition"
                              title="Criar solicitação de compra para este material"
                            >
                              <ShoppingCart className="w-4 h-4" />
                            </button>

                            {/* Delete */}
                            <button
                              onClick={() => setItemToDelete(item)}
                              className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                              title="Excluir este material do almoxarifado"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile & Tablet Inventory Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:hidden gap-3">
            {filteredStock.map((item) => {
              const isZero = item.currentStock === 0;
              const isLow = item.currentStock <= item.minStock;
              const cost = item.averageCost ?? item.avgCost ?? 0;
              const totalVal = item.currentStock * cost;

              return (
                <div
                  key={item.id}
                  className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                      {item.code || item.sku}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setItemForCategoryChange(item);
                        setIsCategoryModalOpen(true);
                      }}
                      className="inline-flex items-center gap-1 text-xs text-indigo-600 bg-indigo-50 hover:bg-indigo-100 px-2 py-0.5 rounded-lg font-bold transition cursor-pointer"
                      title="Alterar categoria deste item"
                    >
                      <Tag className="w-3 h-3" />
                      <span>{item.category}</span>
                    </button>
                  </div>

                  <div>
                    <h3 className="text-sm font-bold text-slate-900 leading-snug">
                      {item.description || item.name}
                    </h3>
                    <div className="flex items-center gap-1 text-xs text-slate-400 mt-1">
                      <MapPin className="w-3.5 h-3.5" />
                      <span>{item.location}</span>
                    </div>
                  </div>

                  <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100 grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-[10px] text-slate-400 block font-semibold">SALDO ATUAL:</span>
                      <span
                        className={`text-base font-black ${
                          isZero ? 'text-amber-600' : isLow ? 'text-red-600' : 'text-slate-900'
                        }`}
                      >
                        {item.currentStock} {item.unit}
                      </span>
                    </div>

                    <div>
                      <span className="text-[10px] text-slate-400 block font-semibold">VALOR TOTAL:</span>
                      <span className="text-sm font-bold text-slate-800">
                        R$ {totalVal.toFixed(2)}
                      </span>
                    </div>

                    <div className="col-span-2 text-[11px] text-slate-500 pt-1 border-t border-slate-200/60 flex justify-between">
                      <span>Mín: {item.minStock} {item.unit}</span>
                      <span>Máx: {item.maxStock} {item.unit}</span>
                      <span>Unit: R$ {cost.toFixed(2)}</span>
                    </div>
                  </div>

                  {/* Actions Bar */}
                  <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                    <button
                      onClick={() => setSelectedItemForMovement(item)}
                      className="px-3 py-1.5 bg-indigo-600 text-white text-xs font-bold rounded-xl shadow-xs active:scale-95"
                    >
                      Movimentar
                    </button>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleQuickRestockItem(item)}
                        className="p-1.5 text-slate-600 hover:text-amber-600 bg-slate-50 border border-slate-200 rounded-lg"
                        title="Solicitar Reposição"
                      >
                        <ShoppingCart className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setItemToEdit(item)}
                        className="p-1.5 text-slate-600 hover:text-indigo-600 bg-slate-50 border border-slate-200 rounded-lg"
                        title="Editar"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setItemToDelete(item)}
                        className="p-1.5 text-slate-400 hover:text-red-600 bg-slate-50 border border-slate-200 rounded-lg"
                        title="Excluir"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      ) : (
        /* Movements Log Tab */
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 border-b border-slate-200 font-bold uppercase text-[10px]">
              <tr>
                <th className="p-3.5">Data / Hora</th>
                <th className="p-3.5">Material</th>
                <th className="p-3.5 text-center">Operação</th>
                <th className="p-3.5 text-right">Quantidade</th>
                <th className="p-3.5 text-right">Saldo Resultante</th>
                <th className="p-3.5">Responsável</th>
                <th className="p-3.5">Motivo / Departamento</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {movements.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-400">
                    Nenhuma movimentação registrada no almoxarifado até o momento.
                  </td>
                </tr>
              ) : (
                movements.map((m) => (
                  <tr key={m.id} className="hover:bg-slate-50/60">
                    <td className="p-3.5 text-slate-500 font-mono text-[11px]">
                      {new Date(m.createdAt).toLocaleString('pt-BR')}
                    </td>
                    <td className="p-3.5 font-semibold text-slate-900">
                      <span className="font-mono text-xs text-indigo-700 mr-1.5">{m.itemCode}</span>
                      {m.description || m.itemName}
                    </td>
                    <td className="p-3.5 text-center">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                          m.type === 'entry' || m.type === 'in'
                            ? 'bg-emerald-100 text-emerald-800'
                            : m.type === 'exit' || m.type === 'out'
                            ? 'bg-rose-100 text-rose-800'
                            : 'bg-blue-100 text-blue-800'
                        }`}
                      >
                        {m.type === 'entry' || m.type === 'in'
                          ? 'Entrada'
                          : m.type === 'exit' || m.type === 'out'
                          ? 'Saída'
                          : 'Ajuste'}
                      </span>
                    </td>
                    <td className="p-3.5 text-right font-bold text-slate-900">
                      {m.quantity}
                    </td>
                    <td className="p-3.5 text-right font-mono text-slate-600">
                      {m.newStock !== undefined ? m.newStock : '-'}
                    </td>
                    <td className="p-3.5 text-slate-700">{m.userName || m.performedByName}</td>
                    <td className="p-3.5 text-slate-500">
                      <span className="block font-medium text-slate-700">{m.reason}</span>
                      {m.department && <span className="text-[10px] text-slate-400">{m.department}</span>}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Movement Modal */}
      <StockMovementModal
        item={selectedItemForMovement}
        isOpen={!!selectedItemForMovement}
        currentUser={currentUser}
        onClose={() => setSelectedItemForMovement(null)}
        onSuccess={() => {
          setSelectedItemForMovement(null);
          loadData();
        }}
      />

      {/* Add / Edit Stock Item Modal */}
      <StockItemFormModal
        isOpen={isAddModalOpen || !!itemToEdit}
        itemToEdit={itemToEdit}
        currentUser={currentUser}
        onClose={() => {
          setIsAddModalOpen(false);
          setItemToEdit(null);
        }}
        onSuccess={() => {
          setIsAddModalOpen(false);
          setItemToEdit(null);
          loadData();
        }}
      />

      {/* Delete Confirmation Modal */}
      <StockItemDeleteModal
        isOpen={!!itemToDelete}
        item={itemToDelete}
        currentUser={currentUser}
        onClose={() => setItemToDelete(null)}
        onSuccess={() => {
          setItemToDelete(null);
          loadData();
        }}
      />

      {/* Category Manager & Item Category Assignment Modal */}
      <StockCategoryModal
        isOpen={isCategoryModalOpen}
        currentUser={currentUser}
        itemToChangeCategory={itemForCategoryChange}
        onClose={() => {
          setIsCategoryModalOpen(false);
          setItemForCategoryChange(null);
        }}
        onSuccess={() => {
          setIsCategoryModalOpen(false);
          setItemForCategoryChange(null);
          loadData();
        }}
      />
    </div>
  );
};
