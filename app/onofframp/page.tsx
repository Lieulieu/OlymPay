'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { CreditCardIcon, ArrowPathIcon, CheckCircleIcon } from '@heroicons/react/24/outline'
import PaymentForm from '@/components/PaymentForm'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import { useWallet } from '@/contexts/WalletContext'

export default function OnOffRampPage() {
  const [activeTab, setActiveTab] = useState<'onramp' | 'offramp'>('onramp')
  const { connected, usdcBalance } = useWallet()

  return (
    <main className="min-h-screen">
      <Header />
      <div className="bg-base-100 pt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl md:text-5xl font-bold text-primary mb-6">
            On/Off Ramp
          </h1>
          <p className="text-xl text-secondary max-w-3xl mx-auto">
            Seamlessly convert between traditional payment methods and stablecoin oUSDC on U2U Network, Solana and Base networks.
          </p>
        </motion.div>

        {/* Tab Navigation */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="flex justify-center mb-8"
        >
          <div className="tabs tabs-boxed bg-base-200">
            <button
              className={`tab ${activeTab === 'onramp' ? 'tab-active' : ''}`}
              onClick={() => setActiveTab('onramp')}
            >
              <CreditCardIcon className="w-5 h-5 mr-2" />
              On-Ramp (Buy oUSDC)
            </button>
            <button
              className={`tab ${activeTab === 'offramp' ? 'tab-active' : ''}`}
              onClick={() => setActiveTab('offramp')}
            >
              <ArrowPathIcon className="w-5 h-5 mr-2" />
              Off-Ramp (Sell stablecoin)
            </button>
          </div>
        </motion.div>

        {/* Content */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="max-w-4xl mx-auto"
        >
          {activeTab === 'onramp' ? (
            <div className="card bg-base-200 shadow-xl">
              <div className="card-body p-8">
                <div className="flex items-center mb-6">
                  <CreditCardIcon className="w-8 h-8 text-primary mr-3" />
                  <h2 className="text-2xl font-bold text-primary">Buy oUSDC with Debit Card</h2>
                </div>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Payment Form */}
                  <div>
                    <PaymentForm />
                  </div>
                  
                  {/* Info Panel */}
                  <div className="space-y-6">
                  <div className="alert alert-info">
                      <CheckCircleIcon className="w-6 h-6" />
                      <div>
                        <h3 className="font-bold">Stablecoin Balance</h3>
                        <div className="text-sm">
                          {connected ? (
                            usdcBalance !== null ? (
                              `${usdcBalance.toFixed(2)} USDC`
                            ) : (
                              'Loading USDC balance...'
                            )
                          ) : (
                            'Connect wallet to view USDC balance'
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="alert alert-info">
                      <CheckCircleIcon className="w-6 h-6" />
                      <div>
                        <h3 className="font-bold">Instant Processing</h3>
                        <div className="text-sm">Your stablecoin will be available immediately after payment confirmation.</div>
                      </div>
                    </div>
                    
                    <div className="alert alert-success">
                      <CheckCircleIcon className="w-6 h-6" />
                      <div>
                        <h3 className="font-bold">Low Fees</h3>
                        <div className="text-sm">Only 0.1% transaction fee for all supported currencies (USD, EUR, THB).</div>
                      </div>
                    </div>
                    
                    <div className="alert alert-warning">
                      <CheckCircleIcon className="w-6 h-6" />
                      <div>
                        <h3 className="font-bold">Supported Networks</h3>
                        <div className="text-sm">U2U Network, Solana and Base networks supported.</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="card bg-base-200 shadow-xl">
              <div className="card-body p-8 text-center">
                <ArrowPathIcon className="w-16 h-16 text-secondary mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-primary mb-4">Off-Ramp Coming Soon</h2>
                <p className="text-secondary mb-6">
                  We're working on bringing you the ability to sell your stablecoin back to fiat currency.
                  Stay tuned for updates!
                </p>
                <div className="badge badge-primary badge-lg">Coming Q2 2025</div>
              </div>
            </div>
          )}
        </motion.div>

        {/* Features */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="mt-16"
        >
          <h3 className="text-2xl font-bold text-primary text-center mb-8">Why Choose OlymPay?</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="card bg-base-200 shadow-lg">
              <div className="card-body text-center">
                <div className="text-4xl mb-4">🔒</div>
                <h4 className="card-title justify-center">Secure</h4>
                <p className="text-sm text-secondary">Bank-level security with Stripe integration</p>
              </div>
            </div>
            <div className="card bg-base-200 shadow-lg">
              <div className="card-body text-center">
                <div className="text-4xl mb-4">⚡</div>
                <h4 className="card-title justify-center">Fast</h4>
                <p className="text-sm text-secondary">Instant processing and settlement</p>
              </div>
            </div>
            <div className="card bg-base-200 shadow-lg">
              <div className="card-body text-center">
                <div className="text-4xl mb-4">🌐</div>
                <h4 className="card-title justify-center">Global</h4>
                <p className="text-sm text-secondary">Support for multiple currencies and regions</p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
      </div>
      <Footer />
    </main>
  )
}
