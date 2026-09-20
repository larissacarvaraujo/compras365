import React, { useState, useEffect } from 'react';
import { dbService } from '../../services/dataService';
import { PurchaseRequest, Quote, PurchaseOrder, StockItem, AppRoute, User } from '../../types';
import {
  FileText,
  Scale,
  CheckSquare,
  AlertTriangle,
  TrendingDown,
  ShoppingBag,
  ArrowRight,
  PlusCircle,
  Boxes,
  Truck,
  Clock,
} from 'lucide-react';

interface DashboardViewProps {
  currentUser: User;
  onNavigate: (route: AppRoute) => void;
  onOpenNewRequest: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  currentUser,
  onNavigate,
  onOpenNewRequest,
}) => {
  const [requests, setRequests] = useState<PurchaseRequest[]>([]);
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [orders, setOrders] = useState<PurchaseOrder[]>([]);
  const [stock, setStock] = useState<StockItem[]>([]);

  useEffect(() => {
    const loadData = () => {
      setRequests(dbService.getRequests());
      setQuotes(dbService.getQuotes());
      setOrders(dbService.getOrders());
      setStock(dbService.getStock());
    };

    loadData();
    return dbService.subscribe(loadData);
  }, []);

  // Compute Metrics
  const pendingApprovalsCount =
    quotes.filter((q) => q.status === 'pending_approval').length +
    requests.filter((r) => r.status === 'pending_approval').length;

  const lowStockItems = stock.filter((s) => s.currentStock <= s.minStock);

  const totalQuotingAmount = quotes
    .filter((q) => q.status === 'in_progress' || q.status === 'pending_approval')
    .reduce((acc, q) => acc + (q.totalAmount || q.estimatedTotal || 0), 0);

  const totalOpenOrders = orders
    .filter((o) => o.status === 'issued' || o.status === 'sent' || o.status === 'confirmed')
    .reduce((acc, o) => acc + o.totalAmount, 0);

  const totalSavings = quotes
    .filter((q) => q.savingAmount > 0)
    .reduce((acc, q) => acc + q.savingAmount, 0);

  // Late deliveries (deadline < today and not received)
  const todayStr = new Date().toISOString().split('T')[0];
  const lateOrders = orders.filter(
    (o) => o.deliveryDeadline < todayStr && o.status !== 'received' && o.status !== 'cancelled'
  );

  // Supplier spending summary
  const supplierSpendMap: Record<string, { name: string; amount: number; orderCount: number }> = {};
  orders.forEach((o) => {
    if (!supplierSpendMap[o.supplierName]) {
      supplierSpendMap[o.supplierName] = { name: o.supplierName, amount: 0, orderCount: 0 };
    }
    supplierSpendMap[o.supplierName].amount += o.totalAmount;
    supplierSpendMap[o.supplierName].orderCount += 1;
  });

  const topSuppliers = Object.values(supplierSpendMap)
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 4);

  const maxSpend = topSuppliers.length > 0 ? topSuppliers[0].amount : 1;

  return (
    <div className="space-y-6 pb-12">
      {/* Top Welcome & Context Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Painel Executivo de Suprimentos
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Olá, <strong>{currentUser.displayName}</strong> ({currentUser.department}) • Visão unificada de cotações, pedidos e almoxarifado
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onOpenNewRequest}
            className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs sm:text-sm font-semibold px-4 py-2.5 rounded-xl shadow-xs transition active:scale-95"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Nova Solicitação</span>
          </button>
          <button
            onClick={() => onNavigate('stock')}
            className="inline-flex items-center justify-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs sm:text-sm font-medium px-3 py-2.5 rounded-xl transition"
          >
            <Boxes className="w-4 h-4 text-slate-600" />
            <span className="hidden sm:inline">Almoxarifado</span>
          </button>
        </div>
      </div>

      {/* Critical Alerts Bar (Delayed Orders or Depleted Stock) */}
      {(lateOrders.length > 0 || lowStockItems.length > 0) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {lateOrders.length > 0 && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl flex items-start gap-3">
              <Clock className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-rose-900 uppercase tracking-wider">Atraso na Entrega</span>
                  <span className="text-[10px] font-bold bg-rose-200 text-rose-800 px-2 py-0.5 rounded-full">
                    {lateOrders.length} {lateOrders.length === 1 ? 'pedido atrasado' : 'pedidos atrasados'}
                  </span>
                </div>
                <p className="text-xs text-rose-700 mt-1">
                  Existem pedidos cujo prazo prometido pelo fornecedor já expirou.
                </p>
                <button
                  onClick={() => onNavigate('orders')}
                  className="mt-2 text-xs font-semibold text-rose-800 hover:underline flex items-center gap-1"
                >
                  Cobrar Fornecedores no WhatsApp →
                </button>
              </div>
            </div>
          )}

          {lowStockItems.length > 0 && (
            <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-2xl flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-amber-900 uppercase tracking-wider">Estoque Crítico</span>
                  <span className="text-[10px] font-bold bg-amber-200 text-amber-800 px-2 py-0.5 rounded-full">
                    {lowStockItems.length} {lowStockItems.length === 1 ? 'item' : 'itens'} no mínimo
                  </span>
                </div>
                <p className="text-xs text-amber-700 mt-1">
                  Itens essenciais com saldo abaixo do estoque de segurança.
                </p>
                <button
                  onClick={() => onNavigate('stock')}
                  className="mt-2 text-xs font-semibold text-amber-800 hover:underline flex items-center gap-1"
                >
                  Gerar Reposição Automática →
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Card 1: Total em Cotação */}
        <div
          onClick={() => onNavigate('quotes')}
          className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 hover:border-indigo-300 shadow-2xs hover:shadow-sm cursor-pointer transition"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Em Cotação</span>
            <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
              <Scale className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-lg sm:text-2xl font-black text-slate-900 tracking-tight">
              R$ {totalQuotingAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </span>
            <p className="text-[11px] text-slate-400 mt-0.5">
              {quotes.filter((q) => q.status === 'in_progress').length} cotações ativas
            </p>
          </div>
        </div>

        {/* Card 2: Pendências de Aprovação */}
        <div
          onClick={() => onNavigate('approvals')}
          className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 hover:border-amber-300 shadow-2xs hover:shadow-sm cursor-pointer transition"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Aprovações de Alçada</span>
            <div className="p-2 bg-amber-50 text-amber-600 rounded-xl">
              <CheckSquare className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-lg sm:text-2xl font-black text-slate-900 tracking-tight">
              {pendingApprovalsCount}
            </span>
            <p className="text-[11px] text-amber-600 font-medium mt-0.5">
              {pendingApprovalsCount > 0 ? 'Aguardando parecer de alçada' : 'Sem pendências'}
            </p>
          </div>
        </div>

        {/* Card 3: Pedidos Abertos */}
        <div
          onClick={() => onNavigate('orders')}
          className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 hover:border-emerald-300 shadow-2xs hover:shadow-sm cursor-pointer transition"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Pedidos Emitidos</span>
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
              <ShoppingBag className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-lg sm:text-2xl font-black text-slate-900 tracking-tight">
              R$ {totalOpenOrders.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </span>
            <p className="text-[11px] text-slate-400 mt-0.5">
              {orders.filter((o) => o.status === 'issued').length} pedidos em trânsito
            </p>
          </div>
        </div>

        {/* Card 4: Economia Obtida (Savings) */}
        <div className="bg-gradient-to-br from-indigo-900 to-slate-900 text-white p-4 sm:p-5 rounded-2xl shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-indigo-200">Economia / Saving</span>
            <div className="p-2 bg-white/10 text-emerald-400 rounded-xl backdrop-blur-xs">
              <TrendingDown className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-lg sm:text-2xl font-black text-emerald-400 tracking-tight">
              R$ {totalSavings.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </span>
            <p className="text-[11px] text-indigo-200 mt-0.5">
              Economizados via mapa comparativo
            </p>
          </div>
        </div>
      </div>

      {/* Main Content Grid: Workflow Timeline & Supplier Spend */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Pipeline Status & Recent Requests */}
        <div className="lg:col-span-2 space-y-6">
          {/* Visual Purchasing Pipeline */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                Fluxo Encadeado de Compras (Ciclo Completo)
              </h2>
              <span className="text-xs text-slate-400">Tempo médio: 4.2 dias</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-center">
              <div
                onClick={() => onNavigate('requests')}
                className="p-3 rounded-xl bg-slate-50 border border-slate-200 hover:bg-indigo-50 hover:border-indigo-200 cursor-pointer transition"
              >
                <span className="text-xl font-black text-indigo-600 block">
                  {requests.filter((r) => r.status === 'pending_quote' || r.status === 'draft').length}
                </span>
                <span className="text-xs font-semibold text-slate-700 block mt-1">1. Solicitação</span>
                <span className="text-[10px] text-slate-400">Triagem Inicial</span>
              </div>

              <div
                onClick={() => onNavigate('quotes')}
                className="p-3 rounded-xl bg-slate-50 border border-slate-200 hover:bg-blue-50 hover:border-blue-200 cursor-pointer transition"
              >
                <span className="text-xl font-black text-blue-600 block">
                  {quotes.filter((q) => q.status === 'in_progress').length}
                </span>
                <span className="text-xs font-semibold text-slate-700 block mt-1">2. Cotação</span>
                <span className="text-[10px] text-slate-400">Mapa de Preços</span>
              </div>

              <div
                onClick={() => onNavigate('approvals')}
                className="p-3 rounded-xl bg-slate-50 border border-slate-200 hover:bg-amber-50 hover:border-amber-200 cursor-pointer transition"
              >
                <span className="text-xl font-black text-amber-600 block">
                  {pendingApprovalsCount}
                </span>
                <span className="text-xs font-semibold text-slate-700 block mt-1">3. Alçada</span>
                <span className="text-[10px] text-slate-400">Aprovação Valor</span>
              </div>

              <div
                onClick={() => onNavigate('orders')}
                className="p-3 rounded-xl bg-slate-50 border border-slate-200 hover:bg-purple-50 hover:border-purple-200 cursor-pointer transition"
              >
                <span className="text-xl font-black text-purple-600 block">
                  {orders.filter((o) => o.status === 'issued' || o.status === 'confirmed').length}
                </span>
                <span className="text-xs font-semibold text-slate-700 block mt-1">4. Pedido (PO)</span>
                <span className="text-[10px] text-slate-400">Envio Fornecedor</span>
              </div>

              <div
                onClick={() => onNavigate('stock')}
                className="p-3 rounded-xl bg-slate-50 border border-slate-200 hover:bg-emerald-50 hover:border-emerald-200 cursor-pointer transition col-span-2 sm:col-span-1"
              >
                <span className="text-xl font-black text-emerald-600 block">
                  {orders.filter((o) => o.status === 'received').length}
                </span>
                <span className="text-xs font-semibold text-slate-700 block mt-1">5. Entrada NF</span>
                <span className="text-[10px] text-slate-400">Almoxarifado</span>
              </div>
            </div>
          </div>

          {/* Recent Requests Table/Cards */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900">Solicitações Recentes</h3>
                <p className="text-xs text-slate-500">Últimos pedidos registrados no sistema</p>
              </div>
              <button
                onClick={() => onNavigate('requests')}
                className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
              >
                Ver Todas ({requests.length}) →
              </button>
            </div>

            <div className="divide-y divide-slate-100">
              {requests.slice(0, 4).map((req) => (
                <div
                  key={req.id}
                  onClick={() => onNavigate('requests')}
                  className="p-4 hover:bg-slate-50 cursor-pointer transition flex items-center justify-between gap-4"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded">
                        {req.code}
                      </span>
                      <span className="text-xs text-slate-400">•</span>
                      <span className="text-xs text-slate-600 font-medium truncate">{req.department}</span>
                    </div>
                    <p className="text-sm font-semibold text-slate-800 truncate mt-1">
                      {req.items[0]?.description || 'Item de compra'}
                      {req.items.length > 1 && ` (+${req.items.length - 1} itens)`}
                    </p>
                    <span className="text-xs text-slate-400">Solicitante: {req.requesterName}</span>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="text-sm font-bold text-slate-900 block">
                      R$ {req.estimatedTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full inline-block mt-1 ${
                        req.status === 'approved'
                          ? 'bg-emerald-100 text-emerald-800'
                          : req.status === 'quoting'
                          ? 'bg-blue-100 text-blue-800'
                          : req.status === 'pending_approval'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {req.status === 'quoting'
                        ? 'Em Cotação'
                        : req.status === 'pending_approval'
                        ? 'Aguardando Alçada'
                        : req.status === 'approved'
                        ? 'Aprovado'
                        : req.status === 'ordered'
                        ? 'Pedido Emitido'
                        : 'Pendente Cotação'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right 1 Col: Top Suppliers by Spending & Quick Actions */}
        <div className="space-y-6">
          {/* Supplier Spend Ranking */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                Gastos por Fornecedor
              </h3>
              <Truck className="w-4 h-4 text-slate-400" />
            </div>

            <div className="space-y-3.5">
              {topSuppliers.map((sup, idx) => {
                const percent = Math.round((sup.amount / maxSpend) * 100);
                return (
                  <div key={idx} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-700 truncate max-w-[160px]">
                        {sup.name}
                      </span>
                      <span className="font-bold text-slate-900">
                        R$ {sup.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                    <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-indigo-600 rounded-full transition-all duration-500"
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-[10px] text-slate-400">
                      <span>{sup.orderCount} {sup.orderCount === 1 ? 'pedido' : 'pedidos'}</span>
                      <span>{percent}% do volume</span>
                    </div>
                  </div>
                );
              })}
            </div>

            <button
              onClick={() => onNavigate('suppliers')}
              className="mt-5 w-full py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-semibold rounded-xl border border-slate-200 transition"
            >
              Ver Cadastro de Fornecedores →
            </button>
          </div>

          {/* Quick Help / System Security Info */}
          <div className="bg-slate-900 text-slate-100 p-5 rounded-2xl shadow-xs space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">Segurança Ativa</span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Sistema operando com Firestore Security Rules auditadas. Privilégios segregados por perfil (RBAC) e auditoria imutável contra adulteração.
            </p>
            <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
              <span>Usuário: {currentUser.role}</span>
              <button
                onClick={() => onNavigate('audit')}
                className="text-indigo-400 hover:underline"
              >
                Ver Auditoria
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
