import json
import os
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from urllib import request as urlrequest
from urllib import error as urlerror


class ProxyHandler(SimpleHTTPRequestHandler):
    def _send_json(self, status, payload):
        body = json.dumps(payload, ensure_ascii=False).encode('utf-8')
        self.send_response(status)
        self.send_header('Content-Type', 'application/json; charset=utf-8')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Content-Length', str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def do_OPTIONS(self):
        if self.path == '/api/ai-proxy':
            self.send_response(200)
            self.send_header('Access-Control-Allow-Origin', '*')
            self.send_header('Access-Control-Allow-Methods', 'POST, OPTIONS')
            self.send_header('Access-Control-Allow-Headers', 'Content-Type, Authorization')
            self.send_header('Access-Control-Allow-Credentials', 'false')
            self.end_headers()
            return
        super().do_OPTIONS()

    def do_POST(self):
        if self.path != '/api/ai-proxy':
            self.send_error(404)
            return

        try:
            length = int(self.headers.get('Content-Length', '0'))
            raw_body = self.rfile.read(length) if length > 0 else b'{}'
            data = json.loads(raw_body.decode('utf-8'))

            target_url = data.get('apiUrl', '').strip()
            api_key = data.get('apiKey', '').strip()
            if not target_url:
                self._send_json(400, {'error': '缺少 apiUrl'})
                return

            payload = {
                'model': data.get('model', 'qwen-turbo'),
                'messages': data.get('messages', []),
                'temperature': data.get('temperature', 0.7),
                'max_tokens': data.get('max_tokens', 1000)
            }
            # Allow a local test mode: apiUrl starting with mock:// will return a canned response
            if target_url.startswith('mock://'):
                mock_resp = json.dumps({
                    'harmonyScore': 88,
                    'style': '现代简约',
                    'analysis': {
                        'strengths': ['主色调明确', '层次清晰'],
                        'weaknesses': ['缺少点睛色']
                    },
                    'suggestions': ['增加对比色', '微调饱和度'],
                    'summary': '这是一个本地模拟返回，用于测试代理链路。'
                }, ensure_ascii=False).encode('utf-8')
                self.send_response(200)
                self.send_header('Content-Type', 'application/json; charset=utf-8')
                self.send_header('Access-Control-Allow-Origin', '*')
                self.send_header('Content-Length', str(len(mock_resp)))
                self.end_headers()
                self.wfile.write(mock_resp)
                return

            req = urlrequest.Request(
                target_url,
                data=json.dumps(payload, ensure_ascii=False).encode('utf-8'),
                headers={
                    'Content-Type': 'application/json',
                    'Authorization': f'Bearer {api_key}'
                },
                method='POST'
            )

            try:
                with urlrequest.urlopen(req, timeout=60) as resp:
                    response_body = resp.read()
                    # forward exact response back to client
                    self.send_response(resp.getcode())
                    self.send_header('Content-Type', resp.headers.get('Content-Type', 'application/json; charset=utf-8'))
                    self.send_header('Access-Control-Allow-Origin', '*')
                    self.send_header('Content-Length', str(len(response_body)))
                    self.end_headers()
                    self.wfile.write(response_body)
                    return
            except urlerror.HTTPError as he:
                # include body and status to help debugging from frontend
                try:
                    body = he.read()
                except Exception:
                    body = str(he).encode('utf-8')
                self.send_response(he.code)
                self.send_header('Content-Type', he.headers.get('Content-Type', 'application/json; charset=utf-8'))
                self.send_header('Access-Control-Allow-Origin', '*')
                self.send_header('Content-Length', str(len(body)))
                self.end_headers()
                self.wfile.write(body)
                print(f'Upstream HTTPError {he.code} for {target_url}:', body)
                return
            except Exception as exc2:
                print('Upstream request failed:', exc2)
                self._send_json(502, {'error': str(exc2)})
                return
        except Exception as exc:
            print('Proxy handler exception:', exc)
            self._send_json(502, {'error': str(exc)})

    def do_GET(self):
        super().do_GET()


if __name__ == '__main__':
    port = int(os.environ.get('PORT', '8000'))
    directory = os.path.dirname(os.path.abspath(__file__))
    os.chdir(directory)
    httpd = ThreadingHTTPServer(('0.0.0.0', port), ProxyHandler)
    print(f'Serving at http://127.0.0.1:{port}')
    httpd.serve_forever()
