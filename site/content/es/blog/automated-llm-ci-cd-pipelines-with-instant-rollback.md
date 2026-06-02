+++
title = "Pipelines automatizados de CI/CD para LLM con rollback instantáneo"
description = "Capa operacional del pipeline de cuatro etapas: qué decisiones disparan automáticamente, cómo es un drill real de rollback, y el MTTR resultante."
date = 2026-05-30T09:00:00+00:00
template = "blog-post.html"

[taxonomies]
categories = ["Product"]
tags = ["LLM Ops", "CI/CD", "Automation", "Rollback", "MTTR", "Release Management"]

[extra]
author = "Mike Mooring"
author_avatar = "images/Michael-Mooring.png"
hero_video = "https://pub-fb3e683317b24cf8b4260121edae02be.r2.dev/automated-llm-ci-cd-pipelines-with-instant-rollback-veo31.webm"
hero_video_poster = "/images/automated-llm-ci-cd-pipelines-with-instant-rollback-hero-poster.webp"
reading_time = 11
summary = "Entre los gates de aprobación humana, un pipeline de release de LLM o se ejecuta solo o no lo hace. Este post es el complemento operacional al post de arquitectura — dibuja el espectro de automatización (qué decisiones disparan automáticamente, cuáles requieren un humano, y cuáles nos detienen en seco hasta que alguien firma el override), muestra cómo se ve un drill real de rollback, y termina con el número de MTTR que sale por el otro lado."
+++

*Notas del Ciclo de Release — Parte V*

---

La página más citada que no salió el trimestre pasado fue la que nuestro observer disparó por su cuenta a las 2:14 AM. El release candidato había pasado el gate, había permanecido en 5% durante los cuatro minutos requeridos, había avanzado a 25%, y luego se quedó ahí. El monitor de calidad por minuto vio tres lecturas consecutivas por debajo del umbral en el slice de dominio legal, detuvo el rollout, y re-apuntó el routing al release anterior. Para cuando la notificación del ingeniero on-call se disparó — por el recibo, no por una caída — el tráfico de producción llevaba nueve minutos de vuelta sobre el release known-good.

Nadie tuvo que hacer nada. La arquitectura del [primer post de esta serie](/es/blog/how-to-build-an-llm-ci-cd-pipeline-with-divinci-ai/) describe cuáles son las cuatro etapas. Este post trata de lo que corre entre aprobaciones humanas — la capa de automatización bajo la arquitectura, la frontera donde el pipeline o hace lo correcto por su cuenta o no lo hace.

La afirmación titular: **la mayoría de las decisiones del pipeline deberían estar automatizadas, pero no todas**. La frontera importa. El pipeline que automatiza todo eventualmente promoverá un release que un humano debería haber detectado; el pipeline que no automatiza nada no tiene propósito. Trazar la frontera correctamente es de lo que trata este post.

## El espectro de automatización

Cada decisión del pipeline cae en algún punto de un espectro que va de *"dispara por su cuenta sin notificar a ningún humano"* a *"se rehúsa a proceder sin una aprobación firmada explícita."* Abajo está dónde cae cada una de las acciones load-bearing del pipeline en ese espectro en el pipeline que enviamos.

