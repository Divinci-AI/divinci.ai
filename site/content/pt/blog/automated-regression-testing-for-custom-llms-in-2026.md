+++
title = "Testes de regressão automatizados para LLMs customizados em 2026"
description = "Como construir uma suíte de regressão que detecta drift na avaliação — não só no modelo. Gates por slice, juízes calibrados, replay de traces de produção."
date = 2026-05-26T09:00:00+00:00
template = "blog-post.html"

[taxonomies]
categories = ["Product"]
tags = ["Regression Testing", "LLM Ops", "CI/CD", "Evaluation", "Drift Detection", "Release Management"]

[extra]
author = "Mike Mooring"
author_avatar = "https://pub-fb3e683317b24cf8b4260121edae02be.r2.dev/images/Michael-Mooring.webp"
hero_video = "https://pub-fb3e683317b24cf8b4260121edae02be.r2.dev/automated-regression-testing-for-custom-llms-in-2026-veo31.webm"
hero_video_poster = "https://pub-fb3e683317b24cf8b4260121edae02be.r2.dev/images/automated-regression-testing-for-custom-llms-in-2026-hero-poster.webp"
featured_image = "https://pub-fb3e683317b24cf8b4260121edae02be.r2.dev/images/automated-regression-testing-for-custom-llms-in-2026-hero.webp"
reading_time = 13
summary = "A maioria das 'regressões' em LLM é drift na própria suíte de avaliação — calibração do juiz, cobertura de slices, template de prompt, índice de retrieval. Eis a suíte que detecta esses casos, pontuada por slice com um juiz calibrado e re-executada contra traces de produção ao vivo."
+++

*Notas do Ciclo de Release — Parte 7*

Sexta-feira, 16h47, você publicou um ajuste de prompt de um único caractere. O score agregado da avaliação saiu de 0,873 para 0,871 — bem dentro do ruído. Segunda de manhã sua fila de suporte está em chamas por causa de uma classe de queries que você parou de olhar há seis meses porque estavam estáveis.

Nada no modelo regrediu. O modelo é o mesmo modelo. **A avaliação é que driftou debaixo dos seus pés.** Seis meses de crescimento lento em um segmento de cliente nunca entraram no golden dataset, o prompt do juiz foi calibrado pela última vez contra humanos em outubro, e o índice de retrieval se reconstruiu silenciosamente na quarta passada com um modelo de embedding atualizado.

Isso é o que o post 6 sinalizou — [o modelo é a resposta certa em aproximadamente um alerta em cada sete](/pt/blog/how-to-diagnose-custom-llm-qa-failures-in-7-steps/). O que significa que sua suíte de regressão precisa detectar drift em si mesma, não só no modelo. Este post é essa suíte.

## O que é, na prática, testar regressão em um LLM customizado?

Testes de regressão de software fazem `output == expected` para entradas fixas. Funcionam porque a função é determinística.

Um modelo de linguagem não é uma função no mesmo sentido. O mesmo prompt em temperatura > 0 produz uma distribuição de completions válidas, e "válido" é multi-dimensional: respondeu a pergunta, a resposta está embasada no contexto recuperado, ficou dentro do envelope de segurança, voltou dentro do budget de latência. Então testar regressão de um LLM customizado significa **medir a distribuição de comportamento contra uma distribuição baseline congelada** — através dos slices que importam para você, com juízes que foram calibrados contra humanos, em inputs que se parecem com seu tráfego de produção.

Três coisas precisam estar no lugar antes de qualquer disso fazer sentido:

1. Um **golden dataset** que se assemelha à produção no nível de slice, não no agregado.
2. Um **juiz calibrado** — não "usamos GPT-5 como juiz", mas "medimos Spearman ρ ≥ 0,7 contra três avaliadores humanos, refrescado pela última vez na semana passada".
3. Um **manifesto de baseline** — os pesos exatos do modelo, template de prompt, índice de retrieval e versão do juiz que pontuaram o que pontuaram. Sem isso você não consegue dizer se o score se moveu porque o modelo mudou ou porque a régua mudou.

A Divinci roda os três como objetos de primeira classe, encadeados por hash, pontuados em cada commit. O resto deste post é como montá-los.

## Por que a maioria das suítes de regressão de LLM falha em capturar regressões reais

O modo de falha dominante em 2026 para LLMs customizados é o que o time Sigma Inference do Tianpan batizou de *Semver Lie* no postmortem de abril de 2026<sup><a href="#ref-1">[1]</a></sup>: uma métrica agregada fica estável ou melhora, enquanto um ou dois slices de produção regridem silenciosamente. O slice estava abaixo de 5% do tráfego quando o teste foi desenhado, então nunca entrou no golden dataset; seis meses depois é 12% do tráfego, o modelo degradou nele, e o número agregado nunca ia perceber.

Analisamos todo postmortem público de release de LLM dos últimos dezoito meses e o padrão se repete: **a suíte ficou verde porque pontuou a coisa errada.** Especificamente:

- O golden dataset foi escrito à mão pelo time no lançamento e nunca re-estratificado contra distribuições de tráfego deslocadas.
- O prompt do LLM-as-judge foi definido uma vez e nunca recalibrado contra labels humanos. A concordância do juiz decaiu silenciosamente<sup><a href="#ref-2">[2]</a></sup>.
- Os scores baseline foram armazenados como números crus, não como tuplas `(model_sha, prompt_sha, judge_sha, dataset_sha, score)` — então quando algo regrediu, ninguém conseguia dizer qual dos quatro tinha se movido.

