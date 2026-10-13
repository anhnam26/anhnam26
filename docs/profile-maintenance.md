# Maintaining this profile

The README uses GitHub-supported Markdown, `<picture>` and repository-local SVGs.
Dark and light images are selected by GitHub's theme-aware image support. The hero
uses CSS animation inside its SVG; it becomes static when reduced motion is enabled.
Focus areas and the small repository section remain plain text for mobile readers.

## Profile content

Lead with the AI Engineer direction: AI agents, RAG, LLM APIs, Local AI, ML/DL
and production AI. The focus table describes development goals, rather than
claiming every listed capability has already shipped. The production diagram
illustrates the engineering workflow being developed. Keep selected repositories
as a short section at the end, after the introduction, focus and contact content.
Avoid moving activity counts or large project cards back into the main profile.

## Contact buttons

The linked SVG badges in `assets/badges/` open Facebook, the portfolio and Gmail
in the browser. Email uses Gmail's web compose URL, with the recipient already
filled in, rather than relying on an installed mail application. Gmail may ask
the visitor to sign in. The email address is also displayed as selectable text
for visitors who prefer another mail service. Keep the badge links and displayed
address synchronized when changing contact details.

## Refresh the activity snapshot

The activity assets are retained for optional use; the current README emphasizes
AI engineering focus and does not display the statistics panel.

Run with the existing Node.js installation (Node 22 or newer):

```powershell
node scripts/update-activity.mjs
node --test scripts/update-activity.test.mjs
```

No package installation, Python environment, token or third-party statistics
service is required. The updater reads GitHub's public contribution calendar and
paginated public repository API. It validates dates, counts and totals before
writing `assets/activity-dark.svg`, `assets/activity-light.svg` and
`assets/activity.json`. The JSON records the source URLs and fetch timestamp.

The calendar counts contributions displayed on the public profile, including
anonymous private contribution counts if the account elects to show them.
Repository stars count owned, non-fork public repositories. These are activity
measurements, not a rating of engineering skill. The date on each image makes
clear that this is a snapshot; it does not update automatically.

If GitHub changes its calendar markup, a response is incomplete, or the public
API rate limit is reached, the updater exits with an error before replacing the
saved snapshot. Inspect the error and update the parser if needed.

Review the changes and commit only those three activity files. Publishing stays
manual. There are no workflows that automatically commit or push.

## Edit the design

- `README.md`: AI engineering direction, focus areas, contact links and small
  repository section.
- `assets/hero-*.svg`: header artwork and animation.
- `assets/production-*.svg`: the AI engineering workflow illustration.
- `assets/badges/*.svg`: contact buttons; destinations live in `README.md`.
- `assets/project-*-*.svg`: retained artwork, unused in the current README.
- `scripts/update-activity.mjs`: activity layout, colors and data collection.

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
