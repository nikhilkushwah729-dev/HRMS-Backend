import axios from 'axios'
import env from '#start/env'
import { createHash, randomUUID } from 'node:crypto'
import fs from 'node:fs/promises'
import path from 'node:path'

type UploadResult = {
  url: string
  publicId?: string
  provider: 'cloudinary' | 'local'
}

type FileUploadInput = {
  buffer: Buffer
  filename: string
  mimeType: string
}

export default class MediaUploadService {
  private readonly cloudinaryUrl = env.get('CLOUDINARY_URL') || ''
  private readonly cloudName = env.get('CLOUDINARY_CLOUD_NAME') || ''
  private readonly apiKey = env.get('CLOUDINARY_API_KEY') || ''
  private readonly apiSecret = env.get('CLOUDINARY_API_SECRET') || ''

  private resolveCloudinaryConfig(): { cloudName: string; apiKey: string; apiSecret: string } {
    if (this.cloudinaryUrl) {
      try {
        const parsed = new URL(this.cloudinaryUrl)
        const resolvedCloudName = parsed.hostname || this.cloudName
        const resolvedApiKey = decodeURIComponent(parsed.username || this.apiKey)
        const resolvedApiSecret = decodeURIComponent(parsed.password || this.apiSecret)

        if (resolvedCloudName && resolvedApiKey && resolvedApiSecret) {
          return {
            cloudName: resolvedCloudName,
            apiKey: resolvedApiKey,
            apiSecret: resolvedApiSecret,
          }
        }
      } catch (error) {
        console.error('Invalid CLOUDINARY_URL value', error)
      }
    }

    return {
      cloudName: this.cloudName,
      apiKey: this.apiKey,
      apiSecret: this.apiSecret,
    }
  }

  private hasCloudinaryConfig(): boolean {
    const config = this.resolveCloudinaryConfig()
    return Boolean(config.cloudName && config.apiKey && config.apiSecret)
  }

  private isDataImage(value: string): boolean {
    return /^data:image\/[a-zA-Z0-9.+-]+;base64,/.test(value)
  }

  private isGenericDataUrl(value: string): boolean {
    return /^data:[a-zA-Z0-9!#$&^_.+-]+\/[a-zA-Z0-9!#$&^_.+-]+;base64,/.test(value)
  }

  private getMimeType(value: string): string {
    const match = value.match(/^data:([a-zA-Z0-9!#$&^_.+-]+\/[a-zA-Z0-9!#$&^_.+-]+);base64,/)
    return (match?.[1] || 'image/png').toLowerCase()
  }

  private getFileExtension(mimeType: string): string {
    const normalized = mimeType.toLowerCase()

    if (normalized === 'image/jpeg' || normalized === 'jpeg' || normalized === 'jpg') {
      return 'jpg'
    }

    if (normalized === 'image/svg+xml' || normalized === 'svg+xml' || normalized === 'svg') {
      return 'svg'
    }

    if (normalized === 'image/webp' || normalized === 'webp') {
      return 'webp'
    }

    if (normalized === 'image/gif' || normalized === 'gif') {
      return 'gif'
    }

    if (normalized === 'application/pdf') {
      return 'pdf'
    }

    if (normalized === 'application/msword') {
      return 'doc'
    }

    if (normalized === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
      return 'docx'
    }

    if (normalized === 'application/vnd.ms-excel') {
      return 'xls'
    }

    if (normalized === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet') {
      return 'xlsx'
    }

    if (normalized === 'text/plain') {
      return 'txt'
    }

    const extension = normalized.split('/').pop()?.replace(/[^a-z0-9.+-]/gi, '') || 'bin'
    return extension
  }

  private sanitizeFolder(folder: string): string {
    return String(folder || '')
      .replace(/[^a-zA-Z0-9/_-]/g, '')
      .replace(/\/+/g, '/')
      .replace(/^\/+|\/+$/g, '')
  }

  private buildSignature(params: Record<string, string>, apiSecret: string): string {
    const stringToSign = Object.entries(params)
      .filter(([, value]) => value !== undefined && value !== null && String(value).trim() !== '')
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, value]) => `${key}=${value}`)
      .join('&')

    return createHash('sha1').update(`${stringToSign}${apiSecret}`).digest('hex')
  }

  private async uploadToCloudinary(dataUrl: string, folder: string): Promise<UploadResult> {
    const cloudinary = this.resolveCloudinaryConfig()
    const timestamp = Math.floor(Date.now() / 1000).toString()
    const safeFolder = this.sanitizeFolder(folder)
    const params = {
      folder: safeFolder,
      timestamp,
    }

    const signature = this.buildSignature(params, cloudinary.apiSecret)
    const payload = new URLSearchParams()

    payload.set('file', dataUrl)
    payload.set('api_key', cloudinary.apiKey)
    payload.set('timestamp', timestamp)
    payload.set('folder', safeFolder)
    payload.set('signature', signature)

    const response = await axios.post(
      `https://api.cloudinary.com/v1_1/${cloudinary.cloudName}/image/upload`,
      payload.toString(),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      }
    )

    const secureUrl = response.data?.secure_url || response.data?.url
    if (!secureUrl) {
      throw new Error('Cloudinary did not return an image URL')
    }

    return {
      url: secureUrl,
      publicId: response.data?.public_id,
      provider: 'cloudinary',
    }
  }

