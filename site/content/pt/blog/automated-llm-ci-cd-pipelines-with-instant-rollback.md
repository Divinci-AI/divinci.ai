+++
title = "Pipelines de CI/CD Automatizados para LLM Com Rollback Instantâneo"
description = "A camada operacional do pipeline de release de quatro estágios: quais decisões disparam automaticamente, como é um drill de rollback real, e o número MTTR."
date = 2026-05-30T09:00:00+00:00
template = "blog-post.html"

[taxonomies]
categories = ["Product"]
tags = ["LLM Ops", "CI/CD", "Automation", "Rollback", "MTTR", "Release Management"]

[extra]
author = "Mike Mooring"
author_avatar = "images/Michael-Mooring.png"
hero_video = "https://pub-fb3e683317b24cf8b4260121edae02be.r2.dev/automated-llm-ci-cd-pipelines-with-instant-rollback-veo31.webm"
hero_video_poster = "/images/automated-llm-ci-cd-pipelines-with-instant-rollback-hero-poster.webp"
reading_time = 11
summary = "Entre os pontos de aprovação humana, um pipeline de release de LLM ou se executa sozinho ou não. Este post é o companheiro operacional do post de arquitetura — desenha o espectro de automação (quais decisões disparam automaticamente, quais exigem um humano e quais paramos por completo até alguém assinar a sobreposição), mostra como é um exercício de rollback real e termina com o número de MTTR que sai do outro lado."
+++

*Notas do Ciclo de Release — Parte V*

---

A página mais citada que não foi publicada no trimestre passado foi a que nosso observador disparou por conta própria às 2h14 da manhã. O release candidato havia passado pelo gate, permanecido em 5% pelos quatro minutos exigidos, avançado para 25% e então ficado lá. O monitor de qualidade por minuto detectou três leituras consecutivas abaixo do limiar na fatia do domínio jurídico, interrompeu o rollout e redirecionou o roteamento para o release anterior. Quando a notificação do engenheiro de plantão disparou — pelo recibo, não por uma indisponibilidade — o tráfego de produção já estava de volta no release conhecido como bom há nove minutos.

Ninguém precisou fazer nada. A arquitetura do [primeiro post desta série](/pt/blog/how-to-build-an-llm-ci-cd-pipeline-with-divinci-ai/) descreve quais são os quatro estágios. Este post trata do que roda entre as aprovações humanas — a camada de automação sob a arquitetura, a fronteira onde o pipeline ou faz a coisa certa por conta própria ou não faz.

A afirmação principal: **a maior parte das decisões do pipeline deve ser automatizada, mas não todas**. A fronteira importa. O pipeline que automatiza tudo eventualmente promoverá um release que um humano deveria ter pego; o pipeline que não automatiza nada não tem propósito. Traçar a fronteira corretamente é o tema deste post.

## O espectro de automação

Cada decisão do pipeline se encontra em algum ponto de um espectro que vai de *"dispara por conta própria sem nenhuma notificação humana"* até *"recusa-se a prosseguir sem uma aprovação assinada e explícita."* Abaixo está onde cada uma das ações estruturais do pipeline se encaixa nesse espectro em nosso pipeline em produção.

