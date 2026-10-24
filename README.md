# VETRA website and CMS

The VETRA studio website has Thai and English public pages, a project portfolio, and a private CMS for portfolio, account, and payment request management. See [the project brief](docs/PROJECT.md) for current scope, [CMS guidance](docs/CMS.md) for Trash behavior, [Cloudinary setup](docs/CLOUDINARY_SETUP.md) for project images, and [payment setup](docs/PAYMENT_SETUP.md) for Stripe configuration.

## Local setup

1. Install dependencies with `npm ci`.
2. Copy `.env.example` to `.env.local`. Set `MONGODB_URI` with an explicit database name and a strong `AUTH_SECRET`. The migrated portfolio images load from Cloudinary without API credentials; set its cloud name, API key, and API secret to enable new CMS uploads.
3. Start the app with `npm run dev`. Open `http://localhost:3000` for the website and `/admin/login` for the CMS.
4. If the selected database has no users, create the first administrator with `npm run admin:create-first -- --expected-db=vetra --username=YOUR_USERNAME --email=YOUR_EMAIL`. The command checks the database name, refuses to run when any account exists, and prints a generated temporary password once. Sign in with the username or email, then change the password from **Users → your account**. The guarded `CMS_BOOTSTRAP_TOKEN` endpoint remains available as an alternative for creating a first `dev` account; remove that token after setup.

Run `npm run check` before release. It runs ESLint, TypeScript typechecking, and a production build. `npm run test:cms` exercises CMS routes with an isolated in-memory database; `npm run test:cms-media` checks staged Cloudinary uploads and cleanup with a provider stub; `npm run verify:cloudinary` uses configured credentials for one disposable upload, delivery check, and cleanup against an isolated database; `npm run test:users` checks account safety and Trash rules; `npm run test:payments` checks payment state and provider responses using an injected stub; `npm run test:payment-routes` checks payment HTTP permissions and unavailable checkout. `npm run dev:cms-test` and `npm run dev:payments-test` keep isolated preview apps available at `http://127.0.0.1:43187` and `http://127.0.0.1:43188`, respectively. Run one preview at a time because they share Next.js build output.

## Deployment notes

Set the same required environment values on the host. Production `MONGODB_URI` must select the populated `vetra` database on the intended Atlas cluster; a different cluster or an omitted database name will not contain the migrated portfolio. New CMS image uploads need Cloudinary credentials for the account holding the portfolio images. The optional Analytics view uses the GA4 variables in `.env.example`. Payment checkout is off by default and requires the server-only Stripe values described in [payment setup](docs/PAYMENT_SETUP.md). On Vercel, `vercel.json` runs the daily Trash expiry route; set `CRON_SECRET` so that route can authenticate. The CMS can also remove confirmed unreferenced uploads through its manual Cleanup action.
