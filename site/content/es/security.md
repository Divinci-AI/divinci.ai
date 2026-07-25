+++
title = "Seguridad"
description = "Cómo Divinci AI protege sus datos: desidentificación, control de acceso, registro de auditoría y respuestas honestas sobre en qué punto estamos respecto a las certificaciones formales."
template = "legal-document.html"

[extra]
last_updated = "2026-07-25"
lang = "es"
+++

La seguridad es parte esencial de cómo construimos. Esta página describe lo que
es realmente cierto sobre nuestra arquitectura y nuestras prácticas hoy — no es
una lista de marketing. Cuando algo no lo hemos terminado (una auditoría
formal, una certificación), lo decimos con claridad en lugar de dar a entender
lo contrario.

## Arquitectura preparada para HIPAA

![Arquitectura preparada para HIPAA](/brand/badges/hipaa-ready.svg)

Hemos incorporado a la plataforma, de forma predeterminada, las salvaguardas
técnicas que necesita un flujo de trabajo sujeto a HIPAA:

- **Desidentificación antes del almacenamiento o del procesamiento con IA.** El
  contenido del chat puede pasar por un paso automático de redacción de
  PII/PHI (Microsoft Presidio, con un modelo ajustado a texto clínico
  disponible para contextos médicos) antes de llegar a nuestra base de datos, a
  nuestros proveedores de IA o a la búsqueda/recuperación — detectando las 18
  categorías de identificadores del método Safe Harbor (puerto seguro) de
  HIPAA. Este paso falla de forma cerrada: si la redacción no puede ejecutarse,
  el mensaje se rechaza en lugar de almacenarse silenciosamente sin redactar.
- **Registro de auditoría a prueba de manipulaciones.** El acceso a registros
  sensibles queda anotado en un log encadenado por hashes, diseñado para que
  las entradas no puedan alterarse silenciosamente a posteriori.
- **Control de acceso basado en roles y a nivel de recurso.** Tanto los roles
  de toda la plataforma como los permisos por recurso determinan quién puede
  ver qué.
- **Cifrado en tránsito y en reposo**, con cifrado a nivel de campo disponible
  para datos sensibles designados.

**Lo que esto NO es:** una certificación de cumplimiento de HIPAA. No existe
ningún certificado HIPAA emitido por el gobierno — el cumplimiento es una
combinación de salvaguardas técnicas (las anteriores), políticas
administrativas escritas y Acuerdos de Asociado Comercial (Business Associate
Agreement, BAA) firmados con cada proveedor presente en la ruta de los datos,
evaluados caso por caso para una relación concreta con un cliente. Si necesita
procesar Información de Salud Protegida (PHI) con nosotros bajo un Acuerdo de
Asociado Comercial,
[hable con nosotros](https://meetings.hubspot.com/michael-mooring/divinci-ai) —
analizaremos juntos qué se necesita para su caso de uso específico.

## Protección de datos

### Cifrado

- **En tránsito**: TLS en todas partes entre los clientes, nuestro edge y
  nuestra infraestructura de origen.
- **En reposo**: cifrado a nivel de proveedor en nuestro almacén de datos
  principal y en el almacenamiento de objetos, más una capa dedicada de cifrado
  a nivel de campo para los campos sensibles designados.
- **Gestión de secretos**: las credenciales y las claves de API se gestionan
  mediante un gestor de secretos centralizado; no están codificadas en el
  código ni almacenadas en configuración en texto plano. Producción está
  configurada para fallar de forma cerrada en lugar de recurrir
  silenciosamente a credenciales obsoletas si el servicio de secretos no está
  accesible.

### Minimización de datos

- La desidentificación (arriba) implica que la PII/PHI original se descarta, no
  se conserva, allí donde se ejecuta esa canalización — la menor huella posible
  si alguna vez se ve comprometido un sistema posterior.
- Los logs contienen únicamente metadatos por política: no escribimos el
  contenido de los mensajes, direcciones de correo electrónico ni otros datos
  personales en los logs de la aplicación ni en los mensajes de error.

### Controles de acceso

- **Autenticación** mediante Auth0.
- **Control de acceso basado en roles** (a nivel de plataforma) más **permisos
  por recurso** (a nivel de documento/espacio de trabajo) — mínimo privilegio
  de forma predeterminada.
- **Revisiones trimestrales de accesos y configuración** de los servicios de
  producción.

## Seguridad de la aplicación

- **Defensa contra XSS en el límite de renderizado**: el contenido generado por
  usuarios y por IA se sanea (DOMPurify) allí donde se renderiza como HTML; no
  se permite la inyección de HTML sin procesar desde fuentes no confiables.
- **Pruebas de autorización**: realizamos nuestras propias pruebas de
  seguridad, asistidas por IA y manuales, contra staging y producción,
  incluidas sondas autenticadas de autorización/IDOR — esto no es (todavía) un
  programa recurrente de pruebas de penetración por terceros, y no vamos a
  afirmar que lo tenemos hasta que exista.
- **Revisión de dependencias y de código**: revisión de código estándar en
  todos los cambios; las actualizaciones de dependencias se siguen a través de
  nuestras herramientas habituales de compilación.

## Disponibilidad y monitorización

- **Monitorización sintética** de los endpoints de cara al cliente, que alerta
  al equipo de guardia mediante PagerDuty en cuestión de minutos ante una
  interrupción real, no solo ante errores de servidor — comprobaciones
  verificadas por contenido, no solo «¿devolvió un 200?».
- **Infraestructura multirregión** (edge de Cloudflare + origen en Google
  Cloud) con copias de seguridad automatizadas en nuestro almacén de datos
  principal.
- Actualmente no publicamos ningún SLA contractual de disponibilidad. Si su
  caso de uso necesita uno, pregúntenos — podemos hablar de qué es realista
  para su despliegue.

## Respuesta ante incidentes

Mantenemos un proceso documentado de respuesta ante incidentes: detección y
clasificación, contención, una evaluación honesta de si un incidente alcanza el
nivel de una brecha notificable, remediación y un post-mortem sin culpables que
retroalimenta lo que monitorizamos a continuación. Si usted es un cliente con
un Acuerdo de Asociado Comercial con nosotros, ese acuerdo especifica nuestras
obligaciones de notificación hacia usted — prevalecen esos términos, no esta
página.

Para informar de un problema de seguridad o de una vulnerabilidad sospechada,
escriba a **security@divinci.ai**. Actualmente no tenemos ningún programa
formal de recompensas por errores (bug bounty); sí nos tomamos los informes en
serio y trabajaremos con usted de buena fe.

## En qué punto estamos respecto a las certificaciones formales

Siendo directos sobre esto, ya que muchas páginas de seguridad no lo son:

- **HIPAA**: consulte «Arquitectura preparada para HIPAA» más arriba. Que
  corresponda o no un Acuerdo de Asociado Comercial depende de su relación
  concreta con nosotros — lo evaluamos por cliente, no como una afirmación
  general.
- **SOC 2**: aún no lo hemos iniciado. Está en nuestra hoja de ruta;
  actualizaremos esta página cuando haya algo real que informar — no antes.
- **ISO 27001, FedRAMP, PCI DSS**: no poseemos estas certificaciones. Los pagos
  con tarjeta se procesan a través de Stripe; Divinci no almacena directamente
  datos de titulares de tarjetas.

Preferimos afirmar de menos aquí y ser dignos de confianza que afirmar de más y
tener que desdecirnos.

### Contacto

Preguntas de seguridad, informes de vulnerabilidades o preguntas sobre
cumplimiento para un acuerdo concreto: **security@divinci.ai**