<figure style="margin: 1.5rem auto; max-width: 100%;">
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 900 460" font-family="'DM Sans', -apple-system, sans-serif" role="img" aria-label="El espectro de automatización. De totalmente automatizado a la izquierda a siempre requiere aprobación humana a la derecha. Decisiones representadas: en el extremo totalmente automatizado, la evaluación de calidad por minuto del observer, la verificación de salud del checkpoint canary, y el disparador de auto-rollback; en el medio, el avance al pasar el gate y la promoción del checkpoint canary; hacia el lado humano, el registro del deployment de producción y el commit del manifest; en el extremo siempre-humano, la decisión de override por gate fallido y el deployment shadow de release cold-start.">
<title>El espectro de automatización</title>
<rect width="900" height="460" fill="#faf8f5"/>
<text x="40" y="36" font-size="16" font-weight="700" fill="#1e3a2b">El espectro de automatización</text>
<text x="40" y="56" font-size="12" fill="#6b5d4f">Dónde cae cada decisión load-bearing del pipeline, de totalmente autónomo (izquierda) a siempre-humano (derecha).</text>
<line x1="60" y1="110" x2="860" y2="110" stroke="#2d3c34" stroke-width="2"/>
<line x1="60" y1="100" x2="60" y2="120" stroke="#2d3c34" stroke-width="2"/>
<line x1="860" y1="100" x2="860" y2="120" stroke="#2d3c34" stroke-width="2"/>
<line x1="220" y1="105" x2="220" y2="115" stroke="#2d3c34" stroke-width="1"/>
<line x1="460" y1="105" x2="460" y2="115" stroke="#2d3c34" stroke-width="1"/>
<line x1="700" y1="105" x2="700" y2="115" stroke="#2d3c34" stroke-width="1"/>
<text x="60" y="92" font-size="11" font-weight="700" fill="#2d5a4f">TOTALMENTE AUTOMATIZADO</text>
<text x="60" y="138" font-size="10" fill="#6b5d4f">dispara solo,</text>
<text x="60" y="152" font-size="10" fill="#6b5d4f">sin notificación</text>
<text x="220" y="92" font-size="11" font-weight="700" fill="#7a9580" text-anchor="middle">SOLO-NOTIFICAR</text>
<text x="220" y="138" font-size="10" fill="#6b5d4f" text-anchor="middle">corre automático;</text>
<text x="220" y="152" font-size="10" fill="#6b5d4f" text-anchor="middle">recibo + page</text>
<text x="460" y="92" font-size="11" font-weight="700" fill="#b8a080" text-anchor="middle">PROCEDER-SI-OK</text>
<text x="460" y="138" font-size="10" fill="#6b5d4f" text-anchor="middle">humano puede vetar en</text>
<text x="460" y="152" font-size="10" fill="#6b5d4f" text-anchor="middle">una ventana conocida</text>
<text x="700" y="92" font-size="11" font-weight="700" fill="#c87b3c" text-anchor="middle">INICIADO POR HUMANO</text>
<text x="700" y="138" font-size="10" fill="#6b5d4f" text-anchor="middle">requiere acción</text>
<text x="700" y="152" font-size="10" fill="#6b5d4f" text-anchor="middle">explícita de usuario</text>
<text x="860" y="92" font-size="11" font-weight="700" fill="#a04848" text-anchor="end">SIEMPRE-HUMANO</text>
<text x="860" y="138" font-size="10" fill="#6b5d4f" text-anchor="end">se rehúsa sin</text>
<text x="860" y="152" font-size="10" fill="#6b5d4f" text-anchor="end">justificación firmada</text>
<circle cx="100" cy="200" r="9" fill="#2d5a4f"/>
<line x1="100" y1="209" x2="100" y2="230" stroke="#8a7d68" stroke-width="0.5" stroke-dasharray="2 2"/>
<text x="100" y="246" text-anchor="middle" font-size="11" font-weight="700" fill="#1e3a2b">Eval de calidad</text>
<text x="100" y="261" text-anchor="middle" font-size="11" font-weight="700" fill="#1e3a2b">por minuto del observer</text>
<text x="100" y="282" text-anchor="middle" font-size="10" fill="#6b5d4f">corre continuamente</text>
<text x="100" y="296" text-anchor="middle" font-size="10" fill="#6b5d4f">sobre muestra de 5% de trazas</text>
<circle cx="170" cy="200" r="9" fill="#2d5a4f"/>
<line x1="170" y1="209" x2="170" y2="330" stroke="#8a7d68" stroke-width="0.5" stroke-dasharray="2 2"/>
<text x="170" y="346" text-anchor="middle" font-size="11" font-weight="700" fill="#1e3a2b">Verificación de salud</text>
<text x="170" y="361" text-anchor="middle" font-size="11" font-weight="700" fill="#1e3a2b">de checkpoint canary</text>
<text x="170" y="382" text-anchor="middle" font-size="10" fill="#6b5d4f">p95 + 5xx + calidad de</text>
<text x="170" y="396" text-anchor="middle" font-size="10" fill="#6b5d4f">salida en 5/25/100</text>
<circle cx="240" cy="200" r="11" fill="#a04848" stroke="#a04848" stroke-width="2"/>
<line x1="240" y1="211" x2="240" y2="230" stroke="#8a7d68" stroke-width="0.5" stroke-dasharray="2 2"/>
<text x="240" y="246" text-anchor="middle" font-size="11" font-weight="700" fill="#a04848">Disparador de</text>
<text x="240" y="261" text-anchor="middle" font-size="11" font-weight="700" fill="#a04848">auto-rollback</text>
<text x="240" y="282" text-anchor="middle" font-size="10" fill="#6b5d4f">3 minutos consecutivos</text>
<text x="240" y="296" text-anchor="middle" font-size="10" fill="#6b5d4f">bajo umbral</text>
<circle cx="420" cy="200" r="9" fill="#b8a080"/>
<line x1="420" y1="209" x2="420" y2="330" stroke="#8a7d68" stroke-width="0.5" stroke-dasharray="2 2"/>
<text x="420" y="346" text-anchor="middle" font-size="11" font-weight="700" fill="#1e3a2b">Avance por gate pasado</text>
<text x="420" y="361" text-anchor="middle" font-size="11" font-weight="700" fill="#1e3a2b">a canary</text>
<text x="420" y="382" text-anchor="middle" font-size="10" fill="#6b5d4f">todos los slices ≥ umbral</text>
<text x="420" y="396" text-anchor="middle" font-size="10" fill="#6b5d4f">→ auto-start en 5%</text>
<circle cx="500" cy="200" r="9" fill="#b8a080"/>
<line x1="500" y1="209" x2="500" y2="230" stroke="#8a7d68" stroke-width="0.5" stroke-dasharray="2 2"/>
<text x="500" y="246" text-anchor="middle" font-size="11" font-weight="700" fill="#1e3a2b">Checkpoint</text>
<text x="500" y="261" text-anchor="middle" font-size="11" font-weight="700" fill="#1e3a2b">5% → 25% → 100%</text>
<text x="500" y="282" text-anchor="middle" font-size="10" fill="#6b5d4f">avanza si los monitores</text>
<text x="500" y="296" text-anchor="middle" font-size="10" fill="#6b5d4f">se mantienen durante dwell</text>
<circle cx="680" cy="200" r="9" fill="#c87b3c"/>
<line x1="680" y1="209" x2="680" y2="330" stroke="#8a7d68" stroke-width="0.5" stroke-dasharray="2 2"/>
<text x="680" y="346" text-anchor="middle" font-size="11" font-weight="700" fill="#1e3a2b">Registro de</text>
<text x="680" y="361" text-anchor="middle" font-size="11" font-weight="700" fill="#1e3a2b">release</text>
<text x="680" y="382" text-anchor="middle" font-size="10" fill="#6b5d4f">el cliente commitea</text>
<text x="680" y="396" text-anchor="middle" font-size="10" fill="#6b5d4f">un nuevo manifest</text>
<circle cx="830" cy="200" r="11" fill="#a04848" stroke="#a04848" stroke-width="2"/>
<line x1="830" y1="211" x2="830" y2="230" stroke="#8a7d68" stroke-width="0.5" stroke-dasharray="2 2"/>
<text x="830" y="246" text-anchor="middle" font-size="11" font-weight="700" fill="#a04848">Override de gate fallido</text>
<text x="830" y="282" text-anchor="middle" font-size="10" fill="#6b5d4f">requiere justificación escrita</text>
<text x="830" y="296" text-anchor="middle" font-size="10" fill="#6b5d4f">en el log de auditoría</text>
<text x="40" y="442" font-size="10" fill="#8a7d68"><tspan font-weight="700">Marcadores rojos</tspan> = las dos decisiones donde el comportamiento del pipeline es asimétrico: el auto-rollback dispara por su cuenta y no puedes optar por salirte; el override de gate fallido se rehúsa a proceder y no puedes saltarte la justificación.</text>
</svg>
</figure>

