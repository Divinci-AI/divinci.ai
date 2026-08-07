---
name: divinci-rag-query
description: Query a Divinci RAG knowledge base and read back cited source documents.
---

# Query a Divinci knowledge base

Divinci knowledge bases ("RAG vectors") hold a customer's ingested documents,
web crawls, transcripts and product catalogs. Use this when you need grounded
answers from a specific customer's content rather than from general knowledge.

Requires an MCP session — see the `divinci-mcp-connect` skill — with at least
the `rag:read` scope.

## Tools

| Tool | Purpose |
|---|---|
| `list_data_sources` | List the knowledge bases the token can reach |
| `search_knowledge` | Semantic search within one knowledge base |
| `get_document` | Fetch a single source document by id |

## Order of operations

1. Call `list_data_sources` first. Knowledge-base ids are per-workspace and
   cannot be guessed.
2. Call `search_knowledge` with that id and the user's question in natural
   language. It is a semantic search — do not reduce the question to keywords,
   which measurably degrades recall.
3. Cite results by document, and use `get_document` when the retrieved chunk is
   not enough to answer confidently.

## Notes

- Zero results usually means the wrong knowledge base, not missing content.
  Re-check the id from step 1 before telling the user the information is absent.
- Retrieval is scoped to the token's workspace. There is no cross-workspace
  search, by design.
