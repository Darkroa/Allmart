import { useState, useEffect } from 'react';

declare global {
  interface Window {
    startRecording?: () => void;
    stopRecording?: () => void;
  }
}

export function useVideoPlayer({ durations }: { durations: Record<string, number> }) {
  const [currentScene, setCurrentScene] = useState(0);

  useEffect(() => {
    const totalScenes = Object.keys(durations).length;
    const durationValues = Object.values(durations);
    let isMounted = true;

    const playSequence = async () => {
      if (window.startRecording) window.startRecording();

      for (let i = 0; i < totalScenes; i++) {
        if (!isMounted) return;
        setCurrentScene(i);
        await new Promise((r) => setTimeout(r, durationValues[i]));
      }

      if (window.stopRecording) window.stopRecording();

      // Loop
      while (isMounted) {
        for (let i = 0; i < totalScenes; i++) {
          if (!isMounted) return;
          setCurrentScene(i);
          await new Promise((r) => setTimeout(r, durationValues[i]));
        }
      }
    };

    playSequence();

    return () => {
      isMounted = false;
    };
  }, [durations]);

  return { currentScene };
}
