import { Link } from 'react-router-dom';
import { Heart, Trash2, Minus, Plus, ShoppingBag, ArrowRight, Tag } from 'lucide-react';
import { useStore } from '@/store/StoreContext';
import { Button, EmptyState } from '@/components/ui';
import { formatPrice } from '@/types';
import { useState } from 'react';
import { supabase } from '@/lib/supabase';

export function CartPage() {
  const { cart, removeFromCart, updateCartQuantity, cartSubtotal, showToast, toggleWishlist, appliedCoupon, setAppliedCoupon } = useStore();
  const [couponInput, setCouponInput] = useState(appliedCoupon || '');
  const [couponError, setCouponError] = useState('');
  const [discount, setDiscount] = useState(0);
  const [shippingFee, setShippingFee] = useState(0);

  const shippingThreshold = 75;
  const baseShipping = cartSubtotal > 0 && cartSubtotal < shippingThreshold ? 12 : 0;
  const total = Math.max(0, cartSubtotal - discount) + baseShipping;

  const applyCoupon = async () => {
    if (!couponInput.trim()) return;
    setCouponError('');
    const { data } = await supabase
      .from('coupons')
      .select('*')
      .eq('code', couponInput.trim().toUpperCase())
      .eq('enabled', true)
      .maybeSingle();

    if (!data) {
      setCouponError('Invalid or expired coupon code');
      setDiscount(0);
      setAppliedCoupon(null);
      return;
    }
    if (data.expires_at && new Date(data.expires_at) < new Date()) {
      setCouponError('This coupon has expired');
      setDiscount(0);
      setAppliedCoupon(null);
      return;
    }
    if (cartSubtotal < data.min_order) {
      setCouponError(`Minimum order of ${formatPrice(data.min_order)} required`);
      setDiscount(0);
      setAppliedCoupon(null);
      return;
    }
    const disc = data.type === 'percentage' ? (cartSubtotal * data.value) / 100 : data.value;
    setDiscount(disc);
    setAppliedCoupon(data.code);
    showToast(`Coupon applied: ${data.code}`, 'success');
  };

  if (cart.length === 0) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-16">
        <h1 className="mb-8 font-display text-3xl font-bold text-ink-900">Shopping Cart</h1>
        <EmptyState
          icon={<ShoppingBag size={48} />}
          title="Your cart is empty"
          description="Looks like you haven't added anything yet. Start shopping to fill your cart!"
          action={<Link to="/shop"><Button>Continue Shopping <ArrowRight size={16} /></Button></Link>}
        />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-3 py-6 sm:px-4 sm:py-8">
      <h1 className="mb-6 sm:mb-8 font-display text-3xl font-bold tracking-tight text-ink-900">Shopping Cart</h1>

      <div className="grid gap-6 lg:grid-cols-3 lg:gap-8">
        {/* Items */}
        <div className="space-y-4 lg:col-span-2">
          {cart.map((item) => (
            <div key={`${item.product_id}-${item.size}-${item.color}`} className="flex flex-col gap-4 rounded-xl border border-ink-100 bg-white p-3 sm:flex-row sm:p-4">
              <Link to={`/product/${item.product_id}`} className="shrink-0 self-start">
                <div className="h-28 w-full overflow-hidden rounded-lg bg-ink-50 sm:h-28 sm:w-24">
                  <img src={item.image} alt={item.name} className="h-full w-full object-cover" />
                </div>
              </Link>
              <div className="flex min-w-0 flex-1 flex-col">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-ink-400">{item.brand}</p>
                    <Link to={`/product/${item.product_id}`} className="mt-1 block text-sm font-semibold text-ink-900 hover:text-ink-700">{item.name}</Link>
                    <div className="mt-1 flex flex-wrap gap-2 text-xs text-ink-500">
                      <span>Size: {item.size}</span>
                      <span>Color: {item.color}</span>
                    </div>
                  </div>
                  <p className="text-sm font-bold text-ink-900">{formatPrice(item.price * item.quantity)}</p>
                </div>

                <div className="mt-4 flex flex-col gap-3 pt-3 sm:mt-auto sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center rounded-lg border border-ink-200">
                    <button onClick={() => updateCartQuantity(item.product_id, item.size, item.color, item.quantity - 1)} className="grid h-9 w-9 place-items-center text-ink-600 hover:text-ink-900 disabled:opacity-30" disabled={item.quantity <= 1}>
                      <Minus size={14} />
                    </button>
                    <span className="w-10 text-center text-sm font-semibold">{item.quantity}</span>
                    <button onClick={() => updateCartQuantity(item.product_id, item.size, item.color, Math.min(item.quantity + 1, item.stock))} className="grid h-9 w-9 place-items-center text-ink-600 hover:text-ink-900 disabled:opacity-30" disabled={item.quantity >= item.stock}>
                      <Plus size={14} />
                    </button>
                  </div>

                  <div className="flex flex-wrap gap-3">
                    <button onClick={() => { toggleWishlist(item.product_id); showToast('Moved to wishlist', 'success'); removeFromCart(item.product_id, item.size, item.color); }} className="flex items-center gap-1 text-xs text-ink-500 hover:text-ink-900">
                      <Heart size={14} /> Wishlist
                    </button>
                    <button onClick={() => removeFromCart(item.product_id, item.size, item.color)} className="flex items-center gap-1 text-xs text-ink-500 hover:text-error-500">
                      <Trash2 size={14} /> Remove
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
          <Link to="/shop" className="inline-flex items-center gap-2 text-sm font-medium text-ink-700 hover:text-ink-900">
            <ArrowRight size={16} className="rotate-180" /> Continue Shopping
          </Link>
        </div>

        {/* Summary */}
        <div>
          <div className="sticky top-24 rounded-xl border border-ink-100 bg-white p-4 sm:p-6">
            <h2 className="text-lg font-semibold text-ink-900">Order Summary</h2>

            {/* Coupon */}
            <div className="mt-4">
              <label className="text-sm font-medium text-ink-700">Coupon Code</label>
              <div className="mt-2 flex gap-2">
                <div className="flex flex-1 items-center gap-2 rounded-lg border border-ink-200 px-3">
                  <Tag size={16} className="text-ink-400" />
                  <input
                    type="text"
                    value={couponInput}
                    onChange={(e) => setCouponInput(e.target.value)}
                    placeholder="Enter code"
                    className="flex-1 bg-transparent py-2 text-sm outline-none"
                  />
                </div>
                <Button variant="secondary" size="sm" onClick={applyCoupon}>Apply</Button>
              </div>
              {couponError && <p className="mt-1 text-xs text-error-500">{couponError}</p>}
              {appliedCoupon && !couponError && <p className="mt-1 text-xs text-success-600">Coupon "{appliedCoupon}" applied!</p>}
            </div>

            {/* Totals */}
            <div className="mt-6 space-y-3 border-t border-ink-100 pt-4 text-sm">
              <div className="flex justify-between"><span className="text-ink-500">Subtotal</span><span className="font-medium">{formatPrice(cartSubtotal)}</span></div>
              {discount > 0 && <div className="flex justify-between text-success-600"><span>Discount</span><span>-{formatPrice(discount)}</span></div>}
              <div className="flex justify-between"><span className="text-ink-500">Shipping</span><span className="font-medium">{baseShipping === 0 ? 'Free' : formatPrice(baseShipping)}</span></div>
              {baseShipping > 0 && (
                <p className="text-xs text-ink-400">Add {formatPrice(shippingThreshold - cartSubtotal)} more for free shipping</p>
              )}
              <div className="flex justify-between border-t border-ink-100 pt-3 text-base"><span className="font-semibold text-ink-900">Total</span><span className="font-bold text-ink-900">{formatPrice(total)}</span></div>
            </div>

            <Link to="/checkout" className="mt-6 block">
              <Button size="lg" className="w-full">Proceed to Checkout <ArrowRight size={18} /></Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
