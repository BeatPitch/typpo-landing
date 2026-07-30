#!/usr/bin/env python3
"""No-cache dev server for the Typpo landing bundle.

Serves this directory on :8080 with HTTP caching disabled, so a re-encoded video
or edited HTML always loads fresh on a normal reload — no hard-refresh, no stale
media. Threaded + broken-pipe tolerant so aborted video/image requests (common
when reloading mid-download) don't take the whole server down.
"""
import http.server
import os
import sys

os.chdir(os.path.dirname(os.path.abspath(__file__)))
PORT = 8080


VIDEO_EXTS = (".mp4", ".mov", ".webm", ".m4v")


class _RangeFile:
    """File wrapper that stops after the requested range length."""

    def __init__(self, f, remaining):
        self._f = f
        self._remaining = remaining

    def read(self, n=-1):
        if self._remaining <= 0:
            return b""
        if n < 0 or n > self._remaining:
            n = self._remaining
        data = self._f.read(n)
        self._remaining -= len(data)
        return data

    def close(self):
        self._f.close()


class Handler(http.server.SimpleHTTPRequestHandler):
    """Adds HTTP Range support (single range) — Safari requires byte-range
    responses for some media (notably HEVC) before it will start playback."""

    def send_head(self):
        path = self.translate_path(self.path)
        range_header = self.headers.get("Range")
        if not (range_header and range_header.startswith("bytes=") and os.path.isfile(path)):
            return super().send_head()
        try:
            f = open(path, "rb")
        except OSError:
            self.send_error(404, "File not found")
            return None
        size = os.fstat(f.fileno()).st_size
        spec = range_header[6:].split(",")[0].strip()
        start_s, _, end_s = spec.partition("-")
        try:
            if start_s:
                start = int(start_s)
                end = int(end_s) if end_s else size - 1
            else:  # suffix range: last N bytes
                start = max(0, size - int(end_s))
                end = size - 1
        except ValueError:
            f.close()
            return super().send_head()
        if start >= size:
            f.close()
            self.send_response(416)
            self.send_header("Content-Range", f"bytes */{size}")
            self.end_headers()
            return None
        end = min(end, size - 1)
        self.send_response(206)
        self.send_header("Content-Type", self.guess_type(path))
        self.send_header("Accept-Ranges", "bytes")
        self.send_header("Content-Range", f"bytes {start}-{end}/{size}")
        self.send_header("Content-Length", str(end - start + 1))
        self.end_headers()
        f.seek(start)
        self._range_remaining = end - start + 1
        return _RangeFile(f, self._range_remaining)

    def end_headers(self):
        # Videos: cache but always revalidate. The sequencer creates a fresh
        # <video> element for each clip on its turn, so under no-store every
        # hand-off would re-download and flicker. no-cache lets the browser
        # reuse the bytes while a conditional request still catches re-encodes
        # (new mtime -> 200, unchanged -> 304). Everything else stays no-store
        # so edited HTML always loads fresh.
        path = self.path.split("?", 1)[0].lower()
        if path.endswith(VIDEO_EXTS):
            self.send_header("Cache-Control", "no-cache")
            self.send_header("Accept-Ranges", "bytes")
        else:
            self.send_header("Cache-Control", "no-store, max-age=0")
        super().end_headers()

    def handle_one_request(self):
        try:
            super().handle_one_request()
        except (BrokenPipeError, ConnectionResetError):
            self.close_connection = True


class Server(http.server.ThreadingHTTPServer):
    daemon_threads = True
    allow_reuse_address = True

    def handle_error(self, request, client_address):
        # An aborted media request (browser reload) raises BrokenPipe/Reset in
        # the worker thread — ignore it instead of letting it surface as noise.
        exc = sys.exc_info()[1]
        if isinstance(exc, (BrokenPipeError, ConnectionResetError)):
            return
        super().handle_error(request, client_address)


if __name__ == "__main__":
    httpd = Server(("", PORT), Handler)
    print(f"no-cache dev server: http://localhost:{PORT}  (serving {os.getcwd()})")
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        pass
