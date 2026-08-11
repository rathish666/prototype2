import { useEffect, useState } from 'react';
import { Search, Eye, X, Ban, CheckCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { Button, Badge, Spinner, EmptyState } from '@/components/ui';
import { formatPrice, type Customer, type Order } from '@/types';
import { formatDate } from '@/lib/utils';

export function AdminCustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Customer | null>(null);
  const [customerOrders, setCustomerOrders] = useState<Order[]>([]);

  const fetchData = async () => {
    setLoading(true);
    const { data } = await supabase.from('customers').select('*').order('created_at', { ascending: false });
    setCustomers((data || []) as Customer[]);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const filtered = customers.filter((c) => !search || c.name.toLowerCase().includes(search.toLowerCase()) || c.email.toLowerCase().includes(search.toLowerCase()));

  const viewCustomer = async (cust: Customer) => {
    setSelected(cust);
    const { data } = await supabase.from('orders').select('*').eq('customer_email', cust.email).order('created_at', { ascending: false });
    setCustomerOrders((data || []) as Order[]);
  };

  const toggleDisable = async (cust: Customer) => {
    await supabase.from('customers').update({ disabled: !cust.disabled }).eq('id', cust.id);
    fetchData();
    setSelected(null);
  };

  return (
    <div>
      <h1 className="mb-6 font-display text-2xl font-bold text-ink-900">Customer Management</h1>

      <div className="mb-4 relative max-w-md">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400" />
        <input className="w-full rounded-lg border border-ink-200 py-2 pl-9 pr-3 text-sm outline-none focus:border-ink-900" placeholder="Search customers..." value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      {loading ? <div className="flex justify-center py-20"><Spinner /></div> : filtered.length === 0 ? <EmptyState title="No customers found" /> : (
        <div className="overflow-x-auto rounded-xl border border-ink-100 bg-white">
          <table className="w-full text-sm">
            <thead><tr className="border-b border-ink-100 text-left text-xs text-ink-500">
              <th className="p-4 font-medium">Customer</th><th className="p-4 font-medium">Phone</th><th className="p-4 font-medium">Orders</th><th className="p-4 font-medium">Total Spent</th><th className="p-4 font-medium">Joined</th><th className="p-4 font-medium">Status</th><th className="p-4 font-medium text-right">Action</th>
            </tr></thead>
            <tbody>
              {filtered.map((c) => (
                <tr key={c.id} className="border-b border-ink-50 hover:bg-ink-50">
                  <td className="p-4"><div className="flex items-center gap-3"><div className="grid h-9 w-9 place-items-center rounded-full bg-ink-900 text-xs font-bold text-white">{c.name.charAt(0)}</div><div><p className="font-medium text-ink-900">{c.name}</p><p className="text-xs text-ink-500">{c.email}</p></div></div></td>
                  <td className="p-4 text-ink-600">{c.phone || '—'}</td>
                  <td className="p-4 text-ink-600">—</td>
                  <td className="p-4 font-semibold">{formatPrice(Number(c.total_spending))}</td>
                  <td className="p-4 text-ink-600">{formatDate(c.created_at)}</td>
                  <td className="p-4">{c.disabled ? <Badge variant="error">Disabled</Badge> : <Badge variant="success">Active</Badge>}</td>
                  <td className="p-4 text-right"><Button size="sm" variant="ghost" onClick={() => viewCustomer(c)}><Eye size={16} /> View</Button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Customer detail modal */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setSelected(null)} />
          <div className="relative max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-xl bg-white p-6 animate-scale-in">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-3"><div className="grid h-12 w-12 place-items-center rounded-full bg-ink-900 text-lg font-bold text-white">{selected.name.charAt(0)}</div><div><h2 className="text-lg font-semibold text-ink-900">{selected.name}</h2><p className="text-sm text-ink-500">{selected.email}</p></div></div>
              <button onClick={() => setSelected(null)}><X size={24} className="text-ink-400" /></button>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div><p className="text-ink-500">Phone</p><p className="font-medium text-ink-900">{selected.phone || '—'}</p></div>
              <div><p className="text-ink-500">Total Spent</p><p className="font-medium text-ink-900">{formatPrice(Number(selected.total_spending))}</p></div>
              <div><p className="text-ink-500">Joined</p><p className="font-medium text-ink-900">{formatDate(selected.created_at)}</p></div>
              <div><p className="text-ink-500">Status</p>{selected.disabled ? <Badge variant="error">Disabled</Badge> : <Badge variant="success">Active</Badge>}</div>
            </div>

            <h3 className="mt-6 mb-3 text-sm font-semibold text-ink-900">Order History ({customerOrders.length})</h3>
            {customerOrders.length === 0 ? <p className="text-sm text-ink-500">No orders yet.</p> : (
              <div className="space-y-2">
                {customerOrders.map((o) => (
                  <div key={o.id} className="flex items-center justify-between rounded-lg border border-ink-100 p-3 text-sm">
                    <div><p className="font-medium text-ink-900">{o.order_number}</p><p className="text-xs text-ink-500">{formatDate(o.created_at)} · {o.status}</p></div>
                    <span className="font-semibold">{formatPrice(Number(o.total))}</span>
                  </div>
                ))}
              </div>
            )}

            <Button variant={selected.disabled ? 'primary' : 'danger'} className="mt-6 w-full" onClick={() => toggleDisable(selected)}>
              {selected.disabled ? <><CheckCircle size={16} /> Enable Account</> : <><Ban size={16} /> Disable Account</>}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
