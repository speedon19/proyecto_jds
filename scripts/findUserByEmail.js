/* eslint-env node */
import 'dotenv/config'
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL =
  process.env.SUPABASE_URL ||
  process.env.VITE_SUPABASE_URL ||
  'https://fenrtrgxqvgwwgmauwhx.supabase.co'
const SUPABASE_SERVICE_ROLE =
  process.env.SUPABASE_SERVICE_ROLE ||
  process.env.VITE_SUPABASE_SERVICE_ROLE ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZlbnJ0cmd4cXZnd3dnbWF1d2h4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MzUwMDIyNCwiZXhwIjoyMDc5MDc2MjI0fQ.AQ4uy8vaa0VqqL9TsLonGmPQiyot8LxfX7-hpsxMcWw'

const TARGET_EMAIL = (process.argv[2] || process.env.TARGET_EMAIL || '').trim()

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE) {
  console.error('Faltan las credenciales de Supabase. Revisa tu entorno.')
  process.exit(1)
}

if (!TARGET_EMAIL) {
  console.error(
    'Debes proporcionar el correo a consultar. Usa: node scripts/findUserByEmail.js <email>'
  )
  process.exit(1)
}

const adminClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
})

async function main() {
  try {
    let page = 1
    const normalizedEmail = TARGET_EMAIL.toLowerCase()

    while (true) {
      const { data, error } = await adminClient.auth.admin.listUsers({
        page,
        perPage: 200,
      })

      if (error) {
        throw error
      }

      const match =
        data?.users?.find(
          (user) => user.email?.toLowerCase() === normalizedEmail
        ) ?? null

      if (match) {
        console.log('Usuario encontrado:')
        console.log(JSON.stringify(match, null, 2))
        return
      }

      if (!data || data.users.length < 200) {
        console.log(`No se encontró un usuario con el correo ${TARGET_EMAIL}.`)
        return
      }

      page += 1
    }
  } catch (error) {
    console.error('Error al consultar el usuario:')
    console.error(error.message ?? error)
    process.exit(1)
  }
}

main()


