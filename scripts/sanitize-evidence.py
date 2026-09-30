import json
from pathlib import Path
from urllib.parse import urlsplit,urlunsplit
p=Path('evidence/benchmark.json');j=json.loads(p.read_text())
for row in j['rows']:
 for link in row.get('links',[]):
  if 'finalUrl' in link:
   u=urlsplit(link['finalUrl']);link['finalUrl']=urlunsplit((u.scheme,u.netloc,u.path,'',''))
   if any(s in u.netloc for s in ['validate.','perfdrive']):link['access']='Anti-bot challenge; HTTP 200 does not establish readable publication'
p.write_text(json.dumps(j,indent=2))
