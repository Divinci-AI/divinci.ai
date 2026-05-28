+++
title = "Testes de CI para Modelos de Linguagem Personalizados em 2026"
description = "Testes de contrato, smoke budget, dimensionamento de frota cost-aware e shadow CI. Manter uma suíte de avaliação de 12 min tratável em cada PR."
date = 2026-05-26T09:30:00+00:00
template = "blog-post.html"

[taxonomies]
categories = ["Product"]
tags = ["CI/CD", "LLM Ops", "Testing", "Evaluation", "Release Management", "Engineering Productivity"]

[extra]
author = "Mike Mooring"
author_avatar = "images/Michael-Mooring.png"
hero_video = "https://pub-fb3e683317b24cf8b4260121edae02be.r2.dev/ci-testing-for-custom-language-models-in-2026-veo31.webm"
hero_video_poster = "/images/ci-testing-for-custom-language-models-in-2026-hero-poster.webp"
featured_image = "images/ci-testing-for-custom-language-models-in-2026-hero.png"
reading_time = 13
summary = "A suíte de regressão do post 7 custa dinheiro real para rodar em cada PR. Veja como mantemos a mesma cobertura por uma fração do custo — testes de contrato em menos de um segundo, uma camada de smoke de 90 segundos, cache de embeddings + batching de juízes, e uma janela shadow de 2 semanas antes de qualquer gate começar a bloquear. O post final da série."
+++

*Notas do Ciclo de Release — Parte 8 (final)*

Você entrega a suíte de regressão do [post 7](/pt/blog/automated-regression-testing-for-custom-llms-in-2026/). Funciona. Os gates conscientes de fatia capturam bugs reais. O juiz calibrado se mantém.

Então seu líder de engenharia pergunta quanto custa rodar isso em cada PR. Você faz a multiplicação: ~12 minutos de inferência de juiz por PR, 60 PRs por dia, quatro dimensões × dezessete fatias, e a conta é dinheiro real. Pior, todo desenvolvedor agora espera 12 minutos por um check verde em um typo de uma linha no prompt. A velocidade cai<sup><a href="#ref-1">[1]</a></sup>, a equipe resmunga, alguém propõe "rodar os gates apenas à noite" — que é precisamente como você abre mão de tudo o que os gates deveriam fazer.

A solução não é menos testes. A solução é **testar em camadas, com a maior parte do sinal chegando nos primeiros noventa segundos.** Este post é o que roda por baixo da suíte de gates: testes de contrato em menos de um segundo, uma camada de smoke enxuta, uma frota consciente de custo e uma janela shadow de duas semanas antes que qualquer novo gate bloqueie alguém.

Este é o post 8, o último desta série. Ao final você terá o quadro completo — do [pipeline de quatro estágios](/pt/blog/how-to-build-an-llm-ci-cd-pipeline-with-divinci-ai/) até a fixture de teste de contrato que roda em cada commit.

## O que CI significa para um modelo de linguagem personalizado?

CI para um LLM personalizado é o trabalho que a suíte de gates não precisa repetir. O gate avalia a qualidade semântica; o CI captura tudo aquilo que tornaria a nota do gate irrelevante antes que o gate gaste um único token de juiz.

Testes de contrato rodam em milissegundos e verificam que os templates de prompt ainda renderizam, que os schemas de tool-call ainda fazem parse, que os índices de retrieval ainda respondem, que o manifest ainda referencia hashes que de fato existem. Eles são determinísticos, gratuitos e a única razão pela qual o restante do pipeline pode se permitir existir. Um pull request que quebra o template de prompt deveria falhar em 200 ms, não após 12 minutos de inferência de juiz avaliando absurdos.

A camada de contrato é a diferença entre uma conta de CI que escala linearmente com o volume de PRs e uma que não escala. O runner de CI da Divinci gasta > 90% do orçamento de juiz em avaliação semântica real, não em PRs que teriam falhado uma checagem de schema. Essa proporção é o número de manchete.

## Por que CI tradicional quebra para LLMs — sob a lente de custo

Os posts [1](/pt/blog/how-to-build-an-llm-ci-cd-pipeline-with-divinci-ai/) e [7](/pt/blog/automated-regression-testing-for-custom-llms-in-2026/) cobriram por que o CI determinístico falha para um modelo generativo. A versão dessa história que importa neste post é o **custo** dessas quatro propriedades, não a existência delas.

