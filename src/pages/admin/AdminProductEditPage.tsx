import { useEffect, useState, type ChangeEvent } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Save, Plus, X } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { Button, Spinner } from '@/components/ui';
import { ALL_SIZES, COLOR_MAP, type Category, type Product } from '@/types';

export function AdminProductEditPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEdit = id && id !== 'new';
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);

  const [form, setForm] = useState({
    name: '', brand: '', description: '', category_id: '', price: '', discount_price: '',
    sku: '', stock: '', low_stock_threshold: '5', featured: false, best_seller: false,
  });
  const [sizes, setSizes] = useState<string[]>([]);
  const [colors, setColors] = useState<string[]>([]);
  const [images, setImages] = useState<Array<{ url: string; file?: File; previewUrl?: string }>>([{ url: '' }]);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleImageFileChange = (index: number, event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const previewUrl = URL.createObjectURL(file);
    setImages((current) => current.map((img, idx) => idx === index ? { ...img, file, previewUrl, url: '' } : img));
  };

  const updateImageUrl = (index: number, url: string) => {
    setImages((current) => current.map((img, idx) => idx === index ? { ...img, url, previewUrl: undefined, file: undefined } : img));
  };

  const addImageField = () => {
    setImages((current) => [...current, { url: '' }]);
  };

  const removeImageField = (index: number) => {
    setImages((current) => {
      const next = current.filter((_, idx) => idx !== index);
      return next.length ? next : [{ url: '' }];
    });
  };

  useEffect(() => {
    (async () => {
      const { data: cats } = await supabase.from('categories').select('*').order('name');
      setCategories((cats || []) as Category[]);
      if (isEdit && id) {
        const { data: prod } = await supabase.from('products').select('*, images:product_images(*)').eq('id', id).maybeSingle();
        if (prod) {
          const p = prod as Product;
          setForm({
            name: p.name, brand: p.brand, description: p.description || '', category_id: p.category_id || '',
            price: String(p.price), discount_price: p.discount_price ? String(p.discount_price) : '',
            sku: p.sku || '', stock: String(p.stock), low_stock_threshold: String(p.low_stock_threshold),
            featured: p.featured, best_seller: p.best_seller,
          });
          setSizes(p.sizes);
          setColors(p.colors);
          setImages(p.images?.map((img) => ({ url: img.url })) || [{ url: '' }]);
        }
      }
      setLoading(false);
    })();
  }, [id, isEdit]);

  const toggleArray = (arr: string[], val: string, setter: (v: string[]) => void) => {
    setter(arr.includes(val) ? arr.filter((v) => v !== val) : [...arr, val]);
  };

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = 'Name is required';
    if (!form.brand.trim()) e.brand = 'Brand is required';
    if (!form.price || Number(form.price) <= 0) e.price = 'Valid price required';
    if (!form.stock || Number(form.stock) < 0) e.stock = 'Valid stock required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setSaving(true);
    const status = Number(form.stock) === 0 ? 'Out of Stock' : Number(form.stock) <= Number(form.low_stock_threshold) ? 'Low Stock' : 'In Stock';
    const payload = {
      name: form.name,
      brand: form.brand,
      description: form.description || null,
      category_id: form.category_id || null,
      price: Number(form.price),
      discount_price: form.discount_price ? Number(form.discount_price) : null,
      sku: form.sku || null,
      sizes,
      colors,
      stock: Number(form.stock),
      low_stock_threshold: Number(form.low_stock_threshold),
      status,
      featured: form.featured,
      best_seller: form.best_seller,
    };

    const getPublicImageUrl = async (bucket: string, path: string) => {
      const { data: publicData, error: publicUrlError } = await supabase.storage.from(bucket).getPublicUrl(path);
      if (!publicUrlError && publicData?.publicUrl) {
        return publicData.publicUrl;
      }

      const { data: signedData, error: signedUrlError } = await supabase.storage.from(bucket).createSignedUrl(path, 60 * 60 * 24);
      if (!signedUrlError && signedData?.signedUrl) {
        return signedUrlError ? null : signedData.signedUrl;
      }

      console.error('Image public URL retrieval failed', publicUrlError || signedUrlError);
      return null;
    };

    const uploadImage = async (img: { url: string; file?: File; previewUrl?: string }) => {
      if (img.file) {
        const safeName = img.file.name.replace(/[^a-zA-Z0-9_.-]/g, '_');
        const path = `products/${crypto.randomUUID()}-${safeName}`;
        const bucket = 'product-images';
        const { error: uploadError } = await supabase.storage.from(bucket).upload(path, img.file, {
          cacheControl: '3600',
          upsert: true,
          contentType: img.file.type,
        });
        if (uploadError) {
          console.error('Image upload failed', uploadError);
          return null;
        }
        return getPublicImageUrl(bucket, path);
      }
      return img.url.trim() || null;
    };

    const validImages: string[] = [];
    for (const image of images) {
      const imageUrl = await uploadImage(image);
      if (imageUrl) validImages.push(imageUrl);
    }

    if (isEdit && id) {
      await supabase.from('products').update(payload).eq('id', id);
      await supabase.from('product_images').delete().eq('product_id', id);
      if (validImages.length > 0) {
        await supabase.from('product_images').insert(validImages.map((url, i) => ({ product_id: id, url, position: i })));
      }
    } else {
      const { data: newProd } = await supabase.from('products').insert(payload).select().maybeSingle();
      if (newProd && validImages.length > 0) {
        await supabase.from('product_images').insert(validImages.map((url, i) => ({ product_id: newProd.id, url, position: i })));
      }
    }

    setSaving(false);
    navigate('/admin/products');
  };

  if (loading) return <div className="flex justify-center py-20"><Spinner /></div>;

  const inputCls = 'w-full rounded-lg border border-ink-200 px-4 py-2.5 text-sm outline-none focus:border-ink-900';
  const labelCls = 'mb-1 block text-sm font-medium text-ink-700';
  const errCls = 'border-red-500';

  return (
    <div>
      <Link to="/admin/products" className="mb-4 inline-flex items-center gap-2 text-sm text-ink-500 hover:text-ink-900"><ArrowLeft size={16} /> Back to Products</Link>
      <h1 className="mb-6 font-display text-2xl font-bold text-ink-900">{isEdit ? 'Edit Product' : 'Add New Product'}</h1>

      <div className="max-w-3xl space-y-6">
        {/* Basic info */}
        <section className="rounded-xl border border-ink-100 bg-white p-6">
          <h2 className="mb-4 text-lg font-semibold text-ink-900">Basic Information</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div><label className={labelCls}>Product Name *</label><input className={`${inputCls} ${errors.name ? errCls : ''}`} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />{errors.name && <p className="mt-1 text-xs text-red-500">{errors.name}</p>}</div>
            <div><label className={labelCls}>Brand *</label><input className={`${inputCls} ${errors.brand ? errCls : ''}`} value={form.brand} onChange={(e) => setForm({ ...form, brand: e.target.value })} />{errors.brand && <p className="mt-1 text-xs text-red-500">{errors.brand}</p>}</div>
            <div className="sm:col-span-2"><label className={labelCls}>Description</label><textarea rows={4} className={inputCls} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
            <div><label className={labelCls}>Category</label><select className={inputCls} value={form.category_id} onChange={(e) => setForm({ ...form, category_id: e.target.value })}><option value="">None</option>{categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
            <div><label className={labelCls}>SKU</label><input className={inputCls} value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} /></div>
          </div>
        </section>

        {/* Pricing & stock */}
        <section className="rounded-xl border border-ink-100 bg-white p-6">
          <h2 className="mb-4 text-lg font-semibold text-ink-900">Pricing & Inventory</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div><label className={labelCls}>Price (INR) *</label><input type="number" step="0.01" className={`${inputCls} ${errors.price ? errCls : ''}`} value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} />{errors.price && <p className="mt-1 text-xs text-red-500">{errors.price}</p>}</div>
            <div><label className={labelCls}>Discount Price (INR)</label><input type="number" step="0.01" className={inputCls} value={form.discount_price} onChange={(e) => setForm({ ...form, discount_price: e.target.value })} /></div>
            <div><label className={labelCls}>Stock *</label><input type="number" className={`${inputCls} ${errors.stock ? errCls : ''}`} value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} />{errors.stock && <p className="mt-1 text-xs text-red-500">{errors.stock}</p>}</div>
            <div><label className={labelCls}>Low Stock Threshold</label><input type="number" className={inputCls} value={form.low_stock_threshold} onChange={(e) => setForm({ ...form, low_stock_threshold: e.target.value })} /></div>
          </div>
        </section>

        {/* Variants */}
        <section className="rounded-xl border border-ink-100 bg-white p-6">
          <h2 className="mb-4 text-lg font-semibold text-ink-900">Variants</h2>
          <div className="mb-4">
            <label className={labelCls}>Sizes</label>
            <div className="flex flex-wrap gap-2">
              {ALL_SIZES.map((s) => (
                <button key={s} type="button" onClick={() => toggleArray(sizes, s, setSizes)} className={`rounded-lg border px-3 py-1.5 text-xs font-medium ${sizes.includes(s) ? 'border-ink-900 bg-ink-900 text-white' : 'border-ink-200 text-ink-700 hover:border-ink-400'}`}>{s}</button>
              ))}
            </div>
          </div>
          <div>
            <label className={labelCls}>Colors</label>
            <div className="flex flex-wrap gap-2">
              {Object.keys(COLOR_MAP).slice(0, 20).map((c) => (
                <button key={c} type="button" onClick={() => toggleArray(colors, c, setColors)} className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium ${colors.includes(c) ? 'border-ink-900 bg-ink-50' : 'border-ink-200 text-ink-700 hover:border-ink-400'}`}>
                  <span className="h-3 w-3 rounded-full border border-ink-200" style={{ backgroundColor: COLOR_MAP[c] }} />{c}
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* Images */}
        <section className="rounded-xl border border-ink-100 bg-white p-6">
          <h2 className="mb-4 text-lg font-semibold text-ink-900">Product Images</h2>
          <div className="space-y-3">
            {images.map((image, i) => (
              <div key={i} className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <div className="h-16 w-14 shrink-0 overflow-hidden rounded-lg bg-ink-50">
                  {(image.previewUrl || image.url) ? <img src={image.previewUrl || image.url} alt="Product" className="h-full w-full object-cover" /> : <div className="h-full w-full bg-ink-100" />}
                </div>
                <div className="flex-1 space-y-2">
                  <input type="file" accept="image/*" onChange={(e) => handleImageFileChange(i, e)} className={inputCls} />
                  <input className={inputCls} placeholder="Image URL (jpg, png)..." value={image.url} onChange={(e) => updateImageUrl(i, e.target.value)} />
                </div>
                {images.length > 1 && <button type="button" onClick={() => removeImageField(i)} className="text-error-500"><X size={18} /></button>}
              </div>
            ))}
            <Button variant="outline" size="sm" onClick={addImageField}><Plus size={14} /> Add Image</Button>
          </div>
        </section>

        {/* Flags */}
        <section className="rounded-xl border border-ink-100 bg-white p-6">
          <h2 className="mb-4 text-lg font-semibold text-ink-900">Product Flags</h2>
          <div className="flex gap-6">
            <label className="flex items-center gap-2 text-sm text-ink-700"><input type="checkbox" checked={form.featured} onChange={(e) => setForm({ ...form, featured: e.target.checked })} className="h-4 w-4 rounded border-ink-300" /> Featured Product</label>
            <label className="flex items-center gap-2 text-sm text-ink-700"><input type="checkbox" checked={form.best_seller} onChange={(e) => setForm({ ...form, best_seller: e.target.checked })} className="h-4 w-4 rounded border-ink-300" /> Best Seller</label>
          </div>
        </section>

        <div className="flex gap-3">
          <Button size="lg" onClick={handleSave} disabled={saving}>{saving ? 'Saving...' : <><Save size={18} /> {isEdit ? 'Update Product' : 'Create Product'}</>}</Button>
          <Link to="/admin/products"><Button size="lg" variant="outline">Cancel</Button></Link>
        </div>
      </div>
    </div>
  );
}
