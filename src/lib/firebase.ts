import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  getDocs,
  onSnapshot, 
  doc, 
  setDoc, 
  deleteDoc 
} from 'firebase/firestore';
import { Product, Supplier, Sale, FinancialTransaction, TableComandaState, CashierUser } from '../types';
import { 
  INITIAL_PRODUCTS, MOCK_SALES, INITIAL_SUPPLIERS, 
  INITIAL_TABLES_COMANDAS, INITIAL_CASHIER_USERS 
} from '../data/mockData';

// Environment variable reader for Vite / Vercel
const getEnv = (key: string): string => {
  const metaEnv = (import.meta as any)?.env;
  if (metaEnv && metaEnv[key]) {
    return metaEnv[key];
  }
  if (typeof process !== 'undefined' && process.env && (process.env as any)[key]) {
    return (process.env as any)[key];
  }
  return '';
};

const apiKey = getEnv('VITE_FIREBASE_API_KEY') || 'AIzaSyDl6RiKkdWSJTb2Qi1cHKXX45j5HUNxnAU';
const projectId = getEnv('VITE_FIREBASE_PROJECT_ID') || 'adegaos-bc0ff';
const authDomain = getEnv('VITE_FIREBASE_AUTH_DOMAIN') || 'adegaos-bc0ff.firebaseapp.com';
const storageBucket = getEnv('VITE_FIREBASE_STORAGE_BUCKET') || 'adegaos-bc0ff.firebasestorage.app';
const messagingSenderId = getEnv('VITE_FIREBASE_MESSAGING_SENDER_ID') || '303265966754';
const appId = getEnv('VITE_FIREBASE_APP_ID') || '1:303265966754:web:098e6dfac893e02f0b45fb';

export const isFirebaseEnabled = Boolean(apiKey && projectId);

let db: ReturnType<typeof getFirestore> | null = null;

if (isFirebaseEnabled) {
  try {
    const firebaseConfig = {
      apiKey,
      authDomain: authDomain || `${projectId}.firebaseapp.com`,
      projectId,
      storageBucket: storageBucket || `${projectId}.appspot.com`,
      messagingSenderId,
      appId
    };

    const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
    db = getFirestore(app);
    console.log('🔥 Firebase Firestore real-time sync connected successfully!');
  } catch (err) {
    console.error('Failed to initialize Firebase:', err);
    db = null;
  }
}

// Store / Branch ID Helper for Data Isolation
export function getActiveStoreId(): string {
  try {
    return localStorage.getItem('adegaos_active_store_id') || localStorage.getItem('adegaos_store_id') || 'store-main';
  } catch {
    return 'store-main';
  }
}

export function setActiveStoreId(storeId: string): void {
  try {
    localStorage.setItem('adegaos_active_store_id', storeId);
    localStorage.setItem('adegaos_store_id', storeId);
  } catch {}
}

// Helpers for store subcollection references (stores/{storeId}/{collectionName})
function getStoreCol(collectionName: string) {
  if (!db) return null;
  const storeId = getActiveStoreId();
  return collection(db, 'stores', storeId, collectionName);
}

function getStoreDoc(collectionName: string, docId: string) {
  if (!db) return null;
  const storeId = getActiveStoreId();
  return doc(db, 'stores', storeId, collectionName, docId);
}

// Helper to remove undefined properties before saving to Firestore (Firestore rejects undefined)
function cleanForFirestore<T>(obj: T): T {
  if (obj === null || obj === undefined) return obj;
  return JSON.parse(JSON.stringify(obj, (_key, value) => (value === undefined ? null : value)));
}

// Default Categories list
export const DEFAULT_PRODUCT_CATEGORIES = [
  'Cervejas', 'Destilados', 'Sem Álcool', 'Petiscos', 'Cigarros', 'Vinhos', 'Outros'
];

// Fallback LocalStorage State Listeners
const listeners = {
  products: new Set<(data: Product[]) => void>(),
  sales: new Set<(data: Sale[]) => void>(),
  suppliers: new Set<(data: Supplier[]) => void>(),
  transactions: new Set<(data: FinancialTransaction[]) => void>(),
  tables: new Set<(data: TableComandaState[]) => void>(),
  users: new Set<(data: CashierUser[]) => void>(),
  categories: new Set<(data: string[]) => void>()
};

