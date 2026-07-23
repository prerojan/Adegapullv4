import React, { useState } from 'react';
import { FileText, FileSpreadsheet, Download, RefreshCw, BarChart2, Calendar, ShieldAlert } from 'lucide-react';
import { Product, Sale, FinancialTransaction } from '../types';
import { pdf } from '@react-pdf/renderer';
import FluxOSReportPDF from './FluxOSReportPDF';
import { exportStyledReport } from '../lib/excelExport';

interface ManagerReportsProps {
  theme: 'dark' | 'light';
  products: Product[];
  sales: Sale[];
  financialTransactions: FinancialTransaction[];
}

export default function ManagerReports({ 
  theme,
  products,
  sales,
  financialTransactions
}: ManagerReportsProps) {
  const [loadingReport, setLoadingReport] = useState<string | null>(null);

  const handleGenerateReport = (reportId: string, format: 'PDF' | 'XLS') => {
    const report = reportsList.find(r => r.id === reportId);
    if (!report) return;

    setLoadingReport(reportId);

    setTimeout(() => {
      setLoadingReport(null);

      // 1. GATHER REAL DATA FOR THE CHOSEN REPORT
      let title = report.title;
      let headers: string[] = [];
      let rows: string[][] = [];
      let summaryData: { label: string; value: string }[] = [];

      if (reportId === 'r1') {
        // Fechamento de Caixa Diário
        const paidSales = sales.filter(s => s.status === 'pago');
        const dinheiroSales = paidSales.filter(s => s.paymentMethod === 'dinheiro').reduce((acc, s) => acc + s.total, 0);
        const pixSales = paidSales.filter(s => s.paymentMethod === 'pix').reduce((acc, s) => acc + s.total, 0);
        const cartaoSales = paidSales.filter(s => ['debito', 'credito'].includes(s.paymentMethod)).reduce((acc, s) => acc + s.total, 0);
        const totalFaturamento = dinheiroSales + pixSales + cartaoSales;

        summaryData = [
          { label: 'Faturamento Total de Balcão', value: `R$ ${totalFaturamento.toFixed(2)}` },
          { label: 'Total Dinheiro (Em Espécie)', value: `R$ ${dinheiroSales.toFixed(2)}` },
          { label: 'Total PIX (Instantâneo)', value: `R$ ${pixSales.toFixed(2)}` },
          { label: 'Total Cartões (Débito/Crédito)', value: `R$ ${cartaoSales.toFixed(2)}` },
          { label: 'Quantidade de Vendas Efetuadas', value: `${paidSales.length} transações` },
        ];

        headers = ['ID Venda', 'Data/Hora', 'Operador', 'Método', 'Desconto', 'Total (R$)'];
        rows = paidSales.map(s => [
          `#${s.number}`,
          new Date(s.timestamp).toLocaleString('pt-BR'),
          s.cashierId,
          s.paymentMethod.toUpperCase(),
          `R$ ${s.discount.toFixed(2)}`,
          `R$ ${s.total.toFixed(2)}`
        ]);

      } else if (reportId === 'r2') {
        // DRE Gerencial de Canais
        const paidSales = sales.filter(s => s.status === 'pago');
        const totalVendas = paidSales.reduce((acc, s) => acc + s.total, 0);
        
        // Calculate real CMV
        let totalCmv = 0;
        paidSales.forEach(s => {
          s.items.forEach(item => {
            const prod = products.find(p => p.id === item.productId);
            if (prod) {
              totalCmv += item.quantity * prod.costPrice;
            }
          });
        });

        // Fixed / Variable Expenses
        const fixedExpenses = financialTransactions
          .filter(tx => tx.type === 'despesa' && tx.status === 'pago' && ['Aluguel', 'Energia', 'Salários', 'Internet', 'Sistemas'].includes(tx.category))
          .reduce((acc, tx) => acc + tx.value, 0);

        const variableExpenses = financialTransactions
          .filter(tx => tx.type === 'despesa' && tx.status === 'pago' && !['Aluguel', 'Energia', 'Salários', 'Internet', 'Sistemas'].includes(tx.category))
          .reduce((acc, tx) => acc + tx.value, 0);

        const receitaBruta = totalVendas;
        const margemContribuicao = receitaBruta - totalCmv;
        const lucroLiquido = margemContribuicao - fixedExpenses - variableExpenses;

        summaryData = [
          { label: 'Faturamento Bruto', value: `R$ ${receitaBruta.toFixed(2)}` },
          { label: 'Custo de Mercadoria Vendida (CMV)', value: `R$ ${totalCmv.toFixed(2)}` },
          { label: 'Margem de Contribuição', value: `R$ ${margemContribuicao.toFixed(2)}` },
          { label: 'Despesas Fixas de Caixa', value: `R$ ${fixedExpenses.toFixed(2)}` },
          { label: 'Despesas Operacionais e Taxas', value: `R$ ${variableExpenses.toFixed(2)}` },
          { label: 'LUCRO OPERACIONAL LÍQUIDO', value: `R$ ${lucroLiquido.toFixed(2)}` }
        ];

        headers = ['Indicador Financeiro', 'Valor Gerencial (R$)', 'Percentual s/ Vendas'];
        rows = [
          ['(+) RECEITA BRUTA DE VENDAS', `R$ ${receitaBruta.toFixed(2)}`, '100.0%'],
          ['(-) CUSTO DE MERCADORIA VENDIDA (CMV)', `- R$ ${totalCmv.toFixed(2)}`, `${receitaBruta > 0 ? ((totalCmv / receitaBruta) * 100).toFixed(1) : 0}%`],
          ['(=) MARGEM DE CONTRIBUIÇÃO', `R$ ${margemContribuicao.toFixed(2)}`, `${receitaBruta > 0 ? ((margemContribuicao / receitaBruta) * 100).toFixed(1) : 0}%`],
          ['(-) DESPESAS FIXAS', `- R$ ${fixedExpenses.toFixed(2)}`, `${receitaBruta > 0 ? ((fixedExpenses / receitaBruta) * 100).toFixed(1) : 0}%`],
          ['(-) DESPESAS VARIÁVEIS / TAXAS', `- R$ ${variableExpenses.toFixed(2)}`, `${receitaBruta > 0 ? ((variableExpenses / receitaBruta) * 100).toFixed(1) : 0}%`],
          ['(=) RESULTADO OPERACIONAL LÍQUIDO', `R$ ${lucroLiquido.toFixed(2)}`, `${receitaBruta > 0 ? ((lucroLiquido / receitaBruta) * 100).toFixed(1) : 0}%`]
        ];

      } else if (reportId === 'r3') {
        // Curva ABC de Giro de Estoque
        const productSalesMap: Record<string, { qty: number; revenue: number }> = {};
        sales.filter(s => s.status === 'pago').forEach(s => {
          s.items.forEach(item => {
            if (!productSalesMap[item.productId]) {
              productSalesMap[item.productId] = { qty: 0, revenue: 0 };
            }
            productSalesMap[item.productId].qty += item.quantity;
            productSalesMap[item.productId].revenue += item.quantity * item.unitPrice;
          });
        });

        const abcList = products.map(p => {
          const stats = productSalesMap[p.id] || { qty: 0, revenue: 0 };
          return {
            id: p.id,
            name: p.name,
            qty: stats.qty,
            revenue: stats.revenue,
            stock: (p.stockBoxes * p.boxQuantity) + p.stockUnits,
            class: 'C'
          };
        });

        abcList.sort((a, b) => b.revenue - a.revenue);

        const totalRevenueAll = abcList.reduce((acc, p) => acc + p.revenue, 0);
        let accumulatedRevenue = 0;
        abcList.forEach(p => {
          if (totalRevenueAll > 0) {
            accumulatedRevenue += p.revenue;
            const percentage = (accumulatedRevenue / totalRevenueAll) * 100;
            if (percentage <= 70) p.class = 'A';
            else if (percentage <= 90) p.class = 'B';
            else p.class = 'C';
          }
        });

        summaryData = [
          { label: 'Receita Total do Portfólio', value: `R$ ${totalRevenueAll.toFixed(2)}` },
          { label: 'Total de Itens Cadastrados', value: `${products.length} itens` },
          { label: 'Itens de Classe A (Principais)', value: `${abcList.filter(p => p.class === 'A').length} produtos` },
          { label: 'Itens de Classe B (Intermediários)', value: `${abcList.filter(p => p.class === 'B').length} produtos` },
          { label: 'Itens de Classe C (Baixo Giro)', value: `${abcList.filter(p => p.class === 'C').length} produtos` }
        ];

        headers = ['Cod/Ref', 'Nome do Produto', 'Qtd Vendida', 'Saldo Estoque', 'Faturamento (R$)', 'Classificação ABC'];
        rows = abcList.map(p => [
          p.id.slice(0, 8),
          p.name,
          `${p.qty} un`,
          `${p.stock} un`,
          `R$ ${p.revenue.toFixed(2)}`,
          `Classe ${p.class}`
        ]);

      } else if (reportId === 'r4') {
        // Auditoria de Cancelamentos e Estornos
        const cancelledSales = sales.filter(s => s.status === 'cancelado');
        const refundTransactions = financialTransactions.filter(tx => 
          tx.type === 'despesa' && 
          (tx.category.toLowerCase().includes('estorno') || tx.description.toLowerCase().includes('cancelado') || tx.description.toLowerCase().includes('estorno'))
        );

        const totalPerdas = cancelledSales.reduce((acc, s) => acc + s.total, 0) + refundTransactions.reduce((acc, tx) => acc + tx.value, 0);

        summaryData = [
          { label: 'Total Geral de Valores Estornados/Cancelados', value: `R$ ${totalPerdas.toFixed(2)}` },
          { label: 'Vendas Canceladas em Balcão', value: `${cancelledSales.length} transações` },
          { label: 'Lançamentos Financeiros de Estorno', value: `${refundTransactions.length} sangrias` }
        ];

        headers = ['Referência ID', 'Tipo Evento', 'Data Registro', 'Categoria / Origem', 'Operador Responsável', 'Valor Retido (R$)'];
        
        const rowsSales = cancelledSales.map(s => [
          `#${s.number}`,
          'Venda Cancelada',
          new Date(s.timestamp).toLocaleString('pt-BR'),
          'Balcão PDV',
          s.cashierId,
          `R$ ${s.total.toFixed(2)}`
        ]);

        const rowsRefunds = refundTransactions.map(tx => [
          tx.id.slice(0, 8),
          'Estorno Manual',
          tx.date,
          tx.category,
          'Financeiro Geral',
          `R$ ${tx.value.toFixed(2)}`
        ]);

        rows = [...rowsSales, ...rowsRefunds];
        if (rows.length === 0) {
          rows = [['-', 'Nenhum estorno ou cancelamento detectado no período.', '-', '-', '-', 'R$ 0,00']];
        }
      }

      // 2. EXPORT AS REAL EXCEL SPREADSHEET (.XLSX)
      if (format === 'XLS') {
        exportStyledReport(reportId, title, headers, rows, summaryData)
          .then(() => {
            alert(`Relatório "${title}" exportado com sucesso em formato Excel (.xlsx).`);
          })
          .catch(err => {
            console.error('Erro ao gerar planilha Excel:', err);
            alert('Falha ao gerar o relatório Excel.');
          });
      } 
      
      // 3. EXPORT AS REAL DESIGNER VECTOR PDF
      else if (format === 'PDF') {
        const doc = (
          <FluxOSReportPDF 
            title={title} 
            headers={headers} 
            rows={rows} 
            summaryData={summaryData} 
          />
        );
        
        pdf(doc).toBlob()
          .then(blob => {
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `fluxos_relatorio_${reportId}_${new Date().toISOString().split('T')[0]}.pdf`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            alert(`Relatório "${title}" exportado com sucesso em formato PDF.`);
          })
          .catch(err => {
            console.error('Erro ao renderizar PDF:', err);
            alert('Falha ao compilar o relatório PDF.');
          });
      }
    }, 1200);
  };

  const reportsList = [
    {
      id: 'r1',
      title: 'Fechamento de Caixa Diário (Turnos)',
      description: 'Auditoria consolidada de conciliação de espécie, PIX e cartões por operador de caixa.',
      category: 'Financeiro'
    },
    {
      id: 'r2',
      title: 'DRE e Rentabilidade de Canais',
      description: 'Demonstrativo completo de Receita Bruta, CMV, custos fixos e margens por canal (mesa, balcão, WhatsApp).',
      category: 'Financeiro'
    },
    {
      id: 'r3',
      title: 'Curva ABC de Giro de Estoque',
      description: 'Classificação de mercadorias por faturamento e volume para otimização de compras com fornecedores.',
      category: 'Estoque'
    },
    {
      id: 'r4',
      title: 'Auditoria de Cancelamentos e Estornos',
      description: 'Rastreabilidade total de lançamentos de mesa e balcão estornados, com justificativas registradas.',
      category: 'Segurança'
    }
  ];

  return (
    <div className="flex flex-col gap-6 w-full">
      {/* Header */}
      <div>
        <h2 className="text-xl font-semibold tracking-tight">Exportação de Relatórios e BI</h2>
        <p className="text-xs text-gray-400">Gere demonstrativos e planilhas analíticas homologadas de todas as esferas operacionais.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {reportsList.map(report => (
          <div
            key={report.id}
            className={`p-4 rounded-xl border flex flex-col justify-between gap-4 transition-all ${
              theme === 'dark' ? 'bg-[#111111] border-[#1A1A1A]' : 'bg-white border-gray-200 shadow-sm'
            }`}
          >
            <div>
              <div className="flex justify-between items-start">
                <span className={`px-2 py-0.5 rounded text-[8px] font-extrabold uppercase border ${
                  report.category === 'Financeiro' 
                    ? theme === 'dark' ? 'bg-emerald-950/40 text-emerald-400 border-emerald-900/30' : 'bg-emerald-100 text-emerald-900 border-emerald-200'
                    : report.category === 'Estoque' 
                      ? theme === 'dark' ? 'bg-sky-950/40 text-sky-400 border-sky-900/30' : 'bg-sky-100 text-sky-900 border-sky-200'
                      : theme === 'dark' ? 'bg-red-950/40 text-red-400 border-red-900/30' : 'bg-red-100 text-red-900 border-red-200'
                }`}>
                  {report.category}
                </span>
                <BarChart2 className="w-4 h-4 text-gray-500" />
              </div>
              <h3 className="font-semibold text-sm mt-2 leading-snug">{report.title}</h3>
              <p className="text-xs text-gray-400 mt-1 leading-relaxed">{report.description}</p>
            </div>

            {/* Downloader triggers */}
            <div className="flex gap-2 pt-3 border-t border-[#1C1C1C]" style={{ borderColor: theme === 'dark' ? '#1C1C1C' : '#E5E5E5' }}>
              <button
                disabled={loadingReport !== null}
                onClick={() => handleGenerateReport(report.id, 'PDF')}
                className={`flex-1 py-1.5 rounded text-[11px] font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  loadingReport === report.id
                    ? 'bg-[#1A1A1A] text-gray-400'
                    : theme === 'dark'
                      ? 'bg-[#1A1A1A] hover:bg-[#222] text-gray-300'
                      : 'bg-gray-100 border hover:bg-gray-200 text-gray-700'
                }`}
              >
                {loadingReport === report.id ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    Compilando...
                  </>
                ) : (
                  <>
                    <FileText className="w-3.5 h-3.5 text-red-500" />
                    Exportar PDF
                  </>
                )}
              </button>

              <button
                disabled={loadingReport !== null}
                onClick={() => handleGenerateReport(report.id, 'XLS')}
                className={`flex-1 py-1.5 rounded text-[11px] font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  loadingReport === report.id
                    ? 'bg-[#1A1A1A] text-gray-400'
                    : theme === 'dark'
                      ? 'bg-[#1A1A1A] hover:bg-[#222] text-gray-300'
                      : 'bg-gray-100 border hover:bg-gray-200 text-gray-700'
                }`}
              >
                {loadingReport === report.id ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    Compilando...
                  </>
                ) : (
                  <>
                    <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-500" />
                    Exportar Excel
                  </>
                )}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
