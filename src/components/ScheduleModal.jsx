import { useState, useEffect } from 'react'
import ScheduleSelector from './ScheduleSelector'

const ScheduleModal = ({ isOpen, onClose, onSave, initialSchedule }) => {
  const [currentSchedule, setCurrentSchedule] = useState(null)

  useEffect(() => {
    if (isOpen) {
      setCurrentSchedule(initialSchedule || null)
    }
  }, [isOpen, initialSchedule])

  const handleSave = () => {
    if (currentSchedule) {
      onSave(currentSchedule)
    }
    onClose()
  }

  const handleScheduleChange = (schedule) => {
    setCurrentSchedule(schedule)
  }

  if (!isOpen) return null

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-container" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Seleccionar Horario Laboral</h3>
          <button 
            type="button" 
            className="modal-close-btn"
            onClick={onClose}
            aria-label="Cerrar"
          >
            ✕
          </button>
        </div>
        
        <div className="modal-body">
          <ScheduleSelector 
            initialSchedule={initialSchedule}
            onScheduleChange={handleScheduleChange}
          />
        </div>
        
        <div className="modal-footer">
          <button 
            type="button" 
            className="btn btn-outline"
            onClick={onClose}
          >
            Cancelar
          </button>
          <button 
            type="button" 
            className="btn btn-primary"
            onClick={handleSave}
          >
            Guardar Horario
          </button>
        </div>
      </div>
    </div>
  )
}

export default ScheduleModal





