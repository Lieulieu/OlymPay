"use client";

import { useAuthMethod } from "@/hooks/use-auth-method";
import { useUserStore } from "@/stores/user-store";

export default function AuthMethodDebugger() {
  const { currentUser } = useUserStore();
  const { authMethod, isGoogleAuth, isWalletAuth, canCreateInternalWallet } = useAuthMethod();

  return (
    <div className="card bg-base-200 shadow-xl p-6">
      <h3 className="card-title text-lg mb-4">🔍 Auth Method Debugger</h3>
      
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <span className="font-medium">Auth Method:</span>
          <span className={`badge ${authMethod === 'google' ? 'badge-success' : 'badge-info'}`}>
            {authMethod}
          </span>
        </div>
        
        <div className="flex items-center gap-2">
          <span className="font-medium">Is Google Auth:</span>
          <span className={`badge ${isGoogleAuth ? 'badge-success' : 'badge-error'}`}>
            {isGoogleAuth ? 'Yes' : 'No'}
          </span>
        </div>
        
        <div className="flex items-center gap-2">
          <span className="font-medium">Is Wallet Auth:</span>
          <span className={`badge ${isWalletAuth ? 'badge-success' : 'badge-error'}`}>
            {isWalletAuth ? 'Yes' : 'No'}
          </span>
        </div>
        
        <div className="flex items-center gap-2">
          <span className="font-medium">Can Create Internal Wallet:</span>
          <span className={`badge ${canCreateInternalWallet ? 'badge-success' : 'badge-error'}`}>
            {canCreateInternalWallet ? 'Yes' : 'No'}
          </span>
        </div>
        
        <div className="divider"></div>
        
        <div className="text-sm">
          <p className="font-medium mb-2">User Data:</p>
          <pre className="bg-base-300 p-3 rounded text-xs overflow-auto">
            {JSON.stringify({
              uid: currentUser?.uid,
              externalWallet: currentUser?.externalWallet,
              authMethod: currentUser?.authMethod,
              hasInternalWallet: !!currentUser?.internalWallet?.address,
            }, null, 2)}
          </pre>
        </div>
        
        <div className="text-sm">
          <p className="font-medium mb-2">Expected Behavior:</p>
          <ul className="list-disc list-inside space-y-1 text-xs">
            <li>
              <strong>Google OAuth:</strong> Can create internal wallet (button enabled)
            </li>
            <li>
              <strong>Wallet Auth:</strong> Cannot create internal wallet (button disabled)
            </li>
            <li>
              <strong>MetaMask Auth:</strong> Cannot create internal wallet (button disabled)
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
