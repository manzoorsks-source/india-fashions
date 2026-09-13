import React from 'react';
import { Filter, X, RotateCcw } from 'lucide-react';

interface FilterSidebarProps {
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  selectedColor: string;
  setSelectedColor: (c: string) => void;
  selectedFabric: string;
  setSelectedFabric: (f: string) => void;
  inStockOnly: boolean;
  setInStockOnly: (v: boolean) => void;
  onSaleOnly: boolean;
  setOnSaleOnly: (v: boolean) => void;
  sortOption: string;
  setSortOption: (s: string) => void;
  onReset: () => void;
  fabrics: string[];
  colors: { name: string; hex: string }[];
}

export const FilterSidebar: React.FC<FilterSidebarProps> = ({
  searchQuery,
  setSearchQuery,
  selectedColor,
  setSelectedColor,
  selectedFabric,
  setSelectedFabric,
  inStockOnly,
  setInStockOnly,
  onSaleOnly,
  setOnSaleOnly,
  sortOption,
  setSortOption,
  onReset,
  fabrics,
  colors
}) => {
  return (
    <aside
      style={{
        backgroundColor: 'var(--color-silk-cream)',
        borderRadius: '10px',
        border: '1px solid var(--color-border-light)',
        padding: '20px',
        boxShadow: 'var(--shadow-sm)',
        display: 'flex',
        flexDirection: 'column',
        gap: '24px'
      }}
    >
      {/* Header & Reset */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--color-border-subtle)', paddingBottom: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Filter size={18} color="var(--color-emerald)" />
          <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--color-charcoal)' }}>Filter Collection</h3>
        </div>
        <button
          onClick={onReset}
          style={{
            fontSize: '0.78rem',
            color: 'var(--color-maroon)',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            fontWeight: 600
          }}
        >
          <RotateCcw size={13} />
          <span>Reset</span>
        </button>
      </div>

      {/* Search Input */}
      <div>
        <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: 'var(--color-charcoal)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          Search Weave / SKU
        </label>
        <input
          type="text"
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          placeholder="e.g. Kanjeevaram, Zari, KJ-EMR"
          style={{
            width: '100%',
            padding: '10px 12px',
            borderRadius: '6px',
            border: '1px solid var(--color-border-subtle)',
            backgroundColor: '#ffffff',
            fontSize: '0.85rem'
          }}
        />
      </div>

      {/* Sorting */}
      <div>
        <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: 'var(--color-charcoal)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          Sort By
        </label>
        <select
          value={sortOption}
          onChange={e => setSortOption(e.target.value)}
          style={{
            width: '100%',
            padding: '10px 12px',
            borderRadius: '6px',
            border: '1px solid var(--color-border-subtle)',
            backgroundColor: '#ffffff',
            fontSize: '0.85rem',
            cursor: 'pointer'
          }}
        >
          <option value="newest">Newest Arrivals</option>
          <option value="price_asc">Price: Low to High</option>
          <option value="price_desc">Price: High to Low</option>
        </select>
      </div>

      {/* Color Filter Swatches */}
      <div>
        <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: 'var(--color-charcoal)', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          Color Palette
        </label>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
          {colors.map(col => {
            const isSelected = selectedColor.toLowerCase() === col.name.toLowerCase();
            return (
              <button
                key={col.name}
                onClick={() => setSelectedColor(isSelected ? '' : col.name)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '4px 10px',
                  borderRadius: '999px',
                  border: isSelected ? '1.5px solid var(--color-gold)' : '1px solid var(--color-border-subtle)',
                  backgroundColor: isSelected ? 'rgba(15, 95, 86, 0.1)' : '#ffffff',
                  fontSize: '0.78rem',
                  fontWeight: isSelected ? 700 : 500,
                  color: isSelected ? 'var(--color-emerald)' : 'var(--color-charcoal)'
                }}
              >
                <span
                  style={{
                    width: '12px',
                    height: '12px',
                    borderRadius: '50%',
                    backgroundColor: col.hex,
                    border: '1px solid rgba(0,0,0,0.1)'
                  }}
                />
                <span>{col.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Fabric Types */}
      <div>
        <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: 'var(--color-charcoal)', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          Heritage Fabric Weave
        </label>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {fabrics.map(fab => {
            const isSelected = selectedFabric === fab;
            return (
              <label
                key={fab}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  fontSize: '0.82rem',
                  color: 'var(--color-charcoal)',
                  cursor: 'pointer'
                }}
              >
                <input
                  type="radio"
                  name="fabric"
                  checked={isSelected}
                  onChange={() => setSelectedFabric(isSelected ? '' : fab)}
                  style={{ accentColor: 'var(--color-emerald)' }}
                />
                <span>{fab}</span>
              </label>
            );
          })}
          {selectedFabric && (
            <button
              onClick={() => setSelectedFabric('')}
              style={{ fontSize: '0.75rem', color: 'var(--color-maroon)', textAlign: 'left', marginTop: '4px' }}
            >
              Clear fabric filter
            </button>
          )}
        </div>
      </div>

      {/* Availability & Sale status Toggles */}
      <div style={{ borderTop: '1px solid var(--color-border-subtle)', paddingTop: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', cursor: 'pointer' }}>
          <input
            type="checkbox"
            checked={inStockOnly}
            onChange={e => setInStockOnly(e.target.checked)}
            style={{ accentColor: 'var(--color-emerald)' }}
          />
          <span>In-Stock Items Only</span>
        </label>

        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', cursor: 'pointer' }}>
          <input
            type="checkbox"
            checked={onSaleOnly}
            onChange={e => setOnSaleOnly(e.target.checked)}
            style={{ accentColor: 'var(--color-maroon)' }}
          />
          <span>Festive Sale / Discounted</span>
        </label>
      </div>
    </aside>
  );
};
