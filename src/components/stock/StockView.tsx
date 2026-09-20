import React, { useState, useEffect } from 'react';
import { dbService } from '../../services/dataService';
import { StockItem, StockMovement, User } from '../../types';
import { exportToExcel } from '../../utils/exportExcel';
import { StockMovementModal } from './StockMovementModal';
import {
  Boxes,
  Search,
  Download,
  AlertTriangle,
  Zap,
  ArrowDownRight,
  ArrowUpRight,
  History,
  CheckCircle2,
  Package,
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
  const [search, setSearch] = useState('');
  const [onlyCritical, setOnlyCritical] = useState(false);
  const [selectedItemForMovement, setSelectedItemForMovement] = useState<StockItem | null>(null);
  const [bannerMessage, setBannerMessage] = useState<string | null>(null);

  const loadData = () => {
    setStock(dbService.getStock());
    setMovements(dbService.getStockMovements());
  };

  useEffect(() => {
    loadData();
    return dbService.subscribe(loadData);
  }, []);

  const lowStockCount = stock.filter((s) => s.currentStock <= s.minStock).length;

  const filteredStock = stock.filter((item) => {
    const code = item.code || item.sku || '';
    const desc = item.description || item.name || '';
    const matchesSearch =
      code.toLowerCase().includes(search.toLowerCase()) ||
      desc.toLowerCase().includes(search.toLowerCase()) ||
      item.category.toLowerCase().includes(search.toLowerCase()) ||
      item.location.toLowerCase().includes(search.toLowerCase());

    const isCritical = item.currentStock <= item.minStock;
    if (onlyCritical && !isCritical) return false;

    return matchesSearch;
  });

  const handleExportExcel = () => {
    if (activeTab === 'inventory') {
      const headers = ['Código', 'Descrição', 'Categoria', 'Localização', 'Saldo Atual', 'Mínimo', 'Máximo', 'Unidade', 'Custo Médio (R$)', 'Status'];
      const rows = filteredStock.map((s) => [
        s.code || s.sku || '',
        s.description || s.name || '',
        s.category,
        s.location,
        s.currentStock,
        s.minStock,
        s.maxStock,
        s.unit,
        (s.averageCost ?? s.avgCost ?? 0).toFixed(2),
        s.currentStock <= s.minStock ? 'CRÍTICO' : 'NORMAL',
      ]);
      exportToExcel('Almoxarifado_Estoque_Compras365', headers, rows);
    } else {
      const headers = ['Data', 'Item', 'Tipo', 'Qtd', 'Operador', 'Motivo'];
      const rows = movements.map((m) => [
        new Date(m.createdAt).toLocaleString('pt-BR'),
        `${m.itemCode || m.stockItemId || ''} - ${m.description || m.itemName || ''}`,
        m.type,
        m.quantity,
        m.userName || m.performedByName || '',
        m.reason || '',
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
        setBannerMessage('Não há nenhum item abaixo do estoque mínimo no momento.');
      }
    } catch (err: any) {
      setBannerMessage('Erro ao gerar reposição: ' + err.message);
    }
  };

  return (
    <div className="space-y-4 pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h1 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">
            Almoxarifado & Controle de Estoque
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Controle de saldo físico, prateleiras, saídas para produção e reposição inteligente
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            id="btn-auto-reorder-stock"
            onClick={handleAutoReorder}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white text-xs font-bold rounded-xl shadow-xs transition active:scale-95"
            title="Gera solicitação de compra automática para itens abaixo do estoque mínimo"
          >
            <Zap className="w-3.5 h-3.5 fill-current" />
            <span>Gerar Reposição Automática</span>
          </button>

          <button
            onClick={handleExportExcel}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl border border-slate-200 transition"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Exportar Excel</span>
          </button>
        </div>
      </div>

      {/* Banner message if generated */}
      {bannerMessage && (
        <div className="p-4 bg-amber-50 border border-amber-200 text-amber-900 rounded-2xl text-xs font-semibold flex items-center justify-between">
          <span>{bannerMessage}</span>
          <div className="flex items-center gap-2">
            <button
              onClick={onNavigateToRequests}
              className="text-xs font-bold text-amber-800 underline hover:text-amber-950"
            >
              Ver Solicitações →
            </button>
            <button
              onClick={() => setBannerMessage(null)}
              className="text-xs text-amber-600 hover:text-amber-900 ml-2"
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
          <span>Inventário Atual ({stock.length})</span>
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
          <span>Histórico de Movimentações ({movements.length})</span>
        </button>
      </div>

      {activeTab === 'inventory' ? (
        <>
          {/* Search & Filter */}
          <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center gap-3">
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

            <button
              onClick={() => setOnlyCritical(!onlyCritical)}
              className={`px-3 py-2 text-xs font-bold rounded-xl border transition flex items-center gap-1.5 w-full sm:w-auto justify-center ${
                onlyCritical
                  ? 'bg-red-50 border-red-300 text-red-700'
                  : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5 text-red-500" />
              <span>Apenas Críticos / Abaixo do Mínimo ({lowStockCount})</span>
            </button>
          </div>

          {/* Desktop Inventory Table */}
          <div className="hidden md:block bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 border-b border-slate-200 font-bold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="p-3.5">Código / Local</th>
                  <th className="p-3.5">Descrição do Material</th>
                  <th className="p-3.5">Categoria</th>
                  <th className="p-3.5 text-center">Níveis (Mín / Máx)</th>
                  <th className="p-3.5 text-right">Saldo Atual</th>
                  <th className="p-3.5 text-right">Custo Médio</th>
                  <th className="p-3.5 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredStock.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-slate-400">
                      Nenhum item encontrado no almoxarifado.
                    </td>
                  </tr>
                ) : (
                  filteredStock.map((item) => {
                    const isLow = item.currentStock <= item.minStock;
                    return (
                      <tr key={item.id} className="hover:bg-slate-50/70 transition">
                        <td className="p-3.5">
                          <span className="font-mono font-bold text-slate-900 block">
                            {item.code}
                          </span>
                          <span className="text-[10px] text-slate-400 font-medium">
                            {item.location}
                          </span>
                        </td>
                        <td className="p-3.5">
                          <span className="font-semibold text-slate-800 block">
                            {item.description}
                          </span>
                          {isLow && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-red-700 bg-red-50 border border-red-200 px-1.5 py-0.2 rounded mt-0.5">
                              <AlertTriangle className="w-3 h-3" /> Estoque Crítico
                            </span>
                          )}
                        </td>
                        <td className="p-3.5 text-slate-600 font-medium">{item.category}</td>
                        <td className="p-3.5 text-center text-slate-500">
                          {item.minStock} {item.unit} / {item.maxStock} {item.unit}
                        </td>
                        <td className="p-3.5 text-right">
                          <span
                            className={`text-sm font-black ${
                              isLow ? 'text-red-600' : 'text-slate-900'
                            }`}
                          >
                            {item.currentStock} {item.unit}
                          </span>
                        </td>
                        <td className="p-3.5 text-right text-slate-700 font-medium">
                          R$ {(item.averageCost ?? item.avgCost ?? 0).toFixed(2)}
                        </td>
                        <td className="p-3.5 text-right">
                          <button
                            onClick={() => setSelectedItemForMovement(item)}
                            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition"
                          >
                            Movimentar
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile Inventory Cards */}
          <div className="grid grid-cols-1 gap-3 md:hidden">
            {filteredStock.map((item) => {
              const isLow = item.currentStock <= item.minStock;
              return (
                <div
                  key={item.id}
                  className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
                      {item.code}
                    </span>
                    <span className="text-xs text-slate-400">{item.location}</span>
                  </div>

                  <h3 className="text-sm font-bold text-slate-900">{item.description}</h3>
                  <span className="text-xs text-slate-500 block">{item.category}</span>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                    <div>
                      <span className="text-[10px] text-slate-400 block">Saldo em Estoque:</span>
                      <span className={`text-base font-black ${isLow ? 'text-red-600' : 'text-slate-900'}`}>
                        {item.currentStock} {item.unit}
                      </span>
                    </div>

                    <button
                      onClick={() => setSelectedItemForMovement(item)}
                      className="px-3 py-1.5 bg-indigo-600 text-white text-xs font-bold rounded-xl shadow-xs active:scale-95"
                    >
                      Movimentar
                    </button>
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
                <th className="p-3.5">Responsável</th>
                <th className="p-3.5">Motivo / OS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {movements.map((m) => (
                <tr key={m.id} className="hover:bg-slate-50/60">
                  <td className="p-3.5 text-slate-500 font-mono text-[11px]">
                    {new Date(m.createdAt).toLocaleString('pt-BR')}
                  </td>
                  <td className="p-3.5 font-semibold text-slate-900">
                    <span className="font-mono text-xs text-indigo-700 mr-1">{m.itemCode}</span>
                    {m.description}
                  </td>
                  <td className="p-3.5 text-center">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                        m.type === 'entry'
                          ? 'bg-emerald-100 text-emerald-800'
                          : m.type === 'exit'
                          ? 'bg-rose-100 text-rose-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}
                    >
                      {m.type === 'entry' ? 'Entrada' : m.type === 'exit' ? 'Saída' : 'Ajuste'}
                    </span>
                  </td>
                  <td className="p-3.5 text-right font-bold text-slate-900">
                    {m.quantity}
                  </td>
                  <td className="p-3.5 text-slate-700">{m.userName}</td>
                  <td className="p-3.5 text-slate-500">{m.reason}</td>
                </tr>
              ))}
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
    </div>
  );
};
