import { useParams } from 'react-router-dom';
import { ShopPage } from './ShopPage';
import { useCategories } from '@/lib/hooks';
import { Spinner } from '@/components/ui';

export function CategoryPage() {
  const { slug } = useParams<{ slug: string }>();
  const { categories, loading } = useCategories();
  const category = categories.find((c) => c.slug === slug);
  const fallbackTitle = slug
    ? slug
        .split('-')
        .filter(Boolean)
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(' ')
    : 'Category';

  if (loading) return <div className="flex justify-center py-20"><Spinner /></div>;

  return <ShopPage title={category?.name || fallbackTitle} categorySlug={slug} />;
}
