import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'

// Zalo Pay API endpoints
const ZALOPAY_SANDBOX_URL = 'https://sb-openapi.zalopay.vn/v2/create'
const ZALOPAY_QUERY_URL = 'https://sb-openapi.zalopay.vn/v2/query'

interface ZaloPaymentRequest {
  amount: number
  currency: string
  transactionId: string
  walletAddress: string
  description: string
}

// Generate Zalo Pay signature
function generateZaloPaySignature(data: string, key: string): string {
  return crypto.createHmac('sha256', key).update(data).digest('hex')
}

// Create Zalo Pay order
async function createZaloPayOrder(data: ZaloPaymentRequest) {
  const appId = process.env.ZALOPAY_APP_ID
  const appUser = data.walletAddress || 'user123'
  const appTransId = data.transactionId
  const appTime = Date.now()
  const amount = data.amount
  const description = data.description
  const item = JSON.stringify([{
    itemid: 'vnd',
    itemname: `${amount.toLocaleString('vi-VN')} VND`,
    itemprice: amount,
    itemquantity: 1
  }])
  const embedData = JSON.stringify({
    merchantinfo: 'OlymPay',
    redirecturl: `${process.env.NEXT_PUBLIC_BASE_URL}/zalo-payment/success`
  })
  const bankCode = 'zalopayapp'

  if (!appId) {
    throw new Error('ZALOPAY_APP_ID is not configured')
  }

  const zaloKey = process.env.ZALOPAY_KEY
  if (!zaloKey) {
    throw new Error('ZALOPAY_KEY is not configured')
  }

  // Create order data
  const orderData = {
    app_id: parseInt(appId),
    app_user: appUser,
    app_trans_id: appTransId,
    app_time: appTime,
    amount: amount,
    item: item,
    description: description,
    bank_code: bankCode,
    embed_data: embedData,
    callback_url: `${process.env.NEXT_PUBLIC_BASE_URL}/api/zalo-payment-callback`
  }

  // Generate signature
  const dataString = `app_id=${orderData.app_id}&app_trans_id=${orderData.app_trans_id}&app_user=${orderData.app_user}&amount=${orderData.amount}&app_time=${orderData.app_time}&embed_data=${orderData.embed_data}&item=${orderData.item}`
  const signature = generateZaloPaySignature(dataString, zaloKey)

  const requestData = {
    ...orderData,
    mac: signature
  }

  try {
    const response = await fetch(ZALOPAY_SANDBOX_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestData),
    })

    const result = await response.json()
    
    if (result.return_code === 1) {
      return {
        success: true,
        payment_url: result.order_url,
        zp_trans_token: result.zp_trans_token,
        app_trans_id: appTransId
      }
    } else {
      return {
        success: false,
        error: result.return_message || 'Failed to create Zalo Pay order'
      }
    }
  } catch (error) {
    console.error('Zalo Pay API error:', error)
    return {
      success: false,
      error: 'Failed to connect to Zalo Pay API'
    }
  }
}

export async function POST(request: NextRequest) {
  try {
    const body: ZaloPaymentRequest = await request.json()
    
    // Validate required fields
    if (!body.amount || !body.transactionId || !body.walletAddress) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Validate amount
    if (body.amount < 100000 || body.amount > 50000000) {
      return NextResponse.json(
        { error: 'Amount must be between 100,000 and 50,000,000 VND' },
        { status: 400 }
      )
    }

    // Create Zalo Pay order
    const result = await createZaloPayOrder(body)

    if (result.success) {
      return NextResponse.json({
        success: true,
        payment_url: result.payment_url,
        zp_trans_token: result.zp_trans_token,
        app_trans_id: result.app_trans_id,
        transaction_id: body.transactionId
      })
    } else {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      )
    }
  } catch (error) {
    console.error('Create Zalo payment error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Query payment status
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const appTransId = searchParams.get('app_trans_id')

    if (!appTransId) {
      return NextResponse.json(
        { error: 'Missing app_trans_id parameter' },
        { status: 400 }
      )
    }

    const appId = process.env.ZALOPAY_APP_ID
    const zaloKey = process.env.ZALOPAY_KEY

    if (!appId || !zaloKey) {
      return NextResponse.json(
        { error: 'Zalo Pay configuration missing' },
        { status: 500 }
      )
    }

    // Create query data
    const queryData = {
      app_id: parseInt(appId),
      app_trans_id: appTransId
    }

    // Generate signature for query
    const dataString = `app_id=${queryData.app_id}&app_trans_id=${queryData.app_trans_id}`
    const signature = generateZaloPaySignature(dataString, zaloKey)

    const requestData = {
      ...queryData,
      mac: signature
    }

    const response = await fetch(ZALOPAY_QUERY_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestData),
    })

    const result = await response.json()

    return NextResponse.json({
      success: result.return_code === 1,
      status: result.return_code === 1 ? 'success' : 'failed',
      message: result.return_message,
      data: result
    })
  } catch (error) {
    console.error('Query Zalo payment error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
