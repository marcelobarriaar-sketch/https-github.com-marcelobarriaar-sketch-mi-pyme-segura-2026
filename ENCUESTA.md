# Encuesta posterior al servicio · Mi Pyme Segura

Implementación preparada sobre el proyecto existente React 19 + TypeScript + Vite, reutilizando `data/site_data.json`, logo, Roboto, color institucional #b51a00 y WhatsApp oficial. El sitio conserva HashRouter en sus páginas anteriores. Las dos rutas nuevas funcionan sin `#` mediante rewrites de Vercel.

## Estado de entrega

- Código y compilación de producción verificados localmente.
- Flujo móvil de 390 px verificado con registro persistente en una instancia real de Redis temporal, usando solamente datos sintéticos.
- Consulta protegida, promedios, exclusión de No aplica, recomendación y CSV verificados con datos de prueba.
- WhatsApp: integración de servidor preparada para Meta Cloud API. Las respuestas de Meta en las pruebas fueron simuladas; **no se envió ni verificó ningún WhatsApp real**.
- No se ha promovido esta implementación a producción: faltan una base permanente, secretos de acceso y la configuración de Meta. La base temporal usada para QA expira y no debe utilizarse con clientes.

## Direcciones previstas tras activar y desplegar

Encuesta: https://www.mipymesegura.cl/evaluacion
Resultados: https://www.mipymesegura.cl/evaluacion-resultados

El gestor existente incluye un enlace a resultados, que exige su propia sesión validada por el servidor. No se reutiliza la contraseña pública del editor del sitio. No hay acceso público a los registros ni al CSV. La encuesta no se agrega al menú, portada, pie, botones públicos ni sitemap. El HTML generado y las cabeceras solicitan noindex, nofollow y noarchive. Esto no convierte el enlace en privado.

## Configuración indispensable en Vercel

Proyecto: `https-github-com-marcelobarriaar-sketch-mi-pyme-segura-2026-zy4y`, equipo `marcelos-projects-0adad40d`.

Crear una base **permanente** Upstash Redis desde Storage/Marketplace del proyecto o conectar una existente. Usar almacenamiento durable, desactivar eviction y configurar respaldos apropiados en el proveedor. No guardar evaluaciones en el repositorio público ni en `site_data.json`.

Configurar variables de servidor, sin prefijo VITE_, con alcance Production. Para pruebas remotas, utilizar otra base/namespace y secretos distintos con alcance Preview. No pegar credenciales en chat ni versionarlas.

| Variable | Configuración |
| --- | --- |
| UPSTASH_REDIS_REST_URL | Endpoint HTTPS de la base permanente |
| UPSTASH_REDIS_REST_TOKEN | Token de escritura de esa base |
| EVALUATION_NAMESPACE | `mps:evaluations:production:v1` en producción; valor distinto en Preview |
| EVALUATION_ORIGIN | `https://www.mipymesegura.cl`, sin barra final; en Preview el origen exacto de ese despliegue |
| EVALUATION_SESSION_SECRET | Secreto aleatorio de al menos 32 caracteres; usar 32 bytes aleatorios o más |
| EVALUATION_ADMIN_PASSWORD_HASH | Resultado privado del script de hash descrito abajo |
| CRON_SECRET | Otro secreto aleatorio de al menos 32 caracteres para la cola de respaldo |

Elegir una contraseña única para resultados, de al menos 14 caracteres. Generar su hash localmente con `scripts/hash-evaluation-password.mjs`, entregando la contraseña por stdin (no en argumentos ni historial); guardar solamente `salt:hash` en EVALUATION_ADMIN_PASSWORD_HASH. Usar un gestor de contraseñas. El login usa scrypt y cookie HttpOnly, Secure, SameSite=Strict con vigencia de 8 horas. Cambiar EVALUATION_SESSION_SECRET revoca todas las sesiones. Ninguna contraseña de producción fue creada durante esta entrega.

Plantilla de variables: `.env.evaluation.example`. Los archivos `.local` no se versionan. Después de configurarlas, crear un nuevo despliegue y verificarlo antes de promover a producción.

## Configuración de WhatsApp oficial

Destinatario fijo de notificaciones: **+56 9 8614 1302**, autorizado por el solicitante. El botón de ayuda del cliente utiliza la configuración oficial ya existente, independientemente de la nota.

Necesitas una cuenta de WhatsApp Business Platform en Meta, un emisor habilitado que pueda enviar a ese destinatario, un método de pago si Meta lo requiere y una plantilla aprobada. No se presupone que el número destinatario también pueda actuar como emisor; configura un emisor apto según las reglas de Meta. El dueño debe confirmar que acepta recibir estas notificaciones. Configurar permisos del token de sistema para el WABA/emisor correspondiente.

| Variable | Configuración |
| --- | --- |
| WHATSAPP_NOTIFICATIONS_ENABLED | `false` durante preparación; `true` al probar con Meta ya configurado |
| WHATSAPP_ACCESS_TOKEN | Token del sistema con acceso al emisor y permiso de mensajería |
| WHATSAPP_PHONE_NUMBER_ID | ID del emisor en Meta, no el número destinatario |
| WHATSAPP_GRAPH_VERSION | Versión vigente habilitada para la aplicación Meta, por ejemplo el valor indicado en su panel |
| WHATSAPP_TEMPLATE_NAME | Nombre aprobado, propuesto `mps_evaluacion_recibida` |
| WHATSAPP_TEMPLATE_LANGUAGE | Idioma exacto aprobado, propuesto `es_CL` |
| WHATSAPP_APP_SECRET | App Secret para verificar firmas de los webhooks |
| WHATSAPP_WEBHOOK_VERIFY_TOKEN | Secreto propio aleatorio de al menos 32 caracteres |

