import React, { useState, useEffect } from 'react';
import { dbService } from '../../services/dataService';
import { PurchaseRequest, User, RequestUrgency, RequestStatus } from '../../types';
import { exportToExcel } from '../../utils/exportExcel';
import { RequestDetailModal } from './RequestDetailModal';
import {
  Search,
  Filter,
  Plus,
  Download,
  Eye,
  Scale,
  Calendar,
  Layers,
  ArrowUpDown,
} from 'lucide-react';

interface RequestListViewProps {
  currentUser: User;
  onOpenNewRequest: () => void;
  onStartQuote: (requestId: string) => void;
  onViewQuote: (quoteId: string) => void;
  onViewOrder: (orderId: string) => void;
}

export const RequestListView: React.FC<RequestListViewProps> = ({
  currentUser,
  onOpenNewRequest,
  onStartQuote,
  onViewQuote,
  onViewOrder,
}) => {
  const [requests, setRequests] = useState<PurchaseRequest[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [urgencyFilter, setUrgencyFilter] = useState<string>('ALL');
  const [selectedRequest, setSelectedRequest] = useState<PurchaseRequest | null>(null);

  useEffect(() => {
    const load = () => {
      setRequests(dbService.getRequests());
    };
    load();
    return dbService.subscribe(load);
  }, []);

  // Filter logic
  const filtered = requests.filter((r) => {
    const matchesSearch =
      r.code.toLowerCase().includes(search.toLowerCase()) ||
      r.department.toLowerCase().includes(search.toLowerCase()) ||
      r.requesterName.toLowerCase().includes(search.toLowerCase()) ||
      r.items.some((i) => i.description.toLowerCase().includes(search.toLowerCase()));

    const matchesStatus = statusFilter === 'ALL' || r.status === statusFilter;
    const matchesUrgency = urgencyFilter === 'ALL' || r.urgency === urgencyFilter;

    return matchesSearch && matchesStatus && matchesUrgency;
  });

  const handleExportExcel = () => {
    const headers = ['Código', 'Data', 'Solicitante', 'Departamento', 'Urgência', 'Status', 'Total Estimado (R$)', 'Qtd Itens'];
    const rows = filtered.map((r) => [
      r.code,
      new Date(r.createdAt).toLocaleDateString('pt-BR'),
      r.requesterName,
      r.department,
      r.urgency,
      r.status,
      r.estimatedTotal.toFixed(2),
      r.items.length,
    ]);
    exportToExcel('Solicitacoes_Compras365', headers, rows);
  };

  const getStatusBadge = (status: RequestStatus) => {
    switch (status) {
      case 'approved':
        return <span className="bg-emerald-100 text-emerald-800 text-xs font-semibold px-2.5 py-0.5 rounded-full">Aprovado</span>;
      case 'rejected':
        return <span className="bg-rose-100 text-rose-800 text-xs font-semibold px-2.5 py-0.5 rounded-full">Reprovado</span>;
      case 'quoting':
        return <span className="bg-blue-100 text-blue-800 text-xs font-semibold px-2.5 py-0.5 rounded-full">Em Cotação</span>;
      case 'pending_approval':
        return <span className="bg-amber-100 text-amber-800 text-xs font-semibold px-2.5 py-0.5 rounded-full">Em Aprovação</span>;
      case 'ordered':
        return <span className="bg-purple-100 text-purple-800 text-xs font-semibold px-2.5 py-0.5 rounded-full">Pedido Emitido</span>;
      default:
        return <span className="bg-slate-100 text-slate-700 text-xs font-semibold px-2.5 py-0.5 rounded-full">Pendente Cotação</span>;
    }
  };

  const getUrgencyBadge = (urgency: RequestUrgency) => {
    switch (urgency) {
      case 'urgent':
        return <span className="text-red-700 font-bold text-[11px] bg-red-50 border border-red-200 px-2 py-0.5 rounded-md">Crítica</span>;
      case 'high':
        return <span className="text-amber-700 font-bold text-[11px] bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-md">Alta</span>;
      case 'medium':
        return <span className="text-blue-700 font-semibold text-[11px] bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-md">Média</span>;
      default:
        return <span className="text-slate-600 text-[11px] bg-slate-50 border border-slate-200 px-2 py-0.5 rounded-md">Baixa</span>;
    }
  };

  return (
    <div className="space-y-4 pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h1 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">
            Solicitações de Compra
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Gerencie e acompanhe requisições de compra de todos os centros de custo
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportExcel}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl border border-slate-200 transition"
            title="Exportar para Excel (CSV UTF-8)"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Exportar Excel</span>
          </button>
          <button
            onClick={onOpenNewRequest}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs transition active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Nova Solicitação</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center gap-3">
        {/* Search */}
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por código (ex: SOL-2026), item, solicitante ou departamento..."
            className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
          />
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="flex-1 sm:flex-initial px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden font-medium text-slate-700"
          >
            <option value="ALL">Todos os Status</option>
            <option value="pending_quote">Pendente Cotação</option>
            <option value="quoting">Em Cotação</option>
            <option value="pending_approval">Aguardando Alçada</option>
            <option value="approved">Aprovado</option>
            <option value="ordered">Pedido Emitido</option>
            <option value="rejected">Reprovado</option>
          </select>

          <select
            value={urgencyFilter}
            onChange={(e) => setUrgencyFilter(e.target.value)}
            className="flex-1 sm:flex-initial px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden font-medium text-slate-700"
          >
            <option value="ALL">Todas Urgências</option>
            <option value="urgent">Crítica / Urgente</option>
            <option value="high">Alta</option>
            <option value="medium">Média</option>
            <option value="low">Baixa</option>
          </select>
        </div>
      </div>

      {/* Desktop Table View (Hidden on mobile) */}
      <div className="hidden md:block bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 text-slate-500 border-b border-slate-200 font-bold uppercase tracking-wider text-[10px]">
            <tr>
              <th className="p-3.5">Código</th>
              <th className="p-3.5">Solicitante / Depto</th>
              <th className="p-3.5">Primeiro Item</th>
              <th className="p-3.5 text-center">Urgência</th>
              <th className="p-3.5 text-center">Status</th>
              <th className="p-3.5 text-right">Valor Estimado</th>
              <th className="p-3.5 text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={7} className="p-8 text-center text-slate-400">
                  Nenhuma solicitação encontrada para os filtros selecionados.
                </td>
              </tr>
            ) : (
              filtered.map((req) => (
                <tr key={req.id} className="hover:bg-slate-50/70 transition">
                  <td className="p-3.5">
                    <span className="font-mono font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded">
                      {req.code}
                    </span>
                    <span className="block text-[10px] text-slate-400 mt-0.5">
                      {new Date(req.createdAt).toLocaleDateString('pt-BR')}
                    </span>
                  </td>
                  <td className="p-3.5">
                    <span className="font-semibold text-slate-800 block">{req.requesterName}</span>
                    <span className="text-[11px] text-slate-500">{req.department}</span>
                  </td>
                  <td className="p-3.5 max-w-[200px]">
                    <span className="font-medium text-slate-800 truncate block">
                      {req.items[0]?.description}
                    </span>
                    {req.items.length > 1 && (
                      <span className="text-[10px] text-slate-400">
                        +{req.items.length - 1} outros itens
                      </span>
                    )}
                  </td>
                  <td className="p-3.5 text-center">{getUrgencyBadge(req.urgency)}</td>
                  <td className="p-3.5 text-center">{getStatusBadge(req.status)}</td>
                  <td className="p-3.5 text-right font-black text-slate-900">
                    R$ {req.estimatedTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </td>
                  <td className="p-3.5 text-right space-x-1">
                    <button
                      onClick={() => setSelectedRequest(req)}
                      className="p-1.5 text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition"
                      title="Ver detalhes"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    {(currentUser.role === 'buyer' || currentUser.role === 'admin') &&
                      (req.status === 'pending_quote' || req.status === 'draft') && (
                        <button
                          onClick={() => onStartQuote(req.id)}
                          className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                          title="Abrir Cotação de Preços"
                        >
                          <Scale className="w-4 h-4" />
                        </button>
                      )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile Card View (Responsive pattern requested by prompt) */}
      <div className="grid grid-cols-1 gap-3 md:hidden">
        {filtered.length === 0 ? (
          <div className="bg-white p-8 text-center text-slate-400 rounded-2xl border border-slate-200">
            Nenhuma solicitação encontrada.
          </div>
        ) : (
          filtered.map((req) => (
            <div
              key={req.id}
              onClick={() => setSelectedRequest(req)}
              className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs hover:shadow-xs active:scale-[0.99] transition cursor-pointer"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="font-mono font-bold text-xs text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded">
                  {req.code}
                </span>
                {getStatusBadge(req.status)}
              </div>

              <h3 className="text-sm font-bold text-slate-800 line-clamp-1">
                {req.items[0]?.description}
                {req.items.length > 1 && ` (+${req.items.length - 1})`}
              </h3>

              <div className="mt-2 text-xs text-slate-500 space-y-1">
                <div className="flex justify-between">
                  <span>Depto: <strong>{req.department}</strong></span>
                  <span>{getUrgencyBadge(req.urgency)}</span>
                </div>
                <div className="flex justify-between items-baseline pt-1 border-t border-slate-100 mt-2">
                  <span className="text-[11px] text-slate-400">
                    {req.requesterName} • {new Date(req.createdAt).toLocaleDateString('pt-BR')}
                  </span>
                  <span className="text-sm font-black text-slate-900">
                    R$ {req.estimatedTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Detail Modal */}
      <RequestDetailModal
        isOpen={!!selectedRequest}
        request={selectedRequest}
        currentUser={currentUser}
        onClose={() => setSelectedRequest(null)}
        onStartQuote={onStartQuote}
        onViewQuote={onViewQuote}
        onViewOrder={onViewOrder}
      />
    </div>
  );
};
