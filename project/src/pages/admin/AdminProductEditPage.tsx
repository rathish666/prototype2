import { useEffect, useState, type ChangeEvent } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Save, Plus, X } from 'lucide-react';
import { deleteProductImageUrl, normalizeProductImageUrl, resolveProductImageUrl, supabase, uploadProductImage } from '@/lib/supabase';
import { Button, Spinner } from '@/components/ui';
import { ALL_SIZES, COLOR_MAP, type Category, type Product } from '@/types';

type VariantInput = {
  id?: string;
  size: string;
  color: string;
  sku: string;
  stock: string;
  low_stock_threshold: string;
};

export function AdminProductEditPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEdit = !!id && id !== 'new';
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [variantRows, setVariantRows] = useState<VariantInput[]>([]);

  const [form, setForm] = useState({
    name: '', brand: '', description: '', category_id: '', price: '', discount_price: '',
    sku: '', stock: '0', low_stock_threshold: '5', featured: false, best_seller: false,
  });
  const [sizes, setSizes] = useState<string[]>([]);
  const [colors, setColors] = useState<string[]>([]);
  const [images, setImages] = useState<Array<{ existingUrl?: string; file?: File; previewUrl?: string }>>([{}]);
  const [removedImageUrls, setRemovedImageUrls] = useState<string[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
  const MAX_IMAGE_SIZE = 5 * 1024 * 1024;

  const buildVariantRows = (nextSizes: string[], nextColors: string[], existingRows: VariantInput[] = []) => {
    const normalizedSizes = nextSizes.length ? nextSizes : ['One Size'];
    const normalizedColors = nextColors.length ? nextColors : ['Default'];
    const rows: VariantInput[] = [];

    for (const size of normalizedSizes) {
      for (const color of normalizedColors) {
        const match = existingRows.find((row) => row.size === size && row.color === color);
        rows.push(
          match ?? {
            size,
            color,
            sku: '',
            stock: form.stock || '0',
            low_stock_threshold: form.low_stock_threshold || '5',
          }
        );
      }
    }

    return rows;
  };

  const toggleArray = (arr: string[], val: string, setter: (v: string[]) => void) => {
    setter(arr.includes(val) ? arr.filter((v) => v !== val) : [...arr, val]);
  };

  const setVariantValue = (index: number, key: keyof VariantInput, value: string) => {
    setVariantRows((prev) => prev.map((row, idx) => (idx === index ? { ...row, [key]: value } : row)));
  };

  const getVariantPayload = (productId: string) => variantRows.map((variant) => ({
    product_id: productId,
    size: variant.size,
    color: variant.color,
    sku: variant.sku.trim() || null,
    stock: Number(variant.stock),
    low_stock_threshold: Number(variant.low_stock_threshold),
  }));

  const handleImageFileChange = (index: number, event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
      setErrors((prev) => ({ ...prev, images: 'Please upload JPG, PNG, or WEBP image files only.' }));
      return;
    }
    if (file.size > MAX_IMAGE_SIZE) {
      setErrors((prev) => ({ ...prev, images: 'Each image must be 5MB or smaller.' }));
      return;
    }
    const previewUrl = URL.createObjectURL(file);
    setImages((current) => current.map((img, idx) => (idx === index ? { file, previewUrl } : img)));
    setErrors((prev) => {
      const next = { ...prev };
      delete next.images;
      return next;
    });
  };

  const addImageField = () => {
    setImages((current) => [...current, {}]);
  };

  const removeImageField = (index: number) => {
    setImages((current) => {
      const imageToRemove = current[index];
      if (imageToRemove?.existingUrl) {
        setRemovedImageUrls((prev) => [...prev, imageToRemove.existingUrl!]);
      }
      const next = current.filter((_, idx) => idx !== index);
      return next.length ? next : [{}];
    });
  };

  useEffect(() => {
    setVariantRows((current) => buildVariantRows(sizes, colors, current));
  }, [sizes, colors]);

  useEffect(() => {
    (async () => {
      const { data: cats } = await supabase.from('categories').select('*').order('name');
      setCategories((cats || []) as Category[]);

      if (isEdit && id) {
        const { data: prod } = await supabase.from('products').select('*, images:product_images(*), variants:product_variants(*)').eq('id', id).maybeSingle();
        if (prod) {
          const p = prod as Product;
          setForm({
            name: p.name,
            brand: p.brand,
            description: p.description || '',
            category_id: p.category_id || '',
            price: String(p.price),
            discount_price: p.discount_price ? String(p.discount_price) : '',
            sku: p.sku || '',
            stock: String(p.stock ?? 0),
            low_stock_threshold: String(p.low_stock_threshold ?? 5),
            featured: p.featured,
            best_seller: p.best_seller,
          });
          setSizes(p.sizes);
          setColors(p.colors);
          setVariantRows((p.variants || []).map((variant) => ({
            id: variant.id,
            size: variant.size,
            color: variant.color,
            sku: variant.sku || '',
            stock: String(variant.stock),
            low_stock_threshold: String(variant.low_stock_threshold),
          })));
          setImages(p.images?.map((img) => ({ existingUrl: normalizeProductImageUrl(img.url), previewUrl: normalizeProductImageUrl(img.url) })) || [{}]);
        }
      }

      setLoading(false);
    })();
  }, [id, isEdit]);

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = 'Name is required';
    if (!form.brand.trim()) e.brand = 'Brand is required';
    if (!form.price || Number(form.price) <= 0) e.price = 'Valid price required';

    if (variantRows.length === 0) {
      if (!form.stock || Number(form.stock) < 0) e.stock = 'Valid stock required';
    } else {
      variantRows.forEach((variant, index) => {
        if (!variant.stock || Number(variant.stock) < 0) e[`variant_stock_${index}`] = 'Stock is required';
        if (!variant.low_stock_threshold || Number(variant.low_stock_threshold) < 0) e[`variant_threshold_${index}`] = 'Threshold is required';
      });
    }

    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const validateImages = () => {
    const invalid = images.find((img) => img.file && !ACCEPTED_IMAGE_TYPES.includes(img.file.type));
    if (invalid) {
      setErrors((prev) => ({ ...prev, images: 'Please upload JPG, PNG, or WEBP image files only.' }));
      return false;
    }
    const oversized = images.find((img) => img.file && img.file.size > MAX_IMAGE_SIZE);
    if (oversized) {
      setErrors((prev) => ({ ...prev, images: 'Each image must be 5MB or smaller.' }));
      return false;
    }
    setErrors((prev) => {
      const next = { ...prev };
      delete next.images;
      return next;
    });
    return true;
  };

  const getImagePreviewSrc = (image: { existingUrl?: string; previewUrl?: string }) => {
    return image.previewUrl || resolveProductImageUrl(image.existingUrl);
  };

  const handleSave = async () => {
    if (!validate() || !validateImages()) return;
    setSaving(true);

    const aggregatedStock = variantRows.length > 0 ? variantRows.reduce((sum, row) => sum + Number(row.stock), 0) : Number(form.stock || 0);
    const aggregatedThreshold = variantRows.length > 0 ? Math.min(...variantRows.map((row) => Number(row.low_stock_threshold || 0))) : Number(form.low_stock_threshold || 0);
    const status = aggregatedStock === 0 ? 'Out of Stock' : aggregatedStock <= aggregatedThreshold ? 'Low Stock' : 'In Stock';

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
      stock: aggregatedStock,
      low_stock_threshold: aggregatedThreshold,
      status,
      featured: form.featured,
      best_seller: form.best_seller,
    };

    const uploadImage = async (img: { existingUrl?: string; file?: File; previewUrl?: string }) => {
      if (img.file) return uploadProductImage(img.file);
      return img.existingUrl ? normalizeProductImageUrl(img.existingUrl) : null;
    };

    const validImages: string[] = [];
    try {
      for (const image of images) {
        const imageUrl = await uploadImage(image);
        if (!imageUrl) continue;
        if (!/^https?:\/\//i.test(imageUrl)) {
          throw new Error('Uploaded image did not return a valid public URL.');
        }
        validImages.push(imageUrl);
      }
    } catch (uploadError) {
      setErrors((prev) => ({ ...prev, images: uploadError instanceof Error ? uploadError.message : 'Image upload failed.' }));
      setSaving(false);
      return;
    }

    try {
      if (isEdit && id) {
        await Promise.all(
          removedImageUrls.map(async (url) => {
            const result = await deleteProductImageUrl(url);
            if (result.error) {
              console.warn('Could not remove old product image from storage:', result.error.message);
            }
          })
        );

        const { error: updateError } = await supabase.from('products').update(payload).eq('id', id);
        if (updateError) throw updateError;

        const { error: deleteImagesError } = await supabase.from('product_images').delete().eq('product_id', id);
        if (deleteImagesError) throw deleteImagesError;

        if (validImages.length > 0) {
          const { error: insertImagesError } = await supabase.from('product_images').insert(validImages.map((url, index) => ({ product_id: id, url, position: index })));
          if (insertImagesError) throw insertImagesError;
        }

        if (variantRows.length > 0) {
          const existing = variantRows.filter((variant) => variant.id).map((variant) => ({
            id: variant.id,
            product_id: id,
            size: variant.size,
            color: variant.color,
            sku: variant.sku.trim() || null,
            stock: Number(variant.stock),
            low_stock_threshold: Number(variant.low_stock_threshold),
          }));
          const fresh = variantRows.filter((variant) => !variant.id).map((variant) => ({
            product_id: id,
            size: variant.size,
            color: variant.color,
            sku: variant.sku.trim() || null,
            stock: Number(variant.stock),
            low_stock_threshold: Number(variant.low_stock_threshold),
          }));

          if (existing.length > 0) {
            const { error: updateVariantError } = await supabase.from('product_variants').upsert(existing, { onConflict: 'id' });
            if (updateVariantError) throw updateVariantError;
          }
          if (fresh.length > 0) {
            const { error: insertVariantError } = await supabase.from('product_variants').insert(fresh);
            if (insertVariantError) throw insertVariantError;
          }
        }
      } else {
        const { data: newProd, error: insertError } = await supabase.from('products').insert(payload).select('id').single();
        if (insertError || !newProd?.id) throw insertError ?? new Error('Could not create product');

        if (validImages.length > 0) {
          const { error: insertImagesError } = await supabase.from('product_images').insert(validImages.map((url, index) => ({ product_id: newProd.id, url, position: index })));
          if (insertImagesError) throw insertImagesError;
        }

        if (variantRows.length > 0) {
          const { error: insertVariantError } = await supabase.from('product_variants').insert(getVariantPayload(newProd.id));
          if (insertVariantError) throw insertVariantError;
        }
      }

      navigate('/admin/products');
    } catch (saveError) {
      setErrors((prev) => ({ ...prev, save: saveError instanceof Error ? saveError.message : 'Failed to save product.' }));
    } finally {
      setSaving(false);
    }
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
        <section className="rounded-xl border border-ink-100 bg-white p-4 sm:p-6">
          <h2 className="mb-4 text-lg font-semibold text-ink-900">Basic Information</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div><label className={labelCls}>Product Name *</label><input className={`${inputCls} ${errors.name ? errCls : ''}`} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />{errors.name && <p className="mt-1 text-xs text-red-500">{errors.name}</p>}</div>
            <div><label className={labelCls}>Brand *</label><input className={`${inputCls} ${errors.brand ? errCls : ''}`} value={form.brand} onChange={(e) => setForm({ ...form, brand: e.target.value })} />{errors.brand && <p className="mt-1 text-xs text-red-500">{errors.brand}</p>}</div>
            <div className="sm:col-span-2"><label className={labelCls}>Description</label><textarea rows={4} className={inputCls} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
            <div><label className={labelCls}>Category</label><select className={inputCls} value={form.category_id} onChange={(e) => setForm({ ...form, category_id: e.target.value })}><option value="">None</option>{categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
            <div><label className={labelCls}>SKU</label><input className={inputCls} value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} /></div>
          </div>
        </section>

        <section className="rounded-xl border border-ink-100 bg-white p-4 sm:p-6">
          <h2 className="mb-4 text-lg font-semibold text-ink-900">Pricing & Inventory</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div><label className={labelCls}>Price (INR) *</label><input type="number" step="0.01" className={`${inputCls} ${errors.price ? errCls : ''}`} value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} />{errors.price && <p className="mt-1 text-xs text-red-500">{errors.price}</p>}</div>
            <div><label className={labelCls}>Discount Price (INR)</label><input type="number" step="0.01" className={inputCls} value={form.discount_price} onChange={(e) => setForm({ ...form, discount_price: e.target.value })} /></div>
            {variantRows.length === 0 && (
              <>
                <div><label className={labelCls}>Stock *</label><input type="number" className={`${inputCls} ${errors.stock ? errCls : ''}`} value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} />{errors.stock && <p className="mt-1 text-xs text-red-500">{errors.stock}</p>}</div>
                <div><label className={labelCls}>Low Stock Threshold</label><input type="number" className={inputCls} value={form.low_stock_threshold} onChange={(e) => setForm({ ...form, low_stock_threshold: e.target.value })} /></div>
              </>
            )}
          </div>
        </section>

        <section className="rounded-xl border border-ink-100 bg-white p-4 sm:p-6">
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

        {variantRows.length > 0 && (
          <section className="rounded-xl border border-ink-100 bg-white p-4 sm:p-6">
            <h2 className="mb-4 text-lg font-semibold text-ink-900">Variant Inventory</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-ink-200 text-sm">
                <thead>
                  <tr className="bg-ink-50 text-left text-ink-700">
                    <th className="px-3 py-2 font-semibold">Size</th>
                    <th className="px-3 py-2 font-semibold">Color</th>
                    <th className="px-3 py-2 font-semibold">SKU</th>
                    <th className="px-3 py-2 font-semibold">Stock</th>
                    <th className="px-3 py-2 font-semibold">Low Stock</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-ink-200">
                  {variantRows.map((variant, index) => (
                    <tr key={`${variant.size}-${variant.color}-${index}`}>
                      <td className="px-3 py-2 text-ink-800">{variant.size}</td>
                      <td className="px-3 py-2 text-ink-800">{variant.color}</td>
                      <td className="px-3 py-2"><input className={inputCls} value={variant.sku} onChange={(e) => setVariantValue(index, 'sku', e.target.value)} /></td>
                      <td className="px-3 py-2"><input type="number" min="0" className={`${inputCls} ${errors[`variant_stock_${index}`] ? errCls : ''}`} value={variant.stock} onChange={(e) => setVariantValue(index, 'stock', e.target.value)} /></td>
                      <td className="px-3 py-2"><input type="number" min="0" className={`${inputCls} ${errors[`variant_threshold_${index}`] ? errCls : ''}`} value={variant.low_stock_threshold} onChange={(e) => setVariantValue(index, 'low_stock_threshold', e.target.value)} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        <section className="rounded-xl border border-ink-100 bg-white p-4 sm:p-6">
          <h2 className="mb-4 text-lg font-semibold text-ink-900">Product Images</h2>
          <div className="space-y-3">
            {images.map((image, i) => (
              <div key={i} className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <div className="h-16 w-14 shrink-0 overflow-hidden rounded-lg bg-ink-50">
                  {(image.previewUrl || image.existingUrl) ? <img src={getImagePreviewSrc(image)} alt="Product" className="h-full w-full object-cover" /> : <div className="h-full w-full bg-ink-100" />}
                </div>
                <div className="flex-1 space-y-2">
                  <input type="file" accept="image/jpeg,image/png,image/webp" onChange={(e) => handleImageFileChange(i, e)} className={inputCls} />
                  {errors.images && <p className="text-xs text-red-500">{errors.images}</p>}
                </div>
                {images.length > 1 && <button type="button" onClick={() => removeImageField(i)} className="text-error-500"><X size={18} /></button>}
              </div>
            ))}
            <Button variant="outline" size="sm" onClick={addImageField}><Plus size={14} /> Add Image</Button>
          </div>
        </section>

        <section className="rounded-xl border border-ink-100 bg-white p-6">
          <h2 className="mb-4 text-lg font-semibold text-ink-900">Product Flags</h2>
          <div className="flex gap-6">
            <label className="flex items-center gap-2 text-sm text-ink-700"><input type="checkbox" checked={form.featured} onChange={(e) => setForm({ ...form, featured: e.target.checked })} className="h-4 w-4 rounded border-ink-300" /> Featured Product</label>
            <label className="flex items-center gap-2 text-sm text-ink-700"><input type="checkbox" checked={form.best_seller} onChange={(e) => setForm({ ...form, best_seller: e.target.checked })} className="h-4 w-4 rounded border-ink-300" /> Best Seller</label>
          </div>
        </section>

        {errors.save && <p className="text-sm text-red-500">{errors.save}</p>}

        <div className="flex gap-3">
          <Button size="lg" onClick={handleSave} disabled={saving}>{saving ? 'Saving...' : <><Save size={18} /> {isEdit ? 'Update Product' : 'Create Product'}</>}</Button>
          <Link to="/admin/products"><Button size="lg" variant="outline">Cancel</Button></Link>
        </div>
      </div>
    </div>
  );
}
