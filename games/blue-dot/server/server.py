from http.server import BaseHTTPRequestHandler, HTTPServer
import json
import os

HOST = "0.0.0.0"
PORT = 8090

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
SCORES_FILE = os.path.join(BASE_DIR, "scores.json")


def load_scores():
    try:
        with open(SCORES_FILE, "r", encoding="utf-8") as f:
            return json.load(f)
    except:
        return []


def save_scores(scores):
    with open(SCORES_FILE, "w", encoding="utf-8") as f:
        json.dump(scores, f, ensure_ascii=False, indent=2)


class Handler(BaseHTTPRequestHandler):

    def send_json(self, data, status=200):
        body = json.dumps(data).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def do_GET(self):
        if self.path != "/scores":
            return self.send_json({"error": "Not found"}, 404)

        scores = load_scores()
        best = {}

        for score in scores:
            name = str(score.get("name", "")).strip()
            time = float(score.get("time", 0))
            key = name.lower()

            if key not in best or time > best[key]["time"]:
                best[key] = {"name": name, "time": time}

        scores = sorted(
            best.values(),
            key=lambda x: x["time"],
            reverse=True
        )

        self.send_json(scores[:5])

    def do_POST(self):
        if self.path != "/score":
            return self.send_json({"error": "Not found"}, 404)

        try:
            length = int(self.headers.get("Content-Length", 0))
            data = json.loads(self.rfile.read(length))

            name = str(data.get("name", "")).strip()[:20]
            time = round(float(data.get("time", 0)), 2)

            if not name or time <= 0:
                return self.send_json({"error": "Ongeldige gegevens"}, 400)

            scores = load_scores()
            existing = None

            for score in scores:
                if str(score["name"]).lower() == name.lower():
                    existing = score
                    break

            if existing:
                if time > float(existing["time"]):
                    existing["time"] = time
                    existing["name"] = name
                    message = "Nieuwe persoonlijke beste score!"
                else:
                    message = "Je oude score was beter."
            else:
                scores.append({"name": name, "time": time})
                message = "Score opgeslagen!"

            scores.sort(key=lambda x: x["time"], reverse=True)
            save_scores(scores)

            self.send_json({
                "success": True,
                "message": message
            })

        except Exception:
            self.send_json({"error": "Ongeldige gegevens"}, 400)


HTTPServer((HOST, PORT), Handler).serve_forever()