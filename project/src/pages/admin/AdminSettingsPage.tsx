import { useState } from 'react';
import { Store, Mail, Phone, MapPin, Save } from 'lucide-react';
import { Button } from '@/components/ui';

export function AdminSettingsPage() {
  const [form, setForm] = useState({
    storeName: 'Maison Co.',
    storeEmail: 'srathish575@gmail.com',
    storePhone: '9003279815',
    storeAddress: 'tamil nade, india',
    currency: 'INR',
    shippingThreshold: '75',
    freeShippingText: 'Free shipping on orders over INR 75',
    taxRate: '8.875',
    adminEmail: 'admin@maisonco.com',
  });
  const [saved, setSaved] = useState(false);

  const handleSave = () => { setSaved(true); setTimeout(() => setSaved(false), 3000); };

  const inputCls = 'w-full rounded-lg border border-ink-200 px-4 py-2.5 text-sm outline-none focus:border-ink-900';
  const labelCls = 'mb-1 block text-sm font-medium text-ink-700';

  return (
    <div>
      <h1 className="mb-6 font-display text-2xl font-bold text-ink-900">Store Settings</h1>

      <div className="max-w-2xl space-y-6">
        {/* Store info */}
        <section className="rounded-xl border border-ink-100 bg-white p-6">
          <div className="mb-4 flex items-center gap-2"><Store size={20} className="text-ink-700" /><h2 className="text-lg font-semibold text-ink-900">Store Information</h2></div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div><label className={labelCls}>Store Name</label><input className={inputCls} value={form.storeName} onChange={(e) => setForm({ ...form, storeName: e.target.value })} /></div>
            <div><label className={labelCls}>Currency</label><select className={inputCls} value={form.currency} onChange={(e) => setForm({ ...form, currency: e.target.value })}><option>USD</option><option>EUR</option><option>GBP</option><option>CAD</option></select></div>
            <div><label className={labelCls}>Contact Email</label><div className="relative"><Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400" /><input className={`${inputCls} pl-9`} value={form.storeEmail} onChange={(e) => setForm({ ...form, storeEmail: e.target.value })} /></div></div>
            <div><label className={labelCls}>Phone</label><div className="relative"><Phone size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400" /><input className={`${inputCls} pl-9`} value={form.storePhone} onChange={(e) => setForm({ ...form, storePhone: e.target.value })} /></div></div>
            <div className="sm:col-span-2"><label className={labelCls}>Address</label><div className="relative"><MapPin size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400" /><input className={`${inputCls} pl-9`} value={form.storeAddress} onChange={(e) => setForm({ ...form, storeAddress: e.target.value })} /></div></div>
          </div>
        </section>

        {/* Shipping */}
        <section className="rounded-xl border border-ink-100 bg-white p-6">
          <h2 className="mb-4 text-lg font-semibold text-ink-900">Shipping Settings</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div><label className={labelCls}>Free Shipping Threshold (INR)</label><input type="number" className={inputCls} value={form.shippingThreshold} onChange={(e) => setForm({ ...form, shippingThreshold: e.target.value })} /></div>
            <div><label className={labelCls}>Tax Rate (%)</label><input type="number" step="0.001" className={inputCls} value={form.taxRate} onChange={(e) => setForm({ ...form, taxRate: e.target.value })} /></div>
            <div className="sm:col-span-2"><label className={labelCls}>Announcement Text</label><input className={inputCls} value={form.freeShippingText} onChange={(e) => setForm({ ...form, freeShippingText: e.target.value })} /></div>
          </div>
        </section>

        {/* Admin */}
        <section className="rounded-xl border border-ink-100 bg-white p-6">
          <h2 className="mb-4 text-lg font-semibold text-ink-900">Admin Account</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div><label className={labelCls}>Admin Email</label><input className={inputCls} value={form.adminEmail} onChange={(e) => setForm({ ...form, adminEmail: e.target.value })} /></div>
          </div>
          <p className="mt-3 text-xs text-ink-400">Admin sign-in is managed through Supabase Auth. To change your password, sign out and use the "Forgot password" flow on the admin login screen, or update it from the Supabase dashboard.</p>
        </section>

        <div className="flex items-center gap-4">
          <Button onClick={handleSave}><Save size={16} /> Save Settings</Button>
          {saved && <span className="text-sm text-green-600">Settings saved successfully!</span>}
        </div>
      </div>
    </div>
  );
}
