+++
title = "Validando e Lançando LMs Customizados em Setores Regulados"
description = "EU AI Act, GDPR Artigo 17, HIPAA, NIST AI RMF — mapeados capacidade por capacidade em um pipeline de release LLM. Onde pesos abertos e fechados divergem."
date = 2026-05-29T09:00:00+00:00
template = "blog-post.html"

[taxonomies]
categories = ["Compliance"]
tags = ["Compliance", "EU AI Act", "GDPR", "HIPAA", "NIST AI RMF", "Audit Trail", "vIndex"]

[extra]
author = "Mike Mooring"
author_avatar = "https://pub-fb3e683317b24cf8b4260121edae02be.r2.dev/images/Michael-Mooring.webp"
hero_video = "https://pub-fb3e683317b24cf8b4260121edae02be.r2.dev/validating-and-releasing-custom-lms-in-regulated-fields-veo31.webm"
hero_video_poster = "https://pub-fb3e683317b24cf8b4260121edae02be.r2.dev/images/validating-and-releasing-custom-lms-in-regulated-fields-hero-poster.webp"
reading_time = 12
summary = "Compliance em setores regulados para modelos de linguagem customizados se divide claramente ao longo de um eixo: open-weights vs API fechada. Para backings open-weights, você pode entregar uma atestação de pesos via vIndex que satisfaz a apagabilidade verificável do Artigo 17 do GDPR criptograficamente. Para backings de API fechada, o mesmo recibo cobre a cadeia de decisão mas não pode reivindicar a proveniência dos pesos — e o regulador obtém essa distinção no próprio recibo. Este post mapeia quatro frameworks regulatórios (EU AI Act, GDPR, HIPAA, NIST AI RMF) nos quatro estágios do pipeline que entregamos, e mostra o formato real do recibo."
+++

*Notas do Ciclo de Release — Parte IV*

---

Uma diretora jurídica entra na revisão de engenharia. Ela tem uma única pergunta: *"Se a solicitação de direito ao esquecimento do Artigo 17 do EU AI Act chegar amanhã pedindo para removermos todo fato que nosso modelo aprendeu sobre um paciente específico, podemos provar que o fizemos?"*

A resposta honesta que a maioria das equipes precisa dar é: "Podemos fazer fine-tune do modelo para esquecer. Podemos mostrar o treinamento. Mas não podemos provar que a informação está estruturalmente removida, porque ela pode ressurgir sob o prompt adversarial certo."

Isso não é uma resposta de compliance. É uma não-resposta com um encolher de ombros procedimental.

Este post é sobre como se parece uma resposta de compliance de verdade para LLMs customizados — em quatro frameworks regulatórios (**EU AI Act, GDPR Artigo 17, HIPAA, NIST AI RMF**), mapeados para o pipeline de quatro estágios ([Register → Gate → Roll → Observe](/pt/blog/how-to-build-an-llm-ci-cd-pipeline-with-divinci-ai/)) que entregamos para releases de clientes. A tensão central que atravessa o pedido de cada regulador é **open-weights vs API fechada**: as coisas que você pode provar sobre um fine-tune do Gemma 4 não são as coisas que você pode provar sobre um release servido atrás de uma API opaca de fornecedor. O formato de recibo que usamos diz isso explicitamente, linha por linha. Essa honestidade é o que torna o recibo útil para um auditor.

## Os quatro reguladores e o que cada um realmente quer

Discussões de compliance tendem a colapsar em "documentamos as coisas". Esse enquadramento falha com um auditor. O que auditores querem é *evidência que possam verificar sem ter de confiar na sua infraestrutura*. Os quatro frameworks abaixo usam vocabulários diferentes para o mesmo pedido subjacente.

