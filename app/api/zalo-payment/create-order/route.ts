import { NextRequest, NextResponse } from 'next/server'
import { createZaloPayAPI } from '@/lib/zalopay-config'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { amount, description, paymentMethod, userAddress } = body

    // Debug logging
    console.log('ZaloPay Create Order Request:', {
      amount,
      description,
      paymentMethod,
      userAddress,
      env: {
        ZALOPAY_APP_ID: process.env.ZALOPAY_APP_ID ? 'Set' : 'Missing',
        ZALOPAY_KEY1: process.env.ZALOPAY_KEY1 ? 'Set' : 'Missing',
        ZALOPAY_KEY2: process.env.ZALOPAY_KEY2 ? 'Set' : 'Missing',
        NEXT_PUBLIC_BASE_URL: process.env.NEXT_PUBLIC_BASE_URL
      }
    })

    // Validate input
    if (!amount || amount <= 0) {
      console.log('Validation error: Invalid amount', amount)
      return NextResponse.json(
        { error: 'Invalid amount' },
        { status: 400 }
      )
    }

    if (!description) {
      console.log('Validation error: Missing description')
      return NextResponse.json(
        { error: 'Description is required' },
        { status: 400 }
      )
    }

    if (!userAddress) {
      console.log('Validation error: Missing user address')
      return NextResponse.json(
        { error: 'User wallet address is required' },
        { status: 400 }
      )
    }

    // Initialize ZaloPay API
    let zalopayAPI
    try {
      zalopayAPI = createZaloPayAPI()
      console.log('ZaloPay API initialized successfully')
    } catch (error) {
      console.error('ZaloPay API initialization error:', error)
      return NextResponse.json(
        { 
          error: 'ZaloPay configuration error',
          details: error instanceof Error ? error.message : 'Unknown error'
        },
        { status: 500 }
      )
    }

    // Generate unique order ID
    const orderId = `OLYMPAY_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    // Generate order data
    const orderData = zalopayAPI.generateOrderData({
      app_user: userAddress,
      amount: Math.round(amount), // ZaloPay expects integer amount
      description: description,
      order_id: orderId,
      item: [
        {
          itemid: 'OLYMPAY_TOPUP',
          itemname: 'Nạp tiền oVND',
          itemprice: Math.round(amount),
          itemquantity: 1,
        }
      ],
      callback_url: `${process.env.NEXT_PUBLIC_BASE_URL}/api/zalo-payment-callback`,
    })

    // Set payment method
    if (paymentMethod === 'qr') {
      orderData.bank_code = 'zalopayapp'
    } else if (paymentMethod === 'atm') {
      orderData.bank_code = 'atm'
    } else if (paymentMethod === 'cc') {
      orderData.bank_code = 'cc'
    } else {
      orderData.bank_code = 'zalopayapp' // Default to QR code
    }

    // Create order with ZaloPay
    const zalopayResponse = await zalopayAPI.createOrder(orderData)

    if (zalopayResponse.return_code !== 1) {
      return NextResponse.json(
        { 
          error: 'Failed to create ZaloPay order',
          details: zalopayResponse.return_message 
        },
        { status: 400 }
      )
    }

    // Return order information
    return NextResponse.json({
      success: true,
      orderId: orderId,
      appTransId: zalopayResponse.app_trans_id,
      amount: amount,
      paymentUrl: zalopayResponse.order_url,
      qrCode: zalopayResponse.qr_code,
      paymentMethod: paymentMethod,
      status: 'created',
      createdAt: new Date().toISOString(),
    })

  } catch (error) {
    console.error('Create ZaloPay order error:', error)
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

export async function GET() {
  return NextResponse.json(
    { error: 'Method not allowed' },
    { status: 405 }
  )
}
