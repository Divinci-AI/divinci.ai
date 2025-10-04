+++
title = "AutoRAG - Génération Augmentée par Récupération Automatisée"
description = "Trouvez automatiquement le pipeline RAG optimal pour vos données avec la solution AutoRAG complète de Divinci AI"
template = "feature.html"
[extra]
feature_category = "data-management"
lang = "fr"
+++

<style>
/* Feature page specific styles matching original design */

.section-padding {
    padding: 4rem 0;
}

.section-heading {
    font-family: 'Fraunces', serif;
    font-size: 3rem;
    color: #1e3a2b;
    text-align: center;
    margin-top: 4rem;
    margin-bottom: 4rem;
}

.benefits-circle-container {
    position: relative;
    width: min(900px, 90vw);
    height: 1111px;
    margin: 0 auto;
    display: flex;
    align-items: center;
    justify-content: center;
}

/* Add more padding to the benefits section to accommodate the full circle */
.feature-benefits {
    padding: 8rem 0 12rem 0;
}

.center-benefit {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background: linear-gradient(135deg, rgba(30, 45, 102, 0.1), rgba(92, 226, 231, 0.1));
    border: 2px solid rgba(92, 226, 231, 0.3);
    border-radius: 50%;
    text-align: center;
    z-index: 2;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
}

.orbital-benefit {
    position: absolute;
    background: rgba(255, 255, 255, 0.9);
    border: 2px solid rgba(92, 226, 231, 0.2);
    border-radius: 50%;
    text-align: center;
    transition: all 0.3s ease;
    top: 50%;
    left: 50%;
}

.orbital-benefit:nth-child(2) { transform: translate(-50%, -50%) rotate(0deg) translateY(-400px) rotate(0deg); }
.orbital-benefit:nth-child(3) { transform: translate(-50%, -50%) rotate(72deg) translateY(-400px) rotate(-72deg); }
.orbital-benefit:nth-child(4) { transform: translate(-50%, -50%) rotate(144deg) translateY(-400px) rotate(-144deg); }
.orbital-benefit:nth-child(5) { transform: translate(-50%, -50%) rotate(216deg) translateY(-400px) rotate(-216deg); }
.orbital-benefit:nth-child(6) { transform: translate(-50%, -50%) rotate(288deg) translateY(-400px) rotate(-288deg); }

.orbital-benefit:nth-child(2):hover { transform: translate(-50%, -50%) rotate(0deg) translateY(-400px) rotate(0deg) scale(1.05); }
.orbital-benefit:nth-child(3):hover { transform: translate(-50%, -50%) rotate(72deg) translateY(-400px) rotate(-72deg) scale(1.05); }
.orbital-benefit:nth-child(4):hover { transform: translate(-50%, -50%) rotate(144deg) translateY(-400px) rotate(-144deg) scale(1.05); }
.orbital-benefit:nth-child(5):hover { transform: translate(-50%, -50%) rotate(216deg) translateY(-400px) rotate(-216deg) scale(1.05); }
.orbital-benefit:nth-child(6):hover { transform: translate(-50%, -50%) rotate(288deg) translateY(-400px) rotate(-288deg) scale(1.05); }

.orbital-benefit:hover {
    box-shadow: 0 8px 24px rgba(92, 226, 231, 0.3);
}

.benefit-icon svg {
    width: 60px;
    height: 60px;
    margin-bottom: 1rem;
}

.feature-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 20px;
    margin-top: 25px;
}

.feature-item {
    background: rgba(30, 45, 102, 0.1);
    border-radius: 10px;
    padding: 20px;
    border: 1px solid rgba(92, 226, 231, 0.2);
}

.timeline-step {
    position: relative;
    padding-left: 80px;
    margin-bottom: 3rem;
    padding-bottom: 1rem;
}

.step-number {
    position: absolute;
    left: 0;
    top: 5px;
    width: 60px;
    height: 60px;
    background: linear-gradient(135deg, #1e3a2b, #2d3c34);
    color: white;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.5rem;
    font-weight: 700;
    z-index: 1;
}

.case-studies-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 2rem;
    margin-top: 3rem;
}

.case-study-card {
    background: rgba(255, 255, 255, 0.9);
    padding: 2rem;
    border-radius: 12px;
    border: 1px solid rgba(92, 226, 231, 0.2);
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.05);
}

.related-features-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 2rem;
    margin-top: 2rem;
}

.related-feature-card {
    background: rgba(255, 255, 255, 0.9);
    padding: 2rem;
    border-radius: 12px;
    border: 1px solid rgba(92, 226, 231, 0.2);
    text-align: center;
}

.accordion-item {
    border: 1px solid rgba(92, 226, 231, 0.2);
    border-radius: 8px;
    margin-bottom: 1rem;
    overflow: hidden;
}

.accordion-trigger {
    width: 100%;
    padding: 1.5rem;
    background: rgba(30, 45, 102, 0.05);
    border: none;
    text-align: left;
    font-size: 1.1rem;
    font-weight: 600;
    cursor: pointer;
    transition: background-color 0.3s ease;
}

.accordion-trigger:hover {
    background: rgba(30, 45, 102, 0.1);
}

.accordion-panel {
    padding: 1.5rem;
    background: white;
}

