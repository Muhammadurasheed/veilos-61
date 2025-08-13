import { cn } from '@/lib/utils';
import { ReactNode } from 'react';

interface ResponsiveGridProps {
  children: ReactNode;
  cols?: {
    default?: number;
    sm?: number;
    md?: number;
    lg?: number;
    xl?: number;
  };
  gap?: number;
  className?: string;
}

export function ResponsiveGrid({ 
  children, 
  cols = { default: 1, sm: 2, md: 3, lg: 4 }, 
  gap = 4,
  className 
}: ResponsiveGridProps) {
  const gridClasses = cn(
    'grid',
    `gap-${gap}`,
    cols.default && `grid-cols-${cols.default}`,
    cols.sm && `sm:grid-cols-${cols.sm}`,
    cols.md && `md:grid-cols-${cols.md}`,
    cols.lg && `lg:grid-cols-${cols.lg}`,
    cols.xl && `xl:grid-cols-${cols.xl}`,
    className
  );

  return (
    <div className={gridClasses}>
      {children}
    </div>
  );
}

interface ResponsiveStackProps {
  children: ReactNode;
  direction?: 'vertical' | 'horizontal' | 'responsive';
  gap?: number;
  align?: 'start' | 'center' | 'end' | 'stretch';
  className?: string;
}

export function ResponsiveStack({ 
  children, 
  direction = 'vertical',
  gap = 4,
  align = 'start',
  className 
}: ResponsiveStackProps) {
  const stackClasses = cn(
    'flex',
    direction === 'vertical' && 'flex-col',
    direction === 'horizontal' && 'flex-row',
    direction === 'responsive' && 'flex-col sm:flex-row',
    `gap-${gap}`,
    align === 'center' && 'items-center',
    align === 'end' && 'items-end',
    align === 'stretch' && 'items-stretch',
    className
  );

  return (
    <div className={stackClasses}>
      {children}
    </div>
  );
}

// Mobile-first responsive container
export function ResponsiveContainer({ 
  children, 
  maxWidth = '7xl',
  padding = true,
  className 
}: {
  children: ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl' | '6xl' | '7xl';
  padding?: boolean;
  className?: string;
}) {
  return (
    <div className={cn(
      'mx-auto w-full',
      `max-w-${maxWidth}`,
      padding && 'px-4 sm:px-6 lg:px-8',
      className
    )}>
      {children}
    </div>
  );
}