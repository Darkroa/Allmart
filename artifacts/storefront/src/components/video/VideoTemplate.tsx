import { motion, AnimatePresence } from 'framer-motion';
import { useVideoPlayer } from '@/lib/video/hooks';
import { Scene1 } from './video_scenes/Scene1';
import { Scene2 } from './video_scenes/Scene2';
import { Scene3 } from './video_scenes/Scene3';
import { Scene4 } from './video_scenes/Scene4';
import { Scene5 } from './video_scenes/Scene5';

const SCENE_DURATIONS = {
  intro: 4000,
  aiSearch: 4500,
  flashSale: 4000,
  storefront: 4500,
  outro: 4000
};

export default function VideoTemplate() {
  const { currentScene } = useVideoPlayer({ durations: SCENE_DURATIONS });

  return (
    <div className="relative w-full h-screen overflow-hidden bg-[#0B0A14] font-sans">
      {/* Background layer */}
      <div className="absolute inset-0 z-0">
        <motion.div 
          className="absolute inset-0 opacity-40 mix-blend-screen"
          style={{
            backgroundImage: `url(${import.meta.env.BASE_URL}images/bg-abstract.png)`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
          animate={{ scale: [1.1, 1.2, 1.1], rotate: [0, 2, 0] }}
          transition={{ duration: 20, repeat: Infinity, ease: 'easeInOut' }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#0B0A14]/80 to-[#0B0A14] z-1" />
        
        {/* Persistent abstract shapes */}
        <motion.div
          className="absolute w-[80vw] h-[80vw] max-w-[800px] max-h-[800px] rounded-full blur-[100px] bg-[#7C3AED]/20 z-0"
          animate={{
            x: ['-20%', '40%', '-10%'],
            y: ['-20%', '30%', '10%'],
            scale: [1, 1.5, 0.8]
          }}
          transition={{ duration: 15, repeat: Infinity, ease: 'easeInOut' }}
        />
      </div>

      <AnimatePresence mode="popLayout">
        {currentScene === 0 && <Scene1 key="intro" />}
        {currentScene === 1 && <Scene2 key="aiSearch" />}
        {currentScene === 2 && <Scene3 key="flashSale" />}
        {currentScene === 3 && <Scene4 key="storefront" />}
        {currentScene === 4 && <Scene5 key="outro" />}
      </AnimatePresence>
    </div>
  );
}