.tag {
    display: inline-block;
    padding: 0.5rem 1rem;
    background: rgba(107, 70, 193, 0.1);
    color: #1e3a2b;
    border-radius: 20px;
    font-size: 0.9rem;
    margin: 0.25rem;
}

.text-link {
    color: #1e3a2b;
    text-decoration: none;
    font-weight: 600;
}

.text-link:hover {
    color: #2d3c34;
    text-decoration: underline;
}

.secondary-button {
    background-color: transparent;
    color: #1e3a2b;
    border: 2px solid #1e3a2b;
    padding: 12px 24px;
    border-radius: 8px;
    text-decoration: none;
    font-weight: 600;
    transition: all 0.3s ease;
}

.secondary-button:hover {
    background-color: #1e3a2b;
    color: white;
}

.metrics-container {
    display: flex;
    justify-content: space-around;
    text-align: center;
}

.metric-value {
    display: block;
    font-size: 2.5rem;
    font-weight: 700;
    color: #1e3a2b;
}

.metric-label {
    display: block;
    font-size: 0.9rem;
    color: #718096;
    margin-top: 0.5rem;
}

.testimonial {
    border-left: 4px solid #1e3a2b;
    padding-left: 2rem;
    margin: 2rem 0;
    font-style: italic;
}

.testimonial cite {
    display: block;
    margin-top: 1rem;
    font-weight: 600;
    color: #2d3c34;
}
</style>


<section id="feature-overview" class="feature-overview section-padding">
<div class="container">
<h2 class="section-heading" style="margin-top: 6rem; margin-bottom: 6rem;">Qu'est-ce qu'AutoRAG ?</h2>

<div class="autorag-diagram-container" style="text-align: center; margin: 2rem 0;">
  <img src="/images/autorag-diagram.svg" alt="Diagramme de connexion de base de connaissances AutoRAG" class="diagram-svg" style="width: 100%; max-width: 800px; height: auto;" />
</div>

<div class="overview-content">
<p style="font-size: 1.25rem; margin-bottom: 2rem;">AutoRAG est la solution complète de Divinci AI pour trouver automatiquement le pipeline RAG optimal pour vos données spécifiques et cas d'usage. Contrairement aux implémentations RAG génériques, AutoRAG évalue plusieurs combinaisons de stratégies de récupération et de génération pour déterminer ce qui fonctionne le mieux avec votre contenu unique.</p>

<p>Les implémentations RAG traditionnelles nécessitent une configuration manuelle extensive, un prétraitement de documents et un ajustement continu pour rester efficaces. De nombreuses organisations peinent à sélectionner les bons modules et pipelines RAG pour leurs données spécifiques, gaspillant un temps et des ressources précieux sur des configurations sous-optimales. AutoRAG élimine ces barrières en évaluant automatiquement diverses combinaisons de modules RAG, en gérant l'analyse de documents, l'optimisation du chunking, la sélection de stratégies de récupération et la génération de réponses, tout en apprenant et s'améliorant continuellement à partir des métriques d'évaluation.</p>

<p>Avec AutoRAG, vos applications d'IA d'entreprise accèdent instantanément aux informations propriétaires de votre organisation avec une précision et une pertinence sans précédent. Le système crée automatiquement des jeux de données de questions-réponses à partir de votre corpus, évalue plusieurs stratégies de récupération et de génération, et identifie la configuration optimale du pipeline, réduisant significativement les hallucinations et fournissant des réponses entièrement sourcées qui inspirent confiance à vos utilisateurs.</p>
</div>
</div>
</section>

<section id="feature-benefits" class="feature-benefits section-padding">
<div class="container">
<h2 class="section-heading" style="margin-top: 4rem; margin-bottom: 120px;">Avantages Clés</h2>

<div style="display: flex; justify-content: center; align-items: center; width: 100%;">
<div class="benefits-circle-container">
<div class="center-benefit" style="width: 365px; height: 365px; padding: 40px;">
<div class="benefit-icon">
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="80" height="80">
<circle cx="50" cy="50" r="45" stroke="#4a7c8a" stroke-width="1" fill="none" opacity="0.3" />
<circle cx="50" cy="50" r="35" stroke="#4a7c8a" stroke-width="1" fill="none" opacity="0.5" />
<path d="M30,50 L70,50" stroke="#4a7c8a" stroke-width="3" fill="none" />
<path d="M50,30 L50,70" stroke="#4a7c8a" stroke-width="3" fill="none" />
<circle cx="50" cy="50" r="15" stroke="#4a7c8a" stroke-width="2" fill="none">
<animate attributeName="r" values="15;20;15" dur="3s" repeatCount="indefinite" />
</circle>
</svg>
</div>
<h3>AutoRAG</h3>
<p>Génération Augmentée par Récupération automatisée qui connecte de manière transparente votre IA aux connaissances de votre organisation avec une configuration minimale et une précision maximale.</p>
</div>

