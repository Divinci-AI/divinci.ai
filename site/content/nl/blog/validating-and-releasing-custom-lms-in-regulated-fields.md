+++
title = "Aangepaste LM's valideren en uitbrengen in gereguleerde domeinen"
description = "EU AI Act, AVG artikel 17, HIPAA, NIST AI RMF — capaciteit-voor-capaciteit gekoppeld aan een LLM-release-pipeline. Waar open en closed weights uiteenlopen."
date = 2026-05-29T09:00:00+00:00
template = "blog-post.html"

[taxonomies]
categories = ["Compliance"]
tags = ["Compliance", "EU AI Act", "GDPR", "HIPAA", "NIST AI RMF", "Audit Trail", "vIndex"]

[extra]
author = "Mike Mooring"
author_avatar = "images/Michael-Mooring.png"
hero_video = "https://pub-fb3e683317b24cf8b4260121edae02be.r2.dev/validating-and-releasing-custom-lms-in-regulated-fields-veo31.webm"
hero_video_poster = "/images/validating-and-releasing-custom-lms-in-regulated-fields-hero-poster.webp"
reading_time = 12
summary = "Compliance voor gereguleerde sectoren bij aangepaste taalmodellen splitst zich helder langs één as: open-weights versus closed-API. Voor open-weights backings kun je een vIndex-weight-attestation leveren die voldoet aan de cryptografisch verifieerbare wissing van AVG artikel 17. Voor closed-API backings dekt hetzelfde ontvangstbewijs de beslisketen, maar kan het geen aanspraak maken op gewichtsherkomst — en de toezichthouder krijgt dat onderscheid in het ontvangstbewijs zelf. Deze post koppelt vier regelgevende kaders (EU AI Act, AVG, HIPAA, NIST AI RMF) aan de vier pipelinefasen die wij leveren, en toont het werkelijke ontvangstbewijsformaat."
+++

*Notities uit de Release Cycle — Deel IV*

---

Een general counsel komt de engineering-review binnen. Ze heeft één vraag: *"Als er morgen een verzoek tot wissing onder artikel 17 van de EU AI Act binnenkomt waarin gevraagd wordt om elk feit dat ons model over een specifieke patiënt heeft geleerd te verwijderen, kunnen we dan bewijzen dat we dat gedaan hebben?"*

Het eerlijke antwoord dat de meeste teams moeten geven luidt: "We kunnen het model fine-tunen om te vergeten. We kunnen je de training-run laten zien. Maar we kunnen niet bewijzen dat de informatie structureel weg is, omdat ze onder de juiste adversariële prompt weer kan opduiken."

Dat is geen compliance-antwoord. Het is een non-antwoord met een procedureel schouderophalen.

Deze post gaat over hoe een echt compliance-antwoord eruitziet voor aangepaste LLM's — over vier regelgevende kaders heen (**EU AI Act, AVG artikel 17, HIPAA, NIST AI RMF**), gekoppeld aan de pipeline met vier fasen ([Register → Gate → Roll → Observe](/nl/blog/how-to-build-an-llm-ci-cd-pipeline-with-divinci-ai/)) die wij leveren voor klantreleases. De doorlopende spanning in elke vraag van elke toezichthouder is **open-weights versus closed-API**: wat je kunt bewijzen over een Gemma 4-finetune, kun je niet bewijzen over een release die achter een ondoorzichtige vendor-API wordt geserveerd. Het ontvangstbewijsformaat dat wij gebruiken zegt dat expliciet, regel voor regel. Die eerlijkheid is wat het ontvangstbewijs bruikbaar maakt voor een auditor.

## De vier toezichthouders en wat ze elk daadwerkelijk vragen

Compliancediscussies vervallen vaak tot "we hebben dingen gedocumenteerd". Die framing schiet tekort bij een auditor. Wat auditors willen is *bewijs dat ze kunnen verifiëren zonder jouw infrastructuur te vertrouwen*. De vier kaders hieronder gebruiken allemaal verschillende vocabulaires voor dezelfde onderliggende vraag.

