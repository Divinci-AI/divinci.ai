/* Web Bot Auth key directory (draft-meunier-http-message-signatures-directory).
 *
 * Hosted at `/.well-known/http-message-signatures-directory`. Sites we crawl
 * (and Cloudflare Verified Bots) fetch this JWKS to verify that outbound crawl
 * requests signed with the matching private key are genuinely ours.
 *
 * Public key is committed here. Private key is a Worker secret
 * `WEB_BOT_AUTH_PRIVATE_JWK` (full JWK including `d`). The www-rag-router
 * crawler reads the same private material from its own env so it can attach
 * Signature / Signature-Input / Signature-Agent on fetches.
 *
 * Do not publish a JWKS whose private key nothing signs with — that is a dead
 * credential claiming "requests signed with this key are ours" when none are.
 * Order: generate keypair → wire crawler signing → publish (this module) with
 * the private secret installed.
 *
 * @see https://developers.cloudflare.com/bots/reference/bot-verification/web-bot-auth/
 */

import {
  directoryResponseHeaders,
  MediaType,
} from 'web-bot-auth';
import { signerFromJWK } from 'web-bot-auth/crypto';

/** Public Ed25519 JWK for Divinci's crawler identity (no private material). */
export const WEB_BOT_AUTH_PUBLIC_JWK = {
  kty: 'OKP',
  crv: 'Ed25519',
  x: 'DqQEv-XHNHcopv26rzDGIpPYhzYG_bXnRCZ27TUqUSM',
  kid: '9phmPOuq4GSq0koPbo_6pBHK0zKk4ty_TtU2OPKVY-o',
};

export const WEB_BOT_AUTH_DIRECTORY_PATH =
  '/.well-known/http-message-signatures-directory';

/**
 * Build the signed (or, only when no private key, unsigned) JWKS directory
 * response for a request to WEB_BOT_AUTH_DIRECTORY_PATH.
 *
 * @param {Request} request
 * @param {{ WEB_BOT_AUTH_PRIVATE_JWK?: string, ENVIRONMENT?: string }} env
 * @returns {Promise<Response>}
 */
export async function handleWebBotAuthDirectory(request, env = {}) {
  const bodyObj = {
    keys: [
      {
        kty: WEB_BOT_AUTH_PUBLIC_JWK.kty,
        crv: WEB_BOT_AUTH_PUBLIC_JWK.crv,
        x: WEB_BOT_AUTH_PUBLIC_JWK.x,
        // kid is informative; Cloudflare uses the JWK thumbprint (keyid).
        kid: WEB_BOT_AUTH_PUBLIC_JWK.kid,
      },
    ],
  };
  const body = JSON.stringify(bodyObj, null, 2);

  const headers = new Headers({
    'Content-Type': MediaType.HTTP_MESSAGE_SIGNATURES_DIRECTORY,
    'Cache-Control': 'public, max-age=86400',
  });

  const privateRaw = env.WEB_BOT_AUTH_PRIVATE_JWK;
  if (!privateRaw) {
    // Production must sign. Dev/test may serve the public JWKS alone so shape
    // tests work without secrets. Never treat unsigned prod as success.
    if (env.ENVIRONMENT === 'production') {
      return new Response(
        JSON.stringify({
          error: 'web_bot_auth_private_key_missing',
          message:
            'WEB_BOT_AUTH_PRIVATE_JWK secret is not set; refusing to publish an unsigned directory in production',
        }),
        {
          status: 503,
          headers: {
            'Content-Type': 'application/json',
            'Cache-Control': 'no-store',
          },
        },
      );
    }
    return new Response(body, { status: 200, headers });
  }

  let privateJwk;
  try {
    privateJwk = typeof privateRaw === 'string' ? JSON.parse(privateRaw) : privateRaw;
  } catch {
    return new Response(
      JSON.stringify({ error: 'web_bot_auth_private_key_invalid' }),
      { status: 500, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } },
    );
  }

  // Guard: the private key must match the published public key.
  if (privateJwk.x && privateJwk.x !== WEB_BOT_AUTH_PUBLIC_JWK.x) {
    return new Response(
      JSON.stringify({
        error: 'web_bot_auth_key_mismatch',
        message: 'WEB_BOT_AUTH_PRIVATE_JWK does not match the published public JWK',
      }),
      { status: 500, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } },
    );
  }

  const signer = await signerFromJWK({
    kty: privateJwk.kty,
    crv: privateJwk.crv,
    d: privateJwk.d,
    x: privateJwk.x || WEB_BOT_AUTH_PUBLIC_JWK.x,
    // keyid on the signer is the JWK thumbprint; Ed25519Signer computes it
    // from the public material when using signerFromJWK.
  });

  // Force keyid to our known thumbprint so Signature-Input matches registration.
  if (signer.keyid !== WEB_BOT_AUTH_PUBLIC_JWK.kid) {
    // Prefer the library-computed thumbprint if it differs from our precompute
    // — that is the ground truth for verifiers. Surface it in logs.
    console.warn(
      `[web-bot-auth] signer.keyid=${signer.keyid} differs from committed kid=${WEB_BOT_AUTH_PUBLIC_JWK.kid}`,
    );
  }

  const now = new Date();
  const expires = new Date(now.getTime() + 60_000); // 60s — short-lived directory binding

  const url = new URL(request.url);
  const responseLike = {
    status: 200,
    headers: {
      'content-type': MediaType.HTTP_MESSAGE_SIGNATURES_DIRECTORY,
    },
  };
  const requestLike = {
    method: request.method || 'GET',
    url: request.url,
    headers: {
      host: url.host,
    },
  };

  const sigHeaders = await directoryResponseHeaders(
    { response: responseLike, request: requestLike },
    [signer],
    { created: now, expires },
  );

  headers.set('Signature', sigHeaders.Signature);
  headers.set('Signature-Input', sigHeaders['Signature-Input']);

  return new Response(body, { status: 200, headers });
}