<figure style="margin: 1.5rem auto; max-width: 100%;">
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 900 380" font-family="'DM Sans', -apple-system, sans-serif" role="img" aria-label="Quatro frameworks regulatórios e o primitivo de verificação que cada um demanda. EU AI Act demanda lógica documentada e supervisão humana; o primitivo de verificação é documentação mecanística bit-exata. GDPR Artigo 17 demanda apagabilidade verificável de dados pessoais; o primitivo de verificação é patch DELETE no nível dos pesos com recibo SHA-256. HIPAA demanda auditoria de acesso e rastreamento de divulgação; o primitivo de verificação é log de decisão assinado por requisição. NIST AI RMF demanda governance, mapping, measurement e management; o primitivo de verificação é recibos hash-chained para cada decisão de release.">
<title>Quatro reguladores, um único pedido de verificação</title>
<rect width="900" height="380" fill="#faf8f5"/>
<text x="40" y="36" font-size="16" font-weight="700" fill="#1e3a2b">Quatro reguladores, um pedido subjacente: verifique, não confie</text>
<text x="40" y="56" font-size="12" fill="#6b5d4f">Cada framework nomeia o primitivo de verificação de forma diferente, mas a substância é a mesma: prova criptográfica que um auditor consegue checar.</text>
<rect x="40" y="86" width="200" height="265" fill="#ffffff" stroke="#2d5a4f" stroke-width="1.5" rx="6"/>
<rect x="40" y="86" width="200" height="34" fill="#2d5a4f" rx="6"/>
<rect x="40" y="106" width="200" height="14" fill="#2d5a4f"/>
<text x="140" y="108" text-anchor="middle" font-size="13" font-weight="700" fill="#faf8f5">EU AI Act</text>
<text x="55" y="142" font-size="11" font-weight="600" fill="#1e3a2b">Anexo IV pede:</text>
<text x="55" y="161" font-size="10" fill="#4a4030">• lógica documentada</text>
<text x="55" y="176" font-size="10" fill="#4a4030">• resumo dos dados de treino</text>
<text x="55" y="191" font-size="10" fill="#4a4030">• medidas de supervisão humana</text>
<text x="55" y="206" font-size="10" fill="#4a4030">• monitoramento pós-mercado</text>
<text x="55" y="232" font-size="11" font-weight="700" fill="#2d5a4f">Primitivo de verificação:</text>
<text x="55" y="250" font-size="10" font-style="italic" fill="#4a4030">documentação mecanística</text>
<text x="55" y="263" font-size="10" font-style="italic" fill="#4a4030">bit-exata via vIndex</text>
<text x="55" y="290" font-size="10" fill="#6b5d4f">Penalidade por não-conformidade:</text>
<text x="55" y="308" font-size="14" font-weight="700" fill="#a04848">até 7% do</text>
<text x="55" y="324" font-size="14" font-weight="700" fill="#a04848">faturamento global</text>
<rect x="260" y="86" width="200" height="265" fill="#ffffff" stroke="#a04848" stroke-width="1.5" rx="6"/>
<rect x="260" y="86" width="200" height="34" fill="#a04848" rx="6"/>
<rect x="260" y="106" width="200" height="14" fill="#a04848"/>
<text x="360" y="108" text-anchor="middle" font-size="13" font-weight="700" fill="#faf8f5">GDPR Art. 17</text>
<text x="275" y="142" font-size="11" font-weight="600" fill="#1e3a2b">Direito ao esquecimento pede:</text>
<text x="275" y="161" font-size="10" fill="#4a4030">• remoção verificável de dados</text>
<text x="275" y="176" font-size="10" fill="#4a4030">• esquecimento demonstrável</text>
<text x="275" y="191" font-size="10" fill="#4a4030">• prova sob prompts</text>
<text x="275" y="204" font-size="10" fill="#4a4030">  adversariais</text>
<text x="275" y="232" font-size="11" font-weight="700" fill="#a04848">Primitivo de verificação:</text>
<text x="275" y="250" font-size="10" font-style="italic" fill="#4a4030">patch DELETE no nível</text>
<text x="275" y="263" font-size="10" font-style="italic" fill="#4a4030">dos pesos com recibo SHA-256</text>
<text x="275" y="290" font-size="10" fill="#6b5d4f">Penalidade por não-conformidade:</text>
<text x="275" y="308" font-size="14" font-weight="700" fill="#a04848">até €20M ou</text>
<text x="275" y="324" font-size="14" font-weight="700" fill="#a04848">4% do faturamento</text>
<rect x="480" y="86" width="200" height="265" fill="#ffffff" stroke="#c87b3c" stroke-width="1.5" rx="6"/>
<rect x="480" y="86" width="200" height="34" fill="#c87b3c" rx="6"/>
<rect x="480" y="106" width="200" height="14" fill="#c87b3c"/>
<text x="580" y="108" text-anchor="middle" font-size="13" font-weight="700" fill="#faf8f5">HIPAA</text>
<text x="495" y="142" font-size="11" font-weight="600" fill="#1e3a2b">Controles de acesso pedem:</text>
<text x="495" y="161" font-size="10" fill="#4a4030">• trilha de auditoria de acesso</text>
<text x="495" y="176" font-size="10" fill="#4a4030">• rastreamento de divulgação</text>
<text x="495" y="191" font-size="10" fill="#4a4030">• exposição mínima-necessária</text>
<text x="495" y="204" font-size="10" fill="#4a4030">  de PHI</text>
<text x="495" y="232" font-size="11" font-weight="700" fill="#c87b3c">Primitivo de verificação:</text>
<text x="495" y="250" font-size="10" font-style="italic" fill="#4a4030">log de decisão assinado</text>
<text x="495" y="263" font-size="10" font-style="italic" fill="#4a4030">por requisição</text>
<text x="495" y="290" font-size="10" fill="#6b5d4f">Penalidade por não-conformidade:</text>
<text x="495" y="308" font-size="14" font-weight="700" fill="#a04848">até US$ 1,9M /</text>
<text x="495" y="324" font-size="14" font-weight="700" fill="#a04848">tipo-de-violação / ano</text>
<rect x="700" y="86" width="200" height="265" fill="#ffffff" stroke="#7a9580" stroke-width="1.5" rx="6"/>
<rect x="700" y="86" width="200" height="34" fill="#7a9580" rx="6"/>
<rect x="700" y="106" width="200" height="14" fill="#7a9580"/>
<text x="800" y="108" text-anchor="middle" font-size="13" font-weight="700" fill="#faf8f5">NIST AI RMF</text>
<text x="715" y="142" font-size="11" font-weight="600" fill="#1e3a2b">Quatro funções centrais:</text>
<text x="715" y="161" font-size="10" fill="#4a4030">• govern</text>
<text x="715" y="176" font-size="10" fill="#4a4030">• map</text>
<text x="715" y="191" font-size="10" fill="#4a4030">• measure</text>
<text x="715" y="206" font-size="10" fill="#4a4030">• manage</text>
<text x="715" y="232" font-size="11" font-weight="700" fill="#7a9580">Primitivo de verificação:</text>
<text x="715" y="250" font-size="10" font-style="italic" fill="#4a4030">recibo hash-chained</text>
<text x="715" y="263" font-size="10" font-style="italic" fill="#4a4030">por decisão de release</text>
<text x="715" y="290" font-size="10" fill="#6b5d4f">Penalidade por não-conformidade:</text>
<text x="715" y="308" font-size="12" font-weight="700" fill="#1e3a2b">framework voluntário</text>
<text x="715" y="324" font-size="11" fill="#6b5d4f">(mas o baseline</text>
<text x="715" y="340" font-size="11" fill="#6b5d4f">de fato corporativo)</text>
</svg>
</figure>

