"use client";

import { useState } from "react";
import { toast } from "sonner";

interface FirebaseConfig {
  hasServiceAccount: boolean;
  hasServiceAccountRaw: boolean;
  hasCredentialsPath: boolean;
  nodeEnv: string;
}

interface AuthTest {
  success: boolean;
  customTokenLength?: number;
  message?: string;
  error?: string;
  code?: string;
}

interface FirestoreTest {
  success: boolean;
  hasData?: boolean;
  message?: string;
  error?: string;
  code?: string;
}

interface FirebaseDebugResult {
  ok: boolean;
  config: FirebaseConfig;
  authTest: AuthTest;
  firestoreTest: FirestoreTest;
  timestamp: string;
}

export default function FirebaseDebugger() {
  const [debugResult, setDebugResult] = useState<FirebaseDebugResult | null>(null);
  const [clientConfigResult, setClientConfigResult] = useState<any>(null);
  const [serviceAccountResult, setServiceAccountResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [loadingClient, setLoadingClient] = useState(false);
  const [loadingServiceAccount, setLoadingServiceAccount] = useState(false);
  const [testingToken, setTestingToken] = useState(false);
  const [testUid, setTestUid] = useState("test-user-" + Date.now());

  const checkFirebaseConfig = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/debug/firebase-config');
      const data = await response.json();
      setDebugResult(data);
      
      if (data.ok) {
        toast.success('Firebase configuration checked');
      } else {
        toast.error('Failed to check Firebase configuration');
      }
    } catch (error) {
      console.error('Error checking Firebase config:', error);
      toast.error('Error checking Firebase configuration');
    } finally {
      setLoading(false);
    }
  };

  const checkClientConfig = async () => {
    setLoadingClient(true);
    try {
      const response = await fetch('/api/debug/firebase-client-config');
      const data = await response.json();
      setClientConfigResult(data);
      
      if (data.ok) {
        toast.success('Client configuration checked');
      } else {
        toast.error('Failed to check client configuration');
      }
    } catch (error) {
      console.error('Error checking client config:', error);
      toast.error('Error checking client configuration');
    } finally {
      setLoadingClient(false);
    }
  };

  const checkServiceAccount = async () => {
    setLoadingServiceAccount(true);
    try {
      const response = await fetch('/api/debug/service-account-info');
      const data = await response.json();
      setServiceAccountResult(data);
      
      if (data.ok) {
        toast.success('Service account info checked');
      } else {
        toast.error('Failed to check service account info');
      }
    } catch (error) {
      console.error('Error checking service account:', error);
      toast.error('Error checking service account info');
    } finally {
      setLoadingServiceAccount(false);
    }
  };

  const testCustomToken = async () => {
    setTestingToken(true);
    try {
      const response = await fetch('/api/debug/test-custom-token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ testUid }),
      });
      
      const data = await response.json();
      
      if (data.ok) {
        toast.success('Custom token test completed');
        console.log('Custom Token Test Result:', data);
      } else {
        toast.error('Custom token test failed');
        console.error('Custom Token Test Error:', data);
      }
    } catch (error) {
      console.error('Error testing custom token:', error);
      toast.error('Error testing custom token');
    } finally {
      setTestingToken(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="card bg-base-100 shadow-xl">
        <div className="card-body">
          <h2 className="card-title">Firebase Configuration Debugger</h2>
          
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
              <button
                className="btn btn-primary"
                onClick={checkFirebaseConfig}
                disabled={loading}
              >
                {loading ? (
                  <span className="loading loading-spinner loading-sm"></span>
                ) : (
                  'Server Config'
                )}
              </button>
              
              <button
                className="btn btn-secondary"
                onClick={checkClientConfig}
                disabled={loadingClient}
              >
                {loadingClient ? (
                  <span className="loading loading-spinner loading-sm"></span>
                ) : (
                  'Client Config'
                )}
              </button>
              
              <button
                className="btn btn-accent"
                onClick={checkServiceAccount}
                disabled={loadingServiceAccount}
              >
                {loadingServiceAccount ? (
                  <span className="loading loading-spinner loading-sm"></span>
                ) : (
                  'Service Account'
                )}
              </button>
            </div>

            {debugResult && (
              <div className="space-y-4">
                <div className="divider"></div>
                
                <h3 className="text-lg font-semibold">Configuration</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="stat">
                    <div className="stat-title">Service Account B64</div>
                    <div className="stat-value text-sm">
                      {debugResult.config.hasServiceAccount ? "✅ Set" : "❌ Not Set"}
                    </div>
                  </div>
                  <div className="stat">
                    <div className="stat-title">Service Account Raw</div>
                    <div className="stat-value text-sm">
                      {debugResult.config.hasServiceAccountRaw ? "✅ Set" : "❌ Not Set"}
                    </div>
                  </div>
                  <div className="stat">
                    <div className="stat-title">Credentials Path</div>
                    <div className="stat-value text-sm">
                      {debugResult.config.hasCredentialsPath ? "✅ Set" : "❌ Not Set"}
                    </div>
                  </div>
                  <div className="stat">
                    <div className="stat-title">Node Environment</div>
                    <div className="stat-value text-sm">{debugResult.config.nodeEnv}</div>
                  </div>
                </div>

                <div className="divider"></div>
                
                <h3 className="text-lg font-semibold">Authentication Test</h3>
                <div className={`alert ${debugResult.authTest.success ? 'alert-success' : 'alert-error'}`}>
                  <div>
                    <h4 className="font-bold">
                      {debugResult.authTest.success ? '✅ Success' : '❌ Failed'}
                    </h4>
                    <div className="text-sm">
                      {debugResult.authTest.message || debugResult.authTest.error}
                    </div>
                    {debugResult.authTest.code && (
                      <div className="text-xs opacity-70">
                        Code: {debugResult.authTest.code}
                      </div>
                    )}
                  </div>
                </div>

                <h3 className="text-lg font-semibold">Firestore Test</h3>
                <div className={`alert ${debugResult.firestoreTest.success ? 'alert-success' : 'alert-error'}`}>
                  <div>
                    <h4 className="font-bold">
                      {debugResult.firestoreTest.success ? '✅ Success' : '❌ Failed'}
                    </h4>
                    <div className="text-sm">
                      {debugResult.firestoreTest.message || debugResult.firestoreTest.error}
                    </div>
                    {debugResult.firestoreTest.code && (
                      <div className="text-xs opacity-70">
                        Code: {debugResult.firestoreTest.code}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {clientConfigResult && (
              <div className="space-y-4">
                <div className="divider"></div>
                
                <h3 className="text-lg font-semibold">Client Configuration</h3>
                <div className="grid grid-cols-2 gap-4">
                  {Object.entries(clientConfigResult.clientConfig || {}).map(([key, value]) => (
                    <div key={key} className="stat">
                      <div className="stat-title">{key}</div>
                      <div className="stat-value text-sm">{String(value)}</div>
                    </div>
                  ))}
                </div>

                {clientConfigResult.serverProjectInfo && (
                  <div className="mt-4">
                    <h4 className="font-semibold mb-2">Server Project Info:</h4>
                    <div className="bg-base-200 p-3 rounded">
                      <pre className="text-xs">
                        {JSON.stringify(clientConfigResult.serverProjectInfo, null, 2)}
                      </pre>
                    </div>
                  </div>
                )}

                {clientConfigResult.clientValues && (
                  <div className="mt-4">
                    <h4 className="font-semibold mb-2">Client Values:</h4>
                    <div className="bg-base-200 p-3 rounded">
                      <pre className="text-xs">
                        {JSON.stringify(clientConfigResult.clientValues, null, 2)}
                      </pre>
                    </div>
                  </div>
                )}
              </div>
            )}

            {serviceAccountResult && (
              <div className="space-y-4">
                <div className="divider"></div>
                
                <h3 className="text-lg font-semibold">Service Account Info</h3>
                
                {serviceAccountResult.comparison && (
                  <div className={`alert ${serviceAccountResult.comparison.match ? 'alert-success' : 'alert-error'}`}>
                    <div>
                      <h4 className="font-bold">
                        Project ID Comparison: {serviceAccountResult.comparison.status}
                      </h4>
                      <div className="text-sm">
                        <div>Client: {serviceAccountResult.comparison.clientProjectId}</div>
                        <div>Server: {serviceAccountResult.comparison.serverProjectId}</div>
                      </div>
                    </div>
                  </div>
                )}

                {serviceAccountResult.serviceAccountInfo && (
                  <div className="mt-4">
                    <h4 className="font-semibold mb-2">Service Account Details:</h4>
                    <div className="bg-base-200 p-3 rounded">
                      <pre className="text-xs">
                        {JSON.stringify(serviceAccountResult.serviceAccountInfo, null, 2)}
                      </pre>
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="divider"></div>
            
            <h3 className="text-lg font-semibold">Custom Token Test</h3>
            <div className="flex gap-2">
              <input
                type="text"
                className="input input-bordered flex-1"
                placeholder="Test UID"
                value={testUid}
                onChange={(e) => setTestUid(e.target.value)}
              />
              <button
                className="btn btn-secondary"
                onClick={testCustomToken}
                disabled={testingToken}
              >
                {testingToken ? (
                  <span className="loading loading-spinner loading-sm"></span>
                ) : (
                  'Test Custom Token'
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
