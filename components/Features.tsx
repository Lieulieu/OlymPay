"use client";

import { motion } from "framer-motion";
import {
  ShieldCheckIcon,
  BoltIcon,
  LinkIcon,
} from "@heroicons/react/24/outline";

const features = [
  {
    icon: ShieldCheckIcon,
    title: "Algorithmic Stability",
    description:
      "USD-pegged, backed by real-world assets on Base. Maintains price stability through advanced algorithmic mechanisms.",
  },
  {
    icon: BoltIcon,
    title: "Instant Settlement",
    description:
      "Solana-speed, sub-second finality, near-zero fees. Experience lightning-fast transactions with minimal costs.",
  },
  {
    icon: LinkIcon,
    title: "Cross-Chain Compatibility",
    description:
      "Seamless bridges between U2U Network, Solana and Base. Move assets effortlessly across different blockchain networks.",
  },
];

export default function Features() {
  return (
    <section className="py-20 bg-base-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold text-primary mb-6">
            Why Choose OlymPay?
          </h2>
          <p className="text-xl text-secondary max-w-3xl mx-auto">
            Built for the future of decentralized finance with cutting-edge
            technology and user-centric design.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              viewport={{ once: true }}
              className="card bg-base-200 shadow-xl hover:shadow-2xl transition-all duration-300"
            >
              <div className="card-body text-center p-8">
                <div className="mx-auto mb-4 p-4 bg-primary/10 rounded-full w-fit">
                  <feature.icon className="w-8 h-8 text-primary" />
                </div>
                <h3 className="card-title text-xl font-semibold text-primary mb-4 justify-center">
                  {feature.title}
                </h3>
                <p className="text-secondary leading-relaxed">
                  {feature.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
