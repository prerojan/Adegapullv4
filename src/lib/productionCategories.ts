// Production Category Rules Manager for FluxOS
// Manages which categories GO TO PRODUCTION vs DON'T GO TO PRODUCTION, and their designated sectors.

export interface ProductionCategoryRule {
  id: string;
  category: string;
  sendToProduction: boolean; // true = VAI para Produção, false = NÃO VAI para Produção
  targetSector: 'cozinha' | 'bar' | 'expedicao' | 'geral';
  autoPrintTicket: boolean;
  notes?: string;
}

export const DEFAULT_PRODUCTION_CATEGORY_RULES: ProductionCategoryRule[] = [
  { id: 'cat_p1', category: 'Cervejas', sendToProduction: true, targetSector: 'bar', autoPrintTicket: true, notes: 'Impressão Bar/Balcão' },
  { id: 'cat_p2', category: 'Destilados', sendToProduction: true, targetSector: 'bar', autoPrintTicket: true, notes: 'Impressão Bar/Balcão' },
  { id: 'cat_p3', category: 'Vinhos', sendToProduction: true, targetSector: 'bar', autoPrintTicket: true, notes: 'Impressão Bar/Balcão' },
  { id: 'cat_p4', category: 'Sem Álcool', sendToProduction: true, targetSector: 'bar', autoPrintTicket: true, notes: 'Refrigerantes e Sucos' },
  { id: 'cat_p5', category: 'Petiscos', sendToProduction: true, targetSector: 'cozinha', autoPrintTicket: true, notes: 'Preparo Cozinha' },
  { id: 'cat_p6', category: 'Lanches', sendToProduction: true, targetSector: 'cozinha', autoPrintTicket: true, notes: 'Preparo Cozinha' },
  { id: 'cat_p7', category: 'Pizzas', sendToProduction: true, targetSector: 'cozinha', autoPrintTicket: true, notes: 'Preparo Cozinha' },
  { id: 'cat_p8', category: 'Pratos', sendToProduction: true, targetSector: 'cozinha', autoPrintTicket: true, notes: 'Preparo Cozinha' },
  { id: 'cat_p9', category: 'Porções', sendToProduction: true, targetSector: 'cozinha', autoPrintTicket: true, notes: 'Preparo Cozinha' },
  { id: 'cat_p10', category: 'Cigarros', sendToProduction: false, targetSector: 'bar', autoPrintTicket: false, notes: 'Venda direta no caixa (sem preparo)' },
  { id: 'cat_p11', category: 'Tabacaria', sendToProduction: false, targetSector: 'bar', autoPrintTicket: false, notes: 'Venda direta no caixa (sem preparo)' },
  { id: 'cat_p12', category: 'Gelo', sendToProduction: true, targetSector: 'bar', autoPrintTicket: true, notes: 'Retirada no Bar' },
  { id: 'cat_p13', category: 'Combos', sendToProduction: true, targetSector: 'bar', autoPrintTicket: true, notes: 'Montagem Bar' },
  { id: 'cat_p14', category: 'Outros', sendToProduction: false, targetSector: 'geral', autoPrintTicket: false, notes: 'Não vai para a tela de produção' },
];

export function getProductionCategoryRules(): ProductionCategoryRule[] {
  try {
    const raw = localStorage.getItem('adegaos_production_category_rules_v1');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {
    console.warn('[ProductionCategories] Failed to parse rules:', e);
  }
  return DEFAULT_PRODUCTION_CATEGORY_RULES;
}

export function saveProductionCategoryRules(rules: ProductionCategoryRule[]): void {
  localStorage.setItem('adegaos_production_category_rules_v1', JSON.stringify(rules));
  window.dispatchEvent(new CustomEvent('adegaos_production_categories_updated', { detail: rules }));
}

/**
 * Checks whether a given product category should go to production.
 */
export function shouldCategoryGoToProduction(categoryName: string): boolean {
  if (!categoryName) return false;
  const rules = getProductionCategoryRules();
  const normalized = categoryName.trim().toLowerCase();
  
  const match = rules.find(r => r.category.trim().toLowerCase() === normalized);
  if (match) {
    return match.sendToProduction;
  }

  // Fallback defaults for unlisted categories
  const noProdKeywords = ['cigarro', 'tabacaria', 'conveniencia', 'outros', 'embalagem', 'servico', 'taxa'];
  if (noProdKeywords.some(k => normalized.includes(k))) {
    return false;
  }
  return true;
}

/**
 * Gets the target sector for a given category name.
 */
export function getCategoryProductionSector(categoryName: string): 'cozinha' | 'bar' | 'expedicao' | 'geral' {
  if (!categoryName) return 'bar';
  const rules = getProductionCategoryRules();
  const normalized = categoryName.trim().toLowerCase();

  const match = rules.find(r => r.category.trim().toLowerCase() === normalized);
  if (match) {
    return match.targetSector;
  }

  // Fallback heuristic:
  const kitchenKeywords = ['petisco', 'cozinha', 'lanche', 'porção', 'porcao', 'pizza', 'prato', 'comida', 'sobremesa', 'salgado', 'refeicao'];
  if (kitchenKeywords.some(k => normalized.includes(k))) {
    return 'cozinha';
  }
  return 'bar';
}

/**
 * Merges active product categories into the rules list so any new user-defined category automatically appears in the configuration list.
 */
export function syncCategoriesFromProducts(productCategories: string[]): ProductionCategoryRule[] {
  const currentRules = getProductionCategoryRules();
  const existingSet = new Set(currentRules.map(r => r.category.trim().toLowerCase()));

  let hasNew = false;
  const updated = [...currentRules];

  productCategories.forEach(catName => {
    if (!catName || !catName.trim()) return;
    const clean = catName.trim();
    if (!existingSet.has(clean.toLowerCase())) {
      hasNew = true;
      existingSet.add(clean.toLowerCase());
      const isKitchen = ['petisco', 'cozinha', 'lanche', 'porção', 'porcao', 'pizza', 'prato', 'comida', 'sobremesa'].some(k => clean.toLowerCase().includes(k));
      const isNoProd = ['cigarro', 'tabacaria', 'outros', 'conveniencia'].some(k => clean.toLowerCase().includes(k));
      
      updated.push({
        id: `cat_auto_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        category: clean,
        sendToProduction: !isNoProd,
        targetSector: isKitchen ? 'cozinha' : 'bar',
        autoPrintTicket: !isNoProd,
        notes: isNoProd ? 'Sem preparo na produção' : 'Adicionada automaticamente'
      });
    }
  });

  if (hasNew) {
    saveProductionCategoryRules(updated);
  }
  return updated;
}
