import axios from 'axios'
import db from '@adonisjs/lucid/services/db'
import env from '#start/env'
import { Exception } from '@adonisjs/core/exceptions'
import Organization from '#models/organization'
import SubscriptionService from '#services/SubscriptionService'
import Payment from '#models/payment'
import { DateTime } from 'luxon'
import crypto from 'node:crypto'

type LegacyAddon = {
  name: string
  price: string
  status: string
}

export default class LegacyBillingService {
  private readonly baseUrl = (env.get('LEGACY_BILLING_BASE_URL') || '').replace(/\/+$/, '')
  private readonly appName = env.get('LEGACY_BILLING_APP_NAME') || 'ubiAttendance'
  private readonly basePlanAmount = Number(env.get('LEGACY_BILLING_PLAN_BASE_AMOUNT') || 3000)
  private readonly getTimeoutMs = Number(env.get('LEGACY_BILLING_GET_TIMEOUT_MS') || 5000)
  private readonly postTimeoutMs = Number(env.get('LEGACY_BILLING_POST_TIMEOUT_MS') || 5000)
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
  private readonly addonDefaultPrices: Record<string, number> = {
    leaveandtimeoff: 300,
    employeetracking: 400,
    trackvisits: 300,
    geofence: 200,
    facerecognition: 1000,
    shiftplanner: 300,
    timesheet: 200,
    payroll: 500,
    manageclients: 300,
    expense: 300,
    attendance: 400,
    projects: 300,
    announcements: 100,
  }

  private hasLegacyGateway() {
    return Boolean(this.baseUrl)
  }

  private hasRazorpayGateway() {
    return Boolean(env.get('RAZORPAY_KEY_ID', '') && env.get('RAZORPAY_KEY_SECRET', ''))
  }

  isConfigured() {
    return this.hasLegacyGateway() || this.hasRazorpayGateway()
  }

  private ensureConfigured() {
    if (!this.hasLegacyGateway()) {
      throw new Exception('Legacy billing gateway is not configured', { status: 400 })
    }
  }

  private toGatewayException(error: any) {
    const code = error?.code
    const message = code === 'ECONNABORTED'
      ? 'Legacy billing gateway is not responding. Please try again after checking the legacy billing server.'
      : 'Legacy billing gateway request failed. Please check the legacy billing server.'

    return new Exception(message, { status: 503 })
  }

  private async get(url: string, params: Record<string, any> = {}) {
    this.ensureConfigured()
    try {
      const response = await axios.get(`${this.baseUrl}${url}`, { params, timeout: this.getTimeoutMs })
      return response.data
    } catch (error) {
      throw this.toGatewayException(error)
    }
  }