const syncChannel = typeof window !== 'undefined' && 'BroadcastChannel' in window ? new BroadcastChannel('fluxos_sync_channel') : null;

if (syncChannel) {
  syncChannel.onmessage = (event) => {
    const { key, data } = event.data || {};
    if (key && data && (listeners as any)[key]) {
      const storeId = getActiveStoreId();
      try {
        localStorage.setItem(`fluxos_${key}_${storeId}`, JSON.stringify(data));
      } catch (e) {}
      (listeners as any)[key].forEach((cb: any) => cb([...data]));
    }
  };
}

function getCollection<T>(key: string, initialData: T[]): T[] {
  const storeId = getActiveStoreId();
  const fullKey = `fluxos_${key}_${storeId}`;
  try {
    const stored = localStorage.getItem(fullKey);
    if (stored) {
      return JSON.parse(stored);
    }
    localStorage.setItem(fullKey, JSON.stringify(initialData));
    return initialData;
  } catch {
    return initialData;
  }
}

// ================= SUBSCRIPTION METHODS (REAL-TIME INSTANT SYNC WITH STORE ISOLATION) =================

export function subscribeProducts(callback: (p: Product[]) => void) {
  const storeId = getActiveStoreId();
  const colRef = getStoreCol('products');
  if (colRef) {
    return onSnapshot(colRef, (snapshot) => {
      if (snapshot.empty) {
        INITIAL_PRODUCTS.forEach(p => {
          const docRef = getStoreDoc('products', p.id);
          if (docRef) setDoc(docRef, cleanForFirestore(p));
        });
        localStorage.setItem(`fluxos_products_${storeId}`, JSON.stringify(INITIAL_PRODUCTS));
        callback(INITIAL_PRODUCTS);
      } else {
        const prods = snapshot.docs.map(d => d.data() as Product);
        localStorage.setItem(`fluxos_products_${storeId}`, JSON.stringify(prods));
        callback(prods);
      }
    }, (err) => {
      console.error('Firestore products error:', err);
      callback(getCollection('products', INITIAL_PRODUCTS));
    });
  }
  listeners.products.add(callback);
  callback(getCollection('products', INITIAL_PRODUCTS));
  return () => { listeners.products.delete(callback); };
}

export function subscribeSales(callback: (s: Sale[]) => void) {
  const storeId = getActiveStoreId();
  const colRef = getStoreCol('sales');
  if (colRef) {
    return onSnapshot(colRef, (snapshot) => {
      if (snapshot.empty) {
        localStorage.setItem(`fluxos_sales_${storeId}`, JSON.stringify([]));
        callback([]);
      } else {
        const sales = snapshot.docs.map(d => d.data() as Sale);
        sales.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
        localStorage.setItem(`fluxos_sales_${storeId}`, JSON.stringify(sales));
        callback(sales);
      }
    }, (err) => {
      console.error('Firestore sales error:', err);
      callback(getCollection('sales', MOCK_SALES));
    });
  }
  listeners.sales.add(callback);
  callback(getCollection('sales', MOCK_SALES));
  return () => { listeners.sales.delete(callback); };
}

export function subscribeSuppliers(callback: (s: Supplier[]) => void) {
  const storeId = getActiveStoreId();
  const colRef = getStoreCol('suppliers');
  if (colRef) {
    return onSnapshot(colRef, (snapshot) => {
      if (snapshot.empty) {
        INITIAL_SUPPLIERS.forEach(s => {
          const docRef = getStoreDoc('suppliers', s.id);
          if (docRef) setDoc(docRef, cleanForFirestore(s));
        });
        localStorage.setItem(`fluxos_suppliers_${storeId}`, JSON.stringify(INITIAL_SUPPLIERS));
        callback(INITIAL_SUPPLIERS);
      } else {
        const sups = snapshot.docs.map(d => d.data() as Supplier);
        localStorage.setItem(`fluxos_suppliers_${storeId}`, JSON.stringify(sups));
        callback(sups);
      }
    }, (err) => {
      console.error('Firestore suppliers error:', err);
      callback(getCollection('suppliers', INITIAL_SUPPLIERS));
    });
  }
  listeners.suppliers.add(callback);
  callback(getCollection('suppliers', INITIAL_SUPPLIERS));
  return () => { listeners.suppliers.delete(callback); };
}

