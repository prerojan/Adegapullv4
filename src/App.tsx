import React, { useState, useMemo, useEffect } from 'react';
import { 
  BarChart3, Package, Layers, FileDown, Receipt, ShieldAlert, Key, 
  Settings, ShoppingCart, User, Landmark, Sun, Moon, Sparkles, Monitor, Tablet, Truck, HelpCircle, Users,
  ChefHat, LogOut, Menu, FileSpreadsheet, Barcode, Play, Bell, AlertTriangle
} from 'lucide-react';

import { Product, Supplier, Sale, FinancialTransaction, TableComandaState, CashierUser, Shift } from './types';
import { 
  INITIAL_PRODUCTS, MOCK_SALES, INITIAL_SUPPLIERS, 
  INITIAL_TABLES_COMANDAS, INITIAL_CASHIER_USERS 
} from './data/mockData';

import {
  fetchProductsFromDb,
  saveProductToDb,
  fetchSalesFromDb,
  saveSaleToDb,
  fetchSuppliersFromDb,
  saveSupplierToDb,
  deleteSupplierFromDb,
  fetchTransactionsFromDb,
  saveTransactionToDb,
  deleteTransactionFromDb,
  fetchTablesComandasFromDb,
  saveTableComandaToDb,
  deleteTableComandaFromDb,
  fetchUsersFromDb,
  saveUserToDb,
  deleteUserFromDb,
  isFirebaseEnabled,
  subscribeProducts,
  subscribeSales,
  subscribeSuppliers,
  subscribeTransactions,
  subscribeTablesComandas,
  subscribeUsers
} from './lib/firebase';


// Import subcomponents
import QuickSaleSidebar from './components/QuickSaleSidebar';
import ManagerDashboard from './components/ManagerDashboard';
import ManagerProducts from './components/ManagerProducts';
import ManagerInventory from './components/ManagerInventory';
import ManagerSales from './components/ManagerSales';
import ManagerSuppliers from './components/ManagerSuppliers';
import ManagerPurchases from './components/ManagerPurchases';
import ManagerFinancial from './components/ManagerFinancial';
import ManagerReports from './components/ManagerReports';
import ManagerSettings from './components/ManagerSettings';
import OrderApp from './components/OrderApp';
import LoginScreen from './components/LoginScreen';
import ProductionPanel from './components/ProductionPanel';
import LandingPage from './components/LandingPage';
import AdminPanel from './components/AdminPanel';
import ManagerImportPortal from './components/ManagerImportPortal';
import ThermalPrinterControlModal from './components/ThermalPrinterControlModal';