Uma suíte de regressão que não resolve os três é apenas um passo de CI que fica verde no deploy e te dá falsa confiança. A correção não é "mais casos". A correção é medição **consciente de slice, ancorada em versão, com juiz calibrado**, a cada release.

## Construa um golden dataset que sobrevive à análise por slice

A composição de quatro baldes que entregamos por padrão — 60% amostras de produção, 15% adversarial, 15% edge cases curados por especialistas, 10% replays de falhas — é um ponto de partida razoável. O que faz ela efetivamente pegar regressões são os **metadados de slice** anexados a cada caso.

Cada entrada no dataset carrega: input, comportamento esperado (rubrica, não string exata), contexto de retrieval (se houver), e uma tag `slice` — domínio, segmento de usuário, intenção da query, idioma, faixa de comprimento, qualquer decomposição que importe para seu produto. A suíte pontua **por slice**, e qualquer slice que cai abaixo do seu threshold bloqueia o release, mesmo se o score agregado subiu.

<figure style="margin: 2rem 0;">
<svg viewBox="0 0 900 520" xmlns="http://www.w3.org/2000/svg" style="width: 100%; max-width: 100%; height: auto;" role="img" aria-label="Composição do golden dataset: 60% amostra de produção, 15% adversarial, 15% edge cases de especialistas, 10% replays de falhas, todos estratificados por slices">
<rect width="900" height="520" fill="#faf8f5"/>
<text x="450" y="34" font-family="'DM Sans', -apple-system, sans-serif" font-size="20" font-weight="700" fill="#1e3a2b" text-anchor="middle">Composição do golden dataset — estratificado por slice em todos os eixos</text>
<text x="450" y="58" font-family="'DM Sans', -apple-system, sans-serif" font-size="13" fill="#5a6862" text-anchor="middle">Dimensionado para ~500 casos. Segmentos da barra são proporcionais. Cobertura por slice é o requisito duro, não a proporção agregada.</text>
<g transform="translate(70, 100)">
<rect x="0" y="0" width="456" height="68" fill="#2d5a4f" stroke="#1e3a2b" stroke-width="1.5"/>
<rect x="456" y="0" width="114" height="68" fill="#7a4848" stroke="#1e3a2b" stroke-width="1.5"/>
<rect x="570" y="0" width="114" height="68" fill="#b8a060" stroke="#1e3a2b" stroke-width="1.5"/>
<rect x="684" y="0" width="76" height="68" fill="#5a7a8f" stroke="#1e3a2b" stroke-width="1.5"/>
<text x="228" y="34" font-family="'DM Sans', sans-serif" font-size="16" font-weight="700" fill="#faf8f5" text-anchor="middle">Amostra de produção</text>
<text x="228" y="54" font-family="'DM Sans', sans-serif" font-size="22" font-weight="700" fill="#faf8f5" text-anchor="middle">60%</text>
<text x="513" y="32" font-family="'DM Sans', sans-serif" font-size="12" font-weight="600" fill="#faf8f5" text-anchor="middle">Adversarial</text>
<text x="513" y="52" font-family="'DM Sans', sans-serif" font-size="18" font-weight="700" fill="#faf8f5" text-anchor="middle">15%</text>
<text x="627" y="32" font-family="'DM Sans', sans-serif" font-size="12" font-weight="600" fill="#3a2e1c" text-anchor="middle">Edges de especialista</text>
<text x="627" y="52" font-family="'DM Sans', sans-serif" font-size="18" font-weight="700" fill="#3a2e1c" text-anchor="middle">15%</text>
<text x="722" y="32" font-family="'DM Sans', sans-serif" font-size="12" font-weight="600" fill="#faf8f5" text-anchor="middle">Replays</text>
<text x="722" y="52" font-family="'DM Sans', sans-serif" font-size="18" font-weight="700" fill="#faf8f5" text-anchor="middle">10%</text>
<g font-family="'DM Sans', sans-serif" font-size="11" fill="#5a6862">
<text x="228" y="90" text-anchor="middle">traces de produção estratificados · refrescados trimestralmente</text>
<text x="513" y="90" text-anchor="middle">jailbreaks · injection</text>
<text x="627" y="90" text-anchor="middle">edges de domínio · cauda longa</text>
<text x="722" y="90" text-anchor="middle">replays de postmortem ↑</text>
</g>
</g>
<g transform="translate(70, 250)">
<text x="0" y="0" font-family="'DM Sans', sans-serif" font-size="14" font-weight="700" fill="#1e3a2b">Cada caso carrega tags de slice — a suíte pontua cada combinação separadamente</text>
<g font-family="'DM Sans', sans-serif" font-size="12" fill="#1e3a2b">
<rect x="0" y="16" width="180" height="32" fill="#eae3d5" stroke="#b8a080" stroke-width="1" rx="2"/>
<text x="10" y="37"><tspan font-weight="700" fill="#2d5a4f">domínio</tspan> · jurídico / med / geral</text>
<rect x="190" y="16" width="180" height="32" fill="#eae3d5" stroke="#b8a080" stroke-width="1" rx="2"/>
<text x="200" y="37"><tspan font-weight="700" fill="#2d5a4f">intenção</tspan> · how-to / fato / recusa</text>
<rect x="380" y="16" width="180" height="32" fill="#eae3d5" stroke="#b8a080" stroke-width="1" rx="2"/>
<text x="390" y="37"><tspan font-weight="700" fill="#2d5a4f">idioma</tspan> · en / de / ja / …</text>
<rect x="570" y="16" width="180" height="32" fill="#eae3d5" stroke="#b8a080" stroke-width="1" rx="2"/>
<text x="580" y="37"><tspan font-weight="700" fill="#2d5a4f">comprimento</tspan> · curto / médio / longo</text>
<rect x="0" y="56" width="180" height="32" fill="#eae3d5" stroke="#b8a080" stroke-width="1" rx="2"/>
<text x="10" y="77"><tspan font-weight="700" fill="#2d5a4f">segmento</tspan> · enterprise / SMB</text>
<rect x="190" y="56" width="180" height="32" fill="#eae3d5" stroke="#b8a080" stroke-width="1" rx="2"/>
<text x="200" y="77"><tspan font-weight="700" fill="#2d5a4f">retrieval</tspan> · grounded / open</text>
<rect x="380" y="56" width="180" height="32" fill="#eae3d5" stroke="#b8a080" stroke-width="1" rx="2"/>
<text x="390" y="77"><tspan font-weight="700" fill="#2d5a4f">tool-use</tspan> · 0 / 1 / multi-step</text>
<rect x="570" y="56" width="180" height="32" fill="#eae3d5" stroke="#b8a080" stroke-width="1" rx="2"/>
<text x="580" y="77"><tspan font-weight="700" fill="#2d5a4f">novidade</tspan> · visto / OOD</text>
</g>
</g>
<g transform="translate(70, 380)">
<path d="M 380 0 L 380 32 M 372 24 L 380 32 L 388 24" stroke="#5a6862" stroke-width="1.5" fill="none"/>
<text x="430" y="20" font-family="'DM Sans', sans-serif" font-size="11" fill="#5a6862" font-style="italic">composição × slices = grade de pontuação</text>
</g>
<g transform="translate(70, 430)">
<rect x="0" y="0" width="760" height="70" fill="#1e3a2b" rx="4"/>
<text x="380" y="30" font-family="'DM Sans', sans-serif" font-size="15" font-weight="700" fill="#faf8f5" text-anchor="middle">Pontuado por slice em cada release — Spearman ρ ≥ 0,7 vs baseline, por slice</text>
<text x="380" y="54" font-family="'DM Sans', sans-serif" font-size="12" fill="#c8d8d0" text-anchor="middle">Qualquer slice que cruzar seu threshold bloqueia o release. Score agregado é apenas informativo.</text>
</g>
</svg>
<figcaption style="text-align: center; font-style: italic; color: #5a6862; font-size: 0.9rem; margin-top: 0.5rem;">O diagrama é estrutural. Eixos de estratificação e thresholds por slice são configurados por produto no manifesto de release da Divinci. Interno — definido em nossos próprios deploys.</figcaption>
</figure>

