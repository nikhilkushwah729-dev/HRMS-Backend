import GeoService from './app/services/GeoService.js'

async function test() {
  const geo = new GeoService()
  
  const ips = [
    '8.8.8.8', // USA
    '1.1.1.1', // Australia?
    '103.21.164.0', // India?
  ]

  for (const ip of ips) {
    console.log(`Testing IP: ${ip}`)
    const country = await geo.getCountryFromIp(ip)
    console.log(`Result: ${JSON.stringify(country)}`)
  }
}

test()
