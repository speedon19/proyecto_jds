import { useState, useEffect, useRef } from 'react'
import { supabase } from './lib/supabaseClient'
import { supabaseAdmin } from './lib/supabaseAdmin'
import ScheduleModal from './components/ScheduleModal'
import logo from './assets/logo.jpg'
import './App.css'
import * as XLSX from 'xlsx'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

// Componentes de Iconos SVG
const IconUsers = ({ size = 18, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
    <circle cx="9" cy="7" r="4"></circle>
    <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
    <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
  </svg>
)

const IconUser = ({ size = 18, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
    <circle cx="12" cy="7" r="4"></circle>
  </svg>
)

const IconEye = ({ size = 18, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
    <circle cx="12" cy="12" r="3"></circle>
  </svg>
)

const IconEdit = ({ size = 18, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
  </svg>
)

const IconTrash = ({ size = 18, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <polyline points="3 6 5 6 21 6"></polyline>
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
  </svg>
)

const IconCalendar = ({ size = 18, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
    <line x1="16" y1="2" x2="16" y2="6"></line>
    <line x1="8" y1="2" x2="8" y2="6"></line>
    <line x1="3" y1="10" x2="21" y2="10"></line>
  </svg>
)

const IconSearch = ({ size = 18, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <circle cx="11" cy="11" r="8"></circle>
    <path d="m21 21-4.35-4.35"></path>
  </svg>
)

const IconPlus = ({ size = 18, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <line x1="12" y1="5" x2="12" y2="19"></line>
    <line x1="5" y1="12" x2="19" y2="12"></line>
  </svg>
)

const IconCheck = ({ size = 18, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <polyline points="20 6 9 17 4 12"></polyline>
  </svg>
)

const IconFolder = ({ size = 18, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>
  </svg>
)

// Función helper compartida para obtener hora actual en zona horaria de Costa Rica
const getCostaRicaTime = () => {
  const now = new Date()
  const crTime = new Date(now.toLocaleString('en-US', { timeZone: 'Etc/GMT+6' }))
  return crTime
}

// Función helper para obtener la fecha actual en zona horaria de Costa Rica en formato YYYY-MM-DD
const getCostaRicaDateString = () => {
  const now = new Date()
  // Obtener la fecha en zona horaria de Costa Rica usando formato que devuelve MM/DD/YYYY
  const fechaParts = now.toLocaleDateString('en-US', {
    timeZone: 'Etc/GMT+6',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).split('/')
  
  // Reorganizar de MM/DD/YYYY a YYYY-MM-DD
  // fechaParts[0] = mes, fechaParts[1] = día, fechaParts[2] = año
  return `${fechaParts[2]}-${fechaParts[0].padStart(2, '0')}-${fechaParts[1].padStart(2, '0')}`
}

// Función helper para convertir cualquier fecha a zona horaria de Costa Rica
const toCostaRicaDate = (fecha) => {
  if (!fecha) return null
  try {
    const date = new Date(fecha)
    if (isNaN(date.getTime())) return null
    // Convertir a zona horaria de Costa Rica
    return new Date(date.toLocaleString('en-US', { timeZone: 'Etc/GMT+6' }))
  } catch (err) {
    return null
  }
}

// Función helper para formatear fecha en zona horaria de Costa Rica
const formatFechaCR = (fecha) => {
  if (!fecha) return ''
  try {
    const date = new Date(fecha)
    if (isNaN(date.getTime())) return ''
    return date.toLocaleDateString('es-ES', { 
      timeZone: 'Etc/GMT+6',
      day: '2-digit', 
      month: '2-digit', 
      year: 'numeric' 
    })
  } catch (err) {
    return ''
  }
}

// Función helper para formatear hora en zona horaria de Costa Rica (GMT-6)
const formatHoraCR = (fecha) => {
  if (!fecha) return ''
  try {
    const dateObj = new Date(fecha)
    
    if (isNaN(dateObj.getTime())) return ''
    
    // Usar toLocaleString con timeZone para obtener la hora en GMT-6
    // Esto es consistente con el resto del código
    const horaStr = dateObj.toLocaleString('en-US', {
      timeZone: 'Etc/GMT+6',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    })
    
    return horaStr
  } catch (err) {
    console.error('Error al formatear hora:', err)
    return ''
  }
}

// Función helper para formatear rango de fechas
const formatRangoFechas = (fechaInicio, fechaFin) => {
  const inicio = formatFechaCR(fechaInicio)
  const fin = formatFechaCR(fechaFin)
  if (!inicio && !fin) return '-'
  return `${inicio || '-'} - ${fin || '-'}`
}

// Funciones helper para cargar tipos de permisos y justificaciones desde la BD
const cargarTiposPermisos = async () => {
  try {
    const { data, error } = await supabase
      .from('TiposPermisos')
      .select('*')
      .eq('Activo', true)
      .order('Nombre')
    
    if (data && !error) {
      return data.map(t => t.Nombre)
    }
  } catch (err) {
    console.warn('Error al cargar tipos de permisos:', err)
  }
  
  // Valores por defecto si no existe la tabla o hay error
  return ['Permiso', 'Vacaciones', 'Cita Medica']
}

const cargarTiposJustificaciones = async () => {
  try {
    const { data, error } = await supabase
      .from('TiposJustificaciones')
      .select('*')
      .eq('Activo', true)
      .order('Nombre')
    
    if (data && !error) {
      return data.map(t => t.Nombre)
    }
  } catch (err) {
    console.warn('Error al cargar tipos de justificaciones:', err)
  }
  
  // Valores por defecto si no existe la tabla o hay error
  return ['Ausencia', 'Tardia', 'Incapacidad']
}

// Función helper compartida para obtener hora de entrada esperada según horario laboral
// Retorna un objeto con { hora, minuto } en formato numérico para facilitar el cálculo
// Función para calcular tardía con reglas especiales
// Reglas:
// - Primeros 60 minutos: minutos normales
// - Después de 60 minutos: cada minuto adicional cuenta como 1 hora + 1 minuto
// Ejemplo: 75 min = 1 hora + 15 min, 130 min = 2 horas + 10 min
// Nota: Los minutos adicionales después de 60 se convierten en horas (1 minuto = 1 hora)
const calcularTardiaConReglas = (minutosTardia) => {
  if (minutosTardia <= 0) {
    return {
      minutosNormales: 0,
      horasAdicionales: 0,
      minutosAdicionales: 0,
      totalMinutos: 0,
      descripcion: 'Sin tardía'
    }
  }

  if (minutosTardia <= 60) {
    // Primeros 60 minutos son normales
    return {
      minutosNormales: minutosTardia,
      horasAdicionales: 0,
      minutosAdicionales: 0,
      totalMinutos: minutosTardia,
      descripcion: `${minutosTardia} minutos`
    }
  }

  // Después de 60 minutos: cada minuto adicional cuenta como 1 hora + 1 minuto
  // Según los ejemplos:
  // - 75 min = 60 min normales + 15 min adicionales → 1 hora + 15 min
  // - 130 min = 60 min normales + 70 min adicionales → 2 horas + 10 min
  // 
  // Interpretación correcta:
  // Los minutos adicionales se convierten en horas completas (cada minuto = 1 hora)
  // Luego se agrupan en formato estándar (horas + minutos restantes)
  // 
  // 15 min adicionales = 15 horas = 1 hora + 15 min (15 % 60 = 15, pero mostramos como 1 hora + 15 min)
  // 70 min adicionales = 70 horas = 1 hora + 10 min (70 % 60 = 10, pero mostramos como 1 hora + 10 min)
  // 
  // Reinterpretación basada en ejemplos:
  // Parece que los minutos adicionales se agrupan en horas completas más los minutos restantes
  // 15 min adicionales → 1 hora completa + 15 min restantes = 1 hora y 15 min
  // 70 min adicionales → 1 hora completa + 10 min restantes = 1 hora y 10 min
  // Pero el ejemplo dice 2 horas + 10 min para 130...
  //
  // Interpretación final basada en ejemplos:
  // Los minutos adicionales se convierten directamente:
  // - 15 min adicionales = 1 hora (porque 15/60 redondeado hacia arriba = 1) + 15 min = 1 hora y 15 min
  // - 70 min adicionales = 2 horas (porque 70/60 = 1.16 redondeado hacia arriba = 2) + 10 min (70 % 60 = 10) = 2 horas y 10 min
  const minutosAdicionales = minutosTardia - 60
  
  // Calcular horas completas: redondear hacia arriba los minutos adicionales divididos entre 60
  // 15 min adicionales / 60 = 0.25 → ceil = 1 hora
  // 70 min adicionales / 60 = 1.16 → ceil = 2 horas
  const horasAdicionales = Math.ceil(minutosAdicionales / 60)
  
  // Los minutos restantes son el módulo de 60
  // 15 % 60 = 15 minutos
  // 70 % 60 = 10 minutos
  const minutosRestantes = minutosAdicionales % 60

  return {
    minutosNormales: 60,
    horasAdicionales: horasAdicionales,
    minutosAdicionales: minutosRestantes,
    totalMinutos: minutosTardia,
    descripcion: minutosRestantes > 0 
      ? `${horasAdicionales} hora(s) y ${minutosRestantes} minuto(s)`
      : `${horasAdicionales} hora(s)`
  }
}

// Función para crear notificación automática de tardía
const crearNotificacionTardia = async (empleadoId, fecha) => {
  try {
    // Obtener información del empleado para asignar al proyecto correcto
    const { data: empleado, error: empleadoError } = await supabase
      .from('Empleados')
      .select('ProyectoAsignado, NombreCompleto')
      .eq('Id', empleadoId)
      .single()

    if (empleadoError || !empleado) {
      console.error('Error al obtener empleado para notificación:', empleadoError)
      return
    }

    // Verificar si ya existe una notificación de tardía para este empleado en esta fecha
    // Usar la fecha en formato ISO para comparar correctamente
    const fechaInicio = `${fecha}T00:00:00.000Z`
    const fechaFin = `${fecha}T23:59:59.999Z`
    
    const { data: notificacionesExistentes } = await supabase
      .from('Anuncios')
      .select('Id')
      .eq('Autor', 'Sistema')
      .eq('Titulo', 'Registro de Tardía')
      .eq('ProyectoAsignado', empleado.ProyectoAsignado)
      .gte('FechaCreacion', fechaInicio)
      .lte('FechaCreacion', fechaFin)

    // Si ya existe una notificación para hoy, no crear otra
    if (notificacionesExistentes && notificacionesExistentes.length > 0) {
      console.log('Ya existe notificación de tardía para este empleado hoy')
      return
    }

    // Crear el anuncio destacado
    const { data: anuncio, error: anuncioError } = await supabase
      .from('Anuncios')
      .insert({
        Titulo: 'Registro de Tardía',
        Cuerpo: 'Se ha registrado una tardía. Favor dirigirse a la sección de Justificaciones para presentar la justificación correspondiente.',
        ProyectoAsignado: empleado.ProyectoAsignado,
        EsGlobal: false,
        Destacado: true,
        Autor: 'Sistema',
      })
      .select()
      .single()

    if (anuncioError) {
      console.error('Error al crear notificación de tardía:', anuncioError)
    } else {
      console.log('✅ Notificación de tardía creada exitosamente:', anuncio)
    }
  } catch (err) {
    console.error('Error al crear notificación de tardía:', err)
  }
}

// Función para verificar si un día es laboral según el horario del empleado
const esDiaLaboral = (horarioLaboral, fecha) => {
  if (!horarioLaboral) return false
  
  try {
    const horario = typeof horarioLaboral === 'string' 
      ? JSON.parse(horarioLaboral) 
      : horarioLaboral
    
    if (!horario || typeof horario !== 'object') return false
    
    // Obtener fecha en zona horaria de Costa Rica
    const fechaObj = new Date(fecha)
    const fechaCR = new Date(fechaObj.toLocaleString('en-US', { timeZone: 'Etc/GMT+6' }))
    const diaSemana = fechaCR.getDay()
    
    // Mapear día de la semana (0=Domingo, 1=Lunes, etc.) a nombre en minúscula
    const diasSemanaMap = {
      0: 'domingo',
      1: 'lunes',
      2: 'martes',
      3: 'miércoles',
      4: 'jueves',
      5: 'viernes',
      6: 'sábado'
    }
    const diaNombre = diasSemanaMap[diaSemana]
    
    if (!diaNombre) return false
    
    // El horario tiene estructura: { "lunes": { "08:00": "full", "09:00": "full", ... }, ... }
    const horarioDia = horario[diaNombre]
    if (!horarioDia || typeof horarioDia !== 'object') return false
    
    // Verificar si hay al menos una hora laboral (full o half) en este día
    const tieneHorasLaborales = Object.values(horarioDia).some(estado => 
      estado === 'full' || estado === 'half'
    )
    
    return tieneHorasLaborales
  } catch (err) {
    console.error('Error al verificar si es día laboral:', err)
    return false
  }
}

const obtenerHoraEntradaEsperada = (horarioLaboral, fecha) => {
  if (!horarioLaboral) return null
  
  try {
    const horario = typeof horarioLaboral === 'string' 
      ? JSON.parse(horarioLaboral) 
      : horarioLaboral
    
    if (!horario || typeof horario !== 'object') return null
    
    // Obtener fecha en zona horaria de Costa Rica
    const fechaObj = new Date(fecha)
    const fechaCR = new Date(fechaObj.toLocaleString('en-US', { timeZone: 'Etc/GMT+6' }))
    const diaSemana = fechaCR.getDay()
    
    // Mapear día de la semana (0=Domingo, 1=Lunes, etc.) a nombre en minúscula
    // El horario se guarda con días en minúscula: "lunes", "martes", etc.
    const diasSemanaMap = {
      0: 'domingo',
      1: 'lunes',
      2: 'martes',
      3: 'miércoles',
      4: 'jueves',
      5: 'viernes',
      6: 'sábado'
    }
    const diaNombre = diasSemanaMap[diaSemana]
    
    if (!diaNombre) return null
    
    // El horario tiene estructura: { "lunes": { "08:00": "full", "09:00": "full", ... }, ... }
    const horarioDia = horario[diaNombre]
    if (!horarioDia || typeof horarioDia !== 'object') return null
    
    // Buscar la primera hora laboral (full o half) del día
    // Ordenar las horas para encontrar la primera
    const horas = Object.keys(horarioDia)
      .filter(hora => {
        const estado = horarioDia[hora]
        return estado === 'full' || estado === 'half'
      })
      .sort() // Ordenar por hora (formato "HH:MM" se ordena correctamente como string)
    
    if (horas.length === 0) return null
    
    // Tomar la primera hora laboral y retornar los componentes
    const primeraHoraStr = horas[0]
    const [hora, minuto] = primeraHoraStr.split(':').map(Number)
    
    // Retornar objeto con hora y minuto, y también la fecha para crear el Date
    return {
      hora,
      minuto,
      fechaCR // Para usar en el cálculo
    }
  } catch (err) {
    console.error('Error al obtener hora de entrada esperada:', err)
    return null
  }
}

function App() {
  const [formData, setFormData] = useState({ email: '', password: '' })
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [sessionInfo, setSessionInfo] = useState(null)

  const handleChange = (event) => {
    const { name, value } = event.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  // Función para registrar asistencia al iniciar sesión
  const registrarAsistenciaInicioSesion = async (userEmail) => {
    console.log('=== INICIANDO REGISTRO DE ASISTENCIA ===')
    console.log('Email del usuario:', userEmail)
    
    try {
      // Buscar usuario por email (case-insensitive)
      // Normalizar el email a mayúsculas para la búsqueda
      const emailNormalizado = userEmail.toUpperCase()
      const { data: usuario, error: errorUsuario } = await supabase
        .from('Usuarios')
        .select('EmpleadoId')
        .eq('NormalizedEmail', emailNormalizado)
        .maybeSingle()

      if (errorUsuario) {
        console.error('❌ Error al buscar usuario:', errorUsuario)
        return
      }

      console.log('Usuario encontrado:', usuario)

      if (!usuario?.EmpleadoId) {
        console.warn('⚠️ Usuario no tiene EmpleadoId asociado')
        return
      }

      console.log('EmpleadoId:', usuario.EmpleadoId)

      // Obtener fecha actual en zona horaria de Costa Rica
      const hoy = getCostaRicaDateString()
      console.log('Fecha de hoy (Costa Rica):', hoy)

      // Verificar si tiene permiso aprobado para hoy
      const { data: permisos, error: errorPermisos } = await supabase
        .from('Permisos')
        .select('*')
        .eq('EmpleadoId', usuario.EmpleadoId)
        .eq('Estado', 'Aprobado')
        .lte('FechaInicio', hoy)
        .gte('FechaFin', hoy)

      if (errorPermisos) {
        console.error('Error al verificar permisos:', errorPermisos)
      }

      if (permisos && permisos.length > 0) {
        console.log('⚠️ Usuario tiene permiso aprobado para hoy, no se registra asistencia')
        return
      }

      // Buscar asistencia de hoy
      const { data: asistenciaExistente, error: errorAsistencia } = await supabase
        .from('Asistencias')
        .select('Id, HoraEntrada, Estado')
        .eq('EmpleadoId', usuario.EmpleadoId)
        .eq('Fecha', hoy)
        .maybeSingle()

      if (errorAsistencia) {
        console.error('❌ Error al buscar asistencia:', errorAsistencia)
      }

      console.log('Asistencia existente:', asistenciaExistente)

      // Si ya existe asistencia con hora de entrada, no hacer nada
      if (asistenciaExistente?.HoraEntrada) {
        console.log('✅ Ya existe asistencia con hora de entrada para hoy')
        return
      }

      // Obtener horario del empleado para calcular tardía
      const { data: empleado, error: errorEmpleado } = await supabase
        .from('Empleados')
        .select('HorarioLaboral')
        .eq('Id', usuario.EmpleadoId)
        .single()

      if (errorEmpleado) {
        console.error('❌ Error al obtener empleado:', errorEmpleado)
      }

      console.log('Empleado encontrado:', empleado ? 'Sí' : 'No')
      console.log('Tiene horario laboral:', empleado?.HorarioLaboral ? 'Sí' : 'No')

      // VERIFICAR SI ES DÍA LABORAL SEGÚN EL HORARIO
      if (!empleado?.HorarioLaboral) {
        console.log('⚠️ Empleado no tiene horario laboral configurado, no se registra asistencia')
        return
      }

      const esDiaLaboralHoy = esDiaLaboral(empleado.HorarioLaboral, hoy)
      console.log('¿Es día laboral según horario?:', esDiaLaboralHoy)

      if (!esDiaLaboralHoy) {
        console.log('⚠️ Hoy NO es día laboral según el horario del empleado, no se registra asistencia')
        return
      }

      const horaEntradaReal = getCostaRicaTime()
      let minutosTardia = 0

      console.log('Hora de entrada real:', horaEntradaReal.toISOString())

      // Calcular tardía basándose en el horario laboral (ya verificamos que es día laboral)
      const horaEsperadaData = obtenerHoraEntradaEsperada(empleado.HorarioLaboral, hoy)
      console.log('Hora esperada data:', horaEsperadaData)
      
      if (horaEsperadaData) {
        // Obtener componentes de hora de la entrada real (en zona horaria de Costa Rica)
        // horaEntradaReal ya está en hora de Costa Rica gracias a getCostaRicaTime()
        // Usar toLocaleString para obtener la hora en zona horaria de Costa Rica
        const horaRealStr = horaEntradaReal.toLocaleString('en-US', { 
          timeZone: 'Etc/GMT+6',
          hour: '2-digit',
          minute: '2-digit',
          hour12: false
        })
        const [horaReal, minutoReal] = horaRealStr.split(':').map(Number)
        
        console.log(`Hora real (Costa Rica): ${horaReal}:${minutoReal}`)
        console.log(`Hora esperada: ${horaEsperadaData.hora}:${horaEsperadaData.minuto}`)
        
        // Calcular diferencia en minutos directamente
        const minutosReal = horaReal * 60 + minutoReal
        const minutosEsperados = horaEsperadaData.hora * 60 + horaEsperadaData.minuto
        
        // Calcular tardía básica (solo si llegó después de la hora esperada)
        const diferencia = minutosReal - minutosEsperados
        const minutosTardiaBasica = diferencia > 0 ? diferencia : 0
        
        // Aplicar reglas especiales de cálculo de tardía
        const tardiaCalculada = calcularTardiaConReglas(minutosTardiaBasica)
        minutosTardia = minutosTardiaBasica // Guardamos los minutos reales para la BD
        
        console.log(`Minutos reales: ${minutosReal}, Minutos esperados: ${minutosEsperados}, Diferencia: ${diferencia}`)
        console.log(`Tardía calculada: ${tardiaCalculada.descripcion} (${minutosTardiaBasica} minutos reales)`)
      } else {
        console.log('⚠️ No se pudo obtener hora esperada, pero es día laboral, se registra sin tardía')
      }

      // Si ya existe asistencia sin hora de entrada, actualizarla
      if (asistenciaExistente) {
        console.log('📝 Actualizando asistencia existente (ID:', asistenciaExistente.Id, ')')
        const { data: updatedData, error: updateError } = await supabase
          .from('Asistencias')
          .update({
            HoraEntrada: horaEntradaReal.toISOString(),
            MinutosTardia: minutosTardia,
            Estado: 'Presente'
          })
          .eq('Id', asistenciaExistente.Id)
          .select()

        if (updateError) {
          console.error('❌ Error al actualizar asistencia:', updateError)
        } else {
          console.log('✅ Asistencia actualizada correctamente:', {
            Id: asistenciaExistente.Id,
            HoraEntrada: horaEntradaReal.toISOString(),
            MinutosTardia: minutosTardia,
            updatedData
          })
          
          // Si hay tardía, crear notificación automática
          if (minutosTardia > 0) {
            await crearNotificacionTardia(usuario.EmpleadoId, hoy)
          }
        }
      } else {
        // Crear nueva asistencia
        console.log('➕ Creando nueva asistencia')
        const { data: newAsistencia, error: insertError } = await supabase
          .from('Asistencias')
          .insert({
            EmpleadoId: usuario.EmpleadoId,
            Fecha: hoy,
            Estado: 'Presente',
            HoraEntrada: horaEntradaReal.toISOString(),
            MinutosTardia: minutosTardia
          })
          .select()

        if (insertError) {
          console.error('❌ Error al crear asistencia:', insertError)
          console.error('Detalles del error:', JSON.stringify(insertError, null, 2))
        } else {
          console.log('✅ Asistencia creada correctamente:', {
            Id: newAsistencia?.[0]?.Id,
            EmpleadoId: usuario.EmpleadoId,
            Fecha: hoy,
            HoraEntrada: horaEntradaReal.toISOString(),
            MinutosTardia: minutosTardia,
            newAsistencia
          })
          
          // Si hay tardía, crear notificación automática
          if (minutosTardia > 0) {
            await crearNotificacionTardia(usuario.EmpleadoId, hoy)
          }
        }
      }
      
      console.log('=== FIN REGISTRO DE ASISTENCIA ===')
    } catch (err) {
      console.error('❌ Error general al registrar asistencia:', err)
      console.error('Stack trace:', err.stack)
    }
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setLoading(true)
    setMessage('')
    setError('')

    try {
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password,
      })

      if (authError) throw authError

      setSessionInfo({
        user: data.user,
        session: data.session,
      })
      setMessage('Inicio de sesión exitoso')

      // Registrar asistencia automáticamente al iniciar sesión
      await registrarAsistenciaInicioSesion(data.user.email).catch(err => {
        console.error('Error al registrar asistencia en handleSubmit:', err)
      })
    } catch (err) {
      setSessionInfo(null)
      setError(err.message ?? 'Ocurrió un error inesperado')
    } finally {
      setLoading(false)
    }
  }

  const handleSignOut = async () => {
    setLoading(true)
    setMessage('')
    setError('')
    const { error: signOutError } = await supabase.auth.signOut()
    if (signOutError) {
      setError(signOutError.message)
    } else {
      setSessionInfo(null)
      setFormData({ email: '', password: '' })
      setMessage('Sesión cerrada correctamente')
    }
    setLoading(false)
  }

  if (sessionInfo?.user) {
    return (
      <DashboardView
        sessionInfo={sessionInfo}
        onSignOut={handleSignOut}
        loading={loading}
      />
    )
  }

  return (
    <div className="login-page">
      <section className="login-card">
        <div className="brand">
          <img src={logo} alt="JDS Gestión" />
        </div>

        <h1>Bienvenido</h1>
        <p className="subtitle">Inicia sesión para continuar</p>

        <form className="login-form" onSubmit={handleSubmit}>
          <label htmlFor="email">Correo electrónico</label>
          <div className="input-group">
            <input
              id="email"
              name="email"
              type="email"
              placeholder="Correo electrónico"
              value={formData.email}
              onChange={handleChange}
              required
            />
          </div>

          <label htmlFor="password">Contraseña</label>
          <div className="input-group password">
            <input
              id="password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              placeholder="Contraseña"
              value={formData.password}
              onChange={handleChange}
              required
            />
            <button
              type="button"
              className="toggle-password"
              onClick={() => setShowPassword((prev) => !prev)}
              aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
            >
              {showPassword ? <EyeOffIcon /> : <EyeIcon />}
            </button>
          </div>

          <button type="submit" className="primary-btn" disabled={loading}>
            {loading ? 'Validando...' : 'Iniciar Sesión'}
          </button>
        </form>

        <p className="helper-text">
          ¿No tienes cuenta? <a href="#">Regístrate aquí</a>
        </p>

        {message && <div className="status success">{message}</div>}
        {error && <div className="status error">{error}</div>}
      </section>
    </div>
  )
}

const EyeIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path
      d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6-10-6-10-6Z"
      stroke="currentColor"
      strokeWidth="1.8"
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <circle
      cx="12"
      cy="12"
      r="2.5"
      stroke="currentColor"
      strokeWidth="1.8"
      fill="none"
    />
  </svg>
)

const EyeOffIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path
      d="M3 3l18 18M9.9 9.9a3 3 0 104.2 4.2M6.1 6.5c-2.8 1.5-4.1 3.9-4.1 3.9s3.5 6 10 6c1.7 0 3.2-.3 4.5-.8M13.6 8.1c-.5-.07-1-.1-1.6-.1-6.5 0-10 6-10 6s1.2 2.3 3.9 3.9M16.7 10.2c1.9 1.5 3.3 3.7 3.3 3.7s-.8 1.4-2.3 2.7"
      stroke="currentColor"
      strokeWidth="1.8"
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
)

const UsersIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
)

const ClockIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <polyline points="12 6 12 12 16 14" />
  </svg>
)

const PauseIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor">
    <rect x="6" y="4" width="4" height="16" />
    <rect x="14" y="4" width="4" height="16" />
  </svg>
)

const AlertIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
    <line x1="12" y1="9" x2="12" y2="13" />
    <line x1="12" y1="17" x2="12.01" y2="17" />
  </svg>
)

const RefreshIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="23 4 23 10 17 10" />
    <polyline points="1 20 1 14 7 14" />
    <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
  </svg>
)

const BellIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
    <path d="M13.73 21a2 2 0 0 1-3.46 0" />
  </svg>
)

const DownloadIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="7 10 12 15 17 10" />
    <line x1="12" y1="15" x2="12" y2="3" />
  </svg>
)

const ChevronDownIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="6 9 12 15 18 9" />
  </svg>
)

