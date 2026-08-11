import { Link } from 'react-router-dom';
import { Heart, ArrowRight } from 'lucide-react';
import { useStore } from '@/store/StoreContext';
import { useProducts } from '@/lib/hooks';
import { ProductCard } from '@/components/ProductCard';
import { ProductCardSkeleton, EmptyState, Button } from '@/components/ui';

export function WishlistPage() {
  const { wishlist } = useStore();
  const { products, loading } = useProducts({ limit: 100 });

  const wishlistProducts = products.filter((p) => wishlist.includes(p.id));

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <h1 className="mb-8 font-display text-3xl font-bold text-ink-900">My Wishlist</h1>

      {loading ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => <ProductCardSkeleton key={i} />)}
        </div>
      ) : wishlistProducts.length === 0 ? (
        <EmptyState
          icon={<Heart size={48} />}
          title="Your wishlist is empty"
          description="Save items you love by tapping the heart icon on any product."
          action={<Link to="/shop"><Button>Discover Products <ArrowRight size={16} /></Button></Link>}
        />
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {wishlistProducts.map((p, i) => <ProductCard key={p.id} product={p} index={i} />)}
        </div>
      )}
    </div>
  );
}
