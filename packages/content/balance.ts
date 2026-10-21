// Every balance number for the game lives here. Systems in @giant/sim read from
// this file and never hard-code tuning values. Money is integer kobo (₦1 = 100 kobo).

/** Convert whole naira to kobo. Only use with integer naira. */
export const naira = (amount: number): number => amount * 100;