<div class="orbital-benefit" style="width: 305px; height: 305px; padding: 30px;">
<div class="benefit-icon">
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="60" height="60">
<circle cx="50" cy="50" r="40" stroke="#4a7c8a" stroke-width="1" fill="none" opacity="0.3" />
<path d="M30,50 L70,50" stroke="#4a7c8a" stroke-width="3" fill="none" />
<path d="M50,30 L50,70" stroke="#4a7c8a" stroke-width="3" fill="none" />
<circle cx="50" cy="50" r="10" stroke="#4a7c8a" stroke-width="2" fill="none">
<animate attributeName="r" values="10;15;10" dur="3s" repeatCount="indefinite" />
</circle>
</svg>
</div>
<h3>Intégration Rapide</h3>
<p>Connectez votre base de connaissances en quelques minutes, pas en mois, avec un traitement et une indexation automatiques des documents.</p>
</div>

<div class="orbital-benefit" style="width: 305px; height: 305px; padding: 30px;">
<div class="benefit-icon">
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="60" height="60">
<circle cx="50" cy="50" r="40" stroke="#4a7c8a" stroke-width="1" fill="none" opacity="0.3" />
<path d="M30,50 C45,35 55,65 70,50" stroke="#4a7c8a" stroke-width="2" fill="none">
<animate attributeName="d" values="M30,50 C45,35 55,65 70,50;M30,50 C45,65 55,35 70,50;M30,50 C45,35 55,65 70,50" dur="6s" repeatCount="indefinite" />
</path>
<circle cx="30" cy="50" r="4" fill="#4a7c8a" opacity="0.7" />
<circle cx="70" cy="50" r="4" fill="#4a7c8a" opacity="0.7" />
</svg>
</div>
<h3>Récupération Adaptative</h3>
<p>Notre système sélectionne automatiquement la stratégie de récupération optimale pour chaque requête pour une pertinence maximale.</p>
</div>

<div class="orbital-benefit" style="width: 305px; height: 305px; padding: 30px;">
<div class="benefit-icon">
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="60" height="60">
<circle cx="50" cy="50" r="40" stroke="#4a7c8a" stroke-width="1" fill="none" opacity="0.3" />
<path d="M30,70 L70,30" stroke="#4a7c8a" stroke-width="2" fill="none" />
<circle cx="30" cy="70" r="5" fill="#4a7c8a" opacity="0.7" />
<circle cx="70" cy="30" r="5" fill="#4a7c8a" opacity="0.7" />
<path d="M30,30 L70,70" stroke="#4a7c8a" stroke-width="2" fill="none" stroke-dasharray="5,5" />
</svg>
</div>
<h3>Réduction des Hallucinations</h3>
<p>Réduit les hallucinations de l'IA jusqu'à 97% avec un contexte précis et une vérification des faits en temps réel.</p>
</div>

<div class="orbital-benefit" style="width: 305px; height: 305px; padding: 35px;">
<div class="benefit-icon">
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="60" height="60">
<circle cx="50" cy="50" r="40" stroke="#4a7c8a" stroke-width="1" fill="none" opacity="0.3" />
<path d="M50,30 C70,30 70,70 50,70 C30,70 30,30 50,30" stroke="#4a7c8a" stroke-width="2" fill="none">
<animate attributeName="d" values="M50,30 C70,30 70,70 50,70 C30,70 30,30 50,30;M50,30 C75,35 75,65 50,70 C25,65 25,35 50,30;M50,30 C70,30 70,70 50,70 C30,70 30,30 50,30" dur="8s" repeatCount="indefinite" />
</path>
<circle cx="50" cy="50" r="5" fill="#4a7c8a" opacity="0.7">
<animate attributeName="r" values="5;8;5" dur="4s" repeatCount="indefinite" />
</circle>
</svg>
</div>
<h3>Performance Auto-Améliorante</h3>
<p>Optimise continuellement les modèles de récupération et la génération de réponses basées sur les interactions utilisateur.</p>
</div>

<div class="orbital-benefit" style="width: 305px; height: 305px; padding: 30px;">
<div class="benefit-icon">
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="60" height="60">
<circle cx="50" cy="50" r="40" stroke="#4a7c8a" stroke-width="1" fill="none" opacity="0.3" />
<path d="M30,40 L70,40" stroke="#4a7c8a" stroke-width="2" fill="none" />
<path d="M30,60 L70,60" stroke="#4a7c8a" stroke-width="2" fill="none" />
<path d="M40,30 L40,70" stroke="#4a7c8a" stroke-width="2" fill="none" />
<path d="M60,30 L60,70" stroke="#4a7c8a" stroke-width="2" fill="none" />
</svg>
</div>
<h3>Support Multi-Format</h3>
<p>Traite divers types de contenu incluant documents, bases de données, wikis et sources de données structurées.</p>
</div>
</div>
</div>
</div>
</section>

<section id="feature-details" class="feature-details section-padding" style="padding-top: 6rem;">
<div class="container">
<h2 class="section-heading" style="margin-top: 6rem; margin-bottom: 6rem;">Comment Fonctionne AutoRAG</h2>

