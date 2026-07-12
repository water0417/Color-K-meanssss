import json
from urllib import request

url = 'http://127.0.0.1:8000/api/ai-proxy'
payload = {'apiUrl':'mock://local'}
req = request.Request(url, data=json.dumps(payload).encode('utf-8'), headers={'Content-Type':'application/json'}, method='POST')
try:
    with request.urlopen(req, timeout=30) as resp:
        body = resp.read().decode('utf-8')
        print('STATUS', resp.getcode())
        print('BODY', body)
except Exception as e:
    print('ERROR', e)