<figure style="margin: 1.5rem auto; max-width: 100%;">
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 900 460" font-family="'DM Sans', -apple-system, sans-serif" role="img" aria-label="O espectro de automação. Da automação total à esquerda até sempre requer aprovação humana à direita. Decisões plotadas: na extremidade totalmente automatizada, a avaliação do monitor de qualidade por minuto, a verificação de saúde do checkpoint canário e o gatilho de auto-rollback; no meio, o avanço após gate-pass e a promoção entre checkpoints canário; em direção ao lado humano, o registro de deploy em produção e o commit de manifesto; na extremidade sempre-humana, a decisão de sobreposição de gate-fail e o deploy sombra de release a frio.">
<title>O espectro de automação</title>
<rect width="900" height="460" fill="#faf8f5"/>
<text x="40" y="36" font-size="16" font-weight="700" fill="#1e3a2b">O espectro de automação</text>
<text x="40" y="56" font-size="12" fill="#6b5d4f">Onde cada decisão estrutural do pipeline se encaixa, de totalmente autônoma (esquerda) a sempre-humana (direita).</text>
<line x1="60" y1="110" x2="860" y2="110" stroke="#2d3c34" stroke-width="2"/>
<line x1="60" y1="100" x2="60" y2="120" stroke="#2d3c34" stroke-width="2"/>
<line x1="860" y1="100" x2="860" y2="120" stroke="#2d3c34" stroke-width="2"/>
<line x1="220" y1="105" x2="220" y2="115" stroke="#2d3c34" stroke-width="1"/>
<line x1="460" y1="105" x2="460" y2="115" stroke="#2d3c34" stroke-width="1"/>
<line x1="700" y1="105" x2="700" y2="115" stroke="#2d3c34" stroke-width="1"/>
<text x="60" y="92" font-size="11" font-weight="700" fill="#2d5a4f">TOTALMENTE AUTOMATIZADA</text>
<text x="60" y="138" font-size="10" fill="#6b5d4f">dispara sozinha,</text>
<text x="60" y="152" font-size="10" fill="#6b5d4f">sem notificação</text>
<text x="220" y="92" font-size="11" font-weight="700" fill="#7a9580" text-anchor="middle">SÓ-NOTIFICA</text>
<text x="220" y="138" font-size="10" fill="#6b5d4f" text-anchor="middle">roda automaticamente;</text>
<text x="220" y="152" font-size="10" fill="#6b5d4f" text-anchor="middle">recibo + alerta</text>
<text x="460" y="92" font-size="11" font-weight="700" fill="#b8a080" text-anchor="middle">PROSSEGUE-SE-OK</text>
<text x="460" y="138" font-size="10" fill="#6b5d4f" text-anchor="middle">humano pode vetar em</text>
<text x="460" y="152" font-size="10" fill="#6b5d4f" text-anchor="middle">uma janela conhecida</text>
<text x="700" y="92" font-size="11" font-weight="700" fill="#c87b3c" text-anchor="middle">INICIADA-POR-HUMANO</text>
<text x="700" y="138" font-size="10" fill="#6b5d4f" text-anchor="middle">requer ação</text>
<text x="700" y="152" font-size="10" fill="#6b5d4f" text-anchor="middle">explícita do usuário</text>
<text x="860" y="92" font-size="11" font-weight="700" fill="#a04848" text-anchor="end">SEMPRE-HUMANA</text>
<text x="860" y="138" font-size="10" fill="#6b5d4f" text-anchor="end">recusa sem</text>
<text x="860" y="152" font-size="10" fill="#6b5d4f" text-anchor="end">justificativa assinada</text>
<circle cx="100" cy="200" r="9" fill="#2d5a4f"/>
<line x1="100" y1="209" x2="100" y2="230" stroke="#8a7d68" stroke-width="0.5" stroke-dasharray="2 2"/>
<text x="100" y="246" text-anchor="middle" font-size="11" font-weight="700" fill="#1e3a2b">Avaliação por minuto</text>
<text x="100" y="261" text-anchor="middle" font-size="11" font-weight="700" fill="#1e3a2b">do observador</text>
<text x="100" y="282" text-anchor="middle" font-size="10" fill="#6b5d4f">roda continuamente</text>
<text x="100" y="296" text-anchor="middle" font-size="10" fill="#6b5d4f">em amostra de 5% de traces</text>
<circle cx="170" cy="200" r="9" fill="#2d5a4f"/>
<line x1="170" y1="209" x2="170" y2="330" stroke="#8a7d68" stroke-width="0.5" stroke-dasharray="2 2"/>
<text x="170" y="346" text-anchor="middle" font-size="11" font-weight="700" fill="#1e3a2b">Verificação de saúde</text>
<text x="170" y="361" text-anchor="middle" font-size="11" font-weight="700" fill="#1e3a2b">do checkpoint canário</text>
<text x="170" y="382" text-anchor="middle" font-size="10" fill="#6b5d4f">p95 + 5xx + qualidade</text>
<text x="170" y="396" text-anchor="middle" font-size="10" fill="#6b5d4f">de saída em 5/25/100</text>
<circle cx="240" cy="200" r="11" fill="#a04848" stroke="#a04848" stroke-width="2"/>
<line x1="240" y1="211" x2="240" y2="230" stroke="#8a7d68" stroke-width="0.5" stroke-dasharray="2 2"/>
<text x="240" y="246" text-anchor="middle" font-size="11" font-weight="700" fill="#a04848">Gatilho de</text>
<text x="240" y="261" text-anchor="middle" font-size="11" font-weight="700" fill="#a04848">auto-rollback</text>
<text x="240" y="282" text-anchor="middle" font-size="10" fill="#6b5d4f">3 minutos consecutivos</text>
<text x="240" y="296" text-anchor="middle" font-size="10" fill="#6b5d4f">abaixo do limiar</text>
<circle cx="420" cy="200" r="9" fill="#b8a080"/>
<line x1="420" y1="209" x2="420" y2="330" stroke="#8a7d68" stroke-width="0.5" stroke-dasharray="2 2"/>
<text x="420" y="346" text-anchor="middle" font-size="11" font-weight="700" fill="#1e3a2b">Avanço pós-gate</text>
<text x="420" y="361" text-anchor="middle" font-size="11" font-weight="700" fill="#1e3a2b">para canário</text>
<text x="420" y="382" text-anchor="middle" font-size="10" fill="#6b5d4f">todas as fatias ≥ limiar</text>
<text x="420" y="396" text-anchor="middle" font-size="10" fill="#6b5d4f">→ auto-início em 5%</text>
<circle cx="500" cy="200" r="9" fill="#b8a080"/>
<line x1="500" y1="209" x2="500" y2="230" stroke="#8a7d68" stroke-width="0.5" stroke-dasharray="2 2"/>
<text x="500" y="246" text-anchor="middle" font-size="11" font-weight="700" fill="#1e3a2b">Checkpoint</text>
<text x="500" y="261" text-anchor="middle" font-size="11" font-weight="700" fill="#1e3a2b">5% → 25% → 100%</text>
<text x="500" y="282" text-anchor="middle" font-size="10" fill="#6b5d4f">avança se os monitores</text>
<text x="500" y="296" text-anchor="middle" font-size="10" fill="#6b5d4f">se mantêm na permanência</text>
<circle cx="680" cy="200" r="9" fill="#c87b3c"/>
<line x1="680" y1="209" x2="680" y2="330" stroke="#8a7d68" stroke-width="0.5" stroke-dasharray="2 2"/>
<text x="680" y="346" text-anchor="middle" font-size="11" font-weight="700" fill="#1e3a2b">Registro</text>
<text x="680" y="361" text-anchor="middle" font-size="11" font-weight="700" fill="#1e3a2b">de release</text>
<text x="680" y="382" text-anchor="middle" font-size="10" fill="#6b5d4f">cliente comita</text>
<text x="680" y="396" text-anchor="middle" font-size="10" fill="#6b5d4f">um novo manifesto</text>
<circle cx="830" cy="200" r="11" fill="#a04848" stroke="#a04848" stroke-width="2"/>
<line x1="830" y1="211" x2="830" y2="230" stroke="#8a7d68" stroke-width="0.5" stroke-dasharray="2 2"/>
<text x="830" y="246" text-anchor="middle" font-size="11" font-weight="700" fill="#a04848">Sobreposição de gate-fail</text>
<text x="830" y="282" text-anchor="middle" font-size="10" fill="#6b5d4f">requer justificativa escrita</text>
<text x="830" y="296" text-anchor="middle" font-size="10" fill="#6b5d4f">no log de auditoria</text>
<text x="40" y="442" font-size="10" fill="#8a7d68"><tspan font-weight="700">Marcadores vermelhos</tspan> = as duas decisões em que o comportamento do pipeline é assimétrico: o auto-rollback dispara por conta própria e você não pode optar por desligá-lo; a sobreposição de gate-fail recusa prosseguir e você não pode pular a justificativa.</text>
</svg>
</figure>

