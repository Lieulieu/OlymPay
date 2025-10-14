import { Connection, PublicKey, Transaction, SystemProgram, LAMPORTS_PER_SOL } from '@solana/web3.js'
import { getAssociatedTokenAddress, getAccount, createTransferInstruction, getMint } from '@solana/spl-token'

// oVND Token Configuration
export const OVND_CONFIG = {
  // Real oVND mint address on Solana Devnet
  MINT_ADDRESS: new PublicKey('EbNKsXtiUQQ972QEF172kRQPhVb6MJpx5NwZ6LX8H69b'),
  DECIMALS: 9, // oVND has 9 decimals
  PROGRAM_ID: new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA'), // SPL Token Program
}

// Smart Contract Program ID for oVND (replace with actual program ID)
export const OVND_PROGRAM_ID = new PublicKey('11111111111111111111111111111111') // System Program as placeholder

/**
 * Fetch oVND balance from smart contract
 * @param connection Solana connection
 * @param walletAddress User's wallet address
 * @returns Promise<number> oVND balance
 */
export async function fetchOvndBalance(
  connection: Connection,
  walletAddress: PublicKey
): Promise<number> {
  try {
    // Get the associated token address for oVND
    const associatedTokenAddress = await getAssociatedTokenAddress(
      OVND_CONFIG.MINT_ADDRESS,
      walletAddress
    )
    
    // Get the token account info
    const tokenAccount = await getAccount(connection, associatedTokenAddress)
    
    // Convert to oVND (oVND has 6 decimals)
    const balance = Number(tokenAccount.amount) / Math.pow(10, OVND_CONFIG.DECIMALS)
    
    console.log(`oVND Balance for ${walletAddress.toString()}: ${balance} oVND`)
    return balance
  } catch (error) {
    // If no token account exists, balance is 0
    if (error instanceof Error && error.message.includes('could not find account')) {
      console.log(`No oVND token account found for ${walletAddress.toString()}`)
      return 0
    } else {
      console.error('Failed to fetch oVND balance:', error)
      throw error
    }
  }
}

/**
 * Get oVND token mint information
 * @param connection Solana connection
 * @returns Promise with mint info
 */
export async function getOvndMintInfo(connection: Connection) {
  try {
    const mintInfo = await getMint(connection, OVND_CONFIG.MINT_ADDRESS)
    return {
      decimals: mintInfo.decimals,
      supply: Number(mintInfo.supply) / Math.pow(10, mintInfo.decimals),
      mintAuthority: mintInfo.mintAuthority,
      freezeAuthority: mintInfo.freezeAuthority,
    }
  } catch (error) {
    console.error('Failed to get oVND mint info:', error)
    throw error
  }
}

/**
 * Create oVND transfer instruction
 * @param from Source wallet address
 * @param to Destination wallet address
 * @param amount Amount to transfer in oVND (not in smallest unit)
 * @returns Transfer instruction
 */
export async function createOvndTransferInstruction(
  from: PublicKey,
  to: PublicKey,
  amount: number
) {
  try {
    // Get associated token addresses
    const fromTokenAddress = await getAssociatedTokenAddress(
      OVND_CONFIG.MINT_ADDRESS,
      from
    )
    
    const toTokenAddress = await getAssociatedTokenAddress(
      OVND_CONFIG.MINT_ADDRESS,
      to
    )
    
    // Convert amount to smallest unit
    const amountInSmallestUnit = Math.floor(amount * Math.pow(10, OVND_CONFIG.DECIMALS))
    
    // Create transfer instruction
    const transferInstruction = createTransferInstruction(
      fromTokenAddress,
      toTokenAddress,
      from,
      amountInSmallestUnit
    )
    
    return transferInstruction
  } catch (error) {
    console.error('Failed to create oVND transfer instruction:', error)
    throw error
  }
}

/**
 * Mint oVND tokens (only for authorized minters)
 * @param connection Solana connection
 * @param to Destination wallet address
 * @param amount Amount to mint in oVND
 * @returns Transaction
 */
export async function mintOvndTokens(
  connection: Connection,
  to: PublicKey,
  amount: number
): Promise<Transaction> {
  try {
    const transaction = new Transaction()
    
    // Get associated token address for destination
    const toTokenAddress = await getAssociatedTokenAddress(
      OVND_CONFIG.MINT_ADDRESS,
      to
    )
    
    // Convert amount to smallest unit
    const amountInSmallestUnit = Math.floor(amount * Math.pow(10, OVND_CONFIG.DECIMALS))
    
    // Add mint instruction (this would need to be implemented based on your smart contract)
    // For now, this is a placeholder
    console.log(`Would mint ${amount} oVND to ${to.toString()}`)
    
    return transaction
  } catch (error) {
    console.error('Failed to mint oVND tokens:', error)
    throw error
  }
}

/**
 * Burn oVND tokens
 * @param connection Solana connection
 * @param from Source wallet address
 * @param amount Amount to burn in oVND
 * @returns Transaction
 */
export async function burnOvndTokens(
  connection: Connection,
  from: PublicKey,
  amount: number
): Promise<Transaction> {
  try {
    const transaction = new Transaction()
    
    // Get associated token address for source
    const fromTokenAddress = await getAssociatedTokenAddress(
      OVND_CONFIG.MINT_ADDRESS,
      from
    )
    
    // Convert amount to smallest unit
    const amountInSmallestUnit = Math.floor(amount * Math.pow(10, OVND_CONFIG.DECIMALS))
    
    // Add burn instruction (this would need to be implemented based on your smart contract)
    // For now, this is a placeholder
    console.log(`Would burn ${amount} oVND from ${from.toString()}`)
    
    return transaction
  } catch (error) {
    console.error('Failed to burn oVND tokens:', error)
    throw error
  }
}

/**
 * Get oVND transaction history for a wallet
 * @param connection Solana connection
 * @param walletAddress Wallet address
 * @param limit Number of transactions to fetch
 * @returns Promise with transaction history
 */
export async function getOvndTransactionHistory(
  connection: Connection,
  walletAddress: PublicKey,
  limit: number = 10
) {
  try {
    // Get transaction signatures for the wallet
    const signatures = await connection.getSignaturesForAddress(walletAddress, { limit })
    
    // Get detailed transaction information
    const transactions = await Promise.all(
      signatures.map(async (sig) => {
        try {
          const tx = await connection.getTransaction(sig.signature, {
            commitment: 'confirmed',
            maxSupportedTransactionVersion: 0,
          })
          return {
            signature: sig.signature,
            slot: sig.slot,
            blockTime: sig.blockTime,
            transaction: tx,
          }
        } catch (error) {
          console.error(`Failed to get transaction ${sig.signature}:`, error)
          return null
        }
      })
    )
    
    return transactions.filter(tx => tx !== null)
  } catch (error) {
    console.error('Failed to get oVND transaction history:', error)
    throw error
  }
}

/**
 * Check if wallet has oVND token account
 * @param connection Solana connection
 * @param walletAddress Wallet address
 * @returns Promise<boolean>
 */
export async function hasOvndTokenAccount(
  connection: Connection,
  walletAddress: PublicKey
): Promise<boolean> {
  try {
    const associatedTokenAddress = await getAssociatedTokenAddress(
      OVND_CONFIG.MINT_ADDRESS,
      walletAddress
    )
    
    const accountInfo = await connection.getAccountInfo(associatedTokenAddress)
    return accountInfo !== null
  } catch (error) {
    console.error('Failed to check oVND token account:', error)
    return false
  }
}
