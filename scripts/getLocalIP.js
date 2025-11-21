import { networkInterfaces } from 'os'

function getLocalIP() {
  const interfaces = networkInterfaces()
  const addresses = []

  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      // Ignorar direcciones internas (no IPv4) y no loopback
      if (iface.family === 'IPv4' && !iface.internal) {
        addresses.push({
          interface: name,
          address: iface.address
        })
      }
    }
  }

  return addresses
}

const ips = getLocalIP()

if (ips.length === 0) {
  console.log('❌ No se encontró ninguna dirección IP local')
  console.log('\n💡 Asegúrate de estar conectado a una red')
} else {
  console.log('\n🌐 Direcciones IP locales disponibles:\n')
  ips.forEach(({ interface: ifaceName, address }) => {
    console.log(`   ${ifaceName}: http://${address}:5173`)
  })
  console.log('\n📱 Accede desde otros dispositivos en la red local usando una de estas direcciones')
  console.log('⚠️  Asegúrate de que el firewall permita conexiones en el puerto 5173\n')
}

