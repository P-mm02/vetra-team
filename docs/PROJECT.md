# VETRA website and CMS

## Purpose

VETRA uses this project as its public studio website and portfolio. Visitors can explore services, recent work, project details, and contact information in Thai or English. Authorized staff use the private CMS to maintain the portfolio and user access.

## Current scope

- Public pages: home, about, services, projects, contact, privacy, and terms, with English routes under `/en`.
- Portfolio: preserve the existing project entries and images. The shared portfolio service presents active entries to the public site and the CMS. On first CMS access, it seeds MongoDB from the checked-in project data without overwriting existing records. After initialization, MongoDB is the editable source.
- CMS: Dashboard, Portfolio, Users, Trash, and the existing Analytics view. A hamburger drawer is the CMS navigation at every viewport size. Placeholder modules are excluded from navigation.
- Roles: `viewer` can read; `editor` can edit portfolio entries; `admin` and `dev` can also manage users and run authorized media cleanup. Server routes enforce permissions independently of the UI.
- Editing: saves are direct submissions. There is no draft or publishing workflow in this scope. Images are prepared in the browser, uploaded on Submit, and saved with the text and URLs as one completed edit. Failed uploads or saves retain retryable input.
- Trash: deleted projects and users are hidden from active views and can be restored for 30 days. Expired items are purged automatically; referenced media is protected while restoration remains possible. There is no early permanent-delete control.
- Payments: `dev` and `admin` can create THB payment requests for a service or product and share a tokenized Thai or English payment page. Stripe Checkout is the configured provider; checkout is disabled until server-side Stripe and site settings are complete. An order is marked paid only from a verified provider result. Merchant iPay is reserved as a future provider when official approval and integration details are available.

## Architecture and setup

The checked-in package uses Next.js 16.4.3 App Router, TypeScript, MongoDB/Mongoose for CMS data and sessions, and Cloudinary for new CMS uploads. Existing checked-in project images remain usable. Local development uses `npm run dev`; `npm run check` runs lint, typecheck, and production build. `npm run test:cms` starts a temporary in-memory MongoDB and verifies CMS routes against isolated accounts; `npm run dev:cms-test` keeps that isolated server available for manual UI review at `127.0.0.1:43187`. Copy `.env.example` to `.env.local` and set `MONGODB_URI` and a strong `AUTH_SECRET` before using the ordinary CMS. Cloudinary credentials are required only for new image uploads. Optional GA4 Data API values enable the Analytics view.

The first `dev` user can be created through the guarded `/api/admin/bootstrap` endpoint while `CMS_BOOTSTRAP_TOKEN` is set. Bootstrap works only while the database has no users; remove the token after first-user setup. Later account changes use the Users section.

Payment requests can be recorded without Stripe credentials. To enable checkout, follow [payment setup](PAYMENT_SETUP.md) for `.env.local`, sandbox keys, local webhook forwarding, and deployment. `npm run test:payments` exercises payment rules in an isolated database with an injected provider stub; `npm run test:payment-routes` checks HTTP authorization and unavailable checkout on a separate local server. Stripe sandbox testing covers the real hosted checkout and signed webhook.

`vercel.json` schedules `/api/cron/trash` daily at 03:00 UTC. A Vercel deployment needs `CRON_SECRET`; the route requires its bearer token. Trash reads also remove expired records when authorized staff open that view. Manual media cleanup is available to `admin` and `dev` from Trash and removes only confirmed unreferenced uploads. It does not replace the daily record-expiry job.

The public site remains readable from the checked-in portfolio before the first CMS initialization. Confirm production environment values, scheduled Trash cleanup, and public rendering in the target deployment before launch. Deployment destination, business copy, and credentials are managed outside this document and should be verified with the project owner when they change.

## Working with the CMS

1. Open `/admin/login`, sign in, and choose **Portfolio** from the navigation drawer.
2. Create a project or edit an existing one. Maintain the Thai and English content, cover, gallery, category, featured status, and display order. Lower display-order values appear first.
3. Save once the changes are ready. A successful save updates public content immediately. If another editor changed the same record, reload and review their changes before trying again.
4. Use **Users** to create accounts, change roles or access, and set passwords. Accounts can be searched by username or email. Developer accounts are restricted to developers, and self-lockout and removal of the last active privileged account are blocked.
5. Use **Trash** to restore a removed project or account during its 30-day retention period. Removing an account also revokes its existing sessions.
6. Use **Payments** to create a request with a server-owned THB amount, copy its public link, and review the verified status or reconcile a pending attempt. Checkout availability depends on the payment configuration shown in the CMS.

`npm run test:users` exercises account permissions, unique identity constraints, concurrency protection, and retention against a separate temporary database. Both test commands use disposable data and never load the normal MongoDB connection as their test destination.

## Extension points

This phase covers portfolio content, users, and Trash. Future modules can be added through the shared CMS shell and role-aware navigation. Keep direct saves, server authorization, stale-edit protection, and restorable deletion consistent as more content types are introduced. A draft/publish system is intentionally outside the requested workflow.
