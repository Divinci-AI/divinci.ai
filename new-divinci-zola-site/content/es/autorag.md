+++
title = "AutoRAG - Generación Aumentada por Recuperación Automatizada"
description = "Encuentra automáticamente el pipeline RAG óptimo para tus datos con la solución integral AutoRAG de Divinci AI"
template = "feature.html"
[extra]
feature_category = "data-management"
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
    margin-bottom: 2rem;
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
    background: linear-gradient(135deg, rgba(30, 45, 102, 0.1), rgba(184, 160, 128, 0.1));
    border: 2px solid rgba(184, 160, 128, 0.3);
    border-radius: 50%;
    text-align: center;
    z-index: 2;
}

.orbital-benefit {
    position: absolute;
    background: rgba(255, 255, 255, 0.9);
    border: 2px solid rgba(184, 160, 128, 0.2);
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
    box-shadow: 0 8px 24px rgba(184, 160, 128, 0.3);
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
    border: 1px solid rgba(184, 160, 128, 0.2);
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
    border: 1px solid rgba(184, 160, 128, 0.2);
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
    border: 1px solid rgba(184, 160, 128, 0.2);
    text-align: center;
}

.accordion-item {
    border: 1px solid rgba(184, 160, 128, 0.2);
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

/* Mobile responsive styles for benefits */
@media (max-width: 768px) {
    .feature-benefits {
        padding: 4rem 0 6rem;
        overflow: hidden !important;
    }
    
    .feature-benefits .container {
        overflow: hidden !important;
        padding: 0 1rem;
    }
    
    /* Hide the wrapper div on mobile to prevent overflow */
    .feature-benefits .container > div[style*="display: flex"] {
        display: block !important;
        width: auto !important;
        overflow: hidden !important;
    }
    
    .benefits-circle-container {
        display: flex !important;
        flex-direction: column !important;
        align-items: center !important;
        height: auto !important;
        width: 100% !important;
        max-width: 100% !important;
        position: static !important;
        gap: 2rem !important;
        margin: 0 auto !important;
        overflow: hidden !important;
    }
    
    .center-benefit {
        position: static;
        transform: none;
        margin-bottom: 2rem;
        width: min(300px, 85vw) !important;
        height: min(300px, 85vw) !important;
        padding: 25px !important;
        display: flex !important;
        flex-direction: column !important;
        justify-content: center !important;
        align-items: center !important;
        text-align: center !important;
    }
    
    .orbital-benefit {
        position: static;
        transform: none !important;
        width: min(300px, 85vw) !important;
        height: min(300px, 85vw) !important;
        margin: 0;
        padding: 25px !important;
        display: flex !important;
        flex-direction: column !important;
        justify-content: center !important;
        align-items: center !important;
        text-align: center !important;
    }
    
    /* Adjust text sizes for mobile */
    .center-benefit h3,
    .orbital-benefit h3 {
        font-size: 1.2rem !important;
        margin: 0.5rem 0 !important;
    }
    
    .center-benefit p,
    .orbital-benefit p {
        font-size: 0.9rem !important;
        line-height: 1.4 !important;
        margin: 0 !important;
        word-wrap: break-word !important;
        overflow-wrap: break-word !important;
        hyphens: auto !important;
    }
    
    .benefit-icon {
        margin-bottom: 0.5rem !important;
    }
    
    .benefit-icon svg {
        width: 50px !important;
        height: 50px !important;
    }
    
    .orbital-benefit:hover {
        transform: scale(1.02) !important;
    }
    
    .section-heading {
        margin-bottom: 3rem !important;
        margin-top: 2rem !important;
    }
    
    /* Override the fixed height completely */
    #feature-benefits .benefits-circle-container {
        height: auto !important;
        min-height: auto !important;
        max-height: none !important;
    }
    
    /* Ensure no overflow on section */
    #feature-benefits {
        overflow: hidden !important;
    }
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


<section id="feature-overview" class="feature-overview section-padding">
<div class="container">
<h2 class="section-heading" style="margin-top: 6rem; margin-bottom: 6rem;">¿Qué es AutoRAG?</h2>