Duas regras operacionais que aprendemos a impor:

**Reamostragem trimestral.** Distribuições de tráfego de produção mudam mais rápido do que a maioria dos times mede. Re-estratificamos o balde de amostra de produção contra os últimos 90 dias de tráfego a cada trimestre; se algum slice cresceu acima de 5% do tráfego e estava abaixo de 2% do golden dataset, ele é backfilled antes do próximo release sair.

**Todo postmortem adiciona um caso.** Uma regressão que chegou à produção e não foi pega é um caso que faltava no dataset. Adicionamos ao balde de replays em até 48 horas do postmortem e marcamos com o slice que a evidenciou.

## Como você detecta drift antes dos usuários?

Existem quatro tipos distintos de drift, e uma suíte de regressão que só observa o último é uma suíte que perde a maioria das regressões.

| Tipo de drift | O que se move | Sinal de detecção | Ação |
|---|---|---|---|
| **Drift de qualidade** | O score do juiz para um slice fixo | Spearman ρ por slice vs baseline cai | Bloqueia release; diagnostica pela [árvore do post 6](/pt/blog/how-to-diagnose-custom-llm-qa-failures-in-7-steps/) |
| **Drift de cobertura** | Distribuição do tráfego de produção vs distribuição do golden dataset | KL-divergence entre proporções de slice | Reamostra o golden dataset |
| **Drift do juiz** | Concordância do modelo juiz com humanos | Spearman ρ contra um audit set congelado, rotulado por humanos | Recalibra o prompt do juiz ou substitui o juiz |
| **Drift de produção** | Scores de produção ao vivo vs scores offline no mesmo modelo | Gap entre scores no replay de traces | Investiga retrieval / preprocessamento / runtime |

Drift de qualidade é o que a maioria das suítes mede; os outros três são onde regressões de sexta à tarde geralmente se escondem. A Divinci rastreia os quatro contra o manifesto de baseline, com o breakdown de score por slice exposto em cada PR e um job semanal de calibração do juiz que sinaliza drift antes de acumular.

