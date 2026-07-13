import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

export function Scene2() {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 300),
      setTimeout(() => setPhase(2), 1000),
      setTimeout(() => setPhase(3), 1800),
      setTimeout(() => setPhase(4), 2800),
    ];
    return () => timers.forEach(t => clearTimeout(t));
  }, []);

  return (
    <motion.div 
      className="absolute inset-0 flex items-center p-12 md:p-24 z-10"
      initial={{ opacity: 0, x: '10vw' }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: '-10vw', filter: 'blur(10px)' }}
      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
    >
      <div className="flex flex-col md:flex-row w-full items-center justify-between gap-12">
        <div className="flex-1">
          <motion.h2 
            className="text-5xl md:text-[5vw] font-bold text-white leading-tight mb-6"
            initial={{ opacity: 0, y: 30 }}
            animate={phase >= 1 ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
            transition={{ duration: 0.6 }}
          >
            Find exactly what you want.<br/>
            <span className="text-[#7C3AED]">Instantly.</span>
          </motion.h2>

          <motion.div
            className="bg-[#1A1A24]/80 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-2xl"
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={phase >= 2 ? { opacity: 1, scale: 1, y: 0 } : { opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: 'spring', stiffness: 200, damping: 20 }}
          >
            <div className="flex items-center gap-4 text-white/50 text-lg">
              <span className="text-[#7C3AED] font-bold">AI</span>
              <span>"Show me affordable sneakers for running in Lagos"</span>
            </div>
          </motion.div>
        </div>

        <motion.div 
          className="flex-1 flex justify-center items-center relative h-[50vh]"
          initial={{ opacity: 0, scale: 0.5 }}
          animate={phase >= 3 ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.5 }}
          transition={{ type: 'spring', stiffness: 100, damping: 20 }}
        >
          <img 
            src={`${import.meta.env.BASE_URL}images/ai-orb.png`} 
            alt="AI Orb"
            className="w-[80%] max-w-[500px] object-contain"
          />
          {phase >= 4 && (
             <motion.div 
               className="absolute inset-0 rounded-full border border-[#7C3AED] opacity-50"
               initial={{ scale: 0.8, opacity: 0.8 }}
               animate={{ scale: 1.5, opacity: 0 }}
               transition={{ duration: 2, repeat: Infinity }}
             />
          )}
        </motion.div>
      </div>
    </motion.div>
  );
}
