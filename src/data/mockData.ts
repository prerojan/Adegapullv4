import { Product, Supplier, Sale, TableComandaState, CashierUser } from '../types';

export const INITIAL_SUPPLIERS: Supplier[] = [
  {
    id: 's-1',
    companyName: 'Ambev S.A. Distribuidora',
    contactName: 'Ricardo de Oliveira',
    phone: '(11) 98765-4321',
    whatsapp: '11987654321',
    email: 'comercial.ambev@ambev.com.br',
    notes: 'Fornecedor principal de cervejas e refrigerantes. Entrega programada às terças-feiras.'
  },
  {
    id: 's-2',
    companyName: 'Coca-Cola FEMSA Brasil',
    contactName: 'Mariana Costa',
    phone: '(11) 97654-3210',
    whatsapp: '11976543210',
    email: 'atendimento.femsa@cocacola.com.br',
    notes: 'Fornecedor de águas, sucos, refrigerantes e isotônicos. Pedido mínimo de R$ 500,00.'
  },
  {
    id: 's-3',
    companyName: 'Pernod Ricard Brasil Ltda',
    contactName: 'Andre Silva',
    phone: '(11) 96543-2109',
    whatsapp: '11965432109',
    email: 'vendas.ricard@pernod-ricard.com',
    notes: 'Distribuidor exclusivo de destilados premium (Absolut Regular, Chivas, Beefeater).'
  }
];

export const INITIAL_PRODUCTS: Product[] = [
  {
    id: 'p-1',
    name: 'Cerveja Stella Artois Long Neck 330ml',
    barcode: '7891991000814',
    sku: 'STELLA-LN-330',
    category: 'Cervejas',
    brand: 'Stella Artois',
    supplierId: 's-1',
    costPrice: 3.80,
    sellPrice: 8.50,
    unit: 'UN',
    boxQuantity: 24,
    stockBoxes: 12,
    stockUnits: 15,
    minStockUnits: 48,
    maxStockUnits: 480,
    active: true,
    ageRestricted: true,
    notes: 'Cerveja lager premium. Manter sob refrigeração entre 0°C e 4°C.',
    image: 'https://images.unsplash.com/photo-1600788886242-5c96aabe3757?auto=format&fit=crop&q=80&w=200',
    hasTechnicalSheet: false,
    recipe: [],
    leadTimeDays: 2
  },
  {
    id: 'p-2',
    name: 'Cerveja Heineken Long Neck 330ml',
    barcode: '7891055000729',
    sku: 'HEIN-LN-330',
    category: 'Cervejas',
    brand: 'Heineken',
    supplierId: 's-1',
    costPrice: 4.20,
    sellPrice: 9.00,
    unit: 'UN',
    boxQuantity: 24,
    stockBoxes: 8,
    stockUnits: 12,
    minStockUnits: 48,
    maxStockUnits: 480,
    active: true,
    ageRestricted: true,
    notes: 'Cerveja puro malte lager premium. Temperatura de serviço recomendada: 2°C.',
    image: 'https://images.unsplash.com/photo-1568649929103-28fffe997658?auto=format&fit=crop&q=80&w=200',
    hasTechnicalSheet: false,
    recipe: [],
    leadTimeDays: 2
  },
  {
    id: 'p-3',
    name: 'Vodka Absolut Regular 1L',
    barcode: '7312040017072',
    sku: 'ABS-REG-1L',
    category: 'Destilados',
    brand: 'Absolut',
    supplierId: 's-3',
    costPrice: 52.00,
    sellPrice: 98.00,
    unit: 'UN',
    boxQuantity: 6,
    stockBoxes: 3,
    stockUnits: 4,
    minStockUnits: 6,
    maxStockUnits: 36,
    active: true,
    ageRestricted: true,
    notes: 'Vodka importada da Suécia. Ideal para drinks refinados.',
    image: 'https://images.unsplash.com/photo-1527061011665-3652c757a4d4?auto=format&fit=crop&q=80&w=200',
    hasTechnicalSheet: false,
    recipe: [],
    leadTimeDays: 4
  },
  {
    id: 'p-4',
    name: 'Água Mineral Crystal Sem Gás 500ml',
    barcode: '7894900530001',
    sku: 'CRYST-SG-500',
    category: 'Sem Álcool',
    brand: 'Crystal',
    supplierId: 's-2',
    costPrice: 0.90,
    sellPrice: 3.50,
    unit: 'UN',
    boxQuantity: 12,
    stockBoxes: 15,
    stockUnits: 8,
    minStockUnits: 24,
    maxStockUnits: 240,
    active: true,
    ageRestricted: false,
    notes: 'Água mineral natural sem gás.',
    image: 'https://images.unsplash.com/photo-1608885898957-a599fb15ec35?auto=format&fit=crop&q=80&w=200',
    hasTechnicalSheet: false,
    recipe: [],
    leadTimeDays: 2
  },
  {
    id: 'p-5',
    name: 'Refrigerante Coca-Cola Lata 350ml',
    barcode: '7894900011517',
    sku: 'COCA-LT-350',
    category: 'Sem Álcool',
    brand: 'Coca-Cola',
    supplierId: 's-2',
    costPrice: 1.85,
    sellPrice: 5.50,
    unit: 'UN',
    boxQuantity: 12,
    stockBoxes: 20,
    stockUnits: 10,
    minStockUnits: 36,
    maxStockUnits: 360,
    active: true,
    ageRestricted: false,
    notes: 'Refrigerante sabor cola lata original.',
    image: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?auto=format&fit=crop&q=80&w=200',
    hasTechnicalSheet: false,
    recipe: [],
    leadTimeDays: 2
  }
];