<figure style="margin: 2rem 0;">
<svg viewBox="0 0 900 420" xmlns="http://www.w3.org/2000/svg" style="width: 100%; max-width: 100%; height: auto;" role="img" aria-label="Um gráfico de 30 dias mostrando o score agregado de conclusão de tarefa estável em 0,87 enquanto o slice de domínio médico cai silenciosamente de 0,88 para 0,74">
<rect width="900" height="420" fill="#faf8f5"/>
<text x="450" y="34" font-family="'DM Sans', -apple-system, sans-serif" font-size="19" font-weight="700" fill="#1e3a2b" text-anchor="middle">O Semver Lie, visualizado — 30 dias de score de conclusão de tarefa</text>
<text x="450" y="56" font-family="'DM Sans', -apple-system, sans-serif" font-size="13" fill="#5a6862" text-anchor="middle">Agregado (verde-escuro) permanece estável. O slice médico (vermelho) regride silenciosamente. Gates agregados nunca disparam.</text>
<g transform="translate(80, 100)">
<line x1="0" y1="0" x2="0" y2="250" stroke="#1e3a2b" stroke-width="1.5"/>
<line x1="0" y1="250" x2="640" y2="250" stroke="#1e3a2b" stroke-width="1.5"/>
<g font-family="'DM Sans', sans-serif" font-size="11" fill="#5a6862">
<text x="-10" y="4" text-anchor="end">0,95</text><line x1="-4" y1="0" x2="0" y2="0" stroke="#1e3a2b"/>
<text x="-10" y="54" text-anchor="end">0,90</text><line x1="-4" y1="50" x2="0" y2="50" stroke="#1e3a2b"/>
<text x="-10" y="104" text-anchor="end">0,85</text><line x1="-4" y1="100" x2="0" y2="100" stroke="#1e3a2b"/>
<text x="-10" y="154" text-anchor="end">0,80</text><line x1="-4" y1="150" x2="0" y2="150" stroke="#1e3a2b"/>
<text x="-10" y="204" text-anchor="end">0,75</text><line x1="-4" y1="200" x2="0" y2="200" stroke="#1e3a2b"/>
<text x="-10" y="254" text-anchor="end">0,70</text>
</g>
<g font-family="'DM Sans', sans-serif" font-size="11" fill="#5a6862">
<text x="0" y="268" text-anchor="middle">d-30</text>
<text x="160" y="268" text-anchor="middle">d-22</text>
<text x="320" y="268" text-anchor="middle">d-15</text>
<text x="480" y="268" text-anchor="middle">d-7</text>
<text x="640" y="268" text-anchor="middle">hoje</text>
</g>
<line x1="0" y1="60" x2="640" y2="60" stroke="#b8a080" stroke-width="1" stroke-dasharray="4,3" opacity="0.65"/>
<text x="12" y="55" font-family="'DM Sans', sans-serif" font-size="10" font-weight="600" fill="#b8a080">threshold do gate agregado — 0,89</text>
<polyline points="0,40 50,42 100,38 150,40 200,42 250,38 300,40 350,38 400,40 450,42 500,38 550,40 600,42 640,40" fill="none" stroke="#5a7a8f" stroke-width="2"/>
<circle cx="640" cy="40" r="4" fill="#5a7a8f"/>
<polyline points="0,60 50,58 100,62 150,60 200,58 250,60 300,62 350,60 400,58 450,60 500,62 550,60 600,58 640,60" fill="none" stroke="#2d5a4f" stroke-width="3.5"/>
<circle cx="640" cy="60" r="5" fill="#2d5a4f"/>
<polyline points="0,72 50,74 100,70 150,72 200,76 250,72 300,74 350,72 400,70 450,72 500,74 550,72 600,76 640,74" fill="none" stroke="#7a8a4a" stroke-width="2"/>
<circle cx="640" cy="74" r="4" fill="#7a8a4a"/>
<polyline points="0,64 50,68 100,66 150,72 200,80 250,92 300,108 350,128 400,150 450,168 500,184 550,196 600,206 640,214" fill="none" stroke="#a04848" stroke-width="3.5"/>
<circle cx="640" cy="214" r="5" fill="#a04848"/>
<g font-family="'DM Sans', sans-serif" font-size="11">
<rect x="656" y="30" width="120" height="22" fill="#faf8f5" stroke="#5a7a8f" stroke-width="1" rx="2"/>
<text x="664" y="46" font-weight="700" fill="#5a7a8f">slice jurídico</text>
<text x="722" y="46" fill="#5a7a8f">0,910</text>
<rect x="656" y="56" width="120" height="22" fill="#faf8f5" stroke="#2d5a4f" stroke-width="1.5" rx="2"/>
<text x="664" y="72" font-weight="700" fill="#2d5a4f">agregado</text>
<text x="722" y="72" fill="#2d5a4f">0,872</text>
<rect x="656" y="82" width="120" height="22" fill="#faf8f5" stroke="#7a8a4a" stroke-width="1" rx="2"/>
<text x="664" y="98" font-weight="700" fill="#7a8a4a">geral</text>
<text x="722" y="98" fill="#7a8a4a">0,863</text>
<rect x="656" y="200" width="148" height="38" fill="#faf8f5" stroke="#a04848" stroke-width="1.5" rx="2"/>
<text x="664" y="216" font-weight="700" fill="#a04848">slice médico</text>
<text x="664" y="232" fill="#a04848">0,743 hoje · violação ⚠</text>
</g>
<g font-family="'DM Sans', sans-serif" font-size="10" fill="#a04848">
<line x1="320" y1="200" x2="320" y2="108" stroke="#a04848" stroke-width="1" stroke-dasharray="3,3"/>
<text x="325" y="200" font-style="italic">gate de slice dispararia aqui ↑</text>
</g>
</g>
</svg>
<figcaption style="text-align: center; font-style: italic; color: #5a6862; font-size: 0.9rem; margin-top: 0.5rem;">Reconstrução estilizada do padrão do postmortem do Tianpan Sigma<sup><a href="#ref-1">[1]</a></sup> usando a nomenclatura interna de slices da Divinci. Os valores específicos são ilustrativos.</figcaption>
</figure>

