+++
title = "Como Construir um Pipeline CI/CD para LLM com a Divinci AI"
description = "Pipeline LLM em quatro estágios: gates Spearman por slice, canário sobre qualidade de saída, rollback atômico em 12s, recibo de compliance por decisão."
date = 2026-05-26T09:00:00+00:00
template = "blog-post.html"

[taxonomies]
categories = ["Product"]
tags = ["CI/CD", "Release Management", "LLM Ops", "Canary", "Rollback", "Evaluation Gates"]

[extra]
author = "Mike Mooring"
author_avatar = "images/Michael-Mooring.png"
hero_video = "https://pub-fb3e683317b24cf8b4260121edae02be.r2.dev/how-to-build-an-llm-ci-cd-pipeline-with-divinci-ai-veo31.webm"
hero_video_poster = "/images/how-to-build-an-llm-ci-cd-pipeline-with-divinci-ai-hero-poster.webp"
reading_time = 10
summary = "Um pipeline tradicional de CI/CD assume que o artefato é determinístico. Um modelo de linguagem não é. Este post percorre o pipeline que enviamos na Divinci AI — gates Spearman por slice contra um juiz ancorado em avaliação humana, canário que observa qualidade de saída (não só p95), rollback atômico em aproximadamente doze segundos e um recibo de release encadeado por hash para cada decisão (com uma atestação de pesos vIndex embutida quando o modelo é open-weights). Três desses são coisas que nenhuma outra ferramenta de release de LLM oferece em 2026."
+++

*Notas do Ciclo de Release — Parte I*

---

A primeira vez que tentamos enviar um LLM por um pipeline normal de CI/CD, o build ficou verde, o deploy foi bem-sucedido e o suporte ao cliente começou a abrir tickets em sete minutos.

Nada havia "quebrado". Todos os 4.200 testes de integração passaram. A latência permaneceu inalterada. A taxa de 200 OK se manteve estável. Mas em uma classe específica de pergunta do domínio jurídico, o novo modelo havia silenciosamente começado a se esquivar — recusando-se a se comprometer com uma resposta que a versão anterior havia respondido corretamente. Nenhum teste pegou isso porque ainda não tínhamos escrito um.

Fizemos rollback, e o próprio rollback foi um evento. O artefato do modelo vivia em três lugares, o template de prompt vivia em um quarto, as regras de roteamento viviam em um quinto, e nada sabia sobre nada mais. Levou pouco mais de duas horas para retornar ao estado bom anterior. Os clientes que receberam uma resposta evasiva durante essa janela não ficaram impressionados.

Aquele outage é a razão pela qual este pipeline existe. O que segue é o pipeline real pelo qual enviamos nossos próprios releases, e o que expomos através da API da Divinci para clientes que enviam os deles. Ele tem quatro estágios — **registrar, gatear, rolar, observar** — e cada passo tem um caminho de rollback que não depende de um ser humano estar acordado.

## Os quatro estágios

<img src="/images/charts/divinci-cicd-pipeline.svg" alt="Diagrama de pipeline CI/CD em quatro estágios para LLMs. Estágio 1 Registrar: artefato do modelo, template de prompt, regras de roteamento e versão do dataset são agrupados em um único manifesto de release assinado. Estágio 2 Gatear: avaliação automática contra a suíte scored-QA, com um gate por categoria baseado em limiar Spearman. Estágio 3 Rolar: rampa de tráfego canário de 5 para 25 para 100 por cento com verificações de saúde em cada passo. Estágio 4 Observar: monitor de drift, monitor de qualidade de saída e auto-rollback ao romper o limiar. Cada estágio emite uma entrada de audit-log assinada com o SHA do release." width="900" height="380" style="width: 100%; max-width: 100%; height: auto; margin: 1.5rem auto; display: block;" loading="lazy">

Os estágios são intencionalmente rígidos. Todo release passa por todos os estágios nesta ordem. Um caminho de "hotfix" que pula a avaliação não existe — tentamos isso uma vez.

