# Sistema de Asistencias, Ausencias, Tardías, Pausas y Justificaciones

## Resumen General

El sistema gestiona el control de asistencia de empleados mediante varios componentes interrelacionados:

1. **Asistencias**: Registro de entrada y salida de empleados
2. **Ausencias**: Días sin asistencia
3. **Tardías**: Llegadas después de la hora esperada
4. **Pausas**: Descansos durante la jornada laboral
5. **Justificaciones**: Documentos que justifican ausencias o tardías
6. **Permisos**: Solicitudes aprobadas que eximen de asistencia

---

## 1. SISTEMA DE ASISTENCIAS

### 1.1 Registro Automático al Iniciar Sesión

**Ubicación**: `registrarAsistenciaInicioSesion()` (líneas 290-471)

**Flujo de Funcionamiento**:

1. **Búsqueda del Usuario**:
   - Busca el usuario por email (case-insensitive usando `NormalizedEmail`)
   - Obtiene el `EmpleadoId` asociado

2. **Verificación de Permisos**:
   - Verifica si el empleado tiene un permiso aprobado para la fecha actual
   - Si tiene permiso aprobado: **NO registra asistencia** (retorna sin hacer nada)
   - Consulta en tabla `Permisos` con:
     - `Estado = 'Aprobado'`
     - `FechaInicio <= hoy`
     - `FechaFin >= hoy`

3. **Verificación de Asistencia Existente**:
   - Busca si ya existe una asistencia para hoy
   - Si existe y tiene `HoraEntrada`: **NO hace nada** (ya registrado)
   - Si existe pero NO tiene `HoraEntrada`: **Actualiza** la asistencia

4. **Cálculo de Tardía**:
   - Obtiene el horario laboral del empleado (`HorarioLaboral`)
   - Calcula la hora esperada de entrada según el día de la semana
   - Compara la hora real con la esperada
   - Calcula minutos de tardía: `minutosTardia = diferencia > 0 ? diferencia : 0`
   - Solo cuenta como tardía si llegó DESPUÉS de la hora esperada

5. **Registro/Actualización**:
   - Si existe asistencia sin hora: **Actualiza** con:
     - `HoraEntrada`: Hora actual en ISO
     - `MinutosTardia`: Minutos calculados
     - `Estado`: 'Presente'
   - Si no existe: **Crea nueva** asistencia con los mismos datos

### 1.2 Estados de Asistencia

- **'Presente'**: Empleado registró entrada
- **'Ausente'**: No registró entrada (se crea automáticamente o manualmente)

### 1.3 Campos de la Tabla Asistencias

- `Id`: Identificador único
- `EmpleadoId`: Referencia al empleado
- `Fecha`: Fecha de la asistencia (YYYY-MM-DD)
- `HoraEntrada`: Timestamp ISO de la hora de entrada
- `HoraSalida`: Timestamp ISO de la hora de salida (opcional)
- `Estado`: 'Presente' o 'Ausente'
- `MinutosTardia`: Minutos de tardía calculados

---

## 2. SISTEMA DE TARDÍAS

### 2.1 Cálculo de Tardía

**Ubicación**: `registrarAsistenciaInicioSesion()` (líneas 380-412) y `recalcularTardia()` (líneas 5743-5866)

**Proceso**:

1. **Obtener Horario Laboral**:
   - Se obtiene de `Empleados.HorarioLaboral` (JSON)
   - Contiene horarios por día de la semana

2. **Obtener Hora Esperada**:
   - Función `obtenerHoraEntradaEsperada(horarioLaboral, fecha)`
   - Determina qué día de la semana es
   - Extrae la hora esperada de ese día

3. **Comparación**:
   - Convierte hora real y esperada a minutos desde medianoche
   - Calcula diferencia: `diferencia = minutosReal - minutosEsperados`
   - Tardía solo si `diferencia > 0`

4. **Recálculo Automático**:
   - En reportes de planilla, se recalcula la tardía basándose en el horario actual
   - Si el horario cambió, se actualiza automáticamente en la BD

### 2.2 Registro de Tardías

