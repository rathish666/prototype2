import { useEffect, useState } from 'react';
import { Search, Save, AlertTriangle, PackageX } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { Button, Badge, Spinner, EmptyState } from '@/components/ui';
import { statusVariant } from '@/lib/utils';
import type { Product, ProductVariant } from '@/types';

export function AdminInventoryPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [variantEdits, setVariantEdits] = useState<Record<string, Record<string, { stock: number; threshold: number }>>>({});
  const [saving, setSaving] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    const { data } = await supabase.from('products').select('*, variants:product_variants(*)').order('name');
    setProducts((data || []) as Product[]);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const getTotalStock = (product: Product) => product.variants?.length ? product.variants.reduce((sum, variant) => sum + Number(variant.stock), 0) : Number(product.stock);
  const getMinThreshold = (product: Product) => product.variants?.length ? Math.min(...product.variants.map((variant) => Number(variant.low_stock_threshold))) : Number(product.low_stock_threshold);
  const getStatus = (product: Product) => {
    const totalStock = getTotalStock(product);
    const threshold = getMinThreshold(product);
    if (totalStock === 0) return 'Out of Stock';
    if (totalStock <= threshold) return 'Low Stock';
    return 'In Stock';
  };

  const filtered = products.filter((product) => {
    const totalStock = getTotalStock(product);
    const threshold = getMinThreshold(product);
    if (search && !product.name.toLowerCase().includes(search.toLowerCase())) return false;
    if (filter === 'low' && !(totalStock > 0 && totalStock <= threshold)) return false;
    if (filter === 'out' && totalStock !== 0) return false;
    if (filter === 'ok' && totalStock <= threshold) return false;
    return true;
  });

  const updateVariantEdit = (productId: string, variantId: string, field: 'stock' | 'threshold', value: number) => {
    setVariantEdits((prev) => {
      const productMap = prev[productId] ?? {};
      const variant = productMap[variantId] ?? { stock: 0, threshold: 0 };
      return {
        ...prev,
        [productId]: {
          ...productMap,
          [variantId]: {
            ...variant,
            [field === 'stock' ? 'stock' : 'threshold']: value,
          },
        },
      };
    });
  };

  const handleVariantSave = async (productId: string, variant: ProductVariant) => {
    const edit = variantEdits[productId]?.[variant.id] ?? { stock: variant.stock, threshold: variant.low_stock_threshold };
    setSaving(variant.id);
    const { error } = await supabase.from('product_variants').update({
      stock: Number(edit.stock),
      low_stock_threshold: Number(edit.threshold),
    }).eq('id', variant.id);
    setSaving(null);
    if (!error) fetchData();
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
        <div className="space-y-4">
          {filtered.map((product) => {
            const totalStock = getTotalStock(product);
            const threshold = getMinThreshold(product);
            const status = getStatus(product);
            const variantRows = product.variants ?? [];

            return (
              <div key={product.id} className="overflow-hidden rounded-xl border border-ink-100 bg-white">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-ink-100 p-4">
                  <div>
                    <p className="font-medium text-ink-900">{product.name}</p>
                    <p className="text-xs text-ink-500">{product.brand} • {product.sku || 'No SKU'}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-ink-600">{variantRows.length ? `${variantRows.length} variant rows` : 'Single SKU'} </span>
                    <span className="text-sm font-semibold text-ink-900">Total stock: {totalStock}</span>
                    <Badge variant={statusVariant(status)}>{status}</Badge>
                  </div>
                </div>

                {variantRows.length === 0 ? (
                  <div className="p-4 text-sm text-ink-600">No variant rows recorded yet. Use the product editor to set a size/color matrix.</div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-ink-100 bg-ink-50 text-left text-xs text-ink-500">
                          <th className="p-3 font-medium">Size</th>
                          <th className="p-3 font-medium">Color</th>
                          <th className="p-3 font-medium">Stock</th>
                          <th className="p-3 font-medium">Threshold</th>
                          <th className="p-3 font-medium text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {variantRows.map((variant) => {
                          const edit = variantEdits[product.id]?.[variant.id] ?? { stock: variant.stock, threshold: variant.low_stock_threshold };
                          const changed = edit.stock !== variant.stock || edit.threshold !== variant.low_stock_threshold;

                          return (
                            <tr key={variant.id} className="border-b border-ink-50 last:border-b-0">
                              <td className="p-3 text-ink-700">{variant.size}</td>
                              <td className="p-3 text-ink-700">{variant.color}</td>
                              <td className="p-3"><input type="number" min={0} className={inputCls} value={edit.stock} onChange={(e) => updateVariantEdit(product.id, variant.id, 'stock', Number(e.target.value))} /></td>
                              <td className="p-3"><input type="number" min={0} className={inputCls} value={edit.threshold} onChange={(e) => updateVariantEdit(product.id, variant.id, 'threshold', Number(e.target.value))} /></td>
                              <td className="p-3 text-right">
                                <Button size="sm" variant={changed ? 'primary' : 'ghost'} disabled={!changed || saving === variant.id} onClick={() => handleVariantSave(product.id, variant)}>
                                  {saving === variant.id ? 'Saving...' : <><Save size={14} /> Save</>}
                                </Button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <div className="mt-6 grid grid-cols-3 gap-4">
        <div className="rounded-xl border border-amber-100 bg-amber-50 p-5"><AlertTriangle size={20} className="text-amber-600" /><p className="mt-2 text-2xl font-bold text-ink-900">{products.filter((product) => getTotalStock(product) > 0 && getTotalStock(product) <= getMinThreshold(product)).length}</p><p className="text-xs text-ink-500">Low Stock Items</p></div>
        <div className="rounded-xl border border-red-100 bg-red-50 p-5"><PackageX size={20} className="text-red-600" /><p className="mt-2 text-2xl font-bold text-ink-900">{products.filter((product) => getTotalStock(product) === 0).length}</p><p className="text-xs text-ink-500">Out of Stock</p></div>
        <div className="rounded-xl border border-green-100 bg-green-50 p-5"><p className="mt-2 text-2xl font-bold text-ink-900">{products.filter((product) => getTotalStock(product) > getMinThreshold(product)).length}</p><p className="text-xs text-ink-500">Well Stocked</p></div>
      </div>
    </div>
  );
}