### Estágio 1 — Registrar

Um release **não é** um arquivo de pesos do modelo. Um release é um manifesto imutável que agrupa:

- O artefato do modelo (repo HF + commit SHA, ou um patch vIndex)
- O template de prompt (cada variável, cada mensagem de sistema)
- As regras de roteamento (qual classe de tráfego cai em qual versão)
- A versão do dataset usada para computar os limiares do gate
- O SHA do release anterior, para que o rollback seja inequívoco

```bash
curl -X POST https://api.divinci.ai/v1/releases \
  -H "Authorization: Bearer $DIVINCI_API_KEY" \
  -d '{
    "model_ref": "Divinci-AI/gemma-4-e2b@a7c91f",
    "prompt_template_ref": "templates/legal-qa@v14",
    "routing": { "domain": "legal" },
    "dataset_version": "scored-qa-medical-v3",
    "previous_release": "rel_8f72b1"
  }'
# → { "release_id": "rel_a01c66", "manifest_sha256": "9abaeaf6..." }
```

O SHA do manifesto é o único identificador que qualquer um no pipeline jamais usa. Se duas pessoas fizerem deploy do que acham ser o mesmo release e os SHAs divergirem, o pipeline rejeita o deploy. Já capturamos dois bugs com essa regra.

### Estágio 2 — Gatear

O gate é a parte que a maioria dos pipelines de CI faz errado. Heurísticas estilo Lighthouse — perplexidade, BLEU, ROUGE — vão deixar passar uma regressão se a regressão estiver concentrada em um domínio. Pontuações agregadas a diluem.

O gate da Divinci roda a suíte scored-QA com a qual o manifesto de release foi registrado e aplica um limiar Spearman **por categoria**:

<img src="/images/charts/divinci-cicd-gate-thresholds.svg" alt="Gráfico de barras mostrando a correlação de rank de Spearman por categoria entre o modelo candidato e o avaliador calibrado ancorado em humano, em seis subdomínios jurídicos. Redação de contratos em 0,71, interpretação estatutária em 0,74, sumarização de casos em 0,69, compliance regulatório em 0,66, análise jurisdicional em 0,62 e licenciamento de PI em 0,41. A linha tracejada do limiar do gate está em 0,65. Licenciamento de PI cai abaixo da linha, disparando uma falha de Gate-2. A média agregada entre as seis categorias é 0,64, um pouco abaixo do limiar, mas a visão por categoria mostra exatamente qual subdomínio regrediu." width="900" height="420" style="width: 100%; max-width: 100%; height: auto; margin: 1.5rem auto; display: block;" loading="lazy">

O release no gráfico acima passaria em um gate agregado (média de 0,64 é "perto o suficiente"). Ele falha no gate da Divinci porque licenciamento de PI despenca de 0,68 para 0,41 — exatamente o tipo de regressão localizada que um notebook nunca pega.

<aside style="background: rgba(184, 160, 128, 0.08); border-left: 3px solid #b8a080; padding: 0.7rem 1rem; margin: 0.8rem 0 1.5rem; font-size: 0.88rem; color: #4a4030;">
  <strong style="color: #1e3a2b;">Sobre os números do gráfico:</strong> os valores por subdomínio são <em>ilustrativos do formato</em>, não medições de um estudo publicado. Nenhum artigo público reporta ρ de Spearman juiz-vs-humano detalhado por essas áreas específicas da prática jurídica. Para adjacência aproximada, veja <a href="https://arxiv.org/abs/2308.11462" target="_blank" rel="noopener">LegalBench (Guha et al., 2023)</a> — acurácia por tarefa em seis tipos de raciocínio jurídico — e <a href="https://arxiv.org/abs/2306.05685" target="_blank" rel="noopener">MT-Bench (Zheng et al., 2023)</a>, que reporta ~80% de concordância geral GPT-4-vs-humano com ampla variância por categoria. Clientes rodando sua própria suíte scored-QA produzem números reais para seus próprios slices; o formato do gráfico é o que a API mostraria.
