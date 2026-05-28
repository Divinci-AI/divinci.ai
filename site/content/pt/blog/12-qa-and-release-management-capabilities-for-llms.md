+++
title = "As 12 Capacidades de QA e Gestão de Releases que Toda Plataforma de LLM Customizado Deveria Entregar"
description = "Checklist de capacidades para plataformas de release LLM: gates por slice, juízes calibrados, rollback atômico, recibos hash — o que entrega, o que falta."
date = 2026-05-28T09:00:00+00:00
template = "blog-post.html"

[taxonomies]
categories = ["Product"]
tags = ["LLM Ops", "QA", "Release Management", "Evaluation", "Compliance", "Audit Trail"]

[extra]
author = "Mike Mooring"
author_avatar = "images/Michael-Mooring.png"
hero_video = "https://pub-fb3e683317b24cf8b4260121edae02be.r2.dev/12-qa-and-release-management-capabilities-for-llms-veo31.webm"
hero_video_poster = "/images/12-qa-and-release-management-capabilities-for-llms-hero-poster.webp"
reading_time = 11
summary = "Avaliamos doze plataformas de release de LLM antes de construir a nossa. O mercado se divide em três campos que não se encontram bem — ferramentas de eval-CI, ferramentas de canário de serving e ferramentas de observabilidade — e a costura faltante entre eles é exatamente a que um release voltado ao cliente precisa. Este post é o checklist de capacidades que saiu dessa avaliação: 12 testes específicos que você pode aplicar a qualquer plataforma, inclusive à nossa."
+++

*Notas do Ciclo de Release — Parte III*

---

Há um ano, antes de começarmos a construir nosso próprio pipeline de release, sentamos e listamos toda capacidade séria de QA e gestão de releases que achávamos que uma plataforma de LLM deveria entregar. Em seguida avaliamos doze outras plataformas contra essa lista — LangSmith, MLflow, Weights & Biases, Braintrust, Humanloop, Patronus, Arize, Phoenix, Confident, Deepchecks, SageMaker Deployment Guardrails, KServe, BentoCloud, Vertex AI Endpoints, Seldon Core. Ninguém tinha as doze. As combinações que *eram* entregues se agrupavam em três campos que não se encostavam.

Este post é a lista de capacidades resultante, em formato portátil. Está organizada por qual dos nossos quatro estágios de pipeline cada capacidade habita — **Registrar → Gatear → Liberar → Observar** — para compor de forma limpa com a [arquitetura do pipeline](/pt/blog/how-to-build-an-llm-ci-cd-pipeline-with-divinci-ai/) e os [modos de falha](/pt/blog/10-ci-cd-release-failures-in-custom-language-models/) sobre os quais escrevemos. Se você está avaliando ferramentas, percorra a lista de cima para baixo contra cada candidato; aquelas com as lacunas mais profundas vão te dizer a que campo pertencem.

## Os três campos (para você saber o que está olhando)

Antes do checklist em si, o formato do mercado em 2026:

- **Campo de Eval-CI** — Braintrust, Humanloop, Patronus. Rodam avaliadores automatizados no merge do PR. Bloqueiam merges ruins. Nunca tocam tráfego ao vivo. Fortes nas capacidades 4–6; ausentes nas 7–12.
- **Campo de canário de serving** — SageMaker Deployment Guardrails, KServe, Vertex AI Endpoints, BentoCloud, Seldon Core. Dividem tráfego, monitoram métricas de infraestrutura, fazem auto-rollback em alarmes estilo CloudWatch. Fortes em 1, 7, 9; ausentes no lado de qualidade de 8 e 10–12.
- **Campo de observabilidade** — Arize Phoenix, Confident AI, Deepchecks. Observam produção, alertam humanos, escalam. Fortes em 10 (monitoramento), mas não impõem nada — alertar não é auto-rollback.

A lacuna entre esses campos — entre "passou no CI" e "canário ao vivo pontuado por qualidade, não só por latência" — é a parte que todo mundo tem que costurar à mão. Fechar essa lacuna é a afirmação central deste post.

