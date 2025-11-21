-- Script para crear la tabla de Proyectos (Departamentos)
-- Ejecutar este script en el SQL Editor de Supabase
-- Nota: En esta empresa, "Proyectos" es equivalente a "Departamentos"

-- Tabla para proyectos (departamentos)
CREATE TABLE IF NOT EXISTS "Proyectos" (
  "Id" SERIAL PRIMARY KEY,
  "Nombre" VARCHAR(200) NOT NULL UNIQUE,
  "Activo" BOOLEAN DEFAULT TRUE,
  "FechaCreacion" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "FechaModificacion" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear índices para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_proyectos_activo ON "Proyectos"("Activo");
CREATE INDEX IF NOT EXISTS idx_proyectos_nombre ON "Proyectos"("Nombre");

-- Trigger para actualizar FechaModificacion automáticamente
CREATE OR REPLACE FUNCTION update_proyectos_modificacion()
RETURNS TRIGGER AS $$
BEGIN
  NEW."FechaModificacion" = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_proyectos_modificacion
  BEFORE UPDATE ON "Proyectos"
  FOR EACH ROW
  EXECUTE FUNCTION update_proyectos_modificacion();

-- Habilitar Row Level Security (RLS) si es necesario
-- ALTER TABLE "Proyectos" ENABLE ROW LEVEL SECURITY;

-- Políticas RLS (opcional, ajustar según necesidades de seguridad)
-- Permitir lectura a todos los usuarios autenticados
-- CREATE POLICY "Permitir lectura de proyectos" ON "Proyectos"
--   FOR SELECT USING (auth.role() = 'authenticated');

-- Permitir inserción/actualización/eliminación solo a administradores
-- CREATE POLICY "Permitir gestión de proyectos" ON "Proyectos"
--   FOR ALL USING (
--     EXISTS (
--       SELECT 1 FROM "UsuariosRoles" ur
--       JOIN "Roles" r ON ur."RoleId" = r."Id"
--       WHERE ur."UserId" = auth.uid() 
--       AND r."NormalizedName" = 'ADMINISTRADOR'
--     )
--   );