</aside>

Não inventamos gating por slice por diversão. É o modo de falha diretamente nomeado na atual safra de postmortems de LLM. O texto de Tianpan *"The Semver Lie"*<sup><a href="#ref-6">[6]</a></sup> descreve uma mudança de prompt que "passou no code review, foi deployada sem eval gates, chegou à produção sem A/B por usuário e não disparou rollback automático". O que tornou aquele incidente catastrófico em vez de meramente irritante foi que a regressão estava concentrada em um slice — uma única classe de jornada de usuário — enquanto o agregado se mantinha. Toda ferramenta de release de LLM que pesquisamos em 2026 ou gateia em uma única pontuação global, ou não gateia. Nenhuma delas fatia o gate.

Uma falha de gate **não é** um aviso leve. O release_id é marcado como `gate_fail`, o manifesto é arquivado, e nenhum comando de deploy o aceitará. Releases de cold-start — um modelo novinho em folha sem Spearman histórico para comparar — passam por um caminho único `--force-gate-override` que requer uma justificativa escrita; a justificativa, o ID do usuário e um `gate_override_sha256` vão direto para a trilha de auditoria. O override existe porque há situações legítimas para ele; a trilha de auditoria existe porque o você-do-futuro precisa ler a justificativa.

### Estágio 3 — Rolar

Um canário na Divinci significa três checkpoints: **5%, 25%, 100%**. Em cada checkpoint, o pipeline segura pelo tempo de espera configurado ou pela contagem de requests configurada, o que for maior. O padrão é 4 minutos / 1.000 requests em 5%, 15 minutos / 10.000 requests em 25%.

Em cada checkpoint, três monitores precisam se manter:

1. **latência p95** dentro de 1,2× do p95 do release anterior
2. **taxa de 5xx** dentro de 1,5× da taxa do release anterior
3. **Monitor de qualidade de saída**: um replay contínuo de traços recentes de produção através do release candidato, pontuado pelo mesmo juiz calibrado que alimentou o Estágio 2

O terceiro é aquele que nenhum outro pipeline de release oferece. SageMaker, KServe, BentoML, Vertex AI — todos eles observam latência e taxa de erro. Nenhum deles pontua as saídas do candidato contra as perguntas *reais* que a produção está fazendo agora. O candidato recebe os mesmos prompts que o release ativo acabou de receber, os roda em um mirror de 5%, e medimos o ρ de Spearman das respostas do candidato contra o avaliador calibrado. A taxa de 5xx pode permanecer limpa enquanto o modelo silenciosamente se esquiva, recusa ou alucina. Já vimos isso acontecer. O monitor de replay de traços é o que pega.

O conjunto de replay é limitado — limitamos a 50 traços recentes por slice por checkpoint para que o custo seja previsível. A avaliação leva cerca de 90 segundos a 5% do tráfego. Mais lento que um canário de porcentagem fixa, mais rápido que esperar um cliente abrir um ticket.

```bash
# O comando roll é fire-and-forget. O pipeline se segura sozinho.
curl -X POST https://api.divinci.ai/v1/releases/rel_a01c66/roll \
  -H "Authorization: Bearer $DIVINCI_API_KEY" \
  -d '{ "strategy": "canary", "dwell_5pct_seconds": 240, "dwell_25pct_seconds": 900 }'
# → { "rollout_id": "rol_b3e2", "next_checkpoint_at": "2026-05-26T09:04:00Z" }
```

### Estágio 4 — Observar, fazer rollback e o recibo

Este é o estágio que justifica a existência do pipeline.

O observador roda continuamente após o rollout completar. Ele computa uma pontuação de qualidade de saída por minuto em uma amostra rolante de replay de 5% dos traços. Se a pontuação cair abaixo do limiar de rollback (padrão: 0,85 do limiar do gate, então 0,55 se o gate foi 0,65) por três minutos consecutivos, o rollback dispara automaticamente. Sem pager, sem humano, sem debate.

