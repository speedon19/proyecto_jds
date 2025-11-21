import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Credenciales de Supabase
const SUPABASE_URL = 'https://fenrtrgxqvgwwgmauwhx.supabase.co'
const SUPABASE_SERVICE_ROLE = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZlbnJ0cmd4cXZnd3dnbWF1d2h4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MzUwMDIyNCwiZXhwIjoyMDc5MDc2MjI0fQ.AQ4uy8vaa0VqqL9TsLonGmPQiyot8LxfX7-hpsxMcWw'

// Crear cliente de Supabase con service role key para tener permisos completos
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE)

async function uploadLogo() {
  try {
    // Ruta del archivo logo.jpg
    const logoPath = join(__dirname, '..', 'Imagenes', 'logo.jpg')
    
    console.log('Leyendo archivo:', logoPath)
    
    // Leer el archivo como buffer
    const fileBuffer = readFileSync(logoPath)
    const fileName = 'logo.jpg'
    const filePath = `logos/${fileName}`
    
    console.log('Subiendo archivo al storage de Supabase...')
    console.log('Bucket: documentos')
    console.log('Ruta:', filePath)
    
    // Subir el archivo al storage
    const { data, error } = await supabase.storage
      .from('documentos')
      .upload(filePath, fileBuffer, {
        cacheControl: '3600',
        upsert: true, // Si ya existe, lo reemplaza
        contentType: 'image/jpeg'
      })
    
    if (error) {
      console.error('Error al subir el archivo:', error)
      throw error
    }
    
    console.log('✓ Archivo subido exitosamente:', data.path)
    
    // Obtener la URL pública
    const { data: { publicUrl } } = supabase.storage
      .from('documentos')
      .getPublicUrl(filePath)
    
    console.log('✓ URL pública del logo:', publicUrl)
    console.log('\n✓ Logo almacenado exitosamente en Supabase Storage')
    
    return publicUrl
  } catch (error) {
    console.error('Error:', error.message)
    if (error.message?.includes('Bucket not found')) {
      console.error('\n⚠ El bucket "documentos" no existe en Supabase Storage.')
      console.error('Por favor, crea el bucket "documentos" en la sección Storage de tu proyecto Supabase.')
    }
    process.exit(1)
  }
}

uploadLogo()


