/**
 * Contract tests for the agent-readiness discovery documents.
 *
 * Run with:  npm run test:worker
 *
 * Two kinds of assertion live here, and the difference matters:
 *
 *   1. SHAPE — every document must keep the fields its spec requires, because
 *      the failure mode of dropping one is silent: the document still serves
 *      200, agents still fetch it, and it simply stops being usable. Nothing
 *      at runtime notices.
 *
 *   2. DRIFT — the OAuth documents and the A2A card are COPIES of what
 *      mcp.divinci.app serves. A copy that quietly diverges from its original
 *      is worse than no copy: it sends agents to endpoints that moved. The
 *      drift check is opt-in (CHECK_UPSTREAM=1) because it needs the network,
 *      and a unit suite that fails when a laptop is offline gets ignored.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';

import { AGENT_LINK_HEADER, handleAgentDiscovery } from '../../src/agent-discovery.mjs';
import { SKILLS_INDEX } from '../../src/agent-skills-index.mjs';

const MCP = 'https://mcp.divinci.app';

const get = async (pathname) => {
  const res = handleAgentDiscovery(new URL(`https://divinci.ai${pathname}`));
  assert.ok(res, `no handler for ${pathname}`);
  return { res, body: JSON.parse(await res.text()) };
};

test('unknown paths fall through so security.txt still reaches ASSETS', () => {
  assert.equal(handleAgentDiscovery(new URL('https://divinci.ai/.well-known/security.txt')), null);
  assert.equal(handleAgentDiscovery(new URL('https://divinci.ai/')), null);
  assert.equal(
    handleAgentDiscovery(new URL('https://divinci.ai/.well-known/agent-skills/divinci-mcp-connect/SKILL.md')),
    null,
    'SKILL.md files are static assets — the worker must not shadow them',
  );
});

test('api-catalog is served as application/linkset+json (RFC 9727)', async () => {
  const { res, body } = await get('/.well-known/api-catalog');
  assert.match(res.headers.get('content-type'), /application\/linkset\+json/);
  assert.ok(Array.isArray(body.linkset) && body.linkset.length > 0);
  for (const entry of body.linkset) {
    assert.match(entry.anchor, /^https:\/\//, 'anchor must be an absolute URL');
    const rels = Object.keys(entry).filter((k) => k !== 'anchor');
    assert.ok(rels.length > 0, `${entry.anchor} has no link relations`);
  }
});

test('OAuth authorization server metadata has the RFC 8414 required fields', async () => {
  const { body } = await get('/.well-known/oauth-authorization-server');
  for (const field of ['issuer', 'authorization_endpoint', 'token_endpoint']) {
    assert.ok(body[field], `missing ${field}`);
  }
  assert.ok(Array.isArray(body.grant_types_supported) && body.grant_types_supported.length);
  assert.ok(Array.isArray(body.response_types_supported) && body.response_types_supported.length);

  // The issuer names mcp.divinci.app deliberately. divinci.ai is not an
  // authorization server, and an issuer of "https://divinci.ai" would point
  // agents at /authorize and /token endpoints that do not exist here.
  assert.equal(body.issuer, MCP);
});

test('openid-configuration serves the same document as oauth-authorization-server', async () => {
  const a = await get('/.well-known/openid-configuration');
  const b = await get('/.well-known/oauth-authorization-server');
  assert.deepEqual(a.body, b.body);
});

test('protected resource metadata has the RFC 9728 required fields', async () => {
  const { body } = await get('/.well-known/oauth-protected-resource');
  assert.ok(body.resource, 'missing resource');
  assert.ok(Array.isArray(body.authorization_servers) && body.authorization_servers.length);
  assert.ok(body.bearer_methods_supported.includes('header'));
  assert.deepEqual(body.authorization_servers, [MCP],
    'the real authorization server is mcp.divinci.app');
});

test('protected resource metadata identifies the origin it is served from', async () => {
  // RFC 9728: `resource` is the identifier of the resource server publishing
  // the document. A PRM served from divinci.ai that names a different origin
  // is self-contradictory and a conforming client may reject it — Cloudflare's
  // scanner reports exactly that as "origin mismatch". Regressing this to a
  // hardcoded value is silent: the document still serves 200.
  for (const origin of ['https://divinci.ai', 'https://staging.divinci.ai']) {
    const res = handleAgentDiscovery(new URL(`${origin}/.well-known/oauth-protected-resource`));
    const body = JSON.parse(await res.text());
    assert.equal(body.resource, origin,
      `PRM served from ${origin} must identify ${origin}, not something else`);
  }
});

test('A2A agent card carries supportedInterfaces and skills', async () => {
  const { body } = await get('/.well-known/agent-card.json');
  for (const field of ['name', 'version', 'description']) {
    assert.ok(body[field], `missing ${field}`);
  }
  assert.ok(Array.isArray(body.supportedInterfaces) && body.supportedInterfaces.length,
    'supportedInterfaces is required by the A2A spec and is what upstream is missing');
  for (const iface of body.supportedInterfaces) {
    assert.match(iface.url, /^https:\/\//);
    assert.ok(iface.transport);
  }
  assert.ok(Array.isArray(body.skills) && body.skills.length);
  for (const skill of body.skills) {
    for (const field of ['id', 'name', 'description']) {
      assert.ok(skill[field], `skill ${skill.id || '?'} missing ${field}`);
    }
  }

  // AP2 must NOT be declared. Its A2A extension spec requires an agent that
  // lists the extension URI to perform at least one payment role (merchant,
  // shopper, credentials-provider, payment-processor). Divinci performs none,
  // so declaring it would invite a mandate exchange that can only dead-end.
  // This assertion exists because "add the AP2 extension" is the obvious way
  // to turn one more scanner check green, and it is the wrong move.
  const ap2 = (body.capabilities.extensions || []).find((e) => /ap2/i.test(e.uri || ''));
  assert.equal(ap2, undefined,
    'AP2 must not be declared until Divinci actually performs an AP2 role');
});

test('MCP server card has serverInfo, an endpoint and capabilities (SEP-1649)', async () => {
  const { body } = await get('/.well-known/mcp/server-card.json');
  assert.ok(body.serverInfo?.name, 'missing serverInfo.name');
  assert.ok(body.serverInfo?.version, 'missing serverInfo.version');
  assert.match(body.endpoint, /^https:\/\//);
  assert.ok(body.capabilities && Object.keys(body.capabilities).length);
});

test('agent skills index matches the discovery schema', async () => {
  const { body } = await get('/.well-known/agent-skills/index.json');
  assert.equal(body.$schema, 'https://schemas.agentskills.io/discovery/0.2.0/schema.json');
  assert.ok(Array.isArray(body.skills) && body.skills.length, 'skills must be non-empty');
  for (const skill of body.skills) {
    assert.match(skill.name, /^[a-z0-9]+(-[a-z0-9]+)*$/, `bad skill id: ${skill.name}`);
    assert.equal(skill.type, 'skill-md');
    assert.ok(skill.description);
    assert.match(skill.digest, /^sha256:[0-9a-f]{64}$/, `bad digest on ${skill.name}`);
    assert.match(skill.url, /^\/\.well-known\/agent-skills\/.+\/SKILL\.md$/);
  }
});

test('skills index digests match the SKILL.md files on disk', async () => {
  // The generated index is only useful if its hashes are true. A stale digest
  // is undetectable at request time — the agent fetches the file, hashes it,
  // and silently distrusts a skill that is perfectly fine.
  const { createHash } = await import('node:crypto');
  const { readFile } = await import('node:fs/promises');
  const { fileURLToPath } = await import('node:url');
  const path = await import('node:path');

  const siteRoot = path.dirname(path.dirname(path.dirname(fileURLToPath(import.meta.url))));

  for (const skill of SKILLS_INDEX.skills) {
    const onDisk = path.join(siteRoot, 'static', skill.url);
    const bytes = await readFile(onDisk);
    const digest = 'sha256:' + createHash('sha256').update(bytes).digest('hex');
    assert.equal(digest, skill.digest,
      `${skill.name}: digest is stale — re-run scripts/build-agent-skills.py`);
  }
});

test('commerce documents do not claim payments we cannot take', async () => {
  // These exist so an agent gets a definite machine-readable answer instead of
  // a 404 it has to interpret. They must never advertise a checkout that does
  // not exist — an agent acting on that wastes a real user's turn.
  const acp = (await get('/.well-known/acp.json')).body;
  assert.equal(acp.protocol.name, 'acp');
  assert.match(acp.api_base_url, /^https:\/\//);
  assert.ok(Array.isArray(acp.transports) && acp.transports.length);
  assert.ok(Array.isArray(acp.capabilities.services) && acp.capabilities.services.length);
  // Flat identifiers, not objects — the validator rejects the object form.
  for (const s of acp.capabilities.services) {
    assert.equal(typeof s, 'string', 'capabilities.services must be service id strings');
  }
  assert.equal(acp.payment.enabled, false,
    'flip this only when a recipient address is actually configured in production');
  assert.equal(acp.capabilities.checkout, false);

  const ucp = (await get('/.well-known/ucp')).body;
  assert.ok(ucp.ucp && typeof ucp.ucp === 'object',
    'ucp.dev requires a nested `ucp` object, not the flat shape the CF skill shows');
  assert.match(ucp.ucp.version, /^\d{4}-\d{2}-\d{2}$/, 'UCP version is a date string');
  for (const key of ['services', 'capabilities', 'payment_handlers']) {
    assert.ok(ucp.ucp[key] && typeof ucp.ucp[key] === 'object', `ucp.${key} must be an object`);
  }
  // Empty on purpose — see the comment on UCP in src/agent-discovery.mjs.
  assert.equal(Object.keys(ucp.ucp.payment_handlers).length, 0,
    'declaring a payment handler asserts a settlement path that does not exist');
  assert.equal(ucp.divinci.paywall, false);
  assert.equal(ucp.divinci.content_payments, false);
});

test('Link header advertises the registered relation types', () => {
  // RFC 9727 §3 wants api-catalog; the scanner looks for "agent-useful"
  // relations, which are the IANA-registered ones below.
  for (const rel of ['api-catalog', 'service-desc', 'service-doc', 'describedby']) {
    assert.ok(AGENT_LINK_HEADER.includes(`rel="${rel}"`), `Link header missing rel=${rel}`);
  }
  // Every target must be resolvable — a relative URI is resolved against the
  // page, an absolute one must be https.
  for (const part of AGENT_LINK_HEADER.split(', ')) {
    assert.match(part, /^<(\/|https:\/\/)/, `unresolvable Link target: ${part}`);
  }
});

test('no document points at a bare http:// or localhost URL', async () => {
  const paths = [
    '/.well-known/api-catalog',
    '/.well-known/oauth-authorization-server',
    '/.well-known/oauth-protected-resource',
    '/.well-known/agent-card.json',
    '/.well-known/mcp/server-card.json',
    '/.well-known/agent-skills/index.json',
    '/.well-known/acp.json',
    '/.well-known/ucp',
  ];
  for (const p of paths) {
    const { res } = await get(p);
    const text = await handleAgentDiscovery(new URL(`https://divinci.ai${p}`)).text();
    assert.ok(!/http:\/\//.test(text), `${p} contains a plaintext http:// URL`);
    assert.ok(!/localhost|127\.0\.0\.1/.test(text), `${p} leaks a local URL`);
    assert.match(res.headers.get('content-type'), /json/);
  }
});

/* ── Drift checks against the real MCP server ────────────────────────────
 * Opt-in: CHECK_UPSTREAM=1 npm run test:worker
 */
