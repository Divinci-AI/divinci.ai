+++
title = "Divinci Local Inference — Política de Privacidad"
description = "Política de privacidad de la extensión de Chrome Divinci Local Inference: qué se ejecuta localmente en su dispositivo y qué, en situaciones específicas con sesión iniciada, se envía a Divinci."
template = "page.html"
+++

# Divinci Local Inference — Política de Privacidad

**Última actualización:** Junio 2026

Esta política se aplica específicamente a la extensión de Chrome **Divinci
Local Inference**. Para el sitio web, las aplicaciones y los servicios de
Divinci AI en general, consulte nuestra [Política de Privacidad](/es/privacy-policy/)
principal.

Divinci Local Inference ejecuta un modelo de IA de pesos abiertos (Gemma 4 de
Google) de forma local en su navegador, en su GPU, y — cuando usted decide
iniciar sesión — conecta ese asistente local con su cuenta de Divinci para
funciones opcionales asistidas por la nube. Esta política explica exactamente
qué permanece en su dispositivo y qué, en situaciones específicas, se envía a
Divinci.

**La versión breve:** De forma predeterminada, la extensión es exclusivamente
local — sus chats con el modelo en el dispositivo nunca salen de su
computadora. Algunas funciones opcionales y claramente controladas (iniciar
sesión, respuestas conscientes de la página y chat en modo de cuenta) sí
envían datos a Divinci. Estas se describen a continuación. No vendemos sus
datos, no mostramos anuncios ni los utilizamos para rastrearlo en la web.

## 1. Qué permanece en su dispositivo (de forma predeterminada)

- **Sus chats con el modelo Gemma local.** Las indicaciones y respuestas se
  calculan en su GPU y la extensión no las registra, almacena ni transmite.
  (Excepciones: las dos funciones opcionales de las secciones §3 y §4.)
- **Los archivos del modelo**, almacenados en caché en su navegador después de
  la primera descarga.
- **Su configuración** (modelo seleccionado, valores predeterminados de
  inferencia, alternadores de privacidad), almacenada localmente en su
  navegador.

Cuando **no ha iniciado sesión**, la extensión **no** envía ninguna
información de navegación a Divinci.

## 2. Iniciar sesión en Divinci (opcional)

Si hace clic en **Iniciar sesión / Registrarse**, la extensión completa un
inicio de sesión OAuth estándar con el proveedor de identidad de Divinci
(Auth0). En caso de éxito, recibimos y almacenamos **en su dispositivo** un
token de acceso y su perfil básico (correo electrónico, nombre y URL del
avatar) para que la extensión pueda mostrar con qué cuenta ha iniciado sesión
y realizar solicitudes autenticadas en su nombre. El token de acceso nunca
sale del service worker en segundo plano de la extensión. Puede cerrar sesión
en cualquier momento desde la ventana emergente de la barra de herramientas,
lo que elimina los tokens almacenados.

## 3. Actividad de navegación web (solo mientras ha iniciado sesión **y** el panel está abierto)

Para indicarle si la página que está viendo está cubierta por el índice de
conocimiento público web compartido de Divinci y fundamentar las respuestas en
él, la extensión — **solo cuando ha iniciado sesión y tiene abierto el panel
lateral de Divinci en una página** — envía lo siguiente a la API de Divinci:

- **La dirección de la página**, reducida únicamente a su origen y ruta. La
  cadena de consulta y el fragmento (las partes después de `?` y `#`, que
  pueden contener términos de búsqueda, tokens o identificadores personales)
  se **eliminan antes de enviarla**.
- **Una huella digital unidireccional (hash) del texto visible de la
  página**, utilizada para detectar si nuestro índice está actualizado. **El
  contenido real de la página no se envía** — solo este hash y la dirección
  recortada.

Límites importantes:

- Esto ocurre **solo mientras el panel lateral está abierto** en una página.
  Con el panel cerrado, la extensión no envía nada sobre las páginas que
  visita.
- **Los sitios sensibles se omiten por completo** — la extensión no envía
  nada para páginas de inicio de sesión/cuenta, sitios bancarios y
  financieros, correo web, portales de atención médica, direcciones
  locales/privadas o puertos no estándar.
- Se utiliza para consultar y actualizar el índice público web, **no** para
  crear un perfil suyo ni para orientar publicidad.

