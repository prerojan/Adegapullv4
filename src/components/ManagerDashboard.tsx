import React, { useState, useMemo } from 'react';
import { 
  TrendingUp, TrendingDown, Package, ShoppingBag, DollarSign, 
  ArrowRight, AlertTriangle, CheckCircle, Calendar, Filter, RefreshCw
} from 'lucide-react';
import { Product, Sale, FinancialTransaction } from '../types';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from 'recharts';

interface ManagerDashboardProps {
  products: Product[];
  sales: Sale[];
  financialTransactions: FinancialTransaction[];
  theme: 'dark' | 'light';
  onGoToTab: (tab: string) => void;
}

export default function ManagerDashboard({
  products,
  sales,
  financialTransactions,
  theme,
  onGoToTab
}: ManagerDashboardProps) {
  const isDark = theme === 'dark';

  // 1. Date Filter States
  const [dateRangeType, setDateRangeType] = useState<string>('30days');
  const [startDate, setStartDate] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState<string>(() => {
    return new Date().toISOString().split('T')[0];
  });

  const handleRangeChange = (type: string) => {
    setDateRangeType(type);
    const today = new Date();
    let start = new Date();
    
    if (type === 'today') {
      start = today;
    } else if (type === '7days') {
      start.setDate(today.getDate() - 7);
    } else if (type === '30days') {
      start.setDate(today.getDate() - 30);
    } else if (type === 'month') {
      start = new Date(today.getFullYear(), today.getMonth(), 1);
    } else if (type === 'all') {
      setStartDate('');
      setEndDate(today.toISOString().split('T')[0]);
      return;
    }

    setStartDate(start.toISOString().split('T')[0]);
    setEndDate(today.toISOString().split('T')[0]);
  };

  // 2. Filtered Data Sets based on selected Date Range
  const filteredSales = useMemo(() => {
    return sales.filter(s => {
      const saleDate = s.timestamp.substring(0, 10);
      return (!startDate || saleDate >= startDate) && (!endDate || saleDate <= endDate);
    });
  }, [sales, startDate, endDate]);

  const filteredTransactions = useMemo(() => {
    return financialTransactions.filter(t => {
      const tDate = (t.timestamp || t.date || '').substring(0, 10);
      if (!tDate) return true; // Keep if no date available
      return (!startDate || tDate >= startDate) && (!endDate || tDate <= endDate);
    });
  }, [financialTransactions, startDate, endDate]);

  // 3. High-level Financial Metrics Calculations
  const stats = useMemo(() => {
    // 1. Gross Revenue (Total faturado das vendas pagas no período)
    const totalSales = filteredSales
      .filter(s => s.status === 'pago')
      .reduce((acc, s) => acc + s.total, 0);

    // 2. Outflows (Despesas pagas no período)
    const totalExpenses = filteredTransactions
      .filter(t => t.type === 'despesa' && t.status === 'pago')
      .reduce((acc, t) => acc + t.value, 0);

    // 3. Cost of Goods Sold (CMV) based on costPrice
    let totalCmv = 0;
    filteredSales
      .filter(s => s.status === 'pago')
      .forEach(s => {
        s.items.forEach(item => {
          const prod = products.find(p => p.id === item.productId);
          if (prod) {
            totalCmv += prod.costPrice * item.quantity;
          } else {
            totalCmv += item.unitPrice * 0.5 * item.quantity;
          }
        });
      });

    // 4. Net Profit
    const netProfit = totalSales - totalCmv - totalExpenses;
    
    // 5. Total transactions count
    const transactionsCount = filteredSales.length;

    // 6. Low stock products count (independent of period - alert status)
    const lowStockProducts = products.filter(p => {
      const totalUnits = (p.stockBoxes * p.boxQuantity) + p.stockUnits;
      return p.active && totalUnits <= p.minStockUnits;
    });

    return {
      totalSales,
      totalExpenses,
      netProfit,
      transactionsCount,
      lowStockProducts,
      lowStockCount: lowStockProducts.length
    };
  }, [products, filteredSales, filteredTransactions]);

  // 4. Top Selling Products based on current filtered Sales
  const topSellingProducts = useMemo(() => {
    const counts: { [id: string]: { qty: number; name: string; revenue: number } } = {};
    filteredSales
      .filter(s => s.status === 'pago')
      .forEach(s => {
        s.items.forEach(item => {
          const prod = products.find(p => p.id === item.productId);
          const name = prod ? prod.name : 'Produto Desconhecido';
          if (!counts[item.productId]) {
            counts[item.productId] = { qty: 0, name, revenue: 0 };
          }
          counts[item.productId].qty += item.quantity;
          counts[item.productId].revenue += item.quantity * item.unitPrice;
        });
      });

    return Object.entries(counts)
      .map(([id, info]) => ({ id, ...info }))
      .sort((a, b) => b.qty - a.qty)
      .slice(0, 5);
  }, [products, filteredSales]);

  // 5. Chart 1: Revenue Timeline (Recharts AreaChart)
  const chartTimelineData = useMemo(() => {
    const dataMap: { [date: string]: number } = {};
    
    // Build days structure for the selected period
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      const diffTime = Math.abs(end.getTime() - start.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) || 1;
      
      const maxRangeDays = Math.min(diffDays, 31); // Limit to 31 points to avoid over-crowding
      for (let i = 0; i <= maxRangeDays; i++) {
        const d = new Date(start);
        d.setDate(start.getDate() + i);
        const dateStr = d.toISOString().split('T')[0];
        dataMap[dateStr] = 0;
      }
    } else {
      // Fallback: last 7 days
      for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const dateStr = d.toISOString().split('T')[0];
        dataMap[dateStr] = 0;
      }
    }

    filteredSales
      .filter(s => s.status === 'pago')
      .forEach(s => {
        const dateStr = s.timestamp.substring(0, 10);
        if (dataMap[dateStr] !== undefined) {
          dataMap[dateStr] += s.total;
        }
      });

    return Object.entries(dataMap)
      .map(([date, amount]) => {
        const parts = date.split('-');
        const dayMonth = parts.length === 3 ? `${parts[2]}/${parts[1]}` : date;
        return {
          rawDate: date,
          name: dayMonth,
          Faturamento: amount
        };
      })
      .sort((a, b) => a.rawDate.localeCompare(b.rawDate));
  }, [filteredSales, startDate, endDate]);

  // 6. Chart 2: Peak Hours of Sale (Recharts AreaChart / BarChart)
  const chartPeakHoursData = useMemo(() => {
    const hoursMap: { [hour: number]: number } = {};
    
    // Initialize all 24 hours to show a complete daily cycle
    for (let h = 0; h < 24; h++) {
      hoursMap[h] = 0;
    }

    filteredSales.forEach(s => {
      const matches = s.timestamp.match(/(\d{2}):\d{2}:\d{2}/);
      if (matches && matches[1]) {
        const hr = parseInt(matches[1], 10);
        if (hoursMap[hr] !== undefined) {
          hoursMap[hr] += 1;
        } else {
          hoursMap[hr] = 1;
        }
      }
    });

    return Object.entries(hoursMap)
      .map(([hour, count]) => ({
        name: `${hour.toString().padStart(2, '0')}h`,
        Pedidos: count,
        rawHour: parseInt(hour, 10)
      }))
      .sort((a, b) => a.rawHour - b.rawHour);
  }, [filteredSales]);

  // 7. Chart 3: Payment Distribution (Recharts PieChart)
  const chartPaymentData = useMemo(() => {
    const paymentMap: { [method: string]: number } = {};
    
    filteredSales
      .filter(s => s.status === 'pago')
      .forEach(s => {
        const rawMethod = s.paymentMethod || 'Outros';
        let method = rawMethod;
        
        // Normalize
        const lower = rawMethod.toLowerCase();
        if (lower === 'dinheiro') method = 'Dinheiro';
        else if (lower === 'pix') method = 'PIX';
        else if (lower.includes('credit') || lower.includes('crédito') || lower.includes('credito')) method = 'C. Crédito';
        else if (lower.includes('debit') || lower.includes('débito') || lower.includes('debito')) method = 'C. Débito';
        else method = rawMethod.charAt(0).toUpperCase() + rawMethod.slice(1);

        paymentMap[method] = (paymentMap[method] || 0) + s.total;
      });

    return Object.entries(paymentMap)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [filteredSales]);

  // Professional colors for Pie Chart segments
  const COLORS = ['#10B981', '#6366F1', '#06B6D4', '#F59E0B', '#EF4444', '#EC4899', '#8B5CF6'];

  // Custom styled Tooltip component for Recharts
  const renderMoneyTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className={`p-3 rounded-xl border shadow-xl text-xs font-sans leading-none ${
          isDark ? 'bg-[#0F0F0F] border-gray-800 text-white' : 'bg-white border-gray-200 text-gray-900 shadow-md'
        }`}>
          <p className="font-bold mb-1.5">{label || 'Data/Período'}</p>
          <p className="font-mono text-emerald-500 font-extrabold text-sm">
            R$ {payload[0].value.toFixed(2)}
          </p>
        </div>
      );
    }
    return null;
  };

  const renderSimpleTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className={`p-3 rounded-xl border shadow-xl text-xs font-sans leading-none ${
          isDark ? 'bg-[#0F0F0F] border-gray-800 text-white' : 'bg-white border-gray-200 text-gray-900 shadow-md'
        }`}>
          <p className="font-bold mb-1.5">{label || 'Horário'}</p>
          <p className="font-mono text-indigo-400 font-extrabold text-sm">
            {payload[0].value} {payload[0].value === 1 ? 'pedido' : 'pedidos'}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="flex flex-col gap-6 w-full font-sans">
      
      {/* 1. Sleek Predefined & Custom Date Range Filter Bar */}
      <div className={`p-4 rounded-xl border flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all ${
        isDark ? 'bg-[#121212]/30 border-[#1C1C1C]' : 'bg-white border-slate-200 shadow-xs text-slate-900'
      }`}>
        <div className="flex items-center gap-2">
          <Calendar className="w-4.5 h-4.5 text-emerald-500" />
          <h2 className={`text-sm font-extrabold tracking-tight ${isDark ? 'text-gray-100' : 'text-slate-900'}`}>
            Filtro de Período Executivo
          </h2>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Preset Buttons */}
          <div className={`flex rounded-lg p-0.5 border ${isDark ? 'border-gray-800/20 bg-gray-500/5' : 'border-slate-200 bg-slate-100/80'}`}>
            {[
              { id: 'today', label: 'Hoje' },
              { id: '7days', label: '7 Dias' },
              { id: '30days', label: '30 Dias' },
              { id: 'month', label: 'Mês Atual' },
              { id: 'all', label: 'Tudo' }
            ].map(preset => (
              <button
                key={preset.id}
                onClick={() => handleRangeChange(preset.id)}
                className={`px-3 py-1 text-[10px] font-bold rounded-md transition-all cursor-pointer uppercase tracking-wider ${
                  dateRangeType === preset.id
                    ? (isDark ? 'bg-emerald-500 text-black font-extrabold shadow-sm' : 'bg-[#10B981] text-white font-extrabold shadow-xs')
                    : (isDark ? 'text-gray-400 hover:text-gray-200' : 'text-slate-600 hover:text-slate-950 font-semibold')
                }`}
              >
                {preset.label}
              </button>
            ))}
          </div>

          <div className={`h-4 w-px hidden sm:block ${isDark ? 'bg-gray-800/20' : 'bg-slate-200'}`} />

          {/* Custom Date Inputs */}
          <div className="flex items-center gap-1.5 text-xs">
            <input
              type="date"
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value);
                setDateRangeType('custom');
              }}
              className={`px-2 py-1 rounded-lg border outline-none font-bold text-[11px] ${
                isDark ? 'bg-black border-gray-800 text-white' : 'bg-white border-slate-300 text-slate-900 shadow-2xs'
              }`}
            />
            <span className={`text-[10px] font-bold uppercase ${isDark ? 'text-gray-500' : 'text-slate-500'}`}>até</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => {
                setEndDate(e.target.value);
                setDateRangeType('custom');
              }}
              className={`px-2 py-1 rounded-lg border outline-none font-bold text-[11px] ${
                isDark ? 'bg-black border-gray-800 text-white' : 'bg-white border-slate-300 text-slate-900 shadow-2xs'
              }`}
            />
          </div>
        </div>
      </div>

      {/* 2. Professional KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Gross Revenue */}
        <div 
          onClick={() => onGoToTab('financeiro')}
          className={`p-5 rounded-xl border flex justify-between items-center cursor-pointer transition-all hover:scale-[1.01] ${
            isDark ? 'bg-[#121212]/30 border-[#1C1C1C] hover:border-emerald-500/30' : 'bg-white border-slate-200 hover:border-emerald-400 shadow-xs hover:shadow-md'
          }`}
        >
          <div className="text-left">
            <p className={`text-[10px] font-extrabold tracking-wider uppercase ${isDark ? 'text-gray-500' : 'text-slate-500'}`}>
              Faturamento Bruto
            </p>
            <p className={`text-xl font-black font-mono tracking-tight mt-2 ${isDark ? 'text-gray-100' : 'text-slate-900'}`}>
              R$ {(stats?.totalSales || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </p>
            <span className={`text-[9px] block mt-1 ${isDark ? 'text-gray-400' : 'text-slate-500 font-medium'}`}>Período selecionado</span>
          </div>
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isDark ? 'bg-emerald-500/10 text-emerald-400' : 'bg-emerald-50 text-emerald-600 border border-emerald-200/60'}`}>
            <TrendingUp className="w-5 h-5" />
          </div>
        </div>

        {/* KPI 2: Costs and Outflows */}
        <div 
          onClick={() => onGoToTab('financeiro')}
          className={`p-5 rounded-xl border flex justify-between items-center cursor-pointer transition-all hover:scale-[1.01] ${
            isDark ? 'bg-[#121212]/30 border-[#1C1C1C] hover:border-rose-500/30' : 'bg-white border-slate-200 hover:border-rose-400 shadow-xs hover:shadow-md'
          }`}
        >
          <div className="text-left">
            <p className={`text-[10px] font-extrabold tracking-wider uppercase ${isDark ? 'text-gray-500' : 'text-slate-500'}`}>
              Custos e Despesas
            </p>
            <p className={`text-xl font-black font-mono tracking-tight mt-2 ${isDark ? 'text-gray-100' : 'text-slate-900'}`}>
              R$ {(stats?.totalExpenses || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </p>
            <span className={`text-[9px] block mt-1 ${isDark ? 'text-gray-400' : 'text-slate-500 font-medium'}`}>Pagos no período</span>
          </div>
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isDark ? 'bg-rose-500/10 text-rose-400' : 'bg-rose-50 text-rose-600 border border-rose-200/60'}`}>
            <TrendingDown className="w-5 h-5" />
          </div>
        </div>

        {/* KPI 3: Net Profit */}
        <div 
          onClick={() => onGoToTab('financeiro')}
          className={`p-5 rounded-xl border flex justify-between items-center cursor-pointer transition-all hover:scale-[1.01] ${
            isDark ? 'bg-[#121212]/30 border-[#1C1C1C] hover:border-sky-500/30' : 'bg-white border-slate-200 hover:border-sky-400 shadow-xs hover:shadow-md'
          }`}
        >
          <div className="text-left">
            <p className={`text-[10px] font-extrabold tracking-wider uppercase ${isDark ? 'text-gray-500' : 'text-slate-500'}`}>
              Lucro Líquido
            </p>
            <p className={`text-xl font-black font-mono tracking-tight mt-2 ${
              (stats?.netProfit || 0) >= 0 ? (isDark ? 'text-sky-400' : 'text-sky-700') : 'text-rose-600'
            }`}>
              R$ {(stats?.netProfit || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </p>
            <span className={`text-[9px] block mt-1 ${isDark ? 'text-gray-400' : 'text-slate-500 font-medium'}`}>Margem operacional</span>
          </div>
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
            stats.netProfit >= 0 
              ? (isDark ? 'bg-sky-500/10 text-sky-400' : 'bg-sky-50 text-sky-700 border border-sky-200/60') 
              : 'bg-rose-50 text-rose-700 border border-rose-200/60'
          }`}>
            <DollarSign className="w-5 h-5" />
          </div>
        </div>

        {/* KPI 4: Replenishment Alerts (Estoque Alerta) */}
        <div 
          onClick={() => onGoToTab('produtos')}
          className={`p-5 rounded-xl border flex justify-between items-center cursor-pointer transition-all hover:scale-[1.01] ${
            isDark ? 'bg-[#121212]/30 border-[#1C1C1C] hover:border-amber-500/30' : 'bg-white border-slate-200 hover:border-amber-400 shadow-xs hover:shadow-md'
          }`}
        >
          <div className="text-left">
            <p className={`text-[10px] font-extrabold tracking-wider uppercase ${isDark ? 'text-gray-500' : 'text-slate-500'}`}>
              Rupturas de Estoque
            </p>
            <p className={`text-xl font-black font-mono tracking-tight mt-2 ${
              stats.lowStockCount > 0 ? 'text-amber-600 font-extrabold' : (isDark ? 'text-gray-100' : 'text-slate-900')
            }`}>
              {stats.lowStockCount} {stats.lowStockCount === 1 ? 'SKU crítico' : 'SKUs críticos'}
            </p>
            <span className={`text-[9px] block mt-1 ${isDark ? 'text-gray-400' : 'text-slate-500 font-medium'}`}>Abaixo do estoque mínimo</span>
          </div>
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
            stats.lowStockCount > 0 
              ? (isDark ? 'bg-amber-500/10 text-amber-500 animate-pulse' : 'bg-amber-50 text-amber-700 border border-amber-200/60')
              : (isDark ? 'bg-black/30 text-gray-500' : 'bg-slate-100 text-slate-500')
          }`}>
            <Package className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* 3. Conditional Replenishment Alerts Card (Avoids Clutter, appears only when necessary!) */}
      {stats.lowStockCount > 0 && (
        <div className={`p-5 rounded-xl border border-amber-500/20 text-left transition-all ${
          isDark ? 'bg-amber-950/10' : 'bg-amber-50/40'
        }`}>
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="w-5 h-5 text-amber-500" />
            <h3 className={`text-xs font-black uppercase tracking-wider ${isDark ? 'text-amber-400' : 'text-amber-800'}`}>
              Atenção: Necessidade Crítica de Reposição de Estoque ({stats.lowStockCount})
            </h3>
            <span className="text-[9px] bg-amber-500/10 text-amber-500 px-2 py-0.5 rounded-full font-bold ml-auto">Urgente</span>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {stats.lowStockProducts.slice(0, 6).map((p) => {
              const currentUnitsTotal = (p.stockBoxes * p.boxQuantity) + p.stockUnits;
              return (
                <div 
                  key={p.id} 
                  onClick={() => onGoToTab('produtos')}
                  className={`p-3 rounded-lg border flex flex-col justify-between cursor-pointer transition-colors ${
                    isDark ? 'bg-black/40 border-gray-900 hover:border-amber-500/30' : 'bg-white border-gray-150 hover:border-amber-300'
                  }`}
                >
                  <div className="flex justify-between items-start gap-1">
                    <p className={`text-xs font-bold truncate ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>{p.name}</p>
                    <span className="text-[8px] bg-red-500/10 text-red-500 px-1 py-0.5 rounded font-mono font-bold shrink-0">
                      -{Math.max(0, p.minStockUnits - currentUnitsTotal)} un
                    </span>
                  </div>

                  <div className="mt-2 flex justify-between items-end text-[10px] font-mono">
                    <div>
                      <span className="text-gray-500 block text-[9px] uppercase">Estoque atual</span>
                      <span className={`font-bold ${currentUnitsTotal === 0 ? 'text-red-500' : 'text-amber-500'}`}>
                        {p.stockBoxes} fdos / {p.stockUnits} un ({currentUnitsTotal} un)
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-gray-500 block text-[9px] uppercase">Mínimo</span>
                      <span className={`font-bold ${isDark ? 'text-gray-400' : 'text-gray-650'}`}>{p.minStockUnits} un</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {stats.lowStockCount > 6 && (
            <button 
              onClick={() => onGoToTab('produtos')}
              className="mt-3 text-[10px] font-bold text-amber-600 hover:text-amber-500 inline-flex items-center gap-1 cursor-pointer"
            >
              Visualizar mais {stats.lowStockCount - 6} produtos com estoque baixo <ArrowRight className="w-3 h-3" />
            </button>
          )}
        </div>
      )}

      {/* 4. Primary Recharts Area: Revenue + Sales Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Chart Card 1: Gross Revenue Over Time (Recharts AreaChart) */}
        <div className={`p-5 rounded-xl border lg:col-span-8 flex flex-col justify-between ${
          isDark ? 'bg-[#121212]/30 border-[#1C1C1C]' : 'bg-white border-slate-200 shadow-xs text-slate-900'
        }`}>
          <div className="flex justify-between items-start border-b pb-3 mb-4" style={{ borderColor: isDark ? '#1C1C1C' : '#E2E8F0' }}>
            <div className="text-left">
              <h3 className={`text-xs font-black tracking-wider uppercase ${isDark ? 'text-gray-300' : 'text-slate-800'}`}>
                Histórico de Faturamento Bruto (Recorrente)
              </h3>
              <p className={`text-[10px] mt-1 ${isDark ? 'text-gray-500' : 'text-slate-500 font-medium'}`}>Curva diária de vendas em reais do período selecionado</p>
            </div>
            <div className="text-right">
              <span className={`text-xs font-black font-mono ${isDark ? 'text-emerald-400' : 'text-emerald-700'}`}>
                R$ {(stats?.totalSales || 0).toLocaleString('pt-BR', { maximumFractionDigits: 0 })}
              </span>
            </div>
          </div>

          {chartTimelineData.length === 0 ? (
            <div className={`h-60 flex items-center justify-center text-xs ${isDark ? 'text-gray-500' : 'text-slate-500'}`}>
              Nenhum dado faturado no período.
            </div>
          ) : (
            <div className="w-full h-60">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={chartTimelineData}
                  margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10B981" stopOpacity={0.25}/>
                      <stop offset="95%" stopColor="#10B981" stopOpacity={0.0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#222' : '#E2E8F0'} />
                  <XAxis 
                    dataKey="name" 
                    tick={{ fill: isDark ? '#888' : '#334155', fontSize: 10, fontWeight: 'bold' }} 
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis 
                    tick={{ fill: isDark ? '#888' : '#334155', fontSize: 10, fontWeight: 'bold' }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(val) => `R$${val}`}
                  />
                  <Tooltip content={renderMoneyTooltip} />
                  <Area 
                    type="monotone" 
                    dataKey="Faturamento" 
                    stroke="#10B981" 
                    strokeWidth={2.5}
                    fillOpacity={1} 
                    fill="url(#colorRevenue)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Chart Card 2: Payment Methods (Recharts PieChart) */}
        <div className={`p-5 rounded-xl border lg:col-span-4 flex flex-col justify-between ${
          isDark ? 'bg-[#121212]/30 border-[#1C1C1C]' : 'bg-white border-slate-200 shadow-xs text-slate-900'
        }`}>
          <div className="border-b pb-3 mb-4 text-left" style={{ borderColor: isDark ? '#1C1C1C' : '#E2E8F0' }}>
            <h3 className={`text-xs font-black tracking-wider uppercase ${isDark ? 'text-gray-300' : 'text-slate-800'}`}>
              Distribuição por Meio de Pagamento
            </h3>
            <p className={`text-[10px] mt-1 ${isDark ? 'text-gray-500' : 'text-slate-500 font-medium'}`}>Divisão proporcional do faturamento</p>
          </div>

          {chartPaymentData.length === 0 ? (
            <div className={`h-60 flex items-center justify-center text-xs ${isDark ? 'text-gray-500' : 'text-slate-500'}`}>
              Sem dados disponíveis.
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center flex-1">
              <div className="w-full h-44 flex items-center justify-center relative">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={chartPaymentData}
                      cx="50%"
                      cy="50%"
                      innerRadius={45}
                      outerRadius={70}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {chartPaymentData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: any) => [`R$ ${value.toFixed(2)}`, 'Volume']} />
                  </PieChart>
                </ResponsiveContainer>
                {/* Center metric */}
                <div className="absolute flex flex-col items-center">
                  <span className={`text-[9px] uppercase font-bold tracking-wider ${isDark ? 'text-gray-500' : 'text-slate-500'}`}>Total</span>
                  <span className={`text-xs font-mono font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    R$ {(stats?.totalSales || 0).toLocaleString('pt-BR', { maximumFractionDigits: 0 })}
                  </span>
                </div>
              </div>

              {/* Legend with percentages */}
              <div className="w-full grid grid-cols-2 gap-2 mt-4 text-[10px] text-left">
                {chartPaymentData.slice(0, 4).map((item, idx) => {
                  const percentage = stats.totalSales > 0 ? (item.value / stats.totalSales) * 100 : 0;
                  return (
                    <div key={item.name} className="flex items-center gap-1.5 truncate">
                      <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                      <div className="min-w-0">
                        <span className={`font-bold block truncate ${isDark ? 'text-gray-300' : 'text-slate-800'}`}>
                          {item.name}
                        </span>
                        <span className={`text-[9px] font-mono font-bold ${isDark ? 'text-gray-500' : 'text-slate-600'}`}>
                          {percentage.toFixed(1)}% (R$ {item.value.toFixed(0)})
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 5. Secondary Recharts Area: Peak Times + Top Sellers */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Chart Card 3: Peak Service Hours (Recharts BarChart) */}
        <div className={`p-5 rounded-xl border lg:col-span-8 flex flex-col justify-between ${
          isDark ? 'bg-[#121212]/30 border-[#1C1C1C]' : 'bg-white border-slate-200 shadow-xs text-slate-900'
        }`}>
          <div className="flex justify-between items-start border-b pb-3 mb-4" style={{ borderColor: isDark ? '#1C1C1C' : '#E2E8F0' }}>
            <div className="text-left">
              <h3 className={`text-xs font-black tracking-wider uppercase ${isDark ? 'text-gray-300' : 'text-slate-800'}`}>
                Picos de Atendimento (Por Horário)
              </h3>
              <p className={`text-[10px] mt-1 ${isDark ? 'text-gray-500' : 'text-slate-500 font-medium'}`}>Frequência de pedidos abertos agrupados por hora de operação</p>
            </div>
            <span className={`text-[9px] font-black px-2.5 py-1 rounded ${isDark ? 'bg-indigo-500/10 text-indigo-400' : 'bg-indigo-50 text-indigo-800 border border-indigo-200/60'}`}>Mapeamento de Demanda</span>
          </div>

          {filteredSales.length === 0 ? (
            <div className={`h-60 flex items-center justify-center text-xs ${isDark ? 'text-gray-500' : 'text-slate-500'}`}>
              Sem dados de atendimento registrados neste período.
            </div>
          ) : (
            <div className="w-full h-60">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={chartPeakHoursData}
                  margin={{ top: 10, right: 10, left: -25, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="colorPeaks" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={isDark ? '#6366F1' : '#4F46E5'} stopOpacity={0.25}/>
                      <stop offset="95%" stopColor={isDark ? '#6366F1' : '#4F46E5'} stopOpacity={0.0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#222' : '#E2E8F0'} vertical={false} />
                  <XAxis 
                    dataKey="name" 
                    tick={{ fill: isDark ? '#888' : '#334155', fontSize: 9, fontWeight: 'bold' }} 
                    axisLine={false}
                    tickLine={false}
                    interval={1} // Only show alternate hours to prevent horizontal clutter
                  />
                  <YAxis 
                    tick={{ fill: isDark ? '#888' : '#334155', fontSize: 10, fontWeight: 'bold' }}
                    axisLine={false}
                    tickLine={false}
                    allowDecimals={false}
                  />
                  <Tooltip content={renderSimpleTooltip} />
                  <Area 
                    type="monotone" 
                    dataKey="Pedidos" 
                    stroke={isDark ? '#6366F1' : '#4F46E5'} 
                    strokeWidth={2.5}
                    fillOpacity={1} 
                    fill="url(#colorPeaks)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Chart Card 4: Top Products (Ranking list) */}
        <div className={`p-5 rounded-xl border lg:col-span-4 flex flex-col justify-between ${
          isDark ? 'bg-[#121212]/30 border-[#1C1C1C]' : 'bg-white border-slate-200 shadow-xs text-slate-900'
        }`}>
          <div className="border-b pb-3 mb-4 text-left" style={{ borderColor: isDark ? '#1C1C1C' : '#E2E8F0' }}>
            <h3 className={`text-xs font-black tracking-wider uppercase ${isDark ? 'text-gray-300' : 'text-slate-800'}`}>
              Ranking de 5 Produtos Mais Vendidos
            </h3>
            <p className={`text-[10px] mt-1 ${isDark ? 'text-gray-500' : 'text-slate-500 font-medium'}`}>Mais populares por volume do período</p>
          </div>

          {topSellingProducts.length === 0 ? (
            <div className={`flex-1 flex items-center justify-center text-xs py-10 ${isDark ? 'text-gray-500' : 'text-slate-500'}`}>
              Nenhuma venda registrada no período selecionado.
            </div>
          ) : (
            <div className="flex flex-col gap-3.5 flex-1 justify-center">
              {topSellingProducts.map((p, idx) => {
                return (
                  <div key={p.id} className="flex justify-between items-center">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className={`w-5 h-5 rounded-lg text-[10px] font-black flex items-center justify-center font-mono ${
                        idx === 0 ? 'bg-amber-500/20 text-amber-600' : 
                        idx === 1 ? 'bg-slate-300 text-slate-700' : 
                        idx === 2 ? 'bg-amber-100 text-amber-800' :
                        (isDark ? 'bg-black/40 text-gray-500' : 'bg-slate-100 text-slate-600')
                      }`}>
                        {idx + 1}
                      </span>
                      <div className="text-left min-w-0">
                        <p className={`text-xs font-extrabold truncate ${isDark ? 'text-gray-200' : 'text-slate-900'}`}>
                          {p.name}
                        </p>
                        <span className={`text-[8px] uppercase tracking-wider font-bold block ${isDark ? 'text-gray-500' : 'text-slate-500'}`}>Faturamento</span>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <p className={`text-xs font-mono font-black ${isDark ? 'text-gray-200' : 'text-slate-900'}`}>
                        {p.qty} un
                      </p>
                      <p className={`text-[10px] font-mono font-bold ${isDark ? 'text-emerald-500' : 'text-emerald-700'}`}>
                        R$ {(p?.revenue || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <button
            onClick={() => onGoToTab('relatorios')}
            className={`w-full mt-5 py-2.5 rounded-lg text-[10px] font-black tracking-wider uppercase border flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              isDark 
                ? 'bg-black/30 border-[#1C1C1C] text-gray-300 hover:bg-black/50 hover:text-white' 
                : 'bg-slate-50 border-slate-200 text-slate-800 hover:bg-slate-100 shadow-2xs font-bold'
            }`}
          >
            Auditar Relatórios de Movimentação
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