<figure style="margin: 1.5rem auto; max-width: 100%;">
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 900 380" font-family="'DM Sans', -apple-system, sans-serif" role="img" aria-label="Vier regelgevende kaders en de verificatieprimitief die elk eist. EU AI Act eist gedocumenteerde logica en menselijk toezicht; verificatieprimitief is bit-exacte mechanistische documentatie. AVG artikel 17 eist verifieerbare wissing van persoonsgegevens; verificatieprimitief is een DELETE-patch op gewichtsniveau met SHA-256-ontvangstbewijs. HIPAA eist toegangsaudit en disclosure-tracking; verificatieprimitief is een per-verzoek ondertekend beslislog. NIST AI RMF eist governance, mapping, meting en management; verificatieprimitief is hash-geketende ontvangstbewijzen voor elke releasebeslissing.">
<title>Vier toezichthouders, één verificatievraag</title>
<rect width="900" height="380" fill="#faf8f5"/>
<text x="40" y="36" font-size="16" font-weight="700" fill="#1e3a2b">Vier toezichthouders, één onderliggende vraag: verifieer, vertrouw niet</text>
<text x="40" y="56" font-size="12" fill="#6b5d4f">Elk kader benoemt de verificatieprimitief anders, maar de inhoud is hetzelfde: cryptografisch bewijs dat een auditor kan controleren.</text>
<rect x="40" y="86" width="200" height="265" fill="#ffffff" stroke="#2d5a4f" stroke-width="1.5" rx="6"/>
<rect x="40" y="86" width="200" height="34" fill="#2d5a4f" rx="6"/>
<rect x="40" y="106" width="200" height="14" fill="#2d5a4f"/>
<text x="140" y="108" text-anchor="middle" font-size="13" font-weight="700" fill="#faf8f5">EU AI Act</text>
<text x="55" y="142" font-size="11" font-weight="600" fill="#1e3a2b">Bijlage IV vraagt om:</text>
<text x="55" y="161" font-size="10" fill="#4a4030">• gedocumenteerde logica</text>
<text x="55" y="176" font-size="10" fill="#4a4030">• samenvatting trainingsdata</text>
<text x="55" y="191" font-size="10" fill="#4a4030">• maatregelen voor menselijk toezicht</text>
<text x="55" y="206" font-size="10" fill="#4a4030">• post-market monitoring</text>
<text x="55" y="232" font-size="11" font-weight="700" fill="#2d5a4f">Verificatieprimitief:</text>
<text x="55" y="250" font-size="10" font-style="italic" fill="#4a4030">bit-exacte mechanistische</text>
<text x="55" y="263" font-size="10" font-style="italic" fill="#4a4030">documentatie via vIndex</text>
<text x="55" y="290" font-size="10" fill="#6b5d4f">Boete bij non-compliance:</text>
<text x="55" y="308" font-size="14" font-weight="700" fill="#a04848">tot 7% van</text>
<text x="55" y="324" font-size="14" font-weight="700" fill="#a04848">wereldwijde omzet</text>
<rect x="260" y="86" width="200" height="265" fill="#ffffff" stroke="#a04848" stroke-width="1.5" rx="6"/>
<rect x="260" y="86" width="200" height="34" fill="#a04848" rx="6"/>
<rect x="260" y="106" width="200" height="14" fill="#a04848"/>
<text x="360" y="108" text-anchor="middle" font-size="13" font-weight="700" fill="#faf8f5">AVG art. 17</text>
<text x="275" y="142" font-size="11" font-weight="600" fill="#1e3a2b">Recht op wissing vraagt om:</text>
<text x="275" y="161" font-size="10" fill="#4a4030">• verifieerbare gegevensverwijdering</text>
<text x="275" y="176" font-size="10" fill="#4a4030">• aantoonbaar vergeten</text>
<text x="275" y="191" font-size="10" fill="#4a4030">• bewijs onder adversariële</text>
<text x="275" y="204" font-size="10" fill="#4a4030">  prompting</text>
<text x="275" y="232" font-size="11" font-weight="700" fill="#a04848">Verificatieprimitief:</text>
<text x="275" y="250" font-size="10" font-style="italic" fill="#4a4030">DELETE-patch op gewichtsniveau</text>
<text x="275" y="263" font-size="10" font-style="italic" fill="#4a4030">met SHA-256-ontvangstbewijs</text>
<text x="275" y="290" font-size="10" fill="#6b5d4f">Boete bij non-compliance:</text>
<text x="275" y="308" font-size="14" font-weight="700" fill="#a04848">tot €20M of</text>
<text x="275" y="324" font-size="14" font-weight="700" fill="#a04848">4% van de omzet</text>
<rect x="480" y="86" width="200" height="265" fill="#ffffff" stroke="#c87b3c" stroke-width="1.5" rx="6"/>
<rect x="480" y="86" width="200" height="34" fill="#c87b3c" rx="6"/>
<rect x="480" y="106" width="200" height="14" fill="#c87b3c"/>
<text x="580" y="108" text-anchor="middle" font-size="13" font-weight="700" fill="#faf8f5">HIPAA</text>
<text x="495" y="142" font-size="11" font-weight="600" fill="#1e3a2b">Toegangscontroles vragen om:</text>
<text x="495" y="161" font-size="10" fill="#4a4030">• toegangsaudittrail</text>
<text x="495" y="176" font-size="10" fill="#4a4030">• disclosure-tracking</text>
<text x="495" y="191" font-size="10" fill="#4a4030">• minimaal-noodzakelijke</text>
<text x="495" y="204" font-size="10" fill="#4a4030">  PHI-blootstelling</text>
<text x="495" y="232" font-size="11" font-weight="700" fill="#c87b3c">Verificatieprimitief:</text>
<text x="495" y="250" font-size="10" font-style="italic" fill="#4a4030">per-verzoek ondertekend</text>
<text x="495" y="263" font-size="10" font-style="italic" fill="#4a4030">beslislog</text>
<text x="495" y="290" font-size="10" fill="#6b5d4f">Boete bij non-compliance:</text>
<text x="495" y="308" font-size="14" font-weight="700" fill="#a04848">tot $1,9M /</text>
<text x="495" y="324" font-size="14" font-weight="700" fill="#a04848">overtredingstype / jaar</text>
<rect x="700" y="86" width="200" height="265" fill="#ffffff" stroke="#7a9580" stroke-width="1.5" rx="6"/>
<rect x="700" y="86" width="200" height="34" fill="#7a9580" rx="6"/>
<rect x="700" y="106" width="200" height="14" fill="#7a9580"/>
<text x="800" y="108" text-anchor="middle" font-size="13" font-weight="700" fill="#faf8f5">NIST AI RMF</text>
<text x="715" y="142" font-size="11" font-weight="600" fill="#1e3a2b">Vier kernfuncties:</text>
<text x="715" y="161" font-size="10" fill="#4a4030">• govern</text>
<text x="715" y="176" font-size="10" fill="#4a4030">• map</text>
<text x="715" y="191" font-size="10" fill="#4a4030">• measure</text>
<text x="715" y="206" font-size="10" fill="#4a4030">• manage</text>
<text x="715" y="232" font-size="11" font-weight="700" fill="#7a9580">Verificatieprimitief:</text>
<text x="715" y="250" font-size="10" font-style="italic" fill="#4a4030">hash-geketend ontvangstbewijs</text>
<text x="715" y="263" font-size="10" font-style="italic" fill="#4a4030">per releasebeslissing</text>
<text x="715" y="290" font-size="10" fill="#6b5d4f">Boete bij non-compliance:</text>
<text x="715" y="308" font-size="12" font-weight="700" fill="#1e3a2b">vrijwillig kader</text>
<text x="715" y="324" font-size="11" fill="#6b5d4f">(maar de de facto</text>
<text x="715" y="340" font-size="11" fill="#6b5d4f">enterprisestandaard)</text>
</svg>
</figure>

