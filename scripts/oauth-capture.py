#!/usr/bin/env python3
# Captura el ?code= del redirect OAuth en localhost:8765 y lo guarda.
import http.server, urllib.parse, os

CODE_FILE = "/tmp/goauth_code.txt"
if os.path.exists(CODE_FILE):
    os.remove(CODE_FILE)

class H(http.server.BaseHTTPRequestHandler):
    def log_message(self, *a): pass
    def do_GET(self):
        q = urllib.parse.urlparse(self.path).query
        params = urllib.parse.parse_qs(q)
        code = (params.get("code") or [""])[0]
        self.send_response(200)
        self.send_header("Content-Type", "text/html; charset=utf-8")
        self.end_headers()
        if code:
            open(CODE_FILE, "w").write(code)
            self.wfile.write("<h2>✅ Autorización recibida. Ya puedes volver a la terminal / al chat.</h2>".encode())
        else:
            self.wfile.write(("<h2>No llegó el código. Error: " + urllib.parse.unquote(q) + "</h2>").encode())
    def finish(self):
        try: super().finish()
        except Exception: pass

srv = http.server.HTTPServer(("127.0.0.1", 8765), H)
# Atiende una sola petición (el redirect) y termina.
srv.handle_request()
print("captured" if os.path.exists(CODE_FILE) else "no-code")
