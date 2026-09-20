import { PurchaseOrder } from '../types';

export interface OrderEmailOptions {
  companyName?: string;
  companyCnpj?: string;
  companyAddress?: string;
  nfeEmail?: string;
  buyerName?: string;
  customNotes?: string;
}

export interface OrderEmailPayload {
  to: string;
  subject: string;
  text: string;
  html: string;
  mailtoUrl: string;
}

/**
 * Generates the standardized subject line for a purchase order dispatch.
 */
export function generateOrderEmailSubject(order: PurchaseOrder): string {
  const code = order.code || order.orderNumber || 'PED-2026';
  const supplier = order.supplierName || 'Fornecedor';
  return `[COMPRAS365] Pedido de Compra nº ${code} - ${supplier}`;
}

/**
 * Generates a clean, readable plain-text version of the order, ideal for mailto: or text fallbacks.
 */
export function generateOrderEmailPlainText(
  order: PurchaseOrder,
  options: OrderEmailOptions = {}
): string {
  const companyName = options.companyName || 'COMPRAS365 S/A';
  const nfeEmail = options.nfeEmail || 'nfe@compras365.com.br';
  const orderCode = order.code || order.orderNumber || 'PED-2026';
  const issueDate = order.createdAt
    ? new Date(order.createdAt).toLocaleDateString('pt-BR')
    : new Date().toLocaleDateString('pt-BR');
  const deliveryDate = order.deliveryDeadline
    ? new Date(order.deliveryDeadline).toLocaleDateString('pt-BR')
    : 'A combinar';

  const items = order.items || [];
  const subtotal = items.reduce(
    (acc, it) => acc + (it.totalPrice || it.quantity * it.unitPrice || 0),
    0
  );
  const freight = order.freightAmount ?? order.freightCost ?? 0;
  const grandTotal = order.totalAmount || subtotal + freight;

  const itemsLines = items
    .map(
      (it, idx) =>
        `  ${String(idx + 1).padStart(2, '0')}. ${it.description} | Qtd: ${it.quantity} ${it.unit} | Unit: R$ ${it.unitPrice.toFixed(2)} | Total: R$ ${(it.totalPrice || it.quantity * it.unitPrice).toFixed(2)}`
    )
    .join('\n');

  return (
`Prezados representantes da ${order.supplierName},

Confirmamos a aprovação e emissão do Pedido de Compra oficial nº ${orderCode}.
Segue abaixo o detalhamento com itens, quantidades, valores e especificações de faturamento e entrega.

============================================================
DADOS DA ORDEM DE COMPRA
============================================================
• Empresa Emitente: ${companyName} (CNPJ: 12.345.678/0001-90)
• Número do Pedido: ${orderCode}
• Data de Emissão: ${issueDate}
• Prazo Limite de Entrega: ${deliveryDate}
• Condição de Pagamento: ${order.paymentTerms || '30 dias'}
• Aprovado por: ${order.approvedByName || 'Diretoria de Suprimentos'}
• Local de Entrega: ${order.deliveryAddress || 'Almoxarifado Central'}

============================================================
DADOS DO FORNECEDOR
============================================================
• Razão Social: ${order.supplierName}
• CNPJ: ${order.supplierCnpj || 'Não informado'}
• Contato: ${order.supplierContact || 'Comercial'}
• E-mail: ${order.supplierEmail || '-'} | Telefone: ${order.supplierPhone || '-'}

============================================================
ITENS DO PEDIDO
============================================================
${itemsLines || '  (Nenhum item informado)'}

------------------------------------------------------------
• Subtotal dos Itens: R$ ${subtotal.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
• Frete / Logística: ${freight === 0 ? 'CIF (Incluso / Grátis)' : `FOB R$ ${freight.toFixed(2)}`}
• VALOR TOTAL DO PEDIDO: R$ ${grandTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
------------------------------------------------------------

============================================================
INSTRUÇÕES OBRIGATÓRIAS DE FATURAMENTO E ENTREGA:
============================================================
1. O número deste pedido (${orderCode}) deve constar obrigatoriamente nas Informações Complementares da NF-e.
2. Envie o arquivo XML e DANFE (PDF) antes do envio da carga para: ${nfeEmail}.
3. Horário de Recebimento no Almoxarifado: Segunda a Sexta, das 08h00 às 17h00.
4. Qualquer divergência de preços, marcas ou quantidades acarretará a recusa imediata no ato do recebimento.

Favor responder a este e-mail acusando o recebimento e confirmando a data prevista para entrega.

Atenciosamente,
Departamento de Compras & Suprimentos
${companyName}`
  );
}

