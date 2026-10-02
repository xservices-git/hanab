import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-semibold shadow-sm ring-offset-background transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: { default: 'bg-gradient-to-r from-blue-700 to-sky-600 text-white hover:from-blue-800 hover:to-sky-700 hover:shadow-md', destructive: 'bg-gradient-to-r from-red-600 to-rose-600 text-white hover:from-red-700 hover:to-rose-700 hover:shadow-md', outline: 'border border-blue-200 bg-white text-blue-700 hover:border-blue-300 hover:bg-blue-50 hover:shadow-md', secondary: 'bg-slate-100 text-slate-900 hover:bg-slate-200', ghost: 'bg-transparent text-slate-700 shadow-none hover:bg-slate-100', link: 'text-blue-700 underline-offset-4 shadow-none hover:underline' },
      size: { default: 'h-11 px-5 py-2.5', sm: 'h-9 rounded-lg px-3.5', lg: 'h-12 rounded-2xl px-8', icon: 'h-10 w-10' },
    },
    defaultVariants: { variant: 'default', size: 'default' },
  },
);

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(({ className, variant, size, asChild = false, ...props }, ref) => {
  const Comp = asChild ? Slot : 'button';
  return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />;
});
Button.displayName = 'Button';

export { Button, buttonVariants };