## Avaliação multi-dimensional — pontue quatro coisas ao mesmo tempo, por slice

Um único score composto é um sinal pior do que quatro scores escalares. Fazemos o gate em quatro dimensões:

- **Conclusão da tarefa** — a resposta efetivamente respondeu a pergunta, pontuada por um juiz calibrado contra uma rubrica. Consciente de slice.
- **Fidelidade** — para qualquer resposta que referenciou contexto recuperado, cada afirmação está embasada nesse contexto. Alucinação aparece aqui primeiro.
- **Segurança** — corretude na recusa, resistência a jailbreak, exposição de PII / política. Quase sempre tem gate em taxa de aprovação ≥ 0,99; segurança é parede dura, não trade-off suave.
- **Budget de latência** — p95 dentro do SLA do slice. Uma mudança de prompt que dobrou tokens-por-resposta é uma regressão mesmo se a qualidade subiu.

Cada dimensão tem seu próprio baseline por slice e seu próprio threshold por slice. Nunca combinamos elas em um único escalar ponderado na hora do gate; expomos como quatro scores por slice e bloqueamos no que se moveu primeiro além do seu threshold. Um modelo que ganhou 4 pontos de conclusão de tarefa ao custo de 1 ponto de fidelidade no slice médico ainda é uma regressão.

## Quais gates devem bloquear o deploy de um LLM customizado?

Rodamos uma arquitetura de três camadas, cada camada fazendo gate de um estágio diferente do pipeline ([veja o post 1 para a taxonomia de estágios](/pt/blog/how-to-build-an-llm-ci-cd-pipeline-with-divinci-ai/)).

**Camada 1 — Smoke (a cada commit, ~90 segundos).** Vinte a trinta casos críticos sacados dos slices de maior impacto. Pega regressões catastróficas antes que a suíte completa gaste compute. Se o smoke falha, o resto não roda.

**Camada 2 — Suíte completa (a cada PR, ~12 minutos).** O golden dataset completo, pontuado por slice em todas as quatro dimensões. Spearman ρ por slice contra o manifesto de baseline. Quebra de threshold bloqueia o merge. O comentário do PR lista exatamente qual slice em qual dimensão se moveu e por quanto, com cinco casos de falha de exemplo.

**Camada 3 — Comparação contra baseline (release candidates, ~25 minutos).** O modelo candidato é re-executado contra os últimos 14 dias de traces de produção — o *replay de traces de produção em loop fechado* que entregamos no [post 1](/pt/blog/how-to-build-an-llm-ci-cd-pipeline-with-divinci-ai/). O mesmo juiz calibrado que pontua o golden dataset também pontua as saídas do replay. Qualquer slice cujos scores de replay divirjam dos scores offline por mais do que seu threshold bloqueia o release. Esta camada é o que pega drift que o golden dataset ainda não conhece.

