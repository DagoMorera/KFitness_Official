# KFitness — actualización del sitio

## Checkout, promociones y Contacto

Después de copiar el proyecto a la carpeta activa, ejecuta este comando de PowerShell desde esa carpeta, con IIS Express detenido:

```powershell
.\tools\Aplicar-Migraciones.ps1 -CompraYContacto
```

El comando usa la conexión de `web.config` y aplica las migraciones **031** y **032**. Si la base usa autenticación SQL, ejecuta esos dos archivos de `DataBase` en ese orden desde SSMS. Se requieren el catálogo, los módulos de reservas, promociones y pagos, y la migración **026** de Consultas. La valoración gratuita usa el servicio activo **Evaluación física**. Debe existir un horario futuro de ese servicio para que el cliente pueda reservar.

- **Checkout.** El formulario acepta datos ficticios. La reserva, la orden y el pago simulado se confirman en una transacción. Las órdenes de ₡0 omiten el formulario de tarjeta.
- **Primera valoración gratuita.** Se crea o reutiliza como promoción independiente. El límite de un uso se conserva tras una cancelación.
- **Plan mensual de entrenamiento y seguimiento.** Las entradas nuevas se guardan inactivas. En Administración, confirma el precio, activa el servicio y establece la vigencia de la promoción antes de activarla. El tipo **Solo consulta** muestra el enlace a Contacto.
- **Contacto.** Los clientes autenticados envían la consulta con los datos de su cuenta. Los visitantes siguen completando sus datos.

## Reservas, Mi progreso y autenticación

- Reservas usa un calendario ampliado, oculta fechas pasadas y valida la disponibilidad antes de enviar la cita al carrito. La reserva regular avanza directamente. El 2×1 conserva la selección de dos sesiones.
- En Mi progreso, el primer guardado en LocalDB aplica las migraciones pendientes 014, 028 y 029 sobre la conexión del sitio. La 029 completa fichas faltantes de cuentas activas con rol Cliente. Después se guarda la solicitud original.
- Inicio de sesión y Registro incluyen los dos fondos suministrados. Se incorporan las cuatro pantallas y la plantilla del correo de recuperación. Conserva el SMTP privado y configura la URL HTTPS que realmente abrirá el enlace de recuperación.
- El checkout está en modo simulado. En IIS Express, prueba una reserva normal, una con descuento y una 2×1, y verifica la orden, Mis reservas y el historial de progreso después de recargar.

Esta entrega contiene cambios de código para Rutinas (administrador y cliente), Contacto, Consultas, Configuración, correos transaccionales y reportes complementarios. Mantiene la tecnología ASP.NET Web Site / .NET Framework 4.8, el panel lateral, las rutas y los archivos multimedia existentes.

## Corregir solo el guardado de Mi progreso

Detén IIS Express y aplica el paso 2 de la instalación a la carpeta que ejecuta Visual Studio. Vuelve a iniciar el sitio, abre **Mi perfil → Mi progreso**, guarda los datos personales y registra peso y medidas. Recarga la página para comprobar los valores guardados y el historial.

Si el sitio informa que no pudo preparar la base, detén IIS Express y ejecuta este comando desde la carpeta del sitio ya actualizado:

```powershell
.\tools\Aplicar-Migraciones.ps1 -SoloPerfil
```

El comando usa `KFitnessConnection` de `web.config`, autenticación Windows y el proveedor de SQL incluido en .NET. Aplica las tres migraciones en una transacción. Para una base con autenticación SQL, aplica `014_Progreso_Cliente.sql`, `028_Perfil_Progreso_DatosPersonales.sql` y `029_Completar_Clientes_Existentes.sql` en ese orden desde SSMS, seleccionando la base de `KFitnessConnection`. Conserva la base que ya contiene tus usuarios y registros.

## Instalar sobre tu proyecto actual

1. Detén el sitio en Visual Studio. Extrae este ZIP en una carpeta diferente a la que ejecuta IIS Express.
2. Desde PowerShell, en la carpeta KFitness extraída, ejecuta:

```powershell
.\tools\Actualizar-Sitio.ps1 -Destino 'C:\Users\flor\Desktop\Diseño y Desarrollo de Sistemas\G2_SC603_L_EntregaFinal\KFitness'
```

