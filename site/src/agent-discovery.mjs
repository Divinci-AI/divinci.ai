/* Agent-readiness discovery documents for divinci.ai.
 *
 * WHY THESE LIVE IN THE WORKER AND NOT IN static/
 * Most of these paths are extensionless (`/.well-known/api-catalog`,
 * `/.well-known/oauth-authorization-server`, `/.well-known/ucp`). Cloudflare's
 * static-asset handler picks Content-Type from the file extension, so an
 * extensionless asset ships as application/octet-stream — and every one of
 * these specs REQUIRES a specific media type (`application/linkset+json` for
 * RFC 9727, `application/json` for the OAuth documents). Serving them from the
 * worker is the only way to set the type without renaming the paths, which the
 * specs do not allow.
 *
 * WHY THE OAUTH DOCUMENTS ARE COPIES, NOT A PROXY
 * The real authorization server is `mcp.divinci.app`, which already serves
 * these at their canonical location. Proxying would guarantee freshness but
 * would put a marketing-site route behind the availability of the MCP worker,
 * and a cached-but-stale OAuth document is its own hazard. So they are inlined
 * here and `tests/agent-discovery.spec.js` fails if they drift from upstream.
 * Every URL inside them resolves to something real; nothing here describes a
 * capability divinci.ai does not have.
 */

const MCP = 'https://mcp.divinci.app';
const API = 'https://api.divinci.app';
const DOCS = 'https://sdk.divinci.ai';

/* Upstream: GET https://mcp.divinci.app/.well-known/oauth-authorization-server
 * Kept byte-compatible with that document. `issuer` intentionally names
 * mcp.divinci.app rather than divinci.ai — divinci.ai is NOT an authorization
 * server, and claiming otherwise would send agents to endpoints that do not
 * exist. This copy is a discovery aid; the canonical copy at the issuer's own
 * well-known URL is what a strict RFC 8414 client validates against. */
const OAUTH_AUTHORIZATION_SERVER = {
  issuer: MCP,
  authorization_endpoint: `${MCP}/authorize`,
  token_endpoint: `${MCP}/token`,
  registration_endpoint: `${MCP}/register`,
  revocation_endpoint: `${MCP}/revoke`,
  scopes_supported: [
    'openid', 'profile', 'email', 'offline_access',
    'rag:read', 'rag:write', 'chat:read', 'chat:write',
    'release:read', 'release:write', 'finetune:read', 'finetune:write',
    'config:read', 'config:write', 'memory:read', 'memory:write',
    'audio:read', 'audio:write', 'divinci:read', 'divinci:write',
  ],
  response_types_supported: ['code'],
  grant_types_supported: ['authorization_code', 'refresh_token'],
  token_endpoint_auth_methods_supported: ['client_secret_post', 'none'],
  code_challenge_methods_supported: ['S256'],
  service_documentation: `${MCP}/info`,
};

/* Upstream: GET https://mcp.divinci.app/.well-known/oauth-protected-resource
 *
 * `resource` is the ONE field here that is not a straight copy, and it is
 * built from the request origin rather than hardcoded. RFC 9728 defines
 * `resource` as the identifier of the resource server that publishes the
 * document, so a PRM served from divinci.ai whose `resource` names
 * mcp.divinci.app is self-contradictory — a conforming client is entitled to
 * reject it, and Cloudflare's scanner does exactly that ("origin mismatch").
 *
 * So the copy on divinci.ai identifies divinci.ai and names the real
 * authorization server. The practical meaning for an agent is "tokens for
 * anything under this brand come from mcp.divinci.app, with these scopes",
 * which is true. The canonical document — the one that describes the API
 * surface an agent actually calls — remains the one at mcp.divinci.app, and
 * `resource_documentation` points there.
 */
const OAUTH_PRM_COMMON = {
  token_endpoint_auth_methods_supported: ['client_secret_post', 'none'],
  scopes_supported: [
    'openid', 'profile', 'email', 'offline_access',
    'rag:read', 'rag:write', 'chat:read', 'chat:write',
    'release:read', 'release:write', 'finetune:read', 'finetune:write',
    'config:read', 'config:write',
  ],
  bearer_methods_supported: ['header'],
  resource_documentation: `${MCP}/info`,
};

const oauthProtectedResource = (origin) => ({
  resource: origin,
  authorization_servers: [MCP],
  ...OAUTH_PRM_COMMON,
});

