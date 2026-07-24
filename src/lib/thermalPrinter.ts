// Thermal Printer Engine for FluxOS
// Real Hardware Discovery (WebUSB, WebSerial), Real Spooler Queue, Real ESC/POS Binary Generator & Hardware Diagnostics.

export interface ReceiptData {
  title?: string;
  type?: string;
  data?: any;
}

export interface PrinterDevice {
  id: string;
  name: string;
  sector: 'caixa' | 'cozinha' | 'bar' | 'expedição' | 'outros' | string;
  method: 'system' | 'webusb' | 'webserial' | 'bluetooth' | 'network' | 'virtual';
  connectionIp?: string;
  paperSize: '58mm' | '80mm';
  enabled: boolean;
  autoCut: boolean;
  copies: number;
}

export interface SpoolJob {
  id: string;
  printerId: string;
  printerName: string;
  timestamp: string;
  bytesCount: number;
  status: 'completed' | 'error' | 'pending';
  durationMs: number;
  errorCode?: string;
  details: string;
  rawHexPreview?: string;
}

export const DEFAULT_PRINTERS: PrinterDevice[] = [
  {
    id: 'prn_caixa',
    name: 'Impressora do Caixa (HPRT-II / USB)',
    sector: 'caixa',
    method: 'system',
    paperSize: '58mm',
    enabled: true,
    autoCut: true,
    copies: 1,
    connectionIp: ''
  },
  {
    id: 'prn_cozinha',
    name: 'Impressora da Cozinha',
    sector: 'cozinha',
    method: 'network',
    paperSize: '80mm',
    enabled: true,
    autoCut: true,
    copies: 1,
    connectionIp: '192.168.1.201:9100'
  }
];

