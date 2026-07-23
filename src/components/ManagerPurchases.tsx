import React, { useState, useMemo } from 'react';
import { Plus, Search, FileText, CheckCircle, Trash2, ShieldCheck, RefreshCw } from 'lucide-react';
import { Supplier, Product, FinancialTransaction } from '../types';

const alert = (window as any).alert;

interface PurchaseItem {
  product: Product;
  costPrice: number;
  qtyBoxes: number;
}

interface ManagerPurchasesProps {
  suppliers: Supplier[];
  products: Product[];
  onAddPurchaseReceipt: (receipt: { date: string; invoiceNumber: string; total: number }) => void;
  onUpdateProductCost: (productId: string, costPrice: number) => void;
  onIncreaseStockBoxes: (productId: string, qtyBoxes: number) => void;
  onAddFinancial: (tx: FinancialTransaction) => void;
  theme: 'dark' | 'light';
}

export default function ManagerPurchases({
  suppliers,
  products,
  onAddPurchaseReceipt,
  onUpdateProductCost,
  onIncreaseStockBoxes,
  onAddFinancial,
  theme
}: ManagerPurchasesProps) {
  const isDark = theme === 'dark';

  // State for Purchase Entry Wizard
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [selectedSupplierId, setSelectedSupplierId] = useState(suppliers[0]?.id || '');
  const [purchaseItems, setPurchaseItems] = useState<PurchaseItem[]>([]);
  
  // Temp fields for adding product to purchase receipt
  const [tempProductId, setTempProductId] = useState('');
  const [tempCostPrice, setTempCostPrice] = useState<number>(0);
  const [tempQtyBoxes, setTempQtyBoxes] = useState<number>(1);

  const activeProducts = useMemo(() => products.filter(p => p.active), [products]);

  const handleProductSelect = (id: string) => {
    setTempProductId(id);
    const prod = products.find(p => p.id === id);
    if (prod) {
      setTempCostPrice(prod.costPrice);
    }
  };

  const handleAddItem = () => {
    if (!tempProductId) {
      alert('Selecione um produto antes de adicionar.', 'warning');
      return;
    }
    const prod = products.find(p => p.id === tempProductId);
    if (!prod) return;

    if (tempQtyBoxes <= 0) {
      alert('A quantidade de caixas deve ser maior que zero.', 'warning');
      return;
    }

    setPurchaseItems(prev => {
      const idx = prev.findIndex(item => item.product.id === tempProductId);
      if (idx >= 0) {
        const updated = [...prev];
        updated[idx] = { 
          ...updated[idx], 
          qtyBoxes: updated[idx].qtyBoxes + tempQtyBoxes,
          costPrice: tempCostPrice
        };
        return updated;
      }
      return [...prev, { product: prod, costPrice: tempCostPrice, qtyBoxes: tempQtyBoxes }];
    });

    // Reset Temp Fields
    setTempProductId('');
    setTempCostPrice(0);
    setTempQtyBoxes(1);
  };

  const handleRemoveItem = (index: number) => {
    setPurchaseItems(prev => prev.filter((_, i) => i !== index));
  };

  const purchaseTotal = useMemo(() => {
    return purchaseItems.reduce((acc, item) => acc + (item.costPrice * item.qtyBoxes * item.product.boxQuantity), 0);
  }, [purchaseItems]);

  const handleSaveReceipt = (e: React.FormEvent) => {
    e.preventDefault();
    if (!invoiceNumber.trim()) {
      alert('Por favor, informe o número da Nota Fiscal (NF).', 'warning');
      return;
    }
    if (!selectedSupplierId) {
      alert('Selecione um fornecedor cadastrado.', 'warning');
      return;
    }
    if (purchaseItems.length === 0) {
      alert('Adicione pelo menos um item à Nota Fiscal antes de salvar.', 'warning');
      return;
    }

    const todayStr = new Date().toISOString().split('T')[0];

    // 1. Trigger Parent callback
    onAddPurchaseReceipt({
      date: todayStr,
      invoiceNumber,
      total: purchaseTotal
    });

    // 2. Loop products to update costs and stocks
    purchaseItems.forEach(item => {
      onUpdateProductCost(item.product.id, item.costPrice);
      onIncreaseStockBoxes(item.product.id, item.qtyBoxes);
    });

    // 3. Clear State
    setInvoiceNumber('');
    setPurchaseItems([]);
    alert('Entrada de mercadorias registrada! Estoques atualizados e duplicata lançada no financeiro.', 'success');
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 w-full font-sans">
      {/* Entrada de Notas Fiscais Form */}
      <form 
        onSubmit={handleSaveReceipt}
        className={`p-4 rounded-xl border lg:col-span-2 flex flex-col gap-4 ${
          isDark ? 'bg-[#121212]/30 border-[#1C1C1C]' : 'bg-white border-gray-100'
        }`}
      >
        <div className="flex items-center gap-2 border-b pb-3" style={{ borderColor: isDark ? '#1C1C1C' : '#F0F0F0' }}>
          <FileText className={`w-4 h-4 ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`} />
          <h3 className={`text-xs font-bold tracking-wide uppercase ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
            Registro de Nota Fiscal (Compra de Insumos)
          </h3>
        </div>

        {/* Invoice details */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className={`text-[10px] font-bold uppercase block mb-1 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
              Número da Nota Fiscal (NF-e)
            </label>
            <input
              type="text"
              placeholder="Ex: 000.123.456"
              value={invoiceNumber}
              onChange={e => setInvoiceNumber(e.target.value)}
              className={`w-full px-3 py-1.5 text-xs rounded-lg border outline-none font-sans ${
                isDark ? 'bg-black/40 border-[#1C1C1C] text-gray-200 focus:border-emerald-500/50' : 'bg-white border-gray-200 text-gray-800'
              }`}
            />
          </div>

          <div>
            <label className={`text-[10px] font-bold uppercase block mb-1 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
              Fornecedor Responsável
            </label>
            <select
              value={selectedSupplierId}
              onChange={e => setSelectedSupplierId(e.target.value)}
              className={`w-full px-3 py-1.5 text-xs rounded-lg border outline-none font-sans ${
                isDark ? 'bg-black/40 border-[#1C1C1C] text-gray-200' : 'bg-white border-gray-200'
              }`}
            >
              {suppliers.map(s => (
                <option key={s.id} value={s.id}>{s.companyName}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Add Products Sub-Form */}
        <div className={`p-3 rounded-xl border flex flex-col gap-3 ${
          isDark ? 'bg-black/20 border-[#1A1A1A]' : 'bg-gray-50 border-gray-200'
        }`}>
          <span className={`text-[10px] font-bold uppercase tracking-wider block ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            Adicionar Item à Nota
          </span>
          
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5 items-end">
            <div className="sm:col-span-2">
              <label className="text-[9px] text-gray-500 block mb-1 uppercase font-bold">Produto</label>
              <select
                value={tempProductId}
                onChange={e => handleProductSelect(e.target.value)}
                className={`w-full px-2.5 py-1.5 text-xs rounded-lg border outline-none ${
                  isDark ? 'bg-black/50 border-[#1C1C1C] text-gray-200' : 'bg-white border-gray-200'
                }`}
              >
                <option value="">Selecione um produto...</option>
                {activeProducts.map(p => (
                  <option key={p.id} value={p.id}>{p.name} (Fardo {p.boxQuantity} un)</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-[9px] text-gray-500 block mb-1 uppercase font-bold">Custo Unitário (R$)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={tempCostPrice || ''}
                onChange={e => setTempCostPrice(Math.max(0, parseFloat(e.target.value) || 0))}
                className={`w-full px-2.5 py-1 text-xs rounded-lg border outline-none font-mono ${
                  isDark ? 'bg-black/50 border-[#1C1C1C] text-gray-200' : 'bg-white border-gray-200'
                }`}
              />
            </div>

            <div>
              <label className="text-[9px] text-gray-500 block mb-1 uppercase font-bold">Qtd Caixas / Fardos</label>
              <div className="flex gap-1">
                <input
                  type="number"
                  min="1"
                  value={tempQtyBoxes || ''}
                  onChange={e => setTempQtyBoxes(Math.max(1, parseInt(e.target.value) || 1))}
                  className={`w-full px-2.5 py-1 text-xs rounded-lg border outline-none font-mono ${
                    isDark ? 'bg-black/50 border-[#1C1C1C] text-gray-200' : 'bg-white border-gray-200'
                  }`}
                />
                <button
                  type="button"
                  onClick={handleAddItem}
                  className="px-3 py-1 rounded-lg bg-emerald-500 text-black font-bold text-xs hover:bg-emerald-400 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Invoice Summary and Submit */}
        <div className="flex justify-between items-center mt-3 pt-3 border-t" style={{ borderColor: isDark ? '#1C1C1C' : '#F0F0F0' }}>
          <div>
            <span className={`text-[10px] uppercase font-bold block ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>Total da NF</span>
            <span className={`text-sm font-mono font-bold ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}>
              R$ {purchaseTotal.toFixed(2)}
            </span>
          </div>

          <button
            type="submit"
            className="px-4 py-2 bg-emerald-500 text-black font-bold text-xs uppercase tracking-wide rounded-xl hover:bg-emerald-400 cursor-pointer flex items-center gap-1.5"
          >
            <ShieldCheck className="w-4 h-4" />
            Salvar Nota Fiscal e Lançar Estoques
          </button>
        </div>
      </form>

      {/* Added Items List Side Panel */}
      <div className={`p-4 rounded-xl border flex flex-col justify-between ${
        isDark ? 'bg-[#121212]/30 border-[#1C1C1C]' : 'bg-white border-gray-100'
      }`}>
        <div>
          <h3 className={`text-xs font-bold tracking-wide uppercase mb-3 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
            Itens Adicionados ({purchaseItems.length})
          </h3>

          {purchaseItems.length === 0 ? (
            <div className="text-center py-20 text-xs text-gray-500">
              Nenhum insumo adicionado a esta Nota Fiscal ainda.
            </div>
          ) : (
            <div className="flex flex-col gap-2 max-h-96 overflow-y-auto pr-1">
              {purchaseItems.map((item, idx) => {
                const totalUnits = item.qtyBoxes * item.product.boxQuantity;
                const costSum = item.costPrice * totalUnits;
                return (
                  <div 
                    key={idx}
                    className={`p-2.5 rounded-lg border flex justify-between items-center ${
                      isDark ? 'bg-black/20 border-[#1A1A1A]' : 'bg-gray-50 border-gray-200'
                    }`}
                  >
                    <div className="min-w-0 flex-1 pr-2">
                      <p className={`text-xs font-semibold truncate ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>
                        {item.product.name}
                      </p>
                      <p className="text-[10px] text-gray-500">
                        {item.qtyBoxes} cx ({totalUnits} un) @ R$ {item.costPrice.toFixed(2)}/un
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className={`text-xs font-mono font-bold ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                        R$ {costSum.toFixed(2)}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(idx)}
                        className="p-1 text-red-400 hover:text-red-500 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
