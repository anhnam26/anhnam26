# Maintaining this profile

The README uses GitHub-supported Markdown, `<picture>` and repository-local SVGs.
Dark and light images are selected by GitHub's theme-aware image support. The hero
highlights the current AI focus list using CSS inside its SVG; it becomes static
when reduced motion is enabled.
Current work and the small repository section remain plain text for mobile readers.

## Profile content

Use English throughout the profile and artwork, with the name `Pham Hoa Anh Nam`
without diacritics. List current work in AI agents, RAG, LLM APIs, Local AI,
ML/DL and production AI. Keep the presentation as a list of areas, without a
workflow or roadmap diagram. Keep selected repositories as a short section at
the end, after the introduction, current work and activity content.

## Contact buttons

The linked SVG badges in `assets/badges/` open Facebook, the portfolio and Gmail
in the browser. Email uses Gmail's web compose URL, with the recipient already
filled in, rather than relying on an installed mail application. Gmail may ask
the visitor to sign in. The email address is also displayed as selectable text
for visitors who prefer another mail service. Keep the badge links and displayed
address synchronized when changing contact details.

## Refresh the activity snapshot

The README displays a compact activity panel after the AI focus list. It contains
only the yearly contribution calendar, public repository count and owned non-fork
repository stars. Both themes are 1280 x 414 SVGs, about 46 KB each. The saved
snapshot remains in `assets/activity.json`. No cinematic or animated CSS belongs
inside this panel, and activity updates do not regenerate the GIF.

## Standalone K1 cinematic

A separate clickable GIF immediately below GitHub Activity links to the complete
browser recreation at `https://anhnam26.github.io/anhnam26/`. The supplied K1 video
was confirmed by the owner: it is a 3D animal/operator cinematic, not the earlier
football/basketball/volleyball animation. The full app lasts 244.6 seconds and
renders procedural 3D scenes, articulated characters and reference UI in a
responsive 16:9 canvas. It plays automatically and blends back to the first scene.

`assets/sports-preview.gif` is a 25.5-second excerpt at 12 fps, 480 x 270 pixels,
with 306 frames and infinite looping. It is approximately 4.05 MB. The file name
follows the supplied prompt; the visible content is K1. Excerpt intervals, size
and decoded duration are recorded in `assets/sports-preview.json`. This preview
omits scenes; the complete app retains the full reference duration. The image is
captured from the code render, rather than transcoded from the original movie.

`VIDEO_ANALYSIS.md` documents the entire source. `docs/k1-animation.md` covers the
app and exporter. `docs/k1-comparison.md` records visual differences and measured
verification. The procedural characters, environments and camera framing differ
from the source; do not describe this as a pixel-perfect reproduction. The
source's black interval is filled with a visible combat continuation, and the
ending is blended into the opening for the infinite loop. Source-derived face
textures have explicit provenance in `src/assets/provenance.json`.

The previous `scripts/sports-*.mjs` renderer is retained as an unused reference.
Its choreography is not rendered by the activity updater or the K1 application.

## Automatic activity updates

The workflow in `.github/workflows/update-activity.yml` refreshes activity every
hour at minute 23 (UTC). It also runs when its configuration or a file under
`scripts/` is pushed to `main`, and can be started using **Actions > Update
GitHub activity > Run workflow**. GitHub schedules and image caches may delay
when new numbers become visible; the panel is refreshed periodically.

Activate it by publishing the local commits to the repository's `main` branch:

```powershell
git push origin main
```

Once the workflow is on GitHub, it runs without this computer being on. It
checks JavaScript syntax, runs the tests, fetches and validates public data,
then rebuilds both SVG themes. It uses GitHub's automatically supplied
`GITHUB_TOKEN`; no personal access token or manually configured secret is needed.
The token authenticates REST API requests only, and is never saved in an asset.

Only `assets/activity.json`, `assets/activity-dark.svg` and
`assets/activity-light.svg` are staged and published by the bot. The workflow
commits only actual changes, using a bot identity. Unchanged public data keeps
the last published snapshot's `fetchedAt`, avoiding hourly timestamp-only
commits. The generator still renders the artwork, so design changes are picked
up even when the numbers stay the same. Each successful poll appears in the
workflow logs. Concurrent refresh jobs are serialized.

To refresh locally, use the existing Node.js installation (Node 22 or newer):

```powershell
node scripts/update-activity.mjs
node --test scripts/*.test.mjs
```

No package installation, Python environment or third-party statistics service
is required. Local refreshes work without a token. The updater reads GitHub's
public contribution calendar and paginated public repository API. It validates
dates, counts and totals before
writing `assets/activity-dark.svg`, `assets/activity-light.svg` and
`assets/activity.json`. The JSON records the source URLs and fetch timestamp.

The calendar counts contributions displayed on the public profile, including
anonymous private contribution counts if the account elects to show them.
Repository stars count owned, non-fork public repositories. These are activity
measurements, not a rating of engineering skill. Fetch dates remain in
`assets/activity.json` and the SVG's accessible description; no timestamp line
is displayed on the panel. The hourly workflow maintains the saved data.

If GitHub changes its calendar markup, a response is incomplete, or the public
API rate limit is reached, the updater exits with an error before replacing the
saved snapshot. Inspect the error and update the parser if needed.

For local refreshes, review the changes and commit only those three activity
files. The agent follows the supplied AGENTS.md rule and never pushes local
commits automatically. The hourly workflow publishes its own activity updates
after it has been enabled on GitHub. A failed fetch or validation stops the job
before publishing; the previous profile images stay available. A rejected push
fails normally without forcing, merging or rebasing, and the next run starts
from the latest `main` branch. Disable the workflow in Actions to stop refreshes.

## Edit the design

- `README.md`: current AI work, contact links and small
  repository section.
- `assets/hero-*.svg`: header artwork and animation.
- `assets/activity-*.svg`: the GitHub calendar and sports animation, generated
  by the activity updater.
- `assets/badges/*.svg`: contact buttons; destinations live in `README.md`.
- `assets/project-*-*.svg`: retained artwork, unused in the current README.
- `scripts/update-activity.mjs`: activity layout, colors and data collection.
- `.github/workflows/update-activity.yml`: hourly refresh and bot publication.
- `index.html`, `src/`, `public/`: the independent K1 browser application.
- `assets/sports-preview.gif`: the standalone README animation.
- `scripts/export-k1-preview.py`: regenerate the preview from the code-rendered app.
- `scripts/verify-k1.py`: native browser checks and source comparisons.
- `scripts/build-pages.mjs`: build the deployable static application.
- `docs/k1-animation.md`: app, verification, preview and deployment instructions.

Keep the paired light/dark SVGs synchronized. Keep facts and links aligned with
the public portfolio and repositories; do not turn planned project features into
claims about implemented behavior.

## Design references

Studied on 13 October 2026, then used as layout ideas rather than copied assets:

- [DenverCoder1](https://github.com/DenverCoder1/DenverCoder1): a recognizable
  header, project cards and a separate activity section.
- [Rafaella Ballerini](https://github.com/rafaballerini/rafaballerini): concise
  personal copy and direct links. Her README also notes statistics API downtime,
  which informed the choice to keep visual assets in this repository.
- [Sindre Sorhus](https://github.com/sindresorhus/sindresorhus): personal visual
  identity and playful animation.

Biographical information was checked against
[the public portfolio](https://anhnam26.vercel.app/) and
[the GitHub profile](https://github.com/anhnam26). The MiniGPT and Day Zero
summaries were checked against their repository READMEs.