Dois dos marcadores acima são vermelhos em vez de coloridos pela sua zona. Essas são as decisões assimétricas — os dois pontos em que o pipeline assume uma posição firme sobre quem pode tomar qual decisão. O **gatilho de auto-rollback** dispara sem pedir; você não pode configurá-lo para desligado, porque todo o ponto de tê-lo é que ele funcione às 2h14 da manhã. A **sobreposição de gate-fail** se recusa a avançar sem uma justificativa escrita; você também não pode configurar isso para desligado, porque todo o ponto de tê-la é que o seu eu do futuro precisa ler a razão. A maior parte do restante do pipeline é configurável; estas duas não são.

## Como o auto-rollback realmente dispara

A pergunta mais frequente sobre auto-rollback é *"o que o impede de disparar pela razão errada?"* A resposta honesta é: nada por si só. A proteção vem de como o gatilho está conectado.

O estágio Observe roda um loop de pontuação por minuto. A cada minuto ele:

1. Amostra um pequeno conjunto de traces recentes de produção do release ativo.
2. Reproduz cada trace pelo *modelo ativo* (não o candidato — estamos pontuando o que está realmente servindo).
3. Pontua cada reprodução usando o mesmo juiz calibrado e ancorado em humano que conduziu o Gate-2<sup><a href="#ref-1">[1]</a></sup>.
4. Calcula uma única pontuação de qualidade de saída sobre a amostra. Grava em `CanaryHealthSample`.

