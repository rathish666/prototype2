import { useEffect, useState } from 'react';
import { Search, Save, AlertTriangle, PackageX } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { Button, Badge, Spinner, EmptyState } from '@/components/ui';
import { statusVariant } from '@/lib/utils';
import type { Product } from '@/types';

export function AdminInventoryPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [edits, setEdits] = useState<Record<string, { stock: number; threshold: number }>>({});
  const [saving, setSaving] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    const { data } = await supabase.from('products').select('*').order('name');
    setProducts((data || []) as Product[]);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const filtered = products.filter((p) => {
    if (search && !p.name.toLowerCase().includes(search.toLowerCase())) return false;
    if (filter === 'low' && !(p.stock > 0 && p.stock <= p.low_stock_threshold)) return false;
    if (filter === 'out' && p.stock !== 0) return false;
    if (filter === 'ok' && p.stock <= p.low_stock_threshold) return false;
    return true;
  });

  const getEdit = (p: Product) => edits[p.id] || { stock: p.stock, threshold: p.low_stock_threshold };

  const handleSave = async (p: Product) => {
    const edit = getEdit(p);
    if (edit.stock === p.stock && edit.threshold === p.low_stock_threshold) return;
    setSaving(p.id);
    const newStatus = edit.stock === 0 ? 'Out of Stock' : edit.stock <= edit.threshold ? 'Low Stock' : 'In Stock';
    await supabase.from('products').update({ stock: edit.stock, low_stock_threshold: edit.threshold, status: newStatus }).eq('id', p.id);
    setSaving(null);
    fetchData();
  };

  const inputCls = 'w-20 rounded-lg border border-ink-200 px-2 py-1.5 text-sm outline-none focus:border-ink-900';

  return (
    <div>
      <h1 className="mb-6 font-display text-2xl font-bold text-ink-900">Inventory Management</h1>

      <div className="mb-4 flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400" />
          <input className="w-full rounded-lg border border-ink-200 py-2 pl-9 pr-3 text-sm outline-none focus:border-ink-900" placeholder="Search products..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <select className="rounded-lg border border-ink-200 px-3 py-2 text-sm" value={filter} onChange={(e) => setFilter(e.target.value)}>
          <option value="all">All Products</option>
          <option value="ok">In Stock</option>
          <option value="low">Low Stock</option>
          <option value="out">Out of Stock</option>
        </select>
      </div>

      {loading ? <div className="flex justify-center py-20"><Spinner /></div> : filtered.length === 0 ? <EmptyState title="No products found" /> : (
        <div className="overflow-x-auto rounded-xl border border-ink-100 bg-white">
          <table className="w-full text-sm">
            <thead><tr className="border-b border-ink-100 text-left text-xs text-ink-500">
              <th className="p-4 font-medium">Product</th><th className="p-4 font-medium">SKU</th><th className="p-4 font-medium">Current Stock</th><th className="p-4 font-medium">Low Stock Threshold</th><th className="p-4 font-medium">Status</th><th className="p-4 font-medium text-right">Action</th>
            </tr></thead>
            <tbody>
              {filtered.map((p) => {
                const edit = getEdit(p);
                const changed = edit.stock !== p.stock || edit.threshold !== p.low_stock_threshold;
                return (
                  <tr key={p.id} className="border-b border-ink-50">
                    <td className="p-4"><p className="font-medium text-ink-900 line-clamp-1">{p.name}</p><p className="text-xs text-ink-500">{p.brand}</p></td>
                    <td className="p-4 text-ink-600">{p.sku}</td>
                    <td className="p-4"><input type="number" min={0} className={inputCls} value={edit.stock} onChange={(e) => setEdits({ ...edits, [p.id]: { ...edit, stock: Number(e.target.value) } })} /></td>
                    <td className="p-4"><input type="number" min={0} className={inputCls} value={edit.threshold} onChange={(e) => setEdits({ ...edits, [p.id]: { ...edit, threshold: Number(e.target.value) } })} /></td>
                    <td className="p-4"><Badge variant={statusVariant(p.status)}>{p.status}</Badge></td>
                    <td className="p-4 text-right">
                      <Button size="sm" variant={changed ? 'primary' : 'ghost'} disabled={!changed || saving === p.id} onClick={() => handleSave(p)}>
                        {saving === p.id ? 'Saving...' : <><Save size={14} /> Save</>}
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Summary cards */}
      <div className="mt-6 grid grid-cols-3 gap-4">
        <div className="rounded-xl border border-amber-100 bg-amber-50 p-5"><AlertTriangle size={20} className="text-amber-600" /><p className="mt-2 text-2xl font-bold text-ink-900">{products.filter((p) => p.stock > 0 && p.stock <= p.low_stock_threshold).length}</p><p className="text-xs text-ink-500">Low Stock Items</p></div>
        <div className="rounded-xl border border-red-100 bg-red-50 p-5"><PackageX size={20} className="text-red-600" /><p className="mt-2 text-2xl font-bold text-ink-900">{products.filter((p) => p.stock === 0).length}</p><p className="text-xs text-ink-500">Out of Stock</p></div>
        <div className="rounded-xl border border-green-100 bg-green-50 p-5"><p className="mt-2 text-2xl font-bold text-ink-900">{products.filter((p) => p.stock > p.low_stock_threshold).length}</p><p className="text-xs text-ink-500">Well Stocked</p></div>
      </div>
    </div>
  );
}
