import { createClient } from '@supabase/supabase-js'

// Credenciales de Supabase
const SUPABASE_URL = 'https://fenrtrgxqvgwwgmauwhx.supabase.co'
const SUPABASE_SERVICE_ROLE = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZlbnJ0cmd4cXZnd3dnbWF1d2h4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MzUwMDIyNCwiZXhwIjoyMDc5MDc2MjI0fQ.AQ4uy8vaa0VqqL9TsLonGmPQiyot8LxfX7-hpsxMcWw'

// Crear cliente de Supabase con service role key
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE)

// Función auxiliar para obtener la ruta completa de una carpeta
function obtenerRutaCarpeta(carpetaId, carpetas, carpetaMap = {}) {
  if (carpetaMap[carpetaId]) {
    return carpetaMap[carpetaId]
  }
  
  const carpeta = carpetas.find(c => c.Id === carpetaId)
  if (!carpeta) return ''
  
  const nombreLimpio = carpeta.Nombre.replace(/[^a-zA-Z0-9]/g, '_')
  
  if (carpeta.CarpetaPadreId) {
    const rutaPadre = obtenerRutaCarpeta(carpeta.CarpetaPadreId, carpetas, carpetaMap)
    const ruta = rutaPadre ? `${rutaPadre}/${nombreLimpio}` : nombreLimpio
    carpetaMap[carpetaId] = ruta
    return ruta
  }
  
  carpetaMap[carpetaId] = nombreLimpio
  return nombreLimpio
}

async function createFoldersInStorage() {
  try {
    console.log('Obteniendo carpetas de la base de datos...')
    
    // Obtener todas las carpetas
    const { data: carpetas, error: fetchError } = await supabase
      .from('Carpetas')
      .select('*')
      .order('Nombre')

    if (fetchError) {
      console.error('Error al obtener carpetas:', fetchError)
      throw fetchError
    }

    if (!carpetas || carpetas.length === 0) {
      console.log('No hay carpetas en la base de datos.')
      return
    }

    console.log(`Encontradas ${carpetas.length} carpetas en la base de datos.`)
    console.log('Creando carpetas en el storage...\n')

    const bucketName = 'documentos'
    let creadas = 0
    let errores = 0

    for (const carpeta of carpetas) {
      try {
        const nombreLimpio = carpeta.Nombre.replace(/[^a-zA-Z0-9]/g, '_')
        const carpetaPath = obtenerRutaCarpeta(carpeta.Id, carpetas)
        const placeholderPath = `${carpetaPath}/.keep`
        
        // Crear archivo placeholder para que la carpeta aparezca en el storage
        const placeholderContent = new Blob([''], { type: 'text/plain' })
        
        const { error: storageError } = await supabase.storage
          .from(bucketName)
          .upload(placeholderPath, placeholderContent, {
            cacheControl: '3600',
            upsert: true
          })

        if (storageError) {
          // Si el error es que el archivo ya existe, no es un problema
          if (storageError.message?.includes('already exists') || 
              storageError.message?.includes('duplicate')) {
            console.log(`✓ Carpeta "${carpeta.Nombre}" ya existe en storage: ${carpetaPath}`)
            creadas++
          } else {
            console.error(`✗ Error al crear carpeta "${carpeta.Nombre}":`, storageError.message)
            errores++
          }
        } else {
          console.log(`✓ Carpeta creada: "${carpeta.Nombre}" -> ${carpetaPath}`)
          creadas++
        }
      } catch (err) {
        console.error(`✗ Error al procesar carpeta "${carpeta.Nombre}":`, err.message)
        errores++
      }
    }

    console.log(`\n✓ Proceso completado:`)
    console.log(`  - Carpetas creadas/verificadas: ${creadas}`)
    console.log(`  - Errores: ${errores}`)
    
  } catch (error) {
    console.error('Error general:', error.message)
    process.exit(1)
  }
}

createFoldersInStorage()



