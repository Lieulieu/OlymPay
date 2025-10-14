import { NextRequest, NextResponse } from 'next/server'

interface PurchaseRequest {
  productId: string
  transactionHash?: string
}

interface PurchaseResponse {
  success: boolean
  message: string
  transactionId?: string
  newBalance?: number
}

export async function POST(request: NextRequest) {
  try {
    const body: PurchaseRequest = await request.json()
    const { productId, transactionHash } = body

    if (!productId) {
      return NextResponse.json(
        { success: false, message: 'Product ID is required' },
        { status: 400 }
      )
    }

    // If transaction hash is provided, it means the blockchain transfer was successful
    if (transactionHash) {
      console.log('✅ Purchase successful with transaction hash:', transactionHash)
      
      // Generate transaction ID
      const transactionId = `TXN_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`

      return NextResponse.json({
        success: true,
        message: 'Purchase completed successfully',
        transactionId,
        transactionHash,
        newBalance: 0 // Will be updated by frontend
      })
    }

    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, 1000))

    // Generate transaction ID
    const transactionId = `TXN_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`

    // Simulate purchase success (in real implementation, this would:
    // 1. Validate product exists and is available
    // 2. Check user has sufficient oVND balance
    // 3. Deduct balance from user's wallet
    // 4. Create purchase record
    // 5. Send confirmation to partner
    const success = Math.random() > 0.1 // 90% success rate for demo

    if (success) {
      // Simulate new balance (in real implementation, fetch from wallet)
      const newBalance = Math.floor(Math.random() * 10000000) + 1000000 // Random balance between 1M-11M

      return NextResponse.json({
        success: true,
        message: 'Purchase completed successfully',
        transactionId,
        newBalance
      })
    } else {
      return NextResponse.json({
        success: false,
        message: 'Insufficient oVND balance or product unavailable'
      })
    }
  } catch (error) {
    console.error('Purchase error:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}
