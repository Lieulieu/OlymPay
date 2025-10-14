import { NextRequest, NextResponse } from 'next/server'
import { Connection, PublicKey, Keypair, Transaction, sendAndConfirmTransaction } from '@solana/web3.js'
import { 
  getAccount, 
  getAssociatedTokenAddress, 
  createTransferInstruction,
  createAssociatedTokenAccountInstruction,
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

    // Get mint keypair from server environment
    const mintKeypairHex = process.env.SOLANA_KEYPAIR_MINT_oVND
    if (!mintKeypairHex) {
      return NextResponse.json(
        { error: 'SOLANA_KEYPAIR_MINT_oVND not configured' },
        { status: 500 }
      )
    }

    // Connect to Solana devnet
    const connection = new Connection('https://api.devnet.solana.com', 'confirmed')
    
    // oVND Token Address
    const oVND_MINT_ADDRESS = 'EbNKsXtiUQQ972QEF172kRQPhVb6MJpx5NwZ6LX8H69b'
    const mintPublicKey = new PublicKey(oVND_MINT_ADDRESS)
    const fromPublicKey = new PublicKey(fromAddress)
    const toPublicKey = new PublicKey(toAddress)

    // Create keypair from hex string
    console.log('Raw mintKeypairHex:', mintKeypairHex)
    console.log('Hex string length:', mintKeypairHex.length)
    
    // Ensure we have a valid hex string
    if (!mintKeypairHex || mintKeypairHex.length !== 128) {
      throw new Error(`Invalid keypair hex: expected 128 chars, got ${mintKeypairHex?.length || 0}`)
    }
    
    const hexBytes = mintKeypairHex.match(/.{1,2}/g)!.map((byte: string) => parseInt(byte, 16))
    console.log('Hex bytes length:', hexBytes.length)
    console.log('First few bytes:', hexBytes.slice(0, 5))
    console.log('Last few bytes:', hexBytes.slice(-5))
    
    if (hexBytes.length !== 64) {
      throw new Error(`Invalid keypair length: expected 64 bytes, got ${hexBytes.length}`)
    }
    
    const mintKeypair = Keypair.fromSecretKey(new Uint8Array(hexBytes))

    console.log('🔄 Transferring oVND Token to OlymPay Treasury...')
    console.log('From:', fromAddress)
    console.log('To (OlymPay Treasury):', toAddress)
    console.log('Amount:', amount, 'oVND')
    console.log('Mint Authority:', mintKeypair.publicKey.toString())

    // Get or create sender's associated token account
    const fromTokenAccount = await getOrCreateAssociatedTokenAccount(
      connection,
      mintKeypair, // payer
      mintPublicKey, // mint
      fromPublicKey // owner
    )

    // Get or create receiver's (OlymPay Treasury) associated token account
    const toTokenAccount = await getOrCreateAssociatedTokenAccount(
      connection,
      mintKeypair, // payer
      mintPublicKey, // mint
      toPublicKey // owner (OlymPay Treasury)
    )

    console.log('From Token Account:', fromTokenAccount.address.toString())
    console.log('To Token Account (Treasury):', toTokenAccount.address.toString())

    // Calculate amount in token units (9 decimals)
    const tokenAmount = Math.floor(amount * Math.pow(10, 9))

    console.log('Token Amount (with decimals):', tokenAmount)

    // Create transfer instruction
    const transferInstruction = createTransferInstruction(
      fromTokenAccount.address, // source
      toTokenAccount.address, // destination (OlymPay Treasury)
      fromPublicKey, // owner
      tokenAmount // amount
    )

    // Create and send transaction
    const transaction = new Transaction().add(transferInstruction)
    
    // Send and confirm transaction
    const txHash = await sendAndConfirmTransaction(
      connection,
      transaction,
      [mintKeypair], // signers
      {
        commitment: 'confirmed',
        preflightCommitment: 'confirmed'
      }
    )

    console.log('✅ Transfer to OlymPay Treasury successful!')
    console.log('Transaction Hash:', txHash)

    return NextResponse.json({
      success: true,
      txHash,
      fromAddress,
      toAddress: toAddress, // OlymPay Treasury
      amount,
      tokenAmount,
      message: 'Transfer to OlymPay Treasury completed successfully'
    })

  } catch (error) {
    console.error('❌ Transfer to OlymPay Treasury failed:', error)
    return NextResponse.json(
      { 
        error: 'Transfer failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

export async function GET() {
  return NextResponse.json(
    { 
      message: 'Wallet Transfer Endpoint',
      usage: 'POST with { fromAddress, toAddress, amount, mintKeypairHex }'
    },
    { status: 200 }
  )
}
