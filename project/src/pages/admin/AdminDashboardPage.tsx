import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  DollarSign, ShoppingCart, Users, Package, TrendingUp, TrendingDown,
  AlertTriangle, PackageX, ArrowUpRight, ArrowDownRight,
} from 'lucide-react';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import { supabase } from '@/lib/supabase';
import { formatPrice } from '@/types';
import { Spinner, Badge } from '@/components/ui';
import { statusVariant } from '@/lib/utils';
import type { Order, Product, Customer } from '@/types';

export function AdminDashboardPage() {
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [salesData, setSalesData] = useState<{ date: string; sales: number; orders: number }[]>([]);
  const [categoryData, setCategoryData] = useState<{ name: string; value: number }[]>([]);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const [{ data: ords }, { data: prods }, { data: custs }] = await Promise.all([
        supabase.from('orders').select('*'),
        supabase.from('products').select('*, category:categories(name)'),
        supabase.from('customers').select('*'),
      ]);
      setOrders((ords || []) as Order[]);
      setProducts((prods || []) as Product[]);
      setCustomers((custs || []) as Customer[]);

      // Build sales over time (last 6 months)
      const now = new Date();
      const months: { date: string; sales: number; orders: number }[] = [];
      for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const label = d.toLocaleDateString('en-US', { month: 'short' });
        const monthOrders = (ords || []).filter((o) => {
          const od = new Date(o.created_at);
          return od.getMonth() === d.getMonth() && od.getFullYear() === d.getFullYear();
        });
        months.push({ date: label, sales: monthOrders.reduce((s, o) => s + Number(o.total), 0), orders: monthOrders.length });
      }
      setSalesData(months);

      // Category performance
      const catMap: Record<string, number> = {};
      (prods || []).forEach((p) => {
        const catName = (p as any).category?.name || 'Uncategorized';
        catMap[catName] = (catMap[catName] || 0) + 1;
      });
      setCategoryData(Object.entries(catMap).map(([name, value]) => ({ name, value })));

      setLoading(false);
    })();
  }, []);

  if (loading) return <div className="flex justify-center py-20"><Spinner /></div>;

  const totalSales = orders.reduce((s, o) => s + Number(o.total), 0);
  const today = new Date().toDateString();
  const todaySales = orders.filter((o) => new Date(o.created_at).toDateString() === today).reduce((s, o) => s + Number(o.total), 0);
  const pendingOrders = orders.filter((o) => ['Pending', 'Confirmed', 'Processing'].includes(o.status)).length;
  const completedOrders = orders.filter((o) => o.status === 'Delivered').length;
  const cancelledOrders = orders.filter((o) => o.status === 'Cancelled').length;
  const lowStock = products.filter((p) => p.stock > 0 && p.stock <= p.low_stock_threshold);
  const outOfStock = products.filter((p) => p.stock === 0);

  const stats = [
    { label: 'Total Sales', value: formatPrice(totalSales), icon: DollarSign, change: '+12.5%', up: true, color: 'bg-green-500' },
    { label: "Today's Sales", value: formatPrice(todaySales), icon: TrendingUp, change: '+8.2%', up: true, color: 'bg-blue-500' },
    { label: 'Total Orders', value: orders.length, icon: ShoppingCart, change: '+5.1%', up: true, color: 'bg-purple-500' },
    { label: 'Pending Orders', value: pendingOrders, icon: AlertTriangle, change: '-2.3%', up: false, color: 'bg-amber-500' },
    { label: 'Total Customers', value: customers.length, icon: Users, change: '+18.7%', up: true, color: 'bg-indigo-500' },
    { label: 'Total Products', value: products.length, icon: Package, change: '+3.4%', up: true, color: 'bg-teal-500' },
    { label: 'Low Stock', value: lowStock.length, icon: AlertTriangle, change: '0%', up: null, color: 'bg-orange-500' },
    { label: 'Out of Stock', value: outOfStock.length, icon: PackageX, change: '-1', up: false, color: 'bg-red-500' },
  ];

  const PIE_COLORS = ['#1a1a1a', '#6b6b78', '#c8862b', '#708238', '#1a2540', '#5e1a1a', '#d2b48c', '#9caf88', '#36454f', '#f4a93f', '#8d8d93'];

  const recentOrders = [...orders].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).slice(0, 6);

  return (
    <div>
      <h1 className="mb-6 font-display text-2xl font-bold text-ink-900">Dashboard Overview</h1>

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map((stat) => (
          <div key={stat.label} className="rounded-xl border border-ink-100 bg-white p-5">
            <div className="flex items-center justify-between">
              <div className={`grid h-10 w-10 place-items-center rounded-lg ${stat.color} text-white`}>
                <stat.icon size={20} />
              </div>
              {stat.up !== null && (
                <span className={`flex items-center gap-0.5 text-xs font-medium ${stat.up ? 'text-green-600' : 'text-red-600'}`}>
                  {stat.up ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                  {stat.change}
                </span>
              )}
            </div>
            <p className="mt-3 text-2xl font-bold text-ink-900">{stat.value}</p>
            <p className="text-xs text-ink-500">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        {/* Sales chart */}
        <div className="rounded-xl border border-ink-100 bg-white p-6 lg:col-span-2">
          <h2 className="mb-4 text-lg font-semibold text-ink-900">Sales & Orders Over Time</h2>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={salesData}>
              <defs>
                <linearGradient id="salesGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#1a1a1a" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#1a1a1a" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="ordersGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#c8862b" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#c8862b" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#ededf0" />
              <XAxis dataKey="date" tick={{ fontSize: 12 }} stroke="#8e8e98" />
              <YAxis tick={{ fontSize: 12 }} stroke="#8e8e98" />
              <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid #ededf0', fontSize: 12 }} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Area type="monotone" dataKey="sales" name="Sales (INR)" stroke="#1a1a1a" strokeWidth={2} fill="url(#salesGrad)" />
              <Area type="monotone" dataKey="orders" name="Orders" stroke="#c8862b" strokeWidth={2} fill="url(#ordersGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Category pie */}
        <div className="rounded-xl border border-ink-100 bg-white p-6">
          <h2 className="mb-4 text-lg font-semibold text-ink-900">Category Distribution</h2>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie data={categoryData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} innerRadius={50}>
                {categoryData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
              </Pie>
              <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12 }} />
            </PieChart>
          </ResponsiveContainer>
          <div className="mt-2 flex flex-wrap gap-2">
            {categoryData.map((cat, i) => (
              <div key={cat.name} className="flex items-center gap-1.5 text-xs text-ink-600">
                <div className="h-3 w-3 rounded-full" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />
                {cat.name}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent orders + Low stock */}
      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <div className="rounded-xl border border-ink-100 bg-white p-6 lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-ink-900">Recent Orders</h2>
            <Link to="/admin/orders" className="text-sm text-ink-600 hover:text-ink-900">View all</Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b border-ink-100 text-left text-xs text-ink-500">
                <th className="pb-2 font-medium">Order</th><th className="pb-2 font-medium">Customer</th><th className="pb-2 font-medium">Total</th><th className="pb-2 font-medium">Status</th>
              </tr></thead>
              <tbody>
                {recentOrders.map((order) => (
                  <tr key={order.id} className="border-b border-ink-50">
                    <td className="py-3 font-medium text-ink-900">{order.order_number}</td>
                    <td className="py-3 text-ink-600">{order.customer_name}</td>
                    <td className="py-3 font-semibold">{formatPrice(Number(order.total))}</td>
                    <td className="py-3"><Badge variant={statusVariant(order.status)}>{order.status}</Badge></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="rounded-xl border border-ink-100 bg-white p-6">
          <h2 className="mb-4 text-lg font-semibold text-ink-900">Stock Alerts</h2>
          <div className="space-y-3 max-h-64 overflow-y-auto">
            {lowStock.length === 0 && outOfStock.length === 0 ? <p className="text-sm text-ink-500">All products well stocked.</p> : (
              <>
                {outOfStock.map((p) => (
                  <div key={p.id} className="flex items-center justify-between rounded-lg border border-red-100 bg-red-50 p-3">
                    <div><p className="text-sm font-medium text-ink-900">{p.name}</p><p className="text-xs text-ink-500">{p.brand}</p></div>
                    <Badge variant="error">Out of Stock</Badge>
                  </div>
                ))}
                {lowStock.map((p) => (
                  <div key={p.id} className="flex items-center justify-between rounded-lg border border-amber-100 bg-amber-50 p-3">
                    <div><p className="text-sm font-medium text-ink-900">{p.name}</p><p className="text-xs text-ink-500">{p.brand}</p></div>
                    <Badge variant="warning">{p.stock} left</Badge>
                  </div>
                ))}
              </>
            )}
          </div>
          <Link to="/admin/inventory" className="mt-4 block text-center text-sm text-ink-600 hover:text-ink-900">Manage Inventory</Link>
        </div>
      </div>
    </div>
  );
}
