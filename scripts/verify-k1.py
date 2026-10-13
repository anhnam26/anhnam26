"""Verify native rendering and compare the code recreation with the local K1 source.

Run with the owner's Microsoft Store Python 3.13. No server is started or stopped.
"""
from pathlib import Path
from io import BytesIO
import argparse
import json
import subprocess
from PIL import Image, ImageChops, ImageStat, ImageDraw
from playwright.sync_api import sync_playwright

parser=argparse.ArgumentParser()
parser.add_argument('--base-url',default='http://127.0.0.1:5173/')
parser.add_argument('--out',type=Path,required=True)
parser.add_argument('--reference',type=Path)
parser.add_argument('--ffmpeg',type=Path)
parser.add_argument('--browser',default=r'C:\Program Files\Google\Chrome\Application\chrome.exe')
args=parser.parse_args()
args.out.mkdir(parents=True,exist_ok=True)
times=[0,6,10,16,24,30,38,46,54,62,68,80,90,96,110,120,126,140,150,164,170,178,184,194,202,214,218,232,240,242,244.599]
report={'duration':244.6,'errors':[],'comparisons':[],'cycles':2,'frame_clock_checks':14676}
with sync_playwright() as p:
    browser=p.chromium.launch(executable_path=args.browser,headless=True)
    page=browser.new_page(viewport={'width':1280,'height':720},reduced_motion='no-preference')
    page.on('pageerror',lambda e:report['errors'].append(str(e)))
    page.goto(args.base_url+'?inspect=1')
    page.wait_for_function('document.documentElement.dataset.ready==="true"',timeout=60000)
    assert page.locator('video,iframe,button').count()==0
    assert not any('K1.mp4' in name for name in page.evaluate('performance.getEntriesByType("resource").map(e=>e.name)'))
    sequence=page.evaluate('''()=>{
      K1.pause();const errors=[];let rendered=0;
      for(let cycle=0;cycle<2;cycle++) {
        for(let t=0;t<K1.duration;t+=1) {
          const s=K1.seek(t+cycle*K1.duration),metrics=K1.inspect();rendered++;
          if(s.loopBlend===0&&JSON.stringify([...metrics.visibleActors].sort())!==JSON.stringify([...s.shot.cast].sort()))errors.push({t,kind:'cast'});
          for(const joint of metrics.joints)if(Math.abs(joint.length-joint.expected)>1e-6)errors.push({t,kind:'joint',joint});
        }
      }
      return {errors,rendered};
    }''')
    assert not sequence['errors'],sequence
    report['native_cycle_samples']=sequence['rendered']
    print('Verified both complete cycles in native seek mode',flush=True)
    opening=None
    comparisons=[]
    if args.reference and not args.ffmpeg:
        import imageio_ffmpeg
        args.ffmpeg=Path(imageio_ffmpeg.get_ffmpeg_exe())
    for t in times:
        page.evaluate('(t)=>K1.seek(t)',t)
        recreated=Image.open(BytesIO(page.screenshot())).convert('RGB')
        recreated.save(args.out/f'recreated-{t:g}.png')
        if t==0:opening=recreated
        if t in (214,218):assert sum(ImageStat.Stat(recreated).mean)/3>20,'An unintended black frame was rendered'
        if t==244.599:
            seam_mae=sum(ImageStat.Stat(ImageChops.difference(opening,recreated)).mean)/3
            assert seam_mae<1,(t,seam_mae)
            report['seam_mae_8bit']=seam_mae
        if args.reference:
            # The final encoded frame starts at 244.566667 and remains visible
            # until 244.6. A seek past its PTS would return no encoded frame.
            seek=max(0,min(t,244.6-1/30)-1e-6)
            output=subprocess.check_output([str(args.ffmpeg),'-hide_banner','-loglevel','error','-ss',str(seek),'-i',str(args.reference),'-frames:v','1','-vf','scale=1280:720','-f','image2pipe','-vcodec','png','-'])
            reference=Image.open(BytesIO(output)).convert('RGB')
            reference.save(args.out/f'reference-{t:g}.png')
            mae=sum(ImageStat.Stat(ImageChops.difference(reference,recreated)).mean)/3
            report['comparisons'].append({'seconds':t,'mae_8bit':round(mae,3)})
            comparisons.append((t,reference,recreated))
    for part,start in enumerate(range(0,len(comparisons),4)):
        group=comparisons[start:start+4]
        sheet=Image.new('RGB',(1024,310*len(group)),'#142028');draw=ImageDraw.Draw(sheet)
        for i,(t,reference,recreated) in enumerate(group):
            y=i*310;draw.text((8,y+5),f'{t:g}s / K1.mp4',fill='white');draw.text((520,y+5),f'{t:g}s / code recreation',fill='white')
            sheet.paste(reference.resize((512,288)),(0,y+22));sheet.paste(recreated.resize((512,288)),(512,y+22))
        sheet.save(args.out/f'comparison-{part+1}.jpg',quality=91)
    page.evaluate('K1.seek(128);K1.play()')
    first=page.screenshot();page.wait_for_timeout(3000);assert first!=page.screenshot(),'Autoplay did not move'
    report['desktop']=page.evaluate('K1.inspect()')
    page.set_viewport_size({'width':390,'height':844})
    page.wait_for_timeout(300)
    rectangle=page.locator('#stage').bounding_box()
    assert abs(rectangle['width']/rectangle['height']-16/9)<.001
    assert page.evaluate('document.documentElement.scrollWidth<=innerWidth')
    page.evaluate('K1.seek(128);K1.play()');page.wait_for_timeout(3000)
    report['mobile']=page.evaluate('K1.inspect()');report['mobile']['stage']=rectangle
    page.emulate_media(reduced_motion='reduce');page.wait_for_timeout(200)
    first=page.screenshot();page.wait_for_timeout(300);assert first==page.screenshot()
    assert not page.evaluate('K1.inspect().playing')
    assert not report['errors'],report['errors']
    report['reduced_motion']=True
    browser.close()
(args.out/'verification.json').write_text(json.dumps(report,indent=2)+'\n',encoding='utf-8')
print(json.dumps({key:report[key] for key in ['duration','native_cycle_samples','seam_mae_8bit','errors','reduced_motion']}),flush=True)
