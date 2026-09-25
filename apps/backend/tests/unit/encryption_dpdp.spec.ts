import { test } from '@japa/runner'
import EncryptionService from '#services/EncryptionService'

test.group('Encryption & DPDP Act Spec', () => {
  test('encrypts targeted PII string fields (PAN, Aadhaar, Bank Account) with enc:v1: prefix', async ({ assert }) => {
    const rawPan = 'ABCDE1234F'
    const rawAadhaar = '123456789012'
    const rawBankAccount = '987654321098'

    const encPan = EncryptionService.encryptText(rawPan)
    const encAadhaar = EncryptionService.encryptText(rawAadhaar)
    const encBank = EncryptionService.encryptText(rawBankAccount)

    assert.isTrue(encPan?.startsWith('enc:v1:'))
    assert.isTrue(encAadhaar?.startsWith('enc:v1:'))
    assert.isTrue(encBank?.startsWith('enc:v1:'))

    assert.equal(EncryptionService.decryptText(encPan), rawPan)
    assert.equal(EncryptionService.decryptText(encAadhaar), rawAadhaar)
    assert.equal(EncryptionService.decryptText(encBank), rawBankAccount)
  })

  test('encrypts and decrypts face embedding array floats with enc:v1: prefix', async ({ assert }) => {
    const rawEmbedding = [0.123, -0.456, 0.789, 0.012]
    const encrypted = EncryptionService.encryptJson(rawEmbedding)

    assert.isTrue(encrypted?.startsWith('enc:v1:'))
    const decrypted = EncryptionService.decryptJson<number[]>(encrypted)
    assert.deepEqual(decrypted, rawEmbedding)
  })

  test('passes through unencrypted legacy plain text without error', async ({ assert }) => {
    const legacyBankAcc = 'OLD_LEGACY_BANK_ACC_123'
    const result = EncryptionService.decryptText(legacyBankAcc)
    assert.equal(result, legacyBankAcc)
  })

  test('throws SecurityException loudly when encountering corrupted ciphertext with enc:v1: prefix', async ({ assert }) => {
    const corruptedCiphertext = 'enc:v1:TAMPERED_INVALID_PAYLOAD_STRING'

    assert.throws(() => {
      EncryptionService.decryptText(corruptedCiphertext)
    }, /Corrupted or tampered ciphertext data/)
  })
})
