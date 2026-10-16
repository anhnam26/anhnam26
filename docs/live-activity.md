# Activity images fetched on profile load

The live service uses the same design, contribution parser and sports animation
as the saved activity images. `GET /api/activity?theme=dark` and
`GET /api/activity?theme=light` fetch GitHub on every request and return SVG.
`GET /api/activity?format=json` returns the freshly validated public snapshot.
The service is fixed to `anhnam26`; visitors cannot select another account or
upstream URL. GET and HEAD are supported.

The service sends `Cache-Control: no-cache, no-store, max-age=0, must-revalidate`,
plus `CDN-Cache-Control: no-store` and `Vercel-CDN-Cache-Control: no-store`.
It does not issue ETags, return 304 responses, read `assets/activity.json`, or
reuse contribution counts between requests. Only the immutable sports animation
CSS is memoized. Failed upstream requests return 503 rather than an old count.

## What this improves

The scheduled workflow is a snapshot publisher. On 17 October 2026, its latest
observed scheduled runs were separated by approximately 3–5 hours despite the
five-minute cron expression. The latest saved count and GitHub's public calendar
both returned 1,196 during the audit. A live endpoint removes the wait for a
workflow run and a generated-image commit after GitHub has indexed a change.

This supports the requested behaviour: the newest GitHub-published data when
someone opens or reloads the profile. A README does not continuously replace
an image while the page remains open. GitHub still controls contribution
indexing and its image proxy; a deployment must be checked through that proxy
before treating the profile integration as verified.

## References inspected

- [Anurag Hazra's profile](https://github.com/anuraghazra/anuraghazra) embeds
  dynamically generated image endpoints. The shared
  [GitHub Readme Stats](https://github.com/anuraghazra/github-readme-stats#common-options)
  deployment uses multi-hour caches and recommends self-hosting to control them.
- [DenverCoder1's profile](https://github.com/DenverCoder1/DenverCoder1) uses
  generated statistics images. The
  [Streak Stats FAQ](https://github.com/DenverCoder1/github-readme-streak-stats/blob/main/docs/faq.md)
  also documents caching delays.
- [GitHub's image proxy guidance](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/about-anonymized-urls)
  recommends `Cache-Control: no-cache` for an image server the owner controls.
- [Vercel cache headers](https://vercel.com/docs/caching/cache-control-headers)
  describe controlling its CDN separately from browser caches.
- [Vercel Node.js functions](https://vercel.com/docs/functions/runtimes/node-js)
  support `.mjs` files in `api/` with a Web Standard `fetch` export.

## Local verification

Use Node.js 24; the service has no npm dependencies.

```powershell
npm test
npm run dev
```

Open `http://127.0.0.1:5175/api/activity?theme=dark`. Stop this server with Ctrl+C
in the terminal that started it. `--port` selects a different local port:

```powershell
node scripts/serve-activity.mjs --port 5176
```

## Deploy independently on Vercel

Use a separate project for this repository's image API; do not overwrite the
existing portfolio project. `vercel.json` selects the Node function and a
30-second request limit. `.vercelignore` excludes local environment files,
the source video, generated images and maintenance documents from uploads.

A public deployment must allow anonymous requests so GitHub's image proxy can
load it. Preview deployments protected by Vercel authentication cannot be used
as README image URLs. Do not put deployment bypass tokens in the README.

Anonymous GitHub REST requests are rate limited. If the deployed server reaches
that limit, add a dedicated read-only public-data token as `PROFILE_GITHUB_TOKEN`
in the Vercel project's server environment. The token is sent only to
`api.github.com`; the public calendar request remains anonymous. Do not copy
Git credentials to the deployment or put tokens in image URLs, assets or Git.

Deploying the service and switching README image URLs are separate steps.
The current README continues to use its working saved images until the public
endpoint has passed checks; creating these source files alone does not activate
live profile updates.

## Switch the profile after deployment

Use the public production origin of the new image project:

```powershell
npm run activity:connect -- https://your-activity-project.vercel.app
```

This command verifies a fresh snapshot, both SVG themes, the service identity
and `no-cache`/`no-store` headers before changing anything. It refuses cached,
stale, login-protected or failed endpoints. It changes only the three activity
image URLs in `README.md`; sports, Delta Force, creator credit and all other
profile content remain in place. Running it again is safe.

Review and commit the resulting README change locally. Publish it yourself
with `git push origin main` when ready. The scheduled updater can continue
maintaining saved fallback images; it leaves live endpoint URLs unchanged.

After publishing, inspect the rendered GitHub profile's image URL. Request the
`camo.githubusercontent.com` URL twice and confirm it revalidates with the live
service rather than serving a long-lived cached response. Compare its visible
number with a direct fresh service request and GitHub's current calendar.
Vercel consumes its own CDN-control headers, so they may not be visible on the
public response; `Cache-Control` and the service identity should still be there.

Keep the service code and verified endpoint active until the README image URLs
have been switched back if rolling back. A hosting connection and a deployed
public endpoint are required; do not replace the working image URLs with a
guessed project hostname.

## Verification performed before deployment

The local HTTP service fetched GitHub's actual public count successfully.
Separately, a private browser fixture changed its simulated upstream from
1,196 to 1,197. Chrome loaded the same image URL again on a normal page reload
and displayed the new number, with no cache-clearing or URL changes. Both
themes loaded with the existing sports animation. That verifies local service
behaviour; public hosting and GitHub's image proxy still require deployment
and the checks above.
