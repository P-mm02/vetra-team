# Payment setup

VETRA payment requests use Stripe Checkout for THB payments. Bangkok Bank Merchant iPay remains unconfigured until its official integration details and credentials are available. Payment requests and attempts are stored in MongoDB; the public payment link is `/pay/{token}?lang=th` or `?lang=en`. A return from Stripe is only a navigation step. The app marks a payment request paid after a verified Stripe webhook or server-side lookup.

## Using the CMS

1. Open **Payments → Create payment link** (`/admin/cms/payments/new`) as an administrator or developer.
2. Choose service or product, enter the agreed THB amount and title, and select Stripe. Description, customer name/email, reference, and internal note are optional. Choose a 7, 14, 30, or 90 day lifetime.
3. Save the request, then use **Copy** or **Download PNG** to share its link or QR code. The QR opens the same customer payment page. Localhost links work only on your computer; use the configured public HTTPS website when sharing with customers.
4. Review its status in **Payments**. **Refresh provider status** checks Stripe when an attempt exists. A return to the website alone does not prove payment.

Request details are fixed after creation. To change them, cancel an unpaid link and create a new request. Cancellation closes checkout; it does not issue a refund. Payment records remain available for reference. This feature handles one-time payments for an agreed service or product; stock, delivery, tax invoices, refunds, and subscriptions are not automated.

Customer names, emails, and internal notes are kept out of the public payment response. The title, description, amount, and reference are visible to anyone who has the link. Test requests remain test requests after switching the server to live mode; create new live requests when ready.

## Local configuration

1. If the repository has no `.env.local`, copy `.env.example` to **`.env.local`**. Otherwise, add the payment settings to the existing `.env.local` without replacing its current values. Next.js reads `.env.local`; `local.env` is a different filename.
2. Configure `MONGODB_URI`, `AUTH_SECRET`, and `NEXT_PUBLIC_SITE_URL` as described in the README. For local payment testing, set `NEXT_PUBLIC_SITE_URL=http://127.0.0.1:3000` if the app is served there.
3. In a Stripe sandbox, get a **test** secret key from [API keys](https://docs.stripe.com/keys). Keep it server-side as `STRIPE_SECRET_KEY`. Set `STRIPE_MODE=test` and `PAYMENTS_ENABLED=true` only when ready to test checkout. A test key begins with `sk_test_`.
4. Install and sign in to the [Stripe CLI](https://docs.stripe.com/cli/install) with `stripe login`. Start the app (`npm run dev`) and run a second terminal:

   ```text
   stripe listen --forward-to http://127.0.0.1:3000/api/payments/webhooks/stripe
   ```

5. Copy the `whsec_` signing secret printed by that CLI session into `STRIPE_WEBHOOK_SECRET` in `.env.local`, then restart the app. The CLI secret is specific to its local listener; use the deployed endpoint's own secret in deployment. Stripe's [webhook guide](https://docs.stripe.com/webhooks) explains local forwarding and signature verification.
6. Sign in as a `dev` or `admin`, create a payment request in the CMS, open its public link, and complete checkout with a [Stripe test payment method](https://docs.stripe.com/testing). Confirm the app records `paid` only after the verified provider result is processed.

If any checkout setting is missing, payment requests can still be created as records, but checkout stays unavailable. The CMS reports configuration issues. The server verifies the configured secret key's mode and requires a webhook secret and a valid site URL before starting checkout. `PAYMENTS_ENABLED` defaults to off.

## Deployment

Set `MONGODB_URI`, `AUTH_SECRET`, `NEXT_PUBLIC_SITE_URL`, `PAYMENTS_ENABLED`, `STRIPE_MODE`, `STRIPE_SECRET_KEY`, and `STRIPE_WEBHOOK_SECRET` in the hosting platform's server environment. Never put the Stripe secret key or webhook signing secret in `NEXT_PUBLIC_` variables, source control, or browser code. Stripe has separate [sandbox and live keys](https://docs.stripe.com/keys); keep records and credentials in their matching mode. Live checkout requires an HTTPS, non-localhost site URL and a production runtime.

Register an HTTPS webhook destination for `https://<your-domain>/api/payments/webhooks/stripe` in [Stripe Workbench](https://docs.stripe.com/webhooks). Subscribe to `checkout.session.completed`, `checkout.session.async_payment_succeeded`, `checkout.session.async_payment_failed`, and `checkout.session.expired`, and use that destination's `whsec_` secret for `STRIPE_WEBHOOK_SECRET`. Test the deployed endpoint and a complete sandbox payment before setting `STRIPE_MODE=live`, switching to a live key and live webhook secret, and enabling real checkout. The handler uses the raw request body and signature; preserve those when changing hosting or proxy settings.

The app stores THB as the charged currency. Allowed amounts are ฿10.00–฿999,999.99 with at most two decimal places. The server owns the amount and status; a customer cannot edit either through the public link. Separate attempts and provider idempotency protect retries, and an unknown provider outcome must be resolved before a new attempt is made. See [Stripe's idempotency reference](https://docs.stripe.com/api/idempotent_requests) and [Checkout fulfillment guidance](https://docs.stripe.com/checkout/fulfillment?ui=full-page).

## Checks

- `npm run test:payments` uses an isolated temporary MongoDB and an injected provider stub. It does not use Stripe credentials or make Stripe API calls.
- `npm run test:payment-routes` checks HTTP authorization and disabled-checkout behavior against a separate local server and temporary database at `127.0.0.1:43188`.
- `npm run dev:payments-test` runs those route checks, then keeps that isolated server open for manual payment-page review. Test accounts are printed in its terminal. It has no Stripe keys, so checkout remains disabled.
- Stripe sandbox and CLI testing verifies the real provider integration, webhook signature, and customer return flow. The automated stub test does not replace this check.
- `npm run check` runs lint, typecheck, and the production build.

Do not use real customer or card data in local or sandbox testing.