export const INITIAL_CASHIER_USERS: CashierUser[] = [
  {
    id: 'u-1',
    name: 'Carlos Alberto (Diretoria)',
    pin: '1234',
    role: 'admin',
    active: true
  },
  {
    id: 'u-2',
    name: 'Roberto Souza (Gerente Operacional)',
    pin: '5678',
    role: 'manager',
    active: true
  },
  {
    id: 'u-3',
    name: 'Fernanda Lima (Operador de Caixa)',
    pin: '0000',
    role: 'cashier',
    active: true
  },
  {
    id: 'u-4',
    name: 'Thiago Mendes (Serviço de Salão)',
    pin: '1111',
    role: 'waiter',
    active: true
  }
];

export const INITIAL_TABLES_COMANDAS: TableComandaState[] = [
  { id: 't-1', type: 'mesa', number: 1, status: 'livre', items: [] },
  { id: 't-2', type: 'mesa', number: 2, status: 'livre', items: [] },
  { id: 't-3', type: 'mesa', number: 3, status: 'livre', items: [] },
  { id: 't-4', type: 'mesa', number: 4, status: 'livre', items: [] },
  { id: 't-5', type: 'mesa', number: 5, status: 'livre', items: [] },
  { id: 't-6', type: 'mesa', number: 6, status: 'livre', items: [] },
  { id: 't-7', type: 'mesa', number: 7, status: 'livre', items: [] },
  { id: 't-8', type: 'mesa', number: 8, status: 'livre', items: [] },
  { id: 'c-101', type: 'comanda', number: 101, status: 'livre', items: [] },
  { id: 'c-102', type: 'comanda', number: 102, status: 'livre', items: [] },
  { id: 'c-103', type: 'comanda', number: 103, status: 'livre', items: [] },
  { id: 'c-104', type: 'comanda', number: 104, status: 'livre', items: [] }
];

export const MOCK_SALES: Sale[] = [
  {
    id: 'v-1',
    status: 'pago',
    paymentMethod: 'pix',
    total: 35.50,
    items: [
      { productId: 'p-1', quantity: 2, unitPrice: 8.50 },
      { productId: 'p-3', quantity: 0.188, unitPrice: 98.00 } // equivale a uma dose (aprox. 188ml se vendido proporcional ou dose cheia)
    ],
    timestamp: new Date(Date.now() - 172800000).toISOString(), // 2 dias atrás
    clientName: 'Consumidor Final',
    openedBy: 'Fernanda Lima'
  },
  {
    id: 'v-2',
    status: 'pago',
    paymentMethod: 'dinheiro',
    total: 54.00,
    items: [
      { productId: 'p-2', quantity: 6, unitPrice: 9.00 }
    ],
    timestamp: new Date(Date.now() - 86400000).toISOString(), // 1 dia atrás
    clientName: 'Consumidor Final',
    openedBy: 'Fernanda Lima'
  },
  {
    id: 'v-3',
    status: 'pago',
    paymentMethod: 'debito',
    total: 21.50,
    items: [
      { productId: 'p-1', quantity: 2, unitPrice: 8.50 },
      { productId: 'p-4', quantity: 1, unitPrice: 3.50 },
      { productId: 'p-5', quantity: 1, unitPrice: 5.50 }
    ],
    timestamp: new Date().toISOString(), // hoje
    clientName: 'Marcos de Souza',
    openedBy: 'Fernanda Lima'
  }
];