De boetebedragen zijn niet wat deze kaders interessant maakt. De boetebedragen zijn wat ze dragend maakt. Het interessante onderdeel is de **verificatieprimitief** — hoe het artefact er volgens elk kader daadwerkelijk uit moet zien. Drie van de vier vragen om cryptografisch bewijsmateriaal in verschillende vocabulaires. Het vierde (NIST AI RMF) is vrijwillig maar de facto verplicht in enterprise-procurement. Ze komen samen op dezelfde vorm: een artefact dat een auditor kan verifiëren zonder je logs te vertrouwen.

## De splitsing: open-weights versus closed-API

Vóór de mapping per fase volgt het belangrijkste voorbehoud in deze hele post:

**Voor open-weights modelbackings** — Gemma, Qwen, Llama, Mistral, GPT-OSS, alles waarbij de gewichten adresseerbaar en bewerkbaar zijn — emitteert elke Divinci-releasebeslissing een vIndex-ontvangstbewijs met een **weight-attestation**: cryptografisch bewijs dat de actieve gewichten op het beslismoment exact de gewichten zijn die in het manifest geregistreerd staan. Dit is wat verifieerbare wissing onder AVG artikel 17 mogelijk maakt. Je past een [DELETE-patch](/nl/blog/deleting-paris-from-a-language-model/) toe die een specifieke entiteit-relatie uit de gewichtsruimte verwijdert, het ontvangstbewijs bevat de hash van vóór en na, en een auditor kan verifiëren dat de wissing daadwerkelijk heeft plaatsgevonden door de verificatie opnieuw uit te voeren tegen de publieke vIndex.

**Voor closed-API modelbackings** — OpenAI, Anthropic, Google via ondoorzichtige API's — dekt hetzelfde ontvangstbewijs de beslisketen (welk manifest, welke gate-uitslag, welke monitor-meting, welke gebruiker welke actie triggerde) maar **kan het geen aanspraak maken op gewichtsherkomst**, omdat de provider geen gewichten beschikbaar stelt. Het ontvangstbewijs vermeldt dit expliciet in een veld `weight_attestation: null` met een `note` die uitlegt waarom. Dat is geen verminderde compliancepositie — het is de grens van wat verifieerbaar is, eerlijk opgeschreven. Een auditor die het ontvangstbewijs leest begrijpt exact welke klasse van bewijs wel en niet wordt geleverd.

Deze splitsing loopt door elke regelgeversvraag hieronder. Wanneer een kader iets eist op gewichtsniveau, kan het open-weights-pad dat invullen en het closed-API-pad niet. Dat zeggen we in het ontvangstbewijs, in plaats van een bewijs te impliceren dat we niet kunnen leveren.

## Hoe elk kader op de vier pipelinefasen aansluit

De pipeline heeft vier fasen. De vraag van elke toezichthouder sluit aan op één of meer ervan. De onderstaande matrix is de werkelijke koppeling.

