/**
 * Canonical Pro pricing, in whole US dollars.
 *
 * The marketing page and the in-app billing UI both read from here so the
 * two can't drift apart — keep these in step with the amounts on the Stripe
 * prices themselves.
 *
 * Deliberately free of any Stripe SDK import so the marketing page can use
 * it without pulling the SDK into its bundle.
 */
export const PRO_PRICE_USD = {
  monthly: 4,
  yearly: 40,
} as const;

export type BillingInterval = keyof typeof PRO_PRICE_USD;

/** Months of the monthly rate you skip by paying for a year up front. */
export const YEARLY_MONTHS_FREE =
  (PRO_PRICE_USD.monthly * 12 - PRO_PRICE_USD.yearly) / PRO_PRICE_USD.monthly;
