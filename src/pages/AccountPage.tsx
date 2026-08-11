import { useEffect, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { User, Package, Heart, MapPin, CreditCard, Lock, LogOut, Truck, ChevronRight, Settings } from 'lucide-react';
import { useStore } from '@/store/StoreContext';
import { supabase } from '@/lib/supabase';
import { Button, Badge, EmptyState, Spinner } from '@/components/ui';
import { formatPrice, type Order, type Address } from '@/types';
import { formatDate } from '@/lib/utils';
import { cn, statusVariant } from '@/lib/utils';

type Tab = 'profile' | 'orders' | 'tracking' | 'wishlist' | 'addresses' | 'payment' | 'password';

export function AccountPage() {
  const { customerEmail, customerName, logoutCustomer, showToast, wishlist } = useStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState<Tab>('profile');
  const [orders, setOrders] = useState<Order[]>([]);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!customerEmail) { navigate('/login'); return; }
    (async () => {
      setLoading(true);
      const [{ data: ords }, { data: addrs }] = await Promise.all([
        supabase.from('orders').select('*').eq('customer_email', customerEmail).order('created_at', { ascending: false }),
        supabase.from('addresses').select('*').eq('customer_email', customerEmail),
      ]);
      setOrders((ords || []) as Order[]);
      setAddresses((addrs || []) as Address[]);
      setLoading(false);
    })();
  }, [customerEmail, navigate]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tab = params.get('tab') as Tab;
    if (tab) setActiveTab(tab);
  }, [location.search]);

  if (!customerEmail) return null;

  const menuItems = [
    { id: 'profile' as Tab, label: 'Profile', icon: User },
    { id: 'orders' as Tab, label: 'My Orders', icon: Package },
    { id: 'tracking' as Tab, label: 'Order Tracking', icon: Truck },
    { id: 'wishlist' as Tab, label: 'Wishlist', icon: Heart },
    { id: 'addresses' as Tab, label: 'Saved Addresses', icon: MapPin },
    { id: 'payment' as Tab, label: 'Payment Methods', icon: CreditCard },
    { id: 'password' as Tab, label: 'Change Password', icon: Lock },
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <h1 className="mb-8 font-display text-3xl font-bold text-ink-900">My Account</h1>

      <div className="grid gap-8 lg:grid-cols-4">
        {/* Sidebar */}
        <aside className="lg:col-span-1">
          <div className="rounded-xl border border-ink-100 p-4">
            <div className="mb-4 flex items-center gap-3 border-b border-ink-100 pb-4">
              <div className="grid h-12 w-12 place-items-center rounded-full bg-ink-900 text-lg font-bold text-white">
                {customerName?.charAt(0) || 'U'}
              </div>
              <div>
                <p className="text-sm font-semibold text-ink-900">{customerName}</p>
                <p className="text-xs text-ink-500">{customerEmail}</p>
              </div>
            </div>
            <nav className="space-y-1">
              {menuItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={cn(
                    'flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                    activeTab === item.id ? 'bg-ink-900 text-white' : 'text-ink-600 hover:bg-ink-50'
                  )}
                >
                  <item.icon size={18} /> {item.label}
                </button>
              ))}
              <button
                onClick={() => { logoutCustomer(); navigate('/'); }}
                className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-error-500 hover:bg-red-50"
              >
                <LogOut size={18} /> Logout
              </button>
            </nav>
          </div>
        </aside>

        {/* Content */}
        <div className="lg:col-span-3">
          {loading ? <div className="flex justify-center py-20"><Spinner /></div> : (
            <>
              {activeTab === 'profile' && <ProfileTab name={customerName || ''} email={customerEmail} />}
              {activeTab === 'orders' && <OrdersTab orders={orders} />}
              {activeTab === 'tracking' && <TrackingTab orders={orders} />}
              {activeTab === 'wishlist' && <WishlistTab count={wishlist.length} />}
              {activeTab === 'addresses' && <AddressesTab addresses={addresses} email={customerEmail} onUpdate={setAddresses} />}
              {activeTab === 'payment' && <PaymentTab />}
              {activeTab === 'password' && <PasswordTab email={customerEmail} />}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function ProfileTab({ name, email }: { name: string; email: string }) {
  const { showToast } = useStore();
  const [form, setForm] = useState({ name, phone: '', email });
  return (
    <div className="rounded-xl border border-ink-100 p-6">
      <h2 className="mb-4 text-lg font-semibold text-ink-900">Profile Information</h2>
      <div className="grid gap-4 sm:grid-cols-2">
        <div><label className="mb-1 block text-sm font-medium text-ink-700">Full Name</label><input className="w-full rounded-lg border border-ink-200 px-4 py-2.5 text-sm outline-none focus:border-ink-900" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
        <div><label className="mb-1 block text-sm font-medium text-ink-700">Email</label><input className="w-full rounded-lg border border-ink-200 px-4 py-2.5 text-sm outline-none focus:border-ink-900" value={form.email} disabled /></div>
        <div><label className="mb-1 block text-sm font-medium text-ink-700">Phone</label><input className="w-full rounded-lg border border-ink-200 px-4 py-2.5 text-sm outline-none focus:border-ink-900" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="Enter phone" /></div>
      </div>
      <Button className="mt-6" onClick={() => showToast('Profile updated successfully', 'success')}>Save Changes</Button>
    </div>
  );
}

function OrdersTab({ orders }: { orders: Order[] }) {
  if (orders.length === 0) return <EmptyState icon={<Package size={48} />} title="No orders yet" description="Your order history will appear here." action={<Link to="/shop"><Button>Start Shopping</Button></Link>} />;
  return (
    <div className="space-y-4">
      {orders.map((order) => (
        <div key={order.id} className="rounded-xl border border-ink-100 p-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="text-sm font-semibold text-ink-900">{order.order_number}</p>
              <p className="text-xs text-ink-500">{formatDate(order.created_at)}</p>
            </div>
            <Badge variant={statusVariant(order.status)}>{order.status}</Badge>
          </div>
          <div className="mt-3 flex items-center justify-between">
            <div className="text-sm text-ink-600">Total: <span className="font-semibold text-ink-900">{formatPrice(order.total)}</span></div>
            <Link to={`/order-confirmation/${order.order_number}`} className="flex items-center gap-1 text-sm text-ink-700 hover:text-ink-900">
              View Details <ChevronRight size={14} />
            </Link>
          </div>
        </div>
      ))}
    </div>
  );
}

function TrackingTab({ orders }: { orders: Order[] }) {
  const activeOrders = orders.filter((o) => !['Delivered', 'Cancelled', 'Returned'].includes(o.status));
  if (activeOrders.length === 0) return <EmptyState icon={<Truck size={48} />} title="No active orders" description="Orders in transit will appear here for tracking." />;
  return (
    <div className="space-y-4">
      {activeOrders.map((order) => {
        const steps = ['Confirmed', 'Processing', 'Shipped', 'Delivered'];
        const currentStep = steps.indexOf(order.status);
        return (
          <div key={order.id} className="rounded-xl border border-ink-100 p-6">
            <div className="mb-4 flex items-center justify-between">
              <div><p className="text-sm font-semibold">{order.order_number}</p><p className="text-xs text-ink-500">{formatDate(order.created_at)}</p></div>
              <Badge variant={statusVariant(order.status)}>{order.status}</Badge>
            </div>
            <div className="flex items-center">
              {steps.map((step, i) => (
                <div key={step} className="flex flex-1 items-center last:flex-none">
                  <div className={cn('grid h-8 w-8 place-items-center rounded-full text-xs font-bold', i <= currentStep ? 'bg-ink-900 text-white' : 'bg-ink-100 text-ink-400')}>{i + 1}</div>
                  {i < 3 && <div className={cn('h-0.5 flex-1', i < currentStep ? 'bg-ink-900' : 'bg-ink-200')} />}
                </div>
              ))}
            </div>
            <div className="mt-2 flex justify-between text-xs">
              {steps.map((step) => <span key={step} className="text-ink-500">{step}</span>)}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function WishlistTab({ count }: { count: number }) {
  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-ink-900">My Wishlist ({count} items)</h2>
        <Link to="/wishlist"><Button variant="outline" size="sm">View All</Button></Link>
      </div>
      {count === 0 ? <EmptyState icon={<Heart size={48} />} title="Wishlist is empty" description="Save items you love by tapping the heart icon." action={<Link to="/shop"><Button>Browse Products</Button></Link>} /> : <p className="text-sm text-ink-500">You have {count} items saved. Click "View All" to see your full wishlist.</p>}
    </div>
  );
}

function AddressesTab({ addresses, email, onUpdate }: { addresses: Address[]; email: string; onUpdate: (a: Address[]) => void }) {
  const { showToast } = useStore();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ label: '', recipient: '', phone: '', address: '', city: '', country: 'USA' });

  const handleAdd = async () => {
    if (!form.label || !form.recipient || !form.address) { showToast('Please fill required fields', 'error'); return; }
    const { data } = await supabase.from('addresses').insert({ ...form, customer_email: email }).select().maybeSingle();
    if (data) { onUpdate([...addresses, data as Address]); showToast('Address added', 'success'); setShowForm(false); setForm({ label: '', recipient: '', phone: '', address: '', city: '', country: 'USA' }); }
  };

  const handleDelete = async (id: string) => {
    await supabase.from('addresses').delete().eq('id', id);
    onUpdate(addresses.filter((a) => a.id !== id));
    showToast('Address removed', 'success');
  };

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-ink-900">Saved Addresses</h2>
        <Button variant="outline" size="sm" onClick={() => setShowForm(!showForm)}>Add New</Button>
      </div>
      {showForm && (
        <div className="mb-4 rounded-xl border border-ink-100 p-5">
          <div className="grid gap-3 sm:grid-cols-2">
            <input className="rounded-lg border border-ink-200 px-4 py-2.5 text-sm" placeholder="Label (e.g. Home)" value={form.label} onChange={(e) => setForm({ ...form, label: e.target.value })} />
            <input className="rounded-lg border border-ink-200 px-4 py-2.5 text-sm" placeholder="Recipient" value={form.recipient} onChange={(e) => setForm({ ...form, recipient: e.target.value })} />
            <input className="rounded-lg border border-ink-200 px-4 py-2.5 text-sm" placeholder="Phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            <input className="rounded-lg border border-ink-200 px-4 py-2.5 text-sm" placeholder="Address" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
            <input className="rounded-lg border border-ink-200 px-4 py-2.5 text-sm" placeholder="City" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
            <select className="rounded-lg border border-ink-200 px-4 py-2.5 text-sm" value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })}><option>USA</option><option>Canada</option><option>UK</option></select>
          </div>
          <div className="mt-3 flex gap-2"><Button size="sm" onClick={handleAdd}>Save Address</Button><Button size="sm" variant="ghost" onClick={() => setShowForm(false)}>Cancel</Button></div>
        </div>
      )}
      {addresses.length === 0 ? <EmptyState icon={<MapPin size={48} />} title="No saved addresses" description="Add a delivery address for faster checkout." /> : (
        <div className="grid gap-4 sm:grid-cols-2">
          {addresses.map((addr) => (
            <div key={addr.id} className="rounded-xl border border-ink-100 p-5">
              <div className="flex items-start justify-between"><h3 className="text-sm font-semibold text-ink-900">{addr.label}</h3><button onClick={() => handleDelete(addr.id)} className="text-xs text-error-500 hover:underline">Remove</button></div>
              <div className="mt-2 text-sm text-ink-600"><p>{addr.recipient}</p><p>{addr.address}</p><p>{addr.city}, {addr.country}</p>{addr.phone && <p>{addr.phone}</p>}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function PaymentTab() {
  return (
    <div>
      <h2 className="mb-4 text-lg font-semibold text-ink-900">Payment Methods</h2>
      <div className="rounded-xl border border-ink-100 p-6">
        <div className="flex items-center gap-4">
          <div className="grid h-10 w-14 place-items-center rounded-lg bg-ink-900 text-xs font-bold text-white">VISA</div>
          <div className="flex-1"><p className="text-sm font-medium text-ink-900">•••• •••• •••• 4242</p><p className="text-xs text-ink-500">Expires 12/27</p></div>
          <Badge variant="success">Default</Badge>
        </div>
      </div>
      <Button variant="outline" className="mt-4">Add Payment Method</Button>
    </div>
  );
}

function PasswordTab({ email }: { email: string }) {
  const { showToast } = useStore();
  const [form, setForm] = useState({ current: '', new: '', confirm: '' });
  const handleSubmit = async () => {
    if (form.new !== form.confirm) { showToast('Passwords do not match', 'error'); return; }
    if (form.new.length < 6) { showToast('Password must be at least 6 characters', 'error'); return; }
    const { error } = await supabase.from('customers').update({ password: form.new }).eq('email', email);
    if (error) showToast('Failed to update password', 'error');
    else { showToast('Password updated successfully', 'success'); setForm({ current: '', new: '', confirm: '' }); }
  };
  return (
    <div className="rounded-xl border border-ink-100 p-6">
      <h2 className="mb-4 text-lg font-semibold text-ink-900">Change Password</h2>
      <div className="max-w-sm space-y-4">
        <div><label className="mb-1 block text-sm font-medium text-ink-700">Current Password</label><input type="password" className="w-full rounded-lg border border-ink-200 px-4 py-2.5 text-sm" value={form.current} onChange={(e) => setForm({ ...form, current: e.target.value })} /></div>
        <div><label className="mb-1 block text-sm font-medium text-ink-700">New Password</label><input type="password" className="w-full rounded-lg border border-ink-200 px-4 py-2.5 text-sm" value={form.new} onChange={(e) => setForm({ ...form, new: e.target.value })} /></div>
        <div><label className="mb-1 block text-sm font-medium text-ink-700">Confirm Password</label><input type="password" className="w-full rounded-lg border border-ink-200 px-4 py-2.5 text-sm" value={form.confirm} onChange={(e) => setForm({ ...form, confirm: e.target.value })} /></div>
        <Button onClick={handleSubmit}>Update Password</Button>
      </div>
    </div>
  );
}
