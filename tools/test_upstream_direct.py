import json
from urllib import request, error

API_URL = 'https://llm-hlfbtvbtiws685bd.cn-beijing.maas.aliyuncs.com/compatible-mode/v1'
API_KEY = 'sk-aa60890ddd364d76a03a0af29c626943'

# Simple GET
try:
    req = request.Request(API_URL, method='GET')
    with request.urlopen(req, timeout=30) as resp:
        print('GET STATUS', resp.getcode())
        print('GET BODY', resp.read().decode('utf-8'))
except error.HTTPError as he:
    try:
        print('GET STATUS', he.code)
        print('GET BODY', he.read().decode('utf-8'))
    except Exception:
        print('GET ERROR', he)
except Exception as e:
    print('GET ERROR', e)

# Simple POST with Authorization header
payload = json.dumps({'test':'ping'}).encode('utf-8')
req = request.Request(API_URL, data=payload, headers={'Content-Type':'application/json', 'Authorization': f'Bearer {API_KEY}'}, method='POST')
try:
    with request.urlopen(req, timeout=30) as resp:
        print('POST STATUS', resp.getcode())
        print('POST BODY', resp.read().decode('utf-8'))
except error.HTTPError as he:
    try:
        print('POST STATUS', he.code)
        print('POST BODY', he.read().decode('utf-8'))
    except Exception:
        print('POST ERROR', he)
except Exception as e:
    print('POST ERROR', e)
