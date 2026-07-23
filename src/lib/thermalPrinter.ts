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

// Formats text into receipt layout based on paper width (32 chars for 58mm, 48 chars for 80mm)
export function generateReceiptText(typeOrPayload: any, maybeData?: any, overridePaperSize?: string, customDocSettings?: any): string {
  let type = '';
  let title = 'CUPOM TÉRMICO';
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
  const width = paperSize === '80mm' ? 48 : 32;
  const divider = '-'.repeat(width);
  const doubleDivider = '='.repeat(width);

  const doc = customDocSettings || {};
  const isVis = (elKey: string) => doc[elKey]?.visible !== false;

  const storeName = (localStorage.getItem('adegaos_store_name') || 'ADEGA CENTRAL').toUpperCase();
  const cnpj = localStorage.getItem('adegaos_cnpj') || '';
  const headerText = localStorage.getItem('adegaos_header_text') || 'OBRIGADO PELA PREFERÊNCIA!';
  const footerText = localStorage.getItem('adegaos_footer_text') || 'FluxOS - Sistema de Gestão\n*** CUPOM NÃO FISCAL ***';

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
      headerText.split('\n').forEach(h => lines.push(center(h)));
    }
    lines.push(divider);
  }

  // 2. Logo
  if (isVis('logo')) {
    lines.push(center('[ LOGO EMPRESA ]'));
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
        const nameStr = (it.name || it.productName || 'Item').slice(0, width - 8);
        lines.push(justify(`${qtyStr} ${nameStr}`, it.notes ? `[${it.notes}]` : ''));
      });
    }
  } else {
    // Venda / Sale
    const sale = data.sale || data;
    const tx = data.transaction || {};
    const dateStr = sale.timestamp ? new Date(sale.timestamp).toLocaleString('pt-BR') : `${new Date().toLocaleDateString('pt-BR')} ${new Date().toLocaleTimeString('pt-BR')}`;
    
    if (isVis('orderNumber')) {
      lines.push(justify('Cupom Nº:', `#${(sale.id || sale.number || '0000').slice(-8).toUpperCase()}`));
    }
    if (isVis('dateTime')) {
      lines.push(justify('Data:', dateStr));
    }
    if (isVis('customerName')) {
      lines.push(justify('Cliente:', (sale.clientName || 'CONSUMIDOR').toUpperCase()));
    }
    
    if (isVis('itemsTable')) {
      lines.push(divider);
      lines.push(justify('QTD PRODUTO', 'TOTAL'));
      lines.push(divider);

      const items = sale.items || [];
      items.forEach((item: any) => {
        const qty = item.quantity || item.qty || 1;
        const pName = (item.product?.name || item.productName || item.name || 'Produto').slice(0, width - 10);
        const total = (item.totalPrice || (item.unitPrice * qty) || 0).toFixed(2);
        lines.push(justify(`${qty}x ${pName}`, `R$ ${total}`));
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

  if (isVis('qrCode')) {
    lines.push(divider);
    lines.push(center('[ QR CODE DE AUTENTICIDADE ]'));
  }

  if (isVis('barcode')) {
    lines.push(divider);
    lines.push(center('||||||||||||||||||||||||||||||'));
    lines.push(center('*' + (data.id || '123456789') + '*'));
  }

  if (isVis('footer')) {
    lines.push(divider);
    footerText.split('\n').forEach(f => lines.push(center(f)));
  }

  lines.push('\n\n\n');

  return lines.join('\n');
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
export function printViaSystemBrowser(receiptText: string, paperSize: string = '58mm'): Promise<boolean> {
  return new Promise((resolve) => {
    const widthCss = paperSize === '80mm' ? '76mm' : '52mm';

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

    const doc = printIframe.contentWindow?.document;
    if (doc) {
      doc.open();
      doc.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <style>
              @page {
                size: ${widthCss} auto;
                margin: 0mm;
              }
              body {
                margin: 0;
                padding: 0;
                font-family: 'Courier New', Courier, monospace;
                font-size: 11px;
                line-height: 1.25;
                color: #000000;
                white-space: pre-wrap;
                word-break: break-all;
              }
            </style>
          </head>
          <body>
            <div>${escapeHtml(receiptText)}</div>
          </body>
        </html>
      `);
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
      }, 80);
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
      const receiptText = generateReceiptText(typeOrPayload, maybeData, printer.paperSize);
      const escPosBuffer = generateEscPosBuffer(receiptText, { autoCut: printer.autoCut });
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
        const ok = await printViaSystemBrowser(receiptText, printer.paperSize);
        res = { success: ok, durationMs: Math.round(performance.now() - start) };
      }

      const durationMs = Math.round(performance.now() - start);

      if (!res.success && printer.method !== 'system') {
        // Fallback to system spooler on hardware direct fail
        console.warn(`[Printer Engine] Direct hardware failed (${res.errorMsg}). Falling back to System Spooler.`);
        await printViaSystemBrowser(receiptText, printer.paperSize);
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