El índice compartido en sí es creado por Divinci mediante el rastreo de
páginas web **de acceso público** en sus propios servidores; esta extensión
no carga contenido de páginas para construirlo.

## 4. Respuestas conscientes de la página y chat en modo de cuenta (opcional)

- **Respuestas conscientes de la página (fundamentación).** Cuando una página
  está en el índice y usted envía un mensaje en el panel lateral, la
  extensión envía **su mensaje y la dirección recortada de la página** a
  Divinci para recuperar contexto relevante, que luego se proporciona al
  modelo local. Por lo tanto, en este caso su mensaje de chat sí sale de su
  dispositivo. Puede desactivar esto — véase §5.
- **Chat en modo de cuenta.** Si activa *"Usar mi cuenta de Divinci"* para el
  chat, su conversación se envía a los servidores de Divinci (para ejecutar
  modelos y herramientas alojados en el servidor) y se almacena como una
  transcripción en su cuenta, de la misma manera que al chatear en
  chat.divinci.app. Dejar esto desactivado mantiene el chat completamente
  local.

## 5. Sus controles de privacidad

En la ventana emergente, en **Configuración avanzada → Privacidad**:

- **Recuperar contexto de página de Divinci** — cuando está desactivado, la
  extensión nunca envía su mensaje para respuestas conscientes de la página
  (su consulta de chat permanece en su dispositivo). Predeterminado:
  activado.
- **Permitir que Divinci use mis chats de cuenta** — cuando está desactivado,
  la extensión solicita a Divinci que no utilice sus chats en modo de cuenta
  para mejorar sus servicios. Predeterminado: activado. (Esto envía una señal
  de exclusión con sus solicitudes; el manejo real es aplicado por los
  servidores de Divinci.)

También puede permanecer **sin iniciar sesión** (completamente local) o
**cerrar sesión** en cualquier momento para detener todo lo descrito en
§2–§4.

## 6. A dónde van los datos

- **huggingface.co** (y la CDN `cas-bridge.xethub.hf.co`) — para descargar
  los archivos del modelo, sujeto a la [Política de Privacidad de Hugging Face](https://huggingface.co/privacy).
- **El proveedor de identidad de Divinci** (Auth0) — solo durante el inicio
  de sesión.
- **La API de Divinci** (`api.divinci.app`) — para las funciones con sesión
  iniciada de §3 y §4.

## 7. Lo que **no** hacemos

- **No** vendemos ni alquilamos sus datos.
- **No** mostramos anuncios ni utilizamos sus datos para publicidad o
  seguimiento entre sitios.
- **No** enviamos el **contenido** de las páginas que visita (solo la
  dirección recortada y un hash unidireccional, según §3).
- **No** transmitimos nada sobre su navegación cuando ha cerrado sesión o
  cuando el panel lateral está cerrado.

## 8. Permisos

- **offscreen** — ejecutar el modelo WebGPU.
- **storage** — almacenar la configuración y la preferencia de modelo en
  caché localmente.
- **identity** — completar el inicio de sesión OAuth en su cuenta de Divinci
  (§2).
- **host permissions** (`api.divinci.app` y el origen de inicio de sesión de
  Auth0) — realizar las solicitudes autenticadas de §2–§4.
- **content script en todos los sitios** — dibujar el panel lateral y, solo
  mientras está abierto y usted ha iniciado sesión, ejecutar la verificación
  del índice de páginas de §3. El script lee el título, la dirección y el
  texto visible de la página **localmente** para calcular el hash; no
  transmite el contenido de la página.
- **externally_connectable** (solo dominios de Divinci AI) — permitir que
  chat.divinci.app use el modelo local mediante un puerto `chrome.runtime`.

## 9. Código abierto

La extensión tiene licencia Apache-2.0; el código fuente está disponible en
[github.com/Divinci-AI/gemma-gem](https://github.com/Divinci-AI/gemma-gem).

## 10. Cambios en esta política

Si cambiamos la forma en que la extensión maneja los datos, actualizaremos
esta política y aumentaremos la versión de la extensión (que se muestra en la
tarjeta de `chrome://extensions`).

## 11. Contacto

¿Preguntas? Escriba a [mike@divinci.ai](mailto:mike@divinci.ai).
