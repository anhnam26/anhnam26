# K1 browser recreation

The page reconstructs the confirmed K1 reference as an authored 244.6-second,
automatically looping 3D animation. It uses locally vendored Three.js 0.180.0,
procedural meshes, articulated limbs, camera tracks, static identity textures,
environment geometry, UI drawing and deterministic effects. It has 105 authored
shots. It does not request or play `K1.mp4`.

Read `VIDEO_ANALYSIS.md` for the source timeline and intentional adaptations.
The silhouettes, materials, framing and choreography have substantial differences
from the original game cinematic. The source's original rigged character assets
and camera tracks are not available. This is a procedural recreation, not a
pixel-perfect reproduction.

## Run locally

Node.js 22 or newer is sufficient; the runtime dependency is already vendored.

```powershell
npm run dev
```

Open `http://127.0.0.1:5173/`. The page has automatic playback and no controls or
extra overlays. Reference-inspired interface graphics appear inside it.
It fits a 16:9 canvas into the window. The drawing buffer is capped at 1280 pixels
wide, and static scenery uses instanced meshes. A reduced-motion preference shows
the opening pose. Stop the local server with Ctrl+C in its terminal.

```powershell
npm test
npm run build
node scripts/serve-pages.mjs --root .pages-build --port 5174
```

The build contains `index.html`, `src/`, `public/` and the GIF fallback; it excludes the source
movie, repository metadata, analysis intermediates and local attachments.
Relative asset URLs also work at the `/anhnam26/` GitHub Pages project path.

## Verification and source comparisons

Native browser inspection is explicitly enabled at `/?inspect=1`. That mode
exposes `K1.seek(seconds)`, `K1.play()`, `K1.pause()`, `K1.stateAt(seconds)` and
`K1.inspect()` for screenshots and export tools. It adds no visible controls.
The regular page has no inspection API.

The local verification script requires the existing Playwright and Pillow
packages in the owner's selected Microsoft Store Python 3.13 installation.
With the server still running:

```powershell
& 'C:\Users\anhna\AppData\Local\Microsoft\WindowsApps\python3.13.exe' -X utf8 scripts/verify-k1.py --out 'D:\Temp\anhna\k1-recreation\comparison' --reference K1.mp4 --ffmpeg 'D:\ApiVid\node_modules\ffmpeg-static\ffmpeg.exe'
```

An alternate installed FFmpeg binary can be passed with `--ffmpeg`; omitting it
uses the existing `imageio_ffmpeg` package. No interpreter or package environment
is created. `--browser` accepts another installed Chrome executable.

The script renders both complete cycles in seek mode, checks visible identities
and joint attachment, captures matching source/recreated screenshots, checks the
loop seam, autoplay, desktop/mobile layout and reduced motion, and writes JSON
metrics and comparison sheets. The unit tests additionally check both cycles
at every one of the source's 7,338 frame timestamps. These checks are deterministic
seek checks, not a claim that two eight-minute wall-clock playthroughs were filmed.

## Source organization

- `src/animation/timeline.js`: full fixed script and source clock.
- `src/animation/renderer.js`: camera, lighting, scene composition and effects.
- `src/characters/`: model construction, joint IK and authored movement.
- `src/scenes/`: instanced environments, materials and reference UI.
- `src/transitions/loop.js`: render-target blend at the final-to-first seam.
- `src/assets/`: procedural textures and provenance of reference-derived images.
- `public/portraits/`: static face textures and the final photograph prop.
- `public/k1-poster.png`: code-rendered loading/reduced-motion fallback pose.
- `public/vendor/`: Three.js modules and their MIT license.
- `scripts/verify-k1.py`: browser verification and matching-timestamp comparisons.

All runtime assets are local. The original video stays a comparison reference.

## README GIF

The standalone preview is `assets/sports-preview.gif`, outside the activity SVG.
It has 306 frames, lasts 25.5 seconds, loops forever and uses 480 x 270 pixels at
12 fps with a 64-color palette. Its size is approximately 4.05 MB. The filename
follows the supplied prompt, although the confirmed reference is not sports.
Modern WebGL2 browsers play the full animation; a browser without WebGL2 receives
this GIF preview. A reduced-motion fallback uses the static opening poster.

The preview concatenates these full-animation intervals at their existing speed:

| Start | End | Beat |
| --- | --- | --- |
| 0.000 | 2.600 | Industrial street opening |
| 4.267 | 7.267 | Skull operator walking with the rifle |
| 9.800 | 10.467 | Gold mask close-up |
| 23.200 | 25.200 | Animal following view |
| 37.500 | 39.367 | Goggle animal reaction |
| 77.267 | 80.033 | Commander-room conversation |
| 128.400 | 131.400 | Firefight |
| 176.033 | 179.033 | Blue floating scene |
| 196.533 | 200.267 | Warm hangar fight |
| 241.767 | 244.600 | Group, photograph montage and loop join |

Other scenes are omitted **only from the preview**. No full-app scene duration
is shortened. The final preview frame is sampled at 244.599 seconds so it joins
the first frame cleanly. GIF palette reduction and 12 fps cause visible quality
differences from the full browser render. Decoded timing and excerpt provenance
are recorded in `assets/sports-preview.json`.

Regenerate with the local app running:

```powershell
& 'C:\Users\anhna\AppData\Local\Microsoft\WindowsApps\python3.13.exe' -X utf8 scripts/export-k1-preview.py --frames 'D:\Temp\anhna\k1-recreation\gif-frames' --ffmpeg 'D:\ApiVid\node_modules\ffmpeg-static\ffmpeg.exe'
```

The exporter captures the JavaScript-rendered page and verifies every decoded
GIF frame, dimensions, duration and infinite-loop extension. It never reads or
transcodes the original video. Activity's hourly workflow updates its own three
files and leaves this preview independent.
