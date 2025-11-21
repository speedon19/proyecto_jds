import { useState, useEffect } from 'react'

const DAYS = ['lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado', 'domingo']
const HOURS = Array.from({ length: 24 }, (_, i) => 
  String(i).padStart(2, '0') + ':00'
)

const ScheduleSelector = ({ initialSchedule, onScheduleChange }) => {
  // Inicializar estado con estructura: { "lunes": { "08:00": "full", ... }, ... }
  const [schedule, setSchedule] = useState(() => {
    const initial = {}
    DAYS.forEach(day => {
      initial[day] = {}
      HOURS.forEach(hour => {
        initial[day][hour] = 'empty'
      })
    })
    return initial
  })

  // Cargar horario inicial si se proporciona
  useEffect(() => {
    if (initialSchedule) {
      try {
        const parsed = typeof initialSchedule === 'string' 
          ? JSON.parse(initialSchedule) 
          : initialSchedule
        
        // Validar y cargar el horario
        const loaded = {}
        DAYS.forEach(day => {
          loaded[day] = {}
          HOURS.forEach(hour => {
            if (parsed[day] && parsed[day][hour]) {
              loaded[day][hour] = parsed[day][hour]
            } else {
              loaded[day][hour] = 'empty'
            }
          })
        })
        setSchedule(loaded)
      } catch (error) {
        console.error('Error al cargar horario:', error)
      }
    }
  }, [initialSchedule])

  // Ciclo de estados: empty → full → half → empty
  const cycleState = (currentState) => {
    if (currentState === 'empty') return 'full'
    if (currentState === 'full') return 'half'
    if (currentState === 'half') return 'empty'
    return 'empty'
  }

  // Validar si se puede poner media hora en esta posición
  // Se puede si:
  // 1. Hay una hora completa adyacente (antes o después), O
  // 2. No hay ninguna hora laboral antes (inicio de jornada)
  const canPlaceHalfHour = (day, hour, schedule) => {
    const hourIndex = HOURS.indexOf(hour)
    const daySchedule = schedule[day] || {}
    
    // Verificar hora anterior
    const prevHour = hourIndex > 0 ? HOURS[hourIndex - 1] : null
    const prevState = prevHour ? daySchedule[prevHour] : 'empty'
    
    // Verificar hora siguiente
    const nextHour = hourIndex < HOURS.length - 1 ? HOURS[hourIndex + 1] : null
    const nextState = nextHour ? daySchedule[nextHour] : 'empty'
    
    // Verificar si hay alguna hora laboral antes
    let hasLaborHourBefore = false
    for (let i = hourIndex - 1; i >= 0; i--) {
      const h = HOURS[i]
      const state = daySchedule[h]
      if (state === 'full' || state === 'half') {
        hasLaborHourBefore = true
        break
      }
    }
    
    // Se puede poner media hora si:
    // - Hay una hora completa adyacente, O
    // - No hay ninguna hora laboral antes (tabla vacía por delante)
    return prevState === 'full' || nextState === 'full' || !hasLaborHourBefore
  }

  const handleCellClick = (day, hour) => {
    setSchedule(prev => {
      const currentState = prev[day]?.[hour] || 'empty'
      const hourIndex = HOURS.indexOf(hour)
      const daySchedule = prev[day] || {}
      
      // Verificar hora anterior y siguiente
      const prevHour = hourIndex > 0 ? HOURS[hourIndex - 1] : null
      const prevState = prevHour ? daySchedule[prevHour] : 'empty'
      const nextHour = hourIndex < HOURS.length - 1 ? HOURS[hourIndex + 1] : null
      const nextState = nextHour ? daySchedule[nextHour] : 'empty'
      
      let newDaySchedule = { ...daySchedule }
      let nextStateForCurrent = cycleState(currentState)
      
      // Caso especial: Si se está colocando una hora completa y hay una media hora adyacente
      if (nextStateForCurrent === 'full') {
        // Si hay media hora antes, convertirla en completa y la nueva en media
        if (prevState === 'half') {
          newDaySchedule[prevHour] = 'full'
          nextStateForCurrent = 'half'
        }
        // Si hay media hora después, convertirla en completa y la nueva en media
        else if (nextState === 'half') {
          newDaySchedule[nextHour] = 'full'
          nextStateForCurrent = 'half'
        }
      }
      
      // Si el siguiente estado es "half", validar que se puede colocar
      if (nextStateForCurrent === 'half') {
        if (!canPlaceHalfHour(day, hour, { ...prev, [day]: newDaySchedule })) {
          // Si no se puede poner media hora, saltar a empty
          nextStateForCurrent = 'empty'
        }
      }
      
      newDaySchedule[hour] = nextStateForCurrent
      
      // Rellenar espacios vacíos entre horas laborales
      // Buscar la última hora laboral antes (full o half)
      let lastLaborHourIndex = -1
      for (let i = hourIndex - 1; i >= 0; i--) {
        const h = HOURS[i]
        const state = newDaySchedule[h]
        if (state === 'full' || state === 'half') {
          lastLaborHourIndex = i
          break
        }
      }
      
      // Buscar la primera hora laboral después (full o half)
      let nextLaborHourIndex = -1
      for (let i = hourIndex + 1; i < HOURS.length; i++) {
        const h = HOURS[i]
        const state = newDaySchedule[h]
        if (state === 'full' || state === 'half') {
          nextLaborHourIndex = i
          break
        }
      }
      
      // Si hay horas laborales antes y después, rellenar los espacios intermedios
      if (lastLaborHourIndex !== -1 && nextLaborHourIndex !== -1) {
        // Convertir media hora anterior en completa si existe
        if (newDaySchedule[HOURS[lastLaborHourIndex]] === 'half') {
          newDaySchedule[HOURS[lastLaborHourIndex]] = 'full'
        }
        // Convertir media hora siguiente en completa si existe
        if (newDaySchedule[HOURS[nextLaborHourIndex]] === 'half') {
          newDaySchedule[HOURS[nextLaborHourIndex]] = 'full'
        }
        
        // Rellenar desde la última hora laboral hasta la hora actual
        for (let i = lastLaborHourIndex + 1; i < hourIndex; i++) {
          const h = HOURS[i]
          if (!newDaySchedule[h] || newDaySchedule[h] === 'empty') {
            newDaySchedule[h] = 'full'
          }
        }
        // Rellenar desde la hora actual hasta la próxima hora laboral
        for (let i = hourIndex + 1; i < nextLaborHourIndex; i++) {
          const h = HOURS[i]
          if (!newDaySchedule[h] || newDaySchedule[h] === 'empty') {
            newDaySchedule[h] = 'full'
          }
        }
      }
      // Si solo hay hora laboral antes, rellenar hasta la hora actual
      else if (lastLaborHourIndex !== -1) {
        // Convertir media hora anterior en completa si existe
        if (newDaySchedule[HOURS[lastLaborHourIndex]] === 'half') {
          newDaySchedule[HOURS[lastLaborHourIndex]] = 'full'
        }
        
        for (let i = lastLaborHourIndex + 1; i < hourIndex; i++) {
          const h = HOURS[i]
          if (!newDaySchedule[h] || newDaySchedule[h] === 'empty') {
            newDaySchedule[h] = 'full'
          }
        }
      }
      // Si solo hay hora laboral después, rellenar desde la hora actual
      else if (nextLaborHourIndex !== -1) {
        // Convertir media hora siguiente en completa si existe
        if (newDaySchedule[HOURS[nextLaborHourIndex]] === 'half') {
          newDaySchedule[HOURS[nextLaborHourIndex]] = 'full'
        }
        
        for (let i = hourIndex + 1; i < nextLaborHourIndex; i++) {
          const h = HOURS[i]
          if (!newDaySchedule[h] || newDaySchedule[h] === 'empty') {
            newDaySchedule[h] = 'full'
          }
        }
      }
      
      // Si la hora actual es completa y hay medias horas adyacentes, convertirlas también
      if (nextStateForCurrent === 'full') {
        if (prevState === 'half') {
          newDaySchedule[prevHour] = 'full'
        }
        if (nextState === 'half') {
          newDaySchedule[nextHour] = 'full'
        }
      }
      
      const newSchedule = {
        ...prev,
        [day]: newDaySchedule
      }
      
      // Notificar cambio al componente padre
      if (onScheduleChange) {
        onScheduleChange(newSchedule)
      }
      
      return newSchedule
    })
  }

  const resetSchedule = () => {
    const empty = {}
    DAYS.forEach(day => {
      empty[day] = {}
      HOURS.forEach(hour => {
        empty[day][hour] = 'empty'
      })
    })
    setSchedule(empty)
    if (onScheduleChange) {
      onScheduleChange(empty)
    }
  }

  const getSchedule = () => {
    return schedule
  }

  return (
    <div className="schedule-selector">
      <div className="schedule-header">
        <h4>Selecciona las horas de trabajo</h4>
        <button 
          type="button" 
          className="btn btn-outline btn-small"
          onClick={resetSchedule}
        >
          Limpiar todo
        </button>
      </div>
      
      <div className="schedule-grid-container">
        <div className="schedule-grid">
          {/* Header con días */}
          <div className="schedule-cell schedule-header-cell"></div>
          {DAYS.map(day => (
            <div key={day} className="schedule-cell schedule-header-cell">
              {day.charAt(0).toUpperCase() + day.slice(1)}
            </div>
          ))}
          
          {/* Filas de horas */}
          {HOURS.map(hour => (
            <div key={hour} style={{ display: 'contents' }}>
              {/* Columna de horas - siempre a la izquierda */}
              <div className="schedule-cell schedule-hour-cell">
                {hour}
              </div>
              
              {/* Celdas de cada día */}
              {DAYS.map(day => {
                const state = schedule[day]?.[hour] || 'empty'
                return (
                  <div
                    key={`${day}-${hour}`}
                    className={`schedule-cell schedule-data-cell ${state}`}
                    onClick={() => handleCellClick(day, hour)}
                    title={
                      state === 'half' 
                        ? `${day} ${hour} - Media hora (solo al inicio/final de jornada)`
                        : `${day} ${hour} - Click para cambiar`
                    }
                  />
                )
              })}
            </div>
          ))}
        </div>
      </div>
      
      <div className="schedule-legend">
        <div className="legend-item">
          <div className="legend-box empty"></div>
          <span>Vacío</span>
        </div>
        <div className="legend-item">
          <div className="legend-box full"></div>
          <span>Hora completa</span>
        </div>
        <div className="legend-item">
          <div className="legend-box half"></div>
          <span>Media hora</span>
        </div>
      </div>
    </div>
  )
}

export default ScheduleSelector

