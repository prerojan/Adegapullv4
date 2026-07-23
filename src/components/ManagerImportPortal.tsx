import React, { useState, useMemo, useEffect, useRef } from 'react';
import { 
  FileSpreadsheet, Download, Upload, Check, X, Barcode, 
  UserCheck, Truck, AlertCircle, HelpCircle, Keyboard, Play, RefreshCw, Layers
} from 'lucide-react';
import { Product, Supplier, CashierUser } from '../types';
import * as XLSX from 'xlsx';
import { exportStyledTemplate } from '../lib/excelExport';

interface ManagerImportPortalProps {
  products: Product[];
  suppliers: Supplier[];
  usersList: CashierUser[];
  onAddProduct: (prod: Product) => void;
  onUpdateProduct: (prod: Product) => void;
  onAddSupplier: (sup: Supplier) => void;
  onAddUser: (user: CashierUser) => void;
  categories: string[];
  onAddCategory: (cat: string) => void;
  theme: 'dark' | 'light';
  startWithWizardOpen?: boolean;
  onCloseWizard?: () => void;
}

export default function ManagerImportPortal({
  products,
  suppliers,
  usersList,
  onAddProduct,
  onUpdateProduct,
  onAddSupplier,
  onAddUser,
  categories,
  onAddCategory,
  theme,
  startWithWizardOpen = false,
  onCloseWizard
}: ManagerImportPortalProps) {
  
  const [activeTab, setActiveTab] = useState<'produtos' | 'funcionarios' | 'fornecedores'>('produtos');
  const [dragOver, setDragOver] = useState(false);
  const [parseError, setParseError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  
  // Parsed states for preview
  const [previewProducts, setPreviewProducts] = useState<Product[]>([]);
  const [previewUsers, setPreviewUsers] = useState<CashierUser[]>([]);
  const [previewSuppliers, setPreviewSuppliers] = useState<Supplier[]>([]);
  const [newCategoriesToRegister, setNewCategoriesToRegister] = useState<string[]>([]);
  const [stats, setStats] = useState<{ total: number; valid: number; duplicates: number } | null>(null);

  // Barcode Wizard States
  const [showWizard, setShowWizard] = useState(startWithWizardOpen);
  const [wizardProducts, setWizardProducts] = useState<Product[]>([]);
  const [wizardIndex, setWizardIndex] = useState(0);
  const [wizardInput, setWizardInput] = useState('');
  const [wizardWarning, setWizardWarning] = useState<string | null>(null);
  const [wizardSuccess, setWizardSuccess] = useState<string | null>(null);
  const [scanHistory, setScanHistory] = useState<{
    id: string;
    productName: string;
    barcode: string;
    timestamp: string;
    skipped: boolean;
  }[]>([]);

  const scanInputRef = useRef<HTMLInputElement>(null);

  // Sync showWizard if prop changes
  useEffect(() => {
    if (startWithWizardOpen) {
      setShowWizard(true);
    }
  }, [startWithWizardOpen]);

  // Compute products that have empty barcode
  const pendingBarcodeProducts = useMemo(() => {
    return products.filter(p => !p.barcode && p.active);
  }, [products]);

  // Handle opening of wizard
  useEffect(() => {
    if (showWizard) {
      setWizardProducts(pendingBarcodeProducts);
      setWizardIndex(0);
      setWizardWarning(null);
      setWizardSuccess(null);
      // Auto focus input
      setTimeout(() => {
        scanInputRef.current?.focus();
      }, 300);
    }
  }, [showWizard, pendingBarcodeProducts.length]);

  // Auto focus scanning input on click anywhere inside wizard box
  const handleWizardClick = () => {
    scanInputRef.current?.focus();
  };

  // 1. Download templates dynamically
  const handleDownloadTemplate = (type: 'produtos' | 'funcionarios' | 'fornecedores') => {
    exportStyledTemplate(type)
      .then(() => {
        // Success
      })
      .catch(err => {
        console.error('Erro ao baixar modelo de planilha:', err);
        alert('Ocorreu um erro ao gerar a planilha modelo.');
      });
  };

  // 2. Drag & Drop events
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = () => {
    setDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      parseFile(file);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      parseFile(file);
    }
  };

  // 3. Parse spreadsheet
  const parseFile = (file: File) => {
    setParseError(null);
    setSuccessMessage(null);
    setPreviewProducts([]);
    setPreviewUsers([]);
    setPreviewSuppliers([]);
    setNewCategoriesToRegister([]);
    setStats(null);

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json(ws);

        if (data.length === 0) {
          setParseError("A planilha selecionada está vazia.");
          return;
        }

        processImportedData(data);
      } catch (err: any) {
        setParseError("Erro ao decodificar a planilha. Verifique se o arquivo está corrompido ou formato incorreto (.xlsx, .xls, .csv).");
        console.error(err);
      }
    };
    reader.readAsBinaryString(file);
  };

  // 4. Process spreadsheets with flexible headers
  const processImportedData = (rows: any[]) => {
    if (activeTab === 'produtos') {
      const parsed: Product[] = [];
      const newCats = new Set<string>();
      
      const existingNames = new Set(products.map(p => p.name.toLowerCase().trim()));
      const existingBarcodes = new Set(products.map(p => p.barcode).filter(b => b && b !== 'SEM_CODIGO'));
      const existingSkus = new Set(products.map(p => p.sku.toLowerCase().trim()));

      let dupCount = 0;

      rows.forEach((row, i) => {
        const name = String(row.Nome || row.nome || row.NAME || row["Nome do Produto"] || row["Descrição"] || "").trim();
        if (!name) return; // skip empty lines

        // Duplicates lookup
        if (existingNames.has(name.toLowerCase())) {
          dupCount++;
          return;
        }

        const category = String(row.Categoria || row.categoria || row.CATEGORIA || "Outros").trim();
        const barcode = String(row.Codigo_Barras || row.codigo_barras || row.barcode || row.BARCODE || row["Código de Barras"] || "").trim();
        const sku = String(row.SKU || row.sku || row.Sku || row["Código Interno"] || "").trim() || `P-${Date.now()}-${i}`;
        const costPrice = parseFloat(row.Preco_Custo || row.preco_custo || row["Preço de Custo"] || row.cost_price || 0);
        const sellPrice = parseFloat(row.Preco_Venda || row.preco_venda || row["Preço de Venda"] || row.sell_price || 0);
        const unit = String(row.Unidade || row.unidade || row.unit || "UN").toUpperCase().trim();
        const stockUnits = parseInt(row.Estoque_Unidades || row.estoque_unidades || row["Estoque Unidades"] || row.stock_units || 0, 10);
        const minStockUnits = parseInt(row.Estoque_Minimo || row.estoque_minimo || row["Estoque Mínimo"] || row.min_stock || 0, 10);
        const brand = String(row.Marca || row.marca || row.brand || "").trim();

        if (barcode && existingBarcodes.has(barcode)) {
          dupCount++;
          return; // Skip duplicate barcodes too
        }

        const margin = sellPrice > 0 ? parseFloat((((sellPrice - costPrice) / sellPrice) * 100).toFixed(2)) : 0;

        if (category && !categories.includes(category)) {
          newCats.add(category);
        }

        parsed.push({
          id: `p-imp-${Date.now()}-${i}-${Math.random().toString(36).substr(2, 4)}`,
          name,
          category: category || 'Outros',
          barcode,
          sku,
          supplierId: '',
          costPrice: isNaN(costPrice) ? 0 : costPrice,
          sellPrice: isNaN(sellPrice) ? 0 : sellPrice,
          margin: isNaN(margin) ? 0 : margin,
          unit: (unit === 'LT' || unit === 'KG' ? unit : 'UN') as any,
          boxQuantity: 1,
          stockBoxes: 0,
          stockUnits: isNaN(stockUnits) ? 0 : stockUnits,
          minStockUnits: isNaN(minStockUnits) ? 0 : minStockUnits,
          maxStockUnits: 9999,
          active: true,
          brand,
          ageRestricted: false
        });
      });

      setPreviewProducts(parsed);
      setNewCategoriesToRegister(Array.from(newCats));
      setStats({
        total: rows.length,
        valid: parsed.length,
        duplicates: dupCount
      });

    } else if (activeTab === 'funcionarios') {
      const parsed: CashierUser[] = [];
      const existingNames = new Set(usersList.map(u => u.name.toLowerCase().trim()));
      const existingPins = new Set(usersList.map(u => u.pin));
      let dupCount = 0;

      rows.forEach((row, i) => {
        const name = String(row.Nome_Completo || row.nome_completo || row.Nome || row.nome || row["Nome Completo"] || "").trim();
        if (!name) return;

        let pin = String(row.Senha_PIN || row.senha_pin || row.PIN || row.pin || row["PIN"] || row["Senha"] || "").trim();
        if (!pin) {
          pin = String(Math.floor(1000 + Math.random() * 9000));
        }

        if (existingNames.has(name.toLowerCase()) || existingPins.has(pin)) {
          dupCount++;
          return;
        }

        let role = String(row.Cargo || row.cargo || row.role || "cashier").toLowerCase().trim();
        const validRoles = ['admin', 'manager', 'finance', 'cashier', 'waiter', 'stock', 'kitchen', 'bar'];
        if (!validRoles.includes(role)) {
          role = 'cashier';
        }

        const activeStr = String(row.Ativo || row.ativo || "Sim").toLowerCase();
        const active = activeStr === 'sim' || activeStr === 'true' || activeStr === 'yes' || activeStr === '1';

        parsed.push({
          id: `u-imp-${Date.now()}-${i}`,
          name,
          pin,
          role: role as any,
          active
        });
      });

      setPreviewUsers(parsed);
      setStats({
        total: rows.length,
        valid: parsed.length,
        duplicates: dupCount
      });

    } else if (activeTab === 'fornecedores') {
      const parsed: Supplier[] = [];
      const existingNames = new Set(suppliers.map(s => s.companyName.toLowerCase().trim()));
      let dupCount = 0;

      rows.forEach((row, i) => {
        const companyName = String(row.Razao_Social_ou_Nome || row.razao_social || row.Nome || row.nome || row["Razão Social"] || "").trim();
        if (!companyName) return;

        if (existingNames.has(companyName.toLowerCase())) {
          dupCount++;
          return;
        }

        const contactName = String(row.Nome_Contato || row.contato || row.contact_name || "Representante").trim();
        const phone = String(row.Telefone || row.telefone || "").trim();
        const whatsapp = String(row.WhatsApp || row.whatsapp || "").trim().replace(/\D/g, '') || phone.replace(/\D/g, '');
        const email = String(row.Email || row.email || "").trim();
        const notes = String(row.Anotacoes || row.anotacoes || row.notes || "").trim();

        parsed.push({
          id: `s-imp-${Date.now()}-${i}`,
          companyName,
          contactName,
          phone,
          whatsapp,
          email,
          notes
        });
      });

      setPreviewSuppliers(parsed);
      setStats({
        total: rows.length,
        valid: parsed.length,
        duplicates: dupCount
      });
    }
  };

  // 5. Save imported preview data to actual DB
  const handleConfirmImport = () => {
    if (activeTab === 'produtos') {
      if (previewProducts.length === 0) return;

      // 1. Register categories
      newCategoriesToRegister.forEach(cat => {
        onAddCategory(cat);
      });

      // 2. Add products
      previewProducts.forEach(prod => {
        onAddProduct(prod);
      });

      // 3. Count imported products with missing barcode
      const missingCount = previewProducts.filter(p => !p.barcode).length;

      setSuccessMessage(`Sucesso! ${previewProducts.length} produtos foram cadastrados com êxito.`);
      
      if (missingCount > 0) {
        if (confirm(`Importação concluída!\n\nIdentificamos que ${missingCount} produtos novos não possuem código de barras na planilha.\n\nDeseja iniciar o Assistente de Escaneamento Rápido agora para vincular os códigos com seu leitor óptico?`)) {
          setShowWizard(true);
        }
      }

      setPreviewProducts([]);

    } else if (activeTab === 'funcionarios') {
      if (previewUsers.length === 0) return;
      previewUsers.forEach(user => {
        onAddUser(user);
      });
      setSuccessMessage(`Sucesso! ${previewUsers.length} funcionários cadastrados com êxito.`);
      setPreviewUsers([]);

    } else if (activeTab === 'fornecedores') {
      if (previewSuppliers.length === 0) return;
      previewSuppliers.forEach(sup => {
        onAddSupplier(sup);
      });
      setSuccessMessage(`Sucesso! ${previewSuppliers.length} fornecedores cadastrados com êxito.`);
      setPreviewSuppliers([]);
    }

    setStats(null);
  };

  // 6. Barcode wizard operations
  const currentWizardProduct = wizardProducts[wizardIndex];

  // Listener inside input for optical barcode scanner (fast string followed by enter)
  const handleWizardInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const code = wizardInput.trim();
      if (!code) {
        handleMarkNoBarcode();
      } else {
        submitScannedBarcode(code);
      }
    } else if (e.key === ' ') {
      // Space key skips or registers as no barcode if input is empty
      if (!wizardInput.trim() && currentWizardProduct) {
        e.preventDefault();
        handleMarkNoBarcode();
      }
    }
  };

  // Bypasses the active product as having no barcode (for prepared food/manual items)
  const handleMarkNoBarcode = () => {
    if (!currentWizardProduct) return;
    
    const updated: Product = {
      ...currentWizardProduct,
      barcode: 'SEM_CODIGO' // Explicit value for bypassed items
    };
    
    onUpdateProduct(updated);

    // Record in history
    setScanHistory(prev => [
      {
        id: `hist-${Date.now()}-${Math.random()}`,
        productName: currentWizardProduct.name,
        barcode: 'Sem Código (Confirmado)',
        timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        skipped: true
      },
      ...prev
    ]);
    
    setWizardSuccess(`Produto "${currentWizardProduct.name}" cadastrado sem código de barras.`);
    setWizardWarning(null);
    setWizardInput('');

    // Advance index
    if (wizardIndex < wizardProducts.length - 1) {
      setWizardIndex(prev => prev + 1);
    } else {
      // Finished all pending!
      alert('Todos os produtos pendentes foram processados com sucesso.');
      setShowWizard(false);
      if (onCloseWizard) onCloseWizard();
    }
  };

  const submitScannedBarcode = (code: string) => {
    if (!currentWizardProduct) return;

    // 1. Duplicate checks
    const alreadyLinkedProd = products.find(p => p.barcode === code && p.id !== currentWizardProduct.id);
    
    if (alreadyLinkedProd) {
      setWizardWarning(`O código "${code}" já foi cadastrado para o produto "${alreadyLinkedProd.name}". Insira outro código para evitar duplicidade.`);
      setWizardSuccess(null);
      setWizardInput('');
      return;
    }

    // 2. Success path
    const updated: Product = {
      ...currentWizardProduct,
      barcode: code
    };

    onUpdateProduct(updated);

    // Record in history
    setScanHistory(prev => [
      {
        id: `hist-${Date.now()}-${Math.random()}`,
        productName: currentWizardProduct.name,
        barcode: code,
        timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        skipped: false
      },
      ...prev
    ]);

    setWizardSuccess(`Produto "${currentWizardProduct.name}" cadastrado com sucesso (${code}).`);
    setWizardWarning(null);
    setWizardInput('');

    // Advance index automatically
    if (wizardIndex < wizardProducts.length - 1) {
      setWizardIndex(prev => prev + 1);
    } else {
      alert('Todos os produtos pendentes foram processados e vinculados com sucesso.');
      setShowWizard(false);
      if (onCloseWizard) onCloseWizard();
    }
  };

  return (
    <div className="flex flex-col gap-6 w-full animate-fade-in text-xs">
      
      {/* Upper header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">Importação de Dados em Lote</h2>
          <p className="text-xs text-gray-400">Cadastre massivamente seu inventário, quadro de funcionários e parceiros fornecedores via planilha do Excel ou CSV.</p>
        </div>

        {pendingBarcodeProducts.length > 0 && (
          <button
            onClick={() => setShowWizard(true)}
            className="px-4 py-2 bg-amber-500 text-black font-extrabold rounded-lg flex items-center gap-2 hover:bg-amber-400 transition-all active:scale-95 cursor-pointer"
          >
            <Barcode className="w-4 h-4 animate-pulse" />
            Assistente de Código de Barras ({pendingBarcodeProducts.length})
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-800/20" style={{ borderColor: theme === 'dark' ? '#1A1A1A' : '#E5E5E5' }}>
        <button
          onClick={() => {
            setActiveTab('produtos');
            setStats(null);
            setParseError(null);
            setSuccessMessage(null);
          }}
          className={`pb-2.5 px-3 font-bold transition-all border-b-2 cursor-pointer ${
            activeTab === 'produtos'
              ? (theme === 'dark' ? 'border-[#18F2A4] text-white' : 'border-[#10B981] text-[#10B981]')
              : 'border-transparent text-gray-400 hover:text-gray-300'
          }`}
        >
          <div className="flex items-center gap-1.5">
            <Layers className="w-4 h-4" />
            Produtos / Bebidas
          </div>
        </button>

        <button
          onClick={() => {
            setActiveTab('funcionarios');
            setStats(null);
            setParseError(null);
            setSuccessMessage(null);
          }}
          className={`pb-2.5 px-3 font-bold transition-all border-b-2 cursor-pointer ${
            activeTab === 'funcionarios'
              ? (theme === 'dark' ? 'border-[#18F2A4] text-white' : 'border-[#10B981] text-[#10B981]')
              : 'border-transparent text-gray-400 hover:text-gray-300'
          }`}
        >
          <div className="flex items-center gap-1.5">
            <UserCheck className="w-4 h-4" />
            Funcionários (PIN / Cargos)
          </div>
        </button>

        <button
          onClick={() => {
            setActiveTab('fornecedores');
            setStats(null);
            setParseError(null);
            setSuccessMessage(null);
          }}
          className={`pb-2.5 px-3 font-bold transition-all border-b-2 cursor-pointer ${
            activeTab === 'fornecedores'
              ? (theme === 'dark' ? 'border-[#18F2A4] text-white' : 'border-[#10B981] text-[#10B981]')
              : 'border-transparent text-gray-400 hover:text-gray-300'
          }`}
        >
          <div className="flex items-center gap-1.5">
            <Truck className="w-4 h-4" />
            Fornecedores
          </div>
        </button>
      </div>

      {/* Main split grid: Uploader + Instructions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Box 1: File Uploader Card */}
        <div className={`p-6 rounded-xl border flex flex-col gap-4 lg:col-span-2 ${
          theme === 'dark' ? 'bg-[#111111] border-[#1A1A1A]' : 'bg-white border-gray-200'
        }`}>
          <span className="font-extrabold uppercase tracking-widest text-[10px] text-gray-400">1. Upload do Arquivo</span>

          {/* Interactive Drag zone */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center gap-3 transition-all cursor-pointer ${
              dragOver 
                ? (theme === 'dark' ? 'border-[#18F2A4] bg-[#18F2A4]/5' : 'border-emerald-500 bg-emerald-500/5')
                : (theme === 'dark' ? 'border-gray-800 hover:border-gray-700 bg-black/20' : 'border-gray-300 hover:border-gray-400 bg-gray-50')
            }`}
            onClick={() => document.getElementById('file-upload-input')?.click()}
          >
            <input
              id="file-upload-input"
              type="file"
              accept=".xlsx,.xls,.csv"
              className="hidden"
              onChange={handleFileChange}
            />
            <div className={`p-3 rounded-full ${theme === 'dark' ? 'bg-[#1C1C1C]' : 'bg-white shadow-sm'}`}>
              <Upload className={`w-6 h-6 ${theme === 'dark' ? 'text-[#18F2A4]' : 'text-emerald-500'}`} />
            </div>
            <div className="text-center">
              <span className="font-bold text-xs block">Arraste seu arquivo Excel / CSV aqui</span>
              <span className="text-[10px] text-gray-400 mt-1 block">ou clique para navegar nos seus arquivos locais</span>
            </div>
          </div>

          {/* Error and Success Notifications */}
          {parseError && (
            <div className="p-3.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold block text-[11px]">Falha na leitura do arquivo</span>
                <p className="text-[10px] text-gray-400 mt-0.5">{parseError}</p>
              </div>
            </div>
          )}

          {successMessage && (
            <div className="p-3.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-start gap-2.5">
              <Check className="w-4 h-4 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold block text-[11px]">Dados Gravados</span>
                <p className="text-[10px] text-gray-400 mt-0.5">{successMessage}</p>
              </div>
            </div>
          )}

          {/* Preview Panel if parsed data is loaded */}
          {stats && (
            <div className={`p-4 rounded-xl border flex flex-col gap-3 mt-2 ${
              theme === 'dark' ? 'bg-[#0A0A0A] border-gray-900' : 'bg-gray-50 border-gray-200'
            }`}>
              <div className="flex justify-between items-center border-b pb-2" style={{ borderColor: theme === 'dark' ? '#1A1A1A' : '#E5E5E5' }}>
                <span className="font-bold text-[11px]">Resumo do arquivo importado</span>
                <span className="text-[10px] text-gray-400">Confirme as informações abaixo</span>
              </div>

              <div className="grid grid-cols-3 gap-3 text-center">
                <div className={`p-2.5 rounded-lg border ${theme === 'dark' ? 'bg-[#111111] border-[#1C1C1C]' : 'bg-white border-gray-200'}`}>
                  <span className="text-gray-400 block text-[9px] uppercase font-bold">Total Encontrado</span>
                  <span className="text-lg font-mono font-bold">{stats.total}</span>
                </div>
                <div className={`p-2.5 rounded-lg border ${theme === 'dark' ? 'bg-[#111111] border-[#1C1C1C]' : 'bg-white border-gray-200'}`}>
                  <span className={`text-[9px] uppercase font-bold block ${theme === 'dark' ? 'text-emerald-400' : 'text-emerald-600'}`}>Prontos p/ Cadastrar</span>
                  <span className={`text-lg font-mono font-bold ${theme === 'dark' ? 'text-emerald-400' : 'text-emerald-700'}`}>{stats.valid}</span>
                </div>
                <div className={`p-2.5 rounded-lg border ${theme === 'dark' ? 'bg-[#111111] border-[#1C1C1C]' : 'bg-white border-gray-200'}`}>
                  <span className={`text-[9px] uppercase font-bold block ${theme === 'dark' ? 'text-amber-400' : 'text-amber-600'}`}>Duplicados/Ignorados</span>
                  <span className={`text-lg font-mono font-bold ${theme === 'dark' ? 'text-amber-400' : 'text-amber-700'}`}>{stats.duplicates}</span>
                </div>
              </div>

              {/* Warnings on new categories */}
              {activeTab === 'produtos' && newCategoriesToRegister.length > 0 && (
                <div className={`p-2.5 rounded border ${
                  theme === 'dark' 
                    ? 'bg-[#18F2A4]/5 border-[#18F2A4]/10 text-[#18F2A4]' 
                    : 'bg-emerald-50 border-emerald-200 text-emerald-800'
                }`}>
                  <span className="font-bold text-[10px] flex items-center gap-1">Novas Categorias Detectadas ({newCategoriesToRegister.length}):</span>
                  <p className={`text-[9px] mt-1 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                    Serão cadastradas automaticamente: <span className={`font-mono font-bold ${theme === 'dark' ? 'text-white' : 'text-emerald-950'}`}>{newCategoriesToRegister.join(', ')}</span>
                  </p>
                </div>
              )}

              {/* Data Table Preview Row limit */}
              <div className="overflow-x-auto max-h-48 border border-gray-800/10 rounded">
                <table className="w-full text-[10px] text-left">
                  <thead>
                    <tr className={`border-b ${theme === 'dark' ? 'bg-[#141414] border-gray-900 text-gray-400' : 'bg-gray-100 border-gray-200'}`}>
                      <th className="p-2">Nome / Razão</th>
                      {activeTab === 'produtos' && <th className="p-2">Categoria</th>}
                      {activeTab === 'produtos' && <th className="p-2 text-right">Venda</th>}
                      {activeTab === 'produtos' && <th className="p-2">Cod. Barras</th>}
                      {activeTab === 'funcionarios' && <th className="p-2">PIN</th>}
                      {activeTab === 'funcionarios' && <th className="p-2">Cargo</th>}
                      {activeTab === 'fornecedores' && <th className="p-2">WhatsApp</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {activeTab === 'produtos' && previewProducts.slice(0, 5).map((p, idx) => (
                      <tr key={idx} className="border-b border-gray-800/5">
                        <td className="p-2 font-semibold truncate max-w-[150px]">{p.name}</td>
                        <td className="p-2">{p.category}</td>
                        <td className="p-2 text-right font-mono font-bold">R$ {p.sellPrice.toFixed(2)}</td>
                        <td className="p-2 text-gray-400 font-mono">{p.barcode || <span className="text-amber-500 italic">Pendente scan</span>}</td>
                      </tr>
                    ))}
                    {activeTab === 'funcionarios' && previewUsers.slice(0, 5).map((u, idx) => (
                      <tr key={idx} className="border-b border-gray-800/5">
                        <td className="p-2 font-semibold">{u.name}</td>
                        <td className="p-2 font-mono">{u.pin}</td>
                        <td className="p-2 text-gray-400 uppercase font-bold text-[9px]">{u.role}</td>
                      </tr>
                    ))}
                    {activeTab === 'fornecedores' && previewSuppliers.slice(0, 5).map((s, idx) => (
                      <tr key={idx} className="border-b border-gray-800/5">
                        <td className="p-2 font-semibold">{s.companyName}</td>
                        <td className="p-2 font-mono">{s.whatsapp || 'N/A'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {(activeTab === 'produtos' ? previewProducts.length : activeTab === 'funcionarios' ? previewUsers.length : previewSuppliers.length) > 5 && (
                  <div className="p-1.5 text-center text-[9px] text-gray-500">
                    ... e mais {(activeTab === 'produtos' ? previewProducts.length : activeTab === 'funcionarios' ? previewUsers.length : previewSuppliers.length) - 5} linhas.
                  </div>
                )}
              </div>

              {/* Action trigger button */}
              <button
                type="button"
                onClick={handleConfirmImport}
                disabled={stats.valid === 0}
                className={`w-full py-2.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2 ${
                  stats.valid === 0 
                    ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
                    : (theme === 'dark' ? 'bg-[#18F2A4] text-black hover:bg-[#12d58f]' : 'bg-[#10B981] text-white hover:bg-[#0e9f6e]')
                }`}
              >
                <Check className="w-4 h-4" />
                Gravar {stats.valid} Cadastros no Sistema
              </button>
            </div>
          )}
        </div>

        {/* Box 2: Column Layout Instructions and Downloads */}
        <div className={`p-6 rounded-xl border flex flex-col gap-5 ${
          theme === 'dark' ? 'bg-[#111111] border-[#1A1A1A]' : 'bg-white border-gray-200'
        }`}>
          <div className="flex flex-col gap-1">
            <span className="font-extrabold uppercase tracking-widest text-[10px] text-gray-400">Instruções Importantes</span>
            <span className="text-gray-400 text-[10px]">Baixe as planilhas modelos para ver as colunas corretas.</span>
          </div>

          <button
            type="button"
            onClick={() => handleDownloadTemplate(activeTab)}
            className={`p-3 rounded-lg border text-left flex items-center justify-between gap-3 transition-all hover:scale-[1.01] cursor-pointer ${
              theme === 'dark' ? 'bg-black/30 border-gray-800 hover:bg-black/50' : 'bg-gray-50 border-gray-250 hover:bg-gray-100 shadow-xs'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <FileSpreadsheet className="w-5 h-5 text-emerald-400 shrink-0" />
              <div className="flex flex-col text-left">
                <span className="font-bold text-[11px]" style={{ color: theme === 'dark' ? '#FFF' : '#333' }}>
                  Download de Modelo
                </span>
                <span className="text-[10px] text-gray-500 capitalize">Template {activeTab}.xlsx</span>
              </div>
            </div>
            <Download className="w-4 h-4 text-gray-400" />
          </button>

          <div className="flex flex-col gap-3">
            <span className="text-gray-400 font-bold uppercase text-[9px]">Topologia Flexível de Dados</span>
            
            <ul className="space-y-2.5 text-[10px] text-gray-400">
              <li className="flex gap-2 items-start">
                <span className={`p-0.5 rounded text-[8px] font-bold font-mono mt-0.5 ${
                  theme === 'dark' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-emerald-100 text-emerald-800'
                }`}>OK</span>
                <span className={theme === 'dark' ? 'text-gray-400' : 'text-gray-700'}><strong>Categorias auto-criadas</strong>: Se adicionar uma categoria que não existe na planilha de produtos, ela é registrada em tempo real.</span>
              </li>
              <li className="flex gap-2 items-start">
                <span className={`p-0.5 rounded text-[8px] font-bold font-mono mt-0.5 ${
                  theme === 'dark' ? 'bg-amber-500/20 text-amber-400' : 'bg-amber-100 text-amber-800'
                }`}>WARN</span>
                <span className={theme === 'dark' ? 'text-gray-400' : 'text-gray-700'}><strong>Código de barras ausente</strong>: Produtos com código de barras vazio serão importados normalmente e adicionados ao Assistente de Escaneamento rápido.</span>
              </li>
              <li className="flex gap-2 items-start">
                <span className={`p-0.5 rounded text-[8px] font-bold font-mono mt-0.5 ${
                  theme === 'dark' ? 'bg-red-500/20 text-red-400' : 'bg-red-100 text-red-800'
                }`}>DUPLIC</span>
                <span className={theme === 'dark' ? 'text-gray-400' : 'text-gray-700'}><strong>Segurança duplicados</strong>: Itens com nomes, PINs de funcionários ou códigos de barras idênticos aos cadastrados serão pulados automaticamente para segurança contábil.</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Barcode Scanning Wizard Dialog (Modal overlay) */}
      {showWizard && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in"
          onClick={handleWizardClick}
        >
          <div 
            className={`w-full max-w-lg rounded-2xl border flex flex-col shadow-2xl relative overflow-hidden transition-all duration-300 ${
              theme === 'dark' ? 'bg-[#0A0A0A] border-[#1C1C1C] text-white' : 'bg-white border-gray-200 text-[#111111]'
            }`}
            onClick={(e) => e.stopPropagation()} // Prevent losing focus inside modal
          >
            {/* Modal top bar */}
            <div className={`p-4 border-b flex justify-between items-center ${
              theme === 'dark' ? 'border-[#1C1C1C]' : 'border-gray-100'
            }`}>
              <div className="flex items-center gap-2">
                <Barcode className="w-5 h-5 text-amber-500 animate-pulse" />
                <span className="font-bold text-sm tracking-tight">Assistente de Escaneamento Rápido</span>
              </div>
              <button
                onClick={() => {
                  setShowWizard(false);
                  if (onCloseWizard) onCloseWizard();
                }}
                className="text-gray-400 hover:text-red-400 transition-colors cursor-pointer"
                title="Pausar fluxo"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal scroll area */}
            <div className="p-5 flex flex-col gap-4 overflow-y-auto max-h-[70vh]">
              {wizardProducts.length === 0 ? (
                <div className="flex flex-col items-center justify-center gap-3 py-10 text-center">
                  <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-full">
                    <Check className="w-8 h-8" />
                  </div>
                  <div>
                    <span className="font-bold text-xs block text-emerald-400">Tudo Pronto e Atualizado!</span>
                    <span className="text-[10px] text-gray-500 mt-1 block max-w-xs leading-relaxed">
                      Não existem produtos ativos com códigos de barras faltantes no inventário da adega.
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setShowWizard(false);
                      if (onCloseWizard) onCloseWizard();
                    }}
                    className={`mt-2 px-4 py-1.5 text-[10px] rounded font-bold ${
                      theme === 'dark' ? 'bg-[#1C1C1C] text-gray-300 hover:bg-gray-800' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    Fechar Janela
                  </button>
                </div>
              ) : (
                <>
                  <div className="flex justify-between items-center text-[10px] text-gray-400">
                    <span className="font-mono font-bold">Lote: {wizardIndex + 1} de {wizardProducts.length} itens pendentes</span>
                    <span className="font-mono">Progresso: {Math.round(((wizardIndex) / wizardProducts.length) * 100)}%</span>
                  </div>

                  {/* Progress bar */}
                  <div className={`w-full h-1.5 rounded-full overflow-hidden ${theme === 'dark' ? 'bg-gray-900' : 'bg-gray-100'}`}>
                    <div 
                      className="bg-amber-500 h-full transition-all duration-300"
                      style={{ width: `${((wizardIndex + 1) / wizardProducts.length) * 100}%` }}
                    />
                  </div>

                  {/* HIGH FOCUS PRODUCT CARD */}
                  {currentWizardProduct && (
                    <div className={`p-5 rounded-2xl border-2 flex flex-col items-center text-center gap-2 relative ${
                      theme === 'dark' 
                        ? 'bg-black/50 border-amber-500/20 shadow-[0_0_15px_rgba(245,158,11,0.05)]' 
                        : 'bg-amber-500/5 border-amber-500/20 shadow-xs'
                    }`}>
                      <span className="p-1 px-2.5 rounded-full bg-amber-500/10 text-amber-500 text-[8px] font-extrabold uppercase tracking-widest">
                        Escanear agora
                      </span>
                      <h3 className="text-base font-extrabold tracking-tight mt-1" style={{ color: theme === 'dark' ? '#FFF' : '#000' }}>
                        {currentWizardProduct.name}
                      </h3>
                      <div className="flex gap-4 text-[10px] mt-0.5">
                        <span className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>Categoria: <strong className={`font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{currentWizardProduct.category}</strong></span>
                        <span className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>SKU: <strong className={`font-mono font-bold ${theme === 'dark' ? 'text-gray-300' : 'text-gray-800'}`}>{currentWizardProduct.sku}</strong></span>
                      </div>

                      {/* Optical Scanner simulated target */}
                      <div className="relative w-full max-w-[280px] mt-4 flex flex-col gap-2">
                        {/* Invisible/beauty input to capture scanner */}
                        <input
                          ref={scanInputRef}
                          type="text"
                          value={wizardInput}
                          onChange={(e) => setWizardInput(e.target.value)}
                          onKeyDown={handleWizardInputKeyDown}
                          placeholder="Aproxime o leitor do produto..."
                          className={`w-full p-2.5 text-center text-xs font-mono font-bold tracking-widest rounded-lg border focus:outline-none transition-all ${
                            theme === 'dark' 
                              ? 'bg-[#080808] border-amber-500/30 text-amber-400 focus:border-amber-400' 
                              : 'bg-white border-amber-500/30 text-amber-700 focus:border-amber-500 shadow-inner'
                          }`}
                          autoFocus
                        />
                        <span className="text-[9px] text-gray-500 flex justify-center items-center gap-1">
                          <Keyboard className="w-3 h-3" />
                          Simulador de leitor óptico (digite o código e aperte Enter)
                        </span>
                      </div>
                    </div>
                  )}

                  {/* DUPLICATE WARNINGS & SUCCESS FEEDBACK */}
                  {wizardWarning && (
                    <div className={`p-4 rounded-xl border-2 text-xs leading-relaxed animate-pulse flex gap-3 items-start shadow-lg ${
                      theme === 'dark' 
                        ? 'bg-red-500/10 border-red-500/30 text-red-400' 
                        : 'bg-red-50 border-red-200 text-red-800'
                     }`}>
                      <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-extrabold block uppercase tracking-wider text-[10px]">Alerta de Duplicidade</span>
                        <p className={`mt-0.5 text-[10px] ${theme === 'dark' ? 'text-gray-300' : 'text-red-900/85'}`}>{wizardWarning}</p>
                      </div>
                    </div>
                  )}

                  {wizardSuccess && (
                    <div className={`p-4 rounded-xl border-2 text-xs leading-relaxed animate-fade-in flex gap-3 items-start shadow-lg ${
                      theme === 'dark' 
                        ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' 
                        : 'bg-emerald-50 border-emerald-200 text-emerald-800'
                    }`}>
                      <Check className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-extrabold block uppercase tracking-wider text-[10px]">Produto Confirmado e Salvo</span>
                        <p className={`mt-0.5 text-[10px] ${theme === 'dark' ? 'text-gray-300' : 'text-emerald-950'}`}>{wizardSuccess}</p>
                      </div>
                    </div>
                  )}

                  {/* NO BARCODE SHORTCUT BUTTON (SPACEBAR / ENTER CAPABLE) */}
                  <div className={`p-4 rounded-xl border flex flex-col sm:flex-row gap-3 justify-between items-center transition-all ${
                    theme === 'dark' ? 'bg-[#111] border-gray-900' : 'bg-gray-50 border-gray-200'
                  }`}>
                    <div className="text-left">
                      <span className="font-bold block text-[10px] uppercase text-amber-500 tracking-wider">Não possui código de barras?</span>
                      <span className={`text-[9px] ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Aperte <kbd className={`p-0.5 px-1 rounded text-[8px] font-mono font-bold ${theme === 'dark' ? 'bg-zinc-800 text-white' : 'bg-gray-200 text-gray-800 border border-gray-300'}`}>ENTER</kbd> ou <kbd className={`p-0.5 px-1 rounded text-[8px] font-mono font-bold ${theme === 'dark' ? 'bg-zinc-800 text-white' : 'bg-gray-200 text-gray-800 border border-gray-300'}`}>ESPAÇO</kbd> com o campo vazio, ou clique ao lado:</span>
                    </div>

                    <button
                      type="button"
                      onClick={handleMarkNoBarcode}
                      className={`px-4 py-2.5 rounded-lg font-bold flex items-center gap-1.5 transition-all shadow-md active:scale-95 cursor-pointer text-xs w-full sm:w-auto justify-center ${
                        theme === 'dark' 
                          ? 'bg-[#1C1C1C] text-white hover:bg-zinc-800 border border-zinc-700' 
                          : 'bg-white border border-gray-300 text-gray-800 hover:bg-gray-100'
                      }`}
                    >
                      <span className={`p-1 px-1.5 text-[8px] font-mono rounded font-bold ${
                        theme === 'dark' ? 'bg-black/40 text-gray-400' : 'bg-gray-100 text-gray-600'
                      }`}>ESPAÇO / ENTER</span>
                      Sem Código de Barras
                    </button>
                  </div>

                  {/* SESSION SCAN HISTORY LOG */}
                  {scanHistory.length > 0 && (
                    <div className="flex flex-col gap-1.5 mt-1 text-left">
                      <span className={`font-extrabold uppercase text-[9px] tracking-wider flex items-center gap-1 ${
                        theme === 'dark' ? 'text-emerald-500' : 'text-emerald-700'
                      }`}>
                        <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping shrink-0" />
                        Histórico desta Sessão (Salvos em Tempo Real):
                      </span>
                      <div className={`max-h-24 overflow-y-auto pr-1 flex flex-col gap-1 border rounded-lg p-1.5 ${
                        theme === 'dark' ? 'border-emerald-500/10 bg-emerald-500/5' : 'border-emerald-200 bg-emerald-50/50'
                      }`}>
                        {scanHistory.map((item) => (
                          <div 
                            key={item.id} 
                            className={`p-1 px-2 text-[9px] rounded flex justify-between items-center border ${
                              theme === 'dark' 
                                ? 'bg-emerald-950/20 text-emerald-300 border-emerald-500/10' 
                                : 'bg-white text-emerald-900 border-emerald-100 shadow-2xs'
                            }`}
                          >
                            <span className="truncate max-w-[240px] font-semibold flex items-center gap-1">
                              <Check className="w-3 h-3 text-[#18F2A4]" /> {item.productName}
                            </span>
                            <div className="flex items-center gap-2 shrink-0 font-mono text-[8px] text-gray-400">
                              <span className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>{item.barcode}</span>
                              <span className={`${theme === 'dark' ? 'text-emerald-500' : 'text-emerald-700'} font-bold`}>{item.timestamp}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* List preview of all upcoming missing barcode items */}
                  <div className="flex flex-col gap-1 mt-1 text-left">
                    <span className="text-gray-500 font-bold uppercase text-[9px] tracking-wider">Fila de Pendentes Restantes ({wizardProducts.length - wizardIndex} itens):</span>
                    <div className={`max-h-24 overflow-y-auto pr-1 flex flex-col gap-1 border rounded-lg p-1 ${
                      theme === 'dark' ? 'border-gray-800/10 bg-black/10' : 'border-gray-200 bg-gray-50'
                    }`}>
                      {wizardProducts.slice(wizardIndex).map((p, i) => (
                        <div 
                          key={p.id} 
                          className={`p-1.5 px-2.5 text-[10px] rounded flex justify-between items-center ${
                            i === 0 
                              ? (theme === 'dark' 
                                  ? 'bg-amber-500/10 text-amber-400 font-bold border border-amber-500/20 animate-pulse' 
                                  : 'bg-amber-100 text-amber-900 font-bold border border-amber-200 animate-pulse')
                              : (theme === 'dark' ? 'text-gray-500' : 'text-gray-600')
                          }`}
                        >
                          <span className="truncate max-w-[280px]">{i === 0 ? '▶ ' : ''}{p.name}</span>
                          <span className={`text-[8px] font-mono ${theme === 'dark' ? 'text-gray-600' : 'text-gray-500'}`}>{p.sku}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Modal Footer Controls */}
            <div className={`p-4 border-t flex justify-between items-center ${
              theme === 'dark' ? 'border-[#1C1C1C]' : 'border-gray-100'
            }`}>
              <span className="text-[9px] text-gray-500 italic max-w-[240px]">
                Você pode fechar a qualquer momento. Suas alterações já foram salvas em tempo real.
              </span>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowWizard(false);
                    if (onCloseWizard) onCloseWizard();
                  }}
                  className={`px-4 py-1.5 rounded font-bold text-[11px] cursor-pointer transition-all ${
                    theme === 'dark' ? 'bg-[#141414] text-gray-300 hover:bg-zinc-900 border border-[#222]' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  Continuar Depois
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
