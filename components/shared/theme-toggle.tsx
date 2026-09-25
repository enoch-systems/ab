'use client';

import { useState, useEffect } from 'react';
import { Moon, Sun } from 'lucide-react';
import { useTheme } from '@/components/providers/theme-provider';
import { cn } from '@/lib/utils';

export function ThemeToggle({ className, size = 'default' }: { className?: string; size?: 'default' | 'sm' }) {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const iconSize = size === 'sm' ? 'w-4 h-4' : 'w-5 h-5';

  const toggle = () => {
    if (!mounted) return;
    setTheme((resolvedTheme ?? theme) === 'dark' ? 'light' : 'dark');
  };

  return (
    <button
      type="button"
      onClick={toggle}
      className={cn(
        "inline-flex items-center justify-center rounded-full border border-border bg-background/60 backdrop-blur text-foreground hover:text-primary hover:bg-accent/10 boty-transition cursor-pointer",
        size === 'sm' ? 'w-8 h-8' : 'w-9 h-9',
        className,
      )}
      aria-label="Toggle theme"
      title={mounted ? `Switch to ${(resolvedTheme ?? theme) === 'dark' ? 'light' : 'dark'} mode` : 'Toggle theme'}
    >
      {!mounted ? (
        <Sun className={cn(iconSize, 'opacity-60')} />
      ) : (resolvedTheme ?? theme) === 'dark' ? (
        <Moon className={iconSize} />
      ) : (
        <Sun className={iconSize} />
      )}
    </button>
  );
}
