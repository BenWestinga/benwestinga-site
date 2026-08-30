from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from http.cookies import SimpleCookie

import json
import sqlite3
import hashlib
import os
import base64
import hmac
import secrets
import time


PORT = 8091
DATABASE = "/data/accounts.db"

SESSION_DURATION = 60 * 60 * 24 * 30  # 30 dagen


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

    db.execute("""
        CREATE TABLE IF NOT EXISTS sessions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            token_hash TEXT NOT NULL UNIQUE,
            expires_at INTEGER NOT NULL,
            FOREIGN KEY (user_id) REFERENCES users(id)
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


def verify_password(password, stored_hash, stored_salt):

    salt = base64.b64decode(stored_salt)

    password_hash = hashlib.scrypt(
        password.encode(),
        salt=salt,
        n=16384,
        r=8,
        p=1
    )

    calculated_hash = base64.b64encode(
        password_hash
    ).decode()

    return hmac.compare_digest(
        calculated_hash,
        stored_hash
    )


def hash_token(token):

    return hashlib.sha256(
        token.encode()
    ).hexdigest()


def create_session(db, user_id):

    token = secrets.token_urlsafe(32)

    expires_at = (
        int(time.time()) +
        SESSION_DURATION
    )

    db.execute(
        """
        INSERT INTO sessions (
            user_id,
            token_hash,
            expires_at
        )
        VALUES (?, ?, ?)
        """,
        (
            user_id,
            hash_token(token),
            expires_at
        )
    )

    db.commit()

    return token


class Handler(BaseHTTPRequestHandler):

    def send_json(
        self,
        status,
        data,
        cookie=None
    ):

        body = json.dumps(data).encode()

        self.send_response(status)

        self.send_header(
            "Content-Type",
            "application/json"
        )

        self.send_header(
            "Cache-Control",
            "no-store"
        )

        if cookie:
            self.send_header(
                "Set-Cookie",
                cookie
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


    def get_session_token(self):

        cookie_header = self.headers.get(
            "Cookie"
        )

        if not cookie_header:
            return None

        cookie = SimpleCookie()

        try:
            cookie.load(cookie_header)
        except:
            return None

        if "session" not in cookie:
            return None

        return cookie["session"].value


    def get_logged_in_user(self, db):

        token = self.get_session_token()

        if not token:
            return None

        token_hash = hash_token(token)

        now = int(time.time())

        user = db.execute(
            """
            SELECT
                users.id,
                users.username
            FROM sessions
            JOIN users
            ON users.id = sessions.user_id
            WHERE sessions.token_hash = ?
            AND sessions.expires_at > ?
            """,
            (
                token_hash,
                now
            )
        ).fetchone()

        if not user:
            return None

        # Iedere keer dat de speler actief is,
        # begint de 30 dagen opnieuw.
        new_expiry = (
            now +
            SESSION_DURATION
        )

        db.execute(
            """
            UPDATE sessions
            SET expires_at = ?
            WHERE token_hash = ?
            """,
            (
                new_expiry,
                token_hash
            )
        )

        db.commit()

        return user


    def session_cookie(self, token):

        return (
            f"session={token}; "
            f"Path=/; "
            f"HttpOnly; "
            f"Secure; "
            f"SameSite=Lax; "
            f"Max-Age={SESSION_DURATION}"
        )


    def do_GET(self):

        if self.path == "/test":

            self.send_json(
                200,
                {
                    "message":
                    "New Game API works!"
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


        if self.path == "/me":

            db = sqlite3.connect(DATABASE)

            user = self.get_logged_in_user(db)

            db.close()

            if not user:

                self.send_json(
                    401,
                    {
                        "error":
                        "Not logged in."
                    }
                )

                return


            self.send_json(
                200,
                {
                    "username": user[1]
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
                        "error":
                        "Invalid request."
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


            if (
                not isinstance(username, str)
                or len(username) < 5
                or len(username) > 25
            ):

                self.send_json(
                    400,
                    {
                        "error":
                        "Username must be between 5 and 25 characters."
                    }
                )

                return


            if (
                not isinstance(password, str)
                or len(password) < 8
            ):

                self.send_json(
                    400,
                    {
                        "error":
                        "Password must contain at least 8 characters."
                    }
                )

                return


            password_hash, password_salt = (
                hash_password(password)
            )

            db = sqlite3.connect(DATABASE)

            try:

                cursor = db.execute(
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


            token = create_session(
                db,
                cursor.lastrowid
            )

            db.close()


            self.send_json(
                201,
                {
                    "message":
                    "Account created successfully.",
                    "username":
                    username
                },
                self.session_cookie(token)
            )

            return


        if self.path == "/login":

            data = self.read_json()

            if not data:

                self.send_json(
                    400,
                    {
                        "error":
                        "Invalid request."
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


            db = sqlite3.connect(DATABASE)

            user = db.execute(
                """
                SELECT
                    id,
                    username,
                    password_hash,
                    password_salt
                FROM users
                WHERE username = ?
                """,
                (username,)
            ).fetchone()


            if not user:

                db.close()

                self.send_json(
                    404,
                    {
                        "error":
                        "Account does not exist."
                    }
                )

                return


            if not verify_password(
                password,
                user[2],
                user[3]
            ):

                db.close()

                self.send_json(
                    401,
                    {
                        "error":
                        "Incorrect password."
                    }
                )

                return


            token = create_session(
                db,
                user[0]
            )

            db.close()


            self.send_json(
                200,
                {
                    "message":
                    "Login successful.",
                    "username":
                    user[1]
                },
                self.session_cookie(token)
            )

            return


        if self.path == "/logout":

            token = self.get_session_token()

            if token:

                db = sqlite3.connect(DATABASE)

                db.execute(
                    """
                    DELETE FROM sessions
                    WHERE token_hash = ?
                    """,
                    (
                        hash_token(token),
                    )
                )

                db.commit()
                db.close()


            delete_cookie = (
                "session=; "
                "Path=/; "
                "HttpOnly; "
                "Secure; "
                "SameSite=Lax; "
                "Max-Age=0"
            )


            self.send_json(
                200,
                {
                    "message":
                    "Logged out successfully."
                },
                delete_cookie
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