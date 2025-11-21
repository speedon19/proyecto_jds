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

const TEST_EMAIL = 'juan.perez@empresa.com'
const TEST_PASSWORD = 'Test123!'
const TEST_FULL_NAME = 'Juan Pérez García'
const TEST_POSITION = 'Desarrollador'

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
      return null
    }

    page += 1
  }
}

async function createTestUser() {
  try {
    const existingUser = await findUserByEmail(TEST_EMAIL)

    if (existingUser) {
      const { error: updateError } =
        await adminClient.auth.admin.updateUserById(existingUser.id, {
          password: TEST_PASSWORD,
          email_confirm: true,
          user_metadata: {
            fullName: TEST_FULL_NAME,
            nombre: TEST_FULL_NAME,
            name: TEST_FULL_NAME,
            position: TEST_POSITION,
            role: 'Colaborador',
          },
        })

      if (updateError) {
        throw updateError
      }

      console.log('\n✅ Usuario de prueba actualizado correctamente')
      console.log(`   Email: ${TEST_EMAIL}`)
      console.log(`   Contraseña: ${TEST_PASSWORD}`)
      console.log(`   ID: ${existingUser.id}\n`)
      return
    }

    const { data, error } = await adminClient.auth.admin.createUser({
      email: TEST_EMAIL,
      password: TEST_PASSWORD,
      email_confirm: true,
      user_metadata: {
        fullName: TEST_FULL_NAME,
        nombre: TEST_FULL_NAME,
        name: TEST_FULL_NAME,
        position: TEST_POSITION,
        role: 'Colaborador',
      },
    })

    if (error) {
      throw error
    }

    console.log('\n✅ Usuario de prueba creado correctamente')
    console.log(`   Email: ${TEST_EMAIL}`)
    console.log(`   Contraseña: ${TEST_PASSWORD}`)
    console.log(`   ID: ${data.user.id}\n`)
  } catch (error) {
    console.error('❌ No se pudo crear/actualizar el usuario de prueba:')
    console.error(error.message ?? error)
    process.exit(1)
  }
}

createTestUser()

