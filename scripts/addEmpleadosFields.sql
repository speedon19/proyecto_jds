-- Script para agregar campos faltantes a la tabla Empleados
-- Ejecutar este script en el SQL Editor de Supabase

-- Agregar campo PermisoTrabajo (para empleados extranjeros)
ALTER TABLE "Empleados" 
ADD COLUMN IF NOT EXISTS "PermisoTrabajo" VARCHAR(100);

-- Agregar campo ContratoUrl (URL del contrato almacenado en Storage)
ALTER TABLE "Empleados" 
ADD COLUMN IF NOT EXISTS "ContratoUrl" TEXT;

-- Crear índice para búsquedas por permiso de trabajo si es necesario
-- CREATE INDEX IF NOT EXISTS idx_empleados_permiso_trabajo ON "Empleados"("PermisoTrabajo");


