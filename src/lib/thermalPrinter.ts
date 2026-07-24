// FluxOS Thermal Printer Engine - Refactored ESC/POS & Document Matrix Architecture
// Clean Separation: Layout Engine -> Matrix Builder -> Style Engine -> ESC/POS Generator -> Transport Layer
// ZERO Hardcoded Column Constants (32, 42, 48). All layouts are calculated dynamically from PhysicalPrinterProfile.

export interface PhysicalPrinterProfile {
  paperSize: '58mm' | '80mm' | string;
  paperWidthMm: number; // 58mm or 80mm
  printableWidthMm: number; // e.g., 48mm for 58mm roll, 72mm for 80mm roll
  printableWidthDots: number; // e.g., 384 dots @ 203 DPI
  dotsPerMm: number; // default 8 dots/mm (203 DPI)
  fontFamily: 'font_a' | 'font_b' | 'font_c';
  fontWidthDots: number; // Font A = 12 dots, Font B = 9 dots, Font C = 8 dots
  fontHeightDots: number; // 24 dots
  columnsCount: number; // total calculated columns (e.g. 32, 42, 48, 64)
  leftMarginCols: number;
  rightMarginCols: number;
  usableColumns: number; // columnsCount - leftMarginCols - rightMarginCols
  lineSpacingDots: number; // e.g. 30 dots
  density: 'low' | 'medium' | 'high' | 'ultra';
  autoCut: boolean;
  cashDrawer: boolean;
}

export interface TextStyle {
  bold?: boolean;
  underline?: boolean;
  invert?: boolean;
  doubleWidth?: boolean;
  doubleHeight?: boolean;
  align?: 'left' | 'center' | 'right';
  font?: 'font_a' | 'font_b' | 'font_c';
}

export interface ColumnDef {
  text: string;
  widthRatio?: number; // ratio of printable width (0.0 to 1.0)
  widthCols?: number;  // explicit absolute character columns
  align?: 'left' | 'center' | 'right';
  mode?: 'wrap' | 'truncate' | 'ellipsis';
}

export type MatrixLine =
  | { type: 'text'; text: string; align?: 'left' | 'center' | 'right'; style?: TextStyle }
  | { type: 'flex_row'; leftText: string; rightText: string; style?: TextStyle; isBold?: boolean }
  | { type: 'table_row'; cols: ColumnDef[]; style?: TextStyle }
  | { type: 'divider'; char?: string; double?: boolean; style?: TextStyle }
  | { type: 'blank'; count?: number }
  | { type: 'barcode'; code: string; style?: TextStyle }
  | { type: 'qrcode'; text: string; style?: TextStyle }
  | { type: 'drawer' }
  | { type: 'cut' };

export interface SpoolJob {
  id: string;
  printerId: string;
  printerName: string;
  timestamp: string;
  bytesCount: number;
  status: 'completed' | 'error' | 'pending';
  durationMs: number;
  errorCode?: string;
  details?: string;
  rawHexPreview?: string;
}

export interface PrinterDevice {
  id: string;
  name: string;
  sector: string;
  method: 'webusb' | 'webserial' | 'network' | 'system' | 'virtual';
  connectionIp?: string;
  paperSize: '58mm' | '80mm';
  enabled: boolean;
  autoCut?: boolean;
  copies?: number;
}

// -----------------------------------------------------------------------------
// 1. HARDWARE & PROFILE ENGINE (DYNAMIC PHYSICAL CALCULATIONS)
// -----------------------------------------------------------------------------

export function getPhysicalPrinterProfile(
  paperSizeOverride?: string,
  hardwareConfig?: any,
  layoutConfig?: any
): PhysicalPrinterProfile {
  const paperSize = (paperSizeOverride || hardwareConfig?.paperSize || localStorage.getItem('adegaos_paper_size') || '58mm') as string;
  const paperWidthMm = paperSize === '80mm' ? 80 : 58;

  const printableWidthMm = Number(hardwareConfig?.printableWidthMm) > 0
    ? Number(hardwareConfig.printableWidthMm)
    : (paperSize === '80mm' ? 72 : 48);

  const dotsPerMm = Number(hardwareConfig?.dotsPerMm) > 0 ? Number(hardwareConfig.dotsPerMm) : 8; // 203 DPI standard
  const printableWidthDots = Math.round(printableWidthMm * dotsPerMm);

  const fontFamily = (layoutConfig?.fontFamily || hardwareConfig?.fontFamily || 'font_a') as 'font_a' | 'font_b' | 'font_c';

  let fontWidthDots = 12;
  let fontHeightDots = 24;
  if (fontFamily === 'font_b') {
    fontWidthDots = 9;
    fontHeightDots = 24;
  } else if (fontFamily === 'font_c') {
    fontWidthDots = 8;
    fontHeightDots = 16;
  }

  // Calculate maximum column capacity dynamically from physical metrics
  const calculatedColumnsCount = Math.floor(printableWidthDots / fontWidthDots);

  // Use explicit columns override if user explicitly supplied it in hardware config, otherwise strictly calculated
  const columnsCount = hardwareConfig?.columnsCount && Number(hardwareConfig.columnsCount) > 0
    ? Number(hardwareConfig.columnsCount)
    : calculatedColumnsCount;

  const leftMarginCols = hardwareConfig?.leftMarginCols ? Math.max(0, Number(hardwareConfig.leftMarginCols)) : 0;
  const rightMarginCols = hardwareConfig?.rightMarginCols ? Math.max(0, Number(hardwareConfig.rightMarginCols)) : 0;
  const usableColumns = Math.max(8, columnsCount - leftMarginCols - rightMarginCols);

  return {
    paperSize: paperSize as '58mm' | '80mm',
    paperWidthMm,
    printableWidthMm,
    printableWidthDots,
    dotsPerMm,
    fontFamily,
    fontWidthDots,
    fontHeightDots,
    columnsCount,
    leftMarginCols,
    rightMarginCols,
    usableColumns,
    lineSpacingDots: layoutConfig?.lineSpacing || 30,
    density: layoutConfig?.density || 'high',
    autoCut: hardwareConfig?.autoCut !== false,
    cashDrawer: hardwareConfig?.cashDrawer === true
  };
}