Dos de los marcadores arriba están en rojo en lugar de coloreados según su zona. Esas son las decisiones asimétricas — los dos lugares donde el pipeline toma una postura firme sobre quién decide qué. El **disparador de auto-rollback** dispara sin preguntar; no lo puedes configurar para que se apague, porque todo el punto de tenerlo es que funcione a las 2:14 AM. El **override de gate fallido** se rehúsa a avanzar sin una justificación escrita; tampoco puedes configurar eso para apagarlo, porque todo el punto de tenerlo es que el tú-del-futuro necesita leer la razón. La mayor parte del resto del pipeline es configurable; estas dos no lo son.

## Cómo dispara realmente el auto-rollback

La pregunta más frecuente sobre auto-rollback es *"¿qué impide que dispare por la razón equivocada?"* La respuesta honesta es: nada por sí solo. La protección viene de cómo está cableado el disparador.

La etapa Observe corre un loop de scoring por minuto. Cada minuto:

1. Muestrea un pequeño conjunto de trazas de producción recientes del release activo.
2. Reproduce cada traza a través del *modelo activo* (no del candidato — estamos puntuando lo que realmente está sirviendo).
3. Puntúa cada replay usando el mismo juez calibrado anclado por humanos que manejó Gate-2<sup><a href="#ref-1">[1]</a></sup>.
4. Calcula un único score de calidad de salida sobre la muestra. Lo escribe a `CanaryHealthSample`.

