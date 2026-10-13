# K1.mp4 reference analysis

## Verified source

The reference is the workspace file `K1.mp4`, not the previous Pixel Sports Club
animation. On 14 October 2026 the owner explicitly confirmed that this is the
intended video after being told that it depicts a shooter cinematic rather than
football, basketball or volleyball. Its content takes precedence over the sports
examples in the supplied prompt.

| Property | FFprobe result |
| --- | --- |
| Container duration | 244.600000 seconds (4:04.600) |
| Video | H.264 High, 1920 x 1080, 30 fps, progressive |
| Aspect ratio | 16:9, square pixels |
| Video frames | 7,338 |
| Video duration | 244.600000 seconds |
| Audio | HE-AACv2, stereo, 44,100 Hz, 244.576009 seconds |
| File size | 31,017,531 bytes |
| SHA-256 | `3006ba252b79bd01842b2c7e0670830ac32ee4c95bdb1d26024ff262001a02ff` |

FFmpeg decoded the entire video and audio without an error. It also extracted
489 frames at two frames per second across the full duration. All five two-second
timeline contact sheets and the ten-second overview were inspected. A separate
full-frame scene-change pass found 146 candidates at a scene difference threshold
of 0.25. These include flashes and fast edits, so they are **candidates**, not a
claim that the movie contains exactly 146 shots. No section of the video was
unavailable. Small subtitles and sub-frame gestures have not been transcribed.

The probe, detector results and overview are retained in `docs/k1-reference/`.
The full extracted frames are local analysis intermediates rather than app assets.

## Appearance and identity

This is a shaded, textured 3D cinematic with meme/comedy inserts. It is not pixel
art. Industrial streets, corrugated warehouses, laboratory interiors, equipment
crates and a warm training hangar recur. Cool blue/green lighting alternates with
gold sunlight and red graphic silhouette shots. Cameras use perspective,
close-ups, tracking, low angles, shallow depth of field, slow motion, letterboxing
and hard edits.

Recurring identities include a small golden animal in a dark padded jacket, a
gold skull-mask operator with swept grey hair and a headset, an elongated tan
animal with goggles and tactical equipment, a dog with a cap/backpack, and several
human operators with helmets and backpacks. Some dialogue inserts use live-action
human heads or torsos over game-like environments. They are not four red/blue
athletes. Weapons are rifles and pistols, with green, metallic and gold finishes.

UI includes chat/inventory panels, extraction messages, a commander label,
`PASS`/`PERFECT` labels and subtitles. It has no sports scoreboard or fixed 3-2
scoring progression. There are no sports balls, nets, hoops, goals or ball morphs.

## Complete visual timeline

Times below group related shots and actions. Cut-detector timestamps support the
boundaries; descriptions combine adjacent sampled frames. A range is a visual
beat, not necessarily a single uninterrupted camera shot.

