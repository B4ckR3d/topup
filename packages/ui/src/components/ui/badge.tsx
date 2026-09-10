import { Slot } from '@radix-ui/react-slot'
import { cn } from '@umbreon/ui/lib/utils'
import { cva, type VariantProps } from 'class-variance-authority'
import type * as React from 'react'

const badgeVariants = cva(
  'inline-flex items-center justify-center rounded-full border px-1.5 py-0.5 text-xs font-medium w-fit whitespace-nowrap shrink-0 [&>svg]:size-3 gap-1 [&>svg]:pointer-events-none focus-visible:border-primary/30 focus-visible:ring-1 focus-visible:ring-primary/15 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/30 aria-invalid:border-destructive/50 transition-[color,border-color,box-shadow] overflow-hidden',
  {
    variants: {
      variant: {
        default: 'bg-primary/10 border-primary/25 text-primary',
        secondary:
          'bg-secondary/30 border-border/70 text-foreground [a&]:hover:bg-secondary/40 dark:bg-secondary/40 dark:text-foreground [a&]:dark:hover:bg-secondary/50',
        destructive:
          'bg-destructive/10 border-destructive/30 text-destructive [a&]:hover:bg-destructive/20',
        outline:
          'text-foreground border-border/70 [a&]:hover:border-primary/30 [a&]:hover:bg-accent/60 dark:[a&]:hover:bg-accent/50',
        success: 'bg-success/10 border-success/30 text-success [a&]:hover:bg-success/20',
        warning: 'bg-warning/10 border-warning/30 text-warning [a&]:hover:bg-warning/20',
        info: 'bg-info/10 border-info/30 text-info [a&]:hover:bg-info/20',
        accent:
          'bg-primary/10 border-primary/25 text-primary [a&]:hover:bg-primary/20 dark:bg-primary/20 dark:border-primary/40 dark:text-primary [a&]:dark:hover:bg-primary/30',
        brand: 'bg-primary/10 border-primary/25 text-primary',
        soft: 'bg-muted border-border/70 text-muted-foreground [a&]:hover:bg-muted/80',
        'soft-primary':
          'bg-primary/10 border-primary/25 text-primary [a&]:hover:bg-primary/20 dark:bg-primary/20 dark:border-primary/40 dark:text-primary [a&]:dark:hover:bg-primary/30',
        'soft-success': 'bg-success/10 border-success/30 text-success [a&]:hover:bg-success/20',
        'soft-warning': 'bg-warning/10 border-warning/30 text-warning [a&]:hover:bg-warning/20',
        'soft-info': 'bg-info/10 border-info/30 text-info [a&]:hover:bg-info/20',
        'soft-danger':
          'bg-destructive/10 border-destructive/30 text-destructive [a&]:hover:bg-destructive/20',
        'soft-neutral': 'bg-muted border-border/70 text-muted-foreground [a&]:hover:bg-muted/80',
        red: 'bg-red-100 border-destructive/30 text-red-800 dark:bg-red-900/40 dark:border-destructive/40 dark:text-red-200 [a&]:hover:bg-red-200/80 [a&]:dark:hover:bg-red-900/60',
        orange:
          'bg-orange-100 border-warning/30 text-orange-800 dark:bg-orange-900/40 dark:border-warning/40 dark:text-orange-200 [a&]:hover:bg-orange-200/80 [a&]:dark:hover:bg-orange-900/60',
        amber:
          'bg-amber-100 border-warning/30 text-amber-800 dark:bg-amber-900/40 dark:border-warning/40 dark:text-amber-200 [a&]:hover:bg-amber-200/80 [a&]:dark:hover:bg-amber-900/60',
        yellow:
          'bg-yellow-100 border-warning/30 text-yellow-800 dark:bg-yellow-900/40 dark:border-warning/40 dark:text-yellow-200 [a&]:hover:bg-yellow-200/80 [a&]:dark:hover:bg-yellow-900/60',
        lime: 'bg-lime-100 border-success/30 text-lime-800 dark:bg-lime-900/40 dark:border-success/40 dark:text-lime-200 [a&]:hover:bg-lime-200/80 [a&]:dark:hover:bg-lime-900/60',
        green:
          'bg-green-100 border-success/30 text-green-800 dark:bg-green-900/40 dark:border-success/40 dark:text-green-200 [a&]:hover:bg-green-200/80 [a&]:dark:hover:bg-green-900/60',
        emerald:
          'bg-emerald-100 border-success/30 text-emerald-800 dark:bg-emerald-900/40 dark:border-success/40 dark:text-emerald-200 [a&]:hover:bg-emerald-200/80 [a&]:dark:hover:bg-emerald-900/60',
        teal: 'bg-teal-100 border-success/30 text-teal-800 dark:bg-teal-900/40 dark:border-success/40 dark:text-teal-200 [a&]:hover:bg-teal-200/80 [a&]:dark:hover:bg-teal-900/60',
        cyan: 'bg-cyan-100 border-info/30 text-cyan-800 dark:bg-cyan-900/40 dark:border-info/40 dark:text-cyan-200 [a&]:hover:bg-cyan-200/80 [a&]:dark:hover:bg-cyan-900/60',
        sky: 'bg-sky-100 border-info/30 text-sky-800 dark:bg-sky-900/40 dark:border-info/40 dark:text-sky-200 [a&]:hover:bg-sky-200/80 [a&]:dark:hover:bg-sky-900/60',
        blue: 'bg-blue-100 border-info/30 text-blue-800 dark:bg-blue-900/40 dark:border-info/40 dark:text-blue-200 [a&]:hover:bg-blue-200/80 [a&]:dark:hover:bg-blue-900/60',
        indigo:
          'bg-indigo-100 border-primary/30 text-indigo-800 dark:bg-indigo-900/40 dark:border-primary/40 dark:text-indigo-200 [a&]:hover:bg-indigo-200/80 [a&]:dark:hover:bg-indigo-900/60',
        violet:
          'bg-violet-100 border-primary/30 text-violet-800 dark:bg-violet-900/40 dark:border-primary/40 dark:text-violet-200 [a&]:hover:bg-violet-200/80 [a&]:dark:hover:bg-violet-900/60',
        purple:
          'bg-purple-100 border-primary/30 text-purple-800 dark:bg-purple-900/40 dark:border-primary/40 dark:text-purple-200 [a&]:hover:bg-purple-200/80 [a&]:dark:hover:bg-purple-900/60',
        fuchsia:
          'bg-fuchsia-100 border-primary/30 text-fuchsia-800 dark:bg-fuchsia-900/40 dark:border-primary/40 dark:text-fuchsia-200 [a&]:hover:bg-fuchsia-200/80 [a&]:dark:hover:bg-fuchsia-900/60',
        pink: 'bg-pink-100 border-primary/30 text-pink-800 dark:bg-pink-900/40 dark:border-primary/40 dark:text-pink-200 [a&]:hover:bg-pink-200/80 [a&]:dark:hover:bg-pink-900/60',
        rose: 'bg-rose-100 border-destructive/30 text-rose-800 dark:bg-rose-900/40 dark:border-destructive/40 dark:text-rose-200 [a&]:hover:bg-rose-200/80 [a&]:dark:hover:bg-rose-900/60',
        slate:
          'bg-slate-100 border-border/70 text-slate-800 dark:bg-slate-900/40 dark:border-border/70 dark:text-slate-200 [a&]:hover:bg-slate-200/80 [a&]:dark:hover:bg-slate-900/60',
        gray: 'bg-gray-100 border-border/70 text-gray-800 dark:bg-gray-900/40 dark:border-border/70 dark:text-gray-200 [a&]:hover:bg-gray-200/80 [a&]:dark:hover:bg-gray-900/60',
        zinc: 'bg-zinc-100 border-border/70 text-zinc-800 dark:bg-zinc-900/40 dark:border-border/70 dark:text-zinc-200 [a&]:hover:bg-zinc-200/80 [a&]:dark:hover:bg-zinc-900/60',
        neutral:
          'bg-neutral-100 border-border/70 text-neutral-800 dark:bg-neutral-900/40 dark:border-border/70 dark:text-neutral-200 [a&]:hover:bg-neutral-200/80 [a&]:dark:hover:bg-neutral-900/60',
        stone:
          'bg-stone-100 border-border/70 text-stone-800 dark:bg-stone-900/40 dark:border-border/70 dark:text-stone-200 [a&]:hover:bg-stone-200/80 [a&]:dark:hover:bg-stone-900/60',
        'soft-red':
          'bg-red-100 border-destructive/30 text-red-800 dark:bg-red-900/40 dark:border-destructive/40 dark:text-red-200 [a&]:hover:bg-red-200/80 [a&]:dark:hover:bg-red-900/60',
        'soft-orange':
          'bg-orange-100 border-warning/30 text-orange-800 dark:bg-orange-900/40 dark:border-warning/40 dark:text-orange-200 [a&]:hover:bg-orange-200/80 [a&]:dark:hover:bg-orange-900/60',
        'soft-amber':
          'bg-amber-100 border-warning/30 text-amber-800 dark:bg-amber-900/40 dark:border-warning/40 dark:text-amber-200 [a&]:hover:bg-amber-200/80 [a&]:dark:hover:bg-amber-900/60',
        'soft-yellow':
          'bg-yellow-100 border-warning/30 text-yellow-800 dark:bg-yellow-900/40 dark:border-warning/40 dark:text-yellow-200 [a&]:hover:bg-yellow-200/80 [a&]:dark:hover:bg-yellow-900/60',
        'soft-lime':
          'bg-lime-100 border-success/30 text-lime-800 dark:bg-lime-900/40 dark:border-success/40 dark:text-lime-200 [a&]:hover:bg-lime-200/80 [a&]:dark:hover:bg-lime-900/60',
        'soft-green':
          'bg-green-100 border-success/30 text-green-800 dark:bg-green-900/40 dark:border-success/40 dark:text-green-200 [a&]:hover:bg-green-200/80 [a&]:dark:hover:bg-green-900/60',
        'soft-emerald':
          'bg-emerald-100 border-success/30 text-emerald-800 dark:bg-emerald-900/40 dark:border-success/40 dark:text-emerald-200 [a&]:hover:bg-emerald-200/80 [a&]:dark:hover:bg-emerald-900/60',
        'soft-teal':
          'bg-teal-100 border-success/30 text-teal-800 dark:bg-teal-900/40 dark:border-success/40 dark:text-teal-200 [a&]:hover:bg-teal-200/80 [a&]:dark:hover:bg-teal-900/60',
        'soft-cyan':
          'bg-cyan-100 border-info/30 text-cyan-800 dark:bg-cyan-900/40 dark:border-info/40 dark:text-cyan-200 [a&]:hover:bg-cyan-200/80 [a&]:dark:hover:bg-cyan-900/60',
        'soft-sky':
          'bg-sky-100 border-info/30 text-sky-800 dark:bg-sky-900/40 dark:border-info/40 dark:text-sky-200 [a&]:hover:bg-sky-200/80 [a&]:dark:hover:bg-sky-900/60',
        'soft-blue':
          'bg-blue-100 border-info/30 text-blue-800 dark:bg-blue-900/40 dark:border-info/40 dark:text-blue-200 [a&]:hover:bg-blue-200/80 [a&]:dark:hover:bg-blue-900/60',
        'soft-indigo':
          'bg-indigo-100 border-primary/30 text-indigo-800 dark:bg-indigo-900/40 dark:border-primary/40 dark:text-indigo-200 [a&]:hover:bg-indigo-200/80 [a&]:dark:hover:bg-indigo-900/60',
        'soft-violet':
          'bg-violet-100 border-primary/30 text-violet-800 dark:bg-violet-900/40 dark:border-primary/40 dark:text-violet-200 [a&]:hover:bg-violet-200/80 [a&]:dark:hover:bg-violet-900/60',
        'soft-purple':
          'bg-purple-100 border-primary/30 text-purple-800 dark:bg-purple-900/40 dark:border-primary/40 dark:text-purple-200 [a&]:hover:bg-purple-200/80 [a&]:dark:hover:bg-purple-900/60',
        'soft-fuchsia':
          'bg-fuchsia-100 border-primary/30 text-fuchsia-800 dark:bg-fuchsia-900/40 dark:border-primary/40 dark:text-fuchsia-200 [a&]:hover:bg-fuchsia-200/80 [a&]:dark:hover:bg-fuchsia-900/60',
        'soft-pink':
          'bg-pink-100 border-primary/30 text-pink-800 dark:bg-pink-900/40 dark:border-primary/40 dark:text-pink-200 [a&]:hover:bg-pink-200/80 [a&]:dark:hover:bg-pink-900/60',
        'soft-rose':
          'bg-rose-100 border-destructive/30 text-rose-800 dark:bg-rose-900/40 dark:border-destructive/40 dark:text-rose-200 [a&]:hover:bg-rose-200/80 [a&]:dark:hover:bg-rose-900/60',
        'soft-slate':
          'bg-slate-100 border-border/70 text-slate-800 dark:bg-slate-900/40 dark:border-border/70 dark:text-slate-200 [a&]:hover:bg-slate-200/80 [a&]:dark:hover:bg-slate-900/60',
        'soft-gray':
          'bg-gray-100 border-border/70 text-gray-800 dark:bg-gray-900/40 dark:border-border/70 dark:text-gray-200 [a&]:hover:bg-gray-200/80 [a&]:dark:hover:bg-gray-900/60',
        'soft-zinc':
          'bg-zinc-100 border-border/70 text-zinc-800 dark:bg-zinc-900/40 dark:border-border/70 dark:text-zinc-200 [a&]:hover:bg-zinc-200/80 [a&]:dark:hover:bg-zinc-900/60',
        'soft-stone':
          'bg-stone-100 border-border/70 text-stone-800 dark:bg-stone-900/40 dark:border-border/70 dark:text-stone-200 [a&]:hover:bg-stone-200/80 [a&]:dark:hover:bg-stone-900/60',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
)

function Badge({
  className,
  variant,
  asChild = false,
  ...props
}: React.ComponentProps<'span'> & VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot : 'span'

  return <Comp data-slot="badge" className={cn(badgeVariants({ variant }), className)} {...props} />
}

export { Badge, badgeVariants }