| Propriedade dos LLMs | Falha do CI tradicional | Formato do custo |
|---|---|---|
| Saídas não determinísticas | Asserções de match exato ficam flaky | Re-execuções amplificam custo linearmente com a taxa de flake |
| Qualidade multidimensional | Um único booleano não informa | Cada dimensão é uma chamada de juiz separada (paga) |
| Drift de provedor | `gpt-4-2024-01-01` fixado é silenciosamente aposentado | Rajada de recalibração quando um provedor desativa um checkpoint |
| Efeitos não locais de prompt | Teste unitário local não captura o efeito | A forma da distribuição muda entre PRs, não dentro deles — exige re-execução de suíte inteira, não delta |

A arquitetura de CI precisa tornar cada uma dessas tratáveis financeiramente. Testes de contrato lidam com as propriedades 1 e 3 de forma barata. Testes de smoke lidam com a propriedade 4 parcialmente. Apenas a suíte completa lida com a propriedade 2 — e apenas nos PRs que realmente precisam dela.

## O bolo de camadas de CI — de menos de um segundo a vinte e cinco minutos

A arquitetura que entregamos tem quatro camadas, cada uma justificando seu compute ao capturar o que as camadas mais baratas abaixo não conseguem. O enquadramento consciente de fatia de cada camada segue a mesma lição que o [postmortem do Semver Lie de Tianpan](/pt/blog/automated-regression-testing-for-custom-llms-in-2026/) tornou explícita<sup><a href="#ref-4">[4]</a></sup>: sinais agregados mentem; sinais por fatia capturam o que os agregados escondem.

<figure style="margin: 2rem 0;">
<svg viewBox="0 0 900 460" xmlns="http://www.w3.org/2000/svg" style="width: 100%; max-width: 100%; height: auto;" role="img" aria-label="Arquitetura de CI em quatro camadas: testes de contrato em menos de um segundo, smoke em 90s, suíte completa em 12 minutos, replay de traces de produção em 25 minutos">
<rect width="900" height="460" fill="#faf8f5"/>
<text x="450" y="34" font-family="'DM Sans', -apple-system, sans-serif" font-size="20" font-weight="700" fill="#1e3a2b" text-anchor="middle">Bolo de camadas de CI — cada camada afunila os PRs que chegam à próxima</text>
<text x="450" y="58" font-family="'DM Sans', -apple-system, sans-serif" font-size="13" fill="#5a6862" text-anchor="middle">A maioria dos PRs toca apenas nas duas camadas superiores. Os custos por PR são internos — medidos no CI de produção da Divinci.</text>
<g transform="translate(60, 100)">
<rect x="0" y="0" width="780" height="62" fill="#7a8a4a" rx="4"/>
<text x="20" y="28" font-family="'DM Sans', sans-serif" font-size="15" font-weight="700" fill="#faf8f5">① Contrato · cada commit · &lt; 1 s · ~US$ 0,00</text>
<text x="20" y="48" font-family="'DM Sans', sans-serif" font-size="12" fill="#e8ebd8">schema · renderização de template · denylist · integridade do manifest · vivacidade do índice</text>
<text x="775" y="38" font-family="'DM Sans', sans-serif" font-size="13" font-weight="700" fill="#faf8f5" text-anchor="end">100% dos commits</text>
<rect x="60" y="78" width="720" height="62" fill="#5a7a8f" rx="4"/>
<text x="80" y="106" font-family="'DM Sans', sans-serif" font-size="15" font-weight="700" fill="#faf8f5">② Smoke · cada PR · ~90 s · ~US$ 0,05</text>
<text x="80" y="126" font-family="'DM Sans', sans-serif" font-size="12" fill="#dde6ec">20–30 casos críticos nas 3 fatias principais · apenas tarefa + segurança</text>
<text x="775" y="116" font-family="'DM Sans', sans-serif" font-size="13" font-weight="700" fill="#faf8f5" text-anchor="end">100% dos PRs</text>
<rect x="120" y="156" width="660" height="62" fill="#5a7a8f" rx="4" opacity="0.85"/>
<text x="140" y="184" font-family="'DM Sans', sans-serif" font-size="15" font-weight="700" fill="#faf8f5">③ Suíte completa · PRs de prompt / modelo / retrieval · ~12 min · ~US$ 0,80</text>
<text x="140" y="204" font-family="'DM Sans', sans-serif" font-size="12" fill="#dde6ec">~500 casos · 4 dimensões · todas as fatias · gates de Spearman por fatia</text>
<text x="775" y="194" font-family="'DM Sans', sans-serif" font-size="13" font-weight="700" fill="#faf8f5" text-anchor="end">~22% dos PRs</text>
<rect x="180" y="234" width="600" height="62" fill="#2d5a4f" rx="4"/>
<text x="200" y="262" font-family="'DM Sans', sans-serif" font-size="15" font-weight="700" fill="#faf8f5">④ Replay de traces de produção · release candidates · ~25 min · ~US$ 2,40</text>
<text x="200" y="282" font-family="'DM Sans', sans-serif" font-size="12" fill="#c8d8d0">janela de replay de 14 dias · mesmo juiz calibrado · análise de gap offline ↔ replay</text>
<text x="775" y="272" font-family="'DM Sans', sans-serif" font-size="13" font-weight="700" fill="#faf8f5" text-anchor="end">~4% dos PRs</text>
</g>
<g transform="translate(60, 410)">
<rect x="0" y="0" width="780" height="34" fill="#1e3a2b" rx="4"/>
<text x="20" y="22" font-family="'DM Sans', sans-serif" font-size="13" font-weight="600" fill="#faf8f5">Custo agregado por PR (ponderado pelo funil): ~US$ 0,27. Wall-clock p95 agregado: ~3,4 min.</text>
</g>
</svg>
<figcaption style="text-align: center; font-style: italic; color: #5a6862; font-size: 0.9rem; margin-top: 0.5rem;">Wall-clock por camada, custo por camada e razões de funil são internos — medidos no CI de produção da Divinci para um cliente representativo (~500 casos no golden dataset, 17 fatias, ~60 PRs/dia).</figcaption>
</figure>

