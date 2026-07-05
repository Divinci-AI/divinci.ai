+++
title = "Privacy Policy"
description = "Divinci AI's commitment to protecting your privacy and personal data in compliance with GDPR and international privacy laws"
template = "page.html"
+++

# Privacy Policy

**Last updated:** June 2026

## Our Commitment to Privacy

At Divinci AI, we are committed to protecting your privacy and ensuring the security of your personal data. This Privacy Policy explains how we collect, use, process, and safeguard your information when you use our website, mobile applications (Android and iOS), and services (collectively, the "Services").

## 1. Information We Collect

### 1.1 Information You Provide
- **Account Information**: Name, email address, and profile information when you create an account
- **Contact Information**: Name, email address, company name when you contact us or request demos
- **Chat and AI Interaction Data**: Messages, prompts, and content you submit when using our AI chat features
- **Free Chat Email**: When you use the free chat assistant on our website, the email address you provide and verify with a one-time code. We use it to deliver the verification code, prevent abuse, and — only if you opt in via the consent checkbox — to send occasional product updates (see Section 2.7)
- **Communication Data**: Messages, feedback, and support requests
- **Files and Documents**: Files you upload for AI processing, including documents added to knowledge bases

### 1.2 Information Automatically Collected
- **Website Usage Data**: Pages visited, time spent, click patterns
- **App Usage Data**: Features used, session duration, interaction patterns within our mobile apps
- **Technical Data**: IP address, browser type, device information, operating system version, device identifiers
- **Performance Data**: App and website performance metrics, error logs, and crash reports
- **Push Notification Tokens**: Device tokens for delivering push notifications (if you opt in)

### 1.3 Information from Third-Party Services
When you choose to connect third-party services, we may collect:
- **Google Account Data**: Name, email, and profile information when you sign in with Google or connect Google Drive and Gmail
- **Authentication Data**: Tokens and identifiers from our authentication provider to manage your account securely

### 1.4 Cookies and Tracking Technologies
We use cookies and similar technologies to:
- Ensure website functionality
- Analyze website and app performance
- Provide personalized experience (with your consent)
- Identify the organization associated with a website visit, for B2B marketing purposes (with your consent in the EU/EEA, the United Kingdom, and Switzerland)

## 2. Third-Party Services and SDKs

Our Services integrate the following third-party services, each with their own privacy practices:

### 2.1 Authentication
- **Auth0** (by Okta): Manages user authentication and account security. Processes email, name, and login credentials. [Auth0 Privacy Policy](https://auth0.com/privacy)

### 2.2 Analytics and Crash Reporting
- **Firebase Analytics** (by Google): Collects app usage data, device information, and anonymized interaction events to help us improve our Services. [Firebase Privacy Information](https://firebase.google.com/support/privacy)
- **Firebase Crashlytics** (by Google): Collects crash reports including device state, stack traces, and device identifiers to help us identify and fix issues. Data is retained for 90 days.

### 2.3 Push Notifications
- **Firebase Cloud Messaging** (by Google): Processes device tokens to deliver push notifications. You can opt out of notifications through your device settings at any time.

### 2.4 App Integrity
- **Firebase App Check with Play Integrity** (Android) / **App Attest** (iOS): Verifies that requests to our backend come from genuine instances of our app. Does not collect personal data.

### 2.5 AI Processing
- **AI Language Models**: Your chat messages and uploaded content are processed by AI language model providers to generate responses. We do not use your conversations to train AI models. AI-generated content may be inaccurate and should not be relied upon as professional advice.

### 2.6 Cloud Infrastructure
- **Google Cloud Platform**: Our backend services run on Google Cloud infrastructure with data processing agreements in place.

### 2.7 Marketing, Visitor Identification, and CRM
- **Instantly.ai / Leadsy.ai**: We use Instantly's visitor identification tag (loaded from `r2.leadsy.ai`, which dynamically loads a tracking script from `tag.trovo-tag.com` operated by the same vendor) to identify the organization a website visit may be associated with (e.g., the company linked to the visitor's IP address). This informs our business-to-business outbound marketing. For visitors detected as being in the EU/EEA, the United Kingdom, or Switzerland, this tag loads **only after you grant marketing consent** through our cookie banner. For visitors outside those jurisdictions, the tag loads by default and can be disabled at any time via the "Cookie Preferences" control in Section 10. [Instantly Privacy Policy](https://instantly.ai/privacy-policy)
- **HubSpot**: We use the HubSpot tracking script (loaded from `js.hs-scripts.com`, which dynamically loads tracking, banner, and form-capture scripts from `js.hs-analytics.net`, `js.hs-banner.com`, and `js.hscollectedforms.net`) to record page views, attribute marketing channel performance, capture form submissions, and link website activity to HubSpot CRM contact records when you submit a form or book a meeting. For visitors detected as being in the EU/EEA, the United Kingdom, or Switzerland, this script loads **only after you grant marketing consent** through our cookie banner. For visitors outside those jurisdictions, the script loads by default and can be disabled at any time via the "Cookie Preferences" control in Section 10. [HubSpot Privacy Policy](https://legal.hubspot.com/privacy-policy)
- **Attio**: We use Attio as a customer relationship management (CRM) system to organize business contacts and leads. [Attio Privacy Policy](https://attio.com/privacy)
- **Free chat assistant email sync**: When you verify an email to use the free chat assistant on our website, we store that email as a contact in our HubSpot and Attio CRMs so we can follow up about our products. This sync happens server-side after you complete the one-time-code verification; it is not a tracking script and does not depend on cookies. We designate you a **marketing contact** (eligible to receive marketing email) **only if you check the optional marketing-consent box** in the chat. If you leave it unchecked, we still store the contact record but do not send you marketing email. You can unsubscribe from any marketing email or request deletion of your contact record at any time (see Section 9).

### 2.8 Divinci Local Inference Browser Extension

We publish an optional Chrome extension, **Divinci Local Inference**, that runs Google's Gemma 4 model **on your own device** via WebGPU — usable as an on-page assistant on any site, and as a local, no-API-cost model option for chat.divinci.app. Its privacy posture, in brief:

- **Local-only by default.** Your chats with the on-device model are computed on your GPU and are not logged, stored, or transmitted by the extension. When you are not signed in, the extension sends nothing about your browsing to Divinci.
- **Optional signed-in features.** If you sign in to your Divinci account, the extension can: receive your basic profile (name, email, avatar) at sign-in; while the side panel is open, send a trimmed page address (origin + path; query/fragment removed) plus a one-way hash of the page's visible text to check Divinci's public-web knowledge index (the page's **content is not sent**, sensitive sites are skipped, and nothing is sent when the panel is closed); and, for page-aware answers or account-mode chat, send your chat message to Divinci. You can turn these off in **Advanced settings → Privacy**.
- **No selling, no ads, no cross-site tracking.**
- **Open source.** The extension is Apache-2.0 licensed; source is available at [github.com/Divinci-AI/gemma-gem](https://github.com/Divinci-AI/gemma-gem).

For the full, extension-specific policy — including exactly what each feature sends and your privacy controls — see the [Divinci Local Inference Privacy Policy](/local-inference-privacy/).

## 3. Legal Basis for Processing (GDPR)

We process your personal data based on:
- **Consent**: For analytics, marketing cookies, and optional integrations
- **Legitimate Interest**: For app functionality, security, and crash reporting
- **Contract Performance**: When providing our Services to you
- **Legal Obligation**: When required by law

## 4. How We Use Your Information

### 4.1 Essential Uses
- Provide, maintain, and improve our Services
- Authenticate your identity and manage your account
- Process your AI chat requests and deliver responses
- Deliver push notifications you have opted in to
- Respond to your inquiries and support requests
- Ensure app and website security and functionality
- Detect, prevent, and address technical issues

### 4.2 With Your Consent
- Analytics to improve our website and apps
- Marketing communications
- Personalized content recommendations
- Third-party service integrations (Google Drive, Gmail)

## 5. Data Sharing and Disclosure

We do not sell your personal data. We may share data with:

### 5.1 Service Providers
- Cloud hosting and infrastructure providers (with data processing agreements)
- Authentication service providers
- Analytics and crash reporting providers (when you consent or as described above)
- Marketing and B2B visitor identification providers (subject to consent in regulated jurisdictions, as described in Section 2.7)
- AI model providers for processing your requests
- Customer support tools

### 5.2 Legal Requirements
- When required by law or legal process
- To protect our rights and safety
- In connection with business transfers (mergers, acquisitions, or asset sales)

## 6. Data Retention

- **Account Data**: Retained for as long as your account is active. Upon account deletion, your personal data is deleted within 30 days, except where we are required by law to retain it.
- **Chat and AI Data**: Conversation history is retained while your account is active and deleted upon account deletion.
- **Crash Reports**: Retained for 90 days by Firebase Crashlytics.
- **Analytics Data**: Aggregated analytics data is retained for up to 14 months by Firebase Analytics.
- **Backup Data**: Backup copies may persist for up to 30 days after deletion.

## 7. Data Security

We implement appropriate technical and organizational measures to protect your personal data, including:
- **Encryption in Transit**: All data transmitted between your device and our servers is encrypted using TLS/SSL.
- **Encryption at Rest**: Personal data stored on our servers is encrypted at rest.
- **Access Controls**: Strict access controls limit who within our organization can access personal data.
- **Regular Audits**: We regularly review our security practices and update them as needed.

While we strive to protect your data, no method of electronic transmission or storage is 100% secure. We cannot guarantee absolute security.

## 8. Children's Privacy

Our Services are not directed to children under the age of 13 (or the applicable age of consent in your jurisdiction). We do not knowingly collect personal data from children under 13. If you are a parent or guardian and believe your child has provided us with personal data, please contact us at privacy@divinci.ai and we will take steps to delete such information promptly.

## 9. Your Rights

### 9.1 GDPR Rights (EEA, UK, Switzerland)
- **Right of Access**: Request information about your personal data
- **Data Portability**: Receive your data in a structured, machine-readable format
- **Rectification**: Correct inaccurate personal data
- **Erasure**: Request deletion of your personal data
- **Restriction**: Limit how we process your data
- **Objection**: Object to processing for direct marketing
- **Withdraw Consent**: Revoke consent at any time

To exercise any of these rights, you can submit a request through our self-service [data request portal](https://na1.hs-data-privacy.com/request/HQr4EERnsbB56WBPrmypbg), or email us at privacy@divinci.ai. We respond within 30 days.

### 9.2 CCPA Rights (California Residents)
- **Right to Know**: What personal information we collect and how it is used
- **Right to Delete**: Request deletion of your personal information
- **Right to Opt-Out**: Opt out of the sale of personal information (we do not sell personal information)
- **Non-Discrimination**: We will not discriminate against you for exercising your rights

### 9.3 Apple App Store (iOS Users)
- You may request deletion of your account and all associated data directly within the app or by contacting us
- We comply with Apple's App Store Review Guidelines regarding user privacy and data handling

### 9.4 Google Play Store (Android Users)
- You may request deletion of your account and all associated data directly within the app or by contacting us
- Our Data Safety disclosures in the Google Play Store accurately reflect our data practices as described in this policy

## 10. Your Privacy Controls

<div class="privacy-controls">
  <button onclick="window.gdprCompliance?.showCookieBanner()" class="privacy-btn">
    🍪 Cookie Preferences
  </button>

  <a href="https://na1.hs-data-privacy.com/request/HQr4EERnsbB56WBPrmypbg" target="_blank" rel="noopener noreferrer" class="privacy-btn">
    📥 Submit a Data Request
  </a>

  <button onclick="window.gdprCompliance?.revokeConsent()" class="privacy-btn">
    ❌ Revoke All Consent
  </button>
</div>

<style>
.privacy-controls {
  display: flex;
  gap: 1rem;
  margin: 2rem 0;
  flex-wrap: wrap;
}

.privacy-btn {
  padding: 0.75rem 1.5rem;
  border: 2px solid #cfdcff;
  background: transparent;
  color: #2d3c34;
  border-radius: 0.5rem;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.3s ease;
  display: inline-block;
  text-decoration: none;
  font-family: inherit;
  font-size: 1rem;
}

.privacy-btn:hover {
  background: #cfdcff;
  transform: translateY(-1px);
}

.privacy-btn-danger {
  border-color: #ff6b6b;
  color: #ff6b6b;
}

.privacy-btn-danger:hover {
  background: #ff6b6b;
  color: white;
}
</style>

## 11. International Data Transfers

Your data may be transferred to and processed in countries other than your own. We ensure appropriate safeguards are in place, including Standard Contractual Clauses where required, to protect your data in accordance with this policy and applicable law.

## 12. Changes to This Policy

We may update this Privacy Policy from time to time. We will notify you of material changes by posting the updated policy on our website and updating the "Last updated" date. Your continued use of our Services after changes constitutes acceptance of the updated policy.

## Contact Information

**Divinci AI**
Email: privacy@divinci.ai
Data Protection Officer: dpo@divinci.ai

For any privacy-related requests or questions, contact us at privacy@divinci.ai with a response time of within 30 days.
