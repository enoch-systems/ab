'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowUpDown, Check, ChevronsUpDown, MapPin, Search, UserRound, X } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import type { Customer } from '@/lib/types';

type SortMode = 'newest' | 'oldest' | 'name';

const SORTS: { id: SortMode; label: string }[] = [
  { id: 'newest', label: 'Newest' },
  { id: 'oldest', label: 'Oldest' },
  { id: 'name', label: 'A–Z' },
];

const formatDate = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

const initials = (name: string) =>
  name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('') || '?';

/* Highlights the matched substring so admins can see why a row matched. */
const Highlight = ({ text, query }: { text: string; query: string }) => {
  const needle = query.trim().toLowerCase();
  if (!needle) return <>{text}</>;
  const index = text.toLowerCase().indexOf(needle);
  if (index === -1) return <>{text}</>;
  return (
    <>
      {text.slice(0, index)}
      <mark className="rounded bg-primary/20 px-0.5 font-semibold text-foreground">
        {text.slice(index, index + needle.length)}
      </mark>
      {text.slice(index + needle.length)}
    </>
  );
};
interface CustomerComboboxProps {
  customers: Customer[];
  value: string;
  onChange: (email: string) => void;
  selected: Customer | undefined;
  id?: string;
}

export function CustomerCombobox({ customers, value, onChange, selected, id = 'customer-email' }: CustomerComboboxProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState<SortMode>('newest');
  const [activeIndex, setActiveIndex] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  /* Newest registrations first by default — whoever just signed up is almost
     always the customer an admin is looking for. */
  const results = useMemo(() => {
    const needle = query.trim().toLowerCase();
    const matched = needle
      ? customers.filter(
          (item) =>
            item.email.toLowerCase().includes(needle) ||
            item.fullName.toLowerCase().includes(needle) ||
            item.city.toLowerCase().includes(needle),
        )
      : customers;

    return [...matched].sort((a, b) => {
      if (sort === 'name') return a.fullName.localeCompare(b.fullName);
      const aTime = new Date(a.createdAt).getTime() || 0;
      const bTime = new Date(b.createdAt).getTime() || 0;
      return sort === 'oldest' ? aTime - bTime : bTime - aTime;
    });
  }, [customers, query, sort]);

  useEffect(() => {
    setActiveIndex(0);
  }, [query, sort]);

  /* Close on outside click so the list never traps the admin. */
  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onPointerDown);
    return () => document.removeEventListener('mousedown', onPointerDown);
  }, [open]);

  /* Keep the highlighted row scrolled into view during keyboard navigation. */
  useEffect(() => {
    if (!open) return;
    listRef.current?.querySelector('[data-active="true"]')?.scrollIntoView({ block: 'nearest' });
  }, [activeIndex, open]);

  const pick = (item: Customer) => {
    onChange(item.email);
    setQuery('');
    setOpen(false);
    inputRef.current?.blur();
  };

  const onKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      if (!open) {
        setOpen(true);
        return;
      }
      setActiveIndex((current) => {
        const next = event.key === 'ArrowDown' ? current + 1 : current - 1;
        if (next < 0) return Math.max(results.length - 1, 0);
        if (next >= results.length) return 0;
        return next;
      });
      return;
    }
    if (event.key === 'Enter') {
      if (open && results[activeIndex]) {
        event.preventDefault();
        pick(results[activeIndex]);
      }
      return;
    }
    if (event.key === 'Escape') {
      setOpen(false);
      return;
    }
    if (event.key === 'Backspace' && value && !query) onChange('');
  };

  const statusClass = (status: Customer['accountStatus']) =>
    status === 'Active'
      ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
      : status === 'Pending'
        ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
        : 'bg-destructive/10 text-destructive';

  return (
    <div ref={rootRef} className="relative min-w-0">
      <Label htmlFor={id} className="mb-2 block">
        Registered customer email
      </Label>

      <div className="relative min-w-0">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 shrink-0 text-muted-foreground" />
        <input
          ref={inputRef}
          id={id}
          type="text"
          role="combobox"
          aria-expanded={open}
          aria-controls={`${id}-listbox`}
          aria-autocomplete="list"
          aria-activedescendant={open && results[activeIndex] ? `${id}-option-${results[activeIndex].id}` : undefined}
          autoComplete="off"
          inputMode="email"
          value={open ? query : value}
          onChange={(e) => {
            setQuery(e.target.value);
            onChange(e.target.value);
            if (!open) setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKeyDown}
          placeholder="Search by name, email or city…"
          className="h-11 w-full min-w-0 rounded-md border border-input bg-background py-1 pl-9 pr-16 text-sm shadow-xs outline-none transition-[color,box-shadow] focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] sm:h-10"
        />
        {value ? (
          <button
            type="button"
            onClick={() => {
              onChange('');
              setQuery('');
              inputRef.current?.focus();
            }}
            aria-label="Clear customer email"
            className="absolute right-8 top-1/2 inline-flex h-6 w-6 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full text-muted-foreground transition hover:bg-muted hover:text-foreground"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        ) : null}
        <button
          type="button"
          onClick={() => {
            setOpen((current) => !current);
            inputRef.current?.focus();
          }}
          aria-label={open ? 'Close customer list' : 'Open customer list'}
          className="absolute right-2 top-1/2 inline-flex h-6 w-6 -translate-y-1/2 cursor-pointer items-center justify-center rounded text-muted-foreground transition hover:bg-muted hover:text-foreground"
        >
          <ChevronsUpDown className={cn('h-4 w-4 transition-transform duration-200', open && 'rotate-180')} />
        </button>
      </div>

      {open && (
        <div className="absolute left-0 right-0 top-full z-50 mt-2 overflow-hidden rounded-xl border bg-popover shadow-lg">
          <div className="flex items-center gap-1.5 overflow-x-auto border-b px-2 py-2">
            <ArrowUpDown className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
            <span className="mr-1 shrink-0 text-[11px] font-medium text-muted-foreground">Sort</span>
            {SORTS.map((option) => (
              <button
                key={option.id}
                type="button"
                onClick={() => setSort(option.id)}
                className={cn(
                  'h-7 shrink-0 cursor-pointer rounded-md px-2.5 text-xs font-medium transition',
                  sort === option.id
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                )}
              >
                {option.label}
              </button>
            ))}
            <span className="ml-auto shrink-0 pl-2 text-[11px] text-muted-foreground">
              {results.length}/{customers.length}
            </span>
          </div>

          {results.length === 0 ? (
            <div className="flex flex-col items-center gap-1.5 px-4 py-8 text-center">
              <UserRound className="h-6 w-6 text-muted-foreground" />
              <p className="text-sm font-medium">No customer matches “{query}”</p>
              <p className="text-xs text-muted-foreground">Check the spelling, or have them register first.</p>
            </div>
          ) : (
            <ul
              ref={listRef}
              id={`${id}-listbox`}
              role="listbox"
              aria-label="Registered customers"
              className="max-h-64 overflow-y-auto overscroll-contain p-1.5"
            >
              {results.map((item, index) => {
                const isActive = index === activeIndex;
                const isSelected = item.email.toLowerCase() === value.trim().toLowerCase();
                return (
                  <li
                    key={item.id}
                    role="option"
                    aria-selected={isSelected}
                    id={`${id}-option-${item.id}`}
                    data-active={isActive}
                  >
                    <button
                      type="button"
                      onMouseEnter={() => setActiveIndex(index)}
                      onClick={() => pick(item)}
                      className={cn(
                        'flex w-full cursor-pointer items-center gap-3 rounded-lg px-2.5 py-2 text-left transition',
                        isActive ? 'bg-muted' : 'bg-transparent',
                      )}
                    >
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[11px] font-bold text-primary">
                        {initials(item.fullName)}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="flex items-center gap-1.5">
                          <span className="min-w-0 flex-1 truncate text-sm font-medium">
                            <Highlight text={item.fullName} query={query} />
                          </span>
                          <span className={cn('shrink-0 rounded-full px-1.5 py-0.5 text-[10px] font-semibold', statusClass(item.accountStatus))}>
                            {item.accountStatus}
                          </span>
                        </span>
                        <span className="mt-0.5 block truncate text-xs text-muted-foreground">
                          <Highlight text={item.email} query={query} />
                        </span>
                        <span className="mt-0.5 flex items-center gap-2 text-[11px] text-muted-foreground">
                          {item.city ? (
                            <span className="inline-flex min-w-0 items-center gap-1">
                              <MapPin className="h-3 w-3 shrink-0" />
                              <span className="truncate">{item.city}</span>
                            </span>
                          ) : null}
                          <span className="shrink-0">Joined {formatDate(item.createdAt)}</span>
                        </span>
                      </span>
                      {isSelected && <Check className="h-4 w-4 shrink-0 text-primary" />}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}

      <p
        id="customer-email-status"
        aria-live="polite"
        className={cn(
          'mt-2 break-words text-xs',
          selected ? 'text-emerald-600 dark:text-emerald-400' : value ? 'text-rose-600' : 'text-muted-foreground',
        )}
      >
        {selected
          ? `Registered customer found: ${selected.fullName} — recipient auto-filled.`
          : value
            ? 'No registered customer matches this email.'
            : 'Pick an existing customer to auto-fill the recipient, or type to search.'}
      </p>
    </div>
  );
}
