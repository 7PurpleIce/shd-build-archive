/** Stored base values use commas as thousands separators, e.g. +170,000. */
export function prototypeValue(base: string, locale: 'en' | 'ru') {
  const amount = Number(base.replace(/[+,%]/g, ''));
  const formatted = new Intl.NumberFormat(locale, {maximumFractionDigits: 2}).format(amount * 1.5);
  return `+${formatted}${base.endsWith('%') ? '%' : ''}`;
}
