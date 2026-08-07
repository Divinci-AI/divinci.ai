# auth.md

How AI agents register and authenticate with Divinci AI.

Divinci's agent-facing surface is the MCP server at `https://mcp.divinci.app`.
This document describes how an agent obtains credentials for it on a user's
behalf.

## Audience

Autonomous agents and agent frameworks acting for a Divinci customer. A human
Divinci account must already exist — agents cannot self-provision a workspace,
and no endpoint here creates a billable account without a signed-in user
approving it.

## Authorization server

OAuth 2.1 metadata is published at:

- `https://mcp.divinci.app/.well-known/oauth-authorization-server`
- `https://mcp.divinci.app/.well-known/oauth-protected-resource` (RFC 9728)

Both documents are also mirrored on this domain at the same paths for
discovery. The copies on `mcp.divinci.app` are canonical — validate `issuer`
against those.

## Registration

Dynamic Client Registration (RFC 7591) is open; no pre-shared client ID is
needed.

```http
POST https://mcp.divinci.app/register
Content-Type: application/json

{
  "client_name": "Your Agent",
  "redirect_uris": ["https://your-agent.example/callback"],
  "grant_types": ["authorization_code", "refresh_token"],
  "response_types": ["code"],
  "token_endpoint_auth_method": "none"
}
```

Then run the authorization code flow with PKCE (`S256` required):

1. `GET https://mcp.divinci.app/authorize` — the user signs in and consents.
2. `POST https://mcp.divinci.app/token` — exchange the code for an access token.
3. Call `https://mcp.divinci.app/mcp` with `Authorization: Bearer <token>`.

Refresh tokens are issued when `offline_access` is requested. Tokens may be
revoked at `https://mcp.divinci.app/revoke`.

## Credential use

- Send the access token in the `Authorization` header only. Query-string
  credentials are rejected.
- A token is scoped to one Divinci workspace. It does not grant cross-workspace
  access, and requesting a scope the user has not granted fails closed.
- Request the narrowest scope set that does the job. Read-only work needs
  `chat:read` and `rag:read`.

## agent_auth

```json
{
  "agent_auth": {
    "skill": "https://divinci.ai/.well-known/agent-skills/divinci-mcp-connect/SKILL.md",
    "register_uri": "https://mcp.divinci.app/register",
    "identity_types_supported": ["identity_assertion"],
    "identity_assertion": {
      "assertion_types_supported": [
        "urn:ietf:params:oauth:token-type:id-jag"
      ],
      "credential_types_supported": ["oauth2_access_token"],
      "claim_uri": "https://mcp.divinci.app/.well-known/oauth-protected-resource"
    },
    "methods": [
      {
        "type": "oauth2_dynamic_client_registration",
        "register_uri": "https://mcp.divinci.app/register",
        "authorization_endpoint": "https://mcp.divinci.app/authorize",
        "token_endpoint": "https://mcp.divinci.app/token",
        "revocation_uri": "https://mcp.divinci.app/revoke",
        "code_challenge_methods_supported": ["S256"],
        "credential_types_supported": ["oauth2_access_token"],
        "scopes_supported": [
          "openid", "profile", "email", "offline_access",
          "rag:read", "rag:write", "chat:read", "chat:write",
          "release:read", "release:write", "config:read", "config:write"
        ]
      }
    ],
    "events_supported": ["token_revoked"],
    "revocation_uri": "https://mcp.divinci.app/revoke",
    "documentation": "https://mcp.divinci.app/info",
    "contact": "https://divinci.ai/contact/"
  }
}
```

## Human contact

Security issues: see `https://divinci.ai/.well-known/security.txt`.
Everything else: `https://divinci.ai/contact/`.
