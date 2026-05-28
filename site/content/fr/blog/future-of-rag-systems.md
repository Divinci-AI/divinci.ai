+++
title = "L'avenir des systèmes RAG : Au-delà de la simple récupération de documents"
description = "Vers où va le RAG : routage par QA scoré, arènes vectorielles, évaluation compétitive en direct. Mai 2026 — le RAG est désormais un problème de routage."
date = 2025-05-01T09:00:00+00:00
updated = 2026-05-27T10:00:00+00:00
template = "blog-post.html"

[taxonomies]
categories = ["Artificial Intelligence"]
tags = ["RAG Systems", "AI Architecture", "Vector Embeddings", "LLMs", "Document Retrieval"]

[extra]
author = "Michael Mooring"
author_avatar = "images/Michael-Mooring.png"
featured_image = "images/autorag-still.png"
reading_time = 8
summary = "Les systèmes de génération augmentée par récupération (RAG) ont révolutionné la façon dont les modèles d'IA accèdent aux grands ensembles de données et raisonnent sur eux. Dans cet article, nous explorons la prochaine génération de technologie RAG et comment elle permet des applications IA plus sophistiquées qui vont au-delà de la simple récupération de documents."
+++

La génération augmentée par récupération (RAG) est apparue comme l'une des applications les plus transformatrices des grands modèles de langage (LLM), permettant aux systèmes d'IA d'accéder à de vastes bases de connaissances qui s'étendent bien au-delà de leurs données d'entraînement et de raisonner sur elles[^1]. Cependant, à mesure que les organisations déploient des systèmes RAG à grande échelle, les limites des approches de première génération deviennent de plus en plus apparentes. À l'approche de 2025, le RAG s'impose fermement non plus comme un simple amplificateur de précision, mais comme un cadre essentiel pour des agents linguistiques fiables, actualisables et auditables[^2].

## 📰 Mise à jour mai 2026 — Le RAG est désormais un problème de routage et d'orchestration, et non d'ingénierie de pipeline

Cet article a été initialement publié en mai 2025. Depuis un an, le centre de gravité du RAG s'est déplacé de *ce qui se trouve dans le pipeline* vers *ce qui se trouve dans le routeur qui choisit le pipeline*. Les composants que nous avons décrits — récupération multi-étapes, hiérarchies de type RAPTOR, décomposition de requêtes, récupération récursive — restent des primitives correctes. Ils sont désormais des sous-routines à l'intérieur de systèmes plus larges qui **les enveloppent dans des agents, les évaluent à l'exécution avec des critiques de réflexion et les dispatchent contre un portefeuille de récupérateurs (vectoriel plat, graphe de connaissances, document visuel, et contexte long de 2 M tokens) par requête plutôt que par système**[^rag-survey-2026]. Voici ce qui s'est imposé depuis la publication et ce qu'il faut retirer du cadrage initial.

<figure style="margin: 2rem 0; overflow-x: auto;">
<table style="width: 100%; border-collapse: collapse; font-size: 0.92rem;">
<thead>
<tr style="background: #2d5a4f; color: #faf8f5;">
<th style="padding: 0.7rem 0.9rem; text-align: left;">Primitive RAG (cadrage mai 2025)</th>
<th style="padding: 0.7rem 0.9rem; text-align: left;">Statut mi-2026</th>
</tr>
</thead>
<tbody>
<tr style="background: #faf8f5;"><td style="padding: 0.7rem 0.9rem; border-bottom: 1px solid #d6c7a8;"><strong>Pipelines de récupération multi-étapes</strong></td><td style="padding: 0.7rem 0.9rem; border-bottom: 1px solid #d6c7a8;">Toujours le cheval de bataille. <strong>Contextual Retrieval</strong> d'Anthropic + hybride BM25 / vector / reranker est la nouvelle référence présumée[^contextual-retrieval-2024].</td></tr>
<tr style="background: #eae3d5;"><td style="padding: 0.7rem 0.9rem; border-bottom: 1px solid #d6c7a8;"><strong>Récupération récursive / RAPTOR</strong></td><td style="padding: 0.7rem 0.9rem; border-bottom: 1px solid #d6c7a8;">Absorbée dans le <strong>RAG agentique</strong> — la récursion est désormais pilotée par un agent de planification, et non par un pipeline fixe[^rag-survey-2026][^sok-agentic-2026].</td></tr>
<tr style="background: #faf8f5;"><td style="padding: 0.7rem 0.9rem; border-bottom: 1px solid #d6c7a8;"><strong>Décomposition de requêtes</strong></td><td style="padding: 0.7rem 0.9rem; border-bottom: 1px solid #d6c7a8;">Généralisée en <strong>RAG à raisonnement Système 1/Système 2</strong> — l'agent décide quand, quoi et comment récupérer[^reasoning-rag-2025].</td></tr>
<tr style="background: #eae3d5;"><td style="padding: 0.7rem 0.9rem; border-bottom: 1px solid #d6c7a8;"><strong>RAG multi-modal</strong></td><td style="padding: 0.7rem 0.9rem; border-bottom: 1px solid #d6c7a8;">RAG document-visuel via <strong>ColPali / ColQwen</strong>[^colpali-2024][^vidore-v2-2025] et embeddings unifiés texte + image + vidéo + audio + PDF via <strong>gemini-embedding-2</strong> (mars 2026)[^gemini-embedding-2] — les index vectoriels de Divinci consomment les deux.</td></tr>
<tr style="background: #faf8f5;"><td style="padding: 0.7rem 0.9rem; border-bottom: 1px solid #d6c7a8;"><em>(Absent de l'article original — apparu ensuite.)</em></td><td style="padding: 0.7rem 0.9rem; border-bottom: 1px solid #d6c7a8;"><strong>Graph RAG</strong> : Microsoft <strong>LazyGraphRAG</strong> + GraphRAG 1.0 réduisent l'indexation à ~0,1 % du coût d'un graphe complet[^lazy-graphrag-2024][^graphrag-1-2025]. <strong>LightRAG</strong> (HKU) et <strong>HippoRAG</strong> sont les alternatives moins chères / plus rapides.</td></tr>
<tr style="background: #eae3d5;"><td style="padding: 0.7rem 0.9rem;"><em>(Absent de l'article original — tranché cette année.)</em></td><td style="padding: 0.7rem 0.9rem;">Débat <strong>contexte long vs RAG</strong> : tranché en faveur du <em>routage</em>. RAG pour les requêtes simples ; contexte long (Gemini 3 Pro Deep Think, 2 M tokens) pour les requêtes complexes multi-saut. Les benchmarks multi-aiguilles sont encore en retrait de 15 à 40 points par rapport à l'aiguille unique[^u-niah-2025].</td></tr>
</tbody>
</table>
<figcaption style="text-align: center; font-style: italic; color: #5a6862; font-size: 0.9rem; margin-top: 0.75rem;">Un an de bascule architecturale, résumé. Les citations renvoient aux sources primaires en bas de cet article.</figcaption>
</figure>

### Ce qui a le plus changé : le RAG agentique comme architecture nommée

Le développement le plus conséquent depuis mai 2025 est la consolidation du *RAG agentique*, passé d'un schéma diffus à une architecture nommée disposant de sa propre taxonomie et de sa littérature de synthèse. Le travail de Singh et al. « Agentic Retrieval-Augmented Generation: A Survey on Agentic RAG »[^rag-survey-2026] taxonomise l'espace selon **la cardinalité des agents, la structure de contrôle, l'autonomie et la représentation des connaissances**, intégrant réflexion, planification, utilisation d'outils et collaboration multi-agents dans un cadre analytique unique. La suite « SoK: Agentic Retrieval-Augmented Generation »[^sok-agentic-2026] ajoute une systématisation autour des mécanismes de planification, de l'orchestration de la récupération, des paradigmes mémoire et des comportements d'invocation d'outils.

Concrètement, cela signifie : au lieu d'écrire *un* pipeline RAG et de le régler, les systèmes de production de mi-2026 écrivent un *planificateur* qui choisit parmi plusieurs récupérateurs, décide s'il faut récupérer (parfois le modèle en sait assez) et reformule la requête si la première récupération est faible. LangGraph s'est imposé comme le runtime de facto pour ce schéma.

### Le RAG auto-correctif est passé en production

La discussion de l'article sur le « re-ranking contextuel » s'est généralisée en auto-correction à l'exécution. **Self-RAG** (Asai et al., 2023[^self-rag-2023]) a introduit des tokens de réflexion permettant au modèle de critiquer ses propres récupérations ; **CRAG** (Corrective RAG, Yan et al.[^crag-2024]) a ajouté un évaluateur de récupération léger externe avec trois voies correctives (correct / incorrect / ambigu). En 2025–2026, le schéma est passé de la recherche à la production : router chaque récupération via un nœud critique, reformuler sur les passages à faible confiance et réinjecter des scores de type RAGAS dans la porte à l'exécution, et plus seulement hors ligne.

C'est la même logique que celle décrite par notre [article sur les tests de régression automatisés](/blog/automated-regression-testing-for-custom-llms-in-2026/) pour *évaluer* les systèmes RAG — mais ici elle s'exécute **à l'intérieur** de la boucle de récupération, et pas uniquement en CI.

### Le Graph RAG a mûri le plus rapidement

De tous les sous-domaines, la récupération par graphe de connaissances a le plus évolué en douze mois. **Microsoft LazyGraphRAG**[^lazy-graphrag-2024] (désormais dans Azure / Microsoft Discovery) reporte la synthèse des communautés au moment de la requête, ramenant le coût d'indexation à environ **0,1 % de GraphRAG complet** tout en égalant la qualité. **GraphRAG 1.0**[^graphrag-1-2025] est la version « ergonomie de niveau production ». **LightRAG** (HKU) propose une récupération bi-mode sur graphe plat à environ 1 % du coût de GraphRAG ; la mémoire d'inspiration neurobiologique d'**HippoRAG** réduit le coût du raisonnement multi-saut d'un facteur 10 à 30. **GraphRAG-Bench** (ICLR 2026, arXiv:2506.05690) fournit la règle de décision empirique : **la valeur du graphe croît avec la complexité de la requête**[^graphrag-bench-2026].

Pour la plupart des déploiements RAG en production à l'échelle que nous observons, la bonne réponse en 2026 est hybride : vecteur plat pour la longue traîne de recherches simples, récupération par graphe pour la petite part de requêtes complexes multi-saut qui justifient la charge d'indexation.

### Contexte long vs RAG : tranché comme routage, pas comme remplacement

Quand l'article de mai 2025 est paru, la question ouverte était de savoir si les fenêtres de contexte de 2 M tokens rendraient le RAG obsolète. **Le débat est tranché — en faveur du routage.** Gemini 3 Pro Deep Think atteint 2 M tokens et des scores compétitifs en aiguille unique, mais les scores multi-aiguilles restent en retrait de 15 à 40 points par rapport à l'aiguille unique sur les benchmarks U-NIAH[^u-niah-2025], et l'économie est décisive : environ **1,25 $ pour une requête Gemini de 500 K tokens contre quelques centimes pour le RAG**. La mise en cache de prompts réduit l'écart d'environ 90 % sans le combler. Le mode de défaillance « lost in the middle » se reproduit dans toutes les grandes familles de modèles tout au long de 2025.

L'architecture de mi-2026 est donc : **router les requêtes simples vers le RAG ; router les requêtes multi-saut complexes ou non structurées vers le contexte long ; router les requêtes document-visuel vers ColPali**[^colpali-2024]** ; router les requêtes par graphe de connaissances vers GraphRAG.** Le cadrage initial de l'article sur « le problème d'optimisation qui remplace 'choisir une architecture RAG' » est exactement juste — l'optimisation porte désormais sur plus de récupérateurs qu'à l'époque.

### Le RAG document-visuel est passé en production — et les embeddings multi-modalités unifiés ont débarqué

**ColPali**[^colpali-2024] (Faysse et al., 2024) a introduit des embeddings d'interaction tardive VLM directement sur les pages de documents rendues, supprimant entièrement l'étape d'ingestion / OCR. **ViDoRe Benchmark V2** (mai 2025[^vidore-v2-2025]) a relevé le niveau d'exigence en récupération visuelle. **ColQwen2** atteint environ 90 % de moyenne sur ViDoRe, et **REAL-MM-RAG** (fév. 2025) a ajouté un benchmark multi-modal en conditions réelles. Pour les corpus à forte composante PDF ou tableaux, le RAG document-visuel est désormais la valeur par défaut en production ; le pipeline OCR-puis-chunking sous-entendu par l'article initial n'est plus à l'état de l'art.

En mars 2026, **gemini-embedding-2**[^gemini-embedding-2] de Google a fusionné la séparation visuel / vidéo / audio / texte dans un espace d'embedding unique — le modèle accepte du texte jusqu'à 8 192 tokens, jusqu'à six images par requête, de la vidéo jusqu'à 120 secondes, de l'audio natif et des PDF jusqu'à six pages, et produit un embedding de 3 072 dimensions (réductible à 1 536 ou 768 via Matryoshka Representation Learning). Il est livré via l'API Gemini et Vertex AI, avec des intégrations natives dans LangChain, LlamaIndex, Haystack, Weaviate, Qdrant, ChromaDB et Vertex Vector Search. L'annonce de Google le positionne comme <q>surpassant les modèles de référence sur les tâches de texte, d'image et de vidéo</q>, Paramount Skydance rapportant un Text-to-Video Recall@1 de 85,3 % sur son benchmark interne.

Pour Divinci en particulier, la conséquence pratique est que nos index vectoriels peuvent ingérer texte, image, vidéo et audio dans un espace de récupération unique — nous proposons `gemini-embedding-2` comme option d'embedding sur les mêmes dix backends listés dans notre page [RAG Routing](/fr/rag-routing/), ce qui signifie qu'un corpus client à modalités mixtes (par exemple une équipe juridique disposant de PDF de contrats, de scans de contrats signés et d'enregistrements d'appels de négociation dans le même espace de travail) peut être interrogé par un seul appel de récupération au lieu de trois.

La récupération vidéo et audio n'est plus au stade de la recherche — elle partage désormais un espace d'embedding avec le texte.

### Schémas RAG en production — services managés et récupération contextuelle

L'autre grande bascule de 2025–2026 est que les équipes de production consomment de plus en plus le RAG comme service managé plutôt que de le construire elles-mêmes.

- **Cloudflare AutoRAG** est entré en bêta ouverte en avril 2025 et a été renommé **Cloudflare AI Search** plus tard dans l'année[^cloudflare-autorag-2025][^cloudflare-ai-search-2026], offrant un pipeline managé ingestion → chunking → embedding → Vectorize → génération Workers AI. Nous utilisons un mix différent chez Divinci — D1 avec FTS5 plus des API d'embedding externes — mais le marché plus large se consolide autour d'offres managées (également AWS Bedrock Knowledge Bases, Vertex AI Search).
- **Anthropic Contextual Retrieval** (annoncé en septembre 2024 et largement déployé tout au long de 2025[^contextual-retrieval-2024]) a fait du *contexte explicatif par chunk ajouté avant l'embedding* la référence présumée. L'hybride BM25 + vecteur dense + reranker n'est plus « avancé » ; c'est ce qu'une équipe RAG compétente livre dès le premier jour.

### L'évaluation est passée du RAGAS hors ligne aux portes d'auto-évaluation en ligne

L'article appelait à une meilleure évaluation RAG. En 2025–2026, le domaine a tenu parole. **MIRAGE** (Findings of NAACL 2025[^mirage-2025]) a introduit 7 560 instances d'évaluation de récupération sur un pool de 37 800 entrées, avec des métriques de vulnérabilité au bruit, d'acceptabilité contextuelle, d'insensibilité contextuelle et d'interprétation erronée du contexte. **MIRAGE-Bench** (NAACL 2025[^mirage-bench-2025]) a ajouté une couverture multilingue sur 18 langues. **RAGAS** reste la référence en production pour la fidélité, la pertinence et la précision contextuelle — mais le schéma 2026 consiste à exécuter RAGAS comme *porte de récupération en ligne*, pas seulement comme évaluation hors ligne. C'est le même schéma que celui décrit dans notre [article sur les tests de régression](/blog/automated-regression-testing-for-custom-llms-in-2026/) et opérationnalisé dans l'[article sur les tests CI](/blog/ci-testing-for-custom-language-models-in-2026/).

### Ce qu'il faut retirer de l'article initial

Le cadrage de mai 2025 a mieux tenu que prévu, mais deux points spécifiques doivent être mis à jour :

1. **« Les stratégies de récupération statiques sont la plupart des implémentations RAG »** — c'était vrai il y a un an, beaucoup moins maintenant. Le dispatch agentique est la nouvelle norme pour toute équipe construisant au-delà de la preuve de concept.
2. **L'hypothèse implicite que l'OCR-puis-chunking est la façon dont fonctionnent les corpus à forte composante PDF** — dépassée par la récupération visuelle ColPali / ColQwen pour les déploiements de pointe.

Les sections originales sur les pipelines multi-étapes, la décomposition de requêtes et la récupération récursive restent correctes. Elles sont désormais enveloppées dans des agents, évaluées en ligne et choisies par requête dans un portefeuille, plutôt que configurées une fois pour tout le système.

### L'architecture RAG de mi-2026, résumée

Un système RAG en production à mi-2026 ressemble à :

1. Un **planificateur / routeur** (orchestré par LangGraph) qui classifie la requête entrante.
2. Un **portefeuille de récupérateurs** — vecteur plat (avec la référence hybride BM25 + dense + reranker), récupération par graphe (LazyGraphRAG / LightRAG / HippoRAG pour la queue complexe), document-visuel (ColPali / ColQwen) et contexte long (Gemini / Claude pour les requêtes non structurées où la récupération ne s'applique pas).
3. Un **critique à l'exécution** (de style Self-RAG / CRAG) qui évalue chaque récupération et déclenche une nouvelle requête en cas de faible confiance.
4. Une **porte d'évaluation en ligne** (RAGAS / MIRAGE) qui fait remonter en production les métriques de fidélité / hallucination, et pas seulement en CI.
5. Un **juge calibré** pour tout scoring LLM-as-judge alimentant la porte, rafraîchi chaque semaine sur des étiquettes humaines.

L'article de mai 2025 décrivait l'une de ces pièces (le pipeline). La réalité de mi-2026, c'est l'orchestration qui l'entoure.

## 🧭 Le routage RAG de Divinci — une API, trois stacks architecturalement distincts

Si l'architecture RAG de mi-2026 est *routage et orchestration*, la question portante devient : **entre quoi le routeur choisit-il réellement ?** C'est sur ce point que notre approche diverge de la littérature publiée.

Tous les routeurs RAG nommés que nous avons étudiés routent selon l'**axe de la profondeur** : faut-il récupérer une fois, plusieurs fois, ou pas du tout ? Adaptive-RAG[^adaptive-rag-2024], Probing-RAG[^probing-rag-2025], R2RAG[^r2rag-2025], LTRR (Learning to Rank Retrievers)[^ltrr-2025] et RAGRouter-Bench[^ragrouter-bench-2026] classifient tous les requêtes par complexité de raisonnement et dispatchent vers des variantes plus profondes ou plus superficielles de *la même architecture de récupération*. Le template « Adaptive RAG » de LangGraph route entre *pas de récupération / vectoriel / recherche web* — encore selon la source et la profondeur.

**L'axe de routage RAG de Divinci est orthogonal : nous routons entre trois stacks de récupération architecturalement distincts, sélectionnés selon la forme de la requête, derrière un endpoint d'API unique.**

<figure style="margin: 2.5rem 0;">
<svg viewBox="0 0 1200 600" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid meet" style="width: 100%; max-width: 100%; height: auto;" role="img" aria-label="Routage RAG à trois niveaux : vecteur plat, hybride BM25+dense+rerank, page-index + traversée agentique">
<rect width="1200" height="600" fill="#faf8f5"/>
<text x="600" y="36" font-family="'DM Sans', -apple-system, sans-serif" font-size="22" font-weight="700" fill="#1e3a2b" text-anchor="middle">Routage RAG Divinci — trois architectures, un endpoint</text>
<text x="600" y="60" font-family="'DM Sans', -apple-system, sans-serif" font-size="13" fill="#5a6862" text-anchor="middle">Le routeur classifie la requête et dispatche vers le niveau le moins cher capable d'y répondre correctement</text>
<g transform="translate(60, 88)">
<rect x="0" y="0" width="1080" height="60" fill="#1e3a2b" rx="6"/>
<text x="540" y="28" font-family="'DM Sans', sans-serif" font-size="15" font-weight="700" fill="#faf8f5" text-anchor="middle">Requête entrante → Routeur (classifieur de forme de requête)</text>
<text x="540" y="46" font-family="'DM Sans', sans-serif" font-size="11" fill="#c8d8d0" text-anchor="middle">factuelle ? signal hybride ? multi-saut / long document ?  →  choisir le niveau le moins cher qui la traite</text>
</g>
<g transform="translate(60, 175)">
<path d="M 180 0 L 180 30" stroke="#7a8a4a" stroke-width="2" fill="none" stroke-dasharray="4,3"/>
<path d="M 540 0 L 540 30" stroke="#5a7a8f" stroke-width="2" fill="none" stroke-dasharray="4,3"/>
<path d="M 900 0 L 900 30" stroke="#2d5a4f" stroke-width="2" fill="none" stroke-dasharray="4,3"/>
</g>
<g transform="translate(60, 205)">
<rect x="0" y="0" width="340" height="350" fill="#faf8f5" stroke="#7a8a4a" stroke-width="1.5" rx="6"/>
<rect x="0" y="0" width="340" height="44" fill="#7a8a4a" rx="6"/>
<text x="170" y="28" font-family="'DM Sans', sans-serif" font-size="15" font-weight="700" fill="#faf8f5" text-anchor="middle">Niveau 1 · RAG à vecteur plat</text>
<text x="170" y="74" font-family="'DM Sans', sans-serif" font-size="11" font-weight="700" fill="#5a6c2a" text-anchor="middle">RAPIDE &amp; ÉCONOMIQUE</text>
<g font-family="'DM Sans', sans-serif" font-size="12" fill="#1e3a2b">
<text x="20" y="110">embed requête → similarité cosinus</text>
<text x="20" y="128">top-k → injection du contexte</text>
<text x="20" y="146">→ génération</text>
<text x="20" y="186" font-weight="700">Idéal pour :</text>
<text x="20" y="204" font-size="11">recherches factuelles uniques,</text>
<text x="20" y="220" font-size="11">« qu'est-ce que X ? », requêtes</text>
<text x="20" y="236" font-size="11">de type FAQ sur corpus plats</text>
<text x="20" y="270" font-weight="700">Latence :</text>
<text x="105" y="270">&lt; 300 ms</text>
<text x="20" y="290" font-weight="700">Coût :</text>
<text x="105" y="290">centimes par requête</text>
</g>
</g>
<g transform="translate(430, 205)">
<rect x="0" y="0" width="340" height="350" fill="#faf8f5" stroke="#5a7a8f" stroke-width="1.5" rx="6"/>
<rect x="0" y="0" width="340" height="44" fill="#5a7a8f" rx="6"/>
<text x="170" y="28" font-family="'DM Sans', sans-serif" font-size="15" font-weight="700" fill="#faf8f5" text-anchor="middle">Niveau 2 · Hybride + Rerank</text>
<text x="170" y="74" font-family="'DM Sans', sans-serif" font-size="11" font-weight="700" fill="#3a5060" text-anchor="middle">ÉQUILIBRÉ</text>
<g font-family="'DM Sans', sans-serif" font-size="12" fill="#1e3a2b">
<text x="20" y="110">BM25 lexical &nbsp;+ vecteur dense</text>
<text x="20" y="128">→ Reciprocal Rank Fusion</text>
<text x="20" y="146">→ reranker cross-encoder</text>
<text x="20" y="164">→ génération</text>
<text x="20" y="200" font-weight="700">Idéal pour :</text>
<text x="20" y="218" font-size="11">requêtes où lexical et</text>
<text x="20" y="234" font-size="11">sémantique divergent —</text>
<text x="20" y="250" font-size="11">codes, noms, acronymes,</text>
<text x="20" y="266" font-size="11">vocabulaire technique</text>
<text x="20" y="290" font-weight="700">Latence :</text>
<text x="105" y="290">~ 800 ms</text>
<text x="20" y="310" font-weight="700">Coût :</text>
<text x="105" y="310">toujours faible</text>
</g>
</g>
<g transform="translate(800, 205)">
<rect x="0" y="0" width="340" height="350" fill="#faf8f5" stroke="#2d5a4f" stroke-width="1.5" rx="6"/>
<rect x="0" y="0" width="340" height="44" fill="#2d5a4f" rx="6"/>
<text x="170" y="28" font-family="'DM Sans', sans-serif" font-size="15" font-weight="700" fill="#faf8f5" text-anchor="middle">Niveau 3 · Page-Index + Agent</text>
<text x="170" y="74" font-family="'DM Sans', sans-serif" font-size="11" font-weight="700" fill="#1e3a2b" text-anchor="middle">PROFOND &amp; DÉLIBÉRÉ</text>
<g font-family="'DM Sans', sans-serif" font-size="12" fill="#1e3a2b">
<text x="20" y="110">arbre hiérarchique de</text>
<text x="20" y="128">table des matières construit à l'ingestion</text>
<text x="20" y="146">→ un agent parcourt l'arbre</text>
<text x="20" y="164">→ ouvre / lit les sections</text>
<text x="20" y="182">→ génération</text>
<text x="20" y="218" font-weight="700">Idéal pour :</text>
<text x="20" y="236" font-size="11">lecture multi-saut de longs</text>
<text x="20" y="252" font-size="11">documents structurés —</text>
<text x="20" y="268" font-size="11">PDF juridiques, financiers, techniques</text>
<text x="20" y="284" font-size="11">où le contexte couvre plusieurs pages</text>
<text x="20" y="306" font-weight="700">Coût :</text>
<text x="105" y="306">le plus élevé — mais</text>
<text x="105" y="320">dépensé uniquement si nécessaire</text>
</g>
</g>
</svg>
<figcaption style="text-align: center; font-style: italic; color: #5a6862; font-size: 0.9rem; margin-top: 0.75rem;">Les trois niveaux sont des stacks architecturalement différents, et non des variantes de profondeur du même. Le routeur en choisit un par requête.</figcaption>
</figure>

### Niveau 1 — RAG à vecteur plat (la voie rapide / économique)

Pour les requêtes factuelles claires dont la réponse unique se trouve dans un seul chunk : embedder la requête, récupérer le top-k par similarité cosinus, injecter le contexte, générer. L'architecture RAG classique que l'article original de 2025 décrivait comme « de première génération » — utilisée ici comme voie de *premier recours* pour les requêtes qui n'ont véritablement besoin de rien de plus. Latence p95 sous 300 ms, centimes par requête, sans surcoût de reranker.

### Niveau 2 — Hybride BM25 + fusion dense + reranking

Pour les requêtes où les signaux lexicaux et sémantiques divergent. BM25 capte les besoins de correspondance exacte (codes produits, noms de personnes, acronymes techniques, chaînes d'erreur) ; les vecteurs denses captent paraphrase et synonymie. **Reciprocal Rank Fusion** fusionne les deux listes de résultats ; un **reranker cross-encoder** évalue le top-N fusionné et réordonne par pertinence conjointe requête-document. C'est l'architecture publiée par Anthropic sous le nom de **Contextual Retrieval**[^contextual-retrieval-2024] et ce que la plupart des équipes RAG compétentes de 2026 livrent par défaut. Divinci la traite comme le niveau *intermédiaire* — la bonne réponse pour la plupart des requêtes, mais ni la voie la moins chère ni la plus profonde.

### Niveau 3 — Page-index + traversée agentique de documents

Pour les requêtes qui exigent une lecture multi-saut de longs documents structurés — les contrats juridiques, les 10-K financiers et les spécifications techniques où la réponse requiert la synthèse d'un contexte couvrant des sections non adjacentes.

À l'ingestion, nous construisons un arbre hiérarchique de *table des matières* sur le document : titres, sous-titres, légendes, notes de bas de page — un index structurel sans vecteurs avec un court résumé généré par LLM à chaque nœud. À l'exécution, un agent parcourt l'arbre, décide quel sous-arbre est pertinent, ouvre ces sections, lit, puis décide ce qu'il faut consulter ensuite. **PageIndex de VectifyAI**[^pageindex-2025] est l'implémentation open-source autonome de cette idée et une solide validation que le troisième niveau existe — ils ne livrent que cela, en produit autonome. Divinci le traite comme le *troisième niveau* d'un routeur plutôt que comme la seule option, car la plupart des requêtes n'en ont pas besoin et en payer le coût à chaque fois serait du gaspillage.

### Pourquoi cet axe de routage diffère de celui des autres

Adaptive-RAG[^adaptive-rag-2024] (Jeong et al., NAACL 2024) route entre **pas de récupération / une étape / récupération itérative** — l'axe de profondeur. Les suites de 2025 — Probing-RAG[^probing-rag-2025], R2RAG[^r2rag-2025], LTRR[^ltrr-2025], RAGRouter-Bench[^ragrouter-bench-2026], « Query Routing for Retrieval-Augmented Language Models »[^query-routing-2505] — étendent toutes le même axe : *à quel point* cette requête a-t-elle besoin de récupération ? Elles routent entre des variantes plus profondes ou plus superficielles d'une seule architecture de récupération.

**Divinci route selon l'axe de l'architecture.** La même requête qu'une implémentation Adaptive-RAG classerait comme « itérative » pourrait être soit hybride Niveau 2 (si la requête tire profit de la fusion lexico-sémantique), soit page-index Niveau 3 (si elle nécessite une lecture multi-saut d'un long document) — ce sont des réponses architecturalement différentes, pas des variantes de profondeur. Les deux axes sont orthogonaux : la profondeur indique *combien de passes*, l'architecture indique *quel type de récupération à chaque passe*.

### Là où le pitch est le plus faible, en toute honnêteté

Le *concept* de routage RAG par requête est bien établi. Nous n'avons pas inventé le routage. La différenciation réelle est : **router à travers des stacks architecturalement distincts, dans un endpoint managé, avec la traversée niveau-3 de style PageIndex incluse.** Aucun hyperscaler ne livre cette combinaison aujourd'hui. **Cloudflare AI Search**[^cloudflare-ai-search-2026], **AWS Bedrock Knowledge Bases**[^bedrock-hybrid-2025], **Azure AI Search**[^azure-agentic-retrieval-2025] et **OpenAI Assistants File Search**[^openai-file-search] livrent tous un seul pipeline hybride (parfois avec un mode agentique séparé à sélectionner manuellement). **LlamaIndex RouterRetriever / RouterQueryEngine**[^llamaindex-router] est le plus proche conceptuellement, mais c'est une bibliothèque que les clients doivent assembler, calibrer et exploiter eux-mêmes.

### Ce que cela donne au niveau de l'API

Le routeur est invisible pour l'appelant. Un endpoint, une forme de requête, la réponse vous indique quel niveau a répondu pour que vous puissiez auditer :

```bash
curl -X POST https://api.divinci.app/v1/query \
  -H "Authorization: Bearer $DIVINCI_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "query":  "What clauses in the 2024 amendment override section 7.3?",
    "corpus": "legal-contracts-q4"
  }'

# Réponse (annotée)
{
  "answer": "...",
  "routing": {
    "tier_used":    "page-index-agentic",       # niveau 3
    "tier_reason":  "corpus juridique multi-saut, ≥3 sauts détectés",
    "alt_considered": ["hybrid"],
    "tier_costs": { "tier1": 0.003, "tier2": 0.018, "tier3": 0.124 }
  },
  "citations": [ /* … */ ]
}
```

Le client ne choisit pas de stack ; il n'en exécute pas trois. Le routeur s'en charge. La transparence d'audit sur le niveau ayant répondu fait partie de la réponse, pas enterrée dans des métriques — la même éthique d'auditabilité que celle intégrée au [reçu vindex](/blog/validating-and-releasing-custom-lms-in-regulated-fields/) et au [manifeste de release](/blog/how-to-build-an-llm-ci-cd-pipeline-with-divinci-ai/) de notre stack CI/CD.

### Comment le routeur décide réellement — routage appris, pas classifieur codé à la main

La version de ce routeur qui est livrée aujourd'hui n'utilise *pas* de caractéristiques de forme de requête codées à la main. Le mécanisme est le **routage appris par similarité d'embedding contre des paires historiques question→backend**, et fonctionne ainsi :

1. **Hacher la question entrante** (SHA-256, tronqué en clé de 16 caractères).
2. **Recherche KV par correspondance exacte** dans le store de routage par client — si cette question exacte a déjà été traitée, dispatcher immédiatement vers le backend qui s'est le mieux comporté la dernière fois.
3. **En cas d'absence, embedder la question et effectuer une recherche cosinus** dans un index en cache d'embeddings de questions historiques. Si le voisin le plus proche dépasse un **seuil cosinus de 0,88**, dispatcher vers son backend.
4. **En l'absence de correspondance au-dessus du seuil, repli** vers le backend par défaut configuré pour le corpus.

Les entrées de routage portent un **TTL de 30 jours** ; les entrées obsolètes déclenchent un nouveau benchmark à la prochaine recherche, ce qui permet au modèle de routage de rester frais à mesure que le corpus et le mix de trafic évoluent. Le signal « qui a le mieux performé la dernière fois » est alimenté par deux sources amont : les sélections explicites de type arène A/B faites par le client, et la sortie de notre auto-correction interne qui compare les récupérations entre backends sur des requêtes représentatives. Les deux écrivent dans le store d'historique de routage par client ; le routeur consomme l'un comme l'autre.

C'est notablement différent des routeurs académiques publiés ([Adaptive-RAG](https://aclanthology.org/2024.naacl-long.389/) et ses suites), qui classifient la requête *en amont* par complexité. Notre approche apprise **fait davantage confiance à l'évidence historique qu'aux heuristiques de forme de requête**, car empiriquement la même forme de requête se comporte différemment selon les corpus — une requête « comparer X à travers Y » sur des contrats juridiques exige une traversée page-index Niveau 3 ; la même forme de requête sur un corpus FAQ plat se contente du Niveau 1. Laisser le modèle de routage apprendre cette distinction par corpus, plutôt que la deviner à partir de la syntaxe de la requête, est le choix de conception qui a réellement été livré.

**Une note sur les trois niveaux conceptuels et la liste réelle des backends.** Les trois niveaux ci-dessus constituent un *spectre conceptuel* utile (économique-rapide / équilibré / profond-délibéré). Le routeur lui-même dispatche vers l'un d'**un ensemble plus large de backends nommés** — `pageindex` (de forme Niveau 3), `neo4j-hybrid` (récupération à graphe enrichi), `raptor` (traversée d'arbre), `lightrag` (recherche entités + communautés) et des moteurs purement vectoriels sur `qdrant` / `cloudflare-v2` / `couchbase-byok` / `vertex-ai-vector-search-v2` / `mongodb-atlas` / `redis-vector-search`. L'hybride Niveau 2 (BM25 + fusion dense + reranker cross-encoder) est livré dans notre **canvas de workflow** comme nœud composable aujourd'hui, et figure sur la feuille de route comme backend auto-routable ; si le Niveau 2 est la bonne réponse pour votre corpus dès maintenant, vous le composez en tant que workflow, pas en tant que cible de routage. Nous l'intégrerons dans l'auto-routeur dès que les données de routage par corpus le justifieront.

La décision du routeur est tracée aujourd'hui et surfacée via la piste d'audit ; les métadonnées de routage complètes dans la réponse (les champs `routing.tier_used` / `tier_reason` / `tier_costs` montrés plus haut) figurent sur la feuille de route — le schéma de **CI fantôme** de notre [article sur les tests CI](/blog/ci-testing-for-custom-language-models-in-2026/) est la façon dont nous validerons le changement avant de l'activer.

### Quand cela compte le plus

Un client disposant d'un corpus homogène et d'une forme de requête uniforme obtient un seul niveau optimal et tire peu profit du routage — il pourrait choisir le Niveau 2 manuellement et en rester là. Le coin se trouve chez les entreprises aux **corpus mixtes et aux formes de requêtes mixtes** : une équipe juridique qui pose à la fois « quelle est la définition de la force majeure dans notre contrat standard ? » (Niveau 1) et « parmi nos 47 contrats fournisseurs, lesquels ont des clauses de résiliation non standard et quels sont les schémas ? » (Niveau 3). Le routage entre architectures est ce qui permet à un seul endpoint de bien servir les deux sans payer les coûts du Niveau 3 sur la requête Niveau 1.

C'est dans ce cas qu'un endpoint managé unique avec trois stacks architecturalement distincts derrière lui justifie sa place.

## La promesse et les limites du RAG de première génération

Les systèmes RAG traditionnels suivent un modèle simple : intégrer des documents dans l'espace vectoriel, récupérer des morceaux pertinents en fonction de la similarité sémantique et injecter ce contexte dans le prompt du LLM. Bien que cette approche se soit avérée efficace pour les scénarios de questions-réponses de base, elle fait face à plusieurs défis fondamentaux :

### Contraintes de fenêtre de contexte

Même avec les LLM modernes supportant des fenêtres de contexte de 100K+ tokens, le défi n'est pas seulement d'intégrer plus de contenu - c'est de maintenir la cohérence et la pertinence à travers diverses sources d'information. Lorsqu'il s'agit de requêtes complexes nécessitant la synthèse d'informations provenant de plusieurs documents, une simple concaténation conduit souvent à une surcharge d'information plutôt qu'à des insights.

### Limites de la recherche sémantique

La recherche par similarité vectorielle, bien que puissante, peut manquer des relations nuancées entre les concepts. Une requête sur « l'évaluation des risques financiers » pourrait ne pas récupérer de documents discutant des « credit default swaps » si l'espace d'embedding ne capture pas efficacement ces connexions sémantiques.

### Stratégies de récupération statiques

La plupart des implémentations RAG utilisent des modèles de récupération fixes qui ne s'adaptent pas à la complexité de la requête ou au contexte. Une simple question factuelle nécessite une logique de récupération différente d'une demande analytique complexe, pourtant la plupart des systèmes les traitent de manière identique.

![[Architecture RAG avancée]](/images/autorag-still.png)
*Les systèmes RAG modernes emploient des pipelines de récupération et de raisonnement multi-étapes sophistiqués*

## L'évolution de l'architecture RAG

La prochaine génération de systèmes RAG aborde ces limites à travers plusieurs innovations clés :

### Pipelines de récupération multi-étapes

Plutôt qu'une seule étape de récupération, les systèmes RAG avancés emploient des pipelines multi-étapes qui affinent et élargissent progressivement l'espace de recherche :

1. **Analyse de requête** : Comprendre l'intention de la requête, la complexité et les types d'information requis
2. **Récupération initiale** : Recherche sémantique large pour identifier les documents candidats
3. **Expansion du contexte** : Suivre les citations, documents liés et références croisées
4. **Filtrage de pertinence** : Appliquer un filtrage spécifique à la requête pour éliminer le bruit
5. **Synthèse du contexte** : Organiser l'information récupérée en contexte cohérent et structuré

### Transformation et décomposition de requêtes

Les requêtes complexes nécessitent souvent une décomposition en sous-questions qui peuvent être traitées indépendamment avant la synthèse. Par exemple :

```python
# Exemple de transformation de requête
original_query = "Comment les avancées de l'informatique quantique impactent-elles la sécurité des cryptomonnaies ?"

decomposed_queries = [
    "Quelles sont les dernières avancées en informatique quantique ?",
    "Comment l'informatique quantique menace-t-elle les méthodes cryptographiques actuelles ?",
    "Quelles mesures de sécurité des cryptomonnaies sont résistantes au quantique ?",
    "Chronologie pour que les ordinateurs quantiques cassent le chiffrement actuel"
]
```

### Récupération et raisonnement récursifs

![[Processus de récupération récursive]](/images/autorag-retrieval-optimization.svg)
*La récupération récursive permet une exploration plus profonde des réseaux d'information*

Les systèmes RAG avancés peuvent explorer récursivement les réseaux d'information, suivant les pistes et les connexions pour construire une compréhension complète. Cette approche imite comment les chercheurs humains travaillent naturellement - en commençant par des sources initiales et en suivant les connexions pertinentes.

## Au-delà de la récupération de documents : Applications émergentes

À mesure que les systèmes RAG mûrissent, ils permettent des catégories entièrement nouvelles d'applications IA :

### Systèmes de connaissances améliorés par le raisonnement

Au lieu de simplement récupérer et présenter l'information, les systèmes RAG de nouvelle génération peuvent :

- **Identifier les lacunes de connaissances** : Reconnaître quand l'information disponible est insuffisante pour des réponses confiantes
- **Validation par références croisées** : Vérifier la cohérence entre plusieurs sources
- **Raisonnement temporel** : Comprendre comment la validité de l'information change au fil du temps
- **Analyse causale** : Tracer les relations de cause à effet à travers les collections de documents

### Navigation dynamique de graphes de connaissances

Les systèmes RAG sont de plus en plus intégrés avec des graphes de connaissances, permettant une exploration dynamique des relations d'entités et des connexions sémantiques que la recherche vectorielle pure pourrait manquer.

### RAG multi-modal

Extension au-delà du texte pour incorporer images, graphiques, tableaux et autres types de médias dans le processus de récupération et de raisonnement. Cela est particulièrement précieux pour la documentation technique, les rapports financiers et la littérature scientifique.

## Défis et orientations futures

Malgré ces avancées, plusieurs défis demeurent :

### Complexité computationnelle

La récupération multi-étapes et le raisonnement récursif augmentent significativement les besoins computationnels. L'optimisation de ces systèmes pour un déploiement en production nécessite une attention particulière aux stratégies de mise en cache, au traitement incrémental et à l'activation sélective des fonctionnalités avancées.

### Assurance qualité

Avec l'augmentation de la complexité du système vient le défi d'assurer la qualité et la fiabilité des sorties. Les métriques d'évaluation traditionnelles pour les systèmes RAG ne capturent pas adéquatement les caractéristiques de performance nuancées des pipelines de raisonnement multi-étapes.

### Complexité d'intégration

Les organisations ont besoin d'outils qui peuvent intégrer de manière transparente les capacités RAG avancées dans les flux de travail existants sans nécessiter une expertise IA extensive.

![[Processus d'optimisation AutoRAG]](/images/autorag-diagram.svg)
*L'optimisation RAG automatisée réduit la complexité de déploiement tout en améliorant les performances*

## La solution AutoRAG de Divinci AI

Chez Divinci AI, nous avons développé **AutoRAG** - un système automatisé qui optimise les pipelines RAG pour des cas d'usage et des ensembles de données spécifiques. AutoRAG aborde les défis clés du déploiement RAG de nouvelle génération :

- **Sélection d'architecture automatisée** : Choix de stratégies de récupération optimales basées sur les caractéristiques des documents et les modèles de requêtes
- **Optimisation dynamique des paramètres** : Ajustement continu des paramètres du système basé sur les retours utilisateurs et les métriques de performance
- **Intégration d'assurance qualité** : Évaluation et surveillance intégrées pour assurer une qualité de sortie cohérente
- **Intégration transparente** : API simples qui abstraient la complexité tout en fournissant l'accès aux capacités avancées

## Conclusion

L'avenir des systèmes RAG ne réside pas dans la simple récupération de documents, mais dans des systèmes de raisonnement sophistiqués qui peuvent naviguer dans des paysages d'information complexes, synthétiser diverses sources et fournir des insights nuancés. À mesure que ces systèmes mûrissent, ils passeront du statut de moteurs de recherche glorifiés à celui de véritables partenaires de connaissances qui augmentent les capacités de raisonnement humain.

Les organisations qui réussiront dans ce nouveau paysage seront celles qui peuvent déployer et optimiser efficacement ces systèmes RAG avancés - transformant leurs actifs d'information en avantages concurrentiels grâce à des applications IA intelligentes et conscientes du contexte.

Pour les organisations cherchant à aller au-delà des implémentations RAG de première génération, la clé est de commencer avec une base solide qui peut évoluer. Concentrez-vous sur la qualité des données, établissez des critères d'évaluation clairs et choisissez des plateformes qui peuvent croître avec vos besoins.

**Prêt à explorer le RAG de nouvelle génération pour votre organisation ?** [Contactez notre équipe](https://divinci.ai/contact) pour découvrir comment AutoRAG peut transformer vos processus de gestion des connaissances et de prise de décision.

## Références

[^1]: arXiv. « A Comprehensive Survey of Retrieval-Augmented Generation (RAG): Evolution, Current Landscape and Future Directions. » Octobre 2024. Synthèse académique complète documentant l'évolution et l'état actuel du RAG.

[^2]: Medium (Maheshus). « Retrieval-Augmented Generation (RAG): Real Advances in 2025. » Août 2025. Analyse positionnant le RAG comme cadre essentiel pour des agents linguistiques fiables, actualisables et auditables en 2025.

[^rag-survey-2026]: Singh et al. « Agentic Retrieval-Augmented Generation: A Survey on Agentic RAG. » arXiv:2501.09136 (janv. 2025, mis à jour jusqu'en 2026). Taxonomie du RAG agentique par cardinalité d'agents, structure de contrôle, autonomie et représentation des connaissances. <https://arxiv.org/abs/2501.09136>

[^sok-agentic-2026]: « SoK: Agentic Retrieval-Augmented Generation. » arXiv:2603.07379 (2026). Systématisation des connaissances sur la planification, l'orchestration de la récupération, la mémoire et l'invocation d'outils dans le RAG agentique. <https://arxiv.org/abs/2603.07379>

[^reasoning-rag-2025]: « Reasoning RAG via System 1 or System 2. » arXiv:2506.10408 (juin 2025). Formalise le passage de pipelines statiques à une récupération pilotée par le raisonnement qui décide quand, quoi et comment récupérer. <https://arxiv.org/html/2506.10408v1>

[^self-rag-2023]: Asai et al. « Self-RAG: Learning to Retrieve, Generate, and Critique through Self-Reflection. » arXiv:2310.11511. Le cadre des tokens de réflexion qui a ancré la lignée de travaux sur le RAG auto-correctif. <https://arxiv.org/pdf/2310.11511>

[^crag-2024]: Yan et al. « Corrective Retrieval Augmented Generation. » arXiv:2401.15884 (v3, 2024). Évaluateur de récupération léger externe avec trois voies correctives (correct / incorrect / ambigu). <https://arxiv.org/html/2401.15884v3>

[^lazy-graphrag-2024]: Microsoft Research. « LazyGraphRAG: Setting a New Standard for Quality and Cost. » Nov. 2024 ; intégré à Azure / Microsoft Discovery le 6 juin 2025. Coût d'indexation réduit à ~0,1 % de GraphRAG complet. <https://www.microsoft.com/en-us/research/blog/lazygraphrag-setting-a-new-standard-for-quality-and-cost/>

[^graphrag-1-2025]: Microsoft Research. « Moving to GraphRAG 1.0: Streamlining Ergonomics for Developers and Users. » 2025. Version « ergonomie de niveau production ». <https://www.microsoft.com/en-us/research/blog/moving-to-graphrag-1-0-streamlining-ergonomics-for-developers-and-users/>

[^graphrag-bench-2026]: « When to Use Graphs in RAG (GraphRAG-Bench). » arXiv:2506.05690 (ICLR 2026). Règle de décision empirique : la valeur du graphe croît avec la complexité de la requête. <https://arxiv.org/html/2506.05690v3>

[^u-niah-2025]: « U-NIAH: A Unified Framework for Long-Context Needle-in-a-Haystack Evaluation. » arXiv:2503.00353 (mars 2025). Les scores multi-aiguilles restent en retrait de 15 à 40 points par rapport à l'aiguille unique ; RULER en retrait de 10 à 25 points par rapport à NIAH-2. <https://arxiv.org/html/2503.00353v1>

[^mirage-2025]: « MIRAGE: A Multi-Instance Retrieval-Augmented Generation Evaluation Framework. » Findings of NAACL 2025, arXiv:2504.17137. 7 560 instances sur un pool de récupération de 37 800 entrées. <https://aclanthology.org/2025.findings-naacl.157/>

[^mirage-bench-2025]: « MIRAGE-Bench: Automatic Multilingual RAG Arena Benchmark. » NAACL 2025. Évaluation RAG multilingue sur 18 langues. <https://aclanthology.org/2025.naacl-long.14/>

[^colpali-2024]: Faysse et al. « ColPali: Efficient Document Retrieval with Vision Language Models. » arXiv:2407.01449 (2024). Embeddings VLM à interaction tardive directement sur les pages de documents rendues ; supprime l'étape d'OCR. <https://arxiv.org/abs/2407.01449>

[^vidore-v2-2025]: « ViDoRe Benchmark V2. » arXiv:2505.17166 (mai 2025). Benchmark v2 de récupération document-visuel. <https://arxiv.org/pdf/2505.17166>

[^gemini-embedding-2]: Google. « Introducing gemini-embedding-2. » Google Blog, 10 mars 2026. Modèle d'embedding unifié texte + image + vidéo + audio + PDF. 3 072 dimensions par défaut (1 536 / 768 via Matryoshka). Limites : 8 192 tokens texte · 6 images / requête · 120 s de vidéo · audio natif · PDF de 6 pages. Disponible via l'API Gemini et Vertex AI ; intégrations natives avec LangChain, LlamaIndex, Haystack, Weaviate, Qdrant, ChromaDB et Vertex Vector Search. <https://blog.google/innovation-and-ai/models-and-research/gemini-models/gemini-embedding-2/>

[^contextual-retrieval-2024]: Anthropic. « Introducing Contextual Retrieval. » Blog Anthropic, sept. 2024. Contexte explicatif par chunk ajouté avant l'embedding ; l'hybride embedding + BM25 + reranker est désormais le stack de production par défaut. Schémas de déploiement en production documentés dans les études de cas AWS Bedrock (juin 2025). <https://aws.amazon.com/blogs/machine-learning/contextual-retrieval-in-anthropic-using-amazon-bedrock-knowledge-bases/>

[^cloudflare-autorag-2025]: Cloudflare. « Introducing AutoRAG on Cloudflare. » Blog Cloudflare, avril 2025. Pipeline RAG managé : ingestion → chunking → embedding → Vectorize → génération Workers AI. <https://blog.cloudflare.com/introducing-autorag-on-cloudflare/>

[^cloudflare-ai-search-2026]: Cloudflare Developers. « AI Search release notes. » 2026. AutoRAG renommé AI Search. <https://developers.cloudflare.com/ai-search/platform/release-note/>

[^pageindex-2025]: VectifyAI. « PageIndex — hierarchical table-of-contents index with LLM tree-search retrieval. » Dépôt GitHub, 2025. Implémentation autonome de l'architecture du troisième niveau (traversée agentique hiérarchique sans vecteurs). <https://github.com/VectifyAI/PageIndex>

[^llamaindex-router]: LlamaIndex. « Router Retriever / RouterQueryEngine. » Sélecteur LLM/Pydantic qui choisit un ou plusieurs récupérateurs enregistrés par requête. Brique conceptuelle la plus proche d'un routeur d'architectures, mais c'est une bibliothèque (stacks à fournir). <https://docs.llamaindex.ai/en/stable/examples/retrievers/router_retriever/>

[^adaptive-rag-2024]: Jeong et al. « Adaptive-RAG: Learning to Adapt Retrieval-Augmented Large Language Models through Question Complexity. » NAACL 2024. Route par complexité de requête entre pas-de-récupération / une-étape / récupération itérative — le routeur canonique sur l'*axe de profondeur*. <https://aclanthology.org/2024.naacl-long.389/>

[^probing-rag-2025]: « Probing-RAG: Self-Probing to Guide Language Models in Selective Document Retrieval. » NAACL 2025. Suite 2025 prolongeant le routage selon l'axe de profondeur d'Adaptive-RAG.

[^r2rag-2025]: « R2RAG: Reasoning-Aware Routing for Retrieval-Augmented Generation. » NeurIPS 2025 (article primé). Routage selon l'axe de profondeur avec classification consciente du raisonnement.

[^ltrr-2025]: « LTRR: Learning To Rank Retrievers. » arXiv:2506.13743 (2025). Apprend à classer les récupérateurs par requête — sur l'axe de profondeur, pas sur l'axe d'architecture. <https://arxiv.org/pdf/2506.13743>

[^ragrouter-bench-2026]: « Lightweight Query Routing for RAG / RAGRouter-Bench. » arXiv:2604.03455 (2026). Benchmark de routage — encore une fois, des variantes selon l'axe de profondeur d'une seule architecture. <https://arxiv.org/html/2604.03455v1>

[^query-routing-2505]: « Query Routing for Retrieval-Augmented Language Models. » arXiv:2505.23052 (2025). <https://arxiv.org/abs/2505.23052>

[^bedrock-hybrid-2025]: AWS. « Bedrock Knowledge Bases — hybrid search with Aurora PostgreSQL and MongoDB Atlas. » Lancement avril 2025. Un seul pipeline hybride ; pas de routeur d'architectures. <https://aws.amazon.com/about-aws/whats-new/2025/04/amazon-bedrock-knowledge-bases-hybrid-search-aurora-postgresql-mongo-db-atlas-vector-stores/>

[^azure-agentic-retrieval-2025]: Microsoft. « Azure AI Search — Agentic Retrieval overview. » 2025. Offre d'hyperscaler la plus proche d'un pipeline de récupération multi-mode, mais l'utilisateur sélectionne le mode plutôt qu'un routeur ne choisisse par requête. <https://learn.microsoft.com/en-us/azure/search/agentic-retrieval-overview>

[^openai-file-search]: OpenAI. « Assistants API — File Search. » Hybride mot-clé+sémantique avec réécriture de requête et reranking ; pipeline unique réglable. <https://developers.openai.com/api/docs/assistants/tools/file-search>