<!-- Tab Interface for Details -->
<div class="details-tabs" role="tablist" aria-label="Capacités AutoRAG" style="display: flex; justify-content: center; margin-bottom: 3rem; border-bottom: 2px solid rgba(92, 226, 231, 0.2);">
    <button id="tab1-trigger" class="tab-trigger" role="tab" aria-selected="true" aria-controls="tab1-content" style="background: none; border: none; color: #1e3a2b; font-size: 1.1rem; font-weight: 600; padding: 1rem 2rem; margin: 0 1rem; cursor: pointer; border-bottom: 3px solid #5ce2e7; transition: all 0.3s ease;">Processus de Création de Données</button>
    <button id="tab2-trigger" class="tab-trigger" role="tab" aria-selected="false" aria-controls="tab2-content" style="background: none; border: none; color: #718096; font-size: 1.1rem; font-weight: 600; padding: 1rem 2rem; margin: 0 1rem; cursor: pointer; border-bottom: 3px solid transparent; transition: all 0.3s ease;">Évaluation de Récupération</button>
    <button id="tab3-trigger" class="tab-trigger" role="tab" aria-selected="false" aria-controls="tab3-content" style="background: none; border: none; color: #718096; font-size: 1.1rem; font-weight: 600; padding: 1rem 2rem; margin: 0 1rem; cursor: pointer; border-bottom: 3px solid transparent; transition: all 0.3s ease;">Optimisation de Génération</button>
</div>

<div class="tab-content-container">
<!-- Tab 1 Content -->
<div id="tab1-content" role="tabpanel" aria-labelledby="tab1-trigger" class="tab-content active">
<h3 style="color: #1e3a2b; font-size: 1.5rem; margin-bottom: 1rem;">Traitement Intelligent de Documents et Création de Données</h3>
<p style="font-size: 1.125rem; margin-bottom: 2rem; color: #4a5568;">Le pipeline de traitement de documents d'AutoRAG transforme votre contenu brut en ensembles de données optimisés par un processus complet en quatre étapes : analyse de documents, découpage intelligent, création de corpus et génération automatique d'ensembles de données QA.</p>

<!-- Document Processing Visualization -->
<div style="text-align: center; margin: 2rem 0;">
<object data="/images/autorag-clean-test.svg" type="image/svg+xml" style="width: 100%; max-width: 800px; height: auto;">
<img src="/images/autorag-clean-test.svg" alt="Processus de création de données AutoRAG" style="width: 100%; max-width: 800px; height: auto;" />
</object>
<p style="text-align: center; margin-top: 10px; color: #8C9DB5; font-size: 14px;">Le processus complet de création de données d'AutoRAG transforme les documents bruts en corpus optimisé et ensembles de données QA</p>
</div>

<div class="feature-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px; margin-top: 25px;">
<div class="feature-item" style="background: rgba(30, 45, 102, 0.1); border-radius: 10px; padding: 20px; border: 1px solid rgba(92, 226, 231, 0.2);">
<div style="display: flex; align-items: flex-start;">
<div style="margin-right: 15px; color: #4a7c8a; font-size: 24px;">
<i class="fas fa-file-alt"></i>
</div>
<div>
<h4 style="font-size: 18px; font-weight: bold; margin-bottom: 8px; color: #1e3a2b;">Modules d'Analyse Avancés</h4>
<p style="font-size: 14px; line-height: 1.5; margin: 0;">Plusieurs méthodes d'analyse pour différents types de documents incluant PDFMiner, PyPDF, Unstructured et des analyseurs personnalisés pour formats spécialisés</p>
</div>
</div>
</div>
<div class="feature-item" style="background: rgba(30, 45, 102, 0.1); border-radius: 10px; padding: 20px; border: 1px solid rgba(92, 226, 231, 0.2);">
<div style="display: flex; align-items: flex-start;">
<div style="margin-right: 15px; color: #4a7c8a; font-size: 24px;">
<i class="fas fa-cut"></i>
</div>
<div>
<h4 style="font-size: 18px; font-weight: bold; margin-bottom: 8px; color: #1e3a2b;">Découpage Intelligent</h4>
<p style="font-size: 14px; line-height: 1.5; margin: 0;">Stratégies de découpage adaptatives qui préservent le contexte tout en optimisant la précision de récupération</p>
</div>
</div>
</div>
</div>
</div>

<!-- Tab 2 Content -->
<div id="tab2-content" role="tabpanel" aria-labelledby="tab2-trigger" class="tab-content" hidden>
<h3 style="color: #1e3a2b; font-size: 1.5rem; margin-bottom: 1rem;">Évaluation Complète de Récupération</h3>
<p style="font-size: 1.125rem; margin-bottom: 2rem; color: #4a5568;">Notre système AutoRAG évalue automatiquement plusieurs stratégies de récupération pour trouver l'approche optimale pour vos données spécifiques et cas d'usage.</p>

<!-- Vector Embedding Visualization -->
<div style="text-align: center; margin: 2rem 0;">
<img src="/images/autorag-vector-embedding-adjusted.svg" alt="Visualisation d'embedding vectoriel" style="width: 100%; max-width: 600px; height: auto;" />
</div>