/**
 * Generates an executive, email-client compatible HTML template with inline styles.
 * Designed for universal rendering across Outlook, Gmail, Apple Mail, Thunderbird, etc.
 */
export function generateOrderEmailHtml(
  order: PurchaseOrder,
  options: OrderEmailOptions = {}
): string {
  const companyName = options.companyName || 'COMPRAS365 S/A';
  const companyCnpj = options.companyCnpj || '12.345.678/0001-90';
  const nfeEmail = options.nfeEmail || 'nfe@compras365.com.br';
  const orderCode = order.code || order.orderNumber || 'PED-2026';
  const issueDate = order.createdAt
    ? new Date(order.createdAt).toLocaleDateString('pt-BR')
    : new Date().toLocaleDateString('pt-BR');
  const deliveryDate = order.deliveryDeadline
    ? new Date(order.deliveryDeadline).toLocaleDateString('pt-BR')
    : 'A combinar';

  const items = order.items || [];
  const subtotal = items.reduce(
    (acc, it) => acc + (it.totalPrice || it.quantity * it.unitPrice || 0),
    0
  );
  const freight = order.freightAmount ?? order.freightCost ?? 0;
  const grandTotal = order.totalAmount || subtotal + freight;

  const itemRowsHtml = items
    .map((it, idx) => {
      const itemTotal = it.totalPrice || it.quantity * it.unitPrice;
      const bg = idx % 2 === 0 ? '#ffffff' : '#f8fafc';
      return `
        <tr style="background-color: ${bg}; border-bottom: 1px solid #e2e8f0;">
          <td style="padding: 10px 12px; font-size: 12px; color: #64748b; text-align: center; font-weight: bold; width: 36px;">
            ${String(idx + 1).padStart(2, '0')}
          </td>
          <td style="padding: 10px 12px; font-size: 13px; color: #0f172a; font-weight: 600;">
            ${it.description}
            ${it.id ? `<br><span style="font-size: 10px; color: #94a3b8; font-family: monospace;">Cód: ${it.id}</span>` : ''}
          </td>
          <td style="padding: 10px 12px; font-size: 13px; color: #334155; text-align: center; white-space: nowrap;">
            <strong>${it.quantity}</strong> <span style="font-size: 11px; color: #64748b;">${it.unit || 'UN'}</span>
          </td>
          <td style="padding: 10px 12px; font-size: 13px; color: #334155; text-align: right; white-space: nowrap;">
            R$ ${it.unitPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </td>
          <td style="padding: 10px 12px; font-size: 13px; color: #0f172a; font-weight: 700; text-align: right; white-space: nowrap;">
            R$ ${itemTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </td>
        </tr>
      `;
    })
    .join('');

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Pedido de Compra ${orderCode}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f1f5f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased; color: #1e293b;">
  <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #f1f5f9; padding: 24px 12px;">
    <tr>
      <td align="center">
        <!-- Main Container -->
        <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 680px; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.07), 0 2px 4px -2px rgba(0,0,0,0.05); border: 1px solid #e2e8f0;">

          <!-- Top Brand Bar -->
          <tr>
            <td style="background-color: #0f172a; padding: 24px 28px;">
              <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0">
                <tr>
                  <td valign="middle">
                    <table role="presentation" border="0" cellspacing="0" cellpadding="0">
                      <tr>
                        <td style="background-color: #10b981; border-radius: 8px; width: 36px; height: 36px; text-align: center; vertical-align: middle; color: #ffffff; font-weight: bold; font-size: 14px; letter-spacing: -0.5px;">
                          C365
                        </td>
                        <td style="padding-left: 12px;">
                          <div style="font-size: 18px; font-weight: bold; color: #ffffff; letter-spacing: -0.5px; line-height: 1.2;">${companyName}</div>
                          <div style="font-size: 11px; color: #94a3b8; margin-top: 2px;">Gestão de Suprimentos & Compras Corporativas</div>
                        </td>
                      </tr>
                    </table>
                  </td>
                  <td align="right" valign="middle">
                    <div style="display: inline-block; background-color: rgba(16, 185, 129, 0.15); border: 1px solid rgba(16, 185, 129, 0.4); color: #34d399; font-size: 10px; font-weight: 700; text-transform: uppercase; padding: 4px 10px; border-radius: 6px; letter-spacing: 0.5px;">
                      Pedido Aprovado
                    </div>
                    <div style="font-size: 16px; font-weight: 800; color: #ffffff; font-family: monospace; margin-top: 6px;">
                      ${orderCode}
                    </div>
                    <div style="font-size: 11px; color: #94a3b8; margin-top: 2px;">
                      Emissão: ${issueDate}
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Intro Message -->
          <tr>
            <td style="padding: 24px 28px 16px 28px;">
              <p style="margin: 0 0 8px 0; font-size: 15px; color: #0f172a; font-weight: 600;">
                Prezados representantes da ${order.supplierName},
              </p>
              <p style="margin: 0; font-size: 13px; line-height: 1.6; color: #475569;">
                Confirmamos a aprovação da cotação e formalizamos a emissão da presente <strong>Ordem de Fornecimento nº ${orderCode}</strong>.
                Solicitamos a conferência das especificações, valores e prazos detalhados abaixo para início imediato do atendimento.
              </p>
            </td>
          </tr>

          <!-- 2-Column Info Grid (Supplier & Delivery) -->
          <tr>
            <td style="padding: 0 28px 20px 28px;">
              <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0">
                <tr>
                  <!-- Supplier Box -->
                  <td width="48%" valign="top" style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 14px 16px;">
                    <div style="font-size: 10px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 1px solid #cbd5e1; padding-bottom: 6px; margin-bottom: 10px;">
                      Fornecedor Contratado
                    </div>
                    <div style="font-size: 13px; font-weight: 700; color: #0f172a; margin-bottom: 4px;">
                      ${order.supplierName}
                    </div>
                    <div style="font-size: 12px; color: #475569; margin-bottom: 3px;">
                      <span style="color: #94a3b8;">CNPJ:</span> <strong>${order.supplierCnpj || 'Não informado'}</strong>
                    </div>
                    <div style="font-size: 12px; color: #475569; margin-bottom: 3px;">
                      <span style="color: #94a3b8;">Contato:</span> ${order.supplierContact || 'Comercial'}
                    </div>
                    <div style="font-size: 12px; color: #475569; margin-bottom: 3px;">
                      <span style="color: #94a3b8;">E-mail:</span> <a href="mailto:${order.supplierEmail || ''}" style="color: #2563eb; text-decoration: none;">${order.supplierEmail || '-'}</a>
                    </div>
                    <div style="font-size: 12px; color: #475569;">
                      <span style="color: #94a3b8;">Telefone:</span> ${order.supplierPhone || '-'}
                    </div>
                  </td>

                  <td width="4%">&nbsp;</td>

                  <!-- Delivery & Terms Box -->
                  <td width="48%" valign="top" style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 14px 16px;">
                    <div style="font-size: 10px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 1px solid #cbd5e1; padding-bottom: 6px; margin-bottom: 10px;">
                      Condições de Entrega & Faturamento
                    </div>
                    <div style="font-size: 12px; color: #475569; margin-bottom: 4px;">
                      <span style="color: #94a3b8;">Prazo Limite:</span> <strong style="color: #0f172a;">${deliveryDate}</strong>
                    </div>
                    <div style="font-size: 12px; color: #475569; margin-bottom: 4px;">
                      <span style="color: #94a3b8;">Cond. Pagamento:</span> <strong style="color: #0f172a;">${order.paymentTerms || '30 dias'}</strong>
                    </div>
                    <div style="font-size: 12px; color: #475569; margin-bottom: 4px;">
                      <span style="color: #94a3b8;">Aprovador:</span> ${order.approvedByName || 'Diretoria de Suprimentos'}
                    </div>
                    <div style="font-size: 12px; color: #475569; margin-bottom: 2px;">
                      <span style="color: #94a3b8;">Local de Entrega:</span>
                    </div>
                    <div style="font-size: 11px; color: #334155; line-height: 1.4; background-color: #ffffff; padding: 6px 8px; border-radius: 6px; border: 1px solid #e2e8f0;">
                      ${order.deliveryAddress || 'Almoxarifado Central - Av. das Indústrias, 365, São Paulo/SP'}
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Items Table Section -->
          <tr>
            <td style="padding: 0 28px 20px 28px;">
              <div style="font-size: 13px; font-weight: 700; color: #0f172a; margin-bottom: 10px; text-transform: uppercase; letter-spacing: 0.3px;">
                Itens e Especificações Solicitadas
              </div>

              <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="border: 1px solid #cbd5e1; border-radius: 8px; overflow: hidden; border-collapse: separate;">
                <thead>
                  <tr style="background-color: #1e293b; color: #ffffff;">
                    <th style="padding: 9px 10px; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; text-align: center; width: 36px;">#</th>
                    <th style="padding: 9px 12px; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; text-align: left;">Descrição do Material / Serviço</th>
                    <th style="padding: 9px 12px; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; text-align: center; width: 70px;">Qtd</th>
                    <th style="padding: 9px 12px; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; text-align: right; width: 100px;">Valor Unit.</th>
                    <th style="padding: 9px 12px; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; text-align: right; width: 110px;">Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  ${itemRowsHtml || '<tr><td colspan="5" style="padding: 16px; text-align: center; color: #94a3b8;">Nenhum item informado.</td></tr>'}
                </tbody>
              </table>
            </td>
          </tr>

          <!-- Financial Summary Block -->
          <tr>
            <td style="padding: 0 28px 24px 28px;">
              <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0">
                <tr>
                  <td width="50%">&nbsp;</td>
                  <td width="50%">
                    <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px 16px;">
                      <tr>
                        <td style="font-size: 12px; color: #64748b; padding-bottom: 6px;">Subtotal dos Itens:</td>
                        <td align="right" style="font-size: 12px; font-weight: 600; color: #1e293b; padding-bottom: 6px;">
                          R$ ${subtotal.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                      </tr>
                      <tr>
                        <td style="font-size: 12px; color: #64748b; padding-bottom: 8px;">Frete / Transporte:</td>
                        <td align="right" style="font-size: 12px; font-weight: 600; color: #1e293b; padding-bottom: 8px;">
                          ${freight === 0 ? 'CIF (Grátis / Incluso)' : `FOB R$ ${freight.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                        </td>
                      </tr>
                      <tr style="border-top: 2px solid #cbd5e1;">
                        <td style="font-size: 13px; font-weight: 800; color: #0f172a; padding-top: 8px;">VALOR TOTAL:</td>
                        <td align="right" style="font-size: 16px; font-weight: 800; color: #10b981; padding-top: 8px;">
                          R$ ${grandTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Mandatory Instructions Alert Box -->
          <tr>
            <td style="padding: 0 28px 24px 28px;">
              <div style="background-color: #fffbeb; border: 1px solid #fef3c7; border-left: 4px solid #f59e0b; border-radius: 6px; padding: 14px 16px;">
                <div style="font-size: 12px; font-weight: 700; color: #92400e; margin-bottom: 6px; text-transform: uppercase;">
                  ⚠️ Diretrizes Obrigatórias para Faturamento e Despacho
                </div>
                <ol style="margin: 0; padding-left: 18px; font-size: 11px; line-height: 1.6; color: #78350f;">
                  <li>O número do pedido <strong>${orderCode}</strong> deve constar obrigatoriamente nas Informações Complementares da Nota Fiscal Eletrônica (NF-e).</li>
                  <li>Envie previamente os arquivos <strong>XML e DANFE (PDF)</strong> para o e-mail: <a href="mailto:${nfeEmail}" style="color: #b45309; font-weight: 600;">${nfeEmail}</a> antes do envio físico da mercadoria.</li>
                  <li>Recebimento físico: Segunda a Sexta-feira, das 08h00 às 17h00. É mandatório agendamento prévio com a equipe de Almoxarifado para carretas ou veículos pesados.</li>
                  <li>Mercadorias com divergências de marcas, especificações ou quantidades serão recusadas na entrega.</li>
                </ol>
              </div>
            </td>
          </tr>

          <!-- Call to Action / Confirmation Banner -->
          <tr>
            <td style="padding: 0 28px 28px 28px; text-align: center;">
              <p style="margin: 0 0 14px 0; font-size: 13px; color: #475569;">
                Por favor, <strong>responda a este e-mail</strong> acusando o recebimento e confirmando a data prevista de entrega.
              </p>
              <a href="mailto:compras@compras365.com.br?subject=Re:%20Aceite%20Confirmado%20-%20Pedido%20${orderCode}" style="display: inline-block; background-color: #2563eb; color: #ffffff; text-decoration: none; font-size: 13px; font-weight: 700; padding: 10px 24px; border-radius: 8px;">
                Confirmar Aceite do Pedido
              </a>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f8fafc; border-top: 1px solid #e2e8f0; padding: 18px 28px; text-align: center;">
              <div style="font-size: 11px; font-weight: 600; color: #475569;">
                ${companyName} • CNPJ: ${companyCnpj}
              </div>
              <div style="font-size: 10px; color: #94a3b8; margin-top: 4px;">
                Av. das Nações Unidas, 14.401 - Torre Sul - São Paulo/SP | CEP: 04794-000
              </div>
              <div style="font-size: 9px; color: #cbd5e1; margin-top: 8px; line-height: 1.4;">
                Mensagem confidencial enviada eletronicamente pelo Sistema de Gestão de Compras COMPRAS365. Se você recebeu esta mensagem por engano, por favor notifique o remetente imediatamente.
              </div>
            </td>
          </tr>

        </table>
        <!-- End Main Container -->
      </td>
    </tr>
  </table>
</body>
</html>`;
}

/**
 * Builds a ready-to-use mailto: URI with the given purchase order details.
 */
export function generateMailtoUrl(
  order: PurchaseOrder,
  targetEmail?: string,
  options?: OrderEmailOptions
): string {
  const recipient = targetEmail || order.supplierEmail || '';
  const subject = encodeURIComponent(generateOrderEmailSubject(order));
  const body = encodeURIComponent(generateOrderEmailPlainText(order, options));
  return `mailto:${recipient}?subject=${subject}&body=${body}`;
}

/**
 * Creates a comprehensive payload object with HTML, plain text, subject, and mailto URL.
 * Ready for mailto execution or integration with email service providers (Resend, SendGrid, Amazon SES, Nodemailer, etc.).
 */
export function generateOrderEmailPayload(
  order: PurchaseOrder,
  options?: OrderEmailOptions
): OrderEmailPayload {
  const recipient = order.supplierEmail || '';
  const subject = generateOrderEmailSubject(order);
  const text = generateOrderEmailPlainText(order, options);
  const html = generateOrderEmailHtml(order, options);
  const mailtoUrl = generateMailtoUrl(order, recipient, options);

  return {
    to: recipient,
    subject,
    text,
    html,
    mailtoUrl,
  };
}

/**
 * Copies the provided HTML string to the user's clipboard as text and rich text.
 */
export async function copyEmailHtmlToClipboard(html: string): Promise<boolean> {
  try {
    if (navigator.clipboard && typeof ClipboardItem !== 'undefined') {
      const blobHtml = new Blob([html], { type: 'text/html' });
      const blobText = new Blob([html], { type: 'text/plain' });
      await navigator.clipboard.write([
        new ClipboardItem({
          'text/html': blobHtml,
          'text/plain': blobText,
        }),
      ]);
      return true;
    } else if (navigator.clipboard) {
      await navigator.clipboard.writeText(html);
      return true;
    }
    return false;
  } catch (e) {
    console.warn('Falha na API moderna de clipboard, tentando fallback:', e);
    return false;
  }
}

/**
 * Copies plain text to the clipboard.
 */
export async function copyEmailTextToClipboard(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard) {
      await navigator.clipboard.writeText(text);
      return true;
    }
    return false;
  } catch (e) {
    console.warn('Falha ao copiar texto:', e);
    return false;
  }
}
