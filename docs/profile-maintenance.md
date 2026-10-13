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

The README displays the activity panel after current work and before the small
repository section. A separate arena below the calendar plays a fixed 24-second
story: football passes and a goal, a defended basketball jump shot and basket,
then a volleyball set and spike. The same two characters stay on screen. One
continuous ball changes its surface as the courts crossfade, including the
return from volleyball to football. No random events change the sequence.

The SVG contains generated CSS animations and local vector artwork, without
runtime scripts or external assets. Inverse kinematics keeps limbs attached as
the players kick, guard, shoot, set and spike. Reduced motion shows the opening
football scene as a still image. Sports scores belong to the illustration and
do not change contribution counts.

Run with the existing Node.js installation (Node 22 or newer):

```powershell
node scripts/update-activity.mjs
node --test scripts/update-activity.test.mjs
node --test scripts/sports-animation.test.mjs
```

No package installation, Python environment, token or third-party statistics
service is required. The updater reads GitHub's public contribution calendar and
paginated public repository API. It validates dates, counts and totals before
writing `assets/activity-dark.svg`, `assets/activity-light.svg` and
`assets/activity.json`. The JSON records the source URLs and fetch timestamp.

The calendar counts contributions displayed on the public profile, including
anonymous private contribution counts if the account elects to show them.
Repository stars count owned, non-fork public repositories. These are activity
measurements, not a rating of engineering skill. Fetch dates remain in
`assets/activity.json` and the SVG's accessible description; no timestamp line
is displayed on the panel. This is saved data and does not update automatically.

If GitHub changes its calendar markup, a response is incomplete, or the public
API rate limit is reached, the updater exits with an error before replacing the
saved snapshot. Inspect the error and update the parser if needed.

Review the changes and commit only those three activity files. Publishing stays
manual. There are no workflows that automatically commit or push.

## Edit the design

- `README.md`: current AI work, contact links and small
  repository section.
- `assets/hero-*.svg`: header artwork and animation.
- `assets/activity-*.svg`: the GitHub calendar and sports animation, generated
  by the activity updater.
- `assets/badges/*.svg`: contact buttons; destinations live in `README.md`.
- `assets/project-*-*.svg`: retained artwork, unused in the current README.
- `scripts/update-activity.mjs`: activity layout, colors and data collection.
- `scripts/sports-animation.mjs`: the fixed sports timeline, articulated players,
  ball skins, court artwork and generated CSS. Refreshing activity preserves it.

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
