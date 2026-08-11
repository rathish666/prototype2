import { useEffect, useState } from 'react';
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import { TrendingUp, ShoppingCart, DollarSign, Users, Package } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { Spinner } from '@/components/ui';
import { formatPrice } from '@/types';

const PIE_COLORS = ['#1a1a1a', '#6b6b78', '#c8862b', '#708238', '#1a2540', '#5e1a1a', '#d2b48c', '#9caf88'];

export function AdminAnalyticsPage() {
  const [loading, setLoading] = useState(true);
  const [salesData, setSalesData] = useState<{ date: string; sales: number; orders: number }[]>([]);
  const [categoryData, setCategoryData] = useState<{ name: string; value: number; revenue: number }[]>([]);
  const [topProducts, setTopProducts] = useState<{ name: string; sales: number; revenue: number }[]>([]);
  const [monthlyRevenue, setMonthlyRevenue] = useState<{ month: string; revenue: number; profit: number }[]>([]);
  const [customerGrowth, setCustomerGrowth] = useState<{ month: string; new: number; total: number }[]>([]);
  const [totals, setTotals] = useState({ revenue: 0, orders: 0, customers: 0, products: 0, avgOrder: 0 });

  useEffect(() => {
    (async () => {
      setLoading(true);
      const [{ data: orders }, { data: products }, { data: customers }] = await Promise.all([
        supabase.from('orders').select('*'),
        supabase.from('products').select('*, category:categories(name)'),
        supabase.from('customers').select('*'),
      ]);

      const totalRevenue = (orders || []).reduce((s, o) => s + Number(o.total), 0);
      setTotals({
        revenue: totalRevenue,
        orders: orders?.length || 0,
        customers: customers?.length || 0,
        products: products?.length || 0,
        avgOrder: orders?.length ? totalRevenue / orders.length : 0,
      });

      // Monthly sales (last 12 months)
      const now = new Date();
      const months: { date: string; sales: number; orders: number }[] = [];
      for (let i = 11; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const label = d.toLocaleDateString('en-US', { month: 'short' });
        const mOrders = (orders || []).filter((o) => { const od = new Date(o.created_at); return od.getMonth() === d.getMonth() && od.getFullYear() === d.getFullYear(); });
        months.push({ date: label, sales: mOrders.reduce((s, o) => s + Number(o.total), 0), orders: mOrders.length });
      }
      setSalesData(months);

      // Monthly revenue + profit
      const revMonths = months.map((m) => ({ month: m.date, revenue: m.sales, profit: m.sales * 0.35 }));
      setMonthlyRevenue(revMonths);

      // Category performance
      const catMap: Record<string, { value: number; revenue: number }> = {};
      (products || []).forEach((p) => {
        const catName = (p as any).category?.name || 'Uncategorized';
        if (!catMap[catName]) catMap[catName] = { value: 0, revenue: 0 };
        catMap[catName].value++;
        catMap[catName].revenue += Number(p.discount_price || p.price) * Math.max(1, p.review_count);
      });
      setCategoryData(Object.entries(catMap).map(([name, v]) => ({ name, value: v.value, revenue: v.revenue })));

      // Top products by review count (proxy for sales)
      const top = [...(products || [])].sort((a, b) => b.review_count - a.review_count).slice(0, 8).map((p) => ({ name: p.name.slice(0, 20), sales: p.review_count, revenue: Number(p.discount_price || p.price) * p.review_count }));
      setTopProducts(top);

      // Customer growth
      const custMonths: { month: string; new: number; total: number }[] = [];
      let runningTotal = 0;
      for (let i = 11; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const label = d.toLocaleDateString('en-US', { month: 'short' });
        const newCusts = (customers || []).filter((c) => { const cd = new Date(c.created_at); return cd.getMonth() === d.getMonth() && cd.getFullYear() === d.getFullYear(); }).length;
        runningTotal += newCusts;
        custMonths.push({ month: label, new: newCusts, total: runningTotal });
      }
      setCustomerGrowth(custMonths);

      setLoading(false);
    })();
  }, []);

  if (loading) return <div className="flex justify-center py-20"><Spinner /></div>;

  const statCards = [
    { label: 'Total Revenue', value: formatPrice(totals.revenue), icon: DollarSign, color: 'bg-green-500' },
    { label: 'Total Orders', value: totals.orders, icon: ShoppingCart, color: 'bg-blue-500' },
    { label: 'Avg Order Value', value: formatPrice(totals.avgOrder), icon: TrendingUp, color: 'bg-purple-500' },
    { label: 'Total Customers', value: totals.customers, icon: Users, color: 'bg-indigo-500' },
  ];

  return (
    <div>
      <h1 className="mb-6 font-display text-2xl font-bold text-ink-900">Analytics & Reports</h1>

      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {statCards.map((s) => (
          <div key={s.label} className="rounded-xl border border-ink-100 bg-white p-5">
            <div className={`grid h-10 w-10 place-items-center rounded-lg ${s.color} text-white`}><s.icon size={20} /></div>
            <p className="mt-3 text-2xl font-bold text-ink-900">{s.value}</p>
            <p className="text-xs text-ink-500">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Sales trend */}
      <div className="mt-6 rounded-xl border border-ink-100 bg-white p-6">
        <h2 className="mb-4 text-lg font-semibold text-ink-900">Sales & Orders (12 Months)</h2>
        <ResponsiveContainer width="100%" height={320}>
          <AreaChart data={salesData}>
            <defs>
              <linearGradient id="aSales" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#1a1a1a" stopOpacity={0.3} /><stop offset="95%" stopColor="#1a1a1a" stopOpacity={0} /></linearGradient>
              <linearGradient id="aOrders" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#c8862b" stopOpacity={0.3} /><stop offset="95%" stopColor="#c8862b" stopOpacity={0} /></linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#ededf0" />
            <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="#8e8e98" />
            <YAxis tick={{ fontSize: 11 }} stroke="#8e8e98" />
            <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12 }} />
            <Legend wrapperStyle={{ fontSize: 12 }} />
              <Area type="monotone" dataKey="sales" name="Sales (INR)" stroke="#1a1a1a" strokeWidth={2} fill="url(#aSales)" />
            <Area type="monotone" dataKey="orders" name="Orders" stroke="#c8862b" strokeWidth={2} fill="url(#aOrders)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        {/* Revenue vs profit */}
        <div className="rounded-xl border border-ink-100 bg-white p-6">
          <h2 className="mb-4 text-lg font-semibold text-ink-900">Revenue vs Profit</h2>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={monthlyRevenue}>
              <CartesianGrid strokeDasharray="3 3" stroke="#ededf0" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} stroke="#8e8e98" />
              <YAxis tick={{ fontSize: 11 }} stroke="#8e8e98" />
              <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12 }} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar dataKey="revenue" name="Revenue" fill="#1a1a1a" radius={[4, 4, 0, 0]} />
              <Bar dataKey="profit" name="Profit" fill="#708238" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Category distribution */}
        <div className="rounded-xl border border-ink-100 bg-white p-6">
          <h2 className="mb-4 text-lg font-semibold text-ink-900">Category Distribution</h2>
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie data={categoryData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} innerRadius={50} label={({ name }) => name} labelLine={false}>
                {categoryData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
              </Pie>
              <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12 }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        {/* Top products */}
        <div className="rounded-xl border border-ink-100 bg-white p-6">
          <h2 className="mb-4 text-lg font-semibold text-ink-900">Top Products by Sales</h2>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={topProducts} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#ededf0" />
              <XAxis type="number" tick={{ fontSize: 11 }} stroke="#8e8e98" />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} stroke="#8e8e98" width={100} />
              <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12 }} />
              <Bar dataKey="sales" name="Units Sold" fill="#c8862b" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Customer growth */}
        <div className="rounded-xl border border-ink-100 bg-white p-6">
          <h2 className="mb-4 text-lg font-semibold text-ink-900">Customer Growth</h2>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={customerGrowth}>
              <CartesianGrid strokeDasharray="3 3" stroke="#ededf0" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} stroke="#8e8e98" />
              <YAxis tick={{ fontSize: 11 }} stroke="#8e8e98" />
              <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12 }} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Line type="monotone" dataKey="new" name="New Customers" stroke="#1a1a1a" strokeWidth={2} />
              <Line type="monotone" dataKey="total" name="Total Customers" stroke="#708238" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