<figure style="margin: 1.5rem auto; max-width: 100%;">
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 900 430" font-family="'DM Sans', -apple-system, sans-serif" role="img" aria-label="Koppeling van vier regelgevende kaders aan de Divinci-releasepipeline met vier fasen. EU AI Act bijlage IV gedocumenteerde logica en trainingssamenvatting gekoppeld aan fase 1 Register. EU AI Act menselijk toezicht en post-market monitoring gekoppeld aan fasen 2 Gate en 4 Observe. AVG artikel 17 verifieerbare wissing gekoppeld aan fase 1 Register via DELETE-patch en fase 4 Observe via ontvangstbewijs. HIPAA toegangsaudit en disclosure-tracking gekoppeld aan fasen 1, 3 en 4. NIST AI RMF govern map measure manage gekoppeld aan alle vier fasen. Vijf cellen in de matrix zijn gemarkeerd om het open-weights-only-verificatiepad aan te geven.">
<title>Regelgevende kaders gekoppeld aan de pipelinefasen</title>
<rect width="900" height="430" fill="#faf8f5"/>
<text x="40" y="36" font-size="16" font-weight="700" fill="#1e3a2b">Welke pipelinefase dekt welke regelgevende vraag</text>
<text x="40" y="56" font-size="12" fill="#6b5d4f">✓ = volledige dekking. ◐ = alleen open-weights (weight-attestation vereist). Het closed-API-pad dekt de beslisketen maar kan de claim op gewichtsniveau niet maken.</text>
<g font-size="11" fill="#1e3a2b" font-weight="700">
<text x="40" y="98">Kader / vraag</text>
<text x="425" y="98" text-anchor="middle">① Register</text>
<text x="555" y="98" text-anchor="middle">② Gate</text>
<text x="685" y="98" text-anchor="middle">③ Roll</text>
<text x="815" y="98" text-anchor="middle">④ Observe</text>
</g>
<line x1="40" y1="108" x2="860" y2="108" stroke="#d4c8b0" stroke-width="1"/>
<g font-size="11" fill="#1e3a2b">
<text x="40" y="130" font-weight="600">EU AI Act</text>
<text x="40" y="146" font-size="10" fill="#6b5d4f">Bijlage IV: gedocumenteerde logica</text>
<text x="425" y="146" text-anchor="middle" font-size="13" fill="#2d5a4f">✓</text>
<text x="555" y="146" text-anchor="middle" font-size="10" fill="#8a7d68">—</text>
<text x="685" y="146" text-anchor="middle" font-size="10" fill="#8a7d68">—</text>
<text x="815" y="146" text-anchor="middle" font-size="10" fill="#8a7d68">—</text>
<text x="40" y="168" font-size="10" fill="#6b5d4f">Bijlage IV: samenvatting trainingsdata</text>
<text x="425" y="168" text-anchor="middle" font-size="13" fill="#2d5a4f">✓</text>
<text x="555" y="168" text-anchor="middle" font-size="10" fill="#8a7d68">—</text>
<text x="685" y="168" text-anchor="middle" font-size="10" fill="#8a7d68">—</text>
<text x="815" y="168" text-anchor="middle" font-size="10" fill="#8a7d68">—</text>
<text x="40" y="190" font-size="10" fill="#6b5d4f">Maatregelen voor menselijk toezicht</text>
<text x="425" y="190" text-anchor="middle" font-size="10" fill="#8a7d68">—</text>
<text x="555" y="190" text-anchor="middle" font-size="13" fill="#2d5a4f">✓</text>
<text x="685" y="190" text-anchor="middle" font-size="10" fill="#8a7d68">—</text>
<text x="815" y="190" text-anchor="middle" font-size="10" fill="#8a7d68">—</text>
<text x="40" y="212" font-size="10" fill="#6b5d4f">Post-market monitoring</text>
<text x="425" y="212" text-anchor="middle" font-size="10" fill="#8a7d68">—</text>
<text x="555" y="212" text-anchor="middle" font-size="10" fill="#8a7d68">—</text>
<text x="685" y="212" text-anchor="middle" font-size="13" fill="#2d5a4f">✓</text>
<text x="815" y="212" text-anchor="middle" font-size="13" fill="#2d5a4f">✓</text>
</g>
<line x1="40" y1="226" x2="860" y2="226" stroke="#e8dcc4" stroke-width="0.5"/>
<g font-size="11" fill="#1e3a2b">
<text x="40" y="246" font-weight="600">AVG artikel 17</text>
<text x="40" y="262" font-size="10" fill="#6b5d4f">Verifieerbare wissing (DELETE-patch)</text>
<text x="425" y="262" text-anchor="middle" font-size="13" fill="#a04848" font-weight="700">◐</text>
<text x="555" y="262" text-anchor="middle" font-size="10" fill="#8a7d68">—</text>
<text x="685" y="262" text-anchor="middle" font-size="10" fill="#8a7d68">—</text>
<text x="815" y="262" text-anchor="middle" font-size="13" fill="#a04848" font-weight="700">◐</text>
<text x="40" y="284" font-size="10" fill="#6b5d4f">Wissingsontvangstbewijs (hash-geketend)</text>
<text x="425" y="284" text-anchor="middle" font-size="10" fill="#8a7d68">—</text>
<text x="555" y="284" text-anchor="middle" font-size="10" fill="#8a7d68">—</text>
<text x="685" y="284" text-anchor="middle" font-size="10" fill="#8a7d68">—</text>
<text x="815" y="284" text-anchor="middle" font-size="13" fill="#2d5a4f">✓</text>
</g>
<line x1="40" y1="298" x2="860" y2="298" stroke="#e8dcc4" stroke-width="0.5"/>
<g font-size="11" fill="#1e3a2b">
<text x="40" y="318" font-weight="600">HIPAA</text>
<text x="40" y="334" font-size="10" fill="#6b5d4f">Per-verzoek toegangsaudit</text>
<text x="425" y="334" text-anchor="middle" font-size="10" fill="#8a7d68">—</text>
<text x="555" y="334" text-anchor="middle" font-size="10" fill="#8a7d68">—</text>
<text x="685" y="334" text-anchor="middle" font-size="13" fill="#2d5a4f">✓</text>
<text x="815" y="334" text-anchor="middle" font-size="13" fill="#2d5a4f">✓</text>
<text x="40" y="356" font-size="10" fill="#6b5d4f">Disclosure-tracking + minimaal-noodzakelijk</text>
<text x="425" y="356" text-anchor="middle" font-size="13" fill="#2d5a4f">✓</text>
<text x="555" y="356" text-anchor="middle" font-size="13" fill="#2d5a4f">✓</text>
<text x="685" y="356" text-anchor="middle" font-size="10" fill="#8a7d68">—</text>
<text x="815" y="356" text-anchor="middle" font-size="10" fill="#8a7d68">—</text>
</g>
<line x1="40" y1="370" x2="860" y2="370" stroke="#e8dcc4" stroke-width="0.5"/>
<g font-size="11" fill="#1e3a2b">
<text x="40" y="390" font-weight="600">NIST AI RMF</text>
<text x="40" y="406" font-size="10" fill="#6b5d4f">Govern · Map · Measure · Manage</text>
<text x="425" y="406" text-anchor="middle" font-size="13" fill="#2d5a4f">✓</text>
<text x="555" y="406" text-anchor="middle" font-size="13" fill="#2d5a4f">✓</text>
<text x="685" y="406" text-anchor="middle" font-size="13" fill="#2d5a4f">✓</text>
<text x="815" y="406" text-anchor="middle" font-size="13" fill="#2d5a4f">✓</text>
</g>
</svg>
</figure>

De twee ◐-cellen zijn de AVG-artikel-17-/open-weights-only-vermeldingen — dit zijn de vragen die het closed-API-pad niet volledig kan invullen. Al het overige geldt voor beide backings.

De rest van de post loopt door de bijdrage van elke fase.

## Fase ① — Register

