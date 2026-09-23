"""Verify a demo manifest against its published key. Standalone: needs only `cryptography`.

Usage: python verify.py manifest.json demo-key.json
"""

from __future__ import annotations

import base64
import hashlib
import json
import math
import sys

from cryptography.hazmat.primitives.asymmetric.ed25519 import Ed25519PublicKey


def canonical(v) -> str:
    """RFC-8785-style canonical JSON, enough for this manifest's value types."""
    if v is None or isinstance(v, bool):
        return json.dumps(v)
    if isinstance(v, (int, float)):
        if isinstance(v, float) and not math.isfinite(v):
            raise ValueError("non-finite number")
        if isinstance(v, float) and v.is_integer() and abs(v) < 2**53:
            return str(int(v))
        return json.dumps(v) if isinstance(v, int) else repr(v)
    if isinstance(v, str):
        return json.dumps(v, ensure_ascii=False)
    if isinstance(v, list):
        return "[" + ",".join(canonical(x) for x in v) + "]"
    if isinstance(v, dict):
        keys = sorted(v, key=lambda k: k.encode("utf-16-be"))
        return "{" + ",".join(json.dumps(k, ensure_ascii=False) + ":" + canonical(v[k]) for k in keys) + "}"
    raise TypeError(type(v))


def main(manifest_path: str, key_path: str) -> int:
    manifest = json.load(open(manifest_path))
    keys = {k["keyId"]: k for k in json.load(open(key_path))["keys"]}
    body = {k: v for k, v in manifest.items() if k != "signatures"}
    digest = hashlib.sha256(canonical(body).encode("utf-8")).digest()
    for s in manifest["signatures"]:
        pub = Ed25519PublicKey.from_public_bytes(base64.b64decode(keys[s["keyId"]]["publicKey"]))
        pub.verify(base64.b64decode(s["signature"]), digest)  # raises on mismatch
        print(f"OK  {s['keyId']}  sha256 {digest.hex()[:16]}")
    return 0


if __name__ == "__main__":
    sys.exit(main(*sys.argv[1:3]))