O rollback em si é uma única instrução: re-apontar o roteamento para `previous_release` do manifesto. Como o release anterior era um manifesto totalmente agrupado, cada componente — pesos, prompt, roteamento, dataset — vira atomicamente.

Então o recibo dispara.

Cada decisão de release — registrar, gate-pass, gate-fail, gate-override, checkpoint-promote, checkpoint-hold, auto-rollback, manual-rollback — emite um **recibo de release**: um artefato JSON-com-SHA-256, encadeado por hash ao recibo anterior para esse cliente e ao recibo anterior para esse release, ancorado externamente em um cronograma que o cliente configura.

Quando o release é respaldado por um modelo **open-weights** — Gemma, Qwen, Llama, Mistral, GPT-OSS, qualquer coisa onde os pesos sejam endereçáveis e editáveis — o recibo embute uma [atestação vIndex](/pt/compliance/): uma prova criptográfica de que os pesos ativos no momento da decisão são os pesos que o manifesto registrou. Esse é o caminho que satisfaz as exigências mais duras de compliance (Artigo 17 do GDPR — direito ao esquecimento, proveniência do EU AI Act) porque você pode provar não apenas *o que foi deployado*, mas *que os pesos subjacentes são o que dizem ser*.

Quando o release é respaldado por um modelo **closed-weights** — OpenAI, Anthropic, Google, qualquer coisa servida apenas via uma API opaca — o recibo ainda cobre a cadeia de decisão (qual manifesto, qual resultado de gate, qual leitura de monitor, qual usuário disparou qual ação), mas não pode atestar os pesos subjacentes, porque não conseguimos vê-los. Isso não é uma limitação do pipeline; é uma limitação do que é verificável quando o provedor não expõe os pesos. Auditores que se importam com essa distinção recebem a resposta verdadeira no próprio recibo.

De qualquer forma, auditores hoje recebem logs. Com este pipeline, eles recebem *provas* de tudo o que é de fato provável. Não vimos mais ninguém no mercado oferecendo isso. Esperamos que outros venham — os prazos do EU AI Act tornam isso eventualmente inevitável. Optamos por oferecer agora.

