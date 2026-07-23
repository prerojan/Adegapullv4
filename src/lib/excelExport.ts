import ExcelJS from 'exceljs';

/**
 * Exports a highly polished, branded Excel template for batch imports.
 */
export async function exportStyledTemplate(type: 'produtos' | 'funcionarios' | 'fornecedores'): Promise<void> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'FluxOS ERP';
  workbook.lastModifiedBy = 'FluxOS System';
  workbook.created = new Date();
  workbook.modified = new Date();

  const worksheet = workbook.addWorksheet('Planilha Modelo');
  worksheet.views = [{ showGridLines: true }];

  // Define brand colors
  const PRIMARY_NAVY = 'FF0F172A'; // Slate 900
  const SECONDARY_SLATE = 'FF334155'; // Slate 700
  const ACCENT_GREEN = 'FF10B981'; // Emerald 500
  const LIGHT_ROW_ALT = 'FFF8FAFC'; // Slate 50
  const WHITE = 'FFFFFFFF';
  const BORDER_COLOR = 'FFE2E8F0'; // Slate 200

  // Standard fonts
  const fontTitle = { name: 'Segoe UI', size: 16, bold: true, color: { argb: WHITE } };
  const fontSubtitle = { name: 'Segoe UI', size: 10, italic: true, color: { argb: WHITE } };
  const fontHeader = { name: 'Segoe UI', size: 11, bold: true, color: { argb: WHITE } };
  const fontDataBold = { name: 'Segoe UI', size: 10, bold: true };
  const fontDataNormal = { name: 'Segoe UI', size: 10 };
  const fontInstruction = { name: 'Segoe UI', size: 9, color: { argb: 'FF475569' } };

  // Setup Title Banners
  worksheet.mergeCells('A1:J1');
  const cellA1 = worksheet.getCell('A1');
  cellA1.value = 'FLUXOS • SISTEMA DE GESTÃO EMPRESARIAL';
  cellA1.font = fontTitle;
  cellA1.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: PRIMARY_NAVY } };
  cellA1.alignment = { vertical: 'middle', horizontal: 'center' };
  worksheet.getRow(1).height = 40;

  worksheet.mergeCells('A2:J2');
  const cellA2 = worksheet.getCell('A2');
  let typeLabel = '';
  if (type === 'produtos') typeLabel = 'MODELO DE IMPORTAÇÃO EM LOTE: CADASTRO DE PRODUTOS E PRECIFICAÇÃO';
  else if (type === 'funcionarios') typeLabel = 'MODELO DE IMPORTAÇÃO EM LOTE: CADASTRO DE COLABORADORES E PINs DE SEGURANÇA';
  else if (type === 'fornecedores') typeLabel = 'MODELO DE IMPORTAÇÃO EM LOTE: CADASTRO DE PARCEIROS E FORNECEDORES';

  cellA2.value = typeLabel;
  cellA2.font = fontSubtitle;
  cellA2.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: SECONDARY_SLATE } };
  cellA2.alignment = { vertical: 'middle', horizontal: 'center' };
  worksheet.getRow(2).height = 25;

  // Row 3: Branded Accent Green Line
  worksheet.mergeCells('A3:J3');
  const cellA3 = worksheet.getCell('A3');
  cellA3.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: ACCENT_GREEN } };
  worksheet.getRow(3).height = 4;

  // Row 4: Instructions
  worksheet.mergeCells('A4:J4');
  const cellA4 = worksheet.getCell('A4');
  cellA4.value = 'INSTRUÇÕES IMPORTANTES: Não altere os cabeçalhos da Linha 6. Insira seus dados a partir da Linha 7. Salve antes de importar no portal.';
  cellA4.font = { name: 'Segoe UI', size: 9, bold: true, color: { argb: 'FF991B1B' } };
  cellA4.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };
  worksheet.getRow(4).height = 22;

  // Row 5: Empty space
  worksheet.getRow(5).height = 10;

  // Columns & Row Headers definitions
  let headers: string[] = [];
  let sampleRows: any[][] = [];
  let colsConfig: any[] = [];

  if (type === 'produtos') {
    headers = [
      'Nome', 'Categoria', 'Preco_Custo', 'Preco_Venda', 
      'Codigo_Barras', 'SKU', 'Estoque_Unidades', 'Estoque_Minimo', 'Marca', 'Unidade'
    ];
    sampleRows = [
      ['Cerveja Heineken Long Neck 330ml', 'Cervejas', 4.50, 8.00, '7891234567890', 'HEI-330', 48, 12, 'Heineken', 'UN'],
      ['Whisky Johnnie Walker Red Label 1L', 'Destilados', 75.00, 120.00, '', 'RED-1L', 12, 3, 'Johnnie Walker', 'UN'],
      ['Espeto de Carne Premium Extra Cozido', 'Petiscos', 3.20, 7.50, '', 'ESP-CARNE', 100, 15, 'Própria', 'UN']
    ];
    colsConfig = [
      { key: 'Nome', width: 35 },
      { key: 'Categoria', width: 15 },
      { key: 'Preco_Custo', width: 15, format: 'R$ #,##0.00' },
      { key: 'Preco_Venda', width: 15, format: 'R$ #,##0.00' },
      { key: 'Codigo_Barras', width: 20, format: '@' },
      { key: 'SKU', width: 15 },
      { key: 'Estoque_Unidades', width: 18, format: '#,##0' },
      { key: 'Estoque_Minimo', width: 18, format: '#,##0' },
      { key: 'Marca', width: 18 },
      { key: 'Unidade', width: 12 }
    ];
  } else if (type === 'funcionarios') {
    headers = ['Nome_Completo', 'Cargo', 'Senha_PIN', 'Ativo'];
    sampleRows = [
      ['Carlos Eduardo Oliveira Martins', 'cashier', '2580', 'Sim'],
      ['Fernanda de Souza Lima', 'manager', '1359', 'Sim'],
      ['Rodrigo Henrique da Silva', 'waiter', '8844', 'Sim']
    ];
    colsConfig = [
      { key: 'Nome_Completo', width: 35 },
      { key: 'Cargo', width: 18 },
      { key: 'Senha_PIN', width: 15, format: '@' },
      { key: 'Ativo', width: 12 }
    ];
  } else if (type === 'fornecedores') {
    headers = ['Razao_Social_ou_Nome', 'Nome_Contato', 'Telefone', 'WhatsApp', 'Email', 'Anotacoes'];
    sampleRows = [
      ['Ambev Bebidas Distribuidora S.A.', 'Julio Cezar', '11988887766', '11988887766', 'comercial@ambevbebidas.com', 'Entregas programadas toda terça e quinta-feira pela manhã'],
      ['Adega Real Atacadista Ltda', 'Patrícia Viana', '1932456789', '19991223344', 'vendas@adegareal.com.br', 'Pedidos mínimos de R$ 800 para frete grátis e bonificação de gelo']
    ];
    colsConfig = [
      { key: 'Razao_Social_ou_Nome', width: 35 },
      { key: 'Nome_Contato', width: 18 },
      { key: 'Telefone', width: 18, format: '@' },
      { key: 'WhatsApp', width: 18, format: '@' },
      { key: 'Email', width: 25 },
      { key: 'Anotacoes', width: 45 }
    ];
  }

  // Set Row 6 headers
  const headerRowNumber = 6;
  const headerRow = worksheet.getRow(headerRowNumber);
  headerRow.height = 28;

  headers.forEach((header, index) => {
    const colLetter = String.fromCharCode(65 + index);
    const cell = worksheet.getCell(`${colLetter}${headerRowNumber}`);
    cell.value = header;
    cell.font = fontHeader;
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: PRIMARY_NAVY } };
    cell.alignment = { vertical: 'middle', horizontal: 'center' };
    cell.border = {
      bottom: { style: 'medium', color: { argb: ACCENT_GREEN } },
      top: { style: 'thin', color: { argb: BORDER_COLOR } },
      left: { style: 'thin', color: { argb: BORDER_COLOR } },
      right: { style: 'thin', color: { argb: BORDER_COLOR } }
    };
  });

  // Set column widths and number formats
  colsConfig.forEach((col, index) => {
    const colLetter = String.fromCharCode(65 + index);
    const worksheetColumn = worksheet.getColumn(colLetter);
    worksheetColumn.width = col.width;
  });

  // Populate dynamic sample data starting at Row 7
  sampleRows.forEach((row, rowIndex) => {
    const rNum = 7 + rowIndex;
    const worksheetRow = worksheet.getRow(rNum);
    worksheetRow.height = 22;

    row.forEach((value, colIndex) => {
      const colLetter = String.fromCharCode(65 + colIndex);
      const cell = worksheet.getCell(`${colLetter}${rNum}`);
      cell.value = value;
      cell.font = colIndex === 0 ? fontDataBold : fontDataNormal;
      
      // Zebra striping
      const bgColor = rowIndex % 2 === 0 ? LIGHT_ROW_ALT : 'FFFFFFFF';
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bgColor } };
      
      // Formatting
      const config = colsConfig[colIndex];
      if (config && config.format) {
        cell.numFmt = config.format;
      }

      cell.alignment = { 
        vertical: 'middle', 
        horizontal: typeof value === 'number' ? 'right' : 'left',
        indent: typeof value === 'number' ? 0 : 1 
      };

      cell.border = {
        bottom: { style: 'thin', color: { argb: BORDER_COLOR } },
        top: { style: 'thin', color: { argb: BORDER_COLOR } },
        left: { style: 'thin', color: { argb: BORDER_COLOR } },
        right: { style: 'thin', color: { argb: BORDER_COLOR } }
      };
    });
  });

  // Save Excel file to browser
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const filename = `fluxos_modelo_importacao_${type}_${new Date().toISOString().split('T')[0]}.xlsx`;
  
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Exports a high-level, corporate styled Business Intelligence report using ExcelJS.
 */
