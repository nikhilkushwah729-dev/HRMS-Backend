import axios from 'axios'
import env from '#start/env'
import { Exception } from '@adonisjs/core/exceptions'
import Organization from '#models/organization'
import SubscriptionService from '#services/SubscriptionService'
import Payment from '#models/payment'
import { DateTime } from 'luxon'

type LegacyAddon = {
  name: string
  price: string
  status: string
}

export default class LegacyBillingService {
  private readonly baseUrl = (env.get('LEGACY_BILLING_BASE_URL') || '').replace(/\/+$/, '')
  private readonly appName = env.get('LEGACY_BILLING_APP_NAME') || 'ubiAttendance'
  private readonly basePlanAmount = Number(env.get('LEGACY_BILLING_PLAN_BASE_AMOUNT') || 3000)
  private readonly subscriptionService = new SubscriptionService()
  private readonly addonAliases: Record<string, string[]> = {
    leaveandtimeoff: ['leaveandtimeoff', 'leavetimeoff', 'leave', 'leaves'],
    employeetracking: ['employeetracking', 'employee', 'employees', 'attendance'],
    trackvisits: ['trackvisits', 'visitmanagement', 'visitormanagement', 'visits'],
    geofence: ['geofence', 'geofencing'],
    facerecognition: ['facerecognition', 'face', 'faceid'],
    shiftplanner: ['shiftplanner', 'shift'],
    timesheet: ['timesheet', 'timesheets'],
    payroll: ['payroll', 'salary'],
    manageclients: ['manageclients', 'clients', 'clientmanagement'],
    expense: ['expense', 'expenses'],
  }

  isConfigured() {
    return Boolean(this.baseUrl)
  }

  private ensureConfigured() {
    if (!this.isConfigured()) {
      throw new Exception('Legacy billing gateway is not configured', { status: 400 })
    }
  }

  private async get(url: string, params: Record<string, any> = {}) {
    this.ensureConfigured()
    const response = await axios.get(`${this.baseUrl}${url}`, { params, timeout: 20000 })
    return response.data
  }

  private async postForm(url: string, payload: Record<string, any>) {
    this.ensureConfigured()
    const form = new FormData()
    Object.entries(payload).forEach(([key, value]) => {
      form.append(key, value == null ? '' : String(value))
    })
    const response = await axios.post(`${this.baseUrl}${url}`, form, {
      timeout: 30000,
      headers: form instanceof FormData ? undefined : {},
    })
    return response.data
  }

  private normalizePlanStatus(raw: any) {
    const data = Array.isArray(raw) ? raw[0]?.data ?? raw[0] : raw?.data ?? raw
    return {
      orgid: Number(data?.orgid ?? 0),
      orgName: data?.Org_name ?? '',
      email: data?.Email ?? '',
      phoneNumber: data?.PhoneNumber ?? '',
      countryname: data?.countryname ?? '',
      startDate: data?.start_date ?? null,
      endDate: data?.end_date ?? null,
      noemp: Number(data?.noemp ?? 0),
      userlimit: Number(data?.userlimit ?? 0),
      planStatus: Number(data?.planStatus ?? 0),
      trialItemCount: Number(data?.trialItemCount ?? 0),
      turnOffMyPlan: Boolean(data?.turnOffMyPlan ?? false),
      stateName: data?.stateName ?? '',
      cityName: data?.cityName ?? '',
      gstin: data?.gstin ?? '',
      zip: data?.zip ?? '',
    }
  }

  private normalizeAddonRows(raw: any): LegacyAddon[] {
    if (!Array.isArray(raw)) return []
    return raw.map((item) => ({
      name: String(item?.name ?? ''),
      price: String(item?.price ?? item?.Price ?? '0'),
      status: String(item?.status ?? item?.Status ?? '0'),
    }))
  }

  private normalizeAddonKey(value: string) {
    return String(value || '').trim().toLowerCase().replace(/[^a-z0-9]/g, '')
  }

  private addonKeys(value: string) {
    const normalized = this.normalizeAddonKey(value)
    for (const variants of Object.values(this.addonAliases)) {
      if (variants.includes(normalized)) {
        return variants
      }
    }
    return [normalized]
  }

  private calculateTax(baseAmount: number) {
    return Number((baseAmount * 0.18).toFixed(2))
  }

  private async buildSelectedAddons(selectedAddons: Array<{ name: string; status: boolean }>, externalCatalog: LegacyAddon[]) {
    const catalogMap = new Map(externalCatalog.map((item) => [this.normalizeAddonKey(item.name), item]))
    return selectedAddons.map((item) => {
      const matched = this.addonKeys(item.name)
        .map((key) => catalogMap.get(key))
        .find(Boolean)
      return {
        name: item.name,
        Price: matched?.price ?? '0.00',
        Status: item.status ? '1' : '0',
      }
    })
  }

  async getContext(orgId: number) {
    this.ensureConfigured()
    const existingPlan = this.normalizePlanStatus(await this.get('/existingPlan', { Orgid: orgId, appName: this.appName }))
    const states = await this.get('/stateList')
    const currentOrgSts = existingPlan.planStatus === 0 ? 'TrialOrg' : 'PaidOrg'

    let addonCatalog: LegacyAddon[] = []
    try {
      addonCatalog = this.normalizeAddonRows(
        await this.get('/addonPriceList', {
          Orgid: orgId,
          userCount: 0,
          currentOrgSts: existingPlan.planStatus === 0 ? 'TrialOrg' : 'PaidOrg',
          appName: this.appName,
        })
      )
    } catch {
      addonCatalog = []
    }

    let pricingMatrix: Record<string, string> | null = null
    if (existingPlan.planStatus === 1) {
      try {
        const pricing = await this.get('/pricingList', { Orgid: orgId, appName: this.appName })
        pricingMatrix = pricing?.pricedata ?? null
      } catch {
        pricingMatrix = null
      }
    }

    return {
      configured: true,
      appName: this.appName,
      currentOrgSts,
      existingPlan,
      states,
      addonCatalog,
      pricingMatrix,
      basePlanAmount: this.basePlanAmount,
      suggestedAction: existingPlan.planStatus === 0 ? 'Buy' : 'Upgrade',
    }
  }

