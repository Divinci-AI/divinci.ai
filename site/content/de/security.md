+++
title = "Sicherheit"
description = "Umfassende Sicherheitsmaßnahmen und -praktiken zum Schutz Ihrer Daten und Privatsphäre"
template = "page.html"
+++

# Sicherheit

*Die vollständige Version dieses Dokuments ist unten auf Englisch verfügbar.*

# Security

Security is core to how we build. This page describes what's actually true
about our architecture and practices today — not a marketing checklist. Where
we haven't finished something (a formal audit, a certification), we say so
plainly rather than implying otherwise.

## HIPAA-ready architecture

![HIPAA-Ready Architecture](/brand/badges/hipaa-ready.svg)

We've built the technical safeguards a HIPAA-covered workflow needs into the
platform by default:

- **De-identification before storage or AI processing.** Chat content can be
  routed through an automatic PII/PHI redaction step (Microsoft Presidio,
  with a clinical-text-tuned model available for medical contexts) before it
  touches our database, our AI providers, or search/retrieval — detecting
  all 18 identifier categories in HIPAA's Safe Harbor method. This step
  fails closed: if redaction can't run, the message is rejected rather than
  silently stored unredacted.
- **Tamper-evident audit logging.** Access to sensitive records is recorded
  in a hash-chained log designed so entries can't be silently altered after
  the fact.
- **Role-based and resource-level access control.** Both platform-wide roles
  and per-resource permissions gate who can see what.
- **Encryption in transit and at rest**, with field-level encryption
  available for designated sensitive data.

**What this is not:** a HIPAA compliance certification. There is no
government-issued HIPAA certificate — compliance is a combination of
technical safeguards (above), written administrative policies, and signed
Business Associate Agreements with every vendor in the data path, evaluated
case-by-case for a given customer relationship. If you need to process
Protected Health Information with us under a Business Associate Agreement,
[talk to us](https://meetings.hubspot.com/michael-mooring/divinci-ai) — we'll
work through what's needed for your specific use case.

## Data protection

### Encryption

- **In transit**: TLS everywhere between clients, our edge, and our origin
  infrastructure.
- **At rest**: provider-level encryption on our primary datastore and object
  storage, plus a dedicated field-level encryption layer for designated
  sensitive fields.
- **Secrets management**: credentials and API keys are managed through a
  centralized secrets manager, not hardcoded or stored in plaintext config.
  Production is configured to fail closed rather than silently fall back to
  stale credentials if the secrets service is unreachable.

### Data minimization

- De-identification (above) means original PII/PHI is discarded, not
  retained, wherever that pipeline runs — the smallest possible footprint if
  a downstream system is ever compromised.
- Logs are metadata-only by policy: we don't write message content, emails,
  or other personal data into application logs or error messages.

### Access controls

- **Authentication** via Auth0.
- **Role-based access control** (platform-level) plus **per-resource
  permissions** (document/workspace-level) — least-privilege by default.
- **Quarterly access and configuration reviews** of production services.

## Application security

- **XSS defense at the render boundary**: user-generated and AI-generated
  content is sanitized (DOMPurify) wherever it's rendered as HTML; raw HTML
  injection from untrusted sources is not permitted.
- **Authorization testing**: we run our own AI-assisted and manual security
  testing against staging and production, including authenticated
  authorization/IDOR probes — not (yet) a recurring third-party penetration
  testing program, and we're not going to claim one until it exists.
- **Dependency and code review**: standard code review on all changes;
  dependency updates tracked through our normal build tooling.

## Availability & monitoring

- **Synthetic monitoring** on customer-facing endpoints, alerting on-call via
  PagerDuty within minutes of a real outage, not just on server errors —
  content-verified checks, not just "did it return 200."
- **Multi-region infrastructure** (Cloudflare edge + Google Cloud origin)
  with automated backups on our primary datastore.
- We do not currently publish a contractual uptime SLA. If your use case
  needs one, ask — we can talk through what's realistic for your deployment.

## Incident response

We maintain a documented incident response process: detection and
classification, containment, an honest assessment of whether an incident
rises to a reportable breach, remediation, and a blameless post-mortem that
feeds back into what we monitor for next. If you're a customer under a
Business Associate Agreement with us, that agreement specifies our
notification obligations to you — those terms govern, not this page.

To report a security concern or a suspected vulnerability, email
**security@divinci.ai**. We don't currently run a formal bug bounty program;
we do take reports seriously and will work with you in good faith.

## Where we are on formal certifications

Being direct about this, since a lot of security pages aren't:

- **HIPAA**: see "HIPAA-ready architecture" above. Whether a Business
  Associate Agreement applies depends on your specific relationship with us
  — we evaluate this per customer, not as a blanket claim.
- **SOC 2**: not yet started. It's on our roadmap; we'll update this page
  when there's something real to report — not before.
- **ISO 27001, FedRAMP, PCI DSS**: we don't hold these certifications. Card
  payments are processed through Stripe; Divinci does not store cardholder
  data directly.

We'd rather under-claim here and be trusted than over-claim and have to walk
it back.

### Contact

Security questions, vulnerability reports, or compliance questions for a
specific deal: **security@divinci.ai**