<div class="autorag-diagram-container" style="text-align: center; margin: 2rem 0;">
  <img src="https://pub-fb3e683317b24cf8b4260121edae02be.r2.dev/autorag-diagram.svg" alt="Diagrama de Conexión de Base de Conocimiento AutoRAG" class="diagram-svg" style="width: 100%; max-width: 800px; height: auto;" />
</div>

<div class="overview-content">
<p style="font-size: 1.25rem; margin-bottom: 2rem;">AutoRAG es la solución integral de Divinci AI para encontrar automáticamente el pipeline RAG óptimo para tus datos específicos y casos de uso. A diferencia de las implementaciones RAG genéricas, AutoRAG evalúa múltiples combinaciones de estrategias de recuperación y generación para determinar qué funciona mejor con tu contenido único.</p>

<p>Las implementaciones RAG tradicionales requieren configuración manual extensa, preprocesamiento de documentos y ajustes continuos para mantenerse efectivas. Muchas organizaciones luchan con la selección de los módulos y pipelines RAG correctos para sus datos específicos, desperdiciando tiempo y recursos valiosos en configuraciones subóptimas. AutoRAG elimina estas barreras evaluando automáticamente varias combinaciones de módulos RAG, manejando el análisis de documentos, optimización de chunking, selección de estrategias de recuperación y generación de respuestas, todo mientras aprende y mejora continuamente a partir de métricas de evaluación.</p>

<p>Con AutoRAG, tus aplicaciones de IA empresarial obtienen acceso instantáneo a la información propietaria de tu organización con precisión y relevancia sin precedentes. El sistema crea automáticamente conjuntos de datos de preguntas y respuestas a partir de tu corpus, evalúa múltiples estrategias de recuperación y generación, e identifica la configuración óptima del pipeline, reduciendo significativamente las alucinaciones y proporcionando respuestas completamente respaldadas por fuentes que generan confianza con tus usuarios.</p>
</div>
</div>
</section>

<section id="feature-benefits" class="feature-benefits section-padding">
<div class="container">
<h2 class="section-heading" style="margin-top: 4rem; margin-bottom: 120px;">Beneficios Clave</h2>

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
<p>Generación Aumentada por Recuperación Automatizada que conecta sin problemas tu IA al conocimiento de tu organización con configuración mínima y máxima precisión.</p>
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
<h3>Integración Rápida</h3>
<p>Conecta tu base de conocimientos en minutos, no meses, con procesamiento e indexación automática de documentos.</p>
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
<h3>Recuperación Adaptativa</h3>
<p>Nuestro sistema selecciona automáticamente la estrategia de recuperación óptima para cada consulta para máxima relevancia.</p>
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
<h3>Alucinaciones Reducidas</h3>
<p>Reduce las alucinaciones de IA hasta en un 97% con contexto preciso y verificación de hechos en tiempo real.</p>
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
<h3>Rendimiento Auto-mejorable</h3>
<p>Optimiza continuamente los patrones de recuperación y la generación de respuestas basándose en las interacciones del usuario.</p>
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
<h3>Soporte Multi-formato</h3>
<p>Procesa diversos tipos de contenido incluyendo documentos, bases de datos, wikis y fuentes de datos estructurados.</p>
</div>
</div>
</div>
</div>
</section>

<section id="feature-details" class="feature-details section-padding">
<div class="container">
<h2 class="section-heading" style="margin-top: 6rem; margin-bottom: 6rem;">Cómo Funciona AutoRAG</h2>

<div class="details-tabs" role="tablist" aria-label="Pestañas de detalles de AutoRAG" style="display: flex; justify-content: center; margin-bottom: 3rem; border-bottom: 1px solid rgba(184, 160, 128, 0.2); padding-bottom: 1px;">
    <button id="tab1-trigger" class="tab-trigger" role="tab" aria-selected="true" aria-controls="tab1-content" style="background: none; border: none; color: #1e3a2b; font-size: 1.1rem; font-weight: 600; padding: 1rem 2rem; margin: 0 1rem; cursor: pointer; border-bottom: 3px solid var(--color-accent-primary, #b8a080); transition: all 0.3s ease;">Procesamiento de Documentos</button>
    <button id="tab2-trigger" class="tab-trigger" role="tab" aria-selected="false" aria-controls="tab2-content" style="background: none; border: none; color: #718096; font-size: 1.1rem; font-weight: 600; padding: 1rem 2rem; margin: 0 1rem; cursor: pointer; border-bottom: 3px solid transparent; transition: all 0.3s ease;">Evaluación de Recuperación</button>
    <button id="tab3-trigger" class="tab-trigger" role="tab" aria-selected="false" aria-controls="tab3-content" style="background: none; border: none; color: #718096; font-size: 1.1rem; font-weight: 600; padding: 1rem 2rem; margin: 0 1rem; cursor: pointer; border-bottom: 3px solid transparent; transition: all 0.3s ease;">Optimización de Generación</button>
