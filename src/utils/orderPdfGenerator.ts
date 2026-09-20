import { jsPDF } from 'jspdf';
import { PurchaseOrder } from '../types';

/**
 * Generates an official, formal PDF document for an approved Purchase Order.
 * Includes buyer/supplier details, items breakdown, financial totals, legal terms, and signature blocks.
 */
export function generatePurchaseOrderPdf(
  order: PurchaseOrder,
  action: 'download' | 'preview' = 'download'
): string {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = 210;
  const pageHeight = 297;
  const marginX = 14;
  const usableWidth = pageWidth - marginX * 2; // 182mm
  let cursorY = 14;

  const orderCode = order.code || order.orderNumber || 'PED-2026-000';
  const issueDate = order.createdAt
    ? new Date(order.createdAt).toLocaleDateString('pt-BR')
    : new Date().toLocaleDateString('pt-BR');
  const deliveryDate = order.deliveryDeadline
    ? new Date(order.deliveryDeadline).toLocaleDateString('pt-BR')
    : 'A combinar';

  // Helper for adding new page with running header & footer
  const checkPageBreak = (neededHeight: number) => {
    if (cursorY + neededHeight > pageHeight - 20) {
      doc.addPage();
      cursorY = 16;
      drawMiniHeader();
    }
  };

  const drawMiniHeader = () => {
    doc.setFillColor(248, 250, 252);
    doc.rect(marginX, cursorY, usableWidth, 8, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(71, 85, 105);
    doc.text(`COMPRAS365 S/A - PEDIDO ${orderCode} (Continuação)`, marginX + 3, cursorY + 5.5);
    doc.text(`Emissão: ${issueDate}`, marginX + usableWidth - 3, cursorY + 5.5, { align: 'right' });
    cursorY += 12;
  };

  // --- HEADER SECTION ---
  // Top brand bar
  doc.setFillColor(15, 23, 42); // slate-900
  doc.rect(marginX, cursorY, usableWidth, 22, 'F');

  // Brand Logo / Box
  doc.setFillColor(16, 185, 129); // emerald-500
  doc.roundedRect(marginX + 4, cursorY + 3.5, 15, 15, 2, 2, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('C365', marginX + 11.5, cursorY + 12.5, { align: 'center' });

  // Company Name & Info
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(255, 255, 255);
  doc.text('COMPRAS365 S/A', marginX + 23, cursorY + 8);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(203, 213, 225);
  doc.text('CNPJ: 12.345.678/0001-90 | I.E: 112.233.445.556', marginX + 23, cursorY + 13);
  doc.text('Av. das Nações Unidas, 14.401 - São Paulo/SP | compras@compras365.com.br', marginX + 23, cursorY + 17.5);

  // Right Side - Order Code & Title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(16, 185, 129);
  doc.text('ORDEM DE COMPRA OFICIAL', marginX + usableWidth - 4, cursorY + 7, { align: 'right' });

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(255, 255, 255);
  doc.text(orderCode, marginX + usableWidth - 4, cursorY + 14, { align: 'right' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(203, 213, 225);
  doc.text(`Data de Emissão: ${issueDate}`, marginX + usableWidth - 4, cursorY + 18.5, { align: 'right' });

  cursorY += 26;

  // --- SUPPLIER & DELIVERY BLOCKS (2 COLUMNS) ---
  const colWidth = (usableWidth - 4) / 2; // ~89mm
  const blockHeight = 36;

  // Supplier Box
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(marginX, cursorY, colWidth, blockHeight, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(30, 41, 59);
  doc.text('DADOS DO FORNECEDOR CONTRATADO', marginX + 4, cursorY + 5.5);

  doc.setDrawColor(203, 213, 225);
  doc.line(marginX + 4, cursorY + 7.5, marginX + colWidth - 4, cursorY + 7.5);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(15, 23, 42);
  const supplierName = doc.splitTextToSize(order.supplierName || 'Fornecedor', colWidth - 8);
  doc.text(supplierName, marginX + 4, cursorY + 12);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);
  doc.text(`CNPJ: ${order.supplierCnpj || 'Não informado'}`, marginX + 4, cursorY + 18);
  doc.text(`Contato: ${order.supplierContact || 'Comercial'}`, marginX + 4, cursorY + 23);
  doc.text(`Tel: ${order.supplierPhone || '-'} | E-mail: ${order.supplierEmail || '-'}`, marginX + 4, cursorY + 28);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(16, 185, 129);
  doc.text('Status Fornecedor: Homologado & Ativo', marginX + 4, cursorY + 33);

  // Delivery & Billing Box
  const col2X = marginX + colWidth + 4;
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(col2X, cursorY, colWidth, blockHeight, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(30, 41, 59);
  doc.text('CONDIÇÕES DE FATURAMENTO E ENTREGA', col2X + 4, cursorY + 5.5);

  doc.setDrawColor(203, 213, 225);
  doc.line(col2X + 4, cursorY + 7.5, col2X + colWidth - 4, cursorY + 7.5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);

  doc.setFont('helvetica', 'bold');
  doc.text('Prazo Limite Entrega:', col2X + 4, cursorY + 12);
  doc.setFont('helvetica', 'normal');
  doc.text(deliveryDate, col2X + 42, cursorY + 12);

  doc.setFont('helvetica', 'bold');
  doc.text('Condição Pagamento:', col2X + 4, cursorY + 17);
  doc.setFont('helvetica', 'normal');
  doc.text(order.paymentTerms || '30 dias', col2X + 42, cursorY + 17);

  doc.setFont('helvetica', 'bold');
  doc.text('Aprovador:', col2X + 4, cursorY + 22);
  doc.setFont('helvetica', 'normal');
  doc.text(order.approvedByName || 'Diretoria Executiva', col2X + 42, cursorY + 22);

  doc.setFont('helvetica', 'bold');
  doc.text('Local Entrega:', col2X + 4, cursorY + 27);
  doc.setFont('helvetica', 'normal');
  const deliveryAddr = doc.splitTextToSize(
    order.deliveryAddress || 'Almoxarifado Central - Av. das Indústrias, 365, São Paulo/SP',
    colWidth - 8
  );
  doc.text(deliveryAddr, col2X + 4, cursorY + 31.5);

  cursorY += blockHeight + 6;

  // --- ITEMS TABLE ---
  checkPageBreak(30);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(15, 23, 42);
  doc.text('ITENS E ESPECIFICAÇÕES DO FORNECIMENTO', marginX, cursorY);

  cursorY += 3;

  // Table Column Widths: total 182mm
  // Item (10mm) | Descrição (88mm) | Qtd (16mm) | Un (12mm) | Unit (26mm) | Total (30mm)
  const colItemW = 10;
  const colDescW = 88;
  const colQtyW = 16;
  const colUnW = 12;
  const colUnitValW = 26;
  const colTotalValW = 30;

  // Table Header
  doc.setFillColor(30, 41, 59); // slate-800
  doc.rect(marginX, cursorY, usableWidth, 7, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(255, 255, 255);

  let curX = marginX;
  doc.text('ITEM', curX + 2, cursorY + 4.8);
  curX += colItemW;
  doc.text('DESCRIÇÃO TÉCNICA DOS MATERIAIS / SERVIÇOS', curX + 2, cursorY + 4.8);
  curX += colDescW;
  doc.text('QTD', curX + colQtyW / 2, cursorY + 4.8, { align: 'center' });
  curX += colQtyW;
  doc.text('UN', curX + colUnW / 2, cursorY + 4.8, { align: 'center' });
  curX += colUnW;
  doc.text('VALOR UNIT. (R$)', curX + colUnitValW - 2, cursorY + 4.8, { align: 'right' });
  curX += colUnitValW;
  doc.text('TOTAL ITEM (R$)', curX + colTotalValW - 2, cursorY + 4.8, { align: 'right' });

  cursorY += 7;

  // Table Rows
  const items = order.items || [];
  let subtotal = 0;

  items.forEach((item, index) => {
    const itemTotal = item.totalPrice || item.quantity * item.unitPrice;
    subtotal += itemTotal;

    const descLines = doc.splitTextToSize(item.description || 'Item sem descrição', colDescW - 4);
    const rowHeight = Math.max(7, descLines.length * 3.8 + 3.5);

    checkPageBreak(rowHeight + 10);

    // Zebra striping
    if (index % 2 === 0) {
      doc.setFillColor(255, 255, 255);
    } else {
      doc.setFillColor(248, 250, 252);
    }
    doc.rect(marginX, cursorY, usableWidth, rowHeight, 'F');

    // Bottom border
    doc.setDrawColor(226, 232, 240);
    doc.line(marginX, cursorY + rowHeight, marginX + usableWidth, cursorY + rowHeight);

    // Row values
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(100, 116, 139);

    let rowX = marginX;
    // Item #
    doc.text(String(index + 1).padStart(2, '0'), rowX + 2, cursorY + 4.5);
    rowX += colItemW;

    // Description
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text(descLines, rowX + 2, cursorY + 4.5);
    rowX += colDescW;

    // Qty
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(30, 41, 59);
    doc.text(String(item.quantity), rowX + colQtyW / 2, cursorY + 4.5, { align: 'center' });
    rowX += colQtyW;

    // Unit
    doc.text(item.unit || 'UN', rowX + colUnW / 2, cursorY + 4.5, { align: 'center' });
    rowX += colUnW;

    // Unit price
    doc.text(
      item.unitPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
      rowX + colUnitValW - 2,
      cursorY + 4.5,
      { align: 'right' }
    );
    rowX += colUnitValW;

    // Total price
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text(
      itemTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
      rowX + colTotalValW - 2,
      cursorY + 4.5,
      { align: 'right' }
    );

    cursorY += rowHeight;
  });

  // --- TOTALS BLOCK ---
  checkPageBreak(32);

  const freightVal = order.freightAmount || order.freightCost || 0;
  const grandTotal = order.totalAmount || subtotal + freightVal;

  const totalsBoxWidth = 85;
  const totalsBoxX = marginX + usableWidth - totalsBoxWidth;

  doc.setFillColor(241, 245, 249);
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(totalsBoxX, cursorY + 2, totalsBoxWidth, 24, 2, 2, 'FD');

  let totalTextY = cursorY + 7;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);
  doc.text('Subtotal dos Itens:', totalsBoxX + 4, totalTextY);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 41, 59);
  doc.text(
    `R$ ${subtotal.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
    totalsBoxX + totalsBoxWidth - 4,
    totalTextY,
    { align: 'right' }
  );

  totalTextY += 5.5;
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text('Frete / Logística:', totalsBoxX + 4, totalTextY);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 41, 59);
  doc.text(
    freightVal === 0 ? 'CIF (Incluso / Grátis)' : `FOB R$ ${freightVal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
    totalsBoxX + totalsBoxWidth - 4,
    totalTextY,
    { align: 'right' }
  );

  totalTextY += 6;
  doc.setDrawColor(148, 163, 184);
  doc.line(totalsBoxX + 4, totalTextY - 1.5, totalsBoxX + totalsBoxWidth - 4, totalTextY - 1.5);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(15, 23, 42);
  doc.text('TOTAL DO PEDIDO:', totalsBoxX + 4, totalTextY + 3.5);
  doc.setTextColor(16, 185, 129); // emerald
  doc.text(
    `R$ ${grandTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
    totalsBoxX + totalsBoxWidth - 4,
    totalTextY + 3.5,
    { align: 'right' }
  );

  cursorY += 28;

  // --- MANDATORY INSTRUCTIONS / CLAUSES FOR SUPPLIER ---
  checkPageBreak(40);

  doc.setFillColor(254, 252, 232); // amber-50
  doc.setDrawColor(254, 240, 138); // amber-200
  doc.roundedRect(marginX, cursorY, usableWidth, 24, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(146, 64, 14); // amber-800
  doc.text('INSTRUÇÕES OBRIGATÓRIAS DE FATURAMENTO E ENTREGA:', marginX + 4, cursorY + 4.5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.8);
  doc.setTextColor(120, 53, 15);
  doc.text(
    `1. O número deste pedido (${orderCode}) deve constar obrigatoriamente nas Informações Complementares da NF-e.`,
    marginX + 4,
    cursorY + 8.5
  );
  doc.text(
    '2. O envio prévio do arquivo XML e DANFE (PDF) é indispensável para o e-mail: nfe@compras365.com.br antes do despacho.',
    marginX + 4,
    cursorY + 12.5
  );
  doc.text(
    '3. Recebimento no Almoxarifado: Segunda a Sexta-feira, das 08h00 às 17h00. É obrigatório agendamento prévio para cargas pesadas.',
    marginX + 4,
    cursorY + 16.5
  );
  doc.text(
    '4. Qualquer divergência de preço, especificação ou quantidade acarretará a devolução imediata da mercadoria.',
    marginX + 4,
    cursorY + 20.5
  );

  cursorY += 28;

  // --- SIGNATURES / AUTHORIZATIONS ---
  checkPageBreak(30);

  const sigWidth = (usableWidth - 10) / 2;
  const sig1X = marginX;
  const sig2X = marginX + sigWidth + 10;
  const sigLineY = cursorY + 14;

  // Buyer / Approver Signature
  doc.setDrawColor(148, 163, 184);
  doc.line(sig1X, sigLineY, sig1X + sigWidth, sigLineY);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(15, 23, 42);
  doc.text(order.approvedByName || 'Diretoria de Operações & Suprimentos', sig1X + sigWidth / 2, sigLineY + 4, {
    align: 'center',
  });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(100, 116, 139);
  doc.text('COMPRAS365 S/A - Alçada de Aprovação Homologada', sig1X + sigWidth / 2, sigLineY + 7.5, {
    align: 'center',
  });

  // Supplier Acceptance
  doc.line(sig2X, sigLineY, sig2X + sigWidth, sigLineY);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(15, 23, 42);
  doc.text(order.supplierName || 'Representante Legal do Fornecedor', sig2X + sigWidth / 2, sigLineY + 4, {
    align: 'center',
  });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(100, 116, 139);
  doc.text('Aceite Comercial / Confirmação de Pedido', sig2X + sigWidth / 2, sigLineY + 7.5, {
    align: 'center',
  });

  // --- PAGE NUMBERS & AUDIT WATERMARK AT BOTTOM OF ALL PAGES ---
  const totalPages = (doc as any).internal.getNumberOfPages();
  const authHash = Math.random().toString(36).substring(2, 10).toUpperCase();

  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setDrawColor(226, 232, 240);
    doc.line(marginX, pageHeight - 11, marginX + usableWidth, pageHeight - 11);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(148, 163, 184);
    doc.text(
      `Autenticação Digital: C365-${orderCode}-${authHash} • Documento emitido eletronicamente em ${new Date().toLocaleString('pt-BR')}`,
      marginX,
      pageHeight - 7
    );

    doc.text(`Página ${i} de ${totalPages}`, marginX + usableWidth, pageHeight - 7, { align: 'right' });
  }

  // Save / Return
  const fileName = `Pedido_de_Compra_${orderCode}_${(order.supplierName || 'Fornecedor').replace(/[^a-zA-Z0-9]/g, '_')}.pdf`;

  if (action === 'download') {
    doc.save(fileName);
    return fileName;
  } else {
    const blobUrl = doc.output('bloburl');
    window.open(blobUrl as unknown as string, '_blank');
    return fileName;
  }
}
