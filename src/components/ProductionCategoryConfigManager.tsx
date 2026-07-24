import React, { useState, useEffect, useMemo } from 'react';
import {
  ChefHat,
  GlassWater,
  Plus,
  Search,
  Check,
  X,
  Trash2,
  Save,
  RotateCcw,
  Sparkles,
  ToggleLeft,
  ToggleRight,
  Printer,
  Layers,
  ArrowRightLeft,
  AlertCircle,
  HelpCircle,
  Zap,
  Tag
} from 'lucide-react';
import {
  ProductionCategoryRule,
  getProductionCategoryRules,
  saveProductionCategoryRules,
  DEFAULT_PRODUCTION_CATEGORY_RULES,
  syncCategoriesFromProducts
} from '../lib/productionCategories';
import { Product } from '../types';

interface ProductionCategoryConfigManagerProps {
  theme: 'dark' | 'light';
  products?: Product[];
  onClose?: () => void;
}

export default function ProductionCategoryConfigManager({ theme, products, onClose }: ProductionCategoryConfigManagerProps) {
  // Extract all categories from products list to auto-sync
  const productCategoryNames = useMemo(() => {
    if (!products) return [];
    const set = new Set<string>();
    products.forEach(p => {
      if (p.category && p.category.trim()) {
        set.add(p.category.trim());
      }
    });
    return Array.from(set);
  }, [products]);

  // Load rules and auto-sync with existing products
  const [rules, setRules] = useState<ProductionCategoryRule[]>(() => {
    return syncCategoriesFromProducts(productCategoryNames);
  });

  // Re-sync when product categories change
  useEffect(() => {
    if (productCategoryNames.length > 0) {
      const synced = syncCategoriesFromProducts(productCategoryNames);
      setRules(synced);
    }
  }, [productCategoryNames]);

  // Listen to external changes
  useEffect(() => {
    const handleUpdate = (e: Event) => {
      const custom = e as CustomEvent<ProductionCategoryRule[]>;
      if (custom.detail) {
        setRules(custom.detail);
      }
    };
    window.addEventListener('adegaos_production_categories_updated', handleUpdate);
    return () => window.removeEventListener('adegaos_production_categories_updated', handleUpdate);
  }, []);

  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'todos' | 'vao' | 'nao_vao'>('todos');
  const [savedSuccessAlert, setSavedSuccessAlert] = useState(false);

  // New Category Modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [newCatSendToProd, setNewCatSendToProd] = useState(true);
  const [newCatSector, setNewCatSector] = useState<'cozinha' | 'bar' | 'expedicao' | 'geral'>('bar');
  const [newCatAutoPrint, setNewCatAutoPrint] = useState(true);
  const [newCatNotes, setNewCatNotes] = useState('');

  // Save rules
  const handleSave = (newRulesList: ProductionCategoryRule[]) => {
    setRules(newRulesList);
    saveProductionCategoryRules(newRulesList);
    setSavedSuccessAlert(true);
    setTimeout(() => setSavedSuccessAlert(false), 3000);
  };

  // Save rules and exit
  const handleSaveAndExit = () => {
    saveProductionCategoryRules(rules);
    setSavedSuccessAlert(true);
    if (onClose) {
      setTimeout(() => {
        onClose();
      }, 300);
    } else {
      setTimeout(() => setSavedSuccessAlert(false), 3000);
    }
  };

  // Toggle sendToProduction for single category
  const handleToggleSendToProd = (id: string) => {
    const updated = rules.map(r => r.id === id ? { ...r, sendToProduction: !r.sendToProduction, autoPrintTicket: !r.sendToProduction ? r.autoPrintTicket : false } : r);
    handleSave(updated);
  };

  // Toggle autoPrintTicket
  const handleToggleAutoPrint = (id: string) => {
    const updated = rules.map(r => r.id === id ? { ...r, autoPrintTicket: !r.autoPrintTicket } : r);
    handleSave(updated);
  };

  // Update target sector
  const handleUpdateSector = (id: string, sector: 'cozinha' | 'bar' | 'expedicao' | 'geral') => {
    const updated = rules.map(r => r.id === id ? { ...r, targetSector: sector } : r);
    handleSave(updated);
  };

  // Delete custom category rule
  const handleDeleteRule = (id: string) => {
    if (confirm('Deseja remover esta regra de categoria?')) {
      const updated = rules.filter(r => r.id !== id);
      handleSave(updated);
    }
  };

  // Reset to default system rules
  const handleResetDefaults = () => {
    if (confirm('Deseja restaurar as configurações padrão de fábrica para categorias de produção?')) {
      handleSave(DEFAULT_PRODUCTION_CATEGORY_RULES);
    }
  };

  // Add new rule
  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;

    const newRule: ProductionCategoryRule = {
      id: `cat_custom_${Date.now()}`,
      category: newCatName.trim(),
      sendToProduction: newCatSendToProd,
      targetSector: newCatSector,
      autoPrintTicket: newCatSendToProd ? newCatAutoPrint : false,
      notes: newCatNotes.trim() || undefined
    };

    const updated = [...rules, newRule];
    handleSave(updated);
    setShowAddModal(false);
    setNewCatName('');
    setNewCatNotes('');
  };

  // Filtered Rules List
  const filteredRules = useMemo(() => {
    return rules.filter(r => {
      // Search
      const matchesSearch = r.category.toLowerCase().includes(searchTerm.toLowerCase()) || (r.notes && r.notes.toLowerCase().includes(searchTerm.toLowerCase()));
      if (!matchesSearch) return false;

      // Status Filter
      if (filterType === 'vao' && !r.sendToProduction) return false;
      if (filterType === 'nao_vao' && r.sendToProduction) return false;

      return true;
    });
  }, [rules, searchTerm, filterType]);

  // Counts
  const vaoCount = useMemo(() => rules.filter(r => r.sendToProduction).length, [rules]);
  const naoVaoCount = useMemo(() => rules.filter(r => !r.sendToProduction).length, [rules]);

  return (
    <div className={`p-5 rounded-2xl border flex flex-col gap-5 ${
      theme === 'dark' ? 'bg-[#080808] border-[#161616] text-white' : 'bg-white border-gray-200 text-gray-900 shadow-sm'
    }`}>
      
      {/* Top Banner & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4" style={{ borderColor: theme === 'dark' ? '#141414' : '#F3F4F6' }}>
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-[#18F2A4]/10 text-[#18F2A4]">
              <ChefHat className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold tracking-tight">Categorias de Itens Enviados para a Produção</h3>
              <p className="text-xs text-gray-400 font-medium">Defina quais categorias VÃO e quais NÃO VÃO para a tela de comandas e impressoras de produção (Cozinha/Bar).</p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleResetDefaults}
            className={`px-3 py-2 rounded-xl text-xs font-bold border flex items-center gap-1.5 cursor-pointer transition-all ${
              theme === 'dark' ? 'bg-[#111] border-gray-800 text-gray-400 hover:text-white' : 'bg-gray-100 border-gray-200 text-gray-700 hover:bg-gray-200'
            }`}
            title="Restaurar padrões de fábrica"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Restaurar Padrão</span>
          </button>

          <button
            type="button"
            onClick={() => setShowAddModal(true)}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold border flex items-center gap-1.5 cursor-pointer transition-all shadow-sm ${
              theme === 'dark' ? 'bg-[#18F2A4]/10 border-[#18F2A4]/30 text-[#18F2A4] hover:bg-[#18F2A4]/20' : 'bg-emerald-50 border-emerald-300 text-emerald-800 hover:bg-emerald-100'
            }`}
          >
            <Plus className="w-4 h-4" />
            <span>Adicionar Categoria</span>
          </button>

          <button
            type="button"
            onClick={handleSaveAndExit}
            className={`px-4 py-2 rounded-xl text-xs font-black flex items-center gap-2 cursor-pointer transition-all shadow-md active:scale-95 ${
              theme === 'dark' ? 'bg-[#18F2A4] text-black hover:bg-[#12d58f]' : 'bg-emerald-600 text-white hover:bg-emerald-700'
            }`}
            title="Salvar alterações e fechar a tela de configuração"
          >
            <Save className="w-4 h-4" />
            <span>Salvar e Sair</span>
          </button>
        </div>
      </div>

      {/* Success Notification Alert */}
      {savedSuccessAlert && (
        <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold flex items-center gap-2 animate-fade-in">
          <Check className="w-4 h-4 text-emerald-400" />
          <span>Configuração de categorias de produção gravada com sucesso!</span>
        </div>
      )}

      {/* Overview Stat Badges */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className={`p-3.5 rounded-xl border flex items-center justify-between ${
          theme === 'dark' ? 'bg-[#111] border-[#1C1C1C]' : 'bg-gray-50 border-gray-200'
        }`}>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
              <Check className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-gray-400 block">Vão para Produção</span>
              <span className="text-base font-black text-emerald-400">{vaoCount} categorias</span>
            </div>
          </div>
        </div>

        <div className={`p-3.5 rounded-xl border flex items-center justify-between ${
          theme === 'dark' ? 'bg-[#111] border-[#1C1C1C]' : 'bg-gray-50 border-gray-200'
        }`}>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-red-500/10 text-red-400">
              <X className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-gray-400 block">NÃO Vão para Produção</span>
              <span className="text-base font-black text-red-400">{naoVaoCount} categorias</span>
            </div>
          </div>
        </div>

        <div className={`p-3.5 rounded-xl border flex items-center justify-between ${
          theme === 'dark' ? 'bg-[#111] border-[#1C1C1C]' : 'bg-gray-50 border-gray-200'
        }`}>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-sky-500/10 text-sky-400">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-gray-400 block">Total Mapeadas</span>
              <span className="text-base font-black text-sky-400">{rules.length} categorias</span>
            </div>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        {/* Category Type Filter Tabs */}
        <div className={`p-1 rounded-xl border flex items-center gap-1 ${
          theme === 'dark' ? 'bg-[#111] border-[#222]' : 'bg-gray-100 border-gray-200'
        }`}>
          <button
            type="button"
            onClick={() => setFilterType('todos')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              filterType === 'todos'
                ? (theme === 'dark' ? 'bg-[#18F2A4] text-black shadow-xs' : 'bg-white text-gray-900 shadow-xs')
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Todas ({rules.length})
          </button>
          <button
            type="button"
            onClick={() => setFilterType('vao')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              filterType === 'vao'
                ? 'bg-emerald-500 text-white shadow-xs'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Vão para Produção ({vaoCount})
          </button>
          <button
            type="button"
            onClick={() => setFilterType('nao_vao')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              filterType === 'nao_vao'
                ? 'bg-red-500 text-white shadow-xs'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            NÃO Vão ({naoVaoCount})
          </button>
        </div>

        {/* Search input */}
        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar categoria..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={`w-full pl-8 pr-3 py-1.5 text-xs rounded-xl border outline-none font-medium ${
              theme === 'dark' ? 'bg-[#111] border-[#222] text-white focus:border-[#18F2A4]' : 'bg-white border-gray-200 text-gray-900 focus:border-emerald-500'
            }`}
          />
        </div>
      </div>

      {/* Rules Table / Cards */}
      <div className="flex flex-col gap-2.5 max-h-[500px] overflow-y-auto pr-1">
        {filteredRules.length === 0 ? (
          <div className="p-8 text-center text-xs text-gray-500 italic">
            Nenhuma categoria encontrada para o filtro selecionado.
          </div>
        ) : (
          filteredRules.map((rule) => {
            return (
              <div
                key={rule.id}
                className={`p-3.5 rounded-xl border flex flex-col md:flex-row md:items-center justify-between gap-3 transition-all ${
                  rule.sendToProduction
                    ? (theme === 'dark' ? 'bg-[#0B1510] border-emerald-900/40 hover:border-emerald-600/60' : 'bg-emerald-50/40 border-emerald-200 hover:border-emerald-300')
                    : (theme === 'dark' ? 'bg-[#120B0B] border-red-900/30 hover:border-red-600/40' : 'bg-red-50/40 border-red-200 hover:border-red-300')
                }`}
              >
                {/* Left: Category Name & Badge */}
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => handleToggleSendToProd(rule.id)}
                    className="cursor-pointer"
                    title={rule.sendToProduction ? 'Clique para NÃO enviar para a produção' : 'Clique para ENVIAR para a produção'}
                  >
                    {rule.sendToProduction ? (
                      <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                        <Check className="w-4 h-4" />
                      </div>
                    ) : (
                      <div className="p-2 rounded-xl bg-red-500/20 text-red-400 border border-red-500/30">
                        <X className="w-4 h-4" />
                      </div>
                    )}
                  </button>

                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-black text-sm">{rule.category}</span>
                      <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full border ${
                        rule.sendToProduction
                          ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                          : 'bg-red-500/20 text-red-400 border-red-500/30'
                      }`}>
                        {rule.sendToProduction ? 'VAI PARA PRODUÇÃO' : 'NÃO VAI PARA PRODUÇÃO'}
                      </span>
                    </div>
                    {rule.notes && (
                      <p className="text-[11px] text-gray-400 mt-0.5">{rule.notes}</p>
                    )}
                  </div>
                </div>

                {/* Right: Sector Selector & Auto-Print Toggle */}
                <div className="flex flex-wrap items-center gap-3">
                  {/* Sector selector */}
                  {rule.sendToProduction && (
                    <div className="flex items-center gap-1.5 text-xs">
                      <span className="text-[10px] font-bold text-gray-400 uppercase">Setor Destino:</span>
                      <select
                        value={rule.targetSector}
                        onChange={(e) => handleUpdateSector(rule.id, e.target.value as any)}
                        className={`p-1.5 rounded-lg border text-xs font-bold outline-none ${
                          theme === 'dark' ? 'bg-[#141414] border-[#252525] text-white' : 'bg-white border-gray-200 text-gray-900'
                        }`}
                      >
                        <option value="bar">🍺 Adega & Bar</option>
                        <option value="cozinha">🍳 Cozinha & Preparo</option>
                        <option value="expedicao">📦 Expedição / Delivery</option>
                        <option value="geral">🔔 Produção Geral</option>
                      </select>
                    </div>
                  )}

                  {/* Auto Ticket Print Toggle */}
                  {rule.sendToProduction && (
                    <button
                      type="button"
                      onClick={() => handleToggleAutoPrint(rule.id)}
                      className={`px-2.5 py-1.5 rounded-lg border text-[11px] font-bold flex items-center gap-1.5 cursor-pointer transition-all ${
                        rule.autoPrintTicket
                          ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                          : 'bg-gray-800/40 border-gray-700 text-gray-400'
                      }`}
                      title="Imprimir cupom de ficha de produção automaticamente"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      <span>{rule.autoPrintTicket ? 'Auto Impressão' : 'Sem Impressão'}</span>
                    </button>
                  )}

                  {/* Toggle Switch */}
                  <button
                    type="button"
                    onClick={() => handleToggleSendToProd(rule.id)}
                    className={`px-3 py-1.5 rounded-lg font-extrabold text-xs flex items-center gap-1 cursor-pointer transition-all ${
                      rule.sendToProduction
                        ? 'bg-emerald-500 text-white hover:bg-emerald-600'
                        : 'bg-red-500/20 text-red-400 hover:bg-red-500/30 border border-red-500/40'
                    }`}
                  >
                    <span>{rule.sendToProduction ? 'Ativo na Tela' : 'Bloqueado'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDeleteRule(rule.id)}
                    className="p-1.5 text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                    title="Remover Categoria"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Footer Action Bar */}
      <div className={`pt-4 border-t flex flex-col sm:flex-row items-center justify-between gap-3 ${
        theme === 'dark' ? 'border-[#1B1B1B]' : 'border-gray-100'
      }`}>
        <span className="text-xs text-gray-400 font-medium">
          Configuração de envio de itens para produção e comandas da adega / cozinha.
        </span>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className={`flex-1 sm:flex-none px-4 py-2.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                theme === 'dark' ? 'bg-[#111] border-gray-800 text-gray-400 hover:text-white' : 'bg-gray-100 border-gray-200 text-gray-700'
              }`}
            >
              Cancelar
            </button>
          )}
          <button
            type="button"
            onClick={handleSaveAndExit}
            className={`flex-1 sm:flex-none px-6 py-2.5 rounded-xl text-xs font-black flex items-center justify-center gap-2 cursor-pointer transition-all shadow-md active:scale-95 ${
              theme === 'dark' ? 'bg-[#18F2A4] text-black hover:bg-[#12d58f]' : 'bg-emerald-600 text-white hover:bg-emerald-700'
            }`}
          >
            <Save className="w-4 h-4" />
            <span>Salvar e Sair</span>
          </button>
        </div>
      </div>

      {/* MODAL: ADD NEW CATEGORY RULE */}
      {showAddModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
          <div className={`w-full max-w-md rounded-2xl border shadow-2xl p-5 flex flex-col gap-4 ${
            theme === 'dark' ? 'bg-[#0A0A0A] border-gray-800 text-white' : 'bg-white border-gray-200 text-gray-900'
          }`}>
            <div className="flex items-center justify-between border-b pb-3" style={{ borderColor: theme === 'dark' ? '#1A1A1A' : '#E5E7EB' }}>
              <div className="flex items-center gap-2">
                <Tag className="w-5 h-5 text-[#18F2A4]" />
                <h3 className="text-sm font-black tracking-tight">Adicionar Categoria de Produção</h3>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1 rounded-lg text-gray-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="flex flex-col gap-3.5 text-xs">
              <div className="flex flex-col gap-1">
                <label className="text-gray-400 font-bold uppercase text-[9px]">Nome da Categoria</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Porções Especiais / Vinhos Nobres / Tabacaria"
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                  className={`p-2.5 rounded-xl border outline-none font-bold ${
                    theme === 'dark' ? 'bg-[#111] border-gray-800 text-white' : 'bg-gray-50 border-gray-200 text-gray-900'
                  }`}
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-gray-400 font-bold uppercase text-[9px]">Comportamento na Produção</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setNewCatSendToProd(true)}
                    className={`p-2.5 rounded-xl border font-bold flex items-center justify-center gap-1.5 cursor-pointer ${
                      newCatSendToProd
                        ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400'
                        : theme === 'dark' ? 'bg-[#111] border-gray-800 text-gray-500' : 'bg-gray-50 border-gray-200 text-gray-500'
                    }`}
                  >
                    <Check className="w-4 h-4" />
                    <span>VAI para Produção</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setNewCatSendToProd(false)}
                    className={`p-2.5 rounded-xl border font-bold flex items-center justify-center gap-1.5 cursor-pointer ${
                      !newCatSendToProd
                        ? 'bg-red-500/20 border-red-500 text-red-400'
                        : theme === 'dark' ? 'bg-[#111] border-gray-800 text-gray-500' : 'bg-gray-50 border-gray-200 text-gray-500'
                    }`}
                  >
                    <X className="w-4 h-4" />
                    <span>NÃO VAI</span>
                  </button>
                </div>
              </div>

              {newCatSendToProd && (
                <div className="flex flex-col gap-1">
                  <label className="text-gray-400 font-bold uppercase text-[9px]">Setor Operacional Destino</label>
                  <select
                    value={newCatSector}
                    onChange={(e) => setNewCatSector(e.target.value as any)}
                    className={`p-2.5 rounded-xl border outline-none font-bold ${
                      theme === 'dark' ? 'bg-[#111] border-gray-800 text-white' : 'bg-gray-50 border-gray-200 text-gray-900'
                    }`}
                  >
                    <option value="bar">🍺 Adega & Bar</option>
                    <option value="cozinha">🍳 Cozinha & Preparo</option>
                    <option value="expedicao">📦 Expedição / Delivery</option>
                    <option value="geral">🔔 Produção Geral</option>
                  </select>
                </div>
              )}

              <div className="flex flex-col gap-1">
                <label className="text-gray-400 font-bold uppercase text-[9px]">Observações / Instruções (Opcional)</label>
                <input
                  type="text"
                  placeholder="Ex: Imprimir via extra na cozinha"
                  value={newCatNotes}
                  onChange={(e) => setNewCatNotes(e.target.value)}
                  className={`p-2.5 rounded-xl border outline-none ${
                    theme === 'dark' ? 'bg-[#111] border-gray-800 text-white' : 'bg-gray-50 border-gray-200 text-gray-900'
                  }`}
                />
              </div>

              <button
                type="submit"
                className={`w-full py-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 cursor-pointer transition-all mt-2 ${
                  theme === 'dark' ? 'bg-[#18F2A4] text-black hover:bg-[#12d58f]' : 'bg-[#10B981] text-white hover:bg-[#0e9f6e]'
                }`}
              >
                <Save className="w-4 h-4" />
                <span>Salvar Categoria</span>
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