export function subscribeTransactions(callback: (t: FinancialTransaction[]) => void) {
  const storeId = getActiveStoreId();
  const colRef = getStoreCol('transactions');
  if (colRef) {
    return onSnapshot(colRef, (snapshot) => {
      const txs = snapshot.docs.map(d => d.data() as FinancialTransaction);
      localStorage.setItem(`fluxos_transactions_${storeId}`, JSON.stringify(txs));
      callback(txs);
    }, (err) => {
      console.error('Firestore transactions error:', err);
      callback(getCollection('transactions', []));
    });
  }
  listeners.transactions.add(callback);
  callback(getCollection('transactions', []));
  return () => { listeners.transactions.delete(callback); };
}

function sanitizeTable(t: any): TableComandaState {
  return {
    id: t?.id || `tbl_${Math.random()}`,
    type: t?.type || 'mesa',
    number: typeof t?.number === 'number' ? t.number : 1,
    tableName: t?.tableName || '',
    status: t?.status || 'livre',
    items: Array.isArray(t?.items) ? t.items : [],
    subtotal: typeof t?.subtotal === 'number' ? t.subtotal : 0
  };
}

export function subscribeTablesComandas(callback: (t: TableComandaState[]) => void) {
  const storeId = getActiveStoreId();
  const colRef = getStoreCol('tables');
  if (colRef) {
    return onSnapshot(colRef, (snapshot) => {
      if (snapshot.empty) {
        INITIAL_TABLES_COMANDAS.forEach(t => {
          const docRef = getStoreDoc('tables', t.id);
          if (docRef) setDoc(docRef, cleanForFirestore(t));
        });
        localStorage.setItem(`fluxos_tables_${storeId}`, JSON.stringify(INITIAL_TABLES_COMANDAS));
        callback(INITIAL_TABLES_COMANDAS);
      } else {
        const tables = snapshot.docs.map(d => sanitizeTable(d.data()));
        tables.sort((a, b) => a.number - b.number);
        localStorage.setItem(`fluxos_tables_${storeId}`, JSON.stringify(tables));
        callback(tables);
      }
    }, (err) => {
      console.error('Firestore tables error:', err);
      const tables = getCollection('tables', INITIAL_TABLES_COMANDAS).map(sanitizeTable);
      callback(tables);
    });
  }
  listeners.tables.add(callback);
  const tables = getCollection('tables', INITIAL_TABLES_COMANDAS).map(sanitizeTable);
  callback(tables);
  return () => { listeners.tables.delete(callback); };
}

export function subscribeUsers(callback: (u: CashierUser[]) => void) {
  const storeId = getActiveStoreId();
  const colRef = getStoreCol('users');
  if (colRef) {
    return onSnapshot(colRef, (snapshot) => {
      if (snapshot.empty) {
        INITIAL_CASHIER_USERS.forEach(u => {
          const docRef = getStoreDoc('users', u.id);
          if (docRef) setDoc(docRef, cleanForFirestore(u));
        });
        localStorage.setItem(`fluxos_users_${storeId}`, JSON.stringify(INITIAL_CASHIER_USERS));
        callback(INITIAL_CASHIER_USERS);
      } else {
        const users = snapshot.docs.map(d => d.data() as CashierUser);
        localStorage.setItem(`fluxos_users_${storeId}`, JSON.stringify(users));
        callback(users);
      }
    }, (err) => {
      console.error('Firestore users error:', err);
      callback(getCollection('users', INITIAL_CASHIER_USERS));
    });
  }
  listeners.users.add(callback);
  callback(getCollection('users', INITIAL_CASHIER_USERS));
  return () => { listeners.users.delete(callback); };
}

