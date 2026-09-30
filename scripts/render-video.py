"""Edit real browser captures into an English narrated demo. No mock UI frames."""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont
import imageio_ffmpeg, subprocess, wave, json, textwrap
root=Path(__file__).resolve().parents[1]; evidence=root/'evidence'; out=evidence/'video-edit';out.mkdir(exist_ok=True)
lines=(root/'docs/NARRATION.txt').read_text().splitlines()
durations=[]
for p in sorted((evidence/'voice').glob('*.wav')):
 with wave.open(str(p)) as w:durations.append(w.getnframes()/w.getframerate())
font=ImageFont.truetype('C:/Windows/Fonts/segoeui.ttf',32); small=ImageFont.truetype('C:/Windows/Fonts/segoeui.ttf',24); title=ImageFont.truetype('C:/Windows/Fonts/georgia.ttf',52)
ffmpeg=imageio_ffmpeg.get_ffmpeg_exe()
assets=['desktop-welcome.jpg','desktop-welcome.jpg','demo-sources.jpg','demo-sources.jpg','demo-comparison.jpg','demo-collection.jpg','desktop-welcome.jpg','demo-collection.jpg','desktop-welcome.jpg','desktop-welcome.jpg']
labels=['A question needs an evidence trail','A research desk for an environmental briefing','Search real publications','Inspect sources and their provenance','Compare scope, dates and unknowns','Save, recover and export your reading trail','New during the hackathon: a conversational research workflow','Real MCP tools. Private local collections.','Independent Alexa+ simulator · text first · optional voice','Follow the evidence. Keep what matters.']
subtitles=[];offset=0
manifest=json.loads((evidence/'recording/manifest.json').read_text());recordings=evidence/'recording'
def stamp(t):
 ms=round(t*1000);return f'{ms//3600000:02}:{ms//60000%60:02}:{ms//1000%60:02},{ms%1000:03}'
clips=[]
for i,(line,duration,asset,label) in enumerate(zip(lines,durations,assets,labels)):
 # Captured product is always the dominant visual. End-user evidence frames are retained.
 image=Image.new('RGB',(1920,1080),'#172f2b');d=ImageDraw.Draw(image);d.text((64,20),'PaperClaw  /  Research Companion',font=small,fill='#daed9f');d.text((1050,20),'RUNNING PRODUCT · EDITED BROWSER CAPTURE',font=small,fill='#f6f4ed')
 shot=Image.open(evidence/asset).convert('RGB');shot.thumbnail((1800,850),Image.Resampling.LANCZOS);image.paste(shot,((1920-shot.width)//2,65));d.text((64,925),label,font=font,fill='#daed9f')
 # Accurate paragraph-level synchronization from independently generated audio segments.
 chunks=textwrap.wrap(line,width=110);drawlines=chunks[:2];
 for k,text in enumerate(drawlines):d.text((64,978+k*35),text,font=small,fill='#fffef9')
 frame=out/f'{i:02}.jpg';image.save(frame,quality=95)
 video=out/f'{i:02}.mp4';audio=evidence/'voice'/f'{i:02}.wav'
 # Every segment includes actual browser footage transitions where available, then a held evidence frame.
 selected=manifest[max(0,i*3):i*3+3] if i in [2,3,4,5] else []
 concat=out/f'{i:02}.txt';entries=[]
 for item in selected:
  raw=Image.open(recordings/item['file']).convert('RGB');raw.thumbnail((1800,850),Image.Resampling.LANCZOS);screen=image.copy();screen.paste(Image.new('RGB',(1800,850),'#172f2b'),(60,65));screen.paste(raw,((1920-raw.width)//2,65));p=out/f'raw-{i}-{item["file"]}';screen.save(p,quality=95);entries+= [f"file '{p.as_posix()}'",'duration 0.25']
 if i==5:
  # Show the real save form, recovered collection, and actual export references during this narration.
  for extra,share in [('demo-save.jpg',.25),('demo-collection.jpg',.25),('demo-export-references.jpg',.5)]:
   scene=image.copy();shot=Image.open(evidence/extra).convert('RGB');shot.thumbnail((1800,850),Image.Resampling.LANCZOS);scene.paste(Image.new('RGB',(1800,850),'#172f2b'),(60,65));scene.paste(shot,((1920-shot.width)//2,65));extraFrame=out/extra;scene.save(extraFrame,quality=95);entries += [f"file '{extraFrame.as_posix()}'",f'duration {(duration-.25*len(selected))*share}']
  entries += [f"file '{extraFrame.as_posix()}'"]
 else:
  entries += [f"file '{frame.as_posix()}'",f'duration {max(.2,duration-.25*len(selected))}',f"file '{frame.as_posix()}'"]
 concat.write_text('\n'.join(entries))
 subprocess.run([ffmpeg,'-y','-loglevel','error','-f','concat','-safe','0','-i',str(concat),'-i',str(audio),'-t',str(duration),'-vf','fps=24,format=yuv420p','-c:v','libx264','-preset','fast','-crf','20','-c:a','aac','-b:a','192k',str(video)],check=True)
 # Split longer subtitle paragraphs into readable, timed pieces. Timing is approximate within each paragraph.
 pieces=textwrap.wrap(line,width=90);total=sum(len(p) for p in pieces);t=offset
 for piece in pieces:
  end=t+duration*len(piece)/total;subtitles.append(f'{len(subtitles)+1}\n{stamp(t)} --> {stamp(end)}\n{piece}\n');t=end
 clips.append(video);offset+=duration
playlist=out/'concat.txt';playlist.write_text('\n'.join(f"file '{p.as_posix()}'" for p in clips))
final=evidence/'paperclaw-demo.mp4';subprocess.run([ffmpeg,'-y','-loglevel','error','-f','concat','-safe','0','-i',str(playlist),'-c','copy','-movflags','+faststart',str(final)],check=True)
(evidence/'paperclaw-demo.srt').write_text('\n'.join(subtitles),encoding='utf-8')
(evidence/'video-metadata.json').write_text(json.dumps({'durationSeconds':round(offset,2),'resolution':'1920x1080','fps':24,'audio':'English Windows SAPI synthetic narration, no human impersonation','visuals':'Original UI screenshots plus real Chrome CDP screencast frames, edited for readability','subtitles':'English SRT; paragraph starts aligned to audio segments, internal cue times approximate','path':str(final),'bytes':final.stat().st_size},indent=2))
print(json.dumps({'seconds':round(offset,2),'bytes':final.stat().st_size,'video':str(final)}))
