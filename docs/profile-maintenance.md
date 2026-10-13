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
repository section. A separate 16:9 arena below the calendar runs Pixel Sports
Club: football,
basketball and volleyball, 60 seconds each, in a seamless 180-second loop.
Four hand-authored pixel cartoon athletes keep their identities across sports:
Red 07 has spiky dark hair, Red 11 has curls and a yellow headband, Blue 04 has
an orange ponytail, and Blue 09 has cropped hair and a mint headband. Exactly
two players per team are visible on the court. The bright arcade stadium stays
in place while the playing surface and equipment transform.

Each match opens with an eight-second entrance and readiness sequence. The five
points arrive at seconds 18, 28, 38, 48 and 56. The scoreboard displays the final
score and FULL TIME winner from 56 until 60; the court transition runs from
58 until 60. Every scoring play, including a basket, adds exactly one point.

| Sport | Point winners, in order | Final score (red : blue) | Next possession |
| --- | --- | --- | --- |
| Football | Red, blue, red, blue, blue | 2 : 3 | Conceding team |
| Basketball | Blue, red, red, blue, red | 3 : 2 | Conceding team |
| Volleyball | Red, blue, red, blue, blue | 2 : 3 | Point winner serves |

Football starts with red possession, basketball with blue possession, and
volleyball with a red serve. After each of the first four points, the players
return to position over two seconds. Blue steals from red before the final
football goal. Red steals from blue during the third basketball play. These
turnovers reconcile the fixed scoring order with the normal restart rules.
The final eight-second scoring window includes the reset and a faster attack.
No random events change the script.

Football shows contested dribbling, a tackle, recovery, a give-and-go and a shot
past a saving defender. Basketball includes dribbling, a steal, passing and a
contested jump shot. Volleyball includes a serve, receive, set, spike, low dig
attempts and a jumping block. Winning spikes land inside the opponent's court.
The server stays behind the end line until after
contact; both shoes remain outside x=162 or x=1022. Players keep looking at the
ball and run past each other on separate paths, with at least 30 logical pixels
of clearance between their court positions. Supporting players use a back lane.
Four depth bands choose the paint order, with one visible drawing per athlete.
The small portraits in the footer are the roster, rather than extra court players.

The same ball remains visible throughout. During each transition it lifts into
the air, spins, gains a halo and blends its surface into the next sport's ball.
The green football pitch, orange basketball court and sandy volleyball court
crossfade continuously. The ending returns to the next entrance state, including
the volleyball-to-football seam.

The SVG uses local artwork and generated CSS, with no runtime script, remote
images or font dependencies. Normal motion is sampled at 12 Hz, returns at
24 Hz, and court transitions at 48 Hz, together with exact contact, scoring,
facing and depth changes. Redundant samples are discarded within 0.4 logical
pixels for position and 1.2 degrees for joints; browser interpolation fills the
gaps. The full three-minute asset is about 3.2 MB per theme. Tests enforce a
3.5 MB size ceiling. The generated CSS is cached within the render process so
both themes use the identical choreography.

Shoulders, elbows, hips and knees stay connected through nested fixed-length
bones. Both knees use the same anatomical branch. A support shoe stays planted
during each running stride; jumps include a crouch and landing. Reduced motion
shows a static football poster with all four players ready on the field.
Sports scores belong to the illustration and do not change contribution counts.

Run with the existing Node.js installation (Node 22 or newer):

```powershell
node scripts/update-activity.mjs
node --test scripts/*.test.mjs
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
- `scripts/sports-matches.mjs`: immutable scoring, timing and possession rules.
- `scripts/sports-rig.mjs`: fixed limb lengths and authored joint poses.
- `scripts/sports-timeline.mjs`: player actions, ball travel and court transitions.
- `scripts/sports-art.mjs`: hand-authored pixel athletes, stadium, courts and ball.
- `scripts/sports-animation.mjs`: scoreboard and generated CSS playback.
  Refreshing activity preserves the match script and animation.

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
