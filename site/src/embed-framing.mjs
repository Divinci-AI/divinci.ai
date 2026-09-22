/**
 * Which paths other sites may put in an <iframe>.
 *
 * Every page on this site sends `X-Frame-Options: SAMEORIGIN` and
 * `frame-ancestors 'self'`, so nobody else can frame it — the clickjacking
 * default, and the right one for pages with forms, sign-ups or a chat widget.
 *
 * /trustbench/embed/ is the exception, and only it. It exists to be framed,
 * and it is safe to frame because it has nothing to click into: no forms, no
 * session, no state, and every link opens in a new tab.
 *
 * Kept as an EXACT prefix list rather than a pattern so that adding a new
 * framable surface is a deliberate edit here, with a test beside it — not a
 * side effect of naming a directory "embed".
 */
export const FRAMABLE_PREFIXES = ['/trustbench/embed/'];

export function isFramable(pathname) {
  // `/trustbench/embed` without the slash is served as a redirect to the
  // slashed form, so it never renders content and needs no exemption.
  return FRAMABLE_PREFIXES.some((p) => pathname === p || pathname.startsWith(p));
}

/**
 * Return a copy of `headers` fit for `pathname`. Never mutates the input: the
 * worker builds one headers object per request and applies it to several
 * response paths, and a mutation leaking into another path would open framing
 * somewhere it was never meant to be.
 */
export function framingHeadersFor(pathname, headers) {
  if (!isFramable(pathname)) return headers;
  const out = { ...headers };
  delete out['X-Frame-Options'];
  const csp = out['Content-Security-Policy'];
  if (csp) {
    const next = csp.replace(/frame-ancestors [^;]*;/, 'frame-ancestors *;');
    // Fail CLOSED: if the CSP no longer has the clause this expects, keep the
    // restrictive header rather than guessing at a rewrite.
    if (next === csp) return headers;
    out['Content-Security-Policy'] = next;
  }
  return out;
}