  async initiatePurchase(
    orgId: number,
    payload: {
      nouser: number
      selectedAddons: Array<{ name: string; status: boolean }>
      paymentMethod: string
      state: string | number
      country: string
      zip?: string
      city?: string
      name: string
      duration: number
      durationType: string
      gstin?: string
      remark?: string
      action: 'Buy' | 'Upgrade'
    }
  ) {
    const org = await Organization.findOrFail(orgId)
    const context = await this.getContext(orgId)
    const addons = await this.buildSelectedAddons(payload.selectedAddons, context.addonCatalog)
    const selectedTotal = addons
      .filter((item) => item.Status === '1')
      .reduce((sum, item) => sum + Number(item.Price || 0), 0)
    const paymentAmount = Number((this.basePlanAmount + selectedTotal).toFixed(2))
    const tax = this.calculateTax(paymentAmount)

    const response = await this.postForm('/planPurchase', {
      orgid: orgId,
      nouser: payload.nouser,
      addons: JSON.stringify([{ addons }]),
      payment_amount: paymentAmount,
      payment_status: 'Pending',
      leadowner: orgId,
      Company: org.companyName,
      tax,
      remark: payload.remark || 'Auto Mode',
      action: payload.action,
      gstin: payload.gstin || '',
      payment_method: payload.paymentMethod,
      state: payload.state,
      country: payload.country,
      zip: payload.zip || '',
      city: payload.city || '',
      name: payload.name,
      duration: payload.duration,
      durationType: payload.durationType,
      appName: this.appName,
    })

    const normalized = Array.isArray(response) ? response[0] : response
    const payment = await Payment.create({
      orgId,
      planId: org.planId,
      amount: paymentAmount,
      currency: 'INR',
      paymentMethod: payload.paymentMethod,
      paymentGateway: payload.paymentMethod.toLowerCase() === 'razorpay' ? 'razorpay' : 'manual',
      provider: payload.paymentMethod.toLowerCase(),
      providerOrderId: normalized?.Rzr_orderId ?? null,
      transactionId: normalized?.paymentid ? String(normalized.paymentid) : null,
      status: 'pending',
      billingCycle: payload.durationType.toLowerCase().startsWith('year') ? 'yearly' : 'monthly',
      metadata: JSON.stringify({
        action: payload.action,
        selectedAddons: addons,
        nouser: payload.nouser,
        tax,
        legacyPaymentId: normalized?.paymentid ?? null,
      }),
    })

    return {
      paymentRecordId: payment.id,
      legacyPaymentId: normalized?.paymentid ?? null,
      orderId: normalized?.Rzr_orderId ?? null,
      publishableKey: env.get('RAZORPAY_KEY_ID', ''),
      status: Boolean(normalized?.status),
      message: normalized?.msg ?? 'Payment initialized',
      paymentAmount,
      tax,
      addons,
      configured: true,
    }
  }

  async confirmPurchase(
    orgId: number,
    payload: {
      paymentRecordId: number
      orderId: string
      paymentStatus: string
      paymentRzrId: string
      nouser: number
      duration: number
      durationType: string
      action: 'Buy' | 'Upgrade'
    }
  ) {
    const payment = await Payment.findOrFail(payload.paymentRecordId)
    if (payment.orgId !== orgId) {
      throw new Exception('Payment does not belong to this organization', { status: 403 })
    }

    const metadata = typeof payment.metadata === 'string' ? JSON.parse(payment.metadata) : payment.metadata || {}
    const legacyPaymentId = metadata.legacyPaymentId ?? payment.transactionId

    const successResponse = await this.postForm('/successPayment', {
      paymentid: legacyPaymentId,
      orderid: payload.orderId,
      payment_status: payload.paymentStatus,
      orgid: orgId,
      payment_rzr_id: payload.paymentRzrId,
      nouser: payload.nouser,
      duration: payload.duration,
      duration_type: payload.durationType,
      addons: JSON.stringify([{ addons: metadata.selectedAddons ?? [] }]),
      action: payload.action,
      appName: this.appName,
    })

    payment.providerPaymentId = payload.paymentRzrId
    payment.providerSignature = payload.orderId
    payment.status = payload.paymentStatus.toLowerCase() === 'success' ? 'success' : 'failed'
    payment.paidAt = payment.status === 'success' ? DateTime.now() : payment.paidAt
    await payment.save()

    let invoice: any = null
    if (payment.status === 'success') {
      invoice = await this.get('/inVoiceGenerate', { id: payload.paymentRzrId, appName: this.appName })
      await this.subscriptionService.markExternalPurchaseSuccess(orgId, {
        payment,
        duration: payload.duration,
        durationType: payload.durationType,
        selectedAddons: metadata.selectedAddons ?? [],
        nouser: payload.nouser,
      })
    }

    return {
      successResponse,
      invoice,
    }
  }

  async getInvoice(paymentRef: string) {
    return this.get('/inVoiceGenerate', { id: paymentRef, appName: this.appName })
  }
}
