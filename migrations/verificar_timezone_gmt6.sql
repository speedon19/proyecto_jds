-- ============================================
-- SCRIPT DE VERIFICACIÓN DE CONFIGURACIÓN UTC-6 (COSTA RICA)
-- Ejecuta este script después del script de configuración
-- ============================================

-- 1. Verificar zona horaria de la base de datos
SELECT 
  'Zona horaria de la BD' as verificacion,
  current_setting('timezone') as valor,
  CASE 
    WHEN current_setting('timezone') = 'America/Costa_Rica' THEN '✓ Correcto (UTC-6)'
    WHEN current_setting('timezone') = 'Etc/GMT+6' THEN '✓ Correcto (UTC-6, equivalente)'
    ELSE '✗ Incorrecto - Debe ser America/Costa_Rica (UTC-6)'
  END as estado;

-- 2. Verificar hora actual UTC vs UTC-6 (Costa Rica)
SELECT 
  'Hora actual UTC' as tipo,
  NOW() as valor;

SELECT 
  'Hora actual UTC-6 (Costa Rica)' as tipo,
  NOW() AT TIME ZONE 'America/Costa_Rica' as valor;

SELECT 
  'Hora usando función helper' as tipo,
  get_costa_rica_time() as valor;

-- 3. Verificar diferencia (debe ser 6 horas - Costa Rica está 6 horas detrás de UTC)
SELECT 
  'Diferencia UTC vs UTC-6 (Costa Rica)' as verificacion,
  EXTRACT(EPOCH FROM (NOW() - (NOW() AT TIME ZONE 'America/Costa_Rica'))) / 3600 as horas_diferencia,
  CASE 
    WHEN ABS(EXTRACT(EPOCH FROM (NOW() - (NOW() AT TIME ZONE 'America/Costa_Rica'))) / 3600 - 6) < 0.1 
    THEN '✓ Correcto (6 horas de diferencia - UTC-6)'
    ELSE '✗ Incorrecto'
  END as estado;

-- 4. Verificar funciones helper
SELECT 
  'Función get_costa_rica_time()' as funcion,
  get_costa_rica_time() as resultado,
  '✓ Funciona' as estado;

SELECT 
  'Función get_costa_rica_date()' as funcion,
  get_costa_rica_date() as resultado,
  '✓ Funciona' as estado;

SELECT 
  'Función get_costa_rica_timestamp()' as funcion,
  get_costa_rica_timestamp() as resultado,
  '✓ Funciona' as estado;

SELECT 
  'Función to_costa_rica_time()' as funcion,
  to_costa_rica_time(NOW()) as resultado,
  '✓ Funciona' as estado;

-- 5. Verificar triggers creados
SELECT 
  tgname as nombre_trigger,
  tgrelid::regclass as tabla,
  CASE 
    WHEN tgname LIKE 'trigger_set_%_timezone' THEN '✓ Configurado'
    ELSE '✗ No configurado'
  END as estado
FROM pg_trigger
WHERE tgname LIKE 'trigger_set_%_timezone'
ORDER BY tgrelid::regclass::text;

-- 6. Verificar funciones de triggers
SELECT 
  proname as nombre_funcion,
  pg_get_function_result(oid) as tipo_retorno,
  '✓ Creada' as estado
FROM pg_proc
WHERE proname LIKE 'set_%_timezone'
ORDER BY proname;

-- 7. Prueba de inserción (ejemplo con tabla Asistencias)
-- NOTA: Descomenta esto solo para pruebas, luego elimina el registro
/*
INSERT INTO "Asistencias" ("EmpleadoId", "Fecha", "HoraEntrada", "Estado", "MinutosTardia")
VALUES (
  1,
  get_costa_rica_date(),
  get_costa_rica_timestamp(),
  'Presente',
  0
)
RETURNING 
  "Id",
  "Fecha",
  "HoraEntrada",
  to_costa_rica_time("HoraEntrada") as hora_entrada_cr;
*/

-- 8. Resumen final
SELECT 
  'RESUMEN DE CONFIGURACIÓN' as titulo,
  current_setting('timezone') as zona_horaria,
  (SELECT COUNT(*) FROM pg_proc WHERE proname LIKE '%costa_rica%') as funciones_creadas,
  (SELECT COUNT(*) FROM pg_trigger WHERE tgname LIKE 'trigger_set_%_timezone') as triggers_creados,
  CASE 
    WHEN current_setting('timezone') = 'Etc/GMT+6' 
      AND (SELECT COUNT(*) FROM pg_proc WHERE proname LIKE '%costa_rica%') >= 4
      AND (SELECT COUNT(*) FROM pg_trigger WHERE tgname LIKE 'trigger_set_%_timezone') >= 5
    THEN '✓ Configuración completa'
    ELSE '✗ Configuración incompleta'
  END as estado_final;