export function subscribeCategories(callback: (cats: string[]) => void) {
  const storeId = getActiveStoreId();
  const colRef = getStoreCol('categories');
  if (colRef) {
    return onSnapshot(colRef, (snapshot) => {
      if (snapshot.empty) {
        DEFAULT_PRODUCT_CATEGORIES.forEach(c => {
          const docRef = getStoreDoc('categories', c);
          if (docRef) setDoc(docRef, { name: c, createdAt: new Date().toISOString() });
        });
        localStorage.setItem(`fluxos_categories_${storeId}`, JSON.stringify(DEFAULT_PRODUCT_CATEGORIES));
        callback(DEFAULT_PRODUCT_CATEGORIES);
      } else {
        const cats = snapshot.docs.map(d => (d.data() as any).name || d.id);
        localStorage.setItem(`fluxos_categories_${storeId}`, JSON.stringify(cats));
        callback(cats);
      }
    }, (err) => {
      console.error('Firestore categories error:', err);
      callback(getCollection('categories', DEFAULT_PRODUCT_CATEGORIES));
    });
  }
  listeners.categories.add(callback);
  callback(getCollection('categories', DEFAULT_PRODUCT_CATEGORIES));
  return () => { listeners.categories.delete(callback); };
}

// ================= DIRECT WRITE / DELETE DB OPERATIONS =================

export async function fetchProductsFromDb(): Promise<Product[]> {
  const storeId = getActiveStoreId();
  const colRef = getStoreCol('products');
  if (colRef) {
    try {
      const snap = await getDocs(colRef);
      if (!snap.empty) {
        const prods = snap.docs.map(d => d.data() as Product);
        localStorage.setItem(`fluxos_products_${storeId}`, JSON.stringify(prods));
        return prods;
      }
    } catch (err) {
      console.error('Error fetching products from Firestore:', err);
    }
  }
  return getCollection('products', INITIAL_PRODUCTS);
}

export async function saveProductToDb(prod: Product): Promise<void> {
  const storeId = getActiveStoreId();
  try {
    const stored = localStorage.getItem(`fluxos_products_${storeId}`);
    const list: Product[] = stored ? JSON.parse(stored) : [...INITIAL_PRODUCTS];
    const idx = list.findIndex(p => p.id === prod.id);
    if (idx >= 0) list[idx] = prod; else list.push(prod);
    localStorage.setItem(`fluxos_products_${storeId}`, JSON.stringify(list));
  } catch (e) {}

  const docRef = getStoreDoc('products', prod.id);
  if (docRef) {
    try {
      await setDoc(docRef, cleanForFirestore(prod));
    } catch (err) {
      console.error('Error saving product to Firestore:', err);
    }
  } else {
    const stored = localStorage.getItem(`fluxos_products_${storeId}`);
    const list = stored ? JSON.parse(stored) : INITIAL_PRODUCTS;
    listeners.products.forEach(cb => cb(list));
  }
}

export async function fetchSalesFromDb(): Promise<Sale[]> {
  const storeId = getActiveStoreId();
  const colRef = getStoreCol('sales');
  if (colRef) {
    try {
      const snap = await getDocs(colRef);
      if (!snap.empty) {
        const sales = snap.docs.map(d => d.data() as Sale);
        sales.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
        localStorage.setItem(`fluxos_sales_${storeId}`, JSON.stringify(sales));
        return sales;
      }
    } catch (err) {
      console.error('Error fetching sales from Firestore:', err);
    }
  }
  return getCollection('sales', MOCK_SALES);
}

export async function saveSaleToDb(sale: Sale): Promise<void> {
  const storeId = getActiveStoreId();
  try {
    const stored = localStorage.getItem(`fluxos_sales_${storeId}`);
    const list: Sale[] = stored ? JSON.parse(stored) : [];
    const idx = list.findIndex(s => s.id === sale.id);
    if (idx >= 0) list[idx] = sale; else list.push(sale);
    localStorage.setItem(`fluxos_sales_${storeId}`, JSON.stringify(list));
  } catch (e) {}

  const docRef = getStoreDoc('sales', sale.id);
  if (docRef) {
    try {
      await setDoc(docRef, cleanForFirestore(sale));
    } catch (err) {
      console.error('Error saving sale to Firestore:', err);
    }
  } else {
    const stored = localStorage.getItem(`fluxos_sales_${storeId}`);
    const list = stored ? JSON.parse(stored) : MOCK_SALES;
    listeners.sales.forEach(cb => cb(list));
  }
}

