import EnvironmentDebugger from "@/components/EnvironmentDebugger";

export default function EnvironmentTestPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-8">
          Environment & Multi-Wallet Test
        </h1>
        
        <div className="alert alert-info mb-6">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="stroke-current shrink-0 w-6 h-6">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
          </svg>
          <div>
            <h3 className="font-bold">Environment Testing</h3>
            <div className="text-xs">
              This page tests the multi-environment wallet system. 
              You can create wallets for different environments and migrate between them.
            </div>
          </div>
        </div>

        <EnvironmentDebugger />
        
        <div className="mt-8 p-4 bg-base-200 rounded-lg">
          <h3 className="font-semibold mb-2">How to Test:</h3>
          <ol className="list-decimal list-inside space-y-1 text-sm">
            <li>Access this page from different environments (localhost:6789, production domain)</li>
            <li>Create wallets for different environments</li>
            <li>Test migration between environments</li>
            <li>Check that cookies work correctly in each environment</li>
            <li>Verify that data persists across environments</li>
          </ol>
        </div>
      </div>
    </div>
  );
}
