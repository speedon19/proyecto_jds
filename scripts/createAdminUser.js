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

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'JDS@empresa.com'
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'JDS123!'
const ADMIN_FULL_NAME = process.env.ADMIN_FULL_NAME || 'Administrador General'
const ADMIN_POSITION = process.env.ADMIN_POSITION || 'Administrador'

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE) {
  console.error(
    'Faltan las variables SUPABASE_URL o SUPABASE_SERVICE_ROLE. Defínelas en tu entorno antes de ejecutar este script.'
  )
  process.exit(1)
}

const adminClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
})

async function findUserByEmail(email) {
  let page = 1
  const normalizedEmail = email.toLowerCase()

  // Recorremos todas las páginas disponibles hasta encontrar coincidencia
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
      return match
    }

    if (!data || data.users.length < 200) {
      // No hay más páginas
      return null
    }

    page += 1
  }
}

const composeMetadata = (current = {}) => ({
  ...current,
  role: 'admin',
  fullName: ADMIN_FULL_NAME,
  position: ADMIN_POSITION,
})

async function ensureAdminUser() {
  try {
    const existingUser = await findUserByEmail(ADMIN_EMAIL)

    if (existingUser) {
      const userMetadata = composeMetadata(existingUser.user_metadata)
      const { error: updateError } =
        await adminClient.auth.admin.updateUserById(existingUser.id, {
          password: ADMIN_PASSWORD,
          email_confirm: true,
          user_metadata: userMetadata,
        })

      if (updateError) {
        throw updateError
      }

      console.log(
        `Usuario administrador actualizado correctamente (${existingUser.id}).`
      )
      return
    }

    const { data, error } = await adminClient.auth.admin.createUser({
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD,
      email_confirm: true,
      user_metadata: composeMetadata(),
    })

    if (error) {
      throw error
    }

    console.log(
      `Usuario administrador creado correctamente (${data.user.id}).`
    )
  } catch (error) {
    console.error('No se pudo crear/actualizar el usuario administrador:')
    console.error(error.message ?? error)
    process.exit(1)
  }
}

ensureAdminUser()

