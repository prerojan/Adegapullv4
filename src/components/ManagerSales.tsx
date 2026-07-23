import React, { useState, useMemo } from 'react';
import { Search, ShoppingBag, Trash2, Calendar, FileText, Printer, CheckCircle, XCircle } from 'lucide-react';
import { Sale, Product } from '../types';
import { triggerThermalPrint } from '../lib/thermalPrinter';

const alert = (window as any).alert;

interface ManagerSalesProps {
  sales: Sale[];
  products: Product[];
  onCancelSale: (saleId: string, reason: string) => void;
  theme: 'dark' | 'light';
}

export default function ManagerSales({
  sales,
  products,
  onCancelSale,
  theme
}: ManagerSalesProps) {
  const isDark = theme === 'dark';
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);

  // Search and date filters
  const filteredSales = useMemo(() => {
    return [...sales]
      .filter(s => {
        const matchesSearch = 
          s.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (s.clientName && s.clientName.toLowerCase().includes(searchTerm.toLowerCase())) ||
          (s.openedBy && s.openedBy.toLowerCase().includes(searchTerm.toLowerCase()));

        const matchesDate = !dateFilter || s.timestamp.startsWith(dateFilter);

        return matchesSearch && matchesDate;
      })
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }, [sales, searchTerm, dateFilter]);

  const handlePrintDuplicate = (sale: Sale) => {
    triggerThermalPrint({
      type: 'sale',
      title: `Segunda Via - Venda #${sale.id.slice(-6)}`,
      data: { sale }
    });
  };

  const handleCancel = (saleId: string) => {
    const confirmAction = (window as any).confirmModal;
    if (typeof confirmAction === 'function') {
      confirmAction(
        'Tem certeza que deseja ESTORNAR e CANCELAR esta venda definitivamente? Isso irá reincorporar os produtos ao estoque.',
        () => {
          onCancelSale(saleId, 'Estorno manual efetuado pelo Gerente');
          if (selectedSale?.id === saleId) {
            setSelectedSale(null);
          }
          alert('Venda cancelada e estoque estornado com sucesso.', 'success');
        }
      );
    } else {
      if (window.confirm('Confirmar cancelamento da venda?')) {
        onCancelSale(saleId, 'Estorno manual efetuado pelo Gerente');
        if (selectedSale?.id === saleId) {
          setSelectedSale(null);
        }
        alert('Venda cancelada e estoque estornado.');
      }
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 w-full font-sans">
      {/* Sales List Panel */}
      <div className={`p-4 rounded-xl border lg:col-span-2 flex flex-col gap-4 ${
        isDark ? 'bg-[#121212]/30 border-[#1C1C1C]' : 'bg-white border-gray-100'
      }`}>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <h3 className={`text-xs font-bold tracking-wide uppercase ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
            Histórico Geral de Vendas
          </h3>

          <div className="flex gap-2 w-full sm:w-auto">
            <div className="relative flex-1 sm:flex-none">
              <span className="absolute inset-y-0 left-0 flex items-center pl-2.5">
                <Search className="w-3.5 h-3.5 text-gray-500" />
              </span>
              <input
                type="text"
                placeholder="Buscar por ID, operador ou cliente..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className={`pl-8 pr-3 py-1.5 text-xs rounded-lg border outline-none font-sans w-full sm:w-48 transition-all ${
                  isDark ? 'bg-black/40 border-[#1C1C1C] text-gray-200 focus:border-emerald-500/50' : 'bg-white border-gray-200 text-gray-800'
                }`}
              />
            </div>

            <div className="relative">
              <input
                type="date"
                value={dateFilter}
                onChange={e => setDateFilter(e.target.value)}
                className={`px-2.5 py-1.5 text-xs rounded-lg border outline-none font-sans transition-all ${
                  isDark ? 'bg-black/40 border-[#1C1C1C] text-gray-200' : 'bg-white border-gray-200'
                }`}
              />
            </div>
          </div>
        </div>

        {/* Table/List */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className={`border-b text-[10px] font-bold tracking-wider uppercase ${
                isDark ? 'border-[#1C1C1C] text-gray-500' : 'border-gray-100 text-gray-400'
              }`}>
                <th className="pb-2">Venda ID</th>
                <th className="pb-2">Data e Hora</th>
                <th className="pb-2">Operador / Cliente</th>
                <th className="pb-2">Método</th>
                <th className="pb-2 text-right">Total</th>
                <th className="pb-2 text-center">Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredSales.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-xs text-gray-500 font-sans">
                    Nenhuma venda encontrada para as especificações atuais.
                  </td>
                </tr>
              ) : (
                filteredSales.map(sale => {
                  const dateObj = new Date(sale.timestamp);
                  const formattedDate = `${dateObj.toLocaleDateString('pt-BR')} ${dateObj.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`;
                  const isCancel = sale.status === 'cancelado';

                  return (
                    <tr 
                      key={sale.id}
                      onClick={() => setSelectedSale(sale)}
                      className={`border-b last:border-0 cursor-pointer transition-all ${
                        selectedSale?.id === sale.id 
                          ? (isDark ? 'bg-emerald-500/5' : 'bg-emerald-50/30')
                          : (isDark ? 'hover:bg-black/15 border-[#1A1A1A]' : 'hover:bg-gray-50 border-gray-100')
                      }`}
                    >
                      <td className="py-3 font-mono text-[11px] font-bold text-gray-400">
                        #{sale.id.slice(-6).toUpperCase()}
                      </td>
                      <td className={`py-3 text-xs ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                        {formattedDate}
                      </td>
                      <td className="py-3">
                        <p className={`text-xs font-semibold ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>
                          {sale.openedBy || 'Operador'}
                        </p>
                        <p className="text-[10px] text-gray-500">
                          Cli: {sale.clientName || 'Consumidor Final'}
                        </p>
                      </td>
                      <td className="py-3 font-sans text-[11px] font-bold uppercase text-gray-500">
                        {sale.paymentMethod}
                      </td>
                      <td className={`py-3 text-xs font-mono font-bold text-right ${
                        isCancel ? 'text-gray-500 line-through' : (isDark ? 'text-emerald-400' : 'text-emerald-600')
                      }`}>
                        R$ {sale.total.toFixed(2)}
                      </td>
                      <td className="py-3 text-center">
                        <span className={`inline-flex px-1.5 py-0.5 rounded text-[9px] font-bold tracking-tight uppercase ${
                          isCancel 
                            ? 'bg-red-500/10 text-red-400' 
                            : 'bg-emerald-500/10 text-emerald-400'
                        }`}>
                          {sale.status}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Sale Detail Inspector Drawer Side */}
      <div className={`p-4 rounded-xl border flex flex-col justify-between ${
        isDark ? 'bg-[#121212]/30 border-[#1C1C1C]' : 'bg-white border-gray-100'
      }`}>
        {selectedSale ? (
          <div className="flex flex-col gap-5">
            <div>
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h4 className={`text-xs font-bold tracking-wider uppercase ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                    Detalhes da Venda
                  </h4>
                  <p className="font-mono text-sm font-bold text-gray-300 mt-1">
                    #{selectedSale.id.toUpperCase()}
                  </p>
                </div>
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                  selectedSale.status === 'cancelado' ? 'bg-red-500/15 text-red-400' : 'bg-emerald-500/15 text-emerald-400'
                }`}>
                  {selectedSale.status}
                </span>
              </div>

              {/* Items Table */}
              <div className="flex flex-col gap-2 mt-4 max-h-60 overflow-y-auto pr-1">
                {selectedSale.items.map((item, idx) => {
                  const prod = products.find(p => p.id === item.productId);
                  return (
                    <div 
                      key={idx}
                      className={`p-2.5 rounded-lg border flex justify-between items-center ${
                        isDark ? 'bg-black/20 border-[#1C1C1C]' : 'bg-gray-50 border-gray-200'
                      }`}
                    >
                      <div className="min-w-0 flex-1 pr-2">
                        <p className={`text-xs font-semibold truncate ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>
                          {prod ? prod.name : 'Produto Desconhecido'}
                        </p>
                        <p className="text-[10px] text-gray-500 font-mono">
                          {item.quantity} un x R$ {item.unitPrice.toFixed(2)}
                        </p>
                      </div>
                      <span className={`text-xs font-mono font-bold ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                        R$ {(item.quantity * item.unitPrice).toFixed(2)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Total recap */}
            <div className="border-t pt-3 flex flex-col gap-1.5" style={{ borderColor: isDark ? '#1C1C1C' : '#F0F0F0' }}>
              {selectedSale.discount !== undefined && selectedSale.discount > 0 && (
                <div className="flex justify-between text-xs text-amber-500">
                  <span>Desconto Aplicado</span>
                  <span className="font-mono">- R$ {selectedSale.discount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between text-xs font-bold">
                <span className={isDark ? 'text-gray-300' : 'text-gray-600'}>Valor Líquido</span>
                <span className={`font-mono ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}>
                  R$ {selectedSale.total.toFixed(2)}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 mt-4">
                <button
                  onClick={() => handlePrintDuplicate(selectedSale)}
                  className={`py-2 rounded-lg text-[10px] font-bold uppercase tracking-wider border flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    isDark ? 'bg-black/30 border-[#1C1C1C] text-gray-300 hover:bg-black/50 hover:text-white' : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <Printer className="w-3.5 h-3.5" />
                  Imprimir Via
                </button>

                {selectedSale.status !== 'cancelado' && (
                  <button
                    onClick={() => handleCancel(selectedSale.id)}
                    className="py-2 rounded-lg text-[10px] font-bold uppercase tracking-wider bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500 hover:text-black transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Estornar
                  </button>
                )}
              </div>
            </div>
          </div>
        ) : (
            <div className="text-center py-24 flex flex-col items-center justify-center gap-3">
              <ShoppingBag className="w-8 h-8 text-gray-500" />
              <p className="text-xs text-gray-500 font-sans font-medium">Selecione uma venda para visualizar os detalhes completos.</p>
            </div>
          )}
        </div>
    </div>
  );
}
