import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://fenrtrgxqvgwwgmauwhx.supabase.co'
const SUPABASE_SERVICE_ROLE = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZlbnJ0cmd4cXZnd3dnbWF1d2h4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MzUwMDIyNCwiZXhwIjoyMDc5MDc2MjI0fQ.AQ4uy8vaa0VqqL9TsLonGmPQiyot8LxfX7-hpsxMcWw'

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE)

async function consultarHorarioEmpleado(empleadoId) {
  try {
    const { data, error } = await supabase
      .from('Empleados')
      .select('Id, NombreCompleto, HorarioLaboral')
      .eq('Id', empleadoId)
      .single()

    if (error) {
      console.error('Error al consultar:', error)
      return
    }

    if (!data) {
      console.log(`No se encontró un empleado con ID ${empleadoId}`)
      return
    }

    console.log('\n=== INFORMACIÓN DEL EMPLEADO ===')
    console.log(`ID: ${data.Id}`)
    console.log(`Nombre: ${data.NombreCompleto}`)
    console.log('\n=== HORARIO LABORAL ===')
    
    if (!data.HorarioLaboral) {
      console.log('El empleado no tiene horario laboral configurado.')
      return
    }

    // Parsear el horario si es string
    let horario = data.HorarioLaboral
    if (typeof horario === 'string') {
      try {
        horario = JSON.parse(horario)
      } catch (e) {
        console.log('Error al parsear el horario:', e.message)
        console.log('Horario en formato string:', horario)
        return
      }
    }

    // Mostrar el horario de forma legible
    const dias = ['lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado', 'domingo']
    
    dias.forEach(dia => {
      if (horario[dia]) {
        const horasLaborales = Object.entries(horario[dia])
          .filter(([hora, estado]) => estado === 'full' || estado === 'half')
          .map(([hora, estado]) => {
            const estadoTexto = estado === 'full' ? 'completa' : 'media'
            return `${hora} (${estadoTexto})`
          })
          .sort()

        if (horasLaborales.length > 0) {
          const primeraHora = horasLaborales[0].split(' ')[0]
          const ultimaHora = horasLaborales[horasLaborales.length - 1].split(' ')[0]
          const [horaInicio] = primeraHora.split(':')
          const [horaFin] = ultimaHora.split(':')
          const horaFinNum = parseInt(horaFin) + 1
          
          console.log(`\n${dia.charAt(0).toUpperCase() + dia.slice(1)}: ${primeraHora} - ${String(horaFinNum).padStart(2, '0')}:00`)
          console.log(`  Horas laborales: ${horasLaborales.length}`)
        } else {
          console.log(`\n${dia.charAt(0).toUpperCase() + dia.slice(1)}: Sin horario`)
        }
      } else {
        console.log(`\n${dia.charAt(0).toUpperCase() + dia.slice(1)}: Sin horario`)
      }
    })

    // Mostrar también el JSON completo
    console.log('\n=== HORARIO COMPLETO (JSON) ===')
    console.log(JSON.stringify(horario, null, 2))

  } catch (err) {
    console.error('Error:', err)
  }
}

// Consultar empleado con ID 11
consultarHorarioEmpleado(11)