Os números das penalidades não são o que torna esses frameworks interessantes. Os números das penalidades são o que os torna estruturalmente determinantes. A parte interessante é o **primitivo de verificação** — como cada framework realmente quer que o artefato pareça. Três dos quatro pedem prova de grau criptográfico em vocabulários diferentes. O quarto (NIST AI RMF) é voluntário, mas de fato exigido na aquisição corporativa. Eles convergem na mesma forma: um artefato que um auditor consegue verificar sem confiar nos seus logs.

## A divisão: open-weights vs API fechada

Antes do mapeamento por estágio, a ressalva mais importante de todo este post:

**Para backings de modelo open-weights** — Gemma, Qwen, Llama, Mistral, GPT-OSS, qualquer coisa em que os pesos sejam endereçáveis e editáveis — toda decisão de release do Divinci emite um recibo vIndex que inclui uma **atestação de pesos**: prova criptográfica de que os pesos ativos no momento da decisão são exatamente os pesos que o manifest registrou. É isso que torna possível a apagabilidade verificável do Artigo 17 do GDPR. Você aplica um [patch DELETE](/blog/deleting-paris-from-a-language-model/) que remove uma relação-entidade específica do espaço de pesos, o recibo embute o hash antes-e-depois, e um auditor consegue verificar que a deleção aconteceu re-rodando a verificação contra o vIndex público.

**Para backings de modelo de API fechada** — OpenAI, Anthropic, Google via APIs opacas — o mesmo recibo cobre a cadeia de decisão (qual manifest, qual resultado do gate, qual leitura do monitor, qual usuário acionou qual ação) mas **não pode reivindicar proveniência dos pesos**, porque o provedor não expõe os pesos. O recibo registra isso explicitamente em um campo `weight_attestation: null` com uma `note` explicando por quê. Isso não é uma postura de compliance degradada — é o limite do que é verificável, escrito honestamente. Um auditor que lê o recibo entende exatamente qual classe de prova está e não está sendo feita.

Essa divisão atravessa o pedido de cada regulador abaixo. Sempre que um framework demanda algo no nível dos pesos, o caminho open-weights pode satisfazer e o caminho de API fechada não. Dizemos isso no recibo, em vez de insinuar uma prova que não conseguimos entregar.

## Como cada framework mapeia nos quatro estágios do pipeline

O pipeline tem quatro estágios. O pedido de cada regulador mapeia para um ou mais deles. A matriz abaixo é o mapa real.

