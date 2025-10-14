import { NextRequest, NextResponse } from 'next/server'
import { Connection, PublicKey, Transaction } from '@solana/web3.js'
import { 
  getAssociatedTokenAddress, 
  createTransferInstruction,
  getOrCreateAssociatedTokenAccount
} from '@solana/spl-token'

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

    // Connect to Solana devnet
    const connection = new Connection('https://api.devnet.solana.com', 'confirmed')
    
    // oVND Token Address
    const oVND_MINT_ADDRESS = 'EbNKsXtiUQQ972QEF172kRQPhVb6MJpx5NwZ6LX8H69b'
    const mintPublicKey = new PublicKey(oVND_MINT_ADDRESS)
    const fromPublicKey = new PublicKey(fromAddress)
    const toPublicKey = new PublicKey(toAddress)

    console.log('🔄 Creating Transfer Transaction to OlymPay Treasury...')
    console.log('From:', fromAddress)
    console.log('To (OlymPay Treasury):', toAddress)
    console.log('Amount:', amount, 'oVND')

    // Get sender's associated token account
    const fromTokenAccount = await getAssociatedTokenAddress(
      mintPublicKey,
      fromPublicKey
    )

    // Get receiver's (OlymPay Treasury) associated token account
    const toTokenAccount = await getAssociatedTokenAddress(
      mintPublicKey,
      toPublicKey
    )

    console.log('From Token Account:', fromTokenAccount.toString())
    console.log('To Token Account (Treasury):', toTokenAccount.toString())

    // Calculate amount in token units (9 decimals)
    const tokenAmount = Math.floor(amount * Math.pow(10, 9))

    console.log('Token Amount (with decimals):', tokenAmount)

    // Create transfer instruction
    const transferInstruction = createTransferInstruction(
      fromTokenAccount, // source
      toTokenAccount, // destination (OlymPay Treasury)
      fromPublicKey, // owner
      tokenAmount // amount
    )

    // Create transaction
    const transaction = new Transaction().add(transferInstruction)
    
    // Get recent blockhash
    const { blockhash } = await connection.getLatestBlockhash()
    transaction.recentBlockhash = blockhash
    transaction.feePayer = fromPublicKey

    // Serialize transaction for frontend to sign
    const serializedTransaction = transaction.serialize({ requireAllSignatures: false })
    const base64Transaction = serializedTransaction.toString('base64')

    console.log('✅ Transaction created for user signature')
    console.log('Transaction size:', serializedTransaction.length, 'bytes')

    return NextResponse.json({
      success: true,
      transaction: base64Transaction,
      fromAddress,
      toAddress: toAddress, // OlymPay Treasury
      amount,
      tokenAmount,
      message: 'Transaction ready for user signature'
    })

  } catch (error) {
    console.error('❌ Create transfer transaction failed:', error)
    return NextResponse.json(
      { 
        error: 'Create transaction failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

export async function GET() {
  return NextResponse.json(
    { 
      message: 'User Transfer Endpoint',
      usage: 'POST with { fromAddress, toAddress, amount } - returns transaction for user to sign'
    },
    { status: 200 }
  )
}
