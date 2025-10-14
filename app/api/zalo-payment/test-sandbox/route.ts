import { NextRequest, NextResponse } from 'next/server'
import { createZaloPaySandboxAPI } from '@/lib/zalopay-sandbox'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { amount, description, userAddress } = body

    console.log('ZaloPay Sandbox Test Request:', {
      amount,
      description,
      userAddress
    })

    // Validate input
    if (!amount || amount <= 0) {
      return NextResponse.json(
        { error: 'Invalid amount' },
        { status: 400 }
      )
    }

    if (!description) {
      return NextResponse.json(
        { error: 'Description is required' },
        { status: 400 }
      )
    }

    if (!userAddress) {
      return NextResponse.json(
        { error: 'User wallet address is required' },
        { status: 400 }
      )
    }

    // Initialize ZaloPay Sandbox API
    const zalopayAPI = createZaloPaySandboxAPI()

    // Generate test order data
    const orderData = zalopayAPI.generateTestOrderData({
      app_user: userAddress,
      amount: Math.round(amount),
      description: description,
    })

    console.log('Generated order data:', orderData)

    // Create test order with ZaloPay Sandbox
    const zalopayResponse = await zalopayAPI.createTestOrder(orderData)

    if (zalopayResponse.return_code !== 1) {
      return NextResponse.json(
        { 
          error: 'Failed to create ZaloPay sandbox order',
          details: zalopayResponse.return_message,
          zalopayResponse: zalopayResponse
        },
        { status: 400 }
      )
    }

    // Return test order information
    return NextResponse.json({
      success: true,
      orderId: orderData.app_trans_id,
      appTransId: zalopayResponse.app_trans_id,
      amount: amount,
      paymentUrl: zalopayResponse.order_url,
      qrCode: zalopayResponse.qr_code,
      paymentMethod: 'qr',
      status: 'created',
      createdAt: new Date().toISOString(),
      sandbox: true,
      zalopayResponse: zalopayResponse
    })

  } catch (error) {
    console.error('ZaloPay Sandbox Test Error:', error)
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
    { 
      message: 'ZaloPay Sandbox Test Endpoint',
      usage: 'POST with { amount, description, userAddress }'
    },
    { status: 200 }
  )
}
