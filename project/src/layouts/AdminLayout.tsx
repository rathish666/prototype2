import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation, Outlet } from 'react-router-dom';
import {
  LayoutDashboard, Package, Boxes, ShoppingCart, Users, FolderTree,
  Ticket, Star, BarChart3, FileText, Settings, LogOut, Menu, X, Store,
  Search,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/lib/supabase';

const navItems = [
  { to: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/admin/products', label: 'Products', icon: Package },
  { to: '/admin/inventory', label: 'Inventory', icon: Boxes },
  { to: '/admin/orders', label: 'Orders', icon: ShoppingCart },
  { to: '/admin/customers', label: 'Customers', icon: Users },
  { to: '/admin/categories', label: 'Categories', icon: FolderTree },
  { to: '/admin/coupons', label: 'Coupons', icon: Ticket },
  { to: '/admin/reviews', label: 'Reviews', icon: Star },
  { to: '/admin/analytics', label: 'Analytics', icon: BarChart3 },
  { to: '/admin/content', label: 'Website Content', icon: FileText },
  { to: '/admin/settings', label: 'Settings', icon: Settings },
];

type AuthState = 'checking' | 'signed-out' | 'not-admin' | 'authed';

export function AdminLayout() {
  const [authState, setAuthState] = useState<AuthState>('checking');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const checkAdmin = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      setAuthState('signed-out');
      return;
    }
    // is_admin() is enforced server-side by RLS on every table this
    // dashboard touches; this check just decides what the UI shows —
    // it is not itself a security boundary.
    const { data, error: rpcError } = await supabase.rpc('is_admin');
    if (rpcError || !data) {
      setAuthState('not-admin');
      return;
    }
    setAuthState('authed');
  };

  useEffect(() => {
    checkAdmin();
    const { data: sub } = supabase.auth.onAuthStateChange(() => {
      checkAdmin();
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
    if (signInError) {
      setError('Invalid email or password');
      setSubmitting(false);
      return;
    }
    const { data: isAdmin } = await supabase.rpc('is_admin');
    if (!isAdmin) {
      setError('This account does not have admin access.');
      await supabase.auth.signOut();
      setSubmitting(false);
      return;
    }
    setAuthState('authed');
    setSubmitting(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setAuthState('signed-out');
    navigate('/admin');
  };

  if (authState === 'checking') {
    return <div className="grid min-h-screen place-items-center bg-ink-950" />;
  }

  if (authState !== 'authed') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-ink-950 px-4">
        <div className="w-full max-w-sm">
          <div className="mb-8 text-center">
            <div className="mx-auto mb-4 grid h-16 w-16 place-items-center rounded-2xl bg-white/10">
              <Store size={32} className="text-white" />
            </div>
            <h1 className="font-display text-2xl font-bold text-white">Admin Dashboard</h1>
            <p className="mt-1 text-sm text-ink-400">Sign in to manage your store</p>
          </div>
          <form onSubmit={handleLogin} className="rounded-2xl border border-ink-800 bg-ink-900 p-6">
            <div className="mb-4">
              <label className="mb-1.5 block text-sm font-medium text-ink-300">Admin Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setError(''); }}
                className="w-full rounded-lg border border-ink-700 bg-ink-800 px-4 py-2.5 text-sm text-white outline-none focus:border-white"
                placeholder="you@yourstore.com"
                autoFocus
              />
            </div>
            <div className="mb-4">
              <label className="mb-1.5 block text-sm font-medium text-ink-300">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => { setPassword(e.target.value); setError(''); }}
                className="w-full rounded-lg border border-ink-700 bg-ink-800 px-4 py-2.5 text-sm text-white outline-none focus:border-white"
                placeholder="Enter password"
              />
              {error && <p className="mt-1.5 text-xs text-error-500">{error}</p>}
            </div>
            <button type="submit" disabled={submitting} className="w-full rounded-lg bg-white py-2.5 text-sm font-semibold text-ink-900 transition-colors hover:bg-ink-100 disabled:opacity-60">
              {submitting ? 'Signing in…' : 'Sign In'}
            </button>
          </form>
          <div className="mt-6 text-center">
            <Link to="/" className="text-sm text-ink-400 hover:text-white">Back to Store</Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-ink-50">
      {/* Sidebar */}
      <aside className={cn(
        'fixed inset-y-0 left-0 z-50 w-[82vw] max-w-72 bg-ink-950 text-ink-300 transition-transform duration-300 sm:w-64 lg:translate-x-0',
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      )}>
        <div className="flex h-16 items-center justify-between border-b border-ink-800 px-5">
          <Link to="/admin" className="flex items-center gap-2">
            <Store size={22} className="text-white" />
            <span className="font-display text-lg font-bold text-white">MAISON</span>
            <span className="text-xs text-accent-500">Admin</span>
          </Link>
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden text-ink-400"><X size={20} /></button>
        </div>
        <nav className="flex-1 space-y-1 overflow-y-auto p-3">
          {navItems.map((item) => {
            const active = location.pathname === item.to || (item.to !== '/admin' && location.pathname.startsWith(item.to));
            return (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                  active ? 'bg-white text-ink-900' : 'text-ink-400 hover:bg-ink-800 hover:text-white'
                )}
              >
                <item.icon size={18} /> {item.label}
              </Link>
            );
          })}
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-error-500 hover:bg-red-950"
          >
            <LogOut size={18} /> Logout
          </button>
        </nav>
        <div className="border-t border-ink-800 p-3">
          <Link to="/" className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-ink-400 hover:bg-ink-800 hover:text-white">
            <Store size={18} /> View Store
          </Link>
        </div>
      </aside>

      {/* Overlay */}
      {sidebarOpen && <div className="fixed inset-0 z-40 bg-black/50 lg:hidden" onClick={() => setSidebarOpen(false)} />}

      {/* Main */}
      <div className="flex-1 lg:pl-64">
        {/* Top bar */}
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-ink-100 bg-white px-3 sm:px-4 lg:px-8">
          <button onClick={() => setSidebarOpen(true)} className="grid h-9 w-9 place-items-center rounded-full text-ink-700 transition-colors hover:bg-ink-100 lg:hidden"><Menu size={22} /></button>
          <div className="hidden flex-1 lg:block" />
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="relative hidden sm:block">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400" />
              <input className="w-36 rounded-lg border border-ink-200 py-2 pl-9 pr-3 text-sm outline-none focus:border-ink-900 sm:w-48" placeholder="Search..." />
            </div>
            <div className="grid h-8 w-8 place-items-center rounded-full bg-ink-900 text-xs font-bold text-white sm:h-9 sm:w-9">A</div>
          </div>
        </header>

        <main className="p-3 sm:p-4 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