<figure style="margin: 2rem 0;">
<svg viewBox="0 0 900 380" xmlns="http://www.w3.org/2000/svg" style="width: 100%; max-width: 100%; height: auto;" role="img" aria-label="Árvore de decisão de três camadas de gate: smoke tests em cada commit, suíte completa em cada PR, replay de traces de produção em release candidates">
<rect width="900" height="380" fill="#faf8f5"/>
<text x="450" y="32" font-family="'DM Sans', -apple-system, sans-serif" font-size="19" font-weight="700" fill="#1e3a2b" text-anchor="middle">Gate de regressão em três camadas — cada bloco falha rápido, cada camada adiciona profundidade</text>
<g transform="translate(40, 70)">
<rect x="0" y="0" width="240" height="240" fill="#eae3d5" stroke="#b8a080" stroke-width="2" rx="6"/>
<rect x="0" y="0" width="240" height="38" fill="#7a8a4a" rx="6"/>
<text x="120" y="25" font-family="'DM Sans', sans-serif" font-size="14" font-weight="700" fill="#faf8f5" text-anchor="middle">① Smoke · cada commit</text>
<g font-family="'DM Sans', sans-serif" font-size="12" fill="#1e3a2b">
<text x="14" y="62">Casos: 20–30 críticos</text>
<text x="14" y="82">Wall-clock: ~90 s</text>
<text x="14" y="102">Dims: tarefa + segurança</text>
<text x="14" y="122">Slices: top 3 por volume</text>
<text x="14" y="148" font-weight="600">Bloqueia:</text>
<text x="14" y="168">falhas catastróficas</text>
<text x="14" y="186">outputs malformados</text>
<text x="14" y="204">violações de parede de segurança</text>
<text x="14" y="226" font-style="italic" fill="#5a6862">fail-fast — suíte completa</text>
<text x="14" y="226" font-style="italic" fill="#5a6862" dx="0" dy="0"></text>
</g>
</g>
<g transform="translate(330, 70)">
<rect x="0" y="0" width="240" height="240" fill="#eae3d5" stroke="#b8a080" stroke-width="2" rx="6"/>
<rect x="0" y="0" width="240" height="38" fill="#5a7a8f" rx="6"/>
<text x="120" y="25" font-family="'DM Sans', sans-serif" font-size="14" font-weight="700" fill="#faf8f5" text-anchor="middle">② Suíte completa · cada PR</text>
<g font-family="'DM Sans', sans-serif" font-size="12" fill="#1e3a2b">
<text x="14" y="62">Casos: completos ~500</text>
<text x="14" y="82">Wall-clock: ~12 min</text>
<text x="14" y="102">Dims: tarefa / fid / seg / lat</text>
<text x="14" y="122">Slices: todos estratificados</text>
<text x="14" y="148" font-weight="600">Bloqueia:</text>
<text x="14" y="168">ρ por slice &lt; 0,7</text>
<text x="14" y="188">qualquer métrica de slice abaixo do thr</text>
<text x="14" y="208">concordância do juiz &lt; 0,65</text>
<text x="14" y="230" font-style="italic" fill="#5a6862">comentário do PR lista quais</text>
</g>
</g>
<g transform="translate(620, 70)">
<rect x="0" y="0" width="240" height="240" fill="#eae3d5" stroke="#b8a080" stroke-width="2" rx="6"/>
<rect x="0" y="0" width="240" height="38" fill="#2d5a4f" rx="6"/>
<text x="120" y="25" font-family="'DM Sans', sans-serif" font-size="14" font-weight="700" fill="#faf8f5" text-anchor="middle">③ Replay · release candidates</text>
<g font-family="'DM Sans', sans-serif" font-size="12" fill="#1e3a2b">
<text x="14" y="62">Casos: 14d de traces ao vivo</text>
<text x="14" y="82">Wall-clock: ~25 min</text>
<text x="14" y="102">Dims: todas as quatro · por slice</text>
<text x="14" y="122">Fonte: store de traces de produção</text>
<text x="14" y="148" font-weight="600">Bloqueia:</text>
<text x="14" y="168">gap offline ↔ replay</text>
<text x="14" y="188">drift em slices ainda não no</text>
<text x="14" y="206">golden dataset</text>
<text x="14" y="230" font-style="italic" fill="#5a6862">último gate antes do rollout</text>
</g>
</g>
<g font-family="'DM Sans', sans-serif" fill="#7a8a4a">
<text x="305" y="183" text-anchor="middle" font-size="12" font-weight="700" letter-spacing="1">PASS</text>
<text x="305" y="215" text-anchor="middle" font-size="34" font-weight="700">→</text>
<text x="595" y="183" text-anchor="middle" font-size="12" font-weight="700" letter-spacing="1">PASS</text>
<text x="595" y="215" text-anchor="middle" font-size="34" font-weight="700">→</text>
</g>
<g transform="translate(40, 330)">
<text x="0" y="0" font-family="'DM Sans', sans-serif" font-size="12" fill="#5a6862">Todas as três camadas pontuam contra o mesmo manifesto de baseline — (model_sha, prompt_sha, retrieval_sha, judge_sha) — então um score que se move identifica <tspan font-weight="600" fill="#1e3a2b">qual</tspan> dimensão driftou, não só <tspan font-weight="600" fill="#1e3a2b">que</tspan> algo driftou.</text>
</g>
</svg>
<figcaption style="text-align: center; font-style: italic; color: #5a6862; font-size: 0.9rem; margin-top: 0.5rem;">Números de wall-clock são internos — medidos nos runners de CI de produção da Divinci para um cliente representativo com ~500 casos no golden dataset e ~14 dias de traces de produção.</figcaption>
</figure>

## Calibre seu juiz antes de confiar em um único score que ele produz

LLM-as-judge é o que faz qualquer disso escalar acima de algumas centenas de casos. É também onde uma suíte de regressão silenciosamente para de funcionar, porque o juiz não tem obrigação de permanecer calibrado conforme é atualizado ou conforme sua distribuição de dados se move.

Calibramos cada prompt de juiz contra um audit set congelado, rotulado por humanos, de pelo menos 100 casos estratificados nos mesmos slices do golden dataset, e re-rodamos a calibração semanalmente. A barra que entregamos é **Spearman ρ ≥ 0,7** contra a mediana dos avaliadores humanos, com **Cohen's κ ≥ 0,6** em julgamentos binários de segurança. Os dois estão acima do threshold em que juízes no estilo MT-Bench foram mostrados acompanhando avaliadores humanos no nível de concordância inter-humana<sup><a href="#ref-2">[2]</a></sup>.

Quando a calibração semanal cai abaixo do threshold, o juiz é automaticamente aposentado e o engenheiro de eval de plantão é paginado. O pipeline de release segura candidatos em aberto em vez de fazer gate em um juiz que não está mais medindo o que costumava medir.

```bash
# Roda o job semanal de calibração do juiz
curl -X POST https://api.divinci.ai/v1/regression/judges/calibrate \
  -H "Authorization: Bearer $DIVINCI_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "judge_id":     "rubric-v7",
    "audit_set":    "human-labels-2026-04",
    "min_spearman": 0.70,
    "min_kappa":    0.60,
    "on_fail":      "retire_judge_and_page"
  }'
```

## O diferencial da Divinci — replay de traces de produção em loop fechado

O gate da Camada 3 é a parte que a maioria das suítes de regressão não tem. O fluxo é o mesmo que entregamos no post 1, com uma especialização para teste de regressão: cada release candidate tem seu score no golden dataset offline comparado, slice a slice, ao seu score em uma janela de 14 dias de traces de produção re-executados. O golden dataset mede o que esperávamos que o modelo fizesse. O replay mede o que o modelo efetivamente teria feito na semana passada.

Quando esses dois scores divergem por mais do que o budget de gap por slice, o release é bloqueado. A divergência é o sinal: ou o golden dataset não é mais representativo (drift de cobertura), ou o candidato se comporta de forma diferente em traces moldados por preprocessamento e retrieval de produção (drift de produção). De qualquer forma, você descobre antes dos usuários.

