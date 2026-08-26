+++
title = "Como Diagnosticar Falhas de QA em LLMs Customizados em 7 Passos"
description = "Quase toda 'falha de QA' não é do modelo — é lacuna de eval, descalibração do juiz ou skew treino-produção. Diagnóstico em 7 passos que prova isso."
date = 2026-05-31T09:00:00+00:00
template = "blog-post.html"

[taxonomies]
categories = ["Product"]
tags = ["QA", "Diagnostics", "Postmortems", "LLM Ops", "Evaluation", "Debugging"]

[extra]
author = "Mike Mooring"
author_avatar = "https://pub-fb3e683317b24cf8b4260121edae02be.r2.dev/images/Michael-Mooring.webp"
hero_video = "https://pub-fb3e683317b24cf8b4260121edae02be.r2.dev/how-to-diagnose-custom-llm-qa-failures-in-7-steps-veo31.webm"
hero_video_poster = "https://pub-fb3e683317b24cf8b4260121edae02be.r2.dev/images/how-to-diagnose-custom-llm-qa-failures-in-7-steps-hero-poster.webp"
reading_time = 11
summary = "Quando um alerta de QA dispara em um LLM customizado, o reflexo natural é culpar o modelo. Nos rollouts que executamos, o modelo é a resposta certa aproximadamente uma vez em sete. Nas outras seis vezes, o bug está na avaliação, no juiz, no SHA do prompt, no pipeline de pré-processamento, na versão do dataset ou no índice de recuperação. Este post é a árvore de diagnóstico que realmente percorremos — em ordem, com a chamada de API exata que responde a cada ramo."
+++

*Notas do Ciclo de Release — Parte VI*

---

Uma suíte de QA pontuada começou a sinalizar o modelo de Q&A médico de um cliente. O número principal — qualidade agregada em todas as fatias — caiu 6 pontos da noite para o dia. A equipe passou dois dias depurando o modelo. Re-executaram fine-tunes. Reverteram para a release anterior. Os números não se moveram.

Na manhã do terceiro dia, alguém percebeu que a suíte de avaliação havia sido atualizada na mesma noite em que a regressão começou. Três novos prompts de dosagem pediátrica haviam sido adicionados ao conjunto de testes, e o modelo nunca tinha visto dosagem pediátrica no treinamento. A "falha de QA" não era uma regressão de modelo. Era um evento de cobertura de fatia: a avaliação começou a perguntar sobre algo que o modelo nunca foi suposto saber.

Nos rollouts dos nossos clientes, esse é o padrão dominante. **Um alerta de "falha de QA" é o sintoma. A causa é o modelo aproximadamente uma vez em sete.** Nas outras seis vezes, o bug está em algum lugar a montante: no design da avaliação, na calibração do juiz, no SHA do prompt, no pipeline de pré-processamento, na versão do dataset ou no índice de recuperação. Cada uma dessas classes de bug parece idêntica vista do alerta — um número caiu — mas tem uma correção completamente diferente.

Este post é a árvore de diagnóstico que percorremos em ordem quando um alerta dispara. Seis passos que descartam causas não-modelo, antes que o sétimo passo considere o próprio modelo. Cada passo tem uma chamada de API ou consulta concreta que o responde. No momento em que você terminar os seis, ou você sabe exatamente o que corrigir, ou ganhou o direito de olhar para o modelo.

## A árvore de decisão

