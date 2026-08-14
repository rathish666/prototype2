import { useEffect, useState } from 'react';
import { Plus, Trash2, X, Image as ImageIcon, Megaphone } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { Button, Badge, Spinner, EmptyState } from '@/components/ui';
import type { Banner, Announcement } from '@/types';

export function AdminContentPage() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [showBannerForm, setShowBannerForm] = useState(false);
  const [showAnnForm, setShowAnnForm] = useState(false);
  const [bannerForm, setBannerForm] = useState({ title: '', subtitle: '', image: '', cta_text: '', cta_link: '', enabled: true });
  const [annForm, setAnnForm] = useState({ message: '', enabled: true });
  const [saving, setSaving] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    const [{ data: b }, { data: a }] = await Promise.all([
      supabase.from('banners').select('*').order('position'),
      supabase.from('announcements').select('*').order('created_at', { ascending: false }),
    ]);
    setBanners((b || []) as Banner[]);
    setAnnouncements((a || []) as Announcement[]);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const saveBanner = async () => {
    if (!bannerForm.title.trim()) return;
    setSaving(true);
    await supabase.from('banners').insert({ ...bannerForm, image: bannerForm.image || null, cta_text: bannerForm.cta_text || null, cta_link: bannerForm.cta_link || null, position: banners.length });
    setSaving(false);
    setShowBannerForm(false);
    setBannerForm({ title: '', subtitle: '', image: '', cta_text: '', cta_link: '', enabled: true });
    fetchData();
  };

  const deleteBanner = async (id: string) => { await supabase.from('banners').delete().eq('id', id); fetchData(); };
  const toggleBanner = async (b: Banner) => { await supabase.from('banners').update({ enabled: !b.enabled }).eq('id', b.id); fetchData(); };

  const saveAnn = async () => {
    if (!annForm.message.trim()) return;
    setSaving(true);
    await supabase.from('announcements').insert({ message: annForm.message, enabled: annForm.enabled });
    setSaving(false);
    setShowAnnForm(false);
    setAnnForm({ message: '', enabled: true });
    fetchData();
  };

  const deleteAnn = async (id: string) => { await supabase.from('announcements').delete().eq('id', id); fetchData(); };
  const toggleAnn = async (a: Announcement) => { await supabase.from('announcements').update({ enabled: !a.enabled }).eq('id', a.id); fetchData(); };

  if (loading) return <div className="flex justify-center py-20"><Spinner /></div>;

  return (
    <div>
      <h1 className="mb-6 font-display text-2xl font-bold text-ink-900">Website Content</h1>

      {/* Banners */}
      <section className="mb-8">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-ink-900">Homepage Banners</h2>
          <Button size="sm" onClick={() => setShowBannerForm(true)}><Plus size={16} /> Add Banner</Button>
        </div>
        {banners.length === 0 ? <EmptyState icon={<ImageIcon size={40} />} title="No banners yet" /> : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {banners.map((b) => (
              <div key={b.id} className="overflow-hidden rounded-xl border border-ink-100 bg-white">
                {b.image && <div className="aspect-video bg-ink-50"><img src={b.image} alt="" className="h-full w-full object-cover" /></div>}
                <div className="p-4">
                  <div className="flex items-start justify-between"><h3 className="font-semibold text-ink-900">{b.title}</h3><button onClick={() => toggleBanner(b)}>{b.enabled ? <Badge variant="success">Active</Badge> : <Badge variant="error">Inactive</Badge>}</button></div>
                  <p className="mt-1 text-xs text-ink-500">{b.subtitle}</p>
                  <div className="mt-3 flex gap-2"><Button size="sm" variant="ghost" className="text-error-500" onClick={() => deleteBanner(b.id)}><Trash2 size={14} /> Delete</Button></div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Announcements */}
      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-ink-900">Announcement Bar</h2>
          <Button size="sm" onClick={() => setShowAnnForm(true)}><Plus size={16} /> Add Announcement</Button>
        </div>
        {announcements.length === 0 ? <EmptyState icon={<Megaphone size={40} />} title="No announcements yet" /> : (
          <div className="space-y-3">
            {announcements.map((a) => (
              <div key={a.id} className="flex items-center justify-between rounded-xl border border-ink-100 bg-white p-4">
                <div className="flex items-center gap-3"><Megaphone size={18} className="text-ink-400" /><p className="text-sm text-ink-900">{a.message}</p></div>
                <div className="flex items-center gap-3">
                  <button onClick={() => toggleAnn(a)}>{a.enabled ? <Badge variant="success">Active</Badge> : <Badge variant="error">Inactive</Badge>}</button>
                  <button onClick={() => deleteAnn(a.id)} className="text-error-500 hover:text-error-600"><Trash2 size={16} /></button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Banner form modal */}
      {showBannerForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowBannerForm(false)} />
          <div className="relative max-h-[85vh] w-full max-w-md overflow-y-auto rounded-xl bg-white p-6 animate-scale-in">
            <div className="mb-4 flex items-center justify-between"><h2 className="text-lg font-semibold text-ink-900">Add Banner</h2><button onClick={() => setShowBannerForm(false)}><X size={20} className="text-ink-400" /></button></div>
            <div className="space-y-3">
              <div><label className="mb-1 block text-sm font-medium text-ink-700">Title *</label><input className="w-full rounded-lg border border-ink-200 px-4 py-2.5 text-sm" value={bannerForm.title} onChange={(e) => setBannerForm({ ...bannerForm, title: e.target.value })} /></div>
              <div><label className="mb-1 block text-sm font-medium text-ink-700">Subtitle</label><input className="w-full rounded-lg border border-ink-200 px-4 py-2.5 text-sm" value={bannerForm.subtitle} onChange={(e) => setBannerForm({ ...bannerForm, subtitle: e.target.value })} /></div>
              <div><label className="mb-1 block text-sm font-medium text-ink-700">Image URL</label><input className="w-full rounded-lg border border-ink-200 px-4 py-2.5 text-sm" placeholder="https://..." value={bannerForm.image} onChange={(e) => setBannerForm({ ...bannerForm, image: e.target.value })} /></div>
              <div><label className="mb-1 block text-sm font-medium text-ink-700">CTA Text</label><input className="w-full rounded-lg border border-ink-200 px-4 py-2.5 text-sm" placeholder="Shop Now" value={bannerForm.cta_text} onChange={(e) => setBannerForm({ ...bannerForm, cta_text: e.target.value })} /></div>
              <div><label className="mb-1 block text-sm font-medium text-ink-700">CTA Link</label><input className="w-full rounded-lg border border-ink-200 px-4 py-2.5 text-sm" placeholder="/shop" value={bannerForm.cta_link} onChange={(e) => setBannerForm({ ...bannerForm, cta_link: e.target.value })} /></div>
              <label className="flex items-center gap-2 text-sm text-ink-700"><input type="checkbox" checked={bannerForm.enabled} onChange={(e) => setBannerForm({ ...bannerForm, enabled: e.target.checked })} className="h-4 w-4 rounded border-ink-300" /> Enabled</label>
            </div>
            <div className="mt-6 flex gap-3"><Button variant="outline" className="flex-1" onClick={() => setShowBannerForm(false)}>Cancel</Button><Button className="flex-1" disabled={saving} onClick={saveBanner}>{saving ? 'Saving...' : 'Save Banner'}</Button></div>
          </div>
        </div>
      )}

      {/* Announcement form modal */}
      {showAnnForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowAnnForm(false)} />
          <div className="relative w-full max-w-md rounded-xl bg-white p-6 animate-scale-in">
            <div className="mb-4 flex items-center justify-between"><h2 className="text-lg font-semibold text-ink-900">Add Announcement</h2><button onClick={() => setShowAnnForm(false)}><X size={20} className="text-ink-400" /></button></div>
            <div className="space-y-3">
              <div><label className="mb-1 block text-sm font-medium text-ink-700">Message *</label><input className="w-full rounded-lg border border-ink-200 px-4 py-2.5 text-sm" placeholder="Free shipping on orders over INR 75!" value={annForm.message} onChange={(e) => setAnnForm({ ...annForm, message: e.target.value })} /></div>
              <label className="flex items-center gap-2 text-sm text-ink-700"><input type="checkbox" checked={annForm.enabled} onChange={(e) => setAnnForm({ ...annForm, enabled: e.target.checked })} className="h-4 w-4 rounded border-ink-300" /> Enabled</label>
            </div>
            <div className="mt-6 flex gap-3"><Button variant="outline" className="flex-1" onClick={() => setShowAnnForm(false)}>Cancel</Button><Button className="flex-1" disabled={saving} onClick={saveAnn}>{saving ? 'Saving...' : 'Save'}</Button></div>
          </div>
        </div>
      )}
    </div>
  );
}