El script respalda los archivos que reemplaza en una carpeta junto al proyecto. No borra archivos existentes, copia los fondos de autenticación y del gimnasio incluidos en el paquete, conserva los secretos, y conserva tu conexión a SQL y las opciones SMTP/OpenAI. Solo ajusta en web.config los límites necesarios para subir varias fotos al guardar una rutina. No inicia IIS ni ejecuta migraciones.

3. En la carpeta del sitio actualizado, ejecuta:

```powershell
.\tools\Aplicar-Migraciones.ps1
.\tools\Validar-Compilacion.ps1
```

El primer script utiliza autenticación Windows, LocalDB y base KFitness. No pide ni imprime contraseñas. Detiene el proceso ante errores. Si PowerShell bloquea scripts por una política de tu equipo, puedes ejecutar los comandos equivalentes con tus herramientas habituales; no necesitas cambiar permanentemente esa política.

4. Inicia el sitio en Visual Studio y abre el puerto de IIS Express de tu proyecto. La referencia utilizada anteriormente era `http://localhost:52344/admin.html`. Recarga con Ctrl+F5. Los nuevos recursos tienen versión `20261111-2`.

## Base de datos

Se requiere la base existente con `cfg.Migraciones`, `cfg.Parametros`, `seg.Usuarios` y las tablas de `022_Rutinas.sql`. No ejecutes todos los scripts históricos sobre una base de producción.

Orden de esta actualización:

1. `024_Preflight.sql`: comprueba compatibilidad, sin modificar registros.
2. `024_Rutinas_Editor_Inline.sql`: estructura del editor.
3. `025_Rutinas_Progreso.sql`: sesiones realizadas e historial.
4. `026_Consultas_Web.sql`: consultas y respuestas.
5. `027_Correos_Web.sql`: cola de notificaciones transaccionales.

Los dos archivos 023 del ZIP recibido estaban vacíos: no proporcionan una migración utilizable. Si tu base local recibió otra versión de 023 y tiene columnas diferentes, el preflight debe detener la actualización. No borres tablas para continuar. Ejecuta `tools/Diagnostico-Rutinas.sql` y usa ese esquema para preparar una conversión compatible. Esta entrega no inventa una conversión de una estructura que no se pudo inspeccionar.

Los scripts 024–027 trabajan sobre la base seleccionada y no contienen `USE KFitness`, `DROP`, `TRUNCATE` ni eliminación de datos. Para el hosting, selecciona la base correspondiente y ejecútalos con su herramienta SQL, sin usar las credenciales en el código fuente. No se ha ejecutado ninguna migración desde este entorno.

## Rutinas

- Agregar y editar abren un editor amplio dentro de Rutinas: Información, Sesiones y ejercicios, Vista previa.
- Las sesiones y ejercicios se guardan como registros relacionados, con orden, series, repeticiones o tiempo, descanso, carga, instrucciones, errores a evitar, notas, foto y video.
- Las imágenes se almacenan en `App_Data/RoutineMedia`; el handler valida formato y tamaño. Cada imagen admite hasta 5 MB y el conjunto del formulario hasta 30 MB. El proceso del sitio necesita permisos de escritura en esa carpeta.
- Los videos usan enlaces HTTPS de YouTube o Vimeo. Se abren en otra pestaña; no se descargan ni se generan videos.
- Se puede agregar un ejercicio nuevo al catálogo reutilizable. Las adaptaciones de una rutina son locales; no sobrescriben silenciosamente el catálogo.
- Ver abre el plan sin editar. La asignación conserva el diálogo y la validación de cliente existentes.
- Mis rutinas y Perfil comparten la misma vista con datos de la asignación autenticada, días, tarjetas de ejercicios, guía y progreso.
- Una rutina sin ejercicios muestra un único estado vacío, sin guía ni botones de ejecución.
- Iniciar crea una ejecución; marcar/desmarcar exige una ejecución abierta y propia. Finalizar una sesión incompleta requiere confirmación.
- Editar una rutina conserva las sesiones anteriores como versiones inactivas. Una ejecución iniciada conserva su copia del plan; el cliente puede terminar la versión anterior. Los cambios del plan se muestran en las asignaciones vigentes para futuras ejecuciones. El historial muestra hasta las últimas 100 ejecuciones por asignación.
- No se crearon rutinas, clientes, reservas ni ejercicios de muestra. Las fotografías las carga el administrador.
- La IA sigue siendo opcional. Su borrador se carga en el editor para revisión; no se guarda ni se asigna automáticamente. Requiere clave y cuota disponibles.