Enviar a revisión una plantilla de cuerpo con **9 parámetros posicionales**, en este orden:

```
Nueva evaluación de Mi Pyme Segura.
Fecha y hora Chile: {{1}}
Nombre o referencia: {{2}}
Atención y trato: {{3}}
Puntualidad: {{4}}
Orden y cuidado: {{5}}
Explicación de equipos: {{6}}
Satisfacción general: {{7}}
¿Nos recomendarías?: {{8}}
Comentario: {{9}}
```

Meta decide la categoría y aprobación. Dar ejemplos sintéticos durante la revisión. Cada comentario admite hasta 500 caracteres visibles en el formulario y se guarda íntegro. En los parámetros de WhatsApp se normalizan saltos de línea, tabuladores y espacios repetidos, sin recortar texto, para cumplir el formato de plantillas. Fecha y hora usan America/Santiago, incluyendo cambios estacionales.

Webhook: `https://www.mipymesegura.cl/api/evaluation-whatsapp`; verificar con WHATSAPP_WEBHOOK_VERIFY_TOKEN y suscribir eventos de mensajes/estados del WABA. El servidor verifica `X-Hub-Signature-256` con WHATSAPP_APP_SECRET y el ID del emisor antes de actualizar estados.

No considerar WhatsApp operativo hasta realizar un envío real de prueba y comprobar en el panel el paso a **Entregado**, además de la recepción en el teléfono. La aceptación HTTP de Meta no prueba entrega.

## Persistencia, spam y reintentos

Se guarda atómicamente la evaluación, el índice por fecha, los acumuladores para métricas y una salida pendiente. La API valida nuevamente todos los valores. “No aplica” es válido para los cuatro aspectos específicos; la satisfacción general y la recomendación requieren respuesta. Nombre/referencia y comentario son opcionales.

Un desafío firmado, honeypot y límites persistentes por IP reducen spam básico. La IP se utiliza mediante HMAC para los límites, sin guardarla en texto plano en la evaluación. El mismo desafío no crea dos evaluaciones; envíos idénticos desde la misma IP también se deduplican durante dos minutos. El botón evita doble pulsación. Si se pierde la confirmación de red, se puede reenviar el mismo desafío sin otro registro. La interfaz conserva respuestas ante fallos de envío mientras la página permanece abierta. Se comprobó deteniendo el servidor, enviando, observando el mensaje de error y reintentando con las mismas respuestas al restablecerlo.

Cada notificación tiene un intento con identificador único y reclamo atómico. Estados: pendiente, no configurado, en proceso, aceptado, enviado, entregado, leído, falló o entrega incierta. El panel permite reintentar solamente pendientes, fallidas o sin configurar. Un cron diario a las 12:00 UTC procesa hasta cinco pendientes en paralelo como respaldo; el envío normal se intenta al guardar, sin esperar al cron.

**Límite del proveedor:** la API de Meta no ofrece una garantía de exactamente una vez para esta llamada. Ante timeout o caída entre envío y confirmación, se conserva estado incierto/en proceso y no se reenvía automáticamente. El webhook puede conciliar por ID del intento. Si persiste, revisar con Meta antes de habilitar un reenvío; no borrar bloqueos a ciegas. Esto evita duplicar mensajes por reintentos inseguros. El registro de la evaluación se conserva aunque WhatsApp falle.

## Consulta y CSV

Abrir `/evaluacion-resultados`, ingresar con la contraseña configurada y consultar fecha Chile, referencia, cinco notas, recomendación, comentario y estado de WhatsApp. El panel pagina de 50 en 50, muestra el total, promedios sin No aplica y distribución de recomendaciones. CSV exporta todas las evaluaciones del corte consultado, con UTF-8/BOM, separador `;`, comillas escapadas y protección contra fórmulas de hoja de cálculo.

## Validación realizada y pendiente

Realizado: compilación `tsc && vite build`; pruebas contra Redis real temporal (validación, origen no autorizado, honeypot, deduplicación concurrente, persistencia, métricas, sesiones, CSV, exclusión de No aplica y estados de notificación con respuestas simuladas de Meta). Navegador a 390×844: sin notas seleccionadas al iniciar, controles táctiles, etiquetas, logo oficial, envío, confirmación y consulta protegida del registro de prueba.

Pendiente con infraestructura propia: configurar secretos y base permanente, desplegar Preview, confirmar las tres funciones en el runtime Vercel, probar una evaluación completa contra esa base, verificar cabeceras noindex y que no existan enlaces públicos, revisar páginas anteriores, promover el despliegue probado y repetir desde el dominio oficial. Para WhatsApp se requiere además plantilla/emisor/token y webhook de entrega reales.

Los componentes nuevos no exponen resultados mediante el editor heredado, cuya validación de login se realiza en el navegador. Su autenticación no se considera una barrera para datos privados.

## Costos

Upstash puede ofrecer un nivel gratuito sujeto a sus límites; almacenamiento, respaldos y comandos adicionales dependen del plan. Vercel Functions/cron consumen los recursos del plan del proyecto. Meta cobra según mensaje entregado, categoría y mercado del destinatario; la aprobación de la plantilla determinará la categoría. No se contrató un plan pago ni se envió un mensaje facturable en esta entrega. Consultar tarifas vigentes:

- https://upstash.com/pricing/redis
- https://business.whatsapp.com/products/platform-pricing

## WhatsApp para clientes — usar después de activar el enlace

Hola 👋 Gracias por confiar en Mi Pyme Segura. ¿Nos ayudas a evaluar el servicio? Te tomará menos de un minuto: https://www.mipymesegura.cl/evaluacion
Tu opinión nos ayuda a mejorar. ¡Gracias!