<div class="feature-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px; margin-top: 25px;">
<div class="feature-item" style="background: rgba(30, 45, 102, 0.1); border-radius: 10px; padding: 20px; border: 1px solid rgba(92, 226, 231, 0.2);">
<div style="display: flex; align-items: flex-start;">
<div style="margin-right: 15px; color: #4a7c8a; font-size: 24px;">
<i class="fas fa-search"></i>
</div>
<div>
<h4 style="font-size: 18px; font-weight: bold; margin-bottom: 8px; color: #1e3a2b;">Méthodes de Récupération Multiples</h4>
<p style="font-size: 14px; line-height: 1.5; margin: 0;">Évalue diverses approches de récupération incluant BM25, récupérateurs denses, recherche hybride et stratégies de reclassement</p>
</div>
</div>
</div>
<div class="feature-item" style="background: rgba(30, 45, 102, 0.1); border-radius: 10px; padding: 20px; border: 1px solid rgba(92, 226, 231, 0.2);">
<div style="display: flex; align-items: flex-start;">
<div style="margin-right: 15px; color: #4a7c8a; font-size: 24px;">
<i class="fas fa-database"></i>
</div>
<div>
<h4 style="font-size: 18px; font-weight: bold; margin-bottom: 8px; color: #1e3a2b;">Intégration de Base de Données Vectorielle</h4>
<p style="font-size: 14px; line-height: 1.5; margin: 0;">Supporte plusieurs bases de données vectorielles et modèles d'embedding pour trouver la combinaison optimale</p>
</div>
</div>
</div>
</div>
</div>

<!-- Tab 3 Content -->
<div id="tab3-content" role="tabpanel" aria-labelledby="tab3-trigger" class="tab-content" hidden>
<h3 style="color: #1e3a2b; font-size: 1.5rem; margin-bottom: 1rem;">Optimisation et Évaluation de Génération</h3>
<p style="font-size: 1.125rem; margin-bottom: 2rem; color: #4a5568;">Le système d'optimisation avancé d'AutoRAG évalue plusieurs stratégies de génération pour trouver la configuration optimale pour vos données spécifiques et cas d'usage.</p>

<!-- Retrieval Optimization Visualization -->
<div style="text-align: center; margin: 2rem 0;">
<img src="/images/autorag-retrieval-optimization-adjusted.svg" alt="Visualisation d'optimisation de récupération" style="width: 100%; max-width: 600px; height: auto;" />
</div>

<div class="feature-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px; margin-top: 25px;">
<div class="feature-item" style="background: rgba(30, 45, 102, 0.1); border-radius: 10px; padding: 20px; border: 1px solid rgba(92, 226, 231, 0.2);">
<div style="display: flex; align-items: flex-start;">
<div style="margin-right: 15px; color: #4a7c8a; font-size: 24px;">
<i class="fas fa-cogs"></i>
</div>
<div>
<h4 style="font-size: 18px; font-weight: bold; margin-bottom: 8px; color: #1e3a2b;">Optimisation de Génération</h4>
<p style="font-size: 14px; line-height: 1.5; margin: 0;">Optimise automatiquement les prompts et paramètres de génération pour votre cas d'usage spécifique</p>
</div>
</div>
</div>
<div class="feature-item" style="background: rgba(30, 45, 102, 0.1); border-radius: 10px; padding: 20px; border: 1px solid rgba(92, 226, 231, 0.2);">
<div style="display: flex; align-items: flex-start;">
<div style="margin-right: 15px; color: #4a7c8a; font-size: 24px;">
<i class="fas fa-check-circle"></i>
</div>
<div>
<h4 style="font-size: 18px; font-weight: bold; margin-bottom: 8px; color: #1e3a2b;">Métriques Complètes</h4>
<p style="font-size: 14px; line-height: 1.5; margin: 0;">Évalue les performances en utilisant précision, rappel, F1, MRR, NDCG et métriques de taux de succès</p>
</div>
</div>
</div>
</div>
</div>
</div>
</div>
</section>

