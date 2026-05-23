import { createContext, useContext, useState, type ReactNode } from 'react';

interface SoundSettings {
  soundEnabled: boolean;
  setSoundEnabled: (enabled: boolean) => void;
  soundVolume: number;
  setSoundVolume: (volume: number) => void;
}

const SoundSettingsContext = createContext<SoundSettings>({
  soundEnabled: true,
  setSoundEnabled: () => {},
  soundVolume: 100,
  setSoundVolume: () => {},
});

export function SoundSettingsProvider({ children }: { children: ReactNode }) {
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [soundVolume, setSoundVolume] = useState(100);

  return (
    <SoundSettingsContext.Provider value={{ soundEnabled, setSoundEnabled, soundVolume, setSoundVolume }}>
      {children}
    </SoundSettingsContext.Provider>
  );
}

export function useSoundSettings() {
  return useContext(SoundSettingsContext);
}
