'use client';

import { Fragment, useState } from 'react';
import { Check, Copy } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

/** All tracking-number formats the app has produced (US + legacy prefixes). */
const TRACKING_PATTERN = /\b(?:US|LGX|LGS|NG|NGX)\d{6,12}\b/gi;
const TRACKING_TEST = /\b(?:US|LGX|LGS|NG|NGX)\d{6,12}\b/i;

export function CopyTrackingId({ value, className, label = 'Copy tracking ID' }: { value: string; className?: string; label?: string }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
      toast.success('Tracking ID copied');
    } catch {
      toast.error('Clipboard access is blocked in this browser.');
    }
  };
  return (
    <button type="button" onClick={(event) => { event.preventDefault(); event.stopPropagation(); void copy(); }} aria-label={label} title={label} className={cn('inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-border bg-background text-muted-foreground transition hover:border-primary/40 hover:bg-primary/5 hover:text-primary', className)}>
      {copied ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
    </button>
  );
}

/**
 * Inline tracking number + copy chip, to sit directly next to the number —
 * never a whole-message / whole-row copy.
 */
export function trackingText(value: string): React.ReactNode {
  return (
    <span className="inline-flex items-center gap-1 font-mono whitespace-nowrap">
      <span className="font-semibold text-primary">{value}</span>
      <CopyTrackingId value={value} className="!h-6 !w-6 !rounded-md" />
    </span>
  );
}

/** Split arbitrary text and attach a copy chip right next to every tracking number it contains. */
export function richTrackingText(text: string): React.ReactNode {
  if (!text) return text;
  if (!TRACKING_TEST.test(text)) return text;
  const matches = text.match(TRACKING_PATTERN) ?? [];
  const parts = text.split(TRACKING_PATTERN);
  const nodes: React.ReactNode[] = [];
  for (let i = 0; i < parts.length; i++) {
    if (parts[i]) nodes.push(parts[i]);
    if (i < matches.length) nodes.push(<Fragment key={`tn-${i}`}>{trackingText(matches[i])}</Fragment>);
  }
  return nodes;
}