<script>
// Tab functionality
document.addEventListener('DOMContentLoaded', function() {
  console.log('Tab script loaded'); // Debug log
  
  // Get all tab components on the page
  const tabLists = document.querySelectorAll('[role="tablist"]');
  console.log('Found tab lists:', tabLists.length); // Debug log
  
  // Set up each tabbed interface
  tabLists.forEach(tabList => {
    const tabs = tabList.querySelectorAll('[role="tab"]');
    const tabPanels = document.querySelectorAll('[role="tabpanel"]');
    
    console.log('Found tabs:', tabs.length, 'panels:', tabPanels.length); // Debug log
    
    // Add click event to each tab
    tabs.forEach(tab => {
      tab.addEventListener('click', function(e) {
        console.log('Tab clicked:', e.currentTarget.id); // Debug log
        changeTabs(e);
      });
      
      // Handle keyboard events for accessibility
      tab.addEventListener('keydown', handleTabKeydown);
    });
    
    // Set initial state with the first tab active
    if (tabs.length > 0) {
      // Show the first panel and hide others initially
      tabPanels.forEach((panel, index) => {
        if (index === 0) {
          panel.hidden = false;
          panel.style.display = 'block';
        } else {
          panel.hidden = true;
          panel.style.display = 'none';
        }
      });
    }
  });
  
  /**
   * Change tabs when a tab is clicked
   */
  function changeTabs(e) {
    const target = e.currentTarget;
    const parent = target.parentNode;
    const grandparent = parent.parentNode;
    
    console.log('Changing tabs, target:', target.id); // Debug log
    
    // Get all tabs in this tablist
    const tabs = parent.querySelectorAll('[role="tab"]');
    
    // Hide all tabpanels
    const tabContainer = grandparent.parentNode;
    const tabPanels = tabContainer.querySelectorAll('[role="tabpanel"]');
    
    tabPanels.forEach(panel => {
      panel.hidden = true;
      panel.style.display = 'none';
      console.log('Hiding panel:', panel.id); // Debug log
    });
    
    // Set all tabs as unselected
    tabs.forEach(tab => {
      tab.setAttribute('aria-selected', 'false');
      tab.style.color = '#718096';
      tab.style.borderBottomColor = 'transparent';
    });
    
    // Set clicked tab as selected
    target.setAttribute('aria-selected', 'true');
    target.style.color = '#1e3a2b';
    target.style.borderBottomColor = '#5ce2e7';
    
    // Show the associated tabpanel
    const tabpanelID = target.getAttribute('aria-controls');
    const tabPanel = document.getElementById(tabpanelID);
    
    console.log('Showing panel:', tabpanelID, 'found:', !!tabPanel); // Debug log
    
    if (tabPanel) {
      tabPanel.hidden = false;
      tabPanel.style.display = 'block';
    }
  }
  
  /**
   * Handle keyboard navigation for tabs
   */
  function handleTabKeydown(e) {
    const target = e.currentTarget;
    const parent = target.parentNode;
    const tabs = Array.from(parent.querySelectorAll('[role="tab"]'));
    const currentIndex = tabs.indexOf(target);
    
    // Define which keys we're handling
    switch (e.key) {
      case 'ArrowRight':
      case 'ArrowDown':
        e.preventDefault();
        if (currentIndex < tabs.length - 1) {
          focusTab(tabs[currentIndex + 1]);
        } else {
          focusTab(tabs[0]); // Wrap to first tab
        }
        break;
        
      case 'ArrowLeft':
      case 'ArrowUp':
        e.preventDefault();
        if (currentIndex > 0) {
          focusTab(tabs[currentIndex - 1]);
        } else {
          focusTab(tabs[tabs.length - 1]); // Wrap to last tab
        }
        break;
        
      case 'Home':
        e.preventDefault();
        focusTab(tabs[0]); // Go to first tab
        break;
        
      case 'End':
        e.preventDefault();
        focusTab(tabs[tabs.length - 1]); // Go to last tab
        break;
        
      case 'Enter':
      case ' ':
        e.preventDefault();
        target.click(); // Activate the tab
        break;
    }
  }
  
  /**
   * Focus and click on a tab
   */
  function focusTab(tab) {
    tab.focus();
  }
});
</script>

<style>
/* Tab styling */
.tab-trigger:hover {
    color: #1e3a2b !important;
    border-bottom-color: rgba(92, 226, 231, 0.5) !important;
}

.tab-trigger[aria-selected="true"] {
    color: #1e3a2b !important;
    border-bottom-color: #5ce2e7 !important;
}

.tab-trigger[aria-selected="false"] {
    color: #718096 !important;
    border-bottom-color: transparent !important;
}

.tab-content {
    padding: 2rem 0;
}

.tab-content[hidden] {
    display: none;
}

.tab-content.active {
    display: block;
}

/* Responsive tabs */
@media (max-width: 768px) {
    .details-tabs {
        flex-direction: column !important;
        align-items: center !important;
    }
    
    .tab-trigger {
        margin: 0.5rem 0 !important;
        padding: 0.75rem 1.5rem !important;
    }
}
</style>

<section id="feature-implementation" class="feature-implementation section-padding">
<div class="container">
<h2 class="section-heading" style="margin-top: 6rem; margin-bottom: 6rem;">Processus d'Implémentation</h2>

<div class="implementation-timeline">
<div class="timeline-step">
<div class="step-number">1</div>
<div class="step-content">
<h3>Connexion de Sources de Connaissances</h3>
<p>Connectez vos référentiels de connaissances existants via notre interface d'intégration simple. AutoRAG supporte les connexions directes aux systèmes de stockage de documents, bases de données, bases de connaissances, wikis et outils internes via des connexions API sécurisées ou téléchargements directs de documents.</p>
</div>
</div>

<div class="timeline-step">
<div class="step-number">2</div>
<div class="step-content">
<h3>Création de Données et Optimisation de Pipeline</h3>
<p>Notre système transforme vos documents bruts en ensembles de données optimisés par notre processus complet en quatre étapes : analyse de documents, découpage intelligent, création de corpus et génération d'ensembles de données QA. Ces ensembles de données sont ensuite utilisés pour évaluer plusieurs configurations de pipeline RAG, identifiant automatiquement l'approche optimale pour vos données spécifiques et cas d'usage.</p>
</div>
</div>

<div class="timeline-step">
<div class="step-number">3</div>
<div class="step-content">
<h3>Intégration API et Déploiement</h3>
<p>Intégrez AutoRAG avec vos applications existantes via notre API REST ou utilisez nos connecteurs pré-construits pour les plateformes LLM populaires. Des options de configuration simples vous permettent de personnaliser les paramètres de récupération, l'authentification et les modèles de permissions utilisateur pour correspondre aux exigences de votre organisation.</p>
</div>
</div>
</div>

<div style="text-align: center; margin-top: 3rem;">
<a href="https://meetings.hubspot.com/michael-mooring/divinci-ai" class="secondary-button" target="_blank">Demander le Guide d'Implémentation</a>
</div>
</div>
</section>

