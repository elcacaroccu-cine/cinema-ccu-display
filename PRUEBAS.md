# Verificación previa a GitHub Pages · 6 de noviembre de 2026

20 pruebas automatizadas aprobadas con `node --test tests/*.test.mjs`.

- Alta inicial, individual y múltiple; hasta cinco usuarios en la prueba.
- Nombres vacíos y duplicados, roles inexistentes y PIN inválido rechazados.
- Hash de PIN con sal individual; edición sin cambiar PIN conserva acceso.
- Acceso denegado con PIN incorrecto, usuario inexistente, inactivo o eliminado.
- Protección del último administrador frente a eliminación, desactivación y cambio de rol.
- Segundo administrador y pérdida de privilegios al eliminarse a sí mismo.
- Persistencia de usuarios tras recarga y cierre de sesión.
- Cambio de PIN y rechazo de la clave anterior.
- Edición de ID inexistente rechazada; detección de altas concurrentes sin sobreescritura silenciosa.
- Fallo de almacenamiento conserva los datos previos; lotes inválidos no se guardan parcialmente.
- Permisos de Programación, Dulcería y Consulta; protección de usuarios y respaldos.
- Entre una y cinco funciones; fechas y horarios inválidos rechazados.
- Un póster por película y sala con todos los horarios del día; salas y días separados.
- Guardado, edición y restauración de pósters cargados; límites de tamaño y formato.
- Calendario de Puebla, cambio de año y formatos de enlaces de tráiler.

Prueba manual en navegador de la aplicación local: crear administrador, alta individual de Programación, alta múltiple de Dulcería y dos usuarios Consulta; comprobar listado de cinco usuarios; iniciar sesión con Dulcería y Consulta y verificar sus controles; recargar y confirmar que se requiere volver a iniciar sesión.

Correcciones: se rechazan ediciones de usuarios eliminados y cambios sobre una lista de usuarios modificada durante otra operación.

## Alcance operativo

La configuración publicada es LOCAL. Los usuarios, PIN y programación se guardan en el navegador de cada equipo, no en GitHub. Los permisos locales organizan la operación; no sustituyen autenticación de servidor frente a alguien con acceso al almacenamiento o herramientas del navegador. No se publica ningún usuario ni PIN de prueba.

Para usar otra computadora: exportar el respaldo del contenido desde el origen, abrir la URL de GitHub Pages en el equipo del lobby, crear allí el administrador e importar el respaldo. Los usuarios no están incluidos en el respaldo. Las actualizaciones entre equipos no son automáticas. No se ha configurado ni validado Supabase con credenciales reales, TMDB con token real ni la reproducción de todos los tráileres externos.