export default function App() {
  // Global Shared States
  const [products, setProducts] = useState<Product[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [financialTransactions, setFinancialTransactions] = useState<FinancialTransaction[]>([]);
  const [tablesComandas, setTablesComandas] = useState<TableComandaState[]>([]);
  const [usersList, setUsersList] = useState<CashierUser[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [startWizardOnMount, setStartWizardOnMount] = useState<boolean>(false);

  // Custom styled dialogs states
  const [customAlert, setCustomAlert] = useState<{
    message: string;
    type?: 'info' | 'success' | 'warning' | 'error';
    onClose?: () => void;
  } | null>(null);

  const [customConfirm, setCustomConfirm] = useState<{
    message: string;
    onConfirm: () => void;
    onCancel?: () => void;
  } | null>(null);

  useEffect(() => {
    // Override standard alert to use our premium custom modal alert!
    (window as any).alert = (message: string, type: 'info' | 'success' | 'warning' | 'error' = 'info', onClose?: () => void) => {
      setCustomAlert({ message, type, onClose });
    };

    // Expose our beautiful confirmation modal trigger
    (window as any).confirmModal = (message: string, onConfirm: () => void, onCancel?: () => void) => {
      setCustomConfirm({ message, onConfirm, onCancel });
    };
  }, []);

  // Dynamic Curva ABC calculation based on sales history (last 30 days)
  const productsWithAbc = useMemo(() => {
    if (!products || products.length === 0) return [];
    
    // 1. Calculate sales of each product in the last 30 days
    const salesByProduct: { [id: string]: number } = {};
    sales.forEach(sale => {
      if (sale.status === 'cancelado') return;
      sale.items.forEach(item => {
        salesByProduct[item.productId] = (salesByProduct[item.productId] || 0) + (item.quantity * item.unitPrice);
      });
    });
    
    // 2. Sort active products by total revenue descending
    const sortedActiveProds = [...products]
      .filter(p => p.active)
      .map(p => ({
        id: p.id,
        revenue: salesByProduct[p.id] || 0
      }))
      .sort((a, b) => b.revenue - a.revenue);
      
    const totalRevenue = sortedActiveProds.reduce((acc, curr) => acc + curr.revenue, 0);
    
    // 3. Classify:
    // Curva A: Top 70% of cumulative revenue
    // Curva B: Next 20% (up to 90%)
    // Curva C: Last 10% (or products with 0 sales)
    let cumulative = 0;
    const abcMap: { [id: string]: 'A' | 'B' | 'C' } = {};
    
    sortedActiveProds.forEach(item => {
      if (totalRevenue === 0) {
        abcMap[item.id] = 'C';
        return;
      }
      cumulative += item.revenue;
      const percentage = (cumulative / totalRevenue) * 100;
      if (percentage <= 70) {
        abcMap[item.id] = 'A';
      } else if (percentage <= 90) {
        abcMap[item.id] = 'B';
      } else {
        abcMap[item.id] = 'C';
      }
    });
    
    return products.map(p => ({
      ...p,
      abcClass: abcMap[p.id] || 'C'
    }));
  }, [products, sales]);

  // Shift & Cash Drawer States
  const [activeShift, setActiveShift] = useState<Shift | null>(() => {
    try {
      const stored = localStorage.getItem('adegaos_active_shift');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  const [shiftHistory, setShiftHistory] = useState<Shift[]>(() => {
    try {
      const stored = localStorage.getItem('adegaos_shift_history');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    if (activeShift) {
      localStorage.setItem('adegaos_active_shift', JSON.stringify(activeShift));
    } else {
      localStorage.removeItem('adegaos_active_shift');
    }
  }, [activeShift]);

  useEffect(() => {
    localStorage.setItem('adegaos_shift_history', JSON.stringify(shiftHistory));
  }, [shiftHistory]);

  const handleOpenShift = (openedBy: string, initialBalance: number) => {
    const newShift: Shift = {
      id: `shift-${Date.now()}`,
      isOpen: true,
      openTime: new Date().toISOString(),
      openedBy,
      initialBalance,
      cashSales: 0,
      otherSales: { pix: 0, card: 0, debt: 0 },
      sangrias: [],
      suprimentos: []
    };
    setActiveShift(newShift);

    // Register opening inflow transaction
    const openingTx: FinancialTransaction = {
      id: `tx-${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
      type: 'receita',
      category: 'Outros',
      description: `Abertura de Caixa (Fundo de Troco) - Operador: ${openedBy}`,
      value: initialBalance,
      paymentMethod: 'dinheiro',
      status: 'pago'
    };
    handleAddFinancial(openingTx);
  };

  const handleSangria = (amount: number, reason: string) => {
    if (!activeShift) return;
    const newSangria = {
      id: `sangria-${Date.now()}`,
      timestamp: new Date().toISOString(),
      amount,
      reason
    };
    setActiveShift(prev => {
      if (!prev) return null;
      return {
        ...prev,
        sangrias: [...prev.sangrias, newSangria]
      };
    });

    // Register outflow transaction in financials
    const sangriaTx: FinancialTransaction = {
      id: `tx-${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
      type: 'despesa',
      category: 'Despesas Variáveis',
      description: `Sangria: ${reason}`,
      value: amount,
      paymentMethod: 'dinheiro',
      status: 'pago'
    };
    handleAddFinancial(sangriaTx);
  };

  const handleSuprimento = (amount: number, reason: string) => {
    if (!activeShift) return;
    const newSuprimento = {
      id: `suprimento-${Date.now()}`,
      timestamp: new Date().toISOString(),
      amount,
      reason
    };
    setActiveShift(prev => {
      if (!prev) return null;
      return {
        ...prev,
        suprimentos: [...prev.suprimentos, newSuprimento]
      };
    });

    // Register inflow transaction in financials
    const suprimentoTx: FinancialTransaction = {
      id: `tx-${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
      type: 'receita',
      category: 'Outros',
      description: `Suprimento: ${reason}`,
      value: amount,
      paymentMethod: 'dinheiro',
      status: 'pago'
    };
    handleAddFinancial(suprimentoTx);
  };

  const handleCloseShift = (countedAmount: number, notes: string) => {
    if (!activeShift) return;

    const totalSangrias = activeShift.sangrias.reduce((acc, s) => acc + s.amount, 0);
    const totalSuprimentos = activeShift.suprimentos.reduce((acc, s) => acc + s.amount, 0);
    const expectedCash = activeShift.initialBalance + activeShift.cashSales + totalSuprimentos - totalSangrias;
    const discrepancy = countedAmount - expectedCash;

    const closedShift: Shift = {
      ...activeShift,
      isOpen: false,
      closeTime: new Date().toISOString(),
      closingCashCounted: countedAmount,
      discrepancy,
      notes
    };

    setShiftHistory(prev => [closedShift, ...prev]);
    setActiveShift(null);

    // If there's discrepancy, record in financials to keep it aligned!
    if (Math.abs(discrepancy) >= 0.01) {
      const isSobra = discrepancy > 0;
      const adjustmentTx: FinancialTransaction = {
        id: `tx-${Date.now()}`,
        date: new Date().toISOString().split('T')[0],
        type: isSobra ? 'receita' : 'despesa',
        category: isSobra ? 'Outros' : 'Despesas Variáveis',
        description: `Ajuste de Diferença de Caixa: ${isSobra ? 'Sobra' : 'Falta'} no Fechamento. Obs: ${notes || 'Nenhuma'}`,
        value: Math.abs(discrepancy),
        paymentMethod: 'dinheiro',
        status: 'pago'
      };
      handleAddFinancial(adjustmentTx);
    }
  };

  // Active user inside the Manager
  const [currentUser, setCurrentUser] = useState<CashierUser | null>(() => {
    try {
      const stored = localStorage.getItem('cashier_session_user');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  // Product Shell Layout controls
  const [activeProductView, setActiveProductView] = useState<'manager' | 'order' | 'production' | 'landing' | 'admin'>(() => {
    try {
      const savedView = localStorage.getItem('adegaos_active_view');
      if (savedView && ['manager', 'order', 'production', 'landing', 'admin'].includes(savedView)) {
        return savedView as any;
      }
    } catch {}

    try {
      const stored = localStorage.getItem('cashier_session_user');
      if (stored) {
        const user = JSON.parse(stored);
        if (user.role === 'kitchen' || user.role === 'bar') return 'production';
        if (user.role === 'waiter') return 'order';
        return 'manager';
      }
    } catch {}

    try {
      const hasReg = localStorage.getItem('fluxos_has_registration') === 'true' || !!localStorage.getItem('adegaos_store_name');
      if (hasReg) {
        return 'manager';
      }
    } catch {}

    // If no session, default to the marketing landing page
    return 'landing';
  });

  const [managerActiveTab, setManagerActiveTab] = useState<string>(() => {
    try {
      const stored = localStorage.getItem('adegaos_manager_active_tab');
      if (stored) return stored;
    } catch {}
    return 'dashboard';
  });

  useEffect(() => {
    try {
      localStorage.setItem('adegaos_active_view', activeProductView);
    } catch {}
  }, [activeProductView]);

  useEffect(() => {
    try {
      localStorage.setItem('adegaos_manager_active_tab', managerActiveTab);
    } catch {}
  }, [managerActiveTab]);

  const [isQuickSaleOpen, setIsQuickSaleOpen] = useState<boolean>(false);
  const [appLogo, setAppLogo] = useState<string>(() => {
    return localStorage.getItem('adegaos_store_logo') || '/logo.png';
  });

  useEffect(() => {
    const updateLogo = () => {
      setAppLogo(localStorage.getItem('adegaos_store_logo') || '/logo.png');
    };
    window.addEventListener('adegaos_settings_updated', updateLogo);
    return () => window.removeEventListener('adegaos_settings_updated', updateLogo);
  }, []);

  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    try {
      const stored = localStorage.getItem('adegaos_theme');
      return (stored === 'light' || stored === 'dark') ? stored : 'dark';
    } catch {
      return 'dark';
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('adegaos_theme', theme);
    } catch {}
    const themeColor = theme === 'dark' ? '#000000' : '#FFFFFF';
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (metaThemeColor) {
      metaThemeColor.setAttribute('content', themeColor);
    }
  }, [theme]);

  // Product categories management state (customizable categories)
  const [productCategories, setProductCategories] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem('flux_product_categories');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return ['Cervejas', 'Destilados', 'Sem Álcool', 'Petiscos', 'Cigarros', 'Vinhos', 'Outros'];
  });

  useEffect(() => {
    try {
      localStorage.setItem('flux_product_categories', JSON.stringify(productCategories));
    } catch {}
  }, [productCategories]);

  // Merge any category found in existing products that isn't already in the list
  useEffect(() => {
    if (products.length > 0) {
      const uniqueCats = Array.from(new Set(products.map(p => p.category))).filter(Boolean);
      setProductCategories(prev => {
        const next = [...prev];
        let changed = false;
        uniqueCats.forEach(cat => {
          if (!next.includes(cat)) {
            next.push(cat);
            changed = true;
          }
        });
        return changed ? next : prev;
      });
    }
  }, [products]);

  const handleAddCategory = (catName: string) => {
    const trimmed = catName.trim();
    if (!trimmed) return;
    setProductCategories(prev => {
      if (prev.includes(trimmed)) return prev;
      return [...prev, trimmed];
    });
  };

  const handleRenameCategory = (oldName: string, newName: string) => {
    const trimmedNew = newName.trim();
    if (!trimmedNew || oldName === trimmedNew) return;
    setProductCategories(prev => prev.map(cat => cat === oldName ? trimmedNew : cat));

    // Update all products belonging to this category
    setProducts(prevProducts => {
      return prevProducts.map(p => {
        if (p.category === oldName) {
          const updatedProd = { ...p, category: trimmedNew };
          saveProductToDb(updatedProd);
          return updatedProd;
        }
        return p;
      });
    });
  };

  const handleDeleteCategory = (catName: string) => {
    setProductCategories(prev => prev.filter(cat => cat !== catName));

    // Move all products belonging to this category to 'Outros'
    setProducts(prevProducts => {
      return prevProducts.map(p => {
        if (p.category === catName) {
          const updatedProd = { ...p, category: 'Outros' };
          saveProductToDb(updatedProd);
          return updatedProd;
        }
        return p;
      });
    });
  };
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);
  const [scannedBarcodeTrigger, setScannedBarcodeTrigger] = useState<{ barcode: string; timestamp: number } | null>(null);

  // Monitor URL params, hashes, and hotkeys to allow reviewers/developers to bypass landing pages
  useEffect(() => {
    const handleUrlRoute = () => {
      const search = window.location.search;
      const hash = window.location.hash;
      if (search.includes('landing') || hash === '#landing' || search.includes('site') || hash === '#site') {
        setActiveProductView('landing');
      } else if (search.includes('login') || hash === '#login' || search.includes('system') || hash === '#system') {
        setActiveProductView('manager');
      } else if (search.includes('admin') || hash === '#admin') {
        setActiveProductView('admin');
      } else {
        // If no explicit route, restore saved active view or session-based view if user is logged in
        try {
          const savedView = localStorage.getItem('adegaos_active_view');
          if (savedView && ['manager', 'order', 'production', 'landing', 'admin'].includes(savedView)) {
            setActiveProductView(savedView as any);
            return;
          }

          const stored = localStorage.getItem('cashier_session_user');
          if (stored) {
            const user = JSON.parse(stored);
            if (user.role === 'kitchen' || user.role === 'bar') {
              setActiveProductView('production');
            } else if (user.role === 'waiter') {
              setActiveProductView('order');
            } else {
              setActiveProductView('manager');
            }
          } else {
            const hasReg = localStorage.getItem('fluxos_has_registration') === 'true' || !!localStorage.getItem('adegaos_store_name');
            if (hasReg) {
              setActiveProductView('manager');
            } else {
              setActiveProductView('landing');
            }
          }
        } catch (e) {
          console.error('Error reading session for route:', e);
        }
      }
    };
    handleUrlRoute();
    window.addEventListener('hashchange', handleUrlRoute);

    const handleGlobalKey = (e: KeyboardEvent) => {
      if (e.altKey && e.key.toLowerCase() === 'l') {
        e.preventDefault();
        setActiveProductView('manager');
      }
    };
    window.addEventListener('keydown', handleGlobalKey);

    return () => {
      window.removeEventListener('hashchange', handleUrlRoute);
      window.removeEventListener('keydown', handleGlobalKey);
    };
  }, []);

  // Load database on mount and subscribe to real-time updates
  useEffect(() => {
    let unsubProducts: (() => void) | null = null;
    let unsubSales: (() => void) | null = null;
    let unsubSuppliers: (() => void) | null = null;
    let unsubTransactions: (() => void) | null = null;
    let unsubTables: (() => void) | null = null;
    let unsubUsers: (() => void) | null = null;

    async function loadAllDataAndSubscribe() {
      try {
        // 1. Initial fetch (handles seeding if Firestore is empty)
        const [p, s, sup, tx, tc, u] = await Promise.all([
          fetchProductsFromDb(),
          fetchSalesFromDb(),
          fetchSuppliersFromDb(),
          fetchTransactionsFromDb(),
          fetchTablesComandasFromDb(),
          fetchUsersFromDb()
        ]);
        setProducts(p);
        setSales(s);
        setSuppliers(sup);
        setFinancialTransactions(tx);
        setTablesComandas(tc);
        setUsersList(u);
        setLoading(false);

        // 2. Subscribe to real-time changes
        unsubProducts = subscribeProducts(setProducts);
        unsubSales = subscribeSales(setSales);
        unsubSuppliers = subscribeSuppliers(setSuppliers);
        unsubTransactions = subscribeTransactions(setFinancialTransactions);
        unsubTables = subscribeTablesComandas(setTablesComandas);
        unsubUsers = subscribeUsers(setUsersList);
      } catch (err) {
        console.error("Error loading initial data and subscribing:", err);
        setLoading(false);
      }
    }

    loadAllDataAndSubscribe();

    return () => {
      if (unsubProducts) unsubProducts();
      if (unsubSales) unsubSales();
      if (unsubSuppliers) unsubSuppliers();
      if (unsubTransactions) unsubTransactions();
      if (unsubTables) unsubTables();
      if (unsubUsers) unsubUsers();
    };
  }, []);

  // Global Barcode Scanner keyboard listener
  useEffect(() => {
    if (!currentUser) return;

    let buffer = '';
    let lastKeyTime = Date.now();

    const handleKeyDown = (e: KeyboardEvent) => {
      const currentTime = Date.now();
      const timeDiff = currentTime - lastKeyTime;
      lastKeyTime = currentTime;

      // Enter usually marks the end of a barcode scan
      if (e.key === 'Enter') {
        if (buffer.length >= 2) {
          const barcode = buffer.trim();
          const matched = products.find(p => p.barcode === barcode || p.id === barcode);
          if (matched && matched.active) {
            e.preventDefault();
            setIsQuickSaleOpen(true);
            setScannedBarcodeTrigger({ barcode, timestamp: Date.now() });
          }
        }
        buffer = '';
        return;
      }

      // Ignore single modifier keys
      if (e.key.length > 1) {
        return;
      }

      // Buffer normal character input. If the gap between keystrokes is large and user is in an input field, reset the buffer
      const isInputFocused = document.activeElement?.tagName === 'INPUT' || document.activeElement?.tagName === 'TEXTAREA';
      if (timeDiff > 120 && isInputFocused) {
        buffer = e.key;
      } else {
        buffer += e.key;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [currentUser, products]);

  const handleLogin = (user: CashierUser) => {
    setCurrentUser(user);
    try {
      localStorage.setItem('cashier_session_user', JSON.stringify(user));
      localStorage.setItem('fluxos_has_registration', 'true');
    } catch (e) {
      console.error('Error saving session:', e);
    }
    if (user.role === 'kitchen' || user.role === 'bar') {
      setActiveProductView('production');
    } else if (user.role === 'waiter') {
      setActiveProductView('order');
    } else {
      setActiveProductView('manager');
      setManagerActiveTab('dashboard');
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    try {
      localStorage.removeItem('cashier_session_user');
    } catch (e) {
      console.error('Error clearing session:', e);
    }
  };

  // Shared state manipulator functions with persistence triggers
  const handleUpdateStock = (productId: string, qtyToRemove: number) => {
    setProducts(prevProducts => {
      // Create a map/lookup of the products for easy recipe resolution
      const productMap = new Map<string, Product>(prevProducts.map(p => [p.id, p]));
      
      // Let's keep track of all updates we need to make
      const updates: { [id: string]: { qtyToDeduct: number } } = {};
      
      const queue: { id: string; qty: number }[] = [{ id: productId, qty: qtyToRemove }];
      
      while (queue.length > 0) {
        const item = queue.shift()!;
        const prod = productMap.get(item.id);
        if (!prod) continue;
        
        // Add to direct updates for this product
        if (!updates[item.id]) {
          updates[item.id] = { qtyToDeduct: 0 };
        }
        updates[item.id].qtyToDeduct += item.qty;
        
        // If it is a combo/has recipe, also queue its ingredients!
        if (prod.hasTechnicalSheet && prod.recipe) {
          prod.recipe.forEach(rec => {
            queue.push({
              id: rec.ingredientProductId,
              qty: rec.quantity * item.qty
            });
          });
        }
      }
      
      // Apply the updates to products list
      const updated = prevProducts.map(p => {
        const update = updates[p.id];
        if (update && update.qtyToDeduct > 0) {
          const deductAmount = update.qtyToDeduct;
          
          // 1. Calculate new boxes/units
          let targetBoxes = p.stockBoxes;
          let targetUnits = p.stockUnits - deductAmount;

          while (targetUnits < 0 && targetBoxes > 0) {
            targetBoxes -= 1;
            targetUnits += p.boxQuantity;
          }

          // Ensure it doesn't go below 0
          const finalBoxes = Math.max(0, targetBoxes);
          const finalUnits = Math.max(0, targetUnits);

          // 2. FIFO Batch deduction if product has batches
          let updatedBatches = p.batches ? [...p.batches] : undefined;
          if (updatedBatches && updatedBatches.length > 0) {
            // Sort batches: oldest expiration date first (FIFO/PEPS)
            updatedBatches.sort((a, b) => new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime());
            
            let remainingToDeduct = deductAmount;
            updatedBatches = updatedBatches.map(batch => {
              if (remainingToDeduct <= 0) return batch;
              
              if (batch.currentQuantity > 0) {
                const deductFromBatch = Math.min(batch.currentQuantity, remainingToDeduct);
                remainingToDeduct -= deductFromBatch;
                return {
                  ...batch,
                  currentQuantity: parseFloat((batch.currentQuantity - deductFromBatch).toFixed(3))
                };
              }
              return batch;
            });
          }

          const uProd = {
            ...p,
            stockBoxes: finalBoxes,
            stockUnits: parseFloat(finalUnits.toFixed(3)),
            batches: updatedBatches
          };
          saveProductToDb(uProd);
          return uProd;
        }
        return p;
      });
      return updated;
    });
  };

  const handleUpdateFullStock = (productId: string, boxes: number, units: number) => {
    setProducts(prev => prev.map(p => {
      if (p.id === productId) {
        const uProd = {
          ...p,
          stockBoxes: boxes,
          stockUnits: units
        };
        saveProductToDb(uProd);
        return uProd;
      }
      return p;
    }));
  };

  const handleAddSale = (sale: Sale) => {
    setSales(prev => [sale, ...prev]);
    saveSaleToDb(sale);

    // Sync with active shift
    if (activeShift && activeShift.isOpen) {
      setActiveShift(prev => {
        if (!prev) return null;
        const value = sale.total;
        let updatedCash = prev.cashSales;
        let updatedOther = { ...prev.otherSales };

        if (sale.paymentMethod === 'dinheiro') {
          updatedCash += value;
        } else if (sale.paymentMethod === 'pix') {
          updatedOther.pix += value;
        } else if (['debito', 'credito'].includes(sale.paymentMethod)) {
          updatedOther.card += value;
        } else if (sale.paymentMethod === 'fiado') {
          updatedOther.debt += value;
        } else if (sale.paymentMethod === 'dividido' && sale.paymentSplit) {
          sale.paymentSplit.forEach(sp => {
            if (sp.method === 'dinheiro') {
              updatedCash += sp.value;
            } else if (sp.method === 'pix') {
              updatedOther.pix += sp.value;
            } else if (['debito', 'credito'].includes(sp.method)) {
              updatedOther.card += sp.value;
            } else if (sp.method === 'fiado') {
              updatedOther.debt += sp.value;
            }
          });
        }

        return {
          ...prev,
          cashSales: updatedCash,
          otherSales: updatedOther
        };
      });
    }
  };

  const handleUpdateSale = (updatedSale: Sale) => {
    setSales(prev => prev.map(s => s.id === updatedSale.id ? updatedSale : s));
    saveSaleToDb(updatedSale);
  };

  const handleAddFinancial = (tx: FinancialTransaction) => {
    setFinancialTransactions(prev => [tx, ...prev]);
    saveTransactionToDb(tx);
  };

  const handleConfirmPayment = (txId: string) => {
    setFinancialTransactions(prev => prev.map(tx => {
      if (tx.id === txId) {
        const uTx = { ...tx, status: 'pago' as const };
        saveTransactionToDb(uTx);
        return uTx;
      }
      return tx;
    }));
  };

  const handleCancelSale = (saleId: string, reason: string) => {
    // Locate the sale
    const saleToCancel = sales.find(s => s.id === saleId);
    if (!saleToCancel) return;

    // 1. Mark status as canceled
    const updatedSales = sales.map(s => {
      if (s.id === saleId) {
        const uSale = { ...s, status: 'cancelado' as const, cancelReason: reason };
        saveSaleToDb(uSale);
        return uSale;
      }
      return s;
    });
    setSales(updatedSales);

    // 2. Return quantities back to physical inventory
    saleToCancel.items.forEach(item => {
      setProducts(prevProds => prevProds.map(p => {
        if (p.id === item.productId) {
          const targetUnits = p.stockUnits + item.quantity;
          const uProd = {
            ...p,
            stockUnits: targetUnits
          };
          saveProductToDb(uProd);
          return uProd;
        }
        return p;
      }));
    });

    // 3. Mark matching financial transaction as "cancelado" or delete it to keep accounting clean
    const matchingTx = financialTransactions.find(tx => tx.description === `Venda de Balcão #${saleToCancel.number}`);
    if (matchingTx) {
      deleteTransactionFromDb(matchingTx.id);
    }
    setFinancialTransactions(prev => prev.filter(tx => tx.description !== `Venda de Balcão #${saleToCancel.number}`));
  };

  const handleAddProduct = (prod: Product) => {
    setProducts(prev => [...prev, prod]);
    saveProductToDb(prod);
  };

  const handleUpdateProduct = (prod: Product) => {
    setProducts(prev => prev.map(p => p.id === prod.id ? prod : p));
    saveProductToDb(prod);
  };

  const handleAddSupplier = (sup: Supplier) => {
    setSuppliers(prev => [...prev, sup]);
    saveSupplierToDb(sup);
  };

  const handleDeleteSupplier = (id: string) => {
    setSuppliers(prev => prev.filter(s => s.id !== id));
    deleteSupplierFromDb(id);
  };

  const handleIncreaseStockBoxes = (productId: string, addedBoxes: number) => {
    setProducts(prev => prev.map(p => {
      if (p.id === productId) {
        const uProd = {
          ...p,
          stockBoxes: p.stockBoxes + addedBoxes
        };
        saveProductToDb(uProd);
        return uProd;
      }
      return p;
    }));
  };

  const handleUpdateProductCost = (productId: string, newCost: number) => {
    setProducts(prev => prev.map(p => {
      if (p.id === productId) {
        // Average costing math
        const margin = p.sellPrice > 0 ? parseFloat((((p.sellPrice - newCost) / p.sellPrice) * 100).toFixed(2)) : 0;
        const uProd = {
          ...p,
          costPrice: newCost,
          margin
        };
        saveProductToDb(uProd);
        return uProd;
      }
      return p;
    }));
  };

  const handleToggleUserActive = (userId: string) => {
    setUsersList(prev => prev.map(u => {
      if (u.id === userId) {
        const uUser = { ...u, active: !u.active };
        saveUserToDb(uUser);
        return uUser;
      }
      return u;
    }));
  };

  const handleAddUser = (user: CashierUser) => {
    setUsersList(prev => [...prev, user]);
    saveUserToDb(user);
  };

  const handleDeleteUser = (userId: string) => {
    setUsersList(prev => prev.filter(u => u.id !== userId));
    deleteUserFromDb(userId);
  };

  const handleUpdateUserRole = (userId: string, newRole: any) => {
    setUsersList(prev => prev.map(u => {
      if (u.id === userId) {
        const uUser = { ...u, role: newRole };
        saveUserToDb(uUser);
        return uUser;
      }
      return u;
    }));
  };

  const handleAddTableComandaBatch = (type: 'mesa' | 'comanda', numbers: number[]) => {
    setTablesComandas(prev => {
      const newItems: TableComandaState[] = [];
      
      numbers.forEach(num => {
        const exists = prev.some(t => t.type === type && t.number === num) || newItems.some(t => t.type === type && t.number === num);
        if (!exists) {
          const newItem: TableComandaState = {
            id: `${type}-${Date.now()}-${num}-${Math.random().toString(36).substring(2, 5)}`,
            type,
            number: num,
            status: 'livre',
            items: [],
            subtotal: 0
          };
          newItems.push(newItem);
          saveTableComandaToDb(newItem);
        }
      });

      if (newItems.length === 0) {
        alert(`Todas as ${type === 'mesa' ? 'mesas' : 'comandas'} do lote especificado já existem.`);
        return prev;
      }

      const updated = [...prev, ...newItems].sort((a, b) => {
        if (a.type !== b.type) return a.type === 'mesa' ? -1 : 1;
        return a.number - b.number;
      });

      return updated;
    });
  };

  const handleAddTableComanda = (type: 'mesa' | 'comanda', number: number) => {
    handleAddTableComandaBatch(type, [number]);
  };

  const handleRemoveTableComanda = (tableId: string) => {
    setTablesComandas(prev => {
      const item = prev.find(t => t.id === tableId);
      if (!item) return prev;
      if (item.status !== 'livre') {
        alert(`Não é possível remover a ${item.type === 'mesa' ? 'Mesa' : 'Comanda'} ${item.number} pois ela está ${item.status}.`);
        return prev;
      }
      deleteTableComandaFromDb(tableId);
      return prev.filter(t => t.id !== tableId);
    });
  };

  const handleUpdateTableItems = (tableId: string, items: any[]) => {
    setTablesComandas(prev => prev.map(tbl => {
      if (tbl.id === tableId) {
        // Recalculate subtotal based on product prices
        const subtotal = items.reduce((acc, i) => {
          const prod = products.find(p => p.id === i.productId);
          return acc + ((prod ? prod.sellPrice : 0) * i.quantity);
        }, 0);

        let newStatus = tbl.status;
        if (items.length > 0 && tbl.status === 'livre') {
          newStatus = 'ocupada';
        } else if (items.length === 0) {
          newStatus = 'livre';
        }

        const uTbl = {
          ...tbl,
          items,
          status: newStatus,
          subtotal
        };
        saveTableComandaToDb(uTbl);
        return uTbl;
      }
      return tbl;
    }));
  };

  const handleUpdateTableStatus = (tableId: string, status: 'livre' | 'ocupada' | 'fechando', tableName?: string) => {
    setTablesComandas(prev => prev.map(tbl => {
      if (tbl.id === tableId) {
        const uTbl = { 
          ...tbl, 
          status,
          tableName: status === 'livre' ? undefined : (tableName !== undefined ? tableName : tbl.tableName)
        };
        saveTableComandaToDb(uTbl);
        return uTbl;
      }
      return tbl;
    }));
  };

  const handleToggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  if (loading) {
    return (
      <div className={`min-h-screen flex flex-col items-center justify-center font-sans ${
        theme === 'dark' ? 'bg-black text-white' : 'bg-white text-black'
      }`}>
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-emerald-500/30 border-t-emerald-400 rounded-full animate-spin"></div>
          <span className="text-xs font-mono tracking-widest text-gray-500 uppercase">FluxOS carregando...</span>
        </div>
      </div>
    );
  }


  // Color theme selectors
  const themeClasses = theme === 'dark' 
    ? 'bg-[#000000] text-white scheme-dark theme-dark' 
    : 'bg-[#F8FAFC] text-slate-900 scheme-light theme-light';

  const menuItems = [
    { id: 'dashboard', name: 'Painel Executivo', icon: BarChart3 },
    { id: 'produtos', name: 'Cadastro de Produtos', icon: Layers },
    { id: 'estoque', name: 'Estoque Físico', icon: Package },
    { id: 'vendas', name: 'Auditoria de Vendas', icon: Receipt },
    { id: 'compras', name: 'Compras / NF-e', icon: Truck },
    { id: 'producao', name: 'Fila de Produção', icon: ChefHat },
    { id: 'salao', name: 'Lançamento (Order)', icon: Tablet },
    { id: 'fornecedores', name: 'Fornecedores', icon: Users },
    { id: 'financeiro', name: 'Financeiro / DRE', icon: Landmark },
    { id: 'relatorios', name: 'Relatórios & BI', icon: FileDown },
    { id: 'importador', name: 'Importação em Lote', icon: FileSpreadsheet },
    { id: 'configuracoes', name: 'Configurações', icon: Settings },
  ];

  if (activeProductView === 'landing') {
    return (
      <LandingPage
        theme={theme}
        onEnterSystem={() => {
          try {
            localStorage.setItem('fluxos_has_registration', 'true');
          } catch {}
          setActiveProductView('manager');
        }}
        onEnterAdmin={() => {
          setActiveProductView('admin');
        }}
        onToggleTheme={handleToggleTheme}
      />
    );
  }

  if (activeProductView === 'admin') {
    return (
      <AdminPanel
        theme={theme}
        usersList={usersList}
        onAddUser={handleAddUser}
        onDeleteUser={handleDeleteUser}
        products={products}
        sales={sales}
        tablesComandas={tablesComandas}
        activeShift={activeShift}
        onBackToLanding={() => {
          setActiveProductView('landing');
        }}
        onBackToLogin={() => {
          setActiveProductView('manager');
        }}
      />
    );
  }

  if (!currentUser) {
    return (
      <LoginScreen
        usersList={usersList}
        onLogin={handleLogin}
        theme={theme}
        onToggleTheme={handleToggleTheme}
        onBackToLanding={() => {
          setActiveProductView('landing');
        }}
        onEnterAdmin={() => {
          setActiveProductView('admin');
        }}
      />
    );
  }

  return (
    <div className={`min-h-screen flex flex-col font-sans transition-all duration-200 ${themeClasses}`}>
      
      {/* Mobile top bar for Manager mode */}
      {activeProductView === 'manager' && (
        <div className={`md:hidden flex items-center justify-between p-3 border-b shrink-0 z-20 ${
          theme === 'dark' ? 'bg-[#080808] border-[#161616]' : 'bg-white border-slate-200 shadow-xs text-slate-900'
        }`}>
          <button
            onClick={() => setIsMobileMenuOpen(true)}
            className="p-1.5 rounded-lg border border-transparent hover:bg-gray-500/10 cursor-pointer"
            title="Menu de navegação"
          >
            <Menu className="w-5 h-5 text-[#18F2A4]" />
          </button>
          <div className="flex items-center gap-1.5">
            <img src={appLogo} onError={(e) => { (e.target as HTMLImageElement).src = '/logo.png'; }} alt="FluxOS" className="w-4.5 h-4.5 object-contain shrink-0" />
            <span className="font-extrabold text-xs tracking-tight">Flux<span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 via-blue-400 to-[#18F2A4]">OS</span></span>
          </div>
          <div className="w-8"></div>
        </div>
      )}

      {/* Main Sandbox Area */}
      <div className="flex-1 flex overflow-hidden relative">
        
        {activeProductView === 'manager' ? (
          /* =====================================
             1. PRODUCT: FLUXOS MANAGER
             ===================================== */
          <div className="flex flex-1 overflow-hidden h-full relative">
            
            {/* Backdrop for mobile sidebar */}
            {isMobileMenuOpen && (
              <div 
                className="fixed inset-0 z-30 bg-black/60 md:hidden"
                onClick={() => setIsMobileMenuOpen(false)}
              />
            )}

            {/* Sidebar navigation */}
            <aside className={`fixed inset-y-0 left-0 z-40 w-60 transform ${
              isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
            } md:relative md:translate-x-0 transition-transform duration-300 ease-in-out border-r flex flex-col justify-between shrink-0 h-full ${
              theme === 'dark' ? 'bg-[#080808] border-[#161616]' : 'bg-white border-slate-200 shadow-xs'
            }`}>
              <div className="flex flex-col gap-1.5 overflow-y-auto flex-1">
                {/* Brand Header inside Sidebar */}
                <div className="p-4 flex items-center gap-2 border-b border-gray-800/20" style={{ borderColor: theme === 'dark' ? '#161616' : '#E2E8F0' }}>
                  <img src={appLogo} onError={(e) => { (e.target as HTMLImageElement).src = '/logo.png'; }} alt="FluxOS Logo" className="w-5 h-5 object-contain shrink-0" />
                  <span className="font-extrabold text-sm tracking-tight">Flux<span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 via-blue-400 to-[#18F2A4]">OS</span></span>
                </div>

                <div className="p-3 flex flex-col gap-1">
                  <span className={`text-[9px] font-bold uppercase tracking-widest block mb-2 px-3 ${theme === 'dark' ? 'text-gray-500' : 'text-slate-500'}`}>Gestão do Negócio</span>
                  {menuItems.map(item => {
                    const IconComp = item.icon;
                    const isActive = managerActiveTab === item.id;
                    return (
                      <button
                        key={item.id}
                        onClick={() => {
                          if (item.id === 'salao') {
                            setActiveProductView('order');
                          } else {
                            setManagerActiveTab(item.id);
                          }
                          setIsMobileMenuOpen(false);
                        }}
                        className={`w-full py-2.5 px-3 rounded-lg text-xs font-semibold flex items-center gap-2.5 transition-all text-left cursor-pointer ${
                          isActive
                            ? (theme === 'dark' ? 'bg-[#18F2A4]/10 text-[#18F2A4]' : 'bg-emerald-50 text-emerald-800 font-bold border border-emerald-200/60 shadow-2xs')
                            : (theme === 'dark' ? 'text-gray-400 hover:text-white hover:bg-[#111111]' : 'text-slate-600 hover:text-slate-950 hover:bg-slate-100 font-medium')
                        }`}
                      >
                        <IconComp className="w-4 h-4 shrink-0" />
                        {item.name}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Sidebar Footer with user identity, Logout & Quick sale trigger */}
              <div className="p-4 border-t flex flex-col gap-3" style={{ borderColor: theme === 'dark' ? '#161616' : '#E2E8F0' }}>
                {/* User identification card */}
                <div className={`p-2.5 rounded-lg flex items-center justify-between gap-2 border ${
                  theme === 'dark' ? 'bg-[#111111]/80 border-[#1C1C1C]' : 'bg-slate-50 border-slate-200'
                }`}>
                  <div className="flex flex-col text-left overflow-hidden">
                     <span className="text-xs font-bold truncate leading-tight" style={{ color: theme === 'dark' ? '#FFF' : '#0F172A' }}>{currentUser.name}</span>
                     <span className={`text-[9px] uppercase font-mono tracking-wider mt-0.5 ${theme === 'dark' ? 'text-gray-500' : 'text-slate-500 font-semibold'}`}>{currentUser.role}</span>
                  </div>

                  <button
                    onClick={handleLogout}
                    className={`p-1.5 rounded-lg border transition-colors cursor-pointer text-red-500 hover:bg-red-500/10 shrink-0 ${
                      theme === 'dark' ? 'border-[#1C1C1C] bg-[#111]' : 'border-slate-200 bg-white shadow-2xs'
                    }`}
                    title="Sair do Sistema"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                  </button>
                </div>

                <button
                  onClick={() => setIsQuickSaleOpen(!isQuickSaleOpen)}
                  className={`w-full py-2.5 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                    theme === 'dark' 
                      ? 'bg-[#18F2A4] text-black hover:bg-[#12d58f]' 
                      : 'bg-[#10B981] text-white hover:bg-[#0e9f6e] shadow-xs'
                  }`}
                >
                  <ShoppingCart className="w-4 h-4" />
                  Venda Rápida PDV
                </button>


              </div>
            </aside>

            {/* Inner Dashboard scroll space */}
            <main className={`flex-1 overflow-y-auto p-6 md:p-8 flex flex-col gap-6 ${
              theme === 'dark' ? 'bg-black text-white' : 'bg-slate-50 text-slate-900'
            }`}>
              
              {/* Alert: Missing Barcodes persistent warning banner */}
              {products.filter(p => !p.barcode && p.active).length > 0 && managerActiveTab !== 'importador' && (
                <div className={`p-4 rounded-xl border flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 transition-all duration-300 animate-fade-in ${
                  theme === 'dark' 
                    ? 'bg-amber-500/10 border-amber-500/20 text-amber-300' 
                    : 'bg-amber-50 border-amber-200 text-amber-800'
                }`}>
                  <div className="flex gap-3 items-start">
                    <div className="p-2 bg-amber-500/20 rounded-lg shrink-0">
                      <Barcode className="w-5 h-5 text-amber-400" />
                    </div>
                    <div>
                      <span className="font-bold text-xs block uppercase tracking-wider">Atenção: Códigos de Barras Faltantes</span>
                      <p className="text-[10px] text-gray-400 mt-1">
                        Existem <strong className="text-amber-400 font-extrabold">{products.filter(p => !p.barcode && p.active).length}</strong> produtos ativos cadastrados sem código de barras. Use o assistente óptico para vinculá-los rapidamente sem interromper suas atividades.
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setStartWizardOnMount(true);
                      setManagerActiveTab('importador');
                    }}
                    className="w-full sm:w-auto px-4 py-2 bg-amber-500 text-black font-extrabold text-xs rounded-lg hover:bg-amber-400 transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-2 shrink-0"
                  >
                    <Play className="w-4 h-4 animate-pulse" />
                    Escanear Pendentes
                  </button>
                </div>
              )}

              {managerActiveTab === 'dashboard' && (
                <ManagerDashboard 
                  products={productsWithAbc} 
                  sales={sales} 
                  financialTransactions={financialTransactions} 
                  theme={theme}
                  onGoToTab={(tab) => setManagerActiveTab(tab)}
                />
              )}
              {managerActiveTab === 'produtos' && (
                <ManagerProducts 
                  products={productsWithAbc} 
                  suppliers={suppliers} 
                  onAddProduct={handleAddProduct}
                  onUpdateProduct={handleUpdateProduct}
                  theme={theme}
                  categories={productCategories}
                  onAddCategory={handleAddCategory}
                  onRenameCategory={handleRenameCategory}
                  onDeleteCategory={handleDeleteCategory}
                />
              )}
              {managerActiveTab === 'estoque' && (
                <ManagerInventory 
                  products={productsWithAbc} 
                  onUpdateFullStock={handleUpdateFullStock} 
                  onUpdateProduct={handleUpdateProduct}
                  theme={theme}
                />
              )}
              {managerActiveTab === 'vendas' && (
                <ManagerSales 
                  sales={sales} 
                  products={productsWithAbc} 
                  onCancelSale={handleCancelSale} 
                  theme={theme}
                />
              )}
              {managerActiveTab === 'compras' && (
                <ManagerPurchases 
                  suppliers={suppliers} 
                  products={productsWithAbc} 
                  onAddPurchaseReceipt={onAddPurchaseReceipt => {
                    setFinancialTransactions(prev => [
                      {
                        id: `tx-${Date.now()}`,
                        date: onAddPurchaseReceipt.date,
                        type: 'despesa',
                        category: 'Fornecedores',
                        description: `Compra NF #${onAddPurchaseReceipt.invoiceNumber}`,
                        value: onAddPurchaseReceipt.total,
                        status: 'pendente',
                        dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
                      },
                      ...prev
                    ]);
                  }}
                  onUpdateProductCost={handleUpdateProductCost}
                  onIncreaseStockBoxes={handleIncreaseStockBoxes}
                  onAddFinancial={handleAddFinancial}
                  theme={theme}
                />
              )}
              {managerActiveTab === 'fornecedores' && (
                <ManagerSuppliers 
                  suppliers={suppliers} 
                  onAddSupplier={handleAddSupplier} 
                  onDeleteSupplier={handleDeleteSupplier} 
                  theme={theme}
                />
              )}
              {managerActiveTab === 'financeiro' && (
                <ManagerFinancial 
                  financialTransactions={financialTransactions} 
                  sales={sales} 
                  products={productsWithAbc} 
                  onConfirmPayment={handleConfirmPayment}
                  onAddTransaction={handleAddFinancial}
                  theme={theme}
                  activeShift={activeShift}
                  onOpenShift={handleOpenShift}
                  onCloseShift={handleCloseShift}
                  onSangria={handleSangria}
                  onSuprimento={handleSuprimento}
                  shiftHistory={shiftHistory}
                />
              )}
              {managerActiveTab === 'relatorios' && (
                <ManagerReports 
                  theme={theme} 
                  products={productsWithAbc}
                  sales={sales}
                  financialTransactions={financialTransactions}
                />
              )}
              {managerActiveTab === 'producao' && (
                <ProductionPanel
                  tablesComandas={tablesComandas}
                  products={productsWithAbc}
                  onUpdateTableItems={handleUpdateTableItems}
                  theme={theme}
                  currentUser={currentUser}
                  onToggleTheme={handleToggleTheme}
                  onLogout={handleLogout}
                />
              )}
              {managerActiveTab === 'configuracoes' && (
                <ManagerSettings 
                  usersList={usersList} 
                  onToggleUserActive={handleToggleUserActive} 
                  onAddUser={handleAddUser} 
                  onDeleteUser={handleDeleteUser}
                  onUpdateUserRole={handleUpdateUserRole}
                  theme={theme}
                  onToggleTheme={handleToggleTheme}
                />
              )}
              {managerActiveTab === 'importador' && (
                <ManagerImportPortal
                  products={products}
                  suppliers={suppliers}
                  usersList={usersList}
                  onAddProduct={handleAddProduct}
                  onUpdateProduct={handleUpdateProduct}
                  onAddSupplier={handleAddSupplier}
                  onAddUser={handleAddUser}
                  categories={productCategories}
                  onAddCategory={handleAddCategory}
                  theme={theme}
                  startWithWizardOpen={startWizardOnMount}
                  onCloseWizard={() => setStartWizardOnMount(false)}
                />
              )}
            </main>

            {/* PDV collapsible quick sale bar */}
            <QuickSaleSidebar 
              isOpen={isQuickSaleOpen} 
              onClose={() => setIsQuickSaleOpen(false)} 
              products={productsWithAbc} 
              onUpdateStock={handleUpdateStock} 
              onAddSale={handleAddSale} 
              onAddFinancial={handleAddFinancial} 
              currentUser={currentUser} 
              theme={theme}
              scannedBarcodeTrigger={scannedBarcodeTrigger}
              activeShift={activeShift}
              onOpenShift={handleOpenShift}
            />
          </div>
        ) : activeProductView === 'production' ? (
          /* =====================================
             3. PRODUCT: FLUXOS PRODUCTION PANEL
             ===================================== */
          <div className="flex-1 overflow-y-auto">
            <ProductionPanel
              tablesComandas={tablesComandas}
              products={productsWithAbc}
              onUpdateTableItems={handleUpdateTableItems}
              theme={theme}
              currentUser={currentUser}
              onToggleTheme={handleToggleTheme}
              onLogout={handleLogout}
              onGoToManager={(currentUser.role === 'admin' || currentUser.role === 'manager') ? () => setActiveProductView('manager') : undefined}
            />
          </div>
        ) : (
          /* =====================================
             2. PRODUCT: FLUXOS ORDER (WAITERS)
             ===================================== */
          <div className="flex-1 flex flex-col w-full h-full">
            {/* The mobile applet component frame */}
            <OrderApp 
              products={productsWithAbc} 
              tablesComandas={tablesComandas} 
              onUpdateTableItems={handleUpdateTableItems} 
              onUpdateTableStatus={handleUpdateTableStatus} 
              onAddSale={handleAddSale} 
              onAddFinancial={handleAddFinancial} 
              onUpdateStock={handleUpdateStock} 
              onAddTableComanda={handleAddTableComanda}
              onAddTableComandaBatch={handleAddTableComandaBatch}
              onRemoveTableComanda={handleRemoveTableComanda}
              usersList={usersList} 
              theme={theme}
              currentUser={currentUser}
              onToggleTheme={handleToggleTheme}
              onLogout={handleLogout}
              onGoToManager={(currentUser.role === 'admin' || currentUser.role === 'manager') ? () => setActiveProductView('manager') : undefined}
            />
          </div>
        )}

      </div>

      {/* Custom Styled Alert Modal */}
      {customAlert && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/75 backdrop-blur-sm" onClick={() => {
            if (customAlert.onClose) customAlert.onClose();
            setCustomAlert(null);
          }} />
          <div className={`relative w-full max-w-sm rounded-2xl border p-5 shadow-2xl flex flex-col gap-4 transition-all animate-in fade-in zoom-in-95 duration-150 ${
            theme === 'dark' ? 'bg-[#0A0A0A] border-[#1C1C1C] text-white' : 'bg-white border-gray-200 text-gray-950'
          }`}>
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4 text-emerald-500" />
              <h4 className="font-extrabold text-[11px] tracking-wider uppercase text-gray-400">Mensagem do Sistema</h4>
            </div>
            <p className="text-xs font-semibold leading-relaxed" style={{ color: theme === 'dark' ? '#E5E5E5' : '#333' }}>
              {customAlert.message}
            </p>
            <button
              onClick={() => {
                if (customAlert.onClose) customAlert.onClose();
                setCustomAlert(null);
              }}
              className={`w-full py-2.5 rounded-xl text-xs font-bold transition-all active:scale-95 cursor-pointer ${
                theme === 'dark' ? 'bg-[#18F2A4] text-black hover:bg-[#12d58f]' : 'bg-[#10B981] text-white hover:bg-[#0e9f6e]'
              }`}
            >
              Entendido
            </button>
          </div>
        </div>
      )}

      {/* Custom Styled Confirm Modal */}
      {customConfirm && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/75 backdrop-blur-sm" onClick={() => {
            if (customConfirm.onCancel) customConfirm.onCancel();
            setCustomConfirm(null);
          }} />
          <div className={`relative w-full max-w-sm rounded-2xl border p-5 shadow-2xl flex flex-col gap-4 transition-all animate-in fade-in zoom-in-95 duration-150 ${
            theme === 'dark' ? 'bg-[#0A0A0A] border-[#1C1C1C] text-white' : 'bg-white border-gray-200 text-gray-950'
          }`}>
            <div className="flex items-center gap-2 text-red-500">
              <AlertTriangle className="w-4 h-4 text-red-500" />
              <h4 className="font-extrabold text-[11px] tracking-wider uppercase text-red-400">Confirmar Ação</h4>
            </div>
            <p className="text-xs font-semibold leading-relaxed" style={{ color: theme === 'dark' ? '#E5E5E5' : '#333' }}>
              {customConfirm.message}
            </p>
            <div className="grid grid-cols-2 gap-2 mt-2">
              <button
                onClick={() => {
                  if (customConfirm.onCancel) customConfirm.onCancel();
                  setCustomConfirm(null);
                }}
                className={`py-2.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                  theme === 'dark' ? 'border-[#1C1C1C] text-gray-400 hover:bg-white/5' : 'border-gray-200 text-gray-500 hover:bg-gray-50'
                }`}
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  customConfirm.onConfirm();
                  setCustomConfirm(null);
                }}
                className="py-2.5 rounded-xl text-xs font-bold bg-red-600 text-white hover:bg-red-500 transition-all active:scale-95 cursor-pointer"
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Global Thermal Printer Control Modal */}
      <ThermalPrinterControlModal theme={theme} />

    </div>
  );
}
