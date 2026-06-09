# Sprint backlog

Lightweight log of known follow-ups. Not urgent; pick up when scheduling the next sprint.

---

## Currency & international visitors

### Booking modal bypasses viewer-currency conversion

**File:** `components/booking-modal.tsx` (estimated total row)

**Current behaviour:** Renders `{calculateTotal().toFixed(2)} {gym.currency}` — native gym currency only, no `convertPrice` / `selectedCurrency` from `useCurrency`.

**Why it exists:** Likely intentional for checkout/ops clarity (amount gym records). Rest of the public site uses `formatPrice(convertPrice(amount, gym.currency))` via `CurrencyProvider`.

**Problem:** Inconsistent UX. International visitors with AUD/USD/GBP selected in the navbar can still see raw THB (or wrong scale if `gym.currency` is mis-set) in this modal.

**Suggested fix:** Use the same pattern as `packages-list.tsx` and checkout pages — `formatPrice(convertPrice(total, gym.currency))`. Optionally show native amount as secondary text when `gym.currency !== selectedCurrency` (see `useViewerMoneyFormatter` / `recordedNote` in `lib/hooks/use-viewer-money.ts`).

**Priority:** Low — not blocking checkout; matters more as international traffic grows.

**Logged:** 2026-06-09
