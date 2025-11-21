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

const EMPLEADOS_A_MANTENER = [3, 8] // IDs de empleados que NO se eliminarán

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

async function deleteEmployeesExcept() {
  try {
    console.log('🔍 Obteniendo lista de empleados...')
    
    // Obtener todos los empleados
    const { data: empleados, error: fetchError } = await adminClient
      .from('Empleados')
      .select('Id, NombreCompleto')
    
    if (fetchError) {
      throw fetchError
    }
    
    if (!empleados || empleados.length === 0) {
      console.log('✅ No hay empleados en la base de datos.')
      return
    }
    
    console.log(`📊 Total de empleados encontrados: ${empleados.length}`)
    console.log(`🔒 Empleados a mantener (IDs): ${EMPLEADOS_A_MANTENER.join(', ')}`)
    
    // Filtrar empleados a eliminar (todos excepto los IDs especificados)
    const empleadosAEliminar = empleados.filter(
      (emp) => !EMPLEADOS_A_MANTENER.includes(emp.Id)
    )
    
    if (empleadosAEliminar.length === 0) {
      console.log('✅ No hay empleados para eliminar. Todos los empleados están en la lista de mantenimiento.')
      return
    }
    
    console.log(`\n🗑️  Empleados a eliminar (${empleadosAEliminar.length}):`)
    empleadosAEliminar.forEach((emp) => {
      console.log(`   - ID: ${emp.Id}, Nombre: ${emp.NombreCompleto || 'N/A'}`)
    })
    
    // Confirmar antes de eliminar
    console.log('\n⚠️  ADVERTENCIA: Esta acción eliminará permanentemente los empleados listados arriba.')
    console.log('   Los empleados con IDs 3 y 8 se mantendrán.')
    
    // Eliminar cada empleado
    let eliminados = 0
    let errores = 0
    
    for (const empleado of empleadosAEliminar) {
      try {
        const { error: deleteError } = await adminClient
          .from('Empleados')
          .delete()
          .eq('Id', empleado.Id)
        
        if (deleteError) {
          console.error(`❌ Error al eliminar empleado ID ${empleado.Id} (${empleado.NombreCompleto}):`, deleteError.message)
          errores++
        } else {
          console.log(`✅ Empleado eliminado: ID ${empleado.Id} - ${empleado.NombreCompleto || 'N/A'}`)
          eliminados++
        }
      } catch (err) {
        console.error(`❌ Error al eliminar empleado ID ${empleado.Id}:`, err.message)
        errores++
      }
    }
    
    console.log('\n📊 Resumen:')
    console.log(`   ✅ Empleados eliminados: ${eliminados}`)
    console.log(`   ❌ Errores: ${errores}`)
    console.log(`   🔒 Empleados mantenidos: ${EMPLEADOS_A_MANTENER.length}`)
    
    // Verificar empleados restantes
    const { data: empleadosRestantes } = await adminClient
      .from('Empleados')
      .select('Id, NombreCompleto')
    
    console.log(`\n📋 Empleados restantes en la base de datos: ${empleadosRestantes?.length || 0}`)
    if (empleadosRestantes && empleadosRestantes.length > 0) {
      empleadosRestantes.forEach((emp) => {
        console.log(`   - ID: ${emp.Id}, Nombre: ${emp.NombreCompleto || 'N/A'}`)
      })
    }
    
  } catch (error) {
    console.error('❌ Error al eliminar empleados:')
    console.error(error.message ?? error)
    process.exit(1)
  }
}

deleteEmployeesExcept()