// -----------------------------------------------------------------------------
// 2. LAYOUT ENGINE (ZERO HARDCODING, DYNAMIC FIT, TABLE RENDERER)
// -----------------------------------------------------------------------------

export class LayoutEngine {
  private profile: PhysicalPrinterProfile;

  constructor(profile?: PhysicalPrinterProfile) {
    this.profile = profile || getPhysicalPrinterProfile();
  }

  public getProfile(): PhysicalPrinterProfile {
    return this.profile;
  }

  public getUsableColumns(): number {
    return this.profile.usableColumns;
  }

  public getMaxChars(style?: TextStyle): number {
    const doubleWidth = style?.doubleWidth === true;
    const cols = doubleWidth ? Math.floor(this.profile.usableColumns / 2) : this.profile.usableColumns;
    return Math.max(1, cols);
  }

  // Pure alignment formatter WITHOUT padStart or padEnd
  public alignString(text: string, widthCols: number, align: 'left' | 'center' | 'right' = 'left'): string {
    const s = (text || '').replace(/\r|\n/g, '');
    if (s.length >= widthCols) return s.slice(0, widthCols);
    const diff = widthCols - s.length;

    if (align === 'center') {
      const leftPad = Math.floor(diff / 2);
      const rightPad = diff - leftPad;
      return ' '.repeat(leftPad) + s + ' '.repeat(rightPad);
    }
    if (align === 'right') {
      return ' '.repeat(diff) + s;
    }
    return s + ' '.repeat(diff);
  }

  // fitText: Respects usable column capacity with wrapping or smart truncation
  public fitText(
    text: string,
    maxWidthCols?: number,
    options?: {
      mode?: 'wrap' | 'truncate' | 'ellipsis';
      align?: 'left' | 'center' | 'right';
      style?: TextStyle;
    }
  ): string[] {
    const limit = maxWidthCols ?? this.getMaxChars(options?.style);
    const mode = options?.mode || 'wrap';
    const align = options?.align || 'left';
    const str = (text || '').replace(/\r/g, '');

    if (!str) return [this.alignString('', limit, align)];

    if (mode === 'truncate') {
      const trunc = str.slice(0, limit);
      return [this.alignString(trunc, limit, align)];
    }

    if (mode === 'ellipsis') {
      if (str.length <= limit) return [this.alignString(str, limit, align)];
      const ell = limit > 3 ? str.slice(0, limit - 3) + '...' : str.slice(0, limit);
      return [this.alignString(ell, limit, align)];
    }

    // Default: 'wrap'
    const words = str.trim().split(' ');
    const lines: string[] = [];
    let currentLine = '';

    for (const word of words) {
      if (word.length > limit) {
        if (currentLine) {
          lines.push(currentLine);
          currentLine = '';
        }
        let rem = word;
        while (rem.length > limit) {
          lines.push(rem.slice(0, limit));
          rem = rem.slice(limit);
        }
        currentLine = rem;
      } else if (currentLine.length + (currentLine ? 1 : 0) + word.length <= limit) {
        currentLine += (currentLine ? ' ' : '') + word;
      } else {
        lines.push(currentLine);
        currentLine = word;
      }
    }
    if (currentLine) lines.push(currentLine);
    if (lines.length === 0) lines.push('');

    return lines.map(line => this.alignString(line, limit, align));
  }

  // Column Table Renderer replacing padStart/padEnd and manual concatenation
  public renderRow(cols: ColumnDef[], style?: TextStyle): string[] {
    const lineCapacity = this.getMaxChars(style);
    if (!cols || cols.length === 0) return [this.alignString('', lineCapacity, 'left')];

    const widths: number[] = new Array(cols.length).fill(0);
    let assignedCols = 0;
    let unassignedCount = 0;

    // Pass 1: Explicit column widths or ratios
    cols.forEach((col, idx) => {
      if (col.widthCols && col.widthCols > 0) {
        widths[idx] = Math.min(lineCapacity, col.widthCols);
        assignedCols += widths[idx];
      } else if (col.widthRatio && col.widthRatio > 0) {
        widths[idx] = Math.floor(lineCapacity * col.widthRatio);
        assignedCols += widths[idx];
      } else {
        unassignedCount++;
      }
    });

    // Pass 2: Flex width for unassigned columns
    const remaining = Math.max(0, lineCapacity - assignedCols);
    if (unassignedCount > 0) {
      const flexWidth = Math.floor(remaining / unassignedCount);
      cols.forEach((col, idx) => {
        if (!widths[idx]) {
          widths[idx] = flexWidth;
        }
      });
    }

    // Pass 3: Reconcile exact sum to match lineCapacity
    const currentSum = widths.reduce((a, b) => a + b, 0);
    const diff = lineCapacity - currentSum;
    if (widths.length > 0) {
      widths[widths.length - 1] = Math.max(1, widths[widths.length - 1] + diff);
    }

    // Format each cell
    const colFormattedLines: string[][] = cols.map((col, idx) => {
      const colWidth = widths[idx];
      return this.fitText(col.text, colWidth, {
        mode: col.mode || 'wrap',
        align: col.align || 'left'
      });
    });

    // Combine cell lines into row lines
    const rowHeight = Math.max(...colFormattedLines.map(lines => lines.length), 1);
    const resultRows: string[] = [];

    for (let r = 0; r < rowHeight; r++) {
      let lineStr = '';
      cols.forEach((col, cIdx) => {
        const colWidth = widths[cIdx];
        const cellLine = colFormattedLines[cIdx][r] || this.alignString('', colWidth, col.align || 'left');
        lineStr += cellLine;
      });
      resultRows.push(lineStr);
    }

    return resultRows;
  }

