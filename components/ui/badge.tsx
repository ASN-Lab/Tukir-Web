import { cn } from '@/lib/utils'

type Variant = 'default' | 'secondary' | 'destructive' | 'success' | 'warning' | 'outline'

export default function Badge({
  className,
  variant = 'default',
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & { variant?: Variant }) {
  const variants: Record<Variant, string> = {
    default: 'border-transparent bg-primary text-primary-foreground',
    secondary: 'border-transparent bg-secondary text-secondary-foreground',
    destructive: 'border-transparent bg-rose-500/15 text-rose-500',
    success: 'border-transparent bg-emerald-500/15 text-emerald-500',
    warning: 'border-transparent bg-amber-500/15 text-amber-500',
    outline: 'text-foreground',
  }
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold',
        variants[variant],
        className
      )}
      {...props}
    />
  )
}
