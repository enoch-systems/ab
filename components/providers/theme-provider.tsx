'use client'

import * as React from 'react'
import { usePathname } from 'next/navigation'

export type Theme = 'light' | 'dark'
export type ThemeScope = 'site' | 'admin' | 'customer'

/** Legacy public-site key retained for existing visitors. */
export const THEME_STORAGE_KEY = 'theme'

export const THEME_SCOPE_STORAGE_KEYS: Record<ThemeScope, string> = {
  site: 'theme-site',
  admin: 'theme-admin',
  customer: 'theme-customer',
}

export function getThemeScope(pathname: string | null | undefined): ThemeScope {
  if (pathname?.startsWith('/admin')) return 'admin'
  if (pathname?.startsWith('/customer')) return 'customer'
  return 'site'
}

export function getThemeStorageKey(scope: ThemeScope): string {
  return THEME_SCOPE_STORAGE_KEYS[scope]
}

/** First-time visitors get dark mode; only an explicit "light" choice wins. */
export const DEFAULT_THEME: Theme = 'dark'

/**
 * Applies the persisted theme before first paint so a dark-mode visitor never
 * sees a flash of the light theme.
 *
 * This string is injected by the root layout (`app/layout.tsx`) rather than by
 * a component, because it has to reach the initial HTML: by the time any
 * `useEffect` runs the browser has already painted the wrong theme.
 *
 * Note that "React logs it was handed a `<script>` tag" is *not* fixed by that
 * placement — React 19 skips client-rendered scripts no matter where they live,
 * and it only ever renders this one on the client if the tree gets re-rendered
 * after a hydration failure. Keep SSR output deterministic (see
 * `lib/date-format.ts`) and the warning cannot surface.
 */
export const THEME_INIT_SCRIPT = `(function(){try{var p=window.location.pathname||"";var k=p.indexOf("/admin")===0?${JSON.stringify(THEME_SCOPE_STORAGE_KEYS.admin)}:p.indexOf("/customer")===0?${JSON.stringify(THEME_SCOPE_STORAGE_KEYS.customer)}:${JSON.stringify(THEME_SCOPE_STORAGE_KEYS.site)};var t=localStorage.getItem(k);if(t!=="light"&&t!=="dark"&&k===${JSON.stringify(THEME_SCOPE_STORAGE_KEYS.site)}){t=localStorage.getItem(${JSON.stringify(THEME_STORAGE_KEY)})}var d=t!=="light";var r=document.documentElement;r.classList.toggle("dark",d);r.style.colorScheme=d?"dark":"light"}catch(e){}})()`

type ThemeContextValue = {
  theme: Theme
  resolvedTheme: Theme
  setTheme: (theme: Theme) => void
  toggleTheme: () => void
}

const ThemeContext = React.createContext<ThemeContextValue | null>(null)

const noop = () => {}

/** Mirrors the inline script's effect, but for runtime switches. */
function applyTheme(theme: Theme) {
  const root = document.documentElement
  root.classList.toggle('dark', theme === 'dark')
  root.style.colorScheme = theme
}

/**
 * Applies a theme with CSS transitions suppressed for one frame, so flipping
 * dark mode doesn't animate every colour on the page.
 * (next-themes called this `disableTransitionOnChange`.)
 */
function applyThemeWithoutTransitions(theme: Theme) {
  const style = document.createElement('style')
  style.appendChild(
    document.createTextNode(
      '*,*::before,*::after{transition:none!important;-webkit-transition:none!important}',
    ),
  )
  document.head.appendChild(style)

  applyTheme(theme)

  // Reading a computed style flushes the change while transitions are still
  // disabled, so the browser commits it as a single frame.
  void window.getComputedStyle(document.body).opacity

  window.setTimeout(() => style.remove(), 1)
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const scope = getThemeScope(pathname);
  const storageKey = getThemeStorageKey(scope);
  const [theme, setThemeState] = React.useState<Theme>(DEFAULT_THEME);

  // The inline head script has already put the right class on <html>; this
  // syncs React's copy of the active route scope so its toggle shows the
  // correct icon. A route change (for example admin -> customer) loads that
  // scope's independent preference.
  React.useEffect(() => {
    let initial: Theme = DEFAULT_THEME;
    try {
      let stored = window.localStorage.getItem(storageKey);
      if (scope === 'site' && (stored !== 'light' && stored !== 'dark')) {
        stored = window.localStorage.getItem(THEME_STORAGE_KEY);
      }
      if (stored === 'light' || stored === 'dark') initial = stored;
    } catch {
      /* storage unavailable (private mode / blocked) — keep the default */
    }
    setThemeState(initial);
    applyTheme(initial);
  }, [scope, storageKey]);

  const setTheme = React.useCallback((next: Theme) => {
    setThemeState(next);
    try {
      window.localStorage.setItem(storageKey, next);
      // Keep the original public-site preference current for older code.
      if (scope === 'site') window.localStorage.setItem(THEME_STORAGE_KEY, next);
    } catch {
      /* storage unavailable — the theme still applies for this session */
    }
    applyThemeWithoutTransitions(next);
  }, [scope, storageKey]);

  const toggleTheme = React.useCallback(() => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  }, [theme, setTheme]);

  const value = React.useMemo<ThemeContextValue>(
    () => ({ theme, resolvedTheme: theme, setTheme, toggleTheme }),
    [theme, setTheme, toggleTheme],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export function useTheme(): ThemeContextValue {
  const context = React.useContext(ThemeContext)
  // No-op fallback outside the provider, so a misplaced consumer still renders
  // instead of crashing the tree.
  return (
    context ?? {
      theme: DEFAULT_THEME,
      resolvedTheme: DEFAULT_THEME,
      setTheme: noop,
      toggleTheme: noop,
    }
  )
}
