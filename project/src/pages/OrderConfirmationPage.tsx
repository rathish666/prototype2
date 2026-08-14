import { useEffect, useState } from 'react';
import { useParams, useLocation, Link } from 'react-router-dom';
import { CheckCircle2, Package, Truck, Home } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { Button, Spinner, EmptyState } from '@/components/ui';
import { formatPrice, type Order, type OrderItem } from '@/types';
import { formatDate } from '@/lib/utils';

export function OrderConfirmationPage() {
  const { orderNumber } = useParams<{ orderNumber: string }>();
  const location = useLocation();
  const navState = location.state as { order?: Order; items?: OrderItem[] } | null;
  const [order, setOrder] = useState<Order | null>(navState?.order ?? null);
  const [items, setItems] = useState<OrderItem[]>(navState?.items ?? []);
  const [loading, setLoading] = useState(!navState?.order);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    // If we arrived here straight from a successful checkout, the order
    // (already verified server-side) came through router state — no need
    // to query anything. Otherwise (bookmark, refresh, shared link), fall
    // back to a direct query: RLS only returns this order if the current
    // signed-in customer owns it, or an admin is looking, so a guest or a
    // different customer will correctly get nothing back here.
    if (navState?.order) return;
    (async () => {
      if (!orderNumber) return;
      const { data: ord } = await supabase.from('orders').select('*').eq('order_number', orderNumber).maybeSingle();
      if (!ord) { setNotFound(true); setLoading(false); return; }
      setOrder(ord as Order | null);
      const { data: oi } = await supabase.from('order_items').select('*').eq('order_id', ord.id);
      setItems((oi || []) as OrderItem[]);
      setLoading(false);
    })();
  }, [orderNumber, navState]);

  if (loading) return <div className="flex justify-center py-20"><Spinner /></div>;

  if (notFound || !order) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16">
        <EmptyState
          title="Order details unavailable"
          description="Sign in to the account that placed this order to view it, or check your confirmation email."
          action={<Link to="/login"><Button>Sign In</Button></Link>}
        />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-16">
      <div className="text-center">
        <div className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-green-100">
          <CheckCircle2 size={48} className="text-green-600" />
        </div>
        <h1 className="mt-6 font-display text-3xl font-bold text-ink-900">Order Confirmed!</h1>
        <p className="mt-2 text-sm text-ink-500">Thank you for your purchase. We've sent a confirmation email to {order?.customer_email}.</p>
        <p className="mt-1 text-sm font-semibold text-ink-900">Order #{orderNumber}</p>
      </div>

      {/* Tracking steps */}
      <div className="mt-12 flex items-center justify-center gap-4 sm:gap-8">
        {[
          { icon: CheckCircle2, label: 'Confirmed', active: true },
          { icon: Package, label: 'Processing', active: false },
          { icon: Truck, label: 'Shipped', active: false },
          { icon: Home, label: 'Delivered', active: false },
        ].map((step, i) => (
          <div key={step.label} className="flex items-center">
            <div className="flex flex-col items-center gap-2">
              <div className={`grid h-12 w-12 place-items-center rounded-full ${step.active ? 'bg-ink-900 text-white' : 'bg-ink-100 text-ink-400'}`}>
                <step.icon size={20} />
              </div>
              <span className={`text-xs font-medium ${step.active ? 'text-ink-900' : 'text-ink-400'}`}>{step.label}</span>
            </div>
            {i < 3 && <div className={`h-0.5 w-8 sm:w-16 ${step.active ? 'bg-ink-900' : 'bg-ink-200'}`} />}
          </div>
        ))}
      </div>

      {/* Order details */}
      {order && (
        <div className="mt-12 rounded-xl border border-ink-100 p-6">
          <h2 className="mb-4 text-lg font-semibold text-ink-900">Order Details</h2>
          <div className="space-y-3">
            {items.map((item) => (
              <div key={item.id} className="flex gap-3">
                <div className="h-16 w-14 shrink-0 overflow-hidden rounded-lg bg-ink-50">
                  {item.product_image && <img src={item.product_image} alt="" className="h-full w-full object-cover" />}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-ink-900">{item.product_name}</p>
                  <p className="text-xs text-ink-500">{item.size} / {item.color} / Qty {item.quantity}</p>
                </div>
                <p className="text-sm font-semibold">{formatPrice(item.price * item.quantity)}</p>
              </div>
            ))}
          </div>
          <div className="mt-4 space-y-2 border-t border-ink-100 pt-4 text-sm">
            <div className="flex justify-between"><span className="text-ink-500">Subtotal</span><span>{formatPrice(order.subtotal)}</span></div>
            {order.discount > 0 && <div className="flex justify-between text-success-600"><span>Discount</span><span>-{formatPrice(order.discount)}</span></div>}
            <div className="flex justify-between"><span className="text-ink-500">Shipping</span><span>{order.shipping_fee === 0 ? 'Free' : formatPrice(order.shipping_fee)}</span></div>
            <div className="flex justify-between border-t border-ink-100 pt-2 text-base font-bold"><span>Total</span><span>{formatPrice(order.total)}</span></div>
          </div>
        </div>
      )}

      {/* Delivery info */}
      {order && (
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <div className="rounded-xl border border-ink-100 p-6">
            <h3 className="text-sm font-semibold text-ink-900">Delivery Address</h3>
            <div className="mt-2 text-sm text-ink-600">
              <p>{order.customer_name}</p>
              <p>{order.address}</p>
              <p>{order.city}, {order.country}</p>
              <p>{order.phone}</p>
            </div>
          </div>
          <div className="rounded-xl border border-ink-100 p-6">
            <h3 className="text-sm font-semibold text-ink-900">Order Info</h3>
            <div className="mt-2 space-y-1 text-sm text-ink-600">
              <p>Order Date: {formatDate(order.created_at)}</p>
              <p>Shipping: {order.shipping_method}</p>
              <p>Payment: {order.payment_method}</p>
              <p>Status: {order.status}</p>
            </div>
          </div>
        </div>
      )}

      <div className="mt-8 flex justify-center gap-4">
        <Link to="/orders"><Button variant="outline">Track Order</Button></Link>
        <Link to="/shop"><Button>Continue Shopping</Button></Link>
      </div>
    </div>
  );
}
