import React, { useState, useEffect } from 'react';
import { dbService } from '../../services/dataService';
import { Quote, User, QuoteStatus } from '../../types';
import { exportToExcel } from '../../utils/exportExcel';
import { generateQuoteComparativeMapPdf } from '../../utils/quoteComparativePdfGenerator';
import { QuoteComparativeMapModal } from './QuoteComparativeMapModal';
import {
  Scale,
  Search,
  Download,
  Award,
  TrendingDown,
  Clock,
  Eye,
  CheckCircle,
  Printer,
  FileDown,
} from 'lucide-react';

interface QuoteListViewProps {
  currentUser: User;
  onSendToApproval: (quoteId: string) => void;
  selectedQuoteId?: string | null;
}

export const QuoteListView: React.FC<QuoteListViewProps> = ({
  currentUser,
  onSendToApproval,
  selectedQuoteId,
}) => {
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [activeModalQuote, setActiveModalQuote] = useState<Quote | null>(null);

  useEffect(() => {
    const load = () => {
      const allQuotes = dbService.getQuotes();
      setQuotes(allQuotes);

      if (selectedQuoteId) {
        const found = allQuotes.find((q) => q.id === selectedQuoteId);
        if (found) setActiveModalQuote(found);
      }
    };
    load();
    return dbService.subscribe(load);
  }, [selectedQuoteId]);

  const filtered = quotes.filter((q) => {
    const reqCodes = q.requestCodes || (q.requestCode ? [q.requestCode] : []);
    const proposals = q.proposals || [];
    const matchesSearch =
      q.code.toLowerCase().includes(search.toLowerCase()) ||
      reqCodes.some((c: string) => c.toLowerCase().includes(search.toLowerCase())) ||
      proposals.some((p) => p.supplierName.toLowerCase().includes(search.toLowerCase()));

    const matchesStatus = statusFilter === 'ALL' || q.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleExportExcel = () => {
    const headers = ['Código', 'Data Criação', 'Status', 'Qtd Fornecedores', 'Fornecedor Vencedor', 'Valor Vencedor (R$)', 'Saving (R$)'];
    const rows = filtered.map((q) => [
      q.code,
      new Date(q.createdAt).toLocaleDateString('pt-BR'),
      q.status,
      q.proposals ? q.proposals.length : (q.bids ? q.bids.length : 0),
      q.winnerSupplierName || q.selectedSupplierId || 'A definir',
      q.totalAmount?.toFixed(2) || '0.00',
      q.savingAmount?.toFixed(2) || '0.00',
    ]);
    exportToExcel('Cotacoes_Compras365', headers, rows);
  };

  const getStatusBadge = (status: QuoteStatus) => {
    switch (status) {
      case 'approved':
        return <span className="bg-emerald-100 text-emerald-800 text-xs font-semibold px-2.5 py-0.5 rounded-full">Aprovada</span>;
      case 'rejected':
        return <span className="bg-rose-100 text-rose-800 text-xs font-semibold px-2.5 py-0.5 rounded-full">Reprovada</span>;
      case 'pending_approval':
        return <span className="bg-amber-100 text-amber-800 text-xs font-semibold px-2.5 py-0.5 rounded-full">Aguardando Aprovação</span>;
      case 'converted_to_order':
        return <span className="bg-purple-100 text-purple-800 text-xs font-semibold px-2.5 py-0.5 rounded-full">Pedido Gerado</span>;
      default:
        return <span className="bg-blue-100 text-blue-800 text-xs font-semibold px-2.5 py-0.5 rounded-full">Em Andamento</span>;
    }
  };

  return (
    <div className="space-y-4 pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h1 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">
            Cotações & Mapa Comparativo de Preços
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Confronto de propostas comerciais com apuração de savings e menor preço
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
            placeholder="Buscar por código de cotação (ex: COT-2026), fornecedor..."
            className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="w-full sm:w-auto px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden font-medium text-slate-700"
        >
          <option value="ALL">Todos os Status</option>
          <option value="in_progress">Em Andamento</option>
          <option value="pending_approval">Aguardando Aprovação</option>
          <option value="approved">Aprovadas</option>
          <option value="converted_to_order">Pedido Gerado</option>
        </select>
      </div>

      {/* Quotation Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.length === 0 ? (
          <div className="col-span-full bg-white p-12 text-center text-slate-400 rounded-2xl border border-slate-200">
            Nenhuma cotação encontrada.
          </div>
        ) : (
          filtered.map((quote) => {
            return (
              <div
                key={quote.id}
                className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs hover:shadow-md transition-all space-y-4 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
                      {quote.code}
                    </span>
                    {getStatusBadge(quote.status)}
                  </div>

                  <div className="mt-3 space-y-1">
                    <span className="text-xs text-slate-400 block">Solicitação Vinculada:</span>
                    <span className="text-xs font-bold text-slate-800">
                      {(quote.requestCodes || [quote.requestCode || '']).join(', ')}
                    </span>
                  </div>

                  <div className="mt-3 p-3 bg-slate-50 rounded-xl border border-slate-200/80 space-y-2 text-xs">
                    <div className="flex justify-between text-slate-600">
                      <span>Propostas Coletadas:</span>
                      <strong>{quote.proposals ? quote.proposals.length : (quote.bids ? quote.bids.length : 0)} fornecedores</strong>
                    </div>

                    {(quote.winnerSupplierName || quote.selectedSupplierId) && (
                      <div className="flex justify-between items-center text-blue-950 font-semibold pt-1 border-t border-slate-200/60">
                        <span className="flex items-center gap-1 text-[11px] text-blue-700">
                          <Award className="w-3.5 h-3.5" /> Vencedor:
                        </span>
                        <span className="truncate max-w-[140px] font-bold text-slate-900">
                          {quote.winnerSupplierName || quote.selectedSupplierId}
                        </span>
                      </div>
                    )}

                    {quote.savingAmount > 0 && (
                      <div className="flex justify-between items-center text-emerald-700 font-bold pt-1 border-t border-slate-200/60">
                        <span className="flex items-center gap-1 text-[11px]">
                          <TrendingDown className="w-3.5 h-3.5" /> Saving Obtido:
                        </span>
                        <span>R$ {quote.savingAmount.toFixed(2)}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-slate-400 block font-semibold">Valor Final:</span>
                    <span className="text-base font-black text-slate-900">
                      R$ {quote.totalAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      id={`btn-print-quote-map-card-${quote.id}`}
                      onClick={() => generateQuoteComparativeMapPdf(quote, { action: 'print' })}
                      className="p-2 text-slate-600 hover:text-blue-700 hover:bg-blue-50 rounded-xl transition border border-slate-200"
                      title="Imprimir Mapa Comparativo Oficial"
                    >
                      <Printer className="w-3.5 h-3.5" />
                    </button>
                    <button
                      id={`btn-download-pdf-quote-map-card-${quote.id}`}
                      onClick={() => generateQuoteComparativeMapPdf(quote, { action: 'download' })}
                      className="p-2 text-slate-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-xl transition border border-slate-200"
                      title="Baixar PDF Oficial do Mapa Comparativo"
                    >
                      <FileDown className="w-3.5 h-3.5" />
                    </button>
                    <button
                      id={`btn-open-quote-map-${quote.id}`}
                      onClick={() => setActiveModalQuote(quote)}
                      className="inline-flex items-center gap-1.5 px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs transition active:scale-95"
                    >
                      <Scale className="w-3.5 h-3.5" />
                      <span>Mapa de Preços</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Comparative Price Map Modal */}
      <QuoteComparativeMapModal
        quote={activeModalQuote}
        isOpen={!!activeModalQuote}
        onClose={() => setActiveModalQuote(null)}
        currentUser={currentUser}
        onSendToApproval={onSendToApproval}
      />
    </div>
  );
};
