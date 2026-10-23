# VETRA website and CMS

The VETRA studio website has Thai and English public pages, a project portfolio, and a private CMS for portfolio, account, and payment request management. See [the project brief](docs/PROJECT.md) for current scope, [CMS guidance](docs/CMS.md) for Trash behavior, and [payment setup](docs/PAYMENT_SETUP.md) for Stripe configuration.

## Local setup

1. Install dependencies with `npm ci`.
2. Copy `.env.example` to `.env.local`. Set `MONGODB_URI` and a strong `AUTH_SECRET`. Existing portfolio images work without Cloudinary; add its three credentials to enable new uploads.
3. Start the app with `npm run dev`. Open `http://localhost:3000` for the website and `/admin/login` for the CMS.
4. If the database has no users, set a temporary `CMS_BOOTSTRAP_TOKEN` of at least 12 characters and create the first `dev` account through `POST /api/admin/bootstrap` with an `x-bootstrap-token` header and JSON `username`, `email`, and `password` (at least 10 characters). Remove the token after setup.

Run `npm run check` before release. It runs ESLint, TypeScript typechecking, and a production build. `npm run test:cms` exercises CMS routes with an isolated in-memory database; `npm run test:users` checks account safety and Trash rules; `npm run test:payments` checks payment state and provider responses using an injected stub; `npm run test:payment-routes` checks payment HTTP permissions and unavailable checkout. `npm run dev:cms-test` and `npm run dev:payments-test` keep isolated preview apps available at `http://127.0.0.1:43187` and `http://127.0.0.1:43188`, respectively. Run one preview at a time because they share Next.js build output.

## Deployment notes

Set the same required environment values on the host. New CMS image uploads need Cloudinary credentials. The optional Analytics view uses the GA4 variables in `.env.example`. Payment checkout is off by default and requires the server-only Stripe values described in [payment setup](docs/PAYMENT_SETUP.md). On Vercel, `vercel.json` runs the daily Trash expiry route; set `CRON_SECRET` so that route can authenticate. The CMS can also remove confirmed unreferenced uploads through its manual Cleanup action.