  async uploadFile(input: FileUploadInput, folder: string): Promise<UploadResult> {
    const cloudinary = this.resolveCloudinaryConfig()
    if (!cloudinary.cloudName || !cloudinary.apiKey || !cloudinary.apiSecret) {
      throw new Error('Cloudinary is not configured')
    }

    const timestamp = Math.floor(Date.now() / 1000).toString()
    const safeFolder = this.sanitizeFolder(folder)
    const resourceType = 'auto'
    const params = {
      folder: safeFolder,
      resource_type: resourceType,
      timestamp,
    }

    const signature = this.buildSignature(params, cloudinary.apiSecret)
    const formData = new FormData()
    formData.append('file', new Blob([new Uint8Array(input.buffer)], { type: input.mimeType || 'application/octet-stream' }), input.filename)
    formData.append('api_key', cloudinary.apiKey)
    formData.append('timestamp', timestamp)
    formData.append('folder', safeFolder)
    formData.append('resource_type', resourceType)
    formData.append('signature', signature)

    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${cloudinary.cloudName}/${resourceType}/upload`,
      {
        method: 'POST',
        body: formData,
      }
    )

    const payload = (await response.json().catch(() => null)) as any
    if (!response.ok) {
      throw new Error(payload?.error?.message || 'Cloudinary file upload failed')
    }

    const secureUrl = payload?.secure_url || payload?.url
    if (!secureUrl) {
      throw new Error('Cloudinary did not return a file URL')
    }

    return {
      url: secureUrl,
      publicId: payload?.public_id,
      provider: 'cloudinary',
    }
  }

  private async saveLocally(dataUrl: string, folder: string): Promise<UploadResult> {
    const mimeType = this.getMimeType(dataUrl)
    const extension = this.getFileExtension(mimeType)
    const base64Data = dataUrl.replace(/^data:[a-zA-Z0-9!#$&^_.+-]+\/[a-zA-Z0-9!#$&^_.+-]+;base64,/, '')
    const buffer = Buffer.from(base64Data, 'base64')
    const safeFolder = this.sanitizeFolder(folder)
    const fileName = `${randomUUID()}.${extension}`
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads', safeFolder)

    await fs.mkdir(uploadsDir, { recursive: true })
    await fs.writeFile(path.join(uploadsDir, fileName), buffer)

    return {
      url: `/uploads/${safeFolder}/${fileName}`,
      publicId: fileName,
      provider: 'local',
    }
  }

  async storeImage(value: string | null | undefined, folder: string): Promise<string | undefined> {
    if (!value || typeof value !== 'string') {
      return undefined
    }

    const trimmed = value.trim()
    if (!trimmed) {
      return undefined
    }

    if (!this.isGenericDataUrl(trimmed)) {
      return trimmed
    }

    try {
      const result = this.isDataImage(trimmed) && this.hasCloudinaryConfig()
        ? await this.uploadToCloudinary(trimmed, folder)
        : await this.saveLocally(trimmed, folder)

      return result.url
    } catch (error) {
      console.error(`Failed to store image for ${folder}`, error)
      return undefined
    }
  }
}
