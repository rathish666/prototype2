import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import type { Product, Category, Banner } from '@/types';

export function useProducts(options?: {
  category?: string;
  featured?: boolean;
  bestSeller?: boolean;
  limit?: number;
  search?: string;
  newArrivals?: boolean;
  onSale?: boolean;
}) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    let query = supabase
      .from('products')
      .select(`
        *,
        images:product_images(*),
        category:categories(*),
        variants:product_variants(*)
      `);

    if (options?.category) {
      const { data: cat } = await supabase.from('categories').select('id').eq('slug', options.category).maybeSingle();
      if (cat) query = query.eq('category_id', cat.id);
    }
    if (options?.featured) query = query.eq('featured', true);
    if (options?.bestSeller) query = query.eq('best_seller', true);
    if (options?.onSale) query = query.not('discount_price', 'is', null);
    if (options?.newArrivals) query = query.order('created_at', { ascending: false });
    if (options?.search) {
      query = query.or(`name.ilike.%${options.search}%,brand.ilike.%${options.search}%,description.ilike.%${options.search}%`);
    }
    if (options?.limit) query = query.limit(options.limit);

    const { data } = await query.order('created_at', { ascending: false });
    setProducts((data || []) as Product[]);
    setLoading(false);
  }, [options?.category, options?.featured, options?.bestSeller, options?.limit, options?.search, options?.newArrivals, options?.onSale]);

  useEffect(() => { fetchData(); }, [fetchData]);
  return { products, loading, refetch: fetchData };
}

export function useProduct(id: string | undefined) {
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) { setLoading(false); return; }
    (async () => {
      setLoading(true);
      const { data } = await supabase
        .from('products')
        .select(`
          *,
          images:product_images(*),
          category:categories(*),
          variants:product_variants(*)
        `)
        .eq('id', id)
        .maybeSingle();
      setProduct(data as Product | null);
      setLoading(false);
    })();
  }, [id]);
  return { product, loading };
}

export function useCategories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from('categories').select('*').eq('enabled', true).order('name');
      setCategories(data || []);
      setLoading(false);
    })();
  }, []);
  return { categories, loading };
}

export function useBanners() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from('banners').select('*').eq('enabled', true).order('position');
      setBanners(data || []);
      setLoading(false);
    })();
  }, []);
  return { banners, loading };
}