O formato do custo é o design. ~74% dos PRs nunca gastam um token de juiz — contrato ou smoke é suficiente. Os PRs que chegam à suíte completa são aqueles que tocaram um prompt, uma configuração de modelo, um índice de retrieval ou código de avaliação — exatamente as mudanças onde a suíte de gates é o único sinal que vale a pena confiar. Release candidates são a pequena parcela que chega à Camada 4.

## Testes de contrato — a vantagem injusta

Testes de contrato são a primeira linha, a linha mais barata e a linha que a maioria das equipes pula porque parece abaixo da dignidade de um "pipeline de avaliação de IA". Eles também são onde 30–40% das regressões em potencial de fato falham nas suítes de nossos clientes, antes que um único juiz seja chamado.

A camada de contrato afirma cinco coisas e nada mais:

1. **Renderização do template de prompt.** Cada template renderiza contra uma fixture canônica sem variáveis não vinculadas, loops desenfreados ou includes Jinja-like quebrados.
2. **Schema de tool-call.** O schema de argumentos de cada tool declarada faz parse, o JSONSchema é válido e o prompt renderizado de fato referencia todos os slots obrigatórios.
3. **Integridade do manifest.** Cada SHA no manifest de release — modelo, prompt, índice de retrieval, juiz, dataset — corresponde a um artefato que existe no registry. Ponteiros pendurados falham aqui, não três camadas adiante.
4. **Vivacidade do índice.** O índice de retrieval responde a uma query conhecida dentro do orçamento. Um índice reconstruído que silenciosamente quebrou o retrieval aparece aqui, não em produção.
5. **Denylist e orçamento de tokens.** Qualquer template de prompt que introduziu um token proibido, estourou o orçamento de tokens por chamada ou renderizou além da janela de contexto falha aqui. Pontuação heurística de similaridade semântica<sup><a href="#ref-6">[6]</a></sup> também é barata o suficiente para rodar na camada de contrato em cobertura de denylist com correspondência fuzzy onde a correspondência por string literal é insuficiente.

```bash
# Uma invocação representativa de teste de contrato — roda em aproximadamente 600 ms
divinci ci contract \
  --manifest release/staging.yaml \
  --check schema,template,manifest,index,denylist \
  --fail-fast \
  --json-out /tmp/contract-report.json
```

Nenhuma dessas verificações chama um juiz. Nenhuma delas é não determinística. Nenhuma delas custa dinheiro mensurável. E cada uma delas elimina uma classe inteira de alertas do tipo "a suíte de gates disse que a fatia médica regrediu" que teria desperdiçado 12 minutos completos de inferência de juiz pontuando uma saída que o modelo jamais poderia ter produzido corretamente em primeiro lugar.

## A camada de smoke — 90 segundos, ~US$ 0,05 por PR

Se a camada de contrato é a vantagem injusta barata, a camada de smoke é a que de fato captura regressões por menos do que o preço de um café. Vinte a trinta casos retirados das fatias de maior volume, pontuados em **conclusão de tarefa e segurança apenas**, sem fidelidade, sem latência, sem checagens com fundamentação em retrieval. Cada PR roda isso. Leva cerca de 90 segundos porque os casos são agrupados em uma única chamada de juiz com schema de saída estruturada, e porque o juiz é o juiz calibrado barato — não o de qualidade plena usado para release candidates.

