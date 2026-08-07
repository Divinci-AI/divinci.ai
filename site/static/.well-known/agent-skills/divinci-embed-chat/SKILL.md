---
name: divinci-embed-chat
description: Embed a Divinci AI chat assistant on a website with a single script tag.
---

# Embed a Divinci assistant on a site

Divinci assistants are embedded as an iframe widget driven by a small loader
script. Use this when a user asks how to put their Divinci assistant on their
own website.

## Minimal embed

```html
<script
  src="https://embed.divinci.app/embed-script.js"
  data-release-id="YOUR_RELEASE_ID"
  defer
></script>
```

`data-release-id` identifies the published assistant configuration. Find it in
the Divinci dashboard under the assistant's **Releases** tab — it is the id of
the release you want visitors to talk to, not the assistant id and not the
workspace id.

## Before it will work on a live domain

1. **Allowlist the host.** The release's allowed-origins list must contain the
   site's exact origin (scheme + host). A missing entry fails at the browser
   with a bot-verification error and leaves no server-side trace.
2. **Publish the release.** A draft release returns configuration but will not
   serve chat.

## Notes

- The widget stores its state in the iframe's own partitioned localStorage. It
  cannot be seeded or read from the embedding page — that is a browser
  restriction, not a Divinci setting.
- Anonymous visitor chat passes through a bot gate (Cloudflare Turnstile). If
  every visitor sees "Bot verification failed", the site's host is missing from
  either the release allowlist or the Turnstile sitekey's domain list.
