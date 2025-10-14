import FirebaseDebugger from "@/components/FirebaseDebugger";

export default function FirebaseDebugPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-8">
          Firebase Configuration Debug
        </h1>
        
        <div className="alert alert-warning mb-6">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="stroke-current shrink-0 w-6 h-6">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 16.5c-.77.833.192 2.5 1.732 2.5z"></path>
          </svg>
          <div>
            <h3 className="font-bold">Firebase Custom Token Mismatch Error</h3>
            <div className="text-xs">
              This page helps debug the "auth/custom-token-mismatch" error by checking Firebase configuration and testing custom token creation.
            </div>
          </div>
        </div>

        <FirebaseDebugger />
        
        <div className="mt-8 p-4 bg-base-200 rounded-lg">
          <h3 className="font-semibold mb-2">Common Causes of auth/custom-token-mismatch:</h3>
          <ul className="list-disc list-inside space-y-1 text-sm">
            <li><strong>Wrong Service Account:</strong> Using service account from different Firebase project</li>
            <li><strong>Environment Variables:</strong> FIREBASE_SERVICE_ACCOUNT_B64 not set correctly</li>
            <li><strong>Project Mismatch:</strong> Custom token created for project A but used in project B</li>
            <li><strong>Invalid Credentials:</strong> Service account key is corrupted or expired</li>
            <li><strong>Network Issues:</strong> Firebase services not accessible</li>
          </ul>
        </div>

        <div className="mt-4 p-4 bg-info/10 rounded-lg">
          <h3 className="font-semibold mb-2 text-info">Solutions:</h3>
          <ul className="list-disc list-inside space-y-1 text-sm text-info">
            <li>Check that FIREBASE_SERVICE_ACCOUNT_B64 is set correctly</li>
            <li>Verify the service account belongs to the correct Firebase project</li>
            <li>Ensure the service account has proper permissions</li>
            <li>Check Firebase project configuration in Firebase Console</li>
            <li>Verify network connectivity to Firebase services</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
