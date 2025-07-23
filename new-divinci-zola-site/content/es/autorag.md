+++
title = "AutoRAG - Generación Aumentada por Recuperación Automatizada"
description = "Encuentra automáticamente el pipeline RAG óptimo para tus datos con la solución integral AutoRAG de Divinci AI"
template = "feature.html"
[extra]
feature_category = "data-management"
+++

<style>
/* Feature page specific styles matching original design */
.hero-animation-container {
    width: 700px;
    height: 700px;
    position: relative;
    margin: 0 auto;
    display: flex;
    align-items: center;
    justify-content: center;
    background: linear-gradient(135deg, rgba(30, 45, 102, 0.05), rgba(92, 226, 231, 0.05));
    border-radius: 50%;
    margin-bottom: 3rem;
}

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
    width: 900px;
    height: 900px;
    margin: 0 auto;
    display: flex;
    align-items: center;
    justify-content: center;
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
}

.orbital-benefit {
    position: absolute;
    background: rgba(255, 255, 255, 0.9);
    border: 2px solid rgba(92, 226, 231, 0.2);
    border-radius: 50%;
    text-align: center;
    transition: all 0.3s ease;
}

.orbital-benefit:nth-child(2) { transform: translate(-50%, -50%) rotate(0deg) translateY(-400px) rotate(0deg); }
.orbital-benefit:nth-child(3) { transform: translate(-50%, -50%) rotate(72deg) translateY(-400px) rotate(-72deg); }
.orbital-benefit:nth-child(4) { transform: translate(-50%, -50%) rotate(144deg) translateY(-400px) rotate(-144deg); }
.orbital-benefit:nth-child(5) { transform: translate(-50%, -50%) rotate(216deg) translateY(-400px) rotate(-216deg); }
.orbital-benefit:nth-child(6) { transform: translate(-50%, -50%) rotate(288deg) translateY(-400px) rotate(-288deg); }

.orbital-benefit:hover {
    transform: scale(1.05);
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
    background: linear-gradient(135deg, #16214c, #254284);
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
    color: #16214c;
    border-radius: 20px;
    font-size: 0.9rem;
    margin: 0.25rem;
}

.text-link {
    color: #16214c;
    text-decoration: none;
    font-weight: 600;
}

.text-link:hover {
    color: #254284;
    text-decoration: underline;
}

.secondary-button {
    background-color: transparent;
    color: #16214c;
    border: 2px solid #16214c;
    padding: 12px 24px;
    border-radius: 8px;
    text-decoration: none;
    font-weight: 600;
    transition: all 0.3s ease;
}

.secondary-button:hover {
    background-color: #16214c;
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
    color: #16214c;
}

.metric-label {
    display: block;
    font-size: 0.9rem;
    color: #718096;
    margin-top: 0.5rem;
}

.testimonial {
    border-left: 4px solid #16214c;
    padding-left: 2rem;
    margin: 2rem 0;
    font-style: italic;
}

.testimonial cite {
    display: block;
    margin-top: 1rem;
    font-weight: 600;
    color: #254284;
}
</style>

<section class="hero-section section-padding">
<div class="container">
<div class="hero-animation-container">
<iframe src="/divinci-animation.html"
                    width="100%" 
                    height="100%" 
                    frameborder="0" 
                    scrolling="no" 
                    allow="autoplay"
                    aria-label="Animación automatizada de Divinci AI mostrando procesamiento de datos"
                    class="desktop-only">
</iframe>
</div>
</div>
</section>

<section id="feature-overview" class="feature-overview section-padding">
<div class="container">
<h2 class="section-heading">¿Qué es AutoRAG?</h2>
<div class="overview-content">
<p style="font-size: 1.25rem; margin-bottom: 2rem;">AutoRAG es la solución integral de Divinci AI para encontrar automáticamente el pipeline RAG óptimo para tus datos específicos y casos de uso. A diferencia de las implementaciones RAG genéricas, AutoRAG evalúa múltiples combinaciones de estrategias de recuperación y generación para determinar qué funciona mejor con tu contenido único.</p>

<p>Las implementaciones RAG tradicionales requieren configuración manual extensa, preprocesamiento de documentos y ajustes continuos para mantenerse efectivas. Muchas organizaciones luchan con la selección de los módulos y pipelines RAG correctos para sus datos específicos, desperdiciando tiempo y recursos valiosos en configuraciones subóptimas. AutoRAG elimina estas barreras evaluando automáticamente varias combinaciones de módulos RAG, manejando el análisis de documentos, optimización de chunking, selección de estrategias de recuperación y generación de respuestas, todo mientras aprende y mejora continuamente a partir de métricas de evaluación.</p>

<p>Con AutoRAG, tus aplicaciones de IA empresarial obtienen acceso instantáneo a la información propietaria de tu organización con precisión y relevancia sin precedentes. El sistema crea automáticamente conjuntos de datos de preguntas y respuestas a partir de tu corpus, evalúa múltiples estrategias de recuperación y generación, e identifica la configuración óptima del pipeline, reduciendo significativamente las alucinaciones y proporcionando respuestas completamente respaldadas por fuentes que generan confianza con tus usuarios.</p>
</div>
</div>
</section>

<section id="feature-benefits" class="feature-benefits section-padding">
<div class="container">
<h2 class="section-heading" style="margin-bottom: 60px;">Beneficios Clave</h2>

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
</section>

<section style="background: linear-gradient(135deg, rgba(107, 70, 193, 0.1), rgba(92, 226, 231, 0.1)); padding: 4rem 0;">
<div class="container" style="text-align: center;">
<h2 style="font-size: 2.5rem; color: #16214c; margin-bottom: 1rem;">¿Listo para Comenzar?</h2>
<p style="font-size: 1.25rem; margin-bottom: 2rem; color: #254284;">Transforma tus aplicaciones de IA con la solución integral de AutoRAG.</p>
<div style="display: flex; gap: 1rem; justify-content: center; flex-wrap: wrap;">
<a href="https://meetings.hubspot.com/michael-mooring/divinci-ai" class="secondary-button" target="_blank">Solicitar Demo</a>
<a href="https://docs.divinci.ai/autorag" class="text-link" style="padding: 12px 24px; border: 2px solid transparent;">Ver Documentación</a>
</div>
</div>
</section>