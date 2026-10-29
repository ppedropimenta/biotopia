"""A small client for the public API, logged in as the owner, with nothing but the standard library."""

import json
import urllib.error
import urllib.request
from http.cookiejar import CookieJar


class ApiRefused(Exception):
    """The API answered with an error; `reason` is its code and the field problems."""

    def __init__(self, status: int, reason: str):
        super().__init__(reason)
        self.status = status
        self.reason = reason


class Api:
    def __init__(self, base_url: str):
        self._base = base_url.rstrip("/")
        self._cookies = CookieJar()
        self._opener = urllib.request.build_opener(urllib.request.HTTPCookieProcessor(self._cookies))

    def log_in(self, email: str, password: str) -> None:
        self.send("POST", "/api/auth/login", {"email": email, "password": password})

    def send(self, method: str, path: str, body: object | None = None):
        headers = {}
        data = None
        if method != "GET":
            # The server asks for its cookie back in a header on every write.
            headers["X-XSRF-TOKEN"] = self._csrf_token()
            headers["Content-Type"] = "application/json"
            data = json.dumps(body).encode()
        request = urllib.request.Request(self._base + path, data=data, headers=headers, method=method)
        try:
            with self._opener.open(request) as response:
                payload = response.read()
        except urllib.error.HTTPError as error:
            raise ApiRefused(error.code, _reason(error)) from None
        return json.loads(payload) if payload else None

    def _csrf_token(self) -> str:
        token = self._cookie("XSRF-TOKEN")
        if token is None:
            try:
                self._opener.open(self._base + "/api/me").close()
            except urllib.error.HTTPError:
                pass  # a 401 still sets the cookie
            token = self._cookie("XSRF-TOKEN")
        return token or ""

    def _cookie(self, name: str) -> str | None:
        return next((cookie.value for cookie in self._cookies if cookie.name == name), None)


def _reason(error: urllib.error.HTTPError) -> str:
    try:
        body = json.loads(error.read())
    except ValueError:
        return f"HTTP {error.code}"
    fields = body.get("fields") or {}
    detail = ", ".join(f"{field}: {code}" for field, code in fields.items())
    return f"{body.get('code', 'unknown')} ({detail})" if detail else str(body.get("code", "unknown"))
