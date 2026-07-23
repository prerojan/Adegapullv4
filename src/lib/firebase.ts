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

// Helper to remove undefined properties before saving to Firestore (Firestore rejects undefined)
function cleanForFirestore<T>(obj: T): T {
  if (obj === null || obj === undefined) return obj;
  return JSON.parse(JSON.stringify(obj, (_key, value) => (value === undefined ? null : value)));
}

// Fallback LocalStorage State Listeners (when Firebase is disabled or multi-tab local)
const listeners = {
  products: new Set<(data: Product[]) => void>(),
  sales: new Set<(data: Sale[]) => void>(),
  suppliers: new Set<(data: Supplier[]) => void>(),
  transactions: new Set<(data: FinancialTransaction[]) => void>(),
  tables: new Set<(data: TableComandaState[]) => void>(),
  users: new Set<(data: CashierUser[]) => void>()
};

const syncChannel = typeof window !== 'undefined' && 'BroadcastChannel' in window ? new BroadcastChannel('fluxos_sync_channel') : null;

if (syncChannel) {
  syncChannel.onmessage = (event) => {
    const { key, data } = event.data || {};
    if (key && data && (listeners as any)[key]) {
      try {
        localStorage.setItem(`fluxos_${key}`, JSON.stringify(data));
      } catch (e) {}
      (listeners as any)[key].forEach((cb: any) => cb([...data]));
    }
  };
}

function getCollection<T>(key: string, initialData: T[]): T[] {
  try {
    const stored = localStorage.getItem(`fluxos_${key}`);
    if (stored) {
      return JSON.parse(stored);
    }
    localStorage.setItem(`fluxos_${key}`, JSON.stringify(initialData));
    return initialData;
  } catch {
    return initialData;
  }
}

function setCollection<T>(key: string, data: T[], listenerSet: Set<(data: T[]) => void>) {
  try {
    localStorage.setItem(`fluxos_${key}`, JSON.stringify(data));
  } catch (err) {
    console.error(`Error saving collection ${key}:`, err);
  }
  listenerSet.forEach(cb => cb([...data]));
  if (syncChannel) {
    try {
      syncChannel.postMessage({ key, data });
    } catch (e) {}
  }
}

// ================= SUBSCRIPTION METHODS (REAL-TIME INSTANT SYNC) =================

export function subscribeProducts(callback: (p: Product[]) => void) {
  callback(getCollection('products', INITIAL_PRODUCTS));
  if (db) {
    return onSnapshot(collection(db, 'products'), (snapshot) => {
      if (snapshot.empty) {
        INITIAL_PRODUCTS.forEach(p => setDoc(doc(db!, 'products', p.id), cleanForFirestore(p)));
        setCollection('products', INITIAL_PRODUCTS, listeners.products);
        callback(INITIAL_PRODUCTS);
      } else {
        const prods = snapshot.docs.map(d => d.data() as Product);
        setCollection('products', prods, listeners.products);
        callback(prods);
      }
    }, (err) => {
      console.error('Firestore products error:', err);
      callback(getCollection('products', INITIAL_PRODUCTS));
    });
  }
  listeners.products.add(callback);
  return () => { listeners.products.delete(callback); };
}

export function subscribeSales(callback: (s: Sale[]) => void) {
  callback(getCollection('sales', MOCK_SALES));
  if (db) {
    return onSnapshot(collection(db, 'sales'), (snapshot) => {
      if (snapshot.empty) {
        setCollection('sales', [], listeners.sales);
        callback([]);
      } else {
        const sales = snapshot.docs.map(d => d.data() as Sale);
        sales.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
        setCollection('sales', sales, listeners.sales);
        callback(sales);
      }
    }, (err) => {
      console.error('Firestore sales error:', err);
      callback(getCollection('sales', MOCK_SALES));
    });
  }
  listeners.sales.add(callback);
  return () => { listeners.sales.delete(callback); };
}

export function subscribeSuppliers(callback: (s: Supplier[]) => void) {
  callback(getCollection('suppliers', INITIAL_SUPPLIERS));
  if (db) {
    return onSnapshot(collection(db, 'suppliers'), (snapshot) => {
      if (snapshot.empty) {
        INITIAL_SUPPLIERS.forEach(s => setDoc(doc(db!, 'suppliers', s.id), cleanForFirestore(s)));
        setCollection('suppliers', INITIAL_SUPPLIERS, listeners.suppliers);
        callback(INITIAL_SUPPLIERS);
      } else {
        const sups = snapshot.docs.map(d => d.data() as Supplier);
        setCollection('suppliers', sups, listeners.suppliers);
        callback(sups);
      }
    }, (err) => {
      console.error('Firestore suppliers error:', err);
      callback(getCollection('suppliers', INITIAL_SUPPLIERS));
    });
  }
  listeners.suppliers.add(callback);
  return () => { listeners.suppliers.delete(callback); };
}