- Se guarda en `Asistencias.MinutosTardia`
- Se muestra en reportes y planillas
- Se recalcula automáticamente si cambia el horario del empleado

---

## 3. SISTEMA DE AUSENCIAS

### 3.1 Cómo se Determinan las Ausencias

**Ubicación**: Reportes de Planilla (líneas 5868-5895)

**Lógica**:

1. **Ausencia por Estado**:
   - Si `Asistencias.Estado = 'Ausente'` → Se cuenta como ausencia
   - Solo si NO tiene permiso aprobado para esa fecha

2. **Ausencia por Falta de Registro**:
   - Si no existe registro de asistencia para un día laboral
   - Se puede crear manualmente con estado 'Ausente'

3. **Excepciones**:
   - Si tiene **permiso aprobado**: NO cuenta como ausencia
   - Si tiene **justificación aprobada**: Puede justificar la ausencia

### 3.2 Relación con Justificaciones

- Las justificaciones de tipo 'Ausencia' pueden justificar ausencias
- Requieren aprobación del supervisor
- Una vez aprobadas, la ausencia queda justificada

---

## 4. SISTEMA DE PAUSAS

### 4.1 Registro de Pausas

**Ubicación**: `handleRegistrarPausa()` (líneas 1214-1288)

**Funcionamiento**:

1. **Requisitos**:
   - El empleado debe tener una asistencia registrada para hoy
   - Debe tener `HoraEntrada` registrada

2. **Tipos de Pausa**:
   - Se cargan desde la tabla `TiposPausas`
   - Ejemplos: "Almuerzo", "Descanso", "Reunión", etc.

3. **Registro**:
   - Se crea registro en tabla `Pausas` con:
     - `AsistenciaId`: ID de la asistencia del día
     - `TipoPausa`: Tipo seleccionado
     - `HoraInicio`: Timestamp actual
     - `Activa`: true

4. **Control de Tiempo**:
   - Máximo 60 minutos (3600 segundos) por pausa
   - Se calcula tiempo restante en tiempo real
   - Se muestra en el panel de supervisión

### 4.2 Cálculo de Tiempo de Pausa

**Ubicación**: Panel de Supervisión (líneas 1496-1508)

**Fórmula**:
```
tiempoTranscurrido = (ahora - horaInicio) / 1000 (en segundos)
tiempoActivo = tiempoTranscurrido - tiempoPausadoAcumulado
tiempoRestante = max(0, 3600 - tiempoActivo)
```

### 4.3 Campos de la Tabla Pausas

- `Id`: Identificador único
- `AsistenciaId`: Referencia a la asistencia
- `TipoPausa`: Tipo de pausa
- `HoraInicio`: Timestamp de inicio
- `HoraFin`: Timestamp de fin (cuando se cierra)
- `Activa`: Boolean (true si está en pausa)
- `TiempoPausadoAcumulado`: Segundos acumulados

---

## 5. SISTEMA DE JUSTIFICACIONES

### 5.1 Tipos de Justificaciones

**Ubicación**: `JustificationsPanel` (líneas 7480-8100)

**Tipos Disponibles**:
1. **Ausencia**: Justifica un día completo sin asistencia
2. **Tardía**: Justifica una llegada tardía
3. **Incapacidad**: Justifica un rango de fechas por incapacidad médica

### 5.2 Proceso de Justificación

**Flujo**:

1. **Creación**:
   - Empleado crea justificación con:
     - Tipo (Ausencia/Tardía/Incapacidad)
     - Fecha(s) según el tipo
     - Motivo
     - Documento soporte (opcional)
   - Estado inicial: 'Pendiente'

2. **Aprobación/Rechazo**:
   - Supervisor revisa y aprueba o rechaza
   - Estados: 'Pendiente', 'Aprobado', 'Rechazado'

3. **Efecto en Ausencias**:
   - Si está aprobada, la ausencia queda justificada
   - No cuenta como ausencia no justificada en reportes

### 5.3 Campos de la Tabla Justificaciones

