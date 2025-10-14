import { db } from "./firebase-admin";
import { USERS_COLLECTION } from "@/config/db";
import { 
  detectEnvironment, 
  getEnvironmentKey, 
  getAllEnvironmentKeys,
  type Environment 
} from "./environment-detector";
import { 
  InternalWallet, 
  MultiEnvironmentWallet, 
  EnvironmentWalletInfo
} from "@/types/wallet";
import * as bip39 from "bip39";
import { encryptMnemonic, digestAddress, encryptPrivateKey } from "./crypto";
import { deriveSolanaFromMnemonic } from "./wallet";
import { Connection, PublicKey, LAMPORTS_PER_SOL } from "@solana/web3.js";

export class UnifiedUserManager {
  private firebaseDb: FirebaseFirestore.Firestore;
  
  constructor() {
    this.firebaseDb = db();
  }
  
  /**
   * Lấy thông tin user với environment detection
   */
  async getUserData(uid: string, environment?: Environment) {
    const userRef = this.firebaseDb.collection(USERS_COLLECTION).doc(uid);
    const userDoc = await userRef.get();
    
    if (!userDoc.exists) {
      return null;
    }
    
    const user = userDoc.data()!;
    
    if (environment) {
      const envKey = getEnvironmentKey(environment);
      return {
        ...user,
        currentEnvironment: environment,
        wallet: user[envKey] || null,
        hasWallet: !!user[envKey],
      };
    }
    
    // Trả về tất cả environments
    const environmentWallets: EnvironmentWalletInfo[] = [];
    
    for (const envKey of getAllEnvironmentKeys()) {
      const env = envKey.replace('internalWallet_', '') as Environment;
      const wallet = user[envKey] as InternalWallet;
      
      if (wallet) {
        environmentWallets.push({
          environment: env,
          address: await this.getWalletAddress(wallet),
          hasWallet: true,
          createdAt: wallet.createdAt,
          lastUpdated: wallet.migratedAt || wallet.createdAt,
        });
      } else {
        environmentWallets.push({
          environment: env,
          address: '',
          hasWallet: false,
        });
      }
    }
    
    return {
      ...user,
      environmentWallets,
      availableEnvironments: environmentWallets
        .filter(env => env.hasWallet)
        .map(env => env.environment),
      hasWallet: environmentWallets.some(env => env.hasWallet),
    };
  }
  
  /**
   * Tạo ví cho environment cụ thể
   */
  async createWalletForEnvironment(uid: string, environment: Environment) {
    const envKey = getEnvironmentKey(environment);
    const userRef = this.firebaseDb.collection(USERS_COLLECTION).doc(uid);
    
    // Kiểm tra xem đã có ví cho environment này chưa
    const userDoc = await userRef.get();
    if (userDoc.exists && userDoc.data()![envKey]) {
      const existingWallet = userDoc.data()![envKey] as InternalWallet;
      const address = await this.getWalletAddress(existingWallet);
      
      // Cập nhật địa chỉ vào Firebase nếu chưa có
      if (!existingWallet.SolanaWallet && address) {
        await userRef.update({
          [`${envKey}.SolanaWallet`]: address,
          [`${envKey}.updatedAt`]: new Date(),
          updatedAt: new Date(),
        });
      }
      
      return { 
        address, 
        environment,
        message: `Wallet address displayed for ${environment}`,
        isExisting: true
      };
    }
    
    // Tạo ví mới (fallback cho trường hợp không có mnemonic)
    const mnemonic = bip39.generateMnemonic(256);
    const { address } = await deriveSolanaFromMnemonic(mnemonic);
    const enc = encryptMnemonic(mnemonic);
    const addressDigest = digestAddress(address);
    
    // Airdrop SOL cho development
    let airdropResult = null;
    if (environment === 'development') {
      try {
        console.log(`🚀 Airdropping 0.2 SOL to new wallet: ${address}`);
        const connection = new Connection("https://api.devnet.solana.com", "confirmed");
        const publicKey = new PublicKey(address);
        const signature = await connection.requestAirdrop(publicKey, 0.2 * LAMPORTS_PER_SOL);
        const confirmation = await connection.confirmTransaction(signature);
        
        if (!confirmation.value.err) {
          const balance = await connection.getBalance(publicKey);
          airdropResult = {
            success: true,
            signature,
            balance: balance / LAMPORTS_PER_SOL,
          };
          console.log(`✅ SOL airdrop successful: ${balance / LAMPORTS_PER_SOL} SOL`);
        }
      } catch (airdropError) {
        console.warn("⚠️ SOL airdrop failed:", airdropError);
      }
    }
    
    const walletData: InternalWallet = {
      encMnemonic: enc,
      addressDigest,
      createdAt: new Date(),
      version: 2, // Tăng version cho multi-environment support
      oUSDC: 0,
      oVND: 0,
      solAirdrop: airdropResult || undefined,
      environment,
      SolanaWallet: address, // Lưu địa chỉ ngay
    };
    
    await userRef.set({
      [envKey]: walletData,
      updatedAt: new Date(),
    }, { merge: true });
    
    return { 
      address, 
      environment,
      solAirdrop: airdropResult,
      message: `Wallet created for ${environment}`,
      isExisting: false
    };
  }
  
