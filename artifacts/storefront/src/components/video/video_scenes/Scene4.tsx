import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

export function Scene4() {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 200),
      setTimeout(() => setPhase(2), 800),
      setTimeout(() => setPhase(3), 1500),
    ];
    return () => timers.forEach(t => clearTimeout(t));
  }, []);

  return (
    <motion.div 
      className="absolute inset-0 flex items-center justify-center p-12 md:p-24 z-10"
      initial={{ opacity: 0, y: '20vh' }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: '-20vh', filter: 'blur(10px)' }}
      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
    >
      <div className="flex flex-col md:flex-row items-center w-full max-w-6xl gap-16">
        <motion.div 
          className="flex-1 w-full"
          initial={{ opacity: 0, rotateY: 30, x: -50 }}
          animate={phase >= 1 ? { opacity: 1, rotateY: 0, x: 0 } : { opacity: 0, rotateY: 30, x: -50 }}
          transition={{ duration: 1, ease: 'easeOut' }}
          style={{ perspective: 1000 }}
        >
          <img 
            src={`${import.meta.env.BASE_URL}images/storefront-ui.png`} 
            alt="Storefront UI" 
            className="w-full rounded-2xl shadow-[0_20px_60px_-15px_rgba(124,58,237,0.4)] border border-[#7C3AED]/20"
          />
        </motion.div>

        <div className="flex-1 flex flex-col gap-8">
          <motion.h2 
            className="text-4xl md:text-5xl font-bold text-white leading-tight"
            initial={{ opacity: 0, x: 40 }}
            animate={phase >= 2 ? { opacity: 1, x: 0 } : { opacity: 0, x: 40 }}
            transition={{ duration: 0.6 }}
          >
            Built for Nigeria.<br/>
            <span className="text-[#7C3AED]">Ready for everything.</span>
          </motion.h2>

          <motion.ul 
            className="text-white/70 text-xl space-y-4"
            initial={{ opacity: 0 }}
            animate={phase >= 3 ? { opacity: 1 } : { opacity: 0 }}
            transition={{ duration: 0.6 }}
          >
            {['Naira (NGN) Default', 'Pay on Delivery', 'Secure Stripe Checkouts', 'Real-time Cart'].map((item, i) => (
              <motion.li 
                key={i}
                className="flex items-center gap-3"
                initial={{ opacity: 0, x: 20 }}
                animate={phase >= 3 ? { opacity: 1, x: 0 } : { opacity: 0, x: 20 }}
                transition={{ delay: phase >= 3 ? i * 0.1 : 0 }}
              >
                <div className="w-2 h-2 rounded-full bg-[#7C3AED]" />
                {item}
              </motion.li>
            ))}
          </motion.ul>
        </div>
      </div>
    </motion.div>
  );
}
