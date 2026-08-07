---
name: divinci-mcp-connect
description: Connect to the Divinci AI MCP server over OAuth 2.1 to use chat, RAG, transcript and release tools.
---

# Connect to the Divinci MCP server

Divinci AI exposes its platform to agents as a remote MCP server. Use this when
you need to query a customer's knowledge base, send a message to a Divinci
assistant, or read conversation transcripts on a user's behalf.

## Endpoints

| Purpose | URL |
|---|---|
| Streamable HTTP transport | `https://mcp.divinci.app/mcp` |
| SSE transport (legacy clients) | `https://mcp.divinci.app/sse` |
| Server description | `https://mcp.divinci.app/info` |
| Protected resource metadata | `https://mcp.divinci.app/.well-known/oauth-protected-resource` |
| Authorization server metadata | `https://mcp.divinci.app/.well-known/oauth-authorization-server` |

## Authentication

OAuth 2.1, authorization code + PKCE (`S256`). Dynamic client registration is
supported, so no pre-shared client ID is required.

1. `POST https://mcp.divinci.app/register` to obtain a client ID.
2. Send the user to `https://mcp.divinci.app/authorize` with a PKCE challenge.
3. Exchange the code at `https://mcp.divinci.app/token`.
4. Call the MCP endpoint with `Authorization: Bearer <access_token>`.

Request only the scopes you need. Read-only work needs `chat:read` and
`rag:read`; ingesting documents needs `rag:write`.

Available scopes: `openid`, `profile`, `email`, `offline_access`,
`rag:read`, `rag:write`, `chat:read`, `chat:write`,
`release:read`, `release:write`, `finetune:read`, `finetune:write`,
`config:read`, `config:write`, `memory:read`, `memory:write`,
`audio:read`, `audio:write`, `divinci:read`, `divinci:write`.

## Notes

- An unauthenticated request to `/sse` or `/mcp` returns `401` with a
  `WWW-Authenticate` header naming the protected-resource metadata URL. Follow
  that header rather than hardcoding the discovery path.
- Tokens are scoped to a single Divinci workspace. If a tool reports that a
  resource does not exist, check the token's workspace before retrying.
