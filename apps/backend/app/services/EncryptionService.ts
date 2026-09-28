import encryption from '@adonisjs/core/services/encryption'
import { Exception } from '@adonisjs/core/exceptions'

export default class EncryptionService {
  private static PREFIX = 'enc:v1:'

  /**
   * Encrypt plain text using AdonisJS core encryption (AES-256) with versioned prefix.
   */
  static encryptText(value: string | number | null | undefined): string | null {
    if (value === null || value === undefined || value === '') return null
    const strVal = String(value)
    if (strVal.startsWith(this.PREFIX)) return strVal
    const cipher = encryption.encrypt(strVal)
    return `${this.PREFIX}${cipher}`
  }

  /**
   * Decrypt cipher text with versioned prefix checking.
   * Legacy plaintext (without enc:v1:) is returned as-is.
   * Corrupted ciphertext starting with enc:v1: throws SecurityException loudly.
   */
  static decryptText(value: string | number | null | undefined): string | null {
    if (value === null || value === undefined || value === '') return null

    const strVal = String(value)

    // Legacy plaintext: return as-is
    if (!strVal.startsWith(this.PREFIX)) {
      return strVal
    }

    // Versioned ciphertext: decrypt payload
    const rawCipher = strVal.slice(this.PREFIX.length)
    try {
      const decrypted = encryption.decrypt<string>(rawCipher)
      if (decrypted === null) {
        throw new Exception('Corrupted or tampered ciphertext data', { status: 500, code: 'E_CORRUPTED_CIPHERTEXT' })
      }
      return decrypted
    } catch (err: any) {
      if (err instanceof Exception && err.code === 'E_CORRUPTED_CIPHERTEXT') {
        throw err
      }
      throw new Exception('Corrupted or tampered ciphertext data', { status: 500, code: 'E_CORRUPTED_CIPHERTEXT' })
    }
  }

  /**
   * Encrypt complex JS object/array with versioned prefix.
   */
  static encryptJson(data: any): string | null {
    if (data === null || data === undefined) return null
    const jsonStr = typeof data === 'string' ? data : JSON.stringify(data)
    if (jsonStr.startsWith(this.PREFIX)) return jsonStr
    const cipher = encryption.encrypt(jsonStr)
    return `${this.PREFIX}${cipher}`
  }

  /**
   * Decrypt versioned JSON cipher text.
   * Legacy JSON (without enc:v1:) is parsed directly.
   * Corrupted ciphertext starting with enc:v1: throws SecurityException loudly.
   */
  static decryptJson<T = any>(value: any): T | null {
    if (value === null || value === undefined) return null
    if (typeof value === 'object' && !Array.isArray(value)) {
      return value as T
    }

    const strValue = String(value)

    // Legacy JSON string: parse directly
    if (!strValue.startsWith(this.PREFIX)) {
      try {
        return JSON.parse(strValue) as T
      } catch {
        return strValue as unknown as T
      }
    }

    // Versioned JSON cipher: decrypt and parse
    const rawCipher = strValue.slice(this.PREFIX.length)
    let decrypted: string | null = null

    try {
      decrypted = encryption.decrypt<string>(rawCipher)
    } catch {
      throw new Exception('Corrupted or tampered ciphertext data', { status: 500, code: 'E_CORRUPTED_CIPHERTEXT' })
    }

    if (decrypted === null) {
      throw new Exception('Corrupted or tampered ciphertext data', { status: 500, code: 'E_CORRUPTED_CIPHERTEXT' })
    }

    try {
      return JSON.parse(decrypted) as T
    } catch {
      throw new Exception('Corrupted JSON payload in ciphertext', { status: 500, code: 'E_CORRUPTED_CIPHERTEXT' })
    }
  }
}
