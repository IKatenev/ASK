from pathlib import Path
import subprocess,os,time,urllib.request,urllib.error,urllib.parse,tempfile,hashlib,json
root=Path(__file__).resolve().parents[1]
env=os.environ.copy()
for key in list(env):
 if key.startswith(('TELEGRAM_', 'SMTP_')): env.pop(key)
# Avoid a persistent rate-limit fixture or a collision with real local testing.
rate=Path(tempfile.gettempdir())/('ask-form-'+hashlib.sha256((str(root)+'127.0.0.1').encode()).hexdigest())
previous=rate.read_bytes() if rate.exists() else None
if rate.exists(): rate.unlink()
server=subprocess.Popen(['php','-S','127.0.0.1:18743','-t',str(root)],env=env,stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL)
def request(path, fields=None, raw=None):
 body=raw if raw is not None else (urllib.parse.urlencode(fields).encode() if fields is not None else None)
 req=urllib.request.Request('http://127.0.0.1:18743/'+path,data=body)
 try:
  with urllib.request.urlopen(req) as r: return r.status,r.read()
 except urllib.error.HTTPError as e: return e.code,e.read()
try:
 for _ in range(50):
  try: request('index.html'); break
  except urllib.error.URLError: time.sleep(.1)
 valid={'user_name':'Иван & <тест>', 'user_email':'ivan+test@example.com','user_phone':'+7(928)313-50-50'}
 for endpoint in ['telegram.php','mail.php']:
  assert request(endpoint)[0]==405
  assert request(endpoint,{})[0]==422
  assert request(endpoint,{**valid,'user_phone':'+7(928)'})[0]==422
  assert request(endpoint,{**valid,'user_email':'bad'})[0]==422
  assert request(endpoint,{**valid,'user_name':'x'*201})[0]==422
  assert request(endpoint,{**valid,'website':'bot'})[0]==422
  assert request(endpoint,raw=b'user_name[]=x')[0]==422
  assert request(endpoint,raw=b'x=' + b'a'*9000)[0]==413
 assert request('telegram.php',valid)[0]==503
 assert request('mail.php',valid)[0]==429
 for asset in ['images/header-img.jpg','images/icons/checkmark.svg','js/vendor/imask.min.js','js/vendor/fancybox.umd.js','js/vendor/fancybox.css']:
  assert request(asset)[0]==200,asset
 print('PASS: method, validation, arrays, size, honeypot, missing configuration, shared rate limit, assets; no messages sent.')
finally:
 server.terminate(); server.wait()
 if previous is None:
  if rate.exists(): rate.unlink()
 else: rate.write_bytes(previous)
