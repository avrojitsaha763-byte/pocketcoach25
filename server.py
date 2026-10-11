import http.server
import socketserver
import webbrowser
import os

PORT = 8080
DIRECTORY = os.path.dirname(os.path.abspath(__file__))

class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIRECTORY, **kwargs)

print(f"=======================================================")
print(f"⚡ THE SYSTEM: SOLO LEVELING FITNESS ENGINE ONLINE ⚡")
print(f"Serving at: http://localhost:{PORT}")
print(f"Press Ctrl+C to terminate.")
print(f"=======================================================")

webbrowser.open(f"http://localhost:{PORT}")

with socketserver.TCPServer(("", PORT), Handler) as httpd:
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\n[SYSTEM] Server terminated gracefully.")
