import React, { useState, useEffect, useMemo } from 'react';
import { X, Search, ShoppingCart, Trash2, Plus, Minus, CreditCard, DollarSign, Wallet, FileText, CheckCircle, Percent } from 'lucide-react';
import { Product, Sale, FinancialTransaction, CashierUser, Shift } from '../types';
import { playPremiumSound } from './ToastNotification';
import { triggerThermalPrint } from '../lib/thermalPrinter';

const alert = (window as any).alert;

interface QuickSaleSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  onUpdateStock: (productId: string, boxes: number, units: number) => void;
  onAddSale: (sale: Sale) => void;
  onAddFinancial: (tx: FinancialTransaction) => void;
  currentUser: CashierUser | null;
  theme: 'dark' | 'light';
  scannedBarcodeTrigger: { barcode: string; timestamp: number } | null;
  activeShift: Shift | null;
  onOpenShift?: (openedBy: string, initialBalance: number) => void;
}

interface CartItem {
  product: Product;
  quantity: number;
}

export default function QuickSaleSidebar({
  isOpen,
  onClose,
  products,
  onUpdateStock,
  onAddSale,
  onAddFinancial,
  currentUser,
  theme,
  scannedBarcodeTrigger,
  activeShift
}: QuickSaleSidebarProps) {
  const isDark = theme === 'dark';
  const [searchTerm, setSearchTerm] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<'dinheiro' | 'pix' | 'debito' | 'credito'>('pix');
  const [discountAmount, setDiscountAmount] = useState<number>(0);
  const [cashReceived, setCashReceived] = useState<string>('');

  // Auto-respond to scanned barcode triggers
  useEffect(() => {
    if (scannedBarcodeTrigger?.barcode && isOpen) {
      const prod = products.find(p => p.barcode === scannedBarcodeTrigger.barcode || p.id === scannedBarcodeTrigger.barcode);
      if (prod && prod.active) {
        addToCart(prod);
      }
    }
  }, [scannedBarcodeTrigger]);

  const filteredProducts = useMemo(() => {
    if (!searchTerm.trim()) return [];
    return products.filter(p => 
      p.active && 
      (p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
       p.barcode.includes(searchTerm) || 
       p.sku.toLowerCase().includes(searchTerm.toLowerCase()))
    ).slice(0, 5);
  }, [searchTerm, products]);

  const addToCart = (product: Product) => {
    const totalUnits = (product.stockBoxes * product.boxQuantity) + product.stockUnits;
    if (totalUnits <= 0) {
      alert(`Produto ${product.name} esgotado no estoque!`, 'warning');
      return;
    }

    setCart(prev => {
      const idx = prev.findIndex(item => item.product.id === product.id);
      if (idx >= 0) {
        const currentQty = prev[idx].quantity;
        if (currentQty >= totalUnits) {
          alert(`Estoque insuficiente! Disponível: ${totalUnits} unidades.`, 'warning');
          return prev;
        }
        const updated = [...prev];
        updated[idx] = { ...updated[idx], quantity: currentQty + 1 };
        return updated;
      }
      return [...prev, { product, quantity: 1 }];
    });
    setSearchTerm('');
    playPremiumSound('bell');
  };

  const updateCartQty = (productId: string, delta: number) => {
    setCart(prev => {
      const idx = prev.findIndex(item => item.product.id === productId);
      if (idx < 0) return prev;
      
      const prod = prev[idx].product;
      const totalUnits = (prod.stockBoxes * prod.boxQuantity) + prod.stockUnits;
      const newQty = prev[idx].quantity + delta;

      if (newQty <= 0) {
        return prev.filter(item => item.product.id !== productId);
      }

      if (newQty > totalUnits) {
        alert(`Estoque insuficiente! Disponível: ${totalUnits} unidades.`, 'warning');
        return prev;
      }

      const updated = [...prev];
      updated[idx] = { ...updated[idx], quantity: newQty };
      return updated;
    });
  };

  const removeFromCart = (productId: string) => {
    setCart(prev => prev.filter(item => item.product.id !== productId));
  };

  const cartSubtotal = useMemo(() => {
    return cart.reduce((acc, item) => acc + (item.product.sellPrice * item.quantity), 0);
  }, [cart]);

  const cartTotal = useMemo(() => {
    return Math.max(0, cartSubtotal - discountAmount);
  }, [cartSubtotal, discountAmount]);

  const changeDue = useMemo(() => {
    if (paymentMethod !== 'dinheiro') return 0;
    const received = parseFloat(cashReceived);
    if (isNaN(received) || received < cartTotal) return 0;
    return received - cartTotal;
  }, [cashReceived, cartTotal, paymentMethod]);

  const handleCheckout = () => {
    if (cart.length === 0) {
      alert('Seu carrinho está vazio.', 'warning');
      return;
    }

    if (!activeShift) {
      alert('Por favor, abra um turno no menu financeiro antes de realizar vendas!', 'error');
      return;
    }

    if (paymentMethod === 'dinheiro') {
      const received = parseFloat(cashReceived);
      if (isNaN(received) || received < cartTotal) {
        alert('Valor recebido em dinheiro é insuficiente.', 'warning');
        return;
      }
    }

    // 1. Create Sale Object
    const saleId = `v-${Date.now()}`;
    const newSale: Sale = {
      id: saleId,
      status: 'pago',
      paymentMethod,
      total: cartTotal,
      discount: discountAmount,
      timestamp: new Date().toISOString(),
      clientName: 'Consumidor Final (PDV)',
      openedBy: currentUser?.name || 'Operador',
      items: cart.map(item => ({
        productId: item.product.id,
        quantity: item.quantity,
        unitPrice: item.product.sellPrice,
        status: 'entregue',
        timestamp: new Date().toISOString()
      }))
    };

    // 2. Create Financial Transaction Object
    const newTx: FinancialTransaction = {
      id: `tx-${Date.now()}`,
      type: 'receita',
      status: 'pago',
      category: 'Vendas',
      value: cartTotal,
      description: `Venda Direta PDV #${saleId.slice(-6)}`,
      timestamp: new Date().toISOString(),
      date: new Date().toISOString().split('T')[0],
      paymentMethod
    };

    // 3. Dispatch changes
    onAddSale(newSale);
    onAddFinancial(newTx);

    // 4. Update product stocks (subtract items sold)
    cart.forEach(item => {
      // Direct adjustment in product list
      onUpdateStock(item.product.id, 0, -item.quantity);
    });

    // 5. Trigger printer simulation
    triggerThermalPrint({
      type: 'sale',
      title: `Cupom de Venda #${saleId.slice(-6)}`,
      data: { sale: newSale, transaction: newTx }
    });

    // 6. Reset Form
    setCart([]);
    setDiscountAmount(0);
    setCashReceived('');
    playPremiumSound('success');
    alert('Venda registrada com sucesso! Cupom enviado para impressão.', 'success');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Drawer */}
      <div 
        className={`w-full max-w-md h-full relative z-10 flex flex-col justify-between border-l transition-all duration-300 animate-slide-left ${
          isDark ? 'bg-[#0B0B0B] border-[#1C1C1C]' : 'bg-gray-50 border-gray-200'
        }`}
      >
        {/* Header */}
        <div className={`p-4 border-b flex justify-between items-center ${
          isDark ? 'border-[#1C1C1C]' : 'border-gray-200'
        }`}>
          <div className="flex items-center gap-2.5">
            <ShoppingCart className={`w-5 h-5 ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`} />
            <h2 className={`text-sm font-bold tracking-tight uppercase ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>
              Venda Rápida (PDV)
            </h2>
          </div>
          <button 
            onClick={onClose} 
            className="p-1.5 rounded-lg hover:bg-black/10 text-gray-500 hover:text-gray-300 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Search & Cart List */}
        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
          {/* Active Shift Banner Warning */}
          {!activeShift && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl flex gap-2 items-start text-red-400">
              <span className="text-xs font-medium">Caixa Fechado. É necessário abrir o caixa antes de operar.</span>
            </div>
          )}

          {/* Search Box */}
          <div className="relative">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3">
              <Search className="w-4 h-4 text-gray-500" />
            </span>
            <input
              type="text"
              placeholder="Digite o nome, código ou SKU..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className={`w-full pl-9 pr-3 py-2 text-xs rounded-xl border outline-none font-sans transition-all ${
                isDark 
                  ? 'bg-black/40 border-[#1C1C1C] text-gray-200 focus:border-emerald-500/50 focus:bg-black/60' 
                  : 'bg-white border-gray-200 text-gray-800 focus:border-emerald-500/50 focus:bg-white'
              }`}
            />

            {/* Quick search suggestions */}
            {searchTerm && (
              <div className={`absolute top-full left-0 right-0 z-20 mt-1.5 border rounded-xl overflow-hidden shadow-2xl ${
                isDark ? 'bg-[#121212] border-[#222]' : 'bg-white border-gray-200'
              }`}>
                {filteredProducts.length === 0 ? (
                  <div className="p-3 text-center text-xs text-gray-500 font-sans">
                    Nenhum produto cadastrado ativo encontrado.
                  </div>
                ) : (
                  filteredProducts.map(prod => (
                    <div 
                      key={prod.id}
                      onClick={() => addToCart(prod)}
                      className={`p-2.5 flex justify-between items-center cursor-pointer transition-all border-b last:border-b-0 ${
                        isDark ? 'hover:bg-emerald-500/10 border-[#1C1C1C]' : 'hover:bg-emerald-50 border-gray-100'
                      }`}
                    >
                      <div>
                        <p className={`text-xs font-semibold ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>{prod.name}</p>
                        <p className="text-[10px] text-gray-500 font-mono uppercase">{prod.category} • SKU {prod.sku}</p>
                      </div>
                      <span className={`text-xs font-mono font-bold ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}>
                        R$ {prod.sellPrice.toFixed(2)}
                      </span>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>

          {/* Cart Items Title */}
          <div>
            <h3 className={`text-[10px] font-bold tracking-wider uppercase mb-2 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
              Itens no Carrinho ({cart.length})
            </h3>

            {cart.length === 0 ? (
              <div className={`p-8 text-center rounded-xl border border-dashed flex flex-col items-center justify-center ${
                isDark ? 'bg-black/10 border-[#1C1C1C]' : 'bg-white border-gray-200'
              }`}>
                <ShoppingCart className="w-6 h-6 text-gray-500 mb-2" />
                <p className="text-xs text-gray-500 font-sans font-medium">O carrinho está vazio.</p>
                <p className="text-[10px] text-gray-500/70 font-sans mt-0.5">Use a barra de pesquisa acima ou escaneie os produtos.</p>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {cart.map(item => (
                  <div 
                    key={item.product.id}
                    className={`p-3 rounded-xl border flex justify-between items-center ${
                      isDark ? 'bg-black/30 border-[#1C1C1C]' : 'bg-white border-gray-100'
                    }`}
                  >
                    <div className="flex-1 min-w-0 pr-3">
                      <p className={`text-xs font-semibold truncate ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>
                        {item.product.name}
                      </p>
                      <span className={`text-[10px] font-mono font-bold ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                        R$ {item.product.sellPrice.toFixed(2)} / un
                      </span>
                    </div>

                    <div className="flex items-center gap-3">
                      {/* Qty Controls */}
                      <div className="flex items-center gap-1">
                        <button 
                          onClick={() => updateCartQty(item.product.id, -1)}
                          className={`p-1 rounded bg-black/10 text-gray-500 hover:text-gray-300 cursor-pointer`}
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className={`w-6 text-center font-mono text-xs font-bold ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>
                          {item.quantity}
                        </span>
                        <button 
                          onClick={() => updateCartQty(item.product.id, 1)}
                          className={`p-1 rounded bg-black/10 text-gray-500 hover:text-gray-300 cursor-pointer`}
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>

                      {/* Line total & Delete */}
                      <div className="text-right min-w-[70px]">
                        <p className={`text-xs font-mono font-bold ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>
                          R$ {(item.product.sellPrice * item.quantity).toFixed(2)}
                        </p>
                      </div>

                      <button 
                        onClick={() => removeFromCart(item.product.id)}
                        className="p-1 text-red-400 hover:text-red-500 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer Payment & Checkout */}
        {cart.length > 0 && (
          <div className={`p-4 border-t flex flex-col gap-4 sticky bottom-0 z-20 shrink-0 shadow-lg ${
            isDark ? 'bg-[#0B0B0B] border-[#1C1C1C]' : 'bg-white border-gray-200'
          }`}>
            {/* Discount box */}
            <div className="flex justify-between items-center gap-3">
              <span className={`text-xs font-semibold flex items-center gap-1.5 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                <Percent className="w-3.5 h-3.5 text-amber-500" /> Desconto (R$)
              </span>
              <input 
                type="number" 
                min={0}
                max={cartSubtotal}
                value={discountAmount || ''}
                onChange={e => setDiscountAmount(Math.max(0, parseFloat(e.target.value) || 0))}
                placeholder="0.00"
                className={`w-24 text-right px-2 py-1 text-xs font-mono rounded border outline-none ${
                  isDark ? 'bg-black/60 border-[#1C1C1C] text-gray-200' : 'bg-white border-gray-200 text-gray-800'
                }`}
              />
            </div>

            {/* Payment Method Selector */}
            <div>
              <span className={`text-[10px] font-bold tracking-wider uppercase block mb-2 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                Meio de Pagamento
              </span>
              <div className="grid grid-cols-4 gap-1.5">
                {[
                  { id: 'pix', label: 'PIX', icon: <Wallet className="w-3.5 h-3.5" /> },
                  { id: 'dinheiro', label: 'Dinheiro', icon: <DollarSign className="w-3.5 h-3.5" /> },
                  { id: 'debito', label: 'Débito', icon: <CreditCard className="w-3.5 h-3.5" /> },
                  { id: 'credito', label: 'Crédito', icon: <CreditCard className="w-3.5 h-3.5" /> }
                ].map(method => (
                  <button
                    key={method.id}
                    onClick={() => setPaymentMethod(method.id as any)}
                    className={`p-2 rounded-xl border flex flex-col items-center justify-center gap-1 text-[10px] font-bold tracking-tight transition-all cursor-pointer ${
                      paymentMethod === method.id 
                        ? (isDark ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400' : 'bg-emerald-50 border-emerald-500 text-emerald-700')
                        : (isDark ? 'bg-black/20 border-[#1C1C1C] text-gray-400 hover:bg-black/40' : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100')
                    }`}
                  >
                    {method.icon}
                    {method.label}
                  </button>
                ))}
              </div>
            </div>

            {/* In case of cash received */}
            {paymentMethod === 'dinheiro' && (
              <div className="flex flex-col gap-2 p-2.5 rounded-xl bg-black/10 border border-dashed" style={{ borderColor: isDark ? '#1C1C1C' : '#E5E5E5' }}>
                <div className="flex justify-between items-center">
                  <span className={`text-[10px] font-bold ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>VALOR RECEBIDO:</span>
                  <input
                    type="number"
                    placeholder="0.00"
                    value={cashReceived}
                    onChange={e => setCashReceived(e.target.value)}
                    className={`w-28 text-right px-2 py-1 text-xs font-mono font-bold rounded border outline-none ${
                      isDark ? 'bg-black/60 border-[#1C1C1C] text-emerald-400' : 'bg-white border-gray-200 text-emerald-700'
                    }`}
                  />
                </div>
                {changeDue > 0 && (
                  <div className="flex justify-between items-center pt-1.5 border-t border-dashed border-gray-700/30">
                    <span className="text-[10px] font-bold text-amber-500">TROCO DO CLIENTE:</span>
                    <span className="text-xs font-mono font-bold text-amber-400">R$ {changeDue.toFixed(2)}</span>
                  </div>
                )}
              </div>
            )}

            {/* Totals */}
            <div className="flex flex-col gap-1.5">
              <div className="flex justify-between items-center text-xs">
                <span className={isDark ? 'text-gray-500' : 'text-gray-400'}>Subtotal</span>
                <span className={`font-mono ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>R$ {cartSubtotal.toFixed(2)}</span>
              </div>
              {discountAmount > 0 && (
                <div className="flex justify-between items-center text-xs text-amber-500">
                  <span>Desconto</span>
                  <span className="font-mono">- R$ {discountAmount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between items-center pt-2 border-t" style={{ borderColor: isDark ? '#1C1C1C' : '#F0F0F0' }}>
                <span className={`text-xs font-bold uppercase ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Total Geral</span>
                <span className={`text-sm font-mono font-bold ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}>
                  R$ {cartTotal.toFixed(2)}
                </span>
              </div>
            </div>

            {/* Checkout Button */}
            <button
              onClick={handleCheckout}
              disabled={!activeShift}
              className={`w-full py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer ${
                !activeShift
                  ? 'bg-gray-700 text-gray-500 cursor-not-allowed opacity-50'
                  : 'bg-emerald-500 text-black hover:bg-emerald-400 active:scale-[0.99]'
              }`}
            >
              <CheckCircle className="w-4 h-4" />
              Concluir Venda e Emitir Cupom
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
