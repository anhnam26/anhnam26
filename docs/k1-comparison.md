# K1 visual comparison and verification

The working result is a **procedural 3D recreation with substantial visual
differences**, not a pixel-perfect copy of K1.mp4. The complete 244.6-second clock
and the major reference beats are implemented. The supplied movie does not
include the original game meshes, rigs, material maps or camera tracks.

## What matches and what differs

| Element | Result |
| --- | --- |
| Full duration | Exactly 244.6 seconds, matching 7,338 source frames at 30 fps. |
| Story sequence | Industrial opening, gold mask, blue phone/UI inserts, animal group, lab conversation, firefight, slow motion, blue floating figures, warm fight, return conversation and photo ending. |
| Fine shot sequence | 105 authored beats approximate the edits. They are not an exact reconstruction of every original cut or crossfade. Some continuous reveals use sampled timing. |
| Identities | Golden jacket animal, skull mask, goggle animal, tactical dog and operators recur. Six cropped identity textures preserve facial details. |
| Bodies and materials | Custom procedural, stylized meshes replace the unavailable original models. Silhouettes, anatomy detail, clothing, hair, shading and scale differ visibly. |
| Movement | Code drives connected limbs, walking, aiming, recoil, jumping, floating, fighting and hand contact. The source's detailed acting and motion capture are not reproduced exactly; action patterns are simplified. |
| Cameras | Rear, low, wide, weapon and facial views follow the major reference framing. Perspective, framing, depth of field and camera movement differ. |
| Environments | Warehouse streets, crates, wall, lab reactor, screens, office, hangar and blue space are rebuilt. Geometry and surface detail differ from the original game. |
| UI | Squad count, phone/chat, loadout, extraction, commander, scope and roster inserts are represented. The technical diagram reuses its reference graphic with a code-driven zoom. English labels and representative chat text replace Chinese UI/dialogue; text is not a full verbatim translation. |
| Ending photos | A source-derived printed-photo prop appears in an animated stack. It reuses one photograph rather than the source's varied photograph collection. |
| Black interval | The source is black at 213.233-216.900. The app deliberately continues visible hangar action for those seconds. |
| Loop seam | The final 1.133 seconds blend the scene and UI into the opening. This smooth join is an intentional adaptation; the source itself does not have that join. |
| Audio | Silent. The source audio is not recreated. |
| README version | A 25.5-second, 12 fps, 480 x 270, 64-color GIF concatenates ten excerpts. The full app retains 244.6 seconds. Palette and frame-rate reduction are visible. |

These differences are material. Functional checks and reference-inspired
portraits do not establish exact visual fidelity.

## Matching-timestamp evidence

Thirty-one source/render pairs were captured with Chrome and FFmpeg at timestamps
from 0 through 244.599 seconds, including every major setting and the original
black interval. Source images are on the left, recreated images on the right.

- [Opening, yard, mask and blue room](k1-reference/comparison-1.jpg)
- [Animals, confrontation and office](k1-reference/comparison-2.jpg)
- [Weapon, operator and commander room](k1-reference/comparison-3.jpg)
- [Roster, lab, can and particles](k1-reference/comparison-4.jpg)
- [Action, extraction and slow motion](k1-reference/comparison-5.jpg)
- [Floating space and hangar](k1-reference/comparison-6.jpg)
- [Fight, black-interval adaptation and return](k1-reference/comparison-7.jpg)
- [Conversation, photo ending and loop adaptation](k1-reference/comparison-8.jpg)

Across all pairs, average absolute RGB difference is **46.16 / 255** (individual
pairs 0.02-90.10). The best-matching frame uses the source's static UI graphic.
This includes deliberately adapted frames and measures raw
pixel mismatch, not semantic quality. It confirms that the recreation is visibly
different and must not be presented as pixel-perfect. Metrics and native checks
are recorded in [verification.json](k1-reference/verification.json).

## Functional verification

- Every source-frame timestamp was checked across two complete model-clock cycles.
- Chrome rendered 490 sample states spanning two complete cycles in deterministic
  seek mode. Visible character identities and attached rig lengths were checked.
- The skull operator alone is airborne during the 200.8-second leap; the defending
  operator stays grounded.
- The seated character's phone stays within 0.018 rig units of the mean hand
  position, rather than moving independently of the hands.
- No source-video request, video element, iframe or interactive controls are used.
- Autoplay produces changing frames. At the infinite-loop join, the final sampled
  render differs from the opening by only **0.33 / 255** mean RGB intensity.
- The intended black interval renders a visible scene in the recreation.
- Responsive layout was tested at 1280 x 720 and an emulated 390 x 844 viewport.
  The displayed animation remains 16:9 and does not cause horizontal scrolling.
- Reduced motion freezes the opening pose. WebGL fallback is an independent
  GIF; its reduced-motion version is the code-rendered opening PNG.
- After loading, both canvas layers are visible; screenshot changes verify
  actual playback rather than relying only on the animation's internal clock.
- Sampled warmed-up animation-frame intervals averaged about **6.06 ms** in
  headless Chrome on the local NVIDIA RTX 4060 Laptop GPU. This exceeds the 60 fps
  target on this machine. The mobile result is viewport emulation on that same
  GPU, not a measurement from a physical phone.
- All 306 GIF frames were decoded, with a total duration of 25.5 seconds and an
  infinite-loop extension. Its first/last frame difference is **0.65 / 255**.
- The calendar SVG contains no cinematic, sports CSS or GIF. Refreshing activity
  does not replace the standalone preview.

The cycle checks use seeking and exhaustive clock sampling. They are not a claim
that two complete eight-minute real-time recordings were watched end to end.
GitHub Pages publication is separate from local validation; the deployment
workflow must be published and Pages enabled before the hosted link becomes live.