<figure style="margin: 1.5rem auto; max-width: 100%;">
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 900 380" font-family="'DM Sans', -apple-system, sans-serif" role="img" aria-label="Gráfico de barras horizontal de tempo de rollback, em escala logarítmica de minutos. Outage da Atlassian de abril de 2022: 720 minutos (12 horas) por site para restauração. Outage da Cloudflare de 21 de junho de 2022: 44 minutos para reverter. Limiar DORA de elite para recuperação de deployment falho: menos de 60 minutos. Espera padrão de término de deployment-guardrail canário do AWS SageMaker: 10 minutos. Flip automatizado de roteamento da Divinci via manifesto de release: 12 segundos. Cada label de barra é um link para sua fonte numerada nas referências abaixo." style="width: 100%; height: auto; display: block;">
  <title>Tempo de rollback — números medidos de fontes primárias</title>
  <rect width="900" height="380" fill="#faf8f5"/>
  <text x="40" y="36" font-size="16" font-weight="700" fill="#1e3a2b">Tempo de rollback — números medidos de fontes primárias</text>
  <text x="40" y="56" font-size="12" fill="#6b5d4f">Incidentes específicos e limites documentados de plataforma, não estimativas. Cada barra liga à sua fonte nas referências abaixo.</text>
  <g stroke="#d4c8b0" font-size="10" fill="#8a7d68">
    <line x1="280" y1="320" x2="280" y2="80" stroke="#2d3c34" stroke-width="1.2"/>
    <line x1="280" y1="320" x2="860" y2="320" stroke="#2d3c34" stroke-width="1.2"/>
    <line x1="280" y1="320" x2="280" y2="325"/><text x="280" y="340" text-anchor="middle">0,1</text>
    <line x1="406" y1="320" x2="406" y2="325"/><text x="406" y="340" text-anchor="middle">1</text>
    <line x1="531" y1="320" x2="531" y2="325"/><text x="531" y="340" text-anchor="middle">10</text>
    <line x1="657" y1="320" x2="657" y2="325"/><text x="657" y="340" text-anchor="middle">100</text>
    <line x1="782" y1="320" x2="782" y2="325"/><text x="782" y="340" text-anchor="middle">1000</text>
    <line x1="406" y1="320" x2="406" y2="83" stroke="#e8dcc4" stroke-width="0.5"/>
    <line x1="531" y1="320" x2="531" y2="83" stroke="#e8dcc4" stroke-width="0.5"/>
    <line x1="657" y1="320" x2="657" y2="83" stroke="#e8dcc4" stroke-width="0.5"/>
    <line x1="782" y1="320" x2="782" y2="83" stroke="#e8dcc4" stroke-width="0.5"/>
  </g>
  <text x="570" y="360" font-size="11" fill="#6b5d4f" text-anchor="middle">minutos (escala logarítmica)</text>
  <g>
    <text x="272" y="103" text-anchor="end" font-size="11" fill="#1e3a2b" font-weight="600">Atlassian, abr 2022</text>
    <text x="272" y="117" text-anchor="end" font-size="10" fill="#6b5d4f">restauração por site</text>
    <rect x="280" y="91" width="484" height="32" fill="#a04848" rx="2"/>
    <text x="774" y="113" font-size="11" font-weight="600" fill="#1e3a2b">720 min<a href="#ref-1"><tspan font-size="9" fill="#2d5a4f" text-decoration="underline" baseline-shift="super">[1]</tspan></a></text>
  </g>
  <g>
    <text x="272" y="158" text-anchor="end" font-size="11" fill="#1e3a2b" font-weight="600">Cloudflare, jun 2022</text>
    <text x="272" y="172" text-anchor="end" font-size="10" fill="#6b5d4f">reversão de config</text>
    <rect x="280" y="146" width="332" height="32" fill="#c87b3c" rx="2"/>
    <text x="622" y="168" font-size="11" font-weight="600" fill="#1e3a2b">44 min<a href="#ref-2"><tspan font-size="9" fill="#2d5a4f" text-decoration="underline" baseline-shift="super">[2]</tspan></a></text>
  </g>
  <g>
    <text x="272" y="213" text-anchor="end" font-size="11" fill="#1e3a2b" font-weight="600">DORA elite</text>
    <text x="272" y="227" text-anchor="end" font-size="10" fill="#6b5d4f">limiar de performance</text>
    <rect x="280" y="201" width="349" height="32" fill="#b8a080" rx="2" opacity="0.6"/>
    <text x="639" y="223" font-size="11" font-weight="600" fill="#1e3a2b">&lt; 60 min<a href="#ref-3"><tspan font-size="9" fill="#2d5a4f" text-decoration="underline" baseline-shift="super">[3]</tspan></a></text>
  </g>
  <g>
    <text x="272" y="268" text-anchor="end" font-size="11" fill="#1e3a2b" font-weight="600">AWS SageMaker</text>
    <text x="272" y="282" text-anchor="end" font-size="10" fill="#6b5d4f">espera padrão de término</text>
    <rect x="280" y="256" width="251" height="32" fill="#7a9580" rx="2"/>
    <text x="541" y="278" font-size="11" font-weight="600" fill="#1e3a2b">10 min<a href="#ref-4"><tspan font-size="9" fill="#2d5a4f" text-decoration="underline" baseline-shift="super">[4]</tspan></a></text>
  </g>
  <g>
    <text x="272" y="320" text-anchor="end" font-size="11" fill="#1e3a2b" font-weight="700">Divinci automatizado</text>
    <text x="272" y="334" text-anchor="end" font-size="10" fill="#2d5a4f">flip de roteamento via manifesto</text>
    <line x1="280" y1="328" x2="318" y2="328" stroke="#2d5a4f" stroke-width="14" stroke-linecap="butt"/>
    <text x="328" y="332" font-size="11" font-weight="700" fill="#2d5a4f">12 s<a href="#ref-5"><tspan font-size="9" fill="#2d5a4f" text-decoration="underline" baseline-shift="super">[5]</tspan></a></text>
  </g>
