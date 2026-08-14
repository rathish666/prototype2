import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, ShieldCheck, Truck, Check } from 'lucide-react';
import { useStore } from '@/store/StoreContext';
import { Button, EmptyState, Spinner } from '@/components/ui';
import { supabase } from '@/lib/supabase';
import { formatPrice } from '@/types';
import type { Coupon } from '@/types';
import { cn } from '@/lib/utils';

declare const Razorpay: any;

export function CheckoutPage() {
  const { cart, cartSubtotal, clearCart, appliedCoupon, customerEmail, customerName, showToast } = useStore();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [shippingMethod, setShippingMethod] = useState('Standard');
  const [paymentMethod] = useState<'Razorpay'>('Razorpay');
  const [form, setForm] = useState({
    name: customerName || '',
    email: customerEmail || '',
    phone: '',
    address: '',
    city: '',
    country: 'India',
    zip: '',
  });

  const [couponDetails, setCouponDetails] = useState<Coupon | null>(null);

  useEffect(() => {
    if (!appliedCoupon) { setCouponDetails(null); return; }
    (async () => {
      const { data } = await supabase.from('coupons').select('*').eq('code', appliedCoupon).maybeSingle();
      setCouponDetails(data as Coupon | null);
    })();
  }, [appliedCoupon]);

  const shippingFee = shippingMethod === 'Express' ? 25 : cartSubtotal >= 75 ? 0 : 12;
  const discount = couponDetails
    ? couponDetails.type === 'percentage'
      ? cartSubtotal * (couponDetails.value / 100)
      : Math.min(couponDetails.value, cartSubtotal)
    : 0;
  // Client-side total is for display only — the Edge Functions recompute
  // subtotal/discount/shipping/total from the database before charging or
  // confirming anything, so a tampered browser value here can't do harm.
  const total = Math.max(0, cartSubtotal - discount) + shippingFee;

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = 'Full name is required';
    if (!form.email.trim()) e.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = 'Invalid email';
    if (!form.phone.trim()) e.phone = 'Phone number is required';
    else if (!/^[0-9]{7,15}$/.test(form.phone.replace(/\D/g, ''))) e.phone = 'Invalid phone number';
    if (!form.address.trim()) e.address = 'Address is required';
    if (!form.city.trim()) e.city = 'City is required';
    if (!form.zip.trim()) e.zip = 'ZIP / PIN code is required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const buildRequestBody = () => ({
    customer: {
      name: form.name,
      email: form.email,
      phone: form.phone,
      address: `${form.address}${form.zip ? ', ' + form.zip : ''}`,
      city: form.city,
      country: form.country,
    },
    items: cart.map((item) => ({
      product_id: item.product_id,
      variant_id: item.variant_id,
      size: item.size,
      color: item.color,
      qty: item.quantity,
    })),
    shippingMethod,
    couponCode: appliedCoupon || undefined,
  });

  const handlePlaceOrder = async () => {
    if (!validate()) { showToast('Please fix the errors below', 'error'); return; }
    setLoading(true);
    try {
      const { data: createRes, error: createErr } = await supabase.functions.invoke('razorpay-create-order', { body: buildRequestBody() });
      if (createErr || createRes?.error) throw new Error(createRes?.error || createErr?.message || 'Could not start checkout');

      const rzp = new Razorpay({
        key: createRes.razorpayKeyId,
        amount: createRes.amount,
        currency: createRes.currency,
        order_id: createRes.razorpayOrderId,
        name: 'Maison Co.',
        description: `Order ${createRes.orderNumber}`,
        prefill: { name: form.name, email: form.email, contact: form.phone },
        theme: { color: '#111111' },
        handler: async (response: any) => {
          try {
            const { data: verifyRes, error: verifyErr } = await supabase.functions.invoke('razorpay-verify-payment', {
              body: {
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
              },
            });
            if (verifyErr || verifyRes?.error) {
              showToast('Payment succeeded but confirmation failed — contact support with your payment ID.', 'error');
              setLoading(false);
              return;
            }
            clearCart();
            // Pass the server-verified order straight through navigation
            // state so the confirmation page doesn't need to (and, for a
            // guest checkout, can no longer) query the orders table
            // directly with the anon key.
            navigate(`/order-confirmation/${verifyRes.orderNumber}`, {
              state: { order: verifyRes.order, items: verifyRes.items },
            });
          } catch {
            showToast('Payment succeeded but confirmation failed — contact support with your payment ID.', 'error');
            setLoading(false);
          }
        },
        modal: {
          ondismiss: () => {
            // Customer closed the widget without paying — order row stays "Pending"/"pending".
            setLoading(false);
          },
        },
      });
      rzp.on('payment.failed', () => {
        showToast('Payment failed. Please try again.', 'error');
        setLoading(false);
      });
      rzp.open();
    } catch (err: any) {
      showToast(err?.message || 'Failed to place order. Please try again.', 'error');
      setLoading(false);
    }
  };

  if (cart.length === 0) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-16">
        <h1 className="mb-8 font-display text-3xl font-bold text-ink-900">Checkout</h1>
        <EmptyState title="Your cart is empty" description="Add items to your cart before checking out." action={<Link to="/shop"><Button>Continue Shopping</Button></Link>} />
      </div>
    );
  }

  const inputClass = 'w-full rounded-lg border border-ink-200 px-4 py-2.5 text-sm outline-none focus:border-ink-900 focus:ring-1 focus:ring-ink-900';
  const errorInputClass = 'border-error-500 focus:border-error-500 focus:ring-error-500';

  return (
    <div className="mx-auto max-w-7xl px-3 py-6 sm:px-4 sm:py-8">
      <Link to="/cart" className="mb-4 inline-flex items-center gap-2 text-sm text-ink-500 hover:text-ink-900">
        <ArrowLeft size={16} /> Back to Cart
      </Link>
      <h1 className="mb-6 sm:mb-8 font-display text-3xl font-bold tracking-tight text-ink-900">Checkout</h1>

      <div className="grid gap-6 lg:grid-cols-3 lg:gap-8">
        <div className="space-y-6 lg:col-span-2">
          {/* Customer Info */}
          <section className="rounded-xl border border-ink-100 bg-white p-4 sm:p-6">
            <h2 className="mb-4 text-lg font-semibold text-ink-900">Customer Information</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium text-ink-700">Full Name *</label>
                <input className={cn(inputClass, errors.name && errorInputClass)} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                {errors.name && <p className="mt-1 text-xs text-error-500">{errors.name}</p>}
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-ink-700">Email *</label>
                <input type="email" className={cn(inputClass, errors.email && errorInputClass)} value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
                {errors.email && <p className="mt-1 text-xs text-error-500">{errors.email}</p>}
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-ink-700">Phone *</label>
                <input className={cn(inputClass, errors.phone && errorInputClass)} placeholder="9876543210" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
                {errors.phone && <p className="mt-1 text-xs text-error-500">{errors.phone}</p>}
              </div>
            </div>
          </section>

          {/* Shipping Address */}
          <section className="rounded-xl border border-ink-100 bg-white p-4 sm:p-6">
            <h2 className="mb-4 text-lg font-semibold text-ink-900">Delivery Address</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className="mb-1 block text-sm font-medium text-ink-700">Street Address *</label>
                <input className={cn(inputClass, errors.address && errorInputClass)} value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
                {errors.address && <p className="mt-1 text-xs text-error-500">{errors.address}</p>}
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-ink-700">City *</label>
                <input className={cn(inputClass, errors.city && errorInputClass)} value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
                {errors.city && <p className="mt-1 text-xs text-error-500">{errors.city}</p>}
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-ink-700">ZIP / PIN Code *</label>
                <input className={cn(inputClass, errors.zip && errorInputClass)} value={form.zip} onChange={(e) => setForm({ ...form, zip: e.target.value })} />
                {errors.zip && <p className="mt-1 text-xs text-error-500">{errors.zip}</p>}
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-ink-700">Country</label>
                <select className={inputClass} value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })}>
                  <option>India</option><option>USA</option><option>Canada</option><option>UK</option><option>Australia</option>
                </select>
              </div>
            </div>
          </section>

          {/* Shipping Method */}
          <section className="rounded-xl border border-ink-100 bg-white p-4 sm:p-6">
            <h2 className="mb-4 text-lg font-semibold text-ink-900">Shipping Method</h2>
            <div className="space-y-3">
              {[
                { id: 'Standard', label: 'Standard Shipping', desc: '3-5 business days', price: cartSubtotal >= 75 ? 'Free' : 'INR 12.00' },
                { id: 'Express', label: 'Express Shipping', desc: '1-2 business days', price: 'INR 25.00' },
              ].map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => setShippingMethod(opt.id)}
                  className={cn(
                    'flex w-full items-center gap-3 rounded-lg border p-4 transition-all',
                    shippingMethod === opt.id ? 'border-ink-900 bg-ink-50' : 'border-ink-200 hover:border-ink-400'
                  )}
                >
                  <div className={cn('grid h-5 w-5 place-items-center rounded-full border-2', shippingMethod === opt.id ? 'border-ink-900' : 'border-ink-300')}>
                    {shippingMethod === opt.id && <div className="h-2.5 w-2.5 rounded-full bg-ink-900" />}
                  </div>
                  <Truck size={20} className="text-ink-600" />
                  <div className="flex-1 text-left">
                    <p className="text-sm font-medium text-ink-900">{opt.label}</p>
                    <p className="text-xs text-ink-500">{opt.desc}</p>
                  </div>
                  <span className="text-sm font-semibold">{opt.price}</span>
                </button>
              ))}
            </div>
          </section>

          {/* Payment */}
          <section className="rounded-xl border border-ink-100 bg-white p-4 sm:p-6">
            <h2 className="mb-4 text-lg font-semibold text-ink-900">Payment Method</h2>
            <div className="space-y-3">
              <div className="flex w-full items-center gap-3 rounded-lg border border-ink-900 bg-ink-50 p-4 text-left transition-all">
                <div className="grid h-5 w-5 shrink-0 place-items-center rounded-full border-2 border-ink-900">
                  <div className="h-2.5 w-2.5 rounded-full bg-ink-900" />
                </div>
                <ShieldCheck size={20} className="shrink-0 text-ink-600" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-ink-900">Card / UPI / Netbanking</p>
                  <p className="text-xs text-ink-500">Secure checkout powered by Razorpay</p>
                </div>
              </div>
            </div>
            <p className="mt-4 flex items-start gap-2 text-xs text-ink-500">
              <ShieldCheck size={14} className="mt-0.5 shrink-0 text-success-600" />
              You'll enter your card, UPI, or bank details on Razorpay's secure payment screen — we never see or store them.
            </p>
          </section>
        </div>

        {/* Summary */}
        <div>
          <div className="sticky top-24 rounded-xl border border-ink-100 p-6">
            <h2 className="mb-4 text-lg font-semibold text-ink-900">Order Summary</h2>
            <div className="mb-4 max-h-64 space-y-3 overflow-y-auto">
              {cart.map((item) => (
                <div key={`${item.product_id}-${item.size}-${item.color}`} className="flex gap-3">
                  <div className="h-16 w-14 shrink-0 overflow-hidden rounded-lg bg-ink-50">
                    <img src={item.image} alt="" className="h-full w-full object-cover" />
                  </div>
                  <div className="flex-1 text-sm">
                    <p className="font-medium text-ink-900 line-clamp-1">{item.name}</p>
                    <p className="text-xs text-ink-500">{item.size} / {item.color} / Qty {item.quantity}</p>
                    <p className="font-semibold">{formatPrice(item.price * item.quantity)}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="space-y-2 border-t border-ink-100 pt-4 text-sm">
              <div className="flex justify-between"><span className="text-ink-500">Subtotal</span><span>{formatPrice(cartSubtotal)}</span></div>
              {discount > 0 && <div className="flex justify-between text-success-600"><span>Discount</span><span>-{formatPrice(discount)}</span></div>}
              <div className="flex justify-between"><span className="text-ink-500">Shipping</span><span>{shippingFee === 0 ? 'Free' : formatPrice(shippingFee)}</span></div>
              <div className="flex justify-between border-t border-ink-100 pt-2 text-base font-bold"><span>Total</span><span>{formatPrice(total)}</span></div>
            </div>
            <Button size="lg" className="mt-6 w-full" onClick={handlePlaceOrder} disabled={loading}>
              {loading ? <Spinner /> : <>Pay Now <Check size={18} /></>}
            </Button>
            <p className="mt-3 text-center text-xs text-ink-400">By placing your order, you agree to our <Link to="/terms" className="underline hover:text-ink-600">Terms</Link> & <Link to="/privacy" className="underline hover:text-ink-600">Privacy Policy</Link></p>
          </div>
        </div>
      </div>
    </div>
  );
}