export function getSavedPrinters(): PrinterDevice[] {
  try {
    const raw = localStorage.getItem('adegaos_printers_list');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {
    console.warn('[FluxOS Printer] Failed to parse printers list:', e);
  }
  return DEFAULT_PRINTERS;
}

export function savePrinters(printers: PrinterDevice[]): void {
  localStorage.setItem('adegaos_printers_list', JSON.stringify(printers));
}

// REAL SPOOL QUEUE MANAGER
export function getSpoolQueue(): SpoolJob[] {
  try {
    const raw = localStorage.getItem('adegaos_spool_queue_v2');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (e) {
    console.warn('[Spooler Queue] Failed to read queue:', e);
  }
  return [];
}

export function addSpoolJob(job: SpoolJob): void {
  const current = getSpoolQueue();
  const updated = [job, ...current].slice(0, 50); // keep last 50 jobs
  localStorage.setItem('adegaos_spool_queue_v2', JSON.stringify(updated));
  window.dispatchEvent(new CustomEvent('adegaos_spool_updated', { detail: updated }));
}

export function clearSpoolQueue(): void {
  localStorage.removeItem('adegaos_spool_queue_v2');
  window.dispatchEvent(new CustomEvent('adegaos_spool_updated', { detail: [] }));
}

// ESC/POS Command Byte Map
export const ESC_POS_COMMANDS = {
  INIT: new Uint8Array([0x1B, 0x40]),
  ALIGN_LEFT: new Uint8Array([0x1B, 0x61, 0x00]),
  ALIGN_CENTER: new Uint8Array([0x1B, 0x61, 0x01]),
  ALIGN_RIGHT: new Uint8Array([0x1B, 0x61, 0x02]),
  FONT_A: new Uint8Array([0x1B, 0x4D, 0x00]),
  FONT_B: new Uint8Array([0x1B, 0x4D, 0x01]),
  FONT_C: new Uint8Array([0x1B, 0x4D, 0x02]),
  BOLD_ON: new Uint8Array([0x1B, 0x45, 0x01]),
  BOLD_OFF: new Uint8Array([0x1B, 0x45, 0x00]),
  UNDERLINE_ON: new Uint8Array([0x1B, 0x2D, 0x01]),
  UNDERLINE_OFF: new Uint8Array([0x1B, 0x2D, 0x00]),
  INVERT_ON: new Uint8Array([0x1D, 0x42, 0x01]),
  INVERT_OFF: new Uint8Array([0x1D, 0x42, 0x00]),
  FEED_3_LINES: new Uint8Array([0x1B, 0x64, 0x03]),
  PAPER_CUT_PARTIAL: new Uint8Array([0x1D, 0x56, 0x01]),
  PAPER_CUT_FULL: new Uint8Array([0x1D, 0x56, 0x00]),
  CASH_DRAWER_KICK: new Uint8Array([0x1B, 0x70, 0x00, 0x19, 0xFA])
};

// Generates scale command byte array (0x1D 0x21 N)
export function getFontScaleCommand(widthScale: number = 1, heightScale: number = 1): Uint8Array {
  const w = Math.min(Math.max(widthScale, 1), 8) - 1;
  const h = Math.min(Math.max(heightScale, 1), 8) - 1;
  const n = (w << 4) | h;
  return new Uint8Array([0x1D, 0x21, n]);
}

// Convert receipt text and parameters into real ESC/POS Uint8Array
export function generateEscPosBuffer(receiptText: string, options?: {
  autoCut?: boolean;
  cashDrawer?: boolean;
  align?: 'left' | 'center' | 'right';
  fontFamily?: 'font_a' | 'font_b' | 'font_c';
  bold?: boolean;
  scaleHorizontal?: number;
  scaleVertical?: number;
}): Uint8Array {
  const encoder = new TextEncoder();
  const textBytes = encoder.encode(receiptText);

  const parts: Uint8Array[] = [];

  // Init
  parts.push(ESC_POS_COMMANDS.INIT);

  // Font
  if (options?.fontFamily === 'font_b') parts.push(ESC_POS_COMMANDS.FONT_B);
  else if (options?.fontFamily === 'font_c') parts.push(ESC_POS_COMMANDS.FONT_C);
  else parts.push(ESC_POS_COMMANDS.FONT_A);

  // Align
  if (options?.align === 'center') parts.push(ESC_POS_COMMANDS.ALIGN_CENTER);
  else if (options?.align === 'right') parts.push(ESC_POS_COMMANDS.ALIGN_RIGHT);
  else parts.push(ESC_POS_COMMANDS.ALIGN_LEFT);

  // Scale
  if ((options?.scaleHorizontal && options.scaleHorizontal > 1) || (options?.scaleVertical && options.scaleVertical > 1)) {
    parts.push(getFontScaleCommand(options.scaleHorizontal || 1, options.scaleVertical || 1));
  }

  // Bold
  if (options?.bold) parts.push(ESC_POS_COMMANDS.BOLD_ON);

  // Drawer
  if (options?.cashDrawer) parts.push(ESC_POS_COMMANDS.CASH_DRAWER_KICK);

  // Content
  parts.push(textBytes);

  // Feed & Cut
  parts.push(ESC_POS_COMMANDS.FEED_3_LINES);

  if (options?.autoCut !== false) {
    parts.push(ESC_POS_COMMANDS.PAPER_CUT_PARTIAL);
  }

  const totalLen = parts.reduce((acc, curr) => acc + curr.length, 0);
  const result = new Uint8Array(totalLen);
  let offset = 0;
  for (const part of parts) {
    result.set(part, offset);
    offset += part.length;
  }

  return result;
}

// Convert binary buffer to Hex String preview for debugging
export function bufferToHexPreview(buffer: Uint8Array, maxBytes: number = 32): string {
  const slice = buffer.slice(0, maxBytes);
  const hex = Array.from(slice).map(b => b.toString(16).padStart(2, '0').toUpperCase()).join(' ');
  return buffer.length > maxBytes ? `${hex} ... (+${buffer.length - maxBytes} bytes)` : hex;
}

// Formats text into receipt layout based on paper width (30 chars for 58mm, 44 chars for 80mm)
export function generateReceiptText(typeOrPayload: any, maybeData?: any, overridePaperSize?: string, customDocSettings?: any): string {
  let type = '';
  let title = 'CUPOM NÃO FISCAL';
  let data: any = null;

  if (typeof typeOrPayload === 'string') {
    type = typeOrPayload;
    data = maybeData || {};
    if (type === 'cash_flow') title = 'FECHAMENTO DE CAIXA';
    else if (type === 'comanda') title = 'COMPROVANTE DE PRODUÇÃO';
    else if (type === 'sale') title = 'CUPOM NÃO FISCAL';
  } else if (typeOrPayload && typeof typeOrPayload === 'object') {
    type = typeOrPayload.type || 'sale';
    title = typeOrPayload.title || 'CUPOM NÃO FISCAL';
    data = typeOrPayload.data || {};
  }

  const paperSize = overridePaperSize || localStorage.getItem('adegaos_paper_size') || '58mm';
  // 30 chars for 58mm (48mm printable area), 44 chars for 80mm (72mm printable area)
  const width = paperSize === '80mm' ? 44 : 30;
  const divider = '-'.repeat(width);
  const doubleDivider = '='.repeat(width);

  const doc = customDocSettings || {};
  const isVis = (elKey: string) => doc[elKey]?.visible !== false;

  const storeName = (localStorage.getItem('adegaos_store_name') || 'ADEGA CENTRAL').toUpperCase();
  const cnpj = localStorage.getItem('adegaos_cnpj') || '';
  const headerText = localStorage.getItem('adegaos_header_text') || 'OBRIGADO PELA PREFERÊNCIA!';
  const footerText = localStorage.getItem('adegaos_footer_text') || 'FluxOS - Sistema de Gestão\n*** CUPOM NÃO FISCAL ***';
  const customLogoText = localStorage.getItem('adegaos_receipt_logo_text') || '';
  const customQrCodeText = localStorage.getItem('adegaos_receipt_qrcode_text') || localStorage.getItem('adegaos_pix_key') || '';

  const center = (text: string) => {
    if (text.length >= width) return text.slice(0, width);
    const leftPad = Math.floor((width - text.length) / 2);
    return ' '.repeat(leftPad) + text;
  };

  const justify = (left: string, right: string) => {
    const totalLen = left.length + right.length;
    if (totalLen >= width) {
      const availLeft = width - right.length - 1;
      return left.slice(0, Math.max(0, availLeft)) + ' ' + right;
    }
    const spaces = ' '.repeat(width - totalLen);
    return left + spaces + right;
  };

  const lines: string[] = [];

  // 1. Header
  if (isVis('header')) {
    lines.push(center(storeName));
    if (cnpj) lines.push(center(`CNPJ: ${cnpj}`));
    if (headerText) {
      headerText.split('\n').forEach(h => {
        if (h.trim()) lines.push(center(h.trim()));
      });
    }
    lines.push(divider);
  }

  // 2. Logo (Only if enabled AND logo text/brand is provided)
  if (isVis('logo') && customLogoText.trim()) {
    lines.push(center(customLogoText.trim().toUpperCase()));
    lines.push(divider);
  }

  lines.push(center(title.toUpperCase()));
  lines.push(divider);

  // Body based on payload type
  if (type === 'cash_flow' || data.cash_flow) {
    const cf = data.cash_flow || data;
    if (isVis('dateTime')) {
      lines.push(justify('Data:', cf.date || new Date().toLocaleDateString('pt-BR')));
      lines.push(justify('Hora:', cf.time || new Date().toLocaleTimeString('pt-BR')));
    }
    lines.push(justify('Operador:', cf.cashierId || 'GERENTE'));
    lines.push(divider);
    lines.push(justify('Saldo Inicial:', `R$ ${(cf.initialBalance || 0).toFixed(2)}`));
    lines.push(justify('Entradas Dinheiro:', `R$ ${(cf.cashIn || 0).toFixed(2)}`));
    lines.push(justify('Vendas Cartão:', `R$ ${(cf.cardTotal || 0).toFixed(2)}`));
    lines.push(justify('Vendas PIX:', `R$ ${(cf.pixTotal || 0).toFixed(2)}`));
    lines.push(justify('Sangrias/Retiradas:', `R$ ${(cf.withdrawals || 0).toFixed(2)}`));
    lines.push(doubleDivider);
    lines.push(justify('TOTAL EM CAIXA:', `R$ ${(cf.totalInCash || 0).toFixed(2)}`));
  } else if (type === 'comanda' || data.items) {
    if (isVis('dateTime')) {
      lines.push(justify('Data/Hora:', `${data.date || new Date().toLocaleDateString('pt-BR')} ${data.time || ''}`));
    }
    if (isVis('orderNumber')) {
      lines.push(justify('Comanda/Mesa:', data.identifier || data.table || 'BALCÃO'));
    }
    if (data.sector) lines.push(justify('Setor:', data.sector.toUpperCase()));
    lines.push(divider);
    
    if (isVis('itemsTable')) {
      lines.push(justify('QTD ITEM', 'OBS'));
      lines.push(divider);
      (data.items || []).forEach((it: any) => {
        const qtyStr = `${it.qty || it.quantity || 1}x`;
        const nameStr = (it.name || it.productName || 'Item').trim();
        lines.push(`${qtyStr} ${nameStr}`);
        if (it.notes) {
          lines.push(`   OBS: ${it.notes}`);
        }
      });
    }
  } else {
    // Venda / Sale
    const sale = data.sale || data;
    const tx = data.transaction || {};
    const dateStr = sale.timestamp ? new Date(sale.timestamp).toLocaleString('pt-BR') : `${new Date().toLocaleDateString('pt-BR')} ${new Date().toLocaleTimeString('pt-BR')}`;
    
    if (isVis('orderNumber')) {
      const ticketNum = sale.id || sale.number || '0000';
      lines.push(justify('Cupom Nº:', `#${ticketNum.toString().slice(-8).toUpperCase()}`));
    }
    if (isVis('dateTime')) {
      lines.push(justify('Data:', dateStr));
    }
    if (isVis('customerName')) {
      lines.push(justify('Cliente:', (sale.clientName || 'CONSUMIDOR').toUpperCase()));
    }
    
    if (isVis('itemsTable')) {
      lines.push(divider);
      lines.push(justify('PRODUTO / QTD x UN', 'VALOR'));
      lines.push(divider);

      const items = sale.items || [];
      items.forEach((item: any) => {
        const qty = item.quantity || item.qty || 1;
        const unitPrice = item.unitPrice || item.product?.sellPrice || 0;
        const total = item.totalPrice || (unitPrice * qty) || 0;
        const pName = (item.product?.name || item.productName || item.name || 'Produto').trim();
        
        const qtyStr = `${qty}x`;
        const totalStr = `R$ ${total.toFixed(2)}`;
        const unitStr = `R$ ${unitPrice.toFixed(2)}`;

        // POS Receipt Format:
        lines.push(pName);
        const detailLeft = `  ${qtyStr} x ${unitStr}`;
        lines.push(justify(detailLeft, totalStr));
      });
    }

    if (isVis('totals')) {
      lines.push(divider);
      lines.push(justify('Subtotal:', `R$ ${(sale.subtotal || sale.totalAmount || 0).toFixed(2)}`));
      if (sale.discountAmount && sale.discountAmount > 0) {
        lines.push(justify('Desconto:', `- R$ ${sale.discountAmount.toFixed(2)}`));
      }
      lines.push(doubleDivider);
      lines.push(justify('TOTAL PAGO:', `R$ ${(sale.totalAmount || sale.total || 0).toFixed(2)}`));
    }

    if (isVis('payments')) {
      lines.push(justify('Forma Pagto:', (sale.paymentMethod || tx.method || 'DINHEIRO').toUpperCase()));
      if (sale.changeAmount && sale.changeAmount > 0) {
        lines.push(justify('Troco:', `R$ ${sale.changeAmount.toFixed(2)}`));
      }
    }
  }

  // QR Code (Only if visible AND QR Code text / Pix key is set)
  if (isVis('qrCode') && customQrCodeText.trim()) {
    lines.push(divider);
    lines.push(center('CHAVE PIX / CONSULTA:'));
    lines.push(center(customQrCodeText.trim()));
  }

  // Barcode (Only if visible AND sale ID exists)
  if (isVis('barcode')) {
    const saleId = data.sale?.id || data.id || '';
    if (saleId) {
      lines.push(divider);
      lines.push(center(`* ${saleId.toString().slice(-12).toUpperCase()} *`));
    }
  }

  // Footer (Only if visible)
  if (isVis('footer') && footerText.trim()) {
    lines.push(divider);
    footerText.split('\n').forEach(f => {
      if (f.trim()) lines.push(center(f.trim()));
    });
  }

  lines.push('\n\n\n');

  return lines.join('\n');
}

// Generate styled HTML document with flexbox layout, bolding, and zero clipping for System Thermal Printing
export function generateReceiptHtml(
  typeOrPayload: any,
  maybeData?: any,
  overridePaperSize?: string,
  customDocSettings?: any,
  customLayoutSettings?: any
): string {
  let type = '';
  let title = 'CUPOM NÃO FISCAL';
  let data: any = null;

  if (typeof typeOrPayload === 'string') {
    type = typeOrPayload;
    data = maybeData || {};
    if (type === 'cash_flow') title = 'FECHAMENTO DE CAIXA';
    else if (type === 'comanda') title = 'COMPROVANTE DE PRODUÇÃO';
    else if (type === 'sale') title = 'CUPOM NÃO FISCAL';
  } else if (typeOrPayload && typeof typeOrPayload === 'object') {
    type = typeOrPayload.type || 'sale';
    title = typeOrPayload.title || 'CUPOM NÃO FISCAL';
    data = typeOrPayload.data || {};
  }

  const paperSize = overridePaperSize || localStorage.getItem('adegaos_paper_size') || '58mm';
  const widthCss = paperSize === '80mm' ? '72mm' : '48mm';
  const doc = customDocSettings || {};
  const layout = customLayoutSettings || {};
  const isVis = (elKey: string) => doc[elKey]?.visible !== false;

  const storeName = (localStorage.getItem('adegaos_store_name') || 'ADEGA CENTRAL').toUpperCase();
  const cnpj = localStorage.getItem('adegaos_cnpj') || '';
  const headerText = localStorage.getItem('adegaos_header_text') || 'OBRIGADO PELA PREFERÊNCIA!';
  const footerText = localStorage.getItem('adegaos_footer_text') || 'FluxOS - Sistema de Gestão\n*** CUPOM NÃO FISCAL ***';
  const customLogoText = localStorage.getItem('adegaos_receipt_logo_text') || '';
  const customQrCodeText = localStorage.getItem('adegaos_receipt_qrcode_text') || localStorage.getItem('adegaos_pix_key') || '';

  const globalBold = layout.bold === true;
  const globalWeight = globalBold ? '900' : '700';

  let htmlBody = '';

  const renderDivider = (type: 'single' | 'double' = 'single') => {
    const style = type === 'double' ? 'border-top: 2px solid #000; margin: 4px 0;' : 'border-top: 1px dashed #000; margin: 3px 0;';
    return `<div style="${style}"></div>`;
  };

  const renderFlexRow = (left: string, right: string, isBold: boolean = false, fontSize: string = '1em') => {
    const weight = isBold || globalBold ? '900' : '600';
    return `
      <div style="display: flex; justify-content: space-between; align-items: baseline; width: 100%; font-weight: ${weight}; font-size: ${fontSize}; margin: 1px 0;">
        <span style="overflow: hidden; text-overflow: ellipsis; white-space: nowrap; padding-right: 4px;">${escapeHtml(left)}</span>
        <span style="white-space: nowrap; font-variant-numeric: tabular-nums;">${escapeHtml(right)}</span>
      </div>
    `;
  };

  // 1. Header
  if (isVis('header')) {
    const headerBold = doc.header?.bold !== false || globalBold;
    const headerWeight = headerBold ? '900' : '600';
    const headerSize = doc.header?.size === 'double' ? '1.25em' : '1.05em';

    htmlBody += `<div style="text-align: center; font-weight: ${headerWeight}; font-size: ${headerSize}; line-height: 1.2;">${escapeHtml(storeName)}</div>`;
    if (cnpj) {
      htmlBody += `<div style="text-align: center; font-size: 0.9em;">CNPJ: ${escapeHtml(cnpj)}</div>`;
    }
    if (headerText) {
      headerText.split('\n').forEach(h => {
        if (h.trim()) {
          htmlBody += `<div style="text-align: center; font-size: 0.9em;">${escapeHtml(h.trim())}</div>`;
        }
      });
    }
    htmlBody += renderDivider('single');
  }

  // 2. Logo
  if (isVis('logo') && customLogoText.trim()) {
    htmlBody += `<div style="text-align: center; font-weight: 900; font-size: 1.1em;">${escapeHtml(customLogoText.trim().toUpperCase())}</div>`;
    htmlBody += renderDivider('single');
  }

  // 3. Document Title
  htmlBody += `<div style="text-align: center; font-weight: 900; font-size: 1.2em; text-transform: uppercase; letter-spacing: 0.5px; margin: 2px 0;">${escapeHtml(title)}</div>`;
  htmlBody += renderDivider('single');

  // Body Content
  if (type === 'cash_flow' || data.cash_flow) {
    const cf = data.cash_flow || data;
    if (isVis('dateTime')) {
      htmlBody += renderFlexRow('Data:', cf.date || new Date().toLocaleDateString('pt-BR'));
      htmlBody += renderFlexRow('Hora:', cf.time || new Date().toLocaleTimeString('pt-BR'));
    }
    htmlBody += renderFlexRow('Operador:', cf.cashierId || 'GERENTE');
    htmlBody += renderDivider('single');
    htmlBody += renderFlexRow('Saldo Inicial:', `R$ ${(cf.initialBalance || 0).toFixed(2)}`);
    htmlBody += renderFlexRow('Entradas Dinheiro:', `R$ ${(cf.cashIn || 0).toFixed(2)}`);
    htmlBody += renderFlexRow('Vendas Cartão:', `R$ ${(cf.cardTotal || 0).toFixed(2)}`);
    htmlBody += renderFlexRow('Vendas PIX:', `R$ ${(cf.pixTotal || 0).toFixed(2)}`);
    htmlBody += renderFlexRow('Sangrias/Retiradas:', `R$ ${(cf.withdrawals || 0).toFixed(2)}`);
    htmlBody += renderDivider('double');
    htmlBody += renderFlexRow('TOTAL EM CAIXA:', `R$ ${(cf.totalInCash || 0).toFixed(2)}`, true, '1.2em');
  } else if (type === 'comanda' || data.items) {
    const orderBold = doc.orderNumber?.bold !== false || globalBold;
    if (isVis('dateTime')) {
      htmlBody += renderFlexRow('Data/Hora:', `${data.date || new Date().toLocaleDateString('pt-BR')} ${data.time || ''}`);
    }
    if (isVis('orderNumber')) {
      htmlBody += renderFlexRow('Comanda/Mesa:', data.identifier || data.table || 'BALCÃO', orderBold, '1.2em');
    }
    if (data.sector) {
      htmlBody += renderFlexRow('Setor:', data.sector.toUpperCase(), true);
    }
    htmlBody += renderDivider('single');

    if (isVis('itemsTable')) {
      htmlBody += renderFlexRow('QTD ITEM', 'OBS', true);
      htmlBody += renderDivider('single');
      (data.items || []).forEach((it: any) => {
        const qtyStr = `${it.qty || it.quantity || 1}x`;
        const nameStr = (it.name || it.productName || 'Item').trim();
        htmlBody += `<div style="font-weight: 900; font-size: 1.1em; margin-top: 3px;">${escapeHtml(qtyStr)} ${escapeHtml(nameStr)}</div>`;
        if (it.notes) {
          htmlBody += `<div style="font-size: 0.9em; padding-left: 10px; font-style: italic;">OBS: ${escapeHtml(it.notes)}</div>`;
        }
      });
    }
  } else {
    // Venda / Sale
    const sale = data.sale || data;
    const tx = data.transaction || {};
    const dateStr = sale.timestamp ? new Date(sale.timestamp).toLocaleString('pt-BR') : `${new Date().toLocaleDateString('pt-BR')} ${new Date().toLocaleTimeString('pt-BR')}`;
    const orderBold = doc.orderNumber?.bold !== false || globalBold;

    if (isVis('orderNumber')) {
      const ticketNum = sale.id || sale.number || '0000';
      htmlBody += renderFlexRow('Cupom Nº:', `#${ticketNum.toString().slice(-8).toUpperCase()}`, orderBold, '1.1em');
    }
    if (isVis('dateTime')) {
      htmlBody += renderFlexRow('Data:', dateStr);
    }
    if (isVis('customerName')) {
      htmlBody += renderFlexRow('Cliente:', (sale.clientName || 'CONSUMIDOR').toUpperCase());
    }

    if (isVis('itemsTable')) {
      htmlBody += renderDivider('single');
      htmlBody += renderFlexRow('PRODUTO / QTD x UN', 'VALOR', true);
      htmlBody += renderDivider('single');

      const items = sale.items || [];
      const itemsBold = doc.itemsTable?.bold || globalBold;
      const itemsWeight = itemsBold ? '900' : '600';

      items.forEach((item: any) => {
        const qty = item.quantity || item.qty || 1;
        const unitPrice = item.unitPrice || item.product?.sellPrice || 0;
        const total = item.totalPrice || (unitPrice * qty) || 0;
        const pName = (item.product?.name || item.productName || item.name || 'Produto').trim();

        const qtyStr = `${qty}x`;
        const totalStr = `R$ ${total.toFixed(2)}`;
        const unitStr = `R$ ${unitPrice.toFixed(2)}`;

        htmlBody += `<div style="font-weight: ${itemsWeight}; margin-top: 2px; word-break: break-word;">${escapeHtml(pName)}</div>`;
        htmlBody += renderFlexRow(`  ${qtyStr} x ${unitStr}`, totalStr, itemsBold);
      });
    }

    if (isVis('totals')) {
      const totalsBold = doc.totals?.bold !== false || globalBold;
      htmlBody += renderDivider('single');
      htmlBody += renderFlexRow('Subtotal:', `R$ ${(sale.subtotal || sale.totalAmount || 0).toFixed(2)}`);
      if (sale.discountAmount && sale.discountAmount > 0) {
        htmlBody += renderFlexRow('Desconto:', `- R$ ${sale.discountAmount.toFixed(2)}`);
      }
      htmlBody += renderDivider('double');
      htmlBody += renderFlexRow('TOTAL PAGO:', `R$ ${(sale.totalAmount || sale.total || 0).toFixed(2)}`, totalsBold, '1.25em');
    }

    if (isVis('payments')) {
      htmlBody += renderFlexRow('Forma Pagto:', (sale.paymentMethod || tx.method || 'DINHEIRO').toUpperCase(), true);
      if (sale.changeAmount && sale.changeAmount > 0) {
        htmlBody += renderFlexRow('Troco:', `R$ ${sale.changeAmount.toFixed(2)}`);
      }
    }
  }

  // QR Code
  if (isVis('qrCode') && customQrCodeText.trim()) {
    htmlBody += renderDivider('single');
    htmlBody += `<div style="text-align: center; font-weight: 800; font-size: 0.9em;">CHAVE PIX / CONSULTA:</div>`;
    htmlBody += `<div style="text-align: center; font-weight: 900; font-size: 0.95em; word-break: break-all; margin-top: 2px;">${escapeHtml(customQrCodeText.trim())}</div>`;
  }

  // Barcode
  if (isVis('barcode')) {
    const saleId = data.sale?.id || data.id || '';
    if (saleId) {
      htmlBody += renderDivider('single');
      htmlBody += `<div style="text-align: center; font-family: monospace; font-weight: 900; letter-spacing: 2px;">* ${escapeHtml(saleId.toString().slice(-12).toUpperCase())} *</div>`;
    }
  }

  // Footer
  if (isVis('footer') && footerText.trim()) {
    htmlBody += renderDivider('single');
    footerText.split('\n').forEach(f => {
      if (f.trim()) {
        htmlBody += `<div style="text-align: center; font-size: 0.85em; font-weight: 600;">${escapeHtml(f.trim())}</div>`;
      }
    });
  }

  const fontSizeCss = paperSize === '80mm' ? '12px' : '10px';

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          @page {
            size: ${widthCss} auto;
            margin: 0mm;
          }
          *, *:before, *:after {
            box-sizing: border-box;
          }
          html, body {
            margin: 0;
            padding: 0;
            background: #ffffff;
            color: #000000;
          }
          body {
            width: ${widthCss};
            max-width: ${widthCss};
            margin: 0 auto;
            padding: 0 1mm 4mm 1mm;
            font-family: 'Courier New', 'Consolas', 'Liberation Mono', monospace;
            font-size: ${fontSizeCss};
            font-weight: ${globalWeight};
            line-height: 1.25;
            white-space: normal;
            word-break: break-word;
            overflow-wrap: break-word;
            overflow: hidden;
          }
        </style>
      </head>
      <body>
        ${htmlBody}
      </body>
    </html>
  `;
}

// Helper to escape HTML characters
function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// Instant Silent Printing via Hidden Iframe (System Printer / Windows Spooler)
export function printViaSystemBrowser(receiptTextOrHtml: string, paperSize: string = '58mm', customHtml?: string): Promise<boolean> {
  return new Promise((resolve) => {
    const widthCss = paperSize === '80mm' ? '72mm' : '48mm';

    let printIframe = document.getElementById('adegaos-print-iframe') as HTMLIFrameElement;
    if (!printIframe) {
      printIframe = document.createElement('iframe');
      printIframe.id = 'adegaos-print-iframe';
      printIframe.style.position = 'fixed';
      printIframe.style.right = '0';
      printIframe.style.bottom = '0';
      printIframe.style.width = '0px';
      printIframe.style.height = '0px';
      printIframe.style.border = '0px';
      printIframe.style.opacity = '0';
      printIframe.style.pointerEvents = 'none';
      document.body.appendChild(printIframe);
    }

    const htmlContent = customHtml || (receiptTextOrHtml.trim().startsWith('<!DOCTYPE') ? receiptTextOrHtml : `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            @page {
              size: ${widthCss} auto;
              margin: 0mm;
            }
            *, *:before, *:after {
              box-sizing: border-box;
            }
            body {
              margin: 0;
              padding: 0 1mm 4mm 1mm;
              width: ${widthCss};
              max-width: ${widthCss};
              font-family: 'Courier New', 'Consolas', monospace;
              font-size: ${paperSize === '80mm' ? '12px' : '10px'};
              font-weight: 700;
              line-height: 1.25;
              color: #000000;
              white-space: pre-wrap;
              word-break: break-word;
              overflow-wrap: break-word;
            }
          </style>
        </head>
        <body>
          <div>${escapeHtml(receiptTextOrHtml)}</div>
        </body>
      </html>
    `);

    const doc = printIframe.contentWindow?.document;
    if (doc) {
      doc.open();
      doc.write(htmlContent);
      doc.close();

      setTimeout(() => {
        try {
          printIframe.contentWindow?.focus();
          printIframe.contentWindow?.print();
          resolve(true);
        } catch (err) {
          console.warn('[FluxOS Print Iframe] Fallback to window.print():', err);
          window.print();
          resolve(true);
        }
      }, 100);
    } else {
      resolve(false);
    }
  });
}

// WebUSB Direct Real Execution & Discovery
export async function connectAndPrintWebUSB(buffer: Uint8Array, promptIfMissing: boolean = false): Promise<{ success: boolean; durationMs: number; errorMsg?: string }> {
  const start = performance.now();
  if (!('usb' in navigator)) {
    return { success: false, durationMs: 0, errorMsg: 'ERR_WEBUSB_NOT_SUPPORTED: Navegador não possui suporte à API WebUSB.' };
  }

  try {
    const devices = await (navigator as any).usb.getDevices();
    let device: any = null;

    if (devices && devices.length > 0) {
      device = devices[0];
    } else if (promptIfMissing) {
      device = await (navigator as any).usb.requestDevice({ filters: [] });
    }

    if (!device) {
      return { success: false, durationMs: Math.round(performance.now() - start), errorMsg: 'ERR_WEBUSB_NO_DEVICE: Nenhum dispositivo WebUSB pareado ou selecionado.' };
    }

    await device.open();
    if (device.configuration === null) {
      await device.selectConfiguration(1);
    }
    await device.claimInterface(0);

    const endpoint = device.configuration.interfaces[0]?.alternate?.endpoints?.find(
      (e: any) => e.direction === 'out'
    );

    if (endpoint) {
      await device.transferOut(endpoint.endpointNumber, buffer);
      await device.close();
      const durationMs = Math.round(performance.now() - start);
      return { success: true, durationMs };
    } else {
      await device.close();
      return { success: false, durationMs: Math.round(performance.now() - start), errorMsg: 'ERR_USB_ENDPOINT_NOT_FOUND: Endpoint de saída USB não encontrado no dispositivo.' };
    }
  } catch (err: any) {
    return { success: false, durationMs: Math.round(performance.now() - start), errorMsg: `ERR_WEBUSB_TRANSFER: ${err.message || String(err)}` };
  }
}

// WebSerial Direct Real Execution & Discovery
export async function connectAndPrintWebSerial(buffer: Uint8Array, baudRate: number = 9600): Promise<{ success: boolean; durationMs: number; errorMsg?: string }> {
  const start = performance.now();
  if (!('serial' in navigator)) {
    return { success: false, durationMs: 0, errorMsg: 'ERR_WEBSERIAL_NOT_SUPPORTED: Navegador não possui suporte à API WebSerial.' };
  }

  try {
    const port = await (navigator as any).serial.requestPort();
    await port.open({ baudRate });
    const writer = port.writable.getWriter();
    await writer.write(buffer);
    writer.releaseLock();
    await port.close();
    const durationMs = Math.round(performance.now() - start);
    return { success: true, durationMs };
  } catch (err: any) {
    return { success: false, durationMs: Math.round(performance.now() - start), errorMsg: `ERR_WEBSERIAL_TRANSFER: ${err.message || String(err)}` };
  }
}

// Main Dispatcher Function for Instant Thermal Printing
export async function triggerThermalPrint(
  typeOrPayload: any,
  maybeData?: any,
  targetSectorOrPrinterId?: string
): Promise<{ success: boolean; durationMs: number; bytesCount: number; errorMsg?: string }> {
  const start = performance.now();
  const printers = getSavedPrinters();
  let selectedPrinters: PrinterDevice[] = [];

  if (targetSectorOrPrinterId) {
    selectedPrinters = printers.filter(
      p => p.enabled && (
        p.id === targetSectorOrPrinterId ||
        p.sector.toLowerCase() === targetSectorOrPrinterId.toLowerCase()
      )
    );
  }

  if (selectedPrinters.length === 0) {
    const caixaPrinters = printers.filter(p => p.enabled && p.sector === 'caixa');
    selectedPrinters = caixaPrinters.length > 0 ? caixaPrinters : printers.filter(p => p.enabled);
  }

  if (selectedPrinters.length === 0) {
    selectedPrinters = [DEFAULT_PRINTERS[0]];
  }

  let totalBytes = 0;
  let lastError = '';
  let overallSuccess = true;

  for (const printer of selectedPrinters) {
    for (let copy = 0; copy < (printer.copies || 1); copy++) {
      let enterpriseConfig: any = null;
      try {
        const rawConfigs = localStorage.getItem('adegaos_enterprise_printer_configs_v2');
        if (rawConfigs) {
          const parsed = JSON.parse(rawConfigs);
          if (Array.isArray(parsed)) {
            enterpriseConfig = parsed.find((c: any) => c.id === printer.id) || parsed[0];
          }
        }
      } catch (e) {}

      const docSettings = enterpriseConfig?.document || {};
      const layoutSettings = enterpriseConfig?.layout || {};

      const receiptText = generateReceiptText(typeOrPayload, maybeData, printer.paperSize, docSettings);
      const receiptHtml = generateReceiptHtml(typeOrPayload, maybeData, printer.paperSize, docSettings, layoutSettings);
      const escPosBuffer = generateEscPosBuffer(receiptText, { autoCut: printer.autoCut, bold: layoutSettings.bold });
      totalBytes += escPosBuffer.length;

      localStorage.setItem('adegaos_last_receipt', receiptText);
      window.dispatchEvent(new CustomEvent('adegaos_new_print', { detail: receiptText }));

      let res: { success: boolean; durationMs: number; errorMsg?: string } = { success: false, durationMs: 0 };

      if (printer.method === 'webusb') {
        res = await connectAndPrintWebUSB(escPosBuffer, true);
      } else if (printer.method === 'webserial') {
        res = await connectAndPrintWebSerial(escPosBuffer);
      } else if (printer.method === 'virtual') {
        window.dispatchEvent(new CustomEvent('adegaos_thermal_print_requested', {
          detail: { text: receiptText, payload: typeOrPayload, escPosBuffer, mode: 'virtual' }
        }));
        res = { success: true, durationMs: Math.round(performance.now() - start) };
      } else {
        // System Spooler / Iframe
        const ok = await printViaSystemBrowser(receiptText, printer.paperSize, receiptHtml);
        res = { success: ok, durationMs: Math.round(performance.now() - start) };
      }

      const durationMs = Math.round(performance.now() - start);

      if (!res.success && printer.method !== 'system') {
        // Fallback to system spooler on hardware direct fail
        console.warn(`[Printer Engine] Direct hardware failed (${res.errorMsg}). Falling back to System Spooler.`);
        await printViaSystemBrowser(receiptText, printer.paperSize, receiptHtml);
      }

      // Record in Spooler Queue
      const job: SpoolJob = {
        id: `JOB_${Date.now()}_${Math.floor(Math.random()*1000)}`,
        printerId: printer.id,
        printerName: printer.name,
        timestamp: new Date().toLocaleTimeString('pt-BR'),
        bytesCount: escPosBuffer.length,
        status: res.success ? 'completed' : (printer.method === 'system' ? 'completed' : 'error'),
        durationMs,
        errorCode: res.errorMsg ? res.errorMsg.split(':')[0] : undefined,
        details: res.success ? `Enviado com sucesso (${escPosBuffer.length} bytes)` : (res.errorMsg || 'Erro desconhecido'),
        rawHexPreview: bufferToHexPreview(escPosBuffer, 24)
      };

      addSpoolJob(job);

      if (!res.success && printer.method !== 'system') {
        overallSuccess = false;
        lastError = res.errorMsg || 'Falha no envio direto ao dispositivo';
      }
    }
  }

  return {
    success: overallSuccess,
    durationMs: Math.round(performance.now() - start),
    bytesCount: totalBytes,
    errorMsg: lastError || undefined
  };
}
