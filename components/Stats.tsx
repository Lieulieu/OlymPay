'use client'

import { motion } from 'framer-motion'

const stats = [
  {
    title: 'Stable Price',
    value: '$1.00',
    description: 'USD-pegged stability',
  },
  {
    title: 'Uptime',
    value: '99.9%',
    description: 'Reliable infrastructure',
  },
  {
    title: 'Avg Fee on Solana',
    value: '0.001 SOL',
    description: 'Ultra-low transaction costs',
  },
  {
    title: 'Avg Fee on Base',
    value: '<$0.01',
    description: 'Gas-optimized payments',
  },
]

export default function Stats() {
  return (
    <section className="py-16 md:py-20 bg-primary">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6"
        >
          {stats.map((stat, index) => (
            <motion.div
              key={stat.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              viewport={{ once: true }}
              className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 md:p-8 text-center border border-white/20 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105"
            >
              <div className="text-primary-content/80 text-sm md:text-base font-medium mb-2">
                {stat.title}
              </div>
              <div className="text-primary-content text-2xl md:text-3xl lg:text-4xl font-bold mb-3">
                {stat.value}
              </div>
              <div className="text-primary-content/70 text-xs md:text-sm leading-relaxed">
                {stat.description}
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}