<figure style="margin: 1.5rem auto; max-width: 760px;">
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 760 490" font-family="'DM Sans', -apple-system, sans-serif" role="img" aria-label="Diagrama de Venn de três campos de plataformas de LLM. Campo de Eval-CI (Braintrust, Humanloop, Patronus) fica à esquerda e cobre avaliação offline no merge do PR. Campo de canário de serving (SageMaker, KServe, Vertex, BentoCloud, Seldon) fica à direita e cobre divisão de tráfego com rollback por métricas de infraestrutura. Campo de observabilidade (Arize, Phoenix, Confident, Deepchecks) fica embaixo e cobre monitoramento e alerta sem imposição. Os três círculos se sobrepõem dois a dois em fatias estreitas, mas a região central onde os três se encontram está vazia. Esse centro vazio é a costura faltante de que trata este post — uma decisão de release dirigida por qualidade por fatia, imposta atomicamente sobre tráfego ao vivo.">
<title>Os três campos e o centro faltante</title>
<rect width="760" height="490" fill="#faf8f5"/>
<text x="380" y="36" text-anchor="middle" font-size="16" font-weight="700" fill="#1e3a2b">Os três campos que não se encontram</text>
<text x="380" y="58" text-anchor="middle" font-size="13" fill="#6b5d4f">Cada campo cobre um pedaço. O centro é onde toda equipe costura à mão.</text>
<circle cx="280" cy="225" r="135" fill="#2d5a4f" fill-opacity="0.18" stroke="#2d5a4f" stroke-width="1.5"/>
<circle cx="480" cy="225" r="135" fill="#c87b3c" fill-opacity="0.18" stroke="#c87b3c" stroke-width="1.5"/>
<circle cx="380" cy="335" r="135" fill="#7a9580" fill-opacity="0.18" stroke="#7a9580" stroke-width="1.5"/>
<text x="195" y="190" text-anchor="middle" font-size="17" font-weight="700" fill="#2d5a4f">Eval-CI</text>
<text x="195" y="214" text-anchor="middle" font-size="13" fill="#6b5d4f">Braintrust, Humanloop,</text>
<text x="195" y="231" text-anchor="middle" font-size="13" fill="#6b5d4f">Patronus</text>
<text x="195" y="259" text-anchor="middle" font-size="13" font-style="italic" fill="#4a4030">gates de eval offline</text>
<text x="195" y="276" text-anchor="middle" font-size="13" font-style="italic" fill="#4a4030">no merge do PR</text>
<text x="565" y="190" text-anchor="middle" font-size="17" font-weight="700" fill="#c87b3c">Canário de serving</text>
<text x="565" y="214" text-anchor="middle" font-size="13" fill="#6b5d4f">SageMaker, KServe,</text>
<text x="565" y="231" text-anchor="middle" font-size="13" fill="#6b5d4f">Vertex, BentoCloud,</text>
<text x="565" y="248" text-anchor="middle" font-size="13" fill="#6b5d4f">Seldon</text>
<text x="565" y="276" text-anchor="middle" font-size="13" font-style="italic" fill="#4a4030">divisão de tráfego +</text>
<text x="565" y="293" text-anchor="middle" font-size="13" font-style="italic" fill="#4a4030">rollback por métrica de infra</text>
<text x="380" y="380" text-anchor="middle" font-size="17" font-weight="700" fill="#7a9580">Observabilidade</text>
<text x="380" y="404" text-anchor="middle" font-size="13" fill="#6b5d4f">Arize, Phoenix, Confident, Deepchecks</text>
<text x="380" y="431" text-anchor="middle" font-size="13" font-style="italic" fill="#4a4030">monitora + alerta (sem imposição)</text>
<circle cx="380" cy="260" r="42" fill="#a04848" fill-opacity="0.9" stroke="#a04848" stroke-width="1"/>
<text x="380" y="256" text-anchor="middle" font-size="14" font-weight="700" fill="#faf8f5">costura</text>
<text x="380" y="272" text-anchor="middle" font-size="14" font-weight="700" fill="#faf8f5">faltante</text>
</svg>
</figure>

<p style="text-align: center; font-size: 0.9rem; color: #a04848; font-style: italic; margin: -0.5rem 0 1.5rem;">A costura faltante: gate de qualidade por fatia → rollback atômico dirigido pela qualidade da saída, não por métricas de infra.</p>

## Estágio ① — Registrar

<div style="display: flex; align-items: stretch; gap: 0; margin: 1rem 0 1.5rem; border-radius: 8px; overflow: hidden; border: 1px solid rgba(184, 160, 128, 0.4);">
  <div style="background: #2d5a4f; color: #faf8f5; padding: 0.75rem 1.25rem; font-size: 1.6rem; font-weight: 700; display: flex; align-items: center; line-height: 1;">①</div>
  <div style="background: rgba(45, 90, 79, 0.08); padding: 0.7rem 1rem; flex: 1; display: flex; align-items: center;">
    <strong style="color: #1e3a2b; letter-spacing: 0.04em;">REGISTRAR</strong>
    <span style="color: #6b5d4f; margin-left: 0.8rem; font-size: 0.92rem;">Camada de manifesto imutável. Atribuição de falha por SHA.</span>
  </div>
</div>

### Capacidade 1. Manifesto de release imutável com SHA endereçável por conteúdo

O que é: um release não é um arquivo de pesos do modelo. Um release é um pacote imutável de *tudo* — artefato do modelo, template de prompt, regras de roteamento, versão do dataset, versão de pré-processamento — endereçado por um único SHA-256. Duas pessoas implantando "o mesmo release" precisam produzir o mesmo SHA, ou o pipeline recusa.

Por que importa: sem isso, "qual mudança quebrou a produção?" é inrespondível quando o estado está espalhado em três sistemas. A queda da Atlassian em abril de 2022<sup><a href="#ref-1">[1]</a></sup> levou doze horas por site para recuperar especificamente porque o estado vivia em sistemas versionados de forma independente que precisavam ser coordenados de volta a um acordo.

Quem entrega: campo de canário de serving parcialmente (modelo + roteamento); registries de modelo (MLflow, W&B Models<sup><a href="#ref-2">[2]</a></sup>) parcialmente (apenas artefato do modelo). Quase ninguém empacota o **template do prompt** no SHA, que é exatamente o campo que mais muda.

### Capacidade 2. Controle de versão atômico em todos os componentes do release

O que é: a troca do release A para o release B muda *tudo* em uma única instrução — pesos e prompt e roteamento e dataset e pré-processamento — não como cinco edições separadas num dashboard.

Por que importa: trocas parciais criam janelas de comportamento indefinido. Se o prompt atualiza mas a regra de roteamento ainda não, toda requisição que bate no novo prompt com a classe de roteamento antiga está num estado que ninguém planejou.

Quem entrega: ninguém integralmente. O campo de canário de serving troca a imagem do modelo atomicamente; o prompt e o roteamento normalmente vivem em outro lugar. A troca dirigida por manifesto é de onde vem a afirmação de rollback atômico do Divinci<sup><a href="#ref-5">[5]</a></sup>.

### Capacidade 3. Paridade de ambiente entre treino e serving

O que é: o pipeline de pré-processamento usado na avaliação do gate é o *mesmo* pré-processamento que o servidor de produção usa. Se divergirem, todo número offline é mentira.