<div style="display: flex; align-items: stretch; gap: 0; margin: 1rem 0 1.5rem; border-radius: 8px; overflow: hidden; border: 1px solid rgba(184, 160, 128, 0.4);">
  <div style="background: #2d5a4f; color: #faf8f5; padding: 0.75rem 1.25rem; font-size: 1.6rem; font-weight: 700; display: flex; align-items: center; line-height: 1;">①</div>
  <div style="background: rgba(45, 90, 79, 0.08); padding: 0.7rem 1rem; flex: 1; display: flex; align-items: center;">
    <strong style="color: #1e3a2b; letter-spacing: 0.04em;">REGISTER</strong>
    <span style="color: #6b5d4f; margin-left: 0.8rem; font-size: 0.92rem;">Het releasemanifest is de technische documentatie volgens EU AI Act bijlage IV.</span>
  </div>
</div>

De Register-fase produceert een onveranderlijk JSON-manifest, geadresseerd via SHA-256. Voor gereguleerde releases bevat het manifest alles wat bijlage IV<sup><a href="#ref-1">[1]</a></sup> vraagt in één artefact:

- Het modelartefact (HF-repo + commit-SHA, of een vIndex-patchreferentie)
- De prompt-template (elke variabele, elk systeembericht — onder versiebeheer)
- De routingregels (welke verkeersklasse op welke release terechtkomt)
- De datasetversie gebruikt om gate-drempels te berekenen (samenvatting trainingsdata via hash)
- De SHA van de vorige release (zodat de auditketen ononderbroken is)
- De disclosure-scope — voor HIPAA-deployments: welke PHI-categorieën het model mag ontvangen

Het manifest *is* de documentatie. Een auditor leest geen proza; ze lezen de manifest-hash en verifiëren de bundel. Geen zes-maanden-later geschreven prozasamenvatting nodig.

**Open-weights-bonus.** Wanneer het modelartefact verwijst naar een open-weights model, bevat het manifest ook de `vindex_sha256` — de cryptografische vingerafdruk van de gepubliceerde [vIndex](/nl/compliance/) van het model. Die vingerafdruk is wat een derde partij in staat stelt om de actieve gewichten te verifiëren zonder ooit onze deployment-infrastructuur te hoeven vertrouwen.

**Closed-API-voorbehoud.** Wanneer het modelartefact verwijst naar een closed-API model, is het veld `vindex_sha256` in het manifest `null` en is het `weight_attestation_class` van het manifest `decision_chain_only`. De auditor die dit leest, weet exact wat wel en wat niet wordt geclaimd.

## Fase ② — Gate

<div style="display: flex; align-items: stretch; gap: 0; margin: 1rem 0 1.5rem; border-radius: 8px; overflow: hidden; border: 1px solid rgba(184, 160, 128, 0.4);">
  <div style="background: #b8a080; color: #1e3a2b; padding: 0.75rem 1.25rem; font-size: 1.6rem; font-weight: 700; display: flex; align-items: center; line-height: 1;">②</div>
  <div style="background: rgba(184, 160, 128, 0.16); padding: 0.7rem 1rem; flex: 1; display: flex; align-items: center;">
    <strong style="color: #1e3a2b; letter-spacing: 0.04em;">GATE</strong>
    <span style="color: #6b5d4f; margin-left: 0.8rem; font-size: 0.92rem;">Kwaliteitspoorten per slice dragen de EU AI Act-eis voor menselijk toezicht.</span>
  </div>
</div>

De Gate-fase is waar de "maatregelen voor menselijk toezicht"<sup><a href="#ref-1">[1]</a></sup> uit de EU AI Act operationeel worden. Een toezichthouder die de EU AI Act leest en concludeert "we hebben een menselijke goedkeuringsworkflow nodig" mist het punt — de moeilijkere vraag is *waartegen* de mens goedkeurt. De Gate-fase beantwoordt die vraag met een per-slice Spearman-ρ tegen een door mensen verankerde beoordelaar<sup><a href="#ref-3">[3]</a></sup>. Elke slice die ertoe doet in jouw regelgevingspositie (pediatrische oncologie, IP-licentiëring, Belgisch Frans) krijgt zijn eigen drempel. Het overrride-pad vereist een schriftelijke rationale die in het audittrail terechtkomt.

Voor HIPAA-gedekte deployments leeft hier ook de "minimaal-noodzakelijke" disclosure-regel. De scored-QA-suite van de gate bevat negatieve tests voor PHI-overblootstelling — antwoorden die persoonlijke identifiers bevatten terwijl daarom niet werd gevraagd. Een release die regresseert op de over-exposure slice faalt op de gate, ongeacht hoe de andere slices presteren.

Voor NIST AI RMF dekt de Gate-fase de "measure"-functie — het numerieke bewijs per slice dat het systeem binnen geconfigureerde toleranties presteert.

## Fase ③ — Roll

<div style="display: flex; align-items: stretch; gap: 0; margin: 1rem 0 1.5rem; border-radius: 8px; overflow: hidden; border: 1px solid rgba(184, 160, 128, 0.4);">
  <div style="background: #c87b3c; color: #faf8f5; padding: 0.75rem 1.25rem; font-size: 1.6rem; font-weight: 700; display: flex; align-items: center; line-height: 1;">③</div>
  <div style="background: rgba(200, 123, 60, 0.12); padding: 0.7rem 1rem; flex: 1; display: flex; align-items: center;">
    <strong style="color: #1e3a2b; letter-spacing: 0.04em;">ROLL</strong>
    <span style="color: #6b5d4f; margin-left: 0.8rem; font-size: 0.92rem;">Canary-checkpoints worden het post-market monitoring-artefact.</span>
  </div>
</div>

EU AI Act post-market monitoring<sup><a href="#ref-1">[1]</a></sup> vereist dat de operator *doorlopende* — niet alleen pre-launch — observatie van het AI-systeem in reële omstandigheden aantoont. Een 5% → 25% → 100% canary met kwaliteitsmonitor-checkpoints is de meest natuurlijke manier om hieraan te voldoen. De dwell op elk checkpoint, plus de monitor-metingen tijdens de dwell, is wat een auditor wil zien.

