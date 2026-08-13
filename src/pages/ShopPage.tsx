import { useEffect, useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { SlidersHorizontal, X, ChevronDown } from 'lucide-react';
import { ProductCard } from '@/components/ProductCard';
import { ProductCardSkeleton, Button, EmptyState } from '@/components/ui';
import { useCategories } from '@/lib/hooks';
import { supabase } from '@/lib/supabase';
import type { Product } from '@/types';
import { cn } from '@/lib/utils';

const ALL_SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL', '28', '30', '32', '34', '36', '38', '7', '8', '9', '10', '11', '12', 'One Size'];
const ALL_COLORS = ['Black', 'White', 'Charcoal', 'Navy', 'Grey', 'Olive', 'Cream', 'Sand', 'Brown', 'Tan', 'Burgundy', 'Khaki', 'Blue', 'Sage'];

type SortOption = 'newest' | 'price-asc' | 'price-desc' | 'popular' | 'rating';

export function ShopPage({ title = 'All Products', categorySlug }: { title?: string; categorySlug?: string }) {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const { categories } = useCategories();

  const [selectedCategories, setSelectedCategories] = useState<string[]>(categorySlug ? [categorySlug] : []);
  const [selectedSizes, setSelectedSizes] = useState<string[]>([]);
  const [selectedColors, setSelectedColors] = useState<string[]>([]);
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 99999]);
  const [minRating, setMinRating] = useState(0);
  const [sort, setSort] = useState<SortOption>('newest');

  useEffect(() => {
    (async () => {
      setLoading(true);
      let query = supabase
        .from('products')
        .select(`*, images:product_images(*), category:categories(*)`);

      if (categorySlug) {
        const { data: cat } = await supabase.from('categories').select('id').eq('slug', categorySlug).maybeSingle();
        if (cat) query = query.eq('category_id', cat.id);
      }

      const { data } = await query.order('created_at', { ascending: false });
      setProducts((data || []) as Product[]);
      setLoading(false);
    })();
  }, [categorySlug]);

  const filtered = useMemo(() => {
    let result = [...products];

    if (selectedCategories.length > 0 && !categorySlug) {
      const catIds = categories.filter((c) => selectedCategories.includes(c.slug)).map((c) => c.id);
      result = result.filter((p) => p.category_id && catIds.includes(p.category_id));
    }
    if (selectedSizes.length > 0) {
      result = result.filter((p) => p.sizes.some((s) => selectedSizes.includes(s)));
    }
    if (selectedColors.length > 0) {
      result = result.filter((p) => p.colors.some((c) => selectedColors.some((sc) => c.toLowerCase().includes(sc.toLowerCase()))));
    }
    result = result.filter((p) => {
      const price = p.discount_price && p.discount_price < p.price ? p.discount_price : p.price;
      return price >= priceRange[0] && price <= priceRange[1];
    });
    if (minRating > 0) result = result.filter((p) => p.rating >= minRating);

    switch (sort) {
      case 'price-asc': result.sort((a, b) => (a.discount_price || a.price) - (b.discount_price || b.price)); break;
      case 'price-desc': result.sort((a, b) => (b.discount_price || b.price) - (a.discount_price || a.price)); break;
      case 'popular': result.sort((a, b) => b.review_count - a.review_count); break;
      case 'rating': result.sort((a, b) => b.rating - a.rating); break;
      default: break;
    }
    return result;
  }, [products, selectedCategories, selectedSizes, selectedColors, priceRange, minRating, sort, categories, categorySlug]);

  const toggleArray = (arr: string[], val: string, setter: (v: string[]) => void) => {
    setter(arr.includes(val) ? arr.filter((v) => v !== val) : [...arr, val]);
  };

  const resetFilters = () => {
    setSelectedCategories([]);
    setSelectedSizes([]);
    setSelectedColors([]);
    setPriceRange([0, 99999]);
    setMinRating(0);
  };

  const activeFilterCount = selectedCategories.length + selectedSizes.length + selectedColors.length + (minRating > 0 ? 1 : 0);

  const FilterPanel = () => (
    <div className="space-y-6">
      {/* Categories */}
      {!categorySlug && (
        <div>
          <h3 className="mb-3 text-sm font-semibold text-ink-900">Category</h3>
          <div className="space-y-2">
            {categories.map((cat) => (
              <label key={cat.id} className="flex items-center gap-2 text-sm text-ink-600 cursor-pointer hover:text-ink-900">
                <input
                  type="checkbox"
                  checked={selectedCategories.includes(cat.slug)}
                  onChange={() => toggleArray(selectedCategories, cat.slug, setSelectedCategories)}
                  className="h-4 w-4 rounded border-ink-300 text-ink-900 focus:ring-ink-900"
                />
                {cat.name}
              </label>
            ))}
          </div>
        </div>
      )}

      {/* Sizes */}
      <div>
        <h3 className="mb-3 text-sm font-semibold text-ink-900">Size</h3>
        <div className="flex flex-wrap gap-2">
          {ALL_SIZES.map((size) => (
            <button
              key={size}
              onClick={() => toggleArray(selectedSizes, size, setSelectedSizes)}
              className={cn(
                'rounded-lg border px-3 py-1.5 text-xs font-medium transition-all',
                selectedSizes.includes(size) ? 'border-ink-900 bg-ink-900 text-white' : 'border-ink-200 text-ink-700 hover:border-ink-400'
              )}
            >
              {size}
            </button>
          ))}
        </div>
      </div>

      {/* Colors */}
      <div>
        <h3 className="mb-3 text-sm font-semibold text-ink-900">Color</h3>
        <div className="space-y-2">
          {ALL_COLORS.map((color) => (
            <label key={color} className="flex items-center gap-2 text-sm text-ink-600 cursor-pointer hover:text-ink-900">
              <input
                type="checkbox"
                checked={selectedColors.includes(color)}
                onChange={() => toggleArray(selectedColors, color, setSelectedColors)}
                className="h-4 w-4 rounded border-ink-300 text-ink-900 focus:ring-ink-900"
              />
              {color}
            </label>
          ))}
        </div>
      </div>

      {/* Price */}
      <div>
        <h3 className="mb-3 text-sm font-semibold text-ink-900">Price Range</h3>
        <div className="flex items-center gap-2">
          <input
            type="number"
            value={priceRange[0]}
            onChange={(e) => setPriceRange([Number(e.target.value), priceRange[1]])}
            className="w-20 rounded-lg border border-ink-200 px-2 py-1.5 text-sm"
            min={0}
          />
          <span className="text-ink-400">—</span>
          <input
            type="number"
            value={priceRange[1]}
            onChange={(e) => setPriceRange([priceRange[0], Number(e.target.value)])}
            className="w-20 rounded-lg border border-ink-200 px-2 py-1.5 text-sm"
            min={0}
          />
        </div>
      </div>

      {/* Rating */}
      <div>
        <h3 className="mb-3 text-sm font-semibold text-ink-900">Rating</h3>
        <div className="space-y-2">
          {[4, 3, 2, 1].map((r) => (
            <label key={r} className="flex items-center gap-2 text-sm text-ink-600 cursor-pointer hover:text-ink-900">
              <input
                type="radio"
                name="rating"
                checked={minRating === r}
                onChange={() => setMinRating(r)}
                className="h-4 w-4 border-ink-300 text-ink-900 focus:ring-ink-900"
              />
              {r} stars & up
            </label>
          ))}
          <label className="flex items-center gap-2 text-sm text-ink-600 cursor-pointer hover:text-ink-900">
            <input type="radio" name="rating" checked={minRating === 0} onChange={() => setMinRating(0)} className="h-4 w-4 border-ink-300 text-ink-900" />
            All ratings
          </label>
        </div>
      </div>

      {activeFilterCount > 0 && (
        <Button variant="outline" size="sm" onClick={resetFilters} className="w-full">
          Clear all filters ({activeFilterCount})
        </Button>
      )}
    </div>
  );

  return (
    <div className="mx-auto max-w-7xl px-3 py-6 sm:px-4 sm:py-8">
      {/* Header */}
      <div className="mb-5 sm:mb-6">
        <h1 className="font-display text-2xl font-bold text-ink-900 sm:text-3xl">{title}</h1>
        <p className="mt-1 text-sm text-ink-500">{filtered.length} products</p>
      </div>

      <div className="flex gap-4 sm:gap-8">
        {/* Desktop sidebar */}
        <aside className="hidden w-64 shrink-0 lg:block">
          <div className="sticky top-24">
            <FilterPanel />
          </div>
        </aside>

        {/* Main */}
        <div className="flex-1">
          {/* Toolbar */}
          <div className="mb-4 flex items-center justify-between gap-2 sm:gap-4">
            <button
              onClick={() => setShowFilters(true)}
              className="flex items-center gap-2 rounded-lg border border-ink-200 px-3 py-2 text-sm font-medium text-ink-700 lg:hidden"
            >
              <SlidersHorizontal size={16} /> Filters {activeFilterCount > 0 && `(${activeFilterCount})`}
            </button>
            <div className="relative ml-auto">
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value as SortOption)}
                className="appearance-none rounded-lg border border-ink-200 bg-white py-2 pl-3 pr-9 text-xs font-medium text-ink-700 focus:outline-none focus:ring-1 focus:ring-ink-900 sm:pl-4 sm:pr-10 sm:text-sm"
              >
                <option value="newest">Sort: Newest</option>
                <option value="price-asc">Price: Low to High</option>
                <option value="price-desc">Price: High to Low</option>
                <option value="popular">Most Popular</option>
                <option value="rating">Highest Rated</option>
              </select>
              <ChevronDown size={16} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-ink-400" />
            </div>
          </div>

          {/* Grid */}
          {loading ? (
            <div className="grid grid-cols-2 gap-3 sm:gap-4 sm:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4">
              {Array.from({ length: 8 }).map((_, i) => <ProductCardSkeleton key={i} />)}
            </div>
          ) : filtered.length === 0 ? (
            <EmptyState
              title="No products found"
              description="Try adjusting your filters to see more results."
              action={<Button variant="outline" onClick={resetFilters}>Clear filters</Button>}
            />
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:gap-4 sm:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4">
              {filtered.map((p, i) => <ProductCard key={p.id} product={p} index={i} />)}
            </div>
          )}
        </div>
      </div>

      {/* Mobile filter drawer */}
      {showFilters && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/50 animate-fade-in" onClick={() => setShowFilters(false)} />
          <div className="absolute left-0 top-0 h-full w-80 max-w-[85vw] overflow-y-auto bg-white p-6 animate-slide-in-right">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-lg font-semibold">Filters</h2>
              <button onClick={() => setShowFilters(false)}><X size={24} className="text-ink-500" /></button>
            </div>
            <FilterPanel />
            <Button className="mt-6 w-full" onClick={() => setShowFilters(false)}>
              Show {filtered.length} results
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
