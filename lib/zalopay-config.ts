// ZaloPay Configuration
export const ZALOPAY_CONFIG = {
  // Sandbox environment URLs
  SANDBOX: {
    CREATE_ORDER_URL: 'https://sb-openapi.zalopay.vn/v2/create',
    QUERY_ORDER_URL: 'https://sb-openapi.zalopay.vn/v2/query',
    REFUND_URL: 'https://sb-openapi.zalopay.vn/v2/refund',
    GET_BANK_LIST_URL: 'https://sb-openapi.zalopay.vn/v2/banks',
  },
  // Production environment URLs (when ready)
  PRODUCTION: {
    CREATE_ORDER_URL: 'https://openapi.zalopay.vn/v2/create',
    QUERY_ORDER_URL: 'https://openapi.zalopay.vn/v2/query',
    REFUND_URL: 'https://openapi.zalopay.vn/v2/refund',
    GET_BANK_LIST_URL: 'https://openapi.zalopay.vn/v2/banks',
  },
  // Default currency and locale
  CURRENCY: 'VND',
  LOCALE: 'vi',
  // Payment methods
  PAYMENT_METHODS: {
    QR_CODE: 'zalopayapp',
    ATM_CARD: 'atm',
    CREDIT_CARD: 'cc',
    BANK_TRANSFER: 'bank',
  },
  // Order status
  ORDER_STATUS: {
    CREATED: 'created',
    PROCESSING: 'processing',
    COMPLETED: 'completed',
    FAILED: 'failed',
    CANCELLED: 'cancelled',
  },
}

// ZaloPay API Helper Functions
export class ZaloPayAPI {
  private appId: string
  private key1: string
  private key2: string
  private isSandbox: boolean

  constructor(appId: string, key1: string, key2: string, isSandbox: boolean = true) {
    this.appId = appId
    this.key1 = key1
    this.key2 = key2
    this.isSandbox = isSandbox
  }

  // Generate HMAC SHA256 signature
  private generateSignature(data: string): string {
    const crypto = require('crypto')
    return crypto.createHmac('sha256', this.key1).update(data).digest('hex')
  }

  // Generate order data for ZaloPay
  generateOrderData(orderInfo: {
    app_user: string
    amount: number
    description: string
    order_id: string
    callback_url?: string
    item?: any[]
  }) {
    const timestamp = Date.now()
    const orderData: any = {
      app_id: parseInt(this.appId),
      app_user: orderInfo.app_user,
      app_time: timestamp,
      amount: orderInfo.amount,
      item: orderInfo.item || [],
      description: orderInfo.description,
      bank_code: 'zalopayapp', // Default to QR code
      callback_url: orderInfo.callback_url || `${process.env.NEXT_PUBLIC_BASE_URL}/api/zalo-payment-callback`,
    }

    // Generate order_id if not provided
    if (!orderInfo.order_id) {
      orderData.order_id = `OLYMPAY_${timestamp}_${Math.random().toString(36).substr(2, 9)}`
    } else {
      orderData.order_id = orderInfo.order_id
    }

    return orderData
  }

  // Create payment order
  async createOrder(orderData: any) {
    try {
      // Create signature according to ZaloPay spec
      const dataString = `${orderData.app_id}|${orderData.app_trans_id}|${orderData.app_user}|${orderData.amount}|${orderData.app_time}|${orderData.description}|${this.key1}`
      const signature = this.generateSignature(dataString)

      const requestData = {
        ...orderData,
        mac: signature,
      }

      const url = this.isSandbox 
        ? ZALOPAY_CONFIG.SANDBOX.CREATE_ORDER_URL 
        : ZALOPAY_CONFIG.PRODUCTION.CREATE_ORDER_URL

      console.log('ZaloPay Create Order Request:', {
        url: url,
        data: requestData,
        signatureData: dataString,
        environment: this.isSandbox ? 'sandbox' : 'production'
      })

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
      })

      const result = await response.json()
      console.log('ZaloPay Create Order Response:', result)
      
      return result
    } catch (error) {
      console.error('ZaloPay create order error:', error)
      throw error
    }
  }

  // Query order status
  async queryOrder(appTransId: string) {
    try {
      const timestamp = Date.now()
      const dataString = `${this.appId}|${appTransId}|${this.key1}`
      const signature = this.generateSignature(dataString)

      const requestData = {
        app_id: parseInt(this.appId),
        app_trans_id: appTransId,
        mac: signature,
      }

      const url = this.isSandbox 
        ? ZALOPAY_CONFIG.SANDBOX.QUERY_ORDER_URL 
        : ZALOPAY_CONFIG.PRODUCTION.QUERY_ORDER_URL

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
      })

      const result = await response.json()
      return result
    } catch (error) {
      console.error('ZaloPay query order error:', error)
      throw error
    }
  }

  // Get bank list
  async getBankList() {
    try {
      const url = this.isSandbox 
        ? ZALOPAY_CONFIG.SANDBOX.GET_BANK_LIST_URL 
        : ZALOPAY_CONFIG.PRODUCTION.GET_BANK_LIST_URL

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const result = await response.json()
      return result
    } catch (error) {
      console.error('ZaloPay get bank list error:', error)
      throw error
    }
  }

  // Verify callback signature
  verifyCallback(data: any, mac: string): boolean {
    const dataString = `${data.app_id}|${data.app_trans_id}|${data.app_user}|${data.amount}|${data.app_time}|${data.status}|${this.key1}`
    const expectedMac = this.generateSignature(dataString)
    return expectedMac === mac
  }
}

// Initialize ZaloPay API instance
export function createZaloPayAPI(): ZaloPayAPI {
  const appId = process.env.ZALOPAY_APP_ID || ''
  const key1 = process.env.ZALOPAY_KEY1 || ''
  const key2 = process.env.ZALOPAY_KEY2 || ''
  const isSandbox = process.env.NODE_ENV !== 'production'

  if (!appId || !key1 || !key2) {
    throw new Error('ZaloPay configuration is missing. Please check environment variables.')
  }

  return new ZaloPayAPI(appId, key1, key2, isSandbox)
}