O rollback dispara quando **três amostras consecutivas por minuto** ficam abaixo do limiar de rollback (padrão: 0,85 do limiar do gate — então 0,55 se o gate era 0,65). Não um minuto ruim; três. O bloqueio de três minutos é o filtro de ruído — uma única leitura anômala não dispara nada, mas uma regressão sustentada sim.

Quando o bloqueio é rompido, o worker de rollback executa:

```bash
# Na prática — o pipeline roda isso por conta própria. Sem ack humano.
POST /api/v1/releases/<previous_release_sha>/activate
# resposta em <1s; drenagem em voo em ~12s num serviço com ~100 réplicas
```

Um recibo dispara. O engenheiro de plantão vê uma notificação no Slack *pelo recibo*, não por uma indisponibilidade. Ele abre o recibo; vê as três leituras abaixo do limiar, o tempo decorrido e os hashes `vindex_sha256_before/after`<sup><a href="#ref-2">[2]</a></sup>. Doze segundos é o tempo de drenagem em voo; a própria troca é abaixo de um segundo. Quando o engenheiro está acordado o suficiente para perguntar "preciso fazer alguma coisa?", a resposta é "não, mas você ainda deveria olhar por que o gate deixou isso passar."

## O recibo real do auto-rollback

É assim que o recibo se parece em produção. Mesmo formato encadeado por hash documentado na [página de compliance](/pt/compliance/), com os campos adicionais específicos a um evento de auto-rollback:

```json
{
  "kind": "auto_rollback",
  "release_id": "rel_a01c66",
  "previous_release_id": "rel_8f72b1",
  "trigger_at": "2026-05-29T02:14:23Z",
  "completed_at": "2026-05-29T02:14:35Z",
  "elapsed_seconds": 12,
  "trigger_reason": "observer_quality_threshold_breach",
  "observer_readings": [
    { "minute_at": "2026-05-29T02:11:00Z", "quality_score": 0.523, "below_threshold": true,  "slice": "legal-IP-licensing" },
    { "minute_at": "2026-05-29T02:12:00Z", "quality_score": 0.508, "below_threshold": true,  "slice": "legal-IP-licensing" },
    { "minute_at": "2026-05-29T02:13:00Z", "quality_score": 0.491, "below_threshold": true,  "slice": "legal-IP-licensing" }
  ],
  "rollback_threshold": 0.55,
  "active_manifest_sha256_before": "9abaeaf6c91f8b...",
  "active_manifest_sha256_after":  "8f72b1de4a93c5...",
  "audit_chain_signature": "sha256(...)",
  "notified_users": ["oncall@customer.example"],
  "notification_sent_at": "2026-05-29T02:14:36Z"
}
```

O próprio recibo é o primeiro ponto de contato do plantão. Lê-lo responde às perguntas que um engenheiro meio acordado realmente faria: o que disparou, qual fatia falhou, por quanto, quanto tempo a troca levou, o que está rodando agora. O próximo passo a partir daí costuma ser *"vá olhar por que o gate aprovou isso em primeiro lugar"* — e o recibo do release que falhou já tem a tabela de Spearman por fatia para isso.

## O que o pipeline NÃO faz por conta própria

O corolário de "auto-rollback dispara sem pedir" é que algumas outras coisas ativamente não podem. Três recusas explícitas.

**Ele não promove um release que falhou no gate sem uma sobreposição assinada.** Uma falha no gate marca o release como `gate_fail`; o endpoint `/activate` recusa-se a aceitar o SHA do manifesto; nenhuma invocação de linha de comando contorna isso. O único caminho à frente é uma sobreposição forçada com `forceGateOverride: true` E `overrideReason: "<texto livre>"`. O campo de justificativa é obrigatório, em texto livre, e vai para o log de auditoria junto com o ID do usuário. Projetamos isso para que o seu eu do futuro possa ler por que o seu eu do presente decidiu que a regressão na fatia era aceitável. Três pessoas usaram o caminho de sobreposição em produção. As justificativas delas ainda estão no log de auditoria.

**Ele não avança do canário para 100% se algum monitor estiver se degradando.** Se a latência p95, a taxa de 5xx OU a pontuação de qualidade de saída estiver fora de sua faixa no fim de uma permanência de checkpoint, o pipeline para naquele checkpoint e alerta. Ele não avança para depois pedir desculpas.

**Ele não faz auto-canário em um release de início frio.** Um release sem histórico de tráfego de produção — fine-tune novinho contra um conjunto de dados totalmente novo, por exemplo — não tem nada com o que comparar sua qualidade de saída. O pipeline se recusa a iniciar um canário em um release de início frio. Exigimos primeiro um deploy sombra de 24 horas, que observa o candidato contra traces reais de produção, mas não serve nenhuma de suas respostas. Após 24 horas temos uma linha de base de qualidade; então o canário pode prosseguir. Mais lento; honesto; não configurável.

## Quão rápida é a recuperação, de ponta a ponta?

O número de tempo de recuperação que publicamos é **12 segundos**. Esse é o tempo de drenagem em voo em um serviço com ~100 réplicas. A própria troca de manifesto é abaixo de um segundo. Para ser útil para um leitor, os 12 segundos precisam ser decompostos:

- **0–60 segundos antes do rollback:** chegam as três leituras consecutivas abaixo do limiar. A primeira leitura abaixo do limiar inicia o cronômetro de bloqueio. Cada minuto subsequente estende o bloqueio se a qualidade ainda estiver abaixo do limiar.
- **t = 0:** a terceira leitura abaixo do limiar grava em `CanaryHealthSample`. O worker de rollback observa o terceiro strike e despacha `/activate previous_release`.
- **t < 1 segundo:** o ponteiro de release ativo da camada de roteamento (no Redis) é trocado. Novas requisições começam a atingir o release anterior.
- **t = 1 a ~12 segundos:** o release candidato continua servindo qualquer requisição que estava em voo quando a troca aconteceu. Drenagem em voo. Algumas respostas em streaming levam de 8 a 10 segundos para completar naturalmente, então a cauda de limpeza fica em torno de 12s num serviço típico.
- **t ≈ 13 segundos:** o recibo do log de auditoria é escrito e assinado. A notificação dispara.

Comparado com os postmortems públicos que continuamos citando como âncoras: a indisponibilidade da Cloudflare em junho de 2022<sup><a href="#ref-3">[3]</a></sup> levou 44 minutos de "sabemos o que reverter" a "a reversão está completa" — e isso foi na camada de *infraestrutura*. A indisponibilidade da Atlassian em abril de 2022<sup><a href="#ref-4">[4]</a></sup> levou 12 horas por site porque o estado estava dividido entre múltiplos sistemas. O limiar da DORA<sup><a href="#ref-5">[5]</a></sup> para "elite performer" em recuperação de deploy falho é menos de uma hora. Doze segundos não é uma ordem de grandeza melhor que o limiar elite — são três ordens de grandeza melhor. A decisão arquitetural que torna isso possível é o manifesto de release encapsulado do [Estágio 1](/pt/blog/how-to-build-an-llm-ci-cd-pipeline-with-divinci-ai/#stage-1-register). Sem o manifesto, você não tem um único objeto para redirecionar o roteamento.

## Exercícios de rollback — a prática nada glamourosa que ninguém roda

Aqui está a parte que a maioria dos times pula: **o único sinal confiável de que seu caminho de rollback funciona é você ter rodado um exercício deliberado, agendado e confirmado**. A cada trimestre rodamos um. O exercício é:

1. Escolha um horário aleatoriamente agendado em dia útil e horário comercial. Diga ao time que está chegando, mas não a hora específica.
2. Injete uma regressão sintética de qualidade na fatia canário. (Temos uma flag de modo de teste que permite ao modelo candidato responder a um cabeçalho mágico com "Recuso-me a responder" — garantido a falhar no juiz calibrado.)
3. Empurre o release de teste pelo gate (ele passa — estamos testando o rollback, não o gate). Inicie um canário.
4. O observador percebe três leituras abaixo do limiar. O auto-rollback dispara.
5. Aguarde o engenheiro de plantão reagir. Cronometre quanto tempo ele leva. Anote se ele confia no recibo o suficiente para *não* escalar para o estado de alarme.
6. Verifique se o log de auditoria mostra a flag de modo de teste no recibo do rollback, para que auditorias futuras possam distinguir um exercício de um incidente real.

O primeiro exercício que rodamos levou 19 segundos de ponta a ponta (12s de troca + um atraso de assentamento de 7s que tivemos que corrigir). O exercício mais recente — Q1 2026 — levou 12 segundos. O exercício nunca pode ser pulado. A cada trimestre; em cada cluster de cliente.

A maioria dos times nunca rodou um exercício de rollback deliberado. A primeira vez que o caminho de rollback deles roda é durante um incidente real, sob pressão, com várias pessoas na chamada. O exercício é o que faz do número de 12 segundos um número real em vez de aspiracional.

## O que isso não resolve

Três limitações honestas:

**O auto-rollback pode oscilar como ping-pong.** Se tanto o candidato QUANTO o release anterior estiverem ruins — digamos, o release anterior também tinha uma regressão lenta em uma fatia que ninguém pegou — o pipeline pode reverter, então o release anterior também falha em seu observador pós-rollback, e não há um terceiro release para reverter. O pipeline interrompe o tráfego para uma página de manutenção em vez de oscilar. A correção é manter mais de um release anterior saudável indexado na cadeia de manifestos para que o alvo de rollback seja configurável.

**O observador adiciona custo de inferência.** Reproduzir traces de produção pelo modelo ativo em uma amostra de 5% adiciona aproximadamente 5% ao gasto com inferência. Achamos que é o trade-off certo. Alguns clientes acham que é caro demais em workloads de baixa margem e querem reduzir a taxa de amostragem. O controle existe.

**Um juiz ruim é pior do que nenhum juiz.** Se o juiz calibrado que dirige o observador está ele mesmo descalibrado — afastado da âncora humana, ou treinado num corpus desatualizado — o observador pode disparar auto-rollback pela razão errada. A cadência de recalibração importa. A peça Calibrating-the-Judge<sup><a href="#ref-6">[6]</a></sup> documenta o procedimento; o requisito operacional é que você de fato o execute.

## FAQ

### Por que o gatilho de rollback é de três minutos consecutivos em vez de um?

Porque pontuações de qualidade de LLM têm piso de ruído — uma única leitura anômala de um minuto pode vir de um capricho de amostragem (a amostra de 5% de traces calhou de cair em uma fatia difícil), não de uma regressão real. O bloqueio de três minutos é o filtro de ruído mais barato que ainda mantém o tempo total de reação abaixo de um minuto e meio. Já ajustamos para ambos os lados; três é o ponto ideal para o formato de tráfego típico dos nossos clientes. A permanência é configurável por release se o seu formato de tráfego for diferente.

### O auto-rollback deveria ser configurável para "desligado"?

No nosso pipeline em produção, não. O ponto de ter um mecanismo de segurança automatizado é que ele funcione às 2h14 da manhã quando ninguém está olhando. Um auto-rollback configurável-para-desligado é um post-it dizendo "antigamente tínhamos uma rede de segurança." O argumento para torná-lo configurável é que alguns workloads têm baixa criticidade demais para justificar quaisquer falsos positivos de rollback. Achamos que esse argumento leva ao lugar errado — se o seu workload tem baixa criticidade demais para auto-rollback, você também não precisa de um pipeline de release.

### Como vocês lidam com o caso em que o release anterior também era ruim?

O alvo de rollback é `previous_release` por padrão, mas a cadeia de manifestos armazena mais histórico do que apenas N-1. Operadores podem redirecionar um rollback para qualquer SHA de manifesto historicamente saudável — `/api/v1/releases/<historically_good_sha>/activate` — que é o caminho de intervenção manual quando o rollback automático N-1 atinge um release anterior ruim. A válvula de escape existe. É raro.

### Qual é a métrica certa para otimizar — MTTR ou MTBF?

MTTR — Mean Time To Recovery — por uma larga margem, ao menos para sistemas LLM. MTBF (Mean Time Between Failures) assume uma noção determinística de "falha" que workloads LLM não têm. A qualidade de saída deriva continuamente; "falha" é uma decisão de limiar. Otimizar para recuperação rápida é robusto a onde você desenha o limiar; otimizar para nunca falhar é frágil e falso. O limiar elite da DORA<sup><a href="#ref-5">[5]</a></sup> é em si enquadrado em termos de MTTR, que é o enquadramento certo.

### Vocês realmente rodam exercícios de rollback?

Sim — trimestralmente, agendados, com uma flag de modo de teste no recibo para que o exercício possa ser distinguido de um incidente real no log de auditoria. O primeiro exercício que rodamos expôs um atraso de assentamento de 7 segundos que não tínhamos percebido que estava lá. O exercício é a única maneira de saber se o caminho realmente funciona; ler o runbook não é suficiente. A maioria dos times não rodou nenhum, e é por isso que os números de MTTR da maioria dos times são aspiracionais em vez de medidos.

## References

<ol class="post-references" style="padding-left: 1.5rem;">
<li id="ref-1" style="scroll-margin-top: 90px; margin-bottom: 0.9rem;">
<strong>LLM-as-judge calibration.</strong> Zheng et al., <a href="https://arxiv.org/abs/2306.05685" target="_blank" rel="noopener"><em>Judging LLM-as-a-Judge with MT-Bench and Chatbot Arena</em></a> (NeurIPS 2023). The anchor for why a calibrated judge is necessary and why per-slice agreement matters more than aggregate agreement. The observer's per-minute scoring loop depends on this.
</li>
<li id="ref-2" style="scroll-margin-top: 90px; margin-bottom: 0.9rem;">
<strong>vindex weight-attestation.</strong> Documented on the <a href="/pt/compliance/">Divinci compliance page</a> and walked through in the <a href="/pt/blog/validating-and-releasing-custom-lms-in-regulated-fields/">regulated-fields post</a>. The `vindex_sha256_before/after` fields in the auto-rollback receipt are the cryptographic anchor an auditor can verify without trusting our logs.
</li>
<li id="ref-3" style="scroll-margin-top: 90px; margin-bottom: 0.9rem;">
<strong>Cloudflare June 2022 outage.</strong> <a href="https://blog.cloudflare.com/cloudflare-outage-on-june-21-2022/" target="_blank" rel="noopener">Cloudflare outage on June 21, 2022</a>. "06:58: Root cause found and understood. Work begins to revert the problematic change… 07:42: The last of the reverts has been completed." Forty-four minutes to revert at the infrastructure tier, in part because engineers walked over each other's reverts. Anchor for the "manifest-driven swap can't have that failure mode" claim.
</li>
<li id="ref-4" style="scroll-margin-top: 90px; margin-bottom: 0.9rem;">
<strong>Atlassian April 2022 outage.</strong> <a href="https://www.atlassian.com/blog/atlassian-engineering/post-incident-review-april-2022-outage" target="_blank" rel="noopener">Post-Incident Review: April 2022 Outage</a>. 12 hours per site to restore, 14 days total for 883 sites, because state was split across independently-versioned systems. Anchor for the "bundled release manifest is the thing that makes seconds-not-hours possible" claim.
</li>
<li id="ref-5" style="scroll-margin-top: 90px; margin-bottom: 0.9rem;">
<strong>DORA failed-deployment recovery threshold.</strong> <a href="https://dora.dev/guides/dora-metrics/" target="_blank" rel="noopener">DORA — Software delivery performance metrics</a>. The "failed deployment recovery time" elite-performer threshold is documented as under one hour. The 12-second pipeline number is three orders of magnitude below the elite threshold, which is the right way to read the comparison.
</li>
<li id="ref-6" style="scroll-margin-top: 90px; margin-bottom: 0.9rem;">
<strong>Calibrating the AI judge.</strong> Our companion post <a href="/blog/calibrating-the-ai-judge/">Calibrating the AI Judge</a>. The procedure for keeping the human-anchored judge in calibration over time. The operational claim in this post — that auto-rollback only works as well as the judge driving it — only holds if the judge is in fact periodically recalibrated.
</li>
<li id="ref-7" style="scroll-margin-top: 90px; margin-bottom: 0.9rem;">
<strong>Internal — Divinci pipeline reference.</strong> The architecture this automation layer sits under: the <a href="/pt/blog/how-to-build-an-llm-ci-cd-pipeline-with-divinci-ai/">four-stage pipeline post</a>. The full API surface is documented at the <a href="/pt/api/">API reference</a>; the release-management section is the one this post is talking about.
</li>
</ol>

---

*Próximo nesta série:* **Testes de CI para Modelos de Linguagem Customizados em 2026.** Este post é sobre a camada operacional entre as aprovações humanas. O próximo é a camada *anterior* ao início do pipeline — CI pré-merge: o que avaliar no momento do PR, que tipos de regressões você de fato pega antes que o gate as veja e que tipos você não pega.