</div>

<div class="tab-content-container">
<!-- Tab 1 Content -->
<div id="tab1-content" role="tabpanel" aria-labelledby="tab1-trigger" class="tab-content active">
<h3 style="color: #1e3a2b; font-size: 1.5rem; margin-bottom: 1rem;">Procesamiento Inteligente de Documentos y Creación de Datos</h3>
<p style="font-size: 1.125rem; margin-bottom: 2rem; color: #4a5568;">El pipeline de procesamiento de documentos de AutoRAG transforma tu contenido en bruto en conjuntos de datos optimizados a través de un proceso integral de cuatro etapas: análisis de documentos, chunking inteligente, creación de corpus y generación automatizada de conjuntos de datos de QA.</p>

<!-- Document Processing Visualization -->
<div style="text-align: center; margin: 2rem 0;">
<object data="/images/autorag-clean-test.svg" type="image/svg+xml" style="width: 100%; max-width: 800px; height: auto;">
<img src="https://pub-fb3e683317b24cf8b4260121edae02be.r2.dev/autorag-clean-test.svg" alt="Proceso de Creación de Datos AutoRAG" style="width: 100%; max-width: 800px; height: auto;" />
</object>
<p style="text-align: center; margin-top: 10px; color: #8C9DB5; font-size: 14px;">El proceso integral de creación de datos de AutoRAG transforma documentos en bruto en corpus optimizado y conjuntos de datos de QA</p>
</div>

<div class="feature-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px; margin-top: 25px;">
<div class="feature-item" style="background: rgba(30, 45, 102, 0.1); border-radius: 10px; padding: 20px; border: 1px solid rgba(184, 160, 128, 0.2);">
<div style="display: flex; align-items: flex-start;">
<div style="margin-right: 15px; color: #4a7c8a; font-size: 24px;">
<i class="fas fa-file-alt"></i>
</div>
<div>
<h4 style="font-size: 18px; font-weight: bold; margin-bottom: 8px; color: #1e3a2b;">Módulos de Análisis Avanzados</h4>
<p style="font-size: 14px; line-height: 1.5; margin: 0;">Múltiples métodos de análisis para diferentes tipos de documentos incluyendo PDFMiner, PyPDF, Unstructured y analizadores personalizados para formatos especializados</p>
</div>
</div>
</div>
<div class="feature-item" style="background: rgba(30, 45, 102, 0.1); border-radius: 10px; padding: 20px; border: 1px solid rgba(184, 160, 128, 0.2);">
<div style="display: flex; align-items: flex-start;">
<div style="margin-right: 15px; color: #4a7c8a; font-size: 24px;">
<i class="fas fa-cut"></i>
</div>
<div>
<h4 style="font-size: 18px; font-weight: bold; margin-bottom: 8px; color: #1e3a2b;">Chunking Inteligente</h4>
<p style="font-size: 14px; line-height: 1.5; margin: 0;">Estrategias de chunking adaptativas que preservan el contexto mientras optimizan la precisión de recuperación</p>
</div>
</div>
</div>
</div>
</div>

<!-- Tab 2 Content -->
<div id="tab2-content" role="tabpanel" aria-labelledby="tab2-trigger" class="tab-content" hidden>
<h3 style="color: #1e3a2b; font-size: 1.5rem; margin-bottom: 1rem;">Evaluación Integral de Recuperación</h3>
<p style="font-size: 1.125rem; margin-bottom: 2rem; color: #4a5568;">Nuestro sistema AutoRAG evalúa automáticamente múltiples estrategias de recuperación para encontrar el enfoque óptimo para tus datos y casos de uso específicos.</p>

