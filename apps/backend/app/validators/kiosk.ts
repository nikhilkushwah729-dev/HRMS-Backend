import vine from '@vinejs/vine'

export const registerKioskValidator = vine.create({
  orgId: vine.number(),
  orgLocationId: vine.number().nullable().optional(),
  name: vine.string().trim().minLength(2).maxLength(150),
  location: vine.string().trim().minLength(2).maxLength(255),
  deviceId: vine.string().trim().minLength(8).maxLength(191),
})

export const validateKioskValidator = vine.create({
  deviceId: vine.string().trim().minLength(8).maxLength(191),
  deviceToken: vine.string().trim().minLength(16).maxLength(191),
})

export const faceAttendanceValidator = vine.create({
  embedding: vine.array(vine.number()).minLength(16),
  imageUrl: vine.string().trim().url().optional(),
  type: vine.enum(['check_in', 'check_out']).optional(),
  clientReference: vine.string().trim().maxLength(191).optional(),
  liveness: vine.object({
    confirmed: vine.boolean().optional(),
    blinkDetected: vine.boolean().optional(),
    headMovementDetected: vine.boolean().optional(),
  }).optional(),
})

export const pinAttendanceValidator = vine.create({
  employeeCode: vine.string().trim().minLength(2).maxLength(64),
  pin: vine.string().trim().minLength(4).maxLength(12),
  type: vine.enum(['check_in', 'check_out']).optional(),
  clientReference: vine.string().trim().maxLength(191).optional(),
})

export const qrAttendanceValidator = vine.create({
  qrToken: vine.string().trim().minLength(16).maxLength(600),
  type: vine.enum(['check_in', 'check_out']).optional(),
  clientReference: vine.string().trim().maxLength(191).optional(),
})

export const kioskApprovalValidator = vine.create({
  orgLocationId: vine.number().nullable().optional(),
})

export const faceProfileValidator = vine.create({
  embedding: vine.array(vine.number()).minLength(16),
  referenceImageUrl: vine.string().trim().url().optional(),
})

export const offlineSyncValidator = vine.create({
  records: vine.array(
    vine.object({
      method: vine.enum(['face', 'pin', 'qr']),
      type: vine.enum(['check_in', 'check_out']).optional(),
      employeeCode: vine.string().trim().maxLength(64).optional(),
      pin: vine.string().trim().maxLength(12).optional(),
      qrToken: vine.string().trim().maxLength(600).optional(),
      embedding: vine.array(vine.number()).optional(),
      imageUrl: vine.string().trim().url().optional(),
      clientReference: vine.string().trim().maxLength(191),
      liveness: vine.object({
        confirmed: vine.boolean().optional(),
        blinkDetected: vine.boolean().optional(),
        headMovementDetected: vine.boolean().optional(),
      }).optional(),
    })
  ).minLength(1),
})
