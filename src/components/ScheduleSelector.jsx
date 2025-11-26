import { useState, useEffect } from 'react'

const DAYS = ['lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado', 'domingo']
const HOURS = Array.from({ length: 24 }, (_, i) => 
  String(i).padStart(2, '0') + ':00'
)

const ScheduleSelector = ({ initialSchedule, onScheduleChange }) => {
  const [notification, setNotification] = useState(null)
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

  // Verificar si hay un patrón inválido: hora completa seguida de media hora (o viceversa) en el medio
  // La regla: No se puede tener "full → half" o "half → full" cuando hay más horas laborales después/antes
  const hasInvalidPattern = (day, hour, schedule, newState) => {
    const hourIndex = HOURS.indexOf(hour)
    const daySchedule = schedule[day] || {}
    
    // Verificar hora anterior
    const prevHour = hourIndex > 0 ? HOURS[hourIndex - 1] : null
    const prevState = prevHour ? daySchedule[prevHour] : 'empty'
    
    // Verificar hora siguiente
    const nextHour = hourIndex < HOURS.length - 1 ? HOURS[hourIndex + 1] : null
    const nextState = nextHour ? daySchedule[nextHour] : 'empty'
    
    // Aplicar el nuevo estado temporalmente para la validación
    const tempSchedule = { ...daySchedule, [hour]: newState }
    
    // Verificar si hay horas laborales después de la siguiente hora
    let hasLaborHoursAfter = false
    if (nextHour) {
      for (let i = hourIndex + 2; i < HOURS.length; i++) {
        const h = HOURS[i]
        const state = tempSchedule[h] || daySchedule[h] || 'empty'
        if (state === 'full' || state === 'half') {
          hasLaborHoursAfter = true
          break
        }
      }
    }
    
    // Verificar si hay horas laborales antes de la hora anterior
    let hasLaborHoursBefore = false
    if (prevHour) {
      for (let i = hourIndex - 2; i >= 0; i--) {
        const h = HOURS[i]
        const state = tempSchedule[h] || daySchedule[h] || 'empty'
        if (state === 'full' || state === 'half') {
          hasLaborHoursBefore = true
          break
        }
      }
    }
    
    // Patrón inválido: full → half cuando hay más horas después (en el medio)
    if (prevState === 'full' && newState === 'half' && hasLaborHoursAfter) {
      return true
    }
    
    // Patrón inválido: half → full cuando hay más horas antes (en el medio)
    if (prevState === 'half' && newState === 'full' && hasLaborHoursBefore) {
      return true
    }
    
    // Patrón inválido: full → half → full (media hora entre dos completas)
    if (prevState === 'full' && newState === 'half' && nextState === 'full') {
      return true
    }
    
    // Patrón inválido: half → full → half (hora completa entre dos medias)
    if (prevState === 'half' && newState === 'full' && nextState === 'half') {
      return true
    }
    
    return false
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
      let showNotification = false
      let notificationMessage = ''
      
      // VALIDACIÓN: Permitir medias horas en cualquier lugar, EXCEPTO cuando crean patrones inválidos
      // Patrón inválido: full → half cuando hay más horas después (en el medio)
      // Patrón inválido: half → full cuando hay más horas antes (en el medio)
      // Patrón inválido: full → half → full (media hora entre dos completas)
      // Patrón inválido: half → full → half (hora completa entre dos medias)
      
      // Verificar si el nuevo estado crearía un patrón inválido
      if (hasInvalidPattern(day, hour, { ...prev, [day]: newDaySchedule }, nextStateForCurrent)) {
        // Si crearía un patrón inválido, corregir automáticamente
        if (nextStateForCurrent === 'half') {
          // Si se intenta poner media hora y crea patrón inválido, convertir en completa
          nextStateForCurrent = 'full'
          showNotification = true
          notificationMessage = 'No se puede tener una hora completa seguida de una media hora en el medio de la jornada. Se convirtió automáticamente en hora completa.'
        } else if (nextStateForCurrent === 'full') {
          // Si se intenta poner hora completa y crea patrón inválido, convertir en media
          nextStateForCurrent = 'half'
          showNotification = true
          notificationMessage = 'No se puede tener una media hora seguida de una hora completa en el medio de la jornada. Se convirtió automáticamente en media hora.'
        }
      }
      
      // Aplicar el cambio
      newDaySchedule[hour] = nextStateForCurrent
      
      // Verificar y corregir patrones inválidos en horas adyacentes después del cambio
      // Si hay una media hora que quedó en un patrón inválido, corregirla
      if (nextStateForCurrent === 'full' && nextState === 'half') {
        // Verificar si hay más horas después
        let hasMoreHoursAfter = false
        for (let i = hourIndex + 2; i < HOURS.length; i++) {
          const h = HOURS[i]
          const state = newDaySchedule[h] || daySchedule[h] || 'empty'
          if (state === 'full' || state === 'half') {
            hasMoreHoursAfter = true
            break
          }
        }
        // Si hay más horas después, la media hora está en el medio, convertirla en completa
        if (hasMoreHoursAfter) {
          newDaySchedule[nextHour] = 'full'
          if (!showNotification) {
            showNotification = true
            notificationMessage = `Se corrigió automáticamente: la media hora en ${nextHour} quedó en el medio de la jornada. Se convirtió en hora completa.`
          }
        }
      }
      
      // Verificar el caso inverso: half → full cuando hay más horas antes
      if (prevState === 'half' && nextStateForCurrent === 'full') {
        // Verificar si hay más horas antes
        let hasMoreHoursBefore = false
        for (let i = hourIndex - 2; i >= 0; i--) {
          const h = HOURS[i]
          const state = newDaySchedule[h] || daySchedule[h] || 'empty'
          if (state === 'full' || state === 'half') {
            hasMoreHoursBefore = true
            break
          }
        }
        // Si hay más horas antes, la media hora anterior está en el medio, convertirla en completa
        if (hasMoreHoursBefore) {
          newDaySchedule[prevHour] = 'full'
          if (!showNotification) {
            showNotification = true
            notificationMessage = `Se corrigió automáticamente: la media hora en ${prevHour} quedó en el medio de la jornada. Se convirtió en hora completa.`
          }
        }
      }
      
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
      
      // Mostrar notificación si es necesario
      if (showNotification && notificationMessage) {
        setNotification({
          message: notificationMessage,
          type: 'warning'
        })
        // Ocultar notificación después de 4 segundos
        setTimeout(() => {
          setNotification(null)
        }, 4000)
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
      {/* Notificación de validación */}
      {notification && (
        <div style={{
          position: 'fixed',
          top: '20px',
          right: '20px',
          zIndex: 10001,
          background: '#ffffff',
          border: '2px solid #f59e0b',
          borderRadius: '12px',
          padding: '1rem 1.25rem',
          boxShadow: '0 10px 25px rgba(245, 158, 11, 0.3)',
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          minWidth: '360px',
          maxWidth: '500px',
          animation: 'slideInRight 0.3s ease-out'
        }}>
          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: '10px',
            background: '#fef3c7',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}>
            <span style={{ fontSize: '1.5rem' }}>⚠️</span>
          </div>
          <div style={{ flex: 1 }}>
            <p style={{
              margin: 0,
              fontSize: '0.9375rem',
              fontWeight: 600,
              color: '#d97706',
              marginBottom: '0.25rem'
            }}>
              Validación de Horario
            </p>
            <p style={{
              margin: 0,
              fontSize: '0.875rem',
              color: '#92400e',
              lineHeight: 1.5
            }}>
              {notification.message}
            </p>
          </div>
          <button
            onClick={() => setNotification(null)}
            style={{
              background: 'transparent',
              border: 'none',
              fontSize: '1.25rem',
              color: '#94a3b8',
              cursor: 'pointer',
              padding: '0.25rem',
              lineHeight: 1,
              transition: 'color 0.2s',
              borderRadius: '6px',
              width: '28px',
              height: '28px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
            onMouseEnter={(e) => {
              e.target.style.background = '#f1f5f9'
              e.target.style.color = '#64748b'
            }}
            onMouseLeave={(e) => {
              e.target.style.background = 'transparent'
              e.target.style.color = '#94a3b8'
            }}
          >
            ✕
          </button>
        </div>
      )}
      
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
          <span>Vacío - No trabaja en estas horas</span>
        </div>
        <div className="legend-item">
          <div className="legend-box full"></div>
          <span>Hora completa - Entra en esta hora (ej: 8:00-9:00)</span>
        </div>
        <div className="legend-item">
          <div className="legend-box half"></div>
          <span>Media hora - Entra a la media hora (ej: 8:30-9:30)</span>
        </div>
        <div style={{
          marginTop: '0.75rem',
          padding: '0.75rem',
          background: '#fef2f2',
          borderRadius: '8px',
          border: '1px solid #fecaca',
          fontSize: '0.8125rem',
          color: '#991b1b',
          lineHeight: 1.5
        }}>
          <strong>⚠️ Regla importante:</strong> No se puede tener una hora completa seguida de una media hora (o viceversa) en el medio de la jornada.
          <br />
          <strong>✅ Permitido:</strong> Media hora al inicio seguida de horas completas (ej: entrada 8:30, trabajo 9:00-16:00)
          <br />
          <strong>✅ Permitido:</strong> Horas completas seguidas de media hora al final (ej: trabajo 8:00-15:00, salida 16:30)
          <br />
          <strong>✅ Permitido:</strong> Varias medias horas seguidas o varias horas completas seguidas
          <br />
          <strong>❌ No permitido:</strong> Hora completa → Media hora cuando hay más horas después (se corregirá automáticamente)
        </div>
      </div>
    </div>
  )
}

export default ScheduleSelector

