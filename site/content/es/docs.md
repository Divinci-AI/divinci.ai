+++
title = "Documentación"
description = "Documentación completa para la plataforma Divinci AI, APIs y herramientas"
template = "page.html"
+++

# Documentación

Bienvenido al centro de documentación de Divinci AI. Encuentra guías completas, referencias de API y especificaciones técnicas para todos nuestros productos y servicios.

## Documentación de la Plataforma

### Primeros Pasos
- [Guía de Inicio Rápido](/es/tutorials#guía-de-inicio-rápido)
- [Resumen de la Plataforma](/es/about)
- [Configuración de Cuenta](/es/support)
- [Tutorial de Primeros Pasos](/es/tutorials#tu-primer-proyecto-de-ia)

### Características Principales
- [Sistema AutoRAG](/es/autorag) - Generación Aumentada por Recuperación Automatizada
- [Aseguramiento de Calidad](/es/quality-assurance) - Pruebas y validación de IA
- [Gestión de Versiones](/es/release-management) - Despliegue y versionado

## Referencia de API

### API REST
- **URL Base**: `https://api.divinci.ai/v1`
- **Autenticación**: Token Bearer requerido
- **Límites de Velocidad**: 1000 solicitudes por minuto

#### Endpoints Principales
- `GET /models` - Listar modelos disponibles
- `POST /generate` - Generar respuestas de IA
- `POST /analyze` - Analizar calidad de contenido
- `GET /status` - Verificar estado del sistema

### SDKs y Bibliotecas
- [SDK de Python](https://github.com/divinci-ai/python-sdk)
- [SDK de JavaScript](https://github.com/divinci-ai/js-sdk)
- [Cliente de API REST](https://github.com/divinci-ai/api-client)

## Guías de Integración

### Plataformas Soportadas
- **Proveedores de Nube**: AWS, Azure, Google Cloud
- **Frameworks**: React, Vue.js, Angular, Django, Flask
- **Lenguajes**: Python, JavaScript, Java, C#, Go

### Autenticación
```bash
curl -H "Authorization: Bearer TU_CLAVE_API" \
     https://api.divinci.ai/v1/models
```

### Manejo de Errores
Todas las respuestas de API incluyen códigos de error y mensajes estandarizados para un manejo consistente de errores en tus aplicaciones.

## Temas Avanzados

### Seguridad y Cumplimiento
- [Privacidad de Datos](/es/privacy-policy)
- [Medidas de Seguridad](/es/security)
- [Estándares de Cumplimiento](/es/ai-safety)

### Optimización de Rendimiento
- Guías de Selección de Modelos
- Estrategias de Caché
- Mejores Prácticas de Límites de Velocidad

### Monitoreo y Analíticas
- Analíticas de Uso
- Métricas de Rendimiento
- Paneles Personalizados

## Recursos de Soporte

### Comunidad
- [Discusiones de GitHub](https://github.com/divinci-ai/community)
- [Servidor de Discord](https://discord.gg/divinci-ai)
- [Etiqueta de Stack Overflow](https://stackoverflow.com/questions/tagged/divinci-ai)

### Soporte Empresarial
- Canal de Soporte Prioritario
- Gerente de Cuenta Dedicado
- Asistencia de Integración Personalizada

### Entrenamiento y Certificación
- [Programa de Certificación Divinci AI](/es/careers#certificación)
- [Horario de Talleres](/es/tutorials#talleres)
- [Materiales de Entrenamiento](/es/tutorials)

## Notas de Versión

### Última Versión: v2.1.0
- Rendimiento mejorado de AutoRAG
- Nuevas métricas de aseguramiento de calidad
- Tiempos de respuesta de API mejorados
- Soporte de idiomas extendido

### Versiones Anteriores
- [v2.0.0 - Actualización Mayor de Plataforma](/es/changelog#v2-0-0)
- [v1.9.0 - Mejoras de Calidad](/es/changelog#v1-9-0)
- [v1.8.0 - Mejoras de Seguridad](/es/changelog#v1-8-0)

---

*¿No encuentras lo que buscas? Consulta nuestros [tutoriales](/es/tutorials) para guías paso a paso o [contacta soporte](/es/contact) para asistencia personalizada.*