/* RFC 9727 API catalog. Every anchor here is a service that actually answers:
 * mcp.divinci.app/info and api.divinci.app/health both return 200 today. */
const API_CATALOG = {
  linkset: [
    {
      anchor: MCP,
      'service-desc': [
        { href: `${MCP}/info`, type: 'application/json', title: 'Divinci MCP server description' },
      ],
      'service-doc': [
        { href: `${DOCS}/`, type: 'text/html', title: 'Divinci SDK and API documentation' },
      ],
      status: [
        { href: `${MCP}/info`, type: 'application/json', title: 'MCP server status' },
      ],
    },
    {
      anchor: API,
      'service-doc': [
        { href: `${DOCS}/`, type: 'text/html', title: 'Divinci SDK and API documentation' },
      ],
      status: [
        { href: `${API}/health`, type: 'application/json', title: 'Divinci API health' },
      ],
    },
    {
      anchor: 'https://divinci.ai',
      'service-doc': [
        { href: 'https://divinci.ai/llms.txt', type: 'text/plain', title: 'LLM-oriented site overview' },
      ],
      status: [
        { href: 'https://divinci.ai/api/status', type: 'application/json', title: 'Divinci platform status' },
      ],
    },
  ],
};

/* A2A Agent Card. Mirrors mcp.divinci.app/.well-known/agent-card.json and adds
 * `supportedInterfaces`, which the A2A spec expects and the upstream card is
 * currently missing (see the TODO in tests/agent-discovery.spec.js). */
const A2A_AGENT_CARD = {
  name: 'DiVinci WhiteLabel AI',
  description:
    'AI-powered assistant with RAG capabilities for knowledge management and conversational AI. ' +
    'Supports chat, document search, and knowledge base queries. Requires Bearer token authentication.',
  url: MCP,
  protocolVersion: '0.3',
  provider: { organization: 'DiVinci AI', url: 'https://divinci.ai' },
  version: '1.0.0',
  documentationUrl: `${MCP}/info`,
  supportedInterfaces: [
    { url: `${MCP}/a2a`, transport: 'JSONRPC' },
    { url: `${MCP}/mcp`, transport: 'HTTP+MCP' },
  ],
  capabilities: {
    streaming: true,
    pushNotifications: false,
    stateTransitionHistory: true,
    // NO AP2 EXTENSION HERE, DELIBERATELY.
    //
    // Cloudflare's scanner reports `ap2` as missing because this array has no
    // AP2 entry, and adding one is a two-line change. Do not make it. The AP2
    // A2A extension spec (https://ap2-protocol.org/a2a-extension/) states that
    // an agent declaring the extension URI
    // `https://github.com/google-agentic-commerce/ap2/tree/v0.1` MUST perform
    // at least one AP2 role — merchant, shopper, credentials-provider or
    // payment-processor. Divinci performs none of them: there is no merchant
    // account, no wallet, and no settlement path an agent could complete.
    //
    // Declaring it anyway would invite a counterpart agent to open a payment
    // mandate exchange that can only dead-end, which costs a real user a turn
    // and gets us nothing — the check is unscored and already correctly
    // reports "not a commerce site".
    //
    // The precondition for revisiting this is a business one (a payment role),
    // not a code one. See the `payment` block in the ACP document.
    extensions: [],
  },
  securitySchemes: {
    oauth2: {
      type: 'oauth2',
      description: 'OAuth 2.1 authorization code + PKCE against mcp.divinci.app.',
      flows: {
        authorizationCode: {
          authorizationUrl: `${MCP}/authorize`,
          tokenUrl: `${MCP}/token`,
          scopes: {
            'chat:read': 'Read conversations and transcripts',
            'chat:write': 'Send messages to an assistant',
            'rag:read': 'Query knowledge bases',
            'rag:write': 'Add documents to knowledge bases',
          },
        },
      },
    },
  },
  security: [{ oauth2: ['chat:read', 'chat:write', 'rag:read'] }],
  defaultInputModes: ['text'],
  defaultOutputModes: ['text'],
  skills: [
    {
      id: 'send_message',
      name: 'Send Message',
      description: 'Send a message to the AI assistant and receive a response',
      tags: ['chat', 'conversation', 'ai'],
      examples: ['What is machine learning?', 'Explain quantum computing'],
      inputModes: ['text'],
      outputModes: ['text'],
    },
    {
      id: 'get_transcript',
      name: 'Get Transcript',
      description: 'Retrieve a specific conversation transcript by ID',
      tags: ['transcript', 'history'],
      inputModes: ['text'],
      outputModes: ['text'],
    },
    {
      id: 'list_transcripts',
      name: 'List Transcripts',
      description: 'List available conversation transcripts',
      tags: ['transcript', 'history'],
      inputModes: ['text'],
      outputModes: ['text'],
    },
    {
      id: 'search_knowledge',
      name: 'Search Knowledge',
      description: 'Semantic search across a configured knowledge base',
      tags: ['rag', 'search', 'knowledge'],
      inputModes: ['text'],
      outputModes: ['text'],
    },
    {
      id: 'list_data_sources',
      name: 'List Data Sources',
      description: 'List the knowledge bases available to the caller',
      tags: ['rag', 'knowledge'],
      inputModes: ['text'],
      outputModes: ['text'],
    },
    {
      id: 'get_document',
      name: 'Get Document',
      description: 'Retrieve a single document from a knowledge base',
      tags: ['rag', 'knowledge'],
      inputModes: ['text'],
      outputModes: ['text'],
    },
  ],
};