Voor HIPAA is de canary-fase ook waar per-verzoek audit-logging end-to-end wordt beproefd. Elk checkpoint produceert een steekproef van ondertekende verzoek/antwoord-ontvangstbewijzen; mocht een ervan een verkeerd geconfigureerde PHI-afhandeling hebben, dan komt dat aan het oppervlak bij 5% verkeer in plaats van bij 100%.

## Fase ④ — Observe

<div style="display: flex; align-items: stretch; gap: 0; margin: 1rem 0 1.5rem; border-radius: 8px; overflow: hidden; border: 1px solid rgba(184, 160, 128, 0.4);">
  <div style="background: #7a9580; color: #faf8f5; padding: 0.75rem 1.25rem; font-size: 1.6rem; font-weight: 700; display: flex; align-items: center; line-height: 1;">④</div>
  <div style="background: rgba(122, 149, 128, 0.14); padding: 0.7rem 1rem; flex: 1; display: flex; align-items: center;">
    <strong style="color: #1e3a2b; letter-spacing: 0.04em;">OBSERVE</strong>
    <span style="color: #6b5d4f; margin-left: 0.8rem; font-size: 0.92rem;">De continue monitor + het ontvangstbewijsformaat maken AVG artikel 17 verifieerbaar.</span>
  </div>
</div>

Dit is de fase die het complianceverhaal verdient. De Observe-fase draait continue trace-replay door de actieve release, gescoord door dezelfde door mensen verankerde rechter uit Gate, met een kwaliteitsmonitor die een automatische rollback triggert als hij doorbreekt.

Elke releasebeslissing — register, gate-pass, gate-fail, gate-override, checkpoint-promote, checkpoint-hold, auto-rollback, manual-rollback, **en elke toepassing van een AVG-artikel-17-DELETE-patch** — emitteert een vIndex-ontvangstbewijs. Hash-geketend aan het vorige ontvangstbewijs voor deze klant en het vorige ontvangstbewijs voor deze release.

Zo ziet een echt ontvangstbewijs eruit voor een AVG-artikel-17-DELETE-patch — rechtstreeks aangepast van het formaat dat op de [compliancepagina](/nl/compliance/) is gedocumenteerd:

```json
{
  "name": "gdpr-art17-patient-12348-removal",
  "version": 1,
  "base_model": "google/gemma-4-E2B-it",
  "manifest_sha256": "9abaeaf6c91f8b...",
  "previous_manifest_sha256": "8f72b1de4a93c5...",
  "created_at": "2026-05-29T03:17:42Z",
  "user_id": "compliance-officer-7c4e1a",
  "operation": {
    "op": "delete",
    "entity": "patient-record-12348",
    "relation": "diagnosis-association",
    "target": "weight-feature-11179-layer-27",
    "weight": -1.0
  },
  "verification": {
    "before_feature_11179_score": 17.34,
    "before_feature_11179_rank": 1,
    "after_feature_11179_score": null,
    "after_feature_11179_rank": "ABSENT_FROM_TOP_25",
    "perplexity_delta_wikitext103": "+0.02%",
    "vindex_sha256_before": "abc12...",
    "vindex_sha256_after":  "def34..."
  },
  "weight_attestation_class": "full",
  "chain_signature": "sha256(manifest || prev_manifest || user_id || created_at || prev_chain_signature)"
}
```

Dat artefact is verifieerbaar. Een auditor hoeft onze logs niet te vertrouwen. Ze pakken de `vindex_sha256_after`, halen de bijbehorende gepubliceerde vIndex op van `huggingface.co/Divinci-AI`, en verifiëren dat feature 11179 in laag 27 structureel afwezig is in de top-25. Ze pakken de `chain_signature` en verifiëren deze tegen het voorgaande ontvangstbewijs. De hele keten wordt extern verankerd volgens een schema dat de klant configureert.

**Dezelfde operatie tegen een closed-API model.** De ontvangstbewijsvelden hierboven veranderen op drie manieren: `operation.target` wordt `provider_api_endpoint`, `verification` wordt een ander schema dat alleen bewijs uit de beslisketen dekt, en `weight_attestation_class` wordt `decision_chain_only`. De aanbieder van het closed-API model heeft geen gewichten beschikbaar gesteld, dus zegt het ontvangstbewijs dat. Een auditor die bewijs op gewichtsniveau wil, weet nu dat ze moeten escaleren naar de provider, niet naar ons.

Dit is de differentiatie die in 2026 niemand anders levert. Het eval-CI-kamp (Braintrust, Humanloop, Patronus) zit niet op verkeer en zendt geen beslissings-ontvangstbewijzen uit. Het serving-canary-kamp (SageMaker Deployment Guardrails<sup><a href="#ref-2">[2]</a></sup>, KServe, Vertex, BentoCloud, Seldon) zendt infra-metric-logs uit maar geen hash-geketende compliance-ontvangstbewijzen. Het observability-kamp (Arize, Phoenix, Confident, Deepchecks) bekijkt output, maar handhaaft niet.

## Wat verifieert een auditor daadwerkelijk?

Een nuttige oefening: loop de vragen door die een echte auditor zal stellen, en welk artefact elke vraag beantwoordt.

