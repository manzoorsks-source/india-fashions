import React, { useState, useEffect } from 'react';
import { Product } from '../../shared/types.js';
import { apiRequest } from '../utils/api.js';
import { ProductCard } from '../components/customer/ProductCard.js';
import { FilterSidebar } from '../components/customer/FilterSidebar.js';
import { Filter, Search, Sparkles } from 'lucide-react';

interface CategoryPageProps {
  onSelectProduct: (product: Product) => void;
}

export const CategoryPage: React.FC<CategoryPageProps> = ({ onSelectProduct }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedColor, setSelectedColor] = useState('');
  const [selectedFabric, setSelectedFabric] = useState('');
  const [inStockOnly, setInStockOnly] = useState(false);
  const [onSaleOnly, setOnSaleOnly] = useState(false);
  const [sortOption, setSortOption] = useState('newest');

  const fabrics = [
    'Pure Mulberry Silk with 2G Gold Zari',
    'Pure Georgette Silk with Kadwa Antique Zari',
    'Chanderi Silk Tissue with Meenakari Butis',
    'Pure Mulberry Silk with Tapestry Peacock Pallu',
    'Patan Pure Mulberry Silk Double Ikat',
    'Pure Wild Tussar Silk with Resham Kantha',
    'Pure Silk Organza with Resham Embroidery',
    'Pure Handloom Silk Cotton Blend'
  ];

  const colors = [
    { name: 'Emerald', hex: '#0F5F56' },
    { name: 'Maroon', hex: '#6A1B29' },
    { name: 'Gold', hex: '#D4AF37' },
    { name: 'Navy', hex: '#102A43' },
    { name: 'Teal', hex: '#005F73' },
    { name: 'Purple', hex: '#4A154B' },
    { name: 'Beige', hex: '#D4B996' },
    { name: 'Blue', hex: '#A0C4E2' },
    { name: 'Pink', hex: '#C2185B' },
    { name: 'Yellow', hex: '#E0A96D' }
  ];

  const fetchProducts = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (searchQuery) params.set('search', searchQuery);
      if (selectedColor) params.set('color', selectedColor);
      if (selectedFabric) params.set('fabric', selectedFabric);
      if (inStockOnly) params.set('inStockOnly', 'true');
      if (onSaleOnly) params.set('onSale', 'true');
      if (sortOption) params.set('sort', sortOption);

      const res = await apiRequest<{ products: Product[] }>(`/products?${params.toString()}`);
      if (res?.products) {
        setProducts(res.products);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load catalog');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [searchQuery, selectedColor, selectedFabric, inStockOnly, onSaleOnly, sortOption]);

  const handleReset = () => {
    setSearchQuery('');
    setSelectedColor('');
    setSelectedFabric('');
    setInStockOnly(false);
    setOnSaleOnly(false);
    setSortOption('newest');
  };

  return (
    <div style={{ padding: '36px 0 60px' }}>
      <div className="container">
        {/* Category Header */}
        <div style={{ marginBottom: '32px' }}>
          <p style={{ fontSize: '0.8rem', color: 'var(--color-gold-dark)', textTransform: 'uppercase', letterSpacing: '0.12em', fontWeight: 700 }}>
            Royal Heritage Collection
          </p>
          <h1 style={{ fontSize: '2.4rem', color: 'var(--color-emerald-dark)', fontFamily: 'var(--font-serif-brand)', marginTop: '4px' }}>
            Handcrafted Sarees
          </h1>
          <p style={{ fontSize: '0.95rem', color: 'var(--color-charcoal-muted)', fontFamily: 'var(--font-serif-body)', maxWidth: '680px', marginTop: '6px' }}>
            Explore our curated heirloom sarees. Each weave tells the story of generations of Indian handloom mastery, from Kanchipuram temple korvai to Varanasi kadwa brocades.
          </p>
        </div>

        {/* Content Layout: Filter Sidebar + Products Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '280px 1fr',
            gap: '32px',
            alignItems: 'start'
          }}
          className="category-layout"
        >
          {/* Sidebar */}
          <FilterSidebar
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            selectedColor={selectedColor}
            setSelectedColor={setSelectedColor}
            selectedFabric={selectedFabric}
            setSelectedFabric={setSelectedFabric}
            inStockOnly={inStockOnly}
            setInStockOnly={setInStockOnly}
            onSaleOnly={onSaleOnly}
            setOnSaleOnly={setOnSaleOnly}
            sortOption={sortOption}
            setSortOption={setSortOption}
            onReset={handleReset}
            fabrics={fabrics}
            colors={colors}
          />

          {/* Grid Stage */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <span style={{ fontSize: '0.88rem', color: '#64748B', fontWeight: 500 }}>
                Showing <strong>{products.length}</strong> master weaves
              </span>
            </div>

            {loading ? (
              <div style={{ textAlign: 'center', padding: '80px 20px', backgroundColor: 'var(--color-silk-cream)', borderRadius: '8px' }}>
                <Sparkles size={32} color="var(--color-gold)" style={{ margin: '0 auto 12px', animation: 'spin 2s linear infinite' }} />
                <p style={{ fontSize: '0.95rem', color: 'var(--color-charcoal-muted)' }}>Fetching handwoven sarees...</p>
              </div>
            ) : error ? (
              <div style={{ padding: '24px', backgroundColor: '#FEE2E2', color: '#991B1B', borderRadius: '8px', textAlign: 'center' }}>
                <p style={{ fontWeight: 600 }}>Error loading collection</p>
                <p style={{ fontSize: '0.85rem', marginTop: '4px' }}>{error}</p>
                <button onClick={fetchProducts} className="btn-outline" style={{ marginTop: '12px' }}>Retry</button>
              </div>
            ) : products.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px 20px', backgroundColor: 'var(--color-silk-cream)', borderRadius: '10px', border: '1px solid var(--color-border-subtle)' }}>
                <Search size={40} color="#CBD5E1" style={{ margin: '0 auto 14px' }} />
                <h3 style={{ fontSize: '1.1rem', color: 'var(--color-charcoal)', marginBottom: '6px' }}>No sarees matched your filters</h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--color-charcoal-muted)', marginBottom: '16px' }}>
                  Try resetting your color, price, or fabric selections to view our full collection.
                </p>
                <button onClick={handleReset} className="btn-primary">
                  Reset All Filters
                </button>
              </div>
            ) : (
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
                  gap: '24px'
                }}
              >
                {products.map(product => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    onSelectProduct={onSelectProduct}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 860px) {
          .category-layout {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
};