const upstream = process.env.CHECK_UPSTREAM === '1' ? test : test.skip;

/* Fields we KNOWINGLY diverge from upstream on, with the reason.
 *
 * service_documentation / resource_documentation: upstream advertises
 * `https://docs.divinci.app/mcp`, and `docs.divinci.app` has no DNS record —
 * it does not resolve at all (checked 2026-08-07). Copying a dead link into
 * divinci.ai's OAuth metadata would hand every agent a documentation URL that
 * cannot be fetched, so these point at `https://mcp.divinci.app/info`, which
 * is live and describes the same server.
 *
 * DELETE THOSE TWO ENTRIES once the MCP server is fixed — either by pointing it
 * at a URL that resolves, or by standing docs.divinci.app up. Keeping a
 * permanent exemption is how a drift guard rots into decoration.
 *
 * resource: origin-derived BY DESIGN — see the PRM comment in
 * src/agent-discovery.mjs. RFC 9728 requires it to name the origin serving the
 * document, so divinci.ai's copy must say divinci.ai where upstream says
 * mcp.divinci.app. This one is permanent, not a TODO. It is pinned separately
 * by "protected resource metadata identifies the origin it is served from".
 */
const KNOWN_DIVERGENCES = new Set([
  'service_documentation',
  'resource_documentation',
  'resource',
]);