  // 2-Column Flex Row Renderer
  public renderFlexRow(leftText: string, rightText: string, style?: TextStyle): string[] {
    const left = (leftText || '').trim();
    const right = (rightText || '').trim();
    const totalCols = this.getMaxChars(style);

    if (!right) {
      return this.fitText(left, totalCols, { mode: 'wrap', align: 'left', style });
    }
    if (!left) {
      return [this.alignString(right, totalCols, 'right')];
    }

    const rightWidth = Math.min(totalCols - 2, Math.max(1, right.length));
    const leftWidth = Math.max(1, totalCols - rightWidth);

    return this.renderRow([
      { text: left, widthCols: leftWidth, align: 'left', mode: 'wrap' },
      { text: right, widthCols: rightWidth, align: 'right', mode: 'truncate' }
    ], style);
  }

  public renderDivider(char: string = '-', style?: TextStyle): string {
    const cols = this.getMaxChars(style);
    return char.repeat(cols);
  }

  // Generate Numbered Ruler (12345678901234567890... up to usableColumns)
  public generateRuler(): string {
    const cols = this.profile.usableColumns;
    let ruler = '';
    for (let i = 1; i <= cols; i++) {
      ruler += (i % 10).toString();
    }
    return ruler;
  }

  // Diagnostic Mode Generator
  public generateDiagnosticReport(modelName?: string): {
    matrixLines: MatrixLine[];
    ruler: string;
  } {
    const p = this.profile;
    const ruler = this.generateRuler();

    const matrixLines: MatrixLine[] = [
      { type: 'text', text: 'DIAGNÓSTICO DA IMPRESSORA', align: 'center', style: { bold: true } },
      { type: 'divider' },
      { type: 'flex_row', leftText: 'Modelo:', rightText: modelName || p.paperSize, isBold: true },
      { type: 'flex_row', leftText: 'Largura Papel:', rightText: `${p.paperWidthMm}mm` },
      { type: 'flex_row', leftText: 'Largura Imprimível:', rightText: `${p.printableWidthMm}mm (${p.printableWidthDots} dots)` },
      { type: 'flex_row', leftText: 'DPI / Resolução:', rightText: `${Math.round(p.dotsPerMm * 25.4)} DPI (${p.dotsPerMm} dots/mm)` },
      { type: 'flex_row', leftText: 'Fonte Ativa:', rightText: `${p.fontFamily.toUpperCase()} (${p.fontWidthDots}x${p.fontHeightDots} dots)` },
      { type: 'flex_row', leftText: 'Largura do Caractere:', rightText: `${p.fontWidthDots} dots (${(p.fontWidthDots / p.dotsPerMm).toFixed(2)}mm)` },
      { type: 'flex_row', leftText: 'Colunas Max Detectadas:', rightText: `${p.columnsCount} cols` },
      { type: 'flex_row', leftText: 'Colunas Efetivas Usadas:', rightText: `${p.usableColumns} cols`, isBold: true },
      { type: 'divider' },
      { type: 'text', text: 'RÉGUA NUMERADA DE COLUNAS (1 ATÉ MAX):', align: 'left', style: { bold: true } },
      { type: 'text', text: ruler, align: 'left', style: { bold: true } },
      { type: 'divider' },
      { type: 'text', text: 'TESTE DE CARACTERES & SÍMBOLOS:', align: 'center', style: { bold: true } },
      { type: 'text', text: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789', align: 'left' },
      { type: 'text', text: 'abcdefghijklmnopqrstuvwxyz!@#$%&*()', align: 'left' },
      { type: 'divider', double: true }
    ];

    return { matrixLines, ruler };
  }
}

// -----------------------------------------------------------------------------
// STANDALONE UTILITIES (BACKWARD COMPATIBILITY FORWARDED TO LAYOUT ENGINE)
// -----------------------------------------------------------------------------

export function fitText(
  text: string,
  maxCols?: number,
  options?: { mode?: 'wrap' | 'truncate' | 'ellipsis'; align?: 'left' | 'center' | 'right'; style?: TextStyle }
): string[] {
  const engine = new LayoutEngine();
  return engine.fitText(text, maxCols, options);
}

export function wrapText(text: string, maxCols?: number): string[] {
  const engine = new LayoutEngine();
  return engine.fitText(text, maxCols, { mode: 'wrap' });
}

export function formatFlexRow(leftText: string, rightText: string, usableColumns?: number): string[] {
  const profile = getPhysicalPrinterProfile();
  if (usableColumns) profile.usableColumns = usableColumns;
  const engine = new LayoutEngine(profile);
  return engine.renderFlexRow(leftText, rightText);
}

export function alignText(text: string, usableColumns?: number, align: 'left' | 'center' | 'right' = 'left'): string {
  const profile = getPhysicalPrinterProfile();
  if (usableColumns) profile.usableColumns = usableColumns;
  const engine = new LayoutEngine(profile);
  return engine.alignString(text, usableColumns || engine.getUsableColumns(), align);
}

// -----------------------------------------------------------------------------
// 3. DOCUMENT MATRIX BUILDER (USING LAYOUT ENGINE)
// -----------------------------------------------------------------------------

export function buildDocumentMatrix(
  typeOrPayload: any,
  maybeData?: any,
  profileOverride?: PhysicalPrinterProfile,
  customDocSettings?: any
): MatrixLine[] {
  let type = '';
  let title = 'CUPOM NÃO FISCAL';
  let data: any = null;

  if (typeof typeOrPayload === 'string') {
    type = typeOrPayload;
    data = maybeData || {};
    if (type === 'cash_flow') title = 'FECHAMENTO DE CAIXA';
    else if (type === 'comanda') title = 'COMPROVANTE DE PRODUÇÃO';
    else if (type === 'sale') title = 'CUPOM NÃO FISCAL';
    else if (type === 'diagnostic') title = 'DIAGNÓSTICO IMPRESSORA';
  } else if (typeOrPayload && typeof typeOrPayload === 'object') {
    type = typeOrPayload.type || 'sale';
    title = typeOrPayload.title || 'CUPOM NÃO FISCAL';
    data = typeOrPayload.data || {};
  }

  const profile = profileOverride || getPhysicalPrinterProfile();
  const engine = new LayoutEngine(profile);
  const doc = customDocSettings || {};
  const isVis = (key: string) => doc[key]?.visible !== false;

  const storeName = (localStorage.getItem('adegaos_store_name') || 'ADEGA CENTRAL').toUpperCase();
  const cnpj = localStorage.getItem('adegaos_cnpj') || '';
  const headerText = localStorage.getItem('adegaos_header_text') || 'OBRIGADO PELA PREFERÊNCIA!';
  const footerText = localStorage.getItem('adegaos_footer_text') || 'FluxOS - Sistema de Gestão\n*** CUPOM NÃO FISCAL ***';
  const customLogoText = localStorage.getItem('adegaos_receipt_logo_text') || '';
  const customQrCodeText = localStorage.getItem('adegaos_receipt_qrcode_text') || localStorage.getItem('adegaos_pix_key') || '';

  const matrix: MatrixLine[] = [];

  // Diagnostic Mode
  if (type === 'diagnostic') {
    const diagReport = engine.generateDiagnosticReport(data.model);
    diagReport.matrixLines.forEach(l => matrix.push(l));
    if (profile.cashDrawer) matrix.push({ type: 'drawer' });
    if (profile.autoCut) matrix.push({ type: 'cut' });
    matrix.push({ type: 'blank', count: 2 });
    return matrix;
  }

  // Header
  if (isVis('header')) {
    const hStyle = doc.header || {};
    matrix.push({ type: 'text', text: storeName, align: hStyle.align || 'center', style: { bold: hStyle.bold !== false, doubleHeight: hStyle.size === 'double' || hStyle.size === 'large' } });
    if (cnpj) matrix.push({ type: 'text', text: `CNPJ: ${cnpj}`, align: 'center' });
    if (headerText) {
      headerText.split('\n').forEach((h: string) => {
        if (h.trim()) matrix.push({ type: 'text', text: h.trim(), align: 'center' });
      });
    }
    matrix.push({ type: 'divider' });
  }

  // Logo
  if (isVis('logo') && customLogoText.trim()) {
    matrix.push({ type: 'text', text: customLogoText.trim().toUpperCase(), align: doc.logo?.align || 'center', style: { bold: true } });
    matrix.push({ type: 'divider' });
  }

  // Title
  matrix.push({ type: 'text', text: title.toUpperCase(), align: 'center', style: { bold: true } });
  matrix.push({ type: 'divider' });

  // Body Content per Document Type
  if (type === 'cash_flow' || data.cash_flow) {
    const cf = data.cash_flow || data;
    if (isVis('dateTime')) {
      matrix.push({ type: 'flex_row', leftText: 'Data:', rightText: cf.date || new Date().toLocaleDateString('pt-BR') });
      matrix.push({ type: 'flex_row', leftText: 'Hora:', rightText: cf.time || new Date().toLocaleTimeString('pt-BR') });
    }
    matrix.push({ type: 'flex_row', leftText: 'Operador:', rightText: cf.cashierId || 'GERENTE' });
    matrix.push({ type: 'divider' });
    matrix.push({ type: 'flex_row', leftText: 'Saldo Inicial:', rightText: `R$ ${(cf.initialBalance || 0).toFixed(2)}` });
    matrix.push({ type: 'flex_row', leftText: 'Entradas Dinheiro:', rightText: `R$ ${(cf.cashIn || 0).toFixed(2)}` });
    matrix.push({ type: 'flex_row', leftText: 'Vendas Cartão:', rightText: `R$ ${(cf.cardTotal || 0).toFixed(2)}` });
    matrix.push({ type: 'flex_row', leftText: 'Vendas PIX:', rightText: `R$ ${(cf.pixTotal || 0).toFixed(2)}` });
    matrix.push({ type: 'flex_row', leftText: 'Sangrias/Retiradas:', rightText: `R$ ${(cf.withdrawals || 0).toFixed(2)}` });
    matrix.push({ type: 'divider', double: true });
    matrix.push({ type: 'flex_row', leftText: 'TOTAL EM CAIXA:', rightText: `R$ ${(cf.totalInCash || 0).toFixed(2)}`, isBold: true });
  } else if (type === 'comanda' || data.items) {
    if (isVis('dateTime')) {
      matrix.push({ type: 'flex_row', leftText: 'Data/Hora:', rightText: `${data.date || new Date().toLocaleDateString('pt-BR')} ${data.time || ''}` });
    }
    if (isVis('orderNumber')) {
      const orderStyle = doc.orderNumber || {};
      matrix.push({ type: 'flex_row', leftText: 'Comanda/Mesa:', rightText: String(data.identifier || data.table || 'BALCÃO'), isBold: orderStyle.bold !== false });
    }
    if (data.sector) matrix.push({ type: 'flex_row', leftText: 'Setor:', rightText: data.sector.toUpperCase(), isBold: true });
    matrix.push({ type: 'divider' });

    if (isVis('itemsTable')) {
      matrix.push({
        type: 'table_row',
        cols: [
          { text: 'QTD ITEM', widthRatio: 0.7, align: 'left' },
          { text: 'OBS', widthRatio: 0.3, align: 'right' }
        ],
        style: { bold: true }
      });
      matrix.push({ type: 'divider' });
      (data.items || []).forEach((it: any) => {
        const qtyStr = `${it.qty || it.quantity || 1}x`;
        const nameStr = (it.name || it.productName || 'Item').trim();
        matrix.push({ type: 'flex_row', leftText: `${qtyStr} ${nameStr}`, rightText: '', isBold: true });
        if (it.notes) {
          matrix.push({ type: 'text', text: `   OBS: ${it.notes}`, style: { bold: false } });
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
      matrix.push({ type: 'flex_row', leftText: 'Cupom Nº:', rightText: `#${ticketNum.toString().slice(-8).toUpperCase()}`, isBold: doc.orderNumber?.bold !== false });
    }
    if (isVis('dateTime')) {
      matrix.push({ type: 'flex_row', leftText: 'Data:', rightText: dateStr });
    }
    if (isVis('customerName')) {
      matrix.push({ type: 'flex_row', leftText: 'Cliente:', rightText: (sale.clientName || 'CONSUMIDOR').toUpperCase() });
    }

    if (isVis('itemsTable')) {
      matrix.push({ type: 'divider' });
      matrix.push({
        type: 'table_row',
        cols: [
          { text: 'PRODUTO / QTD x UN', widthRatio: 0.7, align: 'left' },
          { text: 'VALOR', widthRatio: 0.3, align: 'right' }
        ],
        style: { bold: true }
      });
      matrix.push({ type: 'divider' });

      const items = sale.items || [];
      items.forEach((item: any) => {
        const qty = item.quantity || item.qty || 1;
        const unitPrice = item.unitPrice || item.product?.sellPrice || 0;
        const total = item.totalPrice || (unitPrice * qty) || 0;
        const pName = (item.product?.name || item.productName || item.name || 'Produto').trim();

        const qtyStr = `${qty}x`;
        const totalStr = `R$ ${total.toFixed(2)}`;
        const unitStr = `R$ ${unitPrice.toFixed(2)}`;

        matrix.push({ type: 'text', text: pName, style: { bold: true } });
        matrix.push({ type: 'flex_row', leftText: `  ${qtyStr} x ${unitStr}`, rightText: totalStr });
      });
    }

    if (isVis('totals')) {
      matrix.push({ type: 'divider' });
      matrix.push({ type: 'flex_row', leftText: 'Subtotal:', rightText: `R$ ${(sale.subtotal || sale.totalAmount || 0).toFixed(2)}` });
      if (sale.discountAmount && sale.discountAmount > 0) {
        matrix.push({ type: 'flex_row', leftText: 'Desconto:', rightText: `- R$ ${sale.discountAmount.toFixed(2)}` });
      }
      matrix.push({ type: 'divider', double: true });
      matrix.push({ type: 'flex_row', leftText: 'TOTAL PAGO:', rightText: `R$ ${(sale.totalAmount || sale.total || 0).toFixed(2)}`, isBold: doc.totals?.bold !== false });
    }

    if (isVis('payments')) {
      matrix.push({ type: 'flex_row', leftText: 'Forma Pagto:', rightText: (sale.paymentMethod || tx.method || 'DINHEIRO').toUpperCase() });
      if (sale.changeAmount && sale.changeAmount > 0) {
        matrix.push({ type: 'flex_row', leftText: 'Troco:', rightText: `R$ ${sale.changeAmount.toFixed(2)}` });
      }
    }
  }

  // QR Code
  if (isVis('qrCode') && customQrCodeText.trim()) {
    matrix.push({ type: 'divider' });
    matrix.push({ type: 'text', text: 'CHAVE PIX / CONSULTA:', align: 'center' });
    matrix.push({ type: 'qrcode', text: customQrCodeText.trim(), style: { align: 'center' } });
    matrix.push({ type: 'text', text: customQrCodeText.trim(), align: 'center' });
  }

  // Barcode
  if (isVis('barcode')) {
    const saleId = data.sale?.id || data.id || '';
    if (saleId) {
      matrix.push({ type: 'divider' });
      matrix.push({ type: 'barcode', code: saleId.toString().slice(-12).toUpperCase(), style: { align: 'center' } });
      matrix.push({ type: 'text', text: `* ${saleId.toString().slice(-12).toUpperCase()} *`, align: 'center' });
    }
  }

  // Footer
  if (isVis('footer') && footerText.trim()) {
    matrix.push({ type: 'divider' });
    footerText.split('\n').forEach((f: string) => {
      if (f.trim()) matrix.push({ type: 'text', text: f.trim(), align: 'center' });
    });
  }

  if (profile.cashDrawer) matrix.push({ type: 'drawer' });
  if (profile.autoCut) matrix.push({ type: 'cut' });
  matrix.push({ type: 'blank', count: 3 });

  return matrix;
}

// -----------------------------------------------------------------------------
// 4. MATRIX PROCESSOR TO PLAIN MONOSPACE TEXT (PREVIEW / LOGS)
// -----------------------------------------------------------------------------

export function renderMatrixToText(matrix: MatrixLine[], profile: PhysicalPrinterProfile): string {
  const engine = new LayoutEngine(profile);
  const cols = engine.getUsableColumns();
  const marginPad = ' '.repeat(profile.leftMarginCols);
  const lines: string[] = [];

  for (const item of matrix) {
    if (item.type === 'blank') {
      for (let i = 0; i < (item.count || 1); i++) lines.push('');
    } else if (item.type === 'divider') {
      const char = item.char || (item.double ? '=' : '-');
      lines.push(marginPad + engine.renderDivider(char, item.style));
    } else if (item.type === 'text') {
      const wrapped = engine.fitText(item.text, cols, { mode: 'wrap', align: item.align || 'left', style: item.style });
      wrapped.forEach(w => lines.push(marginPad + w));
    } else if (item.type === 'flex_row') {
      const formatted = engine.renderFlexRow(item.leftText, item.rightText, item.style);
      formatted.forEach(f => lines.push(marginPad + f));
    } else if (item.type === 'table_row') {
      const formatted = engine.renderRow(item.cols, item.style);
      formatted.forEach(f => lines.push(marginPad + f));
    } else if (item.type === 'qrcode') {
      lines.push(marginPad + engine.alignString(`[QRCODE: ${item.text}]`, cols, 'center'));
    } else if (item.type === 'barcode') {
      lines.push(marginPad + engine.alignString(`[BARCODE: ${item.code}]`, cols, 'center'));
    }
  }

  return lines.join('\n');
}

// -----------------------------------------------------------------------------
// 5. ESC/POS STYLE ENGINE & STATE MACHINE (STATEFUL COMMAND EMISSION)
// -----------------------------------------------------------------------------

export class EscPosStyleState {
  align: 'left' | 'center' | 'right' = 'left';
  font: 'font_a' | 'font_b' | 'font_c' = 'font_a';
  bold: boolean = false;
  underline: boolean = false;
  invert: boolean = false;
  doubleWidth: boolean = false;
  doubleHeight: boolean = false;

  getInitBytes(): Uint8Array {
    this.align = 'left';
    this.font = 'font_a';
    this.bold = false;
    this.underline = false;
    this.invert = false;
    this.doubleWidth = false;
    this.doubleHeight = false;
    return new Uint8Array([
      0x1B, 0x40,             // ESC @ (Reset Printer)
      0x1B, 0x33, 30,         // ESC 3 30 (Line spacing 30 dots)
      0x1B, 0x61, 0x00,       // Align left
      0x1B, 0x4D, 0x00,       // Font A
      0x1B, 0x45, 0x00,       // Bold OFF
      0x1B, 0x2D, 0x00,       // Underline OFF
      0x1D, 0x42, 0x00,       // Invert OFF
      0x1D, 0x21, 0x00        // Normal 1x1 size
    ]);
  }

  transitionTo(targetStyle?: TextStyle): Uint8Array {
    const bytes: number[] = [];

    const targetAlign = targetStyle?.align || 'left';
    if (this.align !== targetAlign) {
      this.align = targetAlign;
      const alignCode = targetAlign === 'center' ? 0x01 : targetAlign === 'right' ? 0x02 : 0x00;
      bytes.push(0x1B, 0x61, alignCode);
    }

    const targetFont = targetStyle?.font || 'font_a';
    if (this.font !== targetFont) {
      this.font = targetFont;
      const fontCode = targetFont === 'font_b' ? 0x01 : targetFont === 'font_c' ? 0x02 : 0x00;
      bytes.push(0x1B, 0x4D, fontCode);
    }

    const targetBold = targetStyle?.bold === true;
    if (this.bold !== targetBold) {
      this.bold = targetBold;
      bytes.push(0x1B, 0x45, targetBold ? 0x01 : 0x00);
    }

    const targetUnderline = targetStyle?.underline === true;
    if (this.underline !== targetUnderline) {
      this.underline = targetUnderline;
      bytes.push(0x1B, 0x2D, targetUnderline ? 0x01 : 0x00);
    }

    const targetInvert = targetStyle?.invert === true;
    if (this.invert !== targetInvert) {
      this.invert = targetInvert;
      bytes.push(0x1D, 0x42, targetInvert ? 0x01 : 0x00);
    }

    const targetDW = targetStyle?.doubleWidth === true;
    const targetDH = targetStyle?.doubleHeight === true;
    if (this.doubleWidth !== targetDW || this.doubleHeight !== targetDH) {
      this.doubleWidth = targetDW;
      this.doubleHeight = targetDH;
      const w = targetDW ? 1 : 0;
      const h = targetDH ? 1 : 0;
      const n = (w << 4) | h;
      bytes.push(0x1D, 0x21, n);
    }

    return new Uint8Array(bytes);
  }
}

const textEncoder = new TextEncoder();

export function renderMatrixToEscPosBuffer(
  matrix: MatrixLine[],
  profile: PhysicalPrinterProfile,
  options?: any
): Uint8Array {
  const engine = new LayoutEngine(profile);
  const chunks: Uint8Array[] = [];
  const state = new EscPosStyleState();

  // Initialize Printer
  chunks.push(state.getInitBytes());

  // Density Command
  if (profile.density === 'ultra') chunks.push(new Uint8Array([0x1D, 0x28, 0x4B, 0x02, 0x00, 0x31, 0x02]));

  const cols = engine.getUsableColumns();
  const leftPad = ' '.repeat(profile.leftMarginCols);

  for (const item of matrix) {
    if (item.type === 'blank') {
      for (let i = 0; i < (item.count || 1); i++) {
        chunks.push(textEncoder.encode('\n'));
      }
    } else if (item.type === 'divider') {
      chunks.push(state.transitionTo({ align: 'left', bold: false }));
      const char = item.char || (item.double ? '=' : '-');
      const divLine = engine.renderDivider(char, item.style);
      chunks.push(textEncoder.encode(leftPad + divLine + '\n'));
    } else if (item.type === 'text') {
      chunks.push(state.transitionTo({ align: item.align || 'left', ...item.style }));
      const wrapped = engine.fitText(item.text, cols, { mode: 'wrap', align: item.align || 'left', style: item.style });
      wrapped.forEach(w => {
        chunks.push(textEncoder.encode(leftPad + w + '\n'));
      });
      if (item.style?.bold || item.style?.doubleHeight) {
        chunks.push(state.transitionTo({ bold: false, doubleHeight: false, doubleWidth: false }));
      }
    } else if (item.type === 'flex_row') {
      const isBold = item.isBold === true || item.style?.bold === true;
      chunks.push(state.transitionTo({ align: 'left', bold: isBold, ...item.style }));
      const formatted = engine.renderFlexRow(item.leftText, item.rightText, item.style);
      formatted.forEach(f => {
        chunks.push(textEncoder.encode(leftPad + f + '\n'));
      });
      if (isBold) {
        chunks.push(state.transitionTo({ bold: false }));
      }
    } else if (item.type === 'table_row') {
      const isBold = item.style?.bold === true;
      chunks.push(state.transitionTo({ align: 'left', bold: isBold, ...item.style }));
      const formatted = engine.renderRow(item.cols, item.style);
      formatted.forEach(f => {
        chunks.push(textEncoder.encode(leftPad + f + '\n'));
      });
      if (isBold) {
        chunks.push(state.transitionTo({ bold: false }));
      }
    } else if (item.type === 'drawer') {
      chunks.push(new Uint8Array([0x1B, 0x70, 0x00, 0x19, 0xFA]));
    } else if (item.type === 'cut') {
      chunks.push(new Uint8Array([0x1D, 0x56, 0x42, 0x00]));
    }
  }

  // Final Reset
  chunks.push(state.getInitBytes());

  // Flatten Chunks into Single Uint8Array
  const totalLen = chunks.reduce((acc, c) => acc + c.length, 0);
  const finalBuffer = new Uint8Array(totalLen);
  let offset = 0;
  for (const chunk of chunks) {
    finalBuffer.set(chunk, offset);
    offset += chunk.length;
  }

  return finalBuffer;
}

// -----------------------------------------------------------------------------
// 6. HTML GENERATOR FOR SYSTEM SPOOLER (BROWSER PRINTING)
// -----------------------------------------------------------------------------

export function generateReceiptHtmlFromMatrix(
  matrix: MatrixLine[],
  profile: PhysicalPrinterProfile,
  customDocSettings?: any,
  customLayoutSettings?: any
): string {
  const widthCss = `${profile.printableWidthMm}mm`;
  const fontSizeCss = profile.paperSize === '80mm' ? '12px' : '10px';
  const globalBold = customLayoutSettings?.bold === true;

  let bodyHtml = '';

  for (const item of matrix) {
    if (item.type === 'blank') {
      bodyHtml += `<div style="height: ${12 * (item.count || 1)}px;"></div>`;
    } else if (item.type === 'divider') {
      const border = item.double ? '2px solid #000' : '1px dashed #000';
      bodyHtml += `<div style="border-top: ${border}; margin: 3px 0;"></div>`;
    } else if (item.type === 'text') {
      const align = item.align || 'left';
      const isBold = item.style?.bold || globalBold;
      const weight = isBold ? '900' : '600';
      const size = item.style?.doubleHeight ? '1.25em' : '1em';
      bodyHtml += `<div style="text-align: ${align}; font-weight: ${weight}; font-size: ${size}; margin: 1px 0;">${escapeHtml(item.text)}</div>`;
    } else if (item.type === 'flex_row') {
      const isBold = item.isBold || item.style?.bold || globalBold;
      const weight = isBold ? '900' : '600';
      bodyHtml += `
        <div style="display: flex; justify-content: space-between; align-items: baseline; width: 100%; font-weight: ${weight}; margin: 1px 0;">
          <span style="overflow: hidden; text-overflow: ellipsis; white-space: nowrap; padding-right: 4px;">${escapeHtml(item.leftText)}</span>
          <span style="white-space: nowrap; font-variant-numeric: tabular-nums;">${escapeHtml(item.rightText)}</span>
        </div>
      `;
    } else if (item.type === 'table_row') {
      const isBold = item.style?.bold || globalBold;
      const weight = isBold ? '900' : '600';
      bodyHtml += `<div style="display: flex; justify-content: space-between; width: 100%; font-weight: ${weight}; margin: 1px 0;">`;
      item.cols.forEach(col => {
        bodyHtml += `<span style="text-align: ${col.align || 'left'}; flex: ${col.widthRatio || 1}; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${escapeHtml(col.text)}</span>`;
      });
      bodyHtml += `</div>`;
    } else if (item.type === 'qrcode') {
      bodyHtml += `<div style="text-align: center; font-weight: 800; padding: 4px; border: 1px dashed #000; margin: 4px 0;">[QRCODE: ${escapeHtml(item.text)}]</div>`;
    } else if (item.type === 'barcode') {
      bodyHtml += `<div style="text-align: center; font-weight: 800; padding: 4px; border: 1px dashed #000; margin: 4px 0;">[BARCODE: ${escapeHtml(item.code)}]</div>`;
    }
  }

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
            font-weight: ${globalBold ? '900' : '700'};
            line-height: 1.25;
            white-space: normal;
            word-break: break-word;
            overflow-wrap: break-word;
            overflow: hidden;
          }
        </style>
      </head>
      <body>
        ${bodyHtml}
      </body>
    </html>
  `;
}

// -----------------------------------------------------------------------------
// 7. BACKWARD COMPATIBILITY WRAPPERS
// -----------------------------------------------------------------------------

export function generateReceiptText(
  typeOrPayload: any,
  maybeData?: any,
  overridePaperSize?: string,
  customDocSettings?: any
): string {
  const profile = getPhysicalPrinterProfile(overridePaperSize);
  const matrix = buildDocumentMatrix(typeOrPayload, maybeData, profile, customDocSettings);
  return renderMatrixToText(matrix, profile);
}

export function generateEscPosBuffer(
  receiptTextOrMatrix: any,
  options?: any
): Uint8Array {
  const profile = getPhysicalPrinterProfile(options?.paperSize, options);
  let matrix: MatrixLine[];
  
  if (Array.isArray(receiptTextOrMatrix)) {
    matrix = receiptTextOrMatrix;
  } else {
    matrix = buildDocumentMatrix('sale', { text: receiptTextOrMatrix }, profile);
  }

  return renderMatrixToEscPosBuffer(matrix, profile, options);
}

export function generateReceiptHtml(
  typeOrPayload: any,
  maybeData?: any,
  overridePaperSize?: string,
  customDocSettings?: any,
  customLayoutSettings?: any
): string {
  const profile = getPhysicalPrinterProfile(overridePaperSize);
  const matrix = buildDocumentMatrix(typeOrPayload, maybeData, profile, customDocSettings);
  return generateReceiptHtmlFromMatrix(matrix, profile, customDocSettings, customLayoutSettings);
}

function escapeHtml(str: string): string {
  return (str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export function bufferToHexPreview(buffer: Uint8Array, maxBytes: number = 32): string {
  if (!buffer || buffer.length === 0) return '00';
  const slice = buffer.slice(0, maxBytes);
  const hex = Array.from(slice).map(b => b.toString(16).padStart(2, '0').toUpperCase()).join(' ');
  return buffer.length > maxBytes ? `${hex} ... (+${buffer.length - maxBytes} bytes)` : hex;
}

// -----------------------------------------------------------------------------
// 8. TRANSPORT LAYER (SYSTEM, WEBUSB, WEBSERIAL, SPOOLER)
// -----------------------------------------------------------------------------

export function printViaSystemBrowser(receiptTextOrHtml: string, paperSize: string = '58mm', customHtml?: string): Promise<boolean> {
  return new Promise((resolve) => {
    const profile = getPhysicalPrinterProfile(paperSize);
    const widthCss = `${profile.printableWidthMm}mm`;

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
      return { success: true, durationMs: Math.round(performance.now() - start) };
    } else {
      await device.close();
      return { success: false, durationMs: Math.round(performance.now() - start), errorMsg: 'ERR_USB_ENDPOINT_NOT_FOUND: Endpoint de saída USB não encontrado.' };
    }
  } catch (err: any) {
    return { success: false, durationMs: Math.round(performance.now() - start), errorMsg: `ERR_WEBUSB_TRANSFER: ${err.message || String(err)}` };
  }
}

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
    return { success: true, durationMs: Math.round(performance.now() - start) };
  } catch (err: any) {
    return { success: false, durationMs: Math.round(performance.now() - start), errorMsg: `ERR_WEBSERIAL_TRANSFER: ${err.message || String(err)}` };
  }
}

// Spooler Local Database Helpers
export function getSpoolQueue(): SpoolJob[] {
  try {
    const raw = localStorage.getItem('adegaos_spool_queue_v2');
    if (raw) return JSON.parse(raw);
  } catch (e) {}
  return [];
}

export function addSpoolJob(job: SpoolJob) {
  try {
    const current = getSpoolQueue();
    const updated = [job, ...current].slice(0, 50);
    localStorage.setItem('adegaos_spool_queue_v2', JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent('adegaos_spool_updated'));
  } catch (e) {}
}

export function clearSpoolQueue() {
  localStorage.removeItem('adegaos_spool_queue_v2');
  window.dispatchEvent(new CustomEvent('adegaos_spool_updated'));
}

export function getSavedPrinters(): PrinterDevice[] {
  try {
    const raw = localStorage.getItem('adegaos_printers_list');
    if (raw) return JSON.parse(raw);
  } catch (e) {}
  return DEFAULT_PRINTERS;
}

export function savePrinters(printers: PrinterDevice[]) {
  localStorage.setItem('adegaos_printers_list', JSON.stringify(printers));
}

export const DEFAULT_PRINTERS: PrinterDevice[] = [
  { id: 'prn_main_caixa', name: 'IMP-01 [CAIXA PRINCIPAL]', sector: 'caixa', method: 'system', paperSize: '58mm', enabled: true, autoCut: true, copies: 1 },
  { id: 'prn_cozinha_01', name: 'IMP-02 [COZINHA & PREPARO]', sector: 'cozinha', method: 'network', connectionIp: '192.168.1.201:9100', paperSize: '80mm', enabled: true, autoCut: true, copies: 1 }
];

// -----------------------------------------------------------------------------
// 9. MAIN DISPATCHER FUNCTION FOR INSTANT THERMAL PRINTING
// -----------------------------------------------------------------------------

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

      const hardwareConfig = enterpriseConfig?.hardware || { paperSize: printer.paperSize, autoCut: printer.autoCut };
      const docSettings = enterpriseConfig?.document || {};
      const layoutSettings = enterpriseConfig?.layout || {};

      const profile = getPhysicalPrinterProfile(printer.paperSize, hardwareConfig, layoutSettings);
      const matrix = buildDocumentMatrix(typeOrPayload, maybeData, profile, docSettings);

      const receiptText = renderMatrixToText(matrix, profile);
      const escPosBuffer = renderMatrixToEscPosBuffer(matrix, profile, layoutSettings);
      const receiptHtml = generateReceiptHtmlFromMatrix(matrix, profile, docSettings, layoutSettings);

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
        const ok = await printViaSystemBrowser(receiptText, printer.paperSize, receiptHtml);
        res = { success: ok, durationMs: Math.round(performance.now() - start) };
      }

      const durationMs = Math.round(performance.now() - start);

      if (!res.success && printer.method !== 'system') {
        console.warn(`[Printer Engine] Direct hardware failed (${res.errorMsg}). Falling back to System Spooler.`);
        await printViaSystemBrowser(receiptText, printer.paperSize, receiptHtml);
      }

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
