// ZaloPay Sandbox Configuration for testing
export const ZALOPAY_SANDBOX_CONFIG = {
  APP_ID: '2553',
  KEY1: 'PcY4iZIKFCIdgZvA6ueMcMHHUbRLYjPL',
  KEY2: 'kLtgPl8HHhfvMuDHPwKfgfsY4Ydm9eIz',
  BASE_URL: 'https://sb-openapi.zalopay.vn/v2',
}

// Simple ZaloPay API for testing
export class ZaloPaySandboxAPI {
  private appId: string
  private key1: string
  private key2: string

  constructor() {
    this.appId = ZALOPAY_SANDBOX_CONFIG.APP_ID
    this.key1 = ZALOPAY_SANDBOX_CONFIG.KEY1
    this.key2 = ZALOPAY_SANDBOX_CONFIG.KEY2
  }

  // Generate HMAC SHA256 signature
  private generateSignature(data: string): string {
    const crypto = require('crypto')
    return crypto.createHmac('sha256', this.key1).update(data).digest('hex')
  }

  // Create test order
  async createTestOrder(orderData: any) {
    try {
      // Create signature according to ZaloPay spec
      const dataString = `${orderData.app_id}|${orderData.app_trans_id}|${orderData.app_user}|${orderData.amount}|${orderData.app_time}|${orderData.description}|${this.key1}`
      const signature = this.generateSignature(dataString)

      const requestData = {
        ...orderData,
        mac: signature,
      }

      console.log('ZaloPay Sandbox Request:', {
        url: `${ZALOPAY_SANDBOX_CONFIG.BASE_URL}/create`,
        data: requestData,
        signatureData: dataString
      })

      const response = await fetch(`${ZALOPAY_SANDBOX_CONFIG.BASE_URL}/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
      })

      const result = await response.json()
      console.log('ZaloPay Sandbox Response:', result)
      
      return result
    } catch (error) {
      console.error('ZaloPay Sandbox Error:', error)
      throw error
    }
  }

  // Generate test order data
  generateTestOrderData(orderInfo: {
    app_user: string
    amount: number
    description: string
  }) {
    const timestamp = Date.now()
    const orderId = `OLYMPAY_TEST_${timestamp}_${Math.random().toString(36).substr(2, 9)}`

    return {
      app_id: parseInt(this.appId),
      app_trans_id: orderId,
      app_user: orderInfo.app_user,
      app_time: timestamp,
      amount: orderInfo.amount,
      item: JSON.stringify([
        {
          itemid: 'OLYMPAY_TEST',
          itemname: orderInfo.description,
          itemprice: orderInfo.amount,
          itemquantity: 1,
        }
      ]),
      description: orderInfo.description,
      bank_code: 'zalopayapp',
      callback_url: 'http://localhost:3000/api/zalo-payment-callback',
    }
  }
}

// Create sandbox API instance
export function createZaloPaySandboxAPI(): ZaloPaySandboxAPI {
  return new ZaloPaySandboxAPI()
}
