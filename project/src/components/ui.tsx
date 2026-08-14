import { Link } from 'react-router-dom';
import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';

export function Rating({ value, count, size = 'sm' }: { value: number; count?: number; size?: 'sm' | 'md' | 'lg' }) {
  const starSize = size === 'lg' ? 20 : size === 'md' ? 16 : 14;
  return (
    <div className="flex items-center gap-1">
      <div className="flex items-center">
        {[1, 2, 3, 4, 5].map((n) => (
          <Star
            key={n}
            size={starSize}
            className={cn(
              n <= Math.round(value) ? 'fill-accent-400 text-accent-400' : 'fill-ink-200 text-ink-200'
            )}
          />
        ))}
      </div>
      {count !== undefined && (
        <span className={cn('text-ink-500', size === 'lg' ? 'text-sm' : 'text-xs')}>
          {value.toFixed(1)} ({count})
        </span>
      )}
    </div>
  );
}

export function Badge({ children, variant = 'default' }: { children: React.ReactNode; variant?: 'default' | 'success' | 'warning' | 'error' | 'info' | 'accent' }) {
  const variants = {
    default: 'bg-ink-100 text-ink-700',
    success: 'bg-green-100 text-green-700',
    warning: 'bg-amber-100 text-amber-700',
    error: 'bg-red-100 text-red-700',
    info: 'bg-blue-100 text-blue-700',
    accent: 'bg-accent-100 text-accent-700',
  };
  return (
    <span className={cn('inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium', variants[variant])}>
      {children}
    </span>
  );
}

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
}) {
  const variants = {
    primary: 'bg-ink-900 text-white hover:bg-ink-800 active:bg-ink-950',
    secondary: 'bg-ink-100 text-ink-900 hover:bg-ink-200',
    outline: 'border border-ink-300 text-ink-900 hover:bg-ink-50 hover:border-ink-400',
    ghost: 'text-ink-700 hover:bg-ink-100',
    danger: 'bg-error-500 text-white hover:bg-error-600',
  };
  const sizes = {
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-5 py-2.5 text-sm',
    lg: 'px-8 py-3.5 text-sm',
  };
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed',
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}

export function ColorSwatch({ color, selected, onClick, size = 'md' }: { color: string; selected?: boolean; onClick?: () => void; size?: 'sm' | 'md' }) {
  const swatchSize = size === 'sm' ? 'h-5 w-5' : 'h-7 w-7';
  return (
    <button
      type="button"
      onClick={onClick}
      title={color}
      className={cn(
        'shrink-0 rounded-full border-2 transition-all duration-200',
        'aspect-square',
        swatchSize,
        selected ? 'border-ink-900 ring-2 ring-ink-900 ring-offset-1' : 'border-ink-200 hover:border-ink-400'
      )}
      style={{ backgroundColor: getColorHex(color) }}
    />
  );
}

function getColorHex(color: string): string {
  const map: Record<string, string> = {
    Black: '#1a1a1a', White: '#f8f8f8', Charcoal: '#36454f', Navy: '#1a2540',
    Grey: '#8d8d93', Olive: '#708238', Cream: '#f5f0e1', Sand: '#c2b280',
    Sage: '#9caf88', Brown: '#6b4423', Tan: '#d2b48c', Burgundy: '#5e1a1a',
    Khaki: '#c3b091', Stone: '#dedede', Silver: '#c0c0c0', Gold: '#d4af37',
  };
  if (map[color]) return map[color];
  const parts = color.split('/');
  return map[parts[0]] || '#888888';
}

export function SizeChip({ size, selected, onClick, disabled }: { size: string; selected?: boolean; onClick?: () => void; disabled?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'min-w-[2.75rem] rounded-lg border px-3 py-2 text-sm font-medium transition-all',
        disabled
          ? 'cursor-not-allowed border-ink-100 text-ink-300 line-through'
          : selected
            ? 'border-ink-900 bg-ink-900 text-white'
            : 'border-ink-300 text-ink-700 hover:border-ink-500'
      )}
    >
      {size}
    </button>
  );
}

export function Spinner({ className }: { className?: string }) {
  return (
    <div className={cn('inline-block animate-spin rounded-full border-2 border-ink-200 border-t-ink-900', className || 'w-6 h-6')} />
  );
}

export function EmptyState({ icon, title, description, action }: { icon?: React.ReactNode; title: string; description?: string; action?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
      {icon && <div className="mb-4 text-ink-300">{icon}</div>}
      <h3 className="text-lg font-semibold text-ink-900">{title}</h3>
      {description && <p className="mt-1 max-w-sm text-sm text-ink-500">{description}</p>}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}

export function ProductCardSkeleton() {
  return (
    <div className="space-y-3">
      <div className="skeleton aspect-[3/4] rounded-lg" />
      <div className="skeleton h-4 w-1/3 rounded" />
      <div className="skeleton h-4 w-2/3 rounded" />
      <div className="skeleton h-4 w-1/4 rounded" />
    </div>
  );
}

export function SectionTitle({ title, subtitle, link }: { title: string; subtitle?: string; link?: string }) {
  return (
    <div className="mb-8 flex items-end justify-between">
      <div>
        <h2 className="font-display text-2xl font-bold text-ink-900 sm:text-3xl">{title}</h2>
        {subtitle && <p className="mt-1 text-sm text-ink-500">{subtitle}</p>}
      </div>
      {link && (
        <Link to={link} className="text-sm font-medium text-ink-700 underline-offset-4 hover:text-ink-900 hover:underline">
          View all
        </Link>
      )}
    </div>
  );
}