/* MCP Server Card per SEP-1649. */
const MCP_SERVER_CARD = {
  serverInfo: {
    name: 'divinci-whitelabel-ai',
    title: 'DiVinci WhiteLabel AI MCP Server',
    version: '1.0.0',
    websiteUrl: 'https://divinci.ai',
  },
  description:
    'Remote MCP server for the Divinci AI platform: conversational AI, RAG knowledge bases, ' +
    'transcripts, fine-tuning and release configuration.',
  endpoint: `${MCP}/mcp`,
  transports: [
    { type: 'streamable-http', url: `${MCP}/mcp` },
    { type: 'sse', url: `${MCP}/sse` },
  ],
  capabilities: {
    tools: { listChanged: true },
    resources: { subscribe: false, listChanged: false },
    prompts: { listChanged: false },
  },
  authentication: {
    type: 'oauth2',
    protectedResourceMetadata: `${MCP}/.well-known/oauth-protected-resource`,
    authorizationServers: [MCP],
  },
  documentationUrl: `${MCP}/info`,
};

/* Agent Skills Discovery index (v0.2.0). Generated — not hand-edited. The
 * digests are computed by scripts/build-agent-skills.py from the SKILL.md
 * files under static/.well-known/agent-skills/, because a hand-maintained
 * sha256 is a sha256 that is wrong the first time a skill is edited. It runs
 * ahead of `zola build` in wrangler.jsonc's build command. */
import { SKILLS_INDEX } from './agent-skills-index.mjs';

/* ACP discovery (agenticcommerce.dev).
 *
 * What Divinci actually sells to an agent is metered access to platform
 * services — not physical goods, and there is no cart or checkout. So this
 * document declares the services that exist and states plainly that automated
 * settlement is not live yet. `payment.enabled: false` is the honest value:
 * the MCP server ships x402 support but production has no recipient address
 * configured, so no agent can complete a payment today. Flipping that on is a
 * business decision (a wallet), not a code change here.
 */
const ACP = {
  protocol: { name: 'acp', version: '0.1' },
  api_base_url: MCP,
  transports: ['mcp', 'https'],
  capabilities: {
    // Flat service identifiers — the validator rejects an array of objects
    // here ("Missing or invalid required 'capabilities.services' field").
    // The human-readable detail lives in `service_details` below rather than
    // being dropped.
    services: ['ai-chat', 'rag-query', 'transcripts'],
    checkout: false,
    catalog: false,
  },
  service_details: [
    {
      id: 'ai-chat',
      name: 'Conversational AI',
      description: 'Send messages to a configured Divinci assistant and receive grounded replies.',
      unit: 'request',
    },
    {
      id: 'rag-query',
      name: 'Knowledge base retrieval',
      description: 'Semantic search across a customer knowledge base, with cited source documents.',
      unit: 'request',
    },
    {
      id: 'transcripts',
      name: 'Conversation transcripts',
      description: 'Read stored conversation transcripts for a workspace.',
      unit: 'request',
    },
  ],
  payment: {
    enabled: false,
    reason:
      'Metered access is billed to a Divinci account, not settled per request. ' +
      'x402 is implemented on the MCP server but has no recipient address configured in production.',
    protocols_supported: ['x402'],
    pricing: `${MCP}/pricing`,
  },
  authentication: {
    type: 'oauth2',
    metadata: `${MCP}/.well-known/oauth-protected-resource`,
  },
  documentation: `${MCP}/info`,
};