export async function exportStyledReport(
  reportId: string,
  title: string,
  headers: string[],
  rows: string[][],
  summaryData: { label: string; value: string }[]
): Promise<void> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'FluxOS Business Intelligence';
  workbook.lastModifiedBy = 'FluxOS ERP';
  workbook.created = new Date();
  
  const worksheet = workbook.addWorksheet('Relatório Consolidado');
  worksheet.views = [{ showGridLines: true }];

  // Colors
  const COLOR_NAVY = 'FF0F172A'; // Slate 900
  const COLOR_SLATE = 'FF334155'; // Slate 700
  const COLOR_ACCENT = 'FF10B981'; // Emerald 500
  const COLOR_GRAY_BG = 'FFF8FAFC'; // Gray 50
  const COLOR_BORDER = 'FFE2E8F0'; // Gray 200

  // 1. Title Banner
  worksheet.mergeCells('A1:F1');
  const titleCell = worksheet.getCell('A1');
  titleCell.value = 'FLUXOS • BUSINESS INTELLIGENCE';
  titleCell.font = { name: 'Segoe UI', size: 16, bold: true, color: { argb: 'FFFFFFFF' } };
  titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLOR_NAVY } };
  titleCell.alignment = { vertical: 'middle', horizontal: 'center' };
  worksheet.getRow(1).height = 38;

  worksheet.mergeCells('A2:F2');
  const subtitleCell = worksheet.getCell('A2');
  subtitleCell.value = `${title.toUpperCase()} — GERADO EM ${new Date().toLocaleString('pt-BR')}`;
  subtitleCell.font = { name: 'Segoe UI', size: 10, bold: true, italic: true, color: { argb: 'FFFFFFFF' } };
  subtitleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLOR_SLATE } };
  subtitleCell.alignment = { vertical: 'middle', horizontal: 'center' };
  worksheet.getRow(2).height = 24;

  worksheet.mergeCells('A3:F3');
  const accentCell = worksheet.getCell('A3');
  accentCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLOR_ACCENT } };
  worksheet.getRow(3).height = 4;

  // 2. Summary KPI Metrics Card
  worksheet.mergeCells('A5:F5');
  const kpiTitle = worksheet.getCell('A5');
  kpiTitle.value = 'INDICADORES E MÉTRICAS CHAVE (KPIs)';
  kpiTitle.font = { name: 'Segoe UI', size: 11, bold: true, color: { argb: COLOR_NAVY } };
  kpiTitle.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };
  worksheet.getRow(5).height = 24;

  let currentKPIrow = 6;
  summaryData.forEach((item) => {
    worksheet.mergeCells(`A${currentKPIrow}:C${currentKPIrow}`);
    const labelCell = worksheet.getCell(`A${currentKPIrow}`);
    labelCell.value = item.label;
    labelCell.font = { name: 'Segoe UI', size: 10, color: { argb: 'FF475569' } };
    labelCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLOR_GRAY_BG } };
    labelCell.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };
    labelCell.border = {
      top: { style: 'thin', color: { argb: COLOR_BORDER } },
      bottom: { style: 'thin', color: { argb: COLOR_BORDER } },
      left: { style: 'thin', color: { argb: COLOR_BORDER } },
      right: { style: 'thin', color: { argb: COLOR_BORDER } }
    };

    worksheet.mergeCells(`D${currentKPIrow}:F${currentKPIrow}`);
    const valCell = worksheet.getCell(`D${currentKPIrow}`);
    valCell.value = item.value;
    valCell.font = { name: 'Segoe UI', size: 11, bold: true, color: { argb: 'FF0F172A' } };
    valCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLOR_GRAY_BG } };
    valCell.alignment = { vertical: 'middle', horizontal: 'right', indent: 1 };
    valCell.border = {
      top: { style: 'thin', color: { argb: COLOR_BORDER } },
      bottom: { style: 'thin', color: { argb: COLOR_BORDER } },
      left: { style: 'thin', color: { argb: COLOR_BORDER } },
      right: { style: 'thin', color: { argb: COLOR_BORDER } }
    };

    worksheet.getRow(currentKPIrow).height = 20;
    currentKPIrow++;
  });

  // Empty separator
  worksheet.getRow(currentKPIrow).height = 15;
  currentKPIrow++;

  // 3. Main Data Table
  worksheet.mergeCells(`A${currentKPIrow}:F${currentKPIrow}`);
  const tableTitle = worksheet.getCell(`A${currentKPIrow}`);
  tableTitle.value = 'DETALHAMENTO DE LANÇAMENTOS E REGISTROS AUDITADOS';
  tableTitle.font = { name: 'Segoe UI', size: 11, bold: true, color: { argb: COLOR_NAVY } };
  tableTitle.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };
  worksheet.getRow(currentKPIrow).height = 24;
  currentKPIrow++;

  // Headers Row
  const headerRow = worksheet.getRow(currentKPIrow);
  headerRow.height = 26;

  headers.forEach((h, index) => {
    const colLetter = String.fromCharCode(65 + index);
    const cell = worksheet.getCell(`${colLetter}${currentKPIrow}`);
    cell.value = h;
    cell.font = { name: 'Segoe UI', size: 10, bold: true, color: { argb: 'FFFFFFFF' } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLOR_NAVY } };
    cell.alignment = { vertical: 'middle', horizontal: 'center' };
    cell.border = {
      top: { style: 'thin', color: { argb: COLOR_BORDER } },
      bottom: { style: 'medium', color: { argb: COLOR_ACCENT } },
      left: { style: 'thin', color: { argb: COLOR_BORDER } },
      right: { style: 'thin', color: { argb: COLOR_BORDER } }
    };
  });
  
  const headerRowIndex = currentKPIrow;
  currentKPIrow++;

  // Data Rows
  rows.forEach((row, rowIndex) => {
    const dataRow = worksheet.getRow(currentKPIrow);
    dataRow.height = 22;

    row.forEach((val, colIndex) => {
      const colLetter = String.fromCharCode(65 + colIndex);
      const cell = worksheet.getCell(`${colLetter}${currentKPIrow}`);
      cell.value = val;
      cell.font = colIndex === 0 ? { name: 'Segoe UI', size: 10, bold: true } : { name: 'Segoe UI', size: 10 };
      
      const zebraColor = rowIndex % 2 === 0 ? 'FFFFFFFF' : COLOR_GRAY_BG;
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: zebraColor } };
      cell.alignment = { 
        vertical: 'middle', 
        horizontal: val.includes('R$') || !isNaN(parseFloat(val.replace(/[^\d,-]/g, ''))) ? 'right' : 'left',
        indent: 1
      };
      
      cell.border = {
        top: { style: 'thin', color: { argb: COLOR_BORDER } },
        bottom: { style: 'thin', color: { argb: COLOR_BORDER } },
        left: { style: 'thin', color: { argb: COLOR_BORDER } },
        right: { style: 'thin', color: { argb: COLOR_BORDER } }
      };
    });
    currentKPIrow++;
  });

  // Set widths
  worksheet.getColumn('A').width = 18;
  worksheet.getColumn('B').width = 30;
  worksheet.getColumn('C').width = 24;
  worksheet.getColumn('D').width = 24;
  worksheet.getColumn('E').width = 24;
  worksheet.getColumn('F').width = 24;

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const filename = `fluxos_relatorio_${reportId}_${new Date().toISOString().split('T')[0]}.xlsx`;

  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
