import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, User, ArrowRight } from 'lucide-react';
import { useStore } from '@/store/StoreContext';
import { supabase } from '@/lib/supabase';
import { Button, Spinner } from '@/components/ui';

export function AuthPage({ mode }: { mode: 'login' | 'register' }) {
  const { showToast } = useStore();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const isLogin = mode === 'login';

  const validate = () => {
    const e: Record<string, string> = {};
    if (!isLogin && !form.name.trim()) e.name = 'Name is required';
    if (!form.email.trim()) e.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = 'Invalid email';
    if (!form.password.trim()) e.password = 'Password is required';
    else if (form.password.length < 6) e.password = 'Password must be at least 6 characters';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      if (isLogin) {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: form.email,
          password: form.password,
        });
        if (error || !data.user) {
          setErrors({ email: 'Invalid email or password' });
          setLoading(false);
          return;
        }

        const { data: customer } = await supabase
          .from('customers')
          .select('disabled')
          .eq('email', form.email)
          .maybeSingle();
        if (customer?.disabled) {
          setErrors({ email: 'Account has been disabled. Contact support.' });
          await supabase.auth.signOut();
          setLoading(false);
          return;
        }

        showToast('Welcome back!', 'success');
        navigate('/account');
      } else {
        const { data, error } = await supabase.auth.signUp({
          email: form.email,
          password: form.password,
          options: { data: { name: form.name } },
        });
        if (error) {
          setErrors({ email: error.message.includes('already') ? 'Email already registered' : error.message });
          setLoading(false);
          return;
        }
        if (!data.session) {
          // Email confirmation is enabled on this Supabase project — the
          // account exists but can't sign in until the link is clicked.
          showToast('Check your email to confirm your account before signing in.', 'success');
          navigate('/login');
          setLoading(false);
          return;
        }

        // Create the store profile row now that we have a verified session
        // (RLS only allows a customer to insert a row matching their own
        // authenticated email).
        await supabase.from('customers').insert({ name: form.name, email: form.email });

        showToast('Account created successfully!', 'success');
        navigate('/account');
      }
    } catch {
      showToast('Something went wrong. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const inputClass = 'w-full rounded-lg border border-ink-200 py-2.5 pl-11 pr-4 text-sm outline-none focus:border-ink-900 focus:ring-1 focus:ring-ink-900';

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center bg-ink-50 px-4 py-12">
      <div className="w-full max-w-md">
        <div className="rounded-2xl border border-ink-100 bg-white p-8 shadow-sm">
          <div className="mb-8 text-center">
            <Link to="/" className="inline-flex items-center">
              <span className="font-display text-2xl font-bold text-ink-900">MAISON</span>
              <span className="ml-1 text-xs font-medium tracking-[0.2em] text-accent-500">CO.</span>
            </Link>
            <h1 className="mt-6 font-display text-2xl font-bold text-ink-900">{isLogin ? 'Welcome Back' : 'Create Account'}</h1>
            <p className="mt-1 text-sm text-ink-500">{isLogin ? 'Sign in to your account' : 'Join the Maison Circle today'}</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div>
                <label className="mb-1 block text-sm font-medium text-ink-700">Full Name</label>
                <div className="relative">
                  <User size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-400" />
                  <input className={`${inputClass} ${errors.name ? 'border-error-500' : ''}`} placeholder="John Doe" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                </div>
                {errors.name && <p className="mt-1 text-xs text-error-500">{errors.name}</p>}
              </div>
            )}
            <div>
              <label className="mb-1 block text-sm font-medium text-ink-700">Email</label>
              <div className="relative">
                <Mail size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-400" />
                <input type="email" className={`${inputClass} ${errors.email ? 'border-error-500' : ''}`} placeholder="you@email.com" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
              </div>
              {errors.email && <p className="mt-1 text-xs text-error-500">{errors.email}</p>}
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-ink-700">Password</label>
              <div className="relative">
                <Lock size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-400" />
                <input type="password" className={`${inputClass} ${errors.password ? 'border-error-500' : ''}`} placeholder="••••••••" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
              </div>
              {errors.password && <p className="mt-1 text-xs text-error-500">{errors.password}</p>}
            </div>

            <Button type="submit" size="lg" className="w-full" disabled={loading}>
              {loading ? <Spinner /> : <>{isLogin ? 'Sign In' : 'Create Account'} <ArrowRight size={18} /></>}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-ink-500">
            {isLogin ? "Don't have an account? " : 'Already have an account? '}
            <Link to={isLogin ? '/register' : '/login'} className="font-semibold text-ink-900 hover:underline">
              {isLogin ? 'Sign up' : 'Sign in'}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
