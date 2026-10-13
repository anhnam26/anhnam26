"""Capture the code-rendered page, then encode an optimized README GIF.

The input is the running app. This exporter never reads or transcodes K1.mp4.
"""
from pathlib import Path
import argparse
import json
import math
import subprocess
from PIL import Image
from playwright.sync_api import sync_playwright

parser=argparse.ArgumentParser()
parser.add_argument('--base-url',default='http://127.0.0.1:5173/')
parser.add_argument('--frames',type=Path,required=True)
parser.add_argument('--output',type=Path,default=Path('assets/sports-preview.gif'))
parser.add_argument('--ffmpeg',type=Path)
parser.add_argument('--browser',default=r'C:\Program Files\Google\Chrome\Application\chrome.exe')
args=parser.parse_args()
if not args.ffmpeg:
    import imageio_ffmpeg
    args.ffmpeg=Path(imageio_ffmpeg.get_ffmpeg_exe())
fps=12
segments=[(0,2.6),(4.26667,7.26667),(9.8,10.46667),(23.2,25.2),(37.5,39.3667),
          (77.2667,80.0333),(128.4,131.4),(176.033,179.033),(196.533,200.267),(241.767,244.6)]
duration=sum(end-start for start,end in segments)
times=[]
for frame in range(math.ceil(duration*fps)):
    elapsed=frame/fps
    for start,end in segments:
        if elapsed<end-start:
            times.append(start+elapsed);break
        elapsed-=end-start
times[-1]=244.599
args.frames.mkdir(parents=True,exist_ok=True);args.output.parent.mkdir(parents=True,exist_ok=True)
with sync_playwright() as p:
    browser=p.chromium.launch(executable_path=args.browser,headless=True)
    page=browser.new_page(viewport={'width':640,'height':360},reduced_motion='no-preference')
    errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
    page.goto(args.base_url+'?inspect=1')
    page.wait_for_function('document.documentElement.dataset.ready==="true"',timeout=60000)
    for index,time in enumerate(times):
        page.evaluate('(t)=>K1.seek(t)',time)
        page.screenshot(path=str(args.frames/f'frame-{index:04d}.png'))
        if index%60==0:print(f'Captured {index+1}/{len(times)} code-rendered preview frames',flush=True)
    assert not errors,errors
    browser.close()
subprocess.run([str(args.ffmpeg),'-hide_banner','-loglevel','error','-y','-framerate',str(fps),
    '-i',str(args.frames/'frame-%04d.png'),'-frames:v',str(len(times)),
    '-filter_complex','scale=480:270:flags=lanczos,split[a][b];[a]palettegen=max_colors=64:stats_mode=diff[p];[b][p]paletteuse=dither=none:diff_mode=rectangle',
    '-loop','0','-gifflags','+transdiff',str(args.output)],check=True)
with Image.open(args.output) as gif:
    assert gif.size==(480,270) and gif.info.get('loop')==0
    count=gif.n_frames;decoded_duration=0
    for frame in range(count):
        gif.seek(frame);gif.convert('RGB').load();decoded_duration+=gif.info.get('duration',0)
    assert count==len(times),(count,len(times))
    assert abs(decoded_duration/1000-count/fps)<.15
    gif.seek(0);poster=Path('public/k1-poster.png');poster.parent.mkdir(parents=True,exist_ok=True);gif.convert('RGB').save(poster)
    metadata={'format':'GIF','width':480,'height':270,'fps':fps,'frames':count,'loop':0,'palette_colors':64,'dither':'none',
      'decoded_duration_seconds':decoded_duration/1000,'bytes':args.output.stat().st_size,
      'full_animation_seconds':244.6,'source':'Code-rendered browser app, not K1.mp4',
      'selected_source_intervals':segments,'last_frame_source_seconds':times[-1]}
    args.output.with_suffix('.json').write_text(json.dumps(metadata,indent=2)+'\n',encoding='utf-8')
print(json.dumps(metadata),flush=True)