El rollback dispara cuando **tres muestras consecutivas por minuto** caen bajo el umbral de rollback (por defecto: 0.85 del umbral del gate — así que 0.55 si el gate era 0.65). No un minuto malo; tres. El lockout de tres minutos es el filtro de ruido — una sola lectura anómala no dispara nada, pero una regresión sostenida sí.

Cuando el lockout se rompe, el worker de rollback ejecuta:

```bash
# De hecho — el pipeline corre esto por su cuenta. Sin ack humano.
POST /api/v1/releases/<previous_release_sha>/activate
# respuesta en <1s; drenado in-flight en ~12s sobre un servicio de ~100 réplicas
```

Un recibo dispara. El ingeniero on-call ve una notificación de Slack *por el recibo*, no por una caída. Abre el recibo; ve las tres lecturas bajo umbral, el tiempo transcurrido, y los hashes `vindex_sha256_before/after`<sup><a href="#ref-2">[2]</a></sup>. Doce segundos es tiempo de drenado in-flight; el swap mismo es sub-segundo. Para cuando el ingeniero está suficientemente despierto para preguntar "¿necesito hacer algo?", la respuesta es "no, pero deberías mirar de todos modos por qué el gate dejó pasar esto."

## El recibo real de auto-rollback

Así se ve el recibo en producción. Mismo formato encadenado por hash documentado en la [página de cumplimiento](/es/compliance/), con los campos adicionales específicos de un evento de auto-rollback:

