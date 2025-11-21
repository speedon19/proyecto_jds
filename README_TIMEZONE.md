# Configuración de Zona Horaria UTC-6 (Costa Rica) en Supabase

Este documento explica cómo configurar Supabase para usar UTC-6 (GMT-6, Costa Rica) en todas las operaciones de base de datos.

**Nota importante:** Costa Rica está en UTC-6 (GMT-6), lo que significa que está 6 horas detrás de UTC.

## 📋 Pasos de Instalación

### 1. Ejecutar Script de Configuración

1. Abre el **SQL Editor** en tu proyecto de Supabase
2. Copia y pega el contenido completo del archivo `migrations/configurar_timezone_gmt6.sql`
3. Ejecuta el script completo
4. Verifica que no haya errores

### 2. Verificar la Configuración

1. En el mismo SQL Editor, ejecuta el script `migrations/verificar_timezone_gmt6.sql`
2. Revisa los resultados para confirmar que todo está configurado correctamente
3. Deberías ver mensajes de "✓ Correcto" en todas las verificaciones

## 🔧 ¿Qué hace el script?

El script de configuración realiza lo siguiente:

1. **Configura la zona horaria de la base de datos** a `America/Costa_Rica` (UTC-6)
2. **Crea funciones helper** para trabajar con fechas en UTC-6 (Costa Rica):
   - `get_costa_rica_time()` - Obtiene la hora actual en UTC-6 (Costa Rica)
   - `get_costa_rica_date()` - Obtiene la fecha actual en UTC-6 (Costa Rica)
   - `get_costa_rica_timestamp()` - Obtiene timestamp actual en UTC-6 (Costa Rica)
   - `to_costa_rica_time(timestamp)` - Convierte cualquier timestamp a UTC-6 (Costa Rica)

3. **Crea triggers automáticos** para las siguientes tablas:
   - `Asistencias` - Convierte automáticamente `HoraEntrada` y `HoraSalida` a UTC-6 (Costa Rica)
   - `Pausas` - Convierte automáticamente `HoraInicio` y `HoraFin` a UTC-6 (Costa Rica)
   - `Anuncios` - Convierte automáticamente `FechaCreacion` y `FechaActualizacion` a UTC-6 (Costa Rica)
   - `Permisos` - Convierte automáticamente `FechaInicio` y `FechaFin` a UTC-6 (Costa Rica)
   - `Justificaciones` - Convierte automáticamente todas las fechas a UTC-6 (Costa Rica)

## 📝 Uso de las Funciones Helper

### En consultas SQL:

```sql
-- Obtener asistencias de hoy (en UTC-6, Costa Rica)
SELECT *
FROM "Asistencias"
WHERE DATE("Fecha") = get_costa_rica_date();

-- Insertar asistencia con hora actual en UTC-6 (Costa Rica)
INSERT INTO "Asistencias" ("EmpleadoId", "Fecha", "HoraEntrada", "Estado")
VALUES (
  1,
  get_costa_rica_date(),
  get_costa_rica_timestamp(),
  'Presente'
);

-- Ver asistencias con hora convertida a UTC-6 (Costa Rica)
SELECT 
  Id,
  Fecha,
  to_costa_rica_time("HoraEntrada") as hora_entrada_cr
FROM "Asistencias";
```

## ⚠️ Notas Importantes

1. **Las fechas ya guardadas** seguirán en UTC (esto es normal y recomendado)
2. **Los triggers** aseguran que todas las nuevas inserciones/actualizaciones usen GMT-6
3. **El código JavaScript** ya maneja la conversión a GMT-6 con las funciones `formatHoraCR()` y `getCostaRicaTime()`
4. **No es necesario modificar** el código JavaScript existente, pero ahora la BD también trabajará en GMT-6

## 🔍 Verificación Continua

Para verificar que la configuración sigue activa, ejecuta:

```sql
SELECT current_setting('timezone') as zona_horaria_actual;
```

Debería mostrar: `America/Costa_Rica` (o `Etc/GMT+6` como equivalente)

## 🛠️ Solución de Problemas

### Si la zona horaria no se aplica:

1. Verifica que ejecutaste el script completo sin errores
2. Verifica que tienes permisos de administrador en Supabase
3. Intenta ejecutar manualmente:
   ```sql
   ALTER DATABASE postgres SET timezone TO 'America/Costa_Rica';
   SET timezone = 'America/Costa_Rica';
   ```

### Si los triggers no funcionan:

1. Verifica que los triggers fueron creados:
   ```sql
   SELECT tgname, tgrelid::regclass 
   FROM pg_trigger 
   WHERE tgname LIKE 'trigger_set_%_timezone';
   ```

2. Si faltan triggers, ejecuta nuevamente las secciones correspondientes del script

## 📚 Referencias

- **Zona horaria de Costa Rica:** UTC-6 (GMT-6) - 6 horas detrás de UTC
- **Formato recomendado en PostgreSQL:** `America/Costa_Rica` (más claro y específico)
- **Formato alternativo:** `Etc/GMT+6` (equivalente, pero el signo está invertido por razones históricas)
- **Nota importante:** 
  - `America/Costa_Rica` = UTC-6 (GMT-6) ✓
  - `Etc/GMT+6` = UTC-6 (GMT-6) ✓ (el signo está invertido: GMT+6 significa UTC-6)
  - Ambos son equivalentes, pero `America/Costa_Rica` es más semánticamente correcto

