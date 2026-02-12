import { useCallback, useRef, useEffect } from 'react';

// Map of sound types to their file paths
const SOUNDS = {
  bet: '/sounds/bet.wav',
  spin: '/sounds/spin.wav',
  win: '/sounds/win.wav',
  lose: '/sounds/lose.wav',
};

export function useCasinoSounds() {
  const audioRefs = useRef<Record<string, HTMLAudioElement>>({});

  // Initialize audio objects
  useEffect(() => {
    Object.entries(SOUNDS).forEach(([key, path]) => {
      const audio = new Audio(path);
      audio.preload = 'auto';
      audioRefs.current[key] = audio;
    });

    return () => {
      // Cleanup if needed (pause all)
      Object.values(audioRefs.current).forEach(audio => {
        audio.pause();
        audio.currentTime = 0;
      });
    };
  }, []);

  const playSound = useCallback((key: keyof typeof SOUNDS, loop = false) => {
    const audio = audioRefs.current[key];
    if (audio) {
      audio.currentTime = 0;
      audio.loop = loop;
      audio.volume = 0.5; // Default volume 50%
      audio.play().catch(err => {
        // Ignore auto-play errors or missing file errors to prevent crashing
        console.warn(`Failed to play sound ${key}:`, err);
      });
    }
  }, []);

  const stopSound = useCallback((key: keyof typeof SOUNDS) => {
    const audio = audioRefs.current[key];
    if (audio) {
      audio.pause();
      audio.currentTime = 0;
    }
  }, []);

  return {
    playBet: () => playSound('bet'),
    playSpin: () => playSound('spin', true), // Loop while spinning
    stopSpin: () => stopSound('spin'),
    playWin: () => playSound('win'),
    playLose: () => playSound('lose'),
  };
}
