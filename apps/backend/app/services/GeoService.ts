import fs from 'node:fs/promises'
import path from 'node:path'
import app from '@adonisjs/core/services/app'

interface GeoJSONFeature {
  type: string
  properties: {
    NAME: string
    ISO_A2: string
    [key: string]: any
  }
  geometry: {
    type: 'Polygon' | 'MultiPolygon'
    coordinates: any[]
  }
}

interface GeoJSON {
  type: string
  features: GeoJSONFeature[]
}

export default class GeoService {
  private geoData: GeoJSON | null = null

  private async loadGeoData() {
    if (this.geoData) return this.geoData

    try {
      const filePath = path.join(app.makePath('resources'), 'geo_countries.json')
      const content = await fs.readFile(filePath, 'utf-8')
      this.geoData = JSON.parse(content)
      return this.geoData
    } catch (error) {
      console.error('Failed to load GeoJSON data:', error)
      return null
    }
  }

  /**
   * Resolve country code and name from latitude and longitude
   */
  async getCountryFromCoords(lat: number, lng: number): Promise<{ code: string; name: string } | null> {
    const data = await this.loadGeoData()
    if (!data) return null

    for (const feature of data.features) {
      if (this.isPointInFeature([lng, lat], feature)) {
        return {
          code: feature.properties.ISO_A2,
          name: feature.properties.NAME
        }
      }
    }

    return null
  }

  private isPointInFeature(point: [number, number], feature: GeoJSONFeature): boolean {
    const { type, coordinates } = feature.geometry

    if (type === 'Polygon') {
      return this.isPointInPolygon(point, coordinates)
    } else if (type === 'MultiPolygon') {
      return coordinates.some((polygon: any) => this.isPointInPolygon(point, polygon))
    }

    return false
  }

  private isPointInPolygon(point: [number, number], rings: number[][][]): boolean {
    const [lng, lat] = point
    let inside = false

    // We only check the outer ring (index 0) for performance and common use case
    // Real GeoJSON usually has outer ring as first element
    const ring = rings[0]
    for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
      const xi = ring[i][0]
      const yi = ring[i][1]
      const xj = ring[j][0]
      const yj = ring[j][1]

      const intersect = ((yi > lat) !== (yj > lat)) &&
        (lng < (xj - xi) * (lat - yi) / (yj - yi) + xi)
      if (intersect) inside = !inside
    }

    return inside
  }

  /**
   * Get full location info from IP address
   */
  async getLocationFromIp(ip: string): Promise<{
    countryCode: string
    countryName: string
    regionName: string
    cityName: string
    lat: number
    lng: number
  } | null> {
    if (!ip || ip === '127.0.0.1' || ip === '::1' || ip.startsWith('192.168.')) {
      return null
    }

    try {
      const response = await fetch(`http://ip-api.com/json/${ip}`)
      const data = await response.json() as any

      if (data.status === 'success') {
        return {
          countryCode: data.countryCode,
          countryName: data.country,
          regionName: data.regionName,
          cityName: data.city,
          lat: data.lat,
          lng: data.lon
        }
      }
    } catch (error) {
      console.error('IP Geolocation API failed:', error)
    }

    return null
  }

  /**
   * Full resolution: IP -> Coords -> Country (via GeoJSON)
   * This is a fallback that uses GeoJSON for country resolution if needed
   */
  async getCountryFromIp(ip: string): Promise<{ code: string; name: string } | null> {
    const info = await this.getLocationFromIp(ip)
    if (!info) return null

    // We can directly use the API response, but if we want to cross-verify with GeoJSON:
    // return this.getCountryFromCoords(info.lat, info.lng)
    
    return {
      code: info.countryCode,
      name: info.countryName
    }
  }
}
