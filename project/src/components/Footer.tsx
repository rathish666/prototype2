import { Link } from 'react-router-dom';
import { Share2, Globe, MessageCircle, Send, Mail, Phone, MapPin } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useStore } from '@/store/StoreContext';
import { useEffect, useState } from 'react';
import type { Category } from '@/types';

export function Footer() {
  const { showToast } = useStore();
  const [email, setEmail] = useState('');
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from('categories').select('*').eq('enabled', true).order('name').limit(6);
      setCategories(data || []);
    })();
  }, []);

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true);
    try {
      const { error } = await supabase.from('newsletter').upsert({ email: email.trim() }, { onConflict: 'email' });
      if (error) throw error;
      showToast('Successfully subscribed to newsletter', 'success');
      setEmail('');
    } catch {
      showToast('Failed to subscribe. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <footer className="bg-ink-950 text-ink-300">
      {/* Newsletter */}
      <div className="border-b border-ink-800">
        <div className="mx-auto max-w-7xl px-4 py-12">
          <div className="grid items-center gap-8 md:grid-cols-2">
            <div>
              <h3 className="font-display text-2xl font-bold text-white">Join the Maison Circle</h3>
              <p className="mt-2 text-sm text-ink-400">Subscribe for exclusive offers, early access to new collections, and style updates.</p>
            </div>
            <form onSubmit={handleSubscribe} className="flex gap-3">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                className="flex-1 rounded-lg border border-ink-700 bg-ink-900 px-4 py-3 text-sm text-white placeholder:text-ink-500 focus:border-accent-500 focus:outline-none"
                required
              />
              <button
                type="submit"
                disabled={loading}
                className="rounded-lg bg-white px-6 py-3 text-sm font-semibold text-ink-900 transition-colors hover:bg-ink-100 disabled:opacity-50"
              >
                {loading ? 'Subscribing...' : 'Subscribe'}
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Links */}
      <div className="mx-auto max-w-7xl px-4 py-12">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4 lg:grid-cols-5">
          <div className="col-span-2 lg:col-span-1">
            <Link to="/" className="flex items-center">
              <span className="font-display text-2xl font-bold text-white">MAISON</span>
              <span className="ml-1 text-xs font-medium tracking-[0.2em] text-accent-500">CO.</span>
            </Link>
            <p className="mt-4 text-sm text-ink-400">Premium men's fashion for the modern gentleman. Crafted with intention, designed to last.</p>
            <div className="mt-6 flex gap-3">
              {[Share2, Globe, MessageCircle, Send].map((Icon, i) => (
                <a
                  key={i}
                  href="#"
                  className="grid h-9 w-9 place-items-center rounded-full border border-ink-700 text-ink-400 transition-colors hover:border-accent-500 hover:text-accent-500"
                >
                  <Icon size={16} />
                </a>
              ))}
            </div>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-white">Shop</h4>
            <ul className="mt-4 space-y-2.5 text-sm">
              <li><Link to="/shop" className="hover:text-white">All Products</Link></li>
              <li><Link to="/new-arrivals" className="hover:text-white">New Arrivals</Link></li>
              <li><Link to="/offers" className="hover:text-white">Offers</Link></li>
              {categories.slice(0, 3).map((cat) => (
                <li key={cat.id}><Link to={`/category/${cat.slug}`} className="hover:text-white">{cat.name}</Link></li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-white">Categories</h4>
            <ul className="mt-4 space-y-2.5 text-sm">
              {categories.slice(0, 6).map((cat) => (
                <li key={cat.id}><Link to={`/category/${cat.slug}`} className="hover:text-white">{cat.name}</Link></li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-white">Support</h4>
            <ul className="mt-4 space-y-2.5 text-sm">
              <li><Link to="/account" className="hover:text-white">My Account</Link></li>
              <li><Link to="/orders" className="hover:text-white">Track Order</Link></li>
              <li><Link to="/shipping-policy" className="hover:text-white">Shipping Info</Link></li>
              <li><Link to="/refund-policy" className="hover:text-white">Returns</Link></li>
              <li><a href="#" className="hover:text-white">Size Guide</a></li>
              <li><a href="#" className="hover:text-white">FAQ</a></li>
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-white">Contact</h4>
            <ul className="mt-4 space-y-3 text-sm">
              <li className="flex items-start gap-2">
                <MapPin size={16} className="mt-0.5 shrink-0 text-accent-500" />
                <span>123 Fashion Ave, New York, NY 10001</span>
              </li>
              <li className="flex items-center gap-2">
                <Phone size={16} className="shrink-0 text-accent-500" />
                <span>+1 (555) 010-0000</span>
              </li>
              <li className="flex items-center gap-2">
                <Mail size={16} className="shrink-0 text-accent-500" />
                <span>support@maisonco.com</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom */}
      <div className="border-t border-ink-800">
        <div className="mx-auto max-w-7xl px-4 py-6">
          <div className="flex flex-col items-center justify-between gap-4 text-xs text-ink-500 sm:flex-row">
            <p>&copy; {new Date().getFullYear()} Maison Co. All rights reserved.</p>
            <div className="flex gap-6">
              <Link to="/privacy" className="hover:text-white">Privacy Policy</Link>
              <Link to="/terms" className="hover:text-white">Terms of Service</Link>
              <Link to="/refund-policy" className="hover:text-white">Refund Policy</Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