| Vraag van de auditor | Artefact dat erop antwoordt |
|---|---|
| *"Welke modelversie draaide op 15 maart om 14:22 UTC?"* | Het Observe-fase-ontvangstbewijs voor die tijdstempel, ondertekend en hash-geketend. |
| *"Welke evaluatie heeft deze release doorstaan voordat hij werd gepromoveerd?"* | Het Gate-fase-ontvangstbewijs, met de per-slice Spearman-ρ-tabel en de dataset-SHA waartegen de gate is gedraaid. |
| *"Werd een AVG-artikel-17-wissingsverzoek voor patiënt X daadwerkelijk toegepast?"* | Het DELETE-patch-ontvangstbewijs hierboven. De auditor verifieert `vindex_sha256_after` tegen de gepubliceerde vIndex. |
| *"Wie heeft deze release goedgekeurd? Wat was hun verklaarde rationale voor het overrulen van de IP-licentiëringspoort?"* | Het `override`-blok van het Gate-fase-ontvangstbewijs, inclusief de user-ID en de vereiste free-text rationale. |
| *"Hoe snel werd de rollback uitgevoerd, en welke monitor-meting triggerde hem?"* | Het rollback-ontvangstbewijs uit de Observe-fase, met de drie opeenvolgende sub-drempel-kwaliteitsmetingen en de verstreken tijd van de rollback. |
| *"Toon me het post-market monitoring-bewijs voor de laatste 90 dagen."* | De ontvangstbewijsketen uit de Observe-fase. Extern verankerd volgens het door de klant geconfigureerde schema. |

Wat de auditor *niet hoeft te doen*: onze Datadog vertrouwen. Onze CloudWatch vertrouwen. Een screenshot vertrouwen. Een export vertrouwen. Het hele punt van het ontvangstbewijsformaat is dat de auditor het onafhankelijk kan verifiëren.

## Wat dit niet oplost

Drie eerlijke beperkingen:

**Closed-API-regressies op AVG-artikel-17-terrein zijn niet oplosbaar op de platformlaag.** Als je een healthcare-assistent achter een closed-API model serveert en een patiënt beroept zich op artikel 17, kan het platform attesteren dat het patiëntdossier is verwijderd uit je retrieval-store, je prompt-template en je routingregels — maar kan het niet attesteren dat de onderliggende modelgewichten de patiëntgegevens zijn vergeten. Je hebt ofwel een open-weights backing nodig, ofwel een toezegging van de vendor tot wissing op gewichtsniveau. Dat zeggen we in het ontvangstbewijs.

**Documentatie is noodzakelijk maar niet voldoende.** Een ontvangstbewijs dat bewijst dat een model een drempel haalde, bewijst niet dat de drempel de juiste drempel was. Als je scored-QA-suite niet de slice dekt die er voor een patiënt in jouw dienstverlening werkelijk toe doet, lost geen enkele hoeveelheid ontvangstbewijsketens dat op. Toezichthouders begrijpen dit steeds beter; "we hebben onze eval gehaald" is niet langer een voldoende compliance-antwoord als de eval de verkeerde eval was.

**Het vIndex-formaat is single-vendor.** Wij gebruiken het omdat het de meest concrete cryptografische primitief is die vandaag beschikbaar is voor bewijs op gewichtsniveau. Als de industrie zich op een ander formaat vastlegt — model-cards-met-hashes, NIST-gepubliceerde artefactschema's — zou het ontvangstbewijsformaat daarnaar moeten evolueren. De inhoud (hash-geketend, extern verifieerbaar, weight-attestation-bewust) is wat dragend is, niet de specifieke schema-naam. We verwachten dat dit verandert naarmate het regelgevings- en standaardenlandschap volwassen wordt.

## FAQ

### Wat is verifieerbare wissing onder AVG artikel 17 voor AI-systemen?

Verifieerbare wissing betekent dat een derde partij kan verifiëren dat de gegevens zijn verwijderd zonder je logs te hoeven vertrouwen. Een model fine-tunen om specifieke informatie te "vergeten" voldoet niet aan deze norm — de informatie kan onder adversariële prompting weer opduiken en er is geen cryptografische primitief die een auditor kan controleren. Een DELETE-patch op gewichtsniveau met een gepubliceerde voor/na-vIndex-hash voldoet *wel* aan de norm, omdat de auditor de verificatie opnieuw kan uitvoeren tegen het publieke artefact.

### Waarom kunnen closed-API modellen niet op dezelfde manier aan AVG artikel 17 voldoen?

Omdat de provider geen gewichten beschikbaar stelt. Zonder toegang tot de gewichten kan geen enkele derde partij — ook niet de klant die de API gebruikt — een wissing op gewichtsniveau uitvoeren of verifiëren. Het beslisketengedeelte van het ontvangstbewijs (welke prompt-template werd gebruikt, uit welke retrieval-store de data kwam, welke routingregels actief waren) is nog steeds verifieerbaar, maar de claim op gewichtsniveau niet. Dit is een grens van wat verifieerbaar is wanneer gewichten privé zijn, geen grens van het compliancekader.

### Wat vereist bijlage IV van de EU AI Act, in begrijpelijk Nederlands?

Bijlage IV vraagt om technische documentatie die de logica van het systeem, de samenvatting van de trainingsdata, het beoogde gebruik, maatregelen voor menselijk toezicht en post-market monitoring dekt. De valkuil waar de meeste teams in vallen, is deze als vijf afzonderlijke documenten te behandelen. Het releasemanifest in fase 1 draagt de eerste drie vragen als één enkele hash; de Gate-fase dekt de vierde; de Roll- + Observe-fasen dekken de vijfde. Eén pipeline; vier vragen ingevuld als bijproduct van normale operaties.

### Hoe snel moet de rollback zijn voor HIPAA-gedekte deployments?

HIPAA specificeert geen rollbacktijd, maar de HHS-richtlijnen voor breach-respons behandelen time-to-containment als dragend. Een rollback in de orde van seconden (in-flight drain op een manifest-gestuurde flip — ons getal is ongeveer 12 seconden) is structureel sneller dan een typische infra-metric blue-green die afhankelijk is van alarmpropagatie. Vergelijk met publieke postmortems: het incident van Cloudflare in juni 2022<sup><a href="#ref-4">[4]</a></sup> duurde 44 minuten om terug te draaien omdat engineers elkaars reverts oversprongen.

