# Lista de Tareas para Actualizar TurkamericaStandard 

Basado en las mejoras implementadas en **ChinoStandardS**, aquí tienes la lista detallada de archivos que necesitan crearse o modificarse en **TurkamericaStandard** para ponerlo al día con las nuevas funcionalidades (Traducción, RAG en IA, Mejoras en el Glosario y La Oración del Día).

## 1. Traducción e Internacionalización (i18n) 
ChinoStandard añadió soporte para múltiples idiomas mediante un sistema de internacionalización personalizado.

- [ ] **Crear**: `src/js/i18n.js` (Script focal para manejar las lógicas de traducción en el frontend).
- [ ] **Modificar**: `src/js/settings-panel.js` (Para agregar un selector de idioma y manejar preferencias).
- [ ] **Modificar**: `src/js/app.js` (Para inicializar la traducción tan pronto como cargue la aplicación).

## 2. RAG en Inteligencia Artificial 
El sistema de ChinoStandard ahora usa Recapitulación Aumentada por Generación (RAG) para buscar lecciones o datos antes de que la mascota IA responda, dándole contexto exacto del contenido.

- [ ] **Crear**: `server/services/ragService.js` (Servicio dedicado para generar embeddings de OpenAI o similares y realizar búsquedas de similitud).
- [ ] **Crear**: `server/models/LessonVector.js` (Modelo de base de datos para persistir los vectores del contenido).
- [ ] **Modificar**: `server/routes/ai.js` (Actualizar este controlador para que use el `ragService` al recibir las preguntas del usuario).
- [ ] **Modificar**: `src/js/ai-mascot.js` (Para acomodar cualquier cambio en cómo el frontend procesa o solicita asistencia inteligente a la IA).

## 3. Mejoras en el Sistema del Glosario 
Se mejoraron las lógicas para validar las respuestas y presentar el contenido en el Glosario de manera más estricta.

- [ ] **Modificar**: `src/js/glosario.js` (Actualizar frontend para implementar la corrección sobre traducciones incorrectas y mejoras visuales en validación).
- [ ] **Modificar**: `server/routes/contributions.js` o `server/routes/analytics.js` (Si las revisiones en el backend para la verificación de respuestas han sido modificadas para ser más precisas).

## 4. Oración / Palabra del Día (Word of the Day) 
Se separó la analítica, se redefinió la estructura en la que la IA forma los ejemplos, y se creó lógica dedicada aislando esto de otras analíticas generales.

- [ ] **Crear**: `server/models/WodStats.js` (Nuevo modelo de Mongoose para rastrear específicamente las estadísticas de uso de los usuarios para la palabra del día y sus nacionalidades).
- [ ] **Crear**: `server/routes/wod.js` (Nuevas rutas y endpoints dedicados sólo para Word of the Day).
- [ ] **Modificar**: `server/models/DailyWord.js` (Actualizar el formato/campos de la base de datos de palabras diarias).
- [ ] **Modificar**: `server/server.js` (Agregar `app.use('/api/wod', wodRoutes)` a los endpoints habilitados).
- [ ] **Modificar**: `src/js/word-of-day.js` (Para consumir las nuevas rutas backend, mostrar la UI refinada y enviar analíticas al modelo adecuado).

## Opcional / Mantenimiento 
- [ ] **Sincronizar scripts utilitarios**: Considera importar scripts como `diagose.js` mejorado u otros que estén en `server/scripts/` de ChinoStandardS hacia TurkamericaStandard.