<section id="case-studies" class="case-studies section-padding">
<div class="container">
<h2 class="section-heading" style="margin-top: 6rem; margin-bottom: 6rem;">Histoires de Succès</h2>

<div style="background: rgba(255, 255, 255, 0.9); padding: 3rem; border-radius: 12px; border: 1px solid rgba(92, 226, 231, 0.2); margin-bottom: 3rem;">
<h3 style="color: #1e3a2b; font-size: 2rem; margin-bottom: 1rem;">Société de Services Financiers Mondiale</h3>
<p style="font-size: 1.25rem; color: #2d3c34; margin-bottom: 2rem; font-weight: 600;">87% de réduction des hallucinations de l'IA tout en traitant plus de 15 000 requêtes clients par jour</p>
<p style="margin-bottom: 2rem;">Une société de services financiers leader avait besoin d'incorporer plus de 200 000 documents réglementaires et politiques internes dans leur assistant IA client. L'implémentation manuelle de RAG était estimée à plus de 8 mois. En utilisant AutoRAG, ils ont complété l'intégration en 3 semaines et atteint une précision sans précédent pour les questions de conformité réglementaire.</p>

<blockquote class="testimonial">
<p>"AutoRAG a transformé notre calendrier d'implémentation IA de trimestres en semaines. La capacité du système à récupérer avec précision les informations réglementaires tout en fournissant des citations appropriées a été révolutionnaire pour notre équipe de conformité."</p>
<cite>— Sarah Chen, CTO, Leader des Services Financiers</cite>
</blockquote>

<div class="metrics-container" style="margin-top: 2rem;">
<div class="metric">
<span class="metric-value">87%</span>
<span class="metric-label">Réduction des Hallucinations</span>
</div>
<div class="metric">
<span class="metric-value">93%</span>
<span class="metric-label">Temps d'Implémentation Économisé</span>
</div>
<div class="metric">
<span class="metric-value">15K+</span>
<span class="metric-label">Requêtes Quotidiennes Traitées</span>
</div>
</div>
</div>

<div class="case-studies-grid">
<div class="case-study-card">
<h3>Réseau de Prestataires de Soins de Santé</h3>
<p>Intégration de plus de 50 bases de connaissances disparates en 2 semaines, permettant une récupération précise d'informations médicales avec 99,8% de précision.</p>
<a href="https://meetings.hubspot.com/michael-mooring/divinci-ai" class="text-link" target="_blank">Demander les Détails →</a>
</div>

<div class="case-study-card">
<h3>Conglomérat Manufacturier</h3>
<p>Réduction du temps de résolution du support technique de 73% en connectant AutoRAG à 15 ans de documentation d'équipement et d'enregistrements de maintenance.</p>
<a href="https://meetings.hubspot.com/michael-mooring/divinci-ai" class="text-link" target="_blank">Demander les Détails →</a>
</div>

<div class="case-study-card">
<h3>Cabinet Juridique Mondial</h3>
<p>Permettre aux assistants juridiques de traiter 3x plus de recherches de cas en implémentant AutoRAG sur plus de 12M de documents juridiques et précédents.</p>
<a href="https://meetings.hubspot.com/michael-mooring/divinci-ai" class="text-link" target="_blank">Demander les Détails →</a>
</div>
</div>
</div>
</section>

<section id="related-features" class="related-features section-padding">
<div class="container">
<h2 class="section-heading" style="margin-top: 6rem; margin-bottom: 6rem;">Fonctionnalités Connexes</h2>

<div class="related-features-grid">
<div class="related-feature-card">
<div style="margin-bottom: 1rem;">
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="64" height="64">
<circle cx="12" cy="12" r="11" fill="none" stroke="#1e3a2b" stroke-width="1" opacity="0.2"/>
<path d="M7,12 H17 M7,8 H17 M7,16 H13" stroke="#1e3a2b" stroke-width="2" stroke-linecap="round"/>
<circle cx="17" cy="16" r="3" fill="none" stroke="#2d3c34" stroke-width="2"/>
<path d="M17,14 L17,18 M15,16 L19,16" stroke="#2d3c34" stroke-width="2" stroke-linecap="round"/>
</svg>
</div>
<h3>Intégration de Base de Connaissances</h3>
<p>Connectez plusieurs sources de connaissances avec nos connecteurs spécialisés pour un flux de données transparent dans vos applications IA.</p>
<a href="/fr/quality-assurance/" class="text-link">En Savoir Plus →</a>
</div>

<div class="related-feature-card">
<div style="margin-bottom: 1rem;">
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="64" height="64">
<circle cx="12" cy="12" r="11" fill="none" stroke="#1e3a2b" stroke-width="1" opacity="0.2"/>
<rect x="6" y="6" width="12" height="12" rx="2" fill="none" stroke="#4a7c8a" stroke-width="2"/>
<path d="M9,12 L11,14 L15,10" stroke="#4a7c8a" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
</svg>
</div>
<h3>Assurance Qualité LLM</h3>
<p>Assurez précision et fiabilité avec nos tests complets et surveillance pour le contenu généré par IA.</p>
<a href="/fr/quality-assurance/" class="text-link">En Savoir Plus →</a>
</div>