<!-- Vector Embedding Visualization -->
<div style="text-align: center; margin: 2rem 0;">
<img src="https://pub-fb3e683317b24cf8b4260121edae02be.r2.dev/autorag-vector-embedding.svg" alt="Visualización de Embeddings Vectoriales" style="width: 100%; max-width: 600px; height: auto;" />
</div>

<div class="feature-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px; margin-top: 25px;">
<div class="feature-item" style="background: rgba(30, 45, 102, 0.1); border-radius: 10px; padding: 20px; border: 1px solid rgba(184, 160, 128, 0.2);">
<div style="display: flex; align-items: flex-start;">
<div style="margin-right: 15px; color: #4a7c8a; font-size: 24px;">
<i class="fas fa-search"></i>
</div>
<div>
<h4 style="font-size: 18px; font-weight: bold; margin-bottom: 8px; color: #1e3a2b;">Múltiples Métodos de Recuperación</h4>
<p style="font-size: 14px; line-height: 1.5; margin: 0;">Evalúa varios enfoques de recuperación incluyendo BM25, recuperadores densos, búsqueda híbrida y estrategias de reordenamiento</p>
</div>
</div>
</div>
<div class="feature-item" style="background: rgba(30, 45, 102, 0.1); border-radius: 10px; padding: 20px; border: 1px solid rgba(184, 160, 128, 0.2);">
<div style="display: flex; align-items: flex-start;">
<div style="margin-right: 15px; color: #4a7c8a; font-size: 24px;">
<i class="fas fa-database"></i>
</div>
<div>
<h4 style="font-size: 18px; font-weight: bold; margin-bottom: 8px; color: #1e3a2b;">Integración de Base de Datos Vectorial</h4>
<p style="font-size: 14px; line-height: 1.5; margin: 0;">Soporta múltiples bases de datos vectoriales y modelos de embeddings para encontrar la combinación óptima</p>
</div>
</div>
</div>
</div>
</div>

<!-- Tab 3 Content -->
<div id="tab3-content" role="tabpanel" aria-labelledby="tab3-trigger" class="tab-content" hidden>
<h3 style="color: #1e3a2b; font-size: 1.5rem; margin-bottom: 1rem;">Optimización y Evaluación de Generación</h3>
<p style="font-size: 1.125rem; margin-bottom: 2rem; color: #4a5568;">El sistema de optimización avanzado de AutoRAG evalúa múltiples estrategias de generación para encontrar la configuración óptima para tus datos y casos de uso específicos.</p>

<!-- Retrieval Optimization Visualization -->
<div style="text-align: center; margin: 2rem 0;">
<img src="https://pub-fb3e683317b24cf8b4260121edae02be.r2.dev/autorag-retrieval-optimization.svg" alt="Visualización de Optimización de Recuperación" style="width: 100%; max-width: 600px; height: auto;" />
</div>

<div class="feature-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px; margin-top: 25px;">
<div class="feature-item" style="background: rgba(30, 45, 102, 0.1); border-radius: 10px; padding: 20px; border: 1px solid rgba(184, 160, 128, 0.2);">
<div style="display: flex; align-items: flex-start;">
<div style="margin-right: 15px; color: #4a7c8a; font-size: 24px;">
<i class="fas fa-cogs"></i>
</div>
<div>
<h4 style="font-size: 18px; font-weight: bold; margin-bottom: 8px; color: #1e3a2b;">Optimización de Generación</h4>
<p style="font-size: 14px; line-height: 1.5; margin: 0;">Optimiza automáticamente los prompts y parámetros de generación para tu caso de uso específico</p>
</div>
</div>
</div>
<div class="feature-item" style="background: rgba(30, 45, 102, 0.1); border-radius: 10px; padding: 20px; border: 1px solid rgba(184, 160, 128, 0.2);">
<div style="display: flex; align-items: flex-start;">
<div style="margin-right: 15px; color: #4a7c8a; font-size: 24px;">
<i class="fas fa-check-circle"></i>
</div>
<div>
<h4 style="font-size: 18px; font-weight: bold; margin-bottom: 8px; color: #1e3a2b;">Métricas Integrales</h4>
<p style="font-size: 14px; line-height: 1.5; margin: 0;">Evalúa el rendimiento usando métricas de precisión, recall, F1, MRR, NDCG y tasa de aciertos</p>
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
    target.style.borderBottomColor = 'var(--color-accent-primary, #b8a080)';
    
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
    border-bottom-color: rgba(184, 160, 128, 0.5) !important;
}