Por que importa: o skew entre treino e serving é uma das [dez falhas de release](/pt/blog/10-ci-cd-release-failures-in-custom-language-models/#3-training-serving-preprocessing-skew) sobre as quais escrevemos. O sintoma é "tem desempenho ótimo no eval, comporta-se como outro modelo em produção." A cura é registrar o pré-processamento no manifesto e gatear contra a versão de pré-processamento de produção.

Quem entrega: frameworks de containerização (BentoML, KServe) ganham crédito parcial por colocar o pré-processamento junto do serving. Nenhum deles amarra o pré-processamento à entrada do gate de eval.

## Estágio ② — Gatear

<div style="display: flex; align-items: stretch; gap: 0; margin: 1rem 0 1.5rem; border-radius: 8px; overflow: hidden; border: 1px solid rgba(184, 160, 128, 0.4);">
  <div style="background: #b8a080; color: #1e3a2b; padding: 0.75rem 1.25rem; font-size: 1.6rem; font-weight: 700; display: flex; align-items: center; line-height: 1;">②</div>
  <div style="background: rgba(184, 160, 128, 0.16); padding: 0.7rem 1rem; flex: 1; display: flex; align-items: center;">
    <strong style="color: #1e3a2b; letter-spacing: 0.04em;">GATEAR</strong>
    <span style="color: #6b5d4f; margin-left: 0.8rem; font-size: 0.92rem;">ρ de Spearman por fatia vs. avaliador ancorado em humanos.</span>
  </div>
</div>

### Capacidade 4. Gate de qualidade por fatia / por domínio

O que é: a decisão do gate consome scores *por fatia* — redação de contratos, interpretação estatutária, licenciamento de PI — não um único agregado. Qualquer fatia que caia abaixo do seu limiar marca o release como `gate_fail`, independentemente de como a média parece.

Por que importa: scores agregados lavam regressões localizadas. O texto de Tianpan sobre a *Mentira do Semver*<sup><a href="#ref-3">[3]</a></sup> nomeia isso como o modo de falha dominante de release de LLM em 2026: um modelo que melhora na média enquanto colapsa silenciosamente numa classe de jornada do usuário.

Quem entrega: **mais ninguém em 2026**. Ferramentas de eval-CI — Braintrust, Humanloop, Patronus — pontuam contra uma rubrica global única ou uma lista plana de tarefas. Elas não expõem um limiar por fatia nem um override consciente de fatia. Esse é o primeiro lugar onde os campos deixam de se encontrar.

### Capacidade 5. Juiz calibrado ancorado em humanos (ρ de Spearman vs. notas humanas)

O que é: o juiz não é um LLM-como-juiz genérico. É um juiz LLM cujo ρ de Spearman contra um painel de especialistas do domínio é medido e configurado por fatia. O juiz é escolhido porque os ranks dele batem com os ranks dos humanos, não porque tem boa reputação.

Por que importa: o MT-Bench<sup><a href="#ref-6">[6]</a></sup> mostra que o GPT-4-como-juiz concorda com humanos em >80% no geral, com variância por categoria indo de código (86%) até escrita (36–44%). "Concordância geral" esconde as fatias onde o juiz não é confiável. Calibrar o juiz por fatia é a única forma honesta de tornar o scoring automatizado confiável.

Quem entrega: Braintrust, Humanloop, Patronus rodam avaliadores como juiz. Nenhum deles exige, expõe ou persiste uma calibração de Spearman ancorada em humanos por fatia. O pipeline de calibração do Divinci está documentado em [Calibrando o Juiz de IA](/pt/blog/calibrating-the-ai-judge/).

### Capacidade 6. Caminho de override com justificativa escrita obrigatória

O que é: forçar override de uma falha de gate é permitido (cold starts, regressões aceitas etc.) mas exige dois campos — `forceGateOverride: true` E `overrideReason: "..."`. A justificativa entra na trilha de auditoria junto com o ID do usuário. Sem overrides anônimos.

Por que importa: gates de governança não são uma feature de compliance separada; são uma propriedade do próprio estágio de gate. A trilha de auditoria tem que responder não só "esse override foi usado?" mas "qual era a justificativa naquele momento?" — porque o seu eu futuro precisa lê-la.

Quem entrega: ferramentas de eval-CI têm flags; nenhuma delas exige a justificativa como parte estrutural do override.

## Estágio ③ — Liberar

<div style="display: flex; align-items: stretch; gap: 0; margin: 1rem 0 1.5rem; border-radius: 8px; overflow: hidden; border: 1px solid rgba(184, 160, 128, 0.4);">
  <div style="background: #c87b3c; color: #faf8f5; padding: 0.75rem 1.25rem; font-size: 1.6rem; font-weight: 700; display: flex; align-items: center; line-height: 1;">③</div>
  <div style="background: rgba(200, 123, 60, 0.12); padding: 0.7rem 1rem; flex: 1; display: flex; align-items: center;">
    <strong style="color: #1e3a2b; letter-spacing: 0.04em;">LIBERAR</strong>
    <span style="color: #6b5d4f; margin-left: 0.8rem; font-size: 0.92rem;">Canário em 5% → 25% → 100% com monitor de qualidade em cada passo.</span>
  </div>
</div>

### Capacidade 7. Canário multi-checkpoint com dwell

O que é: o tráfego vai de 0% à produção via pelo menos três checkpoints — tipicamente **5% → 25% → 100%** — e segura em cada um por um tempo de dwell configurado ou um número de requisições configurado, o que for *mais tarde*. Sem salto instantâneo de 0%→100%.

Por que importa: bugs de cauda longa aparecem em escala. Um bug que afeta 0,3% das conversas é invisível num eval de 100 prompts e óbvio em 5% do tráfego de produção. O dwell é o que dá ao canário tempo para enxergar a cauda longa.

Quem entrega: campo de canário de serving entrega isso. O AWS SageMaker Deployment Guardrails<sup><a href="#ref-4">[4]</a></sup> documenta um `TerminationWaitInSeconds` padrão de 600 (dez minutos). KServe, BentoCloud, Seldon e Vertex expõem configurações de canário multi-passo similares. Essa é a capacidade saturada.

### Capacidade 8. Monitor de qualidade de saída em cada checkpoint do canário

O que é: em cada checkpoint, o pipeline checa três monitores antes de avançar — latência p95, taxa de 5xx **e** um score de qualidade de saída computado pelo mesmo juiz calibrado da capacidade 5. Latência e 5xx sozinhos não bastam.

Por que importa: aqui os campos deixam de se encontrar de novo. SageMaker, KServe, Vertex, BentoCloud, Seldon, todos observam latência e taxa de erro. Nenhum deles entrega um monitor de qualidade de saída por checkpoint — porque não têm um juiz calibrado contra o qual pontuar. As ferramentas de eval-CI têm o juiz mas não sentam sobre o tráfego.

Quem entrega: ninguém completa a ponte. A infraestrutura do canário com dwell existe no campo de serving; o juiz calibrado existe no campo de eval-CI; não vimos ninguém conectar os dois.

### Capacidade 9. Parada automática em violação de qualidade

O que é: um checkpoint de canário que falha em qualidade de saída para automaticamente. A promoção não avança. Nenhum acionamento humano é necessário para abortar o rollout.

Por que importa: humanos não estão no loop no prazo em que rollouts se movem. Quando o ticket do cliente chega, o checkpoint dos 25% já passou e a promoção para 100% já aconteceu.

Quem entrega: campo de canário de serving para por métricas de infraestrutura. A parada por métrica de qualidade é a parte que exige que a capacidade 8 exista.

## Estágio ④ — Observar

<div style="display: flex; align-items: stretch; gap: 0; margin: 1rem 0 1.5rem; border-radius: 8px; overflow: hidden; border: 1px solid rgba(184, 160, 128, 0.4);">
  <div style="background: #7a9580; color: #faf8f5; padding: 0.75rem 1.25rem; font-size: 1.6rem; font-weight: 700; display: flex; align-items: center; line-height: 1;">④</div>
  <div style="background: rgba(122, 149, 128, 0.14); padding: 0.7rem 1rem; flex: 1; display: flex; align-items: center;">
    <strong style="color: #1e3a2b; letter-spacing: 0.04em;">OBSERVAR</strong>
    <span style="color: #6b5d4f; margin-left: 0.8rem; font-size: 0.92rem;">Replay contínuo de traces → rollback atômico em ~12 s.</span>
  </div>
</div>

### Capacidade 10. Replay contínuo de traces de produção através do candidato

O que é: depois que o canário promove para 100%, o observador continua rodando. Ele amostra traces recentes de produção, replica-os pelo release *candidato* (agora ativo), pontua com o juiz calibrado e emite um score de qualidade por minuto. Contínuo, não periódico.

Por que importa: quedas silenciosas de qualidade — modelo titubeia, alucina uma data com confiança, recusa onde não deveria — nunca movem latência ou 5xx. O único sinal que você recebe pra esses casos é o ticket do cliente, que é o pior sinal possível. Um monitor contínuo de qualidade pega isso em minutos de um dígito.

Quem entrega: **ninguém.** O campo de observabilidade (Arize, Phoenix, Confident, Deepchecks<sup><a href="#ref-7">[7]</a></sup>) monitora a saída de produção mas não impõe nada. O campo de canário de serving observa infra. O campo de eval-CI não senta sobre o tráfego. O loop fechado — traces de produção → juiz calibrado → imposição — é a costura faltante.

### Capacidade 11. Rollback atômico em segundos, não em minutos

O que é: quando o observador dispara (três minutos consecutivos abaixo do limiar, digamos), o rollback executa automaticamente. O rollback re-aponta o roteamento para `previous_release` no manifesto. Como o release anterior era um manifesto totalmente empacotado, todo componente é trocado atomicamente. Ponta a ponta incluindo drain de requisições em voo num serviço de ~100 réplicas: cerca de 12 segundos<sup><a href="#ref-5">[5]</a></sup>.

Por que importa: a queda da Cloudflare em junho de 2022<sup><a href="#ref-8">[8]</a></sup> levou 44 minutos para reverter. A causa não foi o revert em si — foi que os engenheiros passaram por cima dos reverts uns dos outros porque o estado estava espalhado. Rollback dirigido por manifesto é instrução única; não pode ter esse modo de falha.

Quem entrega: campo de canário de serving entrega rollback rápido de infraestrutura (disparado por alarme, blue-green flip). A diferença arquitetural é se o *gatilho* é apenas de infra ou consciente de qualidade (capacidade 10).

### Capacidade 12. Recibo de compliance encadeado por hash e ancorável externamente

O que é: toda decisão de release — register, gate-pass, gate-fail, gate-override, checkpoint-promote, auto-rollback — emite um recibo JSON-com-SHA-256, encadeado por hash ao recibo anterior daquele cliente e ao recibo anterior daquele release. A cadeia é ancorada externamente num cronograma que o cliente configura.

**Ressalva de pesos abertos.** Quando o release é respaldado por um modelo de pesos abertos (Gemma, Qwen, Llama, Mistral, GPT-OSS), o recibo embute uma [vindex weight-attestation](/pt/compliance/) — uma prova de que os pesos ativos no momento da decisão são os pesos que o manifesto registrou. Quando o release é respaldado por um modelo de API fechada (OpenAI, Anthropic, Google via APIs opacas), o recibo cobre a cadeia de decisão mas não pode reivindicar proveniência dos pesos, porque o provedor não expõe pesos. O recibo diz isso explicitamente. Esse é o limite do que é verificável.

Por que importa: indústrias reguladas recebem *logs* hoje. O EU AI Act e o NIST AI RMF<sup><a href="#ref-9">[9]</a></sup> pedem cada vez mais *provas*. Um recibo encadeado por hash é a diferença entre "temos um log" e "um auditor pode verificar a cadeia sem confiar no nosso log."

Quem entrega: mais ninguém. Essa é a parte da diferenciação que mapeia diretamente à [página de compliance](/pt/compliance/) existente do Divinci — mesmo formato de recibo, estendido a decisões de release.

## As 12 capacidades, por campo de plataforma

<figure style="margin: 1.5rem auto; max-width: 100%;">
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 900 480" font-family="'DM Sans', -apple-system, sans-serif" role="img" aria-label="Matriz das 12 capacidades por campo de plataforma. Divinci tem as 12. Campo de Eval-CI (Braintrust, Humanloop, Patronus) tem 5 e 6. Campo de canário de serving (SageMaker, KServe, BentoCloud, Vertex, Seldon) tem 1 parcial, 2 parcial, 7, 9 e 11 com métricas de infraestrutura. Campo de registry de modelo (W&B Models, MLflow, LangSmith) tem 1 parcial e 2 parcial. Campo de observabilidade (Arize, Phoenix, Confident, Deepchecks) tem 10 só em forma de monitoramento. Mais ninguém tem 4 gate por fatia, 5 juiz calibrado ancorado em humanos, 8 monitor de qualidade de canário, 10 replay de traces em loop fechado com imposição ou 12 recibos encadeados por hash.">
<title>As 12 capacidades, por campo</title>
<rect width="900" height="480" fill="#faf8f5"/>
<text x="40" y="36" font-size="16" font-weight="700" fill="#1e3a2b">Qual campo entrega qual capacidade</text>
<text x="40" y="56" font-size="12" fill="#6b5d4f">✓ = entrega. ◐ = parcial (só infra, ou só registry). ✗ = não entrega. Seis capacidades estão faltando em todos os outros campos.</text>
<g font-size="11" fill="#1e3a2b">
<text x="40" y="100" font-weight="700">Capacidade</text>
<text x="380" y="100" font-weight="700" text-anchor="middle">Divinci</text>
<text x="490" y="100" font-weight="700" text-anchor="middle">Eval-CI</text>
<text x="600" y="100" font-weight="700" text-anchor="middle">Serving</text>
<text x="710" y="100" font-weight="700" text-anchor="middle">Registry</text>
<text x="820" y="100" font-weight="700" text-anchor="middle">Observar</text>
</g>
<g font-size="10" fill="#8a7d68">
<text x="490" y="116" text-anchor="middle">Braintrust</text>
<text x="600" y="116" text-anchor="middle">SageMaker</text>
<text x="710" y="116" text-anchor="middle">W&amp;B</text>
<text x="820" y="116" text-anchor="middle">Arize</text>
</g>
<line x1="40" y1="124" x2="860" y2="124" stroke="#d4c8b0" stroke-width="1"/>
<g font-size="11" fill="#1e3a2b">
<text x="40" y="146">1. SHA de manifesto imutável</text>
<text x="380" y="146" text-anchor="middle" fill="#2d5a4f">✓</text>
<text x="490" y="146" text-anchor="middle" fill="#a04848">✗</text>
<text x="600" y="146" text-anchor="middle" fill="#c87b3c">◐</text>
<text x="710" y="146" text-anchor="middle" fill="#c87b3c">◐</text>
<text x="820" y="146" text-anchor="middle" fill="#a04848">✗</text>
<text x="40" y="170">2. Troca atômica de versão (todos os componentes)</text>
<text x="380" y="170" text-anchor="middle" fill="#2d5a4f">✓</text>
<text x="490" y="170" text-anchor="middle" fill="#a04848">✗</text>
<text x="600" y="170" text-anchor="middle" fill="#c87b3c">◐</text>
<text x="710" y="170" text-anchor="middle" fill="#c87b3c">◐</text>
<text x="820" y="170" text-anchor="middle" fill="#a04848">✗</text>
<text x="40" y="194">3. Paridade de ambiente treino-serving</text>
<text x="380" y="194" text-anchor="middle" fill="#2d5a4f">✓</text>
<text x="490" y="194" text-anchor="middle" fill="#a04848">✗</text>
<text x="600" y="194" text-anchor="middle" fill="#c87b3c">◐</text>
<text x="710" y="194" text-anchor="middle" fill="#a04848">✗</text>
<text x="820" y="194" text-anchor="middle" fill="#a04848">✗</text>
<text x="40" y="222" font-weight="700" fill="#a04848">4. Gate de qualidade por fatia / por domínio</text>
<text x="380" y="222" text-anchor="middle" fill="#2d5a4f">✓</text>
<text x="490" y="222" text-anchor="middle" fill="#a04848">✗</text>
<text x="600" y="222" text-anchor="middle" fill="#a04848">✗</text>
<text x="710" y="222" text-anchor="middle" fill="#a04848">✗</text>
<text x="820" y="222" text-anchor="middle" fill="#a04848">✗</text>
<text x="40" y="246" font-weight="700" fill="#a04848">5. Juiz calibrado ancorado em humanos</text>
<text x="380" y="246" text-anchor="middle" fill="#2d5a4f">✓</text>
<text x="490" y="246" text-anchor="middle" fill="#c87b3c">◐</text>
<text x="600" y="246" text-anchor="middle" fill="#a04848">✗</text>
<text x="710" y="246" text-anchor="middle" fill="#a04848">✗</text>
<text x="820" y="246" text-anchor="middle" fill="#a04848">✗</text>
<text x="40" y="270">6. Caminho de override com justificativa obrigatória</text>
<text x="380" y="270" text-anchor="middle" fill="#2d5a4f">✓</text>
<text x="490" y="270" text-anchor="middle" fill="#c87b3c">◐</text>
<text x="600" y="270" text-anchor="middle" fill="#a04848">✗</text>
<text x="710" y="270" text-anchor="middle" fill="#a04848">✗</text>
<text x="820" y="270" text-anchor="middle" fill="#a04848">✗</text>
<text x="40" y="298">7. Canário multi-checkpoint com dwell</text>
<text x="380" y="298" text-anchor="middle" fill="#2d5a4f">✓</text>
<text x="490" y="298" text-anchor="middle" fill="#a04848">✗</text>
<text x="600" y="298" text-anchor="middle" fill="#2d5a4f">✓</text>
<text x="710" y="298" text-anchor="middle" fill="#a04848">✗</text>
<text x="820" y="298" text-anchor="middle" fill="#a04848">✗</text>
<text x="40" y="322" font-weight="700" fill="#a04848">8. Monitor de qualidade de saída em cada checkpoint</text>
<text x="380" y="322" text-anchor="middle" fill="#2d5a4f">✓</text>
<text x="490" y="322" text-anchor="middle" fill="#a04848">✗</text>
<text x="600" y="322" text-anchor="middle" fill="#a04848">✗</text>
<text x="710" y="322" text-anchor="middle" fill="#a04848">✗</text>
<text x="820" y="322" text-anchor="middle" fill="#a04848">✗</text>
<text x="40" y="346">9. Parada automática em violação de qualidade</text>
<text x="380" y="346" text-anchor="middle" fill="#2d5a4f">✓</text>
<text x="490" y="346" text-anchor="middle" fill="#a04848">✗</text>
<text x="600" y="346" text-anchor="middle" fill="#c87b3c">◐</text>
<text x="710" y="346" text-anchor="middle" fill="#a04848">✗</text>
<text x="820" y="346" text-anchor="middle" fill="#a04848">✗</text>
<text x="40" y="374" font-weight="700" fill="#a04848">10. Replay de traces de produção em loop fechado</text>
<text x="380" y="374" text-anchor="middle" fill="#2d5a4f">✓</text>
<text x="490" y="374" text-anchor="middle" fill="#a04848">✗</text>
<text x="600" y="374" text-anchor="middle" fill="#a04848">✗</text>
<text x="710" y="374" text-anchor="middle" fill="#a04848">✗</text>
<text x="820" y="374" text-anchor="middle" fill="#c87b3c">◐</text>
<text x="40" y="398">11. Rollback atômico em segundos</text>
<text x="380" y="398" text-anchor="middle" fill="#2d5a4f">✓</text>
<text x="490" y="398" text-anchor="middle" fill="#a04848">✗</text>
<text x="600" y="398" text-anchor="middle" fill="#c87b3c">◐</text>
<text x="710" y="398" text-anchor="middle" fill="#a04848">✗</text>
<text x="820" y="398" text-anchor="middle" fill="#a04848">✗</text>
<text x="40" y="426" font-weight="700" fill="#a04848">12. Recibo de compliance encadeado por hash</text>
<text x="380" y="426" text-anchor="middle" fill="#2d5a4f">✓</text>
<text x="490" y="426" text-anchor="middle" fill="#a04848">✗</text>
<text x="600" y="426" text-anchor="middle" fill="#a04848">✗</text>
<text x="710" y="426" text-anchor="middle" fill="#a04848">✗</text>
<text x="820" y="426" text-anchor="middle" fill="#a04848">✗</text>
</g>
<line x1="40" y1="446" x2="860" y2="446" stroke="#d4c8b0" stroke-width="1"/>
<text x="40" y="464" font-size="10" fill="#8a7d68">Capacidades 4, 5, 8, 10, 12 destacadas: são as cinco sem nenhum outro fornecedor neste levantamento. As demais se agrupam num campo ou em outro.</text>
</svg>
</figure>

O padrão é a questão. Cinco capacidades — **gate por fatia, juiz calibrado, monitor de qualidade do canário, replay em loop fechado, recibo encadeado por hash** — aparecem como ✗ em todos os outros campos. Essa é a costura. As outras sete se distribuem pelos campos de formas que fazem cada campo internamente coerente, mas mutuamente incompletos.

## O que torna o QA de modelos de linguagem customizados diferente do QA de software?

LLMs não são determinísticos, nem em temperatura zero — batching e diferenças de hardware causam variação na saída. Essa única propriedade quebra a maioria das hipóteses sobre as quais o QA tradicional foi construído:

- **Você não consegue escrever asserções `expect(output).toEqual(X)`.** Você precisa de uma avaliação consciente de distribuição que consuma correlação de rank contra um avaliador ancorado em humanos, não igualdade contra um fixture. É isso que é a capacidade 5.
- **Um modelo pode passar numa checagem agregada de qualidade e falhar numa fatia.** É por isso que a capacidade 4 existe separadamente. Se seu eval não fatia, ele não pega regressões conscientes de fatia.
- **Falhas de qualidade são silenciosas na camada de infraestrutura.** Latência e 5xx ficam limpos enquanto o modelo titubeia ou alucina. As capacidades 8 e 10 existem porque nenhum monitor do lado da infraestrutura consegue enxergar isso.
- **Rollback não é opcional.** Como os modos de falha são probabilísticos e alguns são silenciosos, o caminho de rollback tem que ser infraestrutura primária, não plano B. A capacidade 11 é o que torna "12 segundos" factível; a capacidade 2 é o que o torna correto.

Uma plataforma de QA e release que não considera esses quatro fatos está entregando CI/CD de software determinístico com um logo de LLM colado em cima. O mercado faz muito isso.

## Como trilhas de auditoria sustentam compliance de IA, na prática?

A lacuna de compliance mais comum que vemos — quando um auditor chega seis meses depois do deploy e pergunta "qual versão do modelo estava rodando em 15 de março, e quem aprovou esse release?" — não é "não temos logs." É "temos logs espalhados por cinco sistemas e as linhas do tempo não batem."

Um recibo de compliance (capacidade 12) resolve isso transformando o próprio log num artefato portátil: encadeado por hash, fonte única, ancorável externamente. Um auditor pode verificar a cadeia sem confiar na nossa infraestrutura. Essa é a diferença entre "temos registros" e "os registros são prováveis."

Para releases respaldados por modelos de pesos abertos, o recibo também inclui uma weight-attestation — uma prova criptográfica de que os pesos ativos são os pesos que o manifesto registrou. Isso satisfaz pedidos mais difíceis (direito ao apagamento do Artigo 17 do GDPR, proveniência do EU AI Act) porque você consegue provar *não só o que foi implantado* mas *que os pesos subjacentes são o que afirmam ser*.

Para releases respaldados por API fechada — quando o modelo é servido atrás de uma API opaca e os pesos não são expostos — o recibo cobre a cadeia de decisão mas não pode reivindicar proveniência de pesos. Dizemos isso no recibo explicitamente em vez de implicar uma prova que não podemos entregar. É o limite do que é verificável quando o provedor mantém os pesos internos.

## O que este checklist não resolve

Três limitações honestas:

**Capacidades não são checkboxes por si só.** Uma plataforma que entrega as doze de forma ruim é pior do que uma que entrega oito bem. O checklist é um ponto de partida para avaliação, não um scorecard para RFPs de fornecedor.

**O recorte competitivo é 2026 e vai mudar.** Daqui a seis meses alguns dos ✗ acima vão virar — concorrentes vão ler postmortems e fechar lacunas. Se você lê este post em 2027, audite as marcas você mesmo antes de acreditar nelas.

**Algumas capacidades dependem de outras.** A capacidade 8 (monitor de qualidade do canário) exige a capacidade 5 (juiz calibrado). A capacidade 10 (replay de traces em loop fechado) exige as duas. Uma plataforma que entrega 8 sem 5 está entregando um placebo — o monitor do canário existe mas não está ancorado em nada confiável.

## FAQ

### Qual é a capacidade de QA mais importante para releases de LLM customizado?

Um gate de qualidade por fatia (capacidade 4) — ou seja, a decisão de release consome scores de Spearman por domínio contra um avaliador ancorado em humanos, não um único agregado global. Scores agregados lavam regressões localizadas, e regressões localizadas são o modo de falha dominante em releases de LLM em 2026<sup><a href="#ref-3">[3]</a></sup>. Se você só pode entregar uma capacidade desta lista, entregue a 4. Depois entregue a 5, que é o que faz a 4 ser confiável.

### Como avaliar uma plataforma de QA de LLM sem rodá-la por seis meses?

Aplique o checklist de 12 capacidades acima à documentação do fornecedor, com dois testes específicos. Primeiro, peça que o fornecedor mostre o output do gate *por fatia* para um dos seus clientes de referência — se eles só tiverem scores agregados, não têm a capacidade 4. Segundo, pergunte o que dispara o auto-rollback deles — se a resposta for "latência, taxa de erro e nossos alarmes," eles estão no campo de canário de serving e a capacidade 10 está faltando.

### Qual é a diferença entre ferramentas de eval-CI e ferramentas de gestão de releases?

Ferramentas de eval-CI (Braintrust, Humanloop, Patronus) rodam avaliadores automatizados no merge do PR e bloqueiam merges ruins. Elas nunca tocam tráfego ao vivo. Ferramentas de gestão de releases (esta categoria) são donas do manifesto de release, do canário, do observador e do caminho de rollback. Eval-CI é *parte de* um fluxo de gestão de releases mas não é substituto para ele. Muitos times entregam uma das duas e descobrem a lacuna quando uma regressão que passou no CI bate em produção silenciosamente.

### Quão rápido o rollback deveria ser?

Ordem de grandeza de segundos, não de minutos. O tempo médio de rollback no pipeline do Divinci é cerca de 12 segundos — isso é o drain de requisições em voo num serviço de ~100 réplicas, não a troca do manifesto em si, que é sub-segundo. Compare com o incidente da Cloudflare em junho de 2022<sup><a href="#ref-8">[8]</a></sup>, que levou 44 minutos para reverter porque o estado estava espalhado por vários sistemas. A decisão arquitetural que torna segundos-não-minutos possível é o manifesto de release empacotado (capacidades 1 e 2).

### Por que recibos de compliance importam mais do que logs de compliance?

Um log é algo que você escreveu. Um recibo é algo que um auditor pode verificar sem confiar em você. O EU AI Act e o NIST AI RMF<sup><a href="#ref-9">[9]</a></sup> distinguem cada vez mais entre os dois — "documentado" não é o mesmo que "provável," e a direção regulatória aponta para o segundo. Um recibo encadeado por hash e ancorado externamente é a tecnologia mais simples disponível para cruzar essa linha.

## References

<ol class="post-references" style="padding-left: 1.5rem;">
<li id="ref-1" style="scroll-margin-top: 90px; margin-bottom: 0.9rem;">
<strong>Atlassian PIR April 2022.</strong> <a href="https://www.atlassian.com/blog/atlassian-engineering/post-incident-review-april-2022-outage" target="_blank" rel="noopener">Post-Incident Review: April 2022 Outage</a>. "The accelerated Restoration 2 approach took approximately 12 hours to restore a site." Citado pela capacidade 1 — o que é estado espalhado em vários sistemas em escala.
</li>
<li id="ref-2" style="scroll-margin-top: 90px; margin-bottom: 0.9rem;">
<strong>W&amp;B Models / MLflow registry.</strong> <a href="https://wandb.ai/site/registry/" target="_blank" rel="noopener">Weights &amp; Biases Registry</a> e <a href="https://mlflow.org/docs/latest/ml/model-registry/" target="_blank" rel="noopener">MLflow Model Registry</a>. O lado da capacidade 1 que só cobre o artefato do modelo. Nenhum dos dois entrega registro de template de prompt.
</li>
<li id="ref-3" style="scroll-margin-top: 90px; margin-bottom: 0.9rem;">
<strong>The Semver Lie.</strong> <a href="https://tianpan.co/blog/2026-04-29-semver-lie-llm-minor-update-breaks-production" target="_blank" rel="noopener">Tianpan — <em>The Semver Lie: how an LLM minor update breaks production</em></a> (abril de 2026). Nomeia o modo de falha de regressão por fatia como o padrão dominante de 2026. Companheiro: <a href="https://tianpan.co/blog/2026-04-27-llm-postmortem-template-fields-sre-missed" target="_blank" rel="noopener"><em>LLM postmortem template — fields SRE missed</em></a>. Âncora da capacidade 4.
</li>
<li id="ref-4" style="scroll-margin-top: 90px; margin-bottom: 0.9rem;">
<strong>SageMaker Deployment Guardrails.</strong> <a href="https://docs.aws.amazon.com/sagemaker/latest/dg/deployment-guardrails-blue-green-canary.html" target="_blank" rel="noopener">Use canary traffic shifting</a> e <a href="https://docs.aws.amazon.com/sagemaker/latest/dg/deployment-guardrails-configuration.html" target="_blank" rel="noopener">Auto-Rollback Configuration</a>. <code>TerminationWaitInSeconds</code> padrão de 600 (dez minutos), máximo 1800 (trinta minutos). O canário com métrica de infraestrutura padrão contra o qual o post contrasta nas capacidades 8 e 10.
</li>
<li id="ref-5" style="scroll-margin-top: 90px; margin-bottom: 0.9rem;">
<strong>Interno — flip atômico de roteamento via manifesto de release.</strong> O tempo de rollback de ~12 segundos é o drain de requisições em voo num serviço de ~100 réplicas; a troca do manifesto em si é sub-segundo. O número é do nosso próprio serviço, não um benchmark. A arquitetura que torna isso possível é o manifesto empacotado da capacidade 1.
</li>
<li id="ref-6" style="scroll-margin-top: 90px; margin-bottom: 0.9rem;">
<strong>Variância por categoria do LLM-como-juiz.</strong> Zheng et al., <a href="https://arxiv.org/abs/2306.05685" target="_blank" rel="noopener"><em>Judging LLM-as-a-Judge with MT-Bench and Chatbot Arena</em></a> (NeurIPS 2023). &gt;80% de concordância geral GPT-4 vs. humanos, com variância por categoria de código (86%) a escrita (36–44%). Âncora da capacidade 5 — por que um juiz calibrado precisa ser por fatia.
</li>
<li id="ref-7" style="scroll-margin-top: 90px; margin-bottom: 0.9rem;">
<strong>Comparação do campo de observabilidade.</strong> <a href="https://arize.com/docs/phoenix" target="_blank" rel="noopener">Arize Phoenix</a>, <a href="https://www.confident-ai.com/knowledge-base/compare/10-llm-observability-tools-to-evaluate-and-monitor-ai-2026" target="_blank" rel="noopener">comparação de 2026 da Confident AI sobre ferramentas de observabilidade</a>. Todas entregam monitoramento e alerta; nenhuma impõe rollback. Âncora do enquadramento "monitora sem impor" da capacidade 10.
</li>
<li id="ref-8" style="scroll-margin-top: 90px; margin-bottom: 0.9rem;">
<strong>Cloudflare June 2022 outage.</strong> <a href="https://blog.cloudflare.com/cloudflare-outage-on-june-21-2022/" target="_blank" rel="noopener">Cloudflare outage on June 21, 2022</a>. "06:58: Root cause found and understood. Work begins to revert the problematic change… 07:42: The last of the reverts has been completed." 44 minutos de "sabemos o que reverter" até revert completo, em parte porque engenheiros passaram por cima dos reverts uns dos outros. Âncora da capacidade 11.
</li>
<li id="ref-9" style="scroll-margin-top: 90px; margin-bottom: 0.9rem;">
<strong>NIST AI Risk Management Framework.</strong> <a href="https://www.nist.gov/itl/ai-risk-management-framework" target="_blank" rel="noopener">NIST AI RMF</a>. Governance, mapping, measurement, management — as quatro funções centrais às quais a capacidade 12 mapeia. Mais os requisitos de proveniência do EU AI Act em <a href="https://artificialintelligenceact.eu/" target="_blank" rel="noopener">artificialintelligenceact.eu</a>. Âncora da capacidade 12.
</li>
</ol>

---

*Próximo na série:* **Validando e Liberando LMs Customizados em Áreas Reguladas.** O checklist de capacidades acima é genérico. O próximo post é específico: o EU AI Act, o Artigo 17 do GDPR, HIPAA e o NIST AI RMF — o que cada um pede de um processo de release, quais capacidades acima cobrem qual requisito e onde a divisão entre pesos abertos / pesos fechados de fato muda a história de compliance.
