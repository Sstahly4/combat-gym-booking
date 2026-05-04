# Ops runbook: platform payouts (Wise / manual ledger)

Internal only. Partner Hub owners see derived balances; **this** is how we record what actually left the platform.

## Two ways to record a batch

### A. Pending Wise transfer (recommended when money is in flight)

Use when you have initiated a Wise outbound transfer and want **Balances → Paid out** to flip **automatically** when Wise finishes.

1. **Admin UI:** `/admin/platform-payouts` → _Record as: Pending Wise transfer_.
2. **API:** `POST /api/admin/gym-platform-payouts` with JSON:
   - `gym_id` (UUID)
   - `booking_ids` (array of UUIDs — host share lines included in this transfer)
   - `status`: `"pending"`
   - `external_reference`: **Wise transfer id** (same id Wise shows on the transfer; string or number as string)
   - `rail`: `"wise"` (default) or `"manual"` / `"other"`
   - `amount`, `currency`: optional; `amount` defaults to sum of booking net shares and must match if supplied.

3. We insert `gym_platform_payouts` with `metadata.booking_ids` and **do not** set `bookings.platform_paid_out_at` yet.

4. **Wise webhook:** subscribe in the Wise dashboard to **`transfers#state-change`** for your profile/application, delivery URL:

   `https://<your-production-domain>/api/webhooks/wise`

5. When Wise reaches terminal success **`outgoing_payment_sent`**, the webhook completes the row and marks those bookings paid out. Terminal failures (`bounced_back`, `cancelled`, `funds_refunded`, `charged_back`) mark the payout **`failed`**; bookings stay payable for reconciliation.

### B. Completed immediately (manual / already settled)

Use when the money already hit the host bank and you want the ledger updated **now** (no webhook).

- Same `POST /api/admin/gym-platform-payouts` with **`status` omitted** or `"completed"`.
- Or **Admin UI** → _Record as: Completed (paid out now)_.

## Webhook verification (production)

- Requests are signed; we verify **`X-Signature-SHA256`** (RSA-SHA256 over the **raw body**).
- Default public key is chosen from **`WISE_API_BASE`** (sandbox vs live). Override with **`WISE_WEBHOOK_SIGNING_PUBLIC_KEY`** if needed.
- **Never** enable `WISE_WEBHOOK_SKIP_SIGNATURE_VERIFY` outside local dev.

## Stripe Connect

Listings on **`payout_rail = stripe_connect`** do **not** use this ledger for balances — Stripe Connect balances stay live from Stripe. Do not POST platform batches for those gyms (API returns 409).

## Support

- Wise webhook event catalogue: https://api-docs.wise.com/api-docs/webhooks-notifications/event-types  
- Transfer statuses: https://api-docs.wise.com/guides/product/send-money/tracking-transfers  
