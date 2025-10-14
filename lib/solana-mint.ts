// Solana oVND minting utility
import {
  Connection,
  Keypair,
  PublicKey,
  Transaction,
  SystemProgram,
  LAMPORTS_PER_SOL,
  sendAndConfirmTransaction,
} from "@solana/web3.js";
import {
  createMintToInstruction,
  getAssociatedTokenAddress,
  createAssociatedTokenAccountInstruction,
  getAccount,
} from "@solana/spl-token";

// Mock oVND minting function
export const mockMintOVND = async (
  userAddress: string,
  amount: number, // Amount in VND (e.g., 1000000 = 1,000,000 VND)
  mintKeypairHex?: string
): Promise<{ success: boolean; txHash?: string; error?: string }> => {
  try {
    console.log("🪙 Mock Minting oVND...");
    console.log("User Address:", userAddress);
    console.log("Amount (VND):", amount);
    console.log("Amount (oVND):", amount); // 1:1 ratio

    // Mock transaction hash
    const mockTxHash = `mock_${Date.now()}_${Math.random()
      .toString(36)
      .substr(2, 9)}`;

    // Simulate minting delay
    await new Promise((resolve) => setTimeout(resolve, 1000));

    console.log("✅ Mock oVND minting successful");
    console.log("Transaction Hash:", mockTxHash);
    console.log("Minted:", amount / 1000, "oVND");

    return {
      success: true,
      txHash: mockTxHash,
    };
  } catch (error) {
    console.error("❌ Mock oVND minting failed:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
};

// Real Solana minting function for oVND token
export const mintOVND = async (
  userAddress: string,
  amount: number,
  mintKeypairHex: string
): Promise<{ success: boolean; txHash?: string; error?: string }> => {
  try {
    console.log("🪙 Real Minting oVND Token...");
    console.log("User Address:", userAddress);
    console.log("Amount (VND):", amount);
    console.log("Amount (oVND):", amount); // 1:1 ratio

    // Connect to Solana devnet
    const connection = new Connection(
      "https://api.devnet.solana.com",
      "confirmed"
    );

    // Create keypair from hex string
    const mintKeypair = Keypair.fromSecretKey(
      new Uint8Array(
        mintKeypairHex.match(/.{1,2}/g)!.map((byte) => parseInt(byte, 16))
      )
    );

    // oVND Token Address from Solana Explorer
    const oVND_MINT_ADDRESS = "EbNKsXtiUQQ972QEF172kRQPhVb6MJpx5NwZ6LX8H69b";
    const mintPublicKey = new PublicKey(oVND_MINT_ADDRESS);
    const userPublicKey = new PublicKey(userAddress);

    console.log("oVND Mint Address:", oVND_MINT_ADDRESS);
    console.log("Mint Authority:", mintKeypair.publicKey.toString());
    console.log("User Address:", userAddress);

    // Get user's associated token account
    const userTokenAccount = await getAssociatedTokenAddress(
      mintPublicKey,
      userPublicKey
    );

    console.log("User Token Account:", userTokenAccount.toString());

    // Check if token account exists
    let transaction = new Transaction();

    try {
      await getAccount(connection, userTokenAccount);
      console.log("Token account exists");
    } catch (error) {
      console.log("Creating token account...");
      // Create associated token account if it doesn't exist
      transaction.add(
        createAssociatedTokenAccountInstruction(
          mintKeypair.publicKey, // payer
          userTokenAccount, // associated token account
          userPublicKey, // owner
          mintPublicKey // mint
        )
      );
    }

    // Calculate amount in token units (oVND has 9 decimals)
    const tokenAmount = Math.floor(amount * Math.pow(10, 9)); // 1 VND = 1 oVND with 9 decimals

    console.log("Token Amount (with decimals):", tokenAmount);

    // Add mint instruction
    transaction.add(
      createMintToInstruction(
        mintPublicKey, // mint
        userTokenAccount, // destination
        mintKeypair.publicKey, // authority (mint authority)
        tokenAmount // amount
      )
    );

    // Get recent blockhash
    const { blockhash } = await connection.getLatestBlockhash();
    transaction.recentBlockhash = blockhash;
    transaction.feePayer = mintKeypair.publicKey;

    // Sign transaction
    transaction.sign(mintKeypair);

    // Send and confirm transaction
    const txHash = await sendAndConfirmTransaction(
      connection,
      transaction,
      [mintKeypair],
      { commitment: "confirmed" }
    );

    console.log("✅ Real oVND minting successful");
    console.log("Transaction Hash:", txHash);
    console.log(
      "Explorer URL:",
      `https://explorer.solana.com/tx/${txHash}?cluster=devnet`
    );

    return {
      success: true,
      txHash: txHash,
    };
  } catch (error) {
    console.error("❌ Real oVND minting failed:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
};

// Manager wallet minting function - supports both oVND and oUSDC
export const mintFromManagerWallet = async (
  toAddress: string,
  amount: number,
  tokenType: "oVND" | "oUSDC" = "oVND"
): Promise<{
  success: boolean;
  txHash?: string;
  error?: string;
  fromAddress?: string;
  explorerUrl?: string;
}> => {
  try {
    console.log("🏦 Manager Wallet Minting...");
    console.log("Token Type:", tokenType);
    console.log("To Address:", toAddress);
    console.log("Amount:", amount);

    // Check if we should use mock or real minting
    const useRealMinting = process.env.USE_REAL_SOLANA_MINTING === "true";

    if (!useRealMinting) {
      // Use mock minting
      const mockTxHash = `manager_mock_${Date.now()}_${Math.random()
        .toString(36)
        .substr(2, 9)}`;

      // Simulate minting delay
      await new Promise((resolve) => setTimeout(resolve, 1000));

      console.log("✅ Mock Manager Wallet minting successful");
      console.log("Transaction Hash:", mockTxHash);
      console.log("Minted:", amount, tokenType);

      return {
        success: true,
        txHash: mockTxHash,
        fromAddress: "manager_wallet_mock_address",
      };
    }

    // Real minting - Get manager keypair from environment variables
    let managerKeypair: Keypair;
    let managerPublicKey: string;

    // Try different methods to get manager keypair from .env
    try {
      // Method 1: Try OUSDC_MANAGER_WALLET_KEYPAIR_BASE64 first
      const keypairBase64 = process.env.OUSDC_MANAGER_WALLET_KEYPAIR_BASE64;
      if (keypairBase64) {
        console.log("🔑 Using OUSDC_MANAGER_WALLET_KEYPAIR_BASE64");
        const privateKeyBytes = Buffer.from(keypairBase64, "base64");
        managerKeypair = Keypair.fromSecretKey(privateKeyBytes);
        managerPublicKey = managerKeypair.publicKey.toString();
      } else {
        throw new Error("OUSDC_MANAGER_WALLET_KEYPAIR_BASE64 not found");
      }
    } catch {
      try {
        // Method 2: Try OUSDC_MANAGER_WALLET_PRIVATE_KEY
        const privateKey = process.env.OUSDC_MANAGER_WALLET_PRIVATE_KEY;
        if (privateKey) {
          console.log("🔑 Using OUSDC_MANAGER_WALLET_PRIVATE_KEY");
          managerKeypair = Keypair.fromSecretKey(
            new Uint8Array(
              privateKey.match(/.{1,2}/g)!.map((byte) => parseInt(byte, 16))
            )
          );
          managerPublicKey = managerKeypair.publicKey.toString();
        } else {
          throw new Error("OUSDC_MANAGER_WALLET_PRIVATE_KEY not found");
        }
      } catch {
        try {
          // Method 3: Try OUSDC_TOKEN (hex format)
          const ousdcToken = process.env.OUSDC_TOKEN;
          if (ousdcToken) {
            console.log("🔑 Using OUSDC_TOKEN");
            managerKeypair = Keypair.fromSecretKey(
              new Uint8Array(
                ousdcToken.match(/.{1,2}/g)!.map((byte) => parseInt(byte, 16))
              )
            );
            managerPublicKey = managerKeypair.publicKey.toString();
          } else {
            throw new Error("OUSDC_TOKEN not found");
          }
        } catch {
          try {
            // Method 4: Try OUSDC_MANAGER_WALLET_MNEMONIC
            const mnemonic = process.env.OUSDC_MANAGER_WALLET_MNEMONIC;
            if (mnemonic) {
              console.log("🔑 Using OUSDC_MANAGER_WALLET_MNEMONIC");
              const { deriveSolanaFromMnemonic } = await import(
                "./mnemonic-utils"
              );
              const result = await deriveSolanaFromMnemonic(mnemonic);
              managerKeypair = result.keypair;
              managerPublicKey = result.address;
            } else {
              throw new Error("OUSDC_MANAGER_WALLET_MNEMONIC not found");
            }
          } catch {
            throw new Error(
              "No valid manager wallet configuration found in environment variables. " +
                "Please set one of: OUSDC_MANAGER_WALLET_KEYPAIR_BASE64, OUSDC_MANAGER_WALLET_PRIVATE_KEY, OUSDC_TOKEN, or OUSDC_MANAGER_WALLET_MNEMONIC"
            );
          }
        }
      }
    }

    // Verify the public key matches if provided
    const expectedPublicKey = process.env.OUSDC_MANAGER_WALLET_PUBLIC_KEY;
    if (expectedPublicKey && managerPublicKey !== expectedPublicKey) {
      console.warn(
        "⚠️ Warning: Manager public key doesn't match expected value"
      );
      console.warn("Expected:", expectedPublicKey);
      console.warn("Actual:", managerPublicKey);
    }

    // Connect to Solana devnet
    const connection = new Connection(
      "https://api.devnet.solana.com",
      "confirmed"
    );

    // Token addresses
    const oVND_MINT_ADDRESS = "EbNKsXtiUQQ972QEF172kRQPhVb6MJpx5NwZ6LX8H69b";
    const oUSDC_MINT_ADDRESS = "FpRsA1yJtmPJRhjKqbBUN8SPQEiMf2Fa8fyMY1fi1LjV";

    const mintAddress =
      tokenType === "oVND" ? oVND_MINT_ADDRESS : oUSDC_MINT_ADDRESS;
    const mintPublicKey = new PublicKey(mintAddress);
    const toPublicKey = new PublicKey(toAddress);

    console.log(`${tokenType} Mint Address:`, mintAddress);
    console.log("Manager Wallet Address:", managerPublicKey);
    console.log("To Address:", toAddress);

    // Get destination's associated token account
    const toTokenAccount = await getAssociatedTokenAddress(
      mintPublicKey,
      toPublicKey
    );

    console.log("To Token Account:", toTokenAccount.toString());

    // Check if token account exists and create if needed
    let transaction = new Transaction();

    try {
      await getAccount(connection, toTokenAccount);
      console.log("Token account exists");
    } catch (error) {
      console.log("Creating token account...");
      // Create associated token account if it doesn't exist
      transaction.add(
        createAssociatedTokenAccountInstruction(
          managerKeypair.publicKey, // payer
          toTokenAccount, // associated token account
          toPublicKey, // owner
          mintPublicKey // mint
        )
      );
    }

    // Calculate amount in token units (both tokens have 9 decimals)
    const tokenAmount = Math.floor(amount * Math.pow(10, 9));

    console.log("Token Amount (with decimals):", tokenAmount);

    // Add mint instruction
    transaction.add(
      createMintToInstruction(
        mintPublicKey, // mint
        toTokenAccount, // destination
        managerKeypair.publicKey, // authority (mint authority)
        tokenAmount // amount
      )
    );

    // Get recent blockhash
    const { blockhash } = await connection.getLatestBlockhash();
    transaction.recentBlockhash = blockhash;
    transaction.feePayer = managerKeypair.publicKey;

    // Sign transaction
    transaction.sign(managerKeypair);

    // Send and confirm transaction
    const txHash = await sendAndConfirmTransaction(
      connection,
      transaction,
      [managerKeypair],
      { commitment: "confirmed" }
    );

    const explorerUrl = `https://explorer.solana.com/tx/${txHash}?cluster=devnet`;

    console.log("✅ Manager Wallet minting successful");
    console.log("Transaction Hash:", txHash);
    console.log("Explorer URL:", explorerUrl);

    return {
      success: true,
      txHash: txHash,
      fromAddress: managerPublicKey,
      explorerUrl: explorerUrl,
    };
  } catch (error) {
    console.error("❌ Manager Wallet minting failed:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
};

// Get minting function based on environment
export const getMintingFunction = () => {
  const isProduction = process.env.NODE_ENV === "production";
  const useRealMinting = process.env.USE_REAL_SOLANA_MINTING === "true";

  if (isProduction && useRealMinting) {
    return mintOVND;
  } else {
    return mockMintOVND;
  }
};
