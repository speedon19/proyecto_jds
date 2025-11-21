-- ============================================
-- CONFIGURACIÓN COMPLETA DE ZONA HORARIA UTC-6 (COSTA RICA)
-- Costa Rica está en UTC-6 (GMT-6), 6 horas detrás de UTC
-- Este script configura Supabase para usar UTC-6 en todas las operaciones
-- ============================================

-- NOTA IMPORTANTE: 
-- - America/Costa_Rica = UTC-6 (GMT-6) - Zona horaria específica de Costa Rica
-- - Etc/GMT+6 = UTC-6 (GMT-6) - Notación estándar (el signo está invertido por razones históricas)
-- Ambas son equivalentes para Costa Rica, pero usamos America/Costa_Rica por claridad

-- 1. Configurar la zona horaria de la base de datos a UTC-6 (Costa Rica)
ALTER DATABASE postgres SET timezone TO 'America/Costa_Rica';

-- 2. Configurar la zona horaria para la sesión actual
SET timezone = 'America/Costa_Rica';

-- 3. Crear función helper para obtener la hora actual en UTC-6 (Costa Rica)
CREATE OR REPLACE FUNCTION get_costa_rica_time()
RETURNS TIMESTAMP WITH TIME ZONE
LANGUAGE plpgsql
STABLE
AS $$
BEGIN
  RETURN (NOW() AT TIME ZONE 'UTC') AT TIME ZONE 'America/Costa_Rica';
END;
$$;

-- 4. Crear función para convertir cualquier timestamp a UTC-6 (Costa Rica)
CREATE OR REPLACE FUNCTION to_costa_rica_time(timestamp_value TIMESTAMP WITH TIME ZONE)
RETURNS TIMESTAMP WITHOUT TIME ZONE
LANGUAGE plpgsql
STABLE
AS $$
BEGIN
  IF timestamp_value IS NULL THEN
    RETURN NULL;
  END IF;
  RETURN (timestamp_value AT TIME ZONE 'UTC') AT TIME ZONE 'America/Costa_Rica';
END;
$$;

-- 5. Crear función para obtener la fecha actual en formato YYYY-MM-DD (UTC-6)
CREATE OR REPLACE FUNCTION get_costa_rica_date()
RETURNS DATE
LANGUAGE plpgsql
STABLE
AS $$
BEGIN
  RETURN DATE((NOW() AT TIME ZONE 'UTC') AT TIME ZONE 'America/Costa_Rica');
END;
$$;

-- 6. Crear función para obtener timestamp actual en UTC-6 como TIMESTAMP WITHOUT TIME ZONE
CREATE OR REPLACE FUNCTION get_costa_rica_timestamp()
RETURNS TIMESTAMP WITHOUT TIME ZONE
LANGUAGE plpgsql
STABLE
AS $$
BEGIN
  RETURN (NOW() AT TIME ZONE 'UTC') AT TIME ZONE 'America/Costa_Rica';
END;
$$;

-- 7. Crear triggers para asegurar que las fechas se guarden en UTC-6 (Costa Rica)
-- Trigger para tabla Asistencias
CREATE OR REPLACE FUNCTION set_asistencias_timezone()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- Si HoraEntrada se proporciona, asegurar que esté en UTC-6 (Costa Rica)
  IF NEW."HoraEntrada" IS NOT NULL THEN
    NEW."HoraEntrada" := (NEW."HoraEntrada" AT TIME ZONE 'UTC') AT TIME ZONE 'America/Costa_Rica';
  END IF;
  
  -- Si HoraSalida se proporciona, asegurar que esté en UTC-6 (Costa Rica)
  IF NEW."HoraSalida" IS NOT NULL THEN
    NEW."HoraSalida" := (NEW."HoraSalida" AT TIME ZONE 'UTC') AT TIME ZONE 'America/Costa_Rica';
  END IF;
  
  -- Si Fecha no se proporciona, usar la fecha actual en UTC-6
  IF NEW."Fecha" IS NULL THEN
    NEW."Fecha" := get_costa_rica_date();
  END IF;
  
  RETURN NEW;
END;
$$;

-- Aplicar trigger a tabla Asistencias
DROP TRIGGER IF EXISTS trigger_set_asistencias_timezone ON "Asistencias";
CREATE TRIGGER trigger_set_asistencias_timezone
  BEFORE INSERT OR UPDATE ON "Asistencias"
  FOR EACH ROW
  EXECUTE FUNCTION set_asistencias_timezone();

-- 8. Trigger para tabla Pausas
CREATE OR REPLACE FUNCTION set_pausas_timezone()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- Si HoraInicio se proporciona, asegurar que esté en UTC-6 (Costa Rica)
  IF NEW."HoraInicio" IS NOT NULL THEN
    NEW."HoraInicio" := (NEW."HoraInicio" AT TIME ZONE 'UTC') AT TIME ZONE 'America/Costa_Rica';
  END IF;
  
  -- Si HoraFin se proporciona, asegurar que esté en UTC-6 (Costa Rica)
  IF NEW."HoraFin" IS NOT NULL THEN
    NEW."HoraFin" := (NEW."HoraFin" AT TIME ZONE 'UTC') AT TIME ZONE 'America/Costa_Rica';
  END IF;
  
  RETURN NEW;
END;
$$;

