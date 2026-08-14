import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Truck, ShieldCheck, RotateCcw, Headphones, Star, Quote } from 'lucide-react';
import { ProductCard } from '@/components/ProductCard';
import { SectionTitle, Button, Spinner, ProductCardSkeleton } from '@/components/ui';
import { useProducts, useCategories, useBanners } from '@/lib/hooks';
import { supabase } from '@/lib/supabase';
import type { Review, Category, Banner } from '@/types';

export function HomePage() {
  const { products: featured, loading: featLoading } = useProducts({ featured: true, limit: 8 });
  const { products: bestSellers, loading: bsLoading } = useProducts({ bestSeller: true, limit: 4 });
  const { products: newArrivals, loading: naLoading } = useProducts({ newArrivals: true, limit: 4 });
  const { products: trending, loading: trLoading } = useProducts({ limit: 8 });
  const { categories } = useCategories();
  const { banners } = useBanners();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [currentBanner, setCurrentBanner] = useState(0);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from('reviews')
        .select('*, product:products(name, images:product_images(url, position))')
        .eq('status', 'approved')
        .order('created_at', { ascending: false })
        .limit(6);
      setReviews((data || []) as Review[]);
    })();
  }, []);

  useEffect(() => {
    if (banners.length <= 1) return;
    const timer = setInterval(() => setCurrentBanner((p) => (p + 1) % banners.length), 6000);
    return () => clearInterval(timer);
  }, [banners.length]);

  const heroBanner = banners[0] || {
    title: 'Autumn Collection 2026',
    subtitle: 'Refined essentials for the modern gentleman.',
    image: 'https://images.pexels.com/photos/10482937/pexels-photo-10482937.jpeg?auto=compress&cs=tinysrgb&h=1200&w=1600',
    cta_text: 'Shop the Collection',
    cta_link: '/shop',
  } as Banner;

  return (
    <div>
      {/* Hero */}
      <section className="relative h-[58vh] min-h-[420px] w-full overflow-hidden bg-ink-900 sm:h-[70vh] sm:min-h-[500px]">
        <div className="absolute inset-0">
          <img src={heroBanner.image || ''} alt={heroBanner.title} className="h-full w-full object-cover object-center" />
          <div className="absolute inset-0 bg-gradient-to-r from-ink-950/80 via-ink-950/40 to-transparent" />
        </div>
        <div className="relative mx-auto flex h-full max-w-7xl flex-col justify-center px-4 sm:px-6">
          <div className="max-w-xl animate-fade-in-up">
            <p className="mb-2 text-[10px] font-medium uppercase tracking-[0.25em] text-accent-400 sm:mb-3 sm:text-sm">New Season</p>
            <h1 className="font-display text-3xl font-bold leading-tight text-white sm:text-5xl lg:text-6xl">
              {heroBanner.title}
            </h1>
            <p className="mt-3 max-w-md text-sm text-ink-200 sm:mt-4 sm:text-base lg:text-lg">{heroBanner.subtitle}</p>
            <div className="mt-6 flex flex-wrap gap-3 sm:mt-8">
              <Link to={heroBanner.cta_link || '/shop'}>
                <Button size="lg" variant="primary" className="hover:bg-ink-800">
                  {heroBanner.cta_text || 'Shop Now'} <ArrowRight size={18} />
                </Button>
              </Link>
              <Link to="/new-arrivals">
                <Button size="lg" variant="outline" className="border-white/30 text-white hover:bg-white/10">
                  New Arrivals
                </Button>
              </Link>
            </div>
          </div>
        </div>
        {banners.length > 1 && (
          <div className="absolute bottom-6 left-1/2 flex -translate-x-1/2 gap-2">
            {banners.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentBanner(i)}
                className={`h-1.5 rounded-full transition-all ${i === currentBanner ? 'w-8 bg-white' : 'w-1.5 bg-white/50'}`}
              />
            ))}
          </div>
        )}
      </section>

      {/* Trust bar */}
      <section className="border-b border-ink-100 bg-ink-50">
        <div className="mx-auto grid max-w-7xl grid-cols-2 gap-3 px-3 py-4 sm:px-4 md:grid-cols-4 md:gap-4 md:py-6">
          {[
            { icon: Truck, title: 'Free Shipping', desc: 'On orders over INR 75' },
            { icon: RotateCcw, title: 'Easy Returns', desc: '30-day return policy' },
            { icon: ShieldCheck, title: 'Secure Payment', desc: '100% protected checkout' },
            { icon: Headphones, title: '24/7 Support', desc: 'Dedicated customer care' },
          ].map((item) => (
            <div key={item.title} className="flex items-center gap-2 rounded-lg bg-white/50 p-2 md:gap-3 md:p-0 md:bg-transparent">
              <item.icon size={18} className="shrink-0 text-ink-700 md:h-6 md:w-6" />
              <div>
                <p className="text-[11px] font-semibold text-ink-900 sm:text-sm">{item.title}</p>
                <p className="text-[10px] text-ink-500 md:text-xs">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Categories */}
      <section className="mx-auto max-w-7xl px-3 py-10 sm:px-4 sm:py-16">
        <SectionTitle title="Shop by Category" subtitle="Explore our curated collections" />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {categories.slice(0, 6).map((cat, i) => (
            <Link
              key={cat.id}
              to={`/category/${cat.slug}`}
              className="group relative aspect-[3/4] overflow-hidden rounded-xl bg-ink-100 animate-fade-in-up"
              style={{ animationDelay: `${i * 60}ms` }}
            >
              {cat.image && (
                <img src={cat.image} alt={cat.name} className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110" />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-ink-950/80 via-ink-950/20 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-4">
                <h3 className="text-sm font-semibold text-white sm:text-base">{cat.name}</h3>
                <p className="mt-1 flex items-center gap-1 text-xs text-ink-200 opacity-0 transition-opacity group-hover:opacity-100">
                  Shop now <ArrowRight size={12} />
                </p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Featured Products */}
      <section className="mx-auto max-w-7xl px-3 py-6 sm:px-4 sm:py-8">
        <SectionTitle title="Featured Products" subtitle="Handpicked favorites for the season" link="/shop" />
        <div className="grid grid-cols-2 gap-3 sm:gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {featLoading
            ? Array.from({ length: 8 }).map((_, i) => <ProductCardSkeleton key={i} />)
            : featured.map((p, i) => <ProductCard key={p.id} product={p} index={i} />)}
        </div>
      </section>

      {/* New Arrivals */}
      <section className="mx-auto max-w-7xl px-3 py-6 sm:px-4 sm:py-8">
        <SectionTitle title="New Arrivals" subtitle="The latest additions to our collection" link="/new-arrivals" />
        <div className="grid grid-cols-2 gap-3 sm:gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {naLoading
            ? Array.from({ length: 4 }).map((_, i) => <ProductCardSkeleton key={i} />)
            : newArrivals.slice(0, 4).map((p, i) => <ProductCard key={p.id} product={p} index={i} />)}
        </div>
      </section>

      {/* Best Sellers */}
      <section className="mx-auto max-w-7xl px-3 py-6 sm:px-4 sm:py-8">
        <SectionTitle title="Best Sellers" subtitle="Our most-loved pieces by customers" link="/shop" />
        <div className="grid grid-cols-2 gap-3 sm:gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {bsLoading
            ? Array.from({ length: 4 }).map((_, i) => <ProductCardSkeleton key={i} />)
            : bestSellers.map((p, i) => <ProductCard key={p.id} product={p} index={i} />)}
        </div>
      </section>

      {/* Trending */}
      <section className="mx-auto max-w-7xl px-3 py-6 pb-12 sm:px-4 sm:py-8 sm:pb-16">
        <SectionTitle title="Trending Now" subtitle="What everyone is talking about" link="/shop" />
        <div className="grid grid-cols-2 gap-3 sm:gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {trLoading
            ? Array.from({ length: 8 }).map((_, i) => <ProductCardSkeleton key={i} />)
            : trending.map((p, i) => <ProductCard key={p.id} product={p} index={i} />)}
        </div>
      </section>

      {/* Customer Reviews */}
      <section className="bg-ink-50 py-10 sm:py-16">
        <div className="mx-auto max-w-7xl px-3 sm:px-4">
          <SectionTitle title="Customer Reviews" subtitle="What our customers say about us" />
          <div className="grid gap-3 sm:gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {reviews.length === 0 ? (
              <div className="col-span-full text-center text-ink-500">No reviews yet.</div>
            ) : (
              reviews.map((review, i) => (
                <div key={review.id} className="rounded-xl border border-ink-100 bg-white p-6 animate-fade-in-up" style={{ animationDelay: `${i * 50}ms` }}>
                  <Quote size={24} className="text-accent-400" />
                  <div className="mt-3 flex items-center gap-1">
                    {Array.from({ length: 5 }).map((_, n) => (
                      <Star key={n} size={14} className={n < review.rating ? 'fill-accent-400 text-accent-400' : 'fill-ink-200 text-ink-200'} />
                    ))}
                  </div>
                  <h4 className="mt-3 font-semibold text-ink-900">{review.title}</h4>
                  <p className="mt-2 text-sm text-ink-600 line-clamp-2">{review.body}</p>
                  <div className="mt-4 flex items-center gap-3">
                    <div className="grid h-10 w-10 place-items-center rounded-full bg-ink-900 text-sm font-bold text-white">
                      {review.customer_name.charAt(0)}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-ink-900">{review.customer_name}</p>
                      <p className="text-xs text-ink-400">Verified Purchase</p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
