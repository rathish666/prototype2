import { useEffect, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Search, Heart, ShoppingBag, User, Menu, X, ChevronDown } from 'lucide-react';
import { useStore } from '@/store/StoreContext';
import { supabase } from '@/lib/supabase';
import { cn } from '@/lib/utils';
import type { Category, Announcement } from '@/types';

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [categories, setCategories] = useState<Category[]>([]);
  const [announcement, setAnnouncement] = useState<string | null>(null);
  const [shopMenuOpen, setShopMenuOpen] = useState(false);
  const { cartCount, wishlist, customerEmail, customerName } = useStore();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
    setSearchOpen(false);
    setShopMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    (async () => {
      const [{ data: cats }, { data: ann }] = await Promise.all([
        supabase.from('categories').select('*').eq('enabled', true).order('name'),
        supabase.from('announcements').select('*').eq('enabled', true).limit(1),
      ]);
      setCategories(cats || []);
      if (ann && ann[0]) setAnnouncement(ann[0].message);
    })();
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchOpen(false);
      setSearchQuery('');
    }
  };

  const navLinks = [
    { to: '/', label: 'Home' },
    { to: '/shop', label: 'Shop', hasMenu: true },
    { to: '/new-arrivals', label: 'New Arrivals' },
    { to: '/offers', label: 'Offers' },
  ];

  return (
    <>
      {/* Announcement bar */}
      {announcement && (
        <div className="bg-ink-900 text-white">
          <div className="mx-auto max-w-7xl px-4 py-2 text-center text-xs font-medium tracking-wide">
            {announcement}
          </div>
        </div>
      )}

      {/* Search overlay */}
      {searchOpen && (
        <div className="fixed inset-0 z-50 bg-white animate-fade-in">
          <div className="mx-auto max-w-3xl px-3 pt-20 sm:px-4 sm:pt-24">
            <form onSubmit={handleSearch} className="flex items-center gap-3 border-b-2 border-ink-900 pb-3 sm:pb-4">
              <Search size={22} className="text-ink-400 sm:h-6 sm:w-6" />
              <input
                autoFocus
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search products..."
                className="flex-1 bg-transparent text-base text-ink-900 outline-none placeholder:text-ink-400 sm:text-lg"
              />
              <button type="button" onClick={() => setSearchOpen(false)} className="text-ink-400 hover:text-ink-900">
                <X size={22} />
              </button>
            </form>
            <div className="mt-6">
              <p className="text-xs font-medium uppercase tracking-wide text-ink-400">Popular Categories</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {categories.map((cat) => (
                  <Link
                    key={cat.id}
                    to={`/category/${cat.slug}`}
                    className="rounded-full border border-ink-200 px-4 py-2 text-sm text-ink-700 hover:border-ink-900 hover:bg-ink-50"
                  >
                    {cat.name}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      <header className={cn(
        'sticky top-0 z-40 bg-white transition-all duration-300',
        scrolled ? 'shadow-md' : 'shadow-sm'
      )}>
        <nav className="mx-auto max-w-7xl px-3 sm:px-4">
          <div className="flex h-16 items-center justify-between gap-2 sm:gap-4 lg:h-18">
            {/* Mobile menu button */}
            <button
              className="grid h-9 w-9 place-items-center rounded-full text-ink-900 transition-colors hover:bg-ink-100 lg:hidden"
              onClick={() => setMobileOpen(true)}
              aria-label="Open menu"
            >
              <Menu size={22} />
            </button>

            {/* Logo */}
            <Link to="/" className="flex items-center">
              <span className="font-display text-lg font-bold tracking-tight text-ink-900 sm:text-2xl">MAISON</span>
              <span className="ml-1 hidden text-[10px] font-medium tracking-[0.2em] text-accent-500 xs:inline-block sm:inline-block">CO.</span>
            </Link>

            {/* Desktop nav */}
            <div className="hidden items-center gap-8 lg:flex">
              {navLinks.map((link) => (
                <div
                  key={link.to}
                  className="relative"
                  onMouseEnter={() => link.hasMenu && setShopMenuOpen(true)}
                  onMouseLeave={() => link.hasMenu && setShopMenuOpen(false)}
                >
                  <Link
                    to={link.to}
                    className="flex items-center gap-0.5 text-sm font-medium text-ink-700 transition-colors hover:text-ink-900"
                  >
                    {link.label}
                    {link.hasMenu && <ChevronDown size={14} className="mt-0.5" />}
                  </Link>
                  {link.hasMenu && shopMenuOpen && (
                    <div className="absolute left-0 top-full pt-4">
                      <div className="w-64 rounded-xl border border-ink-100 bg-white p-2 shadow-xl animate-scale-in">
                        <Link to="/shop" className="block rounded-lg px-3 py-2 text-sm text-ink-700 hover:bg-ink-50">
                          All Products
                        </Link>
                        {categories.map((cat) => (
                          <Link
                            key={cat.id}
                            to={`/category/${cat.slug}`}
                            className="block rounded-lg px-3 py-2 text-sm text-ink-700 hover:bg-ink-50"
                          >
                            {cat.name}
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
              <Link to="/category/formal-wear" className="text-sm font-medium text-ink-700 transition-colors hover:text-ink-900">
                Formal Wear
              </Link>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-1 sm:gap-2">
              <button
                onClick={() => setSearchOpen(true)}
                className="grid h-9 w-9 place-items-center rounded-full text-ink-700 transition-colors hover:bg-ink-100 sm:h-10 sm:w-10"
                aria-label="Search"
              >
                <Search size={18} className="sm:h-5 sm:w-5" />
              </button>
              <Link
                to="/wishlist"
                className="relative grid h-9 w-9 place-items-center rounded-full text-ink-700 transition-colors hover:bg-ink-100 sm:h-10 sm:w-10"
                aria-label="Wishlist"
              >
                <Heart size={18} className="sm:h-5 sm:w-5" />
                {wishlist.length > 0 && (
                  <span className="absolute right-1 top-1 grid h-4 min-w-4 place-items-center rounded-full bg-error-500 px-1 text-[10px] font-bold text-white">
                    {wishlist.length}
                  </span>
                )}
              </Link>
              <Link
                to="/cart"
                className="relative grid h-9 w-9 place-items-center rounded-full text-ink-700 transition-colors hover:bg-ink-100 sm:h-10 sm:w-10"
                aria-label="Cart"
              >
                <ShoppingBag size={18} className="sm:h-5 sm:w-5" />
                {cartCount > 0 && (
                  <span className="absolute right-1 top-1 grid h-4 min-w-4 place-items-center rounded-full bg-ink-900 px-1 text-[10px] font-bold text-white">
                    {cartCount}
                  </span>
                )}
              </Link>
              <Link
                to={customerEmail ? '/account' : '/login'}
                className="grid h-9 w-9 place-items-center rounded-full text-ink-700 transition-colors hover:bg-ink-100 sm:h-10 sm:w-10"
                aria-label="Account"
              >
                <User size={18} className="sm:h-5 sm:w-5" />
              </Link>
              <Link
                to="/admin"
                className="hidden sm:inline-flex items-center rounded-lg border border-ink-200 px-3 py-2 text-xs font-medium text-ink-700 hover:bg-ink-50"
              >
                Admin
              </Link>
            </div>
          </div>
        </nav>
      </header>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/50 animate-fade-in" onClick={() => setMobileOpen(false)} />
          <div className="absolute left-0 top-0 h-full w-80 max-w-[85vw] bg-white animate-slide-in-right overflow-y-auto">
            <div className="flex items-center justify-between border-b border-ink-100 px-4 py-4">
              <span className="font-display text-xl font-bold text-ink-900">MAISON CO.</span>
              <button onClick={() => setMobileOpen(false)} className="text-ink-500">
                <X size={24} />
              </button>
            </div>
            <div className="p-4">
              <form onSubmit={handleSearch} className="mb-4 flex items-center gap-2 rounded-lg border border-ink-200 px-3 py-2">
                <Search size={18} className="text-ink-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search..."
                  className="flex-1 bg-transparent text-sm outline-none"
                />
              </form>
              <nav className="space-y-1">
                {navLinks.map((link) => (
                  <Link
                    key={link.to}
                    to={link.to}
                    className="block rounded-lg px-3 py-2.5 text-sm font-medium text-ink-700 hover:bg-ink-50"
                  >
                    {link.label}
                  </Link>
                ))}
                <div className="px-3 pt-4 pb-2 text-xs font-medium uppercase tracking-wide text-ink-400">Categories</div>
                {categories.map((cat) => (
                  <Link
                    key={cat.id}
                    to={`/category/${cat.slug}`}
                    className="block rounded-lg px-3 py-2.5 text-sm text-ink-600 hover:bg-ink-50"
                  >
                    {cat.name}
                  </Link>
                ))}
              </nav>
              <div className="mt-6 space-y-2 border-t border-ink-100 pt-4">
                <Link to={customerEmail ? '/account' : '/login'} className="block rounded-lg bg-ink-900 px-4 py-2.5 text-center text-sm font-medium text-white">
                  {customerEmail ? `Hi, ${customerName}` : 'Sign In'}
                </Link>
                <Link to="/admin" className="block rounded-lg border border-ink-200 px-4 py-2.5 text-center text-sm font-medium text-ink-700">
                  Admin Dashboard
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
