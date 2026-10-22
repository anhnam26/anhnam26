# Activity images fetched on profile load

The production service is
[`anhnam26-live-activity.vercel.app`](https://anhnam26-live-activity.vercel.app/api/activity?theme=dark).
`README.md` uses this endpoint for both themes.

The live service uses the same design, contribution parser and sports animation
as the saved activity images. `GET /api/activity?theme=dark` and
`GET /api/activity?theme=light` fetch GitHub on every request and return SVG.
`GET /api/activity?format=json` returns the freshly validated public snapshot.
The service is fixed to `anhnam26`; visitors cannot select another account or
upstream URL. GET and HEAD are supported.

The service sends `Cache-Control: no-cache, no-store, max-age=0, must-revalidate`,
plus `CDN-Cache-Control: no-store` and `Vercel-CDN-Cache-Control: no-store`.
It does not issue ETags or return 304 responses. Each request first tries fresh
GitHub data, with a shared three-second deadline for calendar and repository
requests. Contribution counts are never cached on successful refreshes.
The immutable sports scene is
compiled by `npm run build` into `.generated/sports.svg` and bundled with the
function. Requests read that scene instead of computing thousands of animation
keyframes on a cold start.

If a live refresh fails or times out, SVG responses reuse the last successful
snapshot. A cold instance tries the latest public `assets/activity.json` on
`main` with a one-second deadline, then the validated snapshot bundled with the
function. The image remains HTTP 200 with `X-Activity-Stale: true` and a visible
`Saved data` timestamp. It retains `no-store` so the next visit retries live
data immediately. Validated fallback numbers are never presented as live or
replaced by zero. JSON health checks remain HTTP 503 during upstream failures,
and invalid fallback data is rejected. The original removed snapshot/date row
does not appear during normal live operation.

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
`npm test` and `npm run dev` automatically build the sports scene first.
If invoking `node --test` directly, run `npm run build` beforehand.

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
30-second function limit. `.vercelignore` excludes local environment files,
the source video, generated images and maintenance documents from uploads.
It includes only `assets/activity.json` from the assets directory as an outage
fallback. The build creates `.generated/sports.svg`; both files are explicitly
included in the function bundle.

A public deployment must allow anonymous requests so GitHub's image proxy can
load it. Preview deployments protected by Vercel authentication cannot be used
as README image URLs. Do not put deployment bypass tokens in the README.

Anonymous GitHub REST requests are rate limited. If the deployed server reaches
that limit, add a dedicated read-only public-data token as `PROFILE_GITHUB_TOKEN`
in the Vercel project's server environment. The token is sent only to
`api.github.com`; the public calendar request remains anonymous. Do not copy
Git credentials to the deployment or put tokens in image URLs, assets or Git.

The project is `anh-nam/anhnam26-live-activity`, separate from the existing
portfolio project. Once the local directory is linked, deploy source changes
with `vercel deploy --prod`. GitHub pushes and Vercel deployments are separate;
this project is not connected to automatic Git deployments.

## Switch the profile after deployment

Use the public production origin of the new image project:

```powershell
npm run activity:connect -- https://anhnam26-live-activity.vercel.app
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

## Verification

The local HTTP service fetched GitHub's actual public count successfully.
Separately, a private browser fixture changed its simulated upstream from
1,196 to 1,197. Chrome loaded the same image URL again on a normal page reload
and displayed the new number, with no cache-clearing or URL changes. Both
themes loaded with the existing sports animation.

On 17 October 2026, production deployment
`dpl_DsYi2KoHr5SW2eHMvLJ54q2QyWLh` returned HTTP 200 anonymously for JSON and
both SVG themes. The live total was 1,196, matching GitHub's public calendar.
Each SVG was 3,665,566 bytes, below Vercel's 4.5 MB response limit.

GitHub's Markdown renderer generated Camo URLs for the proposed README. Two
requests to each image returned HTTP 200, `X-Cache: MISS`, `Age: 0`, and the
service's `no-cache, no-store` header. All four displayed 1,196 and retained
the sports animation. Chrome then loaded those public Camo images in dark,
light and 390-pixel mobile views. A normal reload requested the same URL again
and received another uncached HTTP 200. This verifies the public image path
without publishing the README or fabricating a real contribution change.

All 45 automated tests passed. Browser fixtures and screenshots are kept
outside the repository; no credentials or test-only endpoints are deployed.

### Cold-start repair, 22 October 2026

The real GitHub profile initially reproduced a broken image (`naturalWidth=0`,
`net::ERR_BLOCKED_BY_ORB`); later reloads worked after the function was warm.
Origin requests and available Vercel request logs returned 200, so those records
do not identify the precise response that GitHub rejected. The cold renderer
took 2,646 ms locally versus 4 ms warm. Moving the immutable sports scene into
the build reduced a cold image handler with captured upstream data to 41 ms.
The SVG animation and normal live contribution-fetch behaviour remain unchanged.
Regression tests also cover outages, cold-instance fallbacks, token isolation,
invalid fallback rejection, upstream aborts and immediate recovery of fresh
counts. The JSON health endpoint remains strict during outages.
