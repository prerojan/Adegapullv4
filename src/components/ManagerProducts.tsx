import React, { useState, useMemo } from 'react';
import { Plus, Search, Filter, Edit, Copy, Archive, Check, X, Tag, FileSpreadsheet, Percent, Trash2, ShieldCheck, SlidersHorizontal, Edit2, Image, Sparkles } from 'lucide-react';
import { Product, Supplier, RecipeItem } from '../types';

const REFERENCE_BEVERAGE_IMAGES = [
  { name: 'Cerveja Long Neck Heineken', category: 'Cervejas', keywords: ['heineken', 'cerveja', 'longneck', 'pilsen', 'verde'], url: 'https://images.unsplash.com/photo-1608270586620-248524c67de9?auto=format&fit=crop&w=600&q=80' },
  { name: 'Cerveja Artesanal Lager', category: 'Cervejas', keywords: ['cerveja', 'artesanal', 'lager', 'ipa', 'garrafa'], url: 'https://images.unsplash.com/photo-1535958636474-b021ee887b13?auto=format&fit=crop&w=600&q=80' },
  { name: 'Cerveja Lata Pilsen', category: 'Cervejas', keywords: ['cerveja', 'lata', 'pilsen', 'gelada'], url: 'https://images.unsplash.com/photo-1584225065152-4a1454aa3d4e?auto=format&fit=crop&w=600&q=80' },
  { name: 'Chopp em Caneca Gelada', category: 'Cervejas', keywords: ['chopp', 'caneca', 'cerveja', 'gelada', 'espuma'], url: 'https://images.unsplash.com/photo-1571624436279-b272aff752b5?auto=format&fit=crop&w=600&q=80' },
  { name: 'Whisky Scotch On The Rocks', category: 'Destilados', keywords: ['whisky', 'bourbon', 'scotch', 'gelo', 'destilados'], url: 'https://images.unsplash.com/photo-1527281400683-1aae777175f8?auto=format&fit=crop&w=600&q=80' },
  { name: 'Vodka Premium Garrafa', category: 'Destilados', keywords: ['vodka', 'absolut', 'smirnoff', 'destilados'], url: 'https://images.unsplash.com/photo-1563227812-0ea4c22e6cc8?auto=format&fit=crop&w=600&q=80' },
  { name: 'Gin Tônica com Laranja', category: 'Destilados', keywords: ['gin', 'tonica', 'tanqueray', 'drink', 'destilados'], url: 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?auto=format&fit=crop&w=600&q=80' },
  { name: 'Caipirinha / Cachaça', category: 'Destilados', keywords: ['cachaca', 'caipirinha', 'limao', 'destilados'], url: 'https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?auto=format&fit=crop&w=600&q=80' },
  { name: 'Tequila Shot com Sal', category: 'Destilados', keywords: ['tequila', 'shot', 'sal', 'destilados'], url: 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?auto=format&fit=crop&w=600&q=80' },
  { name: 'Refrigerante Cola Lata', category: 'Sem Álcool', keywords: ['refrigerante', 'coca', 'cola', 'lata', 'refri', 'sem alcool'], url: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?auto=format&fit=crop&w=600&q=80' },
  { name: 'Energético Lata Gelada', category: 'Sem Álcool', keywords: ['energetico', 'redbull', 'monster', 'lata', 'sem alcool'], url: 'https://images.unsplash.com/photo-1622543925917-763c34d1a86e?auto=format&fit=crop&w=600&q=80' },
  { name: 'Água Mineral com Gás', category: 'Sem Álcool', keywords: ['agua', 'mineral', 'gas', 'garrafa', 'sem alcool'], url: 'https://images.unsplash.com/photo-1548839140-29a749e1bc4e?auto=format&fit=crop&w=600&q=80' },
  { name: 'Suco de Laranja Jarra', category: 'Sem Álcool', keywords: ['suco', 'laranja', 'jarra', 'sem alcool'], url: 'https://images.unsplash.com/photo-1613478223719-2ab802602423?auto=format&fit=crop&w=600&q=80' },
  { name: 'Vinho Tinto Garrafa e Taça', category: 'Vinhos', keywords: ['vinho', 'tinto', 'garrafa', 'taca', 'vinhos'], url: 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?auto=format&fit=crop&w=600&q=80' },
  { name: 'Vinho Branco / Espumante', category: 'Vinhos', keywords: ['vinho', 'branco', 'espumante', 'prosecco', 'vinhos'], url: 'https://images.unsplash.com/photo-1558001373-7b93ee48ffa0?auto=format&fit=crop&w=600&q=80' },
  { name: 'Saco / Balde de Gelo', category: 'Outros', keywords: ['gelo', 'saco', 'balde', 'outros'], url: 'https://images.unsplash.com/photo-1516715094483-75da7dee9758?auto=format&fit=crop&w=600&q=80' },
  { name: 'Petiscos / Amendoim & Castanhas', category: 'Petiscos', keywords: ['petisco', 'amendoim', 'castanha', 'snack', 'petiscos'], url: 'https://images.unsplash.com/photo-1599490659213-e2b9527bd087?auto=format&fit=crop&w=600&q=80' }
];

interface ManagerProductsProps {
  products: Product[];
  suppliers: Supplier[];
  onAddProduct: (prod: Product) => void;
  onUpdateProduct: (prod: Product) => void;
  theme: 'dark' | 'light';
  categories: string[];
  onAddCategory: (cat: string) => void;
  onRenameCategory: (oldVal: string, newVal: string) => void;
  onDeleteCategory: (cat: string) => void;
}

export default function ManagerProducts({
  products,
  suppliers,
  onAddProduct,
  onUpdateProduct,
  theme,
  categories,
  onAddCategory,
  onRenameCategory,
  onDeleteCategory
}: ManagerProductsProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('Todos');
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Category Configuration Modal State
  const [showCategoryConfigModal, setShowCategoryConfigModal] = useState(false);
  const [newCatNameInput, setNewCatNameInput] = useState('');
  const [editingCatName, setEditingCatName] = useState<string | null>(null);
  const [editCatNameInput, setEditCatNameInput] = useState('');

  // High-Level Search and Filters States
  const [stockStatusFilter, setStockStatusFilter] = useState<'Todos' | 'Critico' | 'Normal' | 'SemEstoque'>('Todos');
  const [abcClassFilter, setAbcClassFilter] = useState<'Todos' | 'A' | 'B' | 'C'>('Todos');
  const [activeFilter, setActiveFilter] = useState<'Todos' | 'Ativos' | 'Arquivados'>('Ativos');

  // Form State
  const [name, setName] = useState('');
  const [barcode, setBarcode] = useState('');
  const [sku, setSku] = useState('');
  const [category, setCategory] = useState(categories[0] || 'Cervejas');
  const [brand, setBrand] = useState('');
  const [supplierId, setSupplierId] = useState('');
  const [costPrice, setCostPrice] = useState(0);
  const [sellPrice, setSellPrice] = useState(0);
  const [unit, setUnit] = useState<'UN' | 'LT' | 'KG'>('UN');
  const [boxQuantity, setBoxQuantity] = useState(12);
  const [stockBoxes, setStockBoxes] = useState(0);
  const [stockUnits, setStockUnits] = useState(0);
  const [minStockUnits, setMinStockUnits] = useState(12);
  const [maxStockUnits, setMaxStockUnits] = useState(120);
  const [active, setActive] = useState(true);
  const [ageRestricted, setAgeRestricted] = useState(true);
  const [notes, setNotes] = useState('');
  const [image, setImage] = useState('');

  // Reference Image Gallery Modal State
  const [showImageSearchModal, setShowImageSearchModal] = useState(false);
  const [refImageSearchTerm, setRefImageSearchTerm] = useState('');

  const filteredReferenceImages = useMemo(() => {
    if (!refImageSearchTerm.trim()) return REFERENCE_BEVERAGE_IMAGES;
    const term = refImageSearchTerm.toLowerCase().trim();
    return REFERENCE_BEVERAGE_IMAGES.filter(img => 
      img.name.toLowerCase().includes(term) ||
      img.category.toLowerCase().includes(term) ||
      img.keywords.some(k => k.includes(term))
    );
  }, [refImageSearchTerm]);

  // Advanced Inventory States
  const [hasTechnicalSheet, setHasTechnicalSheet] = useState(false);
  const [recipe, setRecipe] = useState<RecipeItem[]>([]);
  const [leadTimeDays, setLeadTimeDays] = useState(3);
  
  // Recipe building temp fields
  const [tempIngredientId, setTempIngredientId] = useState('');
  const [tempQuantity, setTempQuantity] = useState<number>(1);

  // Auto-calculated margin
  const margin = useMemo(() => {
    if (sellPrice <= 0) return 0;
    return parseFloat((((sellPrice - costPrice) / sellPrice) * 100).toFixed(2));
  }, [costPrice, sellPrice]);

  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      // 1. Search term match (Name / SKU / Barcode)
      const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            p.barcode.includes(searchTerm) ||
                            p.sku.toLowerCase().includes(searchTerm.toLowerCase());
      
      // 2. Category match
      const matchesCategory = selectedCategory === 'Todos' || p.category === selectedCategory;

      // 3. Stock Status match
      const totalUnits = (p.stockBoxes * p.boxQuantity) + p.stockUnits;
      let matchesStock = true;
      if (stockStatusFilter === 'Critico') {
        matchesStock = totalUnits <= p.minStockUnits;
      } else if (stockStatusFilter === 'Normal') {
        matchesStock = totalUnits > p.minStockUnits;
      } else if (stockStatusFilter === 'SemEstoque') {
        matchesStock = totalUnits === 0;
      }

      // 4. ABC Curve match
      let matchesAbc = true;
      if (abcClassFilter !== 'Todos') {
        matchesAbc = p.abcClass === abcClassFilter;
      }

      // 5. Active / Inactive match
      let matchesActive = true;
      if (activeFilter === 'Ativos') {
        matchesActive = p.active;
      } else if (activeFilter === 'Arquivados') {
        matchesActive = !p.active;
      }

      return matchesSearch && matchesCategory && matchesStock && matchesAbc && matchesActive;
    });
  }, [products, searchTerm, selectedCategory, stockStatusFilter, abcClassFilter, activeFilter]);

  const openNewModal = () => {
    setEditingProduct(null);
    setName('');
    setBarcode(String(Math.floor(7890000000000 + Math.random() * 9999999999)));
    setSku(`PROD-${Math.floor(100 + Math.random() * 900)}`);
    setCategory('Cervejas');
    setBrand('');
    setSupplierId(suppliers[0]?.id || '');
    setCostPrice(0);
    setSellPrice(0);
    setUnit('UN');
    setBoxQuantity(12);
    setStockBoxes(0);
    setStockUnits(0);
    setMinStockUnits(24);
    setMaxStockUnits(240);
    setActive(true);
    setAgeRestricted(true);
    setNotes('');
    setImage('');
    
    // Reset Advanced
    setHasTechnicalSheet(false);
    setRecipe([]);
    setLeadTimeDays(3);
    setTempIngredientId('');
    setTempQuantity(1);
    setShowModal(true);
  };

  const openEditModal = (prod: Product) => {
    setEditingProduct(prod);
    setName(prod.name);
    setBarcode(prod.barcode);
    setSku(prod.sku);
    setCategory(prod.category);
    setBrand(prod.brand);
    setSupplierId(prod.supplierId);
    setCostPrice(prod.costPrice);
    setSellPrice(prod.sellPrice);
    setUnit(prod.unit);
    setBoxQuantity(prod.boxQuantity);
    setStockBoxes(prod.stockBoxes);
    setStockUnits(prod.stockUnits);
    setMinStockUnits(prod.minStockUnits);
    setMaxStockUnits(prod.maxStockUnits);
    setActive(prod.active);
    setAgeRestricted(prod.ageRestricted);
    setNotes(prod.notes || '');
    setImage(prod.image || '');
    
    // Set Advanced
    setHasTechnicalSheet(prod.hasTechnicalSheet || false);
    setRecipe(prod.recipe || []);
    setLeadTimeDays(prod.leadTimeDays || 3);
    setTempIngredientId('');
    setTempQuantity(1);
    setShowModal(true);
  };

  const handleDuplicate = (prod: Product) => {
    const duplicated: Product = {
      ...prod,
      id: `p-${Date.now()}`,
      name: `${prod.name} (Cópia)`,
      sku: `${prod.sku}-COPY`,
      barcode: String(Math.floor(7890000000000 + Math.random() * 9999999999))
    };
    onAddProduct(duplicated);
    alert('Produto duplicado com sucesso! Lembre-se de ajustar o SKU e o Código de barras.');
  };

  const handleArchive = (prod: Product) => {
    onUpdateProduct({
      ...prod,
      active: !prod.active
    });
    alert(`Produto ${prod.active ? 'arquivar' : 'reativar'} com sucesso.`);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !barcode || !sku) {
      alert('Por favor, preencha nome, código de barras e SKU.');
      return;
    }

    const payload: Product = {
      id: editingProduct ? editingProduct.id : `p-${Date.now()}`,
      name,
      barcode,
      sku,
      category,
      brand,
      supplierId,
      costPrice: Number(costPrice),
      sellPrice: Number(sellPrice),
      margin,
      unit,
      boxQuantity: Number(boxQuantity),
      stockBoxes: Number(stockBoxes),
      stockUnits: Number(stockUnits),
      minStockUnits: Number(minStockUnits),
      maxStockUnits: Number(maxStockUnits),
      active,
      ageRestricted,
      notes,
      image,
      hasTechnicalSheet,
      recipe: hasTechnicalSheet ? recipe : [],
      leadTimeDays: Number(leadTimeDays)
    };

    if (editingProduct) {
      onUpdateProduct(payload);
      alert('Produto atualizado com sucesso!');
    } else {
      onAddProduct(payload);
      alert('Produto cadastrado com sucesso!');
    }

    setShowModal(false);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleGenerateLabel = (prod: Product) => {
    alert(`Etiquta Gerada!\n\nProduto: ${prod.name}\nSKU: ${prod.sku}\nCód: ${prod.barcode}\nPreço: R$ ${prod.sellPrice.toFixed(2)}`);
  };

  return (
    <div className="flex flex-col gap-5 w-full">
      {/* Header controls */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">Cadastro de Produtos</h2>
          <p className="text-xs text-gray-400">Adicione, duplique ou edite itens do portfólio da adega.</p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowCategoryConfigModal(true)}
            className={`px-4 py-2 text-xs font-semibold rounded-lg flex items-center gap-2 cursor-pointer transition-all active:scale-95 border ${
              theme === 'dark' 
                ? 'bg-transparent border-[#1C1C1C] text-gray-300 hover:bg-[#1C1C1C]' 
                : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
            }`}
          >
            <Tag className="w-4 h-4 text-[#18F2A4]" />
            Configurar Categorias
          </button>

          <button
            onClick={openNewModal}
            className={`px-4 py-2 text-xs font-semibold rounded-lg flex items-center gap-2 cursor-pointer transition-all active:scale-95 ${
              theme === 'dark' ? 'bg-[#18F2A4] text-black hover:bg-[#12d58f]' : 'bg-[#10B981] text-white hover:bg-[#0e9f6e]'
            }`}
          >
            <Plus className="w-4 h-4" />
            Novo Produto
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className={`p-4 rounded-xl border flex flex-col md:flex-row justify-between items-center gap-4 ${
        theme === 'dark' ? 'bg-[#111111] border-[#1A1A1A]' : 'bg-white border-gray-200'
      }`}>
        <div className={`relative flex items-center rounded-lg border px-3 py-2 w-full flex-1 ${
          theme === 'dark' ? 'bg-[#080808] border-[#1A1A1A]' : 'bg-white border-gray-200'
        }`}>
          <Search className="w-4 h-4 text-gray-400 mr-2" />
          <input
            type="text"
            placeholder="Buscar por nome, SKU ou código de barras..."
            className="w-full text-xs bg-transparent focus:outline-none"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {searchTerm && (
            <button onClick={() => setSearchTerm('')} className="text-gray-400">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* High-Level Advanced Filters Grid */}
      <div className={`p-4 rounded-xl border grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 ${
        theme === 'dark' ? 'bg-[#111111] border-[#1A1A1A]' : 'bg-white border-gray-200'
      }`}>
        {/* Category filter */}
        <div className="flex flex-col gap-1">
          <label className="text-gray-400 text-[10px] font-bold uppercase">Filtrar por Categoria</label>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="p-2 rounded border text-xs focus:outline-none transition-all cursor-pointer font-semibold"
            style={{
              backgroundColor: theme === 'dark' ? '#080808' : 'white',
              borderColor: theme === 'dark' ? '#1C1C1C' : '#E5E5E5',
              color: theme === 'dark' ? '#DDD' : '#333'
            }}
          >
            <option value="Todos">Todas as Categorias</option>
            {categories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>

        {/* Stock Status filter */}
        <div className="flex flex-col gap-1">
          <label className="text-gray-400 text-[10px] font-bold uppercase">Nível de Estoque</label>
          <select
            value={stockStatusFilter}
            onChange={(e) => setStockStatusFilter(e.target.value as any)}
            className="p-2 rounded border text-xs focus:outline-none transition-all cursor-pointer font-semibold"
            style={{
              backgroundColor: theme === 'dark' ? '#080808' : 'white',
              borderColor: theme === 'dark' ? '#1C1C1C' : '#E5E5E5',
              color: theme === 'dark' ? '#DDD' : '#333'
            }}
          >
            <option value="Todos">Todos os Níveis</option>
            <option value="Critico">Crítico (Reposição)</option>
            <option value="Normal">Suficiente (Normal)</option>
            <option value="SemEstoque">Sem Estoque (Zerado)</option>
          </select>
        </div>

        {/* ABC Class filter */}
        <div className="flex flex-col gap-1">
          <label className="text-gray-400 text-[10px] font-bold uppercase font-mono">Giro ABC de Vendas</label>
          <select
            value={abcClassFilter}
            onChange={(e) => setAbcClassFilter(e.target.value as any)}
            className="p-2 rounded border text-xs focus:outline-none transition-all cursor-pointer font-semibold"
            style={{
              backgroundColor: theme === 'dark' ? '#080808' : 'white',
              borderColor: theme === 'dark' ? '#1C1C1C' : '#E5E5E5',
              color: theme === 'dark' ? '#DDD' : '#333'
            }}
          >
            <option value="Todos">Todas as Classes</option>
            <option value="A">Classe A (Mais Vendidos)</option>
            <option value="B">Classe B (Giro Médio)</option>
            <option value="C">Classe C (Baixo Giro)</option>
          </select>
        </div>

        {/* Active/Archived status filter */}
        <div className="flex flex-col gap-1">
          <label className="text-gray-400 text-[10px] font-bold uppercase">Situação Cadastral</label>
          <select
            value={activeFilter}
            onChange={(e) => setActiveFilter(e.target.value as any)}
            className="p-2 rounded border text-xs focus:outline-none transition-all cursor-pointer font-semibold"
            style={{
              backgroundColor: theme === 'dark' ? '#080808' : 'white',
              borderColor: theme === 'dark' ? '#1C1C1C' : '#E5E5E5',
              color: theme === 'dark' ? '#DDD' : '#333'
            }}
          >
            <option value="Todos">Todos os Status</option>
            <option value="Ativos">Ativos</option>
            <option value="Arquivados">Arquivados (Inativos)</option>
          </select>
        </div>
      </div>

      {/* Grid listing */}
      <div className="overflow-x-auto border rounded-xl" style={{ borderColor: theme === 'dark' ? '#1A1A1A' : '#E5E5E5' }}>
        <table className={`w-full text-left border-collapse text-xs ${
          theme === 'dark' ? 'bg-[#111111] text-white' : 'bg-white text-[#111111]'
        }`}>
          <thead>
            <tr className={`border-b font-bold uppercase tracking-wider text-[10px] ${
              theme === 'dark' ? 'border-[#1A1A1A] bg-[#0A0A0A] text-gray-400' : 'border-gray-200 bg-gray-50 text-gray-600'
            }`}>
              <th className="p-3">Nome / SKU</th>
              <th className="p-3">Categoria</th>
              <th className="p-3 font-mono">Custo</th>
              <th className="p-3 font-mono">Preço Venda</th>
              <th className="p-3">Margem</th>
              <th className="p-3">Fardo / Caixa</th>
              <th className="p-3">Idade</th>
              <th className="p-3">Status</th>
              <th className="p-3 text-right">Ações</th>
            </tr>
          </thead>
          <tbody>
            {filteredProducts.map(prod => {
              const totalStock = (prod.stockBoxes * prod.boxQuantity) + prod.stockUnits;
              const isLowStock = totalStock <= prod.minStockUnits;

              return (
                <tr key={prod.id} className={`border-b transition-colors ${
                  theme === 'dark' ? 'border-[#1A1A1A] hover:bg-[#181818]' : 'border-gray-200 hover:bg-gray-50'
                }`}>
                  <td className="p-3">
                    <div className="flex items-center gap-3 py-1">
                      {prod.image ? (
                        <img
                          src={prod.image}
                          alt={prod.name}
                          className={`w-9 h-9 rounded-lg object-cover border flex-shrink-0 ${
                            theme === 'dark' ? 'border-[#222]' : 'border-gray-200'
                          }`}
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <div className={`w-9 h-9 rounded-lg flex items-center justify-center border text-[9px] font-black flex-shrink-0 ${
                          theme === 'dark' ? 'bg-[#0E0E0E] border-[#1C1C1C] text-gray-600' : 'bg-gray-100 border-gray-200 text-gray-400'
                        }`}>
                          N/A
                        </div>
                      )}
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-bold text-[13px] tracking-tight leading-snug" style={{ color: theme === 'dark' ? '#F3F4F6' : '#1F2937' }}>
                            {prod.name}
                          </span>
                          {prod.abcClass && (
                            <span className={`px-1.5 py-0.5 text-[8px] font-extrabold rounded ${
                              prod.abcClass === 'A' 
                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                                : prod.abcClass === 'B' 
                                ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' 
                                : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                            }`}>
                              Curva {prod.abcClass}
                            </span>
                          )}
                          {prod.hasTechnicalSheet && (
                            <span className="px-1.5 py-0.5 text-[8px] font-extrabold rounded bg-purple-500/10 text-purple-400 border border-purple-500/20">
                              Ficha/Combo
                            </span>
                          )}
                        </div>
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className={`inline-flex items-center text-[9px] font-mono font-medium px-1.5 py-0.5 rounded border ${
                            theme === 'dark' ? 'bg-[#161616] border-[#252525] text-[#18F2A4]' : 'bg-emerald-50 border-emerald-100 text-[#10B981]'
                          }`}>
                            SKU: {prod.sku}
                          </span>
                          {prod.barcode && (
                            <span className={`inline-flex items-center text-[9px] font-mono px-1.5 py-0.5 rounded border ${
                              theme === 'dark' ? 'bg-[#0E0E0E] border-[#1C1C1C] text-gray-400' : 'bg-gray-50 border-gray-100 text-gray-500'
                            }`}>
                              EAN: {prod.barcode}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="p-3">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] ${
                      theme === 'dark' ? 'bg-[#1A1A1A] text-gray-300' : 'bg-gray-100 text-gray-700'
                    }`}>{prod.category}</span>
                  </td>
                  <td className={`p-3 font-mono ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>R$ {prod.costPrice.toFixed(2)}</td>
                  <td className="p-3 font-mono font-bold">R$ {prod.sellPrice.toFixed(2)}</td>
                  <td className="p-3">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold border ${
                      theme === 'dark' ? (
                        prod.margin > 40 
                          ? 'text-emerald-400 bg-emerald-950/30 border-emerald-900/30' 
                          : prod.margin > 25 
                            ? 'text-amber-400 bg-amber-950/30 border-amber-900/30' 
                            : 'text-red-400 bg-red-950/30 border-red-900/30'
                      ) : (
                        prod.margin > 40 
                          ? 'text-emerald-900 bg-emerald-100 border-emerald-200' 
                          : prod.margin > 25 
                            ? 'text-amber-900 bg-amber-100 border-amber-200' 
                            : 'text-red-900 bg-red-100 border-red-200'
                      )
                    }`}>
                      {prod.margin}%
                    </span>
                  </td>
                  <td className="p-3">
                    <span className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>{prod.boxQuantity} un/fardo</span>
                  </td>
                  <td className="p-3">
                    {prod.ageRestricted ? (
                      <span className={`text-[10px] font-extrabold px-1.5 py-0.5 rounded border ${
                        theme === 'dark'
                          ? 'bg-red-950/40 text-red-400 border-red-900/30'
                          : 'bg-red-100 text-red-900 border-red-200'
                      }`}>
                        18+
                      </span>
                    ) : (
                      <span className="text-[10px] text-gray-500 font-medium">Livre</span>
                    )}
                  </td>
                  <td className="p-3">
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                      prod.active 
                        ? theme === 'dark' 
                          ? 'bg-emerald-950/40 text-emerald-400 border-emerald-900/40' 
                          : 'bg-emerald-100 text-emerald-900 border-emerald-200'
                        : theme === 'dark'
                          ? 'bg-gray-900 text-gray-500 border-gray-800'
                          : 'bg-gray-100 text-gray-700 border-gray-200'
                    }`}>
                      {prod.active ? 'Ativo' : 'Arquivado'}
                    </span>
                  </td>
                  <td className="p-3 text-right">
                    <div className="flex justify-end gap-1.5">
                      <button
                        onClick={() => openEditModal(prod)}
                        title="Editar"
                        className={`p-1.5 rounded transition-colors ${
                          theme === 'dark' ? 'hover:bg-[#222] text-[#18F2A4]' : 'hover:bg-gray-100 text-[#10B981]'
                        }`}
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDuplicate(prod)}
                        title="Duplicar"
                        className={`p-1.5 rounded transition-colors ${
                          theme === 'dark' ? 'hover:bg-[#222] text-amber-400' : 'hover:bg-gray-100 text-amber-600'
                        }`}
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleGenerateLabel(prod)}
                        title="Etiqueta"
                        className={`p-1.5 rounded transition-colors ${
                          theme === 'dark' ? 'hover:bg-[#222] text-sky-400' : 'hover:bg-gray-100 text-sky-600'
                        }`}
                      >
                        <Tag className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleArchive(prod)}
                        title={prod.active ? 'Arquivar' : 'Ativar'}
                        className={`p-1.5 rounded transition-colors ${
                          theme === 'dark' ? 'hover:bg-[#222] text-red-400' : 'hover:bg-gray-100 text-red-600'
                        }`}
                      >
                        <Archive className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
            {filteredProducts.length === 0 && (
              <tr>
                <td colSpan={9} className="text-center py-10 text-gray-500">
                  Nenhum produto cadastrado corresponde aos critérios.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Edit/Create Modal overlay */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className={`w-full max-w-xl rounded-xl border flex flex-col shadow-2xl max-h-[90vh] overflow-hidden ${
            theme === 'dark' ? 'bg-[#0E0E0E] border-[#1A1A1A] text-white' : 'bg-white border-gray-200 text-[#111111]'
          }`}>
            <div className={`p-4 border-b flex justify-between items-center shrink-0 ${
              theme === 'dark' ? 'border-[#1A1A1A]' : 'border-gray-200'
            }`}>
              <span className="font-semibold text-sm">
                {editingProduct ? `Editar: ${editingProduct.name}` : 'Cadastrar Novo Produto'}
              </span>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-white transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSave} className="flex flex-col flex-1 overflow-hidden text-xs">
              <div className="p-4 flex flex-col gap-4 overflow-y-auto flex-1">
              {/* Product Basic */}
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1 col-span-2">
                  <label className="text-gray-400 font-medium">Nome do Produto *</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className={`p-2 rounded border focus:outline-none ${
                      theme === 'dark' ? 'bg-[#111] border-[#222] focus:border-[#18F2A4]' : 'bg-gray-50 border-gray-200 focus:border-[#10B981]'
                    }`}
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-gray-400 font-medium">SKU Interno *</label>
                  <input
                    type="text"
                    required
                    value={sku}
                    onChange={(e) => setSku(e.target.value)}
                    className="p-2 rounded border bg-[#111] border-[#222] text-white focus:outline-none"
                    style={{ backgroundColor: theme === 'dark' ? '#111' : '#F9F9F9', borderColor: theme === 'dark' ? '#222' : '#E5E5E5', color: theme === 'dark' ? 'white' : 'black' }}
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-gray-400 font-medium">Código de Barras (EAN-13) *</label>
                  <input
                    type="text"
                    required
                    value={barcode}
                    onChange={(e) => setBarcode(e.target.value)}
                    className="p-2 rounded border focus:outline-none"
                    style={{ backgroundColor: theme === 'dark' ? '#111' : '#F9F9F9', borderColor: theme === 'dark' ? '#222' : '#E5E5E5', color: theme === 'dark' ? 'white' : 'black' }}
                  />
                </div>
              </div>

              {/* Categorization */}
              <div className="grid grid-cols-3 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-gray-400 font-medium">Categoria</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="p-2 rounded border bg-[#111] border-[#222] text-white focus:outline-none"
                    style={{ backgroundColor: theme === 'dark' ? '#111' : 'white', borderColor: theme === 'dark' ? '#222' : '#E5E5E5', color: theme === 'dark' ? 'white' : 'black' }}
                  >
                    {categories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-gray-400 font-medium">Marca</label>
                  <input
                    type="text"
                    value={brand}
                    onChange={(e) => setBrand(e.target.value)}
                    className="p-2 rounded border focus:outline-none"
                    style={{ backgroundColor: theme === 'dark' ? '#111' : 'white', borderColor: theme === 'dark' ? '#222' : '#E5E5E5', color: theme === 'dark' ? 'white' : 'black' }}
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-gray-400 font-medium">Fornecedor Principal</label>
                  <select
                    value={supplierId}
                    onChange={(e) => setSupplierId(e.target.value)}
                    className="p-2 rounded border focus:outline-none"
                    style={{ backgroundColor: theme === 'dark' ? '#111' : 'white', borderColor: theme === 'dark' ? '#222' : '#E5E5E5', color: theme === 'dark' ? 'white' : 'black' }}
                  >
                    {suppliers.map(s => (
                      <option key={s.id} value={s.id}>{s.companyName}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Pricing & Margins */}
              <div className="grid grid-cols-3 gap-3 p-3 rounded-lg bg-[#000000]/40 border border-[#1A1A1A]" style={{ backgroundColor: theme === 'dark' ? 'rgba(0,0,0,0.4)' : '#F5F5F5', borderColor: theme === 'dark' ? '#1A1A1A' : '#E5E5E5' }}>
                <div className="flex flex-col gap-1">
                  <label className="text-gray-400 font-medium">Preço de Custo (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={costPrice || ''}
                    onChange={(e) => setCostPrice(Number(e.target.value))}
                    className="p-2 rounded border focus:outline-none font-mono"
                    style={{ backgroundColor: theme === 'dark' ? '#111' : 'white', borderColor: theme === 'dark' ? '#222' : '#E5E5E5', color: theme === 'dark' ? 'white' : 'black' }}
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-gray-400 font-medium">Preço de Venda (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={sellPrice || ''}
                    onChange={(e) => setSellPrice(Number(e.target.value))}
                    className="p-2 rounded border focus:outline-none font-mono font-bold"
                    style={{ backgroundColor: theme === 'dark' ? '#111' : 'white', borderColor: theme === 'dark' ? '#222' : '#E5E5E5', color: theme === 'dark' ? 'white' : 'black' }}
                  />
                </div>

                <div className="flex flex-col justify-end pb-1 text-center">
                  <span className="text-[10px] text-gray-400 block mb-1 font-semibold uppercase">Margem Lucro</span>
                  <div className="flex items-center justify-center gap-1">
                    <Percent className="w-3.5 h-3.5 text-[#18F2A4]" />
                    <span className={`text-sm font-bold font-mono ${margin >= 40 ? 'text-[#18F2A4]' : 'text-amber-500'}`}>
                      {margin}%
                    </span>
                  </div>
                </div>
              </div>

              {/* Packaging and stock */}
              <div className="grid grid-cols-3 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-gray-400 font-medium">Qtd p/ Caixa (Embalagem)</label>
                  <input
                    type="number"
                    min="1"
                    value={boxQuantity}
                    onChange={(e) => setBoxQuantity(Number(e.target.value))}
                    className="p-2 rounded border focus:outline-none"
                    style={{ backgroundColor: theme === 'dark' ? '#111' : 'white', borderColor: theme === 'dark' ? '#222' : '#E5E5E5', color: theme === 'dark' ? 'white' : 'black' }}
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-gray-400 font-medium">Min Estoque (unidades)</label>
                  <input
                    type="number"
                    min="0"
                    value={minStockUnits}
                    onChange={(e) => setMinStockUnits(Number(e.target.value))}
                    className="p-2 rounded border focus:outline-none"
                    style={{ backgroundColor: theme === 'dark' ? '#111' : 'white', borderColor: theme === 'dark' ? '#222' : '#E5E5E5', color: theme === 'dark' ? 'white' : 'black' }}
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-gray-400 font-medium">Max Estoque (unidades)</label>
                  <input
                    type="number"
                    min="0"
                    value={maxStockUnits}
                    onChange={(e) => setMaxStockUnits(Number(e.target.value))}
                    className="p-2 rounded border focus:outline-none"
                    style={{ backgroundColor: theme === 'dark' ? '#111' : 'white', borderColor: theme === 'dark' ? '#222' : '#E5E5E5', color: theme === 'dark' ? 'white' : 'black' }}
                  />
                </div>
              </div>

              {/* Advanced Stock & Supplier settings */}
              <div className="grid grid-cols-2 gap-3 p-3 rounded-lg border border-dashed" style={{ borderColor: theme === 'dark' ? '#222' : '#E5E5E5' }}>
                <div className="flex flex-col gap-1">
                  <label className="text-gray-400 font-medium">Tempo de Entrega (Dias) *</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={leadTimeDays}
                    onChange={(e) => setLeadTimeDays(Number(e.target.value))}
                    className="p-2 rounded border focus:outline-none text-xs"
                    style={{ backgroundColor: theme === 'dark' ? '#111' : 'white', borderColor: theme === 'dark' ? '#222' : '#E5E5E5', color: theme === 'dark' ? 'white' : 'black' }}
                  />
                  <span className="text-[9px] text-gray-500">Prazo médio para recebimento de reposição.</span>
                </div>
                
                <div className="flex flex-col justify-center">
                  <span className="text-[10px] text-gray-400 uppercase font-semibold">Classe Curva ABC</span>
                  <div className="mt-1">
                    {editingProduct?.abcClass ? (
                      <span className={`px-2.5 py-1 text-[10px] font-bold rounded-full ${
                        editingProduct.abcClass === 'A' 
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                          : editingProduct.abcClass === 'B' 
                          ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' 
                          : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                      }`}>
                        Curva {editingProduct.abcClass} — Giro {editingProduct.abcClass === 'A' ? 'Altíssimo' : editingProduct.abcClass === 'B' ? 'Médio' : 'Baixo'}
                      </span>
                    ) : (
                      <span className="text-gray-500 italic text-[11px]">Calculada pós-vendas</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Ficha Técnica / Combo section */}
              <div className="flex flex-col gap-2.5 p-3 rounded-lg border" style={{ backgroundColor: theme === 'dark' ? 'rgba(0,0,0,0.2)' : '#FAFAFA', borderColor: theme === 'dark' ? '#1A1A1A' : '#E5E5E5' }}>
                <label className="flex items-center gap-2 font-semibold text-gray-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={hasTechnicalSheet}
                    onChange={(e) => setHasTechnicalSheet(e.target.checked)}
                    className="rounded border-[#222] text-[#18F2A4] bg-transparent"
                  />
                  <span style={{ color: theme === 'dark' ? '#FFF' : '#333' }}>Este produto possui Ficha Técnica / Combo (Deduz Frações)</span>
                </label>
                
                {hasTechnicalSheet && (
                  <div className="flex flex-col gap-3 mt-1.5 pt-2.5 border-t border-dashed" style={{ borderColor: theme === 'dark' ? '#222' : '#E5E5E5' }}>
                    <span className="font-bold text-[10px] uppercase text-gray-400">Composição da Receita (Ingredientes)</span>
                    
                    {/* Add ingredient controls */}
                    <div className="grid grid-cols-12 gap-2">
                      <div className="col-span-7 flex flex-col gap-0.5">
                        <span className="text-[9px] text-gray-500">Selecionar Ingrediente</span>
                        <select
                          value={tempIngredientId}
                          onChange={(e) => setTempIngredientId(e.target.value)}
                          className="p-1.5 rounded border text-xs focus:outline-none"
                          style={{ backgroundColor: theme === 'dark' ? '#111' : 'white', borderColor: theme === 'dark' ? '#222' : '#E5E5E5', color: theme === 'dark' ? 'white' : 'black' }}
                        >
                          <option value="">Selecione...</option>
                          {products
                            .filter(p => p.id !== (editingProduct?.id || '') && !p.hasTechnicalSheet)
                            .map(p => (
                              <option key={p.id} value={p.id}>{p.name} ({p.unit})</option>
                            ))
                          }
                        </select>
                      </div>
                      
                      <div className="col-span-3 flex flex-col gap-0.5">
                        <span className="text-[9px] text-gray-500">Qtd Deduzida</span>
                        <input
                          type="number"
                          step="0.01"
                          min="0.01"
                          value={tempQuantity}
                          onChange={(e) => setTempQuantity(Number(e.target.value))}
                          className="p-1.5 rounded border text-xs focus:outline-none font-mono text-center"
                          style={{ backgroundColor: theme === 'dark' ? '#111' : 'white', borderColor: theme === 'dark' ? '#222' : '#E5E5E5', color: theme === 'dark' ? 'white' : 'black' }}
                        />
                      </div>
                      
                      <div className="col-span-2 flex items-end">
                        <button
                          type="button"
                          onClick={() => {
                            if (!tempIngredientId) return;
                            const exists = recipe.some(r => r.ingredientProductId === tempIngredientId);
                            if (exists) {
                              alert('Este ingrediente já está na receita.');
                              return;
                            }
                            setRecipe([...recipe, { ingredientProductId: tempIngredientId, quantity: tempQuantity }]);
                            setTempIngredientId('');
                            setTempQuantity(1);
                          }}
                          className={`w-full py-1.5 rounded font-bold text-[11px] transition-all cursor-pointer ${
                            theme === 'dark' ? 'bg-[#18F2A4] text-black hover:bg-[#12d58f]' : 'bg-[#10B981] text-white hover:bg-[#0e9f6e]'
                          }`}
                        >
                          Add
                        </button>
                      </div>
                    </div>
                    
                    {/* List current recipe ingredients */}
                    {recipe.length === 0 ? (
                      <div className="text-center py-2 text-[10px] text-gray-500 bg-black/10 rounded">
                        Nenhum ingrediente adicionado. Monte a receita acima.
                      </div>
                    ) : (
                      <div className="flex flex-col gap-1.5 max-h-32 overflow-y-auto pr-1">
                        {recipe.map((rec, rIdx) => {
                          const ingProd = products.find(p => p.id === rec.ingredientProductId);
                          return (
                            <div key={rIdx} className="flex justify-between items-center p-1.5 rounded bg-black/20 border border-[#1A1A1A]" style={{ backgroundColor: theme === 'dark' ? 'rgba(0,0,0,0.2)' : '#F0F0F0', borderColor: theme === 'dark' ? '#1D1D1D' : '#E5E5E5' }}>
                              <span className="font-medium text-[10px] truncate max-w-[200px]" style={{ color: theme === 'dark' ? '#FFF' : '#333' }}>{ingProd ? ingProd.name : 'Desconhecido'}</span>
                              <div className="flex items-center gap-3 shrink-0">
                                <span className="font-mono text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded">
                                  {rec.quantity} {ingProd?.unit || 'UN'}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => setRecipe(recipe.filter((_, i) => i !== rIdx))}
                                  className="text-red-400 hover:text-red-500 text-[10px] font-bold cursor-pointer"
                                >
                                  Remover
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Flags */}
              <div className="flex gap-4 items-center p-2 rounded border" style={{ borderColor: theme === 'dark' ? '#222' : '#E5E5E5' }}>
                <label className="flex items-center gap-2 font-medium text-gray-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={ageRestricted}
                    onChange={(e) => setAgeRestricted(e.target.checked)}
                    className="rounded border-[#222] text-[#18F2A4] bg-transparent"
                  />
                  <span>Restrito para Menores (+18 anos)</span>
                </label>

                <label className="flex items-center gap-2 font-medium text-gray-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={active}
                    onChange={(e) => setActive(e.target.checked)}
                    className="rounded border-[#222] text-[#18F2A4] bg-transparent"
                  />
                  <span>Produto Disponível para Vendas</span>
                </label>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-gray-400 font-medium">Observações Operacionais</label>
                <textarea
                  value={notes}
                  rows={2}
                  onChange={(e) => setNotes(e.target.value)}
                  className="p-2 rounded border focus:outline-none"
                  style={{ backgroundColor: theme === 'dark' ? '#111' : 'white', borderColor: theme === 'dark' ? '#222' : '#E5E5E5', color: theme === 'dark' ? 'white' : 'black' }}
                  placeholder="Ex: Servir trincando de gelada. Manter no freezer 3."
                />
              </div>

              {/* Product Image Section */}
              <div className="flex flex-col gap-2.5 p-3 rounded-lg border" style={{ backgroundColor: theme === 'dark' ? 'rgba(0,0,0,0.3)' : '#F9F9F9', borderColor: theme === 'dark' ? '#1A1A1A' : '#E5E5E5' }}>
                <label className="text-gray-400 font-semibold block">Imagem do Produto</label>
                <div className="flex flex-col sm:flex-row gap-3 items-center">
                  {/* Preview box */}
                  <div className={`w-14 h-14 rounded-xl flex-shrink-0 border flex items-center justify-center overflow-hidden bg-black/20 ${
                    theme === 'dark' ? 'border-[#222]' : 'border-gray-200'
                  }`}>
                    {image ? (
                      <img src={image} alt="Preview" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    ) : (
                      <span className="text-[9px] text-gray-500 font-semibold text-center">Sem foto</span>
                    )}
                  </div>
                  {/* Actions */}
                  <div className="flex-1 w-full flex flex-col gap-2">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Cole a URL de imagem do Google ou Unsplash..."
                        value={image}
                        onChange={(e) => setImage(e.target.value)}
                        className="p-2 rounded border text-xs flex-1 focus:outline-none focus:border-[#18F2A4]"
                        style={{ backgroundColor: theme === 'dark' ? '#111' : 'white', borderColor: theme === 'dark' ? '#222' : '#E5E5E5', color: theme === 'dark' ? 'white' : 'black' }}
                      />
                      {image && (
                        <button
                          type="button"
                          onClick={() => setImage('')}
                          className="px-2 py-1.5 rounded text-[10px] font-bold border border-red-500/20 text-red-500 hover:bg-red-500/10 cursor-pointer transition-colors"
                        >
                          Limpar
                        </button>
                      )}
                    </div>
                    {/* Local File uploader & Reference Search */}
                    <div className="flex flex-wrap gap-2 items-center">
                      <label className={`text-[10px] font-bold px-2.5 py-1.5 rounded border cursor-pointer transition-all active:scale-95 flex items-center gap-1.5 ${
                        theme === 'dark' ? 'bg-[#1A1A1A] border-[#252525] hover:bg-[#222] text-[#18F2A4]' : 'bg-white border-gray-200 hover:bg-gray-50 text-[#10B981]'
                      }`}>
                        <span>Carregar Arquivo Local (PNG)</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleImageUpload}
                          className="hidden"
                        />
                      </label>

                      <button
                        type="button"
                        onClick={() => {
                          setRefImageSearchTerm(name || category || '');
                          setShowImageSearchModal(true);
                        }}
                        className={`text-[10px] font-bold px-2.5 py-1.5 rounded border transition-all active:scale-95 flex items-center gap-1.5 cursor-pointer ${
                          theme === 'dark' ? 'bg-[#18F2A4]/10 border-[#18F2A4]/30 text-[#18F2A4] hover:bg-[#18F2A4]/20' : 'bg-emerald-50 border-emerald-300 text-emerald-800 hover:bg-emerald-100'
                        }`}
                      >
                        <Search className="w-3 h-3" />
                        <span>Buscar Foto de Referência</span>
                      </button>

                      {image && image.startsWith('data:image') && (
                        <span className="text-[9px] text-emerald-500 font-bold flex items-center gap-0.5">
                          <Check className="w-3 h-3" /> Arquivo Carregado
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                {/* Presets based on category */}
                <div className="mt-1">
                  <span className="text-[10px] text-gray-400 block mb-1">Dica rápida: Imagens Premium Prontas (Clique p/ usar)</span>
                  <div className="flex flex-wrap gap-1">
                    {[
                      { name: 'Cerveja', url: 'https://images.unsplash.com/photo-1597075687490-8f673c6c17f6?q=80&w=200&auto=format&fit=crop' },
                      { name: 'Vodka', url: 'https://images.unsplash.com/photo-1569529465841-dfedd87500f8?q=80&w=200&auto=format&fit=crop' },
                      { name: 'Gin', url: 'https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?q=80&w=200&auto=format&fit=crop' },
                      { name: 'Whisky', url: 'https://images.unsplash.com/photo-1527061011665-3652c757a4d4?q=80&w=200&auto=format&fit=crop' },
                      { name: 'Vinho', url: 'https://images.unsplash.com/photo-1506377247377-2a5b3b417ebb?q=80&w=200&auto=format&fit=crop' },
                      { name: 'Refrigerante', url: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?q=80&w=200&auto=format&fit=crop' },
                      { name: 'Energético', url: 'https://images.unsplash.com/photo-1622543953490-0b70039a4ac1?q=80&w=200&auto=format&fit=crop' },
                      { name: 'Porção', url: 'https://images.unsplash.com/photo-1576107232684-1279f390859f?q=80&w=200&auto=format&fit=crop' }
                    ].map(p => (
                      <button
                        key={p.name}
                        type="button"
                        onClick={() => setImage(p.url)}
                        className={`text-[9px] px-2 py-0.5 rounded border transition-colors cursor-pointer ${
                          image === p.url
                            ? (theme === 'dark' ? 'bg-[#18F2A4]/15 border-[#18F2A4] text-[#18F2A4]' : 'bg-[#10B981]/15 border-[#10B981] text-[#10B981]')
                            : (theme === 'dark' ? 'bg-[#111] border-[#222] text-gray-400 hover:text-white' : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-100')
                        }`}
                      >
                        {p.name}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              </div>

              {/* CTAs */}
              <div className="flex gap-2 justify-end border-t p-4 shrink-0" style={{ borderColor: theme === 'dark' ? '#1A1A1A' : '#E5E5E5' }}>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className={`px-3 py-2 rounded font-semibold border transition-all cursor-pointer ${
                    theme === 'dark' ? 'bg-transparent border-[#222] text-gray-400 hover:text-white' : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-100'
                  }`}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className={`px-4 py-2 rounded font-semibold transition-all cursor-pointer ${
                    theme === 'dark' ? 'bg-[#18F2A4] text-black hover:bg-[#12d58f]' : 'bg-[#10B981] text-white hover:bg-[#0e9f6e]'
                  }`}
                >
                  Salvar Produto
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Category Configuration Modal */}
      {showCategoryConfigModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className={`w-full max-w-md rounded-xl border flex flex-col shadow-2xl max-h-[80vh] overflow-hidden ${
            theme === 'dark' ? 'bg-[#0E0E0E] border-[#1A1A1A] text-white' : 'bg-white border-gray-200 text-[#111111]'
          }`}>
            <div className={`p-4 border-b flex justify-between items-center shrink-0 ${
              theme === 'dark' ? 'border-[#1A1A1A]' : 'border-gray-200'
            }`}>
              <div className="flex items-center gap-2">
                <Tag className="w-4 h-4 text-[#18F2A4]" />
                <span className="font-semibold text-sm">Configuração de Categorias</span>
              </div>
              <button 
                onClick={() => {
                  setShowCategoryConfigModal(false);
                  setEditingCatName(null);
                }} 
                className="text-gray-400 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 flex flex-col gap-4 overflow-y-auto flex-1 text-xs">
              <p className="text-gray-400 text-[11px] leading-relaxed">
                Adicione, edite ou remova categorias do sistema. Alterar ou excluir uma categoria atualizará automaticamente os produtos vinculados de forma segura.
              </p>

              {/* Form to add category */}
              <div className={`p-3 rounded-lg border flex flex-col gap-2 ${
                theme === 'dark' ? 'bg-black/30 border-[#1A1A1A]' : 'bg-gray-50 border-gray-200'
              }`}>
                <label className="text-gray-400 font-bold uppercase text-[9px]">Cadastrar Nova Categoria</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Ex: Vinhos Importados, Drinks..."
                    value={newCatNameInput}
                    onChange={(e) => setNewCatNameInput(e.target.value)}
                    className="p-2 rounded border focus:outline-none flex-1 font-semibold text-xs"
                    style={{
                      backgroundColor: theme === 'dark' ? '#080808' : 'white',
                      borderColor: theme === 'dark' ? '#1C1C1C' : '#E5E5E5',
                      color: theme === 'dark' ? 'white' : 'black'
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        if (newCatNameInput.trim()) {
                          onAddCategory(newCatNameInput.trim());
                          setNewCatNameInput('');
                        }
                      }
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (newCatNameInput.trim()) {
                        onAddCategory(newCatNameInput.trim());
                        setNewCatNameInput('');
                      }
                    }}
                    className={`px-3 py-1 text-xs rounded font-bold transition-all cursor-pointer ${
                      theme === 'dark' ? 'bg-[#18F2A4] text-black hover:bg-[#12d58f]' : 'bg-[#10B981] text-white hover:bg-[#0e9f6e]'
                    }`}
                  >
                    Adicionar
                  </button>
                </div>
              </div>

              {/* List of existing categories */}
              <div className="flex flex-col gap-1.5 mt-2">
                <span className="text-gray-400 font-bold uppercase text-[9px] mb-1">Categorias Atuais ({categories.length})</span>
                <div className="flex flex-col gap-1.5 max-h-60 overflow-y-auto pr-1">
                  {categories.map(cat => {
                    const isEditing = editingCatName === cat;
                    const prodCount = products.filter(p => p.category === cat).length;

                    return (
                      <div 
                        key={cat} 
                        className={`p-2.5 rounded-lg border flex justify-between items-center gap-3 transition-all ${
                          theme === 'dark' ? 'bg-[#060606] border-[#1C1C1C]' : 'bg-white border-gray-150 shadow-xs'
                        }`}
                      >
                        {isEditing ? (
                          <div className="flex gap-1.5 flex-1 items-center">
                            <input
                              type="text"
                              value={editCatNameInput}
                              onChange={(e) => setEditCatNameInput(e.target.value)}
                              className="p-1 rounded border focus:outline-none flex-1 font-semibold text-xs"
                              style={{
                                backgroundColor: theme === 'dark' ? '#080808' : 'white',
                                borderColor: theme === 'dark' ? '#1C1C1C' : '#E5E5E5',
                                color: theme === 'dark' ? 'white' : 'black'
                              }}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  e.preventDefault();
                                  if (editCatNameInput.trim()) {
                                    onRenameCategory(cat, editCatNameInput.trim());
                                    setEditingCatName(null);
                                  }
                                }
                              }}
                            />
                            <button
                              onClick={() => {
                                if (editCatNameInput.trim()) {
                                  onRenameCategory(cat, editCatNameInput.trim());
                                  setEditingCatName(null);
                                }
                              }}
                              className="p-1.5 rounded bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 transition-colors cursor-pointer"
                              title="Salvar"
                            >
                              <Check className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => setEditingCatName(null)}
                              className="p-1.5 rounded bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors cursor-pointer"
                              title="Cancelar"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <>
                            <div className="flex flex-col text-left">
                              <span className="font-semibold text-xs" style={{ color: theme === 'dark' ? 'white' : '#111' }}>{cat}</span>
                              <span className="text-[10px] text-gray-500">{prodCount} produtos vinculados</span>
                            </div>

                            <div className="flex items-center gap-1 shrink-0">
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingCatName(cat);
                                  setEditCatNameInput(cat);
                                }}
                                className={`p-1.5 rounded transition-all cursor-pointer ${
                                  theme === 'dark' ? 'hover:bg-[#1C1C1C] text-gray-400 hover:text-white' : 'hover:bg-gray-100 text-gray-500 hover:text-gray-900'
                                }`}
                                title="Editar nome"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              {cat !== 'Outros' && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (confirm(`Tem certeza que deseja excluir a categoria "${cat}"?\n\nTodos os ${prodCount} produtos vinculados serão automaticamente movidos para "Outros".`)) {
                                      onDeleteCategory(cat);
                                    }
                                  }}
                                  className="p-1.5 rounded hover:bg-red-500/10 text-red-400 hover:text-red-500 transition-all cursor-pointer"
                                  title="Excluir categoria"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="p-4 border-t flex justify-end shrink-0" style={{ borderColor: theme === 'dark' ? '#1A1A1A' : '#E5E5E5' }}>
              <button
                type="button"
                onClick={() => {
                  setShowCategoryConfigModal(false);
                  setEditingCatName(null);
                }}
                className={`px-4 py-2 rounded font-bold text-xs cursor-pointer transition-all ${
                  theme === 'dark' ? 'bg-[#141414] text-gray-300 hover:bg-[#1C1C1C] border border-[#222]' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reference Image Library Modal */}
      {showImageSearchModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
          <div className={`w-full max-w-2xl max-h-[85vh] rounded-2xl border flex flex-col overflow-hidden shadow-2xl ${
            theme === 'dark' ? 'bg-[#0E0E0E] border-[#222] text-white' : 'bg-white border-gray-200 text-gray-900'
          }`}>
            <div className={`p-4 border-b flex justify-between items-center ${
              theme === 'dark' ? 'border-[#1C1C1C]' : 'border-gray-200'
            }`}>
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#18F2A4]" />
                <h3 className="font-bold text-sm tracking-tight">Galeria de Fotos de Referência (Licença Livre)</h3>
              </div>
              <button onClick={() => setShowImageSearchModal(false)} className="text-gray-400 hover:text-white p-1 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 flex flex-col gap-3 overflow-y-auto flex-1">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-2.5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Busque por cerveja, heineken, whisky, refrigerante, gelo..."
                  value={refImageSearchTerm}
                  onChange={(e) => setRefImageSearchTerm(e.target.value)}
                  className={`w-full pl-9 pr-3 py-2 text-xs rounded-xl border outline-none ${
                    theme === 'dark' ? 'bg-[#141414] border-[#222] text-white focus:border-[#18F2A4]' : 'bg-gray-50 border-gray-200 text-gray-900'
                  }`}
                />
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-1">
                {filteredReferenceImages.map((item, idx) => (
                  <div
                    key={idx}
                    onClick={() => {
                      setImage(item.url);
                      setShowImageSearchModal(false);
                    }}
                    className={`group relative rounded-xl border overflow-hidden cursor-pointer transition-all hover:scale-[1.02] ${
                      image === item.url 
                        ? (theme === 'dark' ? 'border-[#18F2A4] ring-2 ring-[#18F2A4]/30' : 'border-emerald-500 ring-2 ring-emerald-500/30') 
                        : (theme === 'dark' ? 'border-[#222] hover:border-gray-600' : 'border-gray-200 hover:border-gray-400')
                    }`}
                  >
                    <div className="aspect-square w-full overflow-hidden bg-black/40 relative">
                      <img
                        src={item.url}
                        alt={item.name}
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                        referrerPolicy="no-referrer"
                      />
                      <span className="absolute top-1.5 left-1.5 text-[8px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-black/70 text-white backdrop-blur-xs">
                        {item.category}
                      </span>
                    </div>
                    <div className="p-2 text-[10px] font-semibold truncate">
                      {item.name}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
