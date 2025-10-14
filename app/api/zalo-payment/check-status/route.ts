import { NextRequest, NextResponse } from 'next/server'
import { createZaloPayAPI } from '@/lib/zalopay-config'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { appTransId } = body

    // Validate input
    if (!appTransId) {
      return NextResponse.json(
        { error: 'App transaction ID is required' },
        { status: 400 }
      )
    }

    // Initialize ZaloPay API
    const zalopayAPI = createZaloPayAPI()

    // Query order status from ZaloPay
    const zalopayResponse = await zalopayAPI.queryOrder(appTransId)

    if (zalopayResponse.return_code !== 1) {
      return NextResponse.json(
        { 
          error: 'Failed to query order status',
          details: zalopayResponse.return_message 
        },
        { status: 400 }
      )
    }

    // Map ZaloPay status to our status
    let status = 'pending'
    let message = 'Đang xử lý'

    switch (zalopayResponse.status) {
      case 1:
        status = 'completed'
        message = 'Thanh toán thành công'
        break
      case 2:
        status = 'failed'
        message = 'Thanh toán thất bại'
        break
      case 3:
        status = 'cancelled'
        message = 'Thanh toán bị hủy'
        break
      default:
        status = 'pending'
        message = 'Đang chờ thanh toán'
    }

    // Return status information
    return NextResponse.json({
      success: true,
      appTransId: appTransId,
      status: status,
      message: message,
      zalopayStatus: zalopayResponse.status,
      amount: zalopayResponse.amount,
      description: zalopayResponse.description,
      createdAt: zalopayResponse.app_time,
      updatedAt: new Date().toISOString(),
    })

  } catch (error) {
    console.error('Check ZaloPay order status error:', error)
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