| Seconds | Visible action, setting and camera |
| --- | --- |
| 0.000-4.267 | Cool industrial street. Rear low-angle view of the jacketed animal with red arrows above it; alternate frontal/operator views and an interaction prompt. |
| 4.267-8.800 | Warm crate-lined yard. Skull operator moves with a long green rifle; wide stance and a seated/crouched pose. |
| 8.800-10.467 | Gold skull-mask close-ups and weapon/eye detail. Warm highlights, dark equipment, rapid changes of framing. |
| 10.467-12.367 | Blue-lit desk/gaming insert with a live-action human composited in front of a monitor. |
| 12.367-16.700 | Dark interface with a white person icon, zero count and dashed plus box, continuously revealing the seated phone user around 15 seconds. |
| 16.700-21.867 | Phone/chat close-up, followed by blurred blue-room character and foreground transitions. |
| 21.867-23.200 | Inventory/loadout insert with a pistol, ammunition values and equipment UI. |
| 23.200-25.867 | Sunny dusty street, rear following view of the small jacketed animal. Buildings and palms frame the route. |
| 25.867-30.233 | Live-action dialogue/comedy insert near a workstation, followed by the return to the outdoor group. |
| 30.233-34.900 | The animal watches two small animal characters at a low barrier; slow changes in the viewing angle. |
| 34.900-39.367 | Photograph held in the foreground, then goggles-wearing elongated animal by a concrete wall and grass. |
| 39.367-45.600 | Small meme/animal inserts, a narrow vertically stretched figure, then a geared-up goggle animal in closer view. |
| 45.600-52.867 | Low-angle confrontation. Skull operator stands over a green-equipped human/operator who bends and shields their head. |
| 52.867-56.900 | Interior office/counter. Animal and skull operator face each other; close character reactions. |
| 56.900-61.967 | Blue-grey industrial interior. Helmeted human/operator poses and reaches toward the camera; skull operator remains behind. |
| 61.967-64.133 | Rifle assembly, barrel and optic detail shots with shallow focus. |
| 64.133-72.867 | Skull operator aiming, scope/crosshair detail, opposing operator's face; transition toward the laboratory room. |
| 72.867-77.267 | Laboratory/gaming comedy montage. Live-action torsos, weapon, missing teammate icon, red extraction-failure text and a leaning/falling figure. |
| 77.267-87.200 | Two-person counter conversation beneath a glowing green commander panel. Head turns, gestures, expressions and discarded/falling props. |
| 87.200-90.633 | Split-panel animal roster with `PERFECT` and `PASS` overlays and tactical variants. |
| 90.633-94.900 | Full equipment/inventory screen, followed by enlarged vest/rifle quantity callouts. |
| 94.900-101.367 | Group of animal operators in the laboratory. Green rifle, goggles, cap, backpack and skull-mask variants in alternating views. |
| 101.367-109.533 | Animals at a sunny concrete barrier, reaction close-ups, then the skull operator looking past the group. |
| 109.533-111.900 | Static low view of a large grey fuel can and distant figures near a warehouse. |
| 111.900-114.867 | Smoke/dust burst and an operator moving upward in the industrial interior. |
| 114.867-118.533 | Dog with tactical cap/backpack near a doorway and an X-marked fuel can. |
| 118.533-121.600 | Green rifle close-up, sleeve/hand with gold particles, then a tense skull-mask face. |
| 121.600-139.900 | Action montage: red silhouettes, split panels, running soldiers, outdoor firefight, laboratory firefight and bright muzzle/impact particles. |
| 139.900-143.867 | Extraction notification at an industrial doorway, followed by the dog/can reaction. |
| 143.867-152.933 | Weapon struggle and operator close-ups; skull operator is airborne in slow motion, with projectile detail and a red silhouette insert. |
| 152.933-159.933 | Multiple helmeted operators aim and fire in the green laboratory, with a turning camera and recoil. |
| 159.933-166.267 | Animal reaction, ornate rifle held by the goggle animal and a human carrying equipment; alternating warm/cool views. |
| 166.267-172.467 | Slow-motion running/jumping operator with extended legs and nearby equipment in soft focus. |
| 172.467-181.233 | Face/upper-body operator close-ups, warm character pose, then bodies and gear floating in a blue stylized space. |
| 181.233-184.433 | Gold skull operator lunges in the warm training hangar; extreme eye/iris insert. |
| 184.433-191.267 | Cool conversation juxtaposed with warm skull/operator combat; subtitles and reaction close-ups. |
| 191.267-196.533 | Paired operator faces, shoulder/helmet close-ups and the beginning of a warm two-person sparring sequence. |
| 196.533-213.233 | Gold-lit sparring: leaping, turning, striking, blocking and reaching. Rapid detail cuts and red facial close-ups. |
| 213.233-216.900 | Actual black interval, detected by FFmpeg: 3.66667 seconds. This is in the source, not a decoding failure. |
| 216.900-220.200 | Blue diagram/technical insert, followed by an outstretched hand against the warm hangar. |
| 220.200-230.400 | Warm hangar continuation: open palm, operator leaning forward, hand/arm contact and a wide two-person ending pose. |
| 230.400-238.133 | Return to green laboratory comedy conversation, small jacketed animal in foreground, skull operator and live-action human cutouts. |
| 238.133-241.767 | Seated live-action conversation in a warmer room, with the animal's jacket/back in the foreground and colored subtitles. |
| 241.767-243.467 | Outdoor group posed against palms and sky; transition into a printed photograph. |
| 243.467-244.600 | Overlapping photograph montage; the final frame does not match the opening industrial street. |

## Conflicts resolved for implementation

- Recreate this cinematic rather than the earlier sports animation. Keep the
  complete 244.6-second cycle; do not impose three 80-second segments.
- Use a genuine browser-rendered scene with code-driven characters, cameras,
  props and effects. Do not play K1.mp4 or sequence extracted movie frames as
  the main deliverable.
- The source itself has hard internal edits. Preserve its shot sequence;
  smooth the final-to-first join for infinite playback.
- The source's black interval conflicts with the requested no-black playback.
  Keep those 3.66667 seconds in the timeline as a visible continuation of the
  preceding combat beat. This is an intentional adaptation, not an exact copy.
- Translate visible interface/dialogue labels to concise English for the
  profile's English-only presentation. Do not invent sports scores or teams.
- The browser version is silent; audio recreation was not requested and
  automatic audible playback would require browser interaction.
- Original rigged meshes, materials and camera tracks are not provided.
  Procedural models will have measurable visual differences. The final comparison
  report must state them; a working render must not be described as pixel-perfect.
- Display the standalone README GIF immediately after GitHub Activity. Activity
  refreshes must not redraw or contain the cinematic.

## Planned verification

Compare the code render and source at matching timestamps across every major
beat, retaining screenshots and a metrics report. Verify the full-duration clock,
two complete cycles, source-sequence boundaries, absence of black frames, loop
seam, desktop/mobile canvas sizing, autoplay, frame timing and the GIF's decoded
frame count/duration/loop extension. Document any GIF-specific timeline reduction.