```json
{
  "kind": "auto_rollback",
  "release_id": "rel_a01c66",
  "previous_release_id": "rel_8f72b1",
  "trigger_at": "2026-05-29T02:14:23Z",
  "completed_at": "2026-05-29T02:14:35Z",
  "elapsed_seconds": 12,
  "trigger_reason": "observer_quality_threshold_breach",
  "observer_readings": [
    { "minute_at": "2026-05-29T02:11:00Z", "quality_score": 0.523, "below_threshold": true,  "slice": "legal-IP-licensing" },
    { "minute_at": "2026-05-29T02:12:00Z", "quality_score": 0.508, "below_threshold": true,  "slice": "legal-IP-licensing" },
    { "minute_at": "2026-05-29T02:13:00Z", "quality_score": 0.491, "below_threshold": true,  "slice": "legal-IP-licensing" }
  ],
  "rollback_threshold": 0.55,
  "active_manifest_sha256_before": "9abaeaf6c91f8b...",
  "active_manifest_sha256_after":  "8f72b1de4a93c5...",
  "audit_chain_signature": "sha256(...)",
  "notified_users": ["oncall@customer.example"],
  "notification_sent_at": "2026-05-29T02:14:36Z"
}
```

El recibo mismo es el primer punto de contacto del on-call. Leerlo responde las preguntas que un ingeniero medio despierto realmente haría: qué lo disparó, qué slice falló, por cuánto, cuánto tomó el swap, qué está corriendo ahora. El prompt de siguiente-acción de ahí en adelante es usualmente *"ve a ver por qué el gate dejó pasar esto en primer lugar"* — para lo cual el recibo del release que falló ya tiene la tabla de Spearman por slice.

## Lo que el pipeline NO hace por su cuenta

El corolario de "auto-rollback dispara sin preguntar" es que algunas otras cosas activamente no pueden. Tres rechazos explícitos.

**No promueve un release que falló el gate sin un override firmado.** Un fallo de gate marca el release como `gate_fail`; el endpoint `/activate` se rehúsa a aceptar el SHA del manifest; ningún conjuro de línea de comandos lo rodea. La única ruta hacia adelante es un force-override con `forceGateOverride: true` Y `overrideReason: "<texto libre>"`. El campo de razón es requerido, texto libre, y va al log de auditoría junto al ID del usuario. Lo hemos diseñado así para que el tú-del-futuro pueda leer por qué el tú-actual decidió que la regresión del slice era aceptable. Tres personas han usado la ruta de override en la vida real. Sus justificaciones siguen en el log de auditoría.

**No avanza de canary a 100% si algún monitor se está degradando.** Si la latencia p95, la tasa de 5xx, O el score de calidad de salida está fuera de su banda al final de un dwell de checkpoint, el pipeline se detiene en ese checkpoint y avisa. No avanza y se disculpa después.

**No hace auto-canary a un release cold-start.** Un release sin historial de tráfico de producción — un fine-tune fresco sobre un dataset completamente nuevo, digamos — no tiene contra qué comparar su calidad de salida. El pipeline se rehúsa a iniciar un canary sobre un release cold-start. Requerimos primero un shadow deployment de 24 horas, que observa al candidato contra trazas reales de producción pero no sirve ninguna de sus respuestas. Después de 24 horas tenemos una línea base de calidad; entonces el canary puede proceder. Más lento; honesto; no configurable.

## ¿Qué tan rápido es el recovery, end-to-end?

El número de tiempo de recovery que publicamos es **12 segundos**. Ese es el drenado in-flight sobre un servicio de ~100 réplicas. El swap del manifest mismo es sub-segundo. Para que sea útil para un lector, los 12 segundos necesitan descomponerse:

- **0–60 segundos antes del rollback:** llegan las tres lecturas consecutivas bajo umbral. La primera lectura bajo umbral arranca el timer del lockout. Cada minuto subsiguiente extiende el lockout si la calidad sigue bajo umbral.
- **t = 0:** la tercera lectura bajo umbral escribe a `CanaryHealthSample`. El worker de rollback observa el tercer strike y despacha `/activate previous_release`.
- **t < 1 segundo:** el puntero de release activo de la capa de routing (en Redis) cambia. Las nuevas peticiones empiezan a llegar al release anterior.
- **t = 1 a ~12 segundos:** el release candidato sigue sirviendo cualquier petición que estaba en vuelo cuando ocurrió el swap. Drenado in-flight. Algunas respuestas streaming toman 8–10 segundos en completarse naturalmente, así que la cola de limpieza es de unos 12s en un servicio típico.
- **t ≈ 13 segundos:** se escribe y firma el recibo del log de auditoría. La notificación dispara.