upstream('OAuth documents still match mcp.divinci.app', async () => {
  const pairs = [
    ['/.well-known/oauth-authorization-server', `${MCP}/.well-known/oauth-authorization-server`],
    ['/.well-known/oauth-protected-resource', `${MCP}/.well-known/oauth-protected-resource`],
  ];
  for (const [local, remote] of pairs) {
    const { body } = await get(local);
    const live = await (await fetch(remote)).json();
    // Compare the fields agents act on. Upstream may add fields we have not
    // mirrored yet; that is a copy to refresh, not a lie. A CHANGED value is
    // the dangerous case, so that is what this asserts.
    for (const key of Object.keys(body)) {
      if (KNOWN_DIVERGENCES.has(key)) continue;
      assert.deepEqual(body[key], live[key],
        `${local}: "${key}" has drifted from ${remote} — re-copy it`);
    }
  }
});

upstream('our documentation URLs actually resolve', async () => {
  // The reason we diverge from upstream above is that upstream's does not.
  // This asserts we did not simply substitute a second dead link.
  for (const p of ['/.well-known/oauth-authorization-server', '/.well-known/oauth-protected-resource']) {
    const { body } = await get(p);
    const docUrl = body.service_documentation || body.resource_documentation;
    const res = await fetch(docUrl, { method: 'GET' });
    assert.ok(res.ok, `${p} documentation URL ${docUrl} returned ${res.status}`);
  }
});

upstream('A2A card still matches mcp.divinci.app where it overlaps', async () => {
  const { body } = await get('/.well-known/agent-card.json');
  const live = await (await fetch(`${MCP}/.well-known/agent-card.json`)).json();
  for (const key of ['name', 'url', 'protocolVersion', 'version', 'description']) {
    assert.deepEqual(body[key], live[key], `agent-card "${key}" has drifted`);
  }
  assert.deepEqual(
    body.skills.map((s) => s.id).sort(),
    live.skills.map((s) => s.id).sort(),
    'skill ids have drifted from the live agent card',
  );
});
