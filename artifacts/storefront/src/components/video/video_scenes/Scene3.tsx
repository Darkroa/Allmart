import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

export function Scene3() {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 300),
      setTimeout(() => setPhase(2), 1200),
    ];
    return () => timers.forEach(t => clearTimeout(t));
  }, []);

  return (
    <motion.div 
      className="absolute inset-0 flex flex-col items-center justify-center p-12 z-10"
      initial={{ opacity: 0, scale: 1.2 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8, filter: 'blur(20px)' }}
      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
    >
      <motion.div 
        className="text-center mb-12"
        initial={{ opacity: 0, y: -40 }}
        animate={phase >= 1 ? { opacity: 1, y: 0 } : { opacity: 0, y: -40 }}
        transition={{ duration: 0.8, type: 'spring' }}
      >
        <h2 className="text-6xl md:text-[7vw] font-black text-white italic transform -skew-x-12 uppercase tracking-tighter">
          Flash <span className="text-[#FF6B00]">Sales</span>
        </h2>
        <p className="text-2xl text-white/70 mt-2">Unbeatable prices. Limited time.</p>
      </motion.div>

      <motion.div 
        className="flex gap-6 items-center"
        initial={{ opacity: 0, y: 40 }}
        animate={phase >= 2 ? { opacity: 1, y: 0 } : { opacity: 0, y: 40 }}
        transition={{ duration: 0.8, staggerChildren: 0.2 }}
      >
        {[
          { label: 'HOURS', val: '04' },
          { label: 'MINUTES', val: '29' },
          { label: 'SECONDS', val: '59' }
        ].map((time, i) => (
          <motion.div 
            key={i}
            className="flex flex-col items-center justify-center bg-[#1A1A24]/90 border border-[#FF6B00]/30 rounded-2xl w-32 h-32 md:w-40 md:h-40 shadow-[0_0_40px_rgba(255,107,0,0.2)]"
            initial={{ scale: 0 }}
            animate={phase >= 2 ? { scale: 1 } : { scale: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20, delay: phase >= 2 ? i * 0.1 : 0 }}
          >
            <span className="text-5xl md:text-7xl font-bold text-white">{time.val}</span>
            <span className="text-[#FF6B00] text-sm font-bold tracking-widest mt-2">{time.label}</span>
          </motion.div>
        ))}
      </motion.div>

    </motion.div>
  );
}