Comparado contra los postmortems públicos que seguimos citando como anclas: la caída de Cloudflare de junio de 2022<sup><a href="#ref-3">[3]</a></sup> tomó 44 minutos desde "sabemos qué revertir" hasta "el revert está completo" — y eso era el nivel de *infraestructura*. La caída de Atlassian de abril de 2022<sup><a href="#ref-4">[4]</a></sup> tomó 12 horas por sitio porque el estado estaba dividido entre múltiples sistemas. El umbral de "elite performer" de DORA<sup><a href="#ref-5">[5]</a></sup> para recovery de deployment fallido es menor a una hora. Doce segundos no es un orden de magnitud mejor que el umbral elite — es tres órdenes de magnitud mejor. La decisión arquitectónica que lo hace posible es el manifest de release empaquetado de la [Etapa 1](/es/blog/how-to-build-an-llm-ci-cd-pipeline-with-divinci-ai/#stage-1-register). Sin el manifest, no tienes un solo objeto al que re-apuntar el routing.

## Drills de rollback — la práctica poco glamorosa que nadie corre

Aquí está la parte que la mayoría de los equipos se saltan: **la única señal confiable de que tu ruta de rollback funciona es que corriste un drill deliberado y agendado y lo confirmaste.** Cada trimestre corremos uno. El drill va así:

1. Elige una hora aleatoriamente agendada en horario laboral de día de semana. Avisa al equipo que viene, pero no la hora específica.
2. Inyecta una regresión sintética de calidad sobre el slice del canary. (Tenemos un flag de modo de prueba que permite al modelo candidato responder a un header mágico con "Me rehúso a responder" — garantizado a fallar el juez calibrado.)
3. Empuja el release de prueba a través del gate (pasa — estamos probando el rollback, no el gate). Inicia un canary.
4. El observer nota tres lecturas bajo umbral. El auto-rollback dispara.
5. Espera a que el ingeniero on-call reaccione. Mide cuánto tarda. Anota si confía suficientemente en el recibo como para *no* escalar alarmado.
6. Verifica que el log de auditoría muestre el flag de modo de prueba en el recibo del rollback, para que auditorías futuras puedan distinguir un drill de un incidente real.

El primer drill que corrimos tomó 19 segundos end-to-end (12s de swap + un delay de settling de 7s que tuvimos que arreglar). El drill más reciente — Q1 2026 — tomó 12 segundos. El drill nunca puede saltarse. Cada trimestre; cada cluster de cliente.

La mayoría de los equipos nunca han corrido un drill deliberado de rollback. La primera vez que su ruta de rollback corre es durante un incidente real, bajo presión, con múltiples personas en la llamada. El drill es lo que hace que el número de 12 segundos sea un número real en vez de uno aspiracional.

## Lo que esto no resuelve

Tres limitaciones honestas:

**El auto-rollback puede hacer ping-pong.** Si tanto el candidato COMO el release anterior están mal — digamos, el release anterior también tenía una regresión de slice de desarrollo lento que nadie atrapó — el pipeline puede hacer rollback, luego el release anterior también falla su observer post-rollback, y no hay un tercer release al cual hacer rollback. El pipeline detiene el tráfico hacia una página de mantenimiento en lugar de andar dando bandazos. El fix es mantener más de un release anterior saludable indexado en la cadena del manifest para que el target del rollback sea configurable.

**El observer agrega costo de inferencia.** Re-reproducir trazas de producción a través del modelo activo sobre una muestra del 5% agrega aproximadamente 5% al gasto de inferencia. Pensamos que es el trade correcto. Algunos clientes piensan que es demasiado caro sobre cargas de trabajo de margen bajo y quieren bajar el sample rate. El dial existe.

**Un juez malo es peor que ningún juez.** Si el juez calibrado que maneja el observer está él mismo mal calibrado — derivó del ancla humana, o entrenado sobre un corpus stale — el observer puede disparar auto-rollback por la razón equivocada. La cadencia de re-calibración importa. La pieza Calibrating-the-Judge<sup><a href="#ref-6">[6]</a></sup> documenta el procedimiento; el requisito operacional es que efectivamente lo corras.

## FAQ

### ¿Por qué el disparador de rollback es tres minutos consecutivos en lugar de uno?

Porque los scores de calidad de LLM tienen un piso de ruido — una sola lectura anómala de un minuto puede venir de un capricho de muestreo (la muestra de 5% de trazas cayó justo sobre un slice difícil), no de una regresión real. El lockout de tres minutos es el filtro de ruido más barato que aún mantiene el tiempo total de reacción bajo un minuto y medio. Hemos afinado en ambas direcciones; tres es el punto dulce para la forma típica de tráfico de nuestros clientes. El dwell es configurable por release si la forma de tu tráfico es diferente.

### ¿Debería el auto-rollback ser configurable a "off"?

En el pipeline que enviamos, no. El punto de tener un mecanismo automático de seguridad es que funcione a las 2:14 AM cuando nadie está mirando. Un auto-rollback configurable a apagado es una nota adhesiva que dice "solíamos tener una red de seguridad." El argumento para hacerlo configurable es que algunas cargas de trabajo son demasiado bajas-en-stakes para justificar cualquier rollback falso-positivo. Pensamos que ese argumento lleva al lugar equivocado — si tu carga de trabajo es demasiado baja-en-stakes para auto-rollback, tampoco necesitas un pipeline de release.

### ¿Cómo manejan el caso donde el release anterior también estaba mal?

El target de rollback es `previous_release` por defecto, pero la cadena del manifest almacena más historia que solo N-1. Los operadores pueden re-apuntar un rollback a cualquier SHA de manifest históricamente saludable — `/api/v1/releases/<historically_good_sha>/activate` — que es la ruta de intervención manual cuando el rollback automático N-1 cae sobre un release anterior malo. La válvula de escape está ahí. Es raro.

### ¿Cuál es la métrica correcta a optimizar — MTTR o MTBF?

MTTR — Mean Time To Recovery — por amplio margen, al menos para sistemas LLM. MTBF (Mean Time Between Failures) asume una noción determinista de "fallo" que las cargas de trabajo LLM no tienen. La calidad de salida deriva continuamente; "fallo" es una decisión de umbral. Optimizar por recovery rápido es robusto a dónde dibujas el umbral; optimizar por nunca fallar es frágil y falso. El umbral elite de DORA<sup><a href="#ref-5">[5]</a></sup> está él mismo formulado en términos de MTTR, que es el encuadre correcto.

### ¿Realmente corren drills de rollback?

Sí — trimestralmente, agendados, con un flag de modo de prueba en el recibo para que el drill pueda distinguirse de un incidente real en el log de auditoría. El primer drill que corrimos expuso un delay de settling de 7 segundos que no sabíamos que estaba ahí. El drill es la única manera de saber que la ruta realmente funciona; leer el runbook no es suficiente. La mayoría de los equipos no han corrido uno, que es por lo que los números de MTTR de la mayoría de los equipos son aspiracionales en vez de medidos.

## Referencias

<ol class="post-references" style="padding-left: 1.5rem;">
<li id="ref-1" style="scroll-margin-top: 90px; margin-bottom: 0.9rem;">
<strong>Calibración LLM-as-judge.</strong> Zheng et al., <a href="https://arxiv.org/abs/2306.05685" target="_blank" rel="noopener"><em>Judging LLM-as-a-Judge with MT-Bench and Chatbot Arena</em></a> (NeurIPS 2023). El ancla del por qué un juez calibrado es necesario y por qué el acuerdo por slice importa más que el acuerdo agregado. El loop de scoring por minuto del observer depende de esto.
</li>
<li id="ref-2" style="scroll-margin-top: 90px; margin-bottom: 0.9rem;">
<strong>vIndex weight-attestation.</strong> Documentado en la <a href="/es/compliance/">página de cumplimiento de Divinci</a> y recorrido en el <a href="/es/blog/validating-and-releasing-custom-lms-in-regulated-fields/">post de sectores regulados</a>. Los campos `vindex_sha256_before/after` en el recibo de auto-rollback son el ancla criptográfica que un auditor puede verificar sin confiar en nuestros logs.
</li>
<li id="ref-3" style="scroll-margin-top: 90px; margin-bottom: 0.9rem;">
<strong>Caída de Cloudflare de junio de 2022.</strong> <a href="https://blog.cloudflare.com/cloudflare-outage-on-june-21-2022/" target="_blank" rel="noopener">Cloudflare outage on June 21, 2022</a>. "06:58: Root cause found and understood. Work begins to revert the problematic change… 07:42: The last of the reverts has been completed." Cuarenta y cuatro minutos para revertir en el nivel de infraestructura, en parte porque los ingenieros se pisaban los reverts unos a otros. Ancla para la afirmación de que "un swap manejado por manifest no puede tener ese modo de fallo."
</li>
<li id="ref-4" style="scroll-margin-top: 90px; margin-bottom: 0.9rem;">
<strong>Caída de Atlassian de abril de 2022.</strong> <a href="https://www.atlassian.com/blog/atlassian-engineering/post-incident-review-april-2022-outage" target="_blank" rel="noopener">Post-Incident Review: April 2022 Outage</a>. 12 horas por sitio para restaurar, 14 días totales para 883 sitios, porque el estado estaba dividido entre sistemas independientemente versionados. Ancla para la afirmación de que "el manifest de release empaquetado es lo que hace posible segundos-no-horas."
</li>
<li id="ref-5" style="scroll-margin-top: 90px; margin-bottom: 0.9rem;">
<strong>Umbral DORA de recovery de deployment fallido.</strong> <a href="https://dora.dev/guides/dora-metrics/" target="_blank" rel="noopener">DORA — Software delivery performance metrics</a>. El umbral de "tiempo de recovery de deployment fallido" para elite-performer está documentado como menor a una hora. El número del pipeline de 12 segundos es tres órdenes de magnitud bajo el umbral elite, que es la manera correcta de leer la comparación.
</li>
<li id="ref-6" style="scroll-margin-top: 90px; margin-bottom: 0.9rem;">
<strong>Calibrating the AI judge.</strong> Nuestro post complementario <a href="/blog/calibrating-the-ai-judge/">Calibrating the AI Judge</a>. El procedimiento para mantener al juez anclado por humanos calibrado a lo largo del tiempo. La afirmación operacional en este post — que el auto-rollback solo funciona tan bien como el juez que lo maneja — solo se sostiene si el juez es de hecho re-calibrado periódicamente.
</li>
<li id="ref-7" style="scroll-margin-top: 90px; margin-bottom: 0.9rem;">
<strong>Interno — referencia del pipeline de Divinci.</strong> La arquitectura bajo la cual cae esta capa de automatización: el <a href="/es/blog/how-to-build-an-llm-ci-cd-pipeline-with-divinci-ai/">post del pipeline de cuatro etapas</a>. La superficie completa de API está documentada en la <a href="/es/api/">referencia de API</a>; la sección de release-management es la de la que habla este post.
</li>
</ol>

---

*Próximo en esta serie:* **Testing de CI para Custom Language Models en 2026.** Este post trata de la capa operacional entre las aprobaciones humanas. El próximo es la capa *antes* de que el pipeline arranque — CI pre-merge: qué evaluar al momento del PR, qué tipos de regresiones efectivamente atrapas antes de que el gate las vea, y qué tipos no.