<figure style="margin: 1.5rem auto; max-width: 100%;">
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 900 430" font-family="'DM Sans', -apple-system, sans-serif" role="img" aria-label="Mapeamento de quatro frameworks regulatórios para o pipeline de release Divinci de quatro estágios. EU AI Act Anexo IV lógica documentada e resumo de treino mapeados para o Estágio 1 Register. EU AI Act supervisão humana e monitoramento pós-mercado mapeados para Estágios 2 Gate e 4 Observe. GDPR Artigo 17 apagabilidade verificável mapeada para o Estágio 1 Register via patch DELETE e Estágio 4 Observe via recibo. HIPAA auditoria de acesso e rastreamento de divulgação mapeados para Estágios 1, 3 e 4. NIST AI RMF govern map measure manage mapeados em todos os quatro estágios. Cinco células na matriz estão destacadas para indicar o caminho de verificação somente-open-weights.">
<title>Frameworks regulatórios mapeados para os estágios do pipeline</title>
<rect width="900" height="430" fill="#faf8f5"/>
<text x="40" y="36" font-size="16" font-weight="700" fill="#1e3a2b">Qual estágio do pipeline cobre qual pedido regulatório</text>
<text x="40" y="56" font-size="12" fill="#6b5d4f">✓ = cobertura completa. ◐ = somente open-weights (atestação de pesos exigida). O caminho de API fechada cobre a cadeia de decisão mas não consegue fazer a reivindicação no nível dos pesos.</text>
<g font-size="11" fill="#1e3a2b" font-weight="700">
<text x="40" y="98">Framework / pedido</text>
<text x="425" y="98" text-anchor="middle">① Register</text>
<text x="555" y="98" text-anchor="middle">② Gate</text>
<text x="685" y="98" text-anchor="middle">③ Roll</text>
<text x="815" y="98" text-anchor="middle">④ Observe</text>
</g>
<line x1="40" y1="108" x2="860" y2="108" stroke="#d4c8b0" stroke-width="1"/>
<g font-size="11" fill="#1e3a2b">
<text x="40" y="130" font-weight="600">EU AI Act</text>
<text x="40" y="146" font-size="10" fill="#6b5d4f">Anexo IV: lógica documentada</text>
<text x="425" y="146" text-anchor="middle" font-size="13" fill="#2d5a4f">✓</text>
<text x="555" y="146" text-anchor="middle" font-size="10" fill="#8a7d68">—</text>
<text x="685" y="146" text-anchor="middle" font-size="10" fill="#8a7d68">—</text>
<text x="815" y="146" text-anchor="middle" font-size="10" fill="#8a7d68">—</text>
<text x="40" y="168" font-size="10" fill="#6b5d4f">Anexo IV: resumo dos dados de treino</text>
<text x="425" y="168" text-anchor="middle" font-size="13" fill="#2d5a4f">✓</text>
<text x="555" y="168" text-anchor="middle" font-size="10" fill="#8a7d68">—</text>
<text x="685" y="168" text-anchor="middle" font-size="10" fill="#8a7d68">—</text>
<text x="815" y="168" text-anchor="middle" font-size="10" fill="#8a7d68">—</text>
<text x="40" y="190" font-size="10" fill="#6b5d4f">Medidas de supervisão humana</text>
<text x="425" y="190" text-anchor="middle" font-size="10" fill="#8a7d68">—</text>
<text x="555" y="190" text-anchor="middle" font-size="13" fill="#2d5a4f">✓</text>
<text x="685" y="190" text-anchor="middle" font-size="10" fill="#8a7d68">—</text>
<text x="815" y="190" text-anchor="middle" font-size="10" fill="#8a7d68">—</text>
<text x="40" y="212" font-size="10" fill="#6b5d4f">Monitoramento pós-mercado</text>
<text x="425" y="212" text-anchor="middle" font-size="10" fill="#8a7d68">—</text>
<text x="555" y="212" text-anchor="middle" font-size="10" fill="#8a7d68">—</text>
<text x="685" y="212" text-anchor="middle" font-size="13" fill="#2d5a4f">✓</text>
<text x="815" y="212" text-anchor="middle" font-size="13" fill="#2d5a4f">✓</text>
</g>
<line x1="40" y1="226" x2="860" y2="226" stroke="#e8dcc4" stroke-width="0.5"/>
<g font-size="11" fill="#1e3a2b">
<text x="40" y="246" font-weight="600">GDPR Artigo 17</text>
<text x="40" y="262" font-size="10" fill="#6b5d4f">Apagabilidade verificável (patch DELETE)</text>
<text x="425" y="262" text-anchor="middle" font-size="13" fill="#a04848" font-weight="700">◐</text>
<text x="555" y="262" text-anchor="middle" font-size="10" fill="#8a7d68">—</text>
<text x="685" y="262" text-anchor="middle" font-size="10" fill="#8a7d68">—</text>
<text x="815" y="262" text-anchor="middle" font-size="13" fill="#a04848" font-weight="700">◐</text>
<text x="40" y="284" font-size="10" fill="#6b5d4f">Recibo de apagamento (hash-chained)</text>
<text x="425" y="284" text-anchor="middle" font-size="10" fill="#8a7d68">—</text>
<text x="555" y="284" text-anchor="middle" font-size="10" fill="#8a7d68">—</text>
<text x="685" y="284" text-anchor="middle" font-size="10" fill="#8a7d68">—</text>
<text x="815" y="284" text-anchor="middle" font-size="13" fill="#2d5a4f">✓</text>
</g>
<line x1="40" y1="298" x2="860" y2="298" stroke="#e8dcc4" stroke-width="0.5"/>
<g font-size="11" fill="#1e3a2b">
<text x="40" y="318" font-weight="600">HIPAA</text>
<text x="40" y="334" font-size="10" fill="#6b5d4f">Auditoria de acesso por requisição</text>
<text x="425" y="334" text-anchor="middle" font-size="10" fill="#8a7d68">—</text>
<text x="555" y="334" text-anchor="middle" font-size="10" fill="#8a7d68">—</text>
<text x="685" y="334" text-anchor="middle" font-size="13" fill="#2d5a4f">✓</text>
<text x="815" y="334" text-anchor="middle" font-size="13" fill="#2d5a4f">✓</text>
<text x="40" y="356" font-size="10" fill="#6b5d4f">Rastreamento de divulgação + mínimo-necessário</text>
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