export async function fetchSuppliersFromDb(): Promise<Supplier[]> {
  const storeId = getActiveStoreId();
  const colRef = getStoreCol('suppliers');
  if (colRef) {
    try {
      const snap = await getDocs(colRef);
      if (!snap.empty) {
        const sups = snap.docs.map(d => d.data() as Supplier);
        localStorage.setItem(`fluxos_suppliers_${storeId}`, JSON.stringify(sups));
        return sups;
      }
    } catch (err) {
      console.error('Error fetching suppliers from Firestore:', err);
    }
  }
  return getCollection('suppliers', INITIAL_SUPPLIERS);
}

export async function saveSupplierToDb(sup: Supplier): Promise<void> {
  const storeId = getActiveStoreId();
  try {
    const stored = localStorage.getItem(`fluxos_suppliers_${storeId}`);
    const list: Supplier[] = stored ? JSON.parse(stored) : [...INITIAL_SUPPLIERS];
    const idx = list.findIndex(s => s.id === sup.id);
    if (idx >= 0) list[idx] = sup; else list.push(sup);
    localStorage.setItem(`fluxos_suppliers_${storeId}`, JSON.stringify(list));
  } catch (e) {}

  const docRef = getStoreDoc('suppliers', sup.id);
  if (docRef) {
    try {
      await setDoc(docRef, cleanForFirestore(sup));
    } catch (err) {
      console.error('Error saving supplier to Firestore:', err);
    }
  } else {
    const stored = localStorage.getItem(`fluxos_suppliers_${storeId}`);
    const list = stored ? JSON.parse(stored) : INITIAL_SUPPLIERS;
    listeners.suppliers.forEach(cb => cb(list));
  }
}

export async function deleteSupplierFromDb(id: string): Promise<void> {
  const storeId = getActiveStoreId();
  try {
    const stored = localStorage.getItem(`fluxos_suppliers_${storeId}`);
    const list: Supplier[] = stored ? JSON.parse(stored) : [];
    const filtered = list.filter(s => s.id !== id);
    localStorage.setItem(`fluxos_suppliers_${storeId}`, JSON.stringify(filtered));
  } catch (e) {}

  const docRef = getStoreDoc('suppliers', id);
  if (docRef) {
    try {
      await deleteDoc(docRef);
    } catch (err) {
      console.error('Error deleting supplier from Firestore:', err);
    }
  } else {
    const stored = localStorage.getItem(`fluxos_suppliers_${storeId}`);
    const list = stored ? JSON.parse(stored) : INITIAL_SUPPLIERS;
    listeners.suppliers.forEach(cb => cb(list));
  }
}

export async function fetchTransactionsFromDb(): Promise<FinancialTransaction[]> {
  const storeId = getActiveStoreId();
  const colRef = getStoreCol('transactions');
  if (colRef) {
    try {
      const snap = await getDocs(colRef);
      if (!snap.empty) {
        const txs = snap.docs.map(d => d.data() as FinancialTransaction);
        localStorage.setItem(`fluxos_transactions_${storeId}`, JSON.stringify(txs));
        return txs;
      }
    } catch (err) {
      console.error('Error fetching transactions from Firestore:', err);
    }
  }
  return getCollection('transactions', []);
}

export async function saveTransactionToDb(tx: FinancialTransaction): Promise<void> {
  const storeId = getActiveStoreId();
  try {
    const stored = localStorage.getItem(`fluxos_transactions_${storeId}`);
    const list: FinancialTransaction[] = stored ? JSON.parse(stored) : [];
    const idx = list.findIndex(t => t.id === tx.id);
    if (idx >= 0) list[idx] = tx; else list.push(tx);
    localStorage.setItem(`fluxos_transactions_${storeId}`, JSON.stringify(list));
  } catch (e) {}

  const docRef = getStoreDoc('transactions', tx.id);
  if (docRef) {
    try {
      await setDoc(docRef, cleanForFirestore(tx));
    } catch (err) {
      console.error('Error saving transaction to Firestore:', err);
    }
  } else {
    const stored = localStorage.getItem(`fluxos_transactions_${storeId}`);
    const list = stored ? JSON.parse(stored) : [];
    listeners.transactions.forEach(cb => cb(list));
  }
}

