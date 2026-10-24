# Cloudinary project images

The Portfolio editor prepares images in the browser and keeps them on the device until **Save changes**. Saving uploads each prepared image through the authenticated server route, then saves the project text and image URLs together in MongoDB. The 37 existing projects and their 65 distinct images have been migrated to the `vetra` MongoDB database and Cloudinary. The checked-in portfolio and seed media manifest use those same Cloudinary URLs when initializing a fresh database.

## Configure credentials

Get the cloud name, API key, and API secret from your [Cloudinary product environment](https://cloudinary.com/documentation/image_upload_api_reference). Add these server-side values to `.env.local` for local use and to the deployment's environment settings for the live site:

```text
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
```

Keep the API secret out of Git and all `NEXT_PUBLIC_` variables. The app signs requests on the server; it does not need an unsigned upload preset. Restart the local app after editing `.env.local`. Redeploy after setting the live environment values: the Next.js image host rule reads the configured cloud name during the build, while also accepting the checked-in migrated image host. `.env.local` is ignored by Git and does not configure the deployed site. The production MongoDB URI must select the populated `vetra` database on the same Atlas cluster used for the migration.

## Editor workflow

1. Enter the project text and choose a cover or gallery images. Selection prepares a local preview; it does not contact Cloudinary. Oversized images are resized without changing their aspect ratio and WebP is tried first. Transparent or animated images are kept in a compatible format when needed. The editor shows the original and prepared sizes when they differ.
2. Press **Save changes**. The editor validates fields, uploads new images one at a time, and saves the project only when every upload succeeds. Prepared files must be 4 MB or smaller; a gallery can contain up to 30 images.
3. If an upload fails, the selected files and successful uploads remain in the editor. Retry Save to upload only unfinished images. A definite Cloudinary rejection can be retried after correcting the problem. When a provider response is uncertain, wait for the upload lease to expire before retrying the same image.
4. If the database save fails, retry the same submission with its existing URLs. The editor checks an uncertain save before offering cleanup. An administrator or developer can run **Cleanup** from Trash to remove confirmed unreferenced uploads; media used by active or restorable projects is preserved.

Without Cloudinary API credentials, existing images can still be displayed and edited, but new images cannot be uploaded or saved.

## Verify after configuration

Run `npm run test:cms-media` for isolated provider and database workflow checks, `npm run test:cms` for CMS route checks, and `npm run check` for lint, types, and build. With credentials present, `npm run verify:cloudinary` makes one tiny signed upload using a temporary database, checks image delivery, and removes the disposable asset. `npx tsx scripts/verify-live-cms-media.mjs --run --expected-db=vetra` additionally creates and removes a disposable project and image in the selected database, then checks Thai and English public reads. Run it only against the database named in the command. Confirm that the production deployment uses the same MongoDB database and Cloudinary account before opening the CMS there.
