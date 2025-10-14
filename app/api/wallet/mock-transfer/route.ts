import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { 
      fromAddress, 
      toAddress, 
      amount 
    } = body

    if (!fromAddress || !toAddress || !amount) {
      return NextResponse.json(
        { error: 'Missing required parameters: fromAddress, toAddress, amount' },
        { status: 400 }
      )
    }

    console.log('🔄 Mock Transferring oVND Token...')
    console.log('From:', fromAddress)
    console.log('To:', toAddress)
    console.log('Amount:', amount, 'oVND')

    // Generate mock transaction hash
    const mockTxHash = 'mock_' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)

    console.log('✅ Mock Transfer successful!')
    console.log('Transaction Hash:', mockTxHash)

    return NextResponse.json({
      success: true,
      txHash: mockTxHash,
      fromAddress,
      toAddress,
      amount,
      tokenAmount: amount * 1000000000, // 9 decimals
      message: 'Mock transfer completed successfully'
    })

  } catch (error) {
    console.error('❌ Mock Transfer failed:', error)
    return NextResponse.json(
      { 
        error: 'Mock transfer failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

export async function GET() {
  return NextResponse.json(
    { 
      message: 'Mock Wallet Transfer Endpoint',
      usage: 'POST with { fromAddress, toAddress, amount }'
    },
    { status: 200 }
  )
}
