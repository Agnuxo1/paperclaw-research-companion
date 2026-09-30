import urllib.request, re, json
from pathlib import Path
url='https://raw.githubusercontent.com/Agnuxo1/p2pclaw-mcp-server/064e01217998c331620be5918ba8fcbfbf858871/packages/api/src/index.js'
text=urllib.request.urlopen(url,timeout=20).read().decode('utf-8-sig')
paths=re.findall(r'app\.get\([\"\']([^\"\']+)[\"\']',text)
Path('evidence/upstream-routes.json').write_text(json.dumps({'commit':'064e01217998c331620be5918ba8fcbfbf858871','source':url,'get_routes':paths},indent=2))
print('\n'.join(p for p in paths if any(t in p for t in ['paper','search','rueda','wheel','dataset','mcp'])))