As duas células ◐ são as entradas GDPR Artigo 17 / somente-open-weights — esses são os pedidos que o caminho de API fechada não consegue satisfazer plenamente. Tudo o mais se aplica aos dois backings.

O restante do post percorre a contribuição de cada estágio.

## Estágio ① — Register

<div style="display: flex; align-items: stretch; gap: 0; margin: 1rem 0 1.5rem; border-radius: 8px; overflow: hidden; border: 1px solid rgba(184, 160, 128, 0.4);">
  <div style="background: #2d5a4f; color: #faf8f5; padding: 0.75rem 1.25rem; font-size: 1.6rem; font-weight: 700; display: flex; align-items: center; line-height: 1;">①</div>
  <div style="background: rgba(45, 90, 79, 0.08); padding: 0.7rem 1rem; flex: 1; display: flex; align-items: center;">
    <strong style="color: #1e3a2b; letter-spacing: 0.04em;">REGISTER</strong>
    <span style="color: #6b5d4f; margin-left: 0.8rem; font-size: 0.92rem;">O manifest de release é a documentação técnica do Anexo IV do EU AI Act.</span>
  </div>
</div>

O estágio Register produz um manifest JSON imutável, endereçado por SHA-256. Para releases regulados, o manifest carrega tudo o que o Anexo IV<sup><a href="#ref-1">[1]</a></sup> pede em um único artefato:

- O artefato do modelo (repo HF + commit SHA, ou uma referência a um patch vIndex)
- O template de prompt (cada variável, cada system message — versionado)
- As regras de roteamento (qual classe de tráfego cai em qual release)
- A versão do dataset usada para computar os thresholds do gate (resumo dos dados de treino por hash)
- O SHA do release anterior (para que a cadeia de auditoria seja ininterrupta)
- O escopo de divulgação — para deployments HIPAA, quais categorias de PHI o modelo está autorizado a receber

O manifest é a documentação. Um auditor não lê prosa; ele lê o hash do manifest e verifica o bundle. Nenhum resumo em prosa escrito-seis-meses-depois é necessário.

**Bônus open-weights.** Quando o artefato do modelo referencia um modelo open-weights, o manifest também embute o `vindex_sha256` — a impressão digital criptográfica do [vIndex](/pt/compliance/) publicado do modelo. Essa impressão digital é o que permite a um terceiro verificar os pesos ativos sem nunca ter de confiar na nossa infraestrutura de deployment.

**Ressalva de API fechada.** Quando o artefato do modelo referencia um modelo de API fechada, o campo `vindex_sha256` do manifest é `null`, e o `weight_attestation_class` do manifest é `decision_chain_only`. O auditor que lê isso sabe exatamente o que está sendo reivindicado e o que não está.

## Estágio ② — Gate