export async function deleteTransactionFromDb(id: string): Promise<void> {
  const storeId = getActiveStoreId();
  try {
    const stored = localStorage.getItem(`fluxos_transactions_${storeId}`);
    const list: FinancialTransaction[] = stored ? JSON.parse(stored) : [];
    const filtered = list.filter(t => t.id !== id);
    localStorage.setItem(`fluxos_transactions_${storeId}`, JSON.stringify(filtered));
  } catch (e) {}

  const docRef = getStoreDoc('transactions', id);
  if (docRef) {
    try {
      await deleteDoc(docRef);
    } catch (err) {
      console.error('Error deleting transaction from Firestore:', err);
    }
  } else {
    const stored = localStorage.getItem(`fluxos_transactions_${storeId}`);
    const list = stored ? JSON.parse(stored) : [];
    listeners.transactions.forEach(cb => cb(list));
  }
}

export async function fetchTablesComandasFromDb(): Promise<TableComandaState[]> {
  const storeId = getActiveStoreId();
  const colRef = getStoreCol('tables');
  if (colRef) {
    try {
      const snap = await getDocs(colRef);
      if (!snap.empty) {
        const tables = snap.docs.map(d => sanitizeTable(d.data()));
        tables.sort((a, b) => a.number - b.number);
        localStorage.setItem(`fluxos_tables_${storeId}`, JSON.stringify(tables));
        return tables;
      }
    } catch (err) {
      console.error('Error fetching tables from Firestore:', err);
    }
  }
  return getCollection('tables', INITIAL_TABLES_COMANDAS).map(sanitizeTable);
}

export async function saveTableComandaToDb(tc: TableComandaState): Promise<void> {
  const storeId = getActiveStoreId();
  try {
    const stored = localStorage.getItem(`fluxos_tables_${storeId}`);
    const list: TableComandaState[] = stored ? JSON.parse(stored) : [...INITIAL_TABLES_COMANDAS];
    const idx = list.findIndex(t => t.id === tc.id);
    if (idx >= 0) list[idx] = tc; else list.push(tc);
    localStorage.setItem(`fluxos_tables_${storeId}`, JSON.stringify(list));
  } catch (e) {}

  const docRef = getStoreDoc('tables', tc.id);
  if (docRef) {
    try {
      await setDoc(docRef, cleanForFirestore(tc));
    } catch (err) {
      console.error('Error saving table to Firestore:', err);
    }
  } else {
    const stored = localStorage.getItem(`fluxos_tables_${storeId}`);
    const list = stored ? JSON.parse(stored) : INITIAL_TABLES_COMANDAS;
    listeners.tables.forEach(cb => cb(list));
  }
}

export async function deleteTableComandaFromDb(id: string): Promise<void> {
  const storeId = getActiveStoreId();
  try {
    const stored = localStorage.getItem(`fluxos_tables_${storeId}`);
    const list: TableComandaState[] = stored ? JSON.parse(stored) : [];
    const filtered = list.filter(s => s.id !== id);
    localStorage.setItem(`fluxos_tables_${storeId}`, JSON.stringify(filtered));
  } catch (e) {}

  const docRef = getStoreDoc('tables', id);
  if (docRef) {
    try {
      await deleteDoc(docRef);
    } catch (err) {
      console.error('Error deleting table from Firestore:', err);
    }
  } else {
    const stored = localStorage.getItem(`fluxos_tables_${storeId}`);
    const list = stored ? JSON.parse(stored) : INITIAL_TABLES_COMANDAS;
    listeners.tables.forEach(cb => cb(list));
  }
}

export async function fetchUsersFromDb(): Promise<CashierUser[]> {
  const storeId = getActiveStoreId();
  const colRef = getStoreCol('users');
  if (colRef) {
    try {
      const snap = await getDocs(colRef);
      if (!snap.empty) {
        const users = snap.docs.map(d => d.data() as CashierUser);
        localStorage.setItem(`fluxos_users_${storeId}`, JSON.stringify(users));
        return users;
      }
    } catch (err) {
      console.error('Error fetching users from Firestore:', err);
    }
  }
  return getCollection('users', INITIAL_CASHIER_USERS);
}

