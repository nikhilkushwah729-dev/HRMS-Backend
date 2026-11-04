import { test } from '@japa/runner'
import { setupTestTenants } from '#tests/helpers/tenant_harness'
import AiAssistantController from '#controllers/Http/AiAssistantController'

test.group('AI Assistant Query Spec', () => {
  test('responds accurately to Hindi, Hinglish and English prompts for employee', async ({ assert }) => {
    const harness = await setupTestTenants()
    const emp = harness.tenantA.employee
    const controller = new AiAssistantController()

    const makeFakeContext = (prompt: string) => {
      let resultData: any = null
      return {
        ctx: {
          auth: { user: emp },
          request: {
            validateUsing: async () => ({ prompt }),
          },
          response: {
            ok: (payload: any) => {
              resultData = payload
              return payload
            },
            badRequest: (payload: any) => {
              resultData = payload
              return payload
            },
          },
        } as any,
        getResult: () => resultData,
      }
    }

    // 1. Attendance inquiry in Hinglish
    const c1 = makeFakeContext('aaj ki attendance status kya hai?')
    await controller.chatQuery(c1.ctx)
    assert.equal(c1.getResult().status, 'success')
    assert.include(c1.getResult().data.reply, 'attendance')

    // 2. Leave inquiry in Hindi / Hinglish
    const c2 = makeFakeContext('meri chutti kitni bachi hai?')
    await controller.chatQuery(c2.ctx)
    assert.equal(c2.getResult().status, 'success')
    assert.include(c2.getResult().data.reply, 'Leave')

    // 3. Kiosk inquiry
    const c3 = makeFakeContext('kiosk par punch kaise karein')
    await controller.chatQuery(c3.ctx)
    assert.equal(c3.getResult().status, 'success')
    assert.include(c3.getResult().data.reply, 'Kiosk')

    // 4. Face registration inquiry
    const c4 = makeFakeContext('face register kaise karein')
    await controller.chatQuery(c4.ctx)
    assert.equal(c4.getResult().status, 'success')
    assert.include(c4.getResult().data.reply, 'Face')

    // 5. Holiday inquiry
    const c5 = makeFakeContext('next holiday kab hai')
    await controller.chatQuery(c5.ctx)
    assert.equal(c5.getResult().status, 'success')
    assert.include(c5.getResult().data.reply, 'holiday')
  })
})
