import type { DateValue } from './schema';

/** Human label for a date of any precision, formatted for the experience locale. */
export function formatDate(value: DateValue | undefined, locale: string): string | null {
  if (!value) return null;
  switch (value.precision) {
    case 'day': {
      const [y, m, d] = value.date.split('-').map(Number);
      const date = new Date(Date.UTC(y ?? 1970, (m ?? 1) - 1, d ?? 1));
      return new Intl.DateTimeFormat(locale, {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        timeZone: 'UTC',
      }).format(date);
    }
    case 'month': {
      const date = new Date(Date.UTC(value.year, value.month - 1, 1));
      return new Intl.DateTimeFormat(locale, {
        month: 'long',
        year: 'numeric',
        timeZone: 'UTC',
      }).format(date);
    }
    case 'year':
      return String(value.year);
    case 'approximate':
      return value.label;
  }
}

/** Short, large-format marker used in editorial layouts (usually the year). */
export function dateMarker(value: DateValue | undefined): string | null {
  if (!value) return null;
  switch (value.precision) {
    case 'day':
      return value.date.slice(0, 4);
    case 'month':
    case 'year':
      return String(value.year);
    case 'approximate':
      return value.sortKey?.slice(0, 4) ?? null;
  }
}

/** Sort key; undated items sort last while keeping their configured order. */
export function dateSortKey(value: DateValue | undefined): string {
  if (!value) return '￿';
  switch (value.precision) {
    case 'day':
      return value.date;
    case 'month':
      return `${value.year}-${String(value.month).padStart(2, '0')}`;
    case 'year':
      return String(value.year);
    case 'approximate':
      return value.sortKey ?? '￿';
  }
}

/** Machine-readable value for <time dateTime>, when one exists. */
export function dateTimeAttr(value: DateValue | undefined): string | undefined {
  if (!value) return undefined;
  switch (value.precision) {
    case 'day':
      return value.date;
    case 'month':
      return `${value.year}-${String(value.month).padStart(2, '0')}`;
    case 'year':
      return String(value.year);
    case 'approximate':
      return undefined;
  }
}