  private async postForm(url: string, payload: Record<string, any>) {
    this.ensureConfigured()
    const form = new FormData()
    Object.entries(payload).forEach(([key, value]) => {
      form.append(key, value == null ? '' : String(value))
    })
    try {
      const response = await axios.post(`${this.baseUrl}${url}`, form, {
        timeout: this.postTimeoutMs,
        headers: form instanceof FormData ? undefined : {},
      })
      return response.data
    } catch (error) {
      throw this.toGatewayException(error)
    }
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
      price: String(this.normalizeAddonPrice(item?.price ?? item?.Price, String(item?.name ?? ''))),
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

  private addonDefaultPrice(value: string) {
    const keys = this.addonKeys(value)
    const matchedKey = keys.find((key) => this.addonDefaultPrices[key] != null)
    return matchedKey ? this.addonDefaultPrices[matchedKey] : 300
  }

  private normalizeAddonPrice(value: any, name: string) {
    const price = Number(value)
    return Number.isFinite(price) && price > 0 ? price : this.addonDefaultPrice(name)
  }

  private calculateTax(baseAmount: number) {
    return Number((baseAmount * 0.18).toFixed(2))
  }

  private isGatewayUnavailable(error: any) {
    return (
      error?.status === 503 ||
      error?.code === 'ECONNABORTED' ||
      String(error?.message || '').toLowerCase().includes('legacy billing gateway is not configured')
    )
  }

  private async createLocalRazorpayOrder(amount: number, receipt: string) {
    const keyId = env.get('RAZORPAY_KEY_ID', '')
    const keySecret = env.get('RAZORPAY_KEY_SECRET', '')
    if (!keyId || !keySecret) {
      throw new Exception('Payment gateway credentials are not configured', { status: 400 })
    }

    const response = await axios.post(
      'https://api.razorpay.com/v1/orders',
      {
        amount: Math.round(amount * 100),
        currency: 'INR',
        receipt,
        payment_capture: 1,
      },
      {
        auth: { username: keyId, password: keySecret },
        timeout: 20000,
      }
    )

    return response.data
  }

  private async fallbackContext(orgId: number, configured: boolean, gatewayMessage = '') {
    const org = await Organization.find(orgId)
    const localAddons = await db
      .from('addon_prices')
      .leftJoin('organization_addons', function () {
        this.on('organization_addons.addon_id', '=', 'addon_prices.id').andOnVal('organization_addons.org_id', orgId)
      })
      .where('addon_prices.is_active', true)
      .select(
        'addon_prices.name',
        'addon_prices.price',
        'organization_addons.is_active as enabled'
      )

    const addonCatalog = localAddons.length
      ? localAddons.map((addon) => ({
          name: String(addon.name ?? ''),
          price: String(this.normalizeAddonPrice(addon.price, String(addon.name ?? ''))),
          status: Number(addon.enabled) === 1 || addon.enabled === true ? '1' : '0',
        }))
      : [
          { name: 'Payroll', price: '500', status: '0' },
          { name: 'Leave & Timeoff', price: '300', status: '0' },
          { name: 'Face Recognition', price: '1000', status: '0' },
          { name: 'Employee Tracking', price: '400', status: '0' },
          { name: 'Timesheet', price: '200', status: '0' },
          { name: 'Visit Management', price: '300', status: '0' },
          { name: 'Geofencing', price: '200', status: '0' },
        ]

    return {
      configured,
      gatewayAvailable: false,
      gatewayMessage,
      appName: this.appName,
      currentOrgSts: org?.isTrialActive ? 'TrialOrg' : 'PaidOrg',
      existingPlan: {
        orgid: orgId,
        orgName: org?.companyName || '',
        email: org?.email || '',
        phoneNumber: org?.phone || '',
        countryname: org?.countryName || 'India',
        startDate: org?.trialStartDate ? (typeof org.trialStartDate.toISODate === 'function' ? org.trialStartDate.toISODate() : DateTime.fromJSDate(org.trialStartDate as any).toISODate()) : null,
        endDate: org?.trialEndDate ? (typeof org.trialEndDate.toISODate === 'function' ? org.trialEndDate.toISODate() : DateTime.fromJSDate(org.trialEndDate as any).toISODate()) : null,
        noemp: org?.userLimit || 0,
        userlimit: org?.userLimit || 0,
        planStatus: org?.isTrialActive ? 0 : 1,
        trialItemCount: 0,
        turnOffMyPlan: false,
        stateName: org?.state || '',
        cityName: org?.city || '',
        gstin: org?.gstin || '',
        zip: org?.postalCode || '',
      },
      states: [
        { code: 'AN', name: 'Andaman and Nicobar Islands' },
        { code: 'AP', name: 'Andhra Pradesh' },
        { code: 'AR', name: 'Arunachal Pradesh' },
        { code: 'AS', name: 'Assam' },
        { code: 'BR', name: 'Bihar' },
        { code: 'CH', name: 'Chandigarh' },
        { code: 'CT', name: 'Chhattisgarh' },
        { code: 'DN', name: 'Dadra and Nagar Haveli' },
        { code: 'DD', name: 'Daman and Diu' },
        { code: 'DL', name: 'Delhi' },
        { code: 'GA', name: 'Goa' },
        { code: 'GJ', name: 'Gujarat' },
        { code: 'HR', name: 'Haryana' },
        { code: 'HP', name: 'Himachal Pradesh' },
        { code: 'JK', name: 'Jammu and Kashmir' },
        { code: 'JH', name: 'Jharkhand' },
        { code: 'KA', name: 'Karnataka' },
        { code: 'KL', name: 'Kerala' },
        { code: 'LD', name: 'Lakshadweep' },
        { code: 'MP', name: 'Madhya Pradesh' },
        { code: 'MH', name: 'Maharashtra' },
        { code: 'MN', name: 'Manipur' },
        { code: 'ML', name: 'Meghalaya' },
        { code: 'MZ', name: 'Mizoram' },
        { code: 'NL', name: 'Nagaland' },
        { code: 'OR', name: 'Odisha' },
        { code: 'PY', name: 'Puducherry' },
        { code: 'PB', name: 'Punjab' },
        { code: 'RJ', name: 'Rajasthan' },
        { code: 'SK', name: 'Sikkim' },
        { code: 'TN', name: 'Tamil Nadu' },
        { code: 'TG', name: 'Telangana' },
        { code: 'TR', name: 'Tripura' },
        { code: 'UP', name: 'Uttar Pradesh' },
        { code: 'UK', name: 'Uttarakhand' },
        { code: 'WB', name: 'West Bengal' },
      ],
      addonCatalog,
      pricingMatrix: null,
      basePlanAmount: this.basePlanAmount,
      suggestedAction: org?.isTrialActive ? 'Buy' : 'Upgrade',
    }
  }

  private async buildSelectedAddons(selectedAddons: Array<{ name: string; status: boolean }>, externalCatalog: LegacyAddon[]) {
    const catalogMap = new Map(externalCatalog.map((item) => [this.normalizeAddonKey(item.name), item]))
    return selectedAddons.map((item) => {
      const matched = this.addonKeys(item.name)
        .map((key) => catalogMap.get(key))
        .find(Boolean)
      return {
        name: item.name,
        Price: String(this.normalizeAddonPrice(matched?.price, item.name)),
        Status: item.status ? '1' : '0',
      }
    })
  }

  private async createFallbackPurchase(
    org: Organization,
    orgId: number,
    payload: {
      nouser: number
      selectedAddons: Array<{ name: string; status: boolean }>
      paymentMethod: string
      duration: number
      durationType: string
      action: 'Buy' | 'Upgrade'
    },
    addons: Array<{ name: string; Price: string; Status: string }>,
    paymentAmount: number,
    tax: number,
    failureMessage: string
  ) {
    const order = await this.createLocalRazorpayOrder(paymentAmount, `legacy-fallback-${orgId}-${Date.now()}`)
    const payment = await Payment.create({
      orgId,
      planId: org.planId,
      amount: paymentAmount,
      currency: 'INR',
      paymentMethod: payload.paymentMethod,
      paymentGateway: 'razorpay',
      provider: 'razorpay',
      providerOrderId: order.id,
      transactionId: `fallback_${crypto.randomUUID()}`,
      status: 'pending',
      billingCycle: payload.durationType.toLowerCase().startsWith('year') ? 'yearly' : 'monthly',
      metadata: JSON.stringify({
        action: payload.action,
        selectedAddons: addons,
        nouser: payload.nouser,
        tax,
        source: 'legacy_gateway_fallback',
        legacyGatewayError: failureMessage,
      }),
    })

    return {
      paymentRecordId: payment.id,
      legacyPaymentId: null,
      orderId: order.id,
      publishableKey: env.get('RAZORPAY_KEY_ID', ''),
      status: true,
      message: 'Payment checkout initialized with Razorpay.',
      paymentAmount,
      amount: paymentAmount,
      currency: 'INR',
      tax,
      addons,
      configured: true,
      fallback: true,
    }
  }

  async getContext(orgId: number) {
    if (!this.hasLegacyGateway()) {
      return this.fallbackContext(
        orgId,
        this.hasRazorpayGateway(),
        this.hasRazorpayGateway()
          ? 'Legacy billing gateway is not configured. Razorpay checkout is available.'
          : 'Payment gateway credentials are not configured.'
      )
    }

    let existingPlan
    let states
    try {
      existingPlan = this.normalizePlanStatus(await this.get('/existingPlan', { Orgid: orgId, appName: this.appName }))
      states = await this.get('/stateList')
    } catch (error: any) {
      return this.fallbackContext(orgId, true, error?.message || 'Legacy billing gateway is not responding.')
    }
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
      subtotal?: number
      tax?: number
      paymentAmount?: number
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
    const calculatedAmount = Number((this.basePlanAmount + selectedTotal).toFixed(2))
    const requestedAmount = Number(payload.paymentAmount ?? 0)
    const paymentAmount = Number((requestedAmount > 0 ? requestedAmount : calculatedAmount).toFixed(2))
    const tax = Number((Number(payload.tax ?? 0) > 0 ? Number(payload.tax) : this.calculateTax(paymentAmount)).toFixed(2))

    if (!this.isConfigured()) {
      return this.createFallbackPurchase(
        org,
        orgId,
        payload,
        addons,
        paymentAmount,
        tax,
        'Legacy billing gateway is not configured. Using Razorpay fallback checkout.'
      )
    }

    let response
    try {
      response = await this.postForm('/planPurchase', {
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
    } catch (error: any) {
      if (this.isGatewayUnavailable(error)) {
        return this.createFallbackPurchase(org, orgId, payload, addons, paymentAmount, tax, error?.message || 'Legacy gateway unavailable')
      }
      throw error
    }

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

    let successResponse: any = null
    const isFallbackPayment = metadata.source === 'legacy_gateway_fallback'

    if (!isFallbackPayment) {
      successResponse = await this.postForm('/successPayment', {
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
    }

    payment.providerPaymentId = payload.paymentRzrId
    payment.providerSignature = payload.orderId
    payment.status = payload.paymentStatus.toLowerCase() === 'success' ? 'success' : 'failed'
    payment.paidAt = payment.status === 'success' ? DateTime.now() : payment.paidAt
    await payment.save()

    let invoice: any = null
    if (payment.status === 'success') {
      if (!isFallbackPayment) {
        invoice = await this.get('/inVoiceGenerate', { id: payload.paymentRzrId, appName: this.appName })
      }
      await this.subscriptionService.markExternalPurchaseSuccess(orgId, {
        payment,
        duration: payload.duration,
        durationType: payload.durationType,
        selectedAddons: metadata.selectedAddons ?? [],
        nouser: payload.nouser,
      })
    }

    return {
      successResponse: successResponse ?? { status: true, msg: 'Fallback payment confirmed locally.' },
      invoice,
      fallback: isFallbackPayment,
    }
  }

  async getInvoice(paymentRef: string) {
    return this.get('/inVoiceGenerate', { id: paymentRef, appName: this.appName })
  }
}
