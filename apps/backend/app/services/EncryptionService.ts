import encryption from '@adonisjs/core/services/encryption'

export default class EncryptionService {
  /**
   * Encrypt plain text using AdonisJS core encryption (AES-256).
   */
  static encryptText(value: string | number | null | undefined): string | null {
    if (value === null || value === undefined || value === '') return null
    return encryption.encrypt(String(value))
  }

  /**
   * Decrypt cipher text. Fallbacks gracefully to plain text if value was stored prior to encryption.
   */
  static decryptText(value: string | null | undefined): string | null {
    if (!value) return null
    try {
      const decrypted = encryption.decrypt<string>(value)
      return decrypted !== null ? decrypted : value
    } catch {
      return value
    }
  }

  /**
   * Encrypt complex JS object/array (e.g. face profile descriptor floats).
   */
  static encryptJson(data: any): string | null {
    if (data === null || data === undefined) return null
    return encryption.encrypt(JSON.stringify(data))
  }

  /**
   * Decrypt JSON cipher text.
   */
  static decryptJson<T = any>(value: any): T | null {
    if (!value) return null
    if (typeof value === 'object' && !Array.isArray(value)) {
      return value as T
    }
    try {
      const decrypted = encryption.decrypt<string>(value)
      if (decrypted) {
        return JSON.parse(decrypted) as T
      }
      return typeof value === 'string' ? JSON.parse(value) as T : value
    } catch {
      try {
        return typeof value === 'string' ? JSON.parse(value) as T : value
      } catch {
        return null
      }
    }
  }
}
