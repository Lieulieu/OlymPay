import { NextRequest } from "next/server";

export type Environment = 'development' | 'production' | 'staging';

export function detectEnvironment(req: NextRequest): Environment {
  const origin = req.headers.get('origin') || req.headers.get('referer') || '';
  const host = req.headers.get('host') || '';
  
  // Check for localhost patterns
  if (origin.includes('localhost') || 
      origin.includes('127.0.0.1') || 
      host.includes('localhost') ||
      host.includes('127.0.0.1')) {
    return 'development';
  }
  
  // Check for staging patterns
  if (origin.includes('staging') || 
      origin.includes('test') ||
      host.includes('staging')) {
    return 'staging';
  }
  
  // Check for production patterns
  if (origin.includes('olympay.com.vn') || 
      host.includes('olympay.com.vn')) {
    return 'production';
  }
  
  // Fallback to NODE_ENV
  const nodeEnv = process.env.NODE_ENV;
  if (nodeEnv === 'production') return 'production';
  
  return 'development';
}

export function getEnvironmentPrefix(env: Environment): string {
  switch (env) {
    case 'development':
      return 'dev_';
    case 'staging':
      return 'staging_';
    case 'production':
      return 'prod_';
    default:
      return 'dev_';
  }
}

export function getEnvironmentKey(env: Environment): string {
  return `internalWallet_${env}`;
}

export function getAllEnvironmentKeys(): string[] {
  return [
    'internalWallet_development',
    'internalWallet_staging', 
    'internalWallet_production'
  ];
}

export function isValidEnvironment(env: string): env is Environment {
  return ['development', 'staging', 'production'].includes(env);
}
