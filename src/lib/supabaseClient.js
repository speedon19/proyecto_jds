import { createClient } from '@supabase/supabase-js'

const DEFAULT_SUPABASE_URL = 'https://fenrtrgxqvgwwgmauwhx.supabase.co'
const DEFAULT_SUPABASE_SERVICE_ROLE =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZlbnJ0cmd4cXZnd3dnbWF1d2h4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MzUwMDIyNCwiZXhwIjoyMDc5MDc2MjI0fQ.AQ4uy8vaa0VqqL9TsLonGmPQiyot8LxfX7-hpsxMcWw'

const SUPABASE_URL =
  import.meta.env.VITE_SUPABASE_URL?.trim() || DEFAULT_SUPABASE_URL
const SUPABASE_ANON_KEY =
  import.meta.env.VITE_SUPABASE_ANON_KEY?.trim() ||
  import.meta.env.VITE_SUPABASE_SERVICE_ROLE?.trim() ||
  DEFAULT_SUPABASE_SERVICE_ROLE

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.warn(
    'Faltan las credenciales de Supabase. Revisa tus variables de entorno.'
  )
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
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
// El código JavaScript ya maneja la conversión a GMT-6 con las funciones:
// - getCostaRicaTime()
// - getCostaRicaDateString()
// - formatHoraCR()
// - formatFechaCR()
//
// Los triggers en la base de datos aseguran que todas las inserciones/actualizaciones
// usen GMT-6 automáticamente.
