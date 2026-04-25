+++
title = "Registro de Cambios"
description = "Registro de cambios de Divinci AI. Mantente actualizado con las últimas características, mejoras y correcciones de errores en nuestra plataforma."
template = "page.html"
+++

<style>
/* Page-specific Leonardo journal background */
.leonardo-bg::before {
    background-image: url('/images/bg-changelog.svg') !important;
    background-repeat: no-repeat !important;
    background-size: 100% auto !important;
    background-position: top center !important;
    opacity: 1 !important;
}

.document-section {
    background: linear-gradient(135deg, #1e3a2b 0%, #2d3c34 100%);
    color: white;
    padding: 80px 0;
    min-height: 100vh;
    position: relative;
}

.document-header {
    text-align: center;
    margin-bottom: 50px;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
}

.document-header h1 {
    font-size: 3rem;
    font-weight: 700;
    margin-bottom: 15px;
    background: linear-gradient(to right, #fff, var(--color-accent-primary, #b8a080));
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    display: block;
    text-align: center;
    margin-left: auto;
    margin-right: auto;
}

.last-updated {
    font-size: 1rem;
    opacity: 0.8;
    color: var(--color-accent-primary, #b8a080);
}

.document-content {
    max-width: 900px;
    margin: 0 auto;
}

/* Changelog-specific styles */
.version-tag {
    display: inline-block;
    padding: 4px 10px;
    border-radius: 15px;
    font-size: 0.8rem;
    font-weight: 600;
    margin-right: 10px;
    color: white;
}

.version-tag.major {
    background: linear-gradient(135deg, #1e3a2b, #2d3c34);
}

.version-tag.minor {
    background: linear-gradient(135deg, var(--color-accent-primary, #b8a080), #8b7659);
}

.version-tag.patch {
    background: linear-gradient(135deg, #3d6b4f, #2d5a4f);
}

.changelog-item {
    border-left: 3px solid rgba(184, 160, 128, 0.3);
    padding-left: 20px;
    margin-bottom: 30px;
    position: relative;
}

.changelog-item::before {
    content: '';
    position: absolute;
    left: -9px;
    top: 0;
    width: 15px;
    height: 15px;
    border-radius: 50%;
    background: var(--color-accent-primary, #b8a080);
    box-shadow: 0 0 8px rgba(184, 160, 128, 0.6);
}

.release-date {
    font-size: 0.9rem;
    color: rgba(255, 255, 255, 0.7);
    margin-left: 5px;
}

.changelog-header {
    display: flex;
    align-items: center;
    margin-bottom: 15px;
}

.changelog-title {
    font-size: 1.3rem;
    font-weight: 600;
    color: white;
}

.change-category {
    display: inline-block;
    padding: 3px 8px;
    border-radius: 4px;
    font-size: 0.7rem;
    font-weight: 600;
    margin-right: 6px;
    margin-bottom: 6px;
}

.category-new {
    background-color: rgba(184, 160, 128, 0.15);
    color: var(--color-accent-primary, #b8a080);
    border: 1px solid rgba(184, 160, 128, 0.3);
}

.category-improvement {
    background-color: rgba(61, 107, 79, 0.15);
    color: #3d6b4f;
    border: 1px solid rgba(61, 107, 79, 0.3);
}

.category-fix {
    background-color: rgba(139, 118, 89, 0.12);
    color: #8b7659;
    border: 1px solid rgba(139, 118, 89, 0.3);
}

.category-security {
    background-color: rgba(184, 160, 128, 0.12);
    color: #b8a080;
    border: 1px solid rgba(184, 160, 128, 0.3);
}

.changelog-details ul {
    list-style-type: none;
    padding-left: 0;
}

.changelog-details li {
    margin-bottom: 10px;
    padding-left: 20px;
    position: relative;
    color: rgba(255, 255, 255, 0.9);
}

.changelog-details li::before {
    content: '•';
    position: absolute;
    left: 0;
    color: var(--color-accent-primary, #b8a080);
    font-weight: bold;
}

.changelog-details p {
    color: rgba(255, 255, 255, 0.9);
    line-height: 1.6;
    margin-bottom: 1rem;
}

.changelog-filters {
    display: flex;
    gap: 10px;
    margin-bottom: 20px;
    flex-wrap: wrap;
}

.filter-button {
    padding: 5px 12px;
    border-radius: 20px;
    background-color: rgba(255, 255, 255, 0.1);
    border: 1px solid rgba(255, 255, 255, 0.2);
    cursor: pointer;
    transition: all 0.2s ease;
    font-size: 0.85rem;
    color: white;
}

.filter-button:hover, .filter-button.active {
    background-color: rgba(184, 160, 128, 0.2);
    border-color: rgba(184, 160, 128, 0.4);
    color: var(--color-accent-primary, #b8a080);
}

.changelog-sacred-pattern {
    position: absolute;
    top: 50px;
    right: 50px;
    width: 150px;
    height: 150px;
    opacity: 0.07;
    background-image: url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Ccircle cx='50' cy='50' r='40' stroke='%23b8a080' stroke-width='0.5' fill='none' /%3E%3Ccircle cx='50' cy='50' r='30' stroke='%23b8a080' stroke-width='0.5' fill='none' /%3E%3Ccircle cx='50' cy='50' r='20' stroke='%23b8a080' stroke-width='0.5' fill='none' /%3E%3Cline x1='10' y1='50' x2='90' y2='50' stroke='%23b8a080' stroke-width='0.3' /%3E%3Cline x1='50' y1='10' x2='50' y2='90' stroke='%23b8a080' stroke-width='0.3' /%3E%3C/svg%3E");
    background-repeat: no-repeat;
    background-position: center;
    background-size: contain;
    z-index: 0;
}

@media screen and (max-width: 768px) {
    .document-header h1 {
        font-size: 2rem;
    }
    
    .document-section {
        padding: 60px 0;
    }
    
    .changelog-header {
        flex-direction: column;
        align-items: flex-start;
    }
    
    .changelog-sacred-pattern {
        width: 100px;
        height: 100px;
        top: 30px;
        right: 30px;
    }
}
</style>

<section class="document-section">
<div class="container">
<div class="document-header">
<h1>Registro de Cambios</h1>
<p class="last-updated">Última actualización: 2 de mayo de 2025</p>
</div>

<!-- Sacred geometry decoration -->
<div class="changelog-sacred-pattern"></div>

<div class="document-content">
<p style="text-align: center; max-width: 800px; margin: 0 auto 2rem auto; font-size: 1.1rem; line-height: 1.6; opacity: 0.9; color: rgba(255, 255, 255, 0.9);">El registro de cambios de Divinci AI documenta nuestras actualizaciones de producto, nuevas funciones y mejoras para mantener a nuestros usuarios informados sobre el progreso de nuestro desarrollo.</p>

<div class="changelog-filters">
<button class="filter-button active" data-filter="all">Todas las actualizaciones</button>
<button class="filter-button" data-filter="major">Versiones principales</button>
<button class="filter-button" data-filter="new">Nuevas funciones</button>
<button class="filter-button" data-filter="improvement">Mejoras</button>
<button class="filter-button" data-filter="fix">Correcciones</button>
<button class="filter-button" data-filter="security">Actualizaciones de seguridad</button>
</div>

<!-- Changelog entry 1 -->
<div class="changelog-item">
<div class="changelog-header">
<span class="version-tag major">v1.0.0</span>
<h2 class="changelog-title">Lanzamiento público inicial</h2>
<span class="release-date">1 de mayo de 2025</span>
</div>
<div class="changelog-details">
<div class="change-categories">
<span class="change-category category-new">Nuevo</span>
</div>
<p>Nuestro primer lanzamiento público de Divinci AI tras una exhaustiva fase de pruebas beta privadas. Esta versión incluye toda la funcionalidad principal que permite a los usuarios crear soluciones de IA personalizadas.</p>
<ul>
<li>Creación de modelos de IA personalizados con interfaz sin código</li>
<li>Capacidades avanzadas de RAG (Generación Aumentada por Recuperación)</li>
<li>Procesamiento de documentos y extracción de conocimiento</li>
<li>Optimización de embeddings vectoriales</li>
<li>Acceso a API para integraciones empresariales</li>
<li>Herramientas de control de calidad para LLMs</li>
<li>Gestión del ciclo de lanzamientos para proyectos de IA</li>
</ul>
</div>
</div>

<!-- Changelog entry 2 -->
<div class="changelog-item">
<div class="changelog-header">
<span class="version-tag minor">v0.9.5</span>
<h2 class="changelog-title">Finalización de funciones de prelanzamiento</h2>
<span class="release-date">15 de abril de 2025</span>
</div>
<div class="changelog-details">
<div class="change-categories">
<span class="change-category category-new">Nuevo</span>
<span class="change-category category-improvement">Mejora</span>
</div>
<p>Versión previa al lanzamiento con el conjunto de funciones completo y mejoras significativas basadas en los comentarios de usuarios beta.</p>
<ul>
<li>Añadidas funciones de seguridad de nivel empresarial y certificaciones de cumplimiento</li>
<li>Implementado panel de análisis avanzado para el seguimiento del rendimiento de modelos de IA</li>
<li>Documentación mejorada con sistema de tutoriales completo</li>
<li>Interfaz de usuario mejorada con mejoras de accesibilidad</li>
<li>Rendimiento del backend optimizado para tiempos de entrenamiento y respuesta más rápidos</li>
</ul>
</div>
</div>

<!-- Changelog entry 3 -->
<div class="changelog-item">
<div class="changelog-header">
<span class="version-tag minor">v0.9.0</span>
<h2 class="changelog-title">Versión beta extendida</h2>
<span class="release-date">10 de marzo de 2025</span>
</div>
<div class="changelog-details">
<div class="change-categories">
<span class="change-category category-new">Nuevo</span>
<span class="change-category category-improvement">Mejora</span>
<span class="change-category category-fix">Corrección</span>
</div>
<p>Actualización importante de nuestra plataforma beta con funciones ampliadas y mejoras significativas.</p>
<ul>
<li>Añadido soporte para modelos de IA multimodales (texto, imagen, audio)</li>
<li>Implementadas capacidades de ajuste fino para dominios especializados</li>
<li>Sistema RAG mejorado con mejor manejo de contexto y puntuación de relevancia</li>
<li>Corregidos problemas críticos en el procesamiento de documentos para formatos de archivo complejos</li>
<li>Añadido sistema de control de versiones para modelos de IA</li>
<li>Funciones de colaboración mejoradas para entornos de equipo</li>
</ul>
</div>
</div>

<!-- Changelog entry 4 -->
<div class="changelog-item">
<div class="changelog-header">
<span class="version-tag patch">v0.8.2</span>
<h2 class="changelog-title">Actualización de estabilidad beta</h2>
<span class="release-date">25 de febrero de 2025</span>
</div>
<div class="changelog-details">
<div class="change-categories">
<span class="change-category category-fix">Corrección</span>
<span class="change-category category-security">Seguridad</span>
</div>
<p>Actualización de estabilidad y seguridad centrada en la fiabilidad del sistema principal.</p>
<ul>
<li>Corregidos problemas de fuga de memoria en el proceso de procesamiento de documentos</li>
<li>Resueltos problemas de autenticación para integraciones SSO empresariales</li>
<li>Parcheadas vulnerabilidades de seguridad en los endpoints de API</li>
<li>Mejorado el manejo de errores y los informes en todo el sistema</li>
<li>Registro del sistema mejorado para un mejor diagnóstico</li>
</ul>
</div>
</div>

<!-- Changelog entry 5 -->
<div class="changelog-item">
<div class="changelog-header">
<span class="version-tag minor">v0.8.0</span>
<h2 class="changelog-title">Lanzamiento de beta cerrada</h2>
<span class="release-date">15 de enero de 2025</span>
</div>
<div class="changelog-details">
<div class="change-categories">
<span class="change-category category-new">Nuevo</span>
</div>
<p>Versión beta cerrada inicial de la plataforma Divinci AI para socios seleccionados y primeros adoptantes.</p>
<ul>
<li>Funcionalidad principal de la plataforma publicada para pruebas</li>
<li>Capacidades RAG básicas para procesamiento de documentos</li>
<li>Endpoints de API iniciales para pruebas de integración</li>
<li>Interfaz de usuario fundamental para la configuración de modelos de IA</li>
<li>Soporte limitado de conjuntos de datos para implementaciones de prueba de concepto</li>
</ul>
</div>
</div>
</div>
</div>
</section>

<script>
document.addEventListener('DOMContentLoaded', function() {
    const filterButtons = document.querySelectorAll('.filter-button');
    const changelogItems = document.querySelectorAll('.changelog-item');

    filterButtons.forEach(button => {
        button.addEventListener('click', function() {
            filterButtons.forEach(btn => btn.classList.remove('active'));
            this.classList.add('active');

            const filter = this.getAttribute('data-filter');

            changelogItems.forEach(item => {
                if (filter === 'all') {
                    item.style.display = 'block';
                } else if (filter === 'major') {
                    const hasTag = item.querySelector('.version-tag.major');
                    item.style.display = hasTag ? 'block' : 'none';
                } else {
                    const hasCategory = item.querySelector(`.category-${filter}`);
                    item.style.display = hasCategory ? 'block' : 'none';
                }
            });
        });
    });
});
</script>