<figure style="margin: 1.5rem auto; max-width: 100%;">
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 900 480" font-family="'DM Sans', -apple-system, sans-serif" role="img" aria-label="Árvore de decisão de diagnóstico para um alerta de falha de QA. Passo 1 pergunta se a avaliação cobre esta fatia (se não, o alerta é uma lacuna de cobertura de avaliação). Passo 2 pergunta se o juiz está calibrado contra humanos nesta fatia (se não, o alerta é descalibração do juiz). Passo 3 pergunta se o SHA do template do prompt corresponde ao de produção (se não, o alerta é drift de prompt). Passo 4 pergunta se o pré-processamento corresponde ao de produção (se não, o alerta é skew entre treino e produção). Passo 5 pergunta se o SHA do dataset corresponde ao de produção (se não, o alerta é drift de dataset). Passo 6 pergunta se a versão do índice de recuperação corresponde à de produção (se não, o alerta é drift de índice RAG). Somente após os seis descartarem uma causa não-modelo é que o Passo 7 conclui que isso é, de fato, uma regressão de modelo por fatia.">
<title>A árvore de diagnóstico de 7 passos</title>
<rect width="900" height="480" fill="#faf8f5"/>
<text x="450" y="32" text-anchor="middle" font-size="16" font-weight="700" fill="#1e3a2b">Quando um alerta de QA dispara, desça — não entre</text>
<text x="450" y="52" text-anchor="middle" font-size="12" fill="#6b5d4f">Seis passos descartam causas não-modelo. Apenas o sétimo culpa o modelo.</text>
<rect x="320" y="78" width="260" height="40" fill="#a04848" rx="6"/>
<text x="450" y="103" text-anchor="middle" font-size="13" font-weight="700" fill="#faf8f5">⚠  Alerta de QA dispara</text>
<line x1="450" y1="118" x2="450" y2="138" stroke="#6b5d4f" stroke-width="1.5"/>
<polygon points="446,138 454,138 450,146" fill="#6b5d4f"/>
<rect x="280" y="148" width="340" height="36" fill="#ffffff" stroke="#2d5a4f" stroke-width="1" rx="4"/>
<text x="290" y="167" font-size="11" font-weight="700" fill="#1e3a2b">1.</text>
<text x="305" y="167" font-size="11" font-weight="600" fill="#1e3a2b">A avaliação cobre esta fatia?</text>
<text x="290" y="180" font-size="10" fill="#6b5d4f">→ se NÃO: lacuna de cobertura. Atualize a suíte, retestar.</text>
<line x1="450" y1="184" x2="450" y2="198" stroke="#6b5d4f" stroke-width="1.5"/>
<polygon points="446,198 454,198 450,206" fill="#6b5d4f"/>
<rect x="280" y="208" width="340" height="36" fill="#ffffff" stroke="#2d5a4f" stroke-width="1" rx="4"/>
<text x="290" y="227" font-size="11" font-weight="700" fill="#1e3a2b">2.</text>
<text x="305" y="227" font-size="11" font-weight="600" fill="#1e3a2b">O juiz está calibrado com humanos nesta fatia?</text>
<text x="290" y="240" font-size="10" fill="#6b5d4f">→ se NÃO: descalibração do juiz. Recalibre ρ. Re-avalie.</text>
<line x1="450" y1="244" x2="450" y2="258" stroke="#6b5d4f" stroke-width="1.5"/>
<polygon points="446,258 454,258 450,266" fill="#6b5d4f"/>
<rect x="280" y="268" width="340" height="36" fill="#ffffff" stroke="#2d5a4f" stroke-width="1" rx="4"/>
<text x="290" y="287" font-size="11" font-weight="700" fill="#1e3a2b">3.</text>
<text x="305" y="287" font-size="11" font-weight="600" fill="#1e3a2b">O SHA do template do prompt bate com produção?</text>
<text x="290" y="300" font-size="10" fill="#6b5d4f">→ se NÃO: drift de prompt. Re-registre o manifesto.</text>
<line x1="450" y1="304" x2="450" y2="318" stroke="#6b5d4f" stroke-width="1.5"/>
<polygon points="446,318 454,318 450,326" fill="#6b5d4f"/>
<rect x="280" y="328" width="340" height="36" fill="#ffffff" stroke="#2d5a4f" stroke-width="1" rx="4"/>
<text x="290" y="347" font-size="11" font-weight="700" fill="#1e3a2b">4.</text>
<text x="305" y="347" font-size="11" font-weight="600" fill="#1e3a2b">O pipeline de pré-processamento bate com produção?</text>
<text x="290" y="360" font-size="10" fill="#6b5d4f">→ se NÃO: skew treino-produção. Vincule o SHA do preprocess.</text>
<line x1="450" y1="364" x2="450" y2="378" stroke="#6b5d4f" stroke-width="1.5"/>
<polygon points="446,378 454,378 450,386" fill="#6b5d4f"/>
<rect x="280" y="388" width="340" height="36" fill="#ffffff" stroke="#2d5a4f" stroke-width="1" rx="4"/>
<text x="290" y="407" font-size="11" font-weight="700" fill="#1e3a2b">5.</text>
<text x="305" y="407" font-size="11" font-weight="600" fill="#1e3a2b">O SHA do dataset bate com produção?</text>
<text x="290" y="420" font-size="10" fill="#6b5d4f">→ se NÃO: drift de dataset. Re-registre com o SHA certo.</text>
<line x1="450" y1="424" x2="630" y2="424" stroke="#6b5d4f" stroke-width="1.5"/>
<line x1="630" y1="424" x2="630" y2="148" stroke="#6b5d4f" stroke-width="1.5"/>
<polygon points="626,148 634,148 630,156" fill="#6b5d4f"/>
<rect x="630" y="148" width="240" height="36" fill="#ffffff" stroke="#2d5a4f" stroke-width="1" rx="4"/>
<text x="640" y="167" font-size="11" font-weight="700" fill="#1e3a2b">6.</text>
<text x="655" y="167" font-size="11" font-weight="600" fill="#1e3a2b">SHA do índice de recuperação bate?</text>
<text x="640" y="180" font-size="10" fill="#6b5d4f">→ se NÃO: drift de índice RAG.</text>
<line x1="750" y1="184" x2="750" y2="220" stroke="#6b5d4f" stroke-width="1.5"/>
<polygon points="746,220 754,220 750,228" fill="#6b5d4f"/>
<rect x="630" y="230" width="240" height="60" fill="#a04848" rx="6"/>
<text x="640" y="252" font-size="13" font-weight="700" fill="#faf8f5">7.</text>
<text x="655" y="252" font-size="13" font-weight="700" fill="#faf8f5">Se os 6 passarem:</text>
<text x="640" y="268" font-size="11" fill="#faf8f5">regressão real do modelo por fatia.</text>
<text x="640" y="282" font-size="11" fill="#faf8f5">Comite. Reverta. Retreine.</text>
<text x="640" y="320" font-size="10" font-style="italic" fill="#a04848" text-anchor="start" font-weight="700">Empiricamente o modelo</text>
<text x="640" y="335" font-size="10" font-style="italic" fill="#a04848" text-anchor="start" font-weight="700">é a resposta certa em</text>
<text x="640" y="350" font-size="10" font-style="italic" fill="#a04848" text-anchor="start" font-weight="700">cerca de 1 alerta em 7.</text>
</svg>
</figure>

A árvore é sequencial porque os passos vão do barato ao caro. O passo 1 é um `git diff` da suíte de avaliação; o passo 7 é um ciclo de fine-tune. Você quer gastar dez minutos em cada uma das seis verificações baratas antes de gastar uma semana na cara.

## Passo 1 — A avaliação cobria esta fatia?

**O sintoma.** A qualidade agregada cai, mas a quebra por fatia mostra uma fatia despencando enquanto as outras estão estáveis. Ou — mais confuso ainda — *todas* as fatias caem ligeiramente, todas em quantidades similares.

**O diagnóstico.** Faça diff do SHA do manifesto da suíte de avaliação contra o da release anterior. Se a suíte de avaliação mudou e você não mudou o modelo, a regressão está na avaliação, não no modelo.

```bash
# Compare o SHA do manifesto da suíte de avaliação entre releases
curl https://api.divinci.ai/v1/releases/rel_a01c66 | jq '.eval_suite_sha256'
curl https://api.divinci.ai/v1/releases/rel_8f72b1 | jq '.eval_suite_sha256'
# Diferentes? Sua avaliação mudou. Audite o que foi adicionado.
```

**A correção.** Ou reverta a mudança na suíte de avaliação (se foi não intencional), ou expanda a cobertura de treinamento para corresponder à nova avaliação (se a nova fatia é uma preocupação real de produção). Não envie uma correção de regressão de modelo para um problema de cobertura de avaliação — você vai piorar o modelo no que ele já fazia bem.

**Onde isso se esconde no nosso pipeline.** [Estágio 1 — Registro](/pt/blog/how-to-build-an-llm-ci-cd-pipeline-with-divinci-ai/#stage-1-register) vincula o SHA da suíte de avaliação ao manifesto da release. O diagnóstico acima é apenas comparar dois manifestos. A razão pela qual o bug tomou dois dias da equipe de Q&A médico é que eles não tinham diff no nível do manifesto — estavam comparando checkpoints do modelo, não manifestos de release.

## Passo 2 — O juiz está calibrado com humanos nesta fatia?

**O sintoma.** Uma fatia *nova* na suíte de avaliação tem pontuação baixa, mas a revisão humana das saídas do modelo nessa fatia as classifica como adequadas. O juiz acha que o modelo está falhando; humanos não.

**O diagnóstico.** Calcule o ρ de Spearman entre as avaliações do juiz LLM e uma pequena amostra avaliada por humanos (50 itens) na fatia que falha. Se ρ &lt; 0,4, o juiz *não está medindo* o que humanos medem nesta fatia.

```bash
curl -X POST https://api.divinci.ai/v1/judges/<judge_id>/calibrate \
  -d '{ "slice": "pediatric-oncology-dosing", "human_ratings_csv": "..." }'
# → { "spearman_rho": 0.31, "interpretation": "judge_uncalibrated_for_slice" }
```

**A correção.** Ou selecione um modelo de juiz diferente para esta fatia, ou use uma cadeia de juízes com um árbitro. MT-Bench<sup><a href="#ref-1">[1]</a></sup> mostra que GPT-4-como-juiz concorda com humanos em &gt;80% em média, mas com variância por categoria de 86% (programação) a 36–44% (escrita/humanidades). A variância é o número operativo; "bom em média" esconde fatias onde o juiz erra.

**Onde isso se esconde no nosso pipeline.** [Estágio 2 — Gate](/pt/blog/how-to-build-an-llm-ci-cd-pipeline-with-divinci-ai/#stage-2-gate) exige um juiz calibrado por fatia. O post [Calibrando o Juiz de IA](/blog/calibrating-the-ai-judge/) documenta o procedimento. Se a fatia foi adicionada à avaliação sem um passo de calibração, você tem um gate estruturalmente não-confiável.

## Passo 3 — O SHA do template do prompt bate com produção?

**O sintoma.** A qualidade cai, mas o model_ref e o dataset_ref estão inalterados. Nada sobre o treinamento mudou. O modelo é o mesmo modelo. E mesmo assim.

**O diagnóstico.** Compare o SHA do `prompt_template_ref` no manifesto da release que falhou contra o da release anterior. Uma edição de 38 caracteres em um prompt de sistema que "melhora a brevidade" pode mudar o comportamento downstream mais do que um retreinamento completo.

```bash
curl https://api.divinci.ai/v1/releases/rel_a01c66 | jq '.prompt_template_ref'
curl https://api.divinci.ai/v1/releases/rel_8f72b1 | jq '.prompt_template_ref'
# Diferentes? Puxe o diff. Olhe com cuidado.
```

**A correção.** Trate prompts como código. O [post sobre as 10 falhas de release](/pt/blog/10-ci-cd-release-failures-in-custom-language-models/#2-editing-a-system-prompt-in-a-dashboard-and-shipping-it-without-code-review) cobre o modo de falha de edição via dashboard — o postmortem da *Mentira do Semver* de Tianpan<sup><a href="#ref-2">[2]</a></sup> nomeia isso como o padrão de falha dominante de 2026. Se você consegue provar que o prompt mudou, você achou seu bug.

## Passo 4 — O pipeline de pré-processamento bate com produção?

**O sintoma.** O modelo passa na avaliação local. O mesmo modelo falha na mesma avaliação em produção. Mesmo model_ref, mesmo prompt, mesmo dataset.

**O diagnóstico.** Puxe o SHA do `preprocessing_ref` do manifesto de produção e verifique que a avaliação rodou com o mesmo. O caso clássico: o treinamento normaliza espaços em branco e converte para minúsculas; a produção não. A avaliação passou pelo pré-processamento de produção; tudo conferiu. Até que alguém atualizou o pré-processamento de apenas um lado.

```bash
curl https://api.divinci.ai/v1/releases/rel_a01c66 | jq '.preprocessing_ref'
# Compare com o pré-processamento que seu harness de treinamento/avaliação realmente usou.
```

**A correção.** Containerize o pré-processamento como um artefato versionado. Referencie-o no manifesto. Recuse-se a fazer deploy se o SHA de pré-processamento do gate diferir do de produção.

## Passo 5 — O SHA do dataset bate com produção?

**O sintoma.** As pontuações do gate-eval da release que falhou são diferentes das pontuações do gate-eval do *mesmo* modelo no dia anterior.

**O diagnóstico.** Faça diff do campo `dataset_version` entre as duas releases. A suíte de avaliação manteve o mesmo nome, mas o conteúdo do dataset foi atualizado e re-tagueado. Mesmo nome, SHA diferente, pontuações diferentes.

```bash
diff <(curl .../rel_a01c66 | jq '.dataset_version') \
     <(curl .../rel_8f72b1 | jq '.dataset_version')
```

**A correção.** Faça hash de conteúdo dos seus datasets. O nome do dataset não é uma versão; o SHA é.

## Passo 6 — O SHA do índice de recuperação bate com produção?

**O sintoma.** Apenas para cargas RAG. A qualidade cai em perguntas que dependem de contexto recuperado. Perguntas de resposta direta estão inalteradas.

**O diagnóstico.** Puxe o SHA do `retrieval_index_ref` do manifesto. Compare contra o índice de recuperação da avaliação do gate. O índice RAG foi atualizado durante a noite (uma nova execução de ingestão); a avaliação do gate cacheou uma recuperação antiga; o canário de produção usou a nova.

```bash
curl https://api.divinci.ai/v1/releases/rel_a01c66 | jq '.retrieval_index_ref'
```

**A correção.** Vincule o SHA do índice de recuperação ao manifesto, exatamente como vinculamos o pré-processamento. A cadência de rotação automatizada de índice do [AutoRAG](/pt/autorag/) torna isso especialmente digno de checar — o índice *vai* atualizar em você quer você tenha autorizado ou não, se você não estiver fixando-o.

## Passo 7 — O modelo em si, finalmente

Seis passos adentro. A avaliação cobre a fatia. O juiz está calibrado. O SHA do prompt bate. O pré-processamento bate. O dataset bate. O índice de recuperação bate.

Agora — e somente agora — você ganhou o direito de olhar para o modelo.

O diagnóstico para este passo é uma comparação de Spearman por fatia contra a release anterior, com ambas as releases avaliadas contra o *mesmo* dataset fixado no manifesto, pré-processamento e recuperação. O número que você produz é um sinal limpo: uma regressão real por fatia, sem fatores de confusão a montante.

```bash
curl -X POST https://api.divinci.ai/v1/releases/<failing_id>/diff-eval \
  -d '{ "baseline_release_id": "<prior_id>", "slices": ["legal-IP-licensing"] }'
# → { "spearman_rho_failing": 0.41, "spearman_rho_baseline": 0.68, "delta": -0.27 }
```

Se o delta confirma uma regressão real: o [auto-rollback](/pt/blog/automated-llm-ci-cd-pipelines-with-instant-rollback/) dispara (se você já não o invocou manualmente), e o modelo que falhou é re-treinado contra um corpus expandido de cobertura de fatias. Se o gate que promoveu essa release perdeu a fatia em primeiro lugar, [o gate também é o bug](/pt/blog/12-qa-and-release-management-capabilities-for-llms/#capability-4-per-slice-per-domain-quality-gate) — capacidade 4 faltando no seu pipeline de release.

## Como a distribuição realmente se parece

A formulação "1 em 7" anterior não era um recurso retórico. É aproximadamente a distribuição que vemos nos rollouts dos clientes. A cada sete alertas de QA:

<figure style="margin: 1.5rem auto; max-width: 100%;">
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 900 380" font-family="'DM Sans', -apple-system, sans-serif" role="img" aria-label="Gráfico de pizza da distribuição de causas raiz para alertas de QA. Lacuna de cobertura de avaliação responde por aproximadamente 32 por cento. Descalibração do juiz aproximadamente 18 por cento. Drift de prompt aproximadamente 16 por cento. Skew de pré-processamento aproximadamente 12 por cento. Drift de dataset aproximadamente 7 por cento. Drift de índice RAG aproximadamente 5 por cento. Regressão real do modelo aproximadamente 10 por cento. Observação interna em rollouts de clientes; não vem de um benchmark controlado.">
<title>Distribuição de causas raiz de alertas de QA</title>
<rect width="900" height="380" fill="#faf8f5"/>
<text x="40" y="36" font-size="16" font-weight="700" fill="#1e3a2b">Onde o bug realmente estava — nos rollouts de clientes</text>
<text x="40" y="56" font-size="12" fill="#6b5d4f">Observação interna, não um benchmark controlado. O modelo é a resposta certa aproximadamente uma vez a cada sete alertas.</text>
<g transform="translate(220, 230)">
<path d="M 0 -120 A 120 120 0 0 1 113.7 -38.3 L 0 0 Z" fill="#2d5a4f"/>
<path d="M 113.7 -38.3 A 120 120 0 0 1 88.3 81.4 L 0 0 Z" fill="#7a9580"/>
<path d="M 88.3 81.4 A 120 120 0 0 1 -29.7 116.3 L 0 0 Z" fill="#b8a080"/>
<path d="M -29.7 116.3 A 120 120 0 0 1 -113.7 -38.3 L 0 0 Z" fill="#c87b3c"/>
<path d="M -113.7 -38.3 A 120 120 0 0 1 -101.1 -64.7 L 0 0 Z" fill="#d4c8b0"/>
<path d="M -101.1 -64.7 A 120 120 0 0 1 -75.6 -93.2 L 0 0 Z" fill="#a04848"/>
<path d="M -75.6 -93.2 A 120 120 0 0 1 0 -120 L 0 0 Z" fill="#1e3a2b"/>
</g>
<g font-size="11" fill="#1e3a2b">
<rect x="500" y="100" width="14" height="14" fill="#2d5a4f"/>
<text x="522" y="112" font-weight="600">1.  Lacuna de cobertura de avaliação</text>
<text x="700" y="112" text-anchor="end" font-weight="700">~32%</text>
<rect x="500" y="124" width="14" height="14" fill="#7a9580"/>
<text x="522" y="136" font-weight="600">2.  Descalibração do juiz</text>
<text x="700" y="136" text-anchor="end" font-weight="700">~18%</text>
<rect x="500" y="148" width="14" height="14" fill="#b8a080"/>
<text x="522" y="160" font-weight="600">3.  Drift de prompt</text>
<text x="700" y="160" text-anchor="end" font-weight="700">~16%</text>
<rect x="500" y="172" width="14" height="14" fill="#c87b3c"/>
<text x="522" y="184" font-weight="600">4.  Skew de pré-processamento</text>
<text x="700" y="184" text-anchor="end" font-weight="700">~12%</text>
<rect x="500" y="196" width="14" height="14" fill="#a04848"/>
<text x="522" y="208" font-weight="600">7.  Regressão real do modelo</text>
<text x="700" y="208" text-anchor="end" font-weight="700">~10%</text>
<rect x="500" y="220" width="14" height="14" fill="#d4c8b0"/>
<text x="522" y="232" font-weight="600">5.  Drift de dataset</text>
<text x="700" y="232" text-anchor="end" font-weight="700">~7%</text>
<rect x="500" y="244" width="14" height="14" fill="#1e3a2b"/>
<text x="522" y="256" font-weight="600">6.  Drift de índice RAG</text>
<text x="700" y="256" text-anchor="end" font-weight="700">~5%</text>
</g>
<text x="500" y="295" font-size="10" font-style="italic" fill="#8a7d68">Apenas os passos 1+2 respondem por metade dos alertas. Percorra a avaliação antes do modelo.</text>
</svg>
</figure>

As duas maiores fatias são *lacuna de cobertura de avaliação* e *descalibração do juiz*. Juntas elas respondem por metade dos alertas de QA. Nenhuma das duas é um problema de modelo. Ambas são problemas de como você mede o modelo.

## O que isso não resolve

Três limitações honestas:

**A distribuição é nossa, não sua.** As porcentagens acima vêm do nosso conjunto de clientes e da tooling do nosso pipeline. Se você roda um tipo diferente de carga — pesada em multi-modal, pesada em orquestração de agentes, pesada em geração single-shot — sua distribuição vai parecer diferente. A ordem do diagnóstico deve continuar valendo; os números por trás de cada passo não vão.

**A "lacuna de cobertura de avaliação" do Passo 1 é a mais difícil de corrigir.** Adicionar a fatia faltante ao seu corpus de treinamento, construir um juiz calibrado para ela e re-executar o canário é em si um projeto de várias semanas. O diagnóstico é rápido; a remediação não.

**Uma regressão real pode pegar carona em um bug não-modelo.** Os casos em que você tem *tanto* drift de prompt QUANTO uma regressão real de modelo são os piores, porque o passo 3 encontra o drift de prompt, você o corrige, e o alerta dispara de novo. A ordem de diagnóstico neste post lida com eles mas adiciona tempo decorrido. Não há atalho para "o bug estava em dois lugares ao mesmo tempo."

## FAQ

### Por que meu LLM produz saídas diferentes para prompts similares?

A sensibilidade a prompt é real, mas nem sempre é a *causa* de um alerta de QA — às vezes é um *sintoma* de um bug a montante. Percorra o diagnóstico. Se o SHA do template do prompt bate e o pré-processamento bate e o dataset bate, então sim — o modelo tem grande variância nessa fatia e você precisa de um caminho de decodificação mais determinístico ou de um juiz diferente. Se algo a montante mudou, corrija isso primeiro.

### Com que frequência você deve re-avaliar seus benchmarks de LLM?

Re-avalie o *conteúdo* do benchmark sempre que a forma do tráfego de uma fatia de produção mudar de modo significativo. Re-avalie a *calibração do juiz* do benchmark trimestralmente, no mínimo — modelos de juiz derivam mais rápido do que se imagina. A maior fonte de falsos alertas de QA é um benchmark cuja última validação foi há 18 meses e que agora mede algo que sua produção já não faz mais.

### O que causa alucinações em modelos de linguagem customizados?

Alucinações têm múltiplas causas a montante — falhas de recuperação (passo 6 na árvore acima), lacunas de cobertura de treinamento (passo 1, indiretamente) e problemas no caminho de decodificação (uma preocupação real do modelo no passo 7). O [AutoRAG](/pt/autorag/) endereça as causas do lado da recuperação vinculando o índice de recuperação ao manifesto da release e re-fixando-o em cada release. As outras duas exigem correções de nível de pipeline a montante do modelo.

### Como saber se seus dados de treinamento são o problema?

Se o SHA do dataset na release que falhou bate com o SHA do dataset na release anterior boa (passo 5 da árvore), os dados não são a causa *imediata*. Se diferem, você o encontrou. A pergunta mais difícil — "o dataset está *completo* para a cobertura de fatias da nossa produção?" — é o que o passo 1 testa. Um dataset completo para a avaliação mas incompleto para o tráfego de produção é um problema de cobertura de fatias.

### Você consegue corrigir falhas de QA sem retreinar o modelo inteiro?

Sim — seis em cada sete vezes, a correção não é um retreinamento. Os passos 1–6 da árvore têm correções que não tocam o modelo: atualizar a avaliação, recalibrar o juiz, re-registrar o SHA do prompt, corrigir o pré-processamento, re-fixar o dataset ou re-fixar o índice de recuperação. Retreinar é o passo 7, a correção mais cara, reservada para regressões reais de modelo. A [trilha de auditoria](/pt/compliance/) do pipeline de release te permite fazer essas correções a montante com a mesma disciplina de proveniência que você usaria para uma mudança de modelo.

## References

<ol class="post-references" style="padding-left: 1.5rem;">
<li id="ref-1" style="scroll-margin-top: 90px; margin-bottom: 0.9rem;">
<strong>LLM-as-judge per-category variance.</strong> Zheng et al., <a href="https://arxiv.org/abs/2306.05685" target="_blank" rel="noopener"><em>Judging LLM-as-a-Judge with MT-Bench and Chatbot Arena</em></a> (NeurIPS 2023). &gt;80% overall GPT-4-vs-human agreement with per-category variance from coding (86%) down to writing (36–44%). Anchor for step 2 — why judge calibration has to be measured per slice rather than assumed from a published headline number.
</li>
<li id="ref-2" style="scroll-margin-top: 90px; margin-bottom: 0.9rem;">
<strong>The Semver Lie.</strong> <a href="https://tianpan.co/blog/2026-04-29-semver-lie-llm-minor-update-breaks-production" target="_blank" rel="noopener">Tianpan — <em>The Semver Lie: how an LLM minor update breaks production</em></a> (April 2026). The dominant 2026 failure-mode writeup. Names dashboard-edit prompt drift as the most-cited cause of production LLM incidents. Anchor for step 3.
</li>
<li id="ref-3" style="scroll-margin-top: 90px; margin-bottom: 0.9rem;">
<strong>NIST AI RMF — Measure function.</strong> <a href="https://www.nist.gov/itl/ai-risk-management-framework" target="_blank" rel="noopener">NIST AI Risk Management Framework</a>. The "Measure" function explicitly covers benchmark-validity and evaluation-coverage as part of governance, not as a separate engineering concern. Cited as the institutional anchor for treating eval design as the first diagnostic step.
</li>
<li id="ref-4" style="scroll-margin-top: 90px; margin-bottom: 0.9rem;">
<strong>RAGAS — retrieval-augmented generation evaluation.</strong> Es et al., <a href="https://arxiv.org/abs/2309.15217" target="_blank" rel="noopener"><em>RAGAS: Automated Evaluation of Retrieval Augmented Generation</em></a> (arXiv:2309.15217). The reference framework for RAG-side evaluation. Anchor for step 6 — separating retrieval failures from generation failures requires a RAG-aware eval discipline.
</li>
<li id="ref-5" style="scroll-margin-top: 90px; margin-bottom: 0.9rem;">
<strong>Internal — root-cause distribution across customer rollouts.</strong> The percentages in the pie chart are our internal observation across Divinci customer rollouts, not from a controlled benchmark. Your distribution will vary by workload type, fine-tune cadence, and team discipline. The relative ordering (steps 1–2 dominating) is stable across the cohort we've measured; the exact percentages are not portable to your environment without your own data.
</li>
<li id="ref-6" style="scroll-margin-top: 90px; margin-bottom: 0.9rem;">
<strong>The four-stage release pipeline.</strong> <a href="/pt/blog/how-to-build-an-llm-ci-cd-pipeline-with-divinci-ai/">How to Build an LLM CI/CD Pipeline With Divinci AI</a>. Each diagnostic step in this post corresponds to a manifest field bound at Stage 1 — Register. Without the manifest discipline upstream, the diagnostic loses its grip; you can't diff what you didn't bind.
</li>
</ol>

---

*Próximo da série:* **Testes de Regressão Automatizados para LLMs Customizados em 2026.** Este post é sobre diagnóstico após um alerta de QA disparar. O próximo é sobre a disciplina de teste de regressão que conduziu o alerta em primeiro lugar — o que colocar na avaliação, como mantê-la honesta e o que fazer quando o teste de regressão começa a discordar do seu juiz.
