import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL =
  import.meta.env.VITE_SUPABASE_URL?.trim() ||
  'https://fenrtrgxqvgwwgmauwhx.supabase.co'

const SUPABASE_SERVICE_ROLE =
  import.meta.env.VITE_SUPABASE_SERVICE_ROLE?.trim() ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZlbnJ0cmd4cXZnd3dnbWF1d2h4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MzUwMDIyNCwiZXhwIjoyMDc5MDc2MjI0fQ.AQ4uy8vaa0VqqL9TsLonGmPQiyot8LxfX7-hpsxMcWw'

// Cliente con permisos de administrador para crear usuarios
export const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
  db: {
    schema: 'public',
  },
  global: {
    headers: {
      'X-Client-Info': 'supabase-js-web',
    },
  },
})

// Nota: La zona horaria GMT-6 debe configurarse ejecutando el script SQL:
// migrations/configurar_timezone_gmt6.sql
//
// El código JavaScript ya maneja la conversión a GMT-6 con las funciones helper.
// Los triggers en la base de datos aseguran que todas las inserciones/actualizaciones
// usen GMT-6 automáticamente.