## Otros módulos completados o corregidos

- Contacto registra realmente la consulta y usa una clave de solicitud para evitar duplicados por reintento. Conserva el mensaje si falla.
- Consultas incluye búsqueda, estado, paginación, detalle, respuesta, envío de correo y eliminación con confirmación. Si falla SMTP, la respuesta queda guardada y se muestra la opción de reintentar el correo.
- Configuración guarda información institucional y permite pausar nuevas reservas. El backend aplica la pausa; no cancela reservas existentes.
- Información pública: nombre, teléfono, correo, dirección y descripción se actualizan en las áreas de contacto conectadas. La información estática sigue disponible si falla la consulta de configuración.
- Registro y reservas generan correos transaccionales con una cola persistente; Configuración permite consultar pendientes y reintentar hasta cinco. El envío SMTP no puede garantizar entrega al buzón: debe validarse con el proveedor. Un fallo al registrar la notificación se audita y no revierte la operación principal.
- Reportes conserva los existentes y agrega consultas y actividad por período/usuario, con paginación y exportación CSV (hasta 10 000 registros).
- Perfil utiliza el lector JSON de .NET para recibir correctamente objetos JSON de edición.
- Se retiraron manejadores del modal de Rutinas que ya no se utiliza y se separó el código nuevo por módulo.

## Comprobaciones realizadas

- Revisión de sintaxis con `node --check` de todos los archivos JavaScript.
- XML de `web.config` válido.
- Sin identificadores HTML duplicados en Administración, Perfil, Rutinas y Contacto.
- Sin archivos faltantes en las referencias literales revisadas de JS, CSS y endpoints.
- Comparación del HTML: el panel lateral de Administración permanece idéntico al del ZIP original.
- Revisión de delimitadores y nombres de clases de C#; esto **no equivale a compilación**.

## Comprobaciones que debes ejecutar

No hay .NET Framework, IIS Express ni SQL Server LocalDB disponibles en este entorno. No se pudo compilar C#, ejecutar SQL, probar respuestas HTTP con sesión, validar SMTP/OpenAI ni verificar la visualización real en tu navegador. El intento de inspección visual automatizada tampoco pudo iniciar Chromium por restricciones del entorno. No hay evidencia de un HTTP 200 real desde tu sitio.

Las pruebas funcionales quedan para vos, según lo solicitado. No se declara el proyecto aprobado ni se certifica el cumplimiento de las 44 historias solo por esta revisión de código.

Secuencia sugerida:

1. Migraciones sin errores y compilación ASP.NET correcta.
2. Administrador → Rutinas: listado HTTP 200 JSON; crear un plan con dos sesiones, foto y video; guardar y volver a editar.
3. Ver y vista previa: comprobar imágenes y detalle, sin superposición del texto.
4. Asignar al cliente elegido. Iniciar sesión con ese cliente: comprobar plan, días y guía.
5. Iniciar entrenamiento, marcar un ejercicio, recargar y comprobar persistencia; finalizar y revisar historial. Probar dos pestañas para confirmar que no se duplica una ejecución abierta.
6. Editar un plan con una ejecución abierta: comprobar que el historial y esa ejecución conservan su versión.
7. Probar estados sin asignaciones/sin ejercicios y acceso de otro usuario.
8. Contacto → Consultas: guardar, responder, comprobar mensaje de envío o error SMTP y confirmar recepción real del correo.
9. Configuración: actualizar contacto y pausar reservas; comprobar que nuevas solicitudes son rechazadas y las anteriores siguen visibles.
10. Revisar registro, recuperación, perfil, servicios, horarios, reservas, promociones, reportes y auditoría con tus casos del Excel.

## Secretos y despliegue

No se incluyen claves locales, archivos `.git`, cachés de Visual Studio, compilados ni bases MDF/LDF. Conserva tu `App_Data/secrets.local.config` y tu configuración privada. La clave OpenAI y las credenciales SMTP no van en JavaScript ni en commits. Esta entrega no se publicó en el hosting.
