import { ReactNode } from 'react';

export interface RecipeItem {
  ingredientProductId: string;
  quantity: number;
}

export interface Product {
  id: string;
  name: string;
  barcode: string;
  sku: string;
  category: string;
  brand: string;
  supplierId: string;
  costPrice: number;
  sellPrice: number;
  unit: 'UN' | 'LT' | 'KG' | string;
  boxQuantity: number;
  stockBoxes: number;
  stockUnits: number;
  minStockUnits: number;
  maxStockUnits: number;
  active: boolean;
  ageRestricted: boolean;
  notes?: string;
  image?: string;
  hasTechnicalSheet?: boolean;
  recipe?: RecipeItem[];
  leadTimeDays?: number;
  abcClass?: 'A' | 'B' | 'C' | string;
  margin?: number;
}

export interface Supplier {
  id: string;
  companyName: string;
  contactName: string;
  phone?: string;
  whatsapp?: string;
  email?: string;
  notes?: string;
}

export interface SaleItem {
  productId: string;
  quantity: number;
  unitPrice: number;
  notes?: string;
  status?: string;
  timestamp?: string;
  statusHistory?: any[];
}

export interface Sale {
  id: string;
  status: 'pago' | 'pendente' | 'cancelado' | string;
  paymentMethod: string;
  total: number;
  items: SaleItem[];
  timestamp: string;
  clientName?: string;
  openedBy?: string;
  tableId?: string;
  paymentSplit?: any;
  number?: number | string;
  cashierId?: string;
  discount?: number;
  type?: string;
  identifier?: string;
  subtotal?: number;
  cardBrand?: string;
  waiterName?: string;
}

export interface FinancialTransaction {
  id: string;
  type: 'receita' | 'despesa' | string;
  status: 'pago' | 'pendente' | 'cancelado' | string;
  category: string;
  value: number;
  description: string;
  timestamp?: string;
  date?: string;
  dueDate?: string;
  paymentMethod?: string;
}

export interface TableItem {
  productId: string;
  quantity: number;
  unitPrice: number;
  notes?: string;
  status?: string;
  timestamp?: string;
  statusHistory?: any[];
}

export interface TableComandaState {
  id: string;
  type: 'mesa' | 'comanda' | string;
  number: number;
  tableName?: string;
  status: 'livre' | 'ocupada' | 'fechando' | string;
  items: TableItem[];
  subtotal?: number;
}

export interface CashierUser {
  id: string;
  name: string;
  pin: string;
  role: 'admin' | 'manager' | 'finance' | 'cashier' | 'waiter' | 'stock' | 'kitchen' | 'bar' | string;
  active: boolean;
}

export interface Shift {
  id: string;
  openedBy: string;
  openTime: string;
  closeTime?: string;
  initialBalance: number;
  cashSales: number;
  otherSales: {
    pix: number;
    card: number;
    debt: number;
  };
  suprimentos: {
    id: string;
    amount: number;
    reason: string;
    timestamp: string;
  }[];
  sangrias: {
    id: string;
    amount: number;
    reason: string;
    timestamp: string;
  }[];
  status?: string;
  countedAmount?: number;
  notes?: string;
  isOpen?: boolean;
  closingCashCounted?: number;
  discrepancy?: number;
}

export interface SyncQueueItem {
  id: string;
  timestamp: string;
  action: 'create_sale' | string;
  data: {
    sale: Sale;
    tx: FinancialTransaction;
    tableId: string;
  };
  status: 'pending' | 'synced' | 'failed' | string;
}

// Global window extensions for custom premium dialogs and alert overrides
declare global {
  interface Window {
    confirmModal: (message: string, onConfirm: () => void, onCancel?: () => void) => void;
  }
}