Acompanhamos qual camada capturou cada correção entregue em um log de regressão, e o histograma tem sido consistente nos últimos seis meses nas implantações de clientes:

<figure style="margin: 2rem 0;">
<svg viewBox="0 0 900 360" xmlns="http://www.w3.org/2000/svg" style="width: 100%; max-width: 100%; height: auto;" role="img" aria-label="Gráfico de barras mostrando onde as regressões são capturadas: 31 por cento na camada de contrato, 27 por cento no smoke, 28 por cento na suíte completa, 11 por cento no replay, 3 por cento escapam para produção">
<rect width="900" height="360" fill="#faf8f5"/>
<text x="450" y="34" font-family="'DM Sans', -apple-system, sans-serif" font-size="19" font-weight="700" fill="#1e3a2b" text-anchor="middle">Onde as regressões são capturadas — por camada, últimos 6 meses em implantações de clientes</text>
<text x="450" y="56" font-family="'DM Sans', -apple-system, sans-serif" font-size="13" fill="#5a6862" text-anchor="middle">A maioria das regressões morre nas camadas mais baratas. As camadas caras justificam seu custo no resíduo.</text>
<g transform="translate(90, 100)">
<line x1="0" y1="200" x2="780" y2="200" stroke="#1e3a2b" stroke-width="1.5"/>
<g font-family="'DM Sans', sans-serif" font-size="11" fill="#5a6862">
<text x="-10" y="4" text-anchor="end">40%</text><line x1="-4" y1="0" x2="0" y2="0" stroke="#1e3a2b"/>
<text x="-10" y="54" text-anchor="end">30%</text><line x1="-4" y1="50" x2="0" y2="50" stroke="#1e3a2b"/>
<text x="-10" y="104" text-anchor="end">20%</text><line x1="-4" y1="100" x2="0" y2="100" stroke="#1e3a2b"/>
<text x="-10" y="154" text-anchor="end">10%</text><line x1="-4" y1="150" x2="0" y2="150" stroke="#1e3a2b"/>
<text x="-10" y="204" text-anchor="end">0%</text>
</g>
<g>
<rect x="40" y="45" width="120" height="155" fill="#7a8a4a" stroke="#1e3a2b" stroke-width="1"/>
<text x="100" y="36" font-family="'DM Sans', sans-serif" font-size="20" font-weight="700" fill="#1e3a2b" text-anchor="middle">31%</text>
<text x="100" y="222" font-family="'DM Sans', sans-serif" font-size="13" font-weight="600" fill="#1e3a2b" text-anchor="middle">Contrato</text>
<text x="100" y="238" font-family="'DM Sans', sans-serif" font-size="11" fill="#5a6862" text-anchor="middle">&lt; 1 s · US$ 0,00</text>
</g>
<g>
<rect x="190" y="65" width="120" height="135" fill="#5a7a8f" stroke="#1e3a2b" stroke-width="1"/>
<text x="250" y="56" font-family="'DM Sans', sans-serif" font-size="20" font-weight="700" fill="#1e3a2b" text-anchor="middle">27%</text>
<text x="250" y="222" font-family="'DM Sans', sans-serif" font-size="13" font-weight="600" fill="#1e3a2b" text-anchor="middle">Smoke</text>
<text x="250" y="238" font-family="'DM Sans', sans-serif" font-size="11" fill="#5a6862" text-anchor="middle">90 s · US$ 0,05</text>
</g>
<g>
<rect x="340" y="60" width="120" height="140" fill="#5a7a8f" stroke="#1e3a2b" stroke-width="1" opacity="0.85"/>
<text x="400" y="51" font-family="'DM Sans', sans-serif" font-size="20" font-weight="700" fill="#1e3a2b" text-anchor="middle">28%</text>
<text x="400" y="222" font-family="'DM Sans', sans-serif" font-size="13" font-weight="600" fill="#1e3a2b" text-anchor="middle">Suíte completa</text>
<text x="400" y="238" font-family="'DM Sans', sans-serif" font-size="11" fill="#5a6862" text-anchor="middle">12 min · US$ 0,80</text>
</g>
<g>
<rect x="490" y="145" width="120" height="55" fill="#2d5a4f" stroke="#1e3a2b" stroke-width="1"/>
<text x="550" y="136" font-family="'DM Sans', sans-serif" font-size="20" font-weight="700" fill="#1e3a2b" text-anchor="middle">11%</text>
<text x="550" y="222" font-family="'DM Sans', sans-serif" font-size="13" font-weight="600" fill="#1e3a2b" text-anchor="middle">Replay</text>
<text x="550" y="238" font-family="'DM Sans', sans-serif" font-size="11" fill="#5a6862" text-anchor="middle">25 min · US$ 2,40</text>
</g>
<g>
<rect x="640" y="185" width="120" height="15" fill="#a04848" stroke="#1e3a2b" stroke-width="1"/>
<text x="700" y="176" font-family="'DM Sans', sans-serif" font-size="20" font-weight="700" fill="#a04848" text-anchor="middle">3%</text>
<text x="700" y="222" font-family="'DM Sans', sans-serif" font-size="13" font-weight="600" fill="#a04848" text-anchor="middle">Escaparam</text>
<text x="700" y="238" font-family="'DM Sans', sans-serif" font-size="11" fill="#a04848" text-anchor="middle">→ rollback</text>
</g>
</g>
</svg>
<figcaption style="text-align: center; font-style: italic; color: #5a6862; font-size: 0.9rem; margin-top: 0.5rem;">Agregado móvel de seis meses nas implantações ativas de CI Divinci. Reportado como o % de regressões confirmadas em que a camada nomeada foi a primeira a falhar. Interno — medido por nós.</figcaption>
</figure>

