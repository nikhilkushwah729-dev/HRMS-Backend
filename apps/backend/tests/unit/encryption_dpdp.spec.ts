import { test } from '@japa/runner'
import EncryptionService from '#services/EncryptionService'

test.group('Encryption & DPDP Act Spec', () => {
  test('encrypts and decrypts sensitive PII string fields seamlessly', async ({ assert }) => {
    const rawPan = 'ABCDE1234F'
    const encrypted = EncryptionService.encryptText(rawPan)

    assert.notEqual(encrypted, rawPan)
    assert.isNotNull(encrypted)

    const decrypted = EncryptionService.decryptText(encrypted)
    assert.equal(decrypted, rawPan)
  })

  test('encrypts and decrypts face embedding array floats', async ({ assert }) => {
    const rawEmbedding = [0.123, -0.456, 0.789, 0.012]
    const encrypted = EncryptionService.encryptJson(rawEmbedding)

    assert.notEqual(encrypted, JSON.stringify(rawEmbedding))

    const decrypted = EncryptionService.decryptJson<number[]>(encrypted)
    assert.deepEqual(decrypted, rawEmbedding)
  })

  test('fallbacks gracefully to unencrypted legacy plain text', async ({ assert }) => {
    const legacyPlain = 'OLD_LEGACY_BANK_ACC'
    const result = EncryptionService.decryptText(legacyPlain)
    assert.equal(result, legacyPlain)
  })
})
