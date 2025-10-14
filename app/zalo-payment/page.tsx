'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { CreditCardIcon, ArrowPathIcon, CheckCircleIcon } from '@heroicons/react/24/outline'
import ZaloPaymentFormMock from '@/components/ZaloPaymentFormMock'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import { useWallet } from '@/contexts/WalletContext'

export default function ZaloPaymentPage() {
  const [activeTab, setActiveTab] = useState<'onramp' | 'offramp'>('onramp')
  const { connected, ovndBalance, publicKey } = useWallet()
  const [oVNDBalance, setOVNDBalance] = useState<number | null>(null)
  const [loadingBalance, setLoadingBalance] = useState(false)

  // Fetch oVND balance
  const fetchOVNDBalance = async () => {
    if (!publicKey) return
    
    setLoadingBalance(true)
    try {
      const response = await fetch('/api/wallet/balance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          walletAddress: publicKey.toString()
        }),
      })
      
      const data = await response.json()
      if (data.success && data.oVNDBalance !== undefined) {
        setOVNDBalance(data.oVNDBalance)
      }
    } catch (error) {
      console.error('Error fetching oVND balance:', error)
    } finally {
      setLoadingBalance(false)
    }
  }

  // Fetch balance when wallet connects
  useEffect(() => {
    if (connected && publicKey) {
      fetchOVNDBalance()
    }
  }, [connected, publicKey])

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
            Zalo Payment
          </h1>
          <p className="text-xl text-secondary max-w-3xl mx-auto">
            Thanh toán với thẻ nội địa Việt Nam thông qua Zalopay sandbox. Chuyển đổi VND sang stablecoin oVND giả lập trên U2U Network, Solana và Base networks.
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
              Nạp oVND (On-Ramp)
            </button>
            <button
              className={`tab ${activeTab === 'offramp' ? 'tab-active' : ''}`}
              onClick={() => setActiveTab('offramp')}
            >
              <ArrowPathIcon className="w-5 h-5 mr-2" />
              Rút oVND (Off-Ramp)
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
                  <h2 className="text-2xl font-bold text-primary">Nạp oVND với Thẻ Nội Địa</h2>
                </div>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Payment Form */}
                  <div>
                    <ZaloPaymentFormMock />
                  </div>
                  
                  {/* Info Panel */}
                  <div className="space-y-6">
                    {/* oVND Balance Display */}
                    <div className="alert bg-white border border-gray-200 shadow-sm">
                      <CheckCircleIcon className="w-6 h-6 text-blue-500" />
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="font-bold text-gray-800">Tổng số dư oVND </h3>
                          <button 
                            onClick={fetchOVNDBalance}
                            disabled={loadingBalance}
                            className="btn btn-sm btn-outline btn-primary"
                          >
                            {loadingBalance ? (
                              <span className="loading loading-spinner loading-xs"></span>
                            ) : (
                              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99" />
                              </svg>
                            )}
                            <span className="ml-1">Làm mới</span>
                          </button>
                        </div>
                        {loadingBalance ? (
                          <div className="flex items-center">
                            <span className="loading loading-spinner loading-sm mr-2"></span>
                            <span className="text-sm text-gray-600">Đang tải số dư oVND...</span>
                          </div>
                        ) : oVNDBalance !== null ? (
                          <div className="text-lg font-bold text-blue-600">
                            {(oVNDBalance / 1000000000).toLocaleString('vi-VN', { maximumFractionDigits: 6 })} oVND
                          </div>
                        ) : (
                          <div className="text-sm text-gray-500">
                            Không thể tải số dư oVND
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="alert alert-info">
                      <CheckCircleIcon className="w-6 h-6" />
                      <div>
                        <h3 className="font-bold">Xử lý Tức Thì</h3>
                        <div className="text-sm">oVND của bạn sẽ có sẵn ngay sau khi xác nhận thanh toán.</div>
                      </div>
                    </div>
                    
                    <div className="alert alert-success">
                      <CheckCircleIcon className="w-6 h-6" />
                      <div>
                        <h3 className="font-bold">Miễn Phí</h3>
                        <div className="text-sm">Không tính phí giao dịch cho dịch vụ Zalo Payment.</div>
                      </div>
                    </div>
                    
                    <div className="alert alert-warning">
                      <CheckCircleIcon className="w-6 h-6" />
                      <div>
                        <h3 className="font-bold">Mạng Hỗ Trợ</h3>
                        <div className="text-sm">Hỗ trợ mạng Solana và Base.</div>
                      </div>
                    </div>

                    <div className="alert alert-accent">
                      <CheckCircleIcon className="w-6 h-6" />
                      <div>
                        <h3 className="font-bold">Zalopay Sandbox</h3>
                        <div className="text-sm">Sử dụng môi trường sandbox của Zalopay để test thanh toán.</div>
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
                <h2 className="text-2xl font-bold text-primary mb-4">Off-Ramp Sắp Ra Mắt</h2>
                <p className="text-secondary mb-6">
                  Chúng tôi đang phát triển tính năng rút oVND để chuyển đổi về tiền pháp định.
                  Hãy đón chờ các cập nhật!
                </p>
                <div className="badge badge-primary badge-lg">Ra mắt Q1 2026</div>
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
          <h3 className="text-2xl font-bold text-primary text-center mb-8">Tại Sao Chọn OlymPay?</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="card bg-base-200 shadow-lg">
              <div className="card-body text-center">
                <div className="text-4xl mb-4">🔒</div>
                <h4 className="card-title justify-center">Bảo Mật</h4>
                <p className="text-sm text-secondary">Bảo mật cấp ngân hàng với tích hợp Zalopay</p>
              </div>
            </div>
            <div className="card bg-base-200 shadow-lg">
              <div className="card-body text-center">
                <div className="text-4xl mb-4">⚡</div>
                <h4 className="card-title justify-center">Nhanh Chóng</h4>
                <p className="text-sm text-secondary">Xử lý và thanh toán tức thì</p>
              </div>
            </div>
            <div className="card bg-base-200 shadow-lg">
              <div className="card-body text-center">
                <div className="text-4xl mb-4">🇻🇳</div>
                <h4 className="card-title justify-center">Việt Nam</h4>
                <p className="text-sm text-secondary">Hỗ trợ thanh toán nội địa Việt Nam</p>
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
