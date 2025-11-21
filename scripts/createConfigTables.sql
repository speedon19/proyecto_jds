-- Script para crear las tablas de configuración del sistema
-- Ejecutar este script en el SQL Editor de Supabase

-- Tabla para tipos de permisos
CREATE TABLE IF NOT EXISTS "TiposPermisos" (
  "Id" SERIAL PRIMARY KEY,
  "Nombre" VARCHAR(100) NOT NULL UNIQUE,
  "Activo" BOOLEAN DEFAULT TRUE,
  "FechaCreacion" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "FechaModificacion" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla para tipos de justificaciones
CREATE TABLE IF NOT EXISTS "TiposJustificaciones" (
  "Id" SERIAL PRIMARY KEY,
  "Nombre" VARCHAR(100) NOT NULL UNIQUE,
  "Activo" BOOLEAN DEFAULT TRUE,
  "FechaCreacion" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "FechaModificacion" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insertar valores por defecto para tipos de permisos
INSERT INTO "TiposPermisos" ("Nombre", "Activo")
VALUES 
  ('Permiso', TRUE),
  ('Vacaciones', TRUE),
  ('Cita Medica', TRUE)
ON CONFLICT ("Nombre") DO NOTHING;

-- Insertar valores por defecto para tipos de justificaciones
INSERT INTO "TiposJustificaciones" ("Nombre", "Activo")
VALUES 
  ('Ausencia', TRUE),
  ('Tardia', TRUE),
  ('Incapacidad', TRUE)
ON CONFLICT ("Nombre") DO NOTHING;

-- Crear índices para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_tipos_permisos_activo ON "TiposPermisos"("Activo");
CREATE INDEX IF NOT EXISTS idx_tipos_justificaciones_activo ON "TiposJustificaciones"("Activo");

-- Habilitar Row Level Security (RLS) si es necesario
-- ALTER TABLE "TiposPermisos" ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE "TiposJustificaciones" ENABLE ROW LEVEL SECURITY;

-- Políticas RLS (opcional, ajustar según necesidades de seguridad)
-- Permitir lectura a todos los usuarios autenticados
-- CREATE POLICY "Permitir lectura de tipos de permisos" ON "TiposPermisos"
--   FOR SELECT USING (auth.role() = 'authenticated');

-- CREATE POLICY "Permitir lectura de tipos de justificaciones" ON "TiposJustificaciones"
--   FOR SELECT USING (auth.role() = 'authenticated');

-- Permitir inserción/actualización/eliminación solo a administradores
-- (Ajustar según tu sistema de roles)
-- CREATE POLICY "Permitir gestión de tipos de permisos" ON "TiposPermisos"
--   FOR ALL USING (
--     EXISTS (
--       SELECT 1 FROM "UsuariosRoles" ur
--       JOIN "Roles" r ON ur."RoleId" = r."Id"
--       WHERE ur."UserId" = auth.uid() 
--       AND r."NormalizedName" = 'ADMINISTRADOR'
--     )
--   );

-- CREATE POLICY "Permitir gestión de tipos de justificaciones" ON "TiposJustificaciones"
--   FOR ALL USING (
--     EXISTS (
--       SELECT 1 FROM "UsuariosRoles" ur
--       JOIN "Roles" r ON ur."RoleId" = r."Id"
--       WHERE ur."UserId" = auth.uid() 
--       AND r."NormalizedName" = 'ADMINISTRADOR'
--     )
--   );


