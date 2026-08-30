from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
import json
import sqlite3
import hashlib
import os
import base64

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


def hash_password(password):
    salt = os.urandom(16)

    password_hash = hashlib.scrypt(
        password.encode(),
        salt=salt,
        n=16384,
        r=8,
        p=1
    )

    return (
        base64.b64encode(password_hash).decode(),
        base64.b64encode(salt).decode()
    )


class Handler(BaseHTTPRequestHandler):

    def send_json(self, status, data):
        body = json.dumps(data).encode()

        self.send_response(status)
        self.send_header(
            "Content-Type",
            "application/json"
        )
        self.end_headers()

        self.wfile.write(body)


    def read_json(self):
        try:
            length = int(
                self.headers.get(
                    "Content-Length",
                    0
                )
            )

            return json.loads(
                self.rfile.read(length)
            )

        except:
            return None


    def do_GET(self):

        if self.path == "/test":

            self.send_json(
                200,
                {
                    "message": "New Game API works!"
                }
            )

            return


        if self.path == "/test-db":

            db = sqlite3.connect(DATABASE)

            amount = db.execute(
                "SELECT COUNT(*) FROM users"
            ).fetchone()[0]

            db.close()

            self.send_json(
                200,
                {
                    "database": "working",
                    "accounts": amount
                }
            )

            return


        self.send_json(
            404,
            {
                "error": "Not found."
            }
        )


    def do_POST(self):

        if self.path == "/register":

            data = self.read_json()

            if not data:

                self.send_json(
                    400,
                    {
                        "error": "Invalid request."
                    }
                )

                return


            username = data.get(
                "username",
                ""
            )

            password = data.get(
                "password",
                ""
            )


            if not isinstance(username, str):

                self.send_json(
                    400,
                    {
                        "error": "Invalid username."
                    }
                )

                return


            if len(username) < 5 or len(username) > 25:

                self.send_json(
                    400,
                    {
                        "error":
                        "Username must be between 5 and 25 characters."
                    }
                )

                return


            if not isinstance(password, str):

                self.send_json(
                    400,
                    {
                        "error": "Invalid password."
                    }
                )

                return


            if len(password) < 8:

                self.send_json(
                    400,
                    {
                        "error":
                        "Password must contain at least 8 characters."
                    }
                )

                return


            password_hash, password_salt = hash_password(
                password
            )


            db = sqlite3.connect(DATABASE)

            try:

                db.execute(
                    """
                    INSERT INTO users (
                        username,
                        password_hash,
                        password_salt
                    )
                    VALUES (?, ?, ?)
                    """,
                    (
                        username,
                        password_hash,
                        password_salt
                    )
                )

                db.commit()

            except sqlite3.IntegrityError:

                db.close()

                self.send_json(
                    409,
                    {
                        "error":
                        "This username already exists."
                    }
                )

                return


            db.close()


            self.send_json(
                201,
                {
                    "message":
                    "Account created successfully.",
                    "username":
                    username
                }
            )

            return


        self.send_json(
            404,
            {
                "error": "Not found."
            }
        )


setup_database()

print(
    f"New Game API running on port {PORT}"
)

server = ThreadingHTTPServer(
    ("0.0.0.0", PORT),
    Handler
)

server.serve_forever()