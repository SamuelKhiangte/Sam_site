#!/usr/bin/env python3
"""Local server for the Zo Scholars Journal Club site.

Run it from inside the zo-scholars folder:

    python3 server.py

then open http://localhost:8000

While this is running, every registration submitted on the site is appended to
a real Excel file on disk:

    registrations.xlsx        full list — name, email, institute, subject,
                              designation, timestamp   (private, git-ignored)
    data/registrations.json   the same data, used as the source of truth
    data/members.json         public fields only — this is the file the live
                              GitHub Pages site reads to show the members table

Only the standard library is used, so there is nothing to install.
"""

import json
import os
import re
import shutil
import zipfile
from http.server import SimpleHTTPRequestHandler, HTTPServer
from urllib.parse import urlparse

BASE = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.join(BASE, "data")
REGISTRATIONS_JSON = os.path.join(DATA_DIR, "registrations.json")
MEMBERS_JSON = os.path.join(DATA_DIR, "members.json")
XLSX_PATH = os.path.join(BASE, "registrations.xlsx")

COLUMNS = [
    ("Name", "name", 24),
    ("Email", "email", 30),
    ("Institute", "institute", 34),
    ("Subject", "subject", 26),
    ("Designation", "designation", 24),
    ("Research Topic", "research_topic", 36),
    ("Registered", "registered", 20),
]

PUBLIC_FIELDS = ("institute", "subject", "designation", "research_topic")


# --------------------------------------------------------------------------- #
# storage
# --------------------------------------------------------------------------- #

def load_registrations():
    if not os.path.exists(REGISTRATIONS_JSON):
        return []
    try:
        with open(REGISTRATIONS_JSON, encoding="utf-8") as fh:
            data = json.load(fh)
        return data if isinstance(data, list) else []
    except (json.JSONDecodeError, OSError):
        return []


def save_all(records):
    os.makedirs(DATA_DIR, exist_ok=True)

    _write_json(REGISTRATIONS_JSON, records)
    _write_json(MEMBERS_JSON, [
        {field: r.get(field, "") for field in PUBLIC_FIELDS} for r in records
    ])
    write_xlsx(records, XLSX_PATH)


def _write_json(path, payload):
    tmp = path + ".tmp"
    with open(tmp, "w", encoding="utf-8") as fh:
        json.dump(payload, fh, indent=2, ensure_ascii=False)
    os.replace(tmp, path)


# --------------------------------------------------------------------------- #
# xlsx writing (stdlib only — an .xlsx is a zip of xml parts)
# --------------------------------------------------------------------------- #

CONTROL_CHARS = re.compile(r"[\x00-\x08\x0B\x0C\x0E-\x1F]")


def esc(value):
    text = "" if value is None else str(value)
    text = (text.replace("&", "&amp;").replace("<", "&lt;")
                .replace(">", "&gt;").replace('"', "&quot;"))
    return CONTROL_CHARS.sub("", text)


def col_name(index):
    name = ""
    index += 1
    while index > 0:
        index, rem = divmod(index - 1, 26)
        name = chr(65 + rem) + name
    return name


def write_xlsx(records, path):
    cols = "".join(
        f'<col min="{i+1}" max="{i+1}" width="{width}" customWidth="1"/>'
        for i, (_, _, width) in enumerate(COLUMNS)
    )

    rows = [[header for header, _, _ in COLUMNS]]
    rows += [[r.get(key, "") for _, key, _ in COLUMNS] for r in records]

    body = ""
    for r, cells in enumerate(rows):
        cells_xml = ""
        for c, value in enumerate(cells):
            ref = f"{col_name(c)}{r + 1}"
            if value in ("", None):
                cells_xml += f'<c r="{ref}"/>'
            else:
                cells_xml += (f'<c r="{ref}" t="inlineStr"><is>'
                              f'<t xml:space="preserve">{esc(value)}</t></is></c>')
        body += f'<row r="{r + 1}">{cells_xml}</row>'

    parts = {
        "[Content_Types].xml":
            '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
            '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">'
            '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>'
            '<Default Extension="xml" ContentType="application/xml"/>'
            '<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>'
            '<Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>'
            '</Types>',
        "_rels/.rels":
            '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
            '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'
            '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>'
            '</Relationships>',
        "xl/workbook.xml":
            '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
            '<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" '
            'xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">'
            '<sheets><sheet name="Mailing List" sheetId="1" r:id="rId1"/></sheets>'
            '</workbook>',
        "xl/_rels/workbook.xml.rels":
            '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
            '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'
            '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/>'
            '</Relationships>',
        "xl/worksheets/sheet1.xml":
            '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
            '<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">'
            f"<cols>{cols}</cols><sheetData>{body}</sheetData></worksheet>",
    }

    tmp = path + ".tmp"
    with zipfile.ZipFile(tmp, "w", zipfile.ZIP_DEFLATED) as zf:
        for name, text in parts.items():
            zf.writestr(name, text.encode("utf-8"))
    os.replace(tmp, path)


