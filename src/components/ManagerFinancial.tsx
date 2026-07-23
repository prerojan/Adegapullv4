import React, { useState, useMemo } from 'react';
import { Landmark, TrendingUp, TrendingDown, CheckSquare, Calendar, Plus, ChevronDown, Check, Percent, AlertTriangle, Calculator, RefreshCw, Printer } from 'lucide-react';
import { FinancialTransaction, Sale, Product, Shift } from '../types';
import { triggerThermalPrint } from '../lib/thermalPrinter';

interface ManagerFinancialProps {
  financialTransactions: FinancialTransaction[];
  sales: Sale[];
  products: Product[];
  onConfirmPayment: (txId: string) => void;
  onAddTransaction: (tx: FinancialTransaction) => void;
  theme: 'dark' | 'light';
  activeShift: Shift | null;
  onOpenShift: (openedBy: string, initialBalance: number) => void;
  onCloseShift: (countedAmount: number, notes: string) => void;
  onSangria: (amount: number, reason: string) => void;
  onSuprimento: (amount: number, reason: string) => void;
  shiftHistory: Shift[];
}

export default function ManagerFinancial({
  financialTransactions,
  sales,
  products,
  onConfirmPayment,
  onAddTransaction,
  theme,
  activeShift,
  onOpenShift,
  onCloseShift,
  onSangria,
  onSuprimento,
  shiftHistory
}: ManagerFinancialProps) {
  const [activeTab, setActiveTab] = useState<'geral' | 'dre' | 'conciliacao' | 'turnos'>('geral');
  const [showAddTxModal, setShowAddTxModal] = useState(false);

  // Form states for manual additions
  const [type, setType] = useState<'receita' | 'despesa'>('despesa');
  const [category, setCategory] = useState('Despesas Variáveis');
  const [description, setDescription] = useState('');
  const [value, setValue] = useState(0);

  // Physical cash counter calculator bills state
  const [bills, setBills] = useState({
    r200: 0,
    r100: 0,
    r50: 0,
    r20: 0,
    r10: 0,
    r5: 0,
    r2: 0,
    coins: 0
  });

  const physicalCountedCash = useMemo(() => {
    return (bills.r200 * 200) + 
           (bills.r100 * 100) + 
           (bills.r50 * 50) + 
           (bills.r20 * 20) + 
           (bills.r10 * 10) + 
           (bills.r5 * 5) + 
           (bills.r2 * 2) + 
           bills.coins;
  }, [bills]);

  // Local states for shift management forms
  const [opName, setOpName] = useState(() => {
    try {
      const stored = localStorage.getItem('cashier_session_user');
      return stored ? JSON.parse(stored)?.name || '' : '';
    } catch {
      return '';
    }
  });
  const [initBal, setInitBal] = useState<number>(100);
  const [sangriaAmount, setSangriaAmount] = useState<number>(0);
  const [sangriaReason, setSangriaReason] = useState('');
  const [suprimentoAmount, setSuprimentoAmount] = useState<number>(0);
  const [suprimentoReason, setSuprimentoReason] = useState('');
  const [shiftClosingCash, setShiftClosingCash] = useState<number>(0);
  const [shiftClosingNotes, setShiftClosingNotes] = useState('');

  const [reconciliationNotes, setReconciliationNotes] = useState('');

  // Cash register stats (dinheiro em espécie)
  const cashStats = useMemo(() => {
    const cashSales = sales
      .filter(s => s.status === 'pago' && s.paymentMethod === 'dinheiro')
      .reduce((acc, s) => acc + s.total, 0);

    const otherCashIn = financialTransactions
      .filter(tx => tx.type === 'receita' && tx.status === 'pago' && (tx.category === 'Outros' || tx.description.toLowerCase().includes('dinheiro') || tx.description.toLowerCase().includes('aporte') || tx.description.toLowerCase().includes('abertura') || tx.description.toLowerCase().includes('conciliação')))
      .reduce((acc, tx) => acc + tx.value, 0);

    const cashOut = financialTransactions
      .filter(tx => tx.type === 'despesa' && tx.status === 'pago' && (tx.category === 'Despesas Variáveis' || tx.description.toLowerCase().includes('dinheiro') || tx.description.toLowerCase().includes('sangria')))
      .reduce((acc, tx) => acc + tx.value, 0);

    const expected = cashSales + otherCashIn - cashOut;

    return {
      sales: cashSales,
      entries: otherCashIn,
      withdrawals: cashOut,
      expected
    };
  }, [sales, financialTransactions]);

  const handleApplyAdjustment = () => {
    const diff = physicalCountedCash - cashStats.expected;
    if (Math.abs(diff) < 0.01) {
      alert("Fechamento de caixa conciliado sem divergências.");
      return;
    }

    const adjType = diff > 0 ? 'receita' : 'despesa';
    const adjCategory = diff > 0 ? 'Outros' : 'Despesas Variáveis';
    const adjDescription = `Ajuste de Conciliação Física de Caixa - ${reconciliationNotes || 'Fechamento Operacional'}`;

    const newTx: FinancialTransaction = {
      id: `tx-adj-${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
      type: adjType,
      category: adjCategory,
      description: adjDescription,
      value: Math.abs(diff),
      status: 'pago'
    };

    onAddTransaction(newTx);
    setReconciliationNotes('');
    setBills({
      r200: 0,
      r100: 0,
      r50: 0,
      r20: 0,
      r10: 0,
      r5: 0,
      r2: 0,
      coins: 0
    });
    alert(`Ajuste de R$ ${Math.abs(diff).toFixed(2)} (${diff > 0 ? 'Sobra' : 'Falta'}) registrado com sucesso no caixa.`);
  };

  // Math totals
  const financials = useMemo(() => {
    let cashIn = 0;
    let cashOut = 0;

    financialTransactions.forEach(tx => {
      if (tx.status === 'pago') {
        if (tx.type === 'receita') cashIn += tx.value;
        else cashOut += tx.value;
      }
    });

    const netBalance = cashIn - cashOut;

    return {
      cashIn,
      cashOut,
      netBalance
    };
  }, [financialTransactions]);

  // Dynamic DRE (Demonstrativo do Resultado do Exercício) Generator
  const dreData = useMemo(() => {
    // 1. Receita Bruta: Paid sales sum + non-sales revenue
    let faturamentoBruto = sales
      .filter(s => s.status === 'pago')
      .reduce((acc, s) => acc + s.total, 0);

    const otherRevenues = financialTransactions
      .filter(tx => tx.type === 'receita' && tx.status === 'pago' && tx.category !== 'Vendas')
      .reduce((acc, tx) => acc + tx.value, 0);

    faturamentoBruto += otherRevenues;

    // 2. Cost of Goods Sold (CMV)
    let totalCmv = 0;
    sales
      .filter(s => s.status === 'pago')
      .forEach(s => {
        s.items.forEach(item => {
          const prod = products.find(p => p.id === item.productId);
          if (prod) {
            totalCmv += prod.costPrice * item.quantity;
          } else {
            totalCmv += item.unitPrice * 0.5 * item.quantity; // fallback
          }
        });
      });

    // 3. Contribution Margin (Margem Bruta)
    const margemContribuicao = faturamentoBruto - totalCmv;
    const margemPercent = faturamentoBruto > 0 ? (margemContribuicao / faturamentoBruto) * 100 : 0;

    // 4. Fixed Operational Expenses (Aluguel, Luz, Internet, etc.)
    const despesasFixas = financialTransactions
      .filter(tx => tx.type === 'despesa' && tx.status === 'pago' && ['Aluguel', 'Energia', 'Salários', 'Internet', 'Sistemas'].includes(tx.category))
      .reduce((acc, tx) => acc + tx.value, 0);

    // 5. Variable / Other Operational Expenses
    const despesasVariaveis = financialTransactions
      .filter(tx => tx.type === 'despesa' && tx.status === 'pago' && !['Aluguel', 'Energia', 'Salários', 'Internet', 'Sistemas'].includes(tx.category))
      .reduce((acc, tx) => acc + tx.value, 0);

    const totalDespesas = despesasFixas + despesasVariaveis;

    // 6. Lucro Líquido Operacional
    const lucroLiquido = margemContribuicao - totalDespesas;
    const rentabilidade = faturamentoBruto > 0 ? (lucroLiquido / faturamentoBruto) * 100 : 0;

    return {
      faturamentoBruto,
      otherRevenues,
      totalCmv,
      margemContribuicao,
      margemPercent,
      despesasFixas,
      despesasVariaveis,
      totalDespesas,
      lucroLiquido,
      rentabilidade
    };
  }, [sales, products, financialTransactions]);

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!description || value <= 0) {
      alert('Preencha a descrição e um valor de transação válido.');
      return;
    }

    const newTx: FinancialTransaction = {
      id: `tx-${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
      type,
      category,
      description,
      value: Number(value),
      status: 'pago'
    };

    onAddTransaction(newTx);
    setShowAddTxModal(false);
    setDescription('');
    setValue(0);
    alert('Transação financeira adicionada com sucesso!');
  };

  const handleConfirmPay = (txId: string) => {
    onConfirmPayment(txId);
    alert('Pagamento de duplicata efetuado. Saldo do fluxo de caixa atualizado.');
  };

  const handlePrintCashFlow = () => {
    // 1. Calculate totals for each payment method from sales
    const pixSales = sales
      .filter(s => s.status === 'pago' && s.paymentMethod === 'pix')
      .reduce((acc, s) => acc + s.total, 0);

    const dinheiroSales = sales
      .filter(s => s.status === 'pago' && s.paymentMethod === 'dinheiro')
      .reduce((acc, s) => acc + s.total, 0);

    const debitoSales = sales
      .filter(s => s.status === 'pago' && s.paymentMethod === 'debito')
      .reduce((acc, s) => acc + s.total, 0);

    const creditoSales = sales
      .filter(s => s.status === 'pago' && s.paymentMethod === 'credito')
      .reduce((acc, s) => acc + s.total, 0);

    const fiadoSales = sales
      .filter(s => s.status === 'pago' && s.paymentMethod === 'fiado')
      .reduce((acc, s) => acc + s.total, 0);

    // 2. Other Revenues
    const otherRevenues = financialTransactions
      .filter(tx => tx.type === 'receita' && tx.status === 'pago' && tx.category !== 'Vendas')
      .reduce((acc, tx) => acc + tx.value, 0);

    // 3. Paid Expenses
    const paidExpenses = financialTransactions
      .filter(tx => tx.type === 'despesa' && tx.status === 'pago');

    const totalExpenses = paidExpenses.reduce((acc, tx) => acc + tx.value, 0);
    const totalSales = sales.filter(s => s.status === 'pago').reduce((acc, s) => acc + s.total, 0);

    const methods = {
      'pix': pixSales,
      'dinheiro': dinheiroSales,
      'debito': debitoSales,
      'credito': creditoSales,
      'fiado': fiadoSales,
      'outras entradas': otherRevenues
    };

    triggerThermalPrint('cash_flow', {
      date: new Date().toLocaleDateString('pt-BR'),
      cashierName: 'Gerente Geral',
      initialBalance: 0,
      methods,
      totalSales,
      expenses: paidExpenses.map(tx => ({ description: tx.description, value: tx.value })),
      totalExpenses,
      finalBalance: financials.netBalance
    }).catch(err => {
      console.error("Erro ao imprimir extrato do fluxo de caixa:", err);
    });
  };

  return (
    <div className="flex flex-col gap-6 w-full">
      {/* Tab Switcher and title */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className={`text-xl font-extrabold tracking-tight ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>Setor Financeiro</h2>
          <p className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-slate-600 font-medium'}`}>Fluxo de caixa diário, liquidações de duplicatas a pagar/receber e DRE Gerencial.</p>
        </div>

        {/* Inner Tab Selector */}
        <div className={`flex rounded-lg p-1 border ${
          theme === 'dark' ? 'bg-[#080808] border-[#1A1A1A]' : 'bg-slate-100 border-slate-200'
        }`}>
          <button
            onClick={() => setActiveTab('geral')}
            className={`text-xs px-3 py-1 rounded-md font-semibold transition-all cursor-pointer ${
              activeTab === 'geral'
                ? (theme === 'dark' ? 'bg-[#111111] text-[#18F2A4]' : 'bg-white text-emerald-700 font-extrabold shadow-2xs')
                : (theme === 'dark' ? 'text-gray-400 hover:text-white' : 'text-slate-600 hover:text-slate-950 font-medium')
            }`}
          >
            Fluxo de Caixa / Duplicatas
          </button>
          <button
            onClick={() => setActiveTab('dre')}
            className={`text-xs px-3 py-1 rounded-md font-semibold transition-all cursor-pointer ${
              activeTab === 'dre'
                ? (theme === 'dark' ? 'bg-[#111111] text-[#18F2A4]' : 'bg-white text-emerald-700 font-extrabold shadow-2xs')
                : (theme === 'dark' ? 'text-gray-400 hover:text-white' : 'text-slate-600 hover:text-slate-950 font-medium')
            }`}
          >
            DRE Gerencial Real
          </button>
          <button
            onClick={() => setActiveTab('conciliacao')}
            className={`text-xs px-3 py-1 rounded-md font-semibold transition-all cursor-pointer ${
              activeTab === 'conciliacao'
                ? (theme === 'dark' ? 'bg-[#111111] text-[#18F2A4]' : 'bg-white text-emerald-700 font-extrabold shadow-2xs')
                : (theme === 'dark' ? 'text-gray-400 hover:text-white' : 'text-slate-600 hover:text-slate-950 font-medium')
            }`}
          >
            Conciliação de Caixa Físico
          </button>
          <button
            onClick={() => setActiveTab('turnos')}
            className={`text-xs px-3 py-1 rounded-md font-semibold transition-all cursor-pointer ${
              activeTab === 'turnos'
                ? (theme === 'dark' ? 'bg-[#111111] text-[#18F2A4]' : 'bg-white text-emerald-700 font-extrabold shadow-2xs')
                : (theme === 'dark' ? 'text-gray-400 hover:text-white' : 'text-slate-600 hover:text-slate-950 font-medium')
            }`}
          >
            Controle de Turnos de Caixa
          </button>
        </div>
      </div>

      {activeTab === 'geral' && (
        <div className="flex flex-col gap-6">
          {/* Quick Balance Widgets */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Cash In */}
            <div className={`p-4 rounded-xl border flex flex-col gap-1 ${
              theme === 'dark' ? 'bg-[#111111] border-[#1A1A1A]' : 'bg-white border-gray-200'
            }`}>
              <span className="text-[10px] uppercase font-bold tracking-wider text-gray-400">Total Receitas Liquidadas</span>
              <span className="text-xl font-bold font-mono text-emerald-500">R$ {(financials?.cashIn || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
              <span className="text-[9px] text-gray-400 mt-1 flex items-center gap-1">
                <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
                Vendas e outras receitas recebidas
              </span>
            </div>

            {/* Cash Out */}
            <div className={`p-4 rounded-xl border flex flex-col gap-1 ${
              theme === 'dark' ? 'bg-[#111111] border-[#1A1A1A]' : 'bg-white border-gray-200'
            }`}>
              <span className="text-[10px] uppercase font-bold tracking-wider text-gray-400">Total Despesas Pagas</span>
              <span className="text-xl font-bold font-mono text-red-500">R$ {(financials?.cashOut || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
              <span className="text-[9px] text-gray-400 mt-1 flex items-center gap-1">
                <TrendingDown className="w-3.5 h-3.5 text-red-500" />
                Fornecedores e custos operacionais liquidados
              </span>
            </div>

            {/* Net Drawer Balance */}
            <div className={`p-4 rounded-xl border flex flex-col gap-1 ${
              theme === 'dark' ? 'bg-[#111111] border-[#1A1A1A]' : 'bg-white border-gray-200'
            }`}>
              <span className="text-[10px] uppercase font-bold tracking-wider text-gray-400">Saldo Líquido em Caixa</span>
              <span className={`text-xl font-bold font-mono ${(financials?.netBalance || 0) >= 0 ? (theme === 'dark' ? 'text-[#18F2A4]' : 'text-emerald-600') : 'text-red-500'}`}>
                R$ {(financials?.netBalance || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </span>
              <span className="text-[9px] text-gray-400 mt-1 flex items-center gap-1">
                <Landmark className="w-3.5 h-3.5 text-sky-400" />
                Disponibilidade imediata (conciliado)
              </span>
            </div>
          </div>

          {/* Table: Accounts payables / receivables & launch custom expense */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Financial Ledger (70% column) */}
            <div className={`p-4 rounded-xl border lg:col-span-2 flex flex-col gap-4 ${
              theme === 'dark' ? 'bg-[#111111] border-[#1A1A1A]' : 'bg-white border-gray-200'
            }`}>
              <div className="flex justify-between items-center border-b border-[#1A1A1A] pb-2" style={{ borderColor: theme === 'dark' ? '#1A1A1A' : '#E5E5E5' }}>
                <span className="text-xs uppercase font-bold text-gray-400 tracking-wider">Livro-Razão Operacional</span>
                
                <div className="flex gap-2">
                  <button
                    onClick={handlePrintCashFlow}
                    className={`px-3 py-1 text-[11px] font-bold rounded flex items-center gap-1.5 cursor-pointer transition-all ${
                      theme === 'dark' 
                        ? 'bg-[#18F2A4]/10 text-[#18F2A4] hover:bg-[#18F2A4]/20 border border-[#18F2A4]/30' 
                        : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100 border border-emerald-200'
                    }`}
                  >
                    <Printer className="w-3.5 h-3.5" />
                    Imprimir Extrato (Térmico)
                  </button>

                  <button
                    onClick={() => setShowAddTxModal(true)}
                    className={`px-3 py-1 text-[11px] font-semibold rounded flex items-center gap-1 cursor-pointer transition-all ${
                      theme === 'dark' ? 'bg-[#1A1A1A] hover:bg-[#222]' : 'bg-gray-100 border hover:bg-gray-200'
                    }`}
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Lançar Despesa / Receita
                  </button>
                </div>
              </div>

              {/* Transactions list */}
              <div className="overflow-x-auto overflow-y-auto max-h-96 w-full">
                <table className="min-w-[550px] w-full text-left border-collapse text-[11px]">
                  <thead>
                    <tr className={`border-b uppercase font-bold tracking-wider pb-1.5 text-[10px] ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`} style={{ borderColor: theme === 'dark' ? '#1A1A1A' : '#E5E5E5' }}>
                      <th className="pb-2">Data</th>
                      <th className="pb-2">Descrição / Categoria</th>
                      <th className="pb-2 text-right">Valor</th>
                      <th className="pb-2 text-center">Status</th>
                      <th className="pb-2 text-right">Ação</th>
                    </tr>
                  </thead>
                  <tbody>
                    {financialTransactions.map(tx => (
                      <tr key={tx.id} className={`border-b ${
                        theme === 'dark' ? 'border-[#1A1A1A] hover:bg-[#151515]' : 'border-gray-50 hover:bg-gray-100'
                      }`}>
                        <td className="py-3 px-1 font-mono text-gray-400 whitespace-nowrap">{tx.date}</td>
                        <td className="py-3 px-1">
                          <div className="flex flex-col">
                            <span className="font-semibold" style={{ color: theme === 'dark' ? 'white' : '#111' }}>{tx.description}</span>
                            <span className="text-[9px] text-gray-400 uppercase tracking-wide">{tx.category}</span>
                          </div>
                        </td>
                        <td className={`py-3 px-1 font-mono text-right font-bold whitespace-nowrap ${
                          tx.type === 'receita' 
                            ? theme === 'dark' ? 'text-emerald-400' : 'text-emerald-700'
                            : 'text-red-500'
                        }`}>
                          {tx.type === 'receita' ? '+' : '-'} R$ {(tx.value || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                        <td className="py-3 px-1 text-center whitespace-nowrap">
                          {tx.status === 'pago' ? (
                            <span className={`px-2 py-0.5 rounded text-[8px] font-extrabold border uppercase tracking-wider ${
                              theme === 'dark'
                                ? 'bg-emerald-950/30 text-emerald-400 border-emerald-900/30'
                                : 'bg-emerald-100 text-emerald-900 border-emerald-200'
                            }`}>
                              LIQUIDADO
                            </span>
                          ) : (
                            <div className="flex flex-col items-center">
                              <span className={`px-2 py-0.5 rounded text-[8px] font-extrabold border uppercase tracking-wider ${
                                theme === 'dark'
                                  ? 'bg-amber-950/30 text-amber-400 border-amber-900/30'
                                  : 'bg-amber-100 text-amber-900 border-amber-200'
                              }`}>
                                PENDENTE
                              </span>
                              {tx.dueDate && (
                                <span className={`text-[8px] font-mono font-bold mt-1 ${theme === 'dark' ? 'text-gray-500' : 'text-gray-600'}`}>Venc: {tx.dueDate}</span>
                              )}
                            </div>
                          )}
                        </td>
                        <td className="py-3 px-1 text-right whitespace-nowrap">
                          {tx.status === 'pendente' && tx.type === 'despesa' && (
                            <button
                              onClick={() => handleConfirmPay(tx.id)}
                              className={`px-2 py-0.5 rounded text-[9px] font-bold flex items-center gap-0.5 transition-all cursor-pointer ${
                                theme === 'dark' ? 'bg-[#18F2A4]/10 hover:bg-[#18F2A4]/20 text-[#18F2A4]' : 'bg-[#10B981]/15 hover:bg-[#10B981]/25 text-[#10B981]'
                              }`}
                            >
                              <Check className="w-3 h-3" />
                              Pagar
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Quick cash conciliation info */}
            <div className={`p-4 rounded-xl border flex flex-col justify-between ${
              theme === 'dark' ? 'bg-[#111111] border-[#1A1A1A] text-gray-300' : 'bg-white border-gray-200 text-[#111111]'
            }`}>
              <div>
                <span className="text-xs uppercase font-bold text-gray-400 tracking-wider">Fechamento Rápido de Turno</span>
                <p className="text-[11px] text-gray-500 mt-1 mb-4 leading-relaxed">
                  Para auditar o caixa do bar ou operador, o faturamento físico em espécie deve bater rigorosamente com as contagens das maquininhas externas.
                </p>

                <div className="flex flex-col gap-2.5 text-xs">
                  <div className={`flex justify-between items-baseline p-2.5 rounded-lg border ${theme === 'dark' ? 'bg-black/20 border-[#1A1A1A]' : 'bg-gray-50 border-gray-200'}`}>
                    <span className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600 font-medium'}>Espécie (Gaveta):</span>
                    <span className={`font-mono font-bold whitespace-nowrap ${theme === 'dark' ? 'text-emerald-400' : 'text-emerald-700'}`}>R$ {(cashStats?.expected || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div className={`flex justify-between items-baseline p-2.5 rounded-lg border ${theme === 'dark' ? 'bg-black/20 border-[#1A1A1A]' : 'bg-gray-50 border-gray-200'}`}>
                    <span className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>Maquininha Stone (Cartões):</span>
                    <span className={`font-mono font-bold whitespace-nowrap ${theme === 'dark' ? 'text-[#18F2A4]' : 'text-[#10B981]'}`}>
                      R$ {((sales || []).filter(s => s?.status === 'pago' && ['debito', 'credito'].includes(s?.paymentMethod)).reduce((acc, s) => acc + (s?.total || 0), 0)).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div className={`flex justify-between items-baseline p-2.5 rounded-lg border ${theme === 'dark' ? 'bg-black/20 border-[#1A1A1A]' : 'bg-gray-50 border-gray-200'}`}>
                    <span className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>Chave PIX (Banco):</span>
                    <span className={`font-mono font-bold whitespace-nowrap ${theme === 'dark' ? 'text-[#18F2A4]' : 'text-[#10B981]'}`}>
                      R$ {((sales || []).filter(s => s?.status === 'pago' && s?.paymentMethod === 'pix').reduce((acc, s) => acc + (s?.total || 0), 0)).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>
              </div>

              <div className="text-[9px] text-gray-500 leading-normal border-t border-[#1C1C1C] pt-3 mt-4">
                As tarifas financeiras estimadas para este terminal estão fixadas em 1,25% para Débito e 2,99% para Crédito à Vista.
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'dre' && (
        /* DRE (Demonstrativo do Resultado do Exercício) Gerencial Screen */
        <div className={`p-5 rounded-xl border flex flex-col gap-4 ${
          theme === 'dark' ? 'bg-[#111111] border-[#1A1A1A]' : 'bg-white border-gray-200'
        }`}>
          <div className="border-b border-[#1C1C1C] pb-3" style={{ borderColor: theme === 'dark' ? '#1C1C1C' : '#E5E5E5' }}>
            <span className="text-xs uppercase font-bold text-[#18F2A4] tracking-wider">Demonstrativo do Resultado do Exercício (DRE)</span>
            <p className="text-[11px] text-gray-400">Visão gerencial de competência operacional baseada em vendas e despesas reais de caixa.</p>
          </div>

          <div className="flex flex-col gap-3 text-xs max-w-2xl">
            {/* 1. Receita Bruta */}
            <div className="flex justify-between items-center py-2.5 border-b border-[#1C1C1C]" style={{ borderColor: theme === 'dark' ? '#1C1C1C' : '#E5E5E5' }}>
              <span className="font-semibold text-gray-200 uppercase tracking-wider" style={{ color: theme === 'dark' ? 'white' : '#111' }}>(=) RECEITA OPERACIONAL BRUTA</span>
              <span className="font-mono font-bold text-sm whitespace-nowrap">R$ {(dreData?.faturamentoBruto || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </div>
            <div className="flex justify-between items-center pl-4 text-gray-400">
              <span>(+) Faturamento de Vendas</span>
              <span className="font-mono whitespace-nowrap">R$ {((dreData?.faturamentoBruto || 0) - (dreData?.otherRevenues || 0)).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </div>
            {(dreData?.otherRevenues || 0) > 0 && (
              <div className="flex justify-between items-center pl-4 text-gray-400">
                <span>(+) Outras Receitas</span>
                <span className="font-mono whitespace-nowrap">R$ {(dreData?.otherRevenues || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>
            )}

            {/* 2. Deduções / CMV */}
            <div className="flex justify-between items-center py-2.5 border-b border-[#1C1C1C] text-red-400" style={{ borderColor: theme === 'dark' ? '#1C1C1C' : '#E5E5E5' }}>
              <span className="font-semibold uppercase tracking-wider">(-) CUSTO DE MERCADORIA VENDIDA (CMV)</span>
              <span className="font-mono font-bold whitespace-nowrap">- R$ {(dreData?.totalCmv || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </div>

            {/* 3. Margem de Contribuição */}
            <div className="flex justify-between items-center py-2.5 border-b" style={{ borderColor: theme === 'dark' ? '#1C1C1C' : '#E5E5E5' }}>
              <span className="font-semibold uppercase tracking-wider" style={{ color: theme === 'dark' ? '#18F2A4' : '#15803d' }}>(=) MARGEM DE CONTRIBUIÇÃO BRUTA</span>
              <div className="flex gap-4 font-mono font-bold items-center">
                <span className={`text-[10px] px-1.5 py-0.5 rounded font-extrabold ${theme === 'dark' ? 'bg-[#18F2A4]/15 text-[#18F2A4]' : 'bg-emerald-100 text-emerald-900 border border-emerald-200'}`}>{(dreData?.margemPercent || 0).toFixed(1)}%</span>
                <span className="whitespace-nowrap font-black" style={{ color: theme === 'dark' ? '#18F2A4' : '#15803d' }}>R$ {(dreData?.margemContribuicao || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>
            </div>

            {/* 4. Despesas Fixas */}
            <div className={`flex justify-between items-center py-2.5 border-b ${theme === 'dark' ? 'border-[#1C1C1C] text-red-400' : 'border-gray-200 text-red-600 font-medium'}`}>
              <span className="font-semibold uppercase tracking-wider">(-) DESPESAS FIXAS OPERACIONAIS</span>
              <span className="font-mono font-bold whitespace-nowrap">- R$ {(dreData?.despesasFixas || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </div>

            {/* 5. Despesas Variáveis */}
            <div className={`flex justify-between items-center py-2.5 border-b ${theme === 'dark' ? 'border-[#1C1C1C] text-red-400' : 'border-gray-200 text-red-600 font-medium'}`}>
              <span className="font-semibold uppercase tracking-wider">(-) DESPESAS VARIÁVEIS / TAXAS</span>
              <span className="font-mono font-bold whitespace-nowrap">- R$ {(dreData?.despesasVariaveis || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </div>

            {/* 6. Lucro Líquido */}
            <div className={`flex justify-between items-center py-3 border-y-2 border-dashed mt-4 text-sm font-bold ${
              (dreData?.lucroLiquido || 0) >= 0 
                ? theme === 'dark' ? 'text-emerald-400' : 'text-emerald-700' 
                : theme === 'dark' ? 'text-red-400' : 'text-red-600'
            }`} style={{ borderColor: theme === 'dark' ? '#1A1A1A' : '#E5E5E5' }}>
              <span className="uppercase tracking-wider">(=) RESULTADO LÍQUIDO DO PERÍODO</span>
              <div className="flex gap-4 font-mono font-black items-center">
                <span className={`text-xs px-1.5 py-0.5 rounded uppercase font-extrabold border ${
                  (dreData?.lucroLiquido || 0) >= 0 
                    ? theme === 'dark' ? 'bg-emerald-950/40 text-emerald-400 border-emerald-900/30' : 'bg-emerald-100 text-emerald-900 border-emerald-200' 
                    : theme === 'dark' ? 'bg-red-950/40 text-red-400 border-red-900/30' : 'bg-red-100 text-red-900 border-red-200'
                }`}>
                  Rentab: {(dreData?.rentabilidade || 0).toFixed(1)}%
                </span>
                <span className="whitespace-nowrap text-base">R$ {(dreData?.lucroLiquido || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'conciliacao' && (
        <div className={`p-5 rounded-xl border flex flex-col gap-6 ${
          theme === 'dark' ? 'bg-[#111111] border-[#1A1A1A] text-gray-300' : 'bg-white border-gray-200 text-[#111111]'
        }`}>
          <div className="border-b border-[#1C1C1C] pb-3" style={{ borderColor: theme === 'dark' ? '#1C1C1C' : '#E5E5E5' }}>
            <span className="text-xs uppercase font-bold text-[#18F2A4] tracking-wider">Conciliação de Caixa com Contagem Física</span>
            <p className="text-[11px] text-gray-400">Audite e ajuste as divergências de saldo entre o valor em espécie na gaveta do caixa e as vendas registradas.</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left side: Bill Calculator */}
            <div className="lg:col-span-7 flex flex-col gap-4">
              <span className="text-xs uppercase font-bold text-gray-400 flex items-center gap-1.5">
                <Calculator className="w-4 h-4 text-[#18F2A4]" />
                Calculadora de Células e Moedas (Gaveta Física)
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {[
                  { key: 'r200', label: 'Cédulas de R$ 200', val: 200 },
                  { key: 'r100', label: 'Cédulas de R$ 100', val: 100 },
                  { key: 'r50', label: 'Cédulas de R$ 50', val: 50 },
                  { key: 'r20', label: 'Cédulas de R$ 20', val: 20 },
                  { key: 'r10', label: 'Cédulas de R$ 10', val: 10 },
                  { key: 'r5', label: 'Cédulas de R$ 5', val: 5 },
                  { key: 'r2', label: 'Cédulas de R$ 2', val: 2 },
                ].map((item) => (
                  <div 
                    key={item.key} 
                    className={`p-3 rounded-lg border flex justify-between items-center ${
                      theme === 'dark' ? 'bg-[#080808]/50 border-[#1A1A1A]' : 'bg-gray-50 border-gray-100'
                    }`}
                  >
                    <div className="flex flex-col">
                      <span className="text-[11px] font-bold">{item.label}</span>
                      <span className="text-[10px] text-gray-400 font-mono">
                        Subtotal: R$ {((bills[item.key as keyof typeof bills] || 0) * item.val).toFixed(2)}
                      </span>
                    </div>
                    <input
                      type="number"
                      min="0"
                      value={bills[item.key as keyof typeof bills] || ''}
                      placeholder="0"
                      onChange={(e) => setBills(prev => ({ ...prev, [item.key]: Math.max(0, parseInt(e.target.value) || 0) }))}
                      className="w-16 p-1.5 text-center text-xs font-mono font-bold rounded border bg-transparent focus:outline-none focus:border-[#18F2A4]"
                      style={{ borderColor: theme === 'dark' ? '#1C1C1C' : '#D1D5DB', color: theme === 'dark' ? 'white' : 'black' }}
                    />
                  </div>
                ))}

                {/* Coins specifically */}
                <div 
                  className={`p-3 rounded-lg border flex justify-between items-center ${
                    theme === 'dark' ? 'bg-[#080808]/50 border-[#1A1A1A]' : 'bg-gray-50 border-gray-100'
                  }`}
                >
                  <div className="flex flex-col">
                    <span className="text-[11px] font-bold">Total em Moedas (R$)</span>
                    <span className="text-[10px] text-gray-400 font-mono">
                      Subtotal: R$ {(bills.coins || 0).toFixed(2)}
                    </span>
                  </div>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={bills.coins || ''}
                    placeholder="0.00"
                    onChange={(e) => setBills(prev => ({ ...prev, coins: Math.max(0, parseFloat(e.target.value) || 0) }))}
                    className="w-20 p-1.5 text-center text-xs font-mono font-bold rounded border bg-transparent focus:outline-none focus:border-[#18F2A4]"
                    style={{ borderColor: theme === 'dark' ? '#1C1C1C' : '#D1D5DB', color: theme === 'dark' ? 'white' : 'black' }}
                  />
                </div>
              </div>
            </div>

            {/* Right side: Summary and Reconciliation Adjuster */}
            <div className="lg:col-span-5 flex flex-col gap-4">
              <span className="text-xs uppercase font-bold text-gray-400">Demonstrativo e Divergência</span>

              <div className={`p-4 rounded-xl border flex flex-col gap-3.5 ${
                theme === 'dark' ? 'bg-[#080808] border-[#1A1A1A]' : 'bg-gray-50 border-gray-200'
              }`}>
                {/* Total Contado */}
                <div className="flex justify-between items-center border-b pb-2" style={{ borderColor: theme === 'dark' ? '#1C1C1C' : '#E5E5E5' }}>
                  <span className="text-xs font-bold text-gray-400">TOTAL FÍSICO CONTADO:</span>
                  <span className={`text-lg font-black font-mono ${theme === 'dark' ? 'text-emerald-400' : 'text-emerald-700'}`}>
                    R$ {(physicalCountedCash || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>

                {/* Breakdown */}
                <div className="flex flex-col gap-2 text-[11px] font-mono">
                  <div className="flex justify-between">
                    <span className="text-gray-400">(+) Vendas em Dinheiro:</span>
                    <span className="font-bold">R$ {(cashStats?.sales || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">(+) Entradas/Aportes manuais:</span>
                    <span className="font-bold">R$ {(cashStats?.entries || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div className="flex justify-between text-red-400">
                    <span>(-) Saídas/Sangrias manuais:</span>
                    <span>- R$ {(cashStats?.withdrawals || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div className="flex justify-between border-t pt-2 font-bold" style={{ borderColor: theme === 'dark' ? '#1C1C1C' : '#E5E5E5' }}>
                    <span className="text-gray-400">(=) SALDO ESPERADO NO SISTEMA:</span>
                    <span>R$ {(cashStats?.expected || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                  </div>
                </div>

                {/* Divergence Card */}
                <div className={`p-3.5 rounded-lg border flex flex-col gap-1.5 ${
                  Math.abs(physicalCountedCash - cashStats.expected) < 0.01
                    ? (theme === 'dark' ? 'bg-emerald-950/20 border-emerald-900/30 text-emerald-400' : 'bg-emerald-50 border-emerald-200 text-emerald-800')
                    : (physicalCountedCash > cashStats.expected)
                      ? (theme === 'dark' ? 'bg-blue-950/20 border-blue-900/30 text-blue-400' : 'bg-blue-50 border-blue-200 text-blue-800')
                      : (theme === 'dark' ? 'bg-red-950/20 border-red-900/30 text-red-400' : 'bg-red-50 border-red-200 text-red-800')
                }`}>
                  <div className="flex justify-between items-center gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      Status da Divergência:
                    </span>
                    <span className="text-xs font-black font-mono">
                      {Math.abs(physicalCountedCash - cashStats.expected) < 0.01
                        ? 'CONCILIADO'
                        : physicalCountedCash > cashStats.expected
                          ? `SOBRA: + R$ ${(physicalCountedCash - cashStats.expected).toFixed(2)}`
                          : `FALTA: - R$ ${(cashStats.expected - physicalCountedCash).toFixed(2)}`
                      }
                    </span>
                  </div>
                  <p className="text-[10px] leading-relaxed opacity-90">
                    {Math.abs(physicalCountedCash - cashStats.expected) < 0.01
                      ? 'Nenhuma ação é necessária. O dinheiro na gaveta coincide perfeitamente com os registros do sistema.'
                      : physicalCountedCash > cashStats.expected
                        ? 'Existe mais dinheiro físico do que o esperado. Isso pode ocorrer por troco incorreto ou falta de lançamento de venda rápida. Use o botão abaixo para registrar a receita de sobra e ajustar o caixa.'
                        : 'Existe menos dinheiro físico do que o esperado. Isso indica que houve retirada de valores sem registro (sangria), erro de troco ou perda de registro. Use o botão abaixo para lançar uma despesa e equalizar o caixa.'
                    }
                  </p>
                </div>

                {/* Adjustment Notes input */}
                {Math.abs(physicalCountedCash - cashStats.expected) >= 0.01 && (
                  <div className="flex flex-col gap-1 text-[11px]">
                    <label className="text-gray-400 font-bold">Observações do Ajuste:</label>
                    <input
                      type="text"
                      placeholder="Ex: Diferença de caixa turno da tarde - Felipe"
                      value={reconciliationNotes}
                      onChange={(e) => setReconciliationNotes(e.target.value)}
                      className="p-2 rounded border bg-transparent text-xs focus:outline-none focus:border-[#18F2A4]"
                      style={{ borderColor: theme === 'dark' ? '#1C1C1C' : '#D1D5DB', color: theme === 'dark' ? 'white' : 'black' }}
                    />
                  </div>
                )}

                {/* Apply Button */}
                <button
                  onClick={handleApplyAdjustment}
                  disabled={physicalCountedCash === 0 && cashStats.expected === 0}
                  className={`w-full py-2.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2 ${
                    Math.abs(physicalCountedCash - cashStats.expected) < 0.01
                      ? 'bg-gray-800 text-gray-500 cursor-not-allowed'
                      : theme === 'dark'
                        ? 'bg-[#18F2A4] text-black hover:bg-[#12d58f]'
                        : 'bg-[#10B981] text-white hover:bg-[#0e9f6e]'
                  }`}
                >
                  <RefreshCw className="w-3.5 h-3.5 animate-pulse" />
                  Ajustar e Conciliar Saldo no Sistema
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'turnos' && (
        <div className="flex flex-col gap-6">
          
          {/* Active Shift Card or Open Shift Prompt */}
          {!activeShift ? (
            /* ====================================
               1. SHIFT CLOSED: OPEN SHIFT PANEL
               ==================================== */
            <div className={`p-6 rounded-xl border flex flex-col md:flex-row gap-8 items-center ${
              theme === 'dark' ? 'bg-[#111111] border-[#1A1A1A] text-gray-300' : 'bg-white border-gray-200 text-[#111111] shadow-sm'
            }`}>
              <div className="flex-1">
                <span className="text-xs uppercase font-extrabold text-red-500 tracking-wider">Status: Caixa Fechado</span>
                <h3 className="text-lg font-bold mt-1" style={{ color: theme === 'dark' ? 'white' : '#111' }}>
                  Abertura de Turno de Caixa
                </h3>
                <p className="text-xs text-gray-400 mt-2 leading-relaxed">
                  O controle de turnos permite monitorar exatamente as entradas de vendas em dinheiro, PIX ou cartões, aportes adicionais (suprimentos) e retiradas rápidas (sangrias) efetuadas por cada operador, prevenindo furos financeiros e simplificando a conciliação ao fim do expediente.
                </p>
                <div className="mt-4 p-3 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[11px] leading-relaxed">
                  <strong>Controle de Auditoria:</strong> O PDV exige a abertura prévia de turno para o registro de vendas, assegurando a integridade e rastreabilidade total dos lançamentos financeiros.
                </div>
              </div>

              <div className={`p-5 rounded-xl border flex flex-col gap-4 w-full md:w-80 shrink-0 ${
                theme === 'dark' ? 'bg-[#080808]/80 border-[#1C1C1C]' : 'bg-gray-50 border-gray-150'
              }`}>
                <span className="text-xs font-black uppercase text-gray-400 tracking-wider">Formulário de Abertura</span>
                
                <div className="flex flex-col gap-1 text-xs">
                  <label className="text-gray-400 font-bold">Nome do Operador/Atendente:</label>
                  <input
                    type="text"
                    placeholder="Nome ou Apelido"
                    value={opName}
                    onChange={(e) => setOpName(e.target.value)}
                    className="p-2.5 rounded border bg-transparent focus:outline-none focus:border-[#18F2A4]"
                    style={{ borderColor: theme === 'dark' ? '#1C1C1C' : '#D1D5DB', color: theme === 'dark' ? 'white' : 'black' }}
                  />
                </div>

                <div className="flex flex-col gap-1 text-xs">
                  <label className="text-gray-400 font-bold">Fundo de Troco Inicial (R$):</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={initBal}
                    onChange={(e) => setInitBal(Math.max(0, parseFloat(e.target.value) || 0))}
                    className="p-2.5 rounded border bg-transparent focus:outline-none font-mono font-bold focus:border-[#18F2A4]"
                    style={{ borderColor: theme === 'dark' ? '#1C1C1C' : '#D1D5DB', color: theme === 'dark' ? 'white' : 'black' }}
                  />
                  <span className="text-[10px] text-gray-400">Dinheiro em espécie deixado na gaveta para troco.</span>
                </div>

                <button
                  onClick={() => {
                    const operator = opName.trim() || 'Operador Geral';
                    onOpenShift(operator, initBal);
                    alert(`Turno de caixa iniciado. Operador: ${operator} | Fundo: R$ ${initBal.toFixed(2)}`);
                  }}
                  className={`w-full py-2.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 active:scale-95 ${
                    theme === 'dark' ? 'bg-[#18F2A4] text-black hover:bg-[#12d58f]' : 'bg-[#10B981] text-white hover:bg-[#0e9f6e]'
                  }`}
                >
                  Confirmar e Abrir Caixa
                </button>
              </div>
            </div>
          ) : (
            /* ====================================
               2. SHIFT OPEN: MANAGEMENT BOARD
               ==================================== */
            <div className="flex flex-col gap-6">
              
              {/* Active Shift Header Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                
                {/* Active Info */}
                <div className={`p-4 rounded-xl border flex flex-col gap-1.5 ${
                  theme === 'dark' ? 'bg-[#111111] border-[#1A1A1A]' : 'bg-white border-gray-200'
                }`}>
                  <span className="text-[10px] uppercase font-bold tracking-wider text-[#18F2A4] flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-[#18F2A4] animate-pulse"></span>
                    Turno Ativo / Aberto
                  </span>
                  <span className="text-sm font-bold text-gray-200" style={{ color: theme === 'dark' ? 'white' : '#111' }}>
                    Operador: {activeShift.openedBy}
                  </span>
                  <span className="text-[10px] text-gray-400">
                    Aberto em: {new Date(activeShift.openTime).toLocaleDateString('pt-BR')} às {new Date(activeShift.openTime).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>

                {/* Expected Cash */}
                <div className={`p-4 rounded-xl border flex flex-col gap-1.5 ${
                  theme === 'dark' ? 'bg-[#111111] border-[#1A1A1A]' : 'bg-white border-gray-200'
                }`}>
                  <span className="text-[10px] uppercase font-bold tracking-wider text-gray-400">Saldo de Gaveta (Espécie)</span>
                  <span className="text-xl font-bold font-mono text-emerald-400">
                    R$ {(
                      activeShift.initialBalance + 
                      activeShift.cashSales + 
                      activeShift.suprimentos.reduce((acc, s) => acc + s.amount, 0) - 
                      activeShift.sangrias.reduce((acc, s) => acc + s.amount, 0)
                    ).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                  <span className="text-[10px] text-gray-400">
                    Abertura (R$ {activeShift.initialBalance.toFixed(2)}) + Vendas (R$ {activeShift.cashSales.toFixed(2)})
                  </span>
                </div>

                {/* Other sales */}
                <div className={`p-4 rounded-xl border flex flex-col gap-1.5 ${
                  theme === 'dark' ? 'bg-[#111111] border-[#1A1A1A]' : 'bg-white border-gray-200'
                }`}>
                  <span className="text-[10px] uppercase font-bold tracking-wider text-gray-400 font-semibold">Fluxos Digitais & Fiado</span>
                  <div className="flex gap-4 text-[11px] font-mono font-bold mt-1">
                    <span className="text-sky-400">PIX: R$ {activeShift.otherSales.pix.toFixed(2)}</span>
                    <span className="text-purple-400">Cartão: R$ {activeShift.otherSales.card.toFixed(2)}</span>
                    <span className="text-amber-500">Fiado: R$ {activeShift.otherSales.debt.toFixed(2)}</span>
                  </div>
                  <span className="text-[10px] text-gray-400">Valores registrados sem transição física de dinheiro.</span>
                </div>

              </div>

              {/* Drawer Operations & Close Panel Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                
                {/* Drawer Operations Left Panel */}
                <div className="lg:col-span-7 flex flex-col gap-5">
                  
                  {/* Sangria and Suprimento actions side-by-side */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    
                    {/* Sangria Card */}
                    <div className={`p-4 rounded-xl border flex flex-col gap-3.5 ${
                      theme === 'dark' ? 'bg-[#111111] border-[#1A1A1A]' : 'bg-white border-gray-200 shadow-sm'
                    }`}>
                      <span className="text-xs uppercase font-extrabold text-red-400 tracking-wider">Sangria (Retirada de Dinheiro)</span>
                      
                      <div className="flex flex-col gap-2.5 text-xs">
                        <div className="flex flex-col gap-1">
                          <label className="text-gray-400 font-bold">Valor da Retirada (R$):</label>
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={sangriaAmount || ''}
                            placeholder="0.00"
                            onChange={(e) => setSangriaAmount(Math.max(0, parseFloat(e.target.value) || 0))}
                            className="p-2 rounded border bg-transparent text-xs font-mono font-bold focus:outline-none focus:border-red-400"
                            style={{ borderColor: theme === 'dark' ? '#1C1C1C' : '#D1D5DB', color: theme === 'dark' ? 'white' : 'black' }}
                          />
                        </div>
                        <div className="flex flex-col gap-1">
                          <label className="text-gray-400 font-bold">Motivo / Finalidade:</label>
                          <input
                            type="text"
                            placeholder="Ex: Pagar gelo extra, Sangria de segurança"
                            value={sangriaReason}
                            onChange={(e) => setSangriaReason(e.target.value)}
                            className="p-2 rounded border bg-transparent text-xs focus:outline-none focus:border-red-400"
                            style={{ borderColor: theme === 'dark' ? '#1C1C1C' : '#D1D5DB', color: theme === 'dark' ? 'white' : 'black' }}
                          />
                        </div>
                        
                        <button
                          onClick={() => {
                            if (sangriaAmount <= 0 || !sangriaReason.trim()) {
                              alert("Insira um valor e uma justificativa válidos para a sangria.");
                              return;
                            }
                            onSangria(sangriaAmount, sangriaReason);
                            setSangriaAmount(0);
                            setSangriaReason('');
                            alert("Sangria registrada com sucesso.");
                          }}
                          className="w-full py-2 rounded font-black text-xs bg-red-600/15 hover:bg-red-600/25 text-red-400 border border-red-500/25 transition-all cursor-pointer text-center"
                        >
                          Efetuar Sangria
                        </button>
                      </div>
                    </div>

                    {/* Suprimento Card */}
                    <div className={`p-4 rounded-xl border flex flex-col gap-3.5 ${
                      theme === 'dark' ? 'bg-[#111111] border-[#1A1A1A]' : 'bg-white border-gray-200 shadow-sm'
                    }`}>
                      <span className="text-xs uppercase font-extrabold text-sky-400 tracking-wider">Suprimento (Adicionar Dinheiro)</span>
                      
                      <div className="flex flex-col gap-2.5 text-xs">
                        <div className="flex flex-col gap-1">
                          <label className="text-gray-400 font-bold">Valor do Aporte (R$):</label>
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={suprimentoAmount || ''}
                            placeholder="0.00"
                            onChange={(e) => setSuprimentoAmount(Math.max(0, parseFloat(e.target.value) || 0))}
                            className="p-2 rounded border bg-transparent text-xs font-mono font-bold focus:outline-none focus:border-[#18F2A4]"
                            style={{ borderColor: theme === 'dark' ? '#1C1C1C' : '#D1D5DB', color: theme === 'dark' ? 'white' : 'black' }}
                          />
                        </div>
                        <div className="flex flex-col gap-1">
                          <label className="text-gray-400 font-bold">Justificativa / Origem:</label>
                          <input
                            type="text"
                            placeholder="Ex: Troco inicial extra, Câmbio de cédulas"
                            value={suprimentoReason}
                            onChange={(e) => setSuprimentoReason(e.target.value)}
                            className="p-2 rounded border bg-transparent text-xs focus:outline-none focus:border-[#18F2A4]"
                            style={{ borderColor: theme === 'dark' ? '#1C1C1C' : '#D1D5DB', color: theme === 'dark' ? 'white' : 'black' }}
                          />
                        </div>

                        <button
                          onClick={() => {
                            if (suprimentoAmount <= 0 || !suprimentoReason.trim()) {
                              alert("Insira um valor e uma justificativa válidos para o suprimento.");
                              return;
                            }
                            onSuprimento(suprimentoAmount, suprimentoReason);
                            setSuprimentoAmount(0);
                            setSuprimentoReason('');
                            alert("Suprimento registrado com sucesso.");
                          }}
                          className="w-full py-2 rounded font-black text-xs bg-sky-600/15 hover:bg-sky-600/25 text-sky-400 border border-sky-500/25 transition-all cursor-pointer text-center"
                        >
                          Efetuar Suprimento
                        </button>
                      </div>
                    </div>

                  </div>

                  {/* Active Shift Log/Activity Timeline */}
                  <div className={`p-4 rounded-xl border flex flex-col gap-3.5 ${
                    theme === 'dark' ? 'bg-[#111111] border-[#1A1A1A]' : 'bg-white border-gray-200'
                  }`}>
                    <span className="text-xs uppercase font-extrabold text-gray-400 tracking-wider">Histórico de Eventos do Turno</span>
                    
                    <div className="flex flex-col gap-2 max-h-48 overflow-y-auto pr-1">
                      {/* Opening log */}
                      <div className="flex justify-between items-center text-[10px] font-mono text-gray-500">
                        <span>Abertura de Caixa (Troco Inicial)</span>
                        <span className="font-bold text-gray-400">R$ {activeShift.initialBalance.toFixed(2)}</span>
                      </div>

                      {/* Cash sales log summary */}
                      {activeShift.cashSales > 0 && (
                        <div className="flex justify-between items-center text-[10px] font-mono text-emerald-500">
                          <span>Vendas acumuladas em Espécie</span>
                          <span className="font-bold">R$ {activeShift.cashSales.toFixed(2)}</span>
                        </div>
                      )}

                      {/* Suprimentos Log */}
                      {activeShift.suprimentos.map(sup => (
                        <div key={sup.id} className="flex justify-between items-center text-[10px] font-mono text-sky-400">
                          <span>Aporte: {sup.reason}</span>
                          <span className="font-bold">+ R$ {sup.amount.toFixed(2)}</span>
                        </div>
                      ))}

                      {/* Sangrias Log */}
                      {activeShift.sangrias.map(san => (
                        <div key={san.id} className="flex justify-between items-center text-[10px] font-mono text-red-400">
                          <span>Retirada: {san.reason}</span>
                          <span className="font-bold">- R$ {san.amount.toFixed(2)}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                </div>

                {/* Shift Closing Panel Right Side */}
                <div className="lg:col-span-5 flex flex-col gap-4">
                  
                  <div className={`p-4 rounded-xl border flex flex-col gap-4 ${
                    theme === 'dark' ? 'bg-[#111111] border-[#1A1A1A]' : 'bg-white border-gray-200 shadow-sm'
                  }`}>
                    <span className="text-xs uppercase font-extrabold text-amber-400 tracking-wider">Fechamento do Caixa</span>
                    
                    {/* expected cash calculation display */}
                    <div className={`p-3 rounded-lg border flex flex-col gap-1.5 text-xs ${
                      theme === 'dark' ? 'bg-black/30 border-[#1C1C1C]' : 'bg-gray-50 border-gray-150'
                    }`}>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Saldo Estimado em Gaveta:</span>
                        <span className="font-bold font-mono">
                          R$ {(
                            activeShift.initialBalance + 
                            activeShift.cashSales + 
                            activeShift.suprimentos.reduce((acc, s) => acc + s.amount, 0) - 
                            activeShift.sangrias.reduce((acc, s) => acc + s.amount, 0)
                          ).toFixed(2)}
                        </span>
                      </div>
                    </div>

                    {/* Inputs for closing count */}
                    <div className="flex flex-col gap-3 text-xs">
                      
                      <div className="flex flex-col gap-1">
                        <div className="flex justify-between items-center">
                          <label className="text-gray-400 font-bold">Valor Físico Contado na Gaveta:</label>
                          {physicalCountedCash > 0 && (
                            <button
                              onClick={() => setShiftClosingCash(physicalCountedCash)}
                              className="text-[9px] text-[#18F2A4] font-black underline flex items-center gap-1 cursor-pointer"
                              title="Copiar total contado na calculadora de células da aba ao lado"
                            >
                              Copiar da Calculadora (R$ {physicalCountedCash.toFixed(2)})
                            </button>
                          )}
                        </div>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={shiftClosingCash || ''}
                          placeholder="0.00"
                          onChange={(e) => setShiftClosingCash(Math.max(0, parseFloat(e.target.value) || 0))}
                          className="p-2.5 rounded border bg-transparent text-sm font-mono font-bold focus:outline-none focus:border-[#18F2A4]"
                          style={{ borderColor: theme === 'dark' ? '#1C1C1C' : '#D1D5DB', color: theme === 'dark' ? 'white' : 'black' }}
                        />
                      </div>

                      <div className="flex flex-col gap-1">
                        <label className="text-gray-400 font-bold">Observações de Fechamento:</label>
                        <textarea
                          placeholder="Ex: Diferença de R$ 2.00 por moedas de troco faltantes..."
                          rows={2}
                          value={shiftClosingNotes}
                          onChange={(e) => setShiftClosingNotes(e.target.value)}
                          className="p-2 rounded border bg-transparent text-xs resize-none focus:outline-none focus:border-[#18F2A4]"
                          style={{ borderColor: theme === 'dark' ? '#1C1C1C' : '#D1D5DB', color: theme === 'dark' ? 'white' : 'black' }}
                        />
                      </div>

                      {/* Real time Divergence display */}
                      {shiftClosingCash !== 0 && (
                        <div className={`p-3 rounded-lg border flex flex-col gap-1 ${
                          Math.abs(shiftClosingCash - (activeShift.initialBalance + activeShift.cashSales + activeShift.suprimentos.reduce((acc, s) => acc + s.amount, 0) - activeShift.sangrias.reduce((acc, s) => acc + s.amount, 0))) < 0.01
                            ? (theme === 'dark' ? 'bg-emerald-950/20 border-emerald-900/30 text-emerald-400' : 'bg-emerald-50 border-emerald-200 text-emerald-800')
                            : (shiftClosingCash > (activeShift.initialBalance + activeShift.cashSales + activeShift.suprimentos.reduce((acc, s) => acc + s.amount, 0) - activeShift.sangrias.reduce((acc, s) => acc + s.amount, 0)))
                              ? (theme === 'dark' ? 'bg-blue-950/20 border-blue-900/30 text-blue-400' : 'bg-blue-50 border-blue-200 text-blue-800')
                              : (theme === 'dark' ? 'bg-red-950/20 border-red-900/30 text-red-400' : 'bg-red-50 border-red-200 text-red-800')
                        }`}>
                          <div className="flex justify-between font-black font-mono text-[10px]">
                            <span>DIVERGÊNCIA:</span>
                            <span>
                              {(shiftClosingCash - (activeShift.initialBalance + activeShift.cashSales + activeShift.suprimentos.reduce((acc, s) => acc + s.amount, 0) - activeShift.sangrias.reduce((acc, s) => acc + s.amount, 0))) === 0
                                ? 'PERFEITO (CONCILIADO)'
                                : (shiftClosingCash > (activeShift.initialBalance + activeShift.cashSales + activeShift.suprimentos.reduce((acc, s) => acc + s.amount, 0) - activeShift.sangrias.reduce((acc, s) => acc + s.amount, 0)))
                                  ? `SOBRA: + R$ ${(shiftClosingCash - (activeShift.initialBalance + activeShift.cashSales + activeShift.suprimentos.reduce((acc, s) => acc + s.amount, 0) - activeShift.sangrias.reduce((acc, s) => acc + s.amount, 0))).toFixed(2)}`
                                  : `FALTA: - R$ ${((activeShift.initialBalance + activeShift.cashSales + activeShift.suprimentos.reduce((acc, s) => acc + s.amount, 0) - activeShift.sangrias.reduce((acc, s) => acc + s.amount, 0)) - shiftClosingCash).toFixed(2)}`
                              }
                            </span>
                          </div>
                        </div>
                      )}

                      {/* Confirm and Close Button */}
                      <button
                        onClick={() => {
                          const totalSangrias = activeShift.sangrias.reduce((acc, s) => acc + s.amount, 0);
                          const totalSuprimentos = activeShift.suprimentos.reduce((acc, s) => acc + s.amount, 0);
                          const expectedCash = activeShift.initialBalance + activeShift.cashSales + totalSuprimentos - totalSangrias;
                          
                          // Thermal printer document data
                          const receiptData = {
                            date: new Date().toLocaleDateString('pt-BR'),
                            cashierName: activeShift.openedBy,
                            initialBalance: activeShift.initialBalance,
                            methods: {
                              'dinheiro': activeShift.cashSales,
                              'pix': activeShift.otherSales.pix,
                              'cartoes': activeShift.otherSales.card,
                              'fiado': activeShift.otherSales.debt
                            },
                            totalSales: activeShift.cashSales + activeShift.otherSales.pix + activeShift.otherSales.card + activeShift.otherSales.debt,
                            expenses: activeShift.sangrias.map(s => ({ description: `Sangria: ${s.reason}`, value: s.amount })),
                            totalExpenses: totalSangrias,
                            finalBalance: expectedCash
                          };

                          onCloseShift(shiftClosingCash, shiftClosingNotes);
                          
                          triggerThermalPrint('cash_flow', receiptData)
                            .then(() => alert("Extrato de fechamento impresso com sucesso."))
                            .catch(() => alert("Erro ao imprimir extrato térmico."));

                          setShiftClosingCash(0);
                          setShiftClosingNotes('');
                          alert("Turno de caixa encerrado com sucesso.");
                        }}
                        className={`w-full py-2.5 rounded-lg text-xs font-black transition-all cursor-pointer flex items-center justify-center gap-1.5 active:scale-95 ${
                          theme === 'dark' ? 'bg-[#18F2A4] text-black hover:bg-[#12d58f]' : 'bg-[#10B981] text-white hover:bg-[#0e9f6e]'
                        }`}
                      >
                        <Printer className="w-3.5 h-3.5" />
                        Finalizar Turno e Imprimir Fechamento
                      </button>

                    </div>

                  </div>

                </div>

              </div>

            </div>
          )}

          {/* Past Shifts History Listing */}
          <div className={`p-4 rounded-xl border flex flex-col gap-3 ${
            theme === 'dark' ? 'bg-[#111111] border-[#1A1A1A]' : 'bg-white border-gray-200'
          }`}>
            <div>
              <span className="text-xs uppercase font-extrabold text-gray-400 tracking-wider">Histórico de Fechamentos Recentes</span>
              <p className="text-[10px] text-gray-500 mt-0.5">Audite o registro histórico de turnos anteriores finalizados neste terminal.</p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-[11px] border-collapse">
                <thead>
                  <tr className="border-b" style={{ borderColor: theme === 'dark' ? '#1C1C1C' : '#E5E5E5' }}>
                    <th className="py-2 font-bold text-gray-400">Operador</th>
                    <th className="py-2 font-bold text-gray-400">Abertura</th>
                    <th className="py-2 font-bold text-gray-400">Fechamento</th>
                    <th className="py-2 font-bold text-gray-400 text-right">Troco Inicial</th>
                    <th className="py-2 font-bold text-gray-400 text-right">Vendas Dinheiro</th>
                    <th className="py-2 font-bold text-gray-400 text-right">Gaveta Esperado</th>
                    <th className="py-2 font-bold text-gray-400 text-right">Físico Informado</th>
                    <th className="py-2 font-bold text-gray-400 text-right">Diferença</th>
                    <th className="py-2 font-bold text-gray-400 text-center">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {shiftHistory.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="py-4 text-center text-gray-500 font-medium">Nenhum turno anterior arquivado.</td>
                    </tr>
                  ) : (
                    shiftHistory.map((sh, idx) => {
                      const totalSangrias = sh.sangrias.reduce((acc, s) => acc + s.amount, 0);
                      const totalSuprimentos = sh.suprimentos.reduce((acc, s) => acc + s.amount, 0);
                      const expected = sh.initialBalance + sh.cashSales + totalSuprimentos - totalSangrias;
                      const diff = sh.closingCashCounted !== undefined ? sh.closingCashCounted - expected : 0;
                      
                      return (
                        <tr key={sh.id || idx} className="border-b" style={{ borderColor: theme === 'dark' ? '#111111' : '#F3F4F6' }}>
                          <td className="py-3 font-semibold" style={{ color: theme === 'dark' ? 'white' : '#111' }}>{sh.openedBy}</td>
                          <td className="py-3 text-gray-400 font-mono">{new Date(sh.openTime).toLocaleDateString('pt-BR')} {new Date(sh.openTime).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</td>
                          <td className="py-3 text-gray-400 font-mono">{sh.closeTime ? `${new Date(sh.closeTime).toLocaleDateString('pt-BR')} ${new Date(sh.closeTime).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}` : '-'}</td>
                          <td className="py-3 text-right font-mono text-gray-400">R$ {sh.initialBalance.toFixed(2)}</td>
                          <td className="py-3 text-right font-mono text-gray-400">R$ {sh.cashSales.toFixed(2)}</td>
                          <td className="py-3 text-right font-mono text-gray-400">R$ {expected.toFixed(2)}</td>
                          <td className="py-3 text-right font-mono" style={{ color: theme === 'dark' ? 'white' : '#111' }}>R$ {sh.closingCashCounted?.toFixed(2) || '0.00'}</td>
                          <td className={`py-3 text-right font-mono font-bold ${
                            Math.abs(diff) < 0.01 ? 'text-emerald-500' : diff > 0 ? 'text-blue-500' : 'text-red-500'
                          }`}>
                            {Math.abs(diff) < 0.01 ? 'OK' : diff > 0 ? `+ R$ ${diff.toFixed(2)}` : `- R$ ${Math.abs(diff).toFixed(2)}`}
                          </td>
                          <td className="py-3 text-center">
                            <button
                              onClick={() => {
                                const receiptData = {
                                  date: new Date(sh.openTime).toLocaleDateString('pt-BR'),
                                  cashierName: sh.openedBy,
                                  initialBalance: sh.initialBalance,
                                  methods: {
                                    'dinheiro': sh.cashSales,
                                    'pix': sh.otherSales.pix,
                                    'cartoes': sh.otherSales.card,
                                    'fiado': sh.otherSales.debt
                                  },
                                  totalSales: sh.cashSales + sh.otherSales.pix + sh.otherSales.card + sh.otherSales.debt,
                                  expenses: sh.sangrias.map(s => ({ description: `Sangria: ${s.reason}`, value: s.amount })),
                                  totalExpenses: totalSangrias,
                                  finalBalance: expected
                                };
                                triggerThermalPrint('cash_flow', receiptData);
                                alert("Cupom de auditoria enviado para impressão!");
                              }}
                              className={`px-2 py-1 rounded text-[10px] font-bold flex items-center justify-center gap-1 mx-auto transition-colors ${
                                theme === 'dark' ? 'bg-[#1A1A1A] hover:bg-[#252525] text-gray-300' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                              }`}
                              title="Reimprimir Cupom"
                            >
                              <Printer className="w-3.5 h-3.5" />
                              Reimprimir
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

      {/* Launch Custom Transaction modal overlay */}
      {showAddTxModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className={`w-full max-w-sm rounded-xl border flex flex-col p-4 shadow-2xl ${
            theme === 'dark' ? 'bg-[#0E0E0E] border-[#1A1A1A] text-white' : 'bg-white border-gray-200 text-[#111111]'
          }`}>
            <h3 className="text-sm font-bold mb-3">Lançamento Financeiro Manual</h3>
            
            <form onSubmit={handleManualSubmit} className="flex flex-col gap-3 text-xs">
              <div className="flex gap-4 p-1 rounded bg-black/30 mb-2">
                <button
                  type="button"
                  onClick={() => { setType('despesa'); setCategory('Despesas Variáveis'); }}
                  className={`flex-1 py-1 text-center rounded font-semibold ${type === 'despesa' ? 'bg-red-600 text-white' : 'text-gray-400'}`}
                >
                  Despesa (Saída)
                </button>
                <button
                  type="button"
                  onClick={() => { setType('receita'); setCategory('Outros'); }}
                  className={`flex-1 py-1 text-center rounded font-semibold ${type === 'receita' ? (theme === 'dark' ? 'bg-[#18F2A4] text-black' : 'bg-[#10B981] text-white') : 'text-gray-400'}`}
                >
                  Receita (Entrada)
                </button>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-gray-400 font-medium">Categoria</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="p-2 rounded border focus:outline-none"
                  style={{ backgroundColor: theme === 'dark' ? '#111' : 'white', borderColor: theme === 'dark' ? '#222' : '#E5E5E5', color: theme === 'dark' ? 'white' : 'black' }}
                >
                  {type === 'despesa' ? (
                    <>
                      <option value="Serviços públicos (Luz/Água)">Serviços públicos (Luz/Água)</option>
                      <option value="Aluguel">Aluguel</option>
                      <option value="Salários">Salários</option>
                      <option value="Manutenção do bar">Manutenção do bar</option>
                      <option value="Despesas Variáveis">Despesas Variáveis</option>
                    </>
                  ) : (
                    <>
                      <option value="Vendas">Vendas</option>
                      <option value="Outros">Outros</option>
                    </>
                  )}
                </select>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-gray-400 font-medium">Descrição *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Compra de Gelo extra para o turno"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="p-2 rounded border focus:outline-none"
                  style={{ backgroundColor: theme === 'dark' ? '#111' : 'white', borderColor: theme === 'dark' ? '#222' : '#E5E5E5', color: theme === 'dark' ? 'white' : 'black' }}
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-gray-400 font-medium">Valor Total (R$) *</label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  required
                  value={value || ''}
                  onChange={(e) => setValue(Number(e.target.value))}
                  className="p-2 rounded border focus:outline-none font-mono font-bold"
                  style={{ backgroundColor: theme === 'dark' ? '#111' : 'white', borderColor: theme === 'dark' ? '#222' : '#E5E5E5', color: theme === 'dark' ? 'white' : 'black' }}
                />
              </div>

              <div className="flex gap-2 justify-end pt-2 border-t" style={{ borderColor: theme === 'dark' ? '#1A1A1A' : '#E5E5E5' }}>
                <button
                  type="button"
                  onClick={() => setShowAddTxModal(false)}
                  className={`px-3 py-1.5 rounded text-xs border ${
                    theme === 'dark' ? 'bg-transparent border-[#222] text-gray-400 hover:text-white' : 'bg-white border-gray-200 text-gray-500'
                  }`}
                >
                  Voltar
                </button>
                <button
                  type="submit"
                  className={`px-3 py-1.5 rounded text-xs font-semibold ${
                    theme === 'dark' ? 'bg-[#18F2A4] text-black hover:bg-[#12d58f]' : 'bg-[#10B981] text-white hover:bg-[#0e9f6e]'
                  }`}
                >
                  Confirmar Lançamento
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
