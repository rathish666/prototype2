import { useSearchParams } from 'react-router-dom';
import { Search } from 'lucide-react';
import { useProducts } from '@/lib/hooks';
import { ProductCard } from '@/components/ProductCard';
import { ProductCardSkeleton, EmptyState, Button } from '@/components/ui';
import { Link } from 'react-router-dom';

export function SearchResultsPage() {
  const [searchParams] = useSearchParams();
  const query = searchParams.get('q') || '';
  const { products, loading } = useProducts({ search: query, limit: 100 });

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <div className="mb-8">
        <div className="flex items-center gap-2 text-sm text-ink-500">
          <Search size={16} /> Search results
        </div>
        <h1 className="mt-2 font-display text-3xl font-bold text-ink-900">
          {query ? `"${query}"` : 'Search'}
        </h1>
        <p className="mt-1 text-sm text-ink-500">{loading ? 'Searching...' : `${products.length} results found`}</p>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => <ProductCardSkeleton key={i} />)}
        </div>
      ) : products.length === 0 ? (
        <EmptyState
          icon={<Search size={48} />}
          title={`No results for "${query}"`}
          description="Try different keywords or browse our collections."
          action={<Link to="/shop"><Button>Browse All Products</Button></Link>}
        />
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {products.map((p, i) => <ProductCard key={p.id} product={p} index={i} />)}
        </div>
      )}
    </div>
  );
}
