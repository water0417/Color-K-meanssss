from urllib import request, error

base = 'https://llm-hlfbtvbtiws685bd.cn-beijing.maas.aliyuncs.com'
paths = [
    '/v1',
    '/v1/chat/completions',
    '/openapi/compatible-mode/v1',
    '/openapi/compatible-mode/v1/chat/completions',
    '/compatible-mode/v1/chat/completions',
    '/openapi/v1',
    '/openapi',
    '/compatible-mode',
    '/openapi/compat/v1',
]

for p in paths:
    url = base + p
    try:
        req = request.Request(url, method='GET')
        with request.urlopen(req, timeout=10) as resp:
            print(url, 'GET', resp.getcode())
    except error.HTTPError as he:
        try:
            body = he.read().decode('utf-8')
        except Exception:
            body = ''
        print(url, 'GET', he.code, 'BODY', body[:200])
    except Exception as e:
        print(url, 'GET ERROR', e)

    try:
        req = request.Request(url, data=b'{}', headers={'Content-Type':'application/json'}, method='POST')
        with request.urlopen(req, timeout=10) as resp:
            print(url, 'POST', resp.getcode())
    except error.HTTPError as he:
        try:
            body = he.read().decode('utf-8')
        except Exception:
            body = ''
        print(url, 'POST', he.code, 'BODY', body[:200])
    except Exception as e:
        print(url, 'POST ERROR', e)