O juiz que pontua a execução offline é o mesmo juiz que pontua a execução de replay. O audit log registra ambos os conjuntos de scores, ambas as versões do juiz, os IDs de trace que foram re-executados e o gap que disparou o bloqueio. O próprio gap é o sinal diagnóstico mais útil que temos, e é o que é entregue a quem pega a [árvore diagnóstica do post 6](/pt/blog/how-to-diagnose-custom-llm-qa-failures-in-7-steps/) em seguida.

## Ancore o golden dataset com um vIndex receipt

Cada score na suíte é sem sentido se você não consegue reproduzi-lo depois. Fazemos hash do golden dataset em cada release e encadeamos esse hash em um vIndex receipt junto com o SHA do modelo, SHA do prompt, SHA do juiz e o registro de calibração. O receipt é externamente ancorável — auditores podem re-executar nossa execução exata de regressão seis meses depois e verificar os scores que afirmamos.

```json
{
  "release_id": "rel_3f1a-2026-05-26",
  "model": { "sha": "0c1f9…", "weights_uri": "r2://models/custom-v7.2", "open_weights": true },
  "prompt": { "sha": "c4a8e…", "template_id": "support-v3.4" },
  "retrieval": { "index_sha": "b21f0…", "embedder": "e5-mistral-7b-instruct" },
  "judge": { "sha": "d8e21…", "rubric_id": "rubric-v7", "spearman_vs_humans": 0.74 },
  "dataset": { "sha": "a90b1…", "n": 512, "slices": 17, "stratified_at": "2026-04-30" },
  "scores": { "aggregate": 0.872, "by_slice": { "/* … */": "/* per-slice scalars */" } },
  "replay": { "trace_window_days": 14, "n_traces": 8430, "max_gap": 0.018 },
  "vindex_anchor": "sha256:f0bfd2…",
  "verifiable_at": "https://vIndex.divinci.ai/rel_3f1a-2026-05-26"
}
```

**Ressalva sobre open-weights.** O receipt acima carrega proveniência de pesos apenas quando o modelo é open-weights — o vIndex ancora os bytes reais dos pesos. Para backings de modelo de API fechada (modelos gerenciados da OpenAI / Anthropic / Google), o receipt ainda carrega a cadeia de decisão — cada score de gate, cada resultado do juiz, o registro de calibração — mas o campo de pesos fica vazio, e você não pode verificar o artefato do modelo independentemente. Dizemos isso no receipt e na [documentação de compliance](/pt/compliance/) para que auditores não fiquem com uma impressão falsa. Os releases que mais se beneficiam de uma cadeia vIndex completa são aqueles em que você controla os pesos.

## Um cronograma de implementação em quatro fases que efetivamente entregamos

Times que tentam entregar a arquitetura completa na semana um travam em ferramental. A ordem abaixo é a ordem que funciona.