<div style="display: flex; align-items: stretch; gap: 0; margin: 1rem 0 1.5rem; border-radius: 8px; overflow: hidden; border: 1px solid rgba(184, 160, 128, 0.4);">
  <div style="background: #b8a080; color: #1e3a2b; padding: 0.75rem 1.25rem; font-size: 1.6rem; font-weight: 700; display: flex; align-items: center; line-height: 1;">②</div>
  <div style="background: rgba(184, 160, 128, 0.16); padding: 0.7rem 1rem; flex: 1; display: flex; align-items: center;">
    <strong style="color: #1e3a2b; letter-spacing: 0.04em;">GATE</strong>
    <span style="color: #6b5d4f; margin-left: 0.8rem; font-size: 0.92rem;">Quality gates por slice carregam o requisito de supervisão humana do EU AI Act.</span>
  </div>
</div>

O estágio Gate é onde as "medidas de supervisão humana"<sup><a href="#ref-1">[1]</a></sup> do EU AI Act se operacionalizam. Um regulador que lê o EU AI Act e conclui "precisamos de um workflow de aprovação humana" perdeu o ponto — o pedido mais difícil é *contra o que o humano está aprovando*. O estágio Gate responde a essa pergunta com um ρ de Spearman por slice contra um avaliador ancorado em humano<sup><a href="#ref-3">[3]</a></sup>. Cada slice que importa na sua postura regulatória (oncologia pediátrica, licenciamento de IP, francês belga) recebe seu próprio threshold. O caminho de override exige uma justificativa escrita que entra na trilha de auditoria.

Para deployments cobertos por HIPAA, é também aqui que vive a regra de divulgação "mínima-necessária". A suíte de QA pontuada do gate inclui testes negativos para superexposição de PHI — respostas que incluem identificadores pessoais quando nenhum foi solicitado. Um release que regride no slice de superexposição falha no gate, independentemente de como os outros slices se saem.

Para NIST AI RMF, o estágio Gate cobre a função "measure" — a evidência numérica por slice de que o sistema está performando dentro das tolerâncias configuradas.

## Estágio ③ — Roll

<div style="display: flex; align-items: stretch; gap: 0; margin: 1rem 0 1.5rem; border-radius: 8px; overflow: hidden; border: 1px solid rgba(184, 160, 128, 0.4);">
  <div style="background: #c87b3c; color: #faf8f5; padding: 0.75rem 1.25rem; font-size: 1.6rem; font-weight: 700; display: flex; align-items: center; line-height: 1;">③</div>
  <div style="background: rgba(200, 123, 60, 0.12); padding: 0.7rem 1rem; flex: 1; display: flex; align-items: center;">
    <strong style="color: #1e3a2b; letter-spacing: 0.04em;">ROLL</strong>
    <span style="color: #6b5d4f; margin-left: 0.8rem; font-size: 0.92rem;">Checkpoints de canário se tornam o artefato de monitoramento pós-mercado.</span>
  </div>
</div>

O monitoramento pós-mercado do EU AI Act<sup><a href="#ref-1">[1]</a></sup> exige que o operador demonstre observação *contínua* — não apenas pré-lançamento — de como o sistema de IA performa em condições reais. Um canário 5% → 25% → 100% com checkpoints de quality-monitor é a forma mais natural de satisfazer isso. O dwell em cada checkpoint, mais as leituras do monitor durante o dwell, é o que um auditor quer ver.

Para HIPAA, o estágio de canário é também onde o logging de auditoria por requisição é exercitado de ponta a ponta. Cada checkpoint produz uma amostra de recibos assinados de request-response; se algum deles tiver um tratamento de PHI mal configurado, ele aparece a 5% de tráfego, e não a 100%.

## Estágio ④ — Observe

<div style="display: flex; align-items: stretch; gap: 0; margin: 1rem 0 1.5rem; border-radius: 8px; overflow: hidden; border: 1px solid rgba(184, 160, 128, 0.4);">
  <div style="background: #7a9580; color: #faf8f5; padding: 0.75rem 1.25rem; font-size: 1.6rem; font-weight: 700; display: flex; align-items: center; line-height: 1;">④</div>
  <div style="background: rgba(122, 149, 128, 0.14); padding: 0.7rem 1rem; flex: 1; display: flex; align-items: center;">
    <strong style="color: #1e3a2b; letter-spacing: 0.04em;">OBSERVE</strong>
    <span style="color: #6b5d4f; margin-left: 0.8rem; font-size: 0.92rem;">O monitor contínuo + o formato do recibo tornam o Artigo 17 do GDPR verificável.</span>
  </div>
</div>

Este é o estágio que sustenta a história de compliance. O estágio Observe roda replay contínuo de traces pelo release ativo, pontuado pelo mesmo juiz ancorado em humano do Gate, com um monitor de qualidade que aciona rollback automático caso seja violado.

