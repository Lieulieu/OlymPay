#!/usr/bin/env node

/**
 * Script để kiểm tra Firebase configuration
 * Usage: node scripts/check-firebase-config.js
 */

const fs = require('fs');
const path = require('path');

function checkEnvironmentVariables() {
  console.log('🔍 Checking Firebase Environment Variables...\n');
  
  const requiredVars = [
    'FIREBASE_SERVICE_ACCOUNT_B64',
    'NEXT_PUBLIC_FIREBASE_API_KEY',
    'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN',
    'NEXT_PUBLIC_FIREBASE_PROJECT_ID',
    'NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET',
    'NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID',
    'NEXT_PUBLIC_FIREBASE_APP_ID'
  ];
  
  const missing = [];
  const present = [];
  
  requiredVars.forEach(varName => {
    if (process.env[varName]) {
      present.push(varName);
    } else {
      missing.push(varName);
    }
  });
  
  console.log('✅ Present variables:');
  present.forEach(v => console.log(`  - ${v}`));
  
  if (missing.length > 0) {
    console.log('\n❌ Missing variables:');
    missing.forEach(v => console.log(`  - ${v}`));
  }
  
  return { present, missing };
}

function checkServiceAccount() {
  console.log('\n🔍 Checking Service Account...\n');
  
  const b64 = process.env.FIREBASE_SERVICE_ACCOUNT_B64;
  if (!b64) {
    console.log('❌ FIREBASE_SERVICE_ACCOUNT_B64 not set');
    return null;
  }
  
  try {
    const json = Buffer.from(b64, 'base64').toString('utf8');
    const sa = JSON.parse(json);
    
    console.log('✅ Service Account Info:');
    console.log(`  - Project ID: ${sa.project_id}`);
    console.log(`  - Client Email: ${sa.client_email}`);
    console.log(`  - Type: ${sa.type}`);
    console.log(`  - Has Private Key: ${!!sa.private_key}`);
    
    return sa;
  } catch (error) {
    console.log('❌ Failed to parse service account:', error.message);
    return null;
  }
}

function checkClientConfig() {
  console.log('\n🔍 Checking Client Configuration...\n');
  
  const clientProjectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  const authDomain = process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN;
  const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
  
  console.log('✅ Client Config:');
  console.log(`  - Project ID: ${clientProjectId}`);
  console.log(`  - Auth Domain: ${authDomain}`);
  console.log(`  - API Key: ${apiKey ? apiKey.substring(0, 10) + '...' : 'Not set'}`);
  
  return { clientProjectId, authDomain, apiKey };
}

function checkProjectMatch(serviceAccount, clientConfig) {
  console.log('\n🔍 Checking Project ID Match...\n');
  
  if (!serviceAccount || !clientConfig) {
    console.log('❌ Cannot check match - missing service account or client config');
    return false;
  }
  
  const serverProjectId = serviceAccount.project_id;
  const clientProjectId = clientConfig.clientProjectId;
  
  console.log(`Server Project ID: ${serverProjectId}`);
  console.log(`Client Project ID: ${clientProjectId}`);
  
  if (serverProjectId === clientProjectId) {
    console.log('✅ Project IDs match!');
    return true;
  } else {
    console.log('❌ Project IDs do not match!');
    console.log('\n🛠️  Solution:');
    console.log('1. Go to Firebase Console: https://console.firebase.google.com/');
    console.log(`2. Select project: ${clientProjectId}`);
    console.log('3. Go to Project Settings → Service Accounts');
    console.log('4. Generate new private key');
    console.log('5. Update FIREBASE_SERVICE_ACCOUNT_B64 with new key');
    return false;
  }
}

function main() {
  console.log('🚀 Firebase Configuration Checker\n');
  console.log('=====================================\n');
  
  // Check environment variables
  const { present, missing } = checkEnvironmentVariables();
  
  if (missing.length > 0) {
    console.log('\n❌ Missing required environment variables. Please set them first.');
    process.exit(1);
  }
  
  // Check service account
  const serviceAccount = checkServiceAccount();
  
  // Check client config
  const clientConfig = checkClientConfig();
  
  // Check project match
  const match = checkProjectMatch(serviceAccount, clientConfig);
  
  console.log('\n=====================================');
  if (match) {
    console.log('✅ Firebase configuration looks good!');
  } else {
    console.log('❌ Firebase configuration needs fixing.');
    console.log('\n📖 See docs/firebase-service-account-setup.md for detailed instructions.');
  }
}

// Load environment variables
require('dotenv').config({ path: '.env.production' });

main();
