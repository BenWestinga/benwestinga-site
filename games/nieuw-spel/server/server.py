from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
import json

PORT = 8091


class Handler(BaseHTTPRequestHandler):

    def do_GET(self):

        if self.path == "/test":

            body = json.dumps({
                "message": "New Game API works!"
            }).encode()

            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.end_headers()
            self.wfile.write(body)

            return

        self.send_response(404)
        self.end_headers()


print(f"New Game API running on port {PORT}")

server = ThreadingHTTPServer(
    ("0.0.0.0", PORT),
    Handler
)

server.serve_forever()