Os 3% que escapam são a razão pela qual o [rollback instantâneo do post 5](/pt/blog/automated-llm-ci-cd-pipelines-with-instant-rollback/) existe. Os gates não prometem zero escapes; eles prometem um limite superior apertado e uma recuperação rápida para o que passar.

## Dimensionamento da frota de CI — como a suíte de 12 minutos se mantém barata

A camada de suíte completa é onde a matemática precisa fechar. Uma implementação ingênua chama o juiz uma vez por caso-por-dimensão, roda sequencialmente, e a conta escala linearmente com a contagem de casos. Três otimizações fazem a maior parte do trabalho para mantê-la tratável:

**Cache de embeddings.** A impressão digital do contexto de retrieval para cada caso do golden dataset é hashada; se o caso não mudou e o índice de retrieval não mudou, o embedding em cache vale e o passo de retrieval é pulado. A taxa de hit após a primeira semana estável é consistentemente acima de 90% em nossas implantações de clientes.

**Batching de juiz.** O juiz calibrado é chamado com saída estruturada, agrupando 8–16 casos por chamada. O custo por token do juiz permanece o mesmo; o overhead por caso cai porque o system prompt é amortizado pelo batch. O limiar para batching seguro é definido pela própria concordância calibrada do juiz nesse tamanho de batch<sup><a href="#ref-2">[2]</a></sup> — medimos isso durante a passagem semanal de calibração de juiz ([post 7](/pt/blog/automated-regression-testing-for-custom-llms-in-2026/)).

**Reuso de KV-cache entre casos.** Para modelos onde o mesmo system prompt e definições de tools encabeçam toda chamada, o KV cache desse prefixo é computado uma vez por execução de suíte, não uma vez por caso<sup><a href="#ref-3">[3]</a></sup>. Em implantações open-weights isso é direto; em modelos de API fechada depende do suporte a prefix-caching do provedor.

O efeito combinado coloca a suíte completa aproximadamente nos números de custo mostrados no diagrama do bolo de camadas acima. As cifras exatas são internas, mas a proporção é a afirmação pública: **~74% dos PRs gastam zero dólares de juiz; ~22% gastam centavos; os 4% restantes gastam alguns dólares pelo sinal pré-rollout de maior confiança que sabemos produzir.**

## CI shadow — ative sem quebrar a equipe

O único erro que mais vimos equipes cometerem é virar um novo gate de "off" para "bloqueando" no primeiro dia. Os limiares foram ajustados com dados de ontem, a taxa de falsos positivos é desconhecida e na primeira vez que o gate dispara a equipe não tem calibração para saber se é real ou um falso alarme. O engenheiro de avaliação de plantão é paginado, o gate é desligado, a confiança se foi, o projeto está morto.

A solução é *CI shadow*: rodar o novo gate em modo não bloqueante por duas semanas, postar o resultado como um comentário de bot em cada PR e revisar a taxa de falsos positivos semanalmente antes de virar para bloqueante. O runner de CI da Divinci tem uma flag `--shadow` exatamente para isso. O comentário do PR fica igual à eventual versão bloqueante — mesmo display de diff, mesma quebra por fatia — exceto que não bloqueia o merge.

