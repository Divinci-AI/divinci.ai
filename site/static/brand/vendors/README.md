# Third-party vendor marks

Referenced by `static/lab/pipeline.js` (`LOGOS`). A missing file degrades to the
wordmark alone — the chip drops the image slot rather than showing a broken
icon — so marks can land one at a time.

## Present

| file               | vendor               | source                                  |
|--------------------|----------------------|-----------------------------------------|
| `cloudflare.svg`   | Cloudflare Vectorize | server repo, `docs/demos/.../logos/raw/` |
| `qdrant.svg`       | Qdrant               | server repo, `docs/demos/.../logos/raw/` |
| `pageindex.png`    | PageIndex            | server repo, `docs/demos/.../logos-hi/`  |
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