export function subscribeTransactions(callback: (t: FinancialTransaction[]) => void) {
  callback(getCollection('transactions', []));
  if (db) {
    return onSnapshot(collection(db, 'transactions'), (snapshot) => {
      const txs = snapshot.docs.map(d => d.data() as FinancialTransaction);
      setCollection('transactions', txs, listeners.transactions);
      callback(txs);
    }, (err) => {
      console.error('Firestore transactions error:', err);
      callback(getCollection('transactions', []));
    });
  }
  listeners.transactions.add(callback);
  return () => { listeners.transactions.delete(callback); };
}

export function subscribeTablesComandas(callback: (t: TableComandaState[]) => void) {
  callback(getCollection('tables', INITIAL_TABLES_COMANDAS));
  if (db) {
    return onSnapshot(collection(db, 'tables'), (snapshot) => {
      if (snapshot.empty) {
        INITIAL_TABLES_COMANDAS.forEach(t => setDoc(doc(db!, 'tables', t.id), cleanForFirestore(t)));
        setCollection('tables', INITIAL_TABLES_COMANDAS, listeners.tables);
        callback(INITIAL_TABLES_COMANDAS);
      } else {
        const tables = snapshot.docs.map(d => d.data() as TableComandaState);
        tables.sort((a, b) => a.number - b.number);
        setCollection('tables', tables, listeners.tables);
        callback(tables);
      }
    }, (err) => {
      console.error('Firestore tables error:', err);
      callback(getCollection('tables', INITIAL_TABLES_COMANDAS));
    });
  }
  listeners.tables.add(callback);
  return () => { listeners.tables.delete(callback); };
}

export function subscribeUsers(callback: (u: CashierUser[]) => void) {
  callback(getCollection('users', INITIAL_CASHIER_USERS));
  if (db) {
    return onSnapshot(collection(db, 'users'), (snapshot) => {
      if (snapshot.empty) {
        INITIAL_CASHIER_USERS.forEach(u => setDoc(doc(db!, 'users', u.id), cleanForFirestore(u)));
        setCollection('users', INITIAL_CASHIER_USERS, listeners.users);
        callback(INITIAL_CASHIER_USERS);
      } else {
        const users = snapshot.docs.map(d => d.data() as CashierUser);
        setCollection('users', users, listeners.users);
        callback(users);
      }
    }, (err) => {
      console.error('Firestore users error:', err);
      callback(getCollection('users', INITIAL_CASHIER_USERS));
    });
  }
  listeners.users.add(callback);
  return () => { listeners.users.delete(callback); };
}

// ================= DIRECT WRITE / DELETE DB OPERATIONS =================

export async function fetchProductsFromDb(): Promise<Product[]> {
  if (db) {
    try {
      const snap = await getDocs(collection(db, 'products'));
      if (!snap.empty) {
        const prods = snap.docs.map(d => d.data() as Product);
        setCollection('products', prods, listeners.products);
        return prods;
      }
    } catch (err) {
      console.error('Error fetching products from Firestore:', err);
    }
  }
  return getCollection('products', INITIAL_PRODUCTS);
}

export async function saveProductToDb(prod: Product): Promise<void> {
  const list = getCollection('products', INITIAL_PRODUCTS);
  const idx = list.findIndex(p => p.id === prod.id);
  if (idx >= 0) list[idx] = prod;
  else list.push(prod);
  setCollection('products', list, listeners.products);

  if (db) {
    try {
      await setDoc(doc(db, 'products', prod.id), cleanForFirestore(prod));
    } catch (err) {
      console.error('Error saving product to Firestore:', err);
    }
  }
}

export async function fetchSalesFromDb(): Promise<Sale[]> {
  if (db) {
    try {
      const snap = await getDocs(collection(db, 'sales'));
      if (!snap.empty) {
        const sales = snap.docs.map(d => d.data() as Sale);
        sales.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
        setCollection('sales', sales, listeners.sales);
        return sales;
      }
    } catch (err) {
      console.error('Error fetching sales from Firestore:', err);
    }
  }
  return getCollection('sales', MOCK_SALES);
}

export async function saveSaleToDb(sale: Sale): Promise<void> {
  const list = getCollection('sales', MOCK_SALES);
  const idx = list.findIndex(s => s.id === sale.id);
  if (idx >= 0) list[idx] = sale;
  else list.push(sale);
  setCollection('sales', list, listeners.sales);

  if (db) {
    try {
      await setDoc(doc(db, 'sales', sale.id), cleanForFirestore(sale));
    } catch (err) {
      console.error('Error saving sale to Firestore:', err);
    }
  }
}

export async function fetchSuppliersFromDb(): Promise<Supplier[]> {
  if (db) {
    try {
      const snap = await getDocs(collection(db, 'suppliers'));
      if (!snap.empty) {
        const sups = snap.docs.map(d => d.data() as Supplier);
        setCollection('suppliers', sups, listeners.suppliers);
        return sups;
      }
    } catch (err) {
      console.error('Error fetching suppliers from Firestore:', err);
    }
  }
  return getCollection('suppliers', INITIAL_SUPPLIERS);
}

