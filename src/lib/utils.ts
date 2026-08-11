export function cn(...inputs: (string | undefined | null | false)[]): string {
  return inputs.filter(Boolean).join(' ');
}

export function formatDate(date: string | Date): string {
  return new Date(date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

export function formatDateTime(date: string | Date): string {
  return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' });
}

export function timeAgo(date: string | Date): string {
  const diff = Date.now() - new Date(date).getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days} days ago`;
  if (days < 30) return `${Math.floor(days / 7)} weeks ago`;
  return formatDate(date);
}

export function generateOrderNumber(): string {
  const num = Math.floor(100016 + Math.random() * 900000);
  return `ORD-${num}`;
}

export function statusVariant(status: string): 'default' | 'success' | 'warning' | 'error' | 'info' | 'accent' {
  switch (status) {
    case 'Delivered': return 'success';
    case 'Shipped': return 'info';
    case 'Processing': return 'warning';
    case 'Confirmed': return 'info';
    case 'Pending': return 'warning';
    case 'Cancelled': return 'error';
    case 'Returned': return 'error';
    case 'In Stock': return 'success';
    case 'Low Stock': return 'warning';
    case 'Out of Stock': return 'error';
    case 'approved': return 'success';
    case 'pending': return 'warning';
    case 'hidden': return 'error';
    default: return 'default';
  }
}