- `Id`: Identificador único
- `EmpleadoId`: Referencia al empleado
- `Tipo`: 'Ausencia', 'Tardía', 'Incapacidad'
- `Fecha`: Fecha única (para Ausencia/Tardía)
- `FechaInicio`: Fecha inicio (para Incapacidad)
- `FechaFin`: Fecha fin (para Incapacidad)
- `Hora`: Hora específica (para Tardía)
- `Motivo`: Texto del motivo
- `DocumentoSoporte`: URL del documento
- `Estado`: 'Pendiente', 'Aprobado', 'Rechazado'
- `FechaRegistro`: Timestamp de creación

---

## 6. SISTEMA DE PERMISOS

### 6.1 Tipos de Permisos

**Ubicación**: `PermitsPanel` (líneas 6200-7500)

**Tipos**:
1. **Permiso**: Permiso general
2. **Vacaciones**: Días de vacaciones
3. **Cita Médica**: Cita médica

### 6.2 Efecto de los Permisos

**Cuando un Permiso está Aprobado**:

1. **NO se registra asistencia**:
   - Al iniciar sesión, si tiene permiso aprobado para hoy, NO se crea registro de asistencia
   - Se verifica en `registrarAsistenciaInicioSesion()` (líneas 323-339)

2. **Se muestra en Panel de Supervisión**:
   - Estado: "En Permiso" o "En Vacaciones"
   - Color: warning (amarillo)

3. **En Reportes de Planilla**:
   - Se cuenta como "Vacaciones" o "Permisos" según el tipo
   - NO cuenta como ausencia
   - NO cuenta como presente

### 6.3 Campos de la Tabla Permisos

- `Id`: Identificador único
- `EmpleadoId`: Referencia al empleado
- `Tipo`: 'Permiso', 'Vacaciones', 'Cita Medica'
- `FechaInicio`: Fecha de inicio del permiso
- `FechaFin`: Fecha de fin del permiso
- `HoraInicio`: Hora inicio (opcional, para permisos de horas)
- `HoraFin`: Hora fin (opcional)
- `Justificacion`: Motivo del permiso
- `Estado`: 'Pendiente', 'Aprobado', 'Rechazado'
- `DocumentoSoporte`: URL del documento (opcional)

---

## 7. INTERRELACIONES Y PRIORIDADES

### 7.1 Orden de Prioridad

1. **Permiso Aprobado** (máxima prioridad):
   - Si hay permiso aprobado → NO se registra asistencia
   - Se muestra como "En Permiso" o "En Vacaciones"

2. **Asistencia Presente**:
   - Si no hay permiso y hay asistencia → Estado "Presente"
   - Se calcula tardía si corresponde

3. **Ausencia**:
   - Si no hay permiso y no hay asistencia → Estado "Ausente"
   - Puede estar justificada por justificación aprobada

### 7.2 Cálculo en Reportes

**Ubicación**: Reporte de Planilla (líneas 5868-5895)

**Lógica para cada asistencia**:

```javascript
const tienePermiso = tienePermisoEnFecha(empleadoId, fecha)
const tipoPermiso = obtenerTipoPermisoEnFecha(empleadoId, fecha)
const esVacaciones = tienePermiso && tipoPermiso === 'Vacaciones'
const esPermiso = tienePermiso && tipoPermiso !== 'Vacaciones'

return {
  present: asistencia.Estado === 'Presente' && !tienePermiso,
  vacations: esVacaciones ? 1 : 0,
  permits: esPermiso ? 1 : 0,
  absences: asistencia.Estado === 'Ausente' && !tienePermiso ? 1 : 0,
  tardiness: minutosTardia
}
```

### 7.3 Resumen de Estados en Panel de Supervisión

**Ubicación**: Panel de Supervisión (líneas 1492-1530)

**Estados posibles**:
- **"Activo"** (verde): Tiene asistencia con `Estado = 'Presente'` y `HoraEntrada`
- **"En Pausa"** (azul): Tiene asistencia activa Y tiene pausa activa
- **"En Permiso"** (amarillo): Tiene permiso aprobado para hoy
- **"En Vacaciones"** (amarillo): Tiene permiso de tipo 'Vacaciones' aprobado
- **"Ausente"** (rojo): No tiene asistencia o tiene `Estado = 'Ausente'`