```bash
divinci ci run --layer=full --shadow --duration=14d --report-as=bot-comment
```

Quando a taxa de falsos positivos fica abaixo de 5% sustentada ao longo da janela, viramos. Quando não fica, apertamos os limiares por fatia, recalibramos o juiz e voltamos para shadow. De qualquer forma, a equipe não foi emboscada por um novo gate que dispara no primeiro dia.

## Um workflow do GitHub Actions que de fato compõe

A peça que amarra o bolo de camadas no seu CI existente roda em `.github/workflows/llm-ci.yaml`. As camadas são conectadas de modo que as baratas falhem rápido e as caras só rodem quando precisam — encadeamentos `needs:` e gatilhos filtrados por path fazem o trabalho<sup><a href="#ref-5">[5]</a></sup>.

```yaml
name: LLM CI
on:
  pull_request:
    paths:
      - 'prompts/**'
      - 'config/models.yaml'
      - 'eval/**'
      - 'retrieval/**'
      - 'manifests/**'
jobs:
  contract:
    runs-on: ubuntu-latest
    timeout-minutes: 2
    steps:
      - uses: actions/checkout@v4
      - run: divinci ci contract --manifest manifests/staging.yaml --fail-fast
  smoke:
    needs: contract
    runs-on: ubuntu-latest
    timeout-minutes: 5
    steps:
      - uses: actions/checkout@v4
      - run: divinci ci run --layer=smoke --post-pr-comment
        env:
          DIVINCI_API_KEY: ${{ secrets.DIVINCI_API_KEY }}
  full:
    needs: smoke
    if: contains(steps.changes.outputs.paths, 'prompts/') || contains(steps.changes.outputs.paths, 'config/models.yaml')
    runs-on: ubuntu-latest
    timeout-minutes: 20
    steps:
      - uses: actions/checkout@v4
      - run: divinci ci run --layer=full --post-pr-comment --gate
        env:
          DIVINCI_API_KEY: ${{ secrets.DIVINCI_API_KEY }}
```

Três coisas para notar. As camadas se encadeiam via `needs:`, então smoke não roda em um contrato quebrado e full não roda em smoke quebrado. O job `full` é filtrado por path para as mudanças que de fato justificam uma execução de 12 minutos — um typo no README não dispara a suíte de gates. A flag `--post-pr-comment` é o que torna o diff por fatia visível sem sair do GitHub.

## O loop de debug de PR que falhou

A outra metade de "o gate disparou" é "me mostra por quê". Uma saída de suíte de regressão dizendo `medical slice task-completion dropped 0.04` é inacionável sem os casos que causaram isso. Exibimos os cinco piores diffs por fatia no comentário do PR, com a entrada original, a saída de baseline, a saída candidata e o trace de raciocínio do juiz. O loop de debug deve levar segundos, não minutos:

```bash
# Puxe os 5 piores casos que dispararam o gate da fatia médica neste PR
divinci ci diffs --pr 1247 --slice medical --dimension task_completion --top 5
```

Essa é a mesma superfície diagnóstica da [árvore de sete passos do post 6](/pt/blog/how-to-diagnose-custom-llm-qa-failures-in-7-steps/), conectada ao loop de feedback do CI. O engenheiro que abriu o PR vê a evidência em nível de caso no próprio PR; ele não precisa ir abrir um dashboard de avaliação separado.

## Disciplina de controle de versão — prompts, datasets, juízes como código

Templates de prompt, golden datasets e prompts de juiz vivem todos no repo, com hash fixado no manifest de release. O manifest é o único objeto que amarra a suíte a um estado específico reproduzível:

```yaml
# manifests/staging.yaml — cada execução de CI faz hash deste arquivo
release_id: rel-staging
model:     { sha: 0c1f9…, weights: r2://models/custom-v7.2,  open_weights: true }
prompt:    { sha: c4a8e…, template: prompts/support/v3.4.j2 }
retrieval: { sha: b21f0…, index: r2://indices/kb-2026-04 }
judge:     { sha: d8e21…, rubric: eval/rubrics/v7.yaml }
dataset:   { sha: a90b1…, file:   eval/datasets/golden-2026-04.jsonl }
```

Quando uma execução de CI posta uma nota, a nota é taggeada com aquele hash do manifest. Quando uma nota se move, a pergunta "qual entrada se moveu" tem uma resposta direta: faça o diff do manifest, e a camada que disparou diz qual dimensão olhar primeiro. Este é o loop que o [pipeline de quatro estágios do post 1](/pt/blog/how-to-build-an-llm-ci-cd-pipeline-with-divinci-ai/) e o [recibo vindex do post 4](/pt/blog/validating-and-releasing-custom-lms-in-regulated-fields/) fecham juntos: o manifest é a primitiva de auditoria para a qual todos os oito destes posts, em enquadramentos diferentes, vêm convergindo.