export async function saveSupplierToDb(sup: Supplier): Promise<void> {
  const list = getCollection('suppliers', INITIAL_SUPPLIERS);
  const idx = list.findIndex(s => s.id === sup.id);
  if (idx >= 0) list[idx] = sup;
  else list.push(sup);
  setCollection('suppliers', list, listeners.suppliers);

  if (db) {
    try {
      await setDoc(doc(db, 'suppliers', sup.id), cleanForFirestore(sup));
    } catch (err) {
      console.error('Error saving supplier to Firestore:', err);
    }
  }
}

export async function deleteSupplierFromDb(id: string): Promise<void> {
  const list = getCollection('suppliers', INITIAL_SUPPLIERS).filter(s => s.id !== id);
  setCollection('suppliers', list, listeners.suppliers);

  if (db) {
    try {
      await deleteDoc(doc(db, 'suppliers', id));
    } catch (err) {
      console.error('Error deleting supplier from Firestore:', err);
    }
  }
}

export async function fetchTransactionsFromDb(): Promise<FinancialTransaction[]> {
  if (db) {
    try {
      const snap = await getDocs(collection(db, 'transactions'));
      if (!snap.empty) {
        const txs = snap.docs.map(d => d.data() as FinancialTransaction);
        setCollection('transactions', txs, listeners.transactions);
        return txs;
      }
    } catch (err) {
      console.error('Error fetching transactions from Firestore:', err);
    }
  }
  return getCollection('transactions', []);
}

export async function saveTransactionToDb(tx: FinancialTransaction): Promise<void> {
  const list = getCollection('transactions', []);
  const idx = list.findIndex(t => t.id === tx.id);
  if (idx >= 0) list[idx] = tx;
  else list.push(tx);
  setCollection('transactions', list, listeners.transactions);

  if (db) {
    try {
      await setDoc(doc(db, 'transactions', tx.id), cleanForFirestore(tx));
    } catch (err) {
      console.error('Error saving transaction to Firestore:', err);
    }
  }
}

export async function deleteTransactionFromDb(id: string): Promise<void> {
  const list = getCollection('transactions', []).filter(t => t.id !== id);
  setCollection('transactions', list, listeners.transactions);

  if (db) {
    try {
      await deleteDoc(doc(db, 'transactions', id));
    } catch (err) {
      console.error('Error deleting transaction from Firestore:', err);
    }
  }
}

export async function fetchTablesComandasFromDb(): Promise<TableComandaState[]> {
  if (db) {
    try {
      const snap = await getDocs(collection(db, 'tables'));
      if (!snap.empty) {
        const tables = snap.docs.map(d => d.data() as TableComandaState);
        tables.sort((a, b) => a.number - b.number);
        setCollection('tables', tables, listeners.tables);
        return tables;
      }
    } catch (err) {
      console.error('Error fetching tables from Firestore:', err);
    }
  }
  return getCollection('tables', INITIAL_TABLES_COMANDAS);
}

export async function saveTableComandaToDb(tc: TableComandaState): Promise<void> {
  const list = getCollection('tables', INITIAL_TABLES_COMANDAS);
  const idx = list.findIndex(t => t.id === tc.id);
  if (idx >= 0) list[idx] = tc;
  else list.push(tc);
  setCollection('tables', list, listeners.tables);

  if (db) {
    try {
      await setDoc(doc(db, 'tables', tc.id), cleanForFirestore(tc));
    } catch (err) {
      console.error('Error saving table to Firestore:', err);
    }
  }
}

export async function deleteTableComandaFromDb(id: string): Promise<void> {
  const list = getCollection('tables', INITIAL_TABLES_COMANDAS).filter(s => s.id !== id);
  setCollection('tables', list, listeners.tables);

  if (db) {
    try {
      await deleteDoc(doc(db, 'tables', id));
    } catch (err) {
      console.error('Error deleting table from Firestore:', err);
    }
  }
}

export async function fetchUsersFromDb(): Promise<CashierUser[]> {
  if (db) {
    try {
      const snap = await getDocs(collection(db, 'users'));
      if (!snap.empty) {
        const users = snap.docs.map(d => d.data() as CashierUser);
        setCollection('users', users, listeners.users);
        return users;
      }
    } catch (err) {
      console.error('Error fetching users from Firestore:', err);
    }
  }
  return getCollection('users', INITIAL_CASHIER_USERS);
}

export async function saveUserToDb(user: CashierUser): Promise<void> {
  const list = getCollection('users', INITIAL_CASHIER_USERS);
  const idx = list.findIndex(u => u.id === user.id);
  if (idx >= 0) list[idx] = user;
  else list.push(user);
  setCollection('users', list, listeners.users);

  if (db) {
    try {
      await setDoc(doc(db, 'users', user.id), cleanForFirestore(user));
    } catch (err) {
      console.error('Error saving user to Firestore:', err);
    }
  }
}

export async function deleteUserFromDb(id: string): Promise<void> {
  const list = getCollection('users', INITIAL_CASHIER_USERS).filter(u => u.id !== id);
  setCollection('users', list, listeners.users);

  if (db) {
    try {
      await deleteDoc(doc(db, 'users', id));
    } catch (err) {
      console.error('Error deleting user from Firestore:', err);
    }
  }
}
