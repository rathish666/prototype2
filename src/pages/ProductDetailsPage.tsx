import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Heart, ShoppingBag, Truck, RotateCcw, ShieldCheck, Minus, Plus, ChevronRight, Ruler } from 'lucide-react';
import { useProduct, useProducts } from '@/lib/hooks';
import { useStore } from '@/store/StoreContext';
import { supabase } from '@/lib/supabase';
import { Button, Rating, Badge, ColorSwatch, SizeChip, Spinner, EmptyState } from '@/components/ui';
import { ProductCard } from '@/components/ProductCard';
import { formatPrice, discountPercent, effectivePrice, type Review, type Product } from '@/types';
import { cn } from '@/lib/utils';

export function ProductDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const { product, loading } = useProduct(id);
  const { products: related, loading: relLoading } = useProducts({ limit: 4 });
  const { addToCart, toggleWishlist, isInWishlist, showToast } = useStore();
  const [selectedImage, setSelectedImage] = useState(0);
  const [selectedSize, setSelectedSize] = useState('');
  const [selectedColor, setSelectedColor] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [showSizeGuide, setShowSizeGuide] = useState(false);
  const [activeTab, setActiveTab] = useState<'description' | 'specs' | 'shipping'>('description');

  useEffect(() => {
    if (product) {
      setSelectedSize(product.sizes[0] || '');
      setSelectedColor(product.colors[0] || '');
      setSelectedImage(0);
      setQuantity(1);
    }
  }, [product]);

  useEffect(() => {
    if (!id) return;
    (async () => {
      const { data } = await supabase
        .from('reviews')
        .select('*')
        .eq('product_id', id)
        .eq('status', 'approved')
        .order('created_at', { ascending: false });
      setReviews((data || []) as Review[]);
    })();
  }, [id]);

  if (loading) return <div className="flex justify-center py-20"><Spinner /></div>;
  if (!product) return <EmptyState title="Product not found" description="This product may have been removed." action={<Link to="/shop"><Button>Back to Shop</Button></Link>} />;

  const inWishlist = isInWishlist(product.id);
  const discount = discountPercent(product.price, product.discount_price);
  const price = effectivePrice(product);
  const outOfStock = product.stock === 0;
  const lowStock = product.stock > 0 && product.stock <= product.low_stock_threshold;

  const handleAddToCart = () => {
    if (outOfStock) return;
    if (!selectedSize) { showToast('Please select a size', 'error'); return; }
    if (!selectedColor) { showToast('Please select a color', 'error'); return; }
    addToCart(product, selectedSize, selectedColor, quantity);
    showToast('Added to cart', 'success');
  };

  const handleBuyNow = () => {
    if (outOfStock) return;
    if (!selectedSize) { showToast('Please select a size', 'error'); return; }
    if (!selectedColor) { showToast('Please select a color', 'error'); return; }
    addToCart(product, selectedSize, selectedColor, quantity);
    window.location.href = '/cart';
  };

  const relatedProducts = related.filter((p) => p.id !== product.id && p.category_id === product.category_id).slice(0, 4);
  const fallbackRelated = related.filter((p) => p.id !== product.id).slice(0, 4);
  const displayRelated = relatedProducts.length >= 4 ? relatedProducts : fallbackRelated;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      {/* Breadcrumb */}
      <nav className="mb-6 flex items-center gap-2 text-sm text-ink-500">
        <Link to="/" className="hover:text-ink-900">Home</Link>
        <ChevronRight size={14} />
        <Link to="/shop" className="hover:text-ink-900">Shop</Link>
        {product.category && <>
          <ChevronRight size={14} />
          <Link to={`/category/${product.category.slug}`} className="hover:text-ink-900">{product.category.name}</Link>
        </>}
        <ChevronRight size={14} />
        <span className="text-ink-900">{product.name}</span>
      </nav>

      <div className="grid gap-8 lg:grid-cols-2 lg:gap-12">
        {/* Gallery */}
        <div>
          <div className="relative overflow-hidden rounded-xl bg-ink-50">
            <div className="aspect-[3/4]">
              <img src={product.images?.[selectedImage]?.url} alt={product.name} className="h-full w-full object-cover" />
            </div>
            {discount > 0 && (
              <div className="absolute left-4 top-4"><Badge variant="error">-{discount}% OFF</Badge></div>
            )}
            {outOfStock && (
              <div className="absolute left-4 top-4"><Badge variant="error">Out of Stock</Badge></div>
            )}
          </div>
          {product.images && product.images.length > 1 && (
            <div className="mt-4 flex gap-3">
              {product.images.map((img, i) => (
                <button
                  key={img.id}
                  onClick={() => setSelectedImage(i)}
                  className={cn(
                    'h-20 w-16 overflow-hidden rounded-lg border-2 transition-all',
                    i === selectedImage ? 'border-ink-900' : 'border-transparent hover:border-ink-300'
                  )}
                >
                  <img src={img.url} alt="" className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Info */}
        <div>
          <p className="text-sm font-medium uppercase tracking-wide text-ink-400">{product.brand}</p>
          <h1 className="mt-1 font-display text-3xl font-bold text-ink-900">{product.name}</h1>
          <div className="mt-3 flex items-center gap-3">
            <Rating value={product.rating} count={product.review_count} size="md" />
            <span className="text-sm text-ink-400">|</span>
            <span className="text-sm text-ink-500">SKU: {product.sku}</span>
          </div>

          {/* Price */}
          <div className="mt-4 flex items-center gap-3">
            <span className="text-3xl font-bold text-ink-900">{formatPrice(price)}</span>
            {discount > 0 && <span className="text-lg text-ink-400 line-through">{formatPrice(product.price)}</span>}
            {discount > 0 && <Badge variant="error">Save {formatPrice(product.price - price)}</Badge>}
          </div>

          {/* Stock */}
          <div className="mt-3">
            {outOfStock ? <Badge variant="error">Out of Stock</Badge>
              : lowStock ? <Badge variant="warning">Only {product.stock} left in stock</Badge>
              : <Badge variant="success">In Stock</Badge>}
          </div>

          {/* Colors */}
          {product.colors.length > 0 && (
            <div className="mt-6">
              <p className="mb-2 text-sm font-semibold text-ink-900">Color: <span className="font-normal text-ink-600">{selectedColor}</span></p>
              <div className="flex flex-wrap gap-2">
                {product.colors.map((color) => (
                  <ColorSwatch key={color} color={color} selected={selectedColor === color} onClick={() => setSelectedColor(color)} />
                ))}
              </div>
            </div>
          )}

          {/* Sizes */}
          {product.sizes.length > 0 && (
            <div className="mt-6">
              <div className="mb-2 flex items-center justify-between">
                <p className="text-sm font-semibold text-ink-900">Size: <span className="font-normal text-ink-600">{selectedSize}</span></p>
                <button onClick={() => setShowSizeGuide(true)} className="flex items-center gap-1 text-xs text-ink-500 hover:text-ink-900">
                  <Ruler size={14} /> Size Guide
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {product.sizes.map((size) => (
                  <SizeChip key={size} size={size} selected={selectedSize === size} onClick={() => setSelectedSize(size)} />
                ))}
              </div>
            </div>
          )}

          {/* Quantity */}
          <div className="mt-6">
            <p className="mb-2 text-sm font-semibold text-ink-900">Quantity</p>
            <div className="flex items-center gap-3">
              <div className="flex items-center rounded-lg border border-ink-200">
                <button
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  className="grid h-10 w-10 place-items-center text-ink-600 hover:text-ink-900 disabled:opacity-30"
                  disabled={quantity <= 1 || outOfStock}
                >
                  <Minus size={16} />
                </button>
                <span className="w-12 text-center text-sm font-semibold">{quantity}</span>
                <button
                  onClick={() => setQuantity((q) => Math.min(product.stock, q + 1))}
                  className="grid h-10 w-10 place-items-center text-ink-600 hover:text-ink-900 disabled:opacity-30"
                  disabled={quantity >= product.stock || outOfStock}
                >
                  <Plus size={16} />
                </button>
              </div>
              {lowStock && <span className="text-xs text-warning-600">Only {product.stock} available</span>}
            </div>
          </div>

          {/* Actions */}
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Button size="lg" onClick={handleAddToCart} disabled={outOfStock} className="flex-1">
              <ShoppingBag size={18} /> Add to Cart
            </Button>
            <Button size="lg" variant="outline" onClick={handleBuyNow} disabled={outOfStock} className="flex-1">
              Buy Now
            </Button>
            <button
              onClick={() => { toggleWishlist(product.id); showToast(inWishlist ? 'Removed from wishlist' : 'Added to wishlist', 'success'); }}
              className="grid h-12 w-12 shrink-0 place-items-center rounded-lg border border-ink-200 transition-colors hover:bg-ink-50"
            >
              <Heart size={20} className={cn(inWishlist ? 'fill-error-500 text-error-500' : 'text-ink-700')} />
            </button>
          </div>

          {/* Trust badges */}
          <div className="mt-8 grid grid-cols-3 gap-4 border-t border-ink-100 pt-6">
            <div className="flex flex-col items-center text-center gap-1">
              <Truck size={20} className="text-ink-700" />
              <p className="text-xs font-medium text-ink-900">Free Shipping</p>
              <p className="text-xs text-ink-500">Orders over INR 75</p>
            </div>
            <div className="flex flex-col items-center text-center gap-1">
              <RotateCcw size={20} className="text-ink-700" />
              <p className="text-xs font-medium text-ink-900">30-Day Returns</p>
              <p className="text-xs text-ink-500">Easy & free</p>
            </div>
            <div className="flex flex-col items-center text-center gap-1">
              <ShieldCheck size={20} className="text-ink-700" />
              <p className="text-xs font-medium text-ink-900">Secure Payment</p>
              <p className="text-xs text-ink-500">100% protected</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="mt-12 border-t border-ink-100 pt-8">
        <div className="flex gap-6 border-b border-ink-100">
          {([
            { key: 'description', label: 'Description' },
            { key: 'specs', label: 'Specifications' },
            { key: 'shipping', label: 'Shipping & Returns' },
          ] as const).map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={cn(
                'pb-3 text-sm font-medium transition-colors',
                activeTab === tab.key ? 'border-b-2 border-ink-900 text-ink-900' : 'text-ink-500 hover:text-ink-700'
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <div className="py-6 text-sm leading-relaxed text-ink-600">
          {activeTab === 'description' && (
            <div className="max-w-2xl">
              <p>{product.description}</p>
              <ul className="mt-4 space-y-2">
                <li>Premium quality materials sourced from trusted suppliers</li>
                <li>Designed for both comfort and durability</li>
                <li>Machine washable (follow care label instructions)</li>
                <li>Model is 6'1" and wears size M</li>
              </ul>
            </div>
          )}
          {activeTab === 'specs' && (
            <div className="max-w-2xl">
              <table className="w-full">
                <tbody>
                  <tr className="border-b border-ink-100"><td className="py-2 font-medium text-ink-900">Brand</td><td className="py-2">{product.brand}</td></tr>
                  <tr className="border-b border-ink-100"><td className="py-2 font-medium text-ink-900">SKU</td><td className="py-2">{product.sku}</td></tr>
                  <tr className="border-b border-ink-100"><td className="py-2 font-medium text-ink-900">Category</td><td className="py-2">{product.category?.name || 'N/A'}</td></tr>
                  <tr className="border-b border-ink-100"><td className="py-2 font-medium text-ink-900">Available Sizes</td><td className="py-2">{product.sizes.join(', ')}</td></tr>
                  <tr className="border-b border-ink-100"><td className="py-2 font-medium text-ink-900">Available Colors</td><td className="py-2">{product.colors.join(', ')}</td></tr>
                  <tr className="border-b border-ink-100"><td className="py-2 font-medium text-ink-900">Material</td><td className="py-2">Premium cotton blend</td></tr>
                  <tr><td className="py-2 font-medium text-ink-900">Care</td><td className="py-2">Machine wash cold, tumble dry low</td></tr>
                </tbody>
              </table>
            </div>
          )}
          {activeTab === 'shipping' && (
            <div className="max-w-2xl space-y-4">
              <div>
                <h4 className="font-semibold text-ink-900">Shipping Information</h4>
                <p className="mt-1">Free standard shipping on all orders over INR 75. Standard delivery takes 3-5 business days. Express delivery (1-2 business days) available for an additional INR 25.</p>
              </div>
              <div>
                <h4 className="font-semibold text-ink-900">Return Policy</h4>
                <p className="mt-1">We offer a 30-day return policy. Items must be unworn, unwashed, and have original tags attached. Refunds are processed within 5-7 business days of receiving your return.</p>
              </div>
              <div>
                <h4 className="font-semibold text-ink-900">Delivery Information</h4>
                <p className="mt-1">We ship to all 50 US states and internationally. Orders are processed within 1-2 business days. You will receive a tracking number via email once your order ships.</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Reviews */}
      <div className="mt-12 border-t border-ink-100 pt-8">
        <h2 className="font-display text-2xl font-bold text-ink-900">Customer Reviews ({reviews.length})</h2>
        <div className="mt-6 grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-1">
            <div className="rounded-xl border border-ink-100 bg-ink-50 p-6 text-center">
              <p className="text-5xl font-bold text-ink-900">{product.rating.toFixed(1)}</p>
              <div className="mt-2 flex justify-center"><Rating value={product.rating} /></div>
              <p className="mt-2 text-sm text-ink-500">Based on {product.review_count} reviews</p>
            </div>
          </div>
          <div className="lg:col-span-2 space-y-4">
            {reviews.length === 0 ? (
              <p className="text-sm text-ink-500">No reviews yet. Be the first to review this product!</p>
            ) : (
              reviews.map((review) => (
                <div key={review.id} className="rounded-xl border border-ink-100 p-5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="grid h-10 w-10 place-items-center rounded-full bg-ink-900 text-sm font-bold text-white">
                        {review.customer_name.charAt(0)}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-ink-900">{review.customer_name}</p>
                        <Rating value={review.rating} />
                      </div>
                    </div>
                    <span className="text-xs text-ink-400">{new Date(review.created_at).toLocaleDateString()}</span>
                  </div>
                  {review.title && <h4 className="mt-3 font-semibold text-ink-900">{review.title}</h4>}
                  <p className="mt-1 text-sm text-ink-600">{review.body}</p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Related */}
      {displayRelated.length > 0 && (
        <div className="mt-16">
          <h2 className="mb-6 font-display text-2xl font-bold text-ink-900">You May Also Like</h2>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {displayRelated.map((p, i) => <ProductCard key={p.id} product={p} index={i} />)}
          </div>
        </div>
      )}

      {/* Size guide modal */}
      {showSizeGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 animate-fade-in" onClick={() => setShowSizeGuide(false)} />
          <div className="relative max-w-lg w-full rounded-xl bg-white p-6 animate-scale-in">
            <h3 className="mb-4 font-display text-xl font-bold text-ink-900">Size Guide</h3>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-ink-200">
                  <th className="py-2 text-left">Size</th>
                  <th className="py-2 text-left">Chest (in)</th>
                  <th className="py-2 text-left">Waist (in)</th>
                  <th className="py-2 text-left">Hip (in)</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ['S', '36-38', '30-32', '36-38'],
                  ['M', '38-40', '32-34', '38-40'],
                  ['L', '40-42', '34-36', '40-42'],
                  ['XL', '42-44', '36-38', '42-44'],
                  ['XXL', '44-46', '38-40', '44-46'],
                ].map((row) => (
                  <tr key={row[0]} className="border-b border-ink-100">
                    {row.map((cell, i) => <td key={i} className="py-2">{cell}</td>)}
                  </tr>
                ))}
              </tbody>
            </table>
            <Button variant="outline" className="mt-6 w-full" onClick={() => setShowSizeGuide(false)}>Close</Button>
          </div>
        </div>
      )}
    </div>
  );
}