Toda decisão de release — register, gate-pass, gate-fail, gate-override, checkpoint-promote, checkpoint-hold, auto-rollback, manual-rollback, **e qualquer aplicação de patch DELETE do Artigo 17 do GDPR** — emite um recibo vIndex. Hash-chained ao recibo anterior deste cliente e ao recibo anterior deste release.

Eis como se parece um recibo real para um patch DELETE do Artigo 17 do GDPR — adaptado diretamente do formato documentado na [página de compliance](/pt/compliance/):

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

Esse artefato é verificável. Um auditor não precisa confiar nos nossos logs. Ele pega o `vindex_sha256_after`, puxa o vIndex publicado correspondente em `huggingface.co/Divinci-AI`, e verifica que a feature 11179 na camada 27 está estruturalmente ausente do top-25. Pega o `chain_signature` e verifica contra o recibo anterior. A cadeia inteira é ancorada externamente em uma cadência configurada pelo cliente.

**Mesma operação contra um modelo de API fechada.** Os campos do recibo acima mudam de três formas: `operation.target` se torna `provider_api_endpoint`, `verification` se torna um schema diferente cobrindo apenas evidências da cadeia de decisão, e `weight_attestation_class` se torna `decision_chain_only`. O provedor do modelo de API fechada não expôs pesos, então o recibo o diz. Um auditor que quer prova no nível dos pesos agora sabe que precisa escalar para o provedor, não para nós.

Essa é a diferenciação que ninguém mais em 2026 entrega. O acampamento de eval-CI (Braintrust, Humanloop, Patronus) não fica em cima do tráfego e não emite recibos de decisão. O acampamento de serving-canary (SageMaker Deployment Guardrails<sup><a href="#ref-2">[2]</a></sup>, KServe, Vertex, BentoCloud, Seldon) emite logs de métricas de infra, mas não recibos de compliance hash-chained. O acampamento de observabilidade (Arize, Phoenix, Confident, Deepchecks) observa a saída, mas não enforça.

## O que um auditor realmente verifica?

Um exercício útil: percorrer as perguntas que um auditor real fará, e qual artefato responde a cada uma.

| Pergunta do auditor | Artefato que a responde |
|---|---|
| *"Qual versão do modelo estava rodando em 15 de março às 14:22 UTC?"* | O recibo do estágio Observe para esse timestamp, assinado e hash-chained. |
| *"Qual avaliação este release passou antes do promote?"* | O recibo do estágio Gate, com a tabela de ρ de Spearman por slice e o SHA do dataset contra o qual o gate rodou. |
| *"Uma solicitação de apagamento do Artigo 17 do GDPR para o paciente X foi de fato aplicada?"* | O recibo de patch DELETE acima. O auditor verifica `vindex_sha256_after` contra o vIndex publicado. |
| *"Quem aprovou este release? Qual foi a justificativa declarada para sobrepor o gate do slice de licenciamento de IP?"* | O bloco `override` do recibo do estágio Gate, incluindo o ID do usuário e a justificativa em texto livre exigida. |
| *"Quão rápido o rollback disparou, e qual leitura do monitor o acionou?"* | O recibo de rollback do estágio Observe, com as três leituras consecutivas de qualidade abaixo do threshold e o tempo decorrido do rollback. |
| *"Mostre-me a evidência de monitoramento pós-mercado dos últimos 90 dias."* | A cadeia de recibos do estágio Observe. Ancorada externamente na cadência configurada pelo cliente. |

O que o auditor *não precisa fazer*: confiar no nosso Datadog. Confiar no nosso CloudWatch. Confiar em um screenshot. Confiar em um export. O ponto inteiro do formato do recibo é que o auditor consegue verificá-lo independentemente.

## O que isto não resolve

Três limitações honestas:

**Regressões em API fechada no território do Artigo 17 do GDPR não são solucionáveis na camada da plataforma.** Se você está servindo um assistente de saúde atrás de um modelo de API fechada e um paciente invoca o Artigo 17, a plataforma pode atestar que o registro do paciente foi removido do seu retrieval store, do seu template de prompt e das suas regras de roteamento — mas não pode atestar que os pesos do modelo subjacente esqueceram os dados do paciente. Você precisa de um backing open-weights ou de um compromisso do fornecedor com apagamento no nível dos pesos. Nós dizemos isso no recibo.

**Documentação é necessária, mas não suficiente.** Um recibo que prova que um modelo atingiu um threshold não prova que o threshold era o threshold correto. Se sua suíte de QA pontuada não cobre o slice que realmente importa para um paciente no seu serviço, nenhuma quantidade de receipt-chaining conserta isso. Reguladores cada vez mais entendem isso; "passamos no nosso eval" não é mais uma resposta de compliance suficiente se o eval era o eval errado.

