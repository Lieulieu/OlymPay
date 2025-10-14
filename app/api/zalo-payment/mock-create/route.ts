import { NextRequest, NextResponse } from 'next/server'
import { mockMintOVND, mintOVND } from '@/lib/solana-mint'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { amount, description, paymentMethod, userAddress } = body

    console.log('Mock ZaloPay Create Order Request:', {
      amount,
      description,
      paymentMethod,
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

    // Generate mock order ID
    const orderId = `MOCK_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    const appTransId = `MOCK_APP_${Date.now()}`

    // Mock QR code (base64 encoded simple QR)
    const mockQrCode = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=='

    // Mock payment URL
    const mockPaymentUrl = `https://zalopay.vn/mock/pay/${appTransId}`

    // Simulate delay
    await new Promise(resolve => setTimeout(resolve, 1000))

    // Mint oVND tokens (real or mock based on environment)
    const useRealMinting = process.env.USE_REAL_SOLANA_MINTING === 'true'
    const mintKeypairHex = process.env.SOLANA_KEYPAIR_MINT_oVND
    
    let mintResult
    if (useRealMinting && mintKeypairHex) {
      console.log('🪙 Using REAL Solana minting...')
      mintResult = await mintOVND(userAddress, amount, mintKeypairHex)
    } else {
      console.log('🪙 Using MOCK minting...')
      mintResult = await mockMintOVND(userAddress, amount)
    }
    
    if (!mintResult.success) {
      console.error('Failed to mint oVND:', mintResult.error)
      return NextResponse.json(
        { 
          error: 'Failed to mint oVND tokens',
          details: mintResult.error
        },
        { status: 500 }
      )
    }

    // Return mock order information with minting result
    return NextResponse.json({
      success: true,
      orderId: orderId,
      appTransId: appTransId,
      amount: amount,
      paymentUrl: mockPaymentUrl,
      qrCode: mockQrCode,
      paymentMethod: paymentMethod,
      status: 'created',
      createdAt: new Date().toISOString(),
      mock: true,
      message: 'Mock order created successfully',
      minting: {
        success: true,
        txHash: mintResult.txHash,
        mintedAmount: amount, // 1 VND = 1 oVND
        userAddress: userAddress
      }
    })

  } catch (error) {
    console.error('Mock ZaloPay Create Order Error:', error)
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
      message: 'ZaloPay Mock Create Order Endpoint',
      usage: 'POST with { amount, description, paymentMethod, userAddress }'
    },
    { status: 200 }
  )
}