const DashboardView = ({ sessionInfo, onSignOut, loading }) => {
  const [activeNav, setActiveNav] = useState('home')
  const user = sessionInfo.user
  const displayName =
    user?.user_metadata?.fullName ||
    user?.user_metadata?.nombre ||
    user?.user_metadata?.name ||
    user?.email?.split('@')[0] ||
    'Usuario'
  const role =
    user?.user_metadata?.position ||
    user?.user_metadata?.role ||
    'Colaborador'
  const initials = displayName
    .split(' ')
    .map((chunk) => chunk[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  const navItems = [
    { id: 'home', label: 'Inicio', target: 'home' },
    { id: 'supervision', label: 'Supervisión', target: 'supervision' },
    { id: 'employees', label: 'Empleados', target: 'empleados' },
    { id: 'users', label: 'Usuarios', target: 'usuarios' },
    { id: 'announcements', label: 'Anuncios', target: 'anuncios' },
    { id: 'payroll', label: 'Planilla', target: 'planilla' },
    { id: 'permits', label: 'Permisos', target: 'permisos' },
    { id: 'justifications', label: 'Justificaciones', target: 'justificaciones' },
    { id: 'documents', label: 'Documentos', target: 'documentos' },
    { id: 'settings', label: 'Configuraciones', target: 'configuraciones' },
  ]

  const activeItem =
    navItems.find((item) => item.id === activeNav) ?? navItems[0]

  const sections = {
    home: <HomePanel displayName={displayName} sessionInfo={sessionInfo} />,
    supervision: <SupervisionPanel sessionInfo={sessionInfo} />,
    empleados: <EmployeesPanel />,
    usuarios: <UsersPanel />,
    anuncios: <AnnouncementsPanel />,
    planilla: <PayrollPanel />,
    permisos: <PermitsPanel currentUser={displayName} sessionInfo={sessionInfo} />,
    justificaciones: <JustificationsPanel sessionInfo={sessionInfo} />,
    documentos: <DocumentsPanel sessionInfo={sessionInfo} />,
    configuraciones: <SettingsPanel />,
  }

  const currentSection = activeItem.target
    ? sections[activeItem.target]
    : null

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="sidebar-brand">
          <img src={logo} alt="JDS Gestión" />
          <div>
            <p>JDS Gestión</p>
            <span>Panel Operativo</span>
          </div>
        </div>

        <nav className="sidebar-nav">
          {navItems.map((item) => (
            <button
              key={item.id}
              type="button"
              className={`nav-item ${
                activeNav === item.id ? 'active' : ''
              } ${!item.target ? 'nav-item--placeholder' : ''}`}
              onClick={() => setActiveNav(item.id)}
            >
              <span className="nav-icon" aria-hidden="true" />
              <span className="nav-label">{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="sidebar-user">
          <div className="avatar">{initials}</div>
          <div>
            <p>{displayName}</p>
            <span>{role}</span>
          </div>
        </div>

        <button
          type="button"
          className="logout-btn"
          onClick={onSignOut}
          disabled={loading}
        >
          {loading ? 'Cerrando...' : 'Cerrar sesión'}
        </button>
      </aside>

      <main className="main-area">
        {currentSection || <ComingSoonSection title={activeItem.label} />}
      </main>
    </div>
  )
}

const SupervisionPanel = ({ sessionInfo }) => {
  const [metrics, setMetrics] = useState([
    {
      label: 'Empleados supervisados',
      value: '0',
      hint: 'Capacidad total 4',
      tone: 'primary',
      progress: 0,
    },
    {
      label: 'Activos ahora',
      value: '0',
      hint: 'Actualizado hace 3 min',
      tone: 'success',
      progress: 0,
    },
    {
      label: 'En pausa',
      value: '0',
      hint: 'Sin recesos vigentes',
      tone: 'warning',
      progress: 0,
    },
    {
      label: 'Ausentes',
      value: '0',
      hint: 'Todo el equipo presente',
      tone: 'danger',
      progress: 0,
    },
  ])
  const [liveAgents, setLiveAgents] = useState([])
  const [pendingRequests, setPendingRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const [isSupervisor, setIsSupervisor] = useState(false)
  const [proyectoSupervisado, setProyectoSupervisado] = useState(null)
  const [showRejectModal, setShowRejectModal] = useState(false)
  const [selectedRequest, setSelectedRequest] = useState(null)
  const [rejectMessage, setRejectMessage] = useState('')
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [showHistorialModal, setShowHistorialModal] = useState(false)
  const [showPausaModal, setShowPausaModal] = useState(false)
  const [selectedEmpleado, setSelectedEmpleado] = useState(null)
  const [historialData, setHistorialData] = useState(null)
  const [tipoPausa, setTipoPausa] = useState('')
  const [horaActual, setHoraActual] = useState('')

  // Verificar si el usuario es supervisor
  useEffect(() => {
    const verificarRol = async () => {
      if (!sessionInfo?.user?.email) return

      try {
        const emailNormalizado = sessionInfo.user.email.toUpperCase()
        const { data: usuario } = await supabase
          .from('Usuarios')
          .select('Id')
          .eq('NormalizedEmail', emailNormalizado)
          .maybeSingle()

        if (usuario) {
          const { data: rolesUsuario } = await supabase
            .from('UsuariosRoles')
            .select('RoleId, Roles:RoleId (Id, Name, NormalizedName)')
            .eq('UserId', usuario.Id)

          const roles = rolesUsuario?.map(ur => ur.Roles).filter(Boolean) || []
          const tieneSupervisor = roles.some(
            r => r?.Name === 'Supervisor de Personal' || r?.NormalizedName === 'SUPERVISOR DE PERSONAL'
          )
          setIsSupervisor(tieneSupervisor)

          // Si es supervisor, obtener su proyecto supervisado
          if (tieneSupervisor && usuario.Id) {
            // Obtener el EmpleadoId del usuario
            const { data: usuarioData } = await supabase
              .from('Usuarios')
              .select('EmpleadoId')
              .eq('Id', usuario.Id)
              .maybeSingle()

            if (usuarioData?.EmpleadoId) {
              // Obtener el proyecto supervisado del empleado
              const { data: empleadoData } = await supabase
                .from('Empleados')
                .select('ProyectoSupervisado')
                .eq('Id', usuarioData.EmpleadoId)
                .maybeSingle()

              if (empleadoData?.ProyectoSupervisado) {
                setProyectoSupervisado(empleadoData.ProyectoSupervisado)
              }
            }
          }
        }
      } catch (err) {
        console.error('Error al verificar rol:', err)
      }
    }

    verificarRol()
  }, [sessionInfo])

  // Función para cargar solicitudes pendientes
  const cargarSolicitudesPendientes = async () => {
    if (!isSupervisor) {
      setPendingRequests([])
      return
    }

    try {
      // Si tiene proyecto supervisado, obtener IDs de empleados de ese proyecto
      let empleadosIds = null
      if (proyectoSupervisado) {
        const { data: empleadosProyecto } = await supabase
          .from('Empleados')
          .select('Id')
          .eq('ProyectoAsignado', proyectoSupervisado)
          .eq('Activo', true)

        if (empleadosProyecto && empleadosProyecto.length > 0) {
          empleadosIds = empleadosProyecto.map(e => e.Id)
        } else {
          // Si no hay empleados en el proyecto, no mostrar solicitudes
          setPendingRequests([])
          return
        }
      }

      // Cargar permisos pendientes
      let queryPermisos = supabase
        .from('Permisos')
        .select('*, Empleados:EmpleadoId (NombreCompleto, ProyectoAsignado)')
        .eq('Estado', 'Pendiente')
        .order('FechaRegistro', { ascending: false })

      // Si hay proyecto supervisado, filtrar por empleados de ese proyecto
      if (empleadosIds && empleadosIds.length > 0) {
        queryPermisos = queryPermisos.in('EmpleadoId', empleadosIds)
      }

      const { data: permisosData } = await queryPermisos

      // Cargar justificaciones pendientes
      let queryJustificaciones = supabase
        .from('Justificaciones')
        .select('*, Empleados:EmpleadoId (NombreCompleto, ProyectoAsignado)')
        .eq('Estado', 'Pendiente')
        .order('FechaRegistro', { ascending: false })

      // Si hay proyecto supervisado, filtrar por empleados de ese proyecto
      if (empleadosIds && empleadosIds.length > 0) {
        queryJustificaciones = queryJustificaciones.in('EmpleadoId', empleadosIds)
      }

      const { data: justificacionesData } = await queryJustificaciones

      const solicitudes = []

      // Procesar permisos
      if (permisosData) {
        permisosData.forEach(permiso => {
          let desde = ''
          let hasta = ''
          
          if (permiso.Tipo === 'Vacaciones') {
            desde = formatFechaCR(permiso.FechaInicio)
            hasta = formatFechaCR(permiso.FechaFin)
          } else if (permiso.Tipo === 'Permiso' || permiso.Tipo === 'Cita Medica') {
            desde = `${formatFechaCR(permiso.FechaInicio)} ${permiso.HoraInicio || ''}`
            hasta = `${formatFechaCR(permiso.FechaFin)} ${permiso.HoraFin || ''}`
          }

          solicitudes.push({
            id: permiso.Id,
            tipo: 'Permiso',
            tipoDetalle: permiso.Tipo,
            empleado: permiso.Empleados?.NombreCompleto || 'N/A',
            desde: desde,
            hasta: hasta,
            motivo: permiso.Justificacion,
            documento: permiso.DocumentoSoporte ? 'Sí' : 'No',
            documentoUrl: permiso.DocumentoSoporte,
            estado: permiso.Estado,
            data: permiso
          })
        })
      }

      // Procesar justificaciones
      if (justificacionesData) {
        justificacionesData.forEach(justificacion => {
          let desde = ''
          let hasta = ''
          
          if (justificacion.Tipo === 'Ausencia') {
            desde = formatFechaCR(justificacion.Fecha)
            hasta = formatFechaCR(justificacion.Fecha)
          } else if (justificacion.Tipo === 'Tardia') {
            desde = `${formatFechaCR(justificacion.Fecha)} ${justificacion.Hora || ''}`
            hasta = `${formatFechaCR(justificacion.Fecha)} ${justificacion.Hora || ''}`
          } else if (justificacion.Tipo === 'Incapacidad') {
            desde = formatFechaCR(justificacion.FechaInicio)
            hasta = formatFechaCR(justificacion.FechaFin)
          }

          solicitudes.push({
            id: justificacion.Id,
            tipo: 'Justificación',
            tipoDetalle: justificacion.Tipo,
            empleado: justificacion.Empleados?.NombreCompleto || 'N/A',
            desde: desde,
            hasta: hasta,
            motivo: justificacion.Motivo,
            documento: justificacion.DocumentoSoporte ? 'Sí' : 'No',
            documentoUrl: justificacion.DocumentoSoporte,
            estado: justificacion.Estado,
            data: justificacion
          })
        })
      }

      setPendingRequests(solicitudes)
    } catch (err) {
      console.error('Error al cargar solicitudes pendientes:', err)
    }
  }

  // Cargar solicitudes pendientes
  useEffect(() => {
    cargarSolicitudesPendientes()
  }, [isSupervisor, proyectoSupervisado])

  // Suscripción en tiempo real para actualizar solicitudes
  useEffect(() => {
    if (!isSupervisor) return

    const channelPermisos = supabase
      .channel('permisos-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'Permisos',
          filter: 'Estado=eq.Pendiente'
        },
        () => {
          cargarSolicitudesPendientes()
        }
      )
      .subscribe()

    const channelJustificaciones = supabase
      .channel('justificaciones-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'Justificaciones',
          filter: 'Estado=eq.Pendiente'
        },
        () => {
          cargarSolicitudesPendientes()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channelPermisos)
      supabase.removeChannel(channelJustificaciones)
    }
  }, [isSupervisor, proyectoSupervisado])

  const handleAprobar = async (request) => {
    try {
      const tabla = request.tipo === 'Permiso' ? 'Permisos' : 'Justificaciones'
      const { error: updateError } = await supabase
        .from(tabla)
        .update({ Estado: 'Aprobado' })
        .eq('Id', request.id)

      if (updateError) throw updateError

      // Recargar solicitudes para actualizar la lista
      await cargarSolicitudesPendientes()
      setMessage('Solicitud aprobada correctamente')
      setTimeout(() => setMessage(''), 3000)
    } catch (err) {
      setError(err.message || 'Error al aprobar la solicitud')
      setTimeout(() => setError(''), 5000)
    }
  }

  const handleRechazar = async () => {
    if (!rejectMessage.trim()) {
      setError('Debe proporcionar un motivo para rechazar la solicitud')
      return
    }

    try {
      const tabla = selectedRequest.tipo === 'Permiso' ? 'Permisos' : 'Justificaciones'
      const { error: updateError } = await supabase
        .from(tabla)
        .update({ 
          Estado: 'Rechazado',
          MotivoRechazo: rejectMessage
        })
        .eq('Id', selectedRequest.id)

      if (updateError) throw updateError

      // Recargar solicitudes para actualizar la lista
      await cargarSolicitudesPendientes()
      setMessage('Solicitud rechazada correctamente')
      setShowRejectModal(false)
      setSelectedRequest(null)
      setRejectMessage('')
      setTimeout(() => setMessage(''), 3000)
    } catch (err) {
      setError(err.message || 'Error al rechazar la solicitud')
      setTimeout(() => setError(''), 5000)
    }
  }

  const handleEliminar = async (request) => {
    if (!confirm('¿Está seguro de que desea eliminar esta solicitud?')) return

    try {
      const tabla = request.tipo === 'Permiso' ? 'Permisos' : 'Justificaciones'
      const { error: deleteError } = await supabase
        .from(tabla)
        .delete()
        .eq('Id', request.id)

      if (deleteError) throw deleteError

      // Recargar solicitudes para actualizar la lista
      await cargarSolicitudesPendientes()
      setMessage('Solicitud eliminada correctamente')
      setTimeout(() => setMessage(''), 3000)
    } catch (err) {
      setError(err.message || 'Error al eliminar la solicitud')
      setTimeout(() => setError(''), 5000)
    }
  }

  const handleEditar = (request) => {
    // Redirigir al módulo correspondiente para editar
    // Por ahora solo mostramos un mensaje
    setMessage(`Para editar esta solicitud, ve al módulo de ${request.tipo === 'Permiso' ? 'Permisos' : 'Justificaciones'}`)
    setTimeout(() => setMessage(''), 5000)
  }

  // Función para formatear hora en zona horaria de Costa Rica - usa helper global
  const formatCostaRicaTime = (date) => {
    return formatHoraCR(date)
  }

  // Función para calcular minutos entre dos fechas
  const calcularMinutos = (inicio, fin) => {
    if (!inicio || !fin) return 0
    try {
      const inicioDate = new Date(inicio)
      const finDate = new Date(fin)
      const diffMs = finDate - inicioDate
      return Math.floor(diffMs / (1000 * 60))
    } catch (err) {
      return 0
    }
  }

  const handleVerHistorial = async (agent) => {
    setSelectedEmpleado(agent)
    setShowHistorialModal(true)
    setError('')
    
    try {
      const hoy = getCostaRicaDateString()
      
      // Cargar asistencia del día
      const { data: asistenciaData } = await supabase
        .from('Asistencias')
        .select('*')
        .eq('EmpleadoId', agent.id)
        .eq('Fecha', hoy)
        .maybeSingle()

      if (!asistenciaData) {
        setHistorialData({
          asistencia: null,
          pausas: [],
          minutosTardia: 0
        })
        return
      }

      // Cargar pausas del día
      const { data: pausasData } = await supabase
        .from('Pausas')
        .select('*')
        .eq('AsistenciaId', asistenciaData.Id)
        .order('HoraInicio', { ascending: true })

      setHistorialData({
        asistencia: asistenciaData,
        pausas: pausasData || [],
        minutosTardia: asistenciaData.MinutosTardia || 0
      })
    } catch (err) {
      console.error('Error al cargar historial:', err)
      setError('Error al cargar el historial')
    }
  }

  const handleAbrirPausa = (agent) => {
    setSelectedEmpleado(agent)
    setShowPausaModal(true)
    setTipoPausa('')
    setError('')
  }

  const handleRegistrarPausa = async () => {
    if (!tipoPausa) {
      setError('Debe seleccionar un tipo de pausa')
      return
    }

    if (!selectedEmpleado?.asistenciaId) {
      setError('El empleado no tiene una asistencia registrada para hoy')
      return
    }

    try {
      const ahora = getCostaRicaTime()
      
      const { error: insertError } = await supabase
        .from('Pausas')
        .insert({
          AsistenciaId: selectedEmpleado.asistenciaId,
          TipoPausa: tipoPausa,
          HoraInicio: ahora.toISOString(),
          Activa: true
        })

      if (insertError) throw insertError

      setMessage('Pausa registrada correctamente')
      setShowPausaModal(false)
      setSelectedEmpleado(null)
      setTipoPausa('')
      
      // Recargar datos
      const cargarDatos = async () => {
        const hoy = getCostaRicaDateString()
        
        // Si es supervisor, solo cargar empleados de su proyecto supervisado
        let query = supabase
          .from('Empleados')
          .select('Id, NombreCompleto, Activo, ProyectoAsignado')
          .eq('Activo', true)

        // Si es supervisor y tiene proyecto supervisado, filtrar por ese proyecto
        if (isSupervisor && proyectoSupervisado) {
          query = query.eq('ProyectoAsignado', proyectoSupervisado)
        }

        const { data: empleadosData } = await query

        if (empleadosData) {
          const { data: asistenciasData } = await supabase
            .from('Asistencias')
            .select('EmpleadoId, Estado, Id')
            .eq('Fecha', hoy)

          const empleadosConEstado = empleadosData.map((emp) => {
            const asistencia = asistenciasData?.find((a) => a.EmpleadoId === emp.Id)
            return {
              id: emp.Id,
              name: emp.NombreCompleto,
              status: asistencia?.Estado === 'Presente' ? 'Activo' : 'Ausente',
              color: asistencia?.Estado === 'Presente' ? 'success' : 'danger',
              asistenciaId: asistencia?.Id || null,
            }
          })

          setLiveAgents(empleadosConEstado)
        }
      }
      cargarDatos()
      
      setTimeout(() => setMessage(''), 3000)
    } catch (err) {
      setError(err.message || 'Error al registrar la pausa')
      setTimeout(() => setError(''), 5000)
    }
  }

  useEffect(() => {
    const cargarDatos = async () => {
      // Si es supervisor, solo cargar empleados de su proyecto supervisado
      let query = supabase
        .from('Empleados')
        .select('Id, NombreCompleto, Activo, ProyectoAsignado')
        .eq('Activo', true)

      // Si es supervisor y tiene proyecto supervisado, filtrar por ese proyecto
      if (isSupervisor && proyectoSupervisado) {
        query = query.eq('ProyectoAsignado', proyectoSupervisado)
      }

      const { data: empleadosData } = await query

      if (empleadosData) {
        const totalEmpleados = empleadosData.length
        setMetrics((prev) => [
          {
            ...prev[0],
            value: totalEmpleados.toString(),
            progress: (totalEmpleados / 4) * 100,
          },
          ...prev.slice(1),
        ])

        // Cargar asistencias del día para determinar estado (usando zona horaria de Costa Rica)
        const hoy = getCostaRicaDateString()
        
        // Cargar asistencias (incluyendo HoraEntrada para verificar si tiene registro)
        const { data: asistenciasData } = await supabase
          .from('Asistencias')
          .select('EmpleadoId, Estado, Id, HoraEntrada')
          .eq('Fecha', hoy)

        // Cargar permisos aprobados para hoy
        const { data: permisosData } = await supabase
          .from('Permisos')
          .select('EmpleadoId, Tipo')
          .eq('Estado', 'Aprobado')
          .lte('FechaInicio', hoy)
          .gte('FechaFin', hoy)

        // Crear mapa de empleados con permisos
        const empleadosConPermiso = new Set(permisosData?.map(p => p.EmpleadoId) || [])

        // Cargar horarios laborales de todos los empleados
        const { data: empleadosConHorario } = await supabase
          .from('Empleados')
          .select('Id, HorarioLaboral')
          .in('Id', empleadosData.map(e => e.Id))

        // Cargar pausas activas
        const { data: pausasData } = await supabase
          .from('Pausas')
          .select('*')
          .eq('Activa', true)

        const empleadosConEstado = empleadosData.map((emp) => {
          const asistencia = asistenciasData?.find((a) => a.EmpleadoId === emp.Id)
          const tienePermiso = empleadosConPermiso.has(emp.Id)
          
          // Obtener horario laboral del empleado
          const empleadoConHorario = empleadosConHorario?.find(e => e.Id === emp.Id)
          const horarioLaboral = empleadoConHorario?.HorarioLaboral
          
          // Verificar si hoy es día laboral según el horario
          let esDiaLaboralHoy = false
          if (horarioLaboral) {
            esDiaLaboralHoy = esDiaLaboral(horarioLaboral, hoy)
          }
          
          // Buscar pausa activa para este empleado
          const pausaActiva = pausasData?.find((p) => p.AsistenciaId === asistencia?.Id)
          let tiempoRestante = null
          
          if (pausaActiva) {
            // Calcular tiempo restante en tiempo real
            const ahora = getCostaRicaTime()
            const inicio = toCostaRicaDate(pausaActiva.HoraInicio) || new Date(pausaActiva.HoraInicio)
            const transcurrido = Math.floor((ahora - inicio) / 1000)
            const tiempoPausado = pausaActiva.TiempoPausadoAcumulado || 0
            const tiempoActivo = transcurrido - tiempoPausado
            tiempoRestante = Math.max(0, 3600 - tiempoActivo) // 60 minutos = 3600 segundos
          }
          
          // Si tiene permiso aprobado, mostrar como "En Permiso" o "En Vacaciones"
          if (tienePermiso) {
            const permiso = permisosData?.find(p => p.EmpleadoId === emp.Id)
            const esVacaciones = permiso?.Tipo === 'Vacaciones'
            return {
              id: emp.Id,
              name: emp.NombreCompleto,
              status: esVacaciones ? 'En Vacaciones' : 'En Permiso',
              color: 'warning',
              asistenciaId: asistencia?.Id || null,
              tiempoRestante: tiempoRestante
            }
          }
          
          // Si no es día laboral según el horario, no mostrar como ausente
          if (!esDiaLaboralHoy) {
            return {
              id: emp.Id,
              name: emp.NombreCompleto,
              status: 'No laboral',
              color: 'secondary',
              asistenciaId: asistencia?.Id || null,
              tiempoRestante: tiempoRestante
            }
          }
          
          // Considerar activo si tiene asistencia con estado Presente Y tiene hora de entrada registrada
          // Esto asegura que solo aparezcan como activos los que realmente iniciaron sesión hoy
          const tieneHoraEntrada = asistencia?.HoraEntrada !== null && asistencia?.HoraEntrada !== undefined
          const esActivo = asistencia?.Estado === 'Presente' && tieneHoraEntrada
          
          // Debug: Log para verificar el estado
          if (emp.NombreCompleto === 'gfdshbsfdt' || emp.NombreCompleto.toLowerCase().includes('gfd')) {
            console.log('Debug empleado:', {
              nombre: emp.NombreCompleto,
              tieneAsistencia: !!asistencia,
              estado: asistencia?.Estado,
              horaEntrada: asistencia?.HoraEntrada,
              tieneHoraEntrada,
              esActivo
            })
          }
          
          return {
            id: emp.Id,
            name: emp.NombreCompleto,
            status: esActivo ? 'Activo' : 'Ausente',
            color: esActivo ? 'success' : 'danger',
            asistenciaId: asistencia?.Id || null,
          }
        })

        setLiveAgents(empleadosConEstado)
        setMetrics((prev) => [
          prev[0],
          {
            ...prev[1],
            value: empleadosConEstado.filter((e) => e.status === 'Activo').length.toString(),
          },
          ...prev.slice(2),
        ])
      }

      setLoading(false)
    }

    cargarDatos()
    
    // Suscripción en tiempo real para actualizar cuando cambien las asistencias
    const hoy = getCostaRicaDateString()
    const channelAsistencias = supabase
      .channel('asistencias-supervision-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'Asistencias',
          filter: `Fecha=eq.${hoy}`
        },
        () => {
          // Recargar datos cuando haya cambios en asistencias de hoy
          cargarDatos()
        }
      )
      .subscribe()
    
    // Actualizar datos cada 10 segundos como respaldo
    const interval = setInterval(() => {
      cargarDatos()
    }, 10000)
    
    return () => {
      clearInterval(interval)
      supabase.removeChannel(channelAsistencias)
    }
  }, [isSupervisor, proyectoSupervisado])
  
  // Actualizar hora actual cada segundo (hora de Costa Rica)
  useEffect(() => {
    const actualizarHora = () => {
      const ahora = getCostaRicaTime()
      // Obtener segundos en zona horaria de Costa Rica
      const segundos = ahora.toLocaleString('en-US', {
        timeZone: 'Etc/GMT+6',
        second: '2-digit'
      })
      const horaMinuto = formatHoraCR(ahora)
      setHoraActual(horaMinuto ? `${horaMinuto}:${segundos}` : '')
    }
    
    actualizarHora()
    const intervalHora = setInterval(actualizarHora, 1000)
    
    return () => clearInterval(intervalHora)
  }, [])
  
  // Función para refrescar manualmente
  const handleRefresh = () => {
    setLoading(true)
    const cargarDatos = async () => {
      // Si es supervisor, solo cargar empleados de su proyecto supervisado
      let query = supabase
        .from('Empleados')
        .select('Id, NombreCompleto, Activo, ProyectoAsignado')
        .eq('Activo', true)

      // Si es supervisor y tiene proyecto supervisado, filtrar por ese proyecto
      if (isSupervisor && proyectoSupervisado) {
        query = query.eq('ProyectoAsignado', proyectoSupervisado)
      }

      const { data: empleadosData } = await query

      if (empleadosData) {
        const totalEmpleados = empleadosData.length
        setMetrics((prev) => [
          {
            ...prev[0],
            value: totalEmpleados.toString(),
            progress: (totalEmpleados / 4) * 100,
          },
          ...prev.slice(1),
        ])

        // Cargar asistencias del día para determinar estado (usando zona horaria de Costa Rica)
        const hoy = getCostaRicaDateString()
        
        // Cargar asistencias (incluyendo HoraEntrada para verificar si tiene registro)
        const { data: asistenciasData } = await supabase
          .from('Asistencias')
          .select('EmpleadoId, Estado, Id, HoraEntrada')
          .eq('Fecha', hoy)

        // Cargar permisos aprobados para hoy
        const { data: permisosData } = await supabase
          .from('Permisos')
          .select('EmpleadoId, Tipo')
          .eq('Estado', 'Aprobado')
          .lte('FechaInicio', hoy)
          .gte('FechaFin', hoy)

        // Crear mapa de empleados con permisos
        const empleadosConPermiso = new Set(permisosData?.map(p => p.EmpleadoId) || [])

        // Cargar horarios laborales de todos los empleados
        const { data: empleadosConHorario } = await supabase
          .from('Empleados')
          .select('Id, HorarioLaboral')
          .in('Id', empleadosData.map(e => e.Id))

        // Cargar pausas activas
        const { data: pausasData } = await supabase
          .from('Pausas')
          .select('*')
          .eq('Activa', true)

        const empleadosConEstado = empleadosData.map((emp) => {
          const asistencia = asistenciasData?.find((a) => a.EmpleadoId === emp.Id)
          const tienePermiso = empleadosConPermiso.has(emp.Id)
          
          // Obtener horario laboral del empleado
          const empleadoConHorario = empleadosConHorario?.find(e => e.Id === emp.Id)
          const horarioLaboral = empleadoConHorario?.HorarioLaboral
          
          // Verificar si hoy es día laboral según el horario
          let esDiaLaboralHoy = false
          if (horarioLaboral) {
            esDiaLaboralHoy = esDiaLaboral(horarioLaboral, hoy)
          }
          
          // Buscar pausa activa para este empleado
          const pausaActiva = pausasData?.find((p) => p.AsistenciaId === asistencia?.Id)
          let tiempoRestante = null
          
          if (pausaActiva) {
            // Calcular tiempo restante en tiempo real
            const ahora = getCostaRicaTime()
            const inicio = toCostaRicaDate(pausaActiva.HoraInicio) || new Date(pausaActiva.HoraInicio)
            const transcurrido = Math.floor((ahora - inicio) / 1000)
            const tiempoPausado = pausaActiva.TiempoPausadoAcumulado || 0
            const tiempoActivo = transcurrido - tiempoPausado
            tiempoRestante = Math.max(0, 3600 - tiempoActivo) // 60 minutos = 3600 segundos
          }
          
          // Si tiene permiso aprobado, mostrar como "En Permiso" o "En Vacaciones"
          if (tienePermiso) {
            const permiso = permisosData?.find(p => p.EmpleadoId === emp.Id)
            const esVacaciones = permiso?.Tipo === 'Vacaciones'
            return {
              id: emp.Id,
              name: emp.NombreCompleto,
              status: esVacaciones ? 'En Vacaciones' : 'En Permiso',
              color: 'warning',
              asistenciaId: asistencia?.Id || null,
              tiempoRestante: tiempoRestante
            }
          }
          
          // Si no es día laboral según el horario, no mostrar como ausente
          if (!esDiaLaboralHoy) {
            return {
              id: emp.Id,
              name: emp.NombreCompleto,
              status: 'No laboral',
              color: 'secondary',
              asistenciaId: asistencia?.Id || null,
              tiempoRestante: tiempoRestante
            }
          }
          
          // Considerar activo si tiene asistencia con estado Presente Y tiene hora de entrada registrada
          const tieneHoraEntrada = asistencia?.HoraEntrada !== null && asistencia?.HoraEntrada !== undefined
          const esActivo = asistencia?.Estado === 'Presente' && tieneHoraEntrada
          
          return {
            id: emp.Id,
            name: emp.NombreCompleto,
            status: esActivo ? 'Activo' : 'Ausente',
            color: esActivo ? 'success' : 'danger',
            asistenciaId: asistencia?.Id || null,
            tiempoRestante: tiempoRestante
          }
        })

        setLiveAgents(empleadosConEstado)
        setMetrics((prev) => [
          prev[0],
          {
            ...prev[1],
            value: empleadosConEstado.filter((e) => e.status === 'Activo').length.toString(),
          },
          ...prev.slice(2),
        ])
      }

      setLoading(false)
    }
    
    cargarDatos()
  }

  return (
    <div className="section-stack">
      <div className="panel-header">
        <div className="panel-title">
          <span className="title-icon" aria-hidden="true">
            <UsersIcon />
          </span>
          <div>
            <p className="eyebrow">Panel de Supervisión</p>
            <h2>Panel de Supervisión</h2>
          </div>
        </div>
        <div className="panel-header-meta">
          <div className="time-display">
            <span>Hora actual (Costa Rica)</span>
            <strong>{horaActual || formatHoraCR(getCostaRicaTime())}</strong>
          </div>
          <button type="button" className="btn btn-secondary" onClick={handleRefresh} disabled={loading}>
            <RefreshIcon />
            {loading ? 'Actualizando...' : 'Actualizar'}
          </button>
          <button type="button" className="icon-button" aria-label="Alertas">
            <BellIcon />
            <span className="notification-dot" />
          </button>
        </div>
      </div>

      <div className="metrics-grid">
        {metrics.map((metric) => (
          <article
            key={metric.label}
            className={`metric-card metric-${metric.tone}`}
          >
            <div className="metric-icon" aria-hidden="true">
              {metric.tone === 'primary' && <UsersIcon />}
              {metric.tone === 'success' && <ClockIcon />}
              {metric.tone === 'warning' && <PauseIcon />}
              {metric.tone === 'danger' && <AlertIcon />}
            </div>
            <div className="metric-content">
              <p className="metric-label">{metric.label}</p>
              <p className="metric-value">{metric.value}</p>
              <div className="progress-bar">
                <div
                  className={`progress-fill progress-${metric.tone}`}
                  style={{ width: `${metric.progress}%` }}
                />
              </div>
            </div>
          </article>
        ))}
      </div>

      <div className="section-card filters-card">
        <div className="filter-row">
          <input type="text" placeholder="Buscar por nombre..." />
          <input type="text" placeholder="Buscar por departamento..." />
          <input type="date" placeholder="Desde" />
          <input type="date" placeholder="Hasta" />
        </div>
        <div className="filters-actions">
          <button type="button" className="btn btn-primary">
            Aplicar
          </button>
          <button type="button" className="btn btn-outline">
            Limpiar
          </button>
          <button type="button" className="btn btn-secondary ghost">
            <DownloadIcon />
            Exportar
          </button>
        </div>
      </div>

      <div className="split-panels">
        <div className="section-card live-panel">
          <div className="split-heading">
            <h3>En vivo</h3>
            <span className="badge badge-soft">Tiempo real</span>
          </div>
          <div className="live-list">
            {liveAgents.map((agent) => (
              <article key={agent.name} className="live-card">
                <div className="agent-avatar">{agent.name[0]}</div>
                <div className="live-info">
                  <p className="live-name">{agent.name}</p>
                  <div className="live-details">
                    <div className="status-pill">
                      <span
                        className={`status-dot status-${agent.color}`}
                        aria-hidden="true"
                      />
                      <span>Estado: {agent.status}</span>
                    </div>
                    <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
                      <button
                        type="button"
                        className="btn btn-sm btn-outline"
                        onClick={() => handleVerHistorial(agent)}
                      >
                        Historial
                      </button>
                      <button
                        type="button"
                        className="btn btn-sm btn-primary"
                        onClick={() => handleAbrirPausa(agent)}
                        disabled={agent.status === 'Ausente'}
                      >
                        Pausa
                      </button>
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>

        <div className="section-card table-card">
          <div className="split-heading">
            <h3>Solicitudes pendientes</h3>
          </div>
          {error && (
            <div className="alert alert-danger" style={{ margin: '10px', padding: '10px' }}>
              {error}
            </div>
          )}
          {message && (
            <div className="alert alert-success" style={{ margin: '10px', padding: '10px' }}>
              {message}
            </div>
          )}
          <div className="table-scroll">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Tipo</th>
                  <th>Empleado</th>
                  <th>Desde</th>
                  <th>Hasta</th>
                  <th>Motivo</th>
                  <th>Documento</th>
                  {isSupervisor && <th>Acciones</th>}
                </tr>
              </thead>
              <tbody>
                {pendingRequests.length === 0 ? (
                  <tr>
                    <td colSpan={isSupervisor ? 7 : 6} style={{ textAlign: 'center', padding: '20px' }}>
                      No hay solicitudes pendientes
                    </td>
                  </tr>
                ) : (
                  pendingRequests.map((request) => (
                    <tr key={`${request.tipo}-${request.id}`}>
                      <td>
                        <span className="badge badge-soft">{request.tipo}</span>
                        <br />
                        <small style={{ color: '#666' }}>{request.tipoDetalle}</small>
                      </td>
                      <td>{request.empleado}</td>
                      <td>{request.desde || '-'}</td>
                      <td>{request.hasta || '-'}</td>
                      <td>{request.motivo || '-'}</td>
                      <td>
                        {request.documentoUrl ? (
                          <a 
                            href={request.documentoUrl} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="btn btn-sm btn-outline"
                          >
                            Ver documento
                          </a>
                        ) : (
                          'No'
                        )}
                      </td>
                      {isSupervisor && (
                        <td>
                          <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
                            <button
                              type="button"
                              className="btn btn-sm btn-success"
                              onClick={() => handleAprobar(request)}
                              title="Aprobar"
                            >
                              ✓ Aprobar
                            </button>
                            <button
                              type="button"
                              className="btn btn-sm btn-danger"
                              onClick={() => {
                                setSelectedRequest(request)
                                setShowRejectModal(true)
                              }}
                              title="Rechazar"
                            >
                              ✗ Rechazar
                            </button>
                            <button
                              type="button"
                              className="btn btn-sm btn-secondary"
                              onClick={() => handleEditar(request)}
                              title="Editar"
                            >
                              ✎ Editar
                            </button>
                            <button
                              type="button"
                              className="btn btn-sm btn-outline"
                              onClick={() => handleEliminar(request)}
                              title="Eliminar"
                            >
                              🗑 Eliminar
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="section-card activity-panel">
        <h3>Actividad reciente</h3>
        <p>Sin movimientos recientes.</p>
      </div>

      {/* Modal para rechazar solicitud */}
      {showRejectModal && (
        <div className="modal-overlay" onClick={() => setShowRejectModal(false)}>
          <div className="modal-container" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Rechazar Solicitud</h3>
              <button
                type="button"
                className="modal-close"
                onClick={() => {
                  setShowRejectModal(false)
                  setSelectedRequest(null)
                  setRejectMessage('')
                  setError('')
                }}
              >
                ×
              </button>
            </div>
            <div className="modal-body">
              {selectedRequest && (
                <div>
                  <p><strong>Tipo:</strong> {selectedRequest.tipo} - {selectedRequest.tipoDetalle}</p>
                  <p><strong>Empleado:</strong> {selectedRequest.empleado}</p>
                  <p><strong>Motivo:</strong> {selectedRequest.motivo || 'N/A'}</p>
                </div>
              )}
              <div style={{ marginTop: '20px' }}>
                <label htmlFor="rejectMessage">
                  <strong>Motivo del rechazo *</strong>
                </label>
                <textarea
                  id="rejectMessage"
                  value={rejectMessage}
                  onChange={(e) => setRejectMessage(e.target.value)}
                  placeholder="Especifique el motivo por el cual se rechaza esta solicitud..."
                  rows={4}
                  style={{
                    width: '100%',
                    padding: '10px',
                    marginTop: '10px',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    fontFamily: 'inherit'
                  }}
                />
              </div>
              {error && (
                <div className="alert alert-danger" style={{ marginTop: '10px', padding: '10px' }}>
                  {error}
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-outline"
                onClick={() => {
                  setShowRejectModal(false)
                  setSelectedRequest(null)
                  setRejectMessage('')
                  setError('')
                }}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="btn btn-danger"
                onClick={handleRechazar}
              >
                Rechazar Solicitud
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal para Historial */}
      {showHistorialModal && selectedEmpleado && (
        <div className="modal-overlay" onClick={() => setShowHistorialModal(false)}>
          <div className="modal-container" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Historial del Día - {selectedEmpleado.name}</h3>
              <button
                type="button"
                className="modal-close"
                onClick={() => {
                  setShowHistorialModal(false)
                  setSelectedEmpleado(null)
                  setHistorialData(null)
                  setError('')
                }}
              >
                ×
              </button>
            </div>
            <div className="modal-body" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
              {error && (
                <div className="alert alert-danger" style={{ marginBottom: '15px', padding: '10px' }}>
                  {error}
                </div>
              )}
              
              {historialData ? (
                <div>
                  {/* Asistencia */}
                  <div style={{ marginBottom: '20px' }}>
                    <h4 style={{ marginBottom: '10px', color: '#333' }}>Asistencia del Día</h4>
                    {historialData.asistencia ? (
                      <div style={{ padding: '15px', backgroundColor: '#f5f5f5', borderRadius: '8px' }}>
                        <p><strong>Estado:</strong> {historialData.asistencia.Estado}</p>
                        <p><strong>Hora de Entrada:</strong> {formatCostaRicaTime(historialData.asistencia.HoraEntrada) || 'No registrada'}</p>
                        <p><strong>Hora de Salida:</strong> {formatCostaRicaTime(historialData.asistencia.HoraSalida) || 'No registrada'}</p>
                        {historialData.minutosTardia > 0 && (() => {
                          const tardiaCalculada = calcularTardiaConReglas(historialData.minutosTardia)
                          return (
                            <p style={{ color: '#d32f2f', fontWeight: 'bold' }}>
                              <strong>Tardía:</strong> {tardiaCalculada.descripcion}
                              {tardiaCalculada.minutosNormales > 0 && tardiaCalculada.horasAdicionales > 0 && (
                                <span style={{ fontSize: '0.9em', color: '#666', display: 'block', marginTop: '5px', fontWeight: 'normal' }}>
                                  ({historialData.minutosTardia} minutos reales)
                                </span>
                              )}
                            </p>
                          )
                        })()}
                        {historialData.asistencia.TotalMinutos && (
                          <p><strong>Total de Minutos Trabajados:</strong> {historialData.asistencia.TotalMinutos} minutos</p>
                        )}
                      </div>
                    ) : (
                      <p style={{ color: '#666', fontStyle: 'italic' }}>No hay asistencia registrada para hoy</p>
                    )}
                  </div>

                  {/* Pausas */}
                  <div style={{ marginBottom: '20px' }}>
                    <h4 style={{ marginBottom: '10px', color: '#333' }}>Pausas del Día</h4>
                    {historialData.pausas && historialData.pausas.length > 0 ? (
                      <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                          <thead>
                            <tr style={{ backgroundColor: '#f0f0f0' }}>
                              <th style={{ padding: '10px', textAlign: 'left', border: '1px solid #ddd' }}>Tipo</th>
                              <th style={{ padding: '10px', textAlign: 'left', border: '1px solid #ddd' }}>Hora Inicio</th>
                              <th style={{ padding: '10px', textAlign: 'left', border: '1px solid #ddd' }}>Hora Fin</th>
                              <th style={{ padding: '10px', textAlign: 'left', border: '1px solid #ddd' }}>Duración</th>
                              <th style={{ padding: '10px', textAlign: 'left', border: '1px solid #ddd' }}>Estado</th>
                            </tr>
                          </thead>
                          <tbody>
                            {historialData.pausas.map((pausa) => {
                              const duracion = pausa.HoraFin 
                                ? calcularMinutos(pausa.HoraInicio, pausa.HoraFin)
                                : pausa.DuracionMinutos || 0
                              
                              return (
                                <tr key={pausa.Id}>
                                  <td style={{ padding: '10px', border: '1px solid #ddd' }}>{pausa.TipoPausa}</td>
                                  <td style={{ padding: '10px', border: '1px solid #ddd' }}>
                                    {formatCostaRicaTime(pausa.HoraInicio)}
                                  </td>
                                  <td style={{ padding: '10px', border: '1px solid #ddd' }}>
                                    {pausa.HoraFin ? formatCostaRicaTime(pausa.HoraFin) : 'En curso'}
                                  </td>
                                  <td style={{ padding: '10px', border: '1px solid #ddd' }}>
                                    {duracion} minutos
                                  </td>
                                  <td style={{ padding: '10px', border: '1px solid #ddd' }}>
                                    {pausa.Activa ? (
                                      <span style={{ color: '#1976d2', fontWeight: 'bold' }}>Activa</span>
                                    ) : (
                                      <span style={{ color: '#666' }}>Finalizada</span>
                                    )}
                                  </td>
                                </tr>
                              )
                            })}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <p style={{ color: '#666', fontStyle: 'italic' }}>No hay pausas registradas para hoy</p>
                    )}
                  </div>
                </div>
              ) : (
                <p>Cargando historial...</p>
              )}
            </div>
            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => {
                  setShowHistorialModal(false)
                  setSelectedEmpleado(null)
                  setHistorialData(null)
                  setError('')
                }}
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal para Pausa */}
      {showPausaModal && selectedEmpleado && (
        <div className="modal-overlay" onClick={() => setShowPausaModal(false)}>
          <div className="modal-container" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Registrar Pausa - {selectedEmpleado.name}</h3>
              <button
                type="button"
                className="modal-close"
                onClick={() => {
                  setShowPausaModal(false)
                  setSelectedEmpleado(null)
                  setTipoPausa('')
                  setError('')
                }}
              >
                ×
              </button>
            </div>
            <div className="modal-body">
              <div style={{ marginBottom: '20px' }}>
                <label htmlFor="tipoPausa" style={{ display: 'block', marginBottom: '10px', fontWeight: 'bold' }}>
                  Tipo de Pausa *
                </label>
                <select
                  id="tipoPausa"
                  value={tipoPausa}
                  onChange={(e) => setTipoPausa(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    fontFamily: 'inherit',
                    fontSize: '16px'
                  }}
                >
                  <option value="">Seleccione un tipo de pausa</option>
                  <option value="Receso">Receso</option>
                  <option value="Supervisión">Supervisión</option>
                  <option value="Estrategia">Estrategia</option>
                </select>
              </div>
              {error && (
                <div className="alert alert-danger" style={{ marginTop: '10px', padding: '10px' }}>
                  {error}
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-outline"
                onClick={() => {
                  setShowPausaModal(false)
                  setSelectedEmpleado(null)
                  setTipoPausa('')
                  setError('')
                }}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleRegistrarPausa}
                disabled={!tipoPausa}
              >
                Registrar Pausa
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

const HomePanel = ({ displayName, sessionInfo }) => {
  const [pausaActiva, setPausaActiva] = useState(null)
  const [tiempoRestanteSegundos, setTiempoRestanteSegundos] = useState(3600)
  const [loading, setLoading] = useState(false)
  const [asistenciaId, setAsistenciaId] = useState(null)
  const [anuncios, setAnuncios] = useState([])
  const [proyectoEmpleado, setProyectoEmpleado] = useState(null)
  const [showAnuncioModal, setShowAnuncioModal] = useState(false)
  const [selectedAnuncio, setSelectedAnuncio] = useState(null)
  const [loadingAnuncios, setLoadingAnuncios] = useState(true)
  const user = sessionInfo?.user

  // Formatear tiempo restante
  const formatearTiempo = (segundos) => {
    const minutos = Math.floor(segundos / 60)
    const seg = segundos % 60
    return `${String(minutos).padStart(2, '0')}:${String(seg).padStart(2, '0')}`
  }

  // Función para verificar si un empleado tiene permiso aprobado en una fecha
  const tienePermisoAprobado = async (empleadoId, fecha) => {
    try {
      const { data: permisos } = await supabase
        .from('Permisos')
        .select('*')
        .eq('EmpleadoId', empleadoId)
        .eq('Estado', 'Aprobado')
        .lte('FechaInicio', fecha)
        .gte('FechaFin', fecha)
      
      return permisos && permisos.length > 0
    } catch (err) {
      console.error('Error al verificar permisos:', err)
      return false
    }
  }

  // Obtener o crear asistencia del día y proyecto del empleado
  useEffect(() => {
    if (!user?.email) return

    const obtenerAsistencia = async () => {
      try {
        // Buscar usuario por email (case-insensitive usando NormalizedEmail)
        const emailNormalizado = user.email.toUpperCase()
        const { data: usuario, error: errorUsuario } = await supabase
          .from('Usuarios')
          .select('EmpleadoId')
          .eq('NormalizedEmail', emailNormalizado)
          .single()

        if (errorUsuario || !usuario?.EmpleadoId) {
          console.error('Error al obtener empleado:', errorUsuario)
          return
        }

        // Obtener proyecto y horario del empleado
        const { data: empleado } = await supabase
          .from('Empleados')
          .select('ProyectoAsignado, HorarioLaboral')
          .eq('Id', usuario.EmpleadoId)
          .single()

        if (empleado) {
          setProyectoEmpleado(empleado.ProyectoAsignado)
        }

        // Obtener fecha actual en zona horaria de Costa Rica
        const hoy = getCostaRicaDateString()

        // Verificar si tiene permiso aprobado para hoy
        const tienePermiso = await tienePermisoAprobado(usuario.EmpleadoId, hoy)
        
        if (tienePermiso) {
          // Si tiene permiso aprobado, no crear asistencia
          return
        }

        // VERIFICAR SI ES DÍA LABORAL SEGÚN EL HORARIO
        if (!empleado?.HorarioLaboral) {
          // Si no tiene horario, no crear asistencia
          return
        }

        const esDiaLaboralHoy = esDiaLaboral(empleado.HorarioLaboral, hoy)
        if (!esDiaLaboralHoy) {
          // Si no es día laboral según el horario, no crear asistencia
          return
        }

        // Buscar asistencia de hoy
        const { data: asistencia, error: errorAsistencia } = await supabase
          .from('Asistencias')
          .select('Id, HoraEntrada')
          .eq('EmpleadoId', usuario.EmpleadoId)
          .eq('Fecha', hoy)
          .maybeSingle()

        if (asistencia) {
          setAsistenciaId(asistencia.Id)
          // La hora de entrada ya se registró al iniciar sesión, no se actualiza aquí
        } else {
          // Si no existe asistencia y es día laboral, crear el registro sin hora de entrada
          // La hora de entrada se registra solo al iniciar sesión
          const { data: nuevaAsistencia, error: errorCrear } = await supabase
            .from('Asistencias')
            .insert({
              EmpleadoId: usuario.EmpleadoId,
              Fecha: hoy,
              Estado: 'Presente'
            })
            .select('Id')
            .single()

          if (nuevaAsistencia && !errorCrear) {
            setAsistenciaId(nuevaAsistencia.Id)
          }
        }
      } catch (err) {
        console.error('Error al obtener asistencia:', err)
      }
    }

    obtenerAsistencia()
  }, [user?.email])

  // Cargar anuncios y suscribirse a cambios
  useEffect(() => {
    const cargarAnuncios = async () => {
      setLoadingAnuncios(true)
      const { data: anunciosData, error } = await supabase
        .from('Anuncios')
        .select('*')
        .order('FechaCreacion', { ascending: false })

      if (error) {
        console.error('Error al cargar anuncios:', error)
      } else if (anunciosData) {
        setAnuncios(anunciosData)
      }
      setLoadingAnuncios(false)
    }

    cargarAnuncios()

    // Suscribirse a cambios en tiempo real
    const channel = supabase
      .channel('anuncios-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'Anuncios',
        },
        () => {
          // Recargar anuncios cuando hay cambios
          cargarAnuncios()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  // Filtrar anuncios según el proyecto del empleado
  const anunciosFiltrados = anuncios.filter((anuncio) => {
    // Mostrar anuncios globales siempre
    if (anuncio.EsGlobal) return true
    // Mostrar anuncios del proyecto del empleado
    if (anuncio.ProyectoAsignado && proyectoEmpleado) {
      return anuncio.ProyectoAsignado === proyectoEmpleado
    }
    // Si no tiene proyecto asignado, mostrar solo globales
    return false
  })

  // Función para obtener resumen corto
  const obtenerResumen = (texto, maxLength = 80) => {
    if (!texto) return ''
    if (texto.length <= maxLength) return texto
    return texto.substring(0, maxLength) + '...'
  }

  // Formatear fecha
  const formatearFecha = (fecha) => {
    return formatFechaCR(fecha)
  }

  // Abrir modal de ver anuncio
  const handleVerAnuncio = (anuncio) => {
    setSelectedAnuncio(anuncio)
    setShowAnuncioModal(true)
  }

  // Efecto para suscribirse a cambios en tiempo real y cargar pausa activa
  useEffect(() => {
    if (!asistenciaId) return

    // Obtener pausa activa inicial desde la base de datos
    const cargarPausaActiva = async () => {
      const { data, error } = await supabase
        .from('Pausas')
        .select('*')
        .eq('AsistenciaId', asistenciaId)
        .eq('Activa', true)
        .eq('TipoPausa', 'Mi tiempo')
        .order('HoraInicio', { ascending: false })
        .limit(1)
        .single()

      if (data && !error) {
        // Normalizar valores null/undefined
        let tiempoRestante = data.TiempoRestanteSegundos
        
        // Si no hay tiempo guardado o es inválido, calcular desde HoraInicio
        if (!tiempoRestante || tiempoRestante <= 0) {
          const ahora = getCostaRicaTime()
          const inicio = toCostaRicaDate(data.HoraInicio) || new Date(data.HoraInicio)
          const transcurrido = Math.floor((ahora - inicio) / 1000)
          const tiempoPausado = data.TiempoPausadoAcumulado || 0
          const tiempoActivo = transcurrido - tiempoPausado
          tiempoRestante = Math.max(0, 3600 - tiempoActivo)
          
          // Guardar el tiempo calculado en la base de datos
          await supabase
            .from('Pausas')
            .update({ TiempoRestanteSegundos: tiempoRestante })
            .eq('Id', data.Id)
        }

        const pausaNormalizada = {
          ...data,
          Pausada: data.Pausada === true,
          TiempoRestanteSegundos: tiempoRestante,
        }
        setPausaActiva(pausaNormalizada)
        setTiempoRestanteSegundos(tiempoRestante)
      } else if (error && error.code !== 'PGRST116') {
        console.error('Error al cargar pausa activa:', error)
      }
    }

    cargarPausaActiva()

    // Suscripción a cambios en tiempo real
    const channel = supabase
      .channel('pausas-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'Pausas',
          filter: `AsistenciaId=eq.${asistenciaId}`,
        },
        (payload) => {
          if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
            const nuevaPausa = payload.new
            if (nuevaPausa.Activa && nuevaPausa.TipoPausa === 'Mi tiempo') {
              // Normalizar valores
              const pausaNormalizada = {
                ...nuevaPausa,
                Pausada: nuevaPausa.Pausada === true,
                TiempoRestanteSegundos: nuevaPausa.TiempoRestanteSegundos || 3600,
              }
              setPausaActiva(pausaNormalizada)
              if (pausaNormalizada.TiempoRestanteSegundos > 0) {
                setTiempoRestanteSegundos(pausaNormalizada.TiempoRestanteSegundos)
              }
            } else {
              setPausaActiva(null)
              setTiempoRestanteSegundos(3600)
            }
          } else if (payload.eventType === 'DELETE') {
            setPausaActiva(null)
            setTiempoRestanteSegundos(3600)
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [asistenciaId])

  // Efecto para actualizar el contador calculando desde HoraInicio (base de datos como fuente de verdad)
  useEffect(() => {
    if (!pausaActiva || !pausaActiva.Activa) {
      setTiempoRestanteSegundos(3600)
      return
    }

    // Si está pausada, mostrar el tiempo guardado cuando se pausó
    const estaPausada = pausaActiva.Pausada === true
    if (estaPausada) {
      const tiempoGuardado = pausaActiva.TiempoRestanteSegundos || 3600
      setTiempoRestanteSegundos(tiempoGuardado)
      return
    }

    // CALCULAR el tiempo restante desde la BD, no desde el cliente
    const calcularTiempoRestante = () => {
      const ahora = getCostaRicaTime()
      const inicio = toCostaRicaDate(pausaActiva.HoraInicio) || new Date(pausaActiva.HoraInicio)
      const tiempoTranscurrido = Math.floor((ahora - inicio) / 1000) // segundos transcurridos
      const tiempoPausado = pausaActiva.TiempoPausadoAcumulado || 0
      const tiempoActivo = tiempoTranscurrido - tiempoPausado // tiempo que ha estado activa
      const tiempoRestante = Math.max(0, 3600 - tiempoActivo) // 60 minutos = 3600 segundos
      
      return tiempoRestante
    }

    // Actualizar el tiempo cada segundo CALCULÁNDOLO desde la BD
    const actualizarTiempo = () => {
      const tiempoRestante = calcularTiempoRestante()
      setTiempoRestanteSegundos(tiempoRestante)

      // Guardar en BD solo cada 5 segundos para reducir carga
      if (tiempoRestante % 5 === 0) {
        supabase
          .from('Pausas')
          .update({ TiempoRestanteSegundos: tiempoRestante })
          .eq('Id', pausaActiva.Id)
          .then(({ error }) => {
            if (error) {
              console.error('Error al guardar tiempo en BD:', error)
            }
          })
      }

      if (tiempoRestante <= 0) {
        finalizarPausa(pausaActiva.Id)
      }
    }

    // Calcular inmediatamente
    actualizarTiempo()

    // Actualizar cada segundo
    const intervalo = setInterval(actualizarTiempo, 1000)

    return () => {
      clearInterval(intervalo)
    }
  }, [pausaActiva?.Id, pausaActiva?.Activa, pausaActiva?.Pausada, pausaActiva?.HoraInicio, pausaActiva?.TiempoPausadoAcumulado])

  // Iniciar o reanudar pausa
  const iniciarPausa = async () => {
    if (!asistenciaId) {
      alert('No se pudo obtener la asistencia. Por favor, intenta de nuevo.')
      return
    }

    setLoading(true)
    try {
      // Si hay una pausa activa pero pausada, reanudarla
      if (pausaActiva && pausaActiva.Pausada) {
        const ahora = getCostaRicaTime()
        const ultimaPausa = pausaActiva.UltimaPausa 
          ? (toCostaRicaDate(pausaActiva.UltimaPausa) || new Date(pausaActiva.UltimaPausa))
          : null
        
        // Calcular tiempo pausado acumulado
        let tiempoPausadoAcumulado = pausaActiva.TiempoPausadoAcumulado || 0
        if (ultimaPausa) {
          const tiempoPausadoAhora = Math.floor((ahora - ultimaPausa) / 1000)
          tiempoPausadoAcumulado += tiempoPausadoAhora
        }

        // Usar el tiempo restante que se guardó al pausar
        const tiempoRestante = pausaActiva.TiempoRestanteSegundos || 3600

        const { data, error } = await supabase
          .from('Pausas')
          .update({
            Pausada: false,
            UltimaPausa: null,
            TiempoPausadoAcumulado: tiempoPausadoAcumulado,
            TiempoRestanteSegundos: tiempoRestante,
          })
          .eq('Id', pausaActiva.Id)
          .select()
          .single()

        if (error) throw error
        
        // Normalizar valores
        const pausaNormalizada = {
          ...data,
          Pausada: false,
          TiempoRestanteSegundos: tiempoRestante,
        }
        setPausaActiva(pausaNormalizada)
        setTiempoRestanteSegundos(tiempoRestante)
      } else if (!pausaActiva) {
        // Crear nueva pausa
        const tiempoInicial = 3600
        const { data, error } = await supabase
          .from('Pausas')
          .insert({
            AsistenciaId: asistenciaId,
            TipoPausa: 'Mi tiempo',
            HoraInicio: getCostaRicaTime().toISOString(),
            Activa: true,
            TiempoRestanteSegundos: tiempoInicial,
            Pausada: false,
            TiempoPausadoAcumulado: 0,
          })
          .select()
          .single()

        if (error) throw error
        
        // Normalizar valores
        const pausaNormalizada = {
          ...data,
          Pausada: false,
          TiempoRestanteSegundos: tiempoInicial,
        }
        setPausaActiva(pausaNormalizada)
        setTiempoRestanteSegundos(tiempoInicial)
      }
    } catch (err) {
      console.error('Error al iniciar/reanudar pausa:', err)
      alert('Error: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  // Pausar pausa
  const pausarPausa = async () => {
    if (!pausaActiva || pausaActiva.Pausada === true) {
      return
    }

    setLoading(true)
    try {
      // Calcular tiempo restante ACTUAL desde la BD (en zona horaria de Costa Rica)
      const ahora = getCostaRicaTime()
      const inicio = toCostaRicaDate(pausaActiva.HoraInicio) || new Date(pausaActiva.HoraInicio)
      const transcurrido = Math.floor((ahora - inicio) / 1000)
      const tiempoPausado = pausaActiva.TiempoPausadoAcumulado || 0
      const tiempoActivo = transcurrido - tiempoPausado
      const tiempoRestanteActual = Math.max(0, 3600 - tiempoActivo)

      const { data, error } = await supabase
        .from('Pausas')
        .update({
          Pausada: true,
          UltimaPausa: ahora.toISOString(),
          TiempoRestanteSegundos: tiempoRestanteActual,
        })
        .eq('Id', pausaActiva.Id)
        .select()
        .single()

      if (error) throw error
      
      // Normalizar valores
      const pausaNormalizada = {
        ...data,
        Pausada: true,
        TiempoRestanteSegundos: tiempoRestanteActual,
      }
      setPausaActiva(pausaNormalizada)
      setTiempoRestanteSegundos(tiempoRestanteActual)
    } catch (err) {
      console.error('Error al pausar:', err)
      alert('Error al pausar: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  // Finalizar pausa
  const finalizarPausa = async (pausaId) => {
    if (!pausaId) return

    try {
      const fin = getCostaRicaTime()
      const { data: pausa } = await supabase
        .from('Pausas')
        .select('HoraInicio, TiempoPausadoAcumulado')
        .eq('Id', pausaId)
        .single()

      if (pausa) {
        const inicio = toCostaRicaDate(pausa.HoraInicio) || new Date(pausa.HoraInicio)
        const tiempoTotal = Math.floor((fin - inicio) / 1000)
        const tiempoActivo = tiempoTotal - (pausa.TiempoPausadoAcumulado || 0)
        const duracionMinutos = Math.floor(tiempoActivo / 60)

        const { error } = await supabase
          .from('Pausas')
          .update({
            Activa: false,
            HoraFin: fin.toISOString(),
            DuracionMinutos: duracionMinutos,
            TiempoRestanteSegundos: 0,
            Pausada: false,
          })
          .eq('Id', pausaId)

        if (error) throw error
        setPausaActiva(null)
        setTiempoRestanteSegundos(3600)
      }
    } catch (err) {
      console.error('Error al finalizar pausa:', err)
    }
  }

  return (
    <div className="section-stack">
      <div className="panel-header">
        <div>
          <p className="eyebrow">Panel Principal</p>
          <h2>Bienvenido, {displayName}.</h2>
          <p className="page-subtitle">
            Gestiona tus notificaciones, pausas y productividad desde un solo lugar.
          </p>
        </div>
      </div>

      <div className="home-grid">
        <article className="hero-card">
          <div className="hero-icon" aria-hidden="true">
            🕒
          </div>
          <div>
            <p className="card-label">Control de Pausa</p>
            <p className="pause-duration">{formatearTiempo(tiempoRestanteSegundos)}</p>
            <p className="card-description">
              {pausaActiva
                ? pausaActiva.Pausada
                  ? 'Pausa en pausa - Presiona reanudar para continuar'
                  : 'Tu receso está en curso'
                : 'Presiona iniciar para comenzar tu receso'}
            </p>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', flexDirection: 'column' }}>
            {pausaActiva && pausaActiva.Activa && pausaActiva.Pausada !== true ? (
              <button
                type="button"
                className="btn btn-primary pill"
                onClick={pausarPausa}
                disabled={loading || !asistenciaId}
              >
                {loading ? 'Pausando...' : 'Pausar'}
              </button>
            ) : (
              <button
                type="button"
                className="btn btn-primary pill"
                onClick={iniciarPausa}
                disabled={loading || !asistenciaId}
              >
                {loading
                  ? 'Iniciando...'
                  : pausaActiva && pausaActiva.Pausada === true
                    ? 'Reanudar'
                    : 'Iniciar Receso'}
              </button>
            )}
          </div>
        </article>

        <article className="section-card notifications-simple">
          <div className="notifications-header">
            <div className="notifications-title">
              <span className="icon">📬</span>
              <p className="card-label">Bandeja de Entrada</p>
            </div>
            <span className="badge badge-soft">Actualizado</span>
          </div>
          {loadingAnuncios ? (
            <p>Cargando anuncios...</p>
          ) : anunciosFiltrados.length === 0 ? (
            <p>No hay anuncios disponibles.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxHeight: '400px', overflowY: 'auto' }}>
              {anunciosFiltrados.map((anuncio) => (
                <div 
                  key={anuncio.Id} 
                  style={{ 
                    padding: '0.75rem', 
                    backgroundColor: '#f8fafc', 
                    borderRadius: '8px',
                    border: '1px solid #e2e8f0'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                    <div style={{ flex: 1 }}>
                      <h4 style={{ margin: 0, marginBottom: '0.25rem', fontSize: '0.875rem', fontWeight: 600, color: '#0f172a' }}>
                        {anuncio.Titulo}
                      </h4>
                      <p style={{ margin: 0, fontSize: '0.75rem', color: '#64748b', lineHeight: '1.4' }}>
                        {obtenerResumen(anuncio.Cuerpo, 80)}
                      </p>
                    </div>
                    {anuncio.Destacado && (
                      <span className="badge badge-soft" style={{ fontSize: '0.7rem', marginLeft: '0.5rem' }}>
                        Destacado
                      </span>
                    )}
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.5rem' }}>
                    <small style={{ color: '#94a3b8', fontSize: '0.7rem' }}>
                      {formatearFecha(anuncio.FechaCreacion)} • {anuncio.EsGlobal ? 'Global' : (anuncio.ProyectoAsignado || 'General')}
                    </small>
                    <button 
                      type="button" 
                      className="btn btn-outline btn-small"
                      onClick={() => handleVerAnuncio(anuncio)}
                      style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem' }}
                    >
                      Ver más
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </article>
      </div>

      {/* Modal de ver anuncio completo */}
      {showAnuncioModal && selectedAnuncio && (
        <div className="modal-overlay" onClick={() => setShowAnuncioModal(false)}>
          <div className="modal-container" style={{ width: '800px', maxHeight: '90vh' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{selectedAnuncio.Titulo}</h3>
              <button 
                type="button" 
                className="modal-close-btn"
                onClick={() => setShowAnuncioModal(false)}
                aria-label="Cerrar"
              >
                ✕
              </button>
            </div>
            
            <div className="modal-body">
              <div style={{ marginBottom: '1rem' }}>
                <p style={{ color: '#64748b', fontSize: '0.875rem', marginBottom: '0.5rem' }}>
                  <strong>Autor:</strong> {selectedAnuncio.Autor || 'Sistema'} | 
                  <strong> Fecha:</strong> {formatearFecha(selectedAnuncio.FechaCreacion)} | 
                  <strong> Alcance:</strong> {selectedAnuncio.EsGlobal ? 'Global' : (selectedAnuncio.ProyectoAsignado || 'General')}
                </p>
                {selectedAnuncio.Destacado && (
                  <span className="badge badge-soft" style={{ marginBottom: '1rem', display: 'inline-block' }}>
                    Destacado
                  </span>
                )}
              </div>
              <div style={{ whiteSpace: 'pre-wrap', lineHeight: '1.6', color: '#334155' }}>
                {selectedAnuncio.Cuerpo}
              </div>
              {selectedAnuncio.Documento && (
                <div style={{ marginTop: '1rem', padding: '0.75rem', backgroundColor: '#f1f5f9', borderRadius: '8px' }}>
                  <strong>Documento:</strong> {selectedAnuncio.Documento}
                </div>
              )}
            </div>
            
            <div className="modal-footer">
              <button 
                type="button" 
                className="btn btn-primary"
                onClick={() => setShowAnuncioModal(false)}
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

const EmployeesPanel = () => {
  const [employees, setEmployees] = useState([])
  const [loading, setLoading] = useState(true)
  const [allEmployeesData, setAllEmployeesData] = useState([])

  useEffect(() => {
    const cargarEmpleados = async () => {
      // Cargar datos básicos para la tabla
      const { data, error } = await supabase
        .from('Empleados')
        .select('Id, NombreCompleto, Cedula, Puesto, ProyectoAsignado, Activo')
        .order('NombreCompleto')

      if (error) {
        console.error('Error al cargar empleados:', error)
      } else if (data) {
        setEmployees(data)
      }
      setLoading(false)

      // Cargar todos los datos para exportación
      const { data: allData, error: allError } = await supabase
        .from('Empleados')
        .select(`
          Id,
          NombreCompleto,
          Cedula,
          FechaNacimiento,
          Puesto,
          FechaIngreso,
          Contacto,
          Activo,
          ProyectoAsignado,
          HorarioLaboral,
          ContactoEmergencia,
          NombreContactoEmergencia,
          Extranjero,
          PermisoTrabajo,
          SupervisorId
        `)
        .order('NombreCompleto')

      if (!allError && allData) {
        setAllEmployeesData(allData)
      }
    }

    cargarEmpleados()
  }, [])

  // Función para formatear fecha (usa GMT-6)
  const formatearFecha = (fecha) => {
    if (!fecha) return ''
    try {
      const date = new Date(fecha)
      if (isNaN(date.getTime())) return ''
      
      // Usar toLocaleDateString con timeZone GMT-6 para obtener fecha correcta
      const fechaParts = date.toLocaleDateString('en-US', {
        timeZone: 'Etc/GMT+6',
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      }).split('/')
      
      // fechaParts[0] = mes, fechaParts[1] = día, fechaParts[2] = año
      // Formato: DD/MM/YYYY
      return `${fechaParts[1]}/${fechaParts[0]}/${fechaParts[2]}`
    } catch {
      return ''
    }
  }

  // Función para formatear horario laboral
  const formatearHorario = (horario) => {
    if (!horario) return ''
    try {
      const horarioObj = typeof horario === 'string' ? JSON.parse(horario) : horario
      if (!horarioObj || typeof horarioObj !== 'object') return ''
      
      // Intentar obtener el rango de horas de un día típico (lunes a viernes)
      const diasLaborales = ['lunes', 'martes', 'miércoles', 'jueves', 'viernes']
      
      for (const dia of diasLaborales) {
        const horarioDia = horarioObj[dia]
        if (horarioDia && typeof horarioDia === 'object') {
          // Obtener todas las horas laborales (full o half)
          const horas = Object.keys(horarioDia)
            .filter(hora => {
              const estado = horarioDia[hora]
              return estado === 'full' || estado === 'half'
            })
            .sort()
          
          if (horas.length > 0) {
            const primeraHora = horas[0]
            const ultimaHora = horas[horas.length - 1]
            
            // Convertir formato "HH:00" a "HH:00" o mantener como está
            // Si la última hora es "18:00", buscar si hay una siguiente hora completa
            let horaFin = ultimaHora
            const [horaNum, minutoNum] = ultimaHora.split(':').map(Number)
            // Si es una hora completa, agregar 1 hora para el fin
            if (horarioDia[ultimaHora] === 'full') {
              const siguienteHora = `${String(horaNum + 1).padStart(2, '0')}:00`
              if (horarioDia[siguienteHora] === 'empty' || !horarioDia[siguienteHora]) {
                horaFin = siguienteHora
              }
            }
            
            return `${primeraHora}-${horaFin}`
          }
        }
      }
      
      return ''
    } catch {
      return ''
    }
  }

  // Función para obtener nombre del supervisor
  const obtenerNombreSupervisor = async (supervisorId) => {
    if (!supervisorId) return 'Sin supervisor'
    try {
      const { data } = await supabase
        .from('Empleados')
        .select('NombreCompleto')
        .eq('Id', supervisorId)
        .single()
      return data?.NombreCompleto || 'Sin supervisor'
    } catch {
      return 'Sin supervisor'
    }
  }

  // Función para exportar a Excel
  const exportarExcel = async () => {
    if (allEmployeesData.length === 0) {
      alert('No hay datos para exportar')
      return
    }

    try {
      // Preparar datos con todos los campos
      const datosExportar = await Promise.all(
        allEmployeesData.map(async (emp) => {
          const supervisorNombre = await obtenerNombreSupervisor(emp.SupervisorId)
          return {
            nombreCompleto: emp.NombreCompleto || '',
            cedula: emp.Cedula || '',
            fechaNacimiento: formatearFecha(emp.FechaNacimiento),
            puesto: emp.Puesto || '',
            fechaIngreso: formatearFecha(emp.FechaIngreso),
            contacto: emp.Contacto || '',
            activo: emp.Activo ? 'Sí' : 'No',
            proyectoAsignado: emp.ProyectoAsignado || '',
            horarioLaboral: formatearHorario(emp.HorarioLaboral),
            contactoEmergencia: emp.ContactoEmergencia || '',
            nombreContactoEmergencia: emp.NombreContactoEmergencia || '',
            documento: '', // Campo no existe en BD, dejar vacío
            extranjero: emp.Extranjero ? 'Sí' : 'No',
            permisoTrabajo: emp.PermisoTrabajo || '',
            supervisorId: supervisorNombre
          }
        })
      )

      // Crear workbook
      const wb = XLSX.utils.book_new()
      const ws = XLSX.utils.json_to_sheet(datosExportar)

      // Obtener el rango de celdas
      const range = XLSX.utils.decode_range(ws['!ref'] || 'A1')
      
      // Estilos para encabezados (fila 1)
      const headerStyle = {
        fill: {
          fgColor: { rgb: '1E3A8A' } // Azul oscuro
        },
        font: {
          bold: true,
          color: { rgb: 'FFFFFF' }, // Texto blanco
          sz: 11
        },
        alignment: {
          horizontal: 'center',
          vertical: 'center',
          wrapText: true
        },
        border: {
          top: { style: 'thin', color: { rgb: '000000' } },
          bottom: { style: 'thin', color: { rgb: '000000' } },
          left: { style: 'thin', color: { rgb: '000000' } },
          right: { style: 'thin', color: { rgb: '000000' } }
        }
      }

      // Aplicar estilos a encabezados
      for (let col = range.s.c; col <= range.e.c; col++) {
        const cellAddress = XLSX.utils.encode_cell({ r: 0, c: col })
        if (!ws[cellAddress]) continue
        
        ws[cellAddress].s = headerStyle
      }

      // Estilos para celdas de datos
      const dataStyle = {
        border: {
          top: { style: 'thin', color: { rgb: 'CCCCCC' } },
          bottom: { style: 'thin', color: { rgb: 'CCCCCC' } },
          left: { style: 'thin', color: { rgb: 'CCCCCC' } },
          right: { style: 'thin', color: { rgb: 'CCCCCC' } }
        },
        alignment: {
          vertical: 'center',
          wrapText: true
        },
        font: {
          sz: 10
        }
      }

      // Aplicar estilos y bordes a todas las celdas de datos
      for (let row = range.s.r + 1; row <= range.e.r; row++) {
        for (let col = range.s.c; col <= range.e.c; col++) {
          const cellAddress = XLSX.utils.encode_cell({ r: row, c: col })
          if (!ws[cellAddress]) {
            ws[cellAddress] = { t: 's', v: '' }
          }
          
          // Aplicar estilo de datos
          ws[cellAddress].s = {
            ...dataStyle,
            fill: {
              fgColor: { rgb: row % 2 === 0 ? 'F8F9FA' : 'FFFFFF' } // Filas alternadas
            }
          }
        }
      }

      // Establecer ancho de columnas
      const columnWidths = [
        { wch: 25 }, // nombreCompleto
        { wch: 15 }, // cedula
        { wch: 15 }, // fechaNacimiento
        { wch: 20 }, // puesto
        { wch: 15 }, // fechaIngreso
        { wch: 20 }, // contacto
        { wch: 10 }, // activo
        { wch: 20 }, // proyectoAsignado
        { wch: 15 }, // horarioLaboral
        { wch: 18 }, // contactoEmergencia
        { wch: 25 }, // nombreContactoEmergencia
        { wch: 15 }, // documento
        { wch: 12 }, // extranjero
        { wch: 18 }, // permisoTrabajo
        { wch: 20 }  // supervisorId
      ]
      ws['!cols'] = columnWidths

      // Establecer altura de fila de encabezado
      ws['!rows'] = [{ hpt: 25 }]

      // Agregar hoja al workbook
      XLSX.utils.book_append_sheet(wb, ws, 'Empleados')

      // Generar archivo (usar fecha en GMT-6)
      const fecha = getCostaRicaDateString()
      XLSX.writeFile(wb, `Lista_de_Empleados_${fecha}.xlsx`)
    } catch (error) {
      console.error('Error al exportar a Excel:', error)
      alert('Error al exportar a Excel: ' + error.message)
    }
  }

  // Función para exportar a PDF
  const exportarPDF = async () => {
    if (allEmployeesData.length === 0) {
      alert('No hay datos para exportar')
      return
    }

    try {
      const doc = new jsPDF('landscape', 'mm', 'a4')
      
      // Título
      doc.setFontSize(18)
      doc.text('Lista de Empleados', 14, 15)

      // Preparar datos para la tabla
      const datosTabla = await Promise.all(
        allEmployeesData.map(async (emp) => {
          const supervisorNombre = await obtenerNombreSupervisor(emp.SupervisorId)
          return [
            emp.NombreCompleto || '',
            emp.Cedula || '',
            formatearFecha(emp.FechaNacimiento),
            emp.Puesto || '',
            formatearFecha(emp.FechaIngreso),
            emp.Contacto || '',
            emp.Activo ? 'Sí' : 'No',
            emp.ProyectoAsignado || '',
            formatearHorario(emp.HorarioLaboral),
            emp.ContactoEmergencia || '',
            emp.NombreContactoEmergencia || '',
            '', // documento
            emp.Extranjero ? 'Sí' : 'No',
            emp.PermisoTrabajo || '',
            supervisorNombre
          ]
        })
      )

      // Configurar tabla
      doc.autoTable({
        head: [[
          'nombreCompleto',
          'cedula',
          'fechaNacimiento',
          'puesto',
          'fechaIngreso',
          'contacto',
          'activo',
          'proyectoAsignado',
          'horarioLaboral',
          'contactoEmergencia',
          'nombreContactoEmergencia',
          'documento',
          'extranjero',
          'permisoTrabajo',
          'supervisorId'
        ]],
        body: datosTabla,
        startY: 25,
        styles: {
          fontSize: 7,
          cellPadding: 2,
          overflow: 'linebreak',
          textColor: [0, 0, 0]
        },
        headStyles: {
          fillColor: [25, 42, 86], // Azul oscuro como en el diseño
          textColor: [255, 255, 255],
          fontStyle: 'bold',
          fontSize: 8,
          halign: 'left'
        },
        bodyStyles: {
          fillColor: [255, 255, 255],
          textColor: [0, 0, 0]
        },
        alternateRowStyles: {
          fillColor: [255, 255, 255]
        },
        margin: { top: 25, right: 14, bottom: 14, left: 14 },
        tableWidth: 'wrap',
        columnStyles: {
          0: { cellWidth: 35 }, // nombreCompleto
          1: { cellWidth: 20 }, // cedula
          2: { cellWidth: 25 }, // fechaNacimiento
          3: { cellWidth: 25 }, // puesto
          4: { cellWidth: 25 }, // fechaIngreso
          5: { cellWidth: 25 }, // contacto
          6: { cellWidth: 15 }, // activo
          7: { cellWidth: 25 }, // proyectoAsignado
          8: { cellWidth: 20 }, // horarioLaboral
          9: { cellWidth: 25 }, // contactoEmergencia
          10: { cellWidth: 35 }, // nombreContactoEmergencia
          11: { cellWidth: 20 }, // documento
          12: { cellWidth: 18 }, // extranjero
          13: { cellWidth: 25 }, // permisoTrabajo
          14: { cellWidth: 30 }  // supervisorId
        }
      })

      // Guardar PDF (usar fecha en GMT-6)
      const fecha = getCostaRicaDateString()
      doc.save(`Lista_de_Empleados_${fecha}.pdf`)
    } catch (error) {
      console.error('Error al exportar a PDF:', error)
      alert('Error al exportar a PDF: ' + error.message)
    }
  }

  return (
    <div className="section-stack">
      <div className="panel-header">
        <div className="panel-title">
          <span className="title-icon" aria-hidden="true">
            🗂️
          </span>
          <div>
            <p className="eyebrow">Gestión de Empleados</p>
            <h2>Administra tus colaboradores y asignaciones</h2>
            <p className="page-subtitle">
              Actualiza información personal, proyectos y estados desde una sola vista.
            </p>
          </div>
        </div>
        <div className="panel-header-meta">
          <button 
            type="button" 
            className="btn btn-outline btn-small"
            onClick={exportarExcel}
            disabled={loading || allEmployeesData.length === 0}
          >
            Excel
          </button>
          <button 
            type="button" 
            className="btn btn-outline btn-small"
            onClick={exportarPDF}
            disabled={loading || allEmployeesData.length === 0}
          >
            PDF
          </button>
          <button type="button" className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <IconPlus size={18} />
            Nuevo
          </button>
        </div>
      </div>

      <div className="section-card filters-card">
        <div className="filter-row">
          <input type="text" placeholder="Buscar por nombre..." />
          <input type="text" placeholder="Puesto..." />
          <input type="text" placeholder="Proyecto..." />
          <select defaultValue="">
            <option value="">Sin agrupar</option>
            <option value="area">Departamento</option>
            <option value="estado">Estado</option>
          </select>
        </div>
      </div>

      <div className="section-card table-card">
        <div className="split-heading">
          <h3>Listado general</h3>
          <span className="badge badge-soft">
            {employees.length} activos
          </span>
        </div>
        <div className="table-scroll">
          <table className="data-table">
            <thead>
              <tr>
                <th>Nombre completo</th>
                <th>Cédula</th>
                <th>Puesto</th>
                <th>Proyecto asignado</th>
                <th>Activo</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="5" style={{ textAlign: 'center', padding: '2rem' }}>
                    Cargando empleados...
                  </td>
                </tr>
              ) : employees.length === 0 ? (
                <tr>
                  <td colSpan="5" style={{ textAlign: 'center', padding: '2rem' }}>
No hay empleados registrados
                  </td>
                </tr>
              ) : (
                employees.map((employee) => (
                  <tr key={employee.Id}>
                    <td>{employee.NombreCompleto}</td>
                    <td>{employee.Cedula}</td>
                    <td>{employee.Puesto}</td>
                    <td>{employee.ProyectoAsignado || '-'}</td>
                    <td>
                      <span className="status-pill">
                        <span
                          className={`status-dot ${
                            employee.Activo ? 'status-success' : 'status-danger'
                          }`}
                          aria-hidden="true"
                        />
                        {employee.Activo ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

const UsersPanel = () => {
  const [showForm, setShowForm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [supervisores, setSupervisores] = useState([])
  const [usuarios, setUsuarios] = useState([])
  const [showScheduleModal, setShowScheduleModal] = useState(false)
  const [scheduleData, setScheduleData] = useState(null)
  const [showResetPasswordModal, setShowResetPasswordModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showEditScheduleModal, setShowEditScheduleModal] = useState(false)
  const [selectedUser, setSelectedUser] = useState(null)
  const [newPassword, setNewPassword] = useState('')
  const [editFormData, setEditFormData] = useState(null)
  const [editScheduleData, setEditScheduleData] = useState(null)
  const [autoSaving, setAutoSaving] = useState(false)
  const [lastSaved, setLastSaved] = useState(null)
  const editContratoInputRef = useRef(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterProyecto, setFilterProyecto] = useState('')
  const [proyectos, setProyectos] = useState([])
  const [roles, setRoles] = useState([])
  const [rolesSeleccionados, setRolesSeleccionados] = useState([])
  const [editRolesSeleccionados, setEditRolesSeleccionados] = useState([])
  const [showRolesDropdown, setShowRolesDropdown] = useState(false)
  const [showEditRolesDropdown, setShowEditRolesDropdown] = useState(false)
  const [formData, setFormData] = useState({
    // Datos de Usuario
    email: '',
    password: '',
    phoneNumber: '',
    // Datos de Empleado (compartidos)
    nombreCompleto: '',
    cedula: '',
    // Datos adicionales de Empleado
    fechaNacimiento: '',
    puesto: '',
    fechaIngreso: '',
    proyectoAsignado: '',
    proyectoSupervisado: '',
    horarioLaboral: '',
    contactoEmergencia: '',
    nombreContactoEmergencia: '',
    supervisorId: '',
    extranjero: false,
    permisoTrabajo: '',
    contrato: null,
  })
  const contratoInputRef = useRef(null)

  // Cargar supervisores, usuarios y roles
  useEffect(() => {
    const cargarDatos = async () => {
      // Cargar roles disponibles
      const { data: rolesData } = await supabase
        .from('Roles')
        .select('Id, Name')
        .order('Name')

      if (rolesData) {
        setRoles(rolesData)
      }

      // Cargar supervisores para el select (solo usuarios con rol de supervisor)
      // Primero obtener el ID del rol de supervisor
      const { data: rolSupervisor } = await supabase
        .from('Roles')
        .select('Id')
        .or('Name.eq.Supervisor de Personal,NormalizedName.eq.SUPERVISOR DE PERSONAL')
        .maybeSingle()

      if (rolSupervisor) {
        // Obtener todos los usuarios con rol de supervisor
        const { data: usuariosSupervisores } = await supabase
          .from('UsuariosRoles')
          .select('UserId, Usuarios:UserId (EmpleadoId)')
          .eq('RoleId', rolSupervisor.Id)

        if (usuariosSupervisores) {
          // Extraer los EmpleadoId de los usuarios supervisores
          const empleadosIds = usuariosSupervisores
            .map(us => {
              const usuario = Array.isArray(us.Usuarios) ? us.Usuarios[0] : us.Usuarios
              return usuario?.EmpleadoId
            })
            .filter(Boolean)

          if (empleadosIds.length > 0) {
            // Cargar los empleados que son supervisores
            const { data: supervisoresData } = await supabase
              .from('Empleados')
              .select('Id, NombreCompleto')
              .in('Id', empleadosIds)
              .eq('Activo', true)
              .order('NombreCompleto')

            if (supervisoresData) {
              setSupervisores(supervisoresData)
            }
          } else {
            setSupervisores([])
          }
        } else {
          setSupervisores([])
        }
      } else {
        setSupervisores([])
      }

      // Cargar usuarios con sus empleados y roles
      const { data: usuariosData } = await supabase
        .from('Usuarios')
        .select(`
          Id, 
          Email, 
          NombreCompleto, 
          Cedula, 
          Activo, 
          EmpleadoId,
          Empleados:EmpleadoId (Id, NombreCompleto, Puesto, ProyectoAsignado, ProyectoSupervisado)
        `)
        .order('NombreCompleto')

      if (usuariosData) {
        // Cargar roles de cada usuario
        const usuariosConRoles = await Promise.all(
          usuariosData.map(async (usuario) => {
            const { data: rolesUsuario } = await supabase
              .from('UsuariosRoles')
              .select('RoleId, Roles:RoleId (Id, Name)')
              .eq('UserId', usuario.Id)
            
            return {
              ...usuario,
              Roles: rolesUsuario?.map(ur => ur.Roles).filter(Boolean) || []
            }
          })
        )

        setUsuarios(usuariosConRoles)
        
        // Cargar proyectos desde la tabla Proyectos
        const { data: proyectosData, error: proyectosError } = await supabase
          .from('Proyectos')
          .select('*')
          .eq('Activo', true)
          .order('Nombre')

        if (proyectosData && !proyectosError) {
          setProyectos(proyectosData.map(p => p.Nombre))
        } else if (proyectosError && proyectosError.code !== 'PGRST116') {
          console.warn('Error al cargar proyectos:', proyectosError)
          // Si no existe la tabla, intentar cargar desde empleados como fallback
          const { data: empleadosData } = await supabase
            .from('Empleados')
            .select('ProyectoAsignado, ProyectoSupervisado')
            .or('ProyectoAsignado.not.is.null,ProyectoSupervisado.not.is.null')

          if (empleadosData) {
            const proyectosUnicos = [...new Set(
              empleadosData
                .flatMap(e => [e.ProyectoAsignado, e.ProyectoSupervisado])
                .filter(p => p && p.trim() !== '')
            )].sort()
            setProyectos(proyectosUnicos)
          }
        }
      }
    }

    cargarDatos()

    // Suscribirse a cambios en la tabla Proyectos
    const subscription = supabase
      .channel('proyectos-changes-users')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'Proyectos' },
        async () => {
          // Recargar proyectos cuando haya cambios
          const { data: proyectosData } = await supabase
            .from('Proyectos')
            .select('*')
            .eq('Activo', true)
            .order('Nombre')

          if (proyectosData) {
            setProyectos(proyectosData.map(p => p.Nombre))
          }
        }
      )
      .subscribe()
    
    return () => {
      subscription.unsubscribe()
    }
  }, [])

  // Cerrar dropdowns al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showRolesDropdown && !event.target.closest('[data-roles-dropdown]')) {
        setShowRolesDropdown(false)
      }
      if (showEditRolesDropdown && !event.target.closest('[data-edit-roles-dropdown]')) {
        setShowEditRolesDropdown(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showRolesDropdown, showEditRolesDropdown])

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
    setMessage('')
    setError('')
  }

  const recargarUsuarios = async () => {
    const { data: usuariosData } = await supabase
      .from('Usuarios')
      .select(`
        Id, 
        Email, 
        NombreCompleto, 
        Cedula, 
        Activo, 
        EmpleadoId,
        PhoneNumber,
        Empleados:EmpleadoId (Id, NombreCompleto, Puesto, ProyectoAsignado, ProyectoSupervisado, FechaNacimiento, FechaIngreso, Contacto, HorarioLaboral, ContactoEmergencia, NombreContactoEmergencia, SupervisorId, Extranjero)
      `)
      .order('NombreCompleto')

    if (usuariosData) {
      // Cargar roles de cada usuario
      const usuariosConRoles = await Promise.all(
        usuariosData.map(async (usuario) => {
          const { data: rolesUsuario } = await supabase
            .from('UsuariosRoles')
            .select('RoleId, Roles:RoleId (Id, Name)')
            .eq('UserId', usuario.Id)
          
          return {
            ...usuario,
            Roles: rolesUsuario?.map(ur => ur.Roles).filter(Boolean) || []
          }
        })
      )

      setUsuarios(usuariosConRoles)
      
      // Cargar proyectos desde la tabla Proyectos
      const { data: proyectosData } = await supabase
        .from('Proyectos')
        .select('*')
        .eq('Activo', true)
        .order('Nombre')

      if (proyectosData) {
        setProyectos(proyectosData.map(p => p.Nombre))
      }
    }
  }

  // Función para normalizar texto (eliminar tildes y convertir a minúsculas)
  const normalizarTexto = (texto) => {
    if (!texto) return ''
    return texto
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim()
  }

  // Función para verificar si tiene rol de supervisor
  const tieneRolSupervisor = (rolesArray) => {
    if (!rolesArray || !Array.isArray(rolesArray) || rolesArray.length === 0) return false
    return rolesArray.some(rol => 
      rol?.Name === 'Supervisor de Personal' || 
      rol?.NormalizedName === 'SUPERVISOR DE PERSONAL'
    )
  }

  // Filtrar usuarios basándose en búsqueda y proyecto
  const usuariosFiltrados = (usuarios || []).filter((usuario) => {
    // Filtro por búsqueda de nombre completo
    const nombreNormalizado = normalizarTexto(usuario?.NombreCompleto || '')
    const busquedaNormalizada = normalizarTexto(searchTerm)
    const coincideBusqueda = !searchTerm || nombreNormalizado.includes(busquedaNormalizada)
    
    // Filtro por proyecto
    const proyectoEmpleado = usuario?.Empleados?.ProyectoAsignado || ''
    const coincideProyecto = !filterProyecto || proyectoEmpleado === filterProyecto
    
    return coincideBusqueda && coincideProyecto
  })

  // Separar usuarios en supervisores y empleados
  const supervisoresFiltrados = usuariosFiltrados.filter((usuario) => {
    return tieneRolSupervisor(usuario?.Roles || [])
  })

  const empleadosFiltrados = usuariosFiltrados.filter((usuario) => {
    return !tieneRolSupervisor(usuario?.Roles || [])
  })

  // Restablecer contraseña
  const handleResetPassword = async () => {
    if (!selectedUser || !newPassword) {
      setError('Por favor ingresa una nueva contraseña')
      return
    }

    if (newPassword.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres')
      return
    }

    setLoading(true)
    setError('')
    setMessage('')

    try {
      const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
        selectedUser.Id,
        {
          password: newPassword,
        }
      )

      if (updateError) throw updateError

      setMessage('Contraseña restablecida exitosamente')
      setNewPassword('')
      setTimeout(() => {
        setShowResetPasswordModal(false)
        setSelectedUser(null)
        setMessage('')
      }, 1500)
    } catch (err) {
      console.error('Error al restablecer contraseña:', err)
      setError(err.message || 'Error al restablecer la contraseña')
    } finally {
      setLoading(false)
    }
  }

  // Función para asignar empleados a supervisor
  const asignarEmpleadosASupervisor = async (supervisorEmpleadoId, proyectoSupervisado) => {
    if (!proyectoSupervisado) return

    try {
      // Obtener todos los empleados del proyecto
      const { data: empleadosProyecto } = await supabase
        .from('Empleados')
        .select('Id')
        .eq('ProyectoAsignado', proyectoSupervisado)
        .eq('Activo', true)
        .neq('Id', supervisorEmpleadoId) // Excluir al supervisor

      if (!empleadosProyecto || empleadosProyecto.length === 0) return

      // Eliminar asignaciones anteriores del supervisor para este proyecto
      await supabase
        .from('SupervisoresEmpleados')
        .delete()
        .eq('SupervisorId', supervisorEmpleadoId)
        .eq('ProyectoSupervisado', proyectoSupervisado)

      // Crear nuevas asignaciones
      const asignaciones = empleadosProyecto.map(emp => ({
        SupervisorId: supervisorEmpleadoId,
        EmpleadoId: emp.Id,
        ProyectoSupervisado: proyectoSupervisado
      }))

      if (asignaciones.length > 0) {
        const { error: asignError } = await supabase
          .from('SupervisoresEmpleados')
          .insert(asignaciones)

        if (asignError) {
          console.error('Error al asignar empleados:', asignError)
        }
      }
    } catch (err) {
      console.error('Error en asignarEmpleadosASupervisor:', err)
    }
  }

  // Cargar datos del usuario para editar
  const handleEditClick = async (usuario) => {
    setSelectedUser(usuario)
    setError('')
    setMessage('')
    
    // Cargar roles del usuario
    const { data: rolesUsuario } = await supabase
      .from('UsuariosRoles')
      .select('RoleId, Roles:RoleId (Id, Name)')
      .eq('UserId', usuario.Id)

    const rolesIds = rolesUsuario?.map(ur => ur.RoleId).filter(Boolean) || []
    setEditRolesSeleccionados(rolesIds)
    
    // Cargar datos completos del empleado si existe
    let empleadoData = null
    if (usuario.EmpleadoId) {
      const { data } = await supabase
        .from('Empleados')
        .select('*')
        .eq('Id', usuario.EmpleadoId)
        .single()
      
      if (data) {
        empleadoData = data
      }
    }

    // Parsear horario laboral si existe
    let horarioLaboralParsed = null
    if (empleadoData?.HorarioLaboral) {
      try {
        horarioLaboralParsed = typeof empleadoData.HorarioLaboral === 'string' 
          ? JSON.parse(empleadoData.HorarioLaboral) 
          : empleadoData.HorarioLaboral
      } catch (e) {
        console.error('Error al parsear horario laboral:', e)
      }
    }

    const esSupervisor = tieneRolSupervisor(rolesUsuario?.map(ur => ur.Roles).filter(Boolean) || [])

    setEditFormData({
      email: usuario.Email || '',
      phoneNumber: usuario.PhoneNumber || '',
      nombreCompleto: usuario.NombreCompleto || '',
      cedula: usuario.Cedula || '',
      fechaNacimiento: empleadoData?.FechaNacimiento 
        ? (() => {
            // Convertir fecha a GMT-6 y formatear como YYYY-MM-DD
            const fecha = new Date(empleadoData.FechaNacimiento)
            if (isNaN(fecha.getTime())) return ''
            const fechaParts = fecha.toLocaleDateString('en-US', {
              timeZone: 'Etc/GMT+6',
              year: 'numeric',
              month: '2-digit',
              day: '2-digit'
            }).split('/')
            return `${fechaParts[2]}-${fechaParts[0].padStart(2, '0')}-${fechaParts[1].padStart(2, '0')}`
          })()
        : '',
      puesto: empleadoData?.Puesto || '',
      fechaIngreso: empleadoData?.FechaIngreso
        ? (() => {
            // Convertir fecha a GMT-6 y formatear como YYYY-MM-DD
            const fecha = new Date(empleadoData.FechaIngreso)
            if (isNaN(fecha.getTime())) return ''
            const fechaParts = fecha.toLocaleDateString('en-US', {
              timeZone: 'Etc/GMT+6',
              year: 'numeric',
              month: '2-digit',
              day: '2-digit'
            }).split('/')
            return `${fechaParts[2]}-${fechaParts[0].padStart(2, '0')}-${fechaParts[1].padStart(2, '0')}`
          })()
        : '',
      proyectoAsignado: esSupervisor ? '' : (empleadoData?.ProyectoAsignado || ''),
      proyectoSupervisado: esSupervisor ? (empleadoData?.ProyectoSupervisado || '') : '',
      horarioLaboral: horarioLaboralParsed,
      horarioLaboralTexto: empleadoData?.HorarioLaboral || '',
      contactoEmergencia: empleadoData?.ContactoEmergencia || '',
      nombreContactoEmergencia: empleadoData?.NombreContactoEmergencia || '',
      supervisorId: empleadoData?.SupervisorId || '',
      extranjero: empleadoData?.Extranjero || false,
      permisoTrabajo: empleadoData?.PermisoTrabajo || '',
      contrato: null,
      contratoUrl: empleadoData?.ContratoUrl || null,
      empleadoId: usuario.EmpleadoId || null,
    })

    setEditScheduleData(horarioLaboralParsed)
    setShowEditModal(true)
    setAutoSaving(false)
    setLastSaved(null)
  }

  // Función para recalcular minutos de tardía cuando se actualiza el horario laboral
  const recalcularTardiaDelDia = async (empleadoId, nuevoHorario) => {
    try {
      console.log('🔄 Recalculando tardía para empleado:', empleadoId)
      
      // Obtener fecha actual en zona horaria de Costa Rica
      const hoy = getCostaRicaDateString()
      
      // Buscar asistencia del día actual
      const { data: asistencia, error: errorAsistencia } = await supabase
        .from('Asistencias')
        .select('Id, HoraEntrada')
        .eq('EmpleadoId', empleadoId)
        .eq('Fecha', hoy)
        .maybeSingle()

      if (errorAsistencia) {
        console.error('Error al buscar asistencia para recalcular tardía:', errorAsistencia)
        return
      }

      // Si no hay asistencia o no tiene hora de entrada, no hay nada que recalcular
      if (!asistencia || !asistencia.HoraEntrada) {
        console.log('No hay asistencia con hora de entrada para hoy, no se recalcula')
        return
      }

      // Calcular nueva tardía con el horario actualizado
      // Convertir hora de entrada a hora de Costa Rica
      const horaEntradaReal = toCostaRicaDate(asistencia.HoraEntrada) || new Date(asistencia.HoraEntrada)
      const horaEsperadaData = obtenerHoraEntradaEsperada(JSON.stringify(nuevoHorario), hoy)
      
      let minutosTardia = 0
      
      if (horaEsperadaData) {
        // Obtener componentes de hora de la entrada real (en zona horaria de Costa Rica)
        // Usar toLocaleString para obtener la hora en zona horaria de Costa Rica
        const horaRealStr = horaEntradaReal.toLocaleString('en-US', { 
          timeZone: 'Etc/GMT+6',
          hour: '2-digit',
          minute: '2-digit',
          hour12: false
        })
        const [horaReal, minutoReal] = horaRealStr.split(':').map(Number)
        
        // Calcular diferencia en minutos directamente
        const minutosReal = horaReal * 60 + minutoReal
        const minutosEsperados = horaEsperadaData.hora * 60 + horaEsperadaData.minuto
        
        // Calcular tardía (solo si llegó después de la hora esperada)
        const diferencia = minutosReal - minutosEsperados
        minutosTardia = diferencia > 0 ? diferencia : 0
        
        console.log(`Nueva tardía calculada: ${minutosTardia} minutos`)
      }

      // Actualizar la asistencia con los nuevos minutos de tardía
      const { error: updateError } = await supabase
        .from('Asistencias')
        .update({ MinutosTardia: minutosTardia })
        .eq('Id', asistencia.Id)

      if (updateError) {
        console.error('Error al actualizar minutos de tardía:', updateError)
      } else {
        console.log('✅ Minutos de tardía actualizados correctamente:', minutosTardia)
      }
    } catch (err) {
      console.error('Error al recalcular tardía:', err)
    }
  }

  // Función helper para verificar si el usuario en edición tiene rol de supervisor
  const esSupervisorEdit = () => {
    return editRolesSeleccionados.some(roleId => {
      const rol = roles.find(r => r.Id === roleId)
      return rol?.Name === 'Supervisor de Personal' || rol?.NormalizedName === 'SUPERVISOR DE PERSONAL'
    })
  }

  // Guardar cambios del usuario (función reutilizable para guardado automático y manual)
  const handleSaveEdit = async (isAutoSave = false) => {
    if (!selectedUser || !editFormData) return

    if (isAutoSave) {
      setAutoSaving(true)
    } else {
    setLoading(true)
    }
    setError('')
    if (!isAutoSave) {
    setMessage('')
    }

    try {
      // Actualizar usuario en tabla Usuarios
      const { error: usuarioError } = await supabase
        .from('Usuarios')
        .update({
          Email: editFormData.email,
          NombreCompleto: editFormData.nombreCompleto,
          Cedula: editFormData.cedula,
          PhoneNumber: editFormData.phoneNumber || null,
        })
        .eq('Id', selectedUser.Id)

      if (usuarioError) throw usuarioError

      // Actualizar email en Auth si cambió
      if (editFormData.email !== selectedUser.Email) {
        const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(
          selectedUser.Id,
          {
            email: editFormData.email,
          }
        )

        if (authError) throw authError
      }

      // Verificar si tiene rol de supervisor
      const tieneRolSupervisorEdit = esSupervisorEdit()

      // Actualizar roles del usuario (solo en guardado manual)
      if (!isAutoSave && editRolesSeleccionados.length >= 0) {
        // Eliminar roles anteriores
        await supabase
          .from('UsuariosRoles')
          .delete()
          .eq('UserId', selectedUser.Id)

        // Insertar nuevos roles si hay alguno seleccionado
        if (editRolesSeleccionados.length > 0) {
          const rolesParaInsertar = editRolesSeleccionados.map(roleId => ({
            UserId: selectedUser.Id,
            RoleId: roleId
          }))

          const { error: rolesError } = await supabase
            .from('UsuariosRoles')
            .insert(rolesParaInsertar)

          if (rolesError) {
            console.error('Error al actualizar roles:', rolesError)
            // No lanzar error, solo loguear
          }
        }
      }

      // Si tiene empleado asociado, actualizar empleado
      if (editFormData.empleadoId) {
        // Subir nuevo contrato si existe
        let contratoUrl = editFormData.contratoUrl || null
        if (editFormData.contrato) {
          const fileExt = editFormData.contrato.name.split('.').pop()
          const fileName = `${Date.now()}_${editFormData.cedula}_${Math.random().toString(36).substring(7)}.${fileExt}`
          const filePath = `contratos/${fileName}`

          const { error: uploadError } = await supabase.storage
            .from('documentos')
            .upload(filePath, editFormData.contrato)

          if (uploadError) {
            throw new Error('Error al subir el contrato: ' + uploadError.message)
          }

          const { data: { publicUrl } } = supabase.storage
            .from('documentos')
            .getPublicUrl(filePath)

          contratoUrl = publicUrl
        }

        const datosEmpleadoUpdate = {
            NombreCompleto: editFormData.nombreCompleto,
            Cedula: editFormData.cedula,
            FechaNacimiento: editFormData.fechaNacimiento || null,
            Puesto: editFormData.puesto || null,
            FechaIngreso: editFormData.fechaIngreso || null,
            HorarioLaboral: editScheduleData 
              ? JSON.stringify(editScheduleData)
              : null,
            ContactoEmergencia: editFormData.contactoEmergencia || null,
            NombreContactoEmergencia: editFormData.nombreContactoEmergencia || null,
            SupervisorId: esSupervisor ? null : (editFormData.supervisorId || null), // Supervisores no tienen supervisor
            Extranjero: editFormData.extranjero || false,
            PermisoTrabajo: editFormData.extranjero ? (editFormData.permisoTrabajo || null) : null,
            ContratoUrl: contratoUrl,
            Contacto: editFormData.email,
        }

        // Si es supervisor, usar proyectoSupervisado, sino proyectoAsignado
        if (tieneRolSupervisorEdit) {
          datosEmpleadoUpdate.ProyectoSupervisado = editFormData.proyectoSupervisado || null
          datosEmpleadoUpdate.ProyectoAsignado = null
        } else {
          datosEmpleadoUpdate.ProyectoAsignado = editFormData.proyectoAsignado || null
          datosEmpleadoUpdate.ProyectoSupervisado = null
        }

        const { error: empleadoError } = await supabase
          .from('Empleados')
          .update(datosEmpleadoUpdate)
          .eq('Id', editFormData.empleadoId)

        if (empleadoError) throw empleadoError

        // Si se actualizó el horario laboral, recalcular minutos de tardía para el día actual
        // Solo recalcular si hay un horario nuevo configurado
        if (editScheduleData && editFormData.empleadoId) {
          console.log('📅 Horario laboral actualizado, recalculando tardía...')
          await recalcularTardiaDelDia(editFormData.empleadoId, editScheduleData)
        }

        // Si es supervisor y tiene proyecto supervisado, asignar empleados automáticamente
        if (tieneRolSupervisorEdit && editFormData.proyectoSupervisado && !isAutoSave) {
          await asignarEmpleadosASupervisor(editFormData.empleadoId, editFormData.proyectoSupervisado)
        }
      }

      if (!isAutoSave) {
      setMessage('Usuario actualizado exitosamente')
      setTimeout(() => {
        setShowEditModal(false)
        setSelectedUser(null)
        setEditFormData(null)
        setEditScheduleData(null)
          setEditRolesSeleccionados([])
        setMessage('')
        recargarUsuarios()
      }, 1500)
      } else {
        setLastSaved(getCostaRicaTime())
      }
    } catch (err) {
      console.error('Error al actualizar usuario:', err)
      setError(err.message || 'Error al actualizar el usuario')
    } finally {
      if (isAutoSave) {
        setAutoSaving(false)
      } else {
      setLoading(false)
      }
    }
  }

  // Efecto para guardado automático con debounce
  useEffect(() => {
    if (!showEditModal || !editFormData || !selectedUser) return

    // Esperar 1 segundo después del último cambio antes de guardar
    const timeoutId = setTimeout(async () => {
      if (!selectedUser || !editFormData) return

      setAutoSaving(true)
      setError('')

      try {
        // Actualizar usuario en tabla Usuarios
        const { error: usuarioError } = await supabase
          .from('Usuarios')
          .update({
            Email: editFormData.email,
            NombreCompleto: editFormData.nombreCompleto,
            Cedula: editFormData.cedula,
            PhoneNumber: editFormData.phoneNumber || null,
          })
          .eq('Id', selectedUser.Id)

        if (usuarioError) throw usuarioError

        // Actualizar email en Auth si cambió
        if (editFormData.email !== selectedUser.Email) {
          const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(
            selectedUser.Id,
            {
              email: editFormData.email,
            }
          )

          if (authError) throw authError
        }

        // Si tiene empleado asociado, actualizar empleado
        if (editFormData.empleadoId) {
          const tieneRolSupervisorEditAuto = esSupervisorEdit()
          
          const { error: empleadoError } = await supabase
            .from('Empleados')
            .update({
              NombreCompleto: editFormData.nombreCompleto,
              Cedula: editFormData.cedula,
              FechaNacimiento: editFormData.fechaNacimiento || null,
              Puesto: editFormData.puesto || null,
              FechaIngreso: editFormData.fechaIngreso || null,
              ProyectoAsignado: editFormData.proyectoAsignado || null,
              HorarioLaboral: editScheduleData 
                ? JSON.stringify(editScheduleData)
                : null,
              ContactoEmergencia: editFormData.contactoEmergencia || null,
              NombreContactoEmergencia: editFormData.nombreContactoEmergencia || null,
              SupervisorId: tieneRolSupervisorEditAuto ? null : (editFormData.supervisorId || null), // Supervisores no tienen supervisor
              Extranjero: editFormData.extranjero || false,
              Contacto: editFormData.email,
            })
            .eq('Id', editFormData.empleadoId)

          if (empleadoError) throw empleadoError

          // Si se actualizó el horario laboral, recalcular minutos de tardía para el día actual
          // Solo recalcular si hay un horario nuevo configurado
          if (editScheduleData && editFormData.empleadoId) {
            console.log('📅 Horario laboral actualizado (auto-save), recalculando tardía...')
            await recalcularTardiaDelDia(editFormData.empleadoId, editScheduleData)
          }
        }

        setLastSaved(getCostaRicaTime())
      } catch (err) {
        console.error('Error al guardar automáticamente:', err)
        setError(err.message || 'Error al guardar automáticamente')
      } finally {
        setAutoSaving(false)
      }
    }, 1000)

    return () => clearTimeout(timeoutId)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editFormData, editScheduleData, showEditModal])

  // Eliminar usuario
  const handleDeleteUser = async (usuario) => {
    const mensajeConfirmacion = usuario.EmpleadoId 
      ? `¿Estás seguro de eliminar al usuario ${usuario.NombreCompleto} y su empleado asociado? Esta acción no se puede deshacer.`
      : `¿Estás seguro de eliminar al usuario ${usuario.NombreCompleto}? Esta acción no se puede deshacer.`
    
    if (!window.confirm(mensajeConfirmacion)) {
      return
    }

    setLoading(true)
    setError('')
    setMessage('')

    try {
      // Obtener EmpleadoId antes de eliminar el usuario
      const empleadoId = usuario.EmpleadoId

      // Eliminar de Auth
      const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(usuario.Id)
      if (authError) throw authError

      // Eliminar de tabla Usuarios
      const { error: usuarioError } = await supabase
        .from('Usuarios')
        .delete()
        .eq('Id', usuario.Id)

      if (usuarioError) throw usuarioError

      // Si tiene empleado asociado, eliminar también el empleado
      if (empleadoId) {
        const { error: empleadoError } = await supabase
          .from('Empleados')
          .delete()
          .eq('Id', empleadoId)

        if (empleadoError) {
          console.error('Error al eliminar empleado:', empleadoError)
          // No lanzar error aquí, solo loguearlo, ya que el usuario ya fue eliminado
          setMessage('Usuario eliminado exitosamente, pero hubo un problema al eliminar el empleado asociado')
        } else {
          setMessage('Usuario y empleado eliminados exitosamente')
        }
      } else {
        setMessage('Usuario eliminado exitosamente')
      }

      recargarUsuarios()
      setTimeout(() => setMessage(''), 3000)
    } catch (err) {
      console.error('Error al eliminar usuario:', err)
      setError(err.message || 'Error al eliminar el usuario')
      setTimeout(() => setError(''), 5000)
    } finally {
      setLoading(false)
    }
  }

  // Función helper para verificar si el usuario tiene rol de supervisor
  const esSupervisor = () => {
    return rolesSeleccionados.some(roleId => {
      const rol = roles.find(r => r.Id === roleId)
      return rol?.Name === 'Supervisor de Personal' || rol?.NormalizedName === 'SUPERVISOR DE PERSONAL'
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')
    setError('')

    try {
      // Verificar si tiene rol de supervisor (antes de validar campos)
      const tieneRolSupervisor = esSupervisor()

      // Validar campos requeridos (supervisorId solo si NO es supervisor)
      if (!formData.email || !formData.password || !formData.nombreCompleto || 
          !formData.cedula || !formData.fechaNacimiento || !formData.puesto || 
          !formData.fechaIngreso || !formData.phoneNumber ||
          (!tieneRolSupervisor && !formData.supervisorId) ||
          !scheduleData) {
        throw new Error('Por favor completa todos los campos requeridos (*)')
      }

      // Validar proyecto según el rol
      if (tieneRolSupervisor && !formData.proyectoSupervisado) {
        throw new Error('Debe seleccionar un proyecto supervisado')
      }
      if (!tieneRolSupervisor && !formData.proyectoAsignado) {
        throw new Error('Debe seleccionar un proyecto asignado')
      }

      // Validar permiso de trabajo si es extranjero
      if (formData.extranjero && !formData.permisoTrabajo?.trim()) {
        throw new Error('El permiso de trabajo es obligatorio para empleados extranjeros')
      }

      // Subir contrato si existe
      let contratoUrl = null
      if (formData.contrato) {
        const fileExt = formData.contrato.name.split('.').pop()
        const fileName = `${Date.now()}_${formData.cedula}_${Math.random().toString(36).substring(7)}.${fileExt}`
        const filePath = `contratos/${fileName}`

        const { error: uploadError } = await supabase.storage
          .from('documentos')
          .upload(filePath, formData.contrato)

        if (uploadError) {
          throw new Error('Error al subir el contrato: ' + uploadError.message)
        }

        const { data: { publicUrl } } = supabase.storage
          .from('documentos')
          .getPublicUrl(filePath)

        contratoUrl = publicUrl
      }

      // PASO 1: Crear el empleado primero
      const datosEmpleado = {
          NombreCompleto: formData.nombreCompleto,
          Cedula: formData.cedula,
          FechaNacimiento: formData.fechaNacimiento,
          Puesto: formData.puesto,
          FechaIngreso: formData.fechaIngreso,
          Contacto: formData.email,
          HorarioLaboral: scheduleData ? JSON.stringify(scheduleData) : null,
          ContactoEmergencia: formData.contactoEmergencia || null,
          NombreContactoEmergencia: formData.nombreContactoEmergencia || null,
          SupervisorId: tieneRolSupervisor ? null : (formData.supervisorId || null), // Supervisores no tienen supervisor
          Extranjero: formData.extranjero || false,
          PermisoTrabajo: formData.extranjero ? (formData.permisoTrabajo || null) : null,
          ContratoUrl: contratoUrl,
          Activo: true,
      }

      // Si es supervisor, usar proyectoSupervisado, sino proyectoAsignado
      if (tieneRolSupervisor) {
        datosEmpleado.ProyectoSupervisado = formData.proyectoSupervisado || null
        datosEmpleado.ProyectoAsignado = null
      } else {
        datosEmpleado.ProyectoAsignado = formData.proyectoAsignado || null
        datosEmpleado.ProyectoSupervisado = null
      }

      const { data: empleadoData, error: empleadoError } = await supabase
        .from('Empleados')
        .insert(datosEmpleado)
        .select('Id')
        .single()

      if (empleadoError) {
        throw new Error('Error al crear empleado: ' + empleadoError.message)
      }

      const empleadoId = empleadoData.Id

      // Si es supervisor y tiene proyecto supervisado, asignar empleados automáticamente
      if (esSupervisor && formData.proyectoSupervisado) {
        await asignarEmpleadosASupervisor(empleadoId, formData.proyectoSupervisado)
      }

      // PASO 2: Buscar si el usuario ya existe en Auth
      let authUserId = null
      let page = 1
      let usuarioExistente = null

      while (true) {
        const { data: usersData, error: listError } = await supabaseAdmin.auth.admin.listUsers({
          page,
          perPage: 200,
        })

        if (listError) {
          console.error('Error al listar usuarios:', listError)
          break
        }

        usuarioExistente = usersData?.users?.find(
          (u) => u.email?.toLowerCase() === formData.email.toLowerCase()
        )

        if (usuarioExistente) {
          authUserId = usuarioExistente.id
          break
        }

        if (!usersData || usersData.users.length < 200) {
          break
        }

        page += 1
      }

      // Si el usuario ya existe, usar su ID, si no, crear uno nuevo
      if (!authUserId) {
        const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
          email: formData.email,
          password: formData.password,
          email_confirm: true,
          user_metadata: {
            fullName: formData.nombreCompleto,
            nombre: formData.nombreCompleto,
            name: formData.nombreCompleto,
          },
        })

        if (authError) {
          throw authError
        }

        if (!authData.user) {
          throw new Error('No se pudo crear el usuario en Supabase Auth')
        }

        authUserId = authData.user.id
      } else {
        // Usuario ya existe, actualizar contraseña y metadata
        await supabaseAdmin.auth.admin.updateUserById(authUserId, {
          password: formData.password,
          user_metadata: {
            fullName: formData.nombreCompleto,
            nombre: formData.nombreCompleto,
            name: formData.nombreCompleto,
          },
        })
      }

      // Verificar si ya existe en la tabla Usuarios
      const { data: usuarioExistenteBD } = await supabase
        .from('Usuarios')
        .select('Id')
        .eq('Id', authUserId)
        .single()

      let usuarioData

      if (usuarioExistenteBD) {
        // Actualizar usuario existente
        const { data: updatedData, error: updateError } = await supabase
          .from('Usuarios')
          .update({
            Email: formData.email,
            NombreCompleto: formData.nombreCompleto,
            Cedula: formData.cedula,
            EmpleadoId: empleadoId,
            PhoneNumber: formData.phoneNumber || null,
            NormalizedEmail: formData.email.toUpperCase(),
            NormalizedUserName: formData.email.toUpperCase(),
            Activo: true,
          })
          .eq('Id', authUserId)
          .select()
          .single()

        if (updateError) throw updateError
        usuarioData = updatedData
      } else {
        // Crear nuevo registro en tabla Usuarios conectado al empleado
        const { data: newUsuarioData, error: usuarioError } = await supabase
          .from('Usuarios')
          .insert({
            Id: authUserId,
            Email: formData.email,
            NombreCompleto: formData.nombreCompleto,
            Cedula: formData.cedula,
            EmpleadoId: empleadoId,
            PhoneNumber: formData.phoneNumber || null,
            NormalizedEmail: formData.email.toUpperCase(),
            NormalizedUserName: formData.email.toUpperCase(),
            EmailConfirmed: true,
            PhoneNumberConfirmed: false,
            TwoFactorEnabled: false,
            LockoutEnabled: false,
            AccessFailedCount: 0,
            Activo: true,
          })
          .select()
          .single()

        if (usuarioError) {
          console.error('Error al crear usuario en BD:', usuarioError)
          throw usuarioError
        }

        usuarioData = newUsuarioData
      }

      // PASO 3: Asignar roles al usuario
      if (rolesSeleccionados.length > 0) {
        // Eliminar roles anteriores si existían
        await supabase
          .from('UsuariosRoles')
          .delete()
          .eq('UserId', authUserId)

        // Insertar nuevos roles
        const rolesParaInsertar = rolesSeleccionados.map(roleId => ({
          UserId: authUserId,
          RoleId: roleId
        }))

        const { error: rolesError } = await supabase
          .from('UsuariosRoles')
          .insert(rolesParaInsertar)

        if (rolesError) {
          console.error('Error al asignar roles:', rolesError)
          // No lanzar error, solo loguear
        }
      }

      setMessage('Usuario y empleado creados exitosamente y conectados')
      setFormData({
        email: '',
        password: '',
        phoneNumber: '',
        nombreCompleto: '',
        cedula: '',
        fechaNacimiento: '',
        puesto: '',
        fechaIngreso: '',
        proyectoAsignado: '',
        proyectoSupervisado: '',
        contactoEmergencia: '',
        nombreContactoEmergencia: '',
        supervisorId: '',
        extranjero: false,
        permisoTrabajo: '',
        contrato: null,
      })
      if (contratoInputRef.current) {
        contratoInputRef.current.value = ''
      }
      setRolesSeleccionados([])
      setScheduleData(null)
      setShowForm(false)

      // Recargar lista de usuarios
      const { data: usuariosData } = await supabase
        .from('Usuarios')
        .select(`
          Id, 
          Email, 
          NombreCompleto, 
          Cedula, 
          Activo, 
          EmpleadoId,
          Empleados:EmpleadoId (Id, NombreCompleto, Puesto, ProyectoAsignado)
        `)
        .order('NombreCompleto')

      if (usuariosData) {
        setUsuarios(usuariosData)
      }
    } catch (err) {
      console.error('Error al crear usuario:', err)
      setError(err.message || 'Error al crear el usuario')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="section-stack">
      <div className="panel-header">
        <div className="panel-title">
          <span className="title-icon" aria-hidden="true">
            <IconUser size={24} />
          </span>
          <div>
            <p className="eyebrow">Gestión de Usuarios</p>
            <h2>Administra usuarios y accesos del sistema</h2>
            <p className="page-subtitle">
              Crea y gestiona usuarios del sistema conectados a Supabase.
            </p>
          </div>
        </div>
        <div className="panel-header-meta">
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => setShowForm(!showForm)}
          >
            {showForm ? (
              <>
                <span style={{ fontSize: '1.2rem', lineHeight: 1 }}>✕</span> Cancelar
              </>
            ) : (
              <>
                <IconPlus size={18} />
                Nuevo Usuario
              </>
            )}
          </button>
        </div>
      </div>

      {showForm && (
        <div className="section-card form-card" style={{ maxHeight: 'calc(100vh - 280px)', overflowY: 'auto' }}>
          <h3 style={{ marginTop: 0, marginBottom: '1rem' }}>Crear Usuario y Empleado</h3>
          <form onSubmit={handleSubmit} className="form-grid two-columns" style={{ gap: '0.75rem' }}>
            {/* Sección: Datos de Usuario */}
            <div style={{ gridColumn: '1 / -1', marginBottom: '0.5rem', paddingBottom: '0.5rem', borderBottom: '2px solid #e2e8f0' }}>
              <h4 style={{ margin: 0, color: '#0f172a', fontSize: '1rem', fontWeight: 600 }}>Datos de Usuario</h4>
            </div>
            
            <label>
              <span>Email *</span>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="usuario@empresa.com"
                required
              />
            </label>

            <label>
              <span>Contraseña *</span>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Mínimo 6 caracteres"
                minLength={6}
                required
              />
            </label>

            <label>
              <span>Teléfono *</span>
              <input
                type="tel"
                name="phoneNumber"
                value={formData.phoneNumber}
                onChange={handleChange}
                placeholder="+506 8888-8888"
                required
              />
            </label>

            <label style={{ gridColumn: '1 / -1', position: 'relative' }} data-roles-dropdown>
              <span>Roles (Selección múltiple)</span>
              <div style={{ position: 'relative' }}>
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault()
                    setShowRolesDropdown(!showRolesDropdown)
                  }}
                  style={{
                    width: '100%',
                    padding: '0.5rem 0.75rem',
                    border: '1px solid #cbd5e1',
                    borderRadius: '8px',
                    fontSize: '0.875rem',
                    backgroundColor: '#fff',
                    textAlign: 'left',
                    cursor: 'pointer',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    minHeight: '38px'
                  }}
                >
                  <span style={{ color: rolesSeleccionados.length > 0 ? '#0f172a' : '#94a3b8' }}>
                    {rolesSeleccionados.length > 0
                      ? rolesSeleccionados.map(roleId => {
                          const rol = roles.find(r => r.Id === roleId)
                          return rol?.Name
                        }).join(', ')
                      : 'Seleccione un rol para el usuario'}
                  </span>
                  <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                    {showRolesDropdown ? '▲' : '▼'}
                  </span>
                </button>
                {showRolesDropdown && (
                  <div
                    style={{
                      position: 'absolute',
                      top: '100%',
                      left: 0,
                      right: 0,
                      marginTop: '0.25rem',
                      backgroundColor: '#fff',
                      border: '1px solid #cbd5e1',
                      borderRadius: '8px',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                      zIndex: 1000,
                      maxHeight: '200px',
                      overflowY: 'auto'
                    }}
                  >
                    {roles.length === 0 ? (
                      <div style={{ padding: '0.5rem 0.75rem', color: '#94a3b8', fontSize: '0.875rem' }}>
                        Cargando roles...
                      </div>
                    ) : (
                      roles.map((rol) => (
                        <label
                          key={rol.Id}
                          style={{
                            display: 'flex',
                            flexDirection: 'row',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '0.5rem 0.75rem',
                            cursor: 'pointer',
                            borderBottom: '1px solid #f1f5f9',
                            transition: 'background-color 0.15s',
                            width: '100%'
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f8fafc'}
                          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#fff'}
                          onClick={(e) => e.stopPropagation()}
                        >
                          <span style={{ cursor: 'pointer', flex: 1, textAlign: 'left' }}>{rol.Name}</span>
                          <input
                            type="checkbox"
                            checked={rolesSeleccionados.includes(rol.Id)}
                            onChange={(e) => {
                              const esSupervisor = rol.Name === 'Supervisor de Personal' || rol.NormalizedName === 'SUPERVISOR DE PERSONAL'
                              if (e.target.checked) {
                                const nuevosRoles = [...rolesSeleccionados, rol.Id]
                                setRolesSeleccionados(nuevosRoles)
                                // Si se selecciona supervisor, cambiar proyecto
                                if (esSupervisor) {
                                  setFormData({ 
                                    ...formData, 
                                    proyectoAsignado: '',
                                    proyectoSupervisado: formData.proyectoSupervisado || ''
                                  })
                                }
                              } else {
                                const nuevosRoles = rolesSeleccionados.filter(id => id !== rol.Id)
                                setRolesSeleccionados(nuevosRoles)
                                // Si se deselecciona supervisor, cambiar proyecto
                                if (esSupervisor) {
                                  setFormData({ 
                                    ...formData, 
                                    proyectoSupervisado: '',
                                    proyectoAsignado: formData.proyectoAsignado || ''
                                  })
                                }
                              }
                            }}
                            style={{ width: 'auto', margin: 0, cursor: 'pointer', marginLeft: '0.5rem' }}
                          />
                        </label>
                      ))
                    )}
                  </div>
                )}
              </div>
            </label>

            {/* Sección: Datos de Empleado */}
            <div style={{ gridColumn: '1 / -1', marginTop: '0.5rem', marginBottom: '0.5rem', paddingTop: '0.5rem', borderTop: '2px solid #e2e8f0' }}>
              <h4 style={{ margin: 0, color: '#0f172a', fontSize: '1rem', fontWeight: 600 }}>Datos de Empleado</h4>
            </div>

            <label>
              <span>Nombre Completo *</span>
              <input
                type="text"
                name="nombreCompleto"
                value={formData.nombreCompleto}
                onChange={handleChange}
                placeholder="Juan Pérez García"
                required
              />
            </label>

            <label>
              <span>Cédula *</span>
              <input
                type="text"
                name="cedula"
                value={formData.cedula}
                onChange={handleChange}
                placeholder="123456789"
                required
              />
            </label>

            <label>
              <span>Fecha de Nacimiento *</span>
              <input
                type="date"
                name="fechaNacimiento"
                value={formData.fechaNacimiento}
                onChange={handleChange}
                required
              />
            </label>

            <label>
              <span>Puesto *</span>
              <input
                type="text"
                name="puesto"
                value={formData.puesto}
                onChange={handleChange}
                placeholder="Desarrollador"
                required
              />
            </label>

            <label>
              <span>Fecha de Ingreso *</span>
              <input
                type="date"
                name="fechaIngreso"
                value={formData.fechaIngreso}
                onChange={handleChange}
                required
              />
            </label>

            {rolesSeleccionados.some(roleId => {
              const rol = roles.find(r => r.Id === roleId)
              return rol?.Name === 'Supervisor de Personal' || rol?.NormalizedName === 'SUPERVISOR DE PERSONAL'
            }) ? (
              <label>
                <span>Proyecto Supervisado *</span>
                <select
                  name="proyectoSupervisado"
                  value={formData.proyectoSupervisado}
                  onChange={(e) => setFormData({ ...formData, proyectoSupervisado: e.target.value })}
                  required
                >
                  <option value="">Selecciona un proyecto</option>
                  {proyectos.map((proyecto) => (
                    <option key={proyecto} value={proyecto}>
                      {proyecto}
                    </option>
                  ))}
                </select>
              </label>
            ) : (
            <label>
              <span>Proyecto Asignado *</span>
              <select
                name="proyectoAsignado"
                value={formData.proyectoAsignado}
                onChange={handleChange}
                required
              >
                <option value="">Selecciona un proyecto</option>
                {proyectos.map((proyecto) => (
                  <option key={proyecto} value={proyecto}>
                    {proyecto}
                  </option>
                ))}
              </select>
            </label>
            )}

            <label style={{ gridColumn: '1 / -1' }}>
              <span>Horario Laboral *</span>
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <input
                  type="text"
                  readOnly
                  value={
                    scheduleData 
                      ? 'Horario configurado (click para editar)'
                      : 'Sin horario configurado'
                  }
                  placeholder="Selecciona el horario laboral"
                  style={{ 
                    flex: 1,
                    cursor: 'pointer',
                    backgroundColor: scheduleData ? '#f0f9ff' : '#f9fafb'
                  }}
                  onClick={() => setShowScheduleModal(true)}
                  required
                />
                <button
                  type="button"
                  className="btn btn-outline btn-small"
                  onClick={() => setShowScheduleModal(true)}
                >
                  {scheduleData ? 'Editar' : 'Seleccionar'}
                </button>
              </div>
            </label>

            {/* Solo mostrar campo de supervisor si NO es supervisor */}
            {!esSupervisor() && (
              <label>
                <span>Supervisor *</span>
                <select
                  name="supervisorId"
                  value={formData.supervisorId}
                  onChange={handleChange}
                  required
                >
                  <option value="">Selecciona un supervisor</option>
                  {supervisores.map((supervisor) => (
                    <option key={supervisor.Id} value={supervisor.Id}>
                      {supervisor.NombreCompleto}
                    </option>
                  ))}
                </select>
              </label>
            )}

            <label>
              <span>Contacto de Emergencia</span>
              <input
                type="tel"
                name="contactoEmergencia"
                value={formData.contactoEmergencia}
                onChange={handleChange}
                placeholder="+506 8888-8888"
              />
            </label>

            <label>
              <span>Nombre Contacto Emergencia</span>
              <input
                type="text"
                name="nombreContactoEmergencia"
                value={formData.nombreContactoEmergencia}
                onChange={handleChange}
                placeholder="María Pérez"
              />
            </label>

            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexDirection: 'row', paddingTop: '1.5rem' }}>
              <input
                type="checkbox"
                name="extranjero"
                checked={formData.extranjero}
                onChange={(e) => setFormData(prev => ({ ...prev, extranjero: e.target.checked, permisoTrabajo: e.target.checked ? prev.permisoTrabajo : '' }))}
                style={{ width: 'auto', margin: 0 }}
              />
              <span style={{ fontWeight: 600, color: '#475569' }}>Extranjero</span>
            </label>

            {formData.extranjero && (
              <label style={{ gridColumn: '1 / -1' }}>
                <span>Permiso de Trabajo *</span>
                <input
                  type="text"
                  name="permisoTrabajo"
                  value={formData.permisoTrabajo}
                  onChange={handleChange}
                  placeholder="Número de permiso de trabajo"
                  required={formData.extranjero}
                />
              </label>
            )}

            <label style={{ gridColumn: '1 / -1' }}>
              <span>Contrato del Empleado (Opcional)</span>
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <input
                  type="file"
                  ref={contratoInputRef}
                  accept=".pdf,.doc,.docx"
                  onChange={(e) => {
                    const file = e.target.files?.[0] || null
                    setFormData(prev => ({ ...prev, contrato: file }))
                  }}
                  style={{
                    flex: 1,
                    padding: '0.5rem',
                    border: '1px solid #cbd5e1',
                    borderRadius: '0.375rem',
                    fontSize: '0.875rem'
                  }}
                />
                {formData.contrato && (
                  <span style={{ fontSize: '0.875rem', color: '#059669' }}>
                    {formData.contrato.name}
                  </span>
                )}
              </div>
            </label>

            {message && <div className="status success" style={{ gridColumn: '1 / -1', marginTop: '0.5rem' }}>{message}</div>}
            {error && <div className="status error" style={{ gridColumn: '1 / -1', marginTop: '0.5rem' }}>{error}</div>}

            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
              style={{ gridColumn: '1 / -1', marginTop: '0.75rem' }}
            >
              {loading ? 'Creando...' : 'Crear Usuario y Empleado'}
            </button>
          </form>
        </div>
      )}

      <ScheduleModal
        isOpen={showScheduleModal}
        onClose={() => setShowScheduleModal(false)}
        onSave={(schedule) => {
          setScheduleData(schedule)
          setShowScheduleModal(false)
        }}
        initialSchedule={scheduleData}
      />

      <div className="section-card filters-card" style={{ marginBottom: '1rem' }}>
        <div className="filter-row" style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ flex: '1', minWidth: '250px' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 500, color: '#475569' }}>
              Buscar por nombre completo
            </label>
            <input
              type="text"
              placeholder="Ej: SEBASTIAN ARROLIGA"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: '100%',
                padding: '0.5rem 0.75rem',
                border: '1px solid #cbd5e1',
                borderRadius: '8px',
                fontSize: '0.875rem'
              }}
            />
          </div>
          <div style={{ flex: '1', minWidth: '200px' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 500, color: '#475569' }}>
              Filtrar por proyecto
            </label>
            <select
              value={filterProyecto}
              onChange={(e) => setFilterProyecto(e.target.value)}
              style={{
                width: '100%',
                padding: '0.5rem 0.75rem',
                border: '1px solid #cbd5e1',
                borderRadius: '8px',
                fontSize: '0.875rem',
                backgroundColor: '#fff'
              }}
            >
              <option value="">Todos los proyectos</option>
              {proyectos.map((proyecto) => (
                <option key={proyecto} value={proyecto}>
                  {proyecto}
                </option>
              ))}
            </select>
          </div>
          {(searchTerm || filterProyecto) && (
            <div style={{ display: 'flex', alignItems: 'flex-end' }}>
              <button
                type="button"
                className="btn btn-outline btn-small"
                onClick={() => {
                  setSearchTerm('')
                  setFilterProyecto('')
                }}
                style={{ marginTop: '1.5rem' }}
              >
                Limpiar filtros
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="section-card table-card">
        <div className="split-heading">
          <h3>Listado de Usuarios</h3>
          <span className="badge badge-soft">
            {usuariosFiltrados.length} {usuariosFiltrados.length === 1 ? 'usuario' : 'usuarios'}
            {usuariosFiltrados.length !== (usuarios?.length || 0) && ` de ${usuarios?.length || 0}`}
          </span>
        </div>
        <div className="table-scroll">
          <table className="data-table">
            <thead>
              <tr>
                <th>Email</th>
                <th>Nombre Completo</th>
                <th>Cédula</th>
                <th>Empleado</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {usuariosFiltrados.length === 0 ? (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', padding: '2rem' }}>
                    {(usuarios?.length || 0) === 0 
                      ? 'No hay usuarios registrados'
                      : 'No se encontraron usuarios que coincidan con los filtros'
                    }
                  </td>
                </tr>
              ) : (
                <>
                  {/* Sección de Supervisores */}
                  {supervisoresFiltrados.length > 0 && (
                    <>
                      <tr style={{ backgroundColor: '#f0f9ff', borderTop: '2px solid #3b82f6' }}>
                        <td colSpan="6" style={{ padding: '0.75rem 1rem', fontWeight: '600', color: '#1e40af', fontSize: '0.875rem' }}>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <IconUsers size={16} />
                            Supervisores ({supervisoresFiltrados.length})
                          </span>
                        </td>
                      </tr>
                      {supervisoresFiltrados.map((usuario) => {
                        const empleado = usuario.Empleados
                        return (
                          <tr key={usuario.Id} style={{ backgroundColor: '#f8fafc' }}>
                            <td>{usuario.Email}</td>
                            <td>{usuario.NombreCompleto}</td>
                            <td>{usuario.Cedula}</td>
                            <td>
                              {empleado ? `${empleado.NombreCompleto} (${empleado.Puesto})` : '-'}
                            </td>
                            <td>
                              <span className="status-pill">
                                <span
                                  className={`status-dot ${
                                    usuario.Activo ? 'status-success' : 'status-danger'
                                  }`}
                                  aria-hidden="true"
                                />
                                {usuario.Activo ? 'Activo' : 'Inactivo'}
                              </span>
                            </td>
                            <td className="table-actions">
                              <button 
                                type="button" 
                                className="btn btn-outline btn-small"
                                onClick={() => {
                                  setSelectedUser(usuario)
                                  setNewPassword('')
                                  setShowResetPasswordModal(true)
                                }}
                                title="Restablecer contraseña"
                              >
                                <IconEye size={16} />
                              </button>
                              <button 
                                type="button" 
                                className="btn btn-outline btn-small"
                                onClick={() => handleEditClick(usuario)}
                                title="Editar usuario"
                              >
                                <IconEdit size={16} />
                              </button>
                              <button 
                                type="button" 
                                className="btn btn-outline btn-small danger"
                                onClick={() => handleDeleteUser(usuario)}
                                title="Eliminar usuario"
                              >
                                <IconTrash size={16} />
                              </button>
                            </td>
                          </tr>
                        )
                      })}
                    </>
                  )}

                  {/* Sección de Empleados */}
                  {empleadosFiltrados.length > 0 && (
                    <>
                      {(supervisoresFiltrados.length > 0 || empleadosFiltrados.length > 0) && (
                        <tr style={{ backgroundColor: '#f9fafb', borderTop: supervisoresFiltrados.length > 0 ? '2px solid #e5e7eb' : '2px solid #3b82f6' }}>
                          <td colSpan="6" style={{ padding: '0.75rem 1rem', fontWeight: '600', color: '#374151', fontSize: '0.875rem' }}>
                            <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                              <IconUser size={16} />
                              Empleados ({empleadosFiltrados.length})
                            </span>
                          </td>
                        </tr>
                      )}
                      {empleadosFiltrados.map((usuario) => {
                        const empleado = usuario.Empleados
                        return (
                          <tr key={usuario.Id}>
                            <td>{usuario.Email}</td>
                            <td>{usuario.NombreCompleto}</td>
                            <td>{usuario.Cedula}</td>
                            <td>
                              {empleado ? `${empleado.NombreCompleto} (${empleado.Puesto})` : '-'}
                            </td>
                            <td>
                              <span className="status-pill">
                                <span
                                  className={`status-dot ${
                                    usuario.Activo ? 'status-success' : 'status-danger'
                                  }`}
                                  aria-hidden="true"
                                />
                                {usuario.Activo ? 'Activo' : 'Inactivo'}
                              </span>
                            </td>
                            <td className="table-actions">
                              <button 
                                type="button" 
                                className="btn btn-outline btn-small"
                                onClick={() => {
                                  setSelectedUser(usuario)
                                  setNewPassword('')
                                  setShowResetPasswordModal(true)
                                }}
                                title="Restablecer contraseña"
                              >
                                <IconEye size={16} />
                              </button>
                              <button 
                                type="button" 
                                className="btn btn-outline btn-small"
                                onClick={() => handleEditClick(usuario)}
                                title="Editar usuario"
                              >
                                <IconEdit size={16} />
                              </button>
                              <button 
                                type="button" 
                                className="btn btn-outline btn-small danger"
                                onClick={() => handleDeleteUser(usuario)}
                                title="Eliminar usuario"
                              >
                                <IconTrash size={16} />
                              </button>
                            </td>
                          </tr>
                        )
                      })}
                    </>
                  )}
                </>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal para restablecer contraseña */}
      {showResetPasswordModal && selectedUser && (
        <div className="modal-overlay" onClick={() => {
          setShowResetPasswordModal(false)
          setSelectedUser(null)
          setNewPassword('')
          setError('')
          setMessage('')
        }}>
          <div className="modal-container" style={{ width: '800px', height: 'auto', maxWidth: '90vw' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Restablecer Contraseña</h3>
              <button 
                type="button" 
                className="modal-close-btn"
                onClick={() => {
                  setShowResetPasswordModal(false)
                  setSelectedUser(null)
                  setNewPassword('')
                  setError('')
                  setMessage('')
                }}
                aria-label="Cerrar"
              >
                ✕
              </button>
            </div>
            
            <div className="modal-body">
              <p style={{ marginBottom: '1rem', color: '#64748b' }}>
                Usuario: <strong>{selectedUser.NombreCompleto}</strong> ({selectedUser.Email})
              </p>
              <label>
                <span>Nueva Contraseña *</span>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Mínimo 6 caracteres"
                  minLength={6}
                  required
                />
              </label>
              {error && <div className="status error" style={{ marginTop: '0.5rem' }}>{error}</div>}
              {message && <div className="status success" style={{ marginTop: '0.5rem' }}>{message}</div>}
            </div>
            
            <div className="modal-footer">
              <button 
                type="button" 
                className="btn btn-outline"
                onClick={() => {
                  setShowResetPasswordModal(false)
                  setSelectedUser(null)
                  setNewPassword('')
                  setError('')
                  setMessage('')
                }}
              >
                Cancelar
              </button>
              <button 
                type="button" 
                className="btn btn-primary"
                onClick={handleResetPassword}
                disabled={loading || !newPassword}
              >
                {loading ? 'Restableciendo...' : 'Restablecer Contraseña'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal para editar usuario */}
      {showEditModal && selectedUser && editFormData && (
        <div className="modal-overlay" onClick={() => {
          setShowEditModal(false)
          setSelectedUser(null)
          setEditFormData(null)
          setEditRolesSeleccionados([])
          setError('')
          setMessage('')
        }}>
          <div className="modal-container" style={{ width: '80vw', height: '80vh', maxWidth: '95vw', maxHeight: '95vh' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
              <h3>Editar Usuario</h3>
                {autoSaving && (
                  <small style={{ color: '#64748b', fontSize: '0.875rem', fontWeight: 'normal' }}>
                    Guardando automáticamente...
                  </small>
                )}
                {lastSaved && !autoSaving && (
                  <small style={{ color: '#10b981', fontSize: '0.875rem', fontWeight: 'normal' }}>
                    Guardado a las {formatHoraCR(lastSaved)}
                  </small>
                )}
              </div>
              <button 
                type="button" 
                className="modal-close-btn"
                onClick={() => {
                  setShowEditModal(false)
                  setSelectedUser(null)
                  setEditFormData(null)
                  setEditScheduleData(null)
                  setError('')
                  setMessage('')
                  setAutoSaving(false)
                  setLastSaved(null)
                  recargarUsuarios()
                }}
                aria-label="Cerrar"
              >
                ✕
              </button>
            </div>
            
            <div className="modal-body">
              <form className="form-grid two-columns" style={{ gap: '0.75rem' }}>
                <div style={{ gridColumn: '1 / -1', marginBottom: '0.5rem', paddingBottom: '0.5rem', borderBottom: '2px solid #e2e8f0' }}>
                  <h4 style={{ margin: 0, color: '#0f172a', fontSize: '1rem', fontWeight: 600 }}>Datos de Usuario</h4>
                </div>
                
                <label>
                  <span>Email *</span>
                  <input
                    type="email"
                    value={editFormData.email}
                    onChange={(e) => {
                      setEditFormData({ ...editFormData, email: e.target.value })
                      setError('')
                    }}
                    required
                  />
                </label>

                <label>
                  <span>Teléfono</span>
                  <input
                    type="tel"
                    value={editFormData.phoneNumber || ''}
                    onChange={(e) => {
                      setEditFormData({ ...editFormData, phoneNumber: e.target.value })
                      setError('')
                    }}
                    placeholder="+506 8888-8888"
                  />
                </label>

                <label style={{ gridColumn: '1 / -1', position: 'relative' }} data-edit-roles-dropdown>
                  <span>Roles (Selección múltiple)</span>
                  <div style={{ position: 'relative' }}>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault()
                        setShowEditRolesDropdown(!showEditRolesDropdown)
                      }}
                      style={{
                        width: '100%',
                        padding: '0.5rem 0.75rem',
                        border: '1px solid #cbd5e1',
                        borderRadius: '8px',
                        fontSize: '0.875rem',
                        backgroundColor: '#fff',
                        textAlign: 'left',
                        cursor: 'pointer',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        minHeight: '38px'
                      }}
                    >
                      <span style={{ color: editRolesSeleccionados.length > 0 ? '#0f172a' : '#94a3b8' }}>
                        {editRolesSeleccionados.length > 0
                          ? editRolesSeleccionados.map(roleId => {
                              const rol = roles.find(r => r.Id === roleId)
                              return rol?.Name
                            }).join(', ')
                          : 'Seleccione un rol para el usuario'}
                      </span>
                      <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                        {showEditRolesDropdown ? '▲' : '▼'}
                      </span>
                    </button>
                    {showEditRolesDropdown && (
                      <div
                        style={{
                          position: 'absolute',
                          top: '100%',
                          left: 0,
                          right: 0,
                          marginTop: '0.25rem',
                          backgroundColor: '#fff',
                          border: '1px solid #cbd5e1',
                          borderRadius: '8px',
                          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                          zIndex: 1000,
                          maxHeight: '200px',
                          overflowY: 'auto'
                        }}
                      >
                        {roles.length === 0 ? (
                          <div style={{ padding: '0.5rem 0.75rem', color: '#94a3b8', fontSize: '0.875rem' }}>
                            Cargando roles...
                          </div>
                        ) : (
                          roles.map((rol) => (
                            <label
                              key={rol.Id}
                              style={{
                                display: 'flex',
                                flexDirection: 'row',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                padding: '0.5rem 0.75rem',
                                cursor: 'pointer',
                                borderBottom: '1px solid #f1f5f9',
                                transition: 'background-color 0.15s',
                                width: '100%'
                              }}
                              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f8fafc'}
                              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#fff'}
                              onClick={(e) => e.stopPropagation()}
                            >
                              <span style={{ cursor: 'pointer', flex: 1, textAlign: 'left' }}>{rol.Name}</span>
                              <input
                                type="checkbox"
                                checked={editRolesSeleccionados.includes(rol.Id)}
                                onChange={(e) => {
                                  const esSupervisor = rol.Name === 'Supervisor de Personal' || rol.NormalizedName === 'SUPERVISOR DE PERSONAL'
                                  if (e.target.checked) {
                                    const nuevosRoles = [...editRolesSeleccionados, rol.Id]
                                    setEditRolesSeleccionados(nuevosRoles)
                                    // Si se selecciona supervisor, cambiar proyecto
                                    if (esSupervisor) {
                                      setEditFormData({ 
                                        ...editFormData, 
                                        proyectoAsignado: '',
                                        proyectoSupervisado: editFormData.proyectoSupervisado || ''
                                      })
                                    }
                                  } else {
                                    const nuevosRoles = editRolesSeleccionados.filter(id => id !== rol.Id)
                                    setEditRolesSeleccionados(nuevosRoles)
                                    // Si se deselecciona supervisor, cambiar proyecto
                                    if (esSupervisor) {
                                      setEditFormData({ 
                                        ...editFormData, 
                                        proyectoSupervisado: '',
                                        proyectoAsignado: editFormData.proyectoAsignado || ''
                                      })
                                    }
                                  }
                                  setError('')
                                }}
                                style={{ width: 'auto', margin: 0, cursor: 'pointer', marginLeft: '0.5rem' }}
                              />
                            </label>
                          ))
                        )}
                      </div>
                    )}
                  </div>
                </label>

                {editFormData.empleadoId && (
                  <>
                    <div style={{ gridColumn: '1 / -1', marginTop: '0.5rem', marginBottom: '0.5rem', paddingTop: '0.5rem', borderTop: '2px solid #e2e8f0' }}>
                      <h4 style={{ margin: 0, color: '#0f172a', fontSize: '1rem', fontWeight: 600 }}>Datos de Empleado</h4>
                    </div>

                    <label>
                      <span>Nombre Completo *</span>
                      <input
                        type="text"
                        value={editFormData.nombreCompleto}
                        onChange={(e) => {
                          setEditFormData({ ...editFormData, nombreCompleto: e.target.value })
                          setError('')
                        }}
                        placeholder="Juan Pérez García"
                        required
                      />
                    </label>

                    <label>
                      <span>Cédula *</span>
                      <input
                        type="text"
                        value={editFormData.cedula}
                        onChange={(e) => {
                          setEditFormData({ ...editFormData, cedula: e.target.value })
                          setError('')
                        }}
                        placeholder="123456789"
                        required
                      />
                    </label>

                    <label>
                      <span>Fecha de Nacimiento *</span>
                      <input
                        type="date"
                        value={editFormData.fechaNacimiento}
                        onChange={(e) => {
                          setEditFormData({ ...editFormData, fechaNacimiento: e.target.value })
                          setError('')
                        }}
                        required
                      />
                    </label>

                    <label>
                      <span>Puesto *</span>
                      <input
                        type="text"
                        value={editFormData.puesto}
                        onChange={(e) => {
                          setEditFormData({ ...editFormData, puesto: e.target.value })
                          setError('')
                        }}
                        placeholder="Desarrollador"
                        required
                      />
                    </label>

                    <label>
                      <span>Fecha de Ingreso *</span>
                      <input
                        type="date"
                        value={editFormData.fechaIngreso}
                        onChange={(e) => {
                          setEditFormData({ ...editFormData, fechaIngreso: e.target.value })
                          setError('')
                        }}
                        required
                      />
                    </label>

                    {editRolesSeleccionados.some(roleId => {
                      const rol = roles.find(r => r.Id === roleId)
                      return rol?.Name === 'Supervisor de Personal' || rol?.NormalizedName === 'SUPERVISOR DE PERSONAL'
                    }) ? (
                      <label>
                        <span>Proyecto Supervisado *</span>
                        <select
                          value={editFormData.proyectoSupervisado || ''}
                          onChange={(e) => {
                            setEditFormData({ ...editFormData, proyectoSupervisado: e.target.value })
                            setError('')
                          }}
                          required
                        >
                          <option value="">Selecciona un proyecto</option>
                          {proyectos.map((proyecto) => (
                            <option key={proyecto} value={proyecto}>
                              {proyecto}
                            </option>
                          ))}
                        </select>
                      </label>
                    ) : (
                    <label>
                      <span>Proyecto Asignado *</span>
                      <select
                        value={editFormData.proyectoAsignado || ''}
                        onChange={(e) => {
                          setEditFormData({ ...editFormData, proyectoAsignado: e.target.value })
                          setError('')
                        }}
                        required
                      >
                        <option value="">Selecciona un proyecto</option>
                        {proyectos.map((proyecto) => (
                          <option key={proyecto} value={proyecto}>
                            {proyecto}
                          </option>
                        ))}
                      </select>
                    </label>
                    )}

                    <label style={{ gridColumn: '1 / -1' }}>
                      <span>Horario Laboral *</span>
                      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                        <input
                          type="text"
                          readOnly
                          value={
                            editScheduleData 
                              ? 'Horario configurado (click para editar)'
                              : 'Sin horario configurado'
                          }
                          placeholder="Selecciona el horario laboral"
                          style={{ 
                            flex: 1,
                            cursor: 'pointer',
                            backgroundColor: editScheduleData ? '#f0f9ff' : '#f9fafb'
                          }}
                          onClick={() => setShowEditScheduleModal(true)}
                          required
                        />
                        <button
                          type="button"
                          className="btn btn-outline btn-small"
                          onClick={() => setShowEditScheduleModal(true)}
                        >
                          {editScheduleData ? 'Editar' : 'Seleccionar'}
                        </button>
                      </div>
                    </label>

                    {/* Solo mostrar campo de supervisor si NO es supervisor */}
                    {!esSupervisorEdit() && (
                      <label>
                        <span>Supervisor *</span>
                        <select
                          value={editFormData.supervisorId || ''}
                          onChange={(e) => {
                            setEditFormData({ ...editFormData, supervisorId: e.target.value || null })
                            setError('')
                          }}
                          required
                        >
                          <option value="">Selecciona un supervisor</option>
                          {supervisores.map((supervisor) => (
                            <option key={supervisor.Id} value={supervisor.Id}>
                              {supervisor.NombreCompleto}
                            </option>
                          ))}
                        </select>
                      </label>
                    )}

                    <label>
                      <span>Contacto de Emergencia</span>
                      <input
                        type="tel"
                        value={editFormData.contactoEmergencia || ''}
                        onChange={(e) => {
                          setEditFormData({ ...editFormData, contactoEmergencia: e.target.value })
                          setError('')
                        }}
                        placeholder="+506 8888-8888"
                      />
                    </label>

                    <label>
                      <span>Nombre Contacto Emergencia</span>
                      <input
                        type="text"
                        value={editFormData.nombreContactoEmergencia || ''}
                        onChange={(e) => {
                          setEditFormData({ ...editFormData, nombreContactoEmergencia: e.target.value })
                          setError('')
                        }}
                        placeholder="María Pérez"
                      />
                    </label>

                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexDirection: 'row', paddingTop: '1.5rem' }}>
                      <input
                        type="checkbox"
                        checked={editFormData.extranjero || false}
                        onChange={(e) => {
                          setEditFormData({ 
                            ...editFormData, 
                            extranjero: e.target.checked,
                            permisoTrabajo: e.target.checked ? editFormData.permisoTrabajo : ''
                          })
                          setError('')
                        }}
                        style={{ width: 'auto', margin: 0 }}
                      />
                      <span style={{ fontWeight: 600, color: '#475569' }}>Extranjero</span>
                    </label>

                    {editFormData.extranjero && (
                      <label style={{ gridColumn: '1 / -1' }}>
                        <span>Permiso de Trabajo *</span>
                        <input
                          type="text"
                          value={editFormData.permisoTrabajo || ''}
                          onChange={(e) => {
                            setEditFormData({ ...editFormData, permisoTrabajo: e.target.value })
                            setError('')
                          }}
                          placeholder="Número de permiso de trabajo"
                          required={editFormData.extranjero}
                        />
                      </label>
                    )}

                    <label style={{ gridColumn: '1 / -1' }}>
                      <span>Contrato del Empleado (Opcional)</span>
                      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
                        <input
                          type="file"
                          ref={editContratoInputRef}
                          accept=".pdf,.doc,.docx"
                          onChange={(e) => {
                            const file = e.target.files?.[0] || null
                            setEditFormData({ ...editFormData, contrato: file })
                            setError('')
                          }}
                          style={{
                            flex: 1,
                            minWidth: '200px',
                            padding: '0.5rem',
                            border: '1px solid #cbd5e1',
                            borderRadius: '0.375rem',
                            fontSize: '0.875rem'
                          }}
                        />
                        {editFormData.contrato && (
                          <span style={{ fontSize: '0.875rem', color: '#059669' }}>
                            {editFormData.contrato.name}
                          </span>
                        )}
                        {editFormData.contratoUrl && !editFormData.contrato && (
                          <a 
                            href={editFormData.contratoUrl} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            style={{ fontSize: '0.875rem', color: '#2563eb', textDecoration: 'underline' }}
                          >
                            Ver contrato actual
                          </a>
                        )}
                      </div>
                    </label>
                  </>
                )}

                {error && <div className="status error" style={{ gridColumn: '1 / -1', marginTop: '0.5rem' }}>{error}</div>}
                {message && <div className="status success" style={{ gridColumn: '1 / -1', marginTop: '0.5rem' }}>{message}</div>}
              </form>
            </div>
            
            <div className="modal-footer">
              <button 
                type="button" 
                className="btn btn-outline"
                onClick={() => {
                  setShowEditModal(false)
                  setSelectedUser(null)
                  setEditFormData(null)
                  setEditScheduleData(null)
                  setEditRolesSeleccionados([])
                  setError('')
                  setMessage('')
                  setAutoSaving(false)
                  setLastSaved(null)
                  recargarUsuarios()
                }}
              >
                Cancelar
              </button>
              <button 
                type="button" 
                className="btn btn-primary"
                onClick={() => {
                  handleSaveEdit(false)
                }}
                disabled={loading || autoSaving}
              >
                {loading ? 'Guardando...' : autoSaving ? 'Guardando automáticamente...' : 'Cerrar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de horario para edición */}
      <ScheduleModal
        isOpen={showEditScheduleModal}
        onClose={() => setShowEditScheduleModal(false)}
        onSave={(schedule) => {
          setEditScheduleData(schedule)
          setShowEditScheduleModal(false)
          setError('')
        }}
        initialSchedule={editScheduleData}
      />
    </div>
  )
}

const PayrollPanel = () => {
  const [payrollRows, setPayrollRows] = useState([])
  const [summary, setSummary] = useState([
    { label: 'Total Empleados', value: '0' },
    { label: 'Días Registrados', value: '0' },
    { label: 'Presente', value: '0' },
    { label: 'Vacaciones', value: '0' },
    { label: 'Permisos', value: '0' },
    { label: 'Incapacidades', value: '0' },
    { label: 'Ausencias', value: '0' },
    { label: 'Tardías (min)', value: '0' },
  ])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const cargarDatos = async () => {
      // Cargar asistencias y empleados con sus horarios
      // Cargar asistencias
      const { data: asistenciasData } = await supabase
        .from('Asistencias')
        .select(`
          *,
          Empleados:EmpleadoId (Id, NombreCompleto, HorarioLaboral)
        `)
        .order('Fecha', { ascending: false })
        .limit(100)

      // Cargar todos los permisos aprobados
      const { data: permisosData } = await supabase
        .from('Permisos')
        .select('*')
        .eq('Estado', 'Aprobado')
        .order('FechaInicio', { ascending: false })

      if (asistenciasData) {
        // Crear un mapa de permisos por empleado y fecha
        const permisosPorEmpleado = {}
        if (permisosData) {
          permisosData.forEach(permiso => {
            if (!permisosPorEmpleado[permiso.EmpleadoId]) {
              permisosPorEmpleado[permiso.EmpleadoId] = []
            }
            permisosPorEmpleado[permiso.EmpleadoId].push(permiso)
          })
        }

        // Función para verificar si una fecha está dentro de un rango de permisos
        const tienePermisoEnFecha = (empleadoId, fecha) => {
          const permisos = permisosPorEmpleado[empleadoId] || []
          const fechaObj = toCostaRicaDate(fecha) || new Date(fecha)
          return permisos.some(permiso => {
            const inicio = toCostaRicaDate(permiso.FechaInicio) || new Date(permiso.FechaInicio)
            const fin = toCostaRicaDate(permiso.FechaFin) || new Date(permiso.FechaFin)
            return fechaObj >= inicio && fechaObj <= fin
          })
        }

        // Función para obtener el tipo de permiso en una fecha
        const obtenerTipoPermisoEnFecha = (empleadoId, fecha) => {
          const permisos = permisosPorEmpleado[empleadoId] || []
          const fechaObj = toCostaRicaDate(fecha) || new Date(fecha)
          const permiso = permisos.find(p => {
            const inicio = toCostaRicaDate(p.FechaInicio) || new Date(p.FechaInicio)
            const fin = toCostaRicaDate(p.FechaFin) || new Date(p.FechaFin)
            return fechaObj >= inicio && fechaObj <= fin
          })
          return permiso?.Tipo || null
        }

        // Función para recalcular tardía basándose en el horario del empleado
        const recalcularTardia = async (asistencia, empleado) => {
          // Si no hay hora de entrada, no hay tardía
          if (!asistencia.HoraEntrada) return 0
          
          // SIEMPRE obtener el horario laboral directamente de la tabla Empleados
          // para asegurarnos de tener la versión más actualizada
          let horarioLaboral = null
          
          if (empleado?.Id) {
            const { data: empleadoData, error: empleadoError } = await supabase
              .from('Empleados')
              .select('HorarioLaboral')
              .eq('Id', empleado.Id)
              .single()
            
            if (empleadoError) {
              console.error(`Error al obtener horario laboral para empleado ${empleado.Id}:`, empleadoError)
            } else if (empleadoData?.HorarioLaboral) {
              // Parsear el horario si viene como string JSON
              if (typeof empleadoData.HorarioLaboral === 'string') {
                try {
                  horarioLaboral = JSON.parse(empleadoData.HorarioLaboral)
                } catch (e) {
                  console.error('Error al parsear horario laboral:', e)
                  // Intentar usar el horario del JOIN como fallback
                  if (empleado?.HorarioLaboral) {
                    try {
                      horarioLaboral = typeof empleado.HorarioLaboral === 'string' 
                        ? JSON.parse(empleado.HorarioLaboral) 
                        : empleado.HorarioLaboral
                    } catch (e2) {
                      console.error('Error al parsear horario del JOIN:', e2)
                    }
                  }
                }
              } else {
                horarioLaboral = empleadoData.HorarioLaboral
              }
            }
          }
          
          // Si aún no hay horario laboral, intentar usar el del JOIN como último recurso
          if (!horarioLaboral && empleado?.HorarioLaboral) {
            try {
              horarioLaboral = typeof empleado.HorarioLaboral === 'string' 
                ? JSON.parse(empleado.HorarioLaboral) 
                : empleado.HorarioLaboral
            } catch (e) {
              console.error('Error al parsear horario del JOIN:', e)
            }
          }
          
          // Si aún no hay horario laboral, no calcular tardía
          if (!horarioLaboral) {
            console.warn(`⚠️ No hay horario laboral configurado para ${empleado?.NombreCompleto || 'empleado'}, no se calcula tardía`)
            return 0
          }

          // VERIFICAR SI ES DÍA LABORAL SEGÚN EL HORARIO
          const esDiaLaboralFecha = esDiaLaboral(horarioLaboral, asistencia.Fecha)
          if (!esDiaLaboralFecha) {
            console.log(`ℹ️ ${asistencia.Fecha} no es día laboral según el horario, no se calcula tardía`)
            return 0
          }

          try {
            // Obtener hora esperada según el horario del empleado
            const horaEsperadaData = obtenerHoraEntradaEsperada(horarioLaboral, asistencia.Fecha)
            
            if (!horaEsperadaData) {
              console.warn(`⚠️ No se pudo obtener hora esperada para ${empleado?.NombreCompleto} en ${asistencia.Fecha}`)
              // Si no hay hora esperada para ese día, no hay tardía
              return 0
            }

            // Convertir hora de entrada a GMT-6 usando toLocaleString (igual que en el registro)
            const horaEntradaReal = new Date(asistencia.HoraEntrada)
            const horaRealStr = horaEntradaReal.toLocaleString('en-US', { 
              timeZone: 'Etc/GMT+6',
              hour: '2-digit',
              minute: '2-digit',
              hour12: false
            })
            
            const [horaReal, minutoReal] = horaRealStr.split(':').map(Number)
            
            // Calcular diferencia en minutos desde medianoche
            const minutosReal = horaReal * 60 + minutoReal
            const minutosEsperados = horaEsperadaData.hora * 60 + horaEsperadaData.minuto
            
            // Calcular tardía básica (solo si llegó después de la hora esperada)
            const diferencia = minutosReal - minutosEsperados
            const minutosTardiaBasica = diferencia > 0 ? diferencia : 0
            
            // Aplicar reglas especiales de cálculo de tardía
            const tardiaCalculada = calcularTardiaConReglas(minutosTardiaBasica)
            const minutosTardia = minutosTardiaBasica // Guardamos los minutos reales para la BD

            console.log(`📊 Cálculo de tardía para ${empleado?.NombreCompleto}:`, {
              fecha: asistencia.Fecha,
              horaEntradaUTC: asistencia.HoraEntrada,
              horaEsperada: `${horaEsperadaData.hora}:${String(horaEsperadaData.minuto).padStart(2, '0')}`,
              horaReal: `${horaReal}:${String(minutoReal).padStart(2, '0')}`,
              minutosEsperados,
              minutosReal,
              diferencia,
              minutosTardiaBasica,
              tardiaCalculada: tardiaCalculada.descripcion,
              anterior: asistencia.MinutosTardia,
              horarioLaboral: horarioLaboral
            })

            // Siempre actualizar en la base de datos si hay diferencia o si no estaba calculado
            if ((minutosTardia !== asistencia.MinutosTardia || asistencia.MinutosTardia === null) && asistencia.Id) {
              // Actualizar de forma asíncrona sin bloquear la UI
              const { error } = await supabase
                .from('Asistencias')
                .update({ MinutosTardia: minutosTardia })
                .eq('Id', asistencia.Id)
              
              if (error) {
                console.error('Error al actualizar minutos de tardía:', error)
              } else {
                console.log(`✅ Tardía actualizada: ${tardiaCalculada.descripcion} (${minutosTardia} minutos reales, antes: ${asistencia.MinutosTardia})`)
                // Actualizar el valor en el objeto asistencia para reflejarlo inmediatamente
                asistencia.MinutosTardia = minutosTardia
              }
            }

            return minutosTardia
          } catch (err) {
            console.error('Error al recalcular tardía:', err)
            // En caso de error, usar el valor guardado
            return asistencia.MinutosTardia !== null && asistencia.MinutosTardia !== undefined ? asistencia.MinutosTardia : 0
          }
        }

        // Recalcular tardías para todas las asistencias de forma asíncrona
        const rowsPromises = asistenciasData.map(async (asistencia) => {
          const tienePermiso = tienePermisoEnFecha(asistencia.EmpleadoId, asistencia.Fecha)
          const tipoPermiso = obtenerTipoPermisoEnFecha(asistencia.EmpleadoId, asistencia.Fecha)
          
          // Si tiene permiso de vacaciones, mostrar como vacaciones
          const esVacaciones = tienePermiso && tipoPermiso === 'Vacaciones'
          const esPermiso = tienePermiso && tipoPermiso !== 'Vacaciones'
          
          // Obtener empleado y verificar si es día laboral según su horario
          const empleado = asistencia.Empleados
          let esDiaLaboralSegunHorario = false
          let minutosTardia = 0
          
          // Verificar si es día laboral según el horario del empleado
          if (empleado?.HorarioLaboral) {
            esDiaLaboralSegunHorario = esDiaLaboral(empleado.HorarioLaboral, asistencia.Fecha)
            
            // Solo calcular tardía si es día laboral
            if (esDiaLaboralSegunHorario) {
              minutosTardia = await recalcularTardia(asistencia, empleado)
            } else {
              // Si no es día laboral, no hay tardía
              minutosTardia = 0
            }
          } else {
            // Si no tiene horario, no se puede determinar si es día laboral
            // No calcular tardía
            minutosTardia = 0
          }
          
          // Formatear hora de llegada en zona horaria de Costa Rica
          const horaLlegada = formatHoraCR(asistencia.HoraEntrada) || '-'
          
          // Solo contar como presente/ausente si es día laboral según el horario
          // Si no es día laboral, no cuenta como presente ni ausente
          const esPresente = esDiaLaboralSegunHorario && asistencia.Estado === 'Presente' && !tienePermiso
          const esAusente = esDiaLaboralSegunHorario && asistencia.Estado === 'Ausente' && !tienePermiso
          
          return {
            employee: empleado?.NombreCompleto || 'N/A',
            date: formatFechaCR(asistencia.Fecha),
            present: esPresente,
            arrival: horaLlegada,
            vacations: esVacaciones ? 1 : 0,
            permits: esPermiso ? 1 : 0,
            sick: 0, // Se puede expandir con justificaciones de incapacidad
            absences: esAusente ? 1 : 0,
            tardiness: minutosTardia,
          }
        })
        
        // Esperar a que todas las promesas se resuelvan
        const rows = await Promise.all(rowsPromises)

        setPayrollRows(rows)

        // Calcular resumen
        const totalEmpleados = new Set(asistenciasData.map((a) => a.EmpleadoId)).size
        const diasRegistrados = asistenciasData.length
        const presentes = rows.filter((r) => r.present).length
        const ausentes = rows.filter((r) => r.absences > 0).length
        const vacaciones = rows.filter((r) => r.vacations > 0).length
        const permisos = rows.filter((r) => r.permits > 0).length
        const totalTardias = rows.reduce((sum, r) => sum + r.tardiness, 0)

        setSummary([
          { label: 'Total Empleados', value: totalEmpleados.toString() },
          { label: 'Días Registrados', value: diasRegistrados.toString() },
          { label: 'Presente', value: presentes.toString() },
          { label: 'Vacaciones', value: vacaciones.toString() },
          { label: 'Permisos', value: permisos.toString() },
          { label: 'Incapacidades', value: '0' },
          { label: 'Ausencias', value: ausentes.toString() },
          { label: 'Tardías (min)', value: totalTardias.toString() },
        ])
      }

      setLoading(false)
    }

    cargarDatos()
  }, [])

  return (
    <div className="section-stack">
      <div className="panel-header">
        <div className="panel-title">
          <span className="title-icon" aria-hidden="true">
            📄
          </span>
          <div>
            <p className="eyebrow">JDS Gestión</p>
            <h2>Reporte de Planilla</h2>
            <p className="page-subtitle">
              Sistema interno de control y gestión del personal.
            </p>
          </div>
        </div>
        <div className="panel-header-meta filter-row compact">
          <label>
            <span>Desde</span>
            <input type="date" />
          </label>
          <label>
            <span>Hasta</span>
            <input type="date" />
          </label>
        </div>
      </div>

      <div className="section-card report-filter-card">
        <div className="report-section">
          <div className="section-icon" aria-hidden="true">
            <IconCalendar size={24} />
          </div>
              <div>
            <p className="card-label">Filtro de Fechas</p>
                <p className="card-description">
              Selecciona un rango específico para exportar la información.
            </p>
          </div>
          <div className="filter-row compact">
            <input type="date" placeholder="Desde" />
            <input type="date" placeholder="Hasta" />
          </div>
        </div>

        <div className="report-section bordered">
          <div className="section-icon" aria-hidden="true">
            <IconSearch size={24} />
          </div>
          <div className="individual-search">
            <p className="card-label">Reporte Individual</p>
            <input type="text" placeholder="Buscar empleado por nombre" />
            <small>Ingrese un nombre exacto y rango de fechas.</small>
          </div>
          <button type="button" className="btn btn-secondary btn-small">
            Buscar
          </button>
        </div>

        <div className="table-scroll">
          <table className="data-table">
            <thead>
              <tr>
                <th>Empleado</th>
                <th>Fecha</th>
                <th>Presente</th>
                <th>Hora de llegada</th>
                <th>Vacaciones</th>
                <th>Permisos</th>
                <th>Incapacidades</th>
                <th>Ausencias</th>
                <th>Tardías (min)</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {payrollRows.map((row) => (
                <tr key={row.employee}>
                  <td>{row.employee}</td>
                  <td>{row.date}</td>
                  <td>
                    <input type="checkbox" checked={row.present} readOnly />
                  </td>
                  <td>{row.arrival}</td>
                  <td>{row.vacations}</td>
                  <td>{row.permits}</td>
                  <td>{row.sick}</td>
                  <td>{row.absences}</td>
                  <td>{row.tardiness}</td>
                  <td>
                    <button type="button" className="btn btn-outline btn-small">
                      <IconTrash size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="table-actions-row">
          <button type="button" className="btn btn-primary">
            + Agregar fila
          </button>
          <div className="table-actions-right">
            <button type="button" className="btn btn-secondary">
              Descargar Excel
            </button>
            <button type="button" className="btn btn-secondary ghost">
              Descargar PDF
            </button>
          </div>
        </div>
      </div>

      <div className="summary-grid">
        {summary.map((item) => (
          <article key={item.label} className="summary-card">
            <p>{item.label}</p>
            <strong>{item.value}</strong>
          </article>
        ))}
      </div>
    </div>
  )
}

const PermitsPanel = ({ currentUser, sessionInfo }) => {
  const [formData, setFormData] = useState({
    tipo: '',
    fechaInicio: '',
    fechaFin: '',
    horaInicio: '',
    horaFin: '',
    justificacion: '',
    archivo: null
  })
  const [permisos, setPermisos] = useState([])
  const [tiposPermisos, setTiposPermisos] = useState(['Permiso', 'Vacaciones', 'Cita Medica'])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [editingPermiso, setEditingPermiso] = useState(null)
  const [isSupervisor, setIsSupervisor] = useState(false)
  const [empleadoId, setEmpleadoId] = useState(null)
  const fileInputRef = useRef(null)

  // Verificar si el usuario es supervisor
  useEffect(() => {
    const verificarRol = async () => {
      if (!sessionInfo?.user?.email) {
        console.warn('No hay información de sesión disponible')
        return
      }

      try {
        // Obtener usuario
        const emailNormalizado = sessionInfo.user.email.toUpperCase()
        const { data: usuario, error: usuarioError } = await supabase
          .from('Usuarios')
          .select('Id, EmpleadoId')
          .eq('NormalizedEmail', emailNormalizado)
          .maybeSingle()

        if (usuarioError) {
          console.error('Error al obtener usuario:', usuarioError)
          return
        }

        if (usuario?.EmpleadoId) {
          setEmpleadoId(usuario.EmpleadoId)
        }

        if (usuario) {
          // Obtener roles del usuario
          const { data: rolesUsuario, error: rolesError } = await supabase
            .from('UsuariosRoles')
            .select('RoleId, Roles:RoleId (Id, Name, NormalizedName)')
            .eq('UserId', usuario.Id)

          if (rolesError) {
            console.error('Error al obtener roles:', rolesError)
            return
          }

          const roles = rolesUsuario?.map(ur => ur.Roles).filter(Boolean) || []
          const tieneSupervisor = roles.some(
            r => r?.Name === 'Supervisor de Personal' || r?.NormalizedName === 'SUPERVISOR DE PERSONAL'
          )
          setIsSupervisor(tieneSupervisor)
        }
      } catch (err) {
        console.error('Error al verificar rol:', err)
        setError('Error al cargar la información del usuario')
      }
    }

    verificarRol()
  }, [sessionInfo])

  // Cargar tipos de permisos
  useEffect(() => {
    const cargarTipos = async () => {
      const tipos = await cargarTiposPermisos()
      setTiposPermisos(tipos)
    }
    cargarTipos()
    
    // Suscribirse a cambios en la tabla TiposPermisos
    const subscription = supabase
      .channel('tipos-permisos-changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'TiposPermisos' },
        async () => {
          const tipos = await cargarTiposPermisos()
          setTiposPermisos(tipos)
        }
      )
      .subscribe()
    
    return () => {
      subscription.unsubscribe()
    }
  }, [])

  // Cargar permisos
  useEffect(() => {
    const cargarPermisos = async () => {
      // Esperar a que se determine si es supervisor o se tenga empleadoId
      if (empleadoId === null && !isSupervisor) {
        // Si aún no se ha verificado el rol, no cargar
        return
      }

      try {
        let query = supabase
          .from('Permisos')
          .select('*, Empleados:EmpleadoId (NombreCompleto)')
          .order('FechaRegistro', { ascending: false })

        // Si no es supervisor, solo mostrar sus propios permisos
        if (!isSupervisor && empleadoId) {
          query = query.eq('EmpleadoId', empleadoId)
        }

        const { data, error: fetchError } = await query

        if (fetchError) {
          console.error('Error al cargar permisos:', fetchError)
          // Si es un error de relación, intentar sin la relación
          if (fetchError.code === 'PGRST116' || fetchError.message?.includes('relation')) {
            const { data: dataSimple, error: errorSimple } = await supabase
              .from('Permisos')
              .select('*')
              .order('FechaRegistro', { ascending: false })
            
            if (!errorSimple && dataSimple) {
              setPermisos(dataSimple)
              return
            }
          }
          throw fetchError
        }

        if (data) {
          setPermisos(data)
        } else {
          setPermisos([])
        }
      } catch (err) {
        console.error('Error al cargar permisos:', err)
        setError('Error al cargar los permisos. Por favor, recarga la página.')
        setPermisos([])
      }
    }

    cargarPermisos()
  }, [empleadoId, isSupervisor])

  // Validar fechas (usando hora de Costa Rica)
  const validarFechas = (fechaInicio, fechaFin) => {
    if (!fechaInicio || !fechaFin) return true
    const inicio = toCostaRicaDate(fechaInicio) || new Date(fechaInicio)
    const fin = toCostaRicaDate(fechaFin) || new Date(fechaFin)
    return inicio <= fin
  }

  // Validar horas
  const validarHoras = (fechaInicio, fechaFin, horaInicio, horaFin) => {
    if (!horaInicio || !horaFin) return true
    if (fechaInicio === fechaFin) {
      // Si es el mismo día, comparar horas
      const [hInicio, mInicio] = horaInicio.split(':').map(Number)
      const [hFin, mFin] = horaFin.split(':').map(Number)
      const minutosInicio = hInicio * 60 + mInicio
      const minutosFin = hFin * 60 + mFin
      return minutosInicio <= minutosFin
    }
    return true
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    const newFormData = { ...formData, [name]: value }
    
    // Si se cambia el tipo y no requiere horas, limpiar campos de hora
    if (name === 'tipo' && value !== 'Permiso' && value !== 'Cita Medica') {
      newFormData.horaInicio = ''
      newFormData.horaFin = ''
    }
    
    setFormData(newFormData)
    setError('')
  }

  const handleFileChange = (e) => {
    setFormData(prev => ({ ...prev, archivo: e.target.files[0] }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setMessage('')

    try {
      // Validaciones
      if (!formData.tipo) {
        throw new Error('Debe seleccionar un tipo de solicitud')
      }
      if (!formData.fechaInicio || !formData.fechaFin) {
        throw new Error('Debe completar las fechas de inicio y fin')
      }
      if (!validarFechas(formData.fechaInicio, formData.fechaFin)) {
        throw new Error('La fecha de inicio no puede ser posterior a la fecha de fin')
      }
      if (!formData.justificacion.trim()) {
        throw new Error('Debe proporcionar una justificación')
      }

      // Validar horas para Permiso y Cita Medica
      if ((formData.tipo === 'Permiso' || formData.tipo === 'Cita Medica') && 
          (!formData.horaInicio || !formData.horaFin)) {
        throw new Error('Debe completar las horas de inicio y fin para este tipo de solicitud')
      }

      if ((formData.tipo === 'Permiso' || formData.tipo === 'Cita Medica') &&
          !validarHoras(formData.fechaInicio, formData.fechaFin, formData.horaInicio, formData.horaFin)) {
        throw new Error('La hora de inicio no puede ser posterior a la hora de fin')
      }

      if (!empleadoId) {
        throw new Error('No se pudo identificar al empleado')
      }

      // Subir archivo si existe
      let documentoUrl = null
      if (formData.archivo) {
        const fileExt = formData.archivo.name.split('.').pop()
        const fileName = `${Math.random()}.${fileExt}`
        const filePath = `permisos/${fileName}`

        const { error: uploadError } = await supabase.storage
          .from('documentos')
          .upload(filePath, formData.archivo)

        if (uploadError) throw uploadError

        const { data: { publicUrl } } = supabase.storage
          .from('documentos')
          .getPublicUrl(filePath)

        documentoUrl = publicUrl
      }

      // Crear permiso
      const permisoData = {
        EmpleadoId: empleadoId,
        Tipo: formData.tipo,
        FechaInicio: formData.fechaInicio,
        FechaFin: formData.fechaFin,
        HoraInicio: (formData.tipo === 'Permiso' || formData.tipo === 'Cita Medica') ? formData.horaInicio : null,
        HoraFin: (formData.tipo === 'Permiso' || formData.tipo === 'Cita Medica') ? formData.horaFin : null,
        Justificacion: formData.justificacion,
        DocumentoSoporte: documentoUrl,
        Estado: 'Pendiente'
      }

      const { error: insertError } = await supabase
        .from('Permisos')
        .insert(permisoData)

      if (insertError) throw insertError

      setMessage('Solicitud enviada correctamente')
      setFormData({
        tipo: '',
        fechaInicio: '',
        fechaFin: '',
        horaInicio: '',
        horaFin: '',
        justificacion: '',
        archivo: null
      })
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
      
      // Recargar permisos
      let query = supabase
        .from('Permisos')
        .select('*, Empleados:EmpleadoId (NombreCompleto)')
        .order('FechaRegistro', { ascending: false })

      if (!isSupervisor && empleadoId) {
        query = query.eq('EmpleadoId', empleadoId)
      }

      const { data: nuevosPermisos } = await query

      if (nuevosPermisos) {
        setPermisos(nuevosPermisos)
      }
    } catch (err) {
      setError(err.message || 'Error al enviar la solicitud')
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (permiso) => {
    setEditingPermiso(permiso)
    setFormData({
      tipo: permiso.Tipo,
      fechaInicio: permiso.FechaInicio,
      fechaFin: permiso.FechaFin,
      horaInicio: permiso.HoraInicio || '',
      horaFin: permiso.HoraFin || '',
      justificacion: permiso.Justificacion,
      archivo: null
    })
  }

  const handleUpdate = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setMessage('')

    try {
      // Validaciones
      if (!validarFechas(formData.fechaInicio, formData.fechaFin)) {
        throw new Error('La fecha de inicio no puede ser posterior a la fecha de fin')
      }
      if ((formData.tipo === 'Permiso' || formData.tipo === 'Cita Medica') &&
          !validarHoras(formData.fechaInicio, formData.fechaFin, formData.horaInicio, formData.horaFin)) {
        throw new Error('La hora de inicio no puede ser posterior a la hora de fin')
      }

      const updateData = {
        Tipo: formData.tipo,
        FechaInicio: formData.fechaInicio,
        FechaFin: formData.fechaFin,
        HoraInicio: (formData.tipo === 'Permiso' || formData.tipo === 'Cita Medica') ? formData.horaInicio : null,
        HoraFin: (formData.tipo === 'Permiso' || formData.tipo === 'Cita Medica') ? formData.horaFin : null,
        Justificacion: formData.justificacion
      }

      const { error: updateError } = await supabase
        .from('Permisos')
        .update(updateData)
        .eq('Id', editingPermiso.Id)

      if (updateError) throw updateError

      setMessage('Permiso actualizado correctamente')
      setEditingPermiso(null)
      setFormData({
        tipo: '',
        fechaInicio: '',
        fechaFin: '',
        horaInicio: '',
        horaFin: '',
        justificacion: '',
        archivo: null
      })

      // Recargar permisos
      const { data: nuevosPermisos } = await supabase
        .from('Permisos')
        .select('*, Empleados:EmpleadoId (NombreCompleto)')
        .order('FechaRegistro', { ascending: false })

      if (nuevosPermisos) {
        if (!isSupervisor && empleadoId) {
          setPermisos(nuevosPermisos.filter(p => p.EmpleadoId === empleadoId))
        } else {
          setPermisos(nuevosPermisos)
        }
      }
    } catch (err) {
      setError(err.message || 'Error al actualizar el permiso')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (permisoId) => {
    if (!confirm('¿Está seguro de que desea eliminar este permiso?')) return

    try {
      const { error: deleteError } = await supabase
        .from('Permisos')
        .delete()
        .eq('Id', permisoId)

      if (deleteError) throw deleteError

      setPermisos(permisos.filter(p => p.Id !== permisoId))
      setMessage('Permiso eliminado correctamente')
    } catch (err) {
      setError(err.message || 'Error al eliminar el permiso')
    }
  }

  const mostrarHoras = (tipo) => {
    return tipo === 'Permiso' || tipo === 'Cita Medica'
  }

  // Obtener fecha de hoy en formato YYYY-MM-DD
  const getTodayDate = () => {
    // Obtener fecha de hoy en zona horaria de Costa Rica
    const today = getCostaRicaTime()
    const year = today.getFullYear()
    const month = String(today.getMonth() + 1).padStart(2, '0')
    const day = String(today.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }

  // Mostrar mensaje si no hay sesión
  if (!sessionInfo?.user) {
    return (
      <div className="section-stack">
        <div className="panel-header">
          <div>
            <p className="eyebrow">Solicitud de Permisos</p>
            <h2>Gestiona incapacidades, vacaciones o ausencias</h2>
          </div>
        </div>
        <div className="section-card">
          <p style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>
            Por favor, inicia sesión para acceder a este módulo.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="section-stack">
      <div className="panel-header">
        <div>
          <p className="eyebrow">Solicitud de Permisos</p>
          <h2>Gestiona incapacidades, vacaciones o ausencias</h2>
        </div>
        <div className="panel-header-meta">
          <span className="time-pill">
            Sesión activa: {currentUser || 'Usuario'}
          </span>
        </div>
      </div>

      <div className="section-card form-card">
        <form onSubmit={editingPermiso ? handleUpdate : handleSubmit}>
        <div className="form-grid">
          <label>
              <span>Tipo de Solicitud *</span>
              <select 
                name="tipo"
                value={formData.tipo}
                onChange={handleChange}
                required
              >
              <option value="">Selecciona una opción</option>
                {tiposPermisos.map((tipo) => (
                  <option key={tipo} value={tipo}>{tipo}</option>
                ))}
            </select>
          </label>

          <label>
              <span>Fecha Inicio *</span>
              <input
                type="date"
                name="fechaInicio"
                value={formData.fechaInicio}
                onChange={handleChange}
                min={getTodayDate()}
                max={formData.fechaFin || undefined}
                required
              />
          </label>

          <label>
              <span>Fecha Fin *</span>
              <input
                type="date"
                name="fechaFin"
                value={formData.fechaFin}
                onChange={handleChange}
                min={formData.fechaInicio || undefined}
                required
              />
            </label>

            {mostrarHoras(formData.tipo) && (
              <>
                <label>
                  <span>Hora Inicio *</span>
                  <input
                    type="time"
                    name="horaInicio"
                    value={formData.horaInicio}
                    onChange={handleChange}
                    required={mostrarHoras(formData.tipo)}
                  />
                </label>

                <label>
                  <span>Hora Fin *</span>
                  <input
                    type="time"
                    name="horaFin"
                    value={formData.horaFin}
                    onChange={handleChange}
                    min={formData.fechaInicio === formData.fechaFin ? formData.horaInicio : undefined}
                    required={mostrarHoras(formData.tipo)}
                  />
                </label>
              </>
            )}

            <label style={{ gridColumn: '1 / -1' }}>
              <span>Nota o Justificación *</span>
              <textarea
                rows="4"
                name="justificacion"
                value={formData.justificacion}
                onChange={handleChange}
                placeholder="Escribe los detalles..."
                required
              />
            </label>

            <label style={{ gridColumn: '1 / -1' }}>
            <span>Adjuntar Archivo (opcional)</span>
              <input
                ref={fileInputRef}
                type="file"
                onChange={handleFileChange}
                accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png"
              />
          </label>
        </div>

          {error && <div className="status error" style={{ marginTop: '0.5rem' }}>{error}</div>}
          {message && <div className="status success" style={{ marginTop: '0.5rem' }}>{message}</div>}

          <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
            {editingPermiso && (
              <button
                type="button"
                className="btn btn-outline"
                onClick={() => {
                  setEditingPermiso(null)
                  setFormData({
                    tipo: '',
                    fechaInicio: '',
                    fechaFin: '',
                    horaInicio: '',
                    horaFin: '',
                    justificacion: '',
                    archivo: null
                  })
                  if (fileInputRef.current) {
                    fileInputRef.current.value = ''
                  }
                  setError('')
                  setMessage('')
                }}
              >
                Cancelar
              </button>
            )}
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
            >
              {loading ? 'Enviando...' : editingPermiso ? 'Actualizar Solicitud' : 'Enviar Solicitud'}
        </button>
          </div>
        </form>
      </div>

      <div className="section-card table-card">
        <div className="split-heading">
          <h3>Historial de Solicitudes</h3>
        </div>
        <div className="table-scroll">
          <table className="data-table">
            <thead>
              <tr>
                <th>Tipo</th>
                <th>Nota</th>
                <th>Fecha</th>
                <th>Horario</th>
                <th>Archivo</th>
                <th>Estado</th>
                {isSupervisor && <th>Acciones</th>}
              </tr>
            </thead>
            <tbody>
              {permisos.length === 0 ? (
                <tr>
                  <td colSpan={isSupervisor ? 7 : 6} style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>
                    No hay solicitudes registradas
                  </td>
                </tr>
              ) : (
                permisos.map((permiso) => {
                  const esVacaciones = permiso?.Tipo === 'Vacaciones'
                  const tieneHoras = mostrarHoras(permiso?.Tipo)
                  
                  return (
                    <tr key={permiso?.Id || Math.random()}>
                      <td>{permiso?.Tipo || '-'}</td>
                      <td>{permiso?.Justificacion || '-'}</td>
                      <td>
                        {formatRangoFechas(permiso?.FechaInicio, permiso?.FechaFin)}
                      </td>
                      <td>
                        {tieneHoras && permiso?.HoraInicio && permiso?.HoraFin
                          ? `${permiso.HoraInicio} - ${permiso.HoraFin}`
                          : '-'}
                      </td>
                      <td>
                        {permiso?.DocumentoSoporte ? (
                          <a
                            href={permiso.DocumentoSoporte}
                            target="_blank"
                            rel="noopener noreferrer"
                            title={permiso.DocumentoSoporte}
                          >
                            Ver archivo
                          </a>
                        ) : (
                          '-'
                        )}
                  </td>
                  <td>
                        <span className={`badge ${
                          permiso?.Estado === 'Aprobado' ? 'badge-success' :
                          permiso?.Estado === 'Rechazado' ? 'badge-danger' :
                          'badge-warning'
                        }`}>
                          {permiso?.Estado || 'Pendiente'}
                        </span>
                  </td>
                      {isSupervisor && (
                  <td className="table-actions">
                          <button
                            type="button"
                            className="btn btn-outline btn-small"
                            onClick={() => handleEdit(permiso)}
                            title="Editar"
                          >
                      <IconEdit size={16} />
                    </button>
                          <button
                            type="button"
                            className="btn btn-outline btn-small danger"
                            onClick={() => handleDelete(permiso?.Id)}
                            title="Eliminar"
                          >
                      🗑️
                    </button>
                  </td>
                      )}
                </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

const ComingSoonSection = ({ title }) => (
  <div className="section-card placeholder-card">
    <p className="eyebrow">{title}</p>
    <h2>Este módulo estará disponible pronto</h2>
    <p className="page-subtitle">
      Mientras tanto puedes navegar por Supervisión, Empleados, Planilla o
      Permisos para revisar el panel visual solicitado.
    </p>
  </div>
)

const AnnouncementsPanel = () => {
  const [anuncios, setAnuncios] = useState([])
  const [proyectos, setProyectos] = useState([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showViewModal, setShowViewModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [selectedAnuncio, setSelectedAnuncio] = useState(null)
  const [formData, setFormData] = useState({
    Titulo: '',
    Cuerpo: '',
    Documento: '',
    ProyectoAsignado: '',
    EsGlobal: false,
    Destacado: false,
  })
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  // Cargar anuncios y proyectos
  useEffect(() => {
    const cargarDatos = async () => {
      setLoading(true)
      
      // Cargar anuncios
      const { data: anunciosData, error: anunciosError } = await supabase
        .from('Anuncios')
        .select('*')
        .order('FechaCreacion', { ascending: false })

      if (anunciosError) {
        console.error('Error al cargar anuncios:', anunciosError)
      } else if (anunciosData) {
        setAnuncios(anunciosData)
      }

      // Cargar proyectos únicos de empleados
      const { data: empleadosData } = await supabase
        .from('Empleados')
        .select('ProyectoAsignado')
        .not('ProyectoAsignado', 'is', null)

      if (empleadosData) {
        const proyectosUnicos = [...new Set(
          empleadosData
            .map(e => e.ProyectoAsignado)
            .filter(p => p && p.trim() !== '')
        )].sort()
        setProyectos(proyectosUnicos)
      }

      setLoading(false)
    }

    cargarDatos()
  }, [])

  // Función para obtener resumen corto del cuerpo
  const obtenerResumen = (texto, maxLength = 100) => {
    if (!texto) return ''
    if (texto.length <= maxLength) return texto
    return texto.substring(0, maxLength) + '...'
  }

  // Formatear fecha
  const formatearFecha = (fecha) => {
    return formatFechaCR(fecha)
  }

  // Abrir modal de crear
  const handleCreateClick = () => {
    setFormData({
      Titulo: '',
      Cuerpo: '',
      Documento: '',
      ProyectoAsignado: '',
      EsGlobal: false,
      Destacado: false,
    })
    setError('')
    setMessage('')
    setShowCreateModal(true)
  }

  // Abrir modal de ver
  const handleViewClick = (anuncio) => {
    setSelectedAnuncio(anuncio)
    setShowViewModal(true)
  }

  // Abrir modal de editar
  const handleEditClick = (anuncio) => {
    setSelectedAnuncio(anuncio)
    setFormData({
      Titulo: anuncio.Titulo || '',
      Cuerpo: anuncio.Cuerpo || '',
      Documento: anuncio.Documento || '',
      ProyectoAsignado: anuncio.ProyectoAsignado || '',
      EsGlobal: anuncio.EsGlobal || false,
      Destacado: anuncio.Destacado || false,
    })
    setError('')
    setMessage('')
    setShowEditModal(true)
  }

  // Crear anuncio
  const handleCreate = async () => {
    if (!formData.Titulo || !formData.Cuerpo) {
      setError('Por favor completa el título y el cuerpo del anuncio')
      return
    }

    setLoading(true)
    setError('')
    setMessage('')

    try {
      const { data, error: createError } = await supabase
        .from('Anuncios')
        .insert({
          Titulo: formData.Titulo,
          Cuerpo: formData.Cuerpo,
          Documento: formData.Documento || null,
          ProyectoAsignado: formData.EsGlobal ? null : (formData.ProyectoAsignado || null),
          EsGlobal: formData.EsGlobal,
          Destacado: formData.Destacado,
          Autor: 'Sistema',
        })
        .select()
        .single()

      if (createError) throw createError

      setMessage('Anuncio creado exitosamente')
      setAnuncios([data, ...anuncios])
      setShowCreateModal(false)
      setFormData({
        Titulo: '',
        Cuerpo: '',
        Documento: '',
        ProyectoAsignado: '',
        EsGlobal: false,
        Destacado: false,
      })
      setTimeout(() => setMessage(''), 3000)
    } catch (err) {
      console.error('Error al crear anuncio:', err)
      setError(err.message || 'Error al crear el anuncio')
    } finally {
      setLoading(false)
    }
  }

  // Actualizar anuncio
  const handleUpdate = async () => {
    if (!formData.Titulo || !formData.Cuerpo) {
      setError('Por favor completa el título y el cuerpo del anuncio')
      return
    }

    setLoading(true)
    setError('')
    setMessage('')

    try {
      const { data, error: updateError } = await supabase
        .from('Anuncios')
        .update({
          Titulo: formData.Titulo,
          Cuerpo: formData.Cuerpo,
          Documento: formData.Documento || null,
          ProyectoAsignado: formData.EsGlobal ? null : (formData.ProyectoAsignado || null),
          EsGlobal: formData.EsGlobal,
          Destacado: formData.Destacado,
          FechaActualizacion: getCostaRicaTime().toISOString(),
        })
        .eq('Id', selectedAnuncio.Id)
        .select()
        .single()

      if (updateError) throw updateError

      setMessage('Anuncio actualizado exitosamente')
      setAnuncios(anuncios.map(a => a.Id === selectedAnuncio.Id ? data : a))
      setShowEditModal(false)
      setSelectedAnuncio(null)
      setTimeout(() => setMessage(''), 3000)
    } catch (err) {
      console.error('Error al actualizar anuncio:', err)
      setError(err.message || 'Error al actualizar el anuncio')
    } finally {
      setLoading(false)
    }
  }

  // Eliminar anuncio
  const handleDelete = async (anuncio) => {
    if (!window.confirm(`¿Estás seguro de eliminar el anuncio "${anuncio.Titulo}"? Esta acción no se puede deshacer.`)) {
      return
    }

    setLoading(true)
    setError('')
    setMessage('')

    try {
      const { error: deleteError } = await supabase
        .from('Anuncios')
        .delete()
        .eq('Id', anuncio.Id)

      if (deleteError) throw deleteError

      setMessage('Anuncio eliminado exitosamente')
      setAnuncios(anuncios.filter(a => a.Id !== anuncio.Id))
      setTimeout(() => setMessage(''), 3000)
    } catch (err) {
      console.error('Error al eliminar anuncio:', err)
      setError(err.message || 'Error al eliminar el anuncio')
    } finally {
      setLoading(false)
    }
  }

  // Obtener anuncio destacado
  const anuncioDestacado = anuncios.find(a => a.Destacado) || anuncios[0]
  const anunciosNormales = anuncios.filter(a => !a.Destacado || a.Id === anuncioDestacado?.Id ? false : true)

  return (
    <div className="section-stack">
      <div className="panel-header">
        <div>
          <p className="eyebrow">Anuncios</p>
          <h2>Comparte novedades con todo el equipo</h2>
        </div>
        <button type="button" className="btn btn-primary" onClick={handleCreateClick}>
          + Crear anuncio
        </button>
      </div>

      {error && <div className="status error" style={{ marginBottom: '1rem' }}>{error}</div>}
      {message && <div className="status success" style={{ marginBottom: '1rem' }}>{message}</div>}

      {loading && anuncios.length === 0 ? (
        <div className="section-card" style={{ textAlign: 'center', padding: '2rem' }}>
          Cargando anuncios...
        </div>
      ) : anuncios.length === 0 ? (
        <div className="section-card" style={{ textAlign: 'center', padding: '2rem' }}>
          No hay anuncios disponibles. Crea el primero haciendo clic en "+ Crear anuncio"
        </div>
      ) : (
        <>
          {anuncioDestacado && (
      <div className="section-card announcement-spotlight">
        <div>
                <p className="badge badge-soft">Destacado</p>
                <h3>{anuncioDestacado.Titulo}</h3>
                <p>{obtenerResumen(anuncioDestacado.Cuerpo, 150)}</p>
                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
                  <button 
                    type="button" 
                    className="btn btn-outline btn-small"
                    onClick={() => handleViewClick(anuncioDestacado)}
                  >
                    Ver más
                  </button>
                  <button 
                    type="button" 
                    className="btn btn-outline btn-small"
                    onClick={() => handleEditClick(anuncioDestacado)}
                  >
                    <IconEdit size={16} /> Editar
                  </button>
                  <button 
                    type="button" 
                    className="btn btn-outline btn-small danger"
                    onClick={() => handleDelete(anuncioDestacado)}
                  >
                    <IconTrash size={16} /> Eliminar
                  </button>
                </div>
        </div>
        <div className="spotlight-meta">
                <p>{anuncioDestacado.Autor || 'Sistema'}</p>
                <small>{formatearFecha(anuncioDestacado.FechaCreacion)}</small>
        </div>
      </div>
          )}

      <div className="announcement-grid">
            {anunciosNormales.slice(0, 2).map((anuncio) => (
              <article key={anuncio.Id} className="section-card announcement-card">
                <p className="card-label">
                  {anuncio.EsGlobal ? 'Global' : (anuncio.ProyectoAsignado || 'General')}
                </p>
                <h4>{anuncio.Titulo}</h4>
                <p>{obtenerResumen(anuncio.Cuerpo, 100)}</p>
                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                  <button 
                    type="button" 
                    className="btn btn-outline btn-small"
                    onClick={() => handleViewClick(anuncio)}
                  >
              Ver más
            </button>
                  <button 
                    type="button" 
                    className="btn btn-outline btn-small"
                    onClick={() => handleEditClick(anuncio)}
                    title="Editar"
                  >
                    ✏️
                  </button>
                  <button 
                    type="button" 
                    className="btn btn-outline btn-small danger"
                    onClick={() => handleDelete(anuncio)}
                    title="Eliminar"
                  >
                    🗑️
                  </button>
                </div>
          </article>
        ))}
            {anunciosNormales.length > 2 && (
        <article className="section-card timeline-card">
                <h4>Más anuncios</h4>
          <ul className="timeline">
                  {anunciosNormales.slice(2).map((anuncio) => (
                    <li key={anuncio.Id}>
                      <span className="timeline-date">{formatearFecha(anuncio.FechaCreacion).split('/')[0]}</span>
                <div>
                        <p>{anuncio.Titulo}</p>
                        <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.25rem' }}>
                          <button 
                            type="button" 
                            className="btn btn-outline btn-small"
                            style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem' }}
                            onClick={() => handleViewClick(anuncio)}
                          >
                            Ver
                          </button>
                          <button 
                            type="button" 
                            className="btn btn-outline btn-small"
                            style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem' }}
                            onClick={() => handleEditClick(anuncio)}
                          >
                            <IconEdit size={16} />
                          </button>
                          <button 
                            type="button" 
                            className="btn btn-outline btn-small danger"
                            style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem' }}
                            onClick={() => handleDelete(anuncio)}
                          >
                            🗑️
                          </button>
                        </div>
                </div>
              </li>
            ))}
          </ul>
        </article>
            )}
      </div>
        </>
      )}

      {/* Modal de crear anuncio */}
      {showCreateModal && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="modal-container" style={{ width: '800px', maxHeight: '90vh' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Crear Anuncio</h3>
              <button 
                type="button" 
                className="modal-close-btn"
                onClick={() => setShowCreateModal(false)}
                aria-label="Cerrar"
              >
                ✕
              </button>
            </div>
            
            <div className="modal-body">
              <form className="form-grid" style={{ gap: '0.75rem' }}>
                <label style={{ gridColumn: '1 / -1' }}>
                  <span>Título *</span>
                  <input
                    type="text"
                    value={formData.Titulo}
                    onChange={(e) => setFormData({ ...formData, Titulo: e.target.value })}
                    placeholder="Ej: Actualización de sistema"
                    required
                  />
                </label>

                <label style={{ gridColumn: '1 / -1' }}>
                  <span>Cuerpo *</span>
                  <textarea
                    rows="6"
                    value={formData.Cuerpo}
                    onChange={(e) => setFormData({ ...formData, Cuerpo: e.target.value })}
                    placeholder="Escribe el contenido completo del anuncio..."
                    required
                  />
                </label>

                <label style={{ gridColumn: '1 / -1' }}>
                  <span>Documento (URL o nombre de archivo)</span>
                  <input
                    type="text"
                    value={formData.Documento}
                    onChange={(e) => setFormData({ ...formData, Documento: e.target.value })}
                    placeholder="Ej: manual_actualizacion.pdf"
                  />
                </label>

                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexDirection: 'row' }}>
                  <input
                    type="checkbox"
                    checked={formData.EsGlobal}
                    onChange={(e) => setFormData({ ...formData, EsGlobal: e.target.checked, ProyectoAsignado: e.target.checked ? '' : formData.ProyectoAsignado })}
                    style={{ width: 'auto', margin: 0 }}
                  />
                  <span style={{ fontWeight: 600, color: '#475569' }}>Anuncio Global (para todos los proyectos)</span>
                </label>

                {!formData.EsGlobal && (
                  <label>
                    <span>Proyecto Asignado</span>
                    <select
                      value={formData.ProyectoAsignado}
                      onChange={(e) => setFormData({ ...formData, ProyectoAsignado: e.target.value })}
                    >
                      <option value="">Selecciona un proyecto</option>
                      {proyectos.map((proyecto) => (
                        <option key={proyecto} value={proyecto}>
                          {proyecto}
                        </option>
                      ))}
                    </select>
                  </label>
                )}

                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexDirection: 'row' }}>
                  <input
                    type="checkbox"
                    checked={formData.Destacado}
                    onChange={(e) => setFormData({ ...formData, Destacado: e.target.checked })}
                    style={{ width: 'auto', margin: 0 }}
                  />
                  <span style={{ fontWeight: 600, color: '#475569' }}>Marcar como destacado</span>
                </label>

                {error && <div className="status error" style={{ gridColumn: '1 / -1', marginTop: '0.5rem' }}>{error}</div>}
                {message && <div className="status success" style={{ gridColumn: '1 / -1', marginTop: '0.5rem' }}>{message}</div>}
              </form>
            </div>
            
            <div className="modal-footer">
              <button 
                type="button" 
                className="btn btn-outline"
                onClick={() => setShowCreateModal(false)}
              >
                Cancelar
              </button>
              <button 
                type="button" 
                className="btn btn-primary"
                onClick={handleCreate}
                disabled={loading}
              >
                {loading ? 'Creando...' : 'Crear Anuncio'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de ver anuncio completo */}
      {showViewModal && selectedAnuncio && (
        <div className="modal-overlay" onClick={() => setShowViewModal(false)}>
          <div className="modal-container" style={{ width: '800px', maxHeight: '90vh' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{selectedAnuncio.Titulo}</h3>
              <button 
                type="button" 
                className="modal-close-btn"
                onClick={() => setShowViewModal(false)}
                aria-label="Cerrar"
              >
                ✕
              </button>
            </div>
            
            <div className="modal-body">
              <div style={{ marginBottom: '1rem' }}>
                <p style={{ color: '#64748b', fontSize: '0.875rem', marginBottom: '0.5rem' }}>
                  <strong>Autor:</strong> {selectedAnuncio.Autor || 'Sistema'} | 
                  <strong> Fecha:</strong> {formatearFecha(selectedAnuncio.FechaCreacion)} | 
                  <strong> Alcance:</strong> {selectedAnuncio.EsGlobal ? 'Global' : (selectedAnuncio.ProyectoAsignado || 'General')}
                </p>
                {selectedAnuncio.Destacado && (
                  <span className="badge badge-soft" style={{ marginBottom: '1rem', display: 'inline-block' }}>
                    Destacado
                  </span>
                )}
              </div>
              <div style={{ whiteSpace: 'pre-wrap', lineHeight: '1.6', color: '#334155' }}>
                {selectedAnuncio.Cuerpo}
              </div>
              {selectedAnuncio.Documento && (
                <div style={{ marginTop: '1rem', padding: '0.75rem', backgroundColor: '#f1f5f9', borderRadius: '8px' }}>
                  <strong>Documento:</strong> {selectedAnuncio.Documento}
                </div>
              )}
            </div>
            
            <div className="modal-footer">
              <button 
                type="button" 
                className="btn btn-outline"
                onClick={() => {
                  setShowViewModal(false)
                  handleEditClick(selectedAnuncio)
                }}
              >
                ✏️ Editar
              </button>
              <button 
                type="button" 
                className="btn btn-primary"
                onClick={() => setShowViewModal(false)}
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de editar anuncio */}
      {showEditModal && selectedAnuncio && (
        <div className="modal-overlay" onClick={() => setShowEditModal(false)}>
          <div className="modal-container" style={{ width: '800px', maxHeight: '90vh' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Editar Anuncio</h3>
              <button 
                type="button" 
                className="modal-close-btn"
                onClick={() => {
                  setShowEditModal(false)
                  setSelectedAnuncio(null)
                }}
                aria-label="Cerrar"
              >
                ✕
              </button>
            </div>
            
            <div className="modal-body">
              <form className="form-grid" style={{ gap: '0.75rem' }}>
                <label style={{ gridColumn: '1 / -1' }}>
                  <span>Título *</span>
                  <input
                    type="text"
                    value={formData.Titulo}
                    onChange={(e) => setFormData({ ...formData, Titulo: e.target.value })}
                    required
                  />
                </label>

                <label style={{ gridColumn: '1 / -1' }}>
                  <span>Cuerpo *</span>
                  <textarea
                    rows="6"
                    value={formData.Cuerpo}
                    onChange={(e) => setFormData({ ...formData, Cuerpo: e.target.value })}
                    required
                  />
                </label>

                <label style={{ gridColumn: '1 / -1' }}>
                  <span>Documento (URL o nombre de archivo)</span>
                  <input
                    type="text"
                    value={formData.Documento}
                    onChange={(e) => setFormData({ ...formData, Documento: e.target.value })}
                  />
                </label>

                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexDirection: 'row' }}>
                  <input
                    type="checkbox"
                    checked={formData.EsGlobal}
                    onChange={(e) => setFormData({ ...formData, EsGlobal: e.target.checked, ProyectoAsignado: e.target.checked ? '' : formData.ProyectoAsignado })}
                    style={{ width: 'auto', margin: 0 }}
                  />
                  <span style={{ fontWeight: 600, color: '#475569' }}>Anuncio Global (para todos los proyectos)</span>
                </label>

                {!formData.EsGlobal && (
                  <label>
                    <span>Proyecto Asignado</span>
                    <select
                      value={formData.ProyectoAsignado}
                      onChange={(e) => setFormData({ ...formData, ProyectoAsignado: e.target.value })}
                    >
                      <option value="">Selecciona un proyecto</option>
                      {proyectos.map((proyecto) => (
                        <option key={proyecto} value={proyecto}>
                          {proyecto}
                        </option>
                      ))}
                    </select>
                  </label>
                )}

                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexDirection: 'row' }}>
                  <input
                    type="checkbox"
                    checked={formData.Destacado}
                    onChange={(e) => setFormData({ ...formData, Destacado: e.target.checked })}
                    style={{ width: 'auto', margin: 0 }}
                  />
                  <span style={{ fontWeight: 600, color: '#475569' }}>Marcar como destacado</span>
                </label>

                {error && <div className="status error" style={{ gridColumn: '1 / -1', marginTop: '0.5rem' }}>{error}</div>}
                {message && <div className="status success" style={{ gridColumn: '1 / -1', marginTop: '0.5rem' }}>{message}</div>}
              </form>
            </div>
            
            <div className="modal-footer">
              <button 
                type="button" 
                className="btn btn-outline danger"
                onClick={() => {
                  if (window.confirm('¿Estás seguro de eliminar este anuncio?')) {
                    handleDelete(selectedAnuncio)
                    setShowEditModal(false)
                  }
                }}
              >
                🗑️ Eliminar
              </button>
              <button 
                type="button" 
                className="btn btn-outline"
                onClick={() => {
                  setShowEditModal(false)
                  setSelectedAnuncio(null)
                }}
              >
                Cancelar
              </button>
              <button 
                type="button" 
                className="btn btn-primary"
                onClick={handleUpdate}
                disabled={loading}
              >
                {loading ? 'Guardando...' : 'Guardar Cambios'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

const JustificationsPanel = ({ sessionInfo }) => {
  const [formData, setFormData] = useState({
    tipo: '',
    fecha: '',
    fechaInicio: '',
    fechaFin: '',
    hora: '',
    motivo: '',
    archivo: null
  })
  const [justificaciones, setJustificaciones] = useState([])
  const [tiposJustificaciones, setTiposJustificaciones] = useState(['Ausencia', 'Tardia', 'Incapacidad'])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [editingJustificacion, setEditingJustificacion] = useState(null)
  const [isSupervisor, setIsSupervisor] = useState(false)
  const [empleadoIdActual, setEmpleadoIdActual] = useState(null)
  const fileInputRef = useRef(null)

  // Verificar si el usuario es supervisor
  useEffect(() => {
    const verificarRol = async () => {
      if (!sessionInfo?.user?.email) {
        console.warn('No hay información de sesión disponible')
        return
      }

      try {
        const emailNormalizado = sessionInfo.user.email.toUpperCase()
        const { data: usuario, error: usuarioError } = await supabase
          .from('Usuarios')
          .select('Id, EmpleadoId')
          .eq('NormalizedEmail', emailNormalizado)
          .maybeSingle()

        if (usuarioError) {
          console.error('Error al obtener usuario:', usuarioError)
          return
        }

        if (usuario?.EmpleadoId) {
          setEmpleadoIdActual(usuario.EmpleadoId)
        }

        if (usuario) {
          const { data: rolesUsuario, error: rolesError } = await supabase
            .from('UsuariosRoles')
            .select('RoleId, Roles:RoleId (Id, Name, NormalizedName)')
            .eq('UserId', usuario.Id)

          if (rolesError) {
            console.error('Error al obtener roles:', rolesError)
            return
          }

          const roles = rolesUsuario?.map(ur => ur.Roles).filter(Boolean) || []
          const tieneSupervisor = roles.some(
            r => r?.Name === 'Supervisor de Personal' || r?.NormalizedName === 'SUPERVISOR DE PERSONAL'
          )
          setIsSupervisor(tieneSupervisor)
        }
      } catch (err) {
        console.error('Error al verificar rol:', err)
        setError('Error al cargar la información del usuario')
      }
    }

    verificarRol()
  }, [sessionInfo])

  // Cargar tipos de justificaciones
  useEffect(() => {
    const cargarTipos = async () => {
      const tipos = await cargarTiposJustificaciones()
      setTiposJustificaciones(tipos)
    }
    cargarTipos()
    
    // Suscribirse a cambios en la tabla TiposJustificaciones
    const subscription = supabase
      .channel('tipos-justificaciones-changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'TiposJustificaciones' },
        async () => {
          const tipos = await cargarTiposJustificaciones()
          setTiposJustificaciones(tipos)
        }
      )
      .subscribe()
    
    return () => {
      subscription.unsubscribe()
    }
  }, [])

  // Cargar justificaciones
  useEffect(() => {
    const cargarJustificaciones = async () => {
      if (empleadoIdActual === null && !isSupervisor) {
        return
      }

      try {
        let query = supabase
          .from('Justificaciones')
          .select('*, Empleados:EmpleadoId (NombreCompleto)')
          .order('FechaRegistro', { ascending: false })

        if (!isSupervisor && empleadoIdActual) {
          query = query.eq('EmpleadoId', empleadoIdActual)
        }

        const { data, error: fetchError } = await query

        if (fetchError) {
          console.error('Error al cargar justificaciones:', fetchError)
          setError('Error al cargar las justificaciones')
          return
        }

        if (data) {
          setJustificaciones(data)
        } else {
          setJustificaciones([])
        }
      } catch (err) {
        console.error('Error al cargar justificaciones:', err)
        setError('Error al cargar las justificaciones. Por favor, recarga la página.')
        setJustificaciones([])
      }
    }

    cargarJustificaciones()
  }, [empleadoIdActual, isSupervisor])

  // Obtener fecha de hoy (usa GMT-6)
  const getTodayDate = () => {
    // Usar la función helper que ya maneja GMT-6 correctamente
    return getCostaRicaDateString()
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    const newFormData = { ...formData, [name]: value }
    
    // Limpiar campos según el tipo
    if (name === 'tipo') {
      if (value === 'Ausencia') {
        newFormData.fechaInicio = ''
        newFormData.fechaFin = ''
        newFormData.hora = ''
      } else if (value === 'Tardia') {
        newFormData.fechaInicio = ''
        newFormData.fechaFin = ''
        newFormData.fecha = ''
      } else if (value === 'Incapacidad') {
        newFormData.fecha = ''
        newFormData.hora = ''
      }
    }
    
    setFormData(newFormData)
    setError('')
  }

  const handleFileChange = (e) => {
    setFormData(prev => ({ ...prev, archivo: e.target.files[0] }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setMessage('')

    try {
      // Validaciones
      if (!formData.tipo) {
        throw new Error('Debe seleccionar un tipo de justificación')
      }
      if (!empleadoIdActual) {
        throw new Error('No se pudo identificar al empleado')
      }
      if (!formData.motivo.trim()) {
        throw new Error('Debe proporcionar un motivo')
      }

      // Validaciones según tipo
      if (formData.tipo === 'Ausencia' && !formData.fecha) {
        throw new Error('Debe seleccionar una fecha para la ausencia')
      }
      if (formData.tipo === 'Tardia' && (!formData.fecha || !formData.hora)) {
        throw new Error('Debe completar la fecha y hora para la tardía')
      }
      if (formData.tipo === 'Incapacidad' && (!formData.fechaInicio || !formData.fechaFin)) {
        throw new Error('Debe completar las fechas de inicio y fin para la incapacidad')
      }
      if (formData.tipo === 'Incapacidad' && new Date(formData.fechaInicio) > new Date(formData.fechaFin)) {
        throw new Error('La fecha de inicio no puede ser posterior a la fecha de fin')
      }

      // Subir archivo si existe
      let documentoUrl = null
      if (formData.archivo) {
        const fileExt = formData.archivo.name.split('.').pop()
        const fileName = `${Math.random()}.${fileExt}`
        const filePath = `justificaciones/${fileName}`

        const { error: uploadError } = await supabase.storage
          .from('documentos')
          .upload(filePath, formData.archivo)

        if (uploadError) throw uploadError

        const { data: { publicUrl } } = supabase.storage
          .from('documentos')
          .getPublicUrl(filePath)

        documentoUrl = publicUrl
      }

      // Crear justificación
      const justificacionData = {
        EmpleadoId: empleadoIdActual,
        Tipo: formData.tipo,
        Fecha: formData.tipo === 'Ausencia' || formData.tipo === 'Tardia' ? formData.fecha : null,
        FechaInicio: formData.tipo === 'Incapacidad' ? formData.fechaInicio : null,
        FechaFin: formData.tipo === 'Incapacidad' ? formData.fechaFin : null,
        Hora: formData.tipo === 'Tardia' ? formData.hora : null,
        Motivo: formData.motivo,
        DocumentoSoporte: documentoUrl,
        Estado: 'Pendiente'
      }

      const { error: insertError } = await supabase
        .from('Justificaciones')
        .insert(justificacionData)

      if (insertError) throw insertError

      setMessage('Justificación registrada correctamente')
      setFormData({
        tipo: '',
        fecha: '',
        fechaInicio: '',
        fechaFin: '',
        hora: '',
        motivo: '',
        archivo: null
      })
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
      
      // Recargar justificaciones
      let query = supabase
        .from('Justificaciones')
        .select('*, Empleados:EmpleadoId (NombreCompleto)')
        .order('FechaRegistro', { ascending: false })

      if (!isSupervisor && empleadoIdActual) {
        query = query.eq('EmpleadoId', empleadoIdActual)
      }

      const { data: nuevasJustificaciones } = await query

      if (nuevasJustificaciones) {
        setJustificaciones(nuevasJustificaciones)
      }
    } catch (err) {
      setError(err.message || 'Error al registrar la justificación')
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (justificacion) => {
    setEditingJustificacion(justificacion)
    setFormData({
      tipo: justificacion.Tipo,
      fecha: justificacion.Fecha || '',
      fechaInicio: justificacion.FechaInicio || '',
      fechaFin: justificacion.FechaFin || '',
      hora: justificacion.Hora || '',
      motivo: justificacion.Motivo,
      archivo: null
    })
  }

  const handleUpdate = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setMessage('')

    try {
      // Validaciones
      if (formData.tipo === 'Incapacidad' && new Date(formData.fechaInicio) > new Date(formData.fechaFin)) {
        throw new Error('La fecha de inicio no puede ser posterior a la fecha de fin')
      }

      const updateData = {
        Tipo: formData.tipo,
        Fecha: formData.tipo === 'Ausencia' || formData.tipo === 'Tardia' ? formData.fecha : null,
        FechaInicio: formData.tipo === 'Incapacidad' ? formData.fechaInicio : null,
        FechaFin: formData.tipo === 'Incapacidad' ? formData.fechaFin : null,
        Hora: formData.tipo === 'Tardia' ? formData.hora : null,
        Motivo: formData.motivo
      }

      const { error: updateError } = await supabase
        .from('Justificaciones')
        .update(updateData)
        .eq('Id', editingJustificacion.Id)

      if (updateError) throw updateError

      setMessage('Justificación actualizada correctamente')
      setEditingJustificacion(null)
      setFormData({
        tipo: '',
        fecha: '',
        fechaInicio: '',
        fechaFin: '',
        hora: '',
        motivo: '',
        archivo: null
      })
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }

      // Recargar justificaciones
      let query = supabase
        .from('Justificaciones')
        .select('*, Empleados:EmpleadoId (NombreCompleto)')
        .order('FechaRegistro', { ascending: false })

      if (!isSupervisor && empleadoIdActual) {
        query = query.eq('EmpleadoId', empleadoIdActual)
      }

      const { data: nuevasJustificaciones } = await query

      if (nuevasJustificaciones) {
        setJustificaciones(nuevasJustificaciones)
      }
    } catch (err) {
      setError(err.message || 'Error al actualizar la justificación')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (justificacionId) => {
    if (!confirm('¿Está seguro de que desea eliminar esta justificación?')) return

    try {
      const { error: deleteError } = await supabase
        .from('Justificaciones')
        .delete()
        .eq('Id', justificacionId)

      if (deleteError) throw deleteError

      setJustificaciones(justificaciones.filter(j => j.Id !== justificacionId))
      setMessage('Justificación eliminada correctamente')
    } catch (err) {
      setError(err.message || 'Error al eliminar la justificación')
    }
  }

  const handleAprobar = async (justificacionId) => {
    try {
      const { error: updateError } = await supabase
        .from('Justificaciones')
        .update({ Estado: 'Aprobado' })
        .eq('Id', justificacionId)

      if (updateError) throw updateError

      setJustificaciones(justificaciones.map(j => 
        j.Id === justificacionId ? { ...j, Estado: 'Aprobado' } : j
      ))
      setMessage('Justificación aprobada')
    } catch (err) {
      setError(err.message || 'Error al aprobar la justificación')
    }
  }

  const handleRechazar = async (justificacionId) => {
    try {
      const { error: updateError } = await supabase
        .from('Justificaciones')
        .update({ Estado: 'Rechazado' })
        .eq('Id', justificacionId)

      if (updateError) throw updateError

      setJustificaciones(justificaciones.map(j => 
        j.Id === justificacionId ? { ...j, Estado: 'Rechazado' } : j
      ))
      setMessage('Justificación rechazada')
    } catch (err) {
      setError(err.message || 'Error al rechazar la justificación')
    }
  }

  // Mostrar mensaje si no hay sesión
  if (!sessionInfo?.user) {
    return (
      <div className="section-stack">
        <div className="panel-header">
          <div>
            <p className="eyebrow">Justificaciones</p>
            <h2>Gestiona los respaldos del equipo</h2>
          </div>
        </div>
        <div className="section-card">
          <p style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>
            Por favor, inicia sesión para acceder a este módulo.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="section-stack">
      <div className="panel-header">
        <div>
          <p className="eyebrow">Justificaciones</p>
          <h2>Gestiona los respaldos del equipo</h2>
        </div>
        <button type="button" className="btn btn-secondary">
          Descargar historial
        </button>
      </div>

      <div className="section-card form-card">
        <form onSubmit={editingJustificacion ? handleUpdate : handleSubmit}>
        <div className="form-grid two-columns">
          <label>
              <span>Tipo de justificación *</span>
              <select
                name="tipo"
                value={formData.tipo}
                onChange={handleChange}
                required
              >
              <option value="">Selecciona</option>
                {tiposJustificaciones.map((tipo) => (
                  <option key={tipo} value={tipo}>{tipo === 'Tardia' ? 'Tardía' : tipo}</option>
                ))}
            </select>
          </label>

            {formData.tipo === 'Ausencia' && (
          <label>
                <span>Fecha *</span>
                <input
                  type="date"
                  name="fecha"
                  value={formData.fecha}
                  onChange={handleChange}
                  min={getTodayDate()}
                  required
                />
          </label>
            )}

            {formData.tipo === 'Tardia' && (
              <>
          <label>
                  <span>Fecha *</span>
                  <input
                    type="date"
                    name="fecha"
                    value={formData.fecha}
                    onChange={handleChange}
                    min={getTodayDate()}
                    required
                  />
                </label>
                <label>
                  <span>Hora *</span>
                  <input
                    type="time"
                    name="hora"
                    value={formData.hora}
                    onChange={handleChange}
                    required
                  />
                </label>
              </>
            )}

            {formData.tipo === 'Incapacidad' && (
              <>
                <label>
                  <span>Fecha Inicio *</span>
                  <input
                    type="date"
                    name="fechaInicio"
                    value={formData.fechaInicio}
                    onChange={handleChange}
                    min={getTodayDate()}
                    max={formData.fechaFin || undefined}
                    required
                  />
                </label>
                <label>
                  <span>Fecha Fin *</span>
                  <input
                    type="date"
                    name="fechaFin"
                    value={formData.fechaFin}
                    onChange={handleChange}
                    min={formData.fechaInicio || getTodayDate()}
                    required
                  />
                </label>
              </>
            )}

            <label style={{ gridColumn: '1 / -1' }}>
              <span>Notas *</span>
              <textarea
                rows="3"
                name="motivo"
                value={formData.motivo}
                onChange={handleChange}
                placeholder="Describe la situación"
                required
              />
            </label>

            <label style={{ gridColumn: '1 / -1' }}>
              <span>Adjuntar Archivo (opcional)</span>
              <input
                ref={fileInputRef}
                type="file"
                onChange={handleFileChange}
                accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.gif"
              />
          </label>
        </div>

          {error && <div className="status error" style={{ marginTop: '0.5rem' }}>{error}</div>}
          {message && <div className="status success" style={{ marginTop: '0.5rem' }}>{message}</div>}

          <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
            {editingJustificacion && (
              <button
                type="button"
                className="btn btn-outline"
                onClick={() => {
                  setEditingJustificacion(null)
                  setFormData({
                    tipo: '',
                    fecha: '',
                    fechaInicio: '',
                    fechaFin: '',
                    hora: '',
                    motivo: '',
                    archivo: null
                  })
                  if (fileInputRef.current) {
                    fileInputRef.current.value = ''
                  }
                  setError('')
                  setMessage('')
                }}
              >
                Cancelar
              </button>
            )}
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
            >
              {loading ? 'Registrando...' : editingJustificacion ? 'Actualizar Justificación' : 'Registrar justificación'}
        </button>
          </div>
        </form>
      </div>

      <div className="section-card table-card">
        <div className="split-heading">
          <h3>Solicitudes recientes</h3>
          <span className="badge badge-soft">
            {justificaciones.length} registros
          </span>
        </div>
        <div className="table-scroll">
          <table className="data-table">
            <thead>
              <tr>
                <th>Empleado</th>
                <th>Tipo</th>
                <th>Fecha</th>
                <th>Nota</th>
                <th>Archivo</th>
                <th>Estado</th>
                {isSupervisor && <th>Acciones</th>}
              </tr>
            </thead>
            <tbody>
              {justificaciones.length === 0 ? (
                <tr>
                  <td colSpan={isSupervisor ? 7 : 6} style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>
                    No hay justificaciones registradas
                  </td>
                </tr>
              ) : (
                justificaciones.map((justificacion) => {
                  let fechaDisplay = '-'
                  if (justificacion.Tipo === 'Ausencia' || justificacion.Tipo === 'Tardia') {
                    fechaDisplay = formatFechaCR(justificacion.Fecha)
                    if (justificacion.Tipo === 'Tardia' && justificacion.Hora) {
                      fechaDisplay += ` ${justificacion.Hora}`
                    }
                  } else if (justificacion.Tipo === 'Incapacidad') {
                    fechaDisplay = formatRangoFechas(justificacion.FechaInicio, justificacion.FechaFin)
                  }

                  return (
                    <tr key={justificacion?.Id || Math.random()}>
                      <td>{justificacion.Empleados?.NombreCompleto || '-'}</td>
                      <td>{justificacion?.Tipo || '-'}</td>
                      <td>{fechaDisplay}</td>
                      <td>{justificacion?.Motivo || '-'}</td>
                      <td>
                        {justificacion?.DocumentoSoporte ? (
                          <a
                            href={justificacion.DocumentoSoporte}
                            target="_blank"
                            rel="noopener noreferrer"
                            title={justificacion.DocumentoSoporte}
                          >
                            Ver archivo
                          </a>
                        ) : (
                          '-'
                        )}
                      </td>
                      <td>
                        <span className={`badge ${
                          justificacion?.Estado === 'Aprobado' ? 'badge-success' :
                          justificacion?.Estado === 'Rechazado' ? 'badge-danger' :
                          'badge-warning'
                        }`}>
                          {justificacion?.Estado || 'Pendiente'}
                    </span>
                  </td>
                      {isSupervisor && (
                  <td className="table-actions">
                          {justificacion?.Estado === 'Pendiente' && (
                            <>
                              <button
                                type="button"
                                className="btn btn-outline btn-small"
                                onClick={() => handleAprobar(justificacion.Id)}
                                title="Aprobar"
                              >
                      ✅
                    </button>
                              <button
                                type="button"
                                className="btn btn-outline btn-small danger"
                                onClick={() => handleRechazar(justificacion.Id)}
                                title="Rechazar"
                              >
                                ✖
                              </button>
                            </>
                          )}
                          <button
                            type="button"
                            className="btn btn-outline btn-small"
                            onClick={() => handleEdit(justificacion)}
                            title="Editar"
                          >
                            <IconEdit size={16} />
                          </button>
                          <button
                            type="button"
                            className="btn btn-outline btn-small danger"
                            onClick={() => handleDelete(justificacion.Id)}
                            title="Eliminar"
                          >
                            🗑️
                    </button>
                  </td>
                      )}
                </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

const DocumentsPanel = ({ sessionInfo }) => {
  const [documentos, setDocumentos] = useState([])
  const [carpetas, setCarpetas] = useState([])
  const [carpetaActual, setCarpetaActual] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [filterTipo, setFilterTipo] = useState('')
  const [filterFecha, setFilterFecha] = useState('')
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [showFolderModal, setShowFolderModal] = useState(false)
  const [selectedFile, setSelectedFile] = useState(null)
  const [folderName, setFolderName] = useState('')
  const [folderDescription, setFolderDescription] = useState('')
  const [documentName, setDocumentName] = useState('')
  const [selectedCarpetaId, setSelectedCarpetaId] = useState(null)
  const [allCarpetas, setAllCarpetas] = useState([])
  const fileInputRef = useRef(null)

  // Cargar todos los documentos y carpetas
  useEffect(() => {
    cargarDocumentos()
    cargarCarpetas()
    cargarTodasLasCarpetas()
    // Asegurar que backup existe al cargar el componente
    ensureBackupFolder()
  }, [carpetaActual])

  const cargarTodasLasCarpetas = async () => {
    try {
      const { data, error: fetchError } = await supabase
        .from('Carpetas')
        .select('*')
        .order('Nombre')

      if (fetchError) throw fetchError

      if (data) {
        // Filtrar la carpeta "backup" para que no se muestre en el sistema (case-insensitive)
        const carpetasFiltradas = data.filter(c => {
          const nombreLower = c.Nombre?.toLowerCase() || ''
          return nombreLower !== 'backup'
        })
        setAllCarpetas(carpetasFiltradas)
      }
    } catch (err) {
      console.error('Error al cargar todas las carpetas:', err)
    }
  }

  const cargarDocumentos = async () => {
    setLoading(true)
    try {
      let query = supabase
        .from('Documentos')
        .select('*')
        .order('FechaCreacion', { ascending: false })

      if (carpetaActual) {
        query = query.eq('CarpetaId', carpetaActual)
      } else {
        query = query.is('CarpetaId', null)
      }

      // Aplicar filtros
      if (filterTipo) {
        query = query.eq('Tipo', filterTipo.toUpperCase())
      }
      if (filterFecha) {
        query = query.gte('FechaCreacion', `${filterFecha}T00:00:00`)
        query = query.lte('FechaCreacion', `${filterFecha}T23:59:59`)
      }

      const { data, error: fetchError } = await query

      if (fetchError) throw fetchError

      if (data) {
        // Filtrar por búsqueda si existe
        let documentosFiltrados = data
        if (searchTerm) {
          documentosFiltrados = data.filter(doc =>
            doc.Nombre.toLowerCase().includes(searchTerm.toLowerCase())
          )
        }
        setDocumentos(documentosFiltrados)
      }
    } catch (err) {
      console.error('Error al cargar documentos:', err)
      setError('Error al cargar los documentos')
    } finally {
      setLoading(false)
    }
  }

  const cargarCarpetas = async () => {
    try {
      let query = supabase
        .from('Carpetas')
        .select('*')
        .order('Nombre')

      if (carpetaActual) {
        query = query.eq('CarpetaPadreId', carpetaActual)
      } else {
        query = query.is('CarpetaPadreId', null)
      }

      const { data, error: fetchError } = await query

      if (fetchError) throw fetchError

      if (data) {
        // Filtrar la carpeta "backup" para que no se muestre en el sistema (case-insensitive)
        const carpetasFiltradas = data.filter(c => {
          const nombreLower = c.Nombre?.toLowerCase() || ''
          return nombreLower !== 'backup'
        })
        setCarpetas(carpetasFiltradas)
      }
    } catch (err) {
      console.error('Error al cargar carpetas:', err)
    }
  }

  const handleFileSelect = (e) => {
    const file = e.target.files[0]
    if (file) {
      setSelectedFile(file)
      setDocumentName(file.name.split('.')[0]) // Nombre sin extensión
    }
  }

  const handleUpload = async () => {
    if (!selectedFile || !documentName.trim()) {
      setError('Debe seleccionar un archivo y proporcionar un nombre')
      return
    }

    // Verificar que el usuario esté autenticado
    if (!sessionInfo?.user) {
      setError('Debe estar autenticado para subir archivos')
      return
    }

    setLoading(true)
    setError('')
    setMessage('')

    try {
      const fileExt = selectedFile.name.split('.').pop().toLowerCase()
      const fileName = `${documentName.replace(/[^a-zA-Z0-9]/g, '_')}_${Date.now()}.${fileExt}`
      
      // Construir ruta según la carpeta seleccionada (o carpeta actual si no se seleccionó una)
      const carpetaIdParaArchivo = selectedCarpetaId !== null ? selectedCarpetaId : carpetaActual
      let filePath = fileName
      
      // Si hay una carpeta seleccionada, construir la ruta con el nombre de la carpeta
      if (carpetaIdParaArchivo) {
        const carpeta = allCarpetas.find(c => c.Id === carpetaIdParaArchivo)
        if (carpeta) {
          // Construir ruta completa desde la raíz
          const rutaCarpeta = obtenerRutaCarpeta(carpetaIdParaArchivo, allCarpetas)
          if (rutaCarpeta) {
            // Limpiar la ruta para evitar caracteres especiales
            const rutaLimpia = rutaCarpeta.replace(/[^a-zA-Z0-9/]/g, '_')
            filePath = `${rutaLimpia}/${fileName}`
          } else {
            const nombreLimpio = carpeta.Nombre.replace(/[^a-zA-Z0-9]/g, '_')
            filePath = `${nombreLimpio}/${fileName}`
          }
        }
      }

      // El bucket debe llamarse "documentos" y debe existir en Supabase Storage
      const bucketName = 'documentos'
      
      console.log('Intentando subir archivo:', {
        bucket: bucketName,
        path: filePath,
        fileName: selectedFile.name,
        fileSize: selectedFile.size,
        fileType: selectedFile.type
      })
      
      // Subir archivo al storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from(bucketName)
        .upload(filePath, selectedFile, {
          cacheControl: '3600',
          upsert: false
        })

      if (uploadError) {
        console.error('Error detallado al subir archivo:', {
          error: uploadError,
          message: uploadError.message,
          statusCode: uploadError.statusCode,
          errorCode: uploadError.error
        })
        
        // Si el error es que el bucket no existe, informar al usuario
        if (uploadError.message?.includes('Bucket not found') || 
            uploadError.message?.includes('not found') ||
            uploadError.statusCode === '404' ||
            uploadError.error === 'Bucket not found') {
          throw new Error('El bucket "documentos" no existe en Supabase Storage. Por favor, crea el bucket "documentos" en la sección Storage de tu proyecto Supabase y asegúrate de que esté configurado como público.')
        }
        
        // Si el error es de permisos o RLS
        if (uploadError.message?.includes('permission') || 
            uploadError.message?.includes('denied') ||
            uploadError.message?.includes('row-level security') ||
            uploadError.message?.includes('policy') ||
            uploadError.statusCode === '403') {
          throw new Error('Error de permisos al subir el archivo. Verifica que las políticas RLS del bucket "documentos" permitan a usuarios autenticados subir archivos.')
        }
        
        // Error genérico con más detalles
        throw new Error(`Error al subir el archivo: ${uploadError.message || uploadError.error || 'Error desconocido'}`)
      }

      console.log('Archivo subido exitosamente:', uploadData)

      // Obtener URL pública
      const { data: { publicUrl } } = supabase.storage
        .from(bucketName)
        .getPublicUrl(filePath)

      // Determinar tipo de archivo
      let tipo = 'OTRO'
      if (['pdf'].includes(fileExt)) tipo = 'PDF'
      else if (['xls', 'xlsx'].includes(fileExt)) tipo = 'EXCEL'
      else if (['doc', 'docx'].includes(fileExt)) tipo = 'WORD'
      else if (['jpg', 'jpeg', 'png', 'gif'].includes(fileExt)) tipo = 'IMAGEN'

      // Crear registro en base de datos
      const { error: insertError } = await supabase
        .from('Documentos')
        .insert({
          Nombre: documentName,
          Tipo: tipo,
          RutaArchivo: publicUrl,
          CarpetaId: carpetaIdParaArchivo,
          Tamaño: selectedFile.size,
          CreadoPor: sessionInfo?.user?.email || null
        })

      if (insertError) {
        console.error('Error al insertar documento:', insertError)
        // Si es un error de RLS, dar un mensaje más específico
        if (insertError.message?.includes('row-level security') || insertError.message?.includes('policy')) {
          throw new Error('Error de permisos: ' + insertError.message + '. Por favor, verifica que RLS esté deshabilitado en la tabla Documentos.')
        }
        throw insertError
      }

      setMessage('Archivo subido correctamente')
      setShowUploadModal(false)
      setSelectedFile(null)
      setDocumentName('')
      setSelectedCarpetaId(null)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
      cargarDocumentos()
      cargarCarpetas()
      cargarTodasLasCarpetas()
    } catch (err) {
      setError(err.message || 'Error al subir el archivo')
    } finally {
      setLoading(false)
    }
  }

  // Función auxiliar para obtener la ruta completa de una carpeta
  const obtenerRutaCarpeta = (carpetaId, carpetas) => {
    const carpeta = carpetas.find(c => c.Id === carpetaId)
    if (!carpeta) return ''
    
    // Limpiar nombre de carpeta para evitar caracteres especiales
    const nombreLimpio = carpeta.Nombre.replace(/[^a-zA-Z0-9]/g, '_')
    
    if (carpeta.CarpetaPadreId) {
      const rutaPadre = obtenerRutaCarpeta(carpeta.CarpetaPadreId, carpetas)
      return rutaPadre ? `${rutaPadre}/${nombreLimpio}` : nombreLimpio
    }
    return nombreLimpio
  }

  const handleCreateFolder = async () => {
    if (!folderName.trim()) {
      setError('Debe proporcionar un nombre para la carpeta')
      return
    }

    setLoading(true)
    setError('')
    setMessage('')

    try {
      // Primero crear la carpeta en la base de datos
      const { data: carpetaData, error: insertError } = await supabase
        .from('Carpetas')
        .insert({
          Nombre: folderName,
          Descripcion: folderDescription.trim() || null,
          CarpetaPadreId: carpetaActual,
          CreadoPor: sessionInfo?.user?.email || null
        })
        .select()

      if (insertError) {
        console.error('Error al insertar carpeta:', insertError)
        // Si es un error de RLS, dar un mensaje más específico
        if (insertError.message?.includes('row-level security') || insertError.message?.includes('policy')) {
          throw new Error('Error de permisos: ' + insertError.message + '. Por favor, verifica que RLS esté deshabilitado en la tabla Carpetas.')
        }
        throw insertError
      }

      // Crear la carpeta físicamente en el storage creando un archivo placeholder
      if (carpetaData && carpetaData[0]) {
        const carpetaCreada = carpetaData[0]
        const nombreLimpio = folderName.replace(/[^a-zA-Z0-9]/g, '_')
        
        // Construir ruta completa de la carpeta
        let carpetaPath = nombreLimpio
        if (carpetaActual) {
          const carpetaPadre = allCarpetas.find(c => c.Id === carpetaActual)
          if (carpetaPadre) {
            const rutaPadre = obtenerRutaCarpeta(carpetaActual, allCarpetas)
            carpetaPath = rutaPadre ? `${rutaPadre}/${nombreLimpio}` : nombreLimpio
          }
        }
        
        // Crear archivo placeholder para que la carpeta aparezca en el storage
        const placeholderPath = `${carpetaPath}/.keep`
        const placeholderContent = new Blob([''], { type: 'text/plain' })
        
        const { error: storageError } = await supabase.storage
          .from('documentos')
          .upload(placeholderPath, placeholderContent, {
            cacheControl: '3600',
            upsert: true
          })

        if (storageError) {
          console.error('Error al crear carpeta en storage:', storageError)
          // Si es un error de RLS, informar al usuario
          if (storageError.message?.includes('row-level security') || 
              storageError.message?.includes('policy') ||
              storageError.message?.includes('permission')) {
            console.warn('Advertencia: No se pudo crear la carpeta en el storage debido a permisos. La carpeta se creó en la base de datos pero no en el storage físico.')
            // No lanzar error, solo advertir, ya que la carpeta ya está en la BD
          } else {
            console.warn('Advertencia: No se pudo crear la carpeta en el storage:', storageError.message || storageError)
          }
        } else {
          console.log('✓ Carpeta creada en storage:', carpetaPath)
        }
      }

      setMessage('Carpeta creada correctamente')
      setShowFolderModal(false)
      setFolderName('')
      setFolderDescription('')
      cargarCarpetas()
      cargarTodasLasCarpetas()
    } catch (err) {
      console.error('Error completo al crear carpeta:', err)
      setError(err.message || 'Error al crear la carpeta')
    } finally {
      setLoading(false)
    }
  }

  const handleDownload = (documento) => {
    window.open(documento.RutaArchivo, '_blank')
  }

  const handleShare = async (documento) => {
    try {
      await navigator.clipboard.writeText(documento.RutaArchivo)
      setMessage('Enlace copiado al portapapeles')
      setTimeout(() => setMessage(''), 3000)
    } catch (err) {
      setError('Error al copiar el enlace')
    }
  }

  // Función para asegurar que la carpeta backup existe en el storage
  const ensureBackupFolder = async () => {
    try {
      const backupPath = 'backup/.keep'
      const placeholderContent = new Blob([''], { type: 'text/plain' })
      
      const { error: storageError } = await supabase.storage
        .from('documentos')
        .upload(backupPath, placeholderContent, {
          cacheControl: '3600',
          upsert: true
        })

      if (storageError && !storageError.message?.includes('already exists')) {
        console.warn('Advertencia: No se pudo crear/verificar la carpeta backup:', storageError)
      } else {
        console.log('✓ Carpeta backup verificada/creada')
      }
    } catch (err) {
      console.warn('Advertencia al verificar carpeta backup:', err)
    }
  }

  // Función para obtener todos los documentos de una carpeta y sus subcarpetas
  const obtenerDocumentosDeCarpeta = async (carpetaId) => {
    const documentosEnCarpeta = []
    
    try {
      // Obtener documentos directos de la carpeta
      const { data: documentosDirectos, error: errorDirectos } = await supabase
        .from('Documentos')
        .select('*')
        .eq('CarpetaId', carpetaId)

      if (!errorDirectos && documentosDirectos) {
        documentosEnCarpeta.push(...documentosDirectos)
      } else if (errorDirectos) {
        console.error('Error al obtener documentos directos:', errorDirectos)
      }

      // Obtener subcarpetas (excluyendo backup)
      const { data: subcarpetas, error: errorSubcarpetas } = await supabase
        .from('Carpetas')
        .select('*')
        .eq('CarpetaPadreId', carpetaId)
        .neq('Nombre', 'backup')
        .neq('Nombre', 'Backup')
        .neq('Nombre', 'BACKUP')

      if (!errorSubcarpetas && subcarpetas) {
        // Recursivamente obtener documentos de subcarpetas
        for (const subcarpeta of subcarpetas) {
          try {
            const documentosSubcarpeta = await obtenerDocumentosDeCarpeta(subcarpeta.Id)
            documentosEnCarpeta.push(...documentosSubcarpeta)
          } catch (err) {
            console.error(`Error al obtener documentos de subcarpeta ${subcarpeta.Id}:`, err)
          }
        }
      } else if (errorSubcarpetas) {
        console.error('Error al obtener subcarpetas:', errorSubcarpetas)
      }
    } catch (err) {
      console.error('Error en obtenerDocumentosDeCarpeta:', err)
    }

    return documentosEnCarpeta
  }

  // Función para mover un archivo del storage a backup
  const moverArchivoABackup = async (rutaArchivoOriginal, nombreCarpeta) => {
    try {
      // Validar parámetros
      if (!rutaArchivoOriginal || !nombreCarpeta) {
        console.error('Parámetros inválidos para moverArchivoABackup:', { rutaArchivoOriginal, nombreCarpeta })
        return null
      }

      // Limpiar la ruta: puede venir con "documentos/" al inicio o sin él
      let rutaLimpia = String(rutaArchivoOriginal).trim()
      if (!rutaLimpia) {
        console.error('Ruta de archivo vacía')
        return null
      }

      if (rutaLimpia.startsWith('documentos/')) {
        rutaLimpia = rutaLimpia.replace('documentos/', '')
      }
      if (rutaLimpia.startsWith('/')) {
        rutaLimpia = rutaLimpia.substring(1)
      }
      
      if (!rutaLimpia) {
        console.error('Ruta de archivo inválida después de limpiar')
        return null
      }
      
      // Extraer el nombre del archivo de la ruta original
      const partesRuta = rutaLimpia.split('/')
      const nombreArchivo = partesRuta[partesRuta.length - 1]
      
      if (!nombreArchivo) {
        console.error('No se pudo extraer el nombre del archivo de la ruta:', rutaLimpia)
        return null
      }
      
      // Crear nueva ruta en backup con el nombre de la carpeta como prefijo
      const timestamp = Date.now()
      const nombreLimpio = String(nombreCarpeta).replace(/[^a-zA-Z0-9]/g, '_') || 'carpeta'
      const nuevaRuta = `backup/${nombreLimpio}_${timestamp}_${nombreArchivo}`

      // Obtener el archivo original
      const { data: fileData, error: downloadError } = await supabase.storage
        .from('documentos')
        .download(rutaLimpia)

      if (downloadError) {
        console.error('Error al descargar archivo para mover a backup:', downloadError, 'Ruta:', rutaLimpia)
        return null
      }

      if (!fileData) {
        console.error('No se pudo obtener el archivo del storage')
        return null
      }

      // Subir el archivo a backup
      const { error: uploadError } = await supabase.storage
        .from('documentos')
        .upload(nuevaRuta, fileData, {
          cacheControl: '3600',
          upsert: false
        })

      if (uploadError) {
        console.error('Error al subir archivo a backup:', uploadError)
        return null
      }

      // Eliminar el archivo original
      const { error: deleteError } = await supabase.storage
        .from('documentos')
        .remove([rutaLimpia])

      if (deleteError) {
        console.warn('Advertencia: No se pudo eliminar el archivo original:', deleteError)
        // No retornar null aquí, el archivo ya está en backup
      }

      return nuevaRuta
    } catch (err) {
      console.error('Error al mover archivo a backup:', err)
      return null
    }
  }

  const handleDeleteFolder = async (carpetaId, nombreCarpeta) => {
    if (!confirm(`¿Está seguro de que desea eliminar la carpeta "${nombreCarpeta}"? Todos los documentos serán movidos a backup.`)) {
      return
    }

    setLoading(true)
    setError('')
    setMessage('')

    try {
      // Asegurar que backup existe
      await ensureBackupFolder()

      // Obtener todos los documentos de la carpeta y subcarpetas
      const documentos = await obtenerDocumentosDeCarpeta(carpetaId)
      
      console.log(`Moviendo ${documentos.length} documentos a backup...`)

      // Mover cada documento a backup
      for (const documento of documentos) {
        try {
          // Extraer ruta del archivo desde la URL
          let filePath = documento.RutaArchivo
          try {
            const url = new URL(documento.RutaArchivo)
            const pathParts = url.pathname.split('/')
            const indexDocumentos = pathParts.indexOf('documentos')
            if (indexDocumentos !== -1) {
              filePath = pathParts.slice(indexDocumentos + 1).join('/')
            } else {
              // Si no encuentra "documentos" en la ruta, intentar extraer de otra forma
              filePath = pathParts.slice(-2).join('/') // Últimas dos partes
            }
          } catch (urlError) {
            // Si no es una URL válida, usar la ruta directamente
            console.warn('No se pudo parsear la URL, usando ruta directa:', documento.RutaArchivo)
          }

          // Mover archivo a backup
          const nuevaRuta = await moverArchivoABackup(filePath, nombreCarpeta)
          
          if (nuevaRuta) {
            // Actualizar la ruta en la base de datos para mantener referencia
            const { data: { publicUrl } } = supabase.storage
              .from('documentos')
              .getPublicUrl(nuevaRuta)

            const { error: updateError } = await supabase
              .from('Documentos')
              .update({ 
                RutaArchivo: publicUrl,
                CarpetaId: null // Remover referencia a la carpeta eliminada
              })
              .eq('Id', documento.Id)

            if (updateError) {
              console.error(`Error al actualizar documento ${documento.Id} en BD:`, updateError)
            }
          } else {
            console.warn(`No se pudo mover el documento ${documento.Id} a backup, pero se continuará con la eliminación`)
          }
        } catch (err) {
          console.error(`Error al mover documento ${documento.Id}:`, err)
        }
      }

      // Eliminar subcarpetas recursivamente
      const eliminarSubcarpetas = async (carpetaPadreId) => {
        try {
          const { data: subcarpetas, error: errorSubcarpetas } = await supabase
            .from('Carpetas')
            .select('*')
            .eq('CarpetaPadreId', carpetaPadreId)
            .neq('Nombre', 'backup')
            .neq('Nombre', 'Backup')
            .neq('Nombre', 'BACKUP')

          if (errorSubcarpetas) {
            console.error('Error al obtener subcarpetas:', errorSubcarpetas)
            return
          }

          if (subcarpetas) {
            for (const subcarpeta of subcarpetas) {
              try {
                await eliminarSubcarpetas(subcarpeta.Id)
                const { error: deleteError } = await supabase
                  .from('Carpetas')
                  .delete()
                  .eq('Id', subcarpeta.Id)
                
                if (deleteError) {
                  console.error(`Error al eliminar subcarpeta ${subcarpeta.Id}:`, deleteError)
                }
              } catch (err) {
                console.error(`Error al procesar subcarpeta ${subcarpeta.Id}:`, err)
              }
            }
          }
        } catch (err) {
          console.error('Error en eliminarSubcarpetas:', err)
        }
      }

      await eliminarSubcarpetas(carpetaId)

      // Eliminar la carpeta principal
      const { error: deleteError } = await supabase
        .from('Carpetas')
        .delete()
        .eq('Id', carpetaId)

      if (deleteError) throw deleteError

      // Eliminar archivo .keep de la carpeta en storage si existe
      try {
        const carpeta = allCarpetas.find(c => c.Id === carpetaId)
        if (carpeta) {
          const rutaCarpeta = obtenerRutaCarpeta(carpetaId, allCarpetas)
          const nombreLimpio = carpeta.Nombre.replace(/[^a-zA-Z0-9]/g, '_')
          const carpetaPath = rutaCarpeta || nombreLimpio
          const keepPath = `${carpetaPath}/.keep`
          
          const { error: removeError } = await supabase.storage
            .from('documentos')
            .remove([keepPath])
          
          if (removeError && !removeError.message?.includes('not found')) {
            console.warn('Advertencia: No se pudo eliminar el archivo .keep:', removeError)
          }
        }
      } catch (err) {
        console.warn('Advertencia al eliminar archivo .keep:', err)
        // No es crítico, continuar
      }

      setMessage(`Carpeta "${nombreCarpeta}" eliminada correctamente. ${documentos.length} documento(s) movido(s) a backup.`)
      cargarCarpetas()
      cargarTodasLasCarpetas()
      cargarDocumentos()
    } catch (err) {
      console.error('Error al eliminar carpeta:', err)
      setError(err.message || 'Error al eliminar la carpeta')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (documentoId) => {
    if (!confirm('¿Está seguro de que desea eliminar este documento?')) return

    setLoading(true)
    setError('')
    setMessage('')

    try {
      const documento = documentos.find(d => d.Id === documentoId)
      if (documento && documento.RutaArchivo) {
        try {
          // Extraer ruta del archivo desde la URL
          const url = new URL(documento.RutaArchivo)
          const pathParts = url.pathname.split('/')
          const indexDocumentos = pathParts.indexOf('documentos')
          
          if (indexDocumentos !== -1) {
            const filePath = pathParts.slice(indexDocumentos + 1).join('/')
            
            // Eliminar archivo del storage
            const { error: deleteStorageError } = await supabase.storage
              .from('documentos')
              .remove([filePath])

            if (deleteStorageError) {
              console.error('Error al eliminar archivo del storage:', deleteStorageError)
              // Continuar aunque falle la eliminación del storage
            }
          } else {
            console.warn('No se pudo extraer la ruta del archivo desde la URL:', documento.RutaArchivo)
          }
        } catch (urlError) {
          console.warn('Error al parsear URL del archivo:', urlError)
          // Continuar con la eliminación del registro en BD
        }
      }

      // Eliminar registro de la base de datos
      const { error: deleteError } = await supabase
        .from('Documentos')
        .delete()
        .eq('Id', documentoId)

      if (deleteError) throw deleteError

      setDocumentos(documentos.filter(d => d.Id !== documentoId))
      setMessage('Documento eliminado correctamente')
      cargarDocumentos()
    } catch (err) {
      console.error('Error al eliminar documento:', err)
      setError(err.message || 'Error al eliminar el documento')
    } finally {
      setLoading(false)
    }
  }

  const formatTamaño = (bytes) => {
    if (!bytes) return ''
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB'
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB'
  }

  // Aplicar filtros cuando cambian
  useEffect(() => {
    cargarDocumentos()
  }, [searchTerm, filterTipo, filterFecha])

  return (
    <div className="section-stack">
      <div className="panel-header">
        <div>
          <p className="eyebrow">Documentos</p>
          <h2>Biblioteca central de archivos</h2>
          {carpetaActual && (
            <button
              type="button"
              className="btn btn-outline btn-small"
              onClick={() => {
                // Volver a carpeta padre
                const carpeta = carpetas.find(c => c.Id === carpetaActual)
                setCarpetaActual(carpeta?.CarpetaPadreId || null)
              }}
              style={{ marginTop: '0.5rem' }}
            >
              ← Volver
            </button>
          )}
        </div>
        <div className="panel-header-meta">
          <button
            type="button"
            className="btn btn-outline"
            onClick={() => setShowUploadModal(true)}
          >
            Subir archivo
          </button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => setShowFolderModal(true)}
          >
            + Crear carpeta
          </button>
        </div>
      </div>

      <div className="filters-card section-card">
        <div className="filters-grid">
          <input
            type="text"
            placeholder="Buscar documento..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <select
            value={filterTipo}
            onChange={(e) => setFilterTipo(e.target.value)}
          >
            <option value="">Todos los tipos</option>
            <option value="PDF">PDF</option>
            <option value="EXCEL">Excel</option>
            <option value="WORD">Word</option>
            <option value="IMAGEN">Imagen</option>
          </select>
          <input
            type="date"
            value={filterFecha}
            onChange={(e) => setFilterFecha(e.target.value)}
          />
        </div>
      </div>

      {error && <div className="status error" style={{ margin: '1rem 0' }}>{error}</div>}
      {message && <div className="status success" style={{ margin: '1rem 0' }}>{message}</div>}

      {/* Mostrar carpetas */}
      {carpetas.length > 0 && (
        <div className="doc-grid" style={{ marginBottom: '2rem' }}>
          {carpetas.map((carpeta) => (
            <article key={carpeta.Id} className="section-card doc-card">
              <div onClick={() => setCarpetaActual(carpeta.Id)} style={{ cursor: 'pointer', flex: 1 }}>
                <p className="doc-type"><IconFolder size={14} /> CARPETA</p>
                <h4>{carpeta.Nombre}</h4>
                {carpeta.Descripcion && <p style={{ margin: '0.5rem 0', color: '#64748b', fontSize: '0.9rem' }}>{carpeta.Descripcion}</p>}
                <small>Creada {formatFechaCR(carpeta.FechaCreacion)}</small>
              </div>
              <div className="doc-actions" style={{ marginTop: '0.5rem' }}>
                <button
                  type="button"
                  className="btn btn-outline btn-small danger"
                  onClick={(e) => {
                    e.stopPropagation()
                    handleDeleteFolder(carpeta.Id, carpeta.Nombre)
                  }}
                  title="Eliminar carpeta"
                >
                  🗑️
                </button>
              </div>
            </article>
          ))}
        </div>
      )}

      {/* Mostrar documentos */}
      <div className="doc-grid">
        {loading && documentos.length === 0 ? (
          <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '2rem', color: '#64748b' }}>
            Cargando documentos...
          </div>
        ) : documentos.length === 0 ? (
          <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '2rem', color: '#64748b' }}>
            No hay documentos disponibles
          </div>
        ) : (
          documentos.map((doc) => (
            <article key={doc.Id} className="section-card doc-card">
            <div>
                <p className="doc-type">{doc.Tipo}</p>
                <h4>{doc.Nombre}</h4>
                <small>Actualizado {formatFechaCR(doc.FechaActualizacion || doc.FechaCreacion)}</small>
                {doc.Tamaño && <small style={{ display: 'block', marginTop: '0.25rem' }}>{formatTamaño(doc.Tamaño)}</small>}
            </div>
            <div className="doc-actions">
                <button
                  type="button"
                  className="btn btn-outline btn-small"
                  onClick={() => handleDownload(doc)}
                >
                Descargar
              </button>
                <button
                  type="button"
                  className="btn btn-secondary btn-small"
                  onClick={() => handleShare(doc)}
                >
                Compartir
              </button>
                <button
                  type="button"
                  className="btn btn-outline btn-small danger"
                  onClick={() => handleDelete(doc.Id)}
                  style={{ marginLeft: '0.5rem' }}
                >
                  🗑️
              </button>
            </div>
          </article>
          ))
        )}
      </div>

      {/* Modal para subir archivo */}
      {showUploadModal && (
        <div className="modal-overlay" onClick={() => {
          setShowUploadModal(false)
          setSelectedFile(null)
          setDocumentName('')
          setSelectedCarpetaId(null)
          setError('')
          setMessage('')
        }}>
          <div className="modal-container" style={{ width: '500px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Subir Archivo</h3>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => {
                  setShowUploadModal(false)
                  setSelectedFile(null)
                  setDocumentName('')
                  setError('')
                  setMessage('')
                }}
              >
                ✕
              </button>
            </div>
            <div className="modal-body">
              <label>
                <span>Nombre del documento *</span>
                <input
                  type="text"
                  value={documentName}
                  onChange={(e) => setDocumentName(e.target.value)}
                  placeholder="Nombre del documento"
                  required
                />
              </label>
              <label>
                <span>Carpeta (opcional)</span>
                <select
                  value={selectedCarpetaId || ''}
                  onChange={(e) => setSelectedCarpetaId(e.target.value ? parseInt(e.target.value) : null)}
                >
                  <option value="">Sin carpeta (raíz)</option>
                  {allCarpetas.map((carpeta) => {
                    const ruta = obtenerRutaCarpeta(carpeta.Id, allCarpetas)
                    return (
                      <option key={carpeta.Id} value={carpeta.Id}>
                        {ruta || carpeta.Nombre}
                      </option>
                    )
                  })}
                </select>
              </label>
              <label>
                <span>Seleccionar archivo *</span>
                <input
                  ref={fileInputRef}
                  type="file"
                  onChange={handleFileSelect}
                  accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.gif"
                />
              </label>
              {selectedFile && (
                <div style={{ marginTop: '0.5rem', padding: '0.5rem', backgroundColor: '#f8fafc', borderRadius: '8px' }}>
                  <small>Archivo seleccionado: {selectedFile.name}</small>
                  <br />
                  <small>Tamaño: {formatTamaño(selectedFile.size)}</small>
                </div>
              )}
              {error && <div className="status error" style={{ marginTop: '0.5rem' }}>{error}</div>}
              {message && <div className="status success" style={{ marginTop: '0.5rem' }}>{message}</div>}
            </div>
            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-outline"
                onClick={() => {
                  setShowUploadModal(false)
                  setSelectedFile(null)
                  setDocumentName('')
                  setError('')
                  setMessage('')
                }}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleUpload}
                disabled={loading || !selectedFile || !documentName.trim()}
              >
                {loading ? 'Subiendo...' : 'Subir'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal para crear carpeta */}
      {showFolderModal && (
        <div className="modal-overlay" onClick={() => {
          setShowFolderModal(false)
          setFolderName('')
          setFolderDescription('')
          setError('')
          setMessage('')
        }}>
          <div className="modal-container" style={{ width: '400px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Crear Carpeta</h3>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => {
                  setShowFolderModal(false)
                  setFolderName('')
                  setError('')
                  setMessage('')
                }}
              >
                ✕
              </button>
            </div>
            <div className="modal-body">
              <label>
                <span>Nombre de la carpeta *</span>
                <input
                  type="text"
                  value={folderName}
                  onChange={(e) => setFolderName(e.target.value)}
                  placeholder="Nombre de la carpeta"
                  required
                />
              </label>
              <label>
                <span>Descripción (opcional)</span>
                <textarea
                  value={folderDescription}
                  onChange={(e) => setFolderDescription(e.target.value)}
                  placeholder="Descripción de la carpeta"
                  rows="3"
                  style={{ resize: 'vertical' }}
                />
              </label>
              {error && <div className="status error" style={{ marginTop: '0.5rem' }}>{error}</div>}
              {message && <div className="status success" style={{ marginTop: '0.5rem' }}>{message}</div>}
            </div>
            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-outline"
                onClick={() => {
                  setShowFolderModal(false)
                  setFolderName('')
                  setFolderDescription('')
                  setError('')
                  setMessage('')
                }}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleCreateFolder}
                disabled={loading || !folderName.trim()}
              >
                {loading ? 'Creando...' : 'Crear'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

const SettingsPanel = () => {
  const [activeTab, setActiveTab] = useState('permisos')
  const [tiposPermisos, setTiposPermisos] = useState([])
  const [tiposJustificaciones, setTiposJustificaciones] = useState([])
  const [proyectos, setProyectos] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  
  // Estados para formularios
  const [nuevoTipoPermiso, setNuevoTipoPermiso] = useState('')
  const [nuevoTipoJustificacion, setNuevoTipoJustificacion] = useState('')
  const [editandoPermiso, setEditandoPermiso] = useState(null)
  const [editandoJustificacion, setEditandoJustificacion] = useState(null)
  
  // Estados para proyectos (departamentos)
  const [nuevoProyecto, setNuevoProyecto] = useState('')
  const [editandoProyecto, setEditandoProyecto] = useState(null)

  // Cargar tipos de permisos existentes (desde la base de datos o valores por defecto)
  useEffect(() => {
    const cargarConfiguraciones = async () => {
      setLoading(true)
      try {
        // Intentar cargar desde una tabla de configuración si existe
        // Por ahora, usamos valores por defecto
        const tiposPermisosDefault = ['Permiso', 'Vacaciones', 'Cita Medica']
        const tiposJustificacionesDefault = ['Ausencia', 'Tardia', 'Incapacidad']
        
        // Intentar cargar desde tabla TiposPermisos si existe (todos los tipos, activos e inactivos)
        const { data: permisosData, error: permisosError } = await supabase
          .from('TiposPermisos')
          .select('*')
          .order('Nombre')
        
        if (permisosData && !permisosError) {
          setTiposPermisos(permisosData.map(t => ({ id: t.Id, nombre: t.Nombre, activo: t.Activo !== false })))
        } else {
          // Si no existe la tabla, usar valores por defecto
          setTiposPermisos(tiposPermisosDefault.map((nombre, idx) => ({ id: idx + 1, nombre, activo: true })))
        }

        // Intentar cargar desde tabla TiposJustificaciones si existe (todos los tipos, activos e inactivos)
        const { data: justificacionesData, error: justificacionesError } = await supabase
          .from('TiposJustificaciones')
          .select('*')
          .order('Nombre')
        
        if (justificacionesData && !justificacionesError) {
          setTiposJustificaciones(justificacionesData.map(t => ({ id: t.Id, nombre: t.Nombre, activo: t.Activo !== false })))
        } else {
          // Si no existe la tabla, usar valores por defecto
          setTiposJustificaciones(tiposJustificacionesDefault.map((nombre, idx) => ({ id: idx + 1, nombre, activo: true })))
        }

        // Cargar proyectos (departamentos)
        const { data: proyectosData, error: proyectosError } = await supabase
          .from('Proyectos')
          .select('*')
          .order('Nombre')
        
        if (proyectosData && !proyectosError) {
          setProyectos(proyectosData.map(p => ({ id: p.Id, nombre: p.Nombre, activo: p.Activo !== false })))
        } else if (proyectosError && proyectosError.code !== 'PGRST116') {
          console.warn('Error al cargar proyectos:', proyectosError)
        }
      } catch (err) {
        // Si hay error, usar valores por defecto
        setTiposPermisos(['Permiso', 'Vacaciones', 'Cita Medica'].map((nombre, idx) => ({ id: idx + 1, nombre, activo: true })))
        setTiposJustificaciones(['Ausencia', 'Tardia', 'Incapacidad'].map((nombre, idx) => ({ id: idx + 1, nombre, activo: true })))
        console.error('Error al cargar configuraciones:', err)
      } finally {
        setLoading(false)
      }
    }

    cargarConfiguraciones()
  }, [])

  const handleAgregarTipoPermiso = async () => {
    if (!nuevoTipoPermiso.trim()) {
      setError('El nombre del tipo de permiso no puede estar vacío')
      return
    }

    if (tiposPermisos.some(t => t.nombre.toLowerCase() === nuevoTipoPermiso.trim().toLowerCase())) {
      setError('Este tipo de permiso ya existe')
      return
    }

    setError('')
    setMessage('')
    setLoading(true)

    try {
      // Intentar guardar en la base de datos
      const { data: insertedData, error: insertError } = await supabase
        .from('TiposPermisos')
        .insert({ Nombre: nuevoTipoPermiso.trim(), Activo: true })
        .select()

      if (insertError) {
        // Si la tabla no existe (PGRST116), crear valores por defecto en memoria
        if (insertError.code === 'PGRST116' || insertError.message?.includes('relation') || insertError.message?.includes('does not exist')) {
          const nuevoId = tiposPermisos.length > 0 ? Math.max(...tiposPermisos.map(t => t.id)) + 1 : 1
          setTiposPermisos([...tiposPermisos, { id: nuevoId, nombre: nuevoTipoPermiso.trim(), activo: true }])
          setNuevoTipoPermiso('')
          setMessage('Tipo de permiso agregado (nota: las tablas de configuración no existen en la BD. Ejecuta el script SQL para crearlas)')
          setError('')
        } else {
          throw insertError
        }
      } else {
        // Recargar desde la BD para obtener el ID real
        const { data: permisosData } = await supabase
          .from('TiposPermisos')
          .select('*')
          .eq('Activo', true)
          .order('Nombre')
        
        if (permisosData) {
          setTiposPermisos(permisosData.map(t => ({ id: t.Id, nombre: t.Nombre, activo: t.Activo !== false })))
        }
        setNuevoTipoPermiso('')
        setMessage('Tipo de permiso agregado correctamente')
      }
    } catch (err) {
      setError(err.message || 'Error al agregar el tipo de permiso')
      console.error('Error al agregar tipo de permiso:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleAgregarTipoJustificacion = async () => {
    if (!nuevoTipoJustificacion.trim()) {
      setError('El nombre del tipo de justificación no puede estar vacío')
      return
    }

    if (tiposJustificaciones.some(t => t.nombre.toLowerCase() === nuevoTipoJustificacion.trim().toLowerCase())) {
      setError('Este tipo de justificación ya existe')
      return
    }

    setError('')
    setMessage('')
    setLoading(true)

    try {
      // Intentar guardar en la base de datos
      const { data: insertedData, error: insertError } = await supabase
        .from('TiposJustificaciones')
        .insert({ Nombre: nuevoTipoJustificacion.trim(), Activo: true })
        .select()

      if (insertError) {
        // Si la tabla no existe (PGRST116), crear valores por defecto en memoria
        if (insertError.code === 'PGRST116' || insertError.message?.includes('relation') || insertError.message?.includes('does not exist')) {
          const nuevoId = tiposJustificaciones.length > 0 ? Math.max(...tiposJustificaciones.map(t => t.id)) + 1 : 1
          setTiposJustificaciones([...tiposJustificaciones, { id: nuevoId, nombre: nuevoTipoJustificacion.trim(), activo: true }])
          setNuevoTipoJustificacion('')
          setMessage('Tipo de justificación agregado (nota: las tablas de configuración no existen en la BD. Ejecuta el script SQL para crearlas)')
          setError('')
        } else {
          throw insertError
        }
      } else {
        // Recargar desde la BD para obtener el ID real
        const { data: justificacionesData } = await supabase
          .from('TiposJustificaciones')
          .select('*')
          .eq('Activo', true)
          .order('Nombre')
        
        if (justificacionesData) {
          setTiposJustificaciones(justificacionesData.map(t => ({ id: t.Id, nombre: t.Nombre, activo: t.Activo !== false })))
        }
        setNuevoTipoJustificacion('')
        setMessage('Tipo de justificación agregado correctamente')
      }
    } catch (err) {
      setError(err.message || 'Error al agregar el tipo de justificación')
      console.error('Error al agregar tipo de justificación:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleEliminarTipoPermiso = async (id) => {
    if (!confirm('¿Está seguro de que desea eliminar este tipo de permiso?')) return

    setLoading(true)
    setError('')
    setMessage('')

    try {
      const { error: deleteError } = await supabase
        .from('TiposPermisos')
        .delete()
        .eq('Id', id)

      if (deleteError) {
        if (deleteError.code === 'PGRST116' || deleteError.message?.includes('relation') || deleteError.message?.includes('does not exist')) {
          setTiposPermisos(tiposPermisos.filter(t => t.id !== id))
          setMessage('Tipo de permiso eliminado (nota: las tablas de configuración no existen en la BD)')
        } else {
          throw deleteError
        }
      } else {
        // Recargar desde la BD
        const { data: permisosData } = await supabase
          .from('TiposPermisos')
          .select('*')
          .eq('Activo', true)
          .order('Nombre')
        
        if (permisosData) {
          setTiposPermisos(permisosData.map(t => ({ id: t.Id, nombre: t.Nombre, activo: t.Activo !== false })))
        } else {
          setTiposPermisos(tiposPermisos.filter(t => t.id !== id))
        }
        setMessage('Tipo de permiso eliminado correctamente')
      }
    } catch (err) {
      setError(err.message || 'Error al eliminar el tipo de permiso')
      console.error('Error al eliminar tipo de permiso:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleEliminarTipoJustificacion = async (id) => {
    if (!confirm('¿Está seguro de que desea eliminar este tipo de justificación?')) return

    setLoading(true)
    setError('')
    setMessage('')

    try {
      const { error: deleteError } = await supabase
        .from('TiposJustificaciones')
        .delete()
        .eq('Id', id)

      if (deleteError) {
        if (deleteError.code === 'PGRST116' || deleteError.message?.includes('relation') || deleteError.message?.includes('does not exist')) {
          setTiposJustificaciones(tiposJustificaciones.filter(t => t.id !== id))
          setMessage('Tipo de justificación eliminado (nota: las tablas de configuración no existen en la BD)')
        } else {
          throw deleteError
        }
      } else {
        // Recargar desde la BD
        const { data: justificacionesData } = await supabase
          .from('TiposJustificaciones')
          .select('*')
          .eq('Activo', true)
          .order('Nombre')
        
        if (justificacionesData) {
          setTiposJustificaciones(justificacionesData.map(t => ({ id: t.Id, nombre: t.Nombre, activo: t.Activo !== false })))
        } else {
          setTiposJustificaciones(tiposJustificaciones.filter(t => t.id !== id))
        }
        setMessage('Tipo de justificación eliminado correctamente')
      }
    } catch (err) {
      setError(err.message || 'Error al eliminar el tipo de justificación')
      console.error('Error al eliminar tipo de justificación:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleEditarTipoPermiso = (tipo) => {
    setEditandoPermiso(tipo)
    setNuevoTipoPermiso(tipo.nombre)
  }

  const handleEditarTipoJustificacion = (tipo) => {
    setEditandoJustificacion(tipo)
    setNuevoTipoJustificacion(tipo.nombre)
  }

  const handleGuardarEdicionPermiso = async () => {
    if (!nuevoTipoPermiso.trim()) {
      setError('El nombre del tipo de permiso no puede estar vacío')
      return
    }

    setError('')
    setMessage('')
    setLoading(true)

    try {
      const { error: updateError } = await supabase
        .from('TiposPermisos')
        .update({ Nombre: nuevoTipoPermiso.trim() })
        .eq('Id', editandoPermiso.id)

      if (updateError) {
        if (updateError.code === 'PGRST116' || updateError.message?.includes('relation') || updateError.message?.includes('does not exist')) {
          setTiposPermisos(tiposPermisos.map(t => 
            t.id === editandoPermiso.id ? { ...t, nombre: nuevoTipoPermiso.trim() } : t
          ))
          setEditandoPermiso(null)
          setNuevoTipoPermiso('')
          setMessage('Tipo de permiso actualizado (nota: las tablas de configuración no existen en la BD)')
        } else {
          throw updateError
        }
      } else {
        // Recargar desde la BD
        const { data: permisosData } = await supabase
          .from('TiposPermisos')
          .select('*')
          .eq('Activo', true)
          .order('Nombre')
        
        if (permisosData) {
          setTiposPermisos(permisosData.map(t => ({ id: t.Id, nombre: t.Nombre, activo: t.Activo !== false })))
        }
        setEditandoPermiso(null)
        setNuevoTipoPermiso('')
        setMessage('Tipo de permiso actualizado correctamente')
      }
    } catch (err) {
      setError(err.message || 'Error al actualizar el tipo de permiso')
      console.error('Error al actualizar tipo de permiso:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleGuardarEdicionJustificacion = async () => {
    if (!nuevoTipoJustificacion.trim()) {
      setError('El nombre del tipo de justificación no puede estar vacío')
      return
    }

    setError('')
    setMessage('')
    setLoading(true)

    try {
      const { error: updateError } = await supabase
        .from('TiposJustificaciones')
        .update({ Nombre: nuevoTipoJustificacion.trim() })
        .eq('Id', editandoJustificacion.id)

      if (updateError) {
        if (updateError.code === 'PGRST116' || updateError.message?.includes('relation') || updateError.message?.includes('does not exist')) {
          setTiposJustificaciones(tiposJustificaciones.map(t => 
            t.id === editandoJustificacion.id ? { ...t, nombre: nuevoTipoJustificacion.trim() } : t
          ))
          setEditandoJustificacion(null)
          setNuevoTipoJustificacion('')
          setMessage('Tipo de justificación actualizado (nota: las tablas de configuración no existen en la BD)')
        } else {
          throw updateError
        }
      } else {
        // Recargar desde la BD
        const { data: justificacionesData } = await supabase
          .from('TiposJustificaciones')
          .select('*')
          .eq('Activo', true)
          .order('Nombre')
        
        if (justificacionesData) {
          setTiposJustificaciones(justificacionesData.map(t => ({ id: t.Id, nombre: t.Nombre, activo: t.Activo !== false })))
        }
        setEditandoJustificacion(null)
        setNuevoTipoJustificacion('')
        setMessage('Tipo de justificación actualizado correctamente')
      }
    } catch (err) {
      setError(err.message || 'Error al actualizar el tipo de justificación')
      console.error('Error al actualizar tipo de justificación:', err)
    } finally {
      setLoading(false)
    }
  }

  const cancelarEdicion = () => {
    setEditandoPermiso(null)
    setEditandoJustificacion(null)
    setEditandoProyecto(null)
    setNuevoTipoPermiso('')
    setNuevoTipoJustificacion('')
    setNuevoProyecto('')
    setError('')
  }

  // Funciones para gestionar proyectos (departamentos)
  const handleAgregarProyecto = async () => {
    if (!nuevoProyecto.trim()) {
      setError('El nombre del proyecto no puede estar vacío')
      return
    }

    if (proyectos.some(p => p.nombre.toLowerCase() === nuevoProyecto.trim().toLowerCase())) {
      setError('Este proyecto ya existe')
      return
    }

    setError('')
    setMessage('')
    setLoading(true)

    try {
      const { data: insertedData, error: insertError } = await supabase
        .from('Proyectos')
        .insert({ Nombre: nuevoProyecto.trim(), Activo: true })
        .select()

      if (insertError) {
        if (insertError.code === 'PGRST116' || insertError.message?.includes('relation') || insertError.message?.includes('does not exist')) {
          const nuevoId = proyectos.length > 0 ? Math.max(...proyectos.map(p => p.id)) + 1 : 1
          setProyectos([...proyectos, { id: nuevoId, nombre: nuevoProyecto.trim(), activo: true }])
          setNuevoProyecto('')
          setMessage('Proyecto agregado (nota: la tabla de proyectos no existe en la BD. Ejecuta el script SQL para crearla)')
          setError('')
        } else {
          throw insertError
        }
      } else {
        // Recargar desde la BD
        const { data: proyectosData } = await supabase
          .from('Proyectos')
          .select('*')
          .order('Nombre')
        
        if (proyectosData) {
          setProyectos(proyectosData.map(p => ({ id: p.Id, nombre: p.Nombre, activo: p.Activo !== false })))
        }
        setNuevoProyecto('')
        setMessage('Proyecto agregado correctamente')
      }
    } catch (err) {
      setError(err.message || 'Error al agregar el proyecto')
      console.error('Error al agregar proyecto:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleEditarProyecto = (proyecto) => {
    setEditandoProyecto(proyecto)
    setNuevoProyecto(proyecto.nombre)
  }

  const handleGuardarEdicionProyecto = async () => {
    if (!nuevoProyecto.trim()) {
      setError('El nombre del proyecto no puede estar vacío')
      return
    }

    setError('')
    setMessage('')
    setLoading(true)

    try {
      const { error: updateError } = await supabase
        .from('Proyectos')
        .update({ Nombre: nuevoProyecto.trim() })
        .eq('Id', editandoProyecto.id)

      if (updateError) {
        if (updateError.code === 'PGRST116' || updateError.message?.includes('relation') || updateError.message?.includes('does not exist')) {
          setProyectos(proyectos.map(p => 
            p.id === editandoProyecto.id ? { ...p, nombre: nuevoProyecto.trim() } : p
          ))
          setEditandoProyecto(null)
          setNuevoProyecto('')
          setMessage('Proyecto actualizado (nota: la tabla de proyectos no existe en la BD)')
        } else {
          throw updateError
        }
      } else {
        // Recargar desde la BD
        const { data: proyectosData } = await supabase
          .from('Proyectos')
          .select('*')
          .order('Nombre')
        
        if (proyectosData) {
          setProyectos(proyectosData.map(p => ({ id: p.Id, nombre: p.Nombre, activo: p.Activo !== false })))
        }
        setEditandoProyecto(null)
        setNuevoProyecto('')
        setMessage('Proyecto actualizado correctamente')
      }
    } catch (err) {
      setError(err.message || 'Error al actualizar el proyecto')
      console.error('Error al actualizar proyecto:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleEliminarProyecto = async (id) => {
    if (!confirm('¿Está seguro de que desea eliminar este proyecto?')) return

    setLoading(true)
    setError('')
    setMessage('')

    try {
      const { error: deleteError } = await supabase
        .from('Proyectos')
        .delete()
        .eq('Id', id)

      if (deleteError) {
        if (deleteError.code === 'PGRST116' || deleteError.message?.includes('relation') || deleteError.message?.includes('does not exist')) {
          setProyectos(proyectos.filter(p => p.id !== id))
          setMessage('Proyecto eliminado (nota: la tabla de proyectos no existe en la BD)')
        } else {
          throw deleteError
        }
      } else {
        // Recargar desde la BD
        const { data: proyectosData } = await supabase
          .from('Proyectos')
          .select('*')
          .order('Nombre')
        
        if (proyectosData) {
          setProyectos(proyectosData.map(p => ({ id: p.Id, nombre: p.Nombre, activo: p.Activo !== false })))
        } else {
          setProyectos(proyectos.filter(p => p.id !== id))
        }
        setMessage('Proyecto eliminado correctamente')
      }
    } catch (err) {
      setError(err.message || 'Error al eliminar el proyecto')
      console.error('Error al eliminar proyecto:', err)
    } finally {
      setLoading(false)
    }
  }

  const tabs = [
    { id: 'permisos', label: 'Tipos de Permisos' },
    { id: 'justificaciones', label: 'Tipos de Justificaciones' },
    { id: 'proyectos', label: 'Proyectos' },
  ]

  return (
    <div className="section-stack">
      <div className="panel-header">
        <div>
          <p className="eyebrow">Configuraciones</p>
          <h2>Gestiona las configuraciones del sistema</h2>
          <p className="page-subtitle">
            Administra tipos de permisos, justificaciones y otras configuraciones del sistema.
          </p>
        </div>
      </div>

      {/* Pestañas */}
      <div style={{ 
        display: 'flex', 
        gap: '0.5rem', 
        borderBottom: '2px solid #e2e8f0',
        marginBottom: '1.5rem'
      }}>
        {tabs.map(tab => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            style={{
              padding: '0.75rem 1.5rem',
              border: 'none',
              background: 'transparent',
              borderBottom: activeTab === tab.id ? '3px solid #3b82f6' : '3px solid transparent',
              color: activeTab === tab.id ? '#3b82f6' : '#64748b',
              fontWeight: activeTab === tab.id ? '600' : '400',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Mensajes */}
      {error && (
        <div style={{ 
          padding: '0.75rem 1rem', 
          background: '#fee2e2', 
          color: '#dc2626', 
          borderRadius: '0.5rem',
          marginBottom: '1rem'
        }}>
          {error}
        </div>
      )}
      {message && (
        <div style={{ 
          padding: '0.75rem 1rem', 
          background: '#d1fae5', 
          color: '#059669', 
          borderRadius: '0.5rem',
          marginBottom: '1rem'
        }}>
          {message}
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: 'center', padding: '2rem' }}>
          Cargando configuraciones...
        </div>
      ) : (
        <>
          {/* Tab: Tipos de Permisos */}
          {activeTab === 'permisos' && (
            <div className="section-card">
              <h3 style={{ marginBottom: '1.5rem' }}>Tipos de Permisos</h3>
              
              {/* Formulario para agregar/editar */}
              <div style={{ 
                display: 'flex', 
                gap: '0.5rem', 
                marginBottom: '1.5rem',
                alignItems: 'flex-end'
              }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                    {editandoPermiso ? 'Editar tipo de permiso' : 'Nuevo tipo de permiso'}
                  </label>
                  <input
                    type="text"
                    value={nuevoTipoPermiso}
                    onChange={(e) => setNuevoTipoPermiso(e.target.value)}
                    placeholder="Ej: Permiso, Vacaciones, Cita Medica"
                    style={{
                      width: '100%',
                      padding: '0.5rem',
                      border: '1px solid #cbd5e1',
                      borderRadius: '0.375rem',
                      fontSize: '0.875rem'
                    }}
                  />
                </div>
                {editandoPermiso ? (
                  <>
                    <button
                      type="button"
                      onClick={handleGuardarEdicionPermiso}
                      className="btn btn-primary"
                    >
                      Guardar
                    </button>
                    <button
                      type="button"
                      onClick={cancelarEdicion}
                      className="btn btn-outline"
                    >
                      Cancelar
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    onClick={handleAgregarTipoPermiso}
                    className="btn btn-primary"
                  >
                    + Agregar
                  </button>
                )}
              </div>

              {/* Lista de tipos de permisos */}
              <div style={{ display: 'grid', gap: '0.75rem' }}>
                {tiposPermisos.length === 0 ? (
                  <p style={{ textAlign: 'center', color: '#64748b', padding: '2rem' }}>
                    No hay tipos de permisos registrados
                  </p>
                ) : (
                  tiposPermisos.map(tipo => (
                    <div
                      key={tipo.id}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '1rem',
                        background: '#f8fafc',
                        borderRadius: '0.5rem',
                        border: '1px solid #e2e8f0'
                      }}
                    >
                      <span style={{ fontWeight: '500' }}>{tipo.nombre}</span>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button
                          type="button"
                          onClick={() => handleEditarTipoPermiso(tipo)}
                          className="btn btn-outline btn-small"
                        >
                          Editar
                        </button>
                        <button
                          type="button"
                          onClick={() => handleEliminarTipoPermiso(tipo.id)}
                          className="btn btn-outline btn-small danger"
                        >
                          Eliminar
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* Tab: Tipos de Justificaciones */}
          {activeTab === 'justificaciones' && (
            <div className="section-card">
              <h3 style={{ marginBottom: '1.5rem' }}>Tipos de Justificaciones</h3>
              
              {/* Formulario para agregar/editar */}
              <div style={{ 
                display: 'flex', 
                gap: '0.5rem', 
                marginBottom: '1.5rem',
                alignItems: 'flex-end'
              }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                    {editandoJustificacion ? 'Editar tipo de justificación' : 'Nuevo tipo de justificación'}
                  </label>
                  <input
                    type="text"
                    value={nuevoTipoJustificacion}
                    onChange={(e) => setNuevoTipoJustificacion(e.target.value)}
                    placeholder="Ej: Ausencia, Tardía, Incapacidad"
                    style={{
                      width: '100%',
                      padding: '0.5rem',
                      border: '1px solid #cbd5e1',
                      borderRadius: '0.375rem',
                      fontSize: '0.875rem'
                    }}
                  />
                </div>
                {editandoJustificacion ? (
                  <>
                    <button
                      type="button"
                      onClick={handleGuardarEdicionJustificacion}
                      className="btn btn-primary"
                    >
                      Guardar
                    </button>
                    <button
                      type="button"
                      onClick={cancelarEdicion}
                      className="btn btn-outline"
                    >
                      Cancelar
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    onClick={handleAgregarTipoJustificacion}
                    className="btn btn-primary"
                  >
                    + Agregar
                  </button>
                )}
              </div>

              {/* Lista de tipos de justificaciones */}
              <div style={{ display: 'grid', gap: '0.75rem' }}>
                {tiposJustificaciones.length === 0 ? (
                  <p style={{ textAlign: 'center', color: '#64748b', padding: '2rem' }}>
                    No hay tipos de justificaciones registrados
                  </p>
                ) : (
                  tiposJustificaciones.map(tipo => (
                    <div
                      key={tipo.id}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '1rem',
                        background: '#f8fafc',
                        borderRadius: '0.5rem',
                        border: '1px solid #e2e8f0'
                      }}
                    >
                      <span style={{ fontWeight: '500' }}>{tipo.nombre}</span>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button
                          type="button"
                          onClick={() => handleEditarTipoJustificacion(tipo)}
                          className="btn btn-outline btn-small"
                        >
                          Editar
                        </button>
                        <button
                          type="button"
                          onClick={() => handleEliminarTipoJustificacion(tipo.id)}
                          className="btn btn-outline btn-small danger"
                        >
                          Eliminar
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* Tab: Proyectos (Departamentos) */}
          {activeTab === 'proyectos' && (
            <div className="section-card">
              <h3 style={{ marginBottom: '1.5rem' }}>Proyectos (Departamentos)</h3>
              
              {/* Formulario para agregar/editar */}
              <div style={{ 
                display: 'flex', 
                gap: '0.5rem', 
                marginBottom: '1.5rem',
                alignItems: 'flex-end'
              }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                    {editandoProyecto ? 'Editar proyecto' : 'Nuevo proyecto'}
                  </label>
                  <input
                    type="text"
                    value={nuevoProyecto}
                    onChange={(e) => setNuevoProyecto(e.target.value)}
                    placeholder="Ej: Recursos Humanos, Ventas, IT"
                    style={{
                      width: '100%',
                      padding: '0.5rem',
                      border: '1px solid #cbd5e1',
                      borderRadius: '0.375rem',
                      fontSize: '0.875rem'
                    }}
                  />
                </div>
                {editandoProyecto ? (
                  <>
                    <button
                      type="button"
                      onClick={handleGuardarEdicionProyecto}
                      className="btn btn-primary"
                    >
                      Guardar
                    </button>
                    <button
                      type="button"
                      onClick={cancelarEdicion}
                      className="btn btn-outline"
                    >
                      Cancelar
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    onClick={handleAgregarProyecto}
                    className="btn btn-primary"
                  >
                    + Agregar
                  </button>
                )}
              </div>

              {/* Lista de proyectos */}
              <div style={{ display: 'grid', gap: '0.75rem' }}>
                {proyectos.length === 0 ? (
                  <p style={{ textAlign: 'center', color: '#64748b', padding: '2rem' }}>
                    No hay proyectos registrados
                  </p>
                ) : (
                  proyectos.map(proyecto => (
                    <div
                      key={proyecto.id}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '1rem',
                        background: '#f8fafc',
                        borderRadius: '0.5rem',
                        border: '1px solid #e2e8f0'
                      }}
                    >
                      <span style={{ fontWeight: '500' }}>{proyecto.nombre}</span>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button
                          type="button"
                          onClick={() => handleEditarProyecto(proyecto)}
                          className="btn btn-outline btn-small"
                        >
                          Editar
                        </button>
                        <button
                          type="button"
                          onClick={() => handleEliminarProyecto(proyecto.id)}
                          className="btn btn-outline btn-small danger"
                        >
                          Eliminar
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}

export default App
