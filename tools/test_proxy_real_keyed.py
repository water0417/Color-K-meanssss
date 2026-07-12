import os, json
from urllib import request, error as urlerror

API_URL = 'https://llm-hlfbtvbtiws685bd.cn-beijing.maas.aliyuncs.com/compatible-mode/v1/chat/completions'
API_KEY = 'sk-aa60890ddd364d76a03a0af29c626943'

url = 'http://127.0.0.1:8000/api/ai-proxy'
payload = {
    'apiUrl': API_URL,
    'apiKey': API_KEY,
    'model': 'qwen-turbo',
    'messages': [{'role':'user','content':'测试'}],
    'temperature': 0.2
}
req = request.Request(url, data=json.dumps(payload).encode('utf-8'), headers={'Content-Type':'application/json'}, method='POST')
try:
    with request.urlopen(req, timeout=60) as resp:
        body = resp.read()
        try:
            text = body.decode('utf-8')
        except Exception:
            text = str(body)
        print('STATUS', resp.getcode())
        print('BODY', text)
except urlerror.HTTPError as he:
    try:
        body = he.read().decode('utf-8')
    except Exception:
        body = str(he)
    print('STATUS', he.code)
    print('BODY', body)
except Exception as e:
    print('ERROR', e)