</svg>
</figure>

Estes não são nossos números — são números publicados de fontes primárias de postmortems reais, documentação de plataformas e do framework DORA. O contraste é o que motiva o design da Divinci. O outage da Atlassian de abril de 2022<sup><a href="#ref-1">[1]</a></sup> levou doze horas por site porque o estado estava espalhado por múltiplos sistemas que precisavam ser coordenados de volta em acordo. O outage da Cloudflare de junho de 2022<sup><a href="#ref-2">[2]</a></sup> levou quarenta e quatro minutos para reverter porque, nas próprias palavras deles, engenheiros pisavam nas reversões uns dos outros. Os guardrails de deployment canário do AWS SageMaker<sup><a href="#ref-4">[4]</a></sup> documentam uma espera padrão de dez minutos para término antes que o rollback complete totalmente. O limiar de elite DORA<sup><a href="#ref-3">[3]</a></sup> para recuperação de deployment falho é "menos de uma hora" — essa é a barra que uma organização de alta performance deve superar, não o teto.

Doze segundos também não é um número mágico. É o tempo necessário para a camada de roteamento drenar requests em voo, trocar o manifesto ativo e confirmar o novo estado entre regiões. A parte lenta é a drenagem em voo. Não há caminho mais rápido que não derrube respostas no meio da geração.

## O que isto é, que outras ferramentas de release de LLM não são

Pesquisamos doze outras ferramentas em 2026 antes de construir esta — LangSmith Deployment, W&B Models, MLflow, SageMaker Deployment Guardrails, Vertex AI Endpoints, Seldon Core, BentoCloud, KServe, Humanloop, Braintrust, Patronus AI, Arize Phoenix. Elas se agrupam em dois campos que não chegam a se encontrar.

O **campo eval-CI** — Braintrust, Humanloop, Patronus — gateia merges de PR com pontuações de eval offline. Eles nunca tocam o serviço em execução. Quando o modelo está em produção e a qualidade cai, eles alertam; alguém mais tem que fazer rollback.

O **campo serving-canary** — SageMaker Deployment Guardrails, KServe, Vertex AI, BentoCloud, Seldon Core — divide tráfego e faz auto-rollback. Mas cada um deles dispara em métricas de infraestrutura: latência p99, taxa de erro, alarmes CloudWatch. Nenhum deles faz auto-rollback em uma regressão de qualidade. Não podem, porque não têm um juiz rodando na saída de produção.

A costura entre "passou na eval no merge do PR" e "canário ao vivo pontuado nas jornadas de usuário com as quais realmente nos importamos" é uma transição manual que toda equipe atualmente tem que cruzar sozinha. O post de blog menciona isso como o modo dominante de falha em 2026<sup><a href="#ref-6">[6]</a></sup>. Nós fechamos essa costura. Especificamente:

1. **O gate é fatiado.** ρ de Spearman por domínio contra um avaliador ancorado em humano, não uma única pontuação global. A cegueira a slices é o que todo outro gate tem.
2. **O canário observa qualidade de saída, não só p95.** Replay contínuo de traços através do candidato, pontuado pelo mesmo juiz que alimentou o gate. Esta é a costura faltante.
3. **Cada decisão emite um recibo de release.** Encadeado por hash, externamente ancorável, no formato JSON-com-SHA-256 que respalda nossas páginas de compliance. Para modelos open-weights — Gemma, Qwen, Llama, Mistral, GPT-OSS — o recibo embute uma atestação de pesos vIndex para que auditores possam provar quais eram de fato os pesos vivos. Para backings de APIs fechadas, o recibo cobre a cadeia de decisão, mas não reivindica proveniência de pesos, porque o provedor não expõe os pesos. De qualquer forma, auditores recebem provas do que é de fato provável, não apenas logs.

