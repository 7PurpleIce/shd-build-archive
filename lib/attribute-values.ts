export const PROTOTYPE_MULTIPLIER = 1.5;

/** Stored base values use commas as thousands separators, e.g. +170,000. */
export function prototypeValue(base: string, locale: 'en' | 'ru') {
  const amount = Number(base.replace(/[+,%]/g, ''));
  const formatted = new Intl.NumberFormat(locale, {maximumFractionDigits: 2}).format(amount * PROTOTYPE_MULTIPLIER);
  return `+${formatted}${base.endsWith('%') ? '%' : ''}`;
}