**Fase 1 — Baseline (semana 1).** Pegue uma amostra estratificada dos últimos 30 dias de traces de produção. Faça dois engenheiros rotularem manualmente a conclusão de tarefa em 100 casos cada. Calcule a concordância inter-avaliadores (meta Cohen's κ ≥ 0,6). O número que você obtiver é seu baseline humano inicial; todo o resto é calibrado contra isso.

**Fase 2 — Harness (semanas 2–3).** Suba o harness de avaliação no dataset de 100 casos. Adicione um juiz calibrado contra seus labels humanos. Verifique se o harness reproduz os scores humanos dentro de ρ ≥ 0,7. A maioria dos times descobre que seu primeiro prompt de juiz falha nisso e o reescreve duas vezes — isso é normal.

**Fase 3 — Gates (semanas 3–4).** Conecte o harness no CI como aviso, não como bloqueio. Observe por duas semanas. Os thresholds que você descobre observando taxas de falso positivo são os únicos thresholds que sobrevivem. Promova para bloqueio só quando a taxa de falso positivo estiver abaixo de 5%.

**Fase 4 — Loop de replay (contínuo).** Uma vez que os gates estejam bloqueando confiavelmente, habilite a camada de replay de traces de produção. É onde o gap de cobertura de slice aparece, e onde cada postmortem começa a adicionar casos de volta ao golden dataset.

## O que isso não resolve

Três limitações honestas, do mesmo jeito que enquadramos a cada post desta série.

1. **Drift de suíte é trabalho sem fim.** Teste de regressão é infraestrutura, não projeto. O golden dataset precisa ser re-estratificado a cada trimestre, o juiz recalibrado toda semana, os budgets de threshold re-ajustados a cada postmortem. Não existe versão disso onde você entrega uma suíte e vai embora.
2. **Um juiz perfeitamente calibrado ainda é um modelo.** Spearman ρ = 0,74 contra avaliadores humanos significa que aproximadamente um quarto das chamadas do juiz discordam da mediana humana. Essa discordância residual é o piso de ruído em cada score. Expomos isso explicitamente em cada relatório de release; times que esquecem que ela está lá vão ser surpreendidos por ela eventualmente.
3. **Backings de API fechada limitam quanto você pode verificar.** Com um modelo de API fechada, a suíte de regressão mede comportamento mas não pode verificar proveniência de pesos. Se você precisa de reprodutibilidade completa — indústrias reguladas, deploys auditados — o trade-off é na escolha do modelo, não na suíte.

## Próximo

O post 8, o último desta série, fecha o loop por dentro do CI. Enquanto este post e o post 5 foram sobre o que roda nos gates, o próximo é sobre a camada de CI que produz os candidatos que os gates pontuam em primeiro lugar — avaliação pre-merge, contract tests para templates de prompt, e como dimensionar a frota de CI para uma suíte de eval de 12 minutos sem quebrar o orçamento. É a camada de engenharia debaixo de tudo sobre o que escrevemos até agora.

## FAQ

**Qual é a diferença entre avaliação de LLM e teste de regressão de LLM?**

Avaliação mede se um modelo atinge uma barra de qualidade em um ponto no tempo, contra uma rubrica absoluta. Teste de regressão mede se um candidato se comporta da mesma forma que um baseline congelado, por slice, através de múltiplas dimensões. O baseline é o que faz dele teste de regressão — a Divinci entrega ambos, e o modo de regressão pinpoints (model_sha, prompt_sha, judge_sha, dataset_sha) de forma que um score que se moveu identifica qual input se moveu.

**Quantos casos um golden dataset deve ter?**

Menos do que você imagina, estratificado melhor do que você imagina. Já entregamos cobertura útil de regressão com 200 casos em cinco slices bem definidos e vimos datasets de 5.000 casos que perderam tudo que importava porque não eram estratificados. Comece com 200, estratificado, depois cresça o balde de replay caso-a-caso a partir de postmortems.

**Devo usar revisores humanos ou LLM-as-judge?**

Os dois, com humanos calibrando o juiz. Humanos não dão conta do volume que um gate de CI de release-cycle precisa pontuar. O juiz preenche o volume, os humanos calibram o juiz — medido semanalmente com Spearman ρ ≥ 0,7. Qualquer um sozinho é modo de falha.

**Como testar saídas não-determinísticas?**

Pontue a distribuição, não a string. Pontue com uma rubrica que o juiz consegue aplicar através de fraseados, e rode cada input três a cinco vezes em temperatura > 0 para que o score por slice seja sobre uma distribuição de completions em vez de uma amostra única. Aperte a temperatura apenas para casos que genuinamente precisam de saída determinística (tool calls de structured-output, classificação).

**Quais métricas eu devo priorizar no primeiro gate de qualidade no CI?**

Conclusão de tarefa e um gate de segurança. Ambos por slice. Adicionar mais dimensões antes que as duas primeiras estejam calibradas produz ruído; times que entregam mais geralmente acabam fazendo gate no ruído. Adicione fidelidade em seguida quando ligar retrieval; adicione latência quando as duas primeiras estiverem estáveis.

## References

<ol class="post-references" style="padding-left: 1.5rem;">
  <li id="ref-1" style="scroll-margin-top: 90px; margin-bottom: 0.9rem;">
    <strong>Pan, Tianpan.</strong> <a href="https://tianpan.co/blog/2026-04-29-semver-lie-llm-minor-update-breaks-production" target="_blank" rel="noopener">"The Semver Lie: how a minor LLM update broke production."</a> 29 April 2026. The named 2026 failure mode for slice-aware regression analysis; aggregate scores hold flat while a low-volume slice silently regresses.
  </li>
  <li id="ref-2" style="scroll-margin-top: 90px; margin-bottom: 0.9rem;">
    <strong>Zheng et al.</strong> <a href="https://arxiv.org/abs/2306.05685" target="_blank" rel="noopener">"Judging LLM-as-a-Judge with MT-Bench and Chatbot Arena."</a> arXiv:2306.05685. Empirical evidence that strong LLM judges agree with human raters at roughly inter-human-agreement levels (≈ 80%) on open-ended tasks, with reported failure modes that calibrate-against-humans audits are designed to detect.
  </li>
  <li id="ref-3" style="scroll-margin-top: 90px; margin-bottom: 0.9rem;">
    <strong>Kirkpatrick et al.</strong> <a href="https://arxiv.org/abs/1612.00796" target="_blank" rel="noopener">"Overcoming catastrophic forgetting in neural networks."</a> PNAS / arXiv:1612.00796. The foundational result on catastrophic forgetting in fine-tuned neural networks — why a fine-tuned custom LLM has to be regression-tested for general capability loss, not just gain on the target task.
  </li>
  <li id="ref-4" style="scroll-margin-top: 90px; margin-bottom: 0.9rem;">
    <strong>Amazon Web Services.</strong> <a href="https://docs.aws.amazon.com/sagemaker/latest/dg/deployment-guardrails.html" target="_blank" rel="noopener">"SageMaker Deployment Guardrails — blue/green deployments and canary monitoring."</a> The closed-API contrast: gates on infrastructure metrics (latency, errors, CPU) rather than on per-slice semantic quality.
  </li>
  <li id="ref-5" style="scroll-margin-top: 90px; margin-bottom: 0.9rem;">
    <strong>Spearman, C.</strong> "The proof and measurement of association between two things." <em>American Journal of Psychology</em>, 15(1):72–101, 1904. The rank-correlation coefficient that anchors the slice-aware gate — robust to scoring-scale drift in the judge, which is the property we needed.
  </li>
  <li id="ref-6" style="scroll-margin-top: 90px; margin-bottom: 0.9rem;">
    <strong>DORA / Google Cloud.</strong> <a href="https://cloud.google.com/devops/state-of-devops" target="_blank" rel="noopener">"Accelerate State of DevOps — change-failure-rate and time-to-restore-service metrics."</a> The cross-industry baseline for "how often deploys cause incidents" and "how fast you recover." Regression suites that block at the gate move the first metric down; instant rollback ([post 5](/pt/blog/automated-llm-ci-cd-pipelines-with-instant-rollback/)) moves the second.
  </li>
</ol>
