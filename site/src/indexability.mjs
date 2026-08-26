/**
 * Which hostnames may reach a search index.
 *
 * Extracted rather than inlined in worker.js for the same reason
 * `shouldCollect` was: worker.js imports `cloudflare:email` and therefore
 * cannot be loaded by `node --test`, so a decision left in there is a decision
 * nothing can assert on.
 */

/**
 * Is a response served for `hostname` allowed to be indexed?
 *
 * Exactly one copy of this site should be indexable, and more than one serves
 * it byte-for-byte:
 *
 *   - the canonical domain,
 *   - staging.divinci.ai and dev.divinci.ai,
 *   - and the *.workers.dev hostname that EVERY environment gets for free —
 *     production's `divinci-ai-site.divinci-ai.workers.dev` included, which is
 *     a complete duplicate of the real site under a different name.
 *
 * That last one is why this cannot key off ENVIRONMENT alone: the production
 * worker answers on a canonical route AND on a workers.dev URL, and only the
 * first should ever be indexed.
 *
 * The canonical host comes from BASE_URL rather than a hardcoded list so that
 * moving the site to another domain carries indexability with it instead of
 * silently de-indexing the new one.
 *
 * The default is NOT indexable. An unrecognised environment or a malformed
 * BASE_URL is far more likely to be a preview than the real site, and the two
 * failures are not symmetrical: a stray `noindex` on staging costs nothing,
 * while a missing one costs weeks of a duplicate outranking the original.
 *
 * @param {{ ENVIRONMENT?: string, BASE_URL?: string }} env  Worker bindings.
 * @param {string} hostname  `url.hostname` of the incoming request.
 * @returns {boolean}
 */
export function isIndexable(env, hostname) {
  if ((env?.ENVIRONMENT ?? '') !== 'production') return false;

  let canonicalHost;
  try {
    // Throwing here would 500 every request, so a bad BASE_URL must fail
    // closed to `noindex` rather than fail loudly.
    canonicalHost = new URL(env?.BASE_URL ?? '').hostname;
  } catch {
    return false;
  }
  if (!canonicalHost) return false;

  // `www.` is included because it is a production route. It 301s to the apex
  // before reaching the asset path, so in practice it only ever carries this
  // header on the redirect itself — but a redirect is a response too, and a
  // route that serves the site must not be the one host we forgot.
  return hostname === canonicalHost || hostname === `www.${canonicalHost}`;
}

/**
 * The header value for a host that must stay out of search results.
 *
 * `nofollow` rides along with `noindex` so a crawler that reaches staging does
 * not walk its link graph and discover the rest of the environment.
 */
export const NOINDEX = 'noindex, nofollow';
