import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Search, Pencil, Trash2, Eye, Star } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { Button, Badge, Spinner, EmptyState } from '@/components/ui';
import { formatPrice, effectivePrice, type Product, type Category } from '@/types';
import { statusVariant } from '@/lib/utils';
import { cn } from '@/lib/utils';

export function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null);
  const [deleting, setDeleting] = useState(false);
  const perPage = 10;

  const fetchData = async () => {
    setLoading(true);
    const [{ data: prods }, { data: cats }] = await Promise.all([
      supabase.from('products').select('*, images:product_images(*), category:categories(*)').order('created_at', { ascending: false }),
      supabase.from('categories').select('*').order('name'),
    ]);
    setProducts((prods || []) as Product[]);
    setCategories((cats || []) as Category[]);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const filtered = products.filter((p) => {
    if (search && !p.name.toLowerCase().includes(search.toLowerCase()) && !p.brand.toLowerCase().includes(search.toLowerCase())) return false;
    if (categoryFilter !== 'all' && p.category?.slug !== categoryFilter) return false;
    if (statusFilter !== 'all' && p.status !== statusFilter) return false;
    return true;
  });

  const paginated = filtered.slice((page - 1) * perPage, page * perPage);
  const totalPages = Math.ceil(filtered.length / perPage);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    await supabase.from('products').delete().eq('id', deleteTarget.id);
    setDeleting(false);
    setDeleteTarget(null);
    fetchData();
  };

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <h1 className="font-display text-2xl font-bold text-ink-900">Product Management</h1>
        <Link to="/admin/products/new"><Button><Plus size={18} /> Add Product</Button></Link>
      </div>

      {/* Filters */}
      <div className="mb-4 flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400" />
          <input className="w-full rounded-lg border border-ink-200 py-2 pl-9 pr-3 text-sm outline-none focus:border-ink-900" placeholder="Search products..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
        </div>
        <select className="rounded-lg border border-ink-200 px-3 py-2 text-sm" value={categoryFilter} onChange={(e) => { setCategoryFilter(e.target.value); setPage(1); }}>
          <option value="all">All Categories</option>
          {categories.map((c) => <option key={c.id} value={c.slug}>{c.name}</option>)}
        </select>
        <select className="rounded-lg border border-ink-200 px-3 py-2 text-sm" value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}>
          <option value="all">All Status</option>
          <option value="In Stock">In Stock</option>
          <option value="Low Stock">Low Stock</option>
          <option value="Out of Stock">Out of Stock</option>
        </select>
      </div>

      {/* Table */}
      {loading ? <div className="flex justify-center py-20"><Spinner /></div> : filtered.length === 0 ? <EmptyState title="No products found" description="Try adjusting filters or add a new product." /> : (
        <div className="overflow-x-auto rounded-xl border border-ink-100 bg-white">
          <table className="w-full text-sm">
            <thead><tr className="border-b border-ink-100 text-left text-xs text-ink-500">
              <th className="p-4 font-medium">Product</th><th className="p-4 font-medium">Category</th><th className="p-4 font-medium">Price</th><th className="p-4 font-medium">Stock</th><th className="p-4 font-medium">Status</th><th className="p-4 font-medium">Flags</th><th className="p-4 font-medium text-right">Actions</th>
            </tr></thead>
            <tbody>
              {paginated.map((p) => (
                <tr key={p.id} className="border-b border-ink-50 hover:bg-ink-50">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="h-12 w-10 shrink-0 overflow-hidden rounded-lg bg-ink-50">
                        {p.images?.[0]?.url && <img src={p.images[0].url} alt="" className="h-full w-full object-cover" />}
                      </div>
                      <div><p className="font-medium text-ink-900 line-clamp-1">{p.name}</p><p className="text-xs text-ink-500">{p.brand} · {p.sku}</p></div>
                    </div>
                  </td>
                  <td className="p-4 text-ink-600">{p.category?.name || '—'}</td>
                  <td className="p-4">
                    <span className="font-semibold">{formatPrice(effectivePrice(p))}</span>
                    {p.discount_price && p.discount_price < p.price && <span className="ml-1 text-xs text-ink-400 line-through">{formatPrice(p.price)}</span>}
                  </td>
                  <td className="p-4 font-medium">{p.stock}</td>
                  <td className="p-4"><Badge variant={statusVariant(p.status)}>{p.status}</Badge></td>
                  <td className="p-4">
                    <div className="flex gap-1">
                      {p.featured && <span title="Featured"><Star size={14} className="fill-accent-400 text-accent-400" /></span>}
                      {p.best_seller && <Badge variant="accent">Best</Badge>}
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="flex justify-end gap-1">
                      <Link to={`/product/${p.id}`} className="grid h-8 w-8 place-items-center rounded-lg text-ink-500 hover:bg-ink-100"><Eye size={16} /></Link>
                      <Link to={`/admin/products/${p.id}/edit`} className="grid h-8 w-8 place-items-center rounded-lg text-ink-500 hover:bg-ink-100"><Pencil size={16} /></Link>
                      <button onClick={() => setDeleteTarget(p)} className="grid h-8 w-8 place-items-center rounded-lg text-error-500 hover:bg-red-50"><Trash2 size={16} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-ink-100 px-4 py-3">
              <p className="text-xs text-ink-500">Showing {(page - 1) * perPage + 1}–{Math.min(page * perPage, filtered.length)} of {filtered.length}</p>
              <div className="flex gap-1">
                <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>Prev</Button>
                <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>Next</Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Delete confirmation */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setDeleteTarget(null)} />
          <div className="relative w-full max-w-sm rounded-xl bg-white p-6 animate-scale-in">
            <div className="mb-4 grid h-12 w-12 place-items-center rounded-full bg-red-100"><Trash2 size={24} className="text-red-600" /></div>
            <h3 className="text-lg font-semibold text-ink-900">Delete Product?</h3>
            <p className="mt-1 text-sm text-ink-500">Are you sure you want to delete "{deleteTarget.name}"? This action cannot be undone.</p>
            <div className="mt-6 flex gap-3">
              <Button variant="outline" className="flex-1" onClick={() => setDeleteTarget(null)}>Cancel</Button>
              <Button variant="danger" className="flex-1" onClick={handleDelete} disabled={deleting}>{deleting ? 'Deleting...' : 'Delete'}</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