## O que isto não resolve

As mesmas três limitações honestas que escrevemos em cada post desta série.

1. **CI não testa o que não está na suíte.** Por mais engenhoso que seja o bolo de camadas, as únicas regressões que ele captura são aquelas que algum caso no golden dataset teria sinalizado. A camada de replay mitiga isso para drift de comportamento, mas queries inéditas que nunca foram vistas ainda escapam até aparecerem em produção. O sistema precisa ser combinado com monitoramento em produção.
2. **Os números de custo mudam com o preço do modelo.** Toda cifra de custo neste post depende de taxas de token de juiz, taxas de embedding e taxas de inferência que mudam trimestralmente. As proporções — 74% / 22% / 4%, 31% / 27% / 28% / 11% / 3% — são as afirmações que carregam o peso; as cifras em dólares são ilustrativas para um momento no tempo.
3. **Mudanças de checkpoint do lado do provedor continuam difíceis.** Quando um provedor de API fechada atualiza silenciosamente o modelo por trás de um nome estável, a camada de contrato não consegue capturar; só a suíte de gates consegue, e só após o fato. Mitigamos fixando identificadores explícitos de checkpoint onde quer que o provedor suporte, e tratando o dia em que um checkpoint é anunciado como um evento que dispara um re-baseline da suíte completa. Não conseguimos evitar o problema subjacente.

## Fechando a série

Este é o post 8 de 8. O arco completo:

1. [Como Construir um Pipeline LLM CI/CD com Divinci AI](/pt/blog/how-to-build-an-llm-ci-cd-pipeline-with-divinci-ai/) — o pipeline de quatro estágios (Registrar / Gate / Roll / Observar) dentro do qual tudo desde então tem vivido.
2. [10 Falhas de Release CI/CD em Modelos de Linguagem Personalizados](/pt/blog/10-ci-cd-release-failures-in-custom-language-models/) — os modos de falha nomeados de 2026, cada um mapeado para o estágio que deveria tê-lo capturado.
3. [12 Capacidades de QA e Gestão de Release para LLMs](/pt/blog/12-qa-and-release-management-capabilities-for-llms/) — a matriz de capacidades e o diagrama de Venn dos três campos que posiciona a Divinci contra as alternativas.
4. [Validando e Liberando LMs Personalizados em Áreas Reguladas](/pt/blog/validating-and-releasing-custom-lms-in-regulated-fields/) — o mergulho profundo em compliance, mapeamento de regulador para estágio, recibos vindex.
5. [Pipelines Automatizados de LLM CI/CD com Rollback Instantâneo](/pt/blog/automated-llm-ci-cd-pipelines-with-instant-rollback/) — a camada operacional, espectro de automação, recibo de auto-rollback.
6. [Como Diagnosticar Falhas de QA de LLM Personalizado em 7 Passos](/pt/blog/how-to-diagnose-custom-llm-qa-failures-in-7-steps/) — a árvore de decisão diagnóstica; o modelo é a resposta certa aproximadamente em um alerta a cada sete.
7. [Testes de Regressão Automatizados para LLMs Personalizados em 2026](/pt/blog/automated-regression-testing-for-custom-llms-in-2026/) — gates Spearman conscientes de fatia, juízes calibrados, replay de traces de produção em loop fechado.
8. **Este post.** A infraestrutura de CI que torna tudo o acima tratável em cada PR.

As peças compõem: o [manifest](/pt/api/) é a primitiva de auditoria, os gates são a camada de segurança, a árvore diagnóstica é o loop de recuperação, o [recibo vindex](/pt/compliance/) é a âncora externa, e o bolo de camadas é o que torna a coisa toda economicamente viável de rodar em cada commit. Se o seu processo de release de LLM personalizado não tem essas cinco coisas juntas, a lacuna é sobre o que estes oito posts vêm tratando.

## FAQ

**Qual é o teste mais barato que posso rodar em cada commit?**

Uma checagem de renderização de template de prompt. Roda em milissegundos, não exige juiz, captura uma fração surpreendente de quebras e nunca custa um centavo mensurável. Se você ainda não está rodando isso, é a peça de CI de maior ROI que sabemos recomendar.

**Quanto devo esperar que um pipeline de CI de LLM personalizado custe?**

