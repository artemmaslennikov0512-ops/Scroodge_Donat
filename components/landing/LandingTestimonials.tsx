"use client";

import { motion } from "framer-motion";

export default function LandingTestimonials() {
  return (
    <section id="testimonials" className="py-16 sm:py-20 md:py-24 px-6">
      <div className="container mx-auto">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-3xl sm:text-4xl md:text-5xl font-bold text-center mb-4"
        >
          Доверие <span className="text-cyan-400">профессионалов</span>
        </motion.h2>
        <p className="text-center text-gray-400 mb-10 md:mb-12 max-w-2xl mx-auto">
          Что говорят топ-стримеры о нашей платформе
        </p>
        <div className="grid md:grid-cols-3 gap-6 md:gap-8">
          {[1, 2, 3].map((i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              whileHover={{ y: -6 }}
              className="panel-hud p-6"
            >
              <p className="text-gray-300 mb-4">
                &quot;Лучшая платформа для монетизации. Доход вырос на 40%!&quot;
              </p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-cyan-500/30 border border-cyan-500/50" />
                <div>
                  <p className="text-white font-bold">Streamer {i}</p>
                  <p className="text-xs text-gray-500">Twitch Partner</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
