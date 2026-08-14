import { useEffect, useState } from 'react';
import { Search, Eye, X } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { Button, Badge, Spinner, EmptyState } from '@/components/ui';
import { formatPrice, type Order, type OrderItem } from '@/types';
import { formatDate } from '@/lib/utils';
import { statusVariant } from '@/lib/utils';
import { ORDER_STATUSES } from '@/types';

function paymentStatusVariant(status?: string): 'default' | 'success' | 'warning' | 'error' | 'info' | 'accent' {
  switch (status) {
    case 'paid': return 'success';
    case 'pending': return 'warning';
    case 'cod_pending': return 'info';
    case 'failed': return 'error';
    default: return 'default';
  }
}

export function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [updating, setUpdating] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    const { data } = await supabase.from('orders').select('*').order('created_at', { ascending: false });
    setOrders((data || []) as Order[]);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const filtered = orders.filter((o) => {
    if (search && !o.order_number.toLowerCase().includes(search.toLowerCase()) && !o.customer_name.toLowerCase().includes(search.toLowerCase()) && !o.customer_email.toLowerCase().includes(search.toLowerCase())) return false;
    if (statusFilter !== 'all' && o.status !== statusFilter) return false;
    return true;
  });

  const viewOrder = async (order: Order) => {
    setSelectedOrder(order);
    const { data } = await supabase.from('order_items').select('*').eq('order_id', order.id);
    setOrderItems((data || []) as OrderItem[]);
  };

  const updateStatus = async (orderId: string, status: string) => {
    setUpdating(true);
    await supabase.from('orders').update({ status }).eq('id', orderId);
    setUpdating(false);
    setSelectedOrder(null);
    fetchData();
  };

  return (
    <div>
      <h1 className="mb-6 font-display text-2xl font-bold text-ink-900">Order Management</h1>

      <div className="mb-4 flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400" />
          <input className="w-full rounded-lg border border-ink-200 py-2 pl-9 pr-3 text-sm outline-none focus:border-ink-900" placeholder="Search by order #, name, email..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <select className="rounded-lg border border-ink-200 px-3 py-2 text-sm" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="all">All Statuses</option>
          {ORDER_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      {loading ? <div className="flex justify-center py-20"><Spinner /></div> : filtered.length === 0 ? <EmptyState title="No orders found" /> : (
        <div className="overflow-x-auto rounded-xl border border-ink-100 bg-white">
          <table className="w-full text-sm">
            <thead><tr className="border-b border-ink-100 text-left text-xs text-ink-500">
              <th className="p-4 font-medium">Order #</th><th className="p-4 font-medium">Customer</th><th className="p-4 font-medium">Date</th><th className="p-4 font-medium">Total</th><th className="p-4 font-medium">Payment</th><th className="p-4 font-medium">Status</th><th className="p-4 font-medium">Fulfillment</th><th className="p-4 font-medium text-right">Action</th>
            </tr></thead>
            <tbody>
              {filtered.map((o) => (
                <tr key={o.id} className="border-b border-ink-50 hover:bg-ink-50">
                  <td className="p-4 font-medium text-ink-900">{o.order_number}</td>
                  <td className="p-4"><p className="text-ink-900">{o.customer_name}</p><p className="text-xs text-ink-500">{o.customer_email}</p></td>
                  <td className="p-4 text-ink-600">{formatDate(o.created_at)}</td>
                  <td className="p-4 font-semibold">{formatPrice(Number(o.total))}</td>
                  <td className="p-4 text-ink-600">{o.payment_method}</td>
                  <td className="p-4"><Badge variant={paymentStatusVariant(o.payment_status)}>{o.payment_status || '—'}</Badge></td>
                  <td className="p-4"><Badge variant={statusVariant(o.status)}>{o.status}</Badge></td>
                  <td className="p-4 text-right"><Button size="sm" variant="ghost" onClick={() => viewOrder(o)}><Eye size={16} /> View</Button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Order detail modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setSelectedOrder(null)} />
          <div className="relative max-h-[85vh] w-full max-w-2xl overflow-y-auto rounded-xl bg-white p-6 animate-scale-in">
            <div className="mb-4 flex items-center justify-between">
              <div><h2 className="text-lg font-semibold text-ink-900">{selectedOrder.order_number}</h2><p className="text-sm text-ink-500">{formatDate(selectedOrder.created_at)}</p></div>
              <button onClick={() => setSelectedOrder(null)}><X size={24} className="text-ink-400" /></button>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div><p className="font-medium text-ink-900">Customer</p><p className="text-ink-600">{selectedOrder.customer_name}</p><p className="text-ink-600">{selectedOrder.customer_email}</p><p className="text-ink-600">{selectedOrder.phone}</p></div>
              <div><p className="font-medium text-ink-900">Shipping Address</p><p className="text-ink-600">{selectedOrder.address}</p><p className="text-ink-600">{selectedOrder.city}, {selectedOrder.country}</p></div>
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
              <Badge variant={paymentStatusVariant(selectedOrder.payment_status)}>Payment: {selectedOrder.payment_status || '—'}</Badge>
              <Badge variant={selectedOrder.whatsapp_sent ? 'success' : 'warning'}>
                WhatsApp alert: {selectedOrder.whatsapp_sent ? 'sent' : 'not sent'}
              </Badge>
              {selectedOrder.razorpay_payment_id && <span className="text-ink-400">Razorpay payment ID: {selectedOrder.razorpay_payment_id}</span>}
            </div>

            <div className="mt-4 rounded-lg border border-ink-100">
              <table className="w-full text-sm">
                <thead><tr className="border-b border-ink-100 text-left text-xs text-ink-500"><th className="p-3 font-medium">Product</th><th className="p-3 font-medium">Variant</th><th className="p-3 font-medium">Qty</th><th className="p-3 font-medium text-right">Price</th></tr></thead>
                <tbody>
                  {orderItems.map((item) => (
                    <tr key={item.id} className="border-b border-ink-50">
                      <td className="p-3"><div className="flex items-center gap-2">{item.product_image && <img src={item.product_image} alt="" className="h-10 w-8 rounded object-cover" />}<span className="text-ink-900">{item.product_name}</span></div></td>
                      <td className="p-3 text-ink-600">{item.size} / {item.color}</td>
                      <td className="p-3 text-ink-600">{item.quantity}</td>
                      <td className="p-3 text-right font-semibold">{formatPrice(item.price * item.quantity)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-4 space-y-1 text-sm">
              <div className="flex justify-between"><span className="text-ink-500">Subtotal</span><span>{formatPrice(Number(selectedOrder.subtotal))}</span></div>
              {Number(selectedOrder.discount) > 0 && <div className="flex justify-between text-green-600"><span>Discount</span><span>-{formatPrice(Number(selectedOrder.discount))}</span></div>}
              <div className="flex justify-between"><span className="text-ink-500">Shipping ({selectedOrder.shipping_method})</span><span>{Number(selectedOrder.shipping_fee) === 0 ? 'Free' : formatPrice(Number(selectedOrder.shipping_fee))}</span></div>
              <div className="flex justify-between border-t border-ink-100 pt-2 text-base font-bold"><span>Total</span><span>{formatPrice(Number(selectedOrder.total))}</span></div>
            </div>

            <div className="mt-6">
              <label className="mb-1.5 block text-sm font-medium text-ink-700">Update Status</label>
              <div className="flex gap-2">
                <select className="flex-1 rounded-lg border border-ink-200 px-3 py-2 text-sm" defaultValue={selectedOrder.status} id="status-select">
                  {ORDER_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
                <Button disabled={updating} onClick={() => updateStatus(selectedOrder.id, (document.getElementById('status-select') as HTMLSelectElement).value)}>
                  {updating ? 'Updating...' : 'Update'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