export async function saveUserToDb(user: CashierUser): Promise<void> {
  const storeId = getActiveStoreId();
  try {
    const stored = localStorage.getItem(`fluxos_users_${storeId}`);
    const list: CashierUser[] = stored ? JSON.parse(stored) : [...INITIAL_CASHIER_USERS];
    const idx = list.findIndex(u => u.id === user.id);
    if (idx >= 0) list[idx] = user; else list.push(user);
    localStorage.setItem(`fluxos_users_${storeId}`, JSON.stringify(list));
  } catch (e) {}

  const docRef = getStoreDoc('users', user.id);
  if (docRef) {
    try {
      await setDoc(docRef, cleanForFirestore(user));
    } catch (err) {
      console.error('Error saving user to Firestore:', err);
    }
  } else {
    const stored = localStorage.getItem(`fluxos_users_${storeId}`);
    const list = stored ? JSON.parse(stored) : INITIAL_CASHIER_USERS;
    listeners.users.forEach(cb => cb(list));
  }
}

export async function deleteUserFromDb(id: string): Promise<void> {
  const storeId = getActiveStoreId();
  try {
    const stored = localStorage.getItem(`fluxos_users_${storeId}`);
    const list: CashierUser[] = stored ? JSON.parse(stored) : [];
    const filtered = list.filter(u => u.id !== id);
    localStorage.setItem(`fluxos_users_${storeId}`, JSON.stringify(filtered));
  } catch (e) {}

  const docRef = getStoreDoc('users', id);
  if (docRef) {
    try {
      await deleteDoc(docRef);
    } catch (err) {
      console.error('Error deleting user from Firestore:', err);
    }
  } else {
    const stored = localStorage.getItem(`fluxos_users_${storeId}`);
    const list = stored ? JSON.parse(stored) : INITIAL_CASHIER_USERS;
    listeners.users.forEach(cb => cb(list));
  }
}

export async function fetchCategoriesFromDb(): Promise<string[]> {
  const storeId = getActiveStoreId();
  const colRef = getStoreCol('categories');
  if (colRef) {
    try {
      const snap = await getDocs(colRef);
      if (!snap.empty) {
        const cats = snap.docs.map(d => (d.data() as any).name || d.id);
        localStorage.setItem(`fluxos_categories_${storeId}`, JSON.stringify(cats));
        return cats;
      }
    } catch (err) {
      console.error('Error fetching categories from Firestore:', err);
    }
  }
  return getCollection('categories', DEFAULT_PRODUCT_CATEGORIES);
}

export async function saveCategoryToDb(catName: string): Promise<void> {
  const storeId = getActiveStoreId();
  const trimmed = catName.trim();
  if (!trimmed) return;
  try {
    const stored = localStorage.getItem(`fluxos_categories_${storeId}`);
    const list: string[] = stored ? JSON.parse(stored) : [...DEFAULT_PRODUCT_CATEGORIES];
    if (!list.includes(trimmed)) list.push(trimmed);
    localStorage.setItem(`fluxos_categories_${storeId}`, JSON.stringify(list));
  } catch (e) {}

  const docRef = getStoreDoc('categories', trimmed);
  if (docRef) {
    try {
      await setDoc(docRef, { name: trimmed, updatedAt: new Date().toISOString() });
    } catch (err) {
      console.error('Error saving category to Firestore:', err);
    }
  } else {
    const stored = localStorage.getItem(`fluxos_categories_${storeId}`);
    const list = stored ? JSON.parse(stored) : DEFAULT_PRODUCT_CATEGORIES;
    listeners.categories.forEach(cb => cb(list));
  }
}

export async function deleteCategoryFromDb(catName: string): Promise<void> {
  const storeId = getActiveStoreId();
  try {
    const stored = localStorage.getItem(`fluxos_categories_${storeId}`);
    const list: string[] = stored ? JSON.parse(stored) : [];
    const filtered = list.filter(c => c !== catName);
    localStorage.setItem(`fluxos_categories_${storeId}`, JSON.stringify(filtered));
  } catch (e) {}

  const docRef = getStoreDoc('categories', catName);
  if (docRef) {
    try {
      await deleteDoc(docRef);
    } catch (err) {
      console.error('Error deleting category from Firestore:', err);
    }
  } else {
    const stored = localStorage.getItem(`fluxos_categories_${storeId}`);
    const list = stored ? JSON.parse(stored) : DEFAULT_PRODUCT_CATEGORIES;
    listeners.categories.forEach(cb => cb(list));
  }
}