# --------------------------------------------------------------------------- #
# http
# --------------------------------------------------------------------------- #

class Handler(SimpleHTTPRequestHandler):

    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=BASE, **kwargs)

    def log_message(self, fmt, *args):
        # keep the console quiet — only api calls and errors are worth showing
        if args and "/api/" in str(args[0]):
            super().log_message(fmt, *args)

    # -- helpers ----------------------------------------------------------- #

    def route(self):
        return urlparse(self.path).path.rstrip("/")

    def send_json(self, payload, status=200):
        body = json.dumps(payload, ensure_ascii=False).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Cache-Control", "no-store")
        self.end_headers()
        self.wfile.write(body)

    # -- routes ------------------------------------------------------------ #

    def do_GET(self):
        route = self.route()

        if route.endswith("/api/ping"):
            return self.send_json({"ok": True})

        if route.endswith("/api/members"):
            records = load_registrations()
            return self.send_json(
                [{f: r.get(f, "") for f in PUBLIC_FIELDS} for r in records]
            )

        if route.endswith("/api/export"):
            if not os.path.exists(XLSX_PATH):
                write_xlsx(load_registrations(), XLSX_PATH)
            size = os.path.getsize(XLSX_PATH)
            self.send_response(200)
            self.send_header(
                "Content-Type",
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
            self.send_header(
                "Content-Disposition",
                'attachment; filename="zo-scholars-mailing-list.xlsx"')
            self.send_header("Content-Length", str(size))
            self.end_headers()
            with open(XLSX_PATH, "rb") as fh:
                shutil.copyfileobj(fh, self.wfile)
            return

        return super().do_GET()

    def do_POST(self):
        if not self.route().endswith("/api/register"):
            return self.send_json({"error": "not found"}, 404)

        try:
            length = int(self.headers.get("Content-Length") or 0)
            record = json.loads(self.rfile.read(length) or b"{}")
        except (ValueError, json.JSONDecodeError):
            return self.send_json({"error": "bad request"}, 400)

        if not isinstance(record, dict):
            return self.send_json({"error": "bad request"}, 400)

        clean = {key: str(record.get(key, "")).strip() for _, key, _ in COLUMNS}

        missing = [k for k in ("name", "email", "institute", "subject", "designation", "research_topic")
                   if not clean[k]]
        if missing:
            return self.send_json({"error": "missing: " + ", ".join(missing)}, 400)

        records = load_registrations()
        if any(r.get("email", "").lower() == clean["email"].lower() for r in records):
            return self.send_json({"error": "already registered"}, 409)

        records.append(clean)
        save_all(records)

        print(f"  + registered {clean['name']} <{clean['email']}> "
              f"— {len(records)} on the list", flush=True)
        return self.send_json({"ok": True, "count": len(records)})


def main():
    port = int(os.environ.get("PORT", 8000))
    os.makedirs(DATA_DIR, exist_ok=True)
    if not os.path.exists(MEMBERS_JSON):
        _write_json(MEMBERS_JSON, [])

    print("Zo Scholars Journal Club — local server")
    print(f"  site          http://localhost:{port}")
    print(f"  excel file    {XLSX_PATH}")
    print("  press Ctrl+C to stop\n", flush=True)

    server = HTTPServer(("", port), Handler)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nstopped")


if __name__ == "__main__":
    main()
