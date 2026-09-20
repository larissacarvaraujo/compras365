import { jsPDF } from 'jspdf';
import { Quote, SupplierProposal, RequestItem, SupplierProposalItem } from '../types';
import { dbService } from '../services/dataService';

export interface GenerateQuoteMapOptions {
  action?: 'print' | 'download' | 'preview';
  selectedWinnerId?: string;
}

/**
 * Generates an official, formal Landscape PDF Comparative Price Map (Mapa Comparativo de Cotação de Preços)
 * for audit, compliance, and multi-supplier board approval.
 */
export function generateQuoteComparativeMapPdf(
  quote: Quote,
  options: GenerateQuoteMapOptions = {}
): string {
  const { action = 'download', selectedWinnerId = quote.winnerSupplierId } = options;

  // A4 Landscape: 297mm width, 210mm height
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = 297;
  const pageHeight = 210;
  const marginX = 12;
  const usableWidth = pageWidth - marginX * 2; // 273mm
  let cursorY = 10;

  const quoteCode = quote.code || 'COT-2026-000';
  const issueDate = quote.createdAt
    ? new Date(quote.createdAt).toLocaleDateString('pt-BR')
    : new Date().toLocaleDateString('pt-BR');
  const proposals = quote.proposals || [];
  let items = quote.items || [];
  if (items.length === 0) {
    const allRequests = dbService.getRequests();
    const matchedReq = allRequests.find(
      (r) => r.id === quote.requestId || r.code === quote.requestCode || (quote.requestCodes && quote.requestCodes.includes(r.code))
    );
    if (matchedReq && matchedReq.items && matchedReq.items.length > 0) {
      items = matchedReq.items;
    }
  }

  // Lowest price lookup per item
  const lowestPricePerItem: Record<string, number> = {};
  items.forEach((item) => {
    let min = Infinity;
    proposals.forEach((p) => {
      const pItem = p.items.find((pi) => pi.itemId === item.id);
      if (pItem && pItem.unitPrice > 0 && pItem.unitPrice < min) {
        min = pItem.unitPrice;
      }
    });
    if (min !== Infinity) {
      lowestPricePerItem[item.id] = min;
    }
  });

  // Calculate totals and savings
  const totals = proposals.map((p) => p.totalAmount).filter((t) => t > 0);
  const lowestTotal = totals.length > 0 ? Math.min(...totals) : 0;
  const highestTotal = totals.length > 0 ? Math.max(...totals) : 0;
  const savingAmount = highestTotal > lowestTotal ? highestTotal - lowestTotal : 0;
  const savingPercent = highestTotal > 0 ? ((savingAmount / highestTotal) * 100).toFixed(1) : '0.0';

  // Winner proposal
  const winnerProposal = proposals.find((p) => p.supplierId === selectedWinnerId) || proposals[0];

  // Helper for page break
  const checkPageBreak = (neededHeight: number) => {
    if (cursorY + neededHeight > pageHeight - 16) {
      doc.addPage();
      cursorY = 12;
      drawMiniHeader();
    }
  };

  const drawMiniHeader = () => {
    doc.setFillColor(248, 250, 252);
    doc.rect(marginX, cursorY, usableWidth, 7, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(51, 65, 85);
    doc.text(`COMPRAS365 S/A - MAPA COMPARATIVO ${quoteCode} (Continuação)`, marginX + 3, cursorY + 4.8);
    doc.text(`Data: ${issueDate}`, marginX + usableWidth - 3, cursorY + 4.8, { align: 'right' });
    cursorY += 10;
  };

  // --- HEADER SECTION ---
  // Background Header Box
  doc.setFillColor(15, 23, 42); // slate-900
  doc.rect(marginX, cursorY, usableWidth, 19, 'F');

  // Brand Logo Tag
  doc.setFillColor(37, 99, 235); // blue-600
  doc.roundedRect(marginX + 3, cursorY + 2.5, 14, 14, 1.5, 1.5, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text('C365', marginX + 10, cursorY + 11.5, { align: 'center' });

  // Company and Document Title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(255, 255, 255);
  doc.text('COMPRAS365 S/A', marginX + 21, cursorY + 8);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(148, 163, 184); // slate-400
  doc.text('SISTEMA CORPORATIVO DE GESTÃO DE COMPRAS E SUPRIMENTOS', marginX + 21, cursorY + 13.5);

  // Center / Right Title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(255, 255, 255);
  doc.text('MAPA COMPARATIVO DE COTAÇÃO DE PREÇOS', marginX + usableWidth - 4, cursorY + 7.5, { align: 'right' });

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(147, 197, 253); // blue-300
  const reqList = (quote.requestCodes || (quote.requestCode ? [quote.requestCode] : [])).join(', ') || 'N/A';
  doc.text(`Cotação: ${quoteCode} | Solicitação: ${reqList} | Emissão: ${issueDate}`, marginX + usableWidth - 4, cursorY + 13.5, {
    align: 'right',
  });

  cursorY += 21;

  // --- EXECUTIVE SUMMARY CARDS RIBBON ---
  const cardWidth = (usableWidth - 6) / 3;
  const cardHeight = 15;

  // Card 1: Saving Total
  doc.setFillColor(236, 253, 245); // emerald-50
  doc.setDrawColor(167, 243, 208); // emerald-200
  doc.roundedRect(marginX, cursorY, cardWidth, cardHeight, 1.5, 1.5, 'FD');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(4, 120, 87); // emerald-700
  doc.text('ECONOMIA ESTIMADA (SAVING APURADO)', marginX + 3, cursorY + 4.5);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(6, 95, 70); // emerald-800
  doc.text(`R$ ${savingAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} (${savingPercent}%)`, marginX + 3, cursorY + 11.5);

  // Card 2: Winner Supplier
  doc.setFillColor(239, 246, 255); // blue-50
  doc.setDrawColor(191, 219, 254); // blue-200
  doc.roundedRect(marginX + cardWidth + 3, cursorY, cardWidth, cardHeight, 1.5, 1.5, 'FD');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(29, 78, 216); // blue-700
  doc.text('FORNECEDOR VENCEDOR / HOMOLOGADO', marginX + cardWidth + 6, cursorY + 4.5);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(30, 58, 138); // blue-900
  const winnerName = winnerProposal?.supplierName || quote.winnerSupplierName || 'A definir';
  doc.text(winnerName.substring(0, 32), marginX + cardWidth + 6, cursorY + 11);

  // Card 3: Scope / Status
  doc.setFillColor(248, 250, 252); // slate-50
  doc.setDrawColor(226, 232, 240); // slate-200
  doc.roundedRect(marginX + (cardWidth * 2) + 6, cursorY, cardWidth, cardHeight, 1.5, 1.5, 'FD');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(71, 85, 105); // slate-600
  doc.text('ESCOPO DE AVALIAÇÃO', marginX + (cardWidth * 2) + 9, cursorY + 4.5);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(15, 23, 42);
  const statusLabel =
    quote.status === 'approved'
      ? 'Aprovada'
      : quote.status === 'pending_approval'
      ? 'Aguardando Aprovação'
      : quote.status === 'converted_to_order'
      ? 'Pedido Gerado'
      : 'Em Andamento';
  doc.text(`${items.length} Itens Cotados • ${proposals.length} Fornecedores • Status: ${statusLabel}`, marginX + (cardWidth * 2) + 9, cursorY + 11);

  cursorY += 18;

  // --- SUPPLIERS COMMERCIAL COMPARISON BOXES ---
  checkPageBreak(25);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(30, 41, 59);
  doc.text('1. RESUMO COMERCIAL DAS PROPOSTAS RECEBIDAS', marginX, cursorY + 3);
  cursorY += 5;

  const supCount = Math.max(proposals.length, 1);
  const supColWidth = (usableWidth - (supCount - 1) * 3) / supCount;
  const supBoxHeight = 22;

  proposals.forEach((prop, idx) => {
    const x = marginX + idx * (supColWidth + 3);
    const isWinner = prop.supplierId === (winnerProposal?.supplierId || selectedWinnerId);

    if (isWinner) {
      doc.setFillColor(238, 242, 255); // indigo-50
      doc.setDrawColor(99, 102, 241); // indigo-500
      doc.setLineWidth(0.5);
    } else {
      doc.setFillColor(255, 255, 255);
      doc.setDrawColor(226, 232, 240);
      doc.setLineWidth(0.2);
    }

    doc.roundedRect(x, cursorY, supColWidth, supBoxHeight, 1.5, 1.5, 'FD');

    // Supplier Name
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(15, 23, 42);
    const sName = prop.supplierName.length > 28 ? prop.supplierName.substring(0, 26) + '...' : prop.supplierName;
    doc.text(sName, x + 2.5, cursorY + 4);

    if (isWinner) {
      doc.setFillColor(79, 70, 229);
      doc.roundedRect(x + supColWidth - 22, cursorY + 1.5, 20, 3.8, 1, 1, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(5.5);
      doc.setTextColor(255, 255, 255);
      doc.text('★ VENCEDOR', x + supColWidth - 12, cursorY + 4.2, { align: 'center' });
    }

    // CNPJ & Commercial details
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.8);
    doc.setTextColor(71, 85, 105);
    doc.text(`CNPJ: ${prop.cnpj || 'Não informado'}`, x + 2.5, cursorY + 8);
    doc.text(`Prazo Entrega: ${prop.deliveryTimeDays || prop.deliveryDays || 5} dias úteis`, x + 2.5, cursorY + 11.5);
    doc.text(`Condição Pgto: ${prop.paymentTerms || 'A combinar'}`, x + 2.5, cursorY + 15);

    const freightVal = prop.freightAmount ?? prop.freightCost ?? 0;
    const freightLabel = freightVal === 0 ? 'Frete CIF (Incluso)' : `Frete FOB R$ ${freightVal.toFixed(2)}`;
    doc.text(freightLabel, x + 2.5, cursorY + 18.5);

    // Total Amount highlight in box
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(isWinner ? 67 : 15, isWinner ? 56 : 23, isWinner ? 202 : 42);
    doc.text(`Total: R$ ${prop.totalAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, x + supColWidth - 2.5, cursorY + 18.5, {
      align: 'right',
    });
  });

  cursorY += supBoxHeight + 5;

  // --- ITEM BY ITEM COMPARATIVE MATRIX ---
  checkPageBreak(40);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(30, 41, 59);
  doc.text('2. MATRIZ COMPARATIVA ITEM A ITEM (VALOR UNITÁRIO & SUBTOTAL)', marginX, cursorY + 3);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(100, 116, 139);
  doc.text('* Menor preço unitário apurado destacado em verde', marginX + usableWidth, cursorY + 3, { align: 'right' });
  cursorY += 5;

  // Table Column Layout
  const itemDescWidth = 75;
  const itemQtyWidth = 18;
  const remainingTableWidth = usableWidth - (itemDescWidth + itemQtyWidth);
  const colPerSup = remainingTableWidth / supCount;

  // Matrix Table Header
  doc.setFillColor(30, 41, 59); // slate-800
  doc.rect(marginX, cursorY, usableWidth, 7, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(255, 255, 255);
  doc.text('DESCRIÇÃO DO ITEM / ESPECIFICAÇÃO', marginX + 2.5, cursorY + 4.8);
  doc.text('QTD / UNID', marginX + itemDescWidth + itemQtyWidth / 2, cursorY + 4.8, { align: 'center' });

  proposals.forEach((p, idx) => {
    const colX = marginX + itemDescWidth + itemQtyWidth + idx * colPerSup;
    const isWinner = p.supplierId === (winnerProposal?.supplierId || selectedWinnerId);
    if (isWinner) {
      doc.setFillColor(59, 130, 246); // highlight header for winner
      doc.rect(colX, cursorY, colPerSup, 7, 'F');
      doc.setTextColor(255, 255, 255);
    } else {
      doc.setTextColor(241, 245, 249);
    }
    const headerTitle = p.supplierName.length > 18 ? p.supplierName.substring(0, 16) + '...' : p.supplierName;
    doc.text(headerTitle, colX + colPerSup / 2, cursorY + 4.8, { align: 'center' });
  });

  cursorY += 7;

  // Matrix Rows
  items.forEach((item, rowIdx) => {
    checkPageBreak(11);
    const rowHeight = 9;
    const isEven = rowIdx % 2 === 0;

    doc.setFillColor(isEven ? 255 : 248, isEven ? 255 : 250, isEven ? 255 : 252);
    doc.rect(marginX, cursorY, usableWidth, rowHeight, 'F');
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.15);
    doc.line(marginX, cursorY + rowHeight, marginX + usableWidth, cursorY + rowHeight);

    // Item description
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.2);
    doc.setTextColor(30, 41, 59);
    const descText = item.description.length > 44 ? item.description.substring(0, 42) + '...' : item.description;
    doc.text(descText, marginX + 2.5, cursorY + 4.2);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.2);
    doc.setTextColor(100, 116, 139);
    doc.text(`Cód: ${item.id.substring(0, 8)}`, marginX + 2.5, cursorY + 7.5);

    // Qty / Unit
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.2);
    doc.setTextColor(15, 23, 42);
    doc.text(`${item.quantity} ${item.unit}`, marginX + itemDescWidth + itemQtyWidth / 2, cursorY + 5.5, { align: 'center' });

    const minPrice = lowestPricePerItem[item.id];

    // Proposal values
    proposals.forEach((p, idx) => {
      const colX = marginX + itemDescWidth + itemQtyWidth + idx * colPerSup;
      const pItem = p.items.find((pi: SupplierProposalItem) => pi.itemId === item.id);
      const uPrice = pItem ? pItem.unitPrice : 0;
      const isLowest = uPrice > 0 && uPrice === minPrice;
      const isWinnerCol = p.supplierId === (winnerProposal?.supplierId || selectedWinnerId);

      if (isWinnerCol) {
        doc.setFillColor(241, 245, 249, 0.4);
        doc.rect(colX, cursorY, colPerSup, rowHeight, 'F');
      }

      if (isLowest) {
        doc.setFillColor(220, 252, 231); // emerald-100
        doc.roundedRect(colX + colPerSup - 25, cursorY + 1.2, 23, 4.2, 1, 1, 'F');
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(6.8);
        doc.setTextColor(22, 101, 52); // emerald-800
        doc.text(`★ R$ ${uPrice.toFixed(2)}`, colX + colPerSup - 3, cursorY + 4.2, { align: 'right' });
      } else {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(6.8);
        doc.setTextColor(51, 65, 85);
        doc.text(`R$ ${uPrice.toFixed(2)}`, colX + colPerSup - 3, cursorY + 4.2, { align: 'right' });
      }

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(6);
      doc.setTextColor(100, 116, 139);
      doc.text(`Sub: R$ ${(uPrice * item.quantity).toFixed(2)}`, colX + colPerSup - 3, cursorY + 7.5, { align: 'right' });
    });

    cursorY += rowHeight;
  });

  // Matrix Total Footer Row
  checkPageBreak(12);
  doc.setFillColor(241, 245, 249);
  doc.rect(marginX, cursorY, usableWidth, 8, 'F');
  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.3);
  doc.line(marginX, cursorY + 8, marginX + usableWidth, cursorY + 8);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(15, 23, 42);
  doc.text('VALOR TOTAL DA PROPOSTA (ITENS + FRETE)', marginX + 3, cursorY + 5.5);

  proposals.forEach((p, idx) => {
    const colX = marginX + itemDescWidth + itemQtyWidth + idx * colPerSup;
    const isWinner = p.supplierId === (winnerProposal?.supplierId || selectedWinnerId);

    if (isWinner) {
      doc.setFillColor(224, 231, 255); // indigo-100
      doc.rect(colX, cursorY, colPerSup, 8, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.setTextColor(49, 46, 129); // indigo-900
      doc.text(`R$ ${p.totalAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, colX + colPerSup - 3, cursorY + 5.5, {
        align: 'right',
      });
    } else {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(15, 23, 42);
      doc.text(`R$ ${p.totalAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, colX + colPerSup - 3, cursorY + 5.5, {
        align: 'right',
      });
    }
  });

  cursorY += 12;

  // --- BUYER JUSTIFICATION & COMPLIANCE STATEMENT ---
  checkPageBreak(25);
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(marginX, cursorY, usableWidth, 14, 1.5, 1.5, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(30, 41, 59);
  doc.text('3. PARECER TÉCNICO DE SUPRIMENTOS & JUSTIFICATIVA DE HOMOLOGAÇÃO', marginX + 3, cursorY + 4.5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.8);
  doc.setTextColor(71, 85, 105);
  const winnerTitle = winnerProposal?.supplierName || 'Fornecedor Selecionado';
  const notesText =
    `Declaramos que o processo de concorrência atendeu à política de compras da COMPRAS365 S/A. A empresa "${winnerTitle}" ` +
    `foi homologada como vencedora por apresentar a proposta mais vantajosa (Saving de R$ ${savingAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} ` +
    `equivalente a ${savingPercent}%), com pleno atendimento aos requisitos técnicos, prazos de entrega e condições comerciais estabelecidas.`;
  
  const splitNotes = doc.splitTextToSize(notesText, usableWidth - 6);
  doc.text(splitNotes, marginX + 3, cursorY + 8.5);

  cursorY += 18;

  // --- SIGNATURES SECTION ---
  checkPageBreak(25);
  const sigBoxWidth = (usableWidth - 8) / 3;
  const sigY = cursorY + 11;

  // Signature 1: Buyer
  doc.setDrawColor(148, 163, 184);
  doc.line(marginX, sigY, marginX + sigBoxWidth, sigY);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(15, 23, 42);
  doc.text('Comprador / Negociador Responsável', marginX + sigBoxWidth / 2, sigY + 3.8, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(100, 116, 139);
  doc.text('Departamento de Compras & Suprimentos', marginX + sigBoxWidth / 2, sigY + 7, { align: 'center' });

  // Signature 2: Requesting Area Manager
  const sig2X = marginX + sigBoxWidth + 4;
  doc.line(sig2X, sigY, sig2X + sigBoxWidth, sigY);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(15, 23, 42);
  doc.text('Gestor da Área Solicitante', sig2X + sigBoxWidth / 2, sigY + 3.8, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(100, 116, 139);
  doc.text('Parecer Técnico / Validação de Especificações', sig2X + sigBoxWidth / 2, sigY + 7, { align: 'center' });

  // Signature 3: Board / Approver
  const sig3X = marginX + (sigBoxWidth * 2) + 8;
  doc.line(sig3X, sigY, sig3X + sigBoxWidth, sigY);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(15, 23, 42);
  doc.text('Diretoria / Alçada de Aprovação', sig3X + sigBoxWidth / 2, sigY + 3.8, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(100, 116, 139);
  doc.text('Homologação e Autorização de Fornecimento', sig3X + sigBoxWidth / 2, sigY + 7, { align: 'center' });

  // --- FOOTER & WATERMARK ACROSS ALL PAGES ---
  const totalPages = (doc as any).internal.getNumberOfPages();
  const authHash = Math.random().toString(36).substring(2, 10).toUpperCase();

  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.2);
    doc.line(marginX, pageHeight - 9, marginX + usableWidth, pageHeight - 9);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6);
    doc.setTextColor(148, 163, 184);
    doc.text(
      `Autenticação Digital: C365-MAP-${quoteCode}-${authHash} • Mapa Comparativo emitido eletronicamente em ${new Date().toLocaleString('pt-BR')}`,
      marginX,
      pageHeight - 5.5
    );
    doc.text(`Página ${i} de ${totalPages}`, marginX + usableWidth, pageHeight - 5.5, { align: 'right' });
  }

  const fileName = `Mapa_Comparativo_Cotacao_${quoteCode}.pdf`;

  if (action === 'download') {
    doc.save(fileName);
    return fileName;
  } else if (action === 'preview') {
    const blobUrl = doc.output('bloburl');
    window.open(blobUrl as unknown as string, '_blank');
    return fileName;
  } else if (action === 'print') {
    // Generate blob and trigger printing reliably
    const blobUrl = doc.output('bloburl');
    triggerPdfPrint(blobUrl as unknown as string);
    return fileName;
  }

  return fileName;
}

/**
 * Robust in-browser PDF printing helper that works cleanly across iframes and browsers.
 */
function triggerPdfPrint(pdfBlobUrl: string) {
  try {
    const printIframe = document.createElement('iframe');
    printIframe.style.position = 'fixed';
    printIframe.style.top = '-9999px';
    printIframe.style.left = '-9999px';
    printIframe.style.width = '1px';
    printIframe.style.height = '1px';
    printIframe.src = pdfBlobUrl;

    printIframe.onload = () => {
      setTimeout(() => {
        try {
          printIframe.focus();
          printIframe.contentWindow?.print();
        } catch {
          // Fallback if cross-origin print blocked
          window.open(pdfBlobUrl, '_blank');
        }
      }, 350);
    };

    document.body.appendChild(printIframe);

    // Clean up after 2 minutes
    setTimeout(() => {
      try {
        document.body.removeChild(printIframe);
      } catch {
        // ignore
      }
    }, 120000);
  } catch {
    window.open(pdfBlobUrl, '_blank');
  }
}