**O formato vIndex é single-vendor.** Nós o usamos porque é o primitivo criptográfico mais concreto disponível hoje para prova no nível dos pesos. Se a indústria convergir num formato diferente — model-cards-com-hashes, schemas de artefato publicados pelo NIST — o formato do recibo deve evoluir para isso. A substância (hash-chained, verificável externamente, ciente de weight-attestation) é o que sustenta a estrutura, não o nome específico do schema. Esperamos que isso mude conforme o cenário regulatório e de padrões amadurece.

## FAQ

### O que é apagabilidade verificável sob o Artigo 17 do GDPR para sistemas de IA?

Apagabilidade verificável significa que um terceiro consegue verificar que os dados foram removidos sem ter de confiar nos seus logs. Fazer fine-tune de um modelo para "esquecer" informações específicas não atende a esse padrão — a informação pode ressurgir sob prompts adversariais, e não há primitivo criptográfico que um auditor possa checar. Um patch DELETE no nível dos pesos com um hash vIndex publicado antes/depois *atende* ao padrão, porque o auditor consegue re-rodar a verificação contra o artefato público.

### Por que modelos de API fechada não conseguem satisfazer o Artigo 17 do GDPR do mesmo jeito?

Porque o provedor não expõe os pesos. Sem acesso aos pesos, nenhum terceiro — incluindo o cliente que usa a API — consegue emitir ou verificar um apagamento no nível dos pesos. A parte da cadeia de decisão do recibo (qual template de prompt foi usado, de qual retrieval store os dados vieram, quais regras de roteamento estavam ativas) ainda é verificável, mas a reivindicação no nível dos pesos não é. Isto é um limite do que é verificável quando os pesos são privados, não um limite do framework de compliance.

### O que o Anexo IV do EU AI Act exige, em português claro?

O Anexo IV pede documentação técnica cobrindo a lógica do sistema, o resumo dos dados de treino, o uso pretendido, as medidas de supervisão humana e o monitoramento pós-mercado. A armadilha em que a maioria das equipes cai é tratar isso como cinco documentos separados. O manifest de release no Estágio 1 carrega os três primeiros pedidos como um único hash; o estágio Gate cobre o quarto; os estágios Roll + Observe cobrem o quinto. Um pipeline; quatro pedidos satisfeitos como subproduto das operações normais.

### Quão rápido o rollback deveria ser para deployments cobertos por HIPAA?

O HIPAA não especifica um tempo de rollback, mas a orientação do HHS sobre resposta a violações trata o tempo-para-contenção como estruturalmente determinante. Um rollback na ordem de segundos (drain em voo num flip orientado a manifest — o nosso número é em torno de 12 segundos) é estruturalmente mais rápido do que um blue-green típico baseado em métrica de infra que depende de propagação de alarme. Compare com postmortems públicos: o incidente da Cloudflare em junho de 2022<sup><a href="#ref-4">[4]</a></sup> levou 44 minutos para ser revertido porque engenheiros passaram por cima dos reverts uns dos outros.

### Como o NIST AI RMF mapeia para um pipeline de release?

As quatro funções centrais do NIST AI RMF — Govern, Map, Measure, Manage — abrangem todo o ciclo de vida do release, não um único estágio. Govern é a política de release documentada mais o workflow de justificativa de gate-override (estágios Register + Gate). Map é a suíte de QA pontuada por slice (Gate). Measure são os thresholds de Spearman por slice e o monitor contínuo de qualidade (Gate + Observe). Manage é o caminho de rollback e a cadeia de recibos (Observe). Todas as quatro são cobertas quando o pipeline emite seu conjunto completo de recibos.

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
<strong>Internal — vIndex receipt format.</strong> The receipt JSON in this post is adapted from the format documented on the <a href="/pt/compliance/">compliance page</a> and demonstrated in the <a href="/blog/deleting-paris-from-a-language-model/">"Deleting Paris from a Language Model"</a> post. The hash chain is SHA-256 over <code>manifest || prev_manifest || user_id || created_at || prev_chain_signature</code>. Externally anchorable on a customer-configured schedule.
</li>
</ol>

---

*Próximo nesta série:* **Pipelines Automatizados de CI/CD para LLMs com Rollback Instantâneo.** Este post mostrou o que um auditor quer. O próximo mostra o padrão operacional que faz o recibo chegar à mesa do auditor em segundos em vez de semanas — a automação por baixo do pipeline de quatro estágios, com foco no que muda quando o rollback dispara sozinho.