-- Aplicar trigger a tabla Pausas
DROP TRIGGER IF EXISTS trigger_set_pausas_timezone ON "Pausas";
CREATE TRIGGER trigger_set_pausas_timezone
  BEFORE INSERT OR UPDATE ON "Pausas"
  FOR EACH ROW
  EXECUTE FUNCTION set_pausas_timezone();

-- 9. Trigger para tabla Anuncios
CREATE OR REPLACE FUNCTION set_anuncios_timezone()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- Si FechaCreacion no se proporciona, usar la fecha/hora actual en UTC-6
  IF NEW."FechaCreacion" IS NULL THEN
    NEW."FechaCreacion" := get_costa_rica_timestamp();
  ELSE
    NEW."FechaCreacion" := (NEW."FechaCreacion" AT TIME ZONE 'UTC') AT TIME ZONE 'America/Costa_Rica';
  END IF;
  
  -- Si FechaActualizacion se actualiza, usar la fecha/hora actual en UTC-6
  IF TG_OP = 'UPDATE' THEN
    NEW."FechaActualizacion" := get_costa_rica_timestamp();
  END IF;
  
  RETURN NEW;
END;
$$;

-- Aplicar trigger a tabla Anuncios
DROP TRIGGER IF EXISTS trigger_set_anuncios_timezone ON "Anuncios";
CREATE TRIGGER trigger_set_anuncios_timezone
  BEFORE INSERT OR UPDATE ON "Anuncios"
  FOR EACH ROW
  EXECUTE FUNCTION set_anuncios_timezone();

-- 10. Trigger para tabla Permisos
CREATE OR REPLACE FUNCTION set_permisos_timezone()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- Convertir FechaInicio y FechaFin a UTC-6 (Costa Rica) si se proporcionan
  IF NEW."FechaInicio" IS NOT NULL THEN
    NEW."FechaInicio" := DATE((NEW."FechaInicio"::timestamp AT TIME ZONE 'UTC') AT TIME ZONE 'America/Costa_Rica');
  END IF;
  
  IF NEW."FechaFin" IS NOT NULL THEN
    NEW."FechaFin" := DATE((NEW."FechaFin"::timestamp AT TIME ZONE 'UTC') AT TIME ZONE 'America/Costa_Rica');
  END IF;
  
  RETURN NEW;
END;
$$;

-- Aplicar trigger a tabla Permisos
DROP TRIGGER IF EXISTS trigger_set_permisos_timezone ON "Permisos";
CREATE TRIGGER trigger_set_permisos_timezone
  BEFORE INSERT OR UPDATE ON "Permisos"
  FOR EACH ROW
  EXECUTE FUNCTION set_permisos_timezone();

-- 11. Trigger para tabla Justificaciones
CREATE OR REPLACE FUNCTION set_justificaciones_timezone()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- Convertir fechas a UTC-6 (Costa Rica) si se proporcionan
  IF NEW."Fecha" IS NOT NULL THEN
    NEW."Fecha" := DATE((NEW."Fecha"::timestamp AT TIME ZONE 'UTC') AT TIME ZONE 'America/Costa_Rica');
  END IF;
  
  IF NEW."FechaInicio" IS NOT NULL THEN
    NEW."FechaInicio" := DATE((NEW."FechaInicio"::timestamp AT TIME ZONE 'UTC') AT TIME ZONE 'America/Costa_Rica');
  END IF;
  
  IF NEW."FechaFin" IS NOT NULL THEN
    NEW."FechaFin" := DATE((NEW."FechaFin"::timestamp AT TIME ZONE 'UTC') AT TIME ZONE 'America/Costa_Rica');
  END IF;
  
  -- Si FechaRegistro no se proporciona, usar la fecha/hora actual en UTC-6
  IF NEW."FechaRegistro" IS NULL THEN
    NEW."FechaRegistro" := get_costa_rica_timestamp();
  ELSE
    NEW."FechaRegistro" := (NEW."FechaRegistro" AT TIME ZONE 'UTC') AT TIME ZONE 'America/Costa_Rica';
  END IF;
  
  RETURN NEW;
END;
$$;

-- Aplicar trigger a tabla Justificaciones
DROP TRIGGER IF EXISTS trigger_set_justificaciones_timezone ON "Justificaciones";
CREATE TRIGGER trigger_set_justificaciones_timezone
  BEFORE INSERT OR UPDATE ON "Justificaciones"
  FOR EACH ROW
  EXECUTE FUNCTION set_justificaciones_timezone();

-- 12. Verificar la configuración
DO $$
DECLARE
  current_tz TEXT;
BEGIN
  current_tz := current_setting('timezone');
  RAISE NOTICE 'Zona horaria configurada: %', current_tz;
  
  IF current_tz != 'America/Costa_Rica' AND current_tz != 'Etc/GMT+6' THEN
    RAISE WARNING 'La zona horaria no está configurada como America/Costa_Rica (UTC-6). Valor actual: %', current_tz;
  ELSE
    RAISE NOTICE '✓ Zona horaria configurada correctamente a UTC-6 (Costa Rica)';
  END IF;
END $$;

-- 13. Mostrar resumen de funciones y triggers creados
SELECT 
  'Funciones creadas' as tipo,
  COUNT(*) as cantidad
FROM pg_proc
WHERE proname IN ('get_costa_rica_time', 'to_costa_rica_time', 'get_costa_rica_date', 'get_costa_rica_timestamp');

SELECT 
  'Triggers creados' as tipo,
  COUNT(*) as cantidad
FROM pg_trigger
WHERE tgname LIKE 'trigger_set_%_timezone';

