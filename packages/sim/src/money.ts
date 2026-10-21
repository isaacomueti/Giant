export type AccountId = 'treasury' | 'personal';

export type LedgerCategory =
  'ward_allocation' | 'staff_salaries' | 'councillor_salary' | 'living_costs' | 'siphon';

export interface LedgerEntry {
  month: number;
  category: LedgerCategory;
  /** Signed integer kobo: positive is money in, negative is money out. */
  amountKobo: number;
  memo: string;
}

export interface Account {
  openingKobo: number;
  balanceKobo: number;
  ledger: LedgerEntry[];
}

export function assertKobo(value: number, label = 'amount'): void {
  if (!Number.isSafeInteger(value)) {
    throw new Error(`${label} must be integer kobo, got ${value}`);
  }
}

export function openAccount(openingKobo: number): Account {
  assertKobo(openingKobo, 'opening balance');
  return { openingKobo, balanceKobo: openingKobo, ledger: [] };
}

/** Returns a new account with the entry posted. Never mutates. */
export function post(account: Account, entry: LedgerEntry): Account {
  assertKobo(entry.amountKobo, entry.category);
  return {
    ...account,
    balanceKobo: account.balanceKobo + entry.amountKobo,
    ledger: [...account.ledger, entry],
  };
}

export function ledgerTotal(account: Account): number {
  return account.ledger.reduce((sum, e) => sum + e.amountKobo, 0);
}

/** True when the balance equals the opening balance plus every ledger entry. */
export function isBalanced(account: Account): boolean {
  return account.balanceKobo === account.openingKobo + ledgerTotal(account);
}
