+++
title = "Documentación"
description = "Documentación completa para la plataforma Divinci AI, APIs y herramientas"
template = "page.html"
+++

# Documentación

Bienvenido al centro de documentación de Divinci AI. Encuentra guías completas, referencias de API y especificaciones técnicas para todos nuestros productos y servicios.

## Documentación de la Plataforma

### Primeros Pasos
- [Guía de Inicio Rápido](/es/tutorials/)
- [Resumen de la Plataforma](/es/about/)
- [Configuración de Cuenta](/es/support/)
- [Tutorial de Primeros Pasos](/es/tutorials/)

### Características Principales
- [Sistema AutoRAG](/es/autorag/) - Generación Aumentada por Recuperación Automatizada
- [Aseguramiento de Calidad](/es/quality-assurance/) - Pruebas y validación de IA
- [Gestión de Versiones](/es/release-management/) - Despliegue y versionado

## Referencia de API

### API REST
- **URL Base**: `https://api.divinci.ai/v1`
- **Autenticación**: Token Bearer requerido
- **Límites de Velocidad**: 1000 solicitudes por minuto

#### Endpoints Principales
- `GET /transcripts` - Listar transcripciones
- `POST /rag/query` - Consultar sistema RAG
- `POST /releases` - Crear nueva versión
- `GET /fine-tuning/jobs` - Listar trabajos de ajuste fino

### SDKs y Bibliotecas
- [SDK de Python](https://sdk.divinci.ai)
- [SDK de JavaScript](https://sdk.divinci.ai)
- [Cliente de API REST](https://sdk.divinci.ai)

## Guías de Integración

### Plataformas Soportadas
- **Proveedores de Nube**: AWS, Azure, Google Cloud
- **Frameworks**: React, Vue.js, Angular, Django, Flask
- **Lenguajes**: Python, JavaScript, Java, C#, Go

### Autenticación
```bash
curl -H "Authorization: Bearer TU_CLAVE_API" \
     https://api.divinci.ai/v1/transcripts
```

### Manejo de Errores
Todas las respuestas de API incluyen códigos de error y mensajes estandarizados para un manejo consistente de errores en tus aplicaciones.

## Temas Avanzados

### Seguridad y Cumplimiento
- [Privacidad de Datos](/es/privacy-policy/)
- [Medidas de Seguridad](/es/security/)
- [Estándares de Cumplimiento](/es/ai-safety/)

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
- [Discusiones de GitHub](https://github.com/Divinci-AI)
- [Servidor de Discord](https://discord.gg/5MJPyZ4u)
- [Etiqueta de Stack Overflow](https://stackoverflow.com/questions/tagged/divinci-ai)

### Soporte Empresarial
- Canal de Soporte Prioritario
- Gerente de Cuenta Dedicado
- Asistencia de Integración Personalizada

### Entrenamiento y Certificación
- [Programa de Certificación Divinci AI](/es/careers/)
- [Materiales de Entrenamiento](/es/tutorials/)

---

*¿No encuentras lo que buscas? Consulta nuestros [tutoriales](/es/tutorials/) para guías paso a paso o [contacta soporte](/es/contact/) para asistencia personalizada.*