É isso. Canário genérico, registro de versão, rollback por métrica de infra — isso é commodity. Não escrevemos um canário genérico.

## O que isto não resolve

Três limitações honestas:

**O gate é tão bom quanto o dataset.** Uma suíte scored-QA que não cobre o domínio que o cliente realmente usa não vai pegar regressões nesse domínio. Vimos isso duas vezes. Nas duas vezes, o primeiro movimento do cliente foi enviar uma nova suíte scored-QA, não trocar o modelo. Esse é o movimento correto.

**O rollback assume que o release anterior era bom.** Se uma regressão está viva por três releases e ninguém percebeu, fazer rollback de um release apenas te compra um modelo um pouco menos ruim. A trilha de auditoria ajuda aqui — você pode fazer rollback para qualquer manifesto anterior por SHA, não apenas N-1.

**Releases de cold-start contornam o canário.** Um modelo novinho em folha sem tráfego de produção para comparar não pode ser canariado de forma significativa. Forçamos um shadow deployment de 24 horas em vez disso, que observa saídas sem servi-las. É mais lento e menos conveniente. É também a única resposta honesta.

## A menor versão disto que você pode rodar

Se você quer montar algo assim sem usar a Divinci, a versão mínima viável é aproximadamente:

1. Um registro que armazena modelo + prompt + roteamento + dataset como um único artefato imutável, endereçado por hash de conteúdo
2. Um juiz calibrado contra um painel ancorado em humano via ρ de Spearman — e uma decisão de gate que consulta pontuações *por slice*, não apenas o agregado
3. Um divisor de tráfego que segura em checkpoints e consulta um monitor de qualidade com limite de frescor — onde o monitor *faz replay de traços recentes de produção* através do candidato, não apenas amostra sintéticos
4. Uma camada de roteamento cujo estado possa ser trocado atomicamente — incluindo o template de prompt, não apenas os pesos
5. Um audit log que emite um recibo encadeado por hash, externamente ancorável, para cada decisão de release — mais um embed de atestação de pesos quando o modelo é open-weights, já que releases de API fechada fisicamente não podem ser atestados no nível dos pesos

A maioria das equipes já tem (1) e (3). As partes dolorosas são (2), (4) e (5). A razão pela qual a Divinci existe é que construímos todas as cinco para nós mesmos primeiro, depois percebemos que todos os outros também iam precisar delas.

Se você quiser pular a construção, [a referência da API está aqui](/pt/api/), e os endpoints de release na seção "Release Management" são a superfície inteira deste pipeline. O lado de compliance — como esses recibos vIndex parecem e como mapeiam para o EU AI Act, Artigo 17 do GDPR, HIPAA e NIST AI RMF — está na [página de compliance](/pt/compliance/). Todo comando neste post é um endpoint real.

## Referências

