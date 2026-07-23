import React from 'react';
import { GlassWater, Plus, AlertCircle } from 'lucide-react';
import { Product } from '../types';

export interface ProductCardProps {
  product: Product;
  onAdd: (prod: Product) => void;
  theme: 'dark' | 'light';
}

const ProductCard: React.FC<ProductCardProps> = ({ product, onAdd, theme }) => {
  const isDark = theme === 'dark';
  
  const totalUnits = (product.stockBoxes * product.boxQuantity) + product.stockUnits;
  const isLowStock = totalUnits <= product.minStockUnits;
  const isOutOfStock = totalUnits === 0;

  return (
    <div
      onClick={() => !isOutOfStock && onAdd(product)}
      className={`group p-3 rounded-xl border flex flex-col justify-between transition-all duration-300 relative select-none ${
        isOutOfStock 
          ? 'opacity-50 cursor-not-allowed' 
          : 'cursor-pointer hover:scale-[1.01] active:scale-[0.99]'
      } ${
        isDark 
          ? 'bg-[#121212]/30 border-[#1C1C1C] hover:border-emerald-500/30 hover:bg-[#152E22]/10' 
          : 'bg-white border-gray-100 hover:border-emerald-200 hover:bg-emerald-50/20'
      }`}
      style={{
        boxShadow: isDark ? '0 4px 20px -2px rgba(0,0,0,0.3)' : '0 4px 15px -2px rgba(0,0,0,0.02)'
      }}
    >
      {/* Upper Section */}
      <div className="flex gap-3">
        {/* Product Image / Placeholder */}
        <div 
          className={`w-12 h-12 rounded-lg shrink-0 overflow-hidden flex items-center justify-center border ${
            isDark ? 'bg-black/40 border-[#222]' : 'bg-gray-50 border-gray-100'
          }`}
        >
          {product.image ? (
            <img 
              src={product.image} 
              alt={product.name} 
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <GlassWater className={`w-5 h-5 ${isDark ? 'text-gray-500' : 'text-gray-400'}`} />
          )}
        </div>

        {/* Name and SKU */}
        <div className="flex-1 min-w-0">
          <p className={`text-xs font-semibold truncate leading-snug ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>
            {product.name}
          </p>
          <div className="flex items-center gap-1.5 mt-0.5">
            <span className={`font-mono text-[9px] px-1 py-0.2 rounded border uppercase ${
              isDark ? 'text-gray-400 bg-gray-500/10 border-gray-500/15' : 'text-gray-500 bg-gray-50 border-gray-200/50'
            }`}>
              {product.category}
            </span>
            {isOutOfStock ? (
              <span className="text-[9px] font-medium text-red-500 flex items-center gap-0.5 font-sans">
                Sem Estoque
              </span>
            ) : isLowStock ? (
              <span className="text-[9px] font-medium text-amber-500 flex items-center gap-0.5 font-sans">
                <AlertCircle className="w-2.5 h-2.5" />
                Estoque Baixo
              </span>
            ) : null}
          </div>
        </div>
      </div>

      {/* Footer Price and Add Button */}
      <div className="flex justify-between items-center mt-3 pt-2.5 border-t border-dashed" style={{ borderColor: isDark ? '#1C1C1C' : '#F0F0F0' }}>
        <div>
          <span className={`text-[10px] block ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
            Preço Unitário
          </span>
          <span className={`text-xs font-mono font-bold ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}>
            R$ {product.sellPrice.toFixed(2)}
          </span>
        </div>

        {!isOutOfStock && (
          <div 
            className={`w-6 h-6 rounded-lg flex items-center justify-center transition-all duration-300 border ${
              isDark 
                ? 'bg-[#152E22] border-emerald-500/20 text-emerald-400 group-hover:bg-emerald-500 group-hover:text-black' 
                : 'bg-emerald-50 border-emerald-200 text-emerald-600 group-hover:bg-emerald-500 group-hover:text-white'
            }`}
          >
            <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductCard;
