+++
title = "Data Processing Agreement"
description = "Data Processing Agreement (DPA) between Divinci AI and businesses using Divinci to power a whitelabel or embedded AI assistant for their own end users."
template = "page.html"
[extra]
last_updated = "July 24th, 2026"
+++

<div class="notification is-info">
    <p class="has-text-centered"><i class="fas fa-info-circle"></i> <strong>Who this is for:</strong> This DPA applies to businesses ("Customers") that use Divinci to power an AI assistant under their own brand — an embedded chat widget, a branded phone number, or a whitelabel deployment — for their own end users. If you are an individual end user chatting with a Divinci-powered assistant on someone else's website, this document does not apply to you directly; see our <a href="/privacy-policy/">Privacy Policy</a> instead.</p>
</div>

## 1. Purpose and Incorporation

This Data Processing Agreement ("**DPA**") supplements the [Terms of Service](/terms-of-service/) ("**Agreement**") between Divinci AI, Inc. ("**Divinci**", "**Processor**") and the Customer that has accepted the Agreement ("**Customer**", "**Controller**"). It applies whenever Divinci processes Personal Data on Customer's behalf as a result of Customer operating a whitelabel or embedded AI assistant that collects data from Customer's own end users ("**End Users**").

This DPA is incorporated into the Agreement by reference and applies automatically to Customer's use of whitelabel or embedded features — no separate signature is required for it to take effect. If your organization requires a countersigned copy for your own compliance records, email legal@divinci.ai and we will provide one on the same terms set out here.

Capitalized terms not defined here have the meaning given in the Agreement or, where applicable, in Regulation (EU) 2016/679 ("**GDPR**").

## 2. Roles of the Parties

- **Customer is the Controller** (or, under CCPA/CPRA, the "Business") with respect to Personal Data of its End Users collected through the assistant Customer configures and operates.
- **Divinci is the Processor** (or "Service Provider"/"Contractor" under CCPA/CPRA) and processes that Personal Data only on Customer's documented instructions, as set out in the Agreement, this DPA, and Customer's configuration of the Services (e.g., the knowledge base, prompts, and integrations Customer sets up).
- Divinci does **not** determine the purposes for which End User Personal Data is processed — that is Customer's responsibility as Controller, including obtaining any consents or providing any notices End Users are owed under applicable law.

## 3. Subject Matter, Duration, and Nature of Processing

- **Subject matter**: Divinci's provision of AI assistant infrastructure (chat, voice, and SMS processing; retrieval-augmented generation over Customer-supplied knowledge bases; conversation storage and transcript generation) to power Customer's whitelabel or embedded assistant.
- **Duration**: For as long as Customer's account or the applicable whitelabel deployment remains active, plus any post-termination retention period described in Section 9.
- **Nature and purpose**: Receiving, processing, and generating responses to End User messages (text, voice-derived transcripts, and SMS); storing conversation history and call/message metadata; and providing the underlying account, billing, and infrastructure services necessary to operate the assistant.

## 4. Categories of Data Subjects and Personal Data

- **Data subjects**: End Users of Customer's assistant (the members of the public, customers, or other individuals who interact with it).
- **Categories of Personal Data**: Chat messages and any Personal Data End Users choose to include in them; voice call transcripts and call metadata (phone numbers, duration, cost) for voice-enabled assistants; SMS message content and phone numbers for SMS-enabled assistants; technical identifiers (IP address, device/browser information) associated with a web-embedded widget session; and any additional Personal Data fields Customer configures the assistant to collect (e.g., via forms or CRM sync features Customer enables).
- Divinci does not require Customer to submit special categories of Personal Data (Art. 9 GDPR) to use the Services, and Customer should avoid configuring the assistant to solicit such data unless Customer has independently assessed and secured a valid legal basis for doing so.

## 5. Processor Obligations

Divinci will:

- Process End User Personal Data only on Customer's documented instructions, unless required to do otherwise by law (in which case Divinci will inform Customer of that legal requirement first, unless the law prohibits notice).
- Ensure persons authorized to process the data are subject to confidentiality obligations.
- Implement the technical and organizational security measures described in Section 8 of our [Privacy Policy](/privacy-policy/#8-data-security) (encryption in transit and at rest, access controls, and regular security review).
- Taking into account the nature of processing, assist Customer by appropriate technical and organizational measures in responding to End User requests to exercise their rights under applicable data protection law.
- Assist Customer in ensuring compliance with security, breach-notification, and data protection impact assessment obligations, taking into account the information available to Divinci.
- At Customer's choice, delete or return all End User Personal Data after the end of the relevant deployment, except to the extent retention is required by law (see Section 9).
- Make available to Customer the information reasonably necessary to demonstrate compliance with this DPA, and allow for and contribute to audits, including inspections, conducted by Customer or an auditor mandated by Customer, subject to reasonable advance notice, confidentiality, and no more than once per 12-month period absent a good-faith belief that a breach has occurred.

## 6. Sub-processors

Customer authorizes Divinci to engage the following categories of sub-processors to provide the Services, each acting under a data processing agreement no less protective than this DPA:

| Sub-processor | Purpose |
|---|---|
| Auth0 (Okta) | Authentication and identity management |
| Google Cloud Platform | Cloud hosting and infrastructure |
| Cloudflare | Edge network, storage (R2/D1/Vectorize), and Workers compute |
| AI model providers (e.g., Anthropic, OpenAI, Google) | Generating AI responses to End User messages |
| Twilio | Voice call and SMS transport, speech-to-text/text-to-speech |
| Stripe | Payment processing (where Customer or its End Users transact through the Services) |

Divinci will notify Customer of any new sub-processor materially expanding this list by updating this page and, where Customer has provided a contact email for legal notices, by email. Customer may object to a new sub-processor on reasonable data-protection grounds within 30 days by contacting legal@divinci.ai; if the parties cannot resolve the objection, Customer's remedy is to stop using the affected feature or terminate the Agreement per its terms.

## 7. International Data Transfers

Where Divinci or its sub-processors process Personal Data outside the country in which the End User is located (including transfers to the United States), Divinci relies on appropriate safeguards, including the EU Standard Contractual Clauses (Module 3: Processor to Sub-processor / Module 2: Controller to Processor, as applicable) or an equivalent mechanism recognized under applicable law, incorporated by reference into this DPA to the extent required.

## 8. Data Subject Requests

If Divinci receives a request directly from an End User to exercise a data protection right (access, deletion, correction, etc.) concerning data processed on Customer's behalf, Divinci will, where legally permitted, redirect the request to Customer or promptly notify Customer of the request, and will provide reasonable cooperation to help Customer respond within the timeframe required by applicable law.

## 9. Data Retention and Deletion

Personal Data processed on Customer's behalf is retained per the schedules described in our [Privacy Policy, Section 7](/privacy-policy/#7-data-retention). Upon termination of Customer's account or the relevant whitelabel deployment, Divinci will delete or anonymize End User Personal Data within the timeframes described there, except where retention is required for legal, tax, accounting, fraud-prevention, or billing-dispute purposes, or where data is contained in encrypted backups that age out on their normal rolling schedule (no more than 30 days).

## 10. Security Incident Notification

Divinci will notify Customer without undue delay after becoming aware of a security incident affecting End User Personal Data processed on Customer's behalf, providing information reasonably available at the time to assist Customer in meeting its own notification obligations under applicable law.

## 11. Liability

Each party's liability arising out of or related to this DPA is subject to the limitations of liability set out in the Agreement.

## 12. Governing Law

This DPA is governed by the same governing law and dispute resolution terms as the Agreement (see [Terms of Service, Sections 19 and 22](/terms-of-service/)).

## 13. Contact

Questions about this DPA, sub-processor changes, or requests for a countersigned copy: legal@divinci.ai. Data protection questions generally: privacy@divinci.ai or our Data Protection Officer at dpo@divinci.ai.