  /**
   * Migrate wallet từ environment này sang environment khác
   */
  async migrateWallet(uid: string, fromEnv: Environment, toEnv: Environment) {
    const fromKey = getEnvironmentKey(fromEnv);
    const toKey = getEnvironmentKey(toEnv);
    
    const userRef = this.firebaseDb.collection(USERS_COLLECTION).doc(uid);
    const userDoc = await userRef.get();
    
    if (!userDoc.exists) {
      throw new Error('User not found');
    }
    
    const user = userDoc.data()!;
    
    // Kiểm tra dữ liệu nguồn
    if (!user[fromKey]) {
      throw new Error(`No wallet found for environment: ${fromEnv}`);
    }
    
    // Kiểm tra dữ liệu đích
    if (user[toKey]) {
      throw new Error(`Wallet already exists for environment: ${toEnv}`);
    }
    
    // Migrate dữ liệu
    const sourceWallet = user[fromKey] as InternalWallet;
    const migratedWallet: InternalWallet = {
      ...sourceWallet,
      migratedFrom: fromEnv,
      migratedAt: new Date(),
      environment: toEnv,
    };
    
    await userRef.update({
      [toKey]: migratedWallet,
      updatedAt: new Date(),
    });
    
    const address = await this.getWalletAddress(migratedWallet);
    
    return {
      success: true,
      message: `Wallet migrated from ${fromEnv} to ${toEnv}`,
      fromEnvironment: fromEnv,
      toEnvironment: toEnv,
      address,
    };
  }
  
  /**
   * Lấy địa chỉ ví từ wallet data
   */
  public async getWalletAddress(wallet: InternalWallet): Promise<string> {
    try {
      const { addressFromEncMnemonic } = await import("./wallet");
      return await addressFromEncMnemonic(wallet.encMnemonic);
    } catch (error) {
      console.error("Error getting wallet address:", error);
      return "";
    }
  }
  
  /**
   * Lấy tất cả environments có ví
   */
  async getAvailableEnvironments(uid: string): Promise<Environment[]> {
    const userRef = this.firebaseDb.collection(USERS_COLLECTION).doc(uid);
    const userDoc = await userRef.get();
    
    if (!userDoc.exists) {
      return [];
    }
    
    const user = userDoc.data()!;
    const availableEnvs: Environment[] = [];
    
    for (const envKey of getAllEnvironmentKeys()) {
      if (user[envKey]) {
        const env = envKey.replace('internalWallet_', '') as Environment;
        availableEnvs.push(env);
      }
    }
    
    return availableEnvs;
  }
  
  /**
   * Xóa ví cho environment cụ thể
   */
  async deleteWalletForEnvironment(uid: string, environment: Environment) {
    const envKey = getEnvironmentKey(environment);
    const userRef = this.firebaseDb.collection(USERS_COLLECTION).doc(uid);
    
    await userRef.update({
      [envKey]: null,
      updatedAt: new Date(),
    });
    
    return {
      success: true,
      message: `Wallet deleted for ${environment}`,
      environment,
    };
  }

}
