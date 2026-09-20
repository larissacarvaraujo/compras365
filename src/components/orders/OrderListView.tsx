import React, { useState, useEffect } from 'react';
import { dbService } from '../../services/dataService';
import { PurchaseOrder, User, OrderStatus } from '../../types';
import { exportToExcel } from '../../utils/exportExcel';
import { generatePurchaseOrderPdf } from '../../utils/orderPdfGenerator';
import { OrderDetailModal } from './OrderDetailModal';
import { OrderEmailModal } from './OrderEmailModal';
import {
  ShoppingBag,
  Search,
  Download,
  Eye,
  Clock,
  CheckCircle2,
  Boxes,
  Send,
  AlertTriangle,
  FileDown,
  Mail,
} from 'lucide-react';

interface OrderListViewProps {
  currentUser: User;
  selectedOrderId?: string | null;
}

export const OrderListView: React.FC<OrderListViewProps> = ({
  currentUser,
  selectedOrderId,
}) => {
  const [orders, setOrders] = useState<PurchaseOrder[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [activeOrder, setActiveOrder] = useState<PurchaseOrder | null>(null);
  const [emailOrder, setEmailOrder] = useState<PurchaseOrder | null>(null);

  const loadData = () => {
    const list = dbService.getOrders();
    setOrders(list);

    if (selectedOrderId) {
      const found = list.find((o) => o.id === selectedOrderId);
      if (found) setActiveOrder(found);
    }
  };

  useEffect(() => {
    loadData();
    return dbService.subscribe(loadData);
  }, [selectedOrderId]);

  const todayStr = new Date().toISOString().split('T')[0];

  const filtered = orders.filter((o) => {
    const code = o.code || o.orderNumber || '';
    const matchesSearch =
      code.toLowerCase().includes(search.toLowerCase()) ||
      o.supplierName.toLowerCase().includes(search.toLowerCase()) ||
      o.items.some((i) => i.description.toLowerCase().includes(search.toLowerCase()));

    const matchesStatus = statusFilter === 'ALL' || o.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleExportExcel = () => {
    const headers = ['Código', 'Emissão', 'Fornecedor', 'Prazo Entrega', 'Status', 'Valor Total (R$)', 'Qtd Itens'];
    const rows = filtered.map((o) => [
      o.code || o.orderNumber || 'PED',
      new Date(o.createdAt).toLocaleDateString('pt-BR'),
      o.supplierName,
      new Date(o.deliveryDeadline).toLocaleDateString('pt-BR'),
      o.status,
      o.totalAmount.toFixed(2),
      o.items.length,
    ]);
    exportToExcel('Pedidos_Compra_Compras365', headers, rows);
  };

  const getStatusBadge = (status: OrderStatus, deadline: string) => {
    const isLate = deadline < todayStr && status !== 'received' && status !== 'cancelled';

    if (isLate) {
      return (
        <span className="bg-rose-100 text-rose-800 text-xs font-bold px-2 py-0.5 rounded-full flex items-center gap-1 w-fit">
          <AlertTriangle className="w-3 h-3" /> Atrasado
        </span>
      );
    }

    switch (status) {
      case 'received':
        return <span className="bg-emerald-100 text-emerald-800 text-xs font-semibold px-2 py-0.5 rounded-full">Recebido / Entregue</span>;
      case 'partially_received':
        return <span className="bg-teal-100 text-teal-800 text-xs font-semibold px-2 py-0.5 rounded-full">Recebimento Parcial</span>;
      case 'confirmed':
        return <span className="bg-blue-100 text-blue-800 text-xs font-semibold px-2 py-0.5 rounded-full">Confirmado pelo Fornecedor</span>;
      case 'sent':
        return <span className="bg-indigo-100 text-indigo-800 text-xs font-semibold px-2 py-0.5 rounded-full">Enviado</span>;
      default:
        return <span className="bg-purple-100 text-purple-800 text-xs font-semibold px-2 py-0.5 rounded-full">Emitido</span>;
    }
  };

  return (
    <div className="space-y-4 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h1 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">
            Pedidos de Compra (PO)
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Contratos de fornecimento emitidos após alçada de aprovação, prontos para envio e recebimento
          </p>
        </div>

        <button
          onClick={handleExportExcel}
          className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl border border-slate-200 transition"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Exportar Excel</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por código de pedido (ex: PED-2026), fornecedor ou item..."
            className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="w-full sm:w-auto px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden font-medium text-slate-700"
        >
          <option value="ALL">Todos os Status</option>
          <option value="issued">Emitidos</option>
          <option value="sent">Enviados ao Fornecedor</option>
          <option value="confirmed">Confirmados</option>
          <option value="partially_received">Recebimento Parcial</option>
          <option value="received">Recebidos / Concluídos</option>
        </select>
      </div>

      {/* Desktop Table View */}
      <div className="hidden md:block bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 text-slate-500 border-b border-slate-200 font-bold uppercase tracking-wider text-[10px]">
            <tr>
              <th className="p-3.5">Código / Emissão</th>
              <th className="p-3.5">Fornecedor</th>
              <th className="p-3.5">Prazo de Entrega</th>
              <th className="p-3.5">Status</th>
              <th className="p-3.5 text-right">Valor do Pedido</th>
              <th className="p-3.5 text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-8 text-center text-slate-400">
                  Nenhum pedido de compra encontrado.
                </td>
              </tr>
            ) : (
              filtered.map((order) => (
                <tr key={order.id} className="hover:bg-slate-50/70 transition">
                  <td className="p-3.5">
                    <span className="font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                      {order.code}
                    </span>
                    <span className="block text-[10px] text-slate-400 mt-0.5">
                      {new Date(order.createdAt).toLocaleDateString('pt-BR')}
                    </span>
                  </td>
                  <td className="p-3.5">
                    <span className="font-bold text-slate-900 block">{order.supplierName}</span>
                    <span className="text-[11px] text-slate-500">CNPJ: {order.supplierCnpj}</span>
                  </td>
                  <td className="p-3.5">
                    <span className="text-slate-800 font-semibold block">
                      {new Date(order.deliveryDeadline).toLocaleDateString('pt-BR')}
                    </span>
                    <span className="text-[10px] text-slate-400">Condição: {order.paymentTerms}</span>
                  </td>
                  <td className="p-3.5">{getStatusBadge(order.status, order.deliveryDeadline)}</td>
                  <td className="p-3.5 text-right font-black text-slate-900 text-sm">
                    R$ {order.totalAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </td>
                  <td className="p-3.5 text-right space-x-1 whitespace-nowrap">
                    <button
                      id={`btn-email-order-${order.id}`}
                      onClick={() => setEmailOrder(order)}
                      className="p-1.5 text-blue-700 hover:text-blue-900 hover:bg-blue-50 rounded-lg transition inline-flex items-center"
                      title="Gerar e Enviar E-mail Formatado (HTML/Texto/mailto)"
                    >
                      <Mail className="w-4 h-4" />
                    </button>
                    <button
                      id={`btn-download-pdf-${order.id}`}
                      onClick={() => generatePurchaseOrderPdf(order, 'download')}
                      className="p-1.5 text-emerald-700 hover:text-emerald-900 hover:bg-emerald-50 rounded-lg transition inline-flex items-center"
                      title="Gerar e Baixar PDF Oficial do Pedido"
                    >
                      <FileDown className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setActiveOrder(order)}
                      className="p-1.5 text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition inline-flex items-center"
                      title="Ver Ordem de Compra"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile Cards View */}
      <div className="grid grid-cols-1 gap-3 md:hidden">
        {filtered.length === 0 ? (
          <div className="bg-white p-8 text-center text-slate-400 rounded-2xl border border-slate-200">
            Nenhum pedido de compra encontrado.
          </div>
        ) : (
          filtered.map((order) => (
            <div
              key={order.id}
              onClick={() => setActiveOrder(order)}
              className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs hover:shadow-xs active:scale-[0.99] transition cursor-pointer"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="font-mono font-bold text-xs text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                  {order.code}
                </span>
                {getStatusBadge(order.status, order.deliveryDeadline)}
              </div>

              <h3 className="text-sm font-bold text-slate-900">{order.supplierName}</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Prazo: <strong>{new Date(order.deliveryDeadline).toLocaleDateString('pt-BR')}</strong>
              </p>

              <div className="flex justify-between items-baseline pt-2 border-t border-slate-100 mt-2">
                <span className="text-xs text-slate-400">{order.items.length} itens</span>
                <span className="text-sm font-black text-slate-900">
                  R$ {order.totalAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </span>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 mt-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setEmailOrder(order);
                  }}
                  className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg text-xs font-semibold"
                  title="E-mail Formatado"
                >
                  <Mail className="w-3.5 h-3.5" />
                  <span>E-mail</span>
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    generatePurchaseOrderPdf(order, 'download');
                  }}
                  className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-lg text-xs font-semibold"
                >
                  <FileDown className="w-3.5 h-3.5" />
                  <span>Baixar PDF</span>
                </button>
                <button
                  onClick={() => setActiveOrder(order)}
                  className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-lg text-xs font-semibold"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Detalhes</span>
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Order Detail / Formal PO Modal */}
      <OrderDetailModal
        order={activeOrder}
        isOpen={!!activeOrder}
        currentUser={currentUser}
        onClose={() => setActiveOrder(null)}
        onRefresh={loadData}
      />

      {/* Order Email Submodal */}
      {emailOrder && (
        <OrderEmailModal
          order={emailOrder}
          isOpen={!!emailOrder}
          onClose={() => setEmailOrder(null)}
        />
      )}
    </div>
  );
};
