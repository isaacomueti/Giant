/** "₦25,000,000" or "₦1,234.56". Input is integer kobo. */
export function formatNaira(kobo: number): string {
  const sign = kobo < 0 ? '-' : '';
  const abs = Math.abs(kobo);
  const naira = Math.trunc(abs / 100);
  const rest = abs % 100;
  const cents = rest ? `.${String(rest).padStart(2, '0')}` : '';
  return `${sign}₦${naira.toLocaleString('en-NG')}${cents}`;
}

/** Compact form for tight spaces: "₦15m", "₦450k", "₦800". */
export function formatNairaShort(kobo: number): string {
  const sign = kobo < 0 ? '-' : '';
  const naira = Math.abs(kobo) / 100;
  const trim = (n: number) => String(Math.round(n * 10) / 10);
  if (naira >= 1_000_000_000) return `${sign}₦${trim(naira / 1_000_000_000)}bn`;
  if (naira >= 1_000_000) return `${sign}₦${trim(naira / 1_000_000)}m`;
  if (naira >= 1_000) return `${sign}₦${trim(naira / 1_000)}k`;
  return `${sign}₦${Math.round(naira)}`;
}
