from pathlib import Path
import subprocess,imageio_ffmpeg,json
root=Path(__file__).resolve().parents[1];e=root/'evidence';ff=imageio_ffmpeg.get_ffmpeg_exe();video=e/'paperclaw-demo.mp4'
result=subprocess.run([ff,'-i',str(video),'-af','volumedetect','-vn','-f','null','-'],capture_output=True,text=True)
lines=[l.strip() for l in result.stderr.splitlines() if any(t in l for t in ['Duration:','Video:','Audio:','mean_volume:','max_volume:'])]
for seconds in [5,42,68,86,108]:subprocess.run([ff,'-y','-loglevel','error','-ss',str(seconds),'-i',str(video),'-frames:v','1',str(e/f'video-check-{seconds}.jpg')],check=True)
(e/'video-check.json').write_text(json.dumps({'date':'2026-09-30','decoderExitCode':result.returncode,'checks':lines,'framesReviewedSeconds':[5,42,68,86,108]},indent=2))
print('\n'.join(lines))
