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
Club: football, basketball and volleyball, in a seamless four-minute loop.
Each sport lasts exactly 80 seconds, including entrance, five scoring plays,
restarts, the winner's celebration and the transition to the next court.
Football starts at 0 seconds, basketball at 80 and volleyball at 160.
Four hand-authored pixel cartoon athletes keep their identities across sports:
Red 07 has spiky dark hair, Red 11 has curls and a yellow headband, Blue 04 has
an orange ponytail, and Blue 09 has cropped hair and a mint headband. Exactly
two players per team are visible on the court. The bright arcade stadium stays
in place while the playing surface and equipment transform.

Football opens in a ready formation: the ball sits at (592, 232), the painted
centre spot, and both rear players stand on the goals' centreline at y=232.
Every football restart uses that same centred kickoff. Basketball and volleyball
retain their entrance and readiness sequences. Points arrive at the
end of their actual plays. The scoreboard displays the final score and FULL
TIME winner as soon as a team reaches three. A 5.5-second celebration precedes
the court transition, with six fireworks and confetti fired from both corners.
The fireworks and cannons use the winning team's color. Effects appear only
after the final point and finish before the players change courts; reduced
motion hides them. Every scoring play, including a basket, adds one point.

| Sport | Point winners, in order | Final score (red : blue) | Next possession |
| --- | --- | --- | --- |
| Football | Red, blue, red, blue, blue | 2 : 3 | Conceding team |
| Basketball | Blue, red, red, blue, red | 3 : 2 | Conceding team |
| Volleyball | Red, blue, red, blue, blue | 2 : 3 | Point winner serves |

Football starts with red possession, basketball with blue possession, and
volleyball with a red serve. After each of the first four points, the players
return to position at the same increased pace. Blue steals from red before the final
football goal. Red steals from blue during the third basketball play. These
turnovers reconcile the fixed scoring order with the normal restart rules.
The final attack uses the same pace as the opening play. No random events change
the script. A shared monotone baseline clock smooths movement around direction
changes. Each sport applies one uniform time scale to entrances, plays, restarts
and court transitions, fitting them into 74.5 seconds while preserving a
5.5-second celebration. Football and basketball run about twice as fast as the
previous animation; volleyball runs about 1.3 times as fast. Contact times,
limb movement and scoring follow the same scaled clock. Return trips change
court depth, cross in separate lanes, then settle into formation. The final
attack uses the opening attack's speed factor, with no deadline catch-up.

Each football goal has its own authored play: tackle recovery and a wall pass,
a wing run and cutback, a feint and long-range shot, an overlap finished by the
winger, and an interception followed by a solo counterattack. Basketball uses
a crossover pull-up, a give-and-go jumper, a steal and fast-break layup, a
backdoor cut with an extra pass, and a post entry and spin jumper. Successful
steals change possession; failed challenges leave the attacker in control.
Passes, catches, shot releases and running paths differ between plays.

Volleyball includes a serve, receive, set, spike, low dig attempts and a
jumping block. The net spans the court's depth with posts at the two sidelines,
a continuous top tape and a perspective mesh. Flights clear the tape; spikes
travel downwards from contact. Each winning spike lands fully inside the
opponent's court, at a fixed empty location more than 75 pixels from either
defending player's court position.
The server stays behind the end line until after contact; both shoes remain
outside x=162 or x=1022. Players keep looking at the
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
images or font dependencies. Motion is sampled at 12 Hz, together with exact
path waypoints, return phases, contact, scoring,
facing and depth changes. Redundant samples are discarded within 0.4 logical
pixels for position and 1.2 degrees for joints; browser interpolation fills the
gaps. Tests enforce a 5 MB size ceiling per theme. The generated CSS is cached within the render process so
both themes use the identical choreography.

Shoulders, elbows, hips and knees stay connected through nested fixed-length
bones. Both knees use the same anatomical branch. A support shoe stays planted
during each running stride; jumps include a crouch and landing. Reduced motion
shows a static football poster with all four players ready on the field.
Sports scores belong to the illustration and do not change contribution counts.

## Profile video