### Hoe sluit NIST AI RMF aan op een releasepipeline?

De vier kernfuncties van NIST AI RMF — Govern, Map, Measure, Manage — beslaan de hele release-levenscyclus, niet één enkele fase. Govern is het gedocumenteerde releasebeleid plus de workflow voor gate-override-rationale (fasen Register + Gate). Map is de scored-QA-suite per slice (Gate). Measure is de Spearman-drempels per slice en de continue kwaliteitsmonitor (Gate + Observe). Manage is het rollback-pad en de ontvangstbewijsketen (Observe). Alle vier worden gedekt wanneer de pipeline zijn volledige ontvangstbewijsset emitteert.

## References

<ol class="post-references" style="padding-left: 1.5rem;">
<li id="ref-1" style="scroll-margin-top: 90px; margin-bottom: 0.9rem;">
<strong>EU AI Act.</strong> <a href="https://artificialintelligenceact.eu/" target="_blank" rel="noopener">artificialintelligenceact.eu</a>. Annex IV defines the technical documentation requirements for high-risk AI systems: system logic, training data summary, human oversight measures, post-market monitoring. Penalties up to 7% of global turnover for non-compliance.
</li>
<li id="ref-2" style="scroll-margin-top: 90px; margin-bottom: 0.9rem;">
<strong>AWS SageMaker Deployment Guardrails.</strong> <a href="https://docs.aws.amazon.com/sagemaker/latest/dg/deployment-guardrails-blue-green-canary.html" target="_blank" rel="noopener">Use canary traffic shifting</a> + <a href="https://docs.aws.amazon.com/sagemaker/latest/dg/deployment-guardrails-configuration.html" target="_blank" rel="noopener">Auto-Rollback Configuration</a>. Default <code>TerminationWaitInSeconds</code> 600, max <code>MaximumExecutionTimeoutInSeconds</code> 1800. Cited as the industry-standard infra-metric canary that the Stage 4 quality monitor is contrasted against.
</li>
<li id="ref-3" style="scroll-margin-top: 90px; margin-bottom: 0.9rem;">
<strong>Calibrated LLM-as-judge agreement.</strong> Zheng et al., <a href="https://arxiv.org/abs/2306.05685" target="_blank" rel="noopener"><em>Judging LLM-as-a-Judge with MT-Bench and Chatbot Arena</em></a> (NeurIPS 2023). &gt;80% overall GPT-4-vs-human agreement, with per-category variance from coding (86%) down to writing (36–44%). Anchor for the per-slice Spearman calibration that drives the Gate stage.
</li>
<li id="ref-4" style="scroll-margin-top: 90px; margin-bottom: 0.9rem;">
<strong>Cloudflare June 2022 outage.</strong> <a href="https://blog.cloudflare.com/cloudflare-outage-on-june-21-2022/" target="_blank" rel="noopener">Cloudflare outage on June 21, 2022</a>. 44 minutes from "we know what to revert" to revert complete because engineers walked over each other's reverts. Anchor for the "manifest-driven rollback can't have that failure mode" claim.
</li>
<li id="ref-5" style="scroll-margin-top: 90px; margin-bottom: 0.9rem;">
<strong>NIST AI Risk Management Framework.</strong> <a href="https://www.nist.gov/itl/ai-risk-management-framework" target="_blank" rel="noopener">NIST AI RMF</a>. Voluntary framework — Govern, Map, Measure, Manage — that has become the de facto enterprise procurement baseline for AI governance. Voluntary but enforced in practice through customer due-diligence questionnaires.
</li>
<li id="ref-6" style="scroll-margin-top: 90px; margin-bottom: 0.9rem;">
<strong>HIPAA Privacy Rule.</strong> <a href="https://www.hhs.gov/hipaa/for-professionals/privacy/index.html" target="_blank" rel="noopener">HHS Office for Civil Rights</a>. Minimum-necessary disclosure, access audit, and breach response timing requirements applicable to any AI system that touches PHI. Civil monetary penalties up to $1.9M per violation-type per year per <a href="https://www.federalregister.gov/documents/2024/11/15/2024-26535/civil-monetary-penalties-inflation-adjustments-for-2025" target="_blank" rel="noopener">CMP inflation adjustment, 2025</a>.
</li>
<li id="ref-7" style="scroll-margin-top: 90px; margin-bottom: 0.9rem;">
<strong>GDPR Article 17 (Right to Erasure).</strong> <a href="https://gdpr-info.eu/art-17-gdpr/" target="_blank" rel="noopener">gdpr-info.eu/art-17-gdpr</a>. The data subject's right to obtain erasure of personal data, and the controller's obligation to demonstrate compliance under Article 5(2) accountability. Penalties up to €20M or 4% of annual global turnover.
</li>
<li id="ref-8" style="scroll-margin-top: 90px; margin-bottom: 0.9rem;">
<strong>Internal — vIndex receipt format.</strong> The receipt JSON in this post is adapted from the format documented on the <a href="/nl/compliance/">compliance page</a> and demonstrated in the <a href="/nl/blog/deleting-paris-from-a-language-model/">"Deleting Paris from a Language Model"</a> post. The hash chain is SHA-256 over <code>manifest || prev_manifest || user_id || created_at || prev_chain_signature</code>. Externally anchorable on a customer-configured schedule.
</li>
</ol>

---

*Volgende in deze serie:* **Geautomatiseerde LLM-CI/CD-pipelines met instant rollback.** Deze post liet zien wat een auditor wil. De volgende toont het operationele patroon dat het ontvangstbewijs in seconden in plaats van weken op het bureau van de auditor laat belanden — de automatisering onder de vier-fasen-pipeline, met focus op wat verandert wanneer de rollback uit zichzelf afgaat.
