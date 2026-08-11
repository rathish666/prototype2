import { Link } from 'react-router-dom';
import { Heart, Eye, ShoppingBag } from 'lucide-react';
import type { Product } from '@/types';
import { formatPrice, discountPercent, effectivePrice } from '@/types';
import { useStore } from '@/store/StoreContext';
import { Rating, Badge, ColorSwatch } from '@/components/ui';
import { cn } from '@/lib/utils';

export function ProductCard({ product, index = 0 }: { product: Product; index?: number }) {
  const { toggleWishlist, isInWishlist, addToCart, showToast } = useStore();
  const inWishlist = isInWishlist(product.id);
  const discount = discountPercent(product.price, product.discount_price);
  const price = effectivePrice(product);
  const outOfStock = product.stock === 0;

  return (
    <div
      className="group animate-fade-in-up"
      style={{ animationDelay: `${index * 50}ms` }}
    >
      <div className="relative overflow-hidden rounded-xl bg-ink-50">
        <Link to={`/product/${product.id}`}>
          <div className="relative aspect-[3/4] overflow-hidden">
            <img
              src={product.images?.[0]?.url}
              alt={product.name}
              loading="lazy"
              className={cn(
                'h-full w-full object-cover transition-transform duration-700 group-hover:scale-105',
                outOfStock && 'opacity-60'
              )}
            />
            {product.images?.[1]?.url && (
              <img
                src={product.images[1].url}
                alt={product.name}
                loading="lazy"
                className="absolute inset-0 h-full w-full object-cover opacity-0 transition-opacity duration-500 group-hover:opacity-100"
              />
            )}
          </div>
        </Link>

        {/* Badges */}
        <div className="absolute left-3 top-3 flex flex-col gap-1.5">
          {discount > 0 && (
            <Badge variant="error">-{discount}%</Badge>
          )}
          {product.best_seller && <Badge variant="accent">Best Seller</Badge>}
          {product.featured && !product.best_seller && <Badge variant="default">Featured</Badge>}
          {outOfStock && <Badge variant="error">Out of Stock</Badge>}
        </div>

        {/* Wishlist */}
        <button
          onClick={() => {
            toggleWishlist(product.id);
            showToast(inWishlist ? 'Removed from wishlist' : 'Added to wishlist', 'success');
          }}
          className="absolute right-3 top-3 grid h-9 w-9 place-items-center rounded-full bg-white/90 backdrop-blur-sm transition-all hover:bg-white hover:scale-110"
          aria-label="Toggle wishlist"
        >
          <Heart size={18} className={cn(inWishlist ? 'fill-error-500 text-error-500' : 'text-ink-700')} />
        </button>

        {/* Quick actions */}
        <div className="absolute inset-x-3 bottom-3 flex translate-y-4 gap-2 opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
          <Link
            to={`/product/${product.id}`}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-white/95 px-3 py-2.5 text-xs font-semibold text-ink-900 backdrop-blur-sm transition-all hover:bg-white"
          >
            <Eye size={15} /> Quick View
          </Link>
          {!outOfStock && (
            <button
              onClick={() => {
                addToCart(product, product.sizes[0] || 'One Size', product.colors[0] || 'Default', 1);
                showToast('Added to cart', 'success');
              }}
              className="grid h-10 w-10 place-items-center rounded-lg bg-ink-900 text-white transition-all hover:bg-ink-800"
              aria-label="Add to cart"
            >
              <ShoppingBag size={16} />
            </button>
          )}
        </div>
      </div>

      {/* Info */}
      <div className="mt-3 space-y-1">
        <p className="text-xs font-medium uppercase tracking-wide text-ink-400">{product.brand}</p>
        <Link to={`/product/${product.id}`} className="block">
          <h3 className="text-sm font-medium text-ink-900 line-clamp-2 hover:text-ink-700">{product.name}</h3>
        </Link>
        <Rating value={product.rating} count={product.review_count} />

        <div className="flex items-center gap-2 pt-1">
          <span className="text-sm font-semibold text-ink-900">{formatPrice(price)}</span>
          {discount > 0 && (
            <span className="text-xs text-ink-400 line-through">{formatPrice(product.price)}</span>
          )}
        </div>

        {/* Colors */}
        {product.colors.length > 0 && (
          <div className="flex items-center gap-1.5 pt-1">
            {product.colors.slice(0, 5).map((color) => (
              <ColorSwatch key={color} color={color} size="sm" />
            ))}
            {product.colors.length > 5 && (
              <span className="text-xs text-ink-400">+{product.colors.length - 5}</span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
