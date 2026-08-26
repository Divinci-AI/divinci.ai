+++
title = "10 Falhas de Release CI/CD em Modelos de Linguagem Customizados — E Qual Estágio do Pipeline Pega Cada Uma"
description = "Dez modos de falha reais em releases de LMs, cada um mapeado ao estágio do pipeline Divinci — Register, Gate, Roll, Observe — que pega antes dos usuários."
date = 2026-05-27T09:00:00+00:00
template = "blog-post.html"

[taxonomies]
categories = ["Product"]
tags = ["CI/CD", "Release Management", "LLM Ops", "Postmortems", "Evaluation Gates", "Rollback"]

[extra]
author = "Mike Mooring"
author_avatar = "https://pub-fb3e683317b24cf8b4260121edae02be.r2.dev/images/Michael-Mooring.webp"
hero_video = "https://pub-fb3e683317b24cf8b4260121edae02be.r2.dev/10-ci-cd-release-failures-in-custom-language-models-veo31.webm"
hero_video_poster = "https://pub-fb3e683317b24cf8b4260121edae02be.r2.dev/images/10-ci-cd-release-failures-in-custom-language-models-hero-poster.webp"
reading_time = 11
summary = "Já enviamos releases de LM customizados suficientes pelo pipeline de quatro estágios da Divinci para ter uma lista dos dez modos de falha mais danosos que costumávamos repetir. Três deles são regressões por slice que um gate agregado teria enviado. Mais dois são quedas silenciosas de qualidade que um canário por métrica de infraestrutura teria promovido. O resto é o tipo de erro que todo pipeline de release deveria pegar — listamos porque vale dizer em voz alta quais um pipeline com gate agregado, de fato, pega por conta própria."
+++

*Notas do Ciclo de Release — Parte II*

---

O [primeiro post desta série](/pt/blog/how-to-build-an-llm-ci-cd-pipeline-with-divinci-ai/) percorreu o pipeline de release de quatro estágios que enviamos — **Registrar → Gatear → Rolar → Observar**. Este post são os recibos: dez modos de falha específicos que já capturamos com ele, como cada um se manifestou na prática e qual estágio do pipeline impediu que chegasse à produção.

A lista é organizada por estágio, não por severidade, porque o estágio te diz *onde investir* se você estiver construindo algo assim sozinho. Se o seu gate é o elo fraco, seis das dez falhas abaixo continuarão te atingindo. Se o seu observador é o elo fraco, duas delas vão te atingir silenciosamente — significando que o único sinal que você jamais receberá é uma reclamação de cliente, que é o pior sinal possível.

Um pipeline que pega todas as dez não é uma lista de features. É um pequeno número de decisões arquiteturais tomadas com consistência. Cada falha abaixo nomeia qual decisão se aplica.

## Como ler esta lista

Cada falha é marcada com o estágio que a pega:

- **① REGISTRAR** — a camada de manifesto. Para falhas em que você não conseguia dizer qual mudança quebrou a produção porque o estado estava espalhado por sistemas.
- **② GATEAR** — Spearman por domínio contra um juiz calibrado e ancorado em humano. Para falhas que se escondem dentro de pontuações agregadas.
- **③ ROLAR** — canário em 5% → 25% → 100% com um monitor de qualidade em cada checkpoint. Para falhas que só aparecem em escala.
- **④ OBSERVAR** — replay contínuo de traços através do candidato, pontuado pelo juiz do gate. Para quedas silenciosas de qualidade que latência e 5xx nunca percebem.

Cada seção termina com a **correção** — a configuração exata que enviamos na Divinci, mais o que construir sozinho se você não estiver usando a gente.

---

## Estágio ① — Registrar

### 1. Co-deployar modelo + prompt + roteamento em um único pacote e não saber qual deles quebrou

**O que aconteceu.** Mudamos três coisas no mesmo release: subimos o modelo base de Gemma 4 E2B para Gemma 4 26B-A4B, editamos o prompt de sistema do domínio jurídico para adicionar uma instrução "cite o estatuto" e ajustamos a regra de roteamento que decide qual classe de tráfego cai em qual modelo. A acurácia em redação de contratos caiu 7 pontos. Nenhuma das três mudanças tinha sido testada de forma independente. Debugar exigiu reverter uma variável de cada vez ao longo de dois dias.