<ol class="post-references" style="padding-left: 1.5rem;">
  <li id="ref-1" style="scroll-margin-top: 90px; margin-bottom: 0.9rem;">
    <a href="https://www.atlassian.com/blog/atlassian-engineering/post-incident-review-april-2022-outage" target="_blank" rel="noopener">Atlassian — <em>Post-Incident Review: April 2022 Outage</em></a>. Do writeup: "The accelerated Restoration 2 approach took approximately 12 hours to restore a site." A restauração completa de 883 sites de clientes levou 14 dias. O estado espalhado por infraestrutura, backups e validação por site empurra o número por site para horas em vez de minutos.
  </li>
  <li id="ref-2" style="scroll-margin-top: 90px; margin-bottom: 0.9rem;">
    <a href="https://blog.cloudflare.com/cloudflare-outage-on-june-21-2022/" target="_blank" rel="noopener">Cloudflare — <em>Cloudflare outage on June 21, 2022</em></a>. Linha do tempo citada literalmente no post: "06:58: Root cause found and understood. Work begins to revert the problematic change… 07:42: The last of the reverts has been completed." Quarenta e quatro minutos do "sabemos o que reverter" ao "a reversão está feita", em parte porque os engenheiros estavam pisando nas reversões uns dos outros.
  </li>
  <li id="ref-3" style="scroll-margin-top: 90px; margin-bottom: 0.9rem;">
    <a href="https://dora.dev/guides/dora-metrics/" target="_blank" rel="noopener">DORA — <em>Software delivery performance metrics</em></a>. O limiar elite-performer de "failed deployment recovery time" é documentado como menos de uma hora. Low performers medem em semanas-a-meses nos relatórios históricos da DORA.
  </li>
  <li id="ref-4" style="scroll-margin-top: 90px; margin-bottom: 0.9rem;">
    <a href="https://docs.aws.amazon.com/sagemaker/latest/dg/deployment-guardrails-blue-green-canary.html" target="_blank" rel="noopener">AWS SageMaker — <em>Use canary traffic shifting</em></a> e a página acompanhante <a href="https://docs.aws.amazon.com/sagemaker/latest/dg/deployment-guardrails-configuration.html" target="_blank" rel="noopener"><em>Auto-Rollback Configuration and Monitoring</em></a>. O exemplo de <code>TerminationWaitInSeconds</code> é 600 (dez minutos); <code>MaximumExecutionTimeoutInSeconds</code> é limitado a 1800 (trinta minutos). O rollback dispara dentro da janela de baking quando um alarme dispara: "If any of the alarms trip during the baking period, then SageMaker AI initiates a rollback and all traffic returns to the blue fleet."
  </li>
  <li id="ref-5" style="scroll-margin-top: 90px; margin-bottom: 0.9rem;">
    Divinci AI — flip de roteamento atômico via manifesto de release. Doze segundos é o tempo de drenagem em voo em um serviço de ~100 réplicas; a troca do manifesto em si é sub-segundo. O número é do nosso próprio serviço, não de um benchmark; a arquitetura que torna isso possível é o manifesto agrupado descrito acima (Estágio 1 — Registrar).
  </li>
  <li id="ref-6" style="scroll-margin-top: 90px; margin-bottom: 0.9rem;">
    <a href="https://tianpan.co/blog/2026-04-29-semver-lie-llm-minor-update-breaks-production" target="_blank" rel="noopener">Tianpan — <em>The Semver Lie: how an LLM minor update breaks production</em> (April 2026)</a>. O writeup nomeia o padrão de falha diretamente: "passed code review, deployed without eval gates, hit production without per-user A/B, and triggered no automatic rollback." Um post acompanhante — <a href="https://tianpan.co/blog/2026-04-27-llm-postmortem-template-fields-sre-missed" target="_blank" rel="noopener"><em>LLM postmortem template — fields SRE missed</em></a> — enumera os campos de slice / jornada / por-usuário que os postmortems atuais sistematicamente omitem.
  </li>
</ol>

Uma nota sobre o que não está neste gráfico. O tempo de `kubectl rollout undo` do Kubernetes é governado pelas suas configurações de `maxSurge` / `maxUnavailable` e pelo warm-up dos pods, não pelo comando em si, e não conseguimos encontrar uma fonte primária publicando um número medido da forma como as quatro fontes acima fazem — então deixamos de fora em vez de preencher com uma estimativa.

---

*Próximo nesta série:* **10 falhas de release CI/CD que pegamos em LMs customizados, e qual estágio do pipeline pega cada uma.** Três das dez são regressões por slice que um gate agregado teria enviado. Duas a mais são quedas silenciosas de qualidade que um canário por métrica de infra teria promovido. O resto são o tipo de modo de falha que todo pipeline de release deveria pegar — listamos porque vale dizer em voz alta quais um pipeline com gate agregado, de fato, pega por conta própria.
