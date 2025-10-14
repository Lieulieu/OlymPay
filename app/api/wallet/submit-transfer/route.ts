import { NextRequest, NextResponse } from 'next/server'
import { Connection, Transaction } from '@solana/web3.js'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { 
      signedTransaction // Base64 encoded signed transaction from frontend
    } = body

    if (!signedTransaction) {
      return NextResponse.json(
        { error: 'Missing required parameter: signedTransaction' },
        { status: 400 }
      )
    }

    // Connect to Solana devnet
    const connection = new Connection('https://api.devnet.solana.com', 'confirmed')

    console.log('🔄 Submitting signed transaction to OlymPay Treasury...')

    // Deserialize transaction
    const transactionBuffer = Buffer.from(signedTransaction, 'base64')
    const transaction = Transaction.from(transactionBuffer)

    console.log('Transaction signatures:', transaction.signatures.length)

    // Send and confirm transaction
    const txHash = await connection.sendTransaction(transaction, [], {
      skipPreflight: false,
      preflightCommitment: 'confirmed'
    })

    // Confirm transaction
    await connection.confirmTransaction(txHash, 'confirmed')

    console.log('✅ Transfer to OlymPay Treasury successful!')
    console.log('Transaction Hash:', txHash)

    return NextResponse.json({
      success: true,
      txHash,
      message: 'Transfer to OlymPay Treasury completed successfully'
    })

  } catch (error) {
    console.error('❌ Submit transfer transaction failed:', error)
    return NextResponse.json(
      { 
        error: 'Submit transaction failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

export async function GET() {
  return NextResponse.json(
    { 
      message: 'Submit Transfer Endpoint',
      usage: 'POST with { signedTransaction } - submits signed transaction to blockchain'
    },
    { status: 200 }
  )
}