Centavos por PR típico, alguns dólares no máximo por PR de release candidate. A proporção depende do preço do juiz e da fração de seus PRs que tocam prompts ou configuração de modelo. A parcela de 4% de release candidates acima é típica; para produtos com iteração frequente de prompts a parcela aumenta e a média sobe correspondentemente.

**Devo rodar a suíte completa em cada commit?**

Não. Filtre por path para PRs que tocam prompts, configuração de modelo, retrieval ou código de avaliação. Para todas as outras mudanças, contrato + smoke é suficiente, e uma espera de 12 minutos em um typo de README vai custar a confiança da equipe em uma sprint. A suíte completa é preciosa; gaste-a onde a mudança pode plausivelmente mover uma dimensão de qualidade.

**Como introduzo um novo gate sem quebrar todo mundo?**

Janela shadow de duas semanas, não bloqueante. Ajuste limiares com base na taxa de falsos positivos observada durante o shadow. Vire para bloqueante somente quando a taxa sustentada de falsos positivos estiver abaixo da sua tolerância (usamos 5%). Qualquer outra coisa é o caminho para um gate que todo mundo aprendeu a ignorar.

**Qual é o único número que devo acompanhar se acompanhar apenas um?**

A fração de regressões confirmadas capturadas antes da produção. O histograma neste post coloca isso em ~97% em implantações maduras da Divinci. Os 3% que escapam são a razão pela qual o rollback instantâneo existe. Os 97% são para o que a suíte serve.

## Referências

<ol class="post-references" style="padding-left: 1.5rem;">
  <li id="ref-1" style="scroll-margin-top: 90px; margin-bottom: 0.9rem;">
    <strong>DORA / Google Cloud.</strong> <a href="https://cloud.google.com/devops/state-of-devops" target="_blank" rel="noopener">"Accelerate State of DevOps — CI velocity, change-failure-rate and time-to-restore-service."</a> As baselines cross-indústria que tornam "12 minutos por PR é lento demais" uma afirmação defensável e não uma opinião.
  </li>
  <li id="ref-2" style="scroll-margin-top: 90px; margin-bottom: 0.9rem;">
    <strong>Zheng et al.</strong> <a href="https://arxiv.org/abs/2306.05685" target="_blank" rel="noopener">"Judging LLM-as-a-Judge with MT-Bench and Chatbot Arena."</a> arXiv:2306.05685. A evidência empírica de que chamadas em batch de LLM-as-judge podem preservar a calibração nos tamanhos de batch usados nas camadas de smoke e full — a razão pela qual os números de custo neste post são alcançáveis.
  </li>
  <li id="ref-3" style="scroll-margin-top: 90px; margin-bottom: 0.9rem;">
    <strong>Pope et al.</strong> <a href="https://arxiv.org/abs/2211.05102" target="_blank" rel="noopener">"Efficiently Scaling Transformer Inference."</a> arXiv:2211.05102. As técnicas de reuso de KV-cache e compartilhamento de prefixo citadas na seção de dimensionamento da frota de CI.
  </li>
  <li id="ref-4" style="scroll-margin-top: 90px; margin-bottom: 0.9rem;">
    <strong>Pan, Tianpan.</strong> <a href="https://tianpan.co/blog/2026-04-29-semver-lie-llm-minor-update-breaks-production" target="_blank" rel="noopener">"The Semver Lie: how a minor LLM update broke production."</a> 29 de abril de 2026. O modo de falha nomeado de 2026 para suítes de regressão apenas agregadas; a razão pela qual o bolo de camadas de CI é consciente de fatia em todos os níveis.
  </li>
  <li id="ref-5" style="scroll-margin-top: 90px; margin-bottom: 0.9rem;">
    <strong>GitHub.</strong> <a href="https://docs.github.com/en/actions/using-jobs/using-jobs-in-a-workflow" target="_blank" rel="noopener">"GitHub Actions — chaining jobs with `needs:` and conditional execution."</a> A primitiva contra a qual o .yaml neste post compõe.
  </li>
  <li id="ref-6" style="scroll-margin-top: 90px; margin-bottom: 0.9rem;">
    <strong>Zhang et al.</strong> <a href="https://arxiv.org/abs/1904.09675" target="_blank" rel="noopener">"BERTScore: Evaluating Text Generation with BERT."</a> arXiv:1904.09675. A métrica heurística de similaridade semântica referenciada como alternativa ao LLM-as-judge para as camadas mais baratas; não é o que rodamos no momento do gate, mas útil na camada de contrato para detecção em escala de frases proibidas.
  </li>
</ol>