The standalone attachment URL under **Delta Force** embeds GitHub's native video
player directly below the activity and sports panel. It is the original
`K1.mp4`, including its audio: 1920 x 1080, 30 fps, 244.6 seconds, H.264/AAC.
The source was uploaded unchanged, rather than recreated or converted to GIF.
`assets/profile-video.json` records the public attachment URL, source hash,
file size and media properties. The upload uses GitHub's user-attachment
endpoint; no issue, comment, release or Pages site is needed. Keep the URL on
its own paragraph so GitHub renders a player. Playback starts with the visitor's
Play button; GitHub controls the player's behaviour.
The caption describes Delta Force as the owner's favorite game and highlights
Operations mode. Keep the creator credit linked to `neongi_yt` on TikTok.

## Automatic activity updates

The on-demand image service in `api/activity.mjs` provides fresh data
when someone opens or reloads the profile. It is independent of the schedule
below. Deployment, cache controls and the verified README activation command
are documented in [live-activity.md](live-activity.md). The README points to
`https://anhnam26-live-activity.vercel.app`; publish its local commit to activate
this on GitHub. The saved SVG files remain available as fallbacks.

The workflow in `.github/workflows/update-activity.yml` checks activity every
five minutes, at minutes 2, 7, 12, ..., 57 (UTC). It also starts on every push
to this repository's `main`, opened issues, pull requests opened/reopened/closed
against `main`, and created discussions. The `contributions-updated`
`repository_dispatch` event supports notification from another repository or
an external integration. All events check out trusted `main` code, never code
from a pull request. Manual refresh remains available under **Actions > Update
GitHub activity > Run workflow**.

These event triggers cover this repository. Contributions in other repositories
are picked up by the five-minute poll unless an external integration dispatches
the refresh. There is no account-wide GitHub Actions event for an increased
contribution total. Instant display cannot be guaranteed: GitHub may take up to
24 hours to index a qualifying contribution, scheduled Actions may be delayed,
and browsers do not update an already-open README automatically.
See [GitHub's schedule limits](https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows#schedule)
and [contribution indexing](https://docs.github.com/en/account-and-profile/how-tos/contribution-settings/troubleshooting-missing-contributions).

Activate it by publishing the local commits to the repository's `main` branch:

```powershell
git push origin main
```

Once the workflow is on GitHub, it runs without this computer being on. It
checks JavaScript syntax, runs the tests, fetches and validates public data,
then rebuilds both SVG themes. It uses GitHub's automatically supplied
`GITHUB_TOKEN`; no personal access token or manually configured secret is needed.
The token authenticates REST API requests only, and is never saved in an asset.

Only `assets/activity.json`, `assets/activity-dark.svg`,
`assets/activity-light.svg` and the activity image URLs in `README.md` are
updated and published by the bot. Each image URL has a content-derived `?v=`
version, so a new count requests a fresh image through GitHub's image proxy.
The generator preserves all other README content, including the video. The workflow
commits only actual changes, using a bot identity. Unchanged public data keeps
the last published snapshot's `fetchedAt`, avoiding timestamp-only
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
is displayed on the panel. The five-minute workflow maintains the saved data.

If GitHub changes its calendar markup, a response is incomplete, or the public
API rate limit is reached, the updater exits with an error before replacing the
saved snapshot. Inspect the error and update the parser if needed.

For local refreshes, review and commit the three activity files plus the
versioned image URLs in `README.md`. The agent follows the supplied AGENTS.md
rule and never pushes local commits automatically. The workflow publishes its own activity updates
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
- `assets/profile-video.json`: the original video's attachment URL and upload
  receipt.
- `assets/badges/*.svg`: contact buttons; destinations live in `README.md`.
- `assets/project-*-*.svg`: retained artwork, unused in the current README.
- `scripts/update-activity.mjs`: activity layout, colors and data collection.
- `.github/workflows/update-activity.yml`: event triggers, five-minute polling
  and bot publication.
- `scripts/sports-matches.mjs`: immutable scoring, timing and possession rules.
- `scripts/sports-paths.mjs`: court paths, baseline play clocks and returns.
- `scripts/sports-plays.mjs`: five distinct plays per attacking sport and fixed
  volleyball landing locations.
- `scripts/sports-celebration.mjs`: winner-only fireworks and confetti.
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