.tab-trigger[aria-selected="true"] {
    color: #1e3a2b !important;
    border-bottom-color: var(--color-accent-primary, #b8a080) !important;
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
<h2 class="section-heading" style="margin-top: 6rem; margin-bottom: 6rem;">Proceso de Implementación</h2>

<div class="implementation-timeline">
<div class="timeline-step">
<div class="step-number">1</div>
<div class="step-content">
<h3>Conexión de Fuentes de Conocimiento</h3>
<p>Conecta tus repositorios de conocimiento existentes a través de nuestra simple interfaz de integración. AutoRAG soporta conexiones directas a sistemas de almacenamiento de documentos, bases de datos, bases de conocimiento, wikis y herramientas internas a través de conexiones API seguras o cargas directas de documentos.</p>
</div>
</div>

<div class="timeline-step">
<div class="step-number">2</div>
<div class="step-content">
<h3>Creación de Datos y Optimización del Pipeline</h3>
<p>Nuestro sistema transforma tus documentos en bruto en conjuntos de datos optimizados a través de nuestro proceso integral de cuatro etapas: análisis de documentos, chunking inteligente, creación de corpus y generación de conjuntos de datos de QA. Estos conjuntos de datos se utilizan luego para evaluar múltiples configuraciones de pipeline RAG, identificando automáticamente el enfoque óptimo para tus datos y casos de uso específicos.</p>
</div>
</div>

<div class="timeline-step">
<div class="step-number">3</div>
<div class="step-content">
<h3>Integración API y Despliegue</h3>
<p>Integra AutoRAG con tus aplicaciones existentes a través de nuestra API REST o usa nuestros conectores preconfigurados para plataformas LLM populares. Las opciones de configuración simples te permiten personalizar la configuración de recuperación, autenticación y modelos de permisos de usuario para cumplir con los requisitos de tu organización.</p>
</div>
</div>
</div>

<div style="text-align: center; margin-top: 3rem;">
<a href="https://meetings.hubspot.com/michael-mooring/divinci-ai" class="secondary-button" target="_blank">Solicitar Guía de Implementación</a>
</div>
</div>
</section>

<section id="case-studies" class="case-studies section-padding">
<div class="container">
<h2 class="section-heading" style="margin-top: 6rem; margin-bottom: 6rem;">Historias de Éxito</h2>

<div style="background: rgba(255, 255, 255, 0.9); padding: 3rem; border-radius: 12px; border: 1px solid rgba(184, 160, 128, 0.2); margin-bottom: 3rem;">
<h3 style="color: #1e3a2b; font-size: 2rem; margin-bottom: 1rem;">Firma Global de Servicios Financieros</h3>
<p style="font-size: 1.25rem; color: #2d3c34; margin-bottom: 2rem; font-weight: 600;">87% de reducción en alucinaciones de IA mientras maneja más de 15,000 consultas de clientes diariamente</p>
<p style="margin-bottom: 2rem;">Una firma líder de servicios financieros necesitaba incorporar más de 200,000 documentos regulatorios y políticas internas en su asistente de IA orientado al cliente. La implementación manual de RAG se estimó en más de 8 meses. Usando AutoRAG, completaron la integración en 3 semanas y lograron una precisión sin precedentes para preguntas de cumplimiento regulatorio.</p>

<blockquote class="testimonial">
<p>"AutoRAG transformó nuestro cronograma de implementación de IA de trimestres a semanas. La capacidad del sistema para recuperar con precisión información regulatoria mientras proporciona citas adecuadas ha sido revolucionaria para nuestro equipo de cumplimiento."</p>
<cite>— Sarah Chen, CTO, Líder de Servicios Financieros</cite>
</blockquote>

<div class="metrics-container" style="margin-top: 2rem;">
<div class="metric">
<span class="metric-value">87%</span>
<span class="metric-label">Reducción en Alucinaciones</span>
</div>
<div class="metric">
<span class="metric-value">93%</span>
<span class="metric-label">Tiempo de Implementación Ahorrado</span>
</div>
<div class="metric">
<span class="metric-value">15K+</span>
<span class="metric-label">Consultas Diarias Procesadas</span>
</div>
</div>
</div>

<div class="case-studies-grid">
<div class="case-study-card">
<h3>Red de Proveedores de Salud</h3>
<p>Integró más de 50 bases de conocimiento dispares en 2 semanas, permitiendo la recuperación precisa de información médica con 99.8% de precisión.</p>
<a href="https://meetings.hubspot.com/michael-mooring/divinci-ai" class="text-link" target="_blank">Solicitar Detalles →</a>
</div>

<div class="case-study-card">
<h3>Conglomerado de Manufactura</h3>
<p>Redujo el tiempo de resolución de soporte técnico en un 73% al conectar AutoRAG a 15 años de documentación de equipos y registros de mantenimiento.</p>
<a href="https://meetings.hubspot.com/michael-mooring/divinci-ai" class="text-link" target="_blank">Solicitar Detalles →</a>
</div>

<div class="case-study-card">
<h3>Firma Legal Global</h3>
<p>Permitió a los paralegales procesar 3 veces más investigación de casos al implementar AutoRAG en más de 12 millones de documentos legales y precedentes.</p>
<a href="https://meetings.hubspot.com/michael-mooring/divinci-ai" class="text-link" target="_blank">Solicitar Detalles →</a>
</div>
</div>
</div>
</section>

<section id="related-features" class="related-features section-padding">
<div class="container">
<h2 class="section-heading" style="margin-top: 6rem; margin-bottom: 6rem;">Características Relacionadas</h2>

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
<h3>Integración de Base de Conocimiento</h3>
<p>Conecta múltiples fuentes de conocimiento con nuestros conectores especializados para un flujo de datos sin interrupciones en tus aplicaciones de IA.</p>
<a href="/es/quality-assurance/" class="text-link">Más Información →</a>
</div>

<div class="related-feature-card">
<div style="margin-bottom: 1rem;">
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="64" height="64">
<circle cx="12" cy="12" r="11" fill="none" stroke="#1e3a2b" stroke-width="1" opacity="0.2"/>
<rect x="6" y="6" width="12" height="12" rx="2" fill="none" stroke="#4a7c8a" stroke-width="2"/>
<path d="M9,12 L11,14 L15,10" stroke="#4a7c8a" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
</svg>
</div>
<h3>Aseguramiento de Calidad LLM</h3>
<p>Garantiza precisión y confiabilidad con nuestras pruebas y monitoreo integral para contenido generado por IA.</p>
<a href="/es/quality-assurance/" class="text-link">Más Información →</a>
</div>

<div class="related-feature-card">
<div style="margin-bottom: 1rem;">
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="64" height="64">
<circle cx="12" cy="12" r="11" fill="none" stroke="#1e3a2b" stroke-width="1" opacity="0.2"/>
<circle cx="12" cy="12" r="5" fill="none" stroke="#2d3c34" stroke-width="2"/>
<path d="M12,7 L12,5 M12,19 L12,17 M7,12 L5,12 M19,12 L17,12 M16.5,7.5 L18,6 M7.5,16.5 L6,18 M16.5,16.5 L18,18 M7.5,7.5 L6,6" stroke="#2d3c34" stroke-width="2" stroke-linecap="round"/>
</svg>
</div>
<h3>Gestión del Ciclo de Lanzamiento</h3>
<p>Simplifica el desarrollo de tu aplicación de IA con nuestras herramientas DevOps especializadas para sistemas basados en LLM.</p>
<a href="/es/release-management/" class="text-link">Más Información →</a>
</div>
</div>
</div>
</section>

<section id="faq" class="faq-section section-padding">
<div class="container">
<h2 class="section-heading" style="margin-top: 6rem; margin-bottom: 6rem;">Preguntas Frecuentes</h2>

<div class="accordion">
<div class="accordion-item">
<h3>
<button class="accordion-trigger">
                        ¿Qué tipos de documentos y fuentes de datos puede procesar AutoRAG?
</button>
</h3>
<div class="accordion-panel">
<p>AutoRAG puede procesar prácticamente cualquier contenido basado en texto, incluyendo PDFs, documentos de Word, presentaciones de PowerPoint, hojas de cálculo de Excel, páginas HTML, archivos Markdown, repositorios de código, bases de datos, wikis, bases de conocimiento y datos estructurados de APIs. El sistema también maneja imágenes con contenido de texto a través de OCR y puede extraer datos de tablas, diagramas y otros elementos visuales.</p>
<p>Para formatos de datos especializados o sistemas propietarios, nuestro equipo puede desarrollar conectores personalizados para garantizar una integración perfecta con tu infraestructura de conocimiento existente.</p>
<div style="margin-top: 1rem;">
<span class="tag">PDF</span>
<span class="tag">Word</span>
<span class="tag">Excel</span>
<span class="tag">HTML</span>
<span class="tag">Markdown</span>
<span class="tag">Bases de Datos</span>
<span class="tag">Datos API</span>
</div>
</div>
</div>

<div class="accordion-item">
<h3>
<button class="accordion-trigger">
                        ¿Cómo maneja AutoRAG los requisitos de seguridad de datos y cumplimiento?
</button>
</h3>
<div class="accordion-panel">
<p>AutoRAG está diseñado con seguridad de nivel empresarial en su núcleo. Todo el procesamiento de datos ocurre dentro de tu perímetro de seguridad, ya sea en tu entorno en la nube o en las instalaciones. El sistema soporta:</p>
<ul>
<li>Cifrado de extremo a extremo para todos los datos en reposo y en tránsito</li>
<li>Controles de acceso basados en roles para la visibilidad de documentos</li>
<li>Opciones de residencia de datos para requisitos de cumplimiento regional</li>
<li>Registro de auditoría para todas las operaciones del sistema y acceso a datos</li>
<li>Cumplimiento con GDPR, HIPAA, SOC 2 y otros marcos regulatorios</li>
</ul>
<p>Además, nuestras opciones de implementación incluyen entornos aislados para los requisitos de seguridad más altos.</p>
</div>
</div>

<div class="accordion-item">
<h3>
<button class="accordion-trigger">
                        ¿Qué proveedores y modelos de LLM soporta AutoRAG?
</button>
</h3>
<div class="accordion-panel">
<p>AutoRAG es agnóstico al modelo y funciona con prácticamente cualquier LLM, incluyendo:</p>
<ul>
<li>Modelos de OpenAI (GPT-4, GPT-3.5, etc.)</li>
<li>Modelos de Anthropic (serie Claude)</li>
<li>Modelos de Google (serie Gemini)</li>
<li>Modelos de Meta (serie Llama)</li>
<li>Modelos Mistral</li>
<li>Modelos de código abierto (desplegables en tu infraestructura)</li>
<li>Modelos personalizados ajustados</li>
</ul>
<p>El sistema optimiza automáticamente su salida para las limitaciones y capacidades específicas de la ventana de contexto de cada modelo. Nuestra consola de gestión permite cambiar fácilmente entre modelos y realizar pruebas A/B para un rendimiento óptimo.</p>
</div>
</div>
</div>
</div>
</section>

<section style="background: linear-gradient(135deg, rgba(107, 70, 193, 0.1), rgba(184, 160, 128, 0.1)); padding: 4rem 0;">
<div class="container" style="text-align: center;">
<h2 style="font-size: 2.5rem; color: #1e3a2b; margin-bottom: 1rem;">¿Listo para Comenzar?</h2>
<p style="font-size: 1.25rem; margin-bottom: 2rem; color: #2d3c34;">Transforma tus aplicaciones de IA con la solución integral de AutoRAG.</p>
<div style="display: flex; gap: 1rem; justify-content: center; flex-wrap: wrap;">
<a href="https://meetings.hubspot.com/michael-mooring/divinci-ai" class="secondary-button" target="_blank">Solicitar Demo</a>
<a href="https://docs.divinci.ai/autorag" class="text-link" style="padding: 12px 24px; border: 2px solid transparent;">Ver Documentación</a>
</div>
</div>
</section>