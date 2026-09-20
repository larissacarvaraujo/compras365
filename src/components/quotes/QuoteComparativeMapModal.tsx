import React, { useState, useEffect, useMemo } from 'react';
import { Quote, SupplierProposal, SupplierProposalItem, RequestItem, User } from '../../types';
import { dbService } from '../../services/dataService';
import { generateQuoteComparativeMapPdf } from '../../utils/quoteComparativePdfGenerator';
import {
  X,
  Scale,
  Award,
  TrendingDown,
  Truck,
  CreditCard,
  Clock,
  Plus,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Printer,
  FileDown,
  Check,
  Edit3,
  Save,
  Package,
  Info,
  RefreshCw,
} from 'lucide-react';

interface QuoteComparativeMapModalProps {
  quote: Quote | null;
  isOpen: boolean;
  onClose: () => void;
  currentUser: User;
  onSendToApproval: (quoteId: string) => void;
}

export const QuoteComparativeMapModal: React.FC<QuoteComparativeMapModalProps> = (props) => {
  if (!props.isOpen || !props.quote) return null;
  return <QuoteComparativeMapModalContent {...props} quote={props.quote} />;
};

interface QuoteComparativeMapModalContentProps extends Omit<QuoteComparativeMapModalProps, 'quote'> {
  quote: Quote;
}

const QuoteComparativeMapModalContent: React.FC<QuoteComparativeMapModalContentProps> = ({
  quote,
  isOpen,
  onClose,
  currentUser,
  onSendToApproval,
}) => {

  // Resolve items: from quote.items or fallback to the associated purchase request
  const resolvedItems: RequestItem[] = useMemo(() => {
    if (quote.items && quote.items.length > 0) {
      return quote.items;
    }
    const allRequests = dbService.getRequests();
    const matchedReq = allRequests.find(
      (r) =>
        r.id === quote.requestId ||
        r.code === quote.requestCode ||
        (quote.requestCodes && quote.requestCodes.includes(r.code))
    );
    if (matchedReq && matchedReq.items && matchedReq.items.length > 0) {
      return matchedReq.items;
    }
    return [];
  }, [quote]);

  // Synchronize items back to quote if they were missing
  useEffect(() => {
    if ((!quote.items || quote.items.length === 0) && resolvedItems.length > 0) {
      quote.items = resolvedItems;
      dbService.saveQuote({ ...quote, items: resolvedItems });
    }
  }, [quote, resolvedItems]);

  const items = resolvedItems;
  const [proposals, setProposals] = useState<SupplierProposal[]>(quote.proposals || []);

  // Synchronize proposals if quote changes
  useEffect(() => {
    const rawProposals = quote.proposals || [];
    // Ensure all proposals have item records for each quote item
    const normalized = rawProposals.map((p) => {
      const propItems = [...(p.items || [])];
      items.forEach((it) => {
        const found = propItems.find((pi) => pi.itemId === it.id);
        if (!found) {
          propItems.push({
            itemId: it.id,
            description: it.description,
            quantity: it.quantity,
            unit: it.unit,
            unitPrice: 0,
            totalPrice: 0,
          });
        }
      });
      return { ...p, items: propItems };
    });
    setProposals(normalized);
  }, [quote, items]);

  const [selectedWinnerId, setSelectedWinnerId] = useState<string>(
    quote.winnerSupplierId || (quote.proposals?.[0]?.supplierId || '')
  );
  const [showAddSupplier, setShowAddSupplier] = useState(false);
  const [showAddItemModal, setShowAddItemModal] = useState(false);
  const [isEditingPrices, setIsEditingPrices] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);

  // New Supplier Form State
  const [newSupName, setNewSupName] = useState('');
  const [newSupCNPJ, setNewSupCNPJ] = useState('');
  const [newSupDelivery, setNewSupDelivery] = useState(5);
  const [newSupPayment, setNewSupPayment] = useState('28 dias');
  const [newSupFreight, setNewSupFreight] = useState<number | string>(0);
  const [newSupItemPrices, setNewSupItemPrices] = useState<Record<string, number | string>>({});

  // New Item Form State (for adding item directly to quote)
  const [newItemDesc, setNewItemDesc] = useState('');
  const [newItemQty, setNewItemQty] = useState<number | string>(1);
  const [newItemUnit, setNewItemUnit] = useState('UN');
  const [newItemEstPrice, setNewItemEstPrice] = useState<number | string>(0);

  const isBuyerOrAdmin = currentUser.role === 'buyer' || currentUser.role === 'admin';
  const canSendApproval = isBuyerOrAdmin && (quote.status === 'in_progress' || quote.status === 'draft');

  // Find lowest price per item
  const lowestPricePerItem: Record<string, number> = useMemo(() => {
    const result: Record<string, number> = {};
    items.forEach((item) => {
      let min = Infinity;
      proposals.forEach((p) => {
        const pItem = (p.items || []).find((pi) => pi.itemId === item.id);
        if (pItem && pItem.unitPrice > 0 && pItem.unitPrice < min) {
          min = pItem.unitPrice;
        }
      });
      if (min !== Infinity) {
        result[item.id] = min;
      }
    });
    return result;
  }, [items, proposals]);

  // Calculate highest vs lowest for savings
  const totals = proposals.map((p) => p.totalAmount).filter((t) => t > 0);
  const lowestTotal = totals.length > 0 ? Math.min(...totals) : 0;
  const highestTotal = totals.length > 0 ? Math.max(...totals) : 0;
  const computedSaving = highestTotal > lowestTotal ? highestTotal - lowestTotal : 0;
  const savingPercent = highestTotal > 0 ? ((computedSaving / highestTotal) * 100).toFixed(1) : '0';

  const showNotification = (msg: string) => {
    setFeedbackMessage(msg);
    setTimeout(() => setFeedbackMessage(null), 4000);
  };

  const handleSelectWinner = (supplierId: string) => {
    setSelectedWinnerId(supplierId);
    dbService.updateQuoteWinner(quote.id, supplierId);
    showNotification('Fornecedor vencedor atualizado com sucesso!');
  };

  // Inline Price change for existing proposals in matrix
  const handleItemPriceChange = (supplierId: string, itemId: string, newPriceStr: string) => {
    const priceVal = parseFloat(newPriceStr) || 0;
    const updated = proposals.map((p) => {
      if (p.supplierId !== supplierId) return p;
      const updatedItems = (p.items || []).map((pi) => {
        if (pi.itemId !== itemId) return pi;
        const qty = pi.quantity || 1;
        return {
          ...pi,
          unitPrice: priceVal,
          totalPrice: priceVal * qty,
        };
      });

      const itemsSubtotal = updatedItems.reduce((acc, it) => acc + (it.totalPrice || 0), 0);
      const freight = Number(p.freightAmount ?? p.freightCost ?? 0);
      const totalAmount = itemsSubtotal + freight;

      return {
        ...p,
        items: updatedItems,
        totalAmount,
      };
    });

    setProposals(updated);
    dbService.updateQuoteProposals(quote.id, updated);
  };

  // Inline Freight change for existing proposals in matrix
  const handleProposalFreightChange = (supplierId: string, newFreightStr: string) => {
    const freightVal = parseFloat(newFreightStr) || 0;
    const updated = proposals.map((p) => {
      if (p.supplierId !== supplierId) return p;
      const itemsSubtotal = (p.items || []).reduce((acc, it) => acc + (it.totalPrice || 0), 0);
      return {
        ...p,
        freightAmount: freightVal,
        freightCost: freightVal,
        totalAmount: itemsSubtotal + freightVal,
      };
    });

    setProposals(updated);
    dbService.updateQuoteProposals(quote.id, updated);
  };

  // Remove a proposal
  const handleRemoveProposal = (supplierId: string, supplierName: string) => {
    if (!window.confirm(`Deseja remover a proposta de "${supplierName}"?`)) return;
    const updated = proposals.filter((p) => p.supplierId !== supplierId);
    setProposals(updated);
    dbService.updateQuoteProposals(quote.id, updated);
    if (selectedWinnerId === supplierId && updated.length > 0) {
      setSelectedWinnerId(updated[0].supplierId);
      dbService.updateQuoteWinner(quote.id, updated[0].supplierId);
    }
    showNotification(`Proposta de ${supplierName} removida.`);
  };

  // Add new Proposal
  const handleAddProposal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSupName.trim()) return;

    const proposalItems: SupplierProposalItem[] = items.map((it) => {
      const uPrice = Number(newSupItemPrices[it.id]) || 0;
      return {
        itemId: it.id,
        description: it.description,
        quantity: it.quantity,
        unit: it.unit,
        unitPrice: uPrice,
        totalPrice: it.quantity * uPrice,
      };
    });

    const itemsTotal = proposalItems.reduce((acc, i) => acc + (i.totalPrice || 0), 0);
    const freightVal = Number(newSupFreight) || 0;
    const fullTotal = itemsTotal + freightVal;

    const newProposal: SupplierProposal = {
      id: 'prop-' + Date.now(),
      supplierId: 'sup-' + Date.now(),
      supplierName: newSupName.trim(),
      cnpj: newSupCNPJ.trim() || '00.000.000/0001-00',
      contactName: 'Vendas Corporativas',
      phone: '(11) 99999-0000',
      email: 'comercial@fornecedor.com.br',
      deliveryTimeDays: Number(newSupDelivery) || 5,
      paymentTerms: newSupPayment.trim() || '30 dias',
      freightAmount: freightVal,
      freightCost: freightVal,
      notes: 'Cotação cadastrada via Mapa Comparativo',
      items: proposalItems,
      totalAmount: fullTotal,
    };

    const updatedProposals = [...proposals, newProposal];
    setProposals(updatedProposals);
    dbService.updateQuoteProposals(quote.id, updatedProposals);

    // If first proposal, select as winner
    if (updatedProposals.length === 1) {
      setSelectedWinnerId(newProposal.supplierId);
      dbService.updateQuoteWinner(quote.id, newProposal.supplierId);
    }

    // Reset form
    setShowAddSupplier(false);
    setNewSupName('');
    setNewSupCNPJ('');
    setNewSupFreight(0);
    setNewSupItemPrices({});
    showNotification(`Proposta comercial de "${newProposal.supplierName}" cadastrada com sucesso!`);
  };

  // Add new Item to Quote
  const handleAddNewItemToQuote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemDesc.trim()) return;

    const qty = Number(newItemQty) || 1;
    const estPrice = Number(newItemEstPrice) || 0;
    const newItem: RequestItem = {
      id: 'item-' + Date.now(),
      description: newItemDesc.trim(),
      quantity: qty,
      unit: newItemUnit.trim().toUpperCase() || 'UN',
      estimatedUnitPrice: estPrice,
    };

    dbService.addQuoteItem(quote.id, newItem);
    if (!quote.items) quote.items = [];
    quote.items.push(newItem);

    // Update local state proposals with new item initialized to 0
    const updatedProposals = proposals.map((p) => {
      const pItems = [...(p.items || [])];
      pItems.push({
        itemId: newItem.id,
        description: newItem.description,
        quantity: newItem.quantity,
        unit: newItem.unit,
        unitPrice: 0,
        totalPrice: 0,
      });
      return { ...p, items: pItems };
    });

    setProposals(updatedProposals);
    dbService.updateQuoteProposals(quote.id, updatedProposals);

    setShowAddItemModal(false);
    setNewItemDesc('');
    setNewItemQty(1);
    setNewItemUnit('UN');
    setNewItemEstPrice(0);
    showNotification(`Item "${newItem.description}" adicionado à cotação com sucesso!`);
  };

  const handlePrint = async () => {
    setIsPrinting(true);
    try {
      generateQuoteComparativeMapPdf(quote, { action: 'print', selectedWinnerId });
      showNotification('Ordem de impressão do Mapa Comparativo gerada com sucesso.');
    } catch (err) {
      console.error('Erro ao acionar impressão do mapa:', err);
      window.print();
    } finally {
      setIsPrinting(false);
    }
  };

  const handleDownloadPdf = async () => {
    setIsDownloadingPdf(true);
    try {
      const fileName = generateQuoteComparativeMapPdf(quote, { action: 'download', selectedWinnerId });
      showNotification(`Arquivo PDF oficial baixado: ${fileName}`);
    } catch (err) {
      console.error('Erro ao gerar PDF do mapa comparativo:', err);
    } finally {
      setIsDownloadingPdf(false);
    }
  };

  // Form preview calculations
  const formItemsSubtotal = items.reduce((acc, it) => {
    const p = Number(newSupItemPrices[it.id]) || 0;
    return acc + p * it.quantity;
  }, 0);
  const formFreightTotal = Number(newSupFreight) || 0;
  const formTotalProposal = formItemsSubtotal + formFreightTotal;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/65 backdrop-blur-xs overflow-y-auto print:static print:p-0 print:bg-white print:overflow-visible">
      <div className="w-full max-w-5xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-4 print:w-full print:max-w-none print:shadow-none print:border-none print:my-0">
        
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50 print:bg-transparent">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 text-blue-700 rounded-xl print:hidden">
              <Scale className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black text-slate-900">
                  Mapa Comparativo de Cotação de Preços
                </h2>
                <span className="font-mono text-xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
                  {quote.code}
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Confronto de propostas comerciais: preços de itens, frete, prazos e apuração de savings
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 print:hidden">
            <button
              id="btn-print-quote-map-header"
              onClick={handlePrint}
              disabled={isPrinting}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 text-xs font-semibold rounded-xl border border-slate-200 shadow-2xs transition disabled:opacity-50"
              title="Imprimir Mapa Comparativo de Preços Oficial"
            >
              <Printer className="w-3.5 h-3.5 text-slate-600" />
              <span className="hidden sm:inline">{isPrinting ? 'Preparando...' : 'Imprimir'}</span>
            </button>

            <button
              id="btn-download-quote-map-pdf-header"
              onClick={handleDownloadPdf}
              disabled={isDownloadingPdf}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl shadow-2xs transition disabled:opacity-50"
              title="Baixar Arquivo PDF Oficial (A4 Paisagem)"
            >
              <FileDown className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{isDownloadingPdf ? 'Gerando...' : 'Baixar PDF'}</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-200/60"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Feedback Message Banner */}
        {feedbackMessage && (
          <div className="bg-emerald-600 text-white px-5 py-2.5 text-xs font-semibold flex items-center justify-between print:hidden">
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-200" />
              <span>{feedbackMessage}</span>
            </div>
            <button onClick={() => setFeedbackMessage(null)} className="text-emerald-100 hover:underline">
              OK
            </button>
          </div>
        )}

        {/* Body Content */}
        <div className="p-4 sm:p-6 space-y-6 max-h-[80vh] overflow-y-auto print:max-h-none print:p-0">
          
          {/* Formal Audit & Print Banner */}
          <div className="bg-slate-900 text-white p-4 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 print:hidden shadow-xs border border-slate-800">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <Printer className="w-4 h-4 text-blue-400" />
                <span className="font-bold text-sm text-white">Documento Oficial para Auditoria & Alçada de Aprovação</span>
              </div>
              <p className="text-xs text-slate-300">
                Imprima o mapa formal de cotação ou baixe o PDF em formato A4 Paisagem com detalhamento item a item, frete e saving apurado.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto shrink-0">
              <button
                id="btn-print-quote-map-hero"
                onClick={handlePrint}
                disabled={isPrinting}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-100 font-bold text-xs rounded-xl shadow-xs transition border border-slate-700 disabled:opacity-50"
              >
                <Printer className="w-4 h-4 text-blue-400" />
                <span>{isPrinting ? 'Enviando...' : 'Imprimir Mapa'}</span>
              </button>
              <button
                id="btn-download-quote-map-pdf-hero"
                onClick={handleDownloadPdf}
                disabled={isDownloadingPdf}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-blue-500 hover:bg-blue-400 text-slate-950 font-bold text-xs rounded-xl shadow-xs transition disabled:opacity-50"
              >
                <FileDown className="w-4 h-4 text-slate-950" />
                <span>{isDownloadingPdf ? 'Gerando...' : 'Baixar PDF Oficial'}</span>
              </button>
            </div>
          </div>

          {/* Warning if Quote has No Items */}
          {items.length === 0 && (
            <div className="p-4 bg-amber-50 border border-amber-300 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-amber-900">
              <div className="flex items-start gap-2.5">
                <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div className="text-xs">
                  <p className="font-bold text-sm text-amber-950">Nenhum item vinculado a esta cotação</p>
                  <p className="text-amber-800">
                    Para preencher a planilha comparativa com preços unitários além do frete, adicione os itens a serem cotados.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowAddItemModal(true)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl shadow-xs transition shrink-0"
              >
                <Plus className="w-4 h-4" />
                <span>Adicionar Item para Cotação</span>
              </button>
            </div>
          )}

          {/* Savings Metric Ribbon */}
          {proposals.length > 1 && (
            <div className="bg-gradient-to-r from-emerald-600 to-teal-700 text-white p-4 rounded-2xl shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-white/20 rounded-xl backdrop-blur-xs">
                  <TrendingDown className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-xs font-semibold text-emerald-100 uppercase tracking-wider block">
                    Economia Estimada (Saving Apurado)
                  </span>
                  <span className="text-xl sm:text-2xl font-black">
                    R$ {computedSaving.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
              <div className="sm:text-right">
                <span className="text-xs text-emerald-100 block">Diferencial competitivo</span>
                <span className="text-base font-bold bg-white/20 px-2.5 py-0.5 rounded-lg inline-block mt-0.5">
                  {savingPercent}% menor em relação à maior cotação
                </span>
              </div>
            </div>
          )}

          {/* Supplier Proposals Summary Cards */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Propostas Comerciais Coletadas ({proposals.length} fornecedores)
              </span>
              <span className="text-[11px] text-slate-500">
                Clique no cartão para selecionar o fornecedor vencedor
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {proposals.map((prop: SupplierProposal) => {
                const isWinner = selectedWinnerId === prop.supplierId;
                const freight = prop.freightAmount ?? prop.freightCost ?? 0;
                const itemsSubtotal = (prop.items || []).reduce(
                  (acc, it) => acc + (it.totalPrice || (it.unitPrice || 0) * (it.quantity || 1)),
                  0
                );

                return (
                  <div
                    key={prop.id}
                    onClick={() => handleSelectWinner(prop.supplierId)}
                    className={`p-4 rounded-2xl border transition-all cursor-pointer relative flex flex-col justify-between ${
                      isWinner
                        ? 'bg-blue-50/70 border-blue-500 shadow-md ring-2 ring-blue-500/20'
                        : 'bg-white border-slate-200 hover:border-slate-300 shadow-2xs'
                    }`}
                  >
                    {isWinner && (
                      <span className="absolute -top-2.5 right-4 bg-blue-600 text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1 shadow-xs">
                        <Award className="w-3 h-3" /> Fornecedor Vencedor
                      </span>
                    )}

                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-bold text-sm text-slate-900 truncate pr-6" title={prop.supplierName}>
                          {prop.supplierName}
                        </h3>
                        <CheckCircle2
                          className={`w-4 h-4 shrink-0 ${isWinner ? 'text-blue-600' : 'text-slate-300'}`}
                        />
                      </div>

                      <div className="space-y-1.5 text-xs text-slate-600 mb-3">
                        <div className="flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>Prazo: <strong>{prop.deliveryTimeDays || prop.deliveryDays || 5} dias úteis</strong></span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <CreditCard className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>Condição: <strong>{prop.paymentTerms || '30 dias'}</strong></span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Package className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>
                            Subtotal Itens: <strong>R$ {itemsSubtotal.toFixed(2)}</strong>
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Truck className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>
                            Frete: <strong>{freight === 0 ? 'CIF (Grátis)' : `FOB R$ ${freight.toFixed(2)}`}</strong>
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-200/80 flex items-center justify-between">
                      <div>
                        <span className="text-[10px] text-slate-400 block font-semibold">Valor Total Proposta:</span>
                        <span className="text-base font-black text-slate-900">
                          R$ {prop.totalAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </span>
                      </div>

                      {isBuyerOrAdmin && proposals.length > 1 && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRemoveProposal(prop.supplierId, prop.supplierName);
                          }}
                          className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                          title="Remover Proposta"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Add Proposal Button / Form */}
          {isBuyerOrAdmin && (
            <div>
              {!showAddSupplier ? (
                <div className="flex flex-col sm:flex-row items-center gap-2 print:hidden">
                  <button
                    onClick={() => setShowAddSupplier(true)}
                    className="flex-1 w-full py-2.5 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-bold rounded-xl border border-dashed border-slate-300 transition flex items-center justify-center gap-1.5"
                  >
                    <Plus className="w-4 h-4 text-indigo-600" />
                    <span>Cadastrar Proposta de Mais um Fornecedor</span>
                  </button>

                  <button
                    onClick={() => setShowAddItemModal(true)}
                    className="w-full sm:w-auto px-4 py-2.5 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-semibold rounded-xl border border-dashed border-slate-300 transition flex items-center justify-center gap-1.5"
                  >
                    <Package className="w-4 h-4 text-emerald-600" />
                    <span>Adicionar Item à Cotação</span>
                  </button>
                </div>
              ) : (
                <form
                  onSubmit={handleAddProposal}
                  className="p-4 sm:p-5 bg-slate-50 border border-slate-300 rounded-2xl space-y-4 print:hidden"
                >
                  <div className="flex items-center justify-between border-b border-slate-200 pb-2.5">
                    <div className="flex items-center gap-2">
                      <Plus className="w-4 h-4 text-indigo-600" />
                      <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                        Lançar Nova Proposta de Fornecedor (Itens + Frete)
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowAddSupplier(false)}
                      className="text-xs text-slate-500 hover:text-slate-800 font-medium"
                    >
                      Cancelar
                    </button>
                  </div>

                  {/* Supplier Info */}
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                    <div className="sm:col-span-2">
                      <label className="text-[11px] font-bold text-slate-700 block mb-1">
                        Razão Social / Nome Fantasia *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="Ex: Kalunga Comércio e Indústria Gráfica Ltda"
                        value={newSupName}
                        onChange={(e) => setNewSupName(e.target.value)}
                        className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-bold text-slate-700 block mb-1">
                        CNPJ do Fornecedor
                      </label>
                      <input
                        type="text"
                        placeholder="00.000.000/0001-00"
                        value={newSupCNPJ}
                        onChange={(e) => setNewSupCNPJ(e.target.value)}
                        className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-bold text-slate-700 block mb-1">
                        Prazo de Entrega (dias úteis)
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={newSupDelivery}
                        onChange={(e) => setNewSupDelivery(Number(e.target.value))}
                        className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] font-bold text-slate-700 block mb-1">
                        Condição de Pagamento
                      </label>
                      <input
                        type="text"
                        placeholder="Ex: 28 dias / À vista / 30/60 dias"
                        value={newSupPayment}
                        onChange={(e) => setNewSupPayment(e.target.value)}
                        className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-bold text-slate-700 block mb-1 flex items-center justify-between">
                        <span>Valor do Frete (R$)</span>
                        <span className="text-[10px] text-slate-500 font-normal">Digite 0 para Frete CIF (Grátis)</span>
                      </label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">R$</span>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={newSupFreight}
                          onChange={(e) => setNewSupFreight(e.target.value)}
                          className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-hidden font-semibold"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Item Prices Section */}
                  <div className="space-y-2 pt-2 border-t border-slate-200">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                        <Package className="w-4 h-4 text-blue-600" />
                        Preços Unitários por Item a Cotar:
                      </span>
                      <span className="text-[11px] text-slate-500">
                        Informe o valor unitário que o fornecedor cobrou em cada item
                      </span>
                    </div>

                    {items.length === 0 ? (
                      <div className="p-3 bg-white border border-slate-200 rounded-xl text-center text-xs text-slate-500">
                        Nenhum item cadastrado nesta cotação.{' '}
                        <button
                          type="button"
                          onClick={() => setShowAddItemModal(true)}
                          className="text-blue-600 font-bold underline hover:text-blue-800"
                        >
                          Adicionar Item agora
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                        {items.map((it: RequestItem) => {
                          const unitPrice = Number(newSupItemPrices[it.id]) || 0;
                          const subtotal = unitPrice * it.quantity;

                          return (
                            <div
                              key={it.id}
                              className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs bg-white p-3 rounded-xl border border-slate-200 shadow-2xs"
                            >
                              <div className="flex-1">
                                <span className="font-bold text-slate-900 block">{it.description}</span>
                                <span className="text-[11px] text-slate-500">
                                  Quantidade necessária:{' '}
                                  <strong className="text-slate-700 font-semibold">
                                    {it.quantity} {it.unit}
                                  </strong>
                                  {it.estimatedUnitPrice ? ` • Estimado: R$ ${it.estimatedUnitPrice.toFixed(2)}/un` : ''}
                                </span>
                              </div>

                              <div className="flex items-center gap-3">
                                <div className="flex items-center gap-1.5">
                                  <span className="text-slate-500 text-xs font-medium">Preço Unit.:</span>
                                  <div className="relative">
                                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">R$</span>
                                    <input
                                      type="number"
                                      step="0.01"
                                      min="0"
                                      required
                                      placeholder="0.00"
                                      value={newSupItemPrices[it.id] ?? ''}
                                      onChange={(e) =>
                                        setNewSupItemPrices({
                                          ...newSupItemPrices,
                                          [it.id]: e.target.value,
                                        })
                                      }
                                      className="w-28 pl-8 pr-2.5 py-1.5 text-xs font-bold text-slate-800 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                                    />
                                  </div>
                                </div>

                                <div className="min-w-[100px] text-right">
                                  <span className="text-[10px] text-slate-400 block font-semibold">Subtotal:</span>
                                  <span className="text-xs font-bold text-slate-900">
                                    R$ {subtotal.toFixed(2)}
                                  </span>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Proposal Totals Breakdown */}
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs">
                    <div className="flex items-center gap-4 text-slate-700">
                      <span>
                        Soma dos Itens: <strong>R$ {formItemsSubtotal.toFixed(2)}</strong>
                      </span>
                      <span>+</span>
                      <span>
                        Frete:{' '}
                        <strong>{formFreightTotal === 0 ? 'R$ 0,00 (CIF)' : `R$ ${formFreightTotal.toFixed(2)}`}</strong>
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-slate-600">Total desta Proposta:</span>
                      <span className="text-sm font-black text-blue-950 bg-white px-3 py-1 rounded-lg border border-blue-200 shadow-2xs">
                        R$ {formTotalProposal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  </div>

                  {/* Form Actions */}
                  <div className="pt-2 flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setShowAddSupplier(false)}
                      className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200 rounded-xl"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs transition active:scale-95 flex items-center gap-1.5"
                    >
                      <Save className="w-3.5 h-3.5" />
                      <span>Salvar Proposta do Fornecedor</span>
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}

          {/* Matrix of items across suppliers */}
          <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-2xs bg-white">
            <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Scale className="w-4 h-4 text-slate-700" />
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Matriz Comparativa Item a Item & Frete
                </h4>
              </div>

              <div className="flex items-center gap-2 print:hidden">
                <span className="text-[11px] text-emerald-700 font-medium bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md hidden md:inline">
                  ★ Menor preço unitário em verde
                </span>

                {isBuyerOrAdmin && proposals.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setIsEditingPrices(!isEditingPrices)}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl border transition shadow-2xs ${
                      isEditingPrices
                        ? 'bg-emerald-600 text-white border-emerald-700'
                        : 'bg-white text-slate-700 hover:bg-slate-100 border-slate-200'
                    }`}
                    title="Permite alterar os preços dos itens e fretes diretamente na tabela"
                  >
                    {isEditingPrices ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>Concluir Edição</span>
                      </>
                    ) : (
                      <>
                        <Edit3 className="w-3.5 h-3.5 text-blue-600" />
                        <span>Editar Preços na Tabela</span>
                      </>
                    )}
                  </button>
                )}

                {isBuyerOrAdmin && (
                  <button
                    type="button"
                    onClick={() => setShowAddItemModal(true)}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl transition"
                    title="Adicionar Item"
                  >
                    <Plus className="w-3.5 h-3.5 text-indigo-600" />
                    <span>+ Item</span>
                  </button>
                )}
              </div>
            </div>

            {isEditingPrices && (
              <div className="p-3 bg-amber-50 border-b border-amber-200 text-xs text-amber-900 flex items-center justify-between print:hidden">
                <div className="flex items-center gap-2">
                  <Info className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>
                    <strong>Modo de Edição Rápida Ativo:</strong> Digite o novo preço unitário ou frete nas células. Os subtotais e savings são recalculados e salvos em tempo real!
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsEditingPrices(false)}
                  className="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-lg text-[11px]"
                >
                  Concluir
                </button>
              </div>
            )}

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-100 text-slate-600 font-bold uppercase tracking-wider text-[10px] border-b border-slate-200">
                  <tr>
                    <th className="p-3 min-w-[200px]">Descrição do Item</th>
                    <th className="p-3 text-center min-w-[70px]">Qtd</th>
                    {proposals.map((p: SupplierProposal) => (
                      <th
                        key={p.id}
                        className={`p-3 text-right min-w-[150px] ${
                          selectedWinnerId === p.supplierId ? 'bg-blue-100/70 text-blue-900' : ''
                        }`}
                      >
                        <div className="flex items-center justify-end gap-1">
                          {selectedWinnerId === p.supplierId && <Award className="w-3.5 h-3.5 text-blue-700 shrink-0" />}
                          <span className="truncate">{p.supplierName}</span>
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {items.length === 0 ? (
                    <tr>
                      <td colSpan={2 + proposals.length} className="p-8 text-center text-slate-400">
                        Nenhum item cadastrado para cotação.{' '}
                        <button
                          type="button"
                          onClick={() => setShowAddItemModal(true)}
                          className="text-blue-600 underline font-semibold ml-1"
                        >
                          Adicionar primeiro item
                        </button>
                      </td>
                    </tr>
                  ) : (
                    items.map((item: RequestItem) => {
                      const minPrice = lowestPricePerItem[item.id];

                      return (
                        <tr key={item.id} className="hover:bg-slate-50/50">
                          <td className="p-3 font-semibold text-slate-800">
                            <div>{item.description}</div>
                            {item.estimatedUnitPrice ? (
                              <div className="text-[10px] text-slate-400 font-normal">
                                Estimado: R$ {item.estimatedUnitPrice.toFixed(2)}/un
                              </div>
                            ) : null}
                          </td>
                          <td className="p-3 text-center text-slate-600 font-medium whitespace-nowrap">
                            {item.quantity} {item.unit}
                          </td>

                          {proposals.map((p: SupplierProposal) => {
                            const pItem = p.items?.find((pi: SupplierProposalItem) => pi.itemId === item.id);
                            const uPrice = pItem ? pItem.unitPrice : 0;
                            const isLowest = uPrice > 0 && uPrice === minPrice;
                            const isWinnerColumn = selectedWinnerId === p.supplierId;
                            const subtotal = uPrice * item.quantity;

                            return (
                              <td
                                key={p.id}
                                className={`p-3 text-right ${isWinnerColumn ? 'bg-blue-50/40' : ''}`}
                              >
                                {isEditingPrices ? (
                                  <div className="flex flex-col items-end gap-1">
                                    <div className="relative w-28">
                                      <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-400">
                                        R$
                                      </span>
                                      <input
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        value={uPrice || ''}
                                        onChange={(e) =>
                                          handleItemPriceChange(p.supplierId, item.id, e.target.value)
                                        }
                                        placeholder="0.00"
                                        className="w-full pl-7 pr-2 py-1 text-right text-xs font-bold border border-slate-300 rounded focus:ring-1 focus:ring-indigo-500 bg-white"
                                      />
                                    </div>
                                    <span className="text-[10px] text-slate-500">
                                      Sub: R$ {subtotal.toFixed(2)}
                                    </span>
                                  </div>
                                ) : (
                                  <div className="flex flex-col items-end">
                                    <span
                                      className={`font-bold ${
                                        isLowest
                                          ? 'text-emerald-700 bg-emerald-100/70 px-1.5 py-0.5 rounded shadow-2xs'
                                          : 'text-slate-800'
                                      }`}
                                    >
                                      R$ {uPrice.toFixed(2)}
                                    </span>
                                    <span className="text-[10px] text-slate-400">
                                      Sub: R$ {subtotal.toFixed(2)}
                                    </span>
                                  </div>
                                )}
                              </td>
                            );
                          })}
                        </tr>
                      );
                    })
                  )}
                </tbody>

                {/* Subtotal of Items Row */}
                <tfoot className="divide-y divide-slate-200 border-t-2 border-slate-200 bg-slate-50">
                  <tr className="bg-slate-50/80">
                    <td colSpan={2} className="p-3 text-slate-700 font-bold uppercase tracking-wider text-[11px]">
                      Subtotal dos Itens (Produtos)
                    </td>
                    {proposals.map((p: SupplierProposal) => {
                      const itemsSub = (p.items || []).reduce(
                        (acc, it) => acc + (it.totalPrice || (it.unitPrice || 0) * (it.quantity || 1)),
                        0
                      );
                      return (
                        <td
                          key={p.id}
                          className={`p-3 text-right font-bold text-slate-700 ${
                            selectedWinnerId === p.supplierId ? 'bg-blue-50/60' : ''
                          }`}
                        >
                          R$ {itemsSub.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </td>
                      );
                    })}
                  </tr>

                  {/* Freight Row */}
                  <tr className="bg-slate-50/80">
                    <td colSpan={2} className="p-3 text-slate-700 font-bold uppercase tracking-wider text-[11px]">
                      Valor do Frete (CIF / FOB)
                    </td>
                    {proposals.map((p: SupplierProposal) => {
                      const freight = Number(p.freightAmount ?? p.freightCost ?? 0);
                      return (
                        <td
                          key={p.id}
                          className={`p-3 text-right font-semibold text-slate-600 ${
                            selectedWinnerId === p.supplierId ? 'bg-blue-50/60' : ''
                          }`}
                        >
                          {isEditingPrices ? (
                            <div className="relative inline-block w-28">
                              <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-400">
                                R$
                              </span>
                              <input
                                type="number"
                                step="0.01"
                                min="0"
                                value={freight || ''}
                                onChange={(e) => handleProposalFreightChange(p.supplierId, e.target.value)}
                                placeholder="0.00"
                                className="w-full pl-7 pr-2 py-1 text-right text-xs font-bold border border-slate-300 rounded focus:ring-1 focus:ring-indigo-500 bg-white"
                              />
                            </div>
                          ) : freight === 0 ? (
                            <span className="text-emerald-700 font-bold">R$ 0,00 (CIF)</span>
                          ) : (
                            <span>FOB R$ {freight.toFixed(2)}</span>
                          )}
                        </td>
                      );
                    })}
                  </tr>

                  {/* Grand Total Row */}
                  <tr className="bg-slate-100 font-bold">
                    <td colSpan={2} className="p-3 text-slate-900 font-black uppercase tracking-wider text-xs">
                      Valor Total Proposta (Itens + Frete)
                    </td>
                    {proposals.map((p: SupplierProposal) => {
                      const isWinner = selectedWinnerId === p.supplierId;
                      return (
                        <td
                          key={p.id}
                          className={`p-3 text-right text-sm ${
                            isWinner
                              ? 'bg-blue-600 text-white font-black shadow-xs'
                              : 'text-slate-900'
                          }`}
                        >
                          R$ {p.totalAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </td>
                      );
                    })}
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* Formal Audit Signatures (Visible on Native Browser Print) */}
          <div className="hidden print:block mt-8 pt-6 border-t-2 border-slate-300">
            <h5 className="text-[11px] font-bold text-slate-900 uppercase tracking-wider mb-8">
              Homologação do Processo de Compras & Assinaturas
            </h5>
            <div className="grid grid-cols-3 gap-6 text-center text-xs">
              <div className="border-t border-slate-400 pt-2">
                <p className="font-bold text-slate-900">Comprador Responsável</p>
                <p className="text-[10px] text-slate-500">Depto. de Compras & Suprimentos</p>
              </div>
              <div className="border-t border-slate-400 pt-2">
                <p className="font-bold text-slate-900">Gestor da Área Solicitante</p>
                <p className="text-[10px] text-slate-500">Validação Técnica das Especificações</p>
              </div>
              <div className="border-t border-slate-400 pt-2">
                <p className="font-bold text-slate-900">Diretoria / Alçada de Aprovação</p>
                <p className="text-[10px] text-slate-500">Homologação Comercial do Fornecedor</p>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3 border-t border-slate-200 bg-slate-50 flex flex-col sm:flex-row items-center justify-between gap-3 print:hidden">
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500">Status da Cotação:</span>
            <span className="font-bold text-xs text-blue-700 bg-blue-100 px-2.5 py-0.5 rounded-full uppercase">
              {quote.status}
            </span>
            {selectedWinnerId && (
              <span className="text-xs text-slate-600 hidden sm:inline">
                • Vencedor selecionado:{' '}
                <strong>
                  {proposals.find((p) => p.supplierId === selectedWinnerId)?.supplierName || selectedWinnerId}
                </strong>
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              id="btn-print-quote-map-footer"
              onClick={handlePrint}
              disabled={isPrinting}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl transition shadow-2xs disabled:opacity-50"
              title="Imprimir Mapa Comparativo Oficial"
            >
              <Printer className="w-3.5 h-3.5 text-slate-600" />
              <span>{isPrinting ? 'Imprimindo...' : 'Imprimir Mapa'}</span>
            </button>

            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200 rounded-xl transition"
            >
              Fechar
            </button>

            {canSendApproval && (
              <button
                onClick={() => {
                  onSendToApproval(quote.id);
                  onClose();
                }}
                className="px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs transition active:scale-95 flex items-center gap-2"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Enviar para Aprovação de Alçada</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Sub-modal: Add New Item directly to Quote */}
      {showAddItemModal && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-3 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-slate-200 p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2.5">
              <div className="flex items-center gap-2">
                <Package className="w-4 h-4 text-indigo-600" />
                <h3 className="font-bold text-sm text-slate-900">Adicionar Item à Cotação</h3>
              </div>
              <button
                onClick={() => setShowAddItemModal(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddNewItemToQuote} className="space-y-3">
              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">
                  Descrição do Item / Material *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Teclado e Mouse Sem Fio ABNT2"
                  value={newItemDesc}
                  onChange={(e) => setNewItemDesc(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">
                    Quantidade *
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={newItemQty}
                    onChange={(e) => setNewItemQty(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">
                    Unidade de Medida
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="UN, CX, KG, PC"
                    value={newItemUnit}
                    onChange={(e) => setNewItemUnit(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">
                  Preço Unitário Estimado (R$ Opcional)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  value={newItemEstPrice}
                  onChange={(e) => setNewItemEstPrice(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowAddItemModal(false)}
                  className="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs"
                >
                  Incluir Item
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