**Por que o pipeline pega isso agora.** Um release da Divinci é um manifesto imutável que agrupa model_ref, prompt_template_ref, routing e dataset_version em um único artefato endereçado por SHA-256. O pipeline se recusa a fazer deploy de um manifesto que agrupa mais de uma mudança *a menos que* o SHA do release anterior seja referenciado como baseline de comparação. Se você quiser enviar três mudanças ao mesmo tempo, tem que reconhecê-lo no manifesto, e o caminho de atribuição de falha permanece limpo porque o próximo release é forçado de volta a uma-variável-por-vez.

**Correção.** Não deixe humanos montarem releases na mão. O manifesto de release deve ser gerado por um pipeline que *não consiga* agrupar silenciosamente. Veja [Estágio 1 — Registrar](/pt/blog/how-to-build-an-llm-ci-cd-pipeline-with-divinci-ai/#stage-1-register) para a API.

### 2. Editar um prompt de sistema em um dashboard e enviá-lo sem code review

**O que aconteceu.** Alguém ajustou o prompt de sistema em uma UI administrativa para "deixar o modelo menos verboso". Parecia uma edição de uma palavra. O prompt resultante ficou 38 caracteres mais curto, o que o derrubou abaixo de um limiar de comprimento que o reescritor de prompt downstream usava para decidir se adicionava boilerplate de segurança. Duas horas depois, o modelo estava respondendo a perguntas que deveria ter recusado.

**Por que o pipeline pega isso agora.** Prompts fazem parte do manifesto registrado. Editar um em um dashboard significa cortar um novo manifesto, o que significa gerar um novo SHA, o que significa que o gate roda contra a mudança. Você ainda pode editar prompts em um dashboard. Só não pode enviá-los sem que o gate os veja.

**Correção.** Trate prompts como código: versione com um hash de conteúdo, registre como parte do release, gateie contra a suíte scored-QA. O texto *Semver Lie* de Tianpan<sup><a href="#ref-1">[1]</a></sup> descreve esse modo de falha exato acontecendo no mundo real — uma mudança de prompt que "passou no code review, foi deployada sem eval gates, chegou à produção sem A/B por usuário e não disparou rollback automático".

### 3. Skew de pré-processamento entre treino e serving

**O que aconteceu.** O pipeline de treinamento normalizava espaços em branco e colocava em lowercase um determinado campo. O pipeline de serving não fazia. Mesmo modelo, mesmo prompt, mesmo roteamento — entradas diferentes em nível de byte. Em fixtures de dev tudo passava. No tráfego real, o modelo se comportava como se tivesse sido re-treinado em dados mais ruidosos, porque da sua perspectiva, tinha sido.

**Por que o pipeline pega isso agora.** O manifesto registra um `preprocessing_ref` ao lado do model_ref. A avaliação de gate roda pelo mesmo pré-processamento que o stack de serving de produção usa. Se os dois divergirem, os números offline do gate não batem mais com a produção, e o Spearman por slice cai de um jeito que é mensurável antes do promote.

**Correção.** Containerize o pré-processamento como um artefato versionado. Referencie-o a partir do manifesto. Recuse o deploy se o gate foi computado contra uma versão de pré-processamento diferente daquela que a produção vai usar.

---

## Estágio ② — Gatear

As quatro falhas abaixo são as que um gate de pontuação agregada teria enviado. **A razão pela qual um gate agregado as deixa passar é estrutural, não ajuste de parâmetro** — fazer média entre slices destrói exatamente o sinal que você usaria para pegar uma regressão localizada em um único slice.

### 4. O colapso de licenciamento de PI (regressão por slice #1)

**O que aconteceu.** Um fine-tune QLoRA melhorou a acurácia de Q&A jurídico em cinco subdomínios e despencou em licenciamento de PI — redação de contratos 0,71, interpretação estatutária 0,74, sumarização de casos 0,69, compliance regulatório 0,66, análise jurisdicional 0,62, **licenciamento de PI 0,41**. O ρ de Spearman agregado entre os seis era 0,64. O limiar do gate era 0,65. Por uma única pontuação agregada, o release ficou por um triz abaixo da linha. Pela visão por slice, um subdomínio havia colapsado em 27 pontos.

**Por que o pipeline pega isso agora.** O limiar do gate é por slice, não agregado. Qualquer slice único caindo abaixo do seu limiar marca o release como `gate_fail`, independentemente de como a média se pareça. O [gráfico de limiares do gate no post #1](/pt/blog/how-to-build-an-llm-ci-cd-pipeline-with-divinci-ai/#stage-2-gate) é a visualização real que o pipeline produz para releases como este.

**Correção.** Fatie o gate. Os slices que importam são os subdomínios do seu segmento de cliente, não qualquer taxonomia que esteja no framework de eval que você importou.

### 5. Regressão no slice de oncologia pediátrica (regressão por slice #2)

**O que aconteceu.** Um modelo de Q&A médico foi feito fine-tune com dados adicionais de cardiologia adulta. A acurácia médica agregada melhorou 4 pontos. A acurácia em oncologia pediátrica caiu 11 pontos — aparentemente os novos dados de treinamento sutilmente desenfatizaram ajustes de dosagem pediátrica. O gate agregado teria promovido.

**Por que o pipeline pega isso agora.** Oncologia pediátrica era um dos slices configurados pelo cliente quando ele registrou a suíte scored-QA. A avaliação do Gate-2 produziu um ρ de Spearman por slice que caiu de 0,72 para 0,61, abaixo do limiar de oncologia pediátrica de 0,68. Marcado como `gate_fail`. Sem deploy.

**Correção.** Slices definidos pelo cliente, não pela plataforma. A plataforma deve permitir que o cliente adicione um slice e um limiar por slice sem escrever código — porque ninguém na Divinci conhece as bordas de domínio do cliente tão bem quanto o cliente.

### 6. Drift de sub-linguagem multilíngue (regressão por slice #3)

**O que aconteceu.** Um modelo multilíngue feito fine-tune para melhorar respostas em francês. A acurácia agregada em francês melhorou 3 pontos. Dentro de "francês", porém, o modelo agora performava pior em variantes regionais de francês belga e francês suíço — o corpus de treinamento estava pesado em francês parisiense. Um gate agregado de francês teria enviado.

**Por que o pipeline pega isso agora.** Variantes locais são sub-slices do slice de língua. O Spearman por sub-slice pegou a regressão na variante belga antes do promote. O release foi devolvido para (a) dados de treinamento mais diversos ou (b) um force-override com justificativa escrita ("estamos aceitando a regressão regional porque a melhoria agregada em francês importa mais neste rollout") — e o override entra na trilha de auditoria.

**Correção.** Profundidade de slice importa. "Francês" é grosseiro demais. "Francês belga" é o nível em que regressões de fato se escondem.

### 7. Burlar o gate sem uma justificativa escrita de override

**O que aconteceu.** Janela de release sob alta pressão. O gate falhou em um slice — não crítico, no julgamento do time. Alguém estendeu a mão para o flag de force-override. Numa versão anterior do pipeline, force-override era um único booleano. O flag virou, o release foi enviado, e três semanas depois ninguém conseguia reconstruir quem decidiu o quê sobre qual slice.

**Por que o pipeline pega isso agora.** Force-override é um gate de dois campos: `forceGateOverride: true` E `overrideReason: "..."`. A razão é uma string livre obrigatória escrita no audit log junto com o ID do usuário e o resultado do gate por slice que foi sobreposto. O pipeline recusa o override sem a razão. Você ainda pode dar override — só não pode dar override anonimamente.

**Correção.** Gates de governança não são um estágio separado. São uma propriedade do estágio de gate: todo override é um recibo assinado com texto de justificativa.

---

## Estágio ③ — Rolar

### 8. Ir de 0% para 100% do tráfego em um único passo

**O que aconteceu.** Um modelo passou no gate sem ressalvas. Foi empurrado para 100% do tráfego imediatamente. Por uma peculiaridade do comprimento da conversa, o novo modelo dava timeout em respostas mais longas que ~2.400 tokens — um comportamento que não apareceu no conjunto de avaliação de 100 perguntas do gate porque todo prompt de teste era curto. 15% dos usuários tiveram timeout por 18 minutos antes que alguém fizesse rollback manual.

**Por que o pipeline pega isso agora.** O estágio Rolar segura em 5% por `dwell_5pct_seconds` (padrão 240) OU `requests_5pct` (padrão 1.000), o que for *mais tarde*. A 5% de tráfego, os timeouts de conversa longa aparecem no monitor de taxa de 5xx em ~3 minutos. O pipeline se recusa a avançar além de 5% se qualquer monitor de checkpoint romper sua banda. O tempo médio até o halt foi de 4 minutos; o tempo médio até um rollback completo foi de cerca de 12 segundos após o halt.

**Correção.** Canário em três passos com um monitor de *qualidade*, não só latência e 5xx. O padrão "cinco-por-cento-em-vinte-segundos-e-acabou" é o perigoso. O padrão "cinco-por-cento-por-quatro-minutos" é o seguro.

---

## Estágio ④ — Observar

As duas falhas abaixo são as que um canário por métrica de infraestrutura teria promovido. **A razão pela qual métricas de infraestrutura as deixam passar também é estrutural** — latência e 5xx podem permanecer perfeitamente limpos enquanto o modelo silenciosamente se esquiva, recusa ou alucina.

### 9. Esquiva silenciosa em consultas jurídicas (queda silenciosa de qualidade #1)

**O que aconteceu.** Uma atualização de modelo com tunagem de segurança deixou o assistente do domínio jurídico notavelmente mais conservador. Mesma latência, mesma taxa de 5xx, mesmo uso de tokens. Mas onde a versão anterior havia respondido "o prazo prescricional é de X anos", a nova versão dizia "você deve consultar um advogado". Os clientes perceberam em horas. Os dashboards nunca se mexeram.

**Por que o pipeline pega isso agora.** O observador do Estágio 4 roda replay contínuo de traços de produção através do modelo ativo e os pontua com o mesmo juiz calibrado que alimentou o Gate-2. A esquiva aparece imediatamente porque o juiz calibrado — ancorado em avaliações humanas do que uma "boa" resposta jurídica parece — penaliza recusa-quando-uma-resposta-era-esperada. O monitor de qualidade de saída caiu abaixo da sua banda por três minutos consecutivos e o pipeline fez auto-rollback. Tempo total decorrido: menos de cinco minutos.

**Correção.** Não monitore apenas latência e 5xx. Monitore uma pontuação de *qualidade* derivada de um juiz calibrado contra traços reais de produção. Os deployment guardrails do SageMaker<sup><a href="#ref-2">[2]</a></sup> fazem auto-rollback em alarmes CloudWatch — útil para infraestrutura, mas o alarme tem que disparar em uma métrica, e "o modelo está se esquivando" não é uma métrica que o CloudWatch vê.

### 10. Datas alucinadas após um fine-tune (queda silenciosa de qualidade #2)

**O que aconteceu.** Um fine-tune de assistente de agendamento começou a inserir, com confiança, datas que não existiam na entrada. "Sua reunião é na quinta-feira, 32 de março." Latência inalterada. Taxa de 5xx inalterada. As alucinações passaram pelo filtro de segurança porque nada sinalizava "32 de março" como prejudicial — apenas impossível.

**Por que o pipeline pega isso agora.** O juiz calibrado do observador — rodando em traços reais de agendamento de produção, não sintéticos — dá a respostas confiantes-mas-erradas uma pontuação pior do que recusas apropriadas de "não sei". A queda na classe de alucinação disparou o limiar por minuto do observador em dois minutos. Auto-rollback disparou.

**Correção.** Um juiz calibrado contra expertise de domínio. LLM-como-juiz genérico vai deixar passar "quinta-feira, 32 de março" do mesmo jeito que humanos batendo o olho vão deixar passar. Juízes calibrados por domínio — ancorados contra avaliações de especialistas de domínio — não vão.

---

## As 10 falhas mapeadas para o pipeline

<figure style="margin: 1.5rem auto; max-width: 100%;">
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 900 420" font-family="'DM Sans', -apple-system, sans-serif" role="img" aria-label="Matriz mapeando os dez modos de falha para os quatro estágios do pipeline. Estágio 1 Registrar pega as falhas 1 (mudanças co-deployadas), 2 (prompts não versionados) e 3 (skew entre treino e serving). Estágio 2 Gatear pega as falhas 4 (regressão por slice de licenciamento de PI), 5 (regressão por slice de oncologia pediátrica), 6 (drift de sub-linguagem multilíngue) e 7 (burlar o gate sem justificativa de override). Estágio 3 Rolar pega a falha 8 (rollout de um passo). Estágio 4 Observar pega as falhas 9 (esquiva silenciosa) e 10 (datas alucinadas).">
<title>Modos de falha por estágio do pipeline</title>
<rect width="900" height="420" fill="#faf8f5"/>
<text x="40" y="36" font-size="16" font-weight="700" fill="#1e3a2b">Onde cada falha é pega</text>
<text x="40" y="56" font-size="12" fill="#6b5d4f">Três regressões por slice caem no Gate. Duas quedas silenciosas de qualidade caem no Observar. O resto se distribui entre Registrar e Rolar.</text>
<g>
<rect x="40" y="90" width="200" height="40" fill="#2d5a4f" rx="6"/>
<text x="140" y="116" text-anchor="middle" font-size="14" font-weight="700" fill="#faf8f5">① REGISTRAR</text>
<rect x="250" y="90" width="200" height="40" fill="#2d5a4f" rx="6"/>
<text x="350" y="116" text-anchor="middle" font-size="14" font-weight="700" fill="#faf8f5">② GATEAR</text>
<rect x="460" y="90" width="200" height="40" fill="#2d5a4f" rx="6"/>
<text x="560" y="116" text-anchor="middle" font-size="14" font-weight="700" fill="#faf8f5">③ ROLAR</text>
<rect x="670" y="90" width="200" height="40" fill="#2d5a4f" rx="6"/>
<text x="770" y="116" text-anchor="middle" font-size="14" font-weight="700" fill="#faf8f5">④ OBSERVAR</text>
</g>
<g>
<rect x="40" y="145" width="200" height="55" fill="#ffffff" stroke="#b8a080" stroke-width="1" rx="4"/>
<text x="50" y="163" font-size="11" font-weight="700" fill="#1e3a2b">1. Mudanças co-deployadas</text>
<text x="50" y="178" font-size="10" fill="#6b5d4f">modelo + prompt + roteamento</text>
<text x="50" y="191" font-size="10" fill="#6b5d4f">agrupados silenciosamente</text>
<rect x="40" y="210" width="200" height="55" fill="#ffffff" stroke="#b8a080" stroke-width="1" rx="4"/>
<text x="50" y="228" font-size="11" font-weight="700" fill="#1e3a2b">2. Prompts não versionados</text>
<text x="50" y="243" font-size="10" fill="#6b5d4f">edição no dashboard</text>
<text x="50" y="256" font-size="10" fill="#6b5d4f">burla o gate</text>
<rect x="40" y="275" width="200" height="55" fill="#ffffff" stroke="#b8a080" stroke-width="1" rx="4"/>
<text x="50" y="293" font-size="11" font-weight="700" fill="#1e3a2b">3. Skew treino-serving</text>
<text x="50" y="308" font-size="10" fill="#6b5d4f">pré-processamento diverge</text>
<text x="50" y="321" font-size="10" fill="#6b5d4f">entre offline e online</text>
</g>
<g>
<rect x="250" y="145" width="200" height="55" fill="#ffffff" stroke="#a04848" stroke-width="1" rx="4"/>
<text x="260" y="163" font-size="11" font-weight="700" fill="#a04848">4. Slice de licenciamento PI</text>
<text x="260" y="178" font-size="10" fill="#6b5d4f">slice 0,41, agregado 0,64</text>
<text x="260" y="191" font-size="10" fill="#6b5d4f">agregado enviaria</text>
<rect x="250" y="210" width="200" height="55" fill="#ffffff" stroke="#a04848" stroke-width="1" rx="4"/>
<text x="260" y="228" font-size="11" font-weight="700" fill="#a04848">5. Oncologia pediátrica</text>
<text x="260" y="243" font-size="10" fill="#6b5d4f">slice cai 11 pontos</text>
<text x="260" y="256" font-size="10" fill="#6b5d4f">agregado enviaria</text>
<rect x="250" y="275" width="200" height="55" fill="#ffffff" stroke="#a04848" stroke-width="1" rx="4"/>
<text x="260" y="293" font-size="11" font-weight="700" fill="#a04848">6. Sub-drift multilíngue</text>
<text x="260" y="308" font-size="10" fill="#6b5d4f">francês belga regride</text>
<text x="260" y="321" font-size="10" fill="#6b5d4f">agregado enviaria</text>
<rect x="250" y="340" width="200" height="55" fill="#ffffff" stroke="#b8a080" stroke-width="1" rx="4"/>
<text x="260" y="358" font-size="11" font-weight="700" fill="#1e3a2b">7. Burlar override</text>
<text x="260" y="373" font-size="10" fill="#6b5d4f">requer justificativa escrita</text>
<text x="260" y="386" font-size="10" fill="#6b5d4f">+ entrada de auditoria</text>
</g>
<g>
<rect x="460" y="145" width="200" height="55" fill="#ffffff" stroke="#b8a080" stroke-width="1" rx="4"/>
<text x="470" y="163" font-size="11" font-weight="700" fill="#1e3a2b">8. Rollout 0% → 100%</text>
<text x="470" y="178" font-size="10" fill="#6b5d4f">sem dwell no checkpoint</text>
<text x="470" y="191" font-size="10" fill="#6b5d4f">bugs de cauda longa em escala</text>
</g>
<g>
<rect x="670" y="145" width="200" height="55" fill="#ffffff" stroke="#a04848" stroke-width="1" rx="4"/>
<text x="680" y="163" font-size="11" font-weight="700" fill="#a04848">9. Esquiva silenciosa</text>
<text x="680" y="178" font-size="10" fill="#6b5d4f">latência + 5xx inalterados</text>
<text x="680" y="191" font-size="10" fill="#6b5d4f">o juiz pega</text>
<rect x="670" y="210" width="200" height="55" fill="#ffffff" stroke="#a04848" stroke-width="1" rx="4"/>
<text x="680" y="228" font-size="11" font-weight="700" fill="#a04848">10. Datas alucinadas</text>
<text x="680" y="243" font-size="10" fill="#6b5d4f">"32 de março"</text>
<text x="680" y="256" font-size="10" fill="#6b5d4f">juiz de domínio pega</text>
</g>
</svg>
</figure>

As barras coloridas em vermelho são as falhas que encontramos *enquanto* enviávamos este pipeline — elas são a razão pela qual acabamos construindo especificamente o gate por slice e o observador de replay de traços, em vez de enviar um canário genérico com métricas de infra como todo mundo faz.

## O que torna CI/CD de LLM diferente de CI/CD de software?

A versão curta: um release de LLM não é um artefato determinístico. O mesmo prompt produz saídas diferentes entre execuções. O mesmo conjunto de avaliação produz pontuações diferentes em hardwares diferentes. O mesmo modelo pode passar em uma verificação agregada de qualidade enquanto falha silenciosamente em um slice que você não incluiu no eval. A maioria das suposições sobre as quais o CI/CD tradicional foi construído não sobrevive ao contato com um sistema probabilístico.

Três consequências concretas:

1. **Você não pode escrever assertions `expect(output).toEqual(X)`.** Você precisa de uma avaliação ciente de distribuição que consome correlação de rank contra um avaliador ancorado em humano, não igualdade contra uma fixture.
2. **Um modelo "passou no CI" pode enviar comportamento quebrado.** Os passes de CI significam que o código roda. Eles não significam que o modelo está certo. O pipeline de release precisa impor um gate de *qualidade* em cima do gate de *correção* que o CI fornece.
3. **Rollback não é opcional e não é lento.** Porque modos de falha são probabilísticos — e porque alguns deles são silenciosos na camada de infraestrutura — o caminho de rollback precisa ser infraestrutura primária, não um plano de backup. O manifesto de release existe especificamente para tornar o rollback atômico.

O primeiro post desta série descreve a arquitetura de quatro estágios que responde a essas consequências. Este post descreve as falhas que ela pega.

## Como construir um pipeline CI/CD resistente a falhas para LMs customizados?

A resposta honesta: você aceita que falhas vão acontecer e minimiza o tempo entre *ocorrência da falha* e *tráfego de produção retornando a uma versão conhecida-boa*. O pipeline de quatro estágios acima é uma implementação específica desse princípio, mas o princípio em si é o que importa.

Se você não estiver usando a Divinci e quiser construir algo equivalente, as peças que sustentam o sistema são:

- **Um manifesto de release imutável** que agrupa modelo + prompt + roteamento + dataset + pré-processamento em um único SHA. É isso que torna 1, 2 e 3 capturáveis. ([Estágio 1](/pt/blog/how-to-build-an-llm-ci-cd-pipeline-with-divinci-ai/#stage-1-register))
- **Um gate por slice** com limiares definidos pelos donos do domínio, não pelos donos da plataforma. É isso que torna 4, 5, 6 capturáveis. ([Estágio 2](/pt/blog/how-to-build-an-llm-ci-cd-pipeline-with-divinci-ai/#stage-2-gate))
- **Um canário com monitoramento de qualidade em cada checkpoint**, não só latência e 5xx. É isso que torna 8 capturável e o que torna 9 e 10 *sobreviváveis* quando atingem a produção. ([Estágio 3](/pt/blog/how-to-build-an-llm-ci-cd-pipeline-with-divinci-ai/#stage-3-roll))
- **Um observador contínuo** que pontua traços reais de produção através do modelo ativo com o mesmo juiz calibrado que alimentou o gate. É isso que torna 9 e 10 capturáveis. ([Estágio 4](/pt/blog/how-to-build-an-llm-ci-cd-pipeline-with-divinci-ai/#stage-4-observe-rollback-and-the-receipt))
- **Um recibo de auditoria assinado para cada decisão.** Encadeado por hash, externamente ancorável. Para modelos com backing open-weights, o recibo embute uma [atestação de pesos vIndex](/pt/compliance/) provando que os pesos ativos são o que o manifesto registrou. Para backings de API fechada, o recibo cobre a cadeia de decisão mas não pode reivindicar proveniência de pesos — e a trilha de auditoria diz isso explicitamente.

As peças não são inéditas individualmente. Toda plataforma MLOps tem uma ou duas delas. A combinação — gate por slice + observador de traços de produção + rollback atômico + recibo provável — é a parte que ninguém mais envia em 2026.

## Para onde ir em seguida

- O post companheiro — **[Como Construir um Pipeline CI/CD para LLM com a Divinci AI](/pt/blog/how-to-build-an-llm-ci-cd-pipeline-with-divinci-ai/)** — cobre a arquitetura e a API.
- A **[página de compliance](/pt/compliance/)** documenta o formato de recibo vIndex que respalda cada decisão de release e como ele mapeia para o EU AI Act, Artigo 17 do GDPR, HIPAA e NIST AI RMF.
- A **[página de produto do AutoRAG](/pt/autorag/)** cobre a redução de alucinação do lado RAG que se combina naturalmente com o juiz calibrado que dirige o Gate-2 e o observador do Estágio 4.
- A **[referência da API](/pt/api/)** — todo comando referenciado nesta série é um endpoint real.

## FAQ

### Qual é a falha de CI/CD mais comum para modelos de linguagem customizados?

Entre os releases que enviamos, a falha mais danosa de longe é **uma regressão por slice que passa em um gate agregado** — um modelo que melhora na média enquanto colapsa silenciosamente em um subdomínio específico (falhas 4, 5 e 6 acima). É mais comum que rollback faltante, mais comum que drift de prompt e mais difícil de detectar que ambos. A correção é estrutural, não ajuste de parâmetro: gateie por slice, não na média.

### Quão rápido você deveria conseguir fazer rollback de um release ruim de LLM?

Ordem de grandeza de segundos, não minutos. O tempo médio de rollback no pipeline da Divinci é de cerca de 12 segundos — isso é a drenagem de requests em voo em um serviço de ~100 réplicas, não a troca do manifesto em si, que é sub-segundo. A decisão arquitetural que torna isso possível é o manifesto de release agrupado: como cada componente (pesos, prompt, roteamento, dataset) é referenciado a partir de um único SHA, o rollback é um único re-apontamento atômico. Compare isso com postmortems públicos: o incidente da Cloudflare de junho de 2022<sup><a href="#ref-3">[3]</a></sup> levou 44 minutos para reverter porque engenheiros estavam pisando nas reversões uns dos outros; o outage da Atlassian de abril de 2022<sup><a href="#ref-4">[4]</a></sup> levou 12 horas por site afetado para restaurar porque o estado estava espalhado por múltiplos sistemas.

### Por que mudanças de prompt causam tantos outages de produção?

Porque prompts são rotineiramente editados fora do pipeline de CI/CD — em dashboards, em UIs administrativas, às vezes por pessoas sem revisão de engenharia. Eles são tratados como configuração, mas se comportam como código. Uma edição de 38 caracteres em um prompt de sistema pode mudar o comportamento do modelo downstream mais do que um retreinamento. A correção é registrar prompts como parte do manifesto de release e exigir que eles passem no mesmo gate em que o modelo passa.

### Como você detecta degradação silenciosa de qualidade em saídas de LLM?

Não com métricas de infraestrutura. Latência, taxa de 5xx e uso de tokens não vão pegar esquiva, recusa-quando-uma-resposta-era-esperada ou datas alucinadas. O sinal de detecção tem que vir de uma pontuação de *qualidade* computada por um juiz calibrado contra traços reais de produção. O observador do Estágio 4 no pipeline da Divinci faz replay de uma amostra rolante de traços de produção através do modelo ativo, os pontua com o mesmo juiz Spearman ancorado em humano que alimentou o Gate-2 e dispara rollback automático quando a pontuação de qualidade cai abaixo do limiar por três minutos consecutivos.

### Quais requisitos de trilha de auditoria se aplicam a deployments de modelos de IA?

O EU AI Act, o Artigo 17 do GDPR (direito ao esquecimento), o HIPAA e o NIST AI Risk Management Framework, todos exigem que organizações mantenham registros de versões de modelo, resultados de avaliação, decisões de aprovação e rollouts. O requisito não dito sob os quatro é que os registros precisam ser *verificáveis* — auditável significa mais do que "temos um log". Os recibos vIndex da Divinci são encadeados por hash e externamente ancoráveis, o que significa que um auditor pode verificar a cadeia sem confiar nos nossos logs. Para backings de modelo open-weights, o recibo também embute uma atestação de pesos; para backings de API fechada, o recibo nota explicitamente que a proveniência de pesos não é reivindicada.

## Referências

<ol class="post-references" style="padding-left: 1.5rem;">
  <li id="ref-1" style="scroll-margin-top: 90px; margin-bottom: 0.9rem;">
    <a href="https://tianpan.co/blog/2026-04-29-semver-lie-llm-minor-update-breaks-production" target="_blank" rel="noopener">Tianpan — <em>The Semver Lie: how an LLM minor update breaks production</em></a> (April 2026). Nomeia o modo de falha de edição-de-prompt-no-dashboard diretamente. Companheiro: <a href="https://tianpan.co/blog/2026-04-27-llm-postmortem-template-fields-sre-missed" target="_blank" rel="noopener"><em>LLM postmortem template — fields SRE missed</em></a>.
  </li>
  <li id="ref-2" style="scroll-margin-top: 90px; margin-bottom: 0.9rem;">
    <a href="https://docs.aws.amazon.com/sagemaker/latest/dg/deployment-guardrails-blue-green-canary.html" target="_blank" rel="noopener">AWS SageMaker — <em>Use canary traffic shifting</em></a>. O auto-rollback padrão dirigido por métrica de infraestrutura. Comparação útil para o que o Estágio 4 Observar está fazendo de diferente (pontuação de qualidade, não alarmes CloudWatch).
  </li>
  <li id="ref-3" style="scroll-margin-top: 90px; margin-bottom: 0.9rem;">
    <a href="https://blog.cloudflare.com/cloudflare-outage-on-june-21-2022/" target="_blank" rel="noopener">Cloudflare — <em>Cloudflare outage on June 21, 2022</em></a>. Reversão de 44 minutos porque engenheiros pisavam nas reversões uns dos outros. Citado como a âncora "rollback é o seu próprio tipo de incidente".
  </li>
  <li id="ref-4" style="scroll-margin-top: 90px; margin-bottom: 0.9rem;">
    <a href="https://www.atlassian.com/blog/atlassian-engineering/post-incident-review-april-2022-outage" target="_blank" rel="noopener">Atlassian — <em>Post-Incident Review: April 2022 Outage</em></a>. 12 horas por site para restaurar. Modo de falha de estado-espalhado-por-sistemas em sua pior forma.
  </li>
  <li id="ref-5" style="scroll-margin-top: 90px; margin-bottom: 0.9rem;">
    <a href="https://dora.dev/guides/dora-metrics/" target="_blank" rel="noopener">DORA — <em>Software delivery performance metrics</em></a>. O limiar de elite-performer para "failed deployment recovery time" é documentado como menos de uma hora. Enquadramento útil para "quão rápido é rápido o suficiente" em rollback.
  </li>
  <li id="ref-6" style="scroll-margin-top: 90px; margin-bottom: 0.9rem;">
    <a href="https://arxiv.org/abs/2306.05685" target="_blank" rel="noopener">Zheng et al., <em>Judging LLM-as-a-Judge with MT-Bench and Chatbot Arena</em></a> (arXiv:2306.05685, 2023). A referência para por que LLM-como-juiz pode equiparar avaliações humanas no geral, mas variar amplamente por categoria — que é exatamente o padrão que torna o gateamento por slice necessário.
  </li>
</ol>

---

*Próximo nesta série:* **Validar e fazer release de LMs customizados em domínios regulados.** O pipeline acima é a arquitetura. O caminho de compliance é a prática de usá-lo. EU AI Act, Artigo 17 do GDPR, HIPAA e NIST AI RMF — o que cada um pede de um processo de release, e quais campos do recibo vIndex cobrem qual requisito.
