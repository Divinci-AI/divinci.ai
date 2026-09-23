# Third-party vendor marks

Referenced by `static/lab/pipeline.js` (`LOGOS`) and by the retrieval-stack
pills on `templates/trustbench.html` (`STACK_MARKS`). A missing file degrades to the
wordmark alone — the chip drops the image slot rather than showing a broken
icon — so marks can land one at a time.

## Present

| file               | vendor               | source                                  |
|--------------------|----------------------|-----------------------------------------|
| `cloudflare.svg`   | Cloudflare Vectorize | server repo, `docs/demos/.../logos/raw/` |
| `qdrant.svg`       | Qdrant               | server repo, `docs/demos/.../logos/raw/` |
| `pageindex.png`    | PageIndex            | server repo, `docs/demos/agent-release/out/logos/raw/` (listed here before the file was ever committed; added 2026-09-22) |
| `pinecone.png`     | Pinecone             | github.com/pinecone-io.png              |
| `unstructured.png` | Unstructured         | github.com/Unstructured-IO.png          |
| `redis.svg`        | Redis                | Simple Icons (official brand colour)    |
| `mongodb.svg`      | MongoDB Atlas        | Simple Icons                            |
| `couchbase.svg`    | Couchbase            | Simple Icons                            |
| `neo4j.svg`        | Neo4j Hybrid         | Simple Icons                            |
| `turso.svg`        | Turso                | Simple Icons                            |

Vertex AI reuses `/brand/companies/google.svg`, already in the repo.

## Deliberately absent

- **LangExtract, LiteParse, record chunker** — Divinci's own; they should not
  carry a third-party vendor slot.
- **RAPTOR, LightRAG** — techniques/research projects, not companies. A logo is
  the wrong affordance.

## Notes

- Marks are used **nominatively**, to state which integrations are supported.
  Keep them unmodified and unrecoloured; don't imply endorsement.
- Two traps hit while assembling this, worth not repeating:
  `avatars.githubusercontent.com/<org>` (without `/u/<id>`) returns a **generic
  identicon** — Pinecone and Unstructured came back byte-identical. Use
  `github.com/<org>.png` instead. And `unstructured.io/favicon.svg` is an SVG
  wrapper around an embedded raster, not a vector.
- The vendor lists on the page come from `sdk/docs/src/content/docs/vendors/`,
  not from marketing copy. Marker, Tika and OpenParse appear in blog
  comparisons but are **not** supported chunkers.

## Hermes Agent (Nous Research)

Used by `scripts/gen-hermes-og.mjs` for the Hosted Hermes social cards.

- `hermes-agent-wing.svg`: the wing mark served on https://hermes-agent.nousresearch.com
  (`web-assets.nousresearch.com/.../hermes-landing/teams/hermes-wing.*.svg`).
- `hermes-agent-wordmark.png`: `website/static/img/hermes-agent-banner.png` from
  the MIT-licensed https://github.com/NousResearch/hermes-agent repo.