---

## 8. FUNCIONES CLAVE

### 8.1 Funciones de Cálculo

- `obtenerHoraEntradaEsperada(horarioLaboral, fecha)`: Calcula hora esperada según horario
- `recalcularTardia(asistencia, empleado)`: Recalcula tardía basándose en horario actual
- `getCostaRicaTime()`: Obtiene hora actual en zona horaria de Costa Rica (GMT-6)
- `getCostaRicaDateString()`: Obtiene fecha actual en formato YYYY-MM-DD (Costa Rica)

### 8.2 Funciones de Verificación

- `tienePermisoAprobado(empleadoId, fecha)`: Verifica si tiene permiso aprobado
- `tienePermisoEnFecha(empleadoId, fecha)`: Verifica si fecha está en rango de permisos
- `obtenerTipoPermisoEnFecha(empleadoId, fecha)`: Obtiene tipo de permiso para una fecha

---

## 9. FLUJOS COMPLETOS

### 9.1 Flujo: Empleado Inicia Sesión

1. Usuario inicia sesión
2. Se ejecuta `registrarAsistenciaInicioSesion()`
3. Verifica si tiene permiso aprobado → Si sí, termina
4. Busca asistencia existente → Si existe con hora, termina
5. Calcula tardía según horario
6. Crea/actualiza asistencia con hora de entrada y tardía

### 9.2 Flujo: Supervisor Ve Panel de Supervisión

1. Carga empleados activos
2. Carga asistencias del día
3. Carga permisos aprobados
4. Carga pausas activas
5. Para cada empleado:
   - Si tiene permiso → "En Permiso/Vacaciones"
   - Si tiene asistencia presente → "Activo"
   - Si tiene pausa activa → "En Pausa" (con tiempo restante)
   - Si no → "Ausente"

### 9.3 Flujo: Generación de Reporte de Planilla

1. Carga asistencias del rango de fechas
2. Carga permisos aprobados
3. Para cada asistencia:
   - Verifica si tiene permiso
   - Recalcula tardía según horario actual
   - Determina si es presente, ausente, vacaciones o permiso
   - Cuenta tardías en minutos

---

## 10. CONSIDERACIONES IMPORTANTES

### 10.1 Zona Horaria

- **Todas las operaciones usan GMT-6 (Costa Rica)**
- Las horas se convierten usando `toLocaleString('en-US', { timeZone: 'Etc/GMT+6' })`
- Las fechas se obtienen con `getCostaRicaDateString()`

### 10.2 Validaciones

- No se registra asistencia si hay permiso aprobado
- No se calcula tardía si no hay horario laboral configurado
- Las pausas requieren asistencia activa
- Las justificaciones requieren aprobación del supervisor

### 10.3 Actualizaciones Automáticas

- Las tardías se recalculan automáticamente en reportes
- Si cambia el horario del empleado, se recalcula la tardía histórica
- Las pausas muestran tiempo restante en tiempo real

---

## 11. TABLAS DE BASE DE DATOS INVOLUCRADAS

1. **Asistencias**: Registro diario de asistencia
2. **Pausas**: Registro de pausas durante la jornada
3. **Justificaciones**: Justificaciones de ausencias/tardías
4. **Permisos**: Solicitudes de permisos/vacaciones
5. **Empleados**: Información del empleado (incluye HorarioLaboral)
6. **TiposPausas**: Catálogo de tipos de pausa
7. **TiposJustificaciones**: Catálogo de tipos de justificación
8. **TiposPermisos**: Catálogo de tipos de permiso

---

## 12. PUNTOS DE MEJORA IDENTIFICADOS

1. **Justificaciones de Incapacidad**: Actualmente no se usan en reportes (línea 5891: `sick: 0`)
2. **Cierre de Pausas**: No hay función visible para cerrar pausas activas
3. **Hora de Salida**: No se registra automáticamente al cerrar sesión
4. **Validación de Justificaciones**: No se valida automáticamente si una justificación cubre una ausencia


