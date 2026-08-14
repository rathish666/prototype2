import { useEffect, useState } from 'react';
import { Plus, Trash2, X, Ticket } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { Button, Badge, Spinner, EmptyState } from '@/components/ui';
import { formatPrice, type Coupon } from '@/types';
import { formatDate } from '@/lib/utils';

export function AdminCouponsPage() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ code: '', type: 'percentage', value: 10, min_order: 0, expires_at: '', enabled: true });
  const [saving, setSaving] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    const { data } = await supabase.from('coupons').select('*').order('created_at', { ascending: false });
    setCoupons((data || []) as Coupon[]);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const handleSave = async () => {
    if (!form.code.trim()) return;
    setSaving(true);
    await supabase.from('coupons').insert({ code: form.code.toUpperCase(), type: form.type, value: form.value, min_order: form.min_order, expires_at: form.expires_at || null, enabled: form.enabled });
    setSaving(false);
    setShowForm(false);
    setForm({ code: '', type: 'percentage', value: 10, min_order: 0, expires_at: '', enabled: true });
    fetchData();
  };

  const handleDelete = async (c: Coupon) => {
    await supabase.from('coupons').delete().eq('id', c.id);
    fetchData();
  };

  const toggleEnabled = async (c: Coupon) => {
    await supabase.from('coupons').update({ enabled: !c.enabled }).eq('id', c.id);
    fetchData();
  };

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="font-display text-2xl font-bold text-ink-900">Coupon Management</h1>
        <Button onClick={() => setShowForm(true)}><Plus size={18} /> Add Coupon</Button>
      </div>

      {loading ? <div className="flex justify-center py-20"><Spinner /></div> : coupons.length === 0 ? <EmptyState icon={<Ticket size={48} />} title="No coupons yet" action={<Button onClick={() => setShowForm(true)}>Add Coupon</Button>} /> : (
        <div className="overflow-x-auto rounded-xl border border-ink-100 bg-white">
          <table className="w-full text-sm">
            <thead><tr className="border-b border-ink-100 text-left text-xs text-ink-500">
              <th className="p-4 font-medium">Code</th><th className="p-4 font-medium">Type</th><th className="p-4 font-medium">Value</th><th className="p-4 font-medium">Min Order</th><th className="p-4 font-medium">Expires</th><th className="p-4 font-medium">Status</th><th className="p-4 font-medium text-right">Actions</th>
            </tr></thead>
            <tbody>
              {coupons.map((c) => (
                <tr key={c.id} className="border-b border-ink-50">
                  <td className="p-4"><span className="rounded-lg bg-ink-100 px-2.5 py-1 font-mono text-xs font-bold text-ink-900">{c.code}</span></td>
                  <td className="p-4 text-ink-600 capitalize">{c.type}</td>
                  <td className="p-4 font-semibold">{c.type === 'percentage' ? `${c.value}%` : formatPrice(c.value)}</td>
                  <td className="p-4 text-ink-600">{formatPrice(c.min_order)}</td>
                  <td className="p-4 text-ink-600">{c.expires_at ? formatDate(c.expires_at) : 'Never'}</td>
                  <td className="p-4"><button onClick={() => toggleEnabled(c)}>{c.enabled ? <Badge variant="success">Active</Badge> : <Badge variant="error">Inactive</Badge>}</button></td>
                  <td className="p-4 text-right"><Button size="sm" variant="ghost" className="text-error-500" onClick={() => handleDelete(c)}><Trash2 size={14} /></Button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowForm(false)} />
          <div className="relative w-full max-w-md rounded-xl bg-white p-6 animate-scale-in">
            <div className="mb-4 flex items-center justify-between"><h2 className="text-lg font-semibold text-ink-900">Add Coupon</h2><button onClick={() => setShowForm(false)}><X size={20} className="text-ink-400" /></button></div>
            <div className="space-y-4">
              <div><label className="mb-1 block text-sm font-medium text-ink-700">Code *</label><input className="w-full rounded-lg border border-ink-200 px-4 py-2.5 text-sm uppercase outline-none focus:border-ink-900" placeholder="SAVE20" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="mb-1 block text-sm font-medium text-ink-700">Type</label><select className="w-full rounded-lg border border-ink-200 px-3 py-2.5 text-sm" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}><option value="percentage">Percentage</option><option value="fixed">Fixed Amount</option></select></div>
                <div><label className="mb-1 block text-sm font-medium text-ink-700">Value</label><input type="number" className="w-full rounded-lg border border-ink-200 px-4 py-2.5 text-sm" value={form.value} onChange={(e) => setForm({ ...form, value: Number(e.target.value) })} /></div>
              </div>
              <div><label className="mb-1 block text-sm font-medium text-ink-700">Minimum Order ($)</label><input type="number" className="w-full rounded-lg border border-ink-200 px-4 py-2.5 text-sm" value={form.min_order} onChange={(e) => setForm({ ...form, min_order: Number(e.target.value) })} /></div>
              <div><label className="mb-1 block text-sm font-medium text-ink-700">Expiry Date</label><input type="date" className="w-full rounded-lg border border-ink-200 px-4 py-2.5 text-sm" value={form.expires_at} onChange={(e) => setForm({ ...form, expires_at: e.target.value })} /></div>
              <label className="flex items-center gap-2 text-sm text-ink-700"><input type="checkbox" checked={form.enabled} onChange={(e) => setForm({ ...form, enabled: e.target.checked })} className="h-4 w-4 rounded border-ink-300" /> Enabled</label>
            </div>
            <div className="mt-6 flex gap-3"><Button variant="outline" className="flex-1" onClick={() => setShowForm(false)}>Cancel</Button><Button className="flex-1" disabled={saving} onClick={handleSave}>{saving ? 'Saving...' : 'Create Coupon'}</Button></div>
          </div>
        </div>
      )}
    </div>
  );
}
