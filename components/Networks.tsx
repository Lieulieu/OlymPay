'use client'

import { motion } from 'framer-motion'
import Image from 'next/image'

const networks = [
  {
    name: 'U2U Network',
    logo: '/u2u-logo.png',
    title: 'DePIN Infrastructure Network',
    description: 'Layer-1 blockchain designed for Decentralized Physical Infrastructure Networks (DePIN). Features modular architecture and multi-dimensional sharding for real-world applications.',
    features: ['DePIN Optimized', 'Modular Architecture', 'Multi-D Sharding', '60K+ Contributors'],
    buttonText: 'Explore U2U',
    buttonClass: 'btn-primary',
  },
  {
    name: 'Solana',
    logo: '/solana-sol-logo.png',
    title: 'High-Performance Blockchain',
    description: 'Proof-of-Stake blockchain with Proof of History consensus. Delivers fast transactions with low fees, supporting high-throughput dApps and DeFi applications.',
    features: ['~65,000 TPS', '<$0.001 fees', 'Proof of History', 'EVM Compatible'],
    buttonText: 'Explore Solana',
    buttonClass: 'btn-accent',
  },
  {
    name: 'Base',
    logo: '/base-logo.png',
    title: 'Coinbase Ethereum L2',
    description: 'Ethereum Layer-2 solution by Coinbase. Provides secure, low-cost environment for dApp development with full Ethereum compatibility and Coinbase integration.',
    features: ['Ethereum L2', 'Low gas fees', 'Coinbase backed', 'Developer friendly'],
    buttonText: 'Explore Base',
    buttonClass: 'btn-secondary',
  },
]

export default function Networks() {
  return (
    <section className="py-20 bg-base-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold text-primary mb-6">
            Powered by Leading Networks
          </h2>
          <p className="text-xl text-secondary max-w-3xl mx-auto">
            Built on the most advanced blockchain networks for maximum performance and security.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {networks.map((network, index) => (
            <motion.div
              key={network.name}
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.2 }}
              viewport={{ once: true }}
              className="card bg-base-100 shadow-xl hover:shadow-2xl transition-all duration-300"
            >
              <div className="card-body p-8">
                <div className="flex items-center mb-6">
                  <div className="w-16 h-16 mr-4 flex-shrink-0">
                    <Image
                      src={network.logo}
                      alt={`${network.name} logo`}
                      width={64}
                      height={64}
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <div>
                    <h3 className="card-title text-2xl font-bold text-primary mb-2">
                      {network.name}
                    </h3>
                    <p className="text-secondary font-medium">{network.title}</p>
                  </div>
                </div>
                
                <p className="text-secondary mb-6 leading-relaxed">
                  {network.description}
                </p>
                
                <div className="grid grid-cols-2 gap-2 mb-6">
                  {network.features.map((feature, featureIndex) => (
                    <div key={featureIndex} className="badge badge-outline badge-primary">
                      {feature}
                    </div>
                  ))}
                </div>
                
                <motion.button 
                  className={`btn ${network.buttonClass} btn-lg`}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                >
                  {network.buttonText}
                </motion.button>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
