# ToS + Privacy Policy coverage audit — divinci.app feature set (2026-07-19)

Scope: do `content/terms-of-service.md` (75 lines, updated 2026-05-27) and
`content/privacy-policy.md` (244 lines) cover: notifications, analytics,
website integrations (Squarespace/WordPress/Wix/embed), join-the-chat
(human handoff/multiplayer), and x402 + MCP pay-per-usage monetization —
plus the website-scanning funnel itself.

## Verdict

**Privacy Policy: mostly adequate, 4 gaps.** It already covers analytics
(§2.1), push notifications (§2.3), third-party SDKs/integrations (§2),
CRM/marketing (§2.7), GDPR bases (§3), retention/security (§6-7).

**Terms of Service: seriously under-scoped for the current product — 8 gaps,
one of which is an outright contradiction.**

## ToS gaps (ranked)

1. **§8 license contradiction (CRITICAL).** Grants use "for personal,
   non-commercial purposes" only. divinci.app's entire pitch is BUSINESS AIs,
   embeds on commercial sites, and x402 monetization. This clause, read
   literally, forbids the product's core use. Fix: replace with a
   commercial-use license tied to plan terms.
2. **No user-content / website-scanning terms.** The scan flow collects an
   authorization checkbox ("I'm authorized to have this website scanned") but
   the ToS has no matching section: user grants Divinci a license to crawl,
   index, and process their site content; user warrants they own/control the
   site; Divinci's crawler respects robots and the user bears responsibility
   for authorizing scans of sites they control.
3. **No payment/billing terms at all.** Nothing on subscriptions, wallets,
   usage-based charges, refunds, chargebacks, price changes.
4. **No x402 creator-payout terms.** Monetizing an AI via x402 makes users
   PAYEES: needs marketplace-style terms — payout schedule/method, platform
   fee, taxes are the creator's responsibility, fraud/clawback, sanctions
   compliance, and the right to suspend monetization.
5. **No MCP third-party-access terms.** Exposing a release over MCP means
   third parties consume the user's AI: needs an acceptable-use pass-through
   (user is responsible for what their AI serves), rate limits, and Divinci's
   right to throttle/disable endpoints.
6. **SMS/voice consent language missing (TCPA exposure).** §1 mentions "SMS
   services" but there's no msg-and-data-rates / frequency / "reply STOP to
   opt out" / consent-not-a-condition-of-purchase block, and nothing on
   AI-answered phone calls (some states require disclosure that the caller
   is talking to an AI; we should mandate our customers disclose it too).
7. **Join-the-chat / human handoff not disclosed.** Visitors chatting with a
   business's AI may have a human teammate join or review the thread. ToS
   should oblige workspace owners to use this lawfully; see privacy gap 1
   for the visitor-facing disclosure.
8. **Directory + embed terms.** Opt-in public listing (content standards,
   our right to unlist) and the embed script (no tampering, we may update it)
   are unmentioned. Also §3 still name-drops "GPT-3, ChatGPT" — stale.

## Privacy Policy gaps

1. **Conversation visibility (join-the-chat).** No disclosure that chat
   conversations may be viewed/joined by the business's team members and by
   the workspace owner. Needs a "Who can see your conversations" clause,
   both for our direct users and for end-users of customer AIs.
2. **Processor vs controller roles.** When a visitor chats with a customer's
   AI (embed/directory/phone), Divinci processes that visitor's data ON
   BEHALF OF the customer. Policy speaks only in a first-party voice; needs
   a section clarifying the controller/processor split + where end-users
   should direct requests.
3. **Payment & payout data.** No mention of payment processors (Stripe),
   wallet balances, or x402 transaction metadata (amounts, payer identifiers)
   — categories collected, retention, and sharing with processors.
4. **Voice/SMS data.** Phone-number features mean call recordings/transcripts
   and SMS content are processed (Twilio/LiveKit as sub-processors) —
   currently not listed in §2's third-party services.

## Recommended next step

Amend the ToS with new sections (Commercial License; Your Content & Website
Scanning; Payments & Billing; Creator Monetization (MCP + x402); Messaging &
Voice Consent; Team Access to Conversations; Directory & Embeds) and add the
four privacy clauses above, then bump `last_updated` and re-translate the ja
privacy variant. Existing scan-consent checkbox already links both docs, so
shipping updated text requires no product change.