/* UCP discovery (ucp.dev). Same honesty constraint as ACP: divinci.ai serves
 * no paywalled content, so there is nothing for an agent to pay to unlock.
 * The document exists so an agent asking "can I buy access here?" gets a
 * definite, machine-readable NO rather than a 404 it has to guess about. */
const UCP = {
  // Shape per https://ucp.dev/specification/overview/: a nested `ucp` object
  // carrying version / services / capabilities / payment_handlers. The
  // published Cloudflare skill describes a flatter document that the validator
  // does not actually accept — this follows the spec, not the skill.
  //
  // The three maps are EMPTY, and that is the accurate answer rather than an
  // omission: UCP services are drawn from its own namespace (`dev.ucp.shopping`
  // and friends), Divinci implements none of them, and there are no payment
  // handlers because there is no settlement path. An agent reading this gets a
  // definite "UCP-aware, offers nothing" instead of a 404 it has to interpret.
  ucp: {
    version: '2026-04-08',
    services: {},
    capabilities: {},
    payment_handlers: {},
  },
  // Non-spec keys, kept because a bare empty document tells a human nothing
  // about why it is empty.
  divinci: {
    summary:
      'Public content on divinci.ai is free to read and is not paywalled. ' +
      'Platform access is metered and billed to a Divinci account established ' +
      'by a human; there is no per-request content payment to negotiate, so ' +
      'no UCP service or payment handler is offered.',
    content_payments: false,
    paywall: false,
    metered_access: true,
    documentation: `${DOCS}/`,
    service_description: `${MCP}/info`,
    pricing: 'https://divinci.ai/pricing/',
    authentication: `${MCP}/.well-known/oauth-protected-resource`,
  },
};

const JSON_HEADERS = { 'Cache-Control': 'public, max-age=3600' };

function json(body, type = 'application/json') {
  return new Response(JSON.stringify(body, null, 2), {
    headers: { 'Content-Type': `${type}; charset=utf-8`, ...JSON_HEADERS },
  });
}

/**
 * Route the agent-readiness discovery documents.
 *
 * Returns a Response for a path this module owns, or null so the caller falls
 * through to the static-asset handler (which still serves
 * /.well-known/security.txt).
 */
export function handleAgentDiscovery(url) {
  switch (url.pathname) {
    case '/.well-known/api-catalog':
      return json(API_CATALOG, 'application/linkset+json');

    case '/.well-known/oauth-authorization-server':
    case '/.well-known/openid-configuration':
      return json(OAUTH_AUTHORIZATION_SERVER);

    case '/.well-known/oauth-protected-resource':
      // Origin-derived so staging identifies staging. A hardcoded
      // https://divinci.ai here would make every staging deploy publish a
      // document that names production, which is the same origin-mismatch
      // defect being fixed.
      return json(oauthProtectedResource(url.origin));

    case '/.well-known/agent-card.json':
      return json(A2A_AGENT_CARD);

    case '/.well-known/mcp/server-card.json':
      return json(MCP_SERVER_CARD);

    case '/.well-known/agent-skills/index.json':
      return json(SKILLS_INDEX);

    case '/.well-known/acp.json':
      return json(ACP);

    case '/.well-known/ucp':
      return json(UCP);

    default:
      return null;
  }
}

/* Link headers for the homepage, per RFC 8288 + RFC 9727 §3. Comma-joined into
 * a single header, which the RFC treats as equivalent to repeated headers. */
export const AGENT_LINK_HEADER = [
  '</.well-known/api-catalog>; rel="api-catalog"; type="application/linkset+json"',
  `<${MCP}/info>; rel="service-desc"; type="application/json"`,
  `<${DOCS}/>; rel="service-doc"; type="text/html"`,
  '</llms.txt>; rel="describedby"; type="text/plain"',
  '</.well-known/agent-card.json>; rel="describedby"; type="application/json"',
].join(', ');
