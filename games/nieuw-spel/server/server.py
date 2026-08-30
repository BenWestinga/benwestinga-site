from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
import json
import sqlite3

PORT = 8091
DATABASE = "/data/accounts.db"


def setup_database():
    db = sqlite3.connect(DATABASE)

    db.execute("""
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT NOT NULL UNIQUE COLLATE NOCASE,
            password_hash TEXT NOT NULL,
            password_salt TEXT NOT NULL
        )
    """)

    db.commit()
    db.close()


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

        if self.path == "/test-db":

            db = sqlite3.connect(DATABASE)

            amount = db.execute(
                "SELECT COUNT(*) FROM users"
            ).fetchone()[0]

            db.close()

            body = json.dumps({
                "database": "working",
                "accounts": amount
            }).encode()

            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.end_headers()
            self.wfile.write(body)

            return

        self.send_response(404)
        self.end_headers()


setup_database()

print(f"New Game API running on port {PORT}")

server = ThreadingHTTPServer(
    ("0.0.0.0", PORT),
    Handler
)

server.serve_forever()