<div class="related-feature-card">
<div style="margin-bottom: 1rem;">
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="64" height="64">
<circle cx="12" cy="12" r="11" fill="none" stroke="#1e3a2b" stroke-width="1" opacity="0.2"/>
<circle cx="12" cy="12" r="5" fill="none" stroke="#2d3c34" stroke-width="2"/>
<path d="M12,7 L12,5 M12,19 L12,17 M7,12 L5,12 M19,12 L17,12 M16.5,7.5 L18,6 M7.5,16.5 L6,18 M16.5,16.5 L18,18 M7.5,7.5 L6,6" stroke="#2d3c34" stroke-width="2" stroke-linecap="round"/>
</svg>
</div>
<h3>Gestion du Cycle de Sortie</h3>
<p>Rationalisez votre développement d'applications IA avec nos outils DevOps spécialisés pour les systèmes basés sur LLM.</p>
<a href="/fr/release-management/" class="text-link">En Savoir Plus →</a>
</div>
</div>
</div>
</section>

<section id="faq" class="faq-section section-padding">
<div class="container">
<h2 class="section-heading" style="margin-top: 6rem; margin-bottom: 6rem;">Questions Fréquemment Posées</h2>

<div class="accordion">
<div class="accordion-item">
<h3>
<button class="accordion-trigger">
                        Quels types de documents et sources de données AutoRAG peut-il traiter ?
</button>
</h3>
<div class="accordion-panel">
<p>AutoRAG peut traiter pratiquement tout contenu textuel incluant PDFs, documents Word, présentations PowerPoint, feuilles de calcul Excel, pages HTML, fichiers Markdown, référentiels de code, bases de données, wikis, bases de connaissances et données structurées provenant d'APIs. Le système gère également les images avec du contenu textuel via OCR et peut extraire des données de tableaux, diagrammes et autres éléments visuels.</p>
<p>Pour les formats de données spécialisés ou les systèmes propriétaires, notre équipe peut développer des connecteurs personnalisés pour assurer une intégration transparente avec votre infrastructure de connaissances existante.</p>
<div style="margin-top: 1rem;">
<span class="tag">PDF</span>
<span class="tag">Word</span>
<span class="tag">Excel</span>
<span class="tag">HTML</span>
<span class="tag">Markdown</span>
<span class="tag">Bases de données</span>
<span class="tag">Données API</span>
</div>
</div>
</div>

<div class="accordion-item">
<h3>
<button class="accordion-trigger">
                        Comment AutoRAG gère-t-il la sécurité des données et les exigences de conformité ?
</button>
</h3>
<div class="accordion-panel">
<p>AutoRAG est conçu avec une sécurité de niveau entreprise au cœur. Tout le traitement des données se produit dans votre périmètre de sécurité, soit dans votre environnement cloud ou sur site. Le système supporte :</p>
<ul>
<li>Chiffrement de bout en bout pour toutes les données au repos et en transit</li>
<li>Contrôles d'accès basés sur les rôles pour la visibilité des documents</li>
<li>Options de résidence des données pour les exigences de conformité régionales</li>
<li>Journalisation d'audit pour toutes les opérations système et accès aux données</li>
<li>Conformité avec GDPR, HIPAA, SOC 2 et autres cadres réglementaires</li>
</ul>
<p>De plus, nos options de déploiement incluent des environnements isolés pour les exigences de sécurité les plus élevées.</p>
</div>
</div>

<div class="accordion-item">
<h3>
<button class="accordion-trigger">
                        Quels fournisseurs et modèles LLM AutoRAG supporte-t-il ?
</button>
</h3>
<div class="accordion-panel">
<p>AutoRAG est agnostique au modèle et fonctionne avec pratiquement tout LLM, incluant :</p>
<ul>
<li>Modèles OpenAI (GPT-4, GPT-3.5, etc.)</li>
<li>Modèles Anthropic (série Claude)</li>
<li>Modèles Google (série Gemini)</li>
<li>Modèles Meta (série Llama)</li>
<li>Modèles Mistral</li>
<li>Modèles open source (déployables sur votre infrastructure)</li>
<li>Modèles personnalisés affinés</li>
</ul>
<p>Le système optimise automatiquement sa sortie pour les limitations de fenêtre de contexte et capacités spécifiques de chaque modèle. Notre console de gestion permet de basculer facilement entre les modèles et de faire des tests A/B pour des performances optimales.</p>
</div>
</div>
</div>
</div>
</section>

<section style="background: linear-gradient(135deg, rgba(107, 70, 193, 0.1), rgba(92, 226, 231, 0.1)); padding: 4rem 0;">
<div class="container" style="text-align: center;">
<h2 style="font-size: 2.5rem; color: #1e3a2b; margin-bottom: 1rem;">Prêt à Commencer ?</h2>
<p style="font-size: 1.25rem; margin-bottom: 2rem; color: #2d3c34;">Transformez vos applications IA avec la solution complète d'AutoRAG.</p>
<div style="display: flex; gap: 1rem; justify-content: center; flex-wrap: wrap;">
<a href="https://meetings.hubspot.com/michael-mooring/divinci-ai" class="secondary-button" target="_blank">Demander une Démo</a>
<a href="https://docs.divinci.ai/autorag" class="text-link" style="padding: 12px 24px; border: 2px solid transparent;">Voir Documentation</a>
</div>
</div>
</section>