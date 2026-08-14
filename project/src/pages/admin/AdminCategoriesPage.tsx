import { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, X } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { Button, Spinner, EmptyState } from '@/components/ui';
import { type Category } from '@/types';
import { formatDate } from '@/lib/utils';

export function AdminCategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editTarget, setEditTarget] = useState<Category | null>(null);
  const [form, setForm] = useState({ name: '', slug: '', image: '', enabled: true });
  const [saving, setSaving] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    const { data } = await supabase.from('categories').select('*').order('name');
    setCategories((data || []) as Category[]);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const openAdd = () => { setEditTarget(null); setForm({ name: '', slug: '', image: '', enabled: true }); setShowForm(true); };
  const openEdit = (cat: Category) => { setEditTarget(cat); setForm({ name: cat.name, slug: cat.slug, image: cat.image || '', enabled: cat.enabled }); setShowForm(true); };

  const handleSave = async () => {
    if (!form.name.trim()) return;
    setSaving(true);
    const slug = form.slug || form.name.toLowerCase().replace(/\s+/g, '-');
    if (editTarget) {
      await supabase.from('categories').update({ name: form.name, slug, image: form.image || null, enabled: form.enabled }).eq('id', editTarget.id);
    } else {
      await supabase.from('categories').insert({ name: form.name, slug, image: form.image || null, enabled: form.enabled });
    }
    setSaving(false);
    setShowForm(false);
    fetchData();
  };

  const handleDelete = async (cat: Category) => {
    await supabase.from('categories').delete().eq('id', cat.id);
    fetchData();
  };

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="font-display text-2xl font-bold text-ink-900">Category Management</h1>
        <Button onClick={openAdd}><Plus size={18} /> Add Category</Button>
      </div>

      {loading ? <div className="flex justify-center py-20"><Spinner /></div> : categories.length === 0 ? <EmptyState title="No categories yet" action={<Button onClick={openAdd}>Add Category</Button>} /> : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {categories.map((cat) => (
            <div key={cat.id} className="rounded-xl border border-ink-100 bg-white p-5">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  {cat.image ? <img src={cat.image} alt="" className="h-12 w-12 rounded-lg object-cover" /> : <div className="grid h-12 w-12 place-items-center rounded-lg bg-ink-100 text-ink-400"><Plus size={20} /></div>}
                  <div><p className="font-semibold text-ink-900">{cat.name}</p><p className="text-xs text-ink-500">/{cat.slug}</p></div>
                </div>
                <span className={`h-2.5 w-2.5 rounded-full ${cat.enabled ? 'bg-green-500' : 'bg-ink-300'}`} />
              </div>
              <p className="mt-2 text-xs text-ink-500">Created {formatDate(cat.created_at)}</p>
              <div className="mt-4 flex gap-2">
                <Button size="sm" variant="outline" onClick={() => openEdit(cat)}><Pencil size={14} /> Edit</Button>
                <Button size="sm" variant="ghost" onClick={() => handleDelete(cat)} className="text-error-500"><Trash2 size={14} /> Delete</Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Form modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowForm(false)} />
          <div className="relative w-full max-w-md rounded-xl bg-white p-6 animate-scale-in">
            <div className="mb-4 flex items-center justify-between"><h2 className="text-lg font-semibold text-ink-900">{editTarget ? 'Edit Category' : 'Add Category'}</h2><button onClick={() => setShowForm(false)}><X size={20} className="text-ink-400" /></button></div>
            <div className="space-y-4">
              <div><label className="mb-1 block text-sm font-medium text-ink-700">Name *</label><input className="w-full rounded-lg border border-ink-200 px-4 py-2.5 text-sm outline-none focus:border-ink-900" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
              <div><label className="mb-1 block text-sm font-medium text-ink-700">Slug</label><input className="w-full rounded-lg border border-ink-200 px-4 py-2.5 text-sm outline-none focus:border-ink-900" placeholder="auto-generated if empty" value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} /></div>
              <div><label className="mb-1 block text-sm font-medium text-ink-700">Image URL</label><input className="w-full rounded-lg border border-ink-200 px-4 py-2.5 text-sm outline-none focus:border-ink-900" placeholder="https://..." value={form.image} onChange={(e) => setForm({ ...form, image: e.target.value })} /></div>
              <label className="flex items-center gap-2 text-sm text-ink-700"><input type="checkbox" checked={form.enabled} onChange={(e) => setForm({ ...form, enabled: e.target.checked })} className="h-4 w-4 rounded border-ink-300" /> Enabled</label>
            </div>
            <div className="mt-6 flex gap-3"><Button variant="outline" className="flex-1" onClick={() => setShowForm(false)}>Cancel</Button><Button className="flex-1" disabled={saving} onClick={handleSave}>{saving ? 'Saving...' : 'Save'}</Button></div>
          </div>
        </div>
      )}
    </div>
  );